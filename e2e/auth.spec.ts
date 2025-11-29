import { test, expect } from '@playwright/test';
import { registerUser, loginUser, generateTestEmail, registerAndLogin, logoutUser } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset any existing auth state
    await page.context().clearCookies();
  });

  test('should register a new user', async ({ page }) => {
    const email = generateTestEmail('register');
    const password = 'SecurePassword123!';
    
    const success = await registerUser(page, email, password, 'Test User', 'Test Organization');
    
    // Should redirect to dashboard or login
    expect(success).toBeTruthy();
    expect(page.url()).toMatch(/\/dashboard|\/login/);
  });

  test('should login with newly created credentials', async ({ page }) => {
    // First register a new user
    const email = generateTestEmail('login');
    const password = 'SecureTestPassword123!';
    
    await registerUser(page, email, password);
    
    // Clear cookies to simulate logout
    await page.context().clearCookies();
    
    // Now login with the same credentials
    const success = await loginUser(page, email, password);
    
    // Should successfully login and redirect to dashboard
    expect(success).toBeTruthy();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Check that user is logged in
    await expect(page.locator('text=Bakalr CMS')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    // First create an account so we know a valid format
    const validEmail = generateTestEmail('invalid-creds');
    await registerUser(page, validEmail, 'ValidPassword123!');
    
    // Clear cookies and try to login with wrong password
    await page.context().clearCookies();
    await page.goto('/login');
    
    await page.fill('input[name="email"]', validEmail);
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should stay on login page or show error
    // The page should not redirect to dashboard
    await page.waitForTimeout(2000); // Give time for any error messages
    expect(page.url()).toMatch(/\/login/);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="full_name"]', 'Test User');
    await page.fill('input[name="organization_name"]', 'Test Org');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should either stay on page or show validation
    await page.waitForTimeout(1000);
    
    // Check if still on register page (validation prevented submission)
    expect(page.url()).toMatch(/\/register/);
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login a new user
    await registerAndLogin(page, 'logout-test');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout
    await logoutUser(page);
    
    // Should redirect to login page or home
    expect(page.url()).toMatch(/\/login|\/(?:$|\?)/);
  });
});
