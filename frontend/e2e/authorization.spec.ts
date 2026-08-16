import { test, expect } from '@playwright/test';

test.describe('Phase 9 — Pending Authorization (MD Dashboard)', () => {

  test('Associate does not see Pending Authorization navigation and is blocked', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'associate@sonthillu.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:5173/dashboard');
    
    // Verify nav item is missing
    const pendingNav = page.locator('a:has-text("Pending Authorization")');
    await expect(pendingNav).toHaveCount(0);

    // Try direct access
    await page.goto('http://localhost:5173/authorizations');
    
    // It should redirect to dashboard because of ProtectedRoute role guard
    await page.waitForURL('http://localhost:5173/dashboard');
  });

  test('MD sees Pending Authorization navigation and can access dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'md@sonthillu.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:5173/dashboard');
    
    // Click navigation
    await page.click('a:has-text("Pending Authorization")');
    await page.waitForURL('http://localhost:5173/authorizations');

    // Verify headers
    await expect(page.locator('h1', { hasText: 'Pending Authorization' })).toBeVisible();

    // Verify summary cards render (there are 5)
    await expect(page.locator('dt', { hasText: 'Projects' })).toBeVisible();
    await expect(page.locator('dt', { hasText: 'Bookings' })).toBeVisible();
    await expect(page.locator('dt', { hasText: 'Team Requests' })).toBeVisible();
    await expect(page.locator('dt', { hasText: 'Travel Requests' })).toBeVisible();
    await expect(page.locator('dt', { hasText: 'Commission Policies' })).toBeVisible();
  });

  test('Mobile responsive view has no horizontal scroll', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'md@sonthillu.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:5173/dashboard');

    // Mobile nav might be hidden behind a hamburger, so we navigate directly
    await page.goto('http://localhost:5173/authorizations');
    await expect(page.locator('h1', { hasText: 'Pending Authorization' })).toBeVisible();

    // Check if horizontal scrollbar exists by evaluating JS
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

});
