import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Media Management', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'media-test');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.goto('/dashboard/media');
  });

  test('should display media library', async ({ page }) => {
    // Check page heading
    await expect(page.locator('h1, h2').filter({ hasText: /Media/i })).toBeVisible({ timeout: 10000 });
    
    // Check for media grid or list
    const mediaContainer = page.locator('[data-testid="media-grid"], .media-grid, table').first();
    await expect(mediaContainer).toBeVisible();
  });

  test('should upload a file', async ({ page }) => {
    // Look for upload button or file input
    const uploadButton = page.locator('button:has-text("Upload"), label:has-text("Upload")').first();
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    }
    
    // Locate file input
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test file buffer
    const testFilePath = '/tmp/test-image.jpg';
    
    // Upload file
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Should show upload progress or success
    await expect(page.locator('text=/Uploading|Uploaded|Success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should filter media by type', async ({ page }) => {
    // Look for type filter
    const typeFilter = page.locator('select[name*="type"], button:has-text("Type"), [data-testid="type-filter"]').first();
    
    if (await typeFilter.isVisible()) {
      // If it's a select
      if (await typeFilter.evaluate(el => el.tagName) === 'SELECT') {
        await typeFilter.selectOption('image');
      } else {
        // If it's a button dropdown
        await typeFilter.click();
        await page.click('text="Images"');
      }
      
      await page.waitForTimeout(1000);
      
      // Check that URL or UI reflects filter
      const url = page.url();
      expect(url).toContain('type');
    }
  });

  test('should search media files', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      // Should show filtered results or no results message
      const hasResults = await page.locator('[data-testid="media-item"], .media-item').count() > 0;
      const noResults = await page.locator('text=/No (media|results)/i').isVisible();
      
      expect(hasResults || noResults).toBeTruthy();
    }
  });

  test('should view media details', async ({ page }) => {
    // Check if there are media files
    const firstMedia = page.locator('[data-testid="media-item"], .media-item, table tbody tr').first();
    const hasMedia = await firstMedia.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasMedia) {
      console.log('No media files available, skipping view test');
      test.skip();
    }
    
    // Click on media item
    await firstMedia.click();
    
    // Should show details in modal or sidebar
    await expect(page.locator('text=/Details|Properties|Info/i')).toBeVisible({ timeout: 5000 });
    
    // Check for common metadata fields
    await expect(page.locator('text=/File (name|type|size)/i')).toBeVisible();
  });

  test('should update media metadata', async ({ page }) => {
    // Check if there are media files
    const hasMedia = await page.locator('[data-testid="media-item"], .media-item').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasMedia) {
      console.log('No media files available, skipping update test');
      test.skip();
    }
    
    // Click on first media item
    await page.locator('[data-testid="media-item"], .media-item').first().click();
    
    // Look for edit button
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"]').first();
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
    }
    
    // Update alt text
    const altInput = page.locator('input[name="alt_text"], input[placeholder*="alt" i]').first();
    if (await altInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await altInput.fill('Updated alt text');
      
      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Update")');
      
      // Should show success message
      await expect(page.locator('text=/Updated|Saved/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete media file', async ({ page }) => {
    // Check if there are media files
    const mediaCount = await page.locator('[data-testid="media-item"], .media-item, table tbody tr').count();
    
    if (mediaCount === 0) {
      console.log('No media files available, skipping delete test');
      test.skip();
    }
    
    // Click on first media item to select
    await page.locator('[data-testid="media-item"], .media-item, table tbody tr').first().click();
    
    // Find delete button
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="Delete"]').first();
    await deleteButton.click();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    
    // Should show success message
    await expect(page.locator('text=/Deleted|Removed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle bulk selection', async ({ page }) => {
    // Check if there are multiple media files
    const mediaCount = await page.locator('[data-testid="media-item"], .media-item').count();
    
    if (mediaCount < 2) {
      console.log('Not enough media files for bulk selection test');
      test.skip();
    }
    
    // Look for select all checkbox
    const selectAllCheckbox = page.locator('input[type="checkbox"][aria-label*="Select all" i], input[type="checkbox"][name="select-all"]').first();
    
    if (await selectAllCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectAllCheckbox.check();
      
      // Should show bulk actions toolbar
      await expect(page.locator('text=/selected|Bulk Actions/i')).toBeVisible();
    }
  });
});
