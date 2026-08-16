import { test, expect } from '@playwright/test';

test.describe('Reviews - End to End', () => {
  let mdContext;
  let associateContext;

  test.beforeAll(async ({ browser }) => {
    // We assume the DB is seeded with users as per previous phases
    mdContext = await browser.newContext();
    associateContext = await browser.newContext();

    // Login MD
    const mdPage = await mdContext.newPage();
    await mdPage.goto('http://localhost:5173/login');
    await mdPage.fill('input[type="email"]', 'md@sonthillu.com');
    await mdPage.fill('input[type="password"]', 'Password123!');
    await mdPage.click('button[type="submit"]');
    await mdPage.waitForURL('http://localhost:5173/dashboard');
    await mdPage.close();

    // Login Associate
    const ascPage = await associateContext.newPage();
    await ascPage.goto('http://localhost:5173/login');
    await ascPage.fill('input[type="email"]', 'associate@sonthillu.com');
    await ascPage.fill('input[type="password"]', 'Password123!');
    await ascPage.click('button[type="submit"]');
    await ascPage.waitForURL('http://localhost:5173/dashboard');
    await ascPage.close();
  });

  test('Associate can access Review Requests page and it loads correctly', async () => {
    const page = await associateContext.newPage();
    await page.goto('http://localhost:5173/reviews/requests');

    await expect(page.locator('h1').filter({ hasText: 'Review Requests' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Generate Request' })).toBeVisible();
    await page.close();
  });

  test('MD can access Review Analytics page and it loads correctly', async () => {
    const page = await mdContext.newPage();
    await page.goto('http://localhost:5173/reviews/analytics');

    try {
      await expect(page.locator('h1').filter({ hasText: 'Review Analytics' })).toBeVisible({ timeout: 5000 });
    } catch (e) {
      const html = await page.content();
      console.log('Page HTML:', html);
      throw e;
    }
    await expect(page.locator('text=Total Reviews')).toBeVisible();
    await expect(page.locator('text=Total Bookings')).toBeVisible();
    await expect(page.locator('text=Average Category Scores')).toBeVisible();
    await page.close();
  });

  test('Public customer review form shows invalid link for bad token', async () => {
    const page = await associateContext.newPage(); // Doesn't matter which context, it's public
    await page.goto('http://localhost:5173/public/reviews/invalid-token-123');

    await expect(page.locator('text=Link Invalid')).toBeVisible();
    await expect(page.locator('text=Invalid or expired review link')).toBeVisible();
    await page.close();
  });
});
