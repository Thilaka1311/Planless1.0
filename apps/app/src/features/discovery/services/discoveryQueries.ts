import { supabase } from "../../../lib/supabaseClient";

/**
 * Fetch active sections with nested active items, ordered by display_order.
 */
export async function fetchActiveSectionsWithItems() {
  const { data, error } = await (supabase as any)
    .from("discovery_sections")
    .select(`
      *,
      discovery_items (
        *
      )
    `)
    .eq("status", "ACTIVE")
    .eq("discovery_items.status", "ACTIVE")
    .order("display_order", { ascending: true })
    .order("display_order", { foreignTable: "discovery_items", ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch all discovery items (active/inactive) ordered by created_at descending.
 */
export async function fetchAllItems() {
  const { data, error } = await (supabase as any)
    .from("discovery_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new discovery item.
 */
export async function insertItem(record: Record<string, any>) {
  const { data, error } = await (supabase as any)
    .from("discovery_items")
    .insert([record])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing discovery item.
 */
export async function updateItem(id: string, record: Record<string, any>) {
  const { data, error } = await (supabase as any)
    .from("discovery_items")
    .update(record)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft-delete a discovery item.
 */
export async function deleteItem(id: string) {
  const { data, error } = await (supabase as any)
    .from("discovery_items")
    .update({ status: "INACTIVE" })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}
