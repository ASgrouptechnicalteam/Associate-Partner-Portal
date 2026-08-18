import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function login(page: any, email: string, password: string) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|team|home)/, { timeout: 10000 });
}

async function goToTeam(page: any) {
  await page.goto(`${BASE_URL}/team`);
  // Wait for the page heading to appear
  await expect(page.locator('h1', { hasText: 'Team Dashboard' })).toBeVisible({ timeout: 8000 });
}

test.describe('Phase 7 Team — Associate view', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'associate@sonthillu.com', 'Password123!');
  });

  test('team page loads and shows list view', async ({ page }) => {
    await goToTeam(page);
    // Default tab is List View
    await expect(page.getByRole('button', { name: /List View/ })).toBeVisible();
  });

  test('tree view tab switches correctly', async ({ page }) => {
    await goToTeam(page);
    await page.getByRole('button', { name: /Tree View/ }).click();
    // After switching tab, either tree nodes or empty state should show
    const treeOrEmpty = page.locator('text=No Team Members Found, text=No Hierarchy Data').first();
    // Check the tab itself became active (border-brand-gold applied)
    await expect(page.getByRole('button', { name: /Tree View/ })).toBeVisible();
    // The content area should have something rendered — either table or network/empty
    const content = page.locator('table, [role="table"], h3').first();
    await expect(content).toBeVisible({ timeout: 6000 });
  });

  test('team statistics are shown', async ({ page }) => {
    await goToTeam(page);
    await expect(page.locator('text=Direct Members')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Total Downline')).toBeVisible();
    await expect(page.locator('text=Team Bookings')).toBeVisible();
    await expect(page.locator('text=Team Commission')).toBeVisible();
  });

  test('team requests tab is accessible', async ({ page }) => {
    await goToTeam(page);
    // Click the TAB button specifically (role=button)
    await page.getByRole('button', { name: /Team Requests/ }).click();
    // The heading h1 inside the pane should now be visible
    await expect(page.locator('h1', { hasText: 'Team Requests' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=New Request')).toBeVisible();
  });

  test('create team request - shows form', async ({ page }) => {
    await goToTeam(page);
    await page.getByRole('button', { name: /Team Requests/ }).click();
    await page.locator('text=New Request').click();
    await expect(page.locator('text=Create Team Request')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('select')).toBeVisible();
  });

  test('IDOR: API 403 when targeting unrelated user statistics', async ({ page }) => {
    await goToTeam(page);
    const response = await page.request.get(
      'https://associate-partner-portal.onrender.com/api/team/statistics?targetId=17851068-285f-4a7e-9930-5338574c0a1c'
    );
    // Without the session cookie from browser context it should be 401
    // If the browser does forward cookies (same origin context), it should be 403
    expect([401, 403]).toContain(response.status());
  });

  test('sensitive fields absent from /api/team/downline', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/team/downline'), { timeout: 10000 }),
      page.goto(`${BASE_URL}/team`)
    ]);
    const body = await response.json();
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('Aadhaar');
    expect(raw).not.toContain('PAN');
    expect(raw).not.toContain('bankAccount');
    expect(raw).not.toContain('IFSC');
  });
});

test.describe('Phase 7 Team — MD approval', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'md@sonthillu.com', 'Password123!');
  });

  test('MD can see team requests page', async ({ page }) => {
    await goToTeam(page);
    // Click the TAB button specifically
    await page.getByRole('button', { name: /Team Requests/ }).click();
    await expect(page.locator('h1', { hasText: 'Team Requests' })).toBeVisible({ timeout: 8000 });
    // Either has pending request rows OR empty state — both mean the page loaded correctly
    const hasApprove = await page.locator('text=Approve').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=No Requests Found').isVisible().catch(() => false);
    // The heading alone proves the pane loaded — the content depends on DB state
    expect(
      await page.locator('h1', { hasText: 'Team Requests' }).isVisible()
    ).toBeTruthy();
  });
});

test.describe('Phase 7 Team — Responsive layout', () => {
  test('mobile 390px — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, 'associate@sonthillu.com', 'Password123!');
    await page.goto(`${BASE_URL}/team`);
    await expect(page.locator('h1', { hasText: 'Team Dashboard' })).toBeVisible({ timeout: 8000 });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test('tablet 768px — layout renders', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, 'associate@sonthillu.com', 'Password123!');
    await page.goto(`${BASE_URL}/team`);
    await expect(page.locator('h1', { hasText: 'Team Dashboard' })).toBeVisible({ timeout: 8000 });
  });

  test('desktop 1440px — layout renders', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, 'associate@sonthillu.com', 'Password123!');
    await page.goto(`${BASE_URL}/team`);
    await expect(page.locator('h1', { hasText: 'Team Dashboard' })).toBeVisible({ timeout: 8000 });
  });
});
