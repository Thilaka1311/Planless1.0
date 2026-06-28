# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-plan.spec.ts >> Create Plan Opens >> should navigate to create plan screen and show category selector
- Location: tests/create-plan.spec.ts:23:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#main_app_footer_nav')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#main_app_footer_nav')

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
  3  | test.describe('Create Plan Opens', () => {
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
  23 |   test('should navigate to create plan screen and show category selector', async ({ page }) => {
  24 |     // Locate footer navigation bar
  25 |     const footerNav = page.locator('#main_app_footer_nav');
> 26 |     await expect(footerNav).toBeVisible();
     |                             ^ Error: expect(locator).toBeVisible() failed
  27 | 
  28 |     // Click "Create" tab item
  29 |     const createTabButton = footerNav.locator('#nav_item_create');
  30 |     await expect(createTabButton).toBeVisible();
  31 |     await createTabButton.click();
  32 | 
  33 |     // Verify main view displays the category selection screen
  34 |     const categoryTitle = page.locator('h2:has-text("What’s the move?")');
  35 |     await expect(categoryTitle).toBeVisible();
  36 | 
  37 |     // Verify predefined category tiles exist
  38 |     const sportsCategory = page.locator('h3:has-text("Sports")');
  39 |     const moviesCategory = page.locator('h3:has-text("Movies")');
  40 |     const diningCategory = page.locator('h3:has-text("Dining and Drinks")');
  41 |     const customCategory = page.locator('h3:has-text("Create Your Own Plan")');
  42 | 
  43 |     await expect(sportsCategory).toBeVisible();
  44 |     await expect(moviesCategory).toBeVisible();
  45 |     await expect(diningCategory).toBeVisible();
  46 |     await expect(customCategory).toBeVisible();
  47 |   });
  48 | });
  49 | 
```