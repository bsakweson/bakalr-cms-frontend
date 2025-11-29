import { Page } from '@playwright/test';

/**
 * Register a new user account
 */
export async function registerUser(page: Page, email: string, password: string, fullName: string = 'Test User', organizationName: string = 'Test Org') {
  await page.goto('/register');
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="full_name"]', fullName);
  await page.fill('input[name="organization_name"]', organizationName);
  
  await page.click('button[type="submit"]');
  
  // Wait for either dashboard redirect or login page (depends on backend config)
  try {
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Login with existing credentials
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  await page.click('button[type="submit"]');
  
  // Wait for dashboard redirect
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix: string = 'test') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Register and login a new user in one step
 */
export async function registerAndLogin(page: Page, emailPrefix: string = 'test') {
  const email = generateTestEmail(emailPrefix);
  const password = 'SecureTestPassword123!';
  
  // Try to register
  await registerUser(page, email, password);
  
  // If registration redirects to login, login
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    await loginUser(page, email, password);
  }
  
  return { email, password };
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page) {
  // Close any open modals first (like onboarding tour)
  const closeButtons = page.locator('button:has-text("Skip"), button:has-text("Get Started"), button:has-text("Close")');
  if (await closeButtons.first().isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButtons.first().click();
    await page.waitForTimeout(500);
  }
  
  // Click the avatar button and wait for dropdown to be visible
  await page.click('button:has([data-slot="avatar-fallback"])');
  
  // Wait for the Log out button to be visible in the dropdown
  await page.waitForSelector('text=Log out', { state: 'visible', timeout: 5000 });
  
  // Click logout
  await page.click('text=Log out');
  
  // Wait for navigation to complete with more lenient timeout
  await page.waitForURL(/\/login|\/(?:$|\?)/, { timeout: 20000, waitUntil: 'networkidle' });
}
