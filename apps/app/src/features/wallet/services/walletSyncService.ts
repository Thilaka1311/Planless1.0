import { supabase } from "../../../lib/supabaseClient";

/**
 * Recalculates wallet split expenses for a paid plan.
 * Calls the dedicated backend recalculate-wallet route which triggers
 * recalculatePlanParticipantsCosts() without inserting fake participant rows.
 */
export const recalculateWalletExpenses = async (planUuid: string): Promise<void> => {
  try {
    await fetch("/api/db/recalculate-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planUuid })
    });
    
  } catch (err) {
    console.error("[recalculateWalletExpenses] Proxy trigger failed:", err);
  }
};
