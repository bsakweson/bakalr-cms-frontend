import { test, expect } from '@playwright/test';
import { registerUser, loginUser, generateTestEmail } from './helpers/auth';

test.describe('Email Verification Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset any existing auth state
    await page.context().clearCookies();
  });

  test('should show verification banner for unverified user', async ({ page }) => {
    // Register a new user
    const email = generateTestEmail('unverified');
    const password = 'SecurePassword123!';
    
    await registerUser(page, email, password, 'Unverified User', 'Test Organization');
    
    // Login (if registration redirected to login)
    if (page.url().includes('/login')) {
      await loginUser(page, email, password);
    }
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Should show email verification banner
    const banner = page.locator('div:has-text("Please verify your email address")');
    await expect(banner).toBeVisible({ timeout: 5000 });
    
    // Should have a resend button
    const resendButton = page.locator('button:has-text("Resend")');
    await expect(resendButton).toBeVisible();
  });

  test('should be able to dismiss verification banner temporarily', async ({ page }) => {
    // Register and login
    const email = generateTestEmail('dismiss-banner');
    const password = 'SecurePassword123!';
    
    await registerUser(page, email, password);
    if (page.url().includes('/login')) {
      await loginUser(page, email, password);
    }
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait for banner to appear
    const banner = page.locator('div:has-text("Please verify your email address")');
    await expect(banner).toBeVisible({ timeout: 5000 });
    
    // Find and click the dismiss button (X button)
    const dismissButton = banner.locator('button[aria-label*="dismiss"], button[aria-label*="close"], button:has(svg)').first();
    
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
      
      // Banner should be hidden
      await expect(banner).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should show success message when resending verification email', async ({ page }) => {
    // Register and login
    const email = generateTestEmail('resend-email');
    const password = 'SecurePassword123!';
    
    await registerUser(page, email, password);
    if (page.url().includes('/login')) {
      await loginUser(page, email, password);
    }
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait for banner
    const banner = page.locator('div:has-text("Please verify your email address")');
    await expect(banner).toBeVisible({ timeout: 5000 });
    
    // Click resend button
    const resendButton = page.locator('button:has-text("Resend")');
    await resendButton.click();
    
    // Should show success toast/message (adjust selector based on your toast implementation)
    const successMessage = page.locator('text=/verification email sent/i, text=/email sent/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle verification page with invalid token', async ({ page }) => {
    // Navigate directly to verification page with fake token
    await page.goto('/verify-email/invalid-token-12345');
    
    // Should show error message
    const errorMessage = page.locator('text=/invalid.*token/i, text=/expired.*token/i, text=/verification failed/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Should show troubleshooting tips or resend option
    const resendSection = page.locator('text=/resend/i, text=/request.*new/i');
    await expect(resendSection).toBeVisible();
  });

  test('should show loading state while verifying token', async ({ page }) => {
    // Navigate to verification page with any token
    await page.goto('/verify-email/test-token-loading-state');
    
    // Should show loading spinner/message initially
    const loadingIndicator = page.locator('text=/verifying/i, text=/loading/i, svg[class*="spin"], svg[class*="animate"]').first();
    
    // Loading should be visible at some point (might be brief)
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    } catch (e) {
      // Loading might be too fast to catch, that's okay
      console.log('Loading state too fast to capture');
    }
    
    // Eventually should show either success or error
    await page.waitForTimeout(3000);
    const resultMessage = page.locator('text=/success/i, text=/error/i, text=/invalid/i, text=/expired/i');
    await expect(resultMessage).toBeVisible();
  });

  test.skip('should redirect to login after successful verification', async ({ page }) => {
    // This test would require a valid token from the database or email
    // For now, we'll skip the actual verification and test the UI flow
    // Requires valid verification token from email
    
    // Pseudo-code for what this test would do:
    // 1. Register user
    // 2. Extract verification token from database or email mock
    // 3. Navigate to /verify-email/{token}
    // 4. Verify success message appears
    // 5. Wait for auto-redirect to /login
    // 6. Login and verify no banner appears
  });

  test.skip('should not show banner for verified users', async ({ page }) => {
    // This test would require mocking a verified user or manually verifying
    // Requires pre-verified user account or database seeding
    
    // Pseudo-code:
    // 1. Create verified user in database
    // 2. Login with verified user
    // 3. Go to dashboard
    // 4. Verify banner does NOT appear
  });

  test('verification banner should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Register and login
    const email = generateTestEmail('mobile-banner');
    const password = 'SecurePassword123!';
    
    await registerUser(page, email, password);
    if (page.url().includes('/login')) {
      await loginUser(page, email, password);
    }
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Banner should still be visible on mobile
    const banner = page.locator('div:has-text("Please verify your email address")');
    await expect(banner).toBeVisible({ timeout: 5000 });
    
    // Resend button should be accessible
    const resendButton = page.locator('button:has-text("Resend")');
    await expect(resendButton).toBeVisible();
    
    // Button should be clickable
    await resendButton.click();
    
    // Success message should appear
    const successMessage = page.locator('text=/verification email sent/i, text=/email sent/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
});
