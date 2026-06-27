import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const JWT_SECRET = 'sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF_jwt_secret_9988';
function generateToken(userId: string): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const data = `${userId}.${expiry}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

test.describe('Plan Preview Opens', () => {
  const testUserId = `U_${crypto.randomUUID().slice(0, 8)}`;
  const testUserUuid = crypto.randomUUID();
  const testUserPhone = `+91 999${Math.floor(1000000 + Math.random() * 9000000)}`;
  const token = generateToken(testUserUuid);

  test.beforeEach(async ({ page, request }) => {
    // Seed the isolated user
    const userRes = await request.post('/api/db/upsert', {
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
    console.log('[USER UPSERT]', userRes.status(), await userRes.text());

    // Inject active user session with a valid JWT token to bypass onboarding and auth guards
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

    // Ensure a deterministic plan exists in the database by upserting it before navigation
    const planId = `P_PREVIEW_${Date.now()}`;
    
    // Upsert mock test plan
    const planRes = await request.post('/api/db/upsert', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        table: 'plans',
        records: [{
          plan_id: planId,
          title: 'PREVIEW TEST EVENT',
          description: 'E2E test plan for testing previews.',
          created_by: testUserUuid,
          host_id: testUserUuid,
          category: 'custom',
          location: 'Test Arena',
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          created_at: new Date().toISOString()
        }]
      }
    });
    console.log('[PLAN UPSERT]', planRes.status(), await planRes.text());

    const planData = await planRes.json();
    const planUuid = planData.data[0].id;

    // Upsert host participant entry using the generated plan UUID
    await request.post('/api/db/upsert', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        table: 'plan_participants',
        records: [{
          participant_id: `PP_PREVIEW_${Date.now()}`,
          plan_id: planUuid,
          user_id: testUserUuid,
          status: 'new',
          payment_status: 'paid',
          joined_at: new Date().toISOString()
        }]
      }
    });

    page.on('console', msg => {
      console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.log(`[BROWSER EXCEPTION]: ${err.message}`);
    });

    await page.goto('/');
  });

  test('should tap plan card, open DetailedPlanModal, verify title, click back and return to feed', async ({ page }) => {
    // 1. Select the specific test plan card or any plan card in the feed
    const firstCard = page.locator('[id^="plan-card-"]').first();
    await expect(firstCard).toBeVisible();

    // 2. Tap the plan card (DetailedPlanModal Opens)
    await firstCard.click();

    // 3. Verify DetailedPlanModal is visible
    const modal = page.locator('#detailed_plan_modal');
    await expect(modal).toBeVisible();

    // 4. Verify Plan Title is visible inside the modal
    const modalTitle = modal.locator('#immersive-plan-title');
    await expect(modalTitle).toBeVisible();
    const titleText = await modalTitle.innerText();
    expect(titleText.trim()).toBe('PREVIEW TEST EVENT');

    // 5. Click the back button to close modal
    const backBtn = modal.locator('#immersive-plan-back-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // 6. Modal should close and return to Home Feed
    await expect(modal).not.toBeVisible();
    await expect(firstCard).toBeVisible();
  });
});



