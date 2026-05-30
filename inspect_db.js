import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";

console.log("Connecting to Supabase URL:", url);

const client = createClient(url, key);

const tables = [
  "users",
  "circles",
  "circle_members",
  "plans",
  "plan_participants",
  "transactions",
  "memories"
];

async function inspect() {
  for (const table of tables) {
    console.log(`\n--- Inspecting [${table}] ---`);
    try {
      const { data, error } = await client.from(table).select("*").limit(3);
      if (error) {
        console.error(`Error querying ${table}:`, error.message, "Code:", error.code, "Details:", error.details);
      } else {
        console.log(`Query successful! Record count retrieved: ${data.length}`);
        if (data.length > 0) {
          console.log("Sample record:", JSON.stringify(data[0], null, 2));
        } else {
          console.log("Table is empty.");
        }
      }
    } catch (err) {
      console.error(`Exception querying ${table}:`, err);
    }
  }
}

inspect();
