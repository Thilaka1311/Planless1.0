import { supabase } from "../../../../lib/supabaseClient";

const BASE_URL = "https://planless.app";

export interface PlanInviteRecord {
  id: string;
  plan_id: string;
  invite_token: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Returns the full sharable invite URL for a plan.
 */
export function buildInviteUrl(inviteToken: string): string {
  return `${BASE_URL}/join/${inviteToken}`;
}

/**
 * Retrieves the active invite token for a given plan.
 * If none exists, creates one.
 */
export async function getOrCreatePlanInvite(
  planUuid: string,
  createdByUuid: string
): Promise<PlanInviteRecord | null> {
  // Check if an active invite already exists
  const { data: existing, error: fetchError } = await supabase
    .from("plan_invites")
    .select("*")
    .eq("plan_id", planUuid)
    .eq("is_active", true)
    .maybeSingle();

  if (fetchError) {
    console.error("[planInviteService] Error fetching invite:", fetchError);
    return null;
  }

  if (existing) return existing as PlanInviteRecord;

  // Create a new invite token
  const newToken = crypto.randomUUID().replace(/-/g, "");
  const { data: created, error: insertError } = await supabase
    .from("plan_invites")
    .insert({
      plan_id: planUuid,
      invite_token: newToken,
      created_by: createdByUuid,
      is_active: true
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("[planInviteService] Error creating invite:", insertError);
    return null;
  }

  return created as PlanInviteRecord;
}

/**
 * Resolves an invite token and returns the corresponding plan_id.
 * Returns null if the token is invalid or inactive.
 */
export async function resolveInviteToken(
  token: string
): Promise<{ plan_id: string; invite_id: string } | null> {
  const { data, error } = await supabase
    .from("plan_invites")
    .select("id, plan_id, is_active")
    .eq("invite_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    console.warn("[planInviteService] Invalid or inactive invite token:", token, error);
    return null;
  }

  return { plan_id: data.plan_id, invite_id: data.id };
}
