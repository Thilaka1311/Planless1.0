# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-preview.spec.ts >> Plan Preview Opens >> should tap plan card, open DetailedPlanModal, verify title, click back and return to feed
- Location: tests/plan-preview.spec.ts:112:3

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
  12  | test.describe('Plan Preview Opens', () => {
  13  |   const testUserId = `U_${crypto.randomUUID().slice(0, 8)}`;
  14  |   const testUserUuid = crypto.randomUUID();
  15  |   const testUserPhone = `+91 999${Math.floor(1000000 + Math.random() * 9000000)}`;
  16  |   const token = generateToken(testUserUuid);
  17  | 
  18  |   test.beforeEach(async ({ page, request }) => {
  19  |     // Seed the isolated user
  20  |     const userRes = await request.post('/api/db/upsert', {
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
  36  |     console.log('[USER UPSERT]', userRes.status(), await userRes.text());
  37  | 
  38  |     // Inject active user session with a valid JWT token to bypass onboarding and auth guards
  39  |     await page.addInitScript(({ token, testUserId, testUserUuid, testUserPhone }) => {
  40  |       window.localStorage.setItem('planless_active_user_default', JSON.stringify({
  41  |         name: "VR Thilaka Sundar",
  42  |         phone: testUserPhone,
  43  |         bio: "Always spontaneous, never planless • Looking for movies/football.",
  44  |         avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VR",
  45  |         joined: true,
  46  |         college_or_work: "SRM Chennai",
  47  |         user_id: testUserId,
  48  |         dbUuid: testUserUuid,
  49  |         token: token
  50  |       }));
  51  |       window.localStorage.setItem('planless_active_tab', 'home');
  52  |     }, { token, testUserId, testUserUuid, testUserPhone });
  53  | 
  54  |     // Ensure a deterministic plan exists in the database by upserting it before navigation
  55  |     const planId = `P_PREVIEW_${Date.now()}`;
  56  |     
  57  |     // Upsert mock test plan
  58  |     const planRes = await request.post('/api/db/upsert', {
  59  |       headers: {
  60  |         'Authorization': `Bearer ${token}`
  61  |       },
  62  |       data: {
  63  |         table: 'plans',
  64  |         records: [{
  65  |           plan_id: planId,
  66  |           title: 'PREVIEW TEST EVENT',
  67  |           description: 'E2E test plan for testing previews.',
  68  |           created_by: testUserUuid,
  69  |           host_id: testUserUuid,
  70  |           category: 'custom',
  71  |           location: 'Test Arena',
  72  |           datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  73  |           status: 'active',
  74  |           created_at: new Date().toISOString()
  75  |         }]
  76  |       }
  77  |     });
  78  |     console.log('[PLAN UPSERT]', planRes.status(), await planRes.text());
  79  | 
  80  |     const planData = await planRes.json();
> 81  |     const planUuid = planData.data[0].id;
      |                                   ^ TypeError: Cannot read properties of undefined (reading '0')
  82  | 
  83  |     // Upsert host participant entry using the generated plan UUID
  84  |     await request.post('/api/db/upsert', {
  85  |       headers: {
  86  |         'Authorization': `Bearer ${token}`
  87  |       },
  88  |       data: {
  89  |         table: 'plan_participants',
  90  |         records: [{
  91  |           participant_id: `PP_PREVIEW_${Date.now()}`,
  92  |           plan_id: planUuid,
  93  |           user_id: testUserUuid,
  94  |           status: 'new',
  95  |           payment_status: 'paid',
  96  |           joined_at: new Date().toISOString()
  97  |         }]
  98  |       }
  99  |     });
  100 | 
  101 |     page.on('console', msg => {
  102 |       console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
  103 |     });
  104 | 
  105 |     page.on('pageerror', err => {
  106 |       console.log(`[BROWSER EXCEPTION]: ${err.message}`);
  107 |     });
  108 | 
  109 |     await page.goto('/');
  110 |   });
  111 | 
  112 |   test('should tap plan card, open DetailedPlanModal, verify title, click back and return to feed', async ({ page }) => {
  113 |     // 1. Select the specific test plan card or any plan card in the feed
  114 |     const firstCard = page.locator('[id^="plan-card-"]').first();
  115 |     await expect(firstCard).toBeVisible();
  116 | 
  117 |     // 2. Tap the plan card (DetailedPlanModal Opens)
  118 |     await firstCard.click();
  119 | 
  120 |     // 3. Verify DetailedPlanModal is visible
  121 |     const modal = page.locator('#detailed_plan_modal');
  122 |     await expect(modal).toBeVisible();
  123 | 
  124 |     // 4. Verify Plan Title is visible inside the modal
  125 |     const modalTitle = modal.locator('#immersive-plan-title');
  126 |     await expect(modalTitle).toBeVisible();
  127 |     const titleText = await modalTitle.innerText();
  128 |     expect(titleText.trim()).toBe('PREVIEW TEST EVENT');
  129 | 
  130 |     // 5. Click the back button to close modal
  131 |     const backBtn = modal.locator('#immersive-plan-back-btn');
  132 |     await expect(backBtn).toBeVisible();
  133 |     await backBtn.click();
  134 | 
  135 |     // 6. Modal should close and return to Home Feed
  136 |     await expect(modal).not.toBeVisible();
  137 |     await expect(firstCard).toBeVisible();
  138 |   });
  139 | });
  140 | 
  141 | 
  142 | 
  143 | 
```