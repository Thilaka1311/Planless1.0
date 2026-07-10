import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const JWT_SECRET = 'sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF_jwt_secret_9988';
function generateToken(userId: string): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const data = `${userId}.${expiry}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

test.describe('Chat Navigation Back', () => {
  const testUserId = `U_${crypto.randomUUID().slice(0, 8)}`;
  const testUserUuid = crypto.randomUUID();
  const testUserPhone = `+91 999${Math.floor(1000000 + Math.random() * 9000000)}`;
  const token = generateToken(testUserUuid);

  test('should navigate to plan chat and return to plan preview on back press', async ({ page, request }) => {
    // 0. Seed the isolated user
    await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'users',
        records: [{
          id: testUserUuid,
          user_id: testUserId,
          full_name: 'VR Thilaka Sundar',
          username: 'thilaka_sundar',
          phone_number: testUserPhone,
          college_or_work: 'SRM Chennai',
          wallet_balance: 0,
          active_status: true
        }]
      }
    });

    // 1. Inject active user session with a valid JWT token
    await page.addInitScript(({ token, testUserId, testUserUuid, testUserPhone }) => {
      window.localStorage.setItem('planless_active_user_default', JSON.stringify({
        name: "VR Thilaka Sundar",
        phone: testUserPhone,
        bio: "Always spontaneous, never planless • Looking for movies/football.",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VR",
        joined: true,
        college_or_work: "SRM Chennai",
        user_id: testUserId,
        dbUuid: testUserUuid,
        token: token
      }));
      window.localStorage.setItem('planless_active_tab', 'home');
    }, { token, testUserId, testUserUuid, testUserPhone });

    // 2. Ensure a deterministic plan exists in the database by upserting it before navigation
    const planId = `P_CHAT_NAV_${Date.now()}`;
    const planRes = await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'plans',
        records: [{
          plan_id: planId,
          title: 'CHAT NAV TEST EVENT',
          description: 'E2E test plan for verifying chat back button.',
          created_by: testUserUuid,
          host_id: testUserUuid,
          category: 'custom',
          circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
          location: 'Test Area',
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          created_at: new Date().toISOString()
        }]
      }
    });

    const planData = await planRes.json();
    const planUuid = planData.data[0].id;

    // 3. Upsert participant status as 'new' to ensure visibility in feed
    await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'plan_participants',
        records: [{
          plan_id: planUuid,
          user_id: testUserUuid,
          role: 'HOST',
          rsvp_status: 'JOINED',
          responded_at: new Date().toISOString()
        }]
      }
    });

    // Ensure the test user is a member of the circle 'c2e4a106-bc73-44c1-b52b-eec759c6eadf'
    await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'circle_members',
        records: [{
          circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
          user_id: testUserUuid,
          role: 'host',
          joined_at: new Date().toISOString()
        }]
      }
    });

    // 4. Set up logging
    page.on('console', msg => {
      console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.log(`[BROWSER EXCEPTION]: ${err.message}`);
    });

    // 5. Navigate to Home
    await page.goto('/');

    // 5. Select the newly created plan card in the feed and click it
    const planCard = page.locator('[id^="plan-card-"]').filter({ hasText: 'CHAT NAV TEST EVENT' }).first();
    await expect(planCard).toBeVisible();
    await planCard.click();

    // 6. Verify DetailedPlanModal is visible
    const modal = page.locator('#detailed_plan_modal');
    await expect(modal).toBeVisible();

    // 7. Verify Open Chat button is visible and click it
    const openChatBtn = modal.locator('#immersive-open-chat-btn');
    await expect(openChatBtn).toBeVisible();
    await openChatBtn.click();

    // 8. Verify the chat overlay screen is open and active
    const chatHeader = page.locator('#plan-chat-header-overlay');
    await expect(chatHeader).toBeVisible();

    // 9. Click the back button inside the plan chat header
    const chatBackBtn = chatHeader.locator('button').first();
    await expect(chatBackBtn).toBeVisible();
    await chatBackBtn.click();

    // 10. Verify we returned to the plan preview modal (instead of general Circle Chat/Hub or Home Feed)
    await expect(modal).toBeVisible();
    await expect(modal.locator('#immersive-plan-title')).toHaveText('CHAT NAV TEST EVENT');
  });
});
