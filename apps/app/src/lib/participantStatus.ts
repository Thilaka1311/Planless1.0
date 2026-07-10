/**
 * participantStatus.ts — Shared participant-status mapping and classification logic.
 * Supabase participant status is the single source of truth for the entire application.
 *
 * Canonical rsvp_status enum (DB and UI layers share the same values):
 *   JOINED      — participant confirmed their spot
 *   WAITLISTED  — on the waitlist
 *   SKIPPED     — declined or left the plan
 *   INVITED     — invited but not yet responded
 */

import { DbPlanParticipant, PlanState } from "../core/types";

export function normalizeStatus(rsvpStatus: string | undefined): PlanState {
  if (!rsvpStatus) return "INVITED";

  const upper = rsvpStatus.toUpperCase();

  if (upper === "JOINED")     return "JOINED";
  if (upper === "SKIPPED")    return "SKIPPED";
  if (upper === "WAITLISTED") return "WAITLISTED";
  if (upper === "INVITED")    return "INVITED";

  // Treat any unrecognised value as INVITED (pending/unresponded)
  return "INVITED";
}

/**
 * Resolves standard categories/counts from a list of participant rows.
 */
export interface ParticipantBreakdown {
  host: number;
  joined: number;
  waitlisted: number;
  invited: number;
  skipped: number;
  passed: number;
  pending: number;
  total: number;
}

export function calculateParticipantBreakdown(rows: DbPlanParticipant[]): ParticipantBreakdown {
  const normalized = rows.map(r => ({ ...r, status: normalizeStatus(r.rsvp_status) }));

  const host      = 0;
  const joined    = normalized.filter(r => r.status === "JOINED").length;
  const waitlisted = normalized.filter(r => r.status === "WAITLISTED").length;
  const invited   = normalized.filter(r => r.status === "INVITED").length;
  const skipped   = normalized.filter(r => r.status === "SKIPPED").length;
  const passed    = skipped;
  const pending   = invited;
  const total     = normalized.filter(r => ["JOINED", "WAITLISTED", "INVITED"].includes(r.status)).length;

  return { host, joined, waitlisted, invited, skipped, passed, pending, total };
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

