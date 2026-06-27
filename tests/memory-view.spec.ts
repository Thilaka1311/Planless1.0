import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const JWT_SECRET = 'sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF_jwt_secret_9988';
function generateToken(userId: string): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const data = `${userId}.${expiry}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

test.describe('Memory Opens Correctly', () => {
  const testUserId = `U_${crypto.randomUUID().slice(0, 8)}`;
  const testUserUuid = crypto.randomUUID();
  const testUserPhone = `+91 999${Math.floor(1000000 + Math.random() * 9000000)}`;
  const token = generateToken(testUserUuid);

  test.beforeEach(async ({ page, request }) => {
    page.on('console', msg => {
      console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.log(`[BROWSER EXCEPTION]: ${err.message}`);
    });

    // 1. Align user full_name in the database to 'Thilaka Sundar' to match application hardcoding (myKey)
    await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'users',
        records: [{
          id: testUserUuid,
          user_id: testUserId,
          full_name: 'Thilaka Sundar',
          username: 'thilaka_sundar',
          phone_number: testUserPhone,
          college_or_work: 'SRM Chennai',
          wallet_balance: 0,
          active_status: true
        }]
      }
    });

    // 2. Inject active user session with 'Thilaka Sundar'
    await page.addInitScript(({ token, testUserId, testUserUuid, testUserPhone }) => {
      window.localStorage.setItem('planless_active_user_default', JSON.stringify({
        name: "Thilaka Sundar",
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
  });

  async function seedCompletedPlan(request, { category, title, activityType = null, outcomes }) {
    const planId = `P_MEM_VIEW_${category.toUpperCase()}_${crypto.randomUUID()}`;
    const uniqueTitle = `${title} ${crypto.randomUUID().slice(0, 8)}`;

    // 1. Seed a mock friend user to act as participant
    const rand = crypto.randomUUID().slice(0, 8);
    const friendRes = await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'users',
        records: [{
          user_id: `U_FRIEND_${rand}`,
          username: `friend_${rand}`,
          full_name: 'E2E Mock Friend',
          phone_number: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
          college_or_work: 'SRM Chennai',
          wallet_balance: 0,
          active_status: true,
          created_at: new Date().toISOString()
        }]
      }
    });
    const friendData = await friendRes.json();
    const friendUuid = friendData.data[0].id;

    // 2. Upsert completed plan record
    const planRes = await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'plans',
        records: [{
          plan_id: planId,
          title: uniqueTitle,
          description: `Seeded completed plan for ${category}.`,
          created_by: testUserUuid,
          host_id: testUserUuid,
          category: category,
          circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
          activity_type: activityType || null,
          location: 'Test Arena',
          datetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }]
      }
    });
    const planData = await planRes.json();
    const planUuid = planData.data[0].id;

    // 3. Upsert user participant status as 'going'
    await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'plan_participants',
        records: [
          {
            participant_id: `PP_USER_${crypto.randomUUID()}`,
            plan_id: planUuid,
            user_id: testUserUuid,
            status: 'going',
            payment_status: 'paid',
            joined_at: new Date().toISOString()
          },
          {
            participant_id: `PP_FRIEND_${crypto.randomUUID()}`,
            plan_id: planUuid,
            user_id: friendUuid,
            status: 'going',
            payment_status: 'paid',
            joined_at: new Date().toISOString()
          }
        ]
      }
    });

    // 4. Seed Outcomes
    const outcomesRecords = outcomes.map(o => {
      const payload = { ...o.payload };
      if (payload.mvp_user_id === 'user') {
        payload.mvp_user_id = testUserUuid;
      }
      return {
        id: crypto.randomUUID(),
        plan_id: planUuid,
        submitted_by_user_id: o.submitted_by_user_id === 'user' ? testUserUuid : friendUuid,
        outcome_type: o.outcome_type,
        payload: payload,
        created_at: new Date().toISOString()
      };
    });

    if (outcomesRecords.length > 0) {
      await request.post('/api/db/upsert', {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
          table: 'plan_outcomes',
          records: outcomesRecords
        }
      });
    }

    return { planUuid, uniqueTitle, friendUuid };
  }

  test('should display completed Football memory scores and MVP correctly', async ({ page, request }) => {
    const { uniqueTitle } = await seedCompletedPlan(request, {
      category: 'sports',
      activityType: 'football',
      title: 'FOOTBALL MEM VIEW',
      outcomes: [
        {
          outcome_type: 'stats',
          submitted_by_user_id: 'user',
          payload: { teamAScore: 5, teamBScore: 3 }
        },
        {
          outcome_type: 'mvp_vote',
          submitted_by_user_id: 'user',
          payload: { mvp_user_id: 'user' }
        }
      ]
    });

    await page.goto('/');
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();

    // Click profile settings avatar
    await page.locator('[aria-label="View Profile Settings"]').click();

    // Wait for profile screen to render memories header
    await expect(page.locator('h3:has-text("MEMORIES")')).toBeVisible();

    // Find and click our seeded completed Football memory card
    const memoryCard = page.locator('h4', { hasText: uniqueTitle }).first();
    await expect(memoryCard).toBeVisible();
    await memoryCard.click();

    // Verify MemoryScreen shows
    await expect(page.locator('#completed_hero_card')).toBeVisible();
    await expect(page.locator('h1', { hasText: uniqueTitle })).toBeVisible();

    // Verify Football Score matches (5 - 3) using exact text matching
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(page.locator('text=Team A Victory')).toBeVisible();

    // Verify MVP vote display
    await expect(page.locator('text=Your MVP Vote')).toBeVisible();
    await expect(page.locator('div:has(> div > h3:has-text("Your MVP Vote"))').getByText('Thilaka Sundar', { exact: true })).toBeVisible();

    // Go back to profile screen
    await page.locator('#back_to_plans_btn').click();
    await expect(page.locator('h3:has-text("MEMORIES")')).toBeVisible();
  });

  test('should display completed Movies memory rating and review correctly', async ({ page, request }) => {
    const reviewText = "A masterpiece of modern sci-fi! Must watch.";
    const { uniqueTitle } = await seedCompletedPlan(request, {
      category: 'movies',
      title: 'MOVIE MEM VIEW',
      outcomes: [
        {
          outcome_type: 'review',
          submitted_by_user_id: 'user',
          payload: { rating: 5, review: reviewText }
        }
      ]
    });

    await page.goto('/');
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();

    await page.locator('[aria-label="View Profile Settings"]').click();
    await expect(page.locator('h3:has-text("MEMORIES")')).toBeVisible();

    const memoryCard = page.locator('h4', { hasText: uniqueTitle }).first();
    await expect(memoryCard).toBeVisible();
    await memoryCard.click();

    // Verify MemoryScreen shows
    await expect(page.locator('#completed_hero_card')).toBeVisible();
    await expect(page.locator('h1', { hasText: uniqueTitle })).toBeVisible();

    // Verify Movie review layout
    await expect(page.locator('text=Cinema Verdict')).toBeVisible();
    await expect(page.locator('text=Your logged review')).toBeVisible();
    await expect(page.getByText(reviewText)).toBeVisible();

    await page.locator('#back_to_plans_btn').click();
    await expect(page.locator('h3:has-text("MEMORIES")')).toBeVisible();
  });
});
