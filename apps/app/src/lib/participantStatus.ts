/**
 * participantStatus.ts — Shared participant-status mapping and classification logic.
 * Supabase participant status remains the single source of truth for the entire application.
 */

import { DbPlanParticipant, PlanState } from "../core/types";

/**
 * Normalizes participant statuses to standard PlanState values.
 */
export function normalizeStatus(status: string | undefined): PlanState {
  if (!status) return "delivered";
  
  const lower = status.toLowerCase();
  
  // Map historical or legacy variants
  if (lower === "passed" || lower === "skipped") {
    return "skipped";
  }
  if (lower === "waitlist" || lower === "waitlisted") {
    return "waitlist";
  }
  
  const validStatuses: PlanState[] = ["going", "waitlist", "delivered", "seen", "skipped"];
  if (validStatuses.includes(lower as PlanState)) {
    return lower as PlanState;
  }
  
  return "delivered";
}

/**
 * Resolves standard categories/counts from a list of participant rows.
 */
export interface ParticipantBreakdown {
  host: number;
  going: number;
  waitlist: number;
  delivered: number;
  seen: number;
  skipped: number;
  passed: number;
  pending: number;
  total: number;
}

export function calculateParticipantBreakdown(rows: DbPlanParticipant[]): ParticipantBreakdown {
  const normalized = rows.map(r => ({ ...r, status: normalizeStatus(r.status) }));

  const host      = 0;
  const going     = normalized.filter(r => r.status === "going").length;
  const waitlist  = normalized.filter(r => r.status === "waitlist").length;
  const delivered = normalized.filter(r => r.status === "delivered").length;
  const seen      = normalized.filter(r => r.status === "seen").length;
  const skipped   = normalized.filter(r => r.status === "skipped").length;
  const passed    = skipped;
  const pending   = delivered + seen;
  const total     = rows.length;

  return { host, going, waitlist, delivered, seen, skipped, passed, pending, total };
}

/**
 * Standard utility to parse string times (e.g. "08:30 PM") into absolute minutes for sorting.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    const genericMatch = timeStr.match(/(\d{1,2})[.:](\d{2})/);
    if (genericMatch) {
      return parseInt(genericMatch[1], 10) * 60 + parseInt(genericMatch[2], 10);
    }
    return 0;
  }
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

