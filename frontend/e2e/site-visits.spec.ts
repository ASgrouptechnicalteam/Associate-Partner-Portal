import { test, expect } from '@playwright/test';

test.describe('Site Visits Module', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    await page.goto('/login');
    await page.fill('#email', 'associate@sonthillu.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to Site Visits list and verify layout', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open drawer on mobile or click sidebar on desktop
    const isMobile = page.viewportSize()?.width! < 768;
    if (isMobile) {
      await page.click('button[aria-label="Open sidebar"]');
    }

    await page.click('text=Site Visits');
    
    // Wait for URL and list
    await expect(page).toHaveURL(/\/site-visits/);
    await expect(page.locator('h1', { hasText: 'Site Visits' }).first()).toBeVisible();

    // Verify there's no horizontal overflow (responsive check)
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });

  test('should schedule a new site visit successfully', async ({ page }) => {
    await page.goto('/site-visits');
    await expect(page.locator('text=Schedule Visit').first()).toBeVisible({ timeout: 15000 });
    await page.click('text=Schedule Visit');
    
    await expect(page).toHaveURL(/\/site-visits\/create/);
    await expect(page.locator('h3', { hasText: 'Schedule Site Visit' }).first()).toBeVisible();

    // Fill form
    await page.selectOption('select#projectId', { index: 1 }); // select first available project
    await page.fill('input#customerName', 'E2E Customer');
    await page.fill('input#customerPhone', '9998887776');
    await page.fill('input#customerEmail', 'e2e@example.com');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input#visitDate', today);
    await page.fill('input#visitTime', '14:30');
    await page.fill('textarea#remarks', 'E2E Test remarks');

    await page.click('button[type="submit"]');

    // Should redirect to details page
    await expect(page).toHaveURL(/\/site-visits\/[a-zA-Z0-9-]{36}/);
    await expect(page.locator('text=E2E Customer')).toBeVisible();
    await expect(page.locator('span', { hasText: 'SCHEDULED' }).first()).toBeVisible();
  });

  test('should progress state machine', async ({ page }) => {
    await page.goto('/site-visits');
    // Wait for the list to load
    await expect(page.locator('text=Site Visits').first()).toBeVisible({ timeout: 15000 });
    // Click on the View link for E2E Customer (desktop table) or card (mobile)
    await page.locator('tr').filter({ hasText: 'E2E Customer' }).filter({ hasText: 'SCHEDULED' }).locator('a', { hasText: 'View' }).first().click().catch(async () => {
      // Fallback for mobile view if tr is not present
      await page.locator('div.bg-white.shadow.rounded-lg').filter({ hasText: 'E2E Customer' }).filter({ hasText: 'SCHEDULED' }).locator('a', { hasText: 'View Details' }).first().click();
    });
    
    // Check state is SCHEDULED
    // Proceed SCHEDULED -> ON_THE_WAY
    await page.click('text=Mark On The Way');
    await expect(page.locator('text=ON THE WAY')).toBeVisible();

    // Proceed ON_THE_WAY -> ARRIVED
    await page.click('text=Mark Arrived');
    await expect(page.locator('text=ARRIVED')).toBeVisible();

    // Proceed ARRIVED -> CUSTOMER_MET
    await page.click('text=Mark Customer Met');
    await expect(page.locator('text=CUSTOMER MET')).toBeVisible();

    // Proceed CUSTOMER_MET -> COMPLETED (requires outcome modal)
    await page.click('text=Complete Visit');
    // Wait for modal
    await expect(page.locator('text=Outcome / Feedback (Required)')).toBeVisible();
    await page.fill('textarea[placeholder="Customer showed interest in Plot 104..."]', 'Customer loved it.');
    const responsePromise = page.waitForResponse(response => response.url().includes('/v1/site-visits/') && response.request().method() === 'PATCH');
    await page.locator('div.fixed').locator('button', { hasText: 'Complete Visit' }).click();
    await responsePromise;

    await expect(page.locator('text=COMPLETED').first()).toBeVisible();
  });
});
