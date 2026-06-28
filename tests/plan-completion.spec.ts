import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const JWT_SECRET = 'sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF_jwt_secret_9988';
function generateToken(userId: string): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const data = `${userId}.${expiry}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

test.describe('Plan Completion Creates Memory', () => {
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

    // Seed the isolated user
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

    // Inject active user session
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
  });

  async function seedPlanAndNavigate(request, category: string, title: string, subcategory: string | null = null) {
    // Generate completely unique plan_id for parallel worker runs
    const planId = `P_COMP_${category.toUpperCase()}_${crypto.randomUUID()}`;
    
    // 1. Seed a mock friend user to act as a "going" participant for MVP selection
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
    if (!friendRes.ok()) {
      console.error(`[FRIEND UPSERT FAIL] Status: ${friendRes.status()} Body: ${await friendRes.text()}`);
      throw new Error(`Friend user upsert failed`);
    }
    const friendData = await friendRes.json();
    const friendUuid = friendData.data[0].id;
    
    const uniqueTitle = `${title} ${crypto.randomUUID().slice(0, 8)}`;

    // 2. Upsert the plan record
    const planRes = await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'plans',
        records: [{
          plan_id: planId,
          title: uniqueTitle,
          description: `E2E test plan for completing a ${category} event.`,
          created_by: testUserUuid,
          host_id: testUserUuid,
          category: category,
          circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
          activity_type: subcategory ? subcategory.toLowerCase() : null, // DB expects lowercase activity_type
          location: 'Test Arena',
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          created_at: new Date().toISOString()
        }]
      }
    });

    if (!planRes.ok()) {
      console.error(`[PLAN UPSERT FAIL] Status: ${planRes.status()} Body: ${await planRes.text()}`);
      throw new Error(`Plan upsert failed with status ${planRes.status()}`);
    }

    const planData = await planRes.json();
    const planUuid = planData.data[0].id;

    // 3. Upsert host participant status as 'new' to ensure visibility in home feed
    const hostPpRes = await request.post('/api/db/upsert', {
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
    if (!hostPpRes.ok()) {
      console.error(`[HOST PP UPSERT FAIL] Status: ${hostPpRes.status()} Body: ${await hostPpRes.text()}`);
      throw new Error(`Host participant upsert failed`);
    }

    // 4. Upsert friend participant status as 'going' to ensure they appear in the completion MVP list
    const friendPpRes = await request.post('/api/db/upsert', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        table: 'plan_participants',
        records: [{
          plan_id: planUuid,
          user_id: friendUuid,
          role: 'PARTICIPANT',
          rsvp_status: 'JOINED',
          responded_at: new Date().toISOString()
        }]
      }
    });
    if (!friendPpRes.ok()) {
      console.error(`[FRIEND PP UPSERT FAIL] Status: ${friendPpRes.status()} Body: ${await friendPpRes.text()}`);
      throw new Error(`Friend participant upsert failed`);
    }

    // Ensure the test user is a member of the circle 'c2e4a106-bc73-44c1-b52b-eec759c6eadf'
    const circleMemberRes = await request.post('/api/db/upsert', {
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
    if (!circleMemberRes.ok()) {
      console.error(`[CIRCLE MEMBER UPSERT FAIL] Status: ${circleMemberRes.status()} Body: ${await circleMemberRes.text()}`);
      throw new Error(`Circle member upsert failed`);
    }

    return { planUuid, planId, friendUuid, uniqueTitle };
  }

  test('should complete Football plan and verify memory database records', async ({ page, request }) => {
    const { planUuid, friendUuid, uniqueTitle } = await seedPlanAndNavigate(request, 'sports', 'FOOTBALL E2E EVENT', 'Football');
    
    await page.goto('/');

    // Wait for frontend hydration and sync to complete
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();


    // Tap plan card
    const planCard = page.locator('[id^="plan-card-"]').filter({ hasText: uniqueTitle }).first();
    await expect(planCard).toBeVisible();
    await planCard.click();

    // Tap complete plan
    const completeBtn = page.locator('#immersive-complete-plan-btn');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Step 1: Score home and away (default 5-3). Click Next.
    await expect(page.locator('h4:has-text("Final Score")')).toBeVisible();
    const nextBtn = page.locator('button:has-text("Next")');
    await nextBtn.click();

    // Step 2: Choose MVP. Click Publish Memory.
    await expect(page.locator('h4:has-text("Choose MVP")')).toBeVisible();
    const publishBtn = page.locator('button:has-text("Publish Memory")');
    await publishBtn.click();

    // Verify modal closes
    await expect(page.locator('#detailed_plan_modal')).not.toBeVisible();

    // Verify DB sync updates with polling
    let footballMemory;
    let footballResult;
    for (let i = 0; i < 10; i++) {
      const syncRes = await request.get('/api/db/fetch-all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const syncData = await syncRes.json();
      const memories = syncData.data.memories || [];
      const results = syncData.data.memory_results || [];
      
      footballMemory = memories.find(m => m.plan_id === planUuid);
      if (footballMemory) {
        footballResult = results.find(r => r.memory_id === footballMemory.id);
        if (footballResult) break;
      }
      await page.waitForTimeout(500);
    }

    expect(footballMemory).toBeDefined();
    expect(footballMemory.memory_type).toBe('football');
    expect(footballResult).toBeDefined();
    expect(footballResult.score_home).toBe(5);
    expect(footballResult.score_away).toBe(3);
  });

  test('should complete Badminton plan and verify memory database records', async ({ page, request }) => {
    const { planUuid, friendUuid, uniqueTitle } = await seedPlanAndNavigate(request, 'sports', 'BADMINTON E2E EVENT', 'Badminton');

    await page.goto('/');

    // Wait for frontend hydration and sync to complete
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();

    const planCard = page.locator('[id^="plan-card-"]').filter({ hasText: uniqueTitle }).first();
    await expect(planCard).toBeVisible();
    await planCard.click();

    const completeBtn = page.locator('#immersive-complete-plan-btn');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Step 1: Choose MVP. Click Publish Memory.
    await expect(page.locator('h4:has-text("Choose MVP")')).toBeVisible();
    const publishBtn = page.locator('button:has-text("Publish Memory")');
    await publishBtn.click();

    await expect(page.locator('#detailed_plan_modal')).not.toBeVisible();

    // Verify DB sync updates with polling
    let badmintonMemory;
    let badmintonResult;
    let badmintonOutcomes: any[] = [];
    for (let i = 0; i < 10; i++) {
      const syncRes = await request.get('/api/db/fetch-all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const syncData = await syncRes.json();
      const memories = syncData.data.memories || [];
      const results = syncData.data.memory_results || [];
      badmintonOutcomes = syncData.data.plan_outcomes || [];
      
      badmintonMemory = memories.find(m => m.plan_id === planUuid);
      if (badmintonMemory) {
        badmintonResult = results.find(r => r.memory_id === badmintonMemory.id);
        if (badmintonResult) break;
      }
      await page.waitForTimeout(500);
    }

    expect(badmintonMemory).toBeDefined();
    expect(badmintonMemory.memory_type).toBe('badminton');
    expect(badmintonResult).toBeDefined();
    expect(badmintonResult.score_home).toBeNull();
    expect(badmintonResult.score_away).toBeNull();

    // Verify outcomes: badminton outcomes should only store mvp_vote and NO stats outcomes
    const filteredOutcomes = badmintonOutcomes.filter(o => o.plan_id === planUuid);
    expect(filteredOutcomes.length).toBe(1);
    expect(filteredOutcomes[0].outcome_type).toBe('mvp_vote');
    expect(filteredOutcomes[0].payload).toHaveProperty('mvp_user_id');
    expect(filteredOutcomes[0].payload.wins).toBeUndefined();
    expect(filteredOutcomes[0].payload.losses).toBeUndefined();
  });

  test('should complete Movies plan and verify memory database records', async ({ page, request }) => {
    const { planUuid, uniqueTitle } = await seedPlanAndNavigate(request, 'movies', 'MOVIE E2E EVENT');

    await page.goto('/');

    // Wait for frontend hydration and sync to complete
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();

    const planCard = page.locator('[id^="plan-card-"]').filter({ hasText: uniqueTitle }).first();
    await expect(planCard).toBeVisible();
    await planCard.click();

    const completeBtn = page.locator('#immersive-complete-plan-btn');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Step 1: Star Rating and Review. Click Publish Memory.
    await expect(page.locator('h4:has-text("Rate Movie")')).toBeVisible();
    const publishBtn = page.locator('button:has-text("Publish Memory")');
    await publishBtn.click();

    await expect(page.locator('#detailed_plan_modal')).not.toBeVisible();

    // Verify DB sync updates with polling
    let movieMemory;
    let movieResult;
    for (let i = 0; i < 10; i++) {
      const syncRes = await request.get('/api/db/fetch-all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const syncData = await syncRes.json();
      const memories = syncData.data.memories || [];
      const results = syncData.data.memory_results || [];
      
      movieMemory = memories.find(m => m.plan_id === planUuid);
      if (movieMemory) {
        movieResult = results.find(r => r.memory_id === movieMemory.id);
        if (movieResult) break;
      }
      await page.waitForTimeout(500);
    }

    expect(movieMemory).toBeDefined();
    expect(movieMemory.memory_type).toBe('movies');
    expect(movieResult).toBeDefined();
    expect(Number(movieResult.average_rating)).toBe(5);
  });

  test('should complete Dining plan and verify memory database records', async ({ page, request }) => {
    const { planUuid, uniqueTitle } = await seedPlanAndNavigate(request, 'dining', 'DINING E2E EVENT');

    await page.goto('/');

    // Wait for frontend hydration and sync to complete
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();

    const planCard = page.locator('[id^="plan-card-"]').filter({ hasText: uniqueTitle }).first();
    await expect(planCard).toBeVisible();
    await planCard.click();

    const completeBtn = page.locator('#immersive-complete-plan-btn');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Step 1: Rating. Click Publish Memory.
    await expect(page.locator('h4:has-text("Rate Experience")')).toBeVisible();
    const publishBtn = page.locator('button:has-text("Publish Memory")');
    await publishBtn.click();

    await expect(page.locator('#detailed_plan_modal')).not.toBeVisible();

    // Verify DB sync updates with polling
    let diningMemory;
    let diningResult;
    for (let i = 0; i < 10; i++) {
      const syncRes = await request.get('/api/db/fetch-all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const syncData = await syncRes.json();
      const memories = syncData.data.memories || [];
      const results = syncData.data.memory_results || [];
      
      diningMemory = memories.find(m => m.plan_id === planUuid);
      if (diningMemory) {
        diningResult = results.find(r => r.memory_id === diningMemory.id);
        if (diningResult) break;
      }
      await page.waitForTimeout(500);
    }

    expect(diningMemory).toBeDefined();
    expect(diningMemory.memory_type).toBe('dining');
    expect(diningResult).toBeDefined();
    expect(Number(diningResult.average_rating)).toBe(5);
  });
});
