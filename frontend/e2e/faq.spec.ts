import { test, expect } from '@playwright/test';

test.describe('FAQ Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as associate
    await page.goto('/login');
    await page.fill('input[type="email"]', 'associate@sonthillu.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Should open FAQ page, search, and toggle accordion', async ({ page, isMobile }) => {
    // Navigate to FAQ
    await page.goto('/faq');
    await expect(page.locator('h1').filter({ hasText: 'Help Center & FAQs' })).toBeVisible();

    // Wait for network to load FAQs (assumes some exist or empty state shown)
    // Try typing in search
    const searchInput = page.getByPlaceholder('Search for answers...');
    await searchInput.waitFor();
    await searchInput.fill('booking');
    
    // Check if empty state or results appear
    const emptyState = page.locator('text=No FAQs found');
    const firstAccordion = page.locator('button').filter({ hasText: 'booking' }).first();

    // Wait for either the empty state OR an accordion to be visible
    await Promise.race([
      emptyState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      firstAccordion.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);

    if (await firstAccordion.isVisible()) {
      await firstAccordion.click();
    } else {
      await expect(emptyState).toBeVisible();
    }

    // Category filter click
    const allBtn = page.getByRole('button', { name: 'All' });
    await allBtn.click();
  });

  test('Responsive checks for FAQ', async ({ page }) => {
    // Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/faq');
    await expect(page.locator('h1').filter({ hasText: 'Help Center & FAQs' })).toBeVisible();
    const mobileWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(mobileWidth).toBeLessThanOrEqual(390); // No horizontal overflow

    // Tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/faq');
    const tabletWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(tabletWidth).toBeLessThanOrEqual(768);

    // Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    const desktopWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(desktopWidth).toBeLessThanOrEqual(1440);
  });
});
