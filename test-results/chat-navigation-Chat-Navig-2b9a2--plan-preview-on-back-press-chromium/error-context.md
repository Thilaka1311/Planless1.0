# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat-navigation.spec.ts >> Chat Navigation Back >> should navigate to plan chat and return to plan preview on back press
- Location: tests/chat-navigation.spec.ts:18:3

# Error details

```
TypeError: Cannot read properties of undefined (reading '0')
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import crypto from 'crypto';
  3   | 
  4   | const JWT_SECRET = 'sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF_jwt_secret_9988';
  5   | function generateToken(userId: string): string {
  6   |   const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  7   |   const data = `${userId}.${expiry}`;
  8   |   const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  9   |   return `${data}.${signature}`;
  10  | }
  11  | 
  12  | test.describe('Chat Navigation Back', () => {
  13  |   const testUserId = `U_${crypto.randomUUID().slice(0, 8)}`;
  14  |   const testUserUuid = crypto.randomUUID();
  15  |   const testUserPhone = `+91 999${Math.floor(1000000 + Math.random() * 9000000)}`;
  16  |   const token = generateToken(testUserUuid);
  17  | 
  18  |   test('should navigate to plan chat and return to plan preview on back press', async ({ page, request }) => {
  19  |     // 0. Seed the isolated user
  20  |     await request.post('/api/db/upsert', {
  21  |       headers: { 'Authorization': `Bearer ${token}` },
  22  |       data: {
  23  |         table: 'users',
  24  |         records: [{
  25  |           id: testUserUuid,
  26  |           user_id: testUserId,
  27  |           full_name: 'VR Thilaka Sundar',
  28  |           username: 'thilaka_sundar',
  29  |           phone_number: testUserPhone,
  30  |           college_or_work: 'SRM Chennai',
  31  |           wallet_balance: 0,
  32  |           active_status: true
  33  |         }]
  34  |       }
  35  |     });
  36  | 
  37  |     // 1. Inject active user session with a valid JWT token
  38  |     await page.addInitScript(({ token, testUserId, testUserUuid, testUserPhone }) => {
  39  |       window.localStorage.setItem('planless_active_user_default', JSON.stringify({
  40  |         name: "VR Thilaka Sundar",
  41  |         phone: testUserPhone,
  42  |         bio: "Always spontaneous, never planless • Looking for movies/football.",
  43  |         avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VR",
  44  |         joined: true,
  45  |         college_or_work: "SRM Chennai",
  46  |         user_id: testUserId,
  47  |         dbUuid: testUserUuid,
  48  |         token: token
  49  |       }));
  50  |       window.localStorage.setItem('planless_active_tab', 'home');
  51  |     }, { token, testUserId, testUserUuid, testUserPhone });
  52  | 
  53  |     // 2. Ensure a deterministic plan exists in the database by upserting it before navigation
  54  |     const planId = `P_CHAT_NAV_${Date.now()}`;
  55  |     const planRes = await request.post('/api/db/upsert', {
  56  |       headers: { 'Authorization': `Bearer ${token}` },
  57  |       data: {
  58  |         table: 'plans',
  59  |         records: [{
  60  |           plan_id: planId,
  61  |           title: 'CHAT NAV TEST EVENT',
  62  |           description: 'E2E test plan for verifying chat back button.',
  63  |           created_by: testUserUuid,
  64  |           host_id: testUserUuid,
  65  |           category: 'custom',
  66  |           circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
  67  |           location: 'Test Area',
  68  |           datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  69  |           status: 'active',
  70  |           created_at: new Date().toISOString()
  71  |         }]
  72  |       }
  73  |     });
  74  | 
  75  |     const planData = await planRes.json();
> 76  |     const planUuid = planData.data[0].id;
      |                                   ^ TypeError: Cannot read properties of undefined (reading '0')
  77  | 
  78  |     // 3. Upsert participant status as 'new' to ensure visibility in feed
  79  |     await request.post('/api/db/upsert', {
  80  |       headers: { 'Authorization': `Bearer ${token}` },
  81  |       data: {
  82  |         table: 'plan_participants',
  83  |         records: [{
  84  |           plan_id: planUuid,
  85  |           user_id: testUserUuid,
  86  |           role: 'HOST',
  87  |           rsvp_status: 'JOINED',
  88  |           responded_at: new Date().toISOString()
  89  |         }]
  90  |       }
  91  |     });
  92  | 
  93  |     // Ensure the test user is a member of the circle 'c2e4a106-bc73-44c1-b52b-eec759c6eadf'
  94  |     await request.post('/api/db/upsert', {
  95  |       headers: { 'Authorization': `Bearer ${token}` },
  96  |       data: {
  97  |         table: 'circle_members',
  98  |         records: [{
  99  |           circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
  100 |           user_id: testUserUuid,
  101 |           role: 'host',
  102 |           joined_at: new Date().toISOString()
  103 |         }]
  104 |       }
  105 |     });
  106 | 
  107 |     // 4. Set up logging
  108 |     page.on('console', msg => {
  109 |       console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
  110 |     });
  111 | 
  112 |     page.on('pageerror', err => {
  113 |       console.log(`[BROWSER EXCEPTION]: ${err.message}`);
  114 |     });
  115 | 
  116 |     // 5. Navigate to Home
  117 |     await page.goto('/');
  118 | 
  119 |     // 5. Select the newly created plan card in the feed and click it
  120 |     const planCard = page.locator('[id^="plan-card-"]').filter({ hasText: 'CHAT NAV TEST EVENT' }).first();
  121 |     await expect(planCard).toBeVisible();
  122 |     await planCard.click();
  123 | 
  124 |     // 6. Verify DetailedPlanModal is visible
  125 |     const modal = page.locator('#detailed_plan_modal');
  126 |     await expect(modal).toBeVisible();
  127 | 
  128 |     // 7. Verify Open Chat button is visible and click it
  129 |     const openChatBtn = modal.locator('#immersive-open-chat-btn');
  130 |     await expect(openChatBtn).toBeVisible();
  131 |     await openChatBtn.click();
  132 | 
  133 |     // 8. Verify the chat overlay screen is open and active
  134 |     const chatHeader = page.locator('#plan-chat-header-overlay');
  135 |     await expect(chatHeader).toBeVisible();
  136 | 
  137 |     // 9. Click the back button inside the plan chat header
  138 |     const chatBackBtn = chatHeader.locator('button').first();
  139 |     await expect(chatBackBtn).toBeVisible();
  140 |     await chatBackBtn.click();
  141 | 
  142 |     // 10. Verify we returned to the plan preview modal (instead of general Circle Chat/Hub or Home Feed)
  143 |     await expect(modal).toBeVisible();
  144 |     await expect(modal.locator('#immersive-plan-title')).toHaveText('CHAT NAV TEST EVENT');
  145 |   });
  146 | });
  147 | 
```