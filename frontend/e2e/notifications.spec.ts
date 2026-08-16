import { test, expect } from '@playwright/test';

test.describe('Notifications flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:5173/login');
    
    // Fill credentials for MD
    await page.fill('input[type="email"]', 'md@sonthillu.com');
    await page.fill('input[type="password"]', 'Password123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should display notification bell in header', async ({ page }) => {
    // Verify bell icon is visible
    const bellButton = page.locator('header button[aria-label="Notifications"]');
    await expect(bellButton).toBeVisible();
    
    // Click bell to open dropdown
    await bellButton.click();
    
    // Verify dropdown opens
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
    await expect(page.getByText('View All Notifications')).toBeVisible();
  });

  test('should navigate to notifications page', async ({ page }) => {
    // Click bell to open dropdown
    await page.locator('header button[aria-label="Notifications"]').click();
    
    // Click "View All Notifications"
    await page.getByText('View All Notifications').click();
    
    // Verify navigation
    await page.waitForURL('http://localhost:5173/notifications');
    await expect(page.locator('h1').filter({ hasText: 'Notifications' })).toBeVisible();
  });

  test('should have filter controls on notifications page', async ({ page }) => {
    await page.goto('http://localhost:5173/notifications');
    
    // Wait for the h1 to appear
    await expect(page.locator('h1').filter({ hasText: 'Notifications' })).toBeVisible();
    
    // Verify filters
    const select = page.locator('select');
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('all');
    
    // Select unread
    await select.selectOption('unread');
    await expect(select).toHaveValue('unread');
    
    // Verify mark all as read button
    const markAllBtn = page.getByRole('button', { name: /Mark All as Read/i });
    await expect(markAllBtn).toBeVisible();
  });
});
