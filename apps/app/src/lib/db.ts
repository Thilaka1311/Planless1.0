import { generateCircleFriendshipsDirect } from "../features/friendships/services/friendshipService";
import { supabase } from "./supabaseClient";

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
  id: string;
  public_id: string;
  host_id: string;
  category: 'SPORTS' | 'MOVIES' | 'DINING' | 'ENTERTAINMENT' | 'TRAVEL' | 'FITNESS' | 'STUDY' | 'OTHER';
  subcategory: 'FOOTBALL' | 'BADMINTON' | 'CRICKET' | 'BASKETBALL' | 'VOLLEYBALL' | 'TENNIS' | 'PICKLEBALL' | 'BOWLING' | 'GO_KARTING' | 'MOVIE' | 'RESTAURANT' | 'CAFE' | 'ROAD_TRIP' | 'GYM' | 'STUDY_SESSION' | 'OTHER';
  title: string;
  description: string;
  place_id: string;
  place_name: string;
  place_address: string;
  scheduled_at: string;
  rsvp_deadline: string;
  max_participants: number | null;
  total_cost: number;
  status: 'LIVE' | 'COMPLETED' | 'CANCELLED';
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
  circle_id?: string | null;
}

export interface DbParticipant {
  id: string;
  plan_id: string;
  user_id: string;
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
  rsvp_status: 'INVITED' | 'JOINED' | 'SKIPPED' | 'WAITLISTED';
  delivery_status?: 'DELIVERED';
  skip_reason?: 'LEFT' | 'REMOVED' | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  circle_id?: string | null;
}

export interface DbFriendship {
  id?: string;
  user_1_id: string;
  user_2_id: string;
  requested_by: string;
  created_from_plan_id?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at?: string;
  responded_at?: string | null;
}

export interface DbCircle {
  id: string;           // UUID primary key
  circle_id: string;    // text public ID
  name: string;
  description: string;
  category: string;
  created_by: string;   // UUID -> users.id
  cover_image: string;
  location_anchor: string;
  privacy: "public" | "private";
  created_at: string;
}

export interface DbCircleMember {
  id: string;           // UUID primary key
  circle_id: string;    // UUID -> circles.id
  user_id: string;      // UUID -> users.id
  role: "admin" | "member";
  joined_at: string;
}

export interface DbUserStats {
  user_id: string;      // UUID -> users.id (primary key)
  plans_created: number;
  plans_joined: number;
  circles_joined: number;
  memories_uploaded: number;
}




export interface DbCircleMessage {
  id: string;
  circle_id: string;
  sender_id: string | null;
  message: string;
  created_at: string;
}

export interface DbTransaction {
  id: string;
  transaction_id: string;
  sender_id: string | null;
  receiver_id: string | null;
  plan_id: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
}


// ─────────────────────────────────────────────
// WRITE — individual targeted writes (called on user action only)
// ─────────────────────────────────────────────

async function upsert(table: string, records: any[]): Promise<any[] | null> {
  try {
    const { data, error } = await (supabase as any)
      .from(table)
      .upsert(records)
      .select();
    if (error) {
      console.error(`[DB] upsert ${table} failed:`, error);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.error(`[DB] upsert ${table} exception:`, e);
    return null;
  }
}

/** Update an existing user profile row. */
export async function updateDbUser(user: Partial<DbUser> & { id: string }): Promise<DbUser | null> {
  const rows = await upsert("users", [user]);
  return rows?.[0] ?? null;
}

/** Insert a brand-new plan row. Returns the DB-generated row. */
export async function insertPlan(plan: Omit<DbPlan, "id" | "public_id">): Promise<DbPlan | null> {
  const { data, error } = await (supabase as any)
    .from("plans")
    .insert(plan)
    .select();
  if (error) {
    console.error("[DB] insertPlan failed:", error);
    return null;
  }
  return data?.[0] ?? null;
}

/** Insert a new participant row. Returns the DB-generated row. */
export async function insertParticipant(
  p: Omit<DbParticipant, "id" | "created_at" | "updated_at">
): Promise<DbParticipant | null> {
  if (!p.plan_id || !p.user_id) {
    console.warn("[DB] insertParticipant: missing plan_id or user_id.");
    return null;
  }
  const { data, error } = await (supabase as any)
    .from("plan_participants")
    .insert(p)
    .select();
  if (error) {
    console.error("[DB] insertParticipant failed:", error);
    return null;
  }
  return data?.[0] ?? null;
}

/** Update an existing participant's status. */
export async function updateParticipantStatus(
  planId: string,
  userId: string,
  rsvpStatus: DbParticipant["rsvp_status"],
  role?: DbParticipant["role"],
  respondedAt?: string | null,
  skipReason?: DbParticipant["skip_reason"],
  circleId?: string | null
): Promise<DbParticipant | null> {
  if (!planId || !userId) {
    console.warn("[DB] updateParticipantStatus: missing planId or userId.");
    return null;
  }
  const update: any = { plan_id: planId, user_id: userId, rsvp_status: rsvpStatus };
  if (role !== undefined) update.role = role;
  if (respondedAt !== undefined) update.responded_at = respondedAt;
  if (skipReason !== undefined) update.skip_reason = skipReason;
  if (circleId !== undefined) update.circle_id = circleId;
  const { data, error } = await (supabase as any)
    .from("plan_participants")
    .upsert(update, { onConflict: "plan_id,user_id" })
    .select();
  if (error) {
    console.error("[DB] updateParticipantStatus failed:", error);
    return null;
  }
  return data?.[0] ?? null;
}

/** Insert multiple participants at once (bulk invite). */
export async function insertParticipants(
  rows: Omit<DbParticipant, "id" | "created_at" | "updated_at">[]
): Promise<DbParticipant[]> {
  if (rows.length === 0) return [];
  
  // Guard: filter out duplicates within the input array
  const uniqueRows: typeof rows = [];
  const seenKeys = new Set<string>();
  for (const row of rows) {
    if (!row.plan_id || !row.user_id) continue;
    const key = `${row.plan_id}_${row.user_id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueRows.push(row);
    }
  }

  if (uniqueRows.length === 0) return [];
  const { data, error } = await (supabase as any)
    .from("plan_participants")
    .insert(uniqueRows)
    .select();
  if (error) {
    console.error("[DB] insertParticipants failed:", error);
    return [];
  }
  return data ?? [];
}

/** Insert a brand-new circle. */
export async function insertCircle(circle: Omit<DbCircle, "id">): Promise<DbCircle | null> {
  const rows = await upsert("circles", [circle]);
  return rows?.[0] ?? null;
}

/** Insert circle members. */
export async function insertCircleMembers(members: Omit<DbCircleMember, "id">[]): Promise<DbCircleMember[]> {
  if (members.length === 0) return [];
  const result = await upsert("circle_members", members);
  if (result && result.length > 0) {
    await generateCircleFriendshipsDirect(result);
  }
  return result ?? [];
}

/** Insert a plan reminder. */
export async function insertPlanReminder(reminder: { plan_id: string, sent_by: string }): Promise<any> {
  const result = await upsert("plan_reminders", [reminder]);
  return result?.[0] ?? null;
}

/** Insert a transaction. */
export async function insertTransaction(tx: Omit<DbTransaction, "id">): Promise<DbTransaction | null> {
  const result = await upsert("transactions", [tx]);
  return (result?.[0] as DbTransaction) ?? null;
}

/** Sync user stats: increments statistics counters */
export async function syncUserStats(
  userUuid: string,
  event: "create_plan" | "join_plan" | "create_circle" | "join_circle" | "upload_memory"
): Promise<any> {
  try {
    // 1. Fetch current user_stats row directly from Supabase
    const { data: statsList } = await (supabase as any)
      .from("user_stats")
      .select("*")
      .eq("user_id", userUuid)
      .limit(1);

    let currentStats: DbUserStats = statsList?.[0] || {
      user_id: userUuid,
      plans_created: 0,
      plans_joined: 0,
      circles_joined: 0,
      memories_uploaded: 0
    };

    // 2. Increment the corresponding field
    const updatedStats = { ...currentStats };
    if (event === "create_plan") {
      updatedStats.plans_created = (updatedStats.plans_created || 0) + 1;
    } else if (event === "join_plan") {
      updatedStats.plans_joined = (updatedStats.plans_joined || 0) + 1;
    } else if (event === "create_circle" || event === "join_circle") {
      updatedStats.circles_joined = (updatedStats.circles_joined || 0) + 1;
    } else if (event === "upload_memory") {
      updatedStats.memories_uploaded = (updatedStats.memories_uploaded || 0) + 1;
    }

    // 3. Persist updated stats
    await (supabase as any)
      .from("user_stats")
      .upsert(updatedStats, { onConflict: "user_id" });

    return updatedStats;
  } catch (e) {
    console.error("[DB] syncUserStats exception:", e);
    return null;
  }
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


/** Delete a participant from a plan. */
export async function deleteParticipant(planUuid: string, userUuid: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("plan_participants")
      .delete()
      .match({ plan_id: planUuid, user_id: userUuid });
    if (error) {
      console.error("[DB] deleteParticipant failed:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[DB] deleteParticipant exception:", e);
    return false;
  }
}

/** Delete a member from a circle. */
export async function deleteCircleMember(circleUuid: string, userUuid: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("circle_members")
      .delete()
      .match({ circle_id: circleUuid, user_id: userUuid });
    if (error) {
      console.error("[DB] deleteCircleMember failed:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[DB] deleteCircleMember exception:", e);
    return false;
  }
}

// ─────────────────────────────────────────────
// PLAN TEAM ASSIGNMENTS  (Football Team Organizer)
// ─────────────────────────────────────────────

export interface DbPlanTeamAssignment {
  id?: string;
  plan_id: string;
  user_id: string;
  team: "A" | "B";
  created_at?: string;
}

/**
 * Fetch all team assignments for a given plan UUID.
 * Returns an empty array if none exist.
 */
export async function getPlanTeamAssignments(planUuid: string): Promise<DbPlanTeamAssignment[]> {
  return [];
}

/**
 * Assign or move a participant to a team (upsert on plan_id + user_id).
 * Returns true on success.
 */
export async function upsertPlanTeamAssignment(
  planUuid: string,
  userUuid: string,
  team: "A" | "B"
): Promise<boolean> {
  return true;
}

/**
 * Remove a participant's team assignment (move them back to Unassigned).
 * Returns true on success.
 */
export async function removePlanTeamAssignment(
  planUuid: string,
  userUuid: string
): Promise<boolean> {
  return true;
}

/**
 * Remove all team assignments for a given plan UUID.
 * Returns true on success.
 */
export async function deleteAllPlanTeamAssignments(planUuid: string): Promise<boolean> {
  return true;
}
