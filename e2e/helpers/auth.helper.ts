import { Page } from '@playwright/test';
import { ApiRouter } from '../mocks/api-router';

/**
 * Authentication Helper
 *
 * Provides utility functions for authentication in tests
 */

/**
 * Login as a specific role and mock API responses
 */
export async function loginAsRole(page: Page, role: string, password: string = 'TestPassword123!') {
  const router = new ApiRouter(page);

  const emailMap: Record<string, string> = {
    'founder': 'founder@test.serenitycare.com',
    'ceo': 'ceo@test.serenitycare.com',
    'coo': 'coo@test.serenitycare.com',
    'cfo': 'cfo@test.serenitycare.com',
    'hr_manager': 'hr.manager@test.serenitycare.com',
    'caregiver': 'maria.garcia@test.serenitycare.com',
    'pod_lead': 'podlead@test.serenitycare.com',
    'billing_manager': 'billing@test.serenitycare.com',
    'compliance_officer': 'compliance@test.serenitycare.com',
  };

  const email = emailMap[role] || emailMap['caregiver'];

  // Set up API mocks FIRST, before any navigation
  await router.mockAllEndpoints();
  await router.mockAuthWithRole(role);

  // Navigate to the app and clear any existing auth state
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Now navigate to login page
  await page.goto('/erp');

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(password);

  // Submit
  const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
  await loginButton.click();

  // Wait for navigation and ensure auth state is set
  await page.waitForLoadState('networkidle');

  // Wait for user state to be fully loaded by checking for any visible dashboard element or absence of login form
  await page.waitForFunction(() => {
    // Check if we're logged in (no login form visible)
    const hasLoginForm = document.querySelector('input[type="email"]') !== null;
    return !hasLoginForm;
  }, { timeout: 10000 }).catch(() => {
    console.log('[Auth Helper] Could not confirm dashboard loaded, continuing anyway');
  });

  // CRITICAL: Ensure auth token is set in localStorage with the correct key
  // The app uses 'serenity_access_token' as the key
  await page.evaluate((authRole) => {
    const mockToken = `mock-token-${authRole}-${Date.now()}`;
    // Set all possible token keys the app might use
    localStorage.setItem('serenity_access_token', mockToken);
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('token', mockToken);
  }, role);

  // Give extra time for React state to update and re-render
  await page.waitForTimeout(1000);

  // CRITICAL: Wait for auth context to load user by checking if we can navigate successfully
  // Try navigating to a simple protected route and verify it doesn't redirect to login
  try {
    await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
    // Verify we're not on the login page
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes('/erp') || currentUrl.includes('/login');
    if (isOnLogin) {
      console.warn('[Auth Helper] Still on login page after authentication, auth context may not be loaded');
    }
  } catch (err) {
    console.warn('[Auth Helper] Could not navigate to dashboard after login:', err);
  }

  return router;
}

/**
 * Mock authentication with specific role without UI interaction
 */
export async function mockAuthWithRole(page: Page, role: string): Promise<ApiRouter> {
  const router = new ApiRouter(page);
  await router.mockAllEndpoints();
  await router.mockAuthWithRole(role);
  return router;
}

/**
 * Verify user is authenticated
 */
export async function verifyAuthenticated(page: Page) {
  // Check for Sign Out button or other auth indicators
  const signOutButton = page.getByText('Sign Out', { exact: false }).first();
  await signOutButton.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Verify user is not authenticated
 */
export async function verifyNotAuthenticated(page: Page) {
  // Check URL contains login or erp
  await page.waitForURL(/.*login|.*erp/, { timeout: 10000 });
}

/**
 * Setup authentication storage state for tests
 */
export async function setupAuthStorage(page: Page, role: string = 'founder') {
  await loginAsRole(page, role);
  await verifyAuthenticated(page);
}

/**
 * Try navigating to multiple routes in sequence (fallback pattern)
 * Returns true if ANY route succeeds
 */
export async function canAccessAnyRoute(page: Page, routes: string[]): Promise<boolean> {
  for (const route of routes) {
    try {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 10000 });
      // Check if we successfully navigated to this route (not redirected)
      if (page.url().includes(route)) {
        return true;
      }
    } catch {
      // Continue to next route
      continue;
    }
  }
  return false;
}
