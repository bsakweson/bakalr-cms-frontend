import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page with correct branding', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Bakalr CMS/);
    
    // Check main heading
    const heading = page.locator('h1:has-text("Bakalr CMS")');
    await expect(heading).toBeVisible();
    
    // Check description
    await expect(page.locator('text=Modern Headless Content Management System')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
    
    // Check feature cards by looking for the heading elements
    await expect(page.getByRole('heading', { name: 'Multi-Language' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Custom Theming' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GraphQL API' })).toBeVisible();
  });

  test('should have correct meta tags and favicon', async ({ page }) => {
    await page.goto('/');
    
    // Check favicon (multiple link tags exist)
    const favicon = page.locator('link[rel="icon"]').first();
    await expect(favicon).toHaveAttribute('href', /favicon/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /headless CMS/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1', { hasText: 'Sign in' })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1', { hasText: 'Create account' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is still visible on mobile
    await expect(page.locator('h1', { hasText: 'Bakalr CMS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });
});
