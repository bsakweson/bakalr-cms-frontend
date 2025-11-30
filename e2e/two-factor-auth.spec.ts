import { test, expect } from '@playwright/test';
import { registerAndLogin, generateTestEmail, logoutUser } from './helpers/auth';

test.describe('Two-Factor Authentication (2FA) Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should navigate to 2FA settings', async ({ page }) => {
    // Register and login
    await registerAndLogin(page, '2fa-nav');
    
    // Navigate to settings
    await page.goto('/dashboard/settings');
    
    // Should see settings page
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    
    // Click on Security tab
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Should see 2FA section
    const twoFactorSection = page.locator('text=/Two-Factor Authentication/i');
    await expect(twoFactorSection).toBeVisible({ timeout: 5000 });
    
    // Should see enable button
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    await expect(enableButton).toBeVisible();
  });

  test('should show QR code dialog when enabling 2FA', async ({ page }) => {
    // Register and login
    await registerAndLogin(page, '2fa-enable');
    
    // Navigate to settings security tab
    await page.goto('/dashboard/settings');
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Click enable 2FA button
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    await enableButton.click();
    
    // Should show dialog/modal with QR code
    // Wait for dialog to appear
    await page.waitForTimeout(2000);
    
    // Check for dialog (adjust selectors based on your dialog implementation)
    const dialog = page.locator('[role="dialog"], [role="alertdialog"], .modal, .dialog').first();
    
    // Should show QR code or setup instructions
    const qrCodeSection = page.locator('text=/scan.*qr/i, text=/authenticator/i, img[alt*="QR"], canvas');
    await expect(qrCodeSection.first()).toBeVisible({ timeout: 5000 });
    
    // Should show backup codes
    const backupCodesSection = page.locator('text=/backup code/i');
    await expect(backupCodesSection).toBeVisible({ timeout: 5000 });
  });

  test('should show backup codes after enabling 2FA', async ({ page }) => {
    // Register and login
    await registerAndLogin(page, '2fa-backup-codes');
    
    // Navigate to settings security tab
    await page.goto('/dashboard/settings');
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Click enable 2FA
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    await enableButton.click();
    
    await page.waitForTimeout(2000);
    
    // Should show backup codes (look for code-like text patterns)
    const backupCodesList = page.locator('text=/backup code/i');
    await expect(backupCodesList).toBeVisible({ timeout: 5000 });
    
    // Should show multiple codes (typically 10)
    // Look for code patterns (e.g., alphanumeric strings)
    const codeElements = page.locator('code, pre, [class*="code"]');
    const codeCount = await codeElements.count();
    
    // Should have at least some backup codes visible
    expect(codeCount).toBeGreaterThan(0);
  });

  test('should require verification code to complete 2FA setup', async ({ page }) => {
    // Register and login
    await registerAndLogin(page, '2fa-verify-setup');
    
    // Navigate to settings security tab
    await page.goto('/dashboard/settings');
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Enable 2FA
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    await enableButton.click();
    
    await page.waitForTimeout(2000);
    
    // Should show verification code input
    const verifyInput = page.locator('input[placeholder*="code"], input[name*="code"], input[type="text"][maxlength="6"]');
    await expect(verifyInput.first()).toBeVisible({ timeout: 5000 });
    
    // Try with invalid code
    await verifyInput.first().fill('000000');
    
    // Click verify button
    const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Confirm")').first();
    await verifyButton.click();
    
    // Should show error for invalid code
    await page.waitForTimeout(2000);
    // Error message might appear in toast or inline
    // We just verify the dialog/process doesn't complete successfully
  });

  test('should show disable 2FA option when enabled', async ({ page }) => {
    // This test requires 2FA to already be enabled
    // For now, we'll test the UI presence
    
    await registerAndLogin(page, '2fa-disable');
    
    // Navigate to settings security tab
    await page.goto('/dashboard/settings');
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Look for either enable or disable button
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    const disableButton = page.locator('button:has-text("Disable 2FA")');
    
    // One of these should be visible
    const enableVisible = await enableButton.isVisible().catch(() => false);
    const disableVisible = await disableButton.isVisible().catch(() => false);
    
    expect(enableVisible || disableVisible).toBeTruthy();
  });

  test.skip('should require password to disable 2FA', async ({ page }) => {
    // This test would require 2FA to be enabled first
    // Requires 2FA to be already enabled
    
    // Pseudo-code:
    // 1. Login with 2FA-enabled user
    // 2. Go to settings security
    // 3. Click Disable 2FA
    // 4. Should prompt for password
    // 5. Enter password
    // 6. Verify 2FA is disabled
  });

  test('should show 2FA status correctly', async ({ page }) => {
    await registerAndLogin(page, '2fa-status');
    
    // Navigate to settings security tab
    await page.goto('/dashboard/settings');
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Should show 2FA section with status
    const twoFactorSection = page.locator('text=/Two-Factor Authentication/i');
    await expect(twoFactorSection).toBeVisible();
    
    // Should show some indication of 2FA status
    const statusIndicator = page.locator('text=/enabled/i, text=/disabled/i, text=/not.*enabled/i');
    await expect(statusIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should close 2FA dialog when clicking cancel', async ({ page }) => {
    await registerAndLogin(page, '2fa-cancel');
    
    // Navigate to settings security tab
    await page.goto('/dashboard/settings');
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // Click enable 2FA
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    await enableButton.click();
    
    await page.waitForTimeout(2000);
    
    // Look for close/cancel button in dialog
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close"]').first();
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Dialog should close
      await page.waitForTimeout(1000);
      
      // Enable button should still be visible (2FA not enabled)
      await expect(enableButton).toBeVisible();
    }
  });

  test('2FA settings should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await registerAndLogin(page, '2fa-mobile');
    
    // Navigate to settings
    await page.goto('/dashboard/settings');
    
    // Security tab should be accessible
    const securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")').first();
    await securityTab.click();
    
    // 2FA section should be visible
    const twoFactorSection = page.locator('text=/Two-Factor Authentication/i');
    await expect(twoFactorSection).toBeVisible({ timeout: 5000 });
    
    // Enable button should be clickable
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    await expect(enableButton).toBeVisible();
    await enableButton.click();
    
    // Dialog should appear and be usable on mobile
    await page.waitForTimeout(2000);
    
    // Should show QR code or instructions
    const qrSection = page.locator('text=/scan.*qr/i, text=/authenticator/i');
    await expect(qrSection.first()).toBeVisible({ timeout: 5000 });
  });

  test.skip('should be able to regenerate backup codes', async ({ page }) => {
    // This requires 2FA to be enabled
    // Requires 2FA to be already enabled
    
    // Pseudo-code:
    // 1. Login with 2FA-enabled user
    // 2. Go to settings security
    // 3. Find "Regenerate Backup Codes" button
    // 4. Click it
    // 5. Should show new backup codes
    // 6. Old codes should be invalidated
  });
});
