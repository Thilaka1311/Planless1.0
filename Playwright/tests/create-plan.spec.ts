import { test, expect } from '@playwright/test';

test.describe('Create Plan Opens', () => {
  test.beforeEach(async ({ page }) => {
    // Inject active user session to bypass onboarding
    await page.addInitScript(() => {
      window.localStorage.setItem('planless_active_user_default', JSON.stringify({
        name: "VR Thilaka Sundar",
        phone: "+91 90002 00001",
        bio: "Always spontaneous, never planless • Looking for movies/football.",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VR",
        joined: true,
        college_or_work: "SRM Chennai",
        user_id: "U001",
        dbUuid: "U001",
        token: "mock-token"
      }));
      window.localStorage.setItem('planless_active_tab', 'home');
    });
    await page.goto('/');
  });

  test('should navigate to create plan screen and show category selector', async ({ page }) => {
    // Locate footer navigation bar
    const footerNav = page.locator('#main_app_footer_nav');
    await expect(footerNav).toBeVisible();

    // Click "Create" tab item
    const createTabButton = footerNav.locator('#nav_item_create');
    await expect(createTabButton).toBeVisible();
    await createTabButton.click();

    // Verify main view displays the category selection screen
    const categoryTitle = page.locator('h2:has-text("What’s the move?")');
    await expect(categoryTitle).toBeVisible();

    // Verify predefined category tiles exist
    const sportsCategory = page.locator('h3:has-text("Sports")');
    const moviesCategory = page.locator('h3:has-text("Movies")');
    const diningCategory = page.locator('h3:has-text("Dining and Drinks")');
    const customCategory = page.locator('h3:has-text("Create Your Own Plan")');

    await expect(sportsCategory).toBeVisible();
    await expect(moviesCategory).toBeVisible();
    await expect(diningCategory).toBeVisible();
    await expect(customCategory).toBeVisible();
  });
});
