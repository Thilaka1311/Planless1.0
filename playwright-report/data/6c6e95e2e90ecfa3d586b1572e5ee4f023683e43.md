# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-hydration.spec.ts >> Home Feed Hydration >> should load feed correctly
- Location: tests/home-hydration.spec.ts:23:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#figma_coordinate_header')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#figma_coordinate_header')

```

```yaml
- text: PLANLESS
- button
- img "Avatar Preview"
- text: +
- heading "Set up your profile" [level=2]
- paragraph: This is how people will see you in plans
- textbox "Enter Your Name": VR Thilaka Sundar
- textbox "About you": Always spontaneous, never planless • Looking for movies/football.
- button "Continue"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Home Feed Hydration', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Inject active user session to bypass onboarding
  6  |     await page.addInitScript(() => {
  7  |       window.localStorage.setItem('planless_active_user_default', JSON.stringify({
  8  |         name: "VR Thilaka Sundar",
  9  |         phone: "+91 90002 00001",
  10 |         bio: "Always spontaneous, never planless • Looking for movies/football.",
  11 |         avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VR",
  12 |         joined: true,
  13 |         college_or_work: "SRM Chennai",
  14 |         user_id: "U001",
  15 |         dbUuid: "U001",
  16 |         token: "mock-token"
  17 |       }));
  18 |       window.localStorage.setItem('planless_active_tab', 'home');
  19 |     });
  20 |     await page.goto('/');
  21 |   });
  22 | 
  23 |   test('should load feed correctly', async ({ page }) => {
  24 |     // Verify coordinate header is visible
  25 |     const header = page.locator('#figma_coordinate_header');
> 26 |     await expect(header).toBeVisible();
     |                          ^ Error: expect(locator).toBeVisible() failed
  27 |     await expect(header.locator('h1')).toHaveText('PLANLESS');
  28 | 
  29 |     // Wait for the app tab content wrapper to render
  30 |     const feed = page.locator('#app_tab_content_wrapper');
  31 |     await expect(feed).toBeVisible();
  32 | 
  33 |     // Check if any plan cards exist
  34 |     const planCards = page.locator('[id^="plan-card-"]');
  35 |     const cardsCount = await planCards.count();
  36 | 
  37 |     if (cardsCount > 0) {
  38 |       // Scenario A: Plans exist
  39 |       const firstCard = planCards.first();
  40 |       await expect(firstCard).toBeVisible();
  41 | 
  42 |       // Assert that the host name label is resolved and does not fallback to "Anonymous Host" or stay blank
  43 |       const hostLabel = firstCard.locator('span:has-text("HOSTED BY") + span');
  44 |       await expect(hostLabel).toBeVisible();
  45 |       
  46 |       const hostName = await hostLabel.innerText();
  47 |       expect(hostName.trim()).not.toBe('');
  48 |       expect(hostName.trim()).not.toBe('Anonymous Host');
  49 |     } else {
  50 |       // Scenario B: No plans exist (empty state)
  51 |       const emptyStateHeading = page.locator('h3:has-text("No plans currently")');
  52 |       await expect(emptyStateHeading).toBeVisible();
  53 | 
  54 |       const createBtn = page.locator('button:has-text("Create a Plan")');
  55 |       await expect(createBtn).toBeVisible();
  56 |     }
  57 |   });
  58 | });
  59 | 
  60 | 
```