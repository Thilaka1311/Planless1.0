import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "/Users/thilak/Documents/Planless/Planless Repo /Planless-2.0/.env" });

const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";

const client = createClient(url, key);

async function main() {
  const tables = [
    "users",
    "circles",
    "circle_members",
    "plans",
    "plan_participants",
    "transactions",
    "memories",
    "memory_results",
    "memory_attendees",
    "plan_outcomes",
    "user_stats",
    "notifications",
    "user_data",
    "plan_reminders",
    "friendships",
    "plan_team_assignments"
  ];
  for (const t of tables) {
    const { error } = await client.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t} ERROR:`, error.message);
    } else {
      console.log(`Table ${t} OK`);
    }
  }
}
main().catch(console.error);
