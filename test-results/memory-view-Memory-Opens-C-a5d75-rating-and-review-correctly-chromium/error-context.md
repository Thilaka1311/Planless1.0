# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: memory-view.spec.ts >> Memory Opens Correctly >> should display completed Movies memory rating and review correctly
- Location: tests/memory-view.spec.ts:217:3

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
  111 |     // 3. Upsert user participant status as 'going'
  112 |     await request.post('/api/db/upsert', {
  113 |       headers: { 'Authorization': `Bearer ${token}` },
  114 |       data: {
  115 |         table: 'plan_participants',
  116 |         records: [
  117 |           {
  118 |             participant_id: `PP_USER_${crypto.randomUUID()}`,
  119 |             plan_id: planUuid,
  120 |             user_id: testUserUuid,
  121 |             status: 'going',
  122 |             payment_status: 'paid',
  123 |             joined_at: new Date().toISOString()
  124 |           },
  125 |           {
  126 |             participant_id: `PP_FRIEND_${crypto.randomUUID()}`,
  127 |             plan_id: planUuid,
  128 |             user_id: friendUuid,
  129 |             status: 'going',
  130 |             payment_status: 'paid',
  131 |             joined_at: new Date().toISOString()
  132 |           }
  133 |         ]
  134 |       }
  135 |     });
  136 | 
  137 |     // 4. Seed Outcomes
  138 |     const outcomesRecords = outcomes.map(o => {
  139 |       const payload = { ...o.payload };
  140 |       if (payload.mvp_user_id === 'user') {
  141 |         payload.mvp_user_id = testUserUuid;
  142 |       }
  143 |       return {
  144 |         id: crypto.randomUUID(),
  145 |         plan_id: planUuid,
  146 |         submitted_by_user_id: o.submitted_by_user_id === 'user' ? testUserUuid : friendUuid,
  147 |         outcome_type: o.outcome_type,
  148 |         payload: payload,
  149 |         created_at: new Date().toISOString()
  150 |       };
  151 |     });
  152 | 
  153 |     if (outcomesRecords.length > 0) {
  154 |       await request.post('/api/db/upsert', {
  155 |         headers: { 'Authorization': `Bearer ${token}` },
  156 |         data: {
  157 |           table: 'plan_outcomes',
  158 |           records: outcomesRecords
  159 |         }
  160 |       });
  161 |     }
  162 | 
  163 |     return { planUuid, uniqueTitle, friendUuid };
  164 |   }
  165 | 
  166 |   test('should display completed Football memory scores and MVP correctly', async ({ page, request }) => {
  167 |     const { uniqueTitle } = await seedCompletedPlan(request, {
  168 |       category: 'sports',
  169 |       activityType: 'football',
  170 |       title: 'FOOTBALL MEM VIEW',
  171 |       outcomes: [
  172 |         {
  173 |           outcome_type: 'stats',
  174 |           submitted_by_user_id: 'user',
  175 |           payload: { teamAScore: 5, teamBScore: 3 }
  176 |         },
  177 |         {
  178 |           outcome_type: 'mvp_vote',
  179 |           submitted_by_user_id: 'user',
  180 |           payload: { mvp_user_id: 'user' }
  181 |         }
  182 |       ]
  183 |     });
  184 | 
  185 |     await page.goto('/');
```