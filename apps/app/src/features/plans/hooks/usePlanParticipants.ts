import React, { useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { normalizeStatus } from "../../../lib/participantStatus";
import { Plan, DbPlan, DbPlanParticipant, User } from "../../../core/types";
import { updateParticipantStatus, insertParticipant, deleteParticipant, syncUserStats } from "../../../lib/db";
import { cleanPlanId, isUuid as isUuidUtil, resolveUserUuid as resolveUserUuidUtil } from "../utils/planUtils";

export interface JoinOptions {
  forceStatus?: "going" | "waitlist";
  skipPayment?: boolean;
}

export interface UsePlanParticipantsProps {
  userId: string;
  dbUsers: User[];
  dbPlans: DbPlan[];
  plans: Plan[];
  dbPlanParticipants: DbPlanParticipant[];
  setDbPlanParticipants: React.Dispatch<React.SetStateAction<DbPlanParticipant[]>>;
  insertSystemMessage: (planUuid: string, content: string, actorUuid: string | null) => Promise<void>;
  refreshPlans: (targetTables?: string[]) => Promise<void>;
  unassignTeam: (planUuid: string, userUuid: string) => Promise<void>;
}

export function usePlanParticipants({
  userId,
  dbUsers,
  dbPlans,
  plans,
  dbPlanParticipants,
  setDbPlanParticipants,
  insertSystemMessage,
  refreshPlans,
  unassignTeam
}: UsePlanParticipantsProps) {

  const resolveUserUuid = useCallback((uId: string) => {
    return resolveUserUuidUtil(uId, dbUsers);
  }, [dbUsers]);

  const isUuid = useCallback((val: any) => isUuidUtil(val), []);

  const applyParticipantOptimisticUpdate = useCallback((
    planUuid: string,
    userUuid: string,
    updates: Partial<DbPlanParticipant>
  ) => {
    setDbPlanParticipants(prev => {
      const matchIndex = prev.findIndex(pp => pp.plan_id === planUuid && pp.user_id === userUuid);
      if (matchIndex > -1) {
        const updated = [...prev];
        updated[matchIndex] = { ...updated[matchIndex], ...updates };
        return updated;
      } else {
        const newRecord: DbPlanParticipant = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          participant_id: `PP_${Date.now()}`,
          plan_id: planUuid,
          user_id: userUuid,
          status: "delivered",
          payment_status: "unpaid",
          joined_at: new Date().toISOString(),
          waitlisted_at: null,
          removed_by_host: false,
          ...updates
        };
        return [...prev, newRecord];
      }
    });
  }, [setDbPlanParticipants]);

  const handleParticipantStatusChange = useCallback(async (
    planUuid: string,
    participantUserUuid: string,
    oldStatus: string | null | undefined,
    newStatus: string
  ) => {
    const matchedPlan = plans.find(p => p.id === planUuid || p.dbUuid === planUuid);
    const dbPlanObj = dbPlans.find(p => p.id === planUuid || p.plan_id === planUuid);
    const hostUuid = resolveUserUuid(matchedPlan?.hostId || dbPlanObj?.host_id || "");
    
    const participantUuid = resolveUserUuid(participantUserUuid);
    const normOld = oldStatus ? normalizeStatus(oldStatus) : null;
    const normNew = normalizeStatus(newStatus);

    if (planUuid && participantUuid) {
      const participantUser = dbUsers.find(u => u.id === participantUuid || u.user_id === participantUuid || (u as any).dbUuid === participantUuid);
      const participantName = participantUser?.full_name || "Someone";
      const planTitle = matchedPlan?.title || dbPlanObj?.title || "meetup";

      let notifRecord: any = null;
      const hostUuidStr = resolveUserUuid(hostUuid);
      const isHostNotification = hostUuidStr !== participantUuid;

      if (normOld !== "going" && normNew === "going" && isHostNotification) {
        notifRecord = {
          user_id: hostUuidStr,
          type: "PARTICIPANT_JOINED",
          title: `${participantName} joined "${planTitle}"`,
          body: `${participantName} is now attending.`,
          reference_id: planUuid,
          is_read: false,
          created_at: new Date().toISOString()
        };
      } else if (normOld !== "skipped" && normNew === "skipped") {
        notifRecord = {
          user_id: hostUuid,
          type: "PARTICIPANT_SKIPPED",
          title: `${participantName} skipped "${planTitle}"`,
          body: `${participantName} can no longer make it.`,
          reference_id: planUuid,
          is_read: false,
          created_at: new Date().toISOString()
        };
      }

      if (notifRecord) {
        console.log(`[handleParticipantStatusChange] Writing notification to DB:`, notifRecord);
        await fetch("/api/db/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "notifications", records: [notifRecord] })
        }).catch(err => console.error("[PlansContext handleParticipantStatusChange] Failed to save notification:", err));
      }

      // Phase 7: System message insertion on status changes
      if (normOld === "waitlist" && normNew === "going") {
        await insertSystemMessage(planUuid, `${participantName} moved from waitlist to confirmed`, participantUuid);
      } else if (normOld !== "going" && normOld !== "waitlist" && normNew === "going") {
        await insertSystemMessage(planUuid, `${participantName} joined the plan`, participantUuid);
      } else if (normOld !== "going" && normOld !== "waitlist" && normNew === "waitlist") {
        await insertSystemMessage(planUuid, `${participantName} joined the waitlist`, participantUuid);
      } else if ((normOld === "going" || normOld === "waitlist") && normNew === "skipped") {
        await insertSystemMessage(planUuid, `${participantName} left the plan`, participantUuid);
      }
    }
  }, [plans, dbPlans, dbUsers, resolveUserUuid, insertSystemMessage]);

  const promoteWaitlistIfSpotsAvailable = useCallback(async (planUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planUuid || p.dbUuid === planUuid);
    const dbPlanObj = dbPlans.find(p => p.id === planUuid || p.plan_id === planUuid);
    if (!matchedPlan || !dbPlanObj) {
      console.log(`[PlansContext promoteWaitlist] Plan not found for ${planUuid}`);
      return;
    }

    const limit = matchedPlan.joinLimit || matchedPlan.capacity || matchedPlan.maxSpots || 0;
    if (limit <= 0) {
      return;
    }

    try {
      const participantRes = await fetch(`/api/db/fetch-all?tables=plan_participants`);
      if (!participantRes.ok) {
        throw new Error("Failed to fetch fresh participants");
      }
      const pJson = await participantRes.json();
      const freshParticipants: DbPlanParticipant[] = pJson.data?.plan_participants || dbPlanParticipants;

      const planParticipants = freshParticipants.filter(
        pp => pp.plan_id === planUuid
      );

      const acceptedCount = planParticipants.filter(
        pp => pp.status === "going"
      ).length;

      const availableCapacity = limit - acceptedCount;
      console.log(`[PlansContext promoteWaitlist] limit=${limit}, acceptedCount=${acceptedCount}, availableCapacity=${availableCapacity}`);

      if (availableCapacity <= 0) {
        console.log(`[PlansContext promoteWaitlist] No spots available`);
        return;
      }

      const waitlisted = planParticipants
        .filter(pp => pp.status === "waitlist")
        .sort((a, b) => {
          const timeA = a.waitlisted_at ? new Date(a.waitlisted_at).getTime() : 0;
          const timeB = b.waitlisted_at ? new Date(b.waitlisted_at).getTime() : 0;
          return timeA - timeB;
        });

      if (waitlisted.length === 0) {
        console.log(`[PlansContext promoteWaitlist] No waitlisted users found`);
        return;
      }

      const countToPromote = Math.min(availableCapacity, waitlisted.length);
      const updates = [];
      for (let i = 0; i < countToPromote; i++) {
        const pToPromote = waitlisted[i];
        updates.push({
          id: pToPromote.id,
          status: "going",
          payment_status: "unpaid",
          joined_at: new Date().toISOString()
        });
      }

      if (updates.length > 0) {
        console.log(`[PlansContext promoteWaitlist] Promoting ${updates.length} users to 'going':`, updates);
        const ppRes = await fetch("/api/db/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "plan_participants", records: updates })
        });
        if (!ppRes.ok) {
          console.error("[PlansContext promoteWaitlist] Failed to upsert promoted participants");
        } else {
          // Send PARTICIPANT_JOINED notifications to host for each promoted participant
          for (const upd of updates) {
            const pToPromote = waitlisted.find(w => w.id === upd.id);
            if (pToPromote?.user_id) {
              await handleParticipantStatusChange(planUuid, pToPromote.user_id, "waitlist", "going");
            }
          }

          // Write WAITLIST_PROMOTED notifications to promoted users
          const promoNotifications = updates.map(upd => {
            const pToPromote = waitlisted.find(w => w.id === upd.id);
            return {
              user_id: pToPromote?.user_id,
              type: "WAITLIST_PROMOTED",
              title: `A spot opened up. You're now in for "${dbPlanObj.title}"`,
              body: "You have been promoted from the waitlist.",
              reference_id: planUuid,
              is_read: false,
              created_at: new Date().toISOString()
            };
          });

          await fetch("/api/db/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: "notifications", records: promoNotifications })
          }).catch(err => console.error("[PlansContext promoteWaitlist] Failed to save waitlist notifications:", err));
        }
      }
    } catch (err) {
      console.error(`[PlansContext promoteWaitlist] Failed:`, err);
    }
  }, [plans, dbPlans, dbPlanParticipants, handleParticipantStatusChange]);

  const joinPlan = useCallback(async (rawPlanId: string, userProfile: any, options?: JoinOptions) => {
    const planId = cleanPlanId(rawPlanId);
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = userProfile.dbUuid || resolveUserUuid(userProfile.user_id || userId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] Cannot join plan: user UUID is missing or invalid:`, userUuid);
      return;
    }

    // Logging: status before action
    const existingBefore = dbPlanParticipants.find(p => (p.plan_id === planUuid || p.plan_id === planId) && (p.user_id === userUuid || p.user_id === userProfile.user_id));
    console.log(`[PlansContext] JOIN ACTION START for Plan: ${matchedPlan?.title || planId}, User: ${userProfile.name}`);
    console.log(`[PlansContext] Participant status BEFORE action:`, existingBefore ? existingBefore.status : "none (not invited/joined)");

    const acceptedCount = dbPlanParticipants.filter(
      pp => (pp.plan_id === planUuid || pp.plan_id === planId) &&
            pp.status === "going"
    ).length;
    const limit = matchedPlan?.joinLimit || matchedPlan?.capacity || matchedPlan?.maxSpots || 0;
    const isWaitlistMode = !!(matchedPlan?.waitlistEnabled && limit > 0 && acceptedCount >= limit);

    console.log(`[PlansContext] joinPlan: acceptedCount=${acceptedCount}, limit=${limit}, isWaitlistMode=${isWaitlistMode}`);

    const hostUuid = matchedPlan?.hostId;
    const isHost = hostUuid === userUuid;

    // 2. Database Persistence
    if (planUuid && userUuid) {
      if (existingBefore && isHost) {
        console.log(`[PlansContext] User is host. Skipping database participant status overwrite.`);
        return;
      }

      const targetDbState = options?.forceStatus || (isWaitlistMode ? "waitlist" : "going");

      // Optimistic Update
      const optimisticRecord = existingBefore ? {
        ...existingBefore,
        status: targetDbState,
        payment_status: "unpaid" as const,
        joined_at: targetDbState === "going" ? new Date().toISOString() : existingBefore.joined_at,
        waitlisted_at: targetDbState === "waitlist" ? new Date().toISOString() : existingBefore.waitlisted_at,
        removed_by_host: false
      } : {
        status: targetDbState,
        payment_status: "unpaid" as const,
        joined_at: new Date().toISOString(),
        waitlisted_at: targetDbState === "waitlist" ? new Date().toISOString() : null,
        delivered_at: null,
        seen_at: null,
        skipped_at: null,
        removed_by_host: false
      };

      applyParticipantOptimisticUpdate(planUuid, userUuid, optimisticRecord);

      if (existingBefore && existingBefore.id) {
        const joinedAtVal = targetDbState === "going" ? new Date().toISOString() : undefined;
        const waitlistedAtVal = targetDbState === "going" ? null : (targetDbState === "waitlist" ? new Date().toISOString() : undefined);
        const payload = { id: existingBefore.id, status: targetDbState, payment_status: "unpaid" as const, joined_at: joinedAtVal, waitlisted_at: waitlistedAtVal };
        console.log("[WAITLIST WRITE] START", payload);
        try {
          const res = await updateParticipantStatus(existingBefore.id, targetDbState, payload.payment_status, joinedAtVal, waitlistedAtVal);
          if (res) {
            console.log("[WAITLIST WRITE] SUCCESS", res);
          } else {
            console.error("[WAITLIST WRITE] FAILED (returned null)");
          }
        } catch (err) {
          console.error("[WAITLIST WRITE] FAILED", err);
        }
      } else {
        const payload = {
          plan_id: planUuid,
          user_id: userUuid,
          status: targetDbState,
          payment_status: "unpaid" as const,
          joined_at: new Date().toISOString(),
          waitlisted_at: targetDbState === "waitlist" ? new Date().toISOString() : null
        };
        console.log("[WAITLIST WRITE] START", payload);
        try {
          const res = await insertParticipant(payload);
          if (res) {
            console.log("[WAITLIST WRITE] SUCCESS", res);
          } else {
            console.error("[WAITLIST WRITE] FAILED (returned null)");
          }
        } catch (err) {
          console.error("[WAITLIST WRITE] FAILED", err);
        }
      }
      await handleParticipantStatusChange(planUuid, userUuid, existingBefore?.status, targetDbState);
      await syncUserStats(userUuid, "join_plan");
      await promoteWaitlistIfSpotsAvailable(planUuid);
    }

    // 3. Sync state from DB (handled by realtime)

    // Logging: status after action
    const refSnapshot = await fetch("/api/db/fetch-all").then(r => r.json()).catch(() => null);
    const existingAfter = refSnapshot?.data?.plan_participants?.find((p: any) => p.plan_id === planUuid && p.user_id === userUuid);
    console.log(`[PlansContext] Participant status AFTER action & DB refresh:`, existingAfter ? existingAfter.status : "none");
  }, [plans, dbPlanParticipants, userId, resolveUserUuid, isUuid, handleParticipantStatusChange, promoteWaitlistIfSpotsAvailable, applyParticipantOptimisticUpdate]);

  const leavePlan = useCallback(async (rawPlanId: string, leaverId: string) => {
    const planId = cleanPlanId(rawPlanId);
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = resolveUserUuid(leaverId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] Cannot leave plan: user UUID is missing or invalid:`, userUuid);
      throw new Error("Invalid user UUID");
    }

    const existingBefore = dbPlanParticipants.find(p => (p.plan_id === planUuid || p.plan_id === planId) && (p.user_id === userUuid || p.user_id === leaverId));
    console.log(`[PlansContext] LEAVE ACTION START for Plan: ${matchedPlan?.title || planId}, User: ${leaverId}`);
    console.log(`[PlansContext] Participant status BEFORE action:`, existingBefore ? existingBefore.status : "none");

    // 2. Database Persistence - update status to 'skipped' instead of deleting
    if (existingBefore && existingBefore.id) {
      applyParticipantOptimisticUpdate(planUuid, userUuid, {
        status: "skipped",
        joined_at: null,
        waitlisted_at: null
      });
      try {
        await updateParticipantStatus(existingBefore.id, "skipped", existingBefore.payment_status as "paid" | "unpaid");
        console.log(`[leavePlan] Updated participant row ${existingBefore.id} status to 'skipped'`);
        await handleParticipantStatusChange(planUuid, userUuid, existingBefore.status, "skipped");
        // Clean up team assignment as they are no longer actively participating
        await unassignTeam(planUuid, userUuid);
        await promoteWaitlistIfSpotsAvailable(planUuid);
      } catch (err) {
        console.error(`[PlansContext] leavePlan DB write failed:`, err);
        throw err;
      }
    } else {
      throw new Error("Participant record not found");
    }

    // 3. Sync state from DB (handled by realtime)

    // Logging: status after action
    const refSnapshot = await fetch("/api/db/fetch-all").then(r => r.json()).catch(() => null);
    const existingAfter = refSnapshot?.data?.plan_participants?.find((p: any) => p.plan_id === planUuid && p.user_id === userUuid);
    console.log(`[PlansContext] Participant status AFTER action & DB refresh:`, existingAfter ? existingAfter.status : "none");
  }, [plans, resolveUserUuid, isUuid, dbPlanParticipants, handleParticipantStatusChange, unassignTeam, promoteWaitlistIfSpotsAvailable, applyParticipantOptimisticUpdate]);

  const skipPlan = useCallback(async (rawPlanId: string, userId: string) => {
    const planId = cleanPlanId(rawPlanId);
    console.log(`[DetailedPlanModal] SKIP_CLICKED: for Plan: ${planId}, User: ${userId}`);
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = resolveUserUuid(userId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] Cannot skip plan: user UUID is missing or invalid:`, userUuid);
      console.log(`[DetailedPlanModal] SKIP_DB_UPDATE_FAILED: invalid userUuid`);
      return;
    }

    const existingBefore = dbPlanParticipants.find(
      p => (p.plan_id === planUuid || p.plan_id === planId) && (p.user_id === userUuid || p.user_id === userId)
    );

    if (!existingBefore) {
      console.log(`[PlansContext] skipPlan: No participant record found for plan ${planId} / user ${userId}`);
      console.log(`[DetailedPlanModal] SKIP_DB_UPDATE_FAILED: participant record missing`);
      return;
    }

    const hostUuid = matchedPlan?.hostId;
    const isHost = hostUuid === userUuid;
    if (isHost) {
      console.log(`[PlansContext] User is host. Skip transition aborted.`);
      console.log(`[DetailedPlanModal] SKIP_DB_UPDATE_FAILED: user is host`);
      return;
    }

    const skippableStatuses = ["delivered", "seen", "waitlist", "new", "going"];
    if (!skippableStatuses.includes(existingBefore.status)) {
      console.log(`[PlansContext] skipPlan: Status is '${existingBefore.status}', which is not skippable. Aborting skip.`);
      console.log(`[DetailedPlanModal] SKIP_DB_UPDATE_FAILED: status is not skippable`);
      return;
    }

    console.log(`[PlansContext] SKIP ACTION START for Plan: ${matchedPlan?.title || planId}, User: ${userId}`);

    try {
      if (existingBefore.id) {
        applyParticipantOptimisticUpdate(planUuid, userUuid, {
          status: "skipped",
          joined_at: null,
          waitlisted_at: null
        });
        const result = await updateParticipantStatus(existingBefore.id, "skipped", existingBefore.payment_status as "paid" | "unpaid");
        if (result && normalizeStatus(result.status) === "skipped") {
          console.log(`[DetailedPlanModal] SKIP_DB_UPDATE_SUCCESS: status updated to skipped`);
          await handleParticipantStatusChange(planUuid, userUuid, existingBefore.status, "skipped");
          // Clean up team assignment as they are no longer actively participating
          await unassignTeam(planUuid, userUuid);
          await promoteWaitlistIfSpotsAvailable(planUuid);
        } else {
          throw new Error("Update returned invalid row or status wasn't skipped");
        }
      } else {
        throw new Error("Participant ID is missing");
      }

      console.log(`[DetailedPlanModal] SKIP_STATE_UPDATED: database updated successfully`);
    } catch (error) {
      console.error(`[PlansContext] skipPlan DB write failed:`, error);
      console.log(`[DetailedPlanModal] SKIP_DB_UPDATE_FAILED: database exception`);
      throw error;
    }
  }, [plans, resolveUserUuid, isUuid, dbPlanParticipants, handleParticipantStatusChange, unassignTeam, promoteWaitlistIfSpotsAvailable, applyParticipantOptimisticUpdate]);

  const rejoinPlan = useCallback(async (rawPlanId: string, userProfile: any) => {
    const planId = cleanPlanId(rawPlanId);
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = userProfile.dbUuid || resolveUserUuid(userProfile.user_id || userId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] Cannot rejoin plan: user UUID is missing or invalid:`, userUuid);
      return;
    }

    const existingBefore = dbPlanParticipants.find(
      p => (p.plan_id === planUuid || p.plan_id === planId) && (p.user_id === userUuid || p.user_id === userProfile.user_id)
    );

    if (!existingBefore) {
      console.log(`[PlansContext] rejoinPlan: No participant record found for plan ${planId}`);
      return;
    }

    const hostUuid = matchedPlan?.hostId;
    const isHost = hostUuid === userUuid;
    if (isHost) {
      console.log(`[PlansContext] User is host. Rejoin transition aborted.`);
      return;
    }

    if (existingBefore.status !== "skipped" && existingBefore.status !== "passed") {
      console.log(`[PlansContext] rejoinPlan: Status is '${existingBefore.status}', not 'skipped' or 'passed'. Aborting rejoin.`);
      return;
    }

    console.log(`[PlansContext] REJOIN ACTION START for Plan: ${matchedPlan?.title || planId}, User: ${userProfile.name}`);

    // Delegate core admission logic to joinPlan, skipping payment checkout
    await joinPlan(planId, userProfile, {
      skipPayment: true
    });
  }, [plans, userId, resolveUserUuid, isUuid, dbPlanParticipants, joinPlan]);

  const removeParticipant = useCallback(async (planId: string, participantUserUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const resolvedParticipantUuid = resolveUserUuid(participantUserUuid);

    const beforeRemovalParticipantCount = dbPlanParticipants.filter(pp => pp.plan_id === planUuid).length;
    console.log("REMOVE FLOW", {
      participantId: resolvedParticipantUuid,
      planId: planUuid,
      beforeRemovalParticipantCount,
    });

    if (!planUuid || !resolvedParticipantUuid) {
      console.error("[PlansContext removeParticipant] Missing plan UUID or participant UUID");
      return;
    }

    // host validation
    const dbPlanObj = dbPlans.find(p => p.id === planUuid || p.plan_id === planUuid);
    const hostUuid = resolveUserUuid(matchedPlan?.hostId || dbPlanObj?.host_id || "");
    const activeUserUuidResolved = resolveUserUuid(userId || "");

    const isHost = hostUuid === activeUserUuidResolved;

    if (!isHost) {
      console.error("[PlansContext removeParticipant] Unauthorized: Only the Plan Host can manage or remove participants.");
      throw new Error("Unauthorized: Only the Plan Host can manage or remove participants.");
    }

    if (resolvedParticipantUuid === hostUuid) {
      console.error("[PlansContext removeParticipant] Host cannot be removed.");
      throw new Error("Cannot remove the Plan Host.");
    }

    // 1. Pre-emptively clean up any team assignment before deleting participant
    try {
      await unassignTeam(planUuid, resolvedParticipantUuid);
    } catch (teamErr) {
      console.warn("[PlansContext removeParticipant] Team assignment cleanup warning (non-blocking):", teamErr);
    }

    // 2. Update participant record to 'removed' instead of deleting
    const existing = dbPlanParticipants.find(
      pp => pp.plan_id === planUuid && pp.user_id === resolvedParticipantUuid
    );
    if (!existing) {
      console.error("[PlansContext removeParticipant] Participant record not found for removal.");
      throw new Error("Failed to find participant record in DB.");
    }

    applyParticipantOptimisticUpdate(planUuid, resolvedParticipantUuid, {
      status: "removed",
      joined_at: null,
      waitlisted_at: null,
      removed_by_host: true
    });

    console.log(`[PlansContext removeParticipant] Marking participant status to 'removed' in Plan: ${planUuid}, User: ${resolvedParticipantUuid}`);
    const records = [{
      id: existing.id,
      plan_id: planUuid,
      user_id: resolvedParticipantUuid,
      status: "removed",
      payment_status: "unpaid",
      joined_at: null,
      waitlisted_at: null,
      removed_by_host: true
    }];
    const upsertRes = await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "plan_participants", records }),
    });
    if (!upsertRes.ok) {
      console.error("[PlansContext removeParticipant] Status update to 'removed' failed.");
      throw new Error("Failed to update participant status to 'removed' in DB.");
    }

    console.log("REMOVE FLOW - participant marked removed");

    // 2. Insert PARTICIPANT_REMOVED notification for the removed user
    const planTitle = matchedPlan?.title || dbPlanObj?.title || "meetup";
    const notifRecord = {
      user_id: resolvedParticipantUuid,
      type: "PARTICIPANT_REMOVED",
      title: `You were removed from "${planTitle}"`,
      body: "The host removed you from this plan.",
      reference_id: planUuid,
      is_read: false,
      created_at: new Date().toISOString()
    };

    console.log("[PlansContext removeParticipant] Writing PARTICIPANT_REMOVED notification to DB:", notifRecord);
    await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "notifications", records: [notifRecord] })
    }).catch(err => console.error("[PlansContext removeParticipant] Failed to save notification:", err));

    // Phase 7: System message for participant removal (Removed for silent operation)

    console.log("REMOVE FLOW - promoting waitlist");

    // 3. Promote waitlist if spots available
    await promoteWaitlistIfSpotsAvailable(planUuid);

    console.log("REMOVE FLOW - waitlist promotion success");
  }, [plans, dbPlans, userId, resolveUserUuid, dbPlanParticipants, deleteParticipant, dbUsers, insertSystemMessage, promoteWaitlistIfSpotsAvailable, unassignTeam, applyParticipantOptimisticUpdate]);

  const markPlanSeen = useCallback(async (rawPlanId: string, userId: string) => {
    const planId = cleanPlanId(rawPlanId);
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = resolveUserUuid(userId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] Cannot mark plan seen: user UUID is missing or invalid:`, userUuid);
      return;
    }

    const existingBefore = dbPlanParticipants.find(
      p => (p.plan_id === planUuid || p.plan_id === planId) && (p.user_id === userUuid || p.user_id === userId)
    );

    if (!existingBefore) {
      console.log(`[PlansContext] markPlanSeen: No participant record found for plan ${planId} / user ${userId}`);
      return;
    }

    if (existingBefore.status !== "delivered") {
      return;
    }

    console.log(`[PlansContext] MARK SEEN ACTION START for Plan: ${matchedPlan?.title || planId}, User: ${userId}`);

    if (existingBefore.id) {
      await updateParticipantStatus(existingBefore.id, "seen", existingBefore.payment_status as "paid" | "unpaid");
      console.log(`[PlansContext] markPlanSeen: Updated DB status of participant row ${existingBefore.id} to 'seen'`);
    }
  }, [plans, resolveUserUuid, isUuid, dbPlanParticipants]);
  const getAvailableCapacity = useCallback((planId: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    if (!planUuid) return { capacity: 0, goingCount: 0, availableSpots: 999 };

    const capacity = matchedPlan?.joinLimit || matchedPlan?.capacity || matchedPlan?.maxSpots || 0;
    const goingCount = dbPlanParticipants.filter(pp => 
      pp.plan_id === planUuid && normalizeStatus(pp.status) === "going"
    ).length;

    const availableSpots = capacity > 0 ? Math.max(0, capacity - goingCount) : 999;

    return { capacity, goingCount, availableSpots };
  }, [plans, dbPlanParticipants]);

  const addParticipantsToPlan = useCallback(async (
    planId: string,
    inviteeUuids: string[],
    userProfile: any,
    planTitle: string
  ) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;

    if (!planUuid || inviteeUuids.length === 0) return;

    const participantRecords: any[] = [];
    const inviteNotifications: any[] = [];

    inviteeUuids.forEach((inviteeUuid, idx) => {
      const existingRecord = dbPlanParticipants.find(
        pp => pp.plan_id === planUuid && pp.user_id === inviteeUuid
      );

      if (existingRecord) {
        // Reactivate / update
        applyParticipantOptimisticUpdate(planUuid, inviteeUuid, {
          status: "delivered",
          joined_at: new Date().toISOString(),
          waitlisted_at: null,
          removed_by_host: false
        });
        participantRecords.push({
          id: existingRecord.id,
          participant_id: existingRecord.participant_id,
          plan_id: planUuid,
          user_id: inviteeUuid,
          status: "delivered",
          payment_status: "unpaid",
          joined_at: null,
          waitlisted_at: null,
          seen_at: null,
          skipped_at: null,
          delivered_at: new Date().toISOString(),
        });
      } else {
        // Fresh insert
        applyParticipantOptimisticUpdate(planUuid, inviteeUuid, {
          status: "delivered",
          joined_at: new Date().toISOString(),
          waitlisted_at: null,
          removed_by_host: false
        });
        participantRecords.push({
          participant_id: `PP_${Date.now()}_invitee_${idx}_added`,
          plan_id: planUuid,
          user_id: inviteeUuid,
          status: "delivered",
          payment_status: "unpaid",
          joined_at: null,
          waitlisted_at: null,
        });
      }

      inviteNotifications.push({
        user_id: inviteeUuid,
        type: "PLAN_INVITATION",
        title: `${userProfile.name} invited you to join "${planTitle}"`,
        body: "Spontaneous meetup invitation",
        reference_id: planUuid,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });

    const partRes = await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "plan_participants", records: participantRecords }),
    });
    if (!partRes.ok) {
      const errData = await partRes.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || "Failed to add participants");
    }

    if (inviteNotifications.length > 0) {
      const notifRes = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "notifications", records: inviteNotifications }),
      });
      if (!notifRes.ok) {
        const errData = await notifRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Failed to write invitations");
      }
    }

    await refreshPlans();
  }, [plans, dbPlanParticipants, refreshPlans, getAvailableCapacity, applyParticipantOptimisticUpdate]);

  const promoteWaitlistParticipant = useCallback(async (planId: string, participantUserUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const resolvedUserUuid = resolveUserUuid(participantUserUuid);

    if (!planUuid || !resolvedUserUuid) {
      console.error("[usePlanParticipants promoteWaitlistParticipant] Missing plan UUID or user UUID");
      return;
    }

    // Strict Capacity Check
    const { capacity, availableSpots } = getAvailableCapacity(planUuid);
    if (capacity > 0 && availableSpots <= 0) {
      throw new Error("Max Attendees reached.\n\nIncrease the limit before promoting a waitlisted participant.");
    }

    const participantRecords: any[] = [];

    const targetPp = dbPlanParticipants.find(pp => pp.plan_id === planUuid && pp.user_id === resolvedUserUuid);
    if (!targetPp) {
      console.error("[usePlanParticipants promoteWaitlistParticipant] Participant not found");
      return;
    }

    applyParticipantOptimisticUpdate(planUuid, resolvedUserUuid, {
      status: "going",
      joined_at: new Date().toISOString(),
      waitlisted_at: null,
      removed_by_host: false
    });

    // Promote target
    participantRecords.push({
      id: targetPp.id,
      plan_id: planUuid,
      user_id: resolvedUserUuid,
      status: "going",
      joined_at: new Date().toISOString(),
      waitlisted_at: null
    });

    // Upsert to DB
    const res = await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "plan_participants", records: participantRecords })
    });
    if (!res.ok) {
      throw new Error("Failed to promote waitlisted participant");
    }

    // Write notification to the promoted user
    const promoteNotification = {
      user_id: resolvedUserUuid,
      type: "WAITLIST_PROMOTED",
      title: "You're In!",
      body: `You have been promoted to going for "${matchedPlan?.title || 'Meetup'}".`,
      reference_id: planUuid,
      is_read: false,
      created_at: new Date().toISOString()
    };
    await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "notifications", records: [promoteNotification] })
    }).catch(err => console.error("Failed to insert promotion notification:", err));

    await refreshPlans();
  }, [plans, dbPlanParticipants, resolveUserUuid, refreshPlans, getAvailableCapacity, applyParticipantOptimisticUpdate]);

  const rebalanceCapacity = useCallback(async (planId: string, newCapacity: number) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;

    if (!planUuid) return { promotedCount: 0, demotedCount: 0 };

    // Fetch fresh participants to avoid stale state
    const participantRes = await fetch(`/api/db/fetch-all?tables=plan_participants`);
    let freshParticipants: DbPlanParticipant[] = dbPlanParticipants;
    if (participantRes.ok) {
      const pJson = await participantRes.json();
      freshParticipants = pJson.data?.plan_participants || dbPlanParticipants;
    }

    const planParts = freshParticipants.filter(pp => pp.plan_id === planUuid);
    
    // Filter and sort going participants by joined_at ASC (oldest first)
    const going = planParts
      .filter(pp => normalizeStatus(pp.status) === "going")
      .sort((a, b) => {
        const timeA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
        const timeB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
        return timeA - timeB;
      });

    // Filter and sort waitlisted participants by waitlisted_at ASC (oldest first)
    const waitlist = planParts
      .filter(pp => normalizeStatus(pp.status) === "waitlist")
      .sort((a, b) => {
        const timeA = a.waitlisted_at ? new Date(a.waitlisted_at).getTime() : 0;
        const timeB = b.waitlisted_at ? new Date(b.waitlisted_at).getTime() : 0;
        return timeA - timeB;
      });

    const updatedParticipants: any[] = [];
    const capacityNotifications: any[] = [];
    let promotedCount = 0;
    let demotedCount = 0;

    const currentGoingCount = going.length;
    const waitlistedCount = waitlist.length;

    if (newCapacity > 0 && currentGoingCount > newCapacity) {
      // Capacity reduced: Demote the newest accepted non-host going participants (joined_at DESC)
      const planHostUuid = resolveUserUuid(matchedPlan?.hostId || matchedPlan?.creatorId || "");
      
      // Exclude host before sorting
      const eligibleForDemotion = going
        .filter(pp => pp.user_id !== planHostUuid)
        .reverse(); // Newest joined first

      const overflow = currentGoingCount - newCapacity;
      const demoted = eligibleForDemotion.slice(0, overflow);
      demotedCount = demoted.length;

      for (const pp of demoted) {
        applyParticipantOptimisticUpdate(planUuid, pp.user_id, {
          status: "waitlist",
          joined_at: null,
          waitlisted_at: new Date().toISOString(),
          removed_by_host: false
        });
        updatedParticipants.push({
          id: pp.id,
          plan_id: planUuid,
          user_id: pp.user_id,
          status: "waitlist",
          joined_at: null,
          waitlisted_at: new Date().toISOString()
        });

        capacityNotifications.push({
          user_id: pp.user_id,
          type: "PLAN_UPDATED",
          title: "This plan's capacity was reduced.",
          body: "You've been moved to the waitlist.",
          reference_id: planUuid,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } else if (newCapacity > 0 && currentGoingCount < newCapacity && waitlistedCount > 0) {
      // Capacity increased: Promote oldest waitlisted participants first (waitlisted_at ASC)
      const availableSlots = newCapacity - currentGoingCount;
      const promoted = waitlist.slice(0, availableSlots);
      promotedCount = promoted.length;

      for (const pp of promoted) {
        applyParticipantOptimisticUpdate(planUuid, pp.user_id, {
          status: "going",
          joined_at: new Date().toISOString(),
          waitlisted_at: null,
          removed_by_host: false
        });
        updatedParticipants.push({
          id: pp.id,
          plan_id: planUuid,
          user_id: pp.user_id,
          status: "going",
          joined_at: new Date().toISOString(),
          waitlisted_at: null
        });

        capacityNotifications.push({
          user_id: pp.user_id,
          type: "WAITLIST_PROMOTED",
          title: "You're In!",
          body: "A spot opened up and you've been moved from the waitlist.",
          reference_id: planUuid,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    if (updatedParticipants.length > 0) {
      const upsertRes = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plan_participants", records: updatedParticipants })
      });
      if (!upsertRes.ok) {
        console.error("[rebalanceCapacity] Failed to rebalance plan participants in database");
      }
    }

    if (capacityNotifications.length > 0) {
      await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "notifications", records: capacityNotifications })
      }).catch(err => console.error("[rebalanceCapacity] Failed to insert capacity notifications:", err));
    }

    await refreshPlans();

    return { promotedCount, demotedCount };
  }, [plans, dbPlanParticipants, resolveUserUuid, refreshPlans, applyParticipantOptimisticUpdate]);

  const moveParticipantToGoing = useCallback(async (planId: string, participantUserUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const resolvedUserUuid = resolveUserUuid(participantUserUuid);

    if (!planUuid || !resolvedUserUuid) {
      console.error("[usePlanParticipants moveParticipantToGoing] Missing plan UUID or user UUID");
      return;
    }

    const { capacity, availableSpots } = getAvailableCapacity(planUuid);
    if (capacity > 0 && availableSpots <= 0) {
      throw new Error("Max Attendees reached.\n\nIncrease the limit before moving someone into Going.");
    }

    const targetPp = dbPlanParticipants.find(pp => pp.plan_id === planUuid && pp.user_id === resolvedUserUuid);
    if (!targetPp) {
      throw new Error("Participant not found");
    }

    // Optimistic state update
    setDbPlanParticipants(prev => prev.map(pp => {
      if (pp.plan_id === planUuid && pp.user_id === resolvedUserUuid) {
        return {
          ...pp,
          status: "going",
          joined_at: new Date().toISOString(),
          waitlisted_at: null,
          removed_by_host: false
        };
      }
      return pp;
    }));

    try {
      const records = [{
        id: targetPp.id,
        plan_id: planUuid,
        user_id: resolvedUserUuid,
        status: "going",
        joined_at: new Date().toISOString(),
        waitlisted_at: null,
        removed_by_host: false
      }];

      const res = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plan_participants", records })
      });
      if (!res.ok) {
        throw new Error("Failed to update status to going");
      }
      await refreshPlans();
    } catch (err) {
      await refreshPlans(); // Rollback on failure
      throw err;
    }
  }, [plans, dbPlanParticipants, resolveUserUuid, getAvailableCapacity, refreshPlans, setDbPlanParticipants]);

  const moveParticipantToWaitlist = useCallback(async (planId: string, participantUserUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const resolvedUserUuid = resolveUserUuid(participantUserUuid);

    if (!planUuid || !resolvedUserUuid) {
      console.error("[usePlanParticipants moveParticipantToWaitlist] Missing plan UUID or user UUID");
      return;
    }

    const targetPp = dbPlanParticipants.find(pp => pp.plan_id === planUuid && pp.user_id === resolvedUserUuid);
    if (!targetPp) {
      throw new Error("Participant not found");
    }

    // Optimistic state update
    setDbPlanParticipants(prev => prev.map(pp => {
      if (pp.plan_id === planUuid && pp.user_id === resolvedUserUuid) {
        return {
          ...pp,
          status: "waitlist",
          waitlisted_at: new Date().toISOString(),
          joined_at: null,
          removed_by_host: false
        };
      }
      return pp;
    }));

    try {
      const records = [{
        id: targetPp.id,
        plan_id: planUuid,
        user_id: resolvedUserUuid,
        status: "waitlist",
        waitlisted_at: new Date().toISOString(),
        joined_at: null,
        removed_by_host: false
      }];

      const res = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plan_participants", records })
      });
      if (!res.ok) {
        throw new Error("Failed to update status to waitlist");
      }
      await refreshPlans();
    } catch (err) {
      await refreshPlans(); // Rollback on failure
      throw err;
    }
  }, [plans, dbPlanParticipants, resolveUserUuid, refreshPlans, setDbPlanParticipants]);

  const moveParticipantToInvited = useCallback(async (planId: string, participantUserUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const resolvedUserUuid = resolveUserUuid(participantUserUuid);

    if (!planUuid || !resolvedUserUuid) {
      console.error("[usePlanParticipants moveParticipantToInvited] Missing plan UUID or user UUID");
      return;
    }

    const targetPp = dbPlanParticipants.find(pp => pp.plan_id === planUuid && pp.user_id === resolvedUserUuid);
    if (!targetPp) {
      throw new Error("Participant not found");
    }

    if (!targetPp.removed_by_host) {
      throw new Error("This participant left the plan and must be invited again.");
    }

    // Optimistic state update
    setDbPlanParticipants(prev => prev.map(pp => {
      if (pp.plan_id === planUuid && pp.user_id === resolvedUserUuid) {
        return {
          ...pp,
          status: "delivered",
          joined_at: null,
          waitlisted_at: null,
          removed_by_host: false
        };
      }
      return pp;
    }));

    try {
      const records = [{
        id: targetPp.id,
        plan_id: planUuid,
        user_id: resolvedUserUuid,
        status: "delivered",
        joined_at: null,
        waitlisted_at: null,
        removed_by_host: false
      }];

      const res = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plan_participants", records })
      });
      if (!res.ok) {
        throw new Error("Failed to update status to invited");
      }
      await refreshPlans();
    } catch (err) {
      await refreshPlans(); // Rollback on failure
      throw err;
    }
  }, [plans, dbPlanParticipants, resolveUserUuid, refreshPlans, setDbPlanParticipants]);

  const moveParticipantToRemoved = useCallback(async (planId: string, participantUserUuid: string) => {
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const resolvedUserUuid = resolveUserUuid(participantUserUuid);

    if (!planUuid || !resolvedUserUuid) {
      console.error("[usePlanParticipants moveParticipantToRemoved] Missing plan UUID or user UUID");
      return;
    }

    try {
      await unassignTeam(planUuid, resolvedUserUuid);
    } catch (err) {
      console.warn("Non-blocking team assignment cleanup error during removal:", err);
    }

    const targetPp = dbPlanParticipants.find(pp => pp.plan_id === planUuid && pp.user_id === resolvedUserUuid);
    if (!targetPp) {
      throw new Error("Participant not found");
    }

    // Optimistic state update
    setDbPlanParticipants(prev => prev.map(pp => {
      if (pp.plan_id === planUuid && pp.user_id === resolvedUserUuid) {
        return {
          ...pp,
          status: "removed",
          joined_at: null,
          waitlisted_at: null,
          removed_by_host: true
        };
      }
      return pp;
    }));

    try {
      const records = [{
        id: targetPp.id,
        plan_id: planUuid,
        user_id: resolvedUserUuid,
        status: "removed",
        joined_at: null,
        waitlisted_at: null,
        removed_by_host: true
      }];

      const res = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plan_participants", records })
      });
      if (!res.ok) {
        throw new Error("Failed to update status to removed");
      }
      await refreshPlans();
    } catch (err) {
      await refreshPlans(); // Rollback on failure
      throw err;
    }
  }, [plans, dbPlanParticipants, resolveUserUuid, refreshPlans, unassignTeam, setDbPlanParticipants]);

  return {
    joinPlan,
    leavePlan,
    skipPlan,
    rejoinPlan,
    removeParticipant,
    markPlanSeen,
    promoteWaitlistIfSpotsAvailable,
    handleParticipantStatusChange,
    addParticipantsToPlan,
    promoteWaitlistParticipant,
    rebalanceCapacity,
    getAvailableCapacity,
    moveParticipantToGoing,
    moveParticipantToWaitlist,
    moveParticipantToInvited,
    moveParticipantToRemoved
  };
}
