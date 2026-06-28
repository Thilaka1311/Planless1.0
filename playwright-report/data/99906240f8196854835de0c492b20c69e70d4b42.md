# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: memory-view.spec.ts >> Memory Opens Correctly >> should display completed Football memory scores and MVP correctly
- Location: tests/memory-view.spec.ts:163:3

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
  12  | test.describe('Memory Opens Correctly', () => {
  13  |   const testUserId = `U_${crypto.randomUUID().slice(0, 8)}`;
  14  |   const testUserUuid = crypto.randomUUID();
  15  |   const testUserPhone = `+91 999${Math.floor(1000000 + Math.random() * 9000000)}`;
  16  |   const token = generateToken(testUserUuid);
  17  | 
  18  |   test.beforeEach(async ({ page, request }) => {
  19  |     page.on('console', msg => {
  20  |       console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
  21  |     });
  22  | 
  23  |     page.on('pageerror', err => {
  24  |       console.log(`[BROWSER EXCEPTION]: ${err.message}`);
  25  |     });
  26  | 
  27  |     // 1. Align user full_name in the database to 'Thilaka Sundar' to match application hardcoding (myKey)
  28  |     await request.post('/api/db/upsert', {
  29  |       headers: { 'Authorization': `Bearer ${token}` },
  30  |       data: {
  31  |         table: 'users',
  32  |         records: [{
  33  |           id: testUserUuid,
  34  |           user_id: testUserId,
  35  |           full_name: 'Thilaka Sundar',
  36  |           username: 'thilaka_sundar',
  37  |           phone_number: testUserPhone,
  38  |           college_or_work: 'SRM Chennai',
  39  |           wallet_balance: 0,
  40  |           active_status: true
  41  |         }]
  42  |       }
  43  |     });
  44  | 
  45  |     // 2. Inject active user session with 'Thilaka Sundar'
  46  |     await page.addInitScript(({ token, testUserId, testUserUuid, testUserPhone }) => {
  47  |       window.localStorage.setItem('planless_active_user_default', JSON.stringify({
  48  |         name: "Thilaka Sundar",
  49  |         phone: testUserPhone,
  50  |         bio: "Always spontaneous, never planless • Looking for movies/football.",
  51  |         avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VR",
  52  |         joined: true,
  53  |         college_or_work: "SRM Chennai",
  54  |         user_id: testUserId,
  55  |         dbUuid: testUserUuid,
  56  |         token: token
  57  |       }));
  58  |       window.localStorage.setItem('planless_active_tab', 'home');
  59  |     }, { token, testUserId, testUserUuid, testUserPhone });
  60  |   });
  61  | 
  62  |   async function seedCompletedPlan(request, { category, title, activityType = null, outcomes }) {
  63  |     const planId = `P_MEM_VIEW_${category.toUpperCase()}_${crypto.randomUUID()}`;
  64  |     const uniqueTitle = `${title} ${crypto.randomUUID().slice(0, 8)}`;
  65  | 
  66  |     // 1. Seed a mock friend user to act as participant
  67  |     const rand = crypto.randomUUID().slice(0, 8);
  68  |     const friendRes = await request.post('/api/db/upsert', {
  69  |       headers: { 'Authorization': `Bearer ${token}` },
  70  |       data: {
  71  |         table: 'users',
  72  |         records: [{
  73  |           user_id: `U_FRIEND_${rand}`,
  74  |           username: `friend_${rand}`,
  75  |           full_name: 'E2E Mock Friend',
  76  |           phone_number: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
  77  |           college_or_work: 'SRM Chennai',
  78  |           wallet_balance: 0,
  79  |           active_status: true,
  80  |           created_at: new Date().toISOString()
  81  |         }]
  82  |       }
  83  |     });
  84  |     const friendData = await friendRes.json();
> 85  |     const friendUuid = friendData.data[0].id;
      |                                       ^ TypeError: Cannot read properties of undefined (reading '0')
  86  | 
  87  |     // 2. Upsert completed plan record
  88  |     const planRes = await request.post('/api/db/upsert', {
  89  |       headers: { 'Authorization': `Bearer ${token}` },
  90  |       data: {
  91  |         table: 'plans',
  92  |         records: [{
  93  |           plan_id: planId,
  94  |           title: uniqueTitle,
  95  |           description: `Seeded completed plan for ${category}.`,
  96  |           created_by: testUserUuid,
  97  |           host_id: testUserUuid,
  98  |           category: category,
  99  |           circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
  100 |           activity_type: activityType || null,
  101 |           location: 'Test Arena',
  102 |           datetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  103 |           status: 'completed',
  104 |           created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  105 |         }]
  106 |       }
  107 |     });
  108 |     const planData = await planRes.json();
  109 |     const planUuid = planData.data[0].id;
  110 | 
  111 |     await request.post('/api/db/upsert', {
  112 |       headers: { 'Authorization': `Bearer ${token}` },
  113 |       data: {
  114 |         table: 'plan_participants',
  115 |         records: [
  116 |           {
  117 |             plan_id: planUuid,
  118 |             user_id: testUserUuid,
  119 |             role: 'HOST',
  120 |             rsvp_status: 'JOINED',
  121 |             responded_at: new Date().toISOString()
  122 |           },
  123 |           {
  124 |             plan_id: planUuid,
  125 |             user_id: friendUuid,
  126 |             role: 'PARTICIPANT',
  127 |             rsvp_status: 'JOINED',
  128 |             responded_at: new Date().toISOString()
  129 |           }
  130 |         ]
  131 |       }
  132 |     });
  133 | 
  134 |     // 4. Seed Outcomes
  135 |     const outcomesRecords = outcomes.map(o => {
  136 |       const payload = { ...o.payload };
  137 |       if (payload.mvp_user_id === 'user') {
  138 |         payload.mvp_user_id = testUserUuid;
  139 |       }
  140 |       return {
  141 |         id: crypto.randomUUID(),
  142 |         plan_id: planUuid,
  143 |         submitted_by_user_id: o.submitted_by_user_id === 'user' ? testUserUuid : friendUuid,
  144 |         outcome_type: o.outcome_type,
  145 |         payload: payload,
  146 |         created_at: new Date().toISOString()
  147 |       };
  148 |     });
  149 | 
  150 |     if (outcomesRecords.length > 0) {
  151 |       await request.post('/api/db/upsert', {
  152 |         headers: { 'Authorization': `Bearer ${token}` },
  153 |         data: {
  154 |           table: 'plan_outcomes',
  155 |           records: outcomesRecords
  156 |         }
  157 |       });
  158 |     }
  159 | 
  160 |     return { planUuid, uniqueTitle, friendUuid };
  161 |   }
  162 | 
  163 |   test('should display completed Football memory scores and MVP correctly', async ({ page, request }) => {
  164 |     const { uniqueTitle } = await seedCompletedPlan(request, {
  165 |       category: 'sports',
  166 |       activityType: 'football',
  167 |       title: 'FOOTBALL MEM VIEW',
  168 |       outcomes: [
  169 |         {
  170 |           outcome_type: 'stats',
  171 |           submitted_by_user_id: 'user',
  172 |           payload: { teamAScore: 5, teamBScore: 3 }
  173 |         },
  174 |         {
  175 |           outcome_type: 'mvp_vote',
  176 |           submitted_by_user_id: 'user',
  177 |           payload: { mvp_user_id: 'user' }
  178 |         }
  179 |       ]
  180 |     });
  181 | 
  182 |     await page.goto('/');
  183 |     await expect(page.locator('#figma_coordinate_header')).toBeVisible();
  184 | 
  185 |     // Click profile settings avatar
```