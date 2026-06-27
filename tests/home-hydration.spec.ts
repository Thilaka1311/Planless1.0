import { test, expect } from '@playwright/test';

test.describe('Home Feed Hydration', () => {
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

  test('should load feed correctly', async ({ page }) => {
    // Verify coordinate header is visible
    const header = page.locator('#figma_coordinate_header');
    await expect(header).toBeVisible();
    await expect(header.locator('h1')).toHaveText('PLANLESS');

    // Wait for the app tab content wrapper to render
    const feed = page.locator('#app_tab_content_wrapper');
    await expect(feed).toBeVisible();

    // Check if any plan cards exist
    const planCards = page.locator('[id^="plan-card-"]');
    const cardsCount = await planCards.count();

    if (cardsCount > 0) {
      // Scenario A: Plans exist
      const firstCard = planCards.first();
      await expect(firstCard).toBeVisible();

      // Assert that the host name label is resolved and does not fallback to "Anonymous Host" or stay blank
      const hostLabel = firstCard.locator('span:has-text("HOSTED BY") + span');
      await expect(hostLabel).toBeVisible();
      
      const hostName = await hostLabel.innerText();
      expect(hostName.trim()).not.toBe('');
      expect(hostName.trim()).not.toBe('Anonymous Host');
    } else {
      // Scenario B: No plans exist (empty state)
      const emptyStateHeading = page.locator('h3:has-text("No plans currently")');
      await expect(emptyStateHeading).toBeVisible();

      const createBtn = page.locator('button:has-text("Create a Plan")');
      await expect(createBtn).toBeVisible();
    }
  });
});

