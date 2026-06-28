import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function run() {
  const url = process.env.VITE_SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || "";
  const client = createClient(url, key);
  
  const { data: plans, error } = await client.from("plans").select("*").limit(1);
  if (plans && plans.length > 0) {
    console.log("Plans columns:", Object.keys(plans[0]));
  } else {
    console.log("No plans found to inspect columns. Error:", error);
  }
}
run();
