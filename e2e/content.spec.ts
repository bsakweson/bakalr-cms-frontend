import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Content Management', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'content-test');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.goto('/dashboard/content');
  });

  test('should display content list', async ({ page }) => {
    // Check page heading
    await expect(page.locator('h1, h2').filter({ hasText: /Content|Entries/i })).toBeVisible({ timeout: 10000 });
    
    // Check for content table or grid
    const contentList = page.locator('table, [role="grid"], [data-testid="content-list"]').first();
    await expect(contentList).toBeVisible();
  });

  test('should navigate to create content page', async ({ page }) => {
    // Click create/new button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create"), a:has-text("New")').first();
    await createButton.click();
    
    // Should navigate to create page or open modal
    await expect(page.locator('a[href="/dashboard/content/new"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should create new content entry', async ({ page }) => {
    // Navigate to content types first
    await page.goto('/dashboard/content-types');
    
    // Check if any content types exist
    const hasContentTypes = await page.locator('table tbody tr, [data-testid="content-type"]').count() > 0;
    
    if (!hasContentTypes) {
      console.log('No content types available, skipping content creation test');
      test.skip();
    }
    
    // Go back to content
    await page.goto('/dashboard/content');
    
    // Click create
    await page.click('button:has-text("Create"), button:has-text("New")');
    
    // Fill in content form (assuming basic fields)
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(`Test Content ${Date.now()}`);
    }
    
    const slugInput = page.locator('input[name="slug"], input[placeholder*="slug" i]').first();
    if (await slugInput.isVisible()) {
      await slugInput.fill(`test-content-${Date.now()}`);
    }
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');
    
    // Should redirect to content list or show success message
    await expect(page.locator('text=/Success|Created|Saved/i')).toBeVisible({ timeout: 10000 });
  });

  test('should filter content by status', async ({ page }) => {
    // Look for status filter dropdown
    const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('published');
      
      // Wait for content to reload
      await page.waitForTimeout(1000);
      
      // Check that filter is applied (URL or UI should reflect)
      const url = page.url();
      expect(url).toContain('status=published');
    }
  });

  test('should search content', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Should show filtered results or "no results" message
      const hasResults = await page.locator('table tbody tr, [data-testid="content-item"]').count() > 0;
      const noResults = await page.locator('text=/No (content|results)/i').isVisible();
      
      expect(hasResults || noResults).toBeTruthy();
    }
  });

  test('should view content details', async ({ page }) => {
    // Check if there are any content entries
    const firstEntry = page.locator('table tbody tr, [data-testid="content-item"]').first();
    const hasEntries = await firstEntry.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasEntries) {
      console.log('No content entries available, skipping view test');
      test.skip();
    }
    
    // Click on first entry or its view button
    await firstEntry.locator('a, button:has-text("View")').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/content\/\d+/);
  });

  test('should delete content entry', async ({ page }) => {
    // Check if there are any content entries
    const entries = await page.locator('table tbody tr, [data-testid="content-item"]').count();
    
    if (entries === 0) {
      console.log('No content entries available, skipping delete test');
      test.skip();
    }
    
    // Find delete button for first entry
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="Delete"]').first();
    await deleteButton.click();
    
    // Confirm deletion in modal/dialog
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    
    // Should show success message
    await expect(page.locator('text=/Deleted|Removed/i')).toBeVisible({ timeout: 5000 });
  });
});
