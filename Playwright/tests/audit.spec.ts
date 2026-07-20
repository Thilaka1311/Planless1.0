import { test } from '@playwright/test';

test('audit otp page rendering', async ({ page }) => {
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click Get Started or Enter Email
  const emailInput = page.locator('#email_input_field');
  if (await emailInput.isVisible()) {
    await emailInput.fill('audit-test@example.com');
    await page.locator('#email_submit_btn').click();
  }

  // Wait for OTP input
  const otpInput = page.locator('#otp_input_field');
  await otpInput.waitFor({ state: 'visible', timeout: 5000 });

  // Type OTP digits slowly
  await otpInput.type('1', { delay: 100 });
  await page.waitForTimeout(200);
  await otpInput.type('2', { delay: 100 });
  await page.waitForTimeout(200);
  await otpInput.type('3', { delay: 100 });
  await page.waitForTimeout(2000);
});
