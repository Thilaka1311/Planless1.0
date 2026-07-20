import { supabase } from "../../../../lib/supabaseClient";

export async function getCurrentUserPlans(activeUserUuid: string): Promise<any[]> {
  // Phase 1 - Query A: Fetch plans where host_id = activeUserUuid
  const { data: hostedData, error: hostedError } = await supabase
    .from("plans")
    .select("id")
    .eq("host_id", activeUserUuid);
  if (hostedError) throw hostedError;

  // Phase 1 - Query B: Fetch participant rows where user_id = activeUserUuid
  const { data: partData, error: partError } = await supabase
    .from("plan_participants")
    .select("plan_id")
    .eq("user_id", activeUserUuid);
  if (partError) throw partError;

  // Phase 1 - Merge
  const hostedPlanIds = (hostedData || []).map(p => p.id);
  const participantPlanIds = (partData || []).map(p => p.plan_id);
  const allPlanIds = Array.from(new Set([...hostedPlanIds, ...participantPlanIds])).filter(Boolean);

  if (allPlanIds.length === 0) {
    return [];
  }

  // Phase 2 - Fetch Plans
  const { data: plansData, error: plansError } = await supabase
    .from("plans")
    .select(`
      *,
      host_profile:users!plans_host_id_fkey(id, public_id, full_name, profile_photo_path, bio),
      discovery_items(category, subcategory)
    `)
    .in("id", allPlanIds);

  if (plansError) throw plansError;
  const plans = plansData || [];

  // Phase 3 - Fetch Participants
  const { data: participantsData, error: participantsError } = await supabase
    .from("plan_participants")
    .select(`
      *,
      user_profile:users(id, public_id, full_name, bio)
    `)
    .in("plan_id", allPlanIds);

  if (participantsError) throw participantsError;
  const participants = participantsData || [];

  // Phase 4 - Merge
  const participantsByPlanId: Record<string, any[]> = {};
  participants.forEach(p => {
    if (!participantsByPlanId[p.plan_id]) {
      participantsByPlanId[p.plan_id] = [];
    }
    participantsByPlanId[p.plan_id].push(p);
  });

  return plans.map(plan => ({
    ...plan,
    plan_participants: participantsByPlanId[plan.id] || []
  }));
}

export async function createPlan(newDbPlan: any): Promise<any> {
  const { data, error } = await supabase
    .from("plans")
    .insert(newDbPlan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createPlanInvite(planId: string, inviteToken: string, createdBy: string): Promise<void> {
  const { error } = await supabase
    .from("plan_invites")
    .insert({
      plan_id: planId,
      invite_token: inviteToken,
      created_by: createdBy,
      is_active: true
    });

  if (error) throw error;
}

export async function upsertParticipants(records: any[]): Promise<any[]> {
  const { data, error } = await supabase
    .from("plan_participants")
    .upsert(records, { onConflict: "plan_id,user_id" })
    .select();

  if (error) throw error;
  return (data || []) as any[];
}

export async function fetchMemories(): Promise<any[]> {
  const { data, error } = await supabase
    .from("memories")
    .select("*");

  if (error) throw error;
  return (data || []) as any[];
}

export async function updatePlanDetails(planId: string, updates: any): Promise<any> {
  const { data, error } = await supabase
    .from("plans")
    .update(updates)
    .eq("id", planId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFreshParticipants(): Promise<any[]> {
  const { data, error } = await supabase
    .from("plan_participants")
    .select("*");

  if (error) throw error;
  return (data || []) as any[];
}
