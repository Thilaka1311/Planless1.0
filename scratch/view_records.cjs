const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";

const client = createClient(url, key);

async function run() {
  try {
    const { data: plans } = await client.from("plans").select("*");
    const { data: participants } = await client.from("plan_participants").select("*");
    const { data: users } = await client.from("users").select("*");

    console.log("=== USERS ===");
    users.forEach(u => console.log(`User: ${u.full_name} | ID: ${u.id} | user_id: ${u.user_id}`));

    console.log("\n=== PLANS ===");
    plans.forEach(p => console.log(`Plan: ${p.title} | ID: ${p.id} | plan_id: ${p.plan_id} | datetime: ${p.datetime} | deadline: ${p.response_deadline_at}`));

    console.log("\n=== PARTICIPANTS ===");
    participants.forEach(pp => console.log(`Participant: ${pp.participant_id} | plan_id: ${pp.plan_id} | user_id: ${pp.user_id} | status: ${pp.status}`));

  } catch (err) {
    console.error(err);
  }
}

run();
