import "dotenv/config";
import { generateToken } from "../middleware/auth";

const baseUrl = "http://localhost:3000";

async function runAudit() {
  const planId = '782eb8f2-bdd6-4f7e-a185-f4b13c2ceac5'; // FIFA HIGHLIGHTS
  const userId = 'cb82b43a-7823-42ef-a1f4-e0f908c0495e'; // Candidate user
  
  const token = generateToken(userId);
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  console.log("=== STEP 1: Query initial participant row ===");
  const fetchAllRes = await fetch(`${baseUrl}/api/db/fetch-all`, { headers });
  if (!fetchAllRes.ok) {
    console.error("Failed to fetch database snapshot. Status:", fetchAllRes.status, await fetchAllRes.text());
    return;
  }
  const fetchAllJson = await fetchAllRes.json() as any;
  const participants = fetchAllJson.data?.plan_participants || [];
  const participant = participants.find((p: any) => p.plan_id === planId && p.user_id === userId);
  
  if (!participant) {
    console.error("Target participant not found in database.");
    return;
  }

  console.log("Initial Participant Record:", {
    id: participant.id,
    plan_id: participant.plan_id,
    user_id: participant.user_id,
    status: participant.status,
    payment_status: participant.payment_status
  });

  const originalStatus = participant.status;
  const targetStatus = originalStatus === 'seen' ? 'waitlist' : 'seen';

  console.log("\n=== STEP 2: Capture API request payload & Perform write ===");
  const payload = {
    table: 'plan_participants',
    records: [{
      id: participant.id,
      status: targetStatus,
      payment_status: 'unpaid'
    }]
  };
  console.log("API Request Payload:", JSON.stringify(payload, null, 2));

  const upsertRes = await fetch(`${baseUrl}/api/db/upsert`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  console.log("Supabase API Response Status:", upsertRes.status);
  const upsertJson = await upsertRes.json() as any;
  console.log("Supabase API Response Body:", JSON.stringify(upsertJson, null, 2));

  console.log("\n=== STEP 3: Query the participant row immediately after write ===");
  const postFetchAllRes = await fetch(`${baseUrl}/api/db/fetch-all`, { headers });
  const postFetchAllJson = await postFetchAllRes.json() as any;
  const postParticipants = postFetchAllJson.data?.plan_participants || [];
  const postParticipant = postParticipants.find((p: any) => p.id === participant.id);

  console.log("Immediate Post-Write Participant Record:", {
    id: postParticipant.id,
    plan_id: postParticipant.plan_id,
    user_id: postParticipant.user_id,
    status: postParticipant.status,
    payment_status: postParticipant.payment_status
  });

  const didChange = postParticipant.status === targetStatus;
  console.log(`\nDid the database row change BEFORE refresh? ${didChange ? "YES" : "NO"}`);

  // Restore state
  console.log("\n=== RESTORING ORIGINAL STATUS ===");
  await fetch(`${baseUrl}/api/db/upsert`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      table: 'plan_participants',
      records: [{
        id: participant.id,
        status: originalStatus,
        payment_status: participant.payment_status
      }]
    })
  });
  console.log("Restoration complete.");
}

runAudit().catch(console.error);
