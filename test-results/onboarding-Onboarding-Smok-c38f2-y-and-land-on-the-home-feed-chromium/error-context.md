# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> Onboarding Smoke Test >> should complete the signup/onboarding flow sequentially and land on the home feed
- Location: tests/onboarding.spec.ts:15:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#step_phone')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#step_phone')

```

```yaml
- button
- text: PLANLESS
- button
- heading "Let's get you started" [level=2]
- paragraph: Enter your email address to continue.
- text: Email Address
- textbox "name@example.com"
- text: We will send a passwordless OTP code to your email to verify your identity.
- button "Continue"
- paragraph:
  - text: Already have an account?
  - button "Log In"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import crypto from 'crypto';
  3  | 
  4  | test.describe('Onboarding Smoke Test', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     page.on('console', msg => {
  7  |       console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
  8  |     });
  9  | 
  10 |     page.on('pageerror', err => {
  11 |       console.log(`[BROWSER EXCEPTION]: ${err.message}`);
  12 |     });
  13 |   });
  14 | 
  15 |   test('should complete the signup/onboarding flow sequentially and land on the home feed', async ({ page }) => {
  16 |     // 1. Visit the root URL without seeding localStorage (triggers onboarding landing)
  17 |     await page.goto('/');
  18 | 
  19 |     // Verify we are on the landing step
  20 |     await expect(page.locator('#onboarding_wrapper')).toBeVisible();
  21 |     await expect(page.locator('#step_landing')).toBeVisible();
  22 |     await expect(page.locator('#btn_create_account')).toBeVisible();
  23 | 
  24 |     // 2. Click "Create account"
  25 |     await page.locator('#btn_create_account').click();
  26 | 
  27 |     // Verify phone input step is visible
> 28 |     await expect(page.locator('#step_phone')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  29 | 
  30 |     // Generate unique name and phone number
  31 |     const uniqueSuffix = crypto.randomUUID().slice(0, 8);
  32 |     const testName = `Onboard User ${uniqueSuffix}`;
  33 |     // A 10 digit number starting with 999
  34 |     const testPhone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;
  35 | 
  36 |     // 3. Fill in Name
  37 |     await page.locator('#profile_name_input').fill(testName);
  38 | 
  39 |     // 4. Fill in Phone number
  40 |     await page.locator('#phone_input_field').fill(testPhone);
  41 | 
  42 |     // 5. Submit Phone Input Step
  43 |     await page.locator('#phone_continue_btn').click();
  44 | 
  45 |     // 6. Verify profile setup step is visible
  46 |     await expect(page.locator('#step_profile')).toBeVisible();
  47 |     await expect(page.locator('text=Set up your profile')).toBeVisible();
  48 | 
  49 |     // Verify name carries over to profile setup step name input
  50 |     const setupNameInput = page.locator('#step_profile #profile_name_input');
  51 |     await expect(setupNameInput).toHaveValue(testName);
  52 | 
  53 |     // Optionally update bio
  54 |     const testBio = `Bio for ${testName} - Spontaneous and energetic.`;
  55 |     await page.locator('#profile_bio_input').fill(testBio);
  56 | 
  57 |     // 7. Complete Onboarding
  58 |     await page.locator('#complete_onboarding_btn').click();
  59 | 
  60 |     // 8. Verify user is redirected/logged in to main app
  61 |     await expect(page.locator('#figma_coordinate_header')).toBeVisible();
  62 |     await expect(page.locator('#main_app_footer_nav')).toBeVisible();
  63 |   });
  64 | });
  65 | 
```