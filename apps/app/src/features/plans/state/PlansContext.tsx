import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";
import { Plan, PlanMember, DbPlan, DbPlanParticipant, DbPlanOutcome, User, DbMemory, DbMemoryResult } from "../../../core/types";
import { DbPlanTeamAssignment } from "../../../../lib/db";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { usePlanTeams } from "../hooks/usePlanTeams";
import { usePlanParticipants } from "../hooks/usePlanParticipants";
import { usePlanLifecycle } from "../hooks/usePlanLifecycle";
import { usePlanOutcomes } from "../hooks/usePlanOutcomes";
import { insertParticipant, updateParticipantStatus, insertPlanReminder, removePlanTeamAssignment, deleteAllPlanTeamAssignments, syncUserStats } from "../../../../lib/db";
import { mapPlansToLegacyPlans } from "../../../../lib/mappers";
import { calculateParticipantBreakdown, normalizeStatus } from "../../../../lib/participantStatus";
import { supabase } from "../../../../lib/supabaseClient";
import { cleanPlanId, isUuid, resolveUserUuid as resolveUserUuidUtil } from "../utils/planUtils";
import { getTimelineSectionValue, getDayIndexValue, parseTimeToMinutes } from "../utils/planFeedUtils";
import { recalculateWalletExpenses } from "../../wallet/services/walletSyncService";


interface ParticipantCounts {
  host: number;
  going: number;
  waitlist: number;
  delivered: number;
  skipped: number;
  passed: number;
  pending: number;  // invited but not yet responded
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
  skipPlan: (planId: string, userId: string) => Promise<void>;
  rejoinPlan: (planId: string, userProfile: any) => Promise<void>;
  // New acceptance / payment / booking actions
  acceptPlan: (planId: string, userProfile: any) => Promise<void>;
  declinePlan: (planId: string, userProfile: any) => Promise<void>;
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
    planTitle: string,
    inviteeCircleMap?: Record<string, string | null>
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
      const shouldFetchAll = !targetTables;

      // Direct Supabase queries for Plans domain tables
      if (shouldFetchAll || targetTables.includes("plans")) {
        const { data, error } = await (supabase as any)
          .from("plans")
          .select("*, discovery_items(category, subcategory)");
        if (!error && data) setDbPlans(data);
      }

      if (shouldFetchAll || targetTables.includes("plan_participants")) {
        const { data, error } = await (supabase as any).from("plan_participants").select("*");
        if (!error && data) setDbPlanParticipants(data);
      }

      if (shouldFetchAll || targetTables?.includes("plan_team_assignments")) {
        setDbPlanTeamAssignments([]);
      }

      // Direct Supabase queries for supporting tables
      if (shouldFetchAll || targetTables.includes("users")) {
        const { data, error } = await (supabase as any).from("users").select("*");
        if (!error && data) setDbUsers(data);
      }

      // plan_outcomes database fetch is disabled (unfinished feature)
      // if (shouldFetchAll || targetTables.includes("plan_outcomes")) {
      //   const { data, error } = await (supabase as any).from("plan_outcomes").select("*");
      //   if (!error && data) setDbPlanOutcomes(data);
      // }

      if (shouldFetchAll || targetTables.includes("memories")) {
        const { data, error } = await (supabase as any).from("memories").select("*");
        if (!error && data) setDbMemories(data);
      }

      // memory_results database fetch is disabled (unfinished feature)
      // if (shouldFetchAll || targetTables.includes("memory_results")) {
      //   const { data, error } = await (supabase as any).from("memory_results").select("*");
      //   if (!error && data) setDbMemoryResults(data);
      // }
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

        return;
      }
      lastRecoveryRef.current = now;

      refreshPlans(["plans", "plan_participants"]);
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
          refreshPlans(["plans", "plan_participants"]);
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
          refreshPlans(["plans", "plan_participants"]);
        }
      )

      // plan_outcomes real-time changes are disabled (unfinished feature)
      // .on(
      //   "postgres_changes",
      //   { event: "*", schema: "public", table: "plan_outcomes" },
      //   (payload: any) => {
      //     const { eventType, new: newRec, old: oldRec } = payload;
      // 
      //     if (eventType === "INSERT" || eventType === "UPDATE") {
      //       const outcomeId = newRec.id;
      // 
      //       setDbPlanOutcomes(prev => {
      //         const matchIndex = prev.findIndex(outcome => outcome.id === outcomeId);
      //         if (matchIndex > -1) {
      //           const updated = [...prev];
      //           updated[matchIndex] = newRec;
      //           return updated;
      //         } else {
      //           return [...prev, newRec];
      //         }
      //       });
      //     } else if (eventType === "DELETE") {
      //       const outcomeId = oldRec.id;
      // 
      //       setDbPlanOutcomes(prev => {
      //         return prev.filter(outcome => outcome.id !== outcomeId);
      //       });
      //     }
      //   }
      // )
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
      // memory_results real-time changes are disabled (unfinished feature)
      // .on(
      //   "postgres_changes",
      //   { event: "*", schema: "public", table: "memory_results" },
      //   (payload: any) => {
      //     const { eventType, new: newRec, old: oldRec } = payload;
      // 
      //     if (eventType === "INSERT" || eventType === "UPDATE") {
      //       const resultId = newRec.id;
      // 
      //       setDbMemoryResults(prev => {
      //         const matchIndex = prev.findIndex(r => r.id === resultId);
      //         if (matchIndex > -1) {
      //           const updated = [...prev];
      //           updated[matchIndex] = newRec;
      //           return updated;
      //         } else {
      //           return [...prev, newRec];
      //         }
      //       });
      //     } else if (eventType === "DELETE") {
      //       const resultId = oldRec.id;
      // 
      //       setDbMemoryResults(prev => {
      //         return prev.filter(r => r.id !== resultId);
      //       });
      //     }
      //   }
      // )
      .subscribe((status) => {

        const prevStatus = lastStatusRef.current;
        lastStatusRef.current = status;

        if (status === "SUBSCRIBED") {
          if (prevStatus && prevStatus !== "SUBSCRIBED") {

            refreshPlans(["plans", "plan_participants", "memories"]);
          } else {

          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {

        }
      });

    return () => {

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
    unassignTeam,
    dbCircleMembers
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
    } const existingBefore = dbPlanParticipants.find(p => p.plan_id === planUuid && p.user_id === userUuid);



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
      }
    }


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



    // 2. Check if all non-host participants have accepted (state updated via realtime)
    const { data: freshParticipants } = await (supabase as any)
      .from("plan_participants")
      .select("*");
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
        return norm === "JOINED" || norm === "WAITLISTED";
      });



    if (allAccepted) {
      // 3. Transition plan → confirmed via direct Supabase update
      await (supabase as any)
        .from("plans")
        .update({ acceptance_status: "confirmed" })
        .eq("id", planUuid);
    }

    // Check sports threshold transition
    if (matchedPlan && (matchedPlan.category === "sports" || (matchedPlan as any).sports_type || (matchedPlan as any).venue_id)) {
      const confirmedParticipants = planParticipants.filter(
        (pp: any) => {
          const norm = normalizeStatus(pp.rsvp_status);
          return norm === "JOINED";
        }
      );
      const confirmedCount = confirmedParticipants.length;
      const required = (matchedPlan as any).required_confirmations || matchedPlan.min_participants || 0;

      if (confirmedCount >= required) {

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

  const createPlan = async (
    newDbPlan: any,
    selectedCircles: string[],
    selectedFriends: any[],
    userProfile: any,
    titleToUse: string,
    isHostSelected = true
  ) => {
    const { data: dbPlanData, error: planError } = await (supabase as any)
      .from("plans")
      .insert(newDbPlan)
      .select();
    if (planError || !dbPlanData || dbPlanData.length === 0) {
      throw new Error(planError?.message || "Failed to write plan to backend database");
    }

    const dbPlanRow = dbPlanData[0];
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
    }

    const inviteeUuids: string[] = [];
    const uniqueInviteeUuids = new Set<string>();
    const inviteeToCircleMap = new Map<string, string | null>();

    if (selectedCircles.length > 0) {
      const circleUuids = selectedCircles.map((cid) => {
        const c = dbCirclesRef.current.find((x: any) => x.circle_id === cid || x.id === cid);
        return c?.id || cid;
      });
      const targetMembers = dbCircleMembersRef.current.filter((m: any) => circleUuids.includes(m.circle_id));
      targetMembers.forEach((m: any) => {
        if (m.user_id && m.user_id !== userProfile.dbUuid) {
          uniqueInviteeUuids.add(m.user_id);
          inviteeToCircleMap.set(m.user_id, m.circle_id);
        }
      });
    }

    if (selectedFriends.length > 0) {
      selectedFriends.forEach((friendObj) => {
        const freshFriendRow = dbUsersRef.current.find((u: any) => u.user_id === friendObj.id || u.id === friendObj.id || u.id === friendObj.dbUuid);
        const friendUuid = freshFriendRow?.id || friendObj.dbUuid || null;
        if (friendUuid && friendUuid !== userProfile.dbUuid) {
          uniqueInviteeUuids.add(friendUuid);
          if (!inviteeToCircleMap.has(friendUuid)) {
            inviteeToCircleMap.set(friendUuid, null);
          }
        }
      });
    }

    const circleUuid = newDbPlan?.circle_id || null;

    const getParticipantCircleId = (inviteeUuid: string) => {
      if (circleUuid) return circleUuid;
      const matchedMember = dbCircleMembersRef.current.find(
        (m: any) => m.user_id === inviteeUuid
      );
      return matchedMember?.circle_id || null;
    };

    const hostJoinedAt = new Date().toISOString();
    const participantRecords: any[] = [];
    if (isHostSelected) {
      participantRecords.push({
        plan_id: insertedPlanUuid,
        user_id: userProfile.dbUuid || userProfile.id || userId,
        role: "HOST",
        rsvp_status: "JOINED",
        responded_at: hostJoinedAt,
        circle_id: getParticipantCircleId(userProfile.dbUuid || userProfile.id || userId)
      });
    }

    const autoJoinedUuids = new Set<string>();
    uniqueInviteeUuids.forEach((inviteeUuid) => {
      inviteeUuids.push(inviteeUuid);
      let shouldAutoJoin = false;
      const cId = getParticipantCircleId(inviteeUuid);
      if (cId) {
        const circleObj = dbCirclesRef.current.find((c: any) => c.id === cId);
        if (circleObj?.allow_auto_join) {
          shouldAutoJoin = true;
          autoJoinedUuids.add(inviteeUuid);
        }
      }

      participantRecords.push({
        plan_id: insertedPlanUuid,
        user_id: inviteeUuid,
        role: "PARTICIPANT",
        rsvp_status: shouldAutoJoin ? "JOINED" : "INVITED",
        responded_at: shouldAutoJoin ? new Date().toISOString() : null,
        circle_id: cId
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
      const { data: partResultData, error: partError } = await (supabase as any)
        .from("plan_participants")
        .upsert(filteredParticipantRecords, { onConflict: "plan_id,user_id" })
        .select();
      if (partError) {
        throw new Error(partError.message || "Failed to write participants");
      }
      dbPartRow = partResultData?.[0];
    }


    if (userProfile.dbUuid) {
      await syncUserStats(userProfile.dbUuid, "create_plan");
    }

    // Automatically recalculate costs/splits for the new plan
    recalculateWalletExpenses(insertedPlanUuid).catch(err =>
      console.error("[createPlan] recalculateWalletExpenses failed:", err)
    );

    await refreshPlans();

    return { dbPlanRow, dbPartRow, inviteeUuids, hostJoinedAt };
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
    const { waitlisted, invited, skipped, passed, pending, total } = breakdown;

    const host = rows.some(r => r.user_id === hostUuid && normalizeStatus(r.rsvp_status) === "JOINED") ? 1 : 0;
    const going = rows.filter(r => normalizeStatus(r.rsvp_status) === "JOINED" && r.user_id !== hostUuid).length;

    return { host, going, waitlist: waitlisted, delivered: invited, skipped, passed, pending, total };
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
      if (rsvp !== "INVITED" || delivery !== "DELIVERED") return false;

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
      return member?.joinState === "JOINED";
    });
  };


  // ─── Wire outcomes hook (submitReview, submitStats, submitMvp extracted to usePlanOutcomes) ───
  const outcomes = usePlanOutcomes({
    dbPlanOutcomes,
    setDbPlanOutcomes,
    dbUsers,
  });

  const updateLocalPlan = useCallback((planId: string, updates: Partial<DbPlan>) => {
    setDbPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId || plan.public_id === planId
          ? {
            ...plan,
            ...updates,
          }
          : plan
      )
    );
  }, []);

  const changePlanHost = useCallback(async (planId: string, newHostUuid: string, oldHostUuid: string) => {
    await lifecycle.changePlanHost(planId, newHostUuid, oldHostUuid);
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    updateLocalPlan(planUuid, { host_id: newHostUuid });
  }, [lifecycle, plans, updateLocalPlan]);

  const cancelPlan = useCallback(async (planId: string) => {
    await lifecycle.cancelPlan(planId);
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    updateLocalPlan(planUuid, { status: "CANCELLED" });
  }, [lifecycle, plans, updateLocalPlan]);

  const updatePlanDetails = useCallback(async (planId: string, updates: Partial<DbPlan>) => {
    await lifecycle.updatePlanDetails(planId, updates);
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    updateLocalPlan(planUuid, updates);
  }, [lifecycle, plans, updateLocalPlan]);

  const completePlan = useCallback(async (planId: string) => {
    await lifecycle.completePlan(planId);
    const matchedPlan = plans.find(p => p.id === planId || p.dbUuid === planId);
    const planUuid = matchedPlan?.dbUuid || planId;
    updateLocalPlan(planUuid, { status: "COMPLETED" });
  }, [lifecycle, plans, updateLocalPlan]);

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
  const memoizedCreatePlan = useCallback(createPlan, [refreshPlans]);
  const memoizedChangePlanHost = useCallback(changePlanHost, [changePlanHost]);
  const memoizedCancelPlan = useCallback(cancelPlan, [cancelPlan]);
  const memoizedUpdatePlanDetails = useCallback(updatePlanDetails, [updatePlanDetails]);
  const memoizedCompletePlan = useCallback(completePlan, [completePlan]);

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
    skipPlan,
    rejoinPlan,
    acceptPlan: memoizedAcceptPlan,
    declinePlan: memoizedDeclinePlan,
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
    joinPlan, leavePlan, skipPlan, rejoinPlan, removeParticipant,
    memoizedPassPlan, memoizedWaitlistPlan,
    memoizedSendReminder, memoizedIgnoreReminder, memoizedGetHomeFeedPlans,
    memoizedGetHubPlans, memoizedGetParticipantCounts, refreshPlans,
    memoizedAcceptPlan, memoizedDeclinePlan,
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
