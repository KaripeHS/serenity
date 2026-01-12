import { Page } from '@playwright/test';
import { ApiRouter } from '../mocks/api-router';

/**
 * Direct Authentication Helper
 *
 * Sets up authentication state directly without going through login flow.
 * This is more reliable for testing protected pages.
 */

/**
 * Set up authentication and navigate directly to a page
 * This bypasses the login flow and sets up mocks + auth state directly
 */
export async function setupAuthAndNavigate(page: Page, role: string, targetUrl: string) {
  // Set up API router with mocks FIRST
  const router = new ApiRouter(page);
  await router.mockAllEndpoints();
  await router.mockAuthWithRole(role);

  // Set auth token and user data in localStorage BEFORE navigation
  await page.evaluate((authRole) => {
    const mockToken = `mock-token-${authRole}-${Date.now()}`;
    const mockUser = {
      id: `user-${authRole}-001`,
      email: `${authRole}@test.serenitycare.com`,
      firstName: authRole.charAt(0).toUpperCase() + authRole.slice(1),
      lastName: 'Test',
      role: authRole,
      organizationId: 'org-serenity-test-001',
      permissions: [],
      podMemberships: [],
      mfaEnabled: false,
      lastLogin: new Date().toISOString(),
      sessionId: `session_${Date.now()}`
    };

    // Set tokens with all possible keys
    localStorage.setItem('serenity_access_token', mockToken);
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('token', mockToken);

    // Store user object
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('serenity_user', JSON.stringify(mockUser));
  }, role);

  // Now navigate to the target page
  await page.goto(targetUrl);

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Give React time to hydrate with auth state
  await page.waitForTimeout(1000);

  return router;
}

/**
 * Quick auth setup for tests that need to test multiple pages
 */
export async function setupQuickAuth(page: Page, role: string) {
  const router = new ApiRouter(page);
  await router.mockAllEndpoints();
  await router.mockAuthWithRole(role);

  await page.evaluate((authRole) => {
    const mockToken = `mock-token-${authRole}-${Date.now()}`;
    localStorage.setItem('serenity_access_token', mockToken);
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('token', mockToken);
  }, role);

  return router;
}
