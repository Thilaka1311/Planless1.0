/**
 * participantStatus.ts — Shared participant-status mapping and classification logic.
 * Supabase participant status remains the single source of truth for the entire application.
 */

import { DbPlanParticipant, PlanState } from "../core/types";

export function normalizeStatus(rsvpStatus: string | undefined, deliveryStatus?: string): PlanState {
  if (!rsvpStatus) return "delivered";
  
  const upper = rsvpStatus.toUpperCase();
  
  if (upper === "JOINED") {
    return "going";
  }
  if (upper === "SKIPPED") {
    return "skipped";
  }
  if (upper === "WAITLISTED") {
    return "waitlist";
  }
  if (upper === "INVITED") {
    if (deliveryStatus && deliveryStatus.toUpperCase() === "SEEN") {
      return "seen";
    }
    return "delivered";
  }
  
  const lower = rsvpStatus.toLowerCase();
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
  const normalized = rows.map(r => ({ ...r, status: normalizeStatus(r.rsvp_status, r.delivery_status) }));

  const host      = 0;
  const going     = normalized.filter(r => r.status === "going").length;
  const waitlist  = normalized.filter(r => r.status === "waitlist").length;
  const delivered = normalized.filter(r => r.status === "delivered").length;
  const seen      = normalized.filter(r => r.status === "seen").length;
  const skipped   = normalized.filter(r => r.status === "skipped").length;
  const passed    = skipped;
  const pending   = delivered + seen;
  const total     = normalized.filter(r => ["going", "waitlist", "delivered", "seen"].includes(r.status)).length;

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

