import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Onboarding Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      console.log(`[BROWSER LOG (${msg.type()})]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.log(`[BROWSER EXCEPTION]: ${err.message}`);
    });
  });

  test('should complete the signup/onboarding flow sequentially and land on the home feed', async ({ page }) => {
    // 1. Visit the root URL without seeding localStorage (triggers onboarding landing)
    await page.goto('/');

    // Verify we are on the landing step
    await expect(page.locator('#onboarding_wrapper')).toBeVisible();
    await expect(page.locator('#step_landing')).toBeVisible();
    await expect(page.locator('#btn_create_account')).toBeVisible();

    // 2. Click "Create account"
    await page.locator('#btn_create_account').click();

    // Verify phone input step is visible
    await expect(page.locator('#step_phone')).toBeVisible();

    // Generate unique name and phone number
    const uniqueSuffix = crypto.randomUUID().slice(0, 8);
    const testName = `Onboard User ${uniqueSuffix}`;
    // A 10 digit number starting with 999
    const testPhone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;

    // 3. Fill in Name
    await page.locator('#profile_name_input').fill(testName);

    // 4. Fill in Phone number
    await page.locator('#phone_input_field').fill(testPhone);

    // 5. Submit Phone Input Step
    await page.locator('#phone_continue_btn').click();

    // 6. Verify profile setup step is visible
    await expect(page.locator('#step_profile')).toBeVisible();
    await expect(page.locator('text=Set up your profile')).toBeVisible();

    // Verify name carries over to profile setup step name input
    const setupNameInput = page.locator('#step_profile #profile_name_input');
    await expect(setupNameInput).toHaveValue(testName);

    // Optionally update bio
    const testBio = `Bio for ${testName} - Spontaneous and energetic.`;
    await page.locator('#profile_bio_input').fill(testBio);

    // 7. Complete Onboarding
    await page.locator('#complete_onboarding_btn').click();

    // 8. Verify user is redirected/logged in to main app
    await expect(page.locator('#figma_coordinate_header')).toBeVisible();
    await expect(page.locator('#main_app_footer_nav')).toBeVisible();
  });
});
