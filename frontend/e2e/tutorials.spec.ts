import { test, expect } from '@playwright/test';

test.describe('Tutorials Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as associate
    await page.goto('/login');
    await page.fill('input[type="email"]', 'associate@sonthillu.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Should open Tutorials page, search, and run walkthrough engine', async ({ page }) => {
    // Navigate to Tutorials
    await page.goto('/tutorials');
    await expect(page.locator('h1').filter({ hasText: 'Tutorial Center' })).toBeVisible();

    // Test Search
    const searchInput = page.getByPlaceholder('Search tutorials...');
    await searchInput.waitFor();
    await searchInput.fill('booking');

    // Find "Start Tutorial" button if there are results
    const startBtn = page.locator('button', { hasText: 'Start Tutorial' }).first();
    const emptyState = page.locator('text=No tutorials found');
    
    const count = await startBtn.count();
    if (count > 0) {
      await startBtn.click();
      
      // Wait for popover to appear
      const nextBtn = page.getByRole('button', { name: /Next/i });
      const finishBtn = page.getByRole('button', { name: /Finish/i });
      const popoverContent = page.locator('div[style*="z-index: 9999"]');

      await expect(popoverContent).toBeVisible();

      // Click Next until Finish
      while (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300); // wait for step transition
      }

      if (await finishBtn.isVisible()) {
        await finishBtn.click();
        await expect(popoverContent).not.toBeVisible();
      }
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('Responsive checks for Tutorials', async ({ page }) => {
    // Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tutorials');
    await expect(page.locator('h1').filter({ hasText: 'Tutorial Center' })).toBeVisible();
    const mobileWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(mobileWidth).toBeLessThanOrEqual(390); // No horizontal overflow

    // Tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/tutorials');
    const tabletWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(tabletWidth).toBeLessThanOrEqual(768);

    // Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tutorials');
    const desktopWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(desktopWidth).toBeLessThanOrEqual(1440);
  });
});
