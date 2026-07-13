import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { DbPlanOutcome, User } from "../../../core/types";
import { resolveUserUuid } from "../utils/planUtils";
import { supabase } from "../../../lib/supabaseClient";

// ─── Dependency injection types ───────────────────────────────────────────────

export interface PlanOutcomesDeps {
  dbPlanOutcomes: DbPlanOutcome[];
  setDbPlanOutcomes: Dispatch<SetStateAction<DbPlanOutcome[]>>;
  dbUsers: User[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlanOutcomes(deps: PlanOutcomesDeps) {
  const { dbPlanOutcomes, setDbPlanOutcomes, dbUsers } = deps;

  // ─── submitReview ────────────────────────────────────────────────────────────
  // Payload: { rating, review }

  const submitReview = useCallback(async (
    memoryId: string,
    category: 'movie' | 'dining',
    rating: number,
    review: string | null,
    userUuid: string,
    existingId?: string
  ) => {
    const resolvedUserUuid = resolveUserUuid(userUuid, dbUsers);
    const record = {
      id: existingId || crypto.randomUUID(),
      plan_id: memoryId,
      submitted_by_user_id: resolvedUserUuid,
      outcome_type: 'review',
      payload: { rating, review },
      created_at: new Date().toISOString()
    };
    const { error } = await (supabase as any)
      .from("plan_outcomes")
      .upsert(record);
    if (error) {
      throw new Error("Failed to submit review");
    }
  }, [dbUsers]);

  // ─── submitStats ─────────────────────────────────────────────────────────────
  // Football payload: { teamAScore, teamBScore }
  // Badminton payload: { wins, losses }

  const submitStats = useCallback(async (
    memoryId: string,
    category: 'football' | 'badminton',
    stats: { scoreA?: number; scoreB?: number; wins?: number; losses?: number },
    userUuid: string
  ) => {
    const resolvedUserUuid = resolveUserUuid(userUuid, dbUsers);
    const record = {
      id: crypto.randomUUID(),
      plan_id: memoryId,
      submitted_by_user_id: resolvedUserUuid,
      outcome_type: 'stats',
      payload: category === 'football'
        ? { teamAScore: stats.scoreA, teamBScore: stats.scoreB }
        : { wins: stats.wins, losses: stats.losses },
      created_at: new Date().toISOString()
    };
    const { error } = await (supabase as any)
      .from("plan_outcomes")
      .upsert(record);
    if (error) {
      throw new Error("Failed to submit stats");
    }
  }, [dbUsers]);

  // ─── submitMvp ───────────────────────────────────────────────────────────────
  // Payload: { mvp_user_id }

  const submitMvp = useCallback(async (
    memoryId: string,
    voterUuid: string,
    mvpUuid: string
  ) => {
    const record = {
      id: crypto.randomUUID(),
      plan_id: memoryId,
      submitted_by_user_id: voterUuid,
      outcome_type: 'mvp_vote',
      payload: { mvp_user_id: mvpUuid },
      created_at: new Date().toISOString()
    };
    const { error } = await (supabase as any)
      .from("plan_outcomes")
      .upsert(record);
    if (error) {
      throw new Error("Failed to submit MVP vote");
    }
  }, []);

  return {
    dbPlanOutcomes,
    submitReview,
    submitStats,
    submitMvp,
  };
}
