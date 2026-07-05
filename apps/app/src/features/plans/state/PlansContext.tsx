import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";
import { Plan, PlanMember, DbPlan, DbPlanParticipant, DbPlanOutcome, User, DbMemory, DbMemoryResult } from "../../../core/types";
import { DbPlanTeamAssignment } from "../../../lib/db";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { usePlanTeams } from "../hooks/usePlanTeams";
import { usePlanParticipants } from "../hooks/usePlanParticipants";
import { usePlanLifecycle } from "../hooks/usePlanLifecycle";
import { usePlanOutcomes } from "../hooks/usePlanOutcomes";
import { insertParticipant, updateParticipantStatus, insertPlanReminder, removePlanTeamAssignment, deleteAllPlanTeamAssignments, syncUserStats } from "../../../lib/db";
import { mapPlansToLegacyPlans } from "../../../lib/mappers";
import { calculateParticipantBreakdown, normalizeStatus } from "../../../lib/participantStatus";
import { supabase } from "../../../lib/supabaseClient";
import { cleanPlanId, isUuid, resolveUserUuid as resolveUserUuidUtil } from "../utils/planUtils";
import { getTimelineSectionValue, getDayIndexValue, parseTimeToMinutes } from "../utils/planFeedUtils";
import { recalculateWalletExpenses } from "../../wallet/services/walletSyncService";


interface ParticipantCounts {
  host: number;
  going: number;
  waitlist: number;
  delivered: number;
  seen: number;
  skipped: number;
  passed: number;
  pending: number;  // delivered + seen (invited but not yet responded)
  total: number;
}

export interface JoinOptions {
  forceStatus?: "going" | "waitlist";
  skipPayment?: boolean;
}

interface PlansContextType {
  plans: Plan[];
  dbPlans: DbPlan[];
  setDbPlans: React.Dispatch<React.SetStateAction<DbPlan[]>>;
  dbPlanParticipants: DbPlanParticipant[];
  setDbPlanParticipants: React.Dispatch<React.SetStateAction<DbPlanParticipant[]>>;
  dbPlanOutcomes: DbPlanOutcome[];
  setDbPlanOutcomes: React.Dispatch<React.SetStateAction<DbPlanOutcome[]>>;
  dbMemories: DbMemory[];
  setDbMemories: React.Dispatch<React.SetStateAction<DbMemory[]>>;
  dbMemoryResults: DbMemoryResult[];
  setDbMemoryResults: React.Dispatch<React.SetStateAction<DbMemoryResult[]>>;
  joinPlan: (planId: string, userProfile: any, options?: JoinOptions) => Promise<void>;
  leavePlan: (planId: string, leaverId: string) => Promise<void>;
  passPlan: (planId: string, passerId: string) => Promise<void>;
  waitlistPlan: (planId: string, userProfile: any) => Promise<void>;
  sendReminder: (planId: string, userId: string) => void;
  ignoreReminder: (planId: string, ignoreUserId: string) => void;
  getHomeFeedPlans: (userId: string) => Plan[];
  getHubPlans: (userId: string) => Plan[];
  getParticipantCounts: (planId: string) => ParticipantCounts;
  refreshPlans: (targetTables?: string[]) => Promise<void>;
  markPlanSeen: (planId: string, userId: string) => Promise<void>;
  skipPlan: (planId: string, userId: string) => Promise<void>;
  rejoinPlan: (planId: string, userProfile: any) => Promise<void>;
  // New acceptance / payment / booking actions
  acceptPlan: (planId: string, userProfile: any) => Promise<void>;
  declinePlan: (planId: string, userProfile: any) => Promise<void>;
  hostPay: (planId: string, hostProfile: any) => Promise<boolean>;
  bookNow: (planId: string, hostProfile: any) => Promise<{ success: boolean; status?: string; error?: string }>;
  changePlanHost: (planId: string, newHostUuid: string, oldHostUuid: string) => Promise<void>;
  cancelPlan: (planId: string) => Promise<void>;
  updatePlanDetails: (planId: string, updates: Partial<DbPlan>) => Promise<any>;
  completePlan: (planId: string) => Promise<void>;
  submitReview: (memoryId: string, category: 'movie' | 'dining', rating: number, review: string | null, userUuid: string, existingId?: string) => Promise<void>;
  submitStats: (memoryId: string, category: 'football' | 'badminton', stats: { scoreA?: number; scoreB?: number; wins?: number; losses?: number }, userUuid: string) => Promise<void>;
  submitMvp: (memoryId: string, voterUuid: string, mvpUuid: string) => Promise<void>;
  createPlan: (
    newDbPlan: any,
    selectedCircles: string[],
    selectedFriends: any[],
    userProfile: any,
    titleToUse: string
  ) => Promise<{ dbPlanRow: any; dbPartRow: any; inviteeUuids: string[]; hostJoinedAt: string }>;
  dbPlanTeamAssignments: DbPlanTeamAssignment[];
  setDbPlanTeamAssignments: React.Dispatch<React.SetStateAction<DbPlanTeamAssignment[]>>;
  getTeamAssignments: (planUuid: string) => Promise<DbPlanTeamAssignment[]>;
  assignTeam: (planUuid: string, userUuid: string, team: "A" | "B") => Promise<void>;
  unassignTeam: (planUuid: string, userUuid: string) => Promise<void>;
  removeParticipant: (planId: string, participantUserUuid: string) => Promise<void>;
  promoteWaitlistParticipant: (planId: string, participantUserUuid: string) => Promise<void>;
  rebalanceCapacity: (planId: string, newCapacity: number) => Promise<{ promotedCount: number; demotedCount: number }>;
  getAvailableCapacity: (planId: string) => { capacity: number; goingCount: number; availableSpots: number };
  addParticipantsToPlan: (
    planId: string,
    inviteeUuids: string[],
    userProfile: any,
    planTitle: string
  ) => Promise<void>;
  moveParticipantToGoing: (planId: string, participantUserUuid: string) => Promise<void>;
  moveParticipantToWaitlist: (planId: string, participantUserUuid: string) => Promise<void>;
  moveParticipantToInvited: (planId: string, participantUserUuid: string) => Promise<void>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([]);
  const [dbPlanParticipants, setDbPlanParticipants] = useState<DbPlanParticipant[]>([]);
  const [dbPlanOutcomes, setDbPlanOutcomes] = useState<DbPlanOutcome[]>([]);
  const [dbMemories, setDbMemories] = useState<DbMemory[]>([]);
  const [dbMemoryResults, setDbMemoryResults] = useState<DbMemoryResult[]>([]);

  const { activeUserId: userId, dbUsers, setDbUsers } = useProfileStore();
  const { dbCircles, dbCircleMembers } = useCirclesStore();

  const dbPlansRef = React.useRef(dbPlans);
  dbPlansRef.current = dbPlans;
  const dbPlanParticipantsRef = React.useRef(dbPlanParticipants);
  dbPlanParticipantsRef.current = dbPlanParticipants;
  const dbUsersRef = React.useRef(dbUsers);
  dbUsersRef.current = dbUsers;
  const dbCirclesRef = React.useRef(dbCircles);
  dbCirclesRef.current = dbCircles;
  const dbCircleMembersRef = React.useRef(dbCircleMembers);
  dbCircleMembersRef.current = dbCircleMembers;

  const resolveUserUuid = (uId: string) => resolveUserUuidUtil(uId, dbUsers);

  const refreshPlans = useCallback(async (targetTables?: string[]) => {
    try {
      const url = targetTables ? `/api/db/fetch-all?tables=${targetTables.join(",")}` : "/api/db/fetch-all";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.configured && (!json.tables_missing || targetTables)) {
          const d = json.data || {};
          if (d.users !== undefined) setDbUsers(d.users);
          if (d.plans !== undefined) setDbPlans(d.plans);
          if (d.plan_participants !== undefined) setDbPlanParticipants(d.plan_participants);
          if (d.plan_outcomes !== undefined) setDbPlanOutcomes(d.plan_outcomes);
          if (d.memories !== undefined) setDbMemories(d.memories);
          if (d.memory_results !== undefined) setDbMemoryResults(d.memory_results);
          if (d.plan_team_assignments !== undefined) setDbPlanTeamAssignments(d.plan_team_assignments);

          console.log(`[PlansContext refreshPlans] Successfully refreshed plans state (targeted: ${targetTables?.join(",") || "all"}).`);
        }
      }
    } catch (err) {
      console.error("[PlansContext refreshPlans] Failed to fetch updated state:", err);
    }
  }, [setDbUsers]);

  // Recovery from backgrounding, sleep, or network offline transitions
  const lastRecoveryRef = React.useRef<number>(0);
  useEffect(() => {
    const triggerRecovery = () => {
      const now = Date.now();
      if (now - lastRecoveryRef.current < 10000) {
        console.log("[PlansContext Recovery] Debounced duplicate recovery event.");
        return;
      }
      lastRecoveryRef.current = now;
      console.log("[PlansContext Recovery] App active/online. Running reconciliation fetch...");
      refreshPlans(["plans", "plan_participants", "plan_team_assignments"]);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRecovery();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", triggerRecovery);
    window.addEventListener("online", triggerRecovery);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", triggerRecovery);
      window.removeEventListener("online", triggerRecovery);
    };
  }, [refreshPlans]);

  // Realtime subscription
  useEffect(() => {
    console.log("[PlansContext Realtime] Setting up plans and participants subscriptions...");
    const lastStatusRef = { current: "" };

    const channel = supabase.channel("plans-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans" },
        (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const planId = newRec.id || newRec.plan_id;

            setDbPlans(prev => {
              const matchIndex = prev.findIndex(p => p.id === planId || p.plan_id === planId);
              if (matchIndex > -1) {
                const updated = [...prev];
                updated[matchIndex] = newRec;
                return updated;
              } else {
                return [...prev, newRec];
              }
            });
          } else if (eventType === "DELETE") {
            const planId = oldRec.id || oldRec.plan_id;
            const exists = dbPlansRef.current.some(p => p.id === planId || p.plan_id === planId);
            if (!exists) return;

            setDbPlans(prev => {
              return prev.filter(p => p.id !== planId && p.plan_id !== planId);
            });
          }
          refreshPlans(["plans", "plan_participants", "plan_team_assignments"]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plan_participants" },
        (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const planId = newRec.plan_id;
            const userIdVal = newRec.user_id;

            setDbPlanParticipants(prev => {
              const matchIndex = prev.findIndex(pp => pp.plan_id === planId && pp.user_id === userIdVal);
              if (matchIndex > -1) {
                const updated = [...prev];
                updated[matchIndex] = newRec;
                return updated;
              } else {
                return [...prev, newRec];
              }
            });
          } else if (eventType === "DELETE") {
            const planId = oldRec.plan_id;
            const userIdVal = oldRec.user_id;

            const planExists = dbPlansRef.current.some(p => p.id === planId || p.plan_id === planId);
            if (!planExists) return;

            setDbPlanParticipants(prev => {
              return prev.filter(pp => !(pp.plan_id === planId && pp.user_id === userIdVal));
            });
          }
          refreshPlans(["plans", "plan_participants", "plan_team_assignments"]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plan_team_assignments" },
        (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const planId = newRec.plan_id;
            const userIdVal = newRec.user_id;

            setDbPlanTeamAssignments(prev => {
              const matchIndex = prev.findIndex(a => a.plan_id === planId && a.user_id === userIdVal);
              if (matchIndex > -1) {
                const updated = [...prev];
                updated[matchIndex] = newRec;
                return updated;
              } else {
                return [...prev, newRec];
              }
            });
          } else if (eventType === "DELETE") {
            const planId = oldRec.plan_id;
            const userIdVal = oldRec.user_id;

            const planExists = dbPlansRef.current.some(p => p.id === planId || p.plan_id === planId);
            if (!planExists) return;

            setDbPlanTeamAssignments(prev => {
              return prev.filter(a => !(a.plan_id === planId && a.user_id === userIdVal));
            });
          }
          refreshPlans(["plans", "plan_participants", "plan_team_assignments"]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plan_outcomes" },
        (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const outcomeId = newRec.id;

            setDbPlanOutcomes(prev => {
              const matchIndex = prev.findIndex(outcome => outcome.id === outcomeId);
              if (matchIndex > -1) {
                const updated = [...prev];
                updated[matchIndex] = newRec;
                return updated;
              } else {
                return [...prev, newRec];
              }
            });
          } else if (eventType === "DELETE") {
            const outcomeId = oldRec.id;

            setDbPlanOutcomes(prev => {
              return prev.filter(outcome => outcome.id !== outcomeId);
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memories" },
        (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const memoryId = newRec.id;

            setDbMemories(prev => {
              const matchIndex = prev.findIndex(m => m.id === memoryId);
              if (matchIndex > -1) {
                const updated = [...prev];
                updated[matchIndex] = newRec;
                return updated;
              } else {
                return [...prev, newRec];
              }
            });
          } else if (eventType === "DELETE") {
            const memoryId = oldRec.id;

            setDbMemories(prev => {
              return prev.filter(m => m.id !== memoryId);
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memory_results" },
        (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const resultId = newRec.id;

            setDbMemoryResults(prev => {
              const matchIndex = prev.findIndex(r => r.id === resultId);
              if (matchIndex > -1) {
                const updated = [...prev];
                updated[matchIndex] = newRec;
                return updated;
              } else {
                return [...prev, newRec];
              }
            });
          } else if (eventType === "DELETE") {
            const resultId = oldRec.id;

            setDbMemoryResults(prev => {
              return prev.filter(r => r.id !== resultId);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[PlansContext Realtime] Subscription status change:", status);
        const prevStatus = lastStatusRef.current;
        lastStatusRef.current = status;

        if (status === "SUBSCRIBED") {
          if (prevStatus && prevStatus !== "SUBSCRIBED") {
            console.log("[Realtime] Recovered");
            refreshPlans(["plans", "plan_participants", "plan_team_assignments", "plan_outcomes", "memories", "memory_results"]);
          } else {
            console.log("[Realtime] Connected");
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.log("[Realtime] Reconnecting");
        }
      });

    return () => {
      console.log("[PlansContext Realtime] Cleaning up subscriptions...");
      channel.unsubscribe();
    };
  }, [refreshPlans]);

  // Consolidated Derived plans mapping pipeline — pure projection, no effect needed
  const plans = useMemo(
    () => mapPlansToLegacyPlans(dbPlans, dbPlanParticipants, dbUsers, userId, dbCircles),
    [dbPlans, dbPlanParticipants, dbUsers, userId, dbCircles]
  );

  const insertSystemMessage = async (planUuid: string, content: string, actorUuid: string | null) => {
    // circle_messages is deprecated in V2, and chat_messages does not store system messages.
    console.log(`[PlansContext] System message skipped (V2): "${content}"`);
    return;
  };

  const {
    dbPlanTeamAssignments,
    setDbPlanTeamAssignments,
    getTeamAssignments,
    assignTeam,
    unassignTeam
  } = usePlanTeams({ dbUsers, insertSystemMessage });

  const {
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
    moveParticipantToInvited
  } = usePlanParticipants({
    userId,
    dbUsers,
    dbPlans,
    plans,
    dbPlanParticipants,
    setDbPlanParticipants,
    insertSystemMessage,
    refreshPlans,
    unassignTeam
  });
  const waitlistPlan = async (rawPlanId: string, userProfile: any) => {
    const planId = cleanPlanId(rawPlanId);
    return joinPlan(planId, userProfile, {
      forceStatus: "waitlist",
      skipPayment: true
    });
  };

  const passPlan = async (planId: string, passerId: string) => {
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = resolveUserUuid(passerId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] Cannot pass plan: user UUID is missing or invalid:`, userUuid);
      return;
    }    const existingBefore = dbPlanParticipants.find(p => p.plan_id === planUuid && p.user_id === userUuid);
    console.log(`[PlansContext] PASS ACTION START for Plan: ${matchedPlan?.title || planId}, User: ${passerId}`);
    console.log(`[PlansContext] Participant status BEFORE action:`, existingBefore ? existingBefore.rsvp_status : "none");

    // 2. Database Persistence
    if (planUuid && userUuid) {
      if (existingBefore) {
        await updateParticipantStatus(planUuid, userUuid, "SKIPPED", undefined, new Date().toISOString(), "LEFT");
        // Clean up team assignment as they are no longer actively participating
        await removePlanTeamAssignment(planUuid, userUuid);
        setDbPlanTeamAssignments(prev => prev.filter(a => !(a.plan_id === planUuid && a.user_id === userUuid)));
        await promoteWaitlistIfSpotsAvailable(planUuid);
      } else {
        await insertParticipant({
          plan_id: planUuid,
          user_id: userUuid,
          role: "PARTICIPANT",
          rsvp_status: "SKIPPED",
          responded_at: new Date().toISOString(),
          skip_reason: "LEFT"
        });
        // Clean up team assignment as they are no longer actively participating
        await removePlanTeamAssignment(planUuid, userUuid);
        setDbPlanTeamAssignments(prev => prev.filter(a => !(a.plan_id === planUuid && a.user_id === userUuid)));
        await promoteWaitlistIfSpotsAvailable(planUuid);
      }  }
    

    // 3. Sync state from DB (handled by realtime)
  };



  // ─── Plan Lifecycle ──────────────────────────────────────────────────────────
  // (changePlanHost, cancelPlan, updatePlanDetails, completePlan extracted to usePlanLifecycle)


  // ─── Wire lifecycle hook ────────────────────────────────────────────────────
  const lifecycle = usePlanLifecycle({
    plans,
    dbPlans,
    dbPlanParticipants,
    dbPlanOutcomes,
    dbCircles,
    dbCircleMembers,
    dbUsers,
    userId,
    setDbPlanTeamAssignments,
    refreshPlans,
    insertSystemMessage,
    promoteWaitlistIfSpotsAvailable,
    rebalanceCapacity,
  });

  // Reminder System
  const sendReminder = (planId: string, targetUserId: string) => {
    // Database Persistence — state update is handled by next refresh
    const matchedPlan = plans.find(p => p.id === planId);
    const planUuid = matchedPlan?.dbUuid;
    const senderUuid = resolveUserUuid(userId);

    if (planUuid && senderUuid) {
      insertPlanReminder({
        plan_id: planUuid,
        sent_by: senderUuid
      });
    }
  };

  const ignoreReminder = (planId: string, ignoreUserId: string) => {
    passPlan(planId, ignoreUserId);
  };

  // ─── Accept Plan ──────────────────────────────────────────────────────────
  // Participant accepts the plan invitation. After all non-host participants
  // accept, the plan's acceptance_status transitions to "confirmed" so the
  // host sees a Pay Now button.
  const acceptPlan = async (rawPlanId: string, userProfile: any) => {
    const planId = cleanPlanId(rawPlanId);
    const matchedPlan = plans.find((p) => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = userProfile.dbUuid || resolveUserUuid(userProfile.user_id || userId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] acceptPlan: invalid UUID`, userUuid);
      return;
    }

    // 1. Resolve capacity decision
    const acceptedCount = dbPlanParticipants.filter(
      pp => (pp.plan_id === planUuid || pp.plan_id === planId) &&
            pp.rsvp_status === "JOINED"
    ).length;
    const limit = matchedPlan?.capacity || matchedPlan?.joinLimit || matchedPlan?.maxSpots || 0;
    const targetDbState = (limit > 0 && acceptedCount >= limit) ? "WAITLISTED" : "JOINED";

    const existing = dbPlanParticipants.find(
      (p) => (p.plan_id === planUuid || p.plan_id === planId) && p.user_id === userUuid
    );

    if (existing) {
      await updateParticipantStatus(
        planUuid,
        userUuid,
        targetDbState as any, 
        undefined,
        new Date().toISOString(),
        null
      );
    } else {
      await insertParticipant({
        plan_id: planUuid,
        user_id: userUuid,
        role: "PARTICIPANT",
        rsvp_status: targetDbState as any,
        responded_at: new Date().toISOString(),
        skip_reason: null
      });
    }
    await handleParticipantStatusChange(planUuid, userUuid, existing?.rsvp_status, targetDbState);

    console.log(`[acceptPlan] User ${userUuid} joined plan ${planUuid} with status ${targetDbState}`);

    // 2. Check if all non-host participants have accepted (state updated via realtime)
    const freshRes = await fetch("/api/db/fetch-all?tables=plan_participants");
    const freshJson = await freshRes.json();
    const freshParticipants = freshJson?.data?.plan_participants || [];
    const planParticipants = freshParticipants.filter(
      (pp: any) => pp.plan_id === planUuid
    );
    const dbPlanObj = dbPlans.find(dp => dp.id === planUuid || dp.plan_id === planId);
    const hostUuid = matchedPlan?.hostId || dbPlanObj?.host_id;
    const nonHostParticipants = planParticipants.filter(
      (pp: any) => pp.user_id !== hostUuid
    );
    const allAccepted =
      nonHostParticipants.length > 0 &&
      nonHostParticipants.every((pp: any) => {
        const norm = normalizeStatus(pp.rsvp_status);
        return norm === "going" || norm === "waitlist";
      });

    console.log(
      `[acceptPlan] Non-host participants: ${nonHostParticipants.length}, all accepted: ${allAccepted}`
    );

    if (allAccepted) {
      // 3. Transition plan → confirmed
      await fetch("/api/db/update-plan-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planUuid, acceptance_status: "confirmed" }),
      });
      console.log(`[acceptPlan] Plan ${planUuid} is now CONFIRMED — host can pay!`);
    }

    // Check sports threshold transition
    if (matchedPlan && (matchedPlan.category === "sports" || (matchedPlan as any).sports_type || (matchedPlan as any).venue_id)) {
      const confirmedParticipants = planParticipants.filter(
        (pp: any) => {
          const norm = normalizeStatus(pp.rsvp_status);
          return norm === "going";
        }
      );
      const confirmedCount = confirmedParticipants.length;
      const required = (matchedPlan as any).required_confirmations || matchedPlan.min_participants || 0;
      console.log(`[acceptPlan] Sports Plan threshold check: ${confirmedCount}/${required}`);
      if (confirmedCount >= required) {
        console.log(`[acceptPlan] Sports Plan ${planUuid} confirmed count met. Keeping status LIVE.`);
      }
    }

    // Automatically recalculate wallet expenses when user joins/accepts
    recalculateWalletExpenses(planUuid).catch(err =>
      console.error("[acceptPlan] recalculateWalletExpenses failed:", err)
    );
  };

  // ─── Decline Plan (Skip Plan) ──────────────────────────────────────────────
  const declinePlan = async (planId: string, userProfile: any) => {
    const matchedPlan = plans.find((p) => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const userUuid = userProfile.dbUuid || resolveUserUuid(userProfile.user_id || userId);

    if (!userUuid || !isUuid(userUuid)) {
      console.error(`[PlansContext] declinePlan: invalid UUID`, userUuid);
      return;
    }

    const existing = dbPlanParticipants.find(
      (p) => p.plan_id === planUuid && p.user_id === userUuid
    );
    if (existing) {
      const oldStatus = existing.rsvp_status;
      const wasActive = oldStatus === "JOINED" || oldStatus === "WAITLISTED";
      const targetSkipReason = wasActive ? "LEFT" : null;
      await updateParticipantStatus(planUuid, userUuid, "SKIPPED", undefined, new Date().toISOString(), targetSkipReason);
      await handleParticipantStatusChange(planUuid, userUuid, oldStatus, "SKIPPED");
      // Clean up team assignment as they are no longer actively participating
      await removePlanTeamAssignment(planUuid, userUuid);
      setDbPlanTeamAssignments(prev => prev.filter(a => !(a.plan_id === planUuid && a.user_id === userUuid)));
      await promoteWaitlistIfSpotsAvailable(planUuid);
    }
  };

  // ─── Host Pay ─────────────────────────────────────────────────────────────
  // Only callable after plan acceptance_status === "confirmed".
  // Calls the /api/db/host-pay endpoint which creates split transactions.
  const hostPay = async (planId: string, hostProfile: any): Promise<boolean> => {
    const matchedPlan = plans.find((p) => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const hostUuid = hostProfile.dbUuid || resolveUserUuid(hostProfile.user_id || userId);
    const costPerPerson = matchedPlan?.cost || matchedPlan?.paymentAmount || 0;

    if (!hostUuid || !isUuid(hostUuid)) {
      console.error(`[PlansContext] hostPay: invalid host UUID`, hostUuid);
      return false;
    }

    console.log(`[hostPay] Processing payment for plan ${planUuid}, ₹${costPerPerson}/person`);

    const res = await fetch("/api/db/host-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planUuid,
        host_user_id: hostUuid,
        cost_per_person: costPerPerson,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[hostPay] Failed:`, err);
      return false;
    }

    const result = await res.json();
    console.log(`[hostPay] Success! Total: ₹${result.total_cost}, split: ${result.split_count} people`);
    return true;
  };

  const bookNow = async (planId: string, hostProfile: any): Promise<{ success: boolean; status?: string; error?: string }> => {
    const matchedPlan = plans.find((p) => p.id === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    const hostUuid = hostProfile.dbUuid || resolveUserUuid(hostProfile.user_id || userId);

    if (!hostUuid || !isUuid(hostUuid)) {
      console.error(`[PlansContext] bookNow: invalid host UUID`, hostUuid);
      return { success: false, error: "Invalid host UUID" };
    }

    try {
      const res = await fetch("/api/db/book-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planUuid,
          host_user_id: hostUuid,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error("[PlansContext] bookNow exception:", err);
      return { success: false, error: err.message || "Failed to book" };
    }
  };

  const createPlan = async (
    newDbPlan: any,
    selectedCircles: string[],
    selectedFriends: any[],
    userProfile: any,
    titleToUse: string
  ) => {
    const planRes = await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "plans", records: [newDbPlan] }),
    });
    if (!planRes.ok) {
      const errData = await planRes.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || "Failed to write plan to backend database");
    }

    const planResult = await planRes.json();
    const dbPlanRow = planResult.data?.[0];
    const insertedPlanUuid = dbPlanRow?.id;

    if (!insertedPlanUuid) {
      throw new Error("Backend did not return the generated UUID for the new plan.");
    }

    // Generate a secure invite token
    const inviteToken = crypto.randomUUID().replace(/-/g, "");
    const { error: inviteError } = await supabase
      .from("plan_invites")
      .insert({
        plan_id: insertedPlanUuid,
        invite_token: inviteToken,
        created_by: userProfile.dbUuid,
        is_active: true
      });
    
    if (inviteError) {
      console.error("[PlansContext] Failed to insert plan invite token:", inviteError);
    } else {
      console.log("[PlansContext] Generated plan invite token:", inviteToken);
    }

    const inviteeUuids: string[] = [];
    const participantRecords: any[] = [];
    const hostRespondedAt = new Date().toISOString();
    const uniqueInviteeUuids = new Set<string>();

    if (selectedCircles.length > 0) {
      const circleUuids = selectedCircles.map((cid) => {
        const c = dbCirclesRef.current.find((x: any) => x.circle_id === cid || x.id === cid);
        return c?.id || cid;
      });
      const targetMembers = dbCircleMembersRef.current.filter((m: any) => circleUuids.includes(m.circle_id));
      targetMembers.forEach((m: any) => {
        if (m.user_id && m.user_id !== userProfile.dbUuid) {
          uniqueInviteeUuids.add(m.user_id);
        }
      });
    }

    if (selectedFriends.length > 0) {
      selectedFriends.forEach((friendObj) => {
        const freshFriendRow = dbUsersRef.current.find((u: any) => u.user_id === friendObj.id || u.id === friendObj.id || u.id === friendObj.dbUuid);
        const friendUuid = freshFriendRow?.id || friendObj.dbUuid || null;
        if (friendUuid && friendUuid !== userProfile.dbUuid) {
          uniqueInviteeUuids.add(friendUuid);
        }
      });
    }

    // V2 schema: role + rsvp_status + responded_at (no participant_id, payment_status, joined_at)
    participantRecords.push({
      plan_id: insertedPlanUuid,
      user_id: userProfile.dbUuid,
      role: "HOST",
      rsvp_status: "JOINED",
      responded_at: hostRespondedAt,
    });

    Array.from(uniqueInviteeUuids).forEach((inviteeUuid) => {
      inviteeUuids.push(inviteeUuid);
      participantRecords.push({
        plan_id: insertedPlanUuid,
        user_id: inviteeUuid,
        role: "PARTICIPANT",
        rsvp_status: "INVITED",
        responded_at: null,
      });
    });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validParticipantRecords = participantRecords.filter(
      (rec) => rec.user_id && uuidRegex.test(rec.user_id)
    );
    const filteredParticipantRecords = validParticipantRecords.filter(
      (rec) => !dbPlanParticipantsRef.current.some((p: any) => p.plan_id === rec.plan_id && p.user_id === rec.user_id)
    );

    let dbPartRow = null;
    if (filteredParticipantRecords.length > 0) {
      const partRes = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plan_participants", records: filteredParticipantRecords }),
      });
      if (!partRes.ok) {
        const errData = await partRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Failed to write participants");
      }
      const partResult = await partRes.json();
      dbPartRow = partResult.data?.[0];
    }

    const inviteNotifications = inviteeUuids.map((uuid) => ({
      user_id: uuid,
      type: "PLAN_INVITATION",
      title: `${userProfile.name} invited you to join "${titleToUse}"`,
      body: "Spontaneous meetup invitation",
      related_plan_id: insertedPlanUuid,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    console.log("[createPlan Audit] dbCircleMembers.length:", dbCircleMembersRef.current.length);
    console.log("[createPlan Audit] inviteeUuids.length:", inviteeUuids.length);
    console.log("[createPlan Audit] participantRecords.length:", participantRecords.length);
    console.log("[createPlan Audit] filteredParticipantRecords.length:", filteredParticipantRecords.length);
    console.log("[createPlan Audit] inviteNotifications.length:", inviteNotifications.length);

    if (inviteNotifications.length > 0) {
      const notifRes = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "notifications", records: inviteNotifications }),
      });
      if (!notifRes.ok) {
        const errData = await notifRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Failed to write notifications");
      }
    }

    if (userProfile.dbUuid) {
      await syncUserStats(userProfile.dbUuid, "create_plan");
    }

    // Automatically recalculate costs/splits for the new plan
    recalculateWalletExpenses(insertedPlanUuid).catch(err =>
      console.error("[createPlan] recalculateWalletExpenses failed:", err)
    );

    await refreshPlans();

    return { dbPlanRow, dbPartRow, inviteeUuids, hostRespondedAt };
  };

  /**
   * Returns DB-accurate participant counts for a plan.
   * planUuid can be either the UUID id or the short plan_id —
   * we match against both to handle legacy data.
   */
  const getParticipantCounts = (planUuid: string): ParticipantCounts => {
    const rows = dbPlanParticipants.filter(
      pp => pp.plan_id === planUuid || (pp as any).id === planUuid
    );

    const plan = dbPlans.find(p => p.id === planUuid || p.plan_id === planUuid);
    const hostUuid = plan?.host_id;

    const breakdown = calculateParticipantBreakdown(rows);
    const { waitlist, delivered, seen, skipped, passed, pending, total } = breakdown;

    const host = rows.some(r => r.user_id === hostUuid && normalizeStatus(r.rsvp_status) === "going") ? 1 : 0;
    const going = rows.filter(r => normalizeStatus(r.rsvp_status) === "going" && r.user_id !== hostUuid).length;

    return { host, going, waitlist, delivered, seen, skipped, passed, pending, total };
  };

  const getHomeFeedPlans = (userIdStr: string) => {
    const userUuid = resolveUserUuid(userIdStr);
    const myParticipantRecords = dbPlanParticipants.filter(pp => pp.user_id === userUuid);
    const filtered = plans.filter(plan => {
      const planUuid = plan.dbUuid || plan.id;
      const ppRecord = myParticipantRecords.find(pp => pp.plan_id === planUuid);
      if (!ppRecord) return false;

      const rsvp = ppRecord.rsvp_status;
      const delivery = ppRecord.delivery_status || "DELIVERED";

      // Home Feed only allows INVITED status (unanswered participation decision)
      if (rsvp !== "INVITED" || !["DELIVERED", "SEEN"].includes(delivery)) return false;

      // Must not be hosted by the user
      if (plan.hostId === userUuid) return false;

      // Plan must be active — mappers convert DB status (LIVE -> active)
      const statusNorm = (plan.status || "").toLowerCase();
      if (statusNorm !== "active" && statusNorm !== "live") return false;

      if (plan.response_deadline_at) {
        const deadline = new Date(plan.response_deadline_at).getTime();
        const now = new Date().getTime();
        if (now > deadline) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const secA = getTimelineSectionValue(a);
      const secB = getTimelineSectionValue(b);
      if (secA !== secB) return secA - secB;

      const dayA = getDayIndexValue(a.date);
      const dayB = getDayIndexValue(b.date);
      if (dayA !== dayB) return dayA - dayB;

      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });
  };

  const getHubPlans = (userIdStr: string) => {
    return plans.filter(plan => {
      if (plan.status === "CANCELLED") return false;
      if (plan.hostId === userIdStr) return true;
      const member = plan.members.find(
         m => m.userId === userIdStr || (m as any).userUuid === userIdStr
      );
      return member?.joinState === "going";
    });
  };


  // ─── Wire outcomes hook (submitReview, submitStats, submitMvp extracted to usePlanOutcomes) ───
  const outcomes = usePlanOutcomes({
    dbPlanOutcomes,
    setDbPlanOutcomes,
    dbUsers,
  });

  // ─── Team Assignment Actions (moved to hook usePlanTeams) ───
  const memoizedPassPlan = useCallback(passPlan, [plans, dbPlanParticipants, userId, dbUsers]);
  const memoizedWaitlistPlan = useCallback(waitlistPlan, [plans, dbPlanParticipants, userId, dbUsers]);
  const memoizedSendReminder = useCallback(sendReminder, [plans, userId, dbUsers]);
  const memoizedIgnoreReminder = useCallback(ignoreReminder, [passPlan]);
  const memoizedGetHomeFeedPlans = useCallback(getHomeFeedPlans, [dbPlanParticipants, plans, userId, dbUsers]);
  const memoizedGetHubPlans = useCallback(getHubPlans, [plans]);
  const memoizedGetParticipantCounts = useCallback(getParticipantCounts, [dbPlanParticipants, dbPlans]);
  const memoizedAcceptPlan = useCallback(acceptPlan, [plans, dbPlanParticipants, userId, dbUsers]);
  const memoizedDeclinePlan = useCallback(declinePlan, [plans, dbPlanParticipants, userId, dbUsers]);
  const memoizedHostPay = useCallback(hostPay, [plans, userId, dbUsers]);
  const memoizedBookNow = useCallback(bookNow, [plans, userId, dbUsers]);
  const memoizedCreatePlan = useCallback(createPlan, [refreshPlans]);
  const memoizedChangePlanHost = lifecycle.changePlanHost;
  const memoizedCancelPlan = lifecycle.cancelPlan;
  const memoizedUpdatePlanDetails = lifecycle.updatePlanDetails;
  const memoizedCompletePlan = lifecycle.completePlan;

  const contextValue = useMemo(() => ({
    plans,
    dbPlans, setDbPlans,
    dbPlanParticipants, setDbPlanParticipants,
    dbPlanOutcomes, setDbPlanOutcomes,
    dbMemories, setDbMemories,
    dbMemoryResults, setDbMemoryResults,
    dbPlanTeamAssignments, setDbPlanTeamAssignments,
    getTeamAssignments,
    assignTeam,
    unassignTeam,
    joinPlan,
    leavePlan,
    passPlan: memoizedPassPlan,
    waitlistPlan: memoizedWaitlistPlan,
    sendReminder: memoizedSendReminder,
    ignoreReminder: memoizedIgnoreReminder,
    getHomeFeedPlans: memoizedGetHomeFeedPlans,
    getHubPlans: memoizedGetHubPlans,
    getParticipantCounts: memoizedGetParticipantCounts,
    refreshPlans,
    markPlanSeen,
    skipPlan,
    rejoinPlan,
    acceptPlan: memoizedAcceptPlan,
    declinePlan: memoizedDeclinePlan,
    hostPay: memoizedHostPay,
    bookNow: memoizedBookNow,
    createPlan: memoizedCreatePlan,
    changePlanHost: memoizedChangePlanHost,
    cancelPlan: memoizedCancelPlan,
    updatePlanDetails: memoizedUpdatePlanDetails,
    completePlan: memoizedCompletePlan,
    submitReview: outcomes.submitReview,
    submitStats: outcomes.submitStats,
    submitMvp: outcomes.submitMvp,
    removeParticipant,
    addParticipantsToPlan,
    promoteWaitlistParticipant,
    rebalanceCapacity,
    getAvailableCapacity,
    moveParticipantToGoing,
    moveParticipantToWaitlist,
    moveParticipantToInvited
  }), [
    plans, dbPlans, dbPlanParticipants,
    dbPlanOutcomes, dbMemories, dbMemoryResults, dbPlanTeamAssignments,
    getTeamAssignments, assignTeam, unassignTeam,
    joinPlan, leavePlan, skipPlan, rejoinPlan, removeParticipant, markPlanSeen,
    memoizedPassPlan, memoizedWaitlistPlan,
    memoizedSendReminder, memoizedIgnoreReminder, memoizedGetHomeFeedPlans,
    memoizedGetHubPlans, memoizedGetParticipantCounts, refreshPlans,
    memoizedAcceptPlan, memoizedDeclinePlan, memoizedHostPay, memoizedBookNow,
    memoizedCreatePlan,
    memoizedChangePlanHost, memoizedCancelPlan, memoizedUpdatePlanDetails,
    memoizedCompletePlan,
    outcomes.submitReview, outcomes.submitStats, outcomes.submitMvp,
    addParticipantsToPlan, promoteWaitlistParticipant, rebalanceCapacity, getAvailableCapacity,
    moveParticipantToGoing, moveParticipantToWaitlist, moveParticipantToInvited
  ]);

  return (
    <PlansContext.Provider value={contextValue}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlansStore = () => {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error("usePlansStore must be used within a PlansProvider");
  }
  return context;
};
