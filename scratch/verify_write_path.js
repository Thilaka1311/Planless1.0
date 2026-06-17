async function runAudit() {
  const planId = '782eb8f2-bdd6-4f7e-a185-f4b13c2ceac5'; // FIFA HIGHLIGHTS (Existing Plan)
  const userId = 'cb82b43a-7823-42ef-a1f4-e0f908c0495e'; // Candidate user

  console.log("=== STEP 1: Query initial participant row ===");
  const fetchAllRes = await fetch("http://localhost:3000/api/db/fetch-all");
  const fetchAllJson = await fetchAllRes.json();
  console.log("Raw fetch-all JSON:", fetchAllJson);
  
  const participants = fetchAllJson.data ? fetchAllJson.data.plan_participants : [];
  const participant = participants.find(p => p.plan_id === planId && p.user_id === userId);
  
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

  const writeStartTime = Date.now();
  const upsertRes = await fetch("http://localhost:3000/api/db/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const writeEndTime = Date.now();

  console.log("Supabase API Response Status:", upsertRes.status);
  const upsertJson = await upsertRes.json();
  console.log("Supabase API Response Body:", JSON.stringify(upsertJson, null, 2));

  console.log("\n=== STEP 3: Query the participant row immediately after write ===");
  const postFetchAllRes = await fetch("http://localhost:3000/api/db/fetch-all");
  const postFetchAllJson = await postFetchAllRes.json();
  const postParticipants = postFetchAllJson.data ? postFetchAllJson.data.plan_participants : [];
  const postParticipant = postParticipants.find(p => p.id === participant.id);

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
  await fetch("http://localhost:3000/api/db/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
