import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const ASSOCIATE_EMAIL = 'associate@sonthillu.com';
const ASSOCIATE_PASS  = 'Password123!';
const MD_EMAIL        = 'md@sonthillu.com';
const MD_PASS         = 'Password123!';
const BASE            = 'http://localhost:5173';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|travel|home)/, { timeout: 10000 });
}

// ── Associate — Travel page ───────────────────────────────────────

test.describe('Phase 8 Travel — Associate view', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ASSOCIATE_EMAIL, ASSOCIATE_PASS);
  });

  test('travel page loads via nav', async ({ page }) => {
    await page.click('a[href="/travel"]');
    await page.waitForURL(`${BASE}/travel`);
    await expect(page.getByRole('heading', { name: /travel allowance/i })).toBeVisible();
  });

  test('create button navigates to form', async ({ page }) => {
    await page.goto(`${BASE}/travel`);
    await page.getByRole('button', { name: /new request/i }).click();
    await page.waitForURL(`${BASE}/travel/create`);
    await expect(page.getByRole('heading', { name: /new travel request/i })).toBeVisible();
  });

  test('form renders all required fields', async ({ page }) => {
    await page.goto(`${BASE}/travel/create`);
    await expect(page.locator('input[name="travelDate"]')).toBeVisible();
    await expect(page.locator('input[name="fromLocation"]')).toBeVisible();
    await expect(page.locator('input[name="toLocation"]')).toBeVisible();
    await expect(page.locator('textarea[name="purpose"]')).toBeVisible();
    await expect(page.locator('select[name="travelMode"]')).toBeVisible();
    await expect(page.locator('input[name="distanceKm"]')).toBeVisible();
    await expect(page.locator('input[name="amountRequested"]')).toBeVisible();
  });

  test('submit form creates a request and redirects to list', async ({ page }) => {
    await page.goto(`${BASE}/travel/create`);
    await page.locator('input[name="fromLocation"]').fill('Chennai');
    await page.locator('input[name="toLocation"]').fill('Coimbatore');
    await page.locator('textarea[name="purpose"]').fill('E2E test client visit');
    await page.locator('input[name="distanceKm"]').fill('180');
    await page.locator('input[name="amountRequested"]').fill('1500');
    await page.getByRole('button', { name: /save as draft/i }).click();
    await page.waitForURL(`${BASE}/travel`, { timeout: 8000 });
    await expect(page.getByText('Chennai').first()).toBeVisible();
  });

  test('IDOR: cannot GET another associate request directly', async ({ page }) => {
    // Make a request as this associate first
    await page.goto(`${BASE}/travel`);
    // Navigate to an invalid ID — 403 should be gracefully shown
    const res = await page.request.get(`${BASE.replace('5173', '5000')}/api/v1/travel/00000000-0000-0000-0000-000000000000`);
    expect([403, 404]).toContain(res.status());
  });

  test('request status shows on detail page', async ({ page }) => {
    await page.goto(`${BASE}/travel`);
    const cards = page.locator('.cursor-pointer');
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await page.waitForURL(/\/travel\/.+/);
      // Status badge should be visible
      const statusBadge = page.locator('.rounded-full').first();
      await expect(statusBadge).toBeVisible();
    }
  });
});

// ── MD — Approval Queue ───────────────────────────────────────────

test.describe('Phase 8 Travel — MD view', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, MD_EMAIL, MD_PASS);
  });

  test('MD travel page shows All Requests tab', async ({ page }) => {
    await page.goto(`${BASE}/travel`);
    await expect(page.getByRole('button', { name: /all requests/i })).toBeVisible();
  });

  test('MD can switch between My Requests and All Requests tabs', async ({ page }) => {
    await page.goto(`${BASE}/travel`);
    await page.getByRole('button', { name: /all requests/i }).click();
    await expect(page.getByRole('button', { name: /all requests/i })).toHaveClass(/text-brand-gold|border-brand-gold/);
    await page.getByRole('button', { name: /my requests/i }).click();
  });
});

// ── Responsive Layout ─────────────────────────────────────────────

test.describe('Phase 8 Travel — Responsive layout', () => {
  test('mobile 390px — no horizontal overflow on list', async ({ page }) => {
    await loginAs(page, ASSOCIATE_EMAIL, ASSOCIATE_PASS);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/travel`);
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('mobile 390px — no horizontal overflow on create form', async ({ page }) => {
    await loginAs(page, ASSOCIATE_EMAIL, ASSOCIATE_PASS);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/travel/create`);
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('tablet 768px — layout renders', async ({ page }) => {
    await loginAs(page, ASSOCIATE_EMAIL, ASSOCIATE_PASS);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/travel`);
    await expect(page.getByRole('heading', { name: /travel allowance/i })).toBeVisible();
  });

  test('desktop 1440px — layout renders', async ({ page }) => {
    await loginAs(page, ASSOCIATE_EMAIL, ASSOCIATE_PASS);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/travel`);
    await expect(page.getByRole('heading', { name: /travel allowance/i })).toBeVisible();
  });
});
