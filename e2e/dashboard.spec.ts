import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'dashboard-test');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should display dashboard with sidebar', async ({ page }) => {
    // Check sidebar logo/title (use first() to avoid strict mode violation)
    await expect(page.locator('text=Bakalr CMS').first()).toBeVisible();
    
    // Check navigation items
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/content"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/content-types"]')).toBeVisible();
    await expect(page.locator('a:has-text("Media")')).toBeVisible();
    await expect(page.locator('a:has-text("Users")')).toBeVisible();
    await expect(page.locator('a:has-text("Roles")')).toBeVisible();
    await expect(page.locator('a:has-text("Translations")')).toBeVisible();
    await expect(page.locator('a:has-text("Templates")')).toBeVisible();
    await expect(page.locator('a:has-text("Themes")')).toBeVisible();
  });

  test('should navigate to content page', async ({ page }) => {
    await page.click('a:has-text("Content")');
    await expect(page).toHaveURL(/\/dashboard\/content/);
  });

  test('should navigate to users page', async ({ page }) => {
    await page.click('a:has-text("Users")');
    await expect(page).toHaveURL(/\/dashboard\/users/);
  });

  test('should navigate to media page', async ({ page }) => {
    await page.click('a:has-text("Media")');
    await expect(page).toHaveURL(/\/dashboard\/media/);
  });

  test('should open API docs in new tab', async ({ page, context }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('a:has-text("API Docs")')
    ]);
    
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('8000');
  });

  test('should display user profile menu', async ({ page }) => {
    // Click the avatar button
    await page.click('button:has([data-slot="avatar-fallback"])', { timeout: 5000 });
    
    // Wait a bit for dropdown animation
    await page.waitForTimeout(300);
    
    // Check dropdown items (use .last() since Settings appears in sidebar too)
    await expect(page.locator('text=Settings').last()).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Log out')).toBeVisible();
  });
});
