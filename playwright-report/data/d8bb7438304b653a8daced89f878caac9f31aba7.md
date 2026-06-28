# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-completion.spec.ts >> Plan Completion Creates Memory >> should complete Dining plan and verify memory database records
- Location: tests/plan-completion.spec.ts:349:3

# Error details

```
Error: Friend user upsert failed
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
  12  | test.describe('Plan Completion Creates Memory', () => {
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
  27  |     // Seed the isolated user
  28  |     await request.post('/api/db/upsert', {
  29  |       headers: { 'Authorization': `Bearer ${token}` },
  30  |       data: {
  31  |         table: 'users',
  32  |         records: [{
  33  |           id: testUserUuid,
  34  |           user_id: testUserId,
  35  |           full_name: 'VR Thilaka Sundar',
  36  |           username: 'thilaka_sundar',
  37  |           phone_number: testUserPhone,
  38  |           college_or_work: 'SRM Chennai',
  39  |           wallet_balance: 0,
  40  |           active_status: true
  41  |         }]
  42  |       }
  43  |     });
  44  | 
  45  |     // Inject active user session
  46  |     await page.addInitScript(({ token, testUserId, testUserUuid, testUserPhone }) => {
  47  |       window.localStorage.setItem('planless_active_user_default', JSON.stringify({
  48  |         name: "VR Thilaka Sundar",
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
  62  |   async function seedPlanAndNavigate(request, category: string, title: string, subcategory: string | null = null) {
  63  |     // Generate completely unique plan_id for parallel worker runs
  64  |     const planId = `P_COMP_${category.toUpperCase()}_${crypto.randomUUID()}`;
  65  |     
  66  |     // 1. Seed a mock friend user to act as a "going" participant for MVP selection
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
  84  |     if (!friendRes.ok()) {
  85  |       console.error(`[FRIEND UPSERT FAIL] Status: ${friendRes.status()} Body: ${await friendRes.text()}`);
> 86  |       throw new Error(`Friend user upsert failed`);
      |             ^ Error: Friend user upsert failed
  87  |     }
  88  |     const friendData = await friendRes.json();
  89  |     const friendUuid = friendData.data[0].id;
  90  |     
  91  |     const uniqueTitle = `${title} ${crypto.randomUUID().slice(0, 8)}`;
  92  | 
  93  |     // 2. Upsert the plan record
  94  |     const planRes = await request.post('/api/db/upsert', {
  95  |       headers: { 'Authorization': `Bearer ${token}` },
  96  |       data: {
  97  |         table: 'plans',
  98  |         records: [{
  99  |           plan_id: planId,
  100 |           title: uniqueTitle,
  101 |           description: `E2E test plan for completing a ${category} event.`,
  102 |           created_by: testUserUuid,
  103 |           host_id: testUserUuid,
  104 |           category: category,
  105 |           circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
  106 |           activity_type: subcategory ? subcategory.toLowerCase() : null, // DB expects lowercase activity_type
  107 |           location: 'Test Arena',
  108 |           datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  109 |           status: 'active',
  110 |           created_at: new Date().toISOString()
  111 |         }]
  112 |       }
  113 |     });
  114 | 
  115 |     if (!planRes.ok()) {
  116 |       console.error(`[PLAN UPSERT FAIL] Status: ${planRes.status()} Body: ${await planRes.text()}`);
  117 |       throw new Error(`Plan upsert failed with status ${planRes.status()}`);
  118 |     }
  119 | 
  120 |     const planData = await planRes.json();
  121 |     const planUuid = planData.data[0].id;
  122 | 
  123 |     // 3. Upsert host participant status as 'new' to ensure visibility in home feed
  124 |     const hostPpRes = await request.post('/api/db/upsert', {
  125 |       headers: { 'Authorization': `Bearer ${token}` },
  126 |       data: {
  127 |         table: 'plan_participants',
  128 |         records: [{
  129 |           participant_id: `PP_HOST_${crypto.randomUUID()}`,
  130 |           plan_id: planUuid,
  131 |           user_id: testUserUuid,
  132 |           status: 'new',
  133 |           payment_status: 'paid',
  134 |           joined_at: new Date().toISOString()
  135 |         }]
  136 |       }
  137 |     });
  138 |     if (!hostPpRes.ok()) {
  139 |       console.error(`[HOST PP UPSERT FAIL] Status: ${hostPpRes.status()} Body: ${await hostPpRes.text()}`);
  140 |       throw new Error(`Host participant upsert failed`);
  141 |     }
  142 | 
  143 |     // 4. Upsert friend participant status as 'going' to ensure they appear in the completion MVP list
  144 |     const friendPpRes = await request.post('/api/db/upsert', {
  145 |       headers: { 'Authorization': `Bearer ${token}` },
  146 |       data: {
  147 |         table: 'plan_participants',
  148 |         records: [{
  149 |           participant_id: `PP_FRIEND_${crypto.randomUUID()}`,
  150 |           plan_id: planUuid,
  151 |           user_id: friendUuid,
  152 |           status: 'going',
  153 |           payment_status: 'paid',
  154 |           joined_at: new Date().toISOString()
  155 |         }]
  156 |       }
  157 |     });
  158 |     if (!friendPpRes.ok()) {
  159 |       console.error(`[FRIEND PP UPSERT FAIL] Status: ${friendPpRes.status()} Body: ${await friendPpRes.text()}`);
  160 |       throw new Error(`Friend participant upsert failed`);
  161 |     }
  162 | 
  163 |     // Ensure the test user is a member of the circle 'c2e4a106-bc73-44c1-b52b-eec759c6eadf'
  164 |     const circleMemberRes = await request.post('/api/db/upsert', {
  165 |       headers: { 'Authorization': `Bearer ${token}` },
  166 |       data: {
  167 |         table: 'circle_members',
  168 |         records: [{
  169 |           circle_id: 'c2e4a106-bc73-44c1-b52b-eec759c6eadf',
  170 |           user_id: testUserUuid,
  171 |           role: 'host',
  172 |           joined_at: new Date().toISOString()
  173 |         }]
  174 |       }
  175 |     });
  176 |     if (!circleMemberRes.ok()) {
  177 |       console.error(`[CIRCLE MEMBER UPSERT FAIL] Status: ${circleMemberRes.status()} Body: ${await circleMemberRes.text()}`);
  178 |       throw new Error(`Circle member upsert failed`);
  179 |     }
  180 | 
  181 |     return { planUuid, planId, friendUuid, uniqueTitle };
  182 |   }
  183 | 
  184 |   test('should complete Football plan and verify memory database records', async ({ page, request }) => {
  185 |     const { planUuid, friendUuid, uniqueTitle } = await seedPlanAndNavigate(request, 'sports', 'FOOTBALL E2E EVENT', 'Football');
  186 |     
```