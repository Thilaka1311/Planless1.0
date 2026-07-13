import { supabase } from "../../../lib/supabaseClient";
import { normalizeFriendshipUsers } from "../utils/normalize";
import { DbCircleMember } from "../../../core/types";

/**
 * Automatically generates accepted friendships for all members belonging to the same circles.
 * This runs when members are successfully inserted into circles.
 */
export async function generateCircleFriendshipsDirect(insertedMembers: DbCircleMember[]): Promise<void> {
  try {
    if (insertedMembers.length === 0) return;

    // Get unique circle IDs from the inserted members
    const circleIds = [...new Set(insertedMembers.map(m => m.circle_id))];
    if (circleIds.length === 0) return;

    // Fetch all current members in these circles and existing friendships from Supabase
    const { data: allMembersData, error: membersError } = await supabase
      .from("circle_members")
      .select("*");
    
    if (membersError || !allMembersData) {
      console.error("[Friendships Service] Failed to fetch circle members:", membersError);
      return;
    }

    const { data: existingFriendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("*");

    if (friendshipsError || !existingFriendships) {
      console.error("[Friendships Service] Failed to fetch existing friendships:", friendshipsError);
      return;
    }

    // Filter to find all members of the circles we care about
    const circleMembers = allMembersData.filter(m => circleIds.includes(m.circle_id));

    // Group members by circle_id
    const membersByCircle: Record<string, string[]> = {};
    circleMembers.forEach(m => {
      if (m.circle_id && m.user_id) {
        if (!membersByCircle[m.circle_id]) {
          membersByCircle[m.circle_id] = [];
        }
        membersByCircle[m.circle_id].push(m.user_id);
      }
    });

    // Generate unique symmetric friendship pairs using canonical ordering
    const newFriendshipsMap = new Map<string, { user_1_id: string; user_2_id: string; requested_by: string; status: 'ACCEPTED' }>();

    Object.values(membersByCircle).forEach(userIds => {
      const uniqueUserIds = [...new Set(userIds)];
      for (let i = 0; i < uniqueUserIds.length; i++) {
        for (let j = i + 1; j < uniqueUserIds.length; j++) {
          const u1 = uniqueUserIds[i];
          const u2 = uniqueUserIds[j];
          if (u1 === u2) continue;
          
          const normalized = normalizeFriendshipUsers(u1, u2);
          const key = `${normalized.user_1_id}_${normalized.user_2_id}`;
          
          newFriendshipsMap.set(key, {
            user_1_id: normalized.user_1_id,
            user_2_id: normalized.user_2_id,
            requested_by: normalized.user_1_id,
            status: "ACCEPTED"
          });
        }
      }
    });

    // Filter out friendships that already exist in the database (canonical match)
    const friendshipsToInsert = Array.from(newFriendshipsMap.values()).filter(f => {
      return !existingFriendships.some(ef => ef.user_1_id === f.user_1_id && ef.user_2_id === f.user_2_id);
    });

    if (friendshipsToInsert.length > 0) {
      
      const { error: insertError } = await supabase
        .from("friendships")
        .insert(friendshipsToInsert);
      
      if (insertError) {
        console.error("[Friendships Service] Error inserting friendships:", insertError);
      }
    }
  } catch (err) {
    console.error("[Friendships Service] Failed to generate circle friendships:", err);
  }
}



/**
 * Removes an existing friendship.
 */
export async function removeFriendship(uuidA: string, uuidB: string) {
  const normalized = normalizeFriendshipUsers(uuidA, uuidB);
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_1_id", normalized.user_1_id)
    .eq("user_2_id", normalized.user_2_id);

  if (error) throw error;
  return true;
}

/**
 * Synchronizes accepted friendships between a joining user and all existing
 * active participants in a plan.
 * This is idempotent — calling it multiple times with the same pair is safe.
 * Uses upsert with conflict target to prevent duplicate rows.
 *
 * @param joiningUserUuid - The UUID of the user who just joined/rejoined
 * @param planUuid        - The UUID of the plan they joined
 */
export async function syncPlanFriendships(joiningUserUuid: string, planUuid: string): Promise<void> {
  try {
    // 1. Fetch all participants of the plan that have an active going/waitlist status
    const { data: participants, error: partError } = await supabase
      .from("plan_participants")
      .select("user_id, rsvp_status")
      .eq("plan_id", planUuid);

    if (partError || !participants) {
      console.error("[syncPlanFriendships] Failed to fetch plan participants:", partError);
      return;
    }

    // 2. Get participant UUIDs — skip the joining user
    const otherParticipantUuids = participants
      .filter(p => p.user_id && p.user_id !== joiningUserUuid)
      .map(p => p.user_id as string);

    if (otherParticipantUuids.length === 0) return;

    // 3. Fetch existing friendships that involve the joining user to avoid duplicates
    const { data: existingFriendships, error: friendsError } = await supabase
      .from("friendships")
      .select("user_1_id, user_2_id")
      .or(`user_1_id.eq.${joiningUserUuid},user_2_id.eq.${joiningUserUuid}`);

    if (friendsError) {
      console.error("[syncPlanFriendships] Failed to fetch existing friendships:", friendsError);
      return;
    }

    const existingSet = new Set<string>(
      (existingFriendships || []).map(f => `${f.user_1_id}_${f.user_2_id}`)
    );

    // 4. Build list of new friendships to insert
    const friendshipsToInsert: {
      user_1_id: string;
      user_2_id: string;
      requested_by: string;
      status: "ACCEPTED";
      created_from_plan_id: string | null;
    }[] = [];

    for (const otherUuid of otherParticipantUuids) {
      const normalized = normalizeFriendshipUsers(joiningUserUuid, otherUuid);
      const key = `${normalized.user_1_id}_${normalized.user_2_id}`;
      if (!existingSet.has(key)) {
        friendshipsToInsert.push({
          user_1_id: normalized.user_1_id,
          user_2_id: normalized.user_2_id,
          requested_by: joiningUserUuid,
          status: "ACCEPTED",
          created_from_plan_id: planUuid
        });
        existingSet.add(key); // prevent duplicates within this batch
      }
    }

    if (friendshipsToInsert.length === 0) {
      
      return;
    }

    
    const { error: insertError } = await supabase
      .from("friendships")
      .insert(friendshipsToInsert);

    if (insertError) {
      console.error("[syncPlanFriendships] Error inserting plan friendships:", insertError);
    }
  } catch (err) {
    console.error("[syncPlanFriendships] Unexpected error:", err);
  }
}
