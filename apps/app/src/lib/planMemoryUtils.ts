import { PlanMemoryInfo, DbPlanParticipant } from "../core/types";

/**
 * Derives a memory type string from a plan's category and activity_type.
 * This replaces the legacy `memories.memory_type` field.
 */
export function memoryTypeFromPlan(plan: {
  category?: string | null;
  activity_type?: string | null;
  activityType?: string | null;
}): string {
  const category = (plan.category || "").toLowerCase();
  const activityType = (plan.activity_type || plan.activityType || "").toLowerCase();

  if (category === "movies") return "movie";
  if (category === "dining" || category === "restaurants") return "dining";
  if (category === "sports") {
    if (activityType === "badminton") return "badminton";
    return "football";
  }
  return "custom";
}

/**
 * Derives a PlanMemoryInfo from a plan object and the current plan_participants state.
 * Replaces all lookups against the `memories` and `memory_attendees` tables.
 *
 * Option A (MVP): editableUntil is always far in the future — the 24h window is not
 * enforced in the UI for MVP, so we always allow contribution edits.
 */
export function derivePlanMemoryInfo(
  plan: {
    id?: string | null;
    plan_id?: string | null;
    dbUuid?: string | null;
    category?: string | null;
    activity_type?: string | null;
    activityType?: string | null;
  },
  dbPlanParticipants: DbPlanParticipant[]
): PlanMemoryInfo {
  const planId = (plan as any).dbUuid || plan.id || (plan as any).plan_id || "";
  const altPlanId = plan.id || "";

  const attendeeUserIds = dbPlanParticipants
    .filter(
      (pp) =>
        (pp.plan_id === planId || (altPlanId && pp.plan_id === altPlanId)) &&
        pp.status === "going"
    )
    .map((pp) => pp.user_id);

  // Option A: always allow editing (far future — 1 year from now)
  const FAR_FUTURE = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    planId,
    memoryType: memoryTypeFromPlan(plan),
    editableUntil: FAR_FUTURE,
    completedAt: new Date().toISOString(),
    attendeeUserIds,
  };
}
