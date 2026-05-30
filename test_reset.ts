import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";

console.log("Supabase URL:", url);
console.log("Supabase Key configured:", !!key);

const client = createClient(url, key);

const tableDeletes = [
  { name: "plan_participants", pk: "participant_id" },
  { name: "transactions", pk: "transaction_id" },
  { name: "memories", pk: "memory_id" },
  { name: "plans", pk: "plan_id" },
  { name: "circle_members", pk: "id" },
  { name: "circles", pk: "circle_id" },
  { name: "users", pk: "user_id" }
];

async function runTest() {
  for (const table of tableDeletes) {
    console.log(`Attempting to truncate ${table.name}...`);
    try {
      const dummyVal = table.pk === "id" ? "00000000-0000-0000-0000-000000000000" : "_nonexistent_";
      const { data, error } = await client.from(table.name).delete().neq(table.pk, dummyVal);
      if (error) {
        console.error(`Error deleting from ${table.name}:`, error);
      } else {
        console.log(`Success truncating ${table.name}!`);
      }
    } catch (err) {
      console.error(`Exception deleting from ${table.name}:`, err);
    }
  }

  console.log("Resetting database sequential ID counters back to U001, C001, etc...");
  try {
    const { error } = await client.rpc("reset_all_sequences");
    if (error) {
      console.error("Error resetting sequences:", error);
    } else {
      console.log("Success resetting sequential counters!");
    }
  } catch (err) {
    console.error("Exception resetting sequences:", err);
  }
}

runTest();
