// scratch/test_waitlist_write.ts
import "dotenv/config";
import { generateToken } from "../middleware/auth";

const baseUrl = "http://localhost:3000";

async function runTest() {
  console.log("=== STARTING AUTHENTICATED WAITLIST PERSISTENCE TEST ===");

  const testUserUuid = "bd1d2147-5509-4254-b09a-de7127d69b41"; // bhaavya
  const token = generateToken(testUserUuid);
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // 1. Fetch snapshot to get active participants
  console.log("\n[1] Fetching active snapshot...");
  const snapshotRes = await fetch(`${baseUrl}/api/db/fetch-all`, { headers });
  if (!snapshotRes.ok) {
    console.error("Failed to fetch database snapshot. Status:", snapshotRes.status, await snapshotRes.text());
    return;
  }
  const snapshot = await snapshotRes.json() as any;
  const participant = snapshot.data?.plan_participants?.[0];

  if (!participant) {
    console.error("No participant rows found in database to test updating.");
    return;
  }

  console.log(`Found active participant: ID=${participant.id}, Current Status=${participant.status}, Plan ID=${participant.plan_id}, User ID=${participant.user_id}`);

  // 2. Perform waitlist write by ID (simulating updateParticipantStatus)
  const payload = {
    id: participant.id,
    status: "waitlist",
    payment_status: "unpaid",
    waitlisted_at: new Date().toISOString()
  };

  console.log("\n[2] Executing waitlist update mutation to API (simulating updateParticipantStatus)...");
  console.log("[WAITLIST WRITE] START", payload);

  const upsertRes = await fetch(`${baseUrl}/api/db/upsert`, {
    method: "POST",
    headers,
    body: JSON.stringify({ table: "plan_participants", records: [payload] })
  });

  if (!upsertRes.ok) {
    console.error("[WAITLIST WRITE] FAILED", await upsertRes.text());
    return;
  }

  const result = await upsertRes.json() as any;
  console.log("[WAITLIST WRITE] SUCCESS", result);

  // 3. Verify database row directly in Supabase
  console.log("\n[3] Fetching latest snapshot to verify status is waitlist...");
  const verifyRes = await fetch(`${baseUrl}/api/db/fetch-all`, { headers });
  const verifySnapshot = await verifyRes.json() as any;
  const updatedParticipant = verifySnapshot.data?.plan_participants?.find((p: any) => p.id === participant.id);

  console.log("Updated participant row after write & refresh:", updatedParticipant);

  if (updatedParticipant && updatedParticipant.status === "waitlist") {
    console.log("\n=== TEST PASSED: Waitlist status successfully written & persisted ===");
  } else {
    console.error("\n=== TEST FAILED: Waitlist status was not persisted correctly ===");
  }
}

runTest();
