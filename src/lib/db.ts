/**
 * db.ts — Planless Database Service Layer
 *
 * Single source of truth for all Supabase operations.
 * All records use the UUID `id` column as the primary key.
 * No debounce effects. Write-on-action only.
 */

// ─────────────────────────────────────────────
// RAW DATABASE ROW TYPES  (mirror Supabase schema exactly)
// ─────────────────────────────────────────────

export interface DbUser {
  id: string;           // UUID primary key
  user_id: string;      // sequential public ID e.g. "U001"
  full_name: string;
  username: string;
  phone_number: string;
  profile_photo: string;
  bio: string;
  college_or_work: string;
  wallet_balance: number;
  active_status: boolean;
  created_at: string;
}

export interface DbPlan {
  id: string;           // UUID primary key
  plan_id: string;      // sequential public ID e.g. "P001"
  title: string;
  description: string;
  created_by: string;   // UUID → users.id
  circle_id: string | null; // UUID → circles.id
  activity_type: string; // "movies" | "sports" | "restaurants" | "custom"
  location: string;
  datetime: string;     // ISO timestamp
  max_people: number;
  split_amount: number;
  payment_required: boolean;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  cover_image: string | null;
  notes: string | null;
}

export interface DbParticipant {
  id: string;            // UUID primary key
  participant_id: string; // sequential public ID e.g. "PP001"
  plan_id: string;       // UUID → plans.id
  user_id: string;       // UUID → users.id
  status: "going" | "delivered" | "waitlist" | "passed";
  payment_status: "paid" | "unpaid";
  joined_at: string;
}

// ─────────────────────────────────────────────
// SNAPSHOT — what we load from Supabase on boot / poll
// ─────────────────────────────────────────────

export interface DbSnapshot {
  users: DbUser[];
  plans: DbPlan[];
  participants: DbParticipant[];
}

// ─────────────────────────────────────────────
// FETCH  — load everything the current user needs
// ─────────────────────────────────────────────

export async function fetchSnapshot(): Promise<DbSnapshot | null> {
  try {
    const res = await fetch("/api/db/fetch-all");
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.configured || json.tables_missing) return null;

    return {
      users:        (json.data?.users            || []) as DbUser[],
      plans:        (json.data?.plans            || []) as DbPlan[],
      participants: (json.data?.plan_participants || []) as DbParticipant[],
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// WRITE — individual targeted writes (called on user action only)
// ─────────────────────────────────────────────

async function upsert(table: string, records: any[]): Promise<any[] | null> {
  try {
    const res = await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, records }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error(`[DB] upsert ${table} failed:`, err);
      return null;
    }
    const result = await res.json();
    return result.data ?? null;
  } catch (e) {
    console.error(`[DB] upsert ${table} exception:`, e);
    return null;
  }
}

/** Insert a brand-new plan row. Returns the DB-generated row (with real plan_id). */
export async function insertPlan(plan: Omit<DbPlan, "id" | "plan_id">): Promise<DbPlan | null> {
  const rows = await upsert("plans", [plan]);
  return rows?.[0] ?? null;
}

/** Insert a new participant row. Returns the DB-generated row (with real participant_id). */
export async function insertParticipant(
  p: Omit<DbParticipant, "id" | "participant_id">
): Promise<DbParticipant | null> {
  const rows = await upsert("plan_participants", [p]);
  return rows?.[0] ?? null;
}

/** Update an existing participant's status (accept / leave / waitlist). */
export async function updateParticipantStatus(
  participantId: string,   // UUID primary key
  status: DbParticipant["status"],
  paymentStatus?: DbParticipant["payment_status"]
): Promise<DbParticipant | null> {
  const update: any = { id: participantId, status };
  if (paymentStatus !== undefined) update.payment_status = paymentStatus;
  const rows = await upsert("plan_participants", [update]);
  return rows?.[0] ?? null;
}

/** Insert multiple participants at once (bulk invite). */
export async function insertParticipants(
  rows: Omit<DbParticipant, "id" | "participant_id">[]
): Promise<DbParticipant[]> {
  if (rows.length === 0) return [];
  const result = await upsert("plan_participants", rows);
  return result ?? [];
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Find a user by UUID in a snapshot. */
export function findUser(users: DbUser[], uuid: string): DbUser | undefined {
  return users.find(u => u.id === uuid);
}

/** Find all participants for a given plan UUID. */
export function participantsForPlan(participants: DbParticipant[], planId: string): DbParticipant[] {
  return participants.filter(p => p.plan_id === planId);
}

/** Find the participant row for a specific user on a specific plan. */
export function myParticipant(
  participants: DbParticipant[],
  planId: string,   // UUID
  userUuid: string  // UUID
): DbParticipant | undefined {
  return participants.find(p => p.plan_id === planId && p.user_id === userUuid);
}
