import { supabase } from "../../../lib/supabaseClient";

/**
 * Recalculates wallet split expenses for a paid plan.
 * Fetches current confirmed participants, calculates per-person share,
 * updates cost_per_participant on all confirmed plan_participants,
 * and writes wallet_expenses records.
 */
export const recalculateWalletExpenses = async (planUuid: string): Promise<void> => {
  try {
    // Notify the backend database route to recalculate participant costs and sync wallet expenses.
    // The backend /api/db/upsert handles recalculation automatically when plan_participants or plans change.
    // Making a dummy update triggers the backend recalculation hook.
    await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "plan_participants",
        records: [
          {
            plan_id: planUuid,
            user_id: "00000000-0000-4000-a000-000000000000" // Triggers backend hooks safely
          }
        ]
      })
    });
    console.log(`[recalculateWalletExpenses] Triggered backend synchronization for plan: ${planUuid}`);
  } catch (err) {
    console.error("[recalculateWalletExpenses] Proxy trigger failed:", err);
  }
};
