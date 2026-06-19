import {
  PlanMemoryInfo,
  DbPlanOutcome
} from "../core/types";

export type MemoryContributionStatus =
  | "not_attendee"
  | "pending_verdict"   // Movies
  | "pending_vote"      // Dining
  | "pending_result"    // Sports (Football/Badminton) score recorded check
  | "pending_mvp"       // Sports (Football/Badminton) MVP vote check
  | "recorded"
  | "locked"
  | "no_memory";

export interface MemoryContributionInfo {
  status: MemoryContributionStatus;
  badgeLabel: string;
  badgeVariant: "pending" | "recorded" | "neutral";
  entryPrompt: string | null;
  entrySubtext: string | null;
}

export function getMemoryContribution(
  memInfo: PlanMemoryInfo | null | undefined,
  userId: string,
  isHost: boolean,
  planOutcomes: DbPlanOutcome[]
): MemoryContributionInfo {
  if (!memInfo) {
    return {
      status: "no_memory",
      badgeLabel: "Memory Pending",
      badgeVariant: "pending",
      entryPrompt: null,
      entrySubtext: null,
    };
  }

  const memType = (memInfo.memoryType || "").toLowerCase();
  const isAttendee = memInfo.attendeeUserIds.includes(userId);

  const now = new Date().getTime();
  const editWindowOpen =
    memInfo.editableUntil
      ? now < new Date(memInfo.editableUntil).getTime()
      : false;

  const outcomes = planOutcomes.filter((o) => o.plan_id === memInfo.planId);

  // ── MOVIE ──────────────────────────────────────────────────────────
  if (memType === "movie") {
    if (!isAttendee) {
      return {
        status: "not_attendee",
        badgeLabel: "Memory Recorded",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    const myVerdict = outcomes.find(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "review"
    );

    if (myVerdict) {
      return {
        status: "recorded",
        badgeLabel: "Memory Recorded",
        badgeVariant: "recorded",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    if (!editWindowOpen) {
      return {
        status: "locked",
        badgeLabel: "Memory Closed",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    return {
      status: "pending_verdict",
      badgeLabel: "How was it?",
      badgeVariant: "pending",
      entryPrompt: "How was the movie?",
      entrySubtext: "Rate and review the movie.",
    };
  }

  // ── DINING ─────────────────────────────────────────────────────────
  if (memType === "dining") {
    if (!isAttendee) {
      return {
        status: "not_attendee",
        badgeLabel: "Memory Recorded",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    const myVote = outcomes.find(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "review"
    );

    if (myVote) {
      return {
        status: "recorded",
        badgeLabel: "Memory Recorded",
        badgeVariant: "recorded",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    if (!editWindowOpen) {
      return {
        status: "locked",
        badgeLabel: "Memory Closed",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    return {
      status: "pending_vote",
      badgeLabel: "How was the food?",
      badgeVariant: "pending",
      entryPrompt: "How was the restaurant?",
      entrySubtext: "Rate and review your dining experience.",
    };
  }

  // ── FOOTBALL ──────────────────────────────────────────────────────
  if (memType === "football") {
    const matchResult = outcomes.find((o) => o.outcome_type === "stats");
    const hasResult = !!matchResult;

    if (!hasResult) {
      if (!editWindowOpen) {
        return {
          status: "locked",
          badgeLabel: "Memory Closed",
          badgeVariant: "neutral",
          entryPrompt: null,
          entrySubtext: null,
        };
      }
      return {
        status: "pending_result",
        badgeLabel: "Record Result",
        badgeVariant: "pending",
        entryPrompt: "Record Result",
        entrySubtext: isHost
          ? "Record the final match score."
          : "Waiting for host to record score.",
      };
    }

    if (!isAttendee) {
      return {
        status: "not_attendee",
        badgeLabel: "Result Recorded",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    const myMvpVote = outcomes.find(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "mvp_vote"
    );

    if (myMvpVote) {
      return {
        status: "recorded",
        badgeLabel: "Memory Recorded",
        badgeVariant: "recorded",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    if (!editWindowOpen) {
      return {
        status: "locked",
        badgeLabel: "Memory Closed",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    return {
      status: "pending_mvp",
      badgeLabel: "Vote MVP",
      badgeVariant: "pending",
      entryPrompt: "Vote MVP",
      entrySubtext: "Who was the best player today?",
    };
  }

  // ── BADMINTON ─────────────────────────────────────────────────────
  if (memType === "badminton") {
    if (!isAttendee) {
      return {
        status: "not_attendee",
        badgeLabel: "Result Recorded",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    const myResult = outcomes.find(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "stats"
    );
    const hasResult = !!myResult;

    if (!hasResult) {
      if (!editWindowOpen) {
        return {
          status: "locked",
          badgeLabel: "Memory Closed",
          badgeVariant: "neutral",
          entryPrompt: null,
          entrySubtext: null,
        };
      }
      return {
        status: "pending_result",
        badgeLabel: "Record Result",
        badgeVariant: "pending",
        entryPrompt: "How did your session go?",
        entrySubtext: "Record wins and losses.",
      };
    }

    const myMvpVote = outcomes.find(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "mvp_vote"
    );

    if (myMvpVote) {
      return {
        status: "recorded",
        badgeLabel: "Memory Recorded",
        badgeVariant: "recorded",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    if (!editWindowOpen) {
      return {
        status: "locked",
        badgeLabel: "Memory Closed",
        badgeVariant: "neutral",
        entryPrompt: null,
        entrySubtext: null,
      };
    }

    return {
      status: "pending_mvp",
      badgeLabel: "Vote MVP",
      badgeVariant: "pending",
      entryPrompt: "Vote MVP",
      entrySubtext: "Who was the best player today?",
    };
  }

  // ── FALLBACK ───────────────────────────────────────────────────────
  return {
    status: "recorded",
    badgeLabel: "Memory Recorded",
    badgeVariant: "recorded",
    entryPrompt: null,
    entrySubtext: null,
  };
}

export function hasOutstandingMemoryAction(
  memInfo: PlanMemoryInfo,
  userId: string,
  isHost: boolean,
  planOutcomes: DbPlanOutcome[]
): boolean {
  const isAttendee = memInfo.attendeeUserIds.includes(userId);

  const now = new Date().getTime();
  const editWindowOpen =
    memInfo.editableUntil
      ? now < new Date(memInfo.editableUntil).getTime()
      : false;

  if (!editWindowOpen) return false;

  const memType = (memInfo.memoryType || "").toLowerCase();
  const outcomes = planOutcomes.filter((o) => o.plan_id === memInfo.planId);

  // ── MOVIE ──
  if (memType === "movie") {
    if (!isAttendee) return false;
    const myVerdict = outcomes.some(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "review"
    );
    return !myVerdict;
  }

  // ── DINING ──
  if (memType === "dining") {
    if (!isAttendee) return false;
    const myVote = outcomes.some(
      (o) => o.submitted_by_user_id === userId && o.outcome_type === "review"
    );
    return !myVote;
  }

  // ── FOOTBALL ──
  if (memType === "football") {
    const hasResult = outcomes.some((o) => o.outcome_type === "stats");
    if (!hasResult) {
      return isHost;
    }
    if (!isAttendee) return false;
    const myMvpVote = outcomes.some(
      (o) =>
        o.submitted_by_user_id === userId && o.outcome_type === "mvp_vote"
    );
    return !myMvpVote;
  }

  // ── BADMINTON ──
  if (memType === "badminton") {
    if (!isAttendee) return false;
    const myResult = outcomes.some(
      (o) =>
        o.submitted_by_user_id === userId && o.outcome_type === "stats"
    );
    if (!myResult) {
      return true;
    }
    const myMvpVote = outcomes.some(
      (o) =>
        o.submitted_by_user_id === userId && o.outcome_type === "mvp_vote"
    );
    return !myMvpVote;
  }

  return false;
}
