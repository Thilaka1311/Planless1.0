const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "/Users/thilak/Documents/Planless/Planless Repo /Planless-2.0/.env" });

const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";

const client = createClient(url, key);

async function main() {
  const { data: users } = await client.from("users").select("*");
  const { data: plans } = await client.from("plans").select("*");
  const { data: participants } = await client.from("plan_participants").select("*");

  console.log("=== RAW PLAN ===");
  console.log(plans[0]);

  console.log("=== SEARCHING HOST FOR PLAN ===");
  const hostIdVal = plans[0].host_id;
  console.log("Host ID in Plan:", hostIdVal);
  
  const creator = users.find(u => u.id === hostIdVal || u.user_id === hostIdVal);
  console.log("Found Host User:", creator ? { id: creator.id, user_id: creator.user_id, full_name: creator.full_name } : "null");

  console.log("=== SEARCHING PARTICIPANTS ===");
  const planParts = participants.filter(pp => pp.plan_id === plans[0].id);
  console.log("Participants count:", planParts.length);
  for (const pp of planParts) {
    const u = users.find(user => user.id === pp.user_id || user.user_id === pp.user_id);
    console.log(`Participant user_id: ${pp.user_id} -> Name: ${u ? u.full_name : "NOT FOUND"}`);
  }
}

main().catch(console.error);
