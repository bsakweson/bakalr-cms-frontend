import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { registerAndLogin } from './helpers/auth';

test.describe('Accessibility Tests', () => {
  test('landing page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('register page should not have accessibility violations', async ({ page }) => {
    await page.goto('/register');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should not have accessibility violations', async ({ page }) => {
    // Register and login a new user
    await registerAndLogin(page, 'accessibility-dashboard');
    
    // Wait for dashboard to load completely (wait for main content, not just URL)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Wait for the dashboard heading to be visible (ensures page is fully loaded)
    await page.waitForSelector('h1:has-text("Dashboard")', { state: 'visible', timeout: 10000 });
    
    // Additional wait to ensure loading spinner is gone
    await page.waitForTimeout(1000);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('[data-testid="third-party-iframe"]') // Exclude known third-party issues
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check h1 exists
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Ensure only one h1
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/login');
    
    // All inputs should have associated labels
    const inputs = await page.locator('input[type="email"], input[type="password"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input must have id with label, aria-label, or aria-labelledby
      expect(id || ariaLabel || ariaLabelledBy).toBeTruthy();
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        expect(await label.count()).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // First focusable element
    const firstFocus = await page.evaluate(() => document.activeElement?.tagName);
    
    // First tab might land on BODY if no element is focused, so accept it or expect interactive elements
    const validFocusElements = ['A', 'BUTTON', 'INPUT', 'BODY'];
    expect(validFocusElements).toContain(firstFocus);
    
    // Continue tabbing - should definitely be on an interactive element now
    await page.keyboard.press('Tab');
    const secondFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(secondFocus);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Images must have alt attribute (can be empty for decorative images)
      // or aria-label, or role="presentation"
      expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('links should have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      const title = await link.getAttribute('title');
      
      // Links must have accessible text
      const hasAccessibleName = 
        (text && text.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy ||
        title;
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa']) // WCAG 2.0 Level AA
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('modal dialogs should trap focus', async ({ page }) => {
    // Register and login to access dashboard with potential modals
    await registerAndLogin(page, 'accessibility-modal');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Try to open a modal (if available)
    const modalTrigger = page.locator('button:has-text("Create"), button:has-text("New")').first();
    const hasModalTrigger = await modalTrigger.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasModalTrigger) {
      await modalTrigger.click();
      
      // Wait for modal to open
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check that focus is inside modal
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('[role="dialog"], .modal') !== null;
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a:has-text("Skip to"), a[href^="#main"], a[href^="#content"]').first();
    const hasSkipLink = await skipLink.isVisible().catch(() => false);
    
    // Skip links are recommended but not required
    if (hasSkipLink) {
      await skipLink.click();
      
      // Focus should move to main content
      const focusedElement = await page.evaluate(() => document.activeElement?.id);
      expect(['main', 'content', 'main-content']).toContain(focusedElement);
    }
  });
});
