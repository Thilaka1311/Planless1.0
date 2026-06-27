import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "/Users/thilak/Documents/Planless/Planless Repo /Planless-2.0/.env" });

import { mapPlansToLegacyPlans } from "../apps/app/src/lib/mappers";

const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";

const client = createClient(url, key);

async function main() {
  const { data: users } = await client.from("users").select("*");
  const { data: plans } = await client.from("plans").select("*");
  const { data: participants } = await client.from("plan_participants").select("*");
  const { data: circles } = await client.from("circles").select("*");

  console.log("=== RAW SUPABASE PLAN SAMPLE ===");
  console.log(plans?.[0]);

  console.log("=== RAW SUPABASE PARTICIPANT SAMPLE ===");
  console.log(participants?.[0]);

  console.log("=== RAW SUPABASE USER SAMPLE ===");
  console.log(users?.[0]);

  const activeUserId = users?.[0]?.id || "";
  const mappedPlans = mapPlansToLegacyPlans(plans || [], participants || [], users || [], activeUserId, circles || []);

  console.log("=== MAPPED PLAN SAMPLE (STORE / PLAN CARD INCOMING) ===");
  console.log(JSON.stringify(mappedPlans[0], null, 2));
}

main().catch(console.error);
