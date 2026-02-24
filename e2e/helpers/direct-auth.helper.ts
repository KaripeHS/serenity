import { Page } from '@playwright/test';
import { ApiRouter } from '../mocks/api-router';

/**
 * Direct Authentication Helper
 *
 * Sets up authentication state directly without going through login flow.
 * This is more reliable for testing protected pages.
 *
 * IMPORTANT: localStorage is per-origin. We must navigate to the app's
 * origin first before setting localStorage, otherwise tokens set on
 * about:blank won't be visible to the React app.
 */

/**
 * Build the mock user object for a given role
 */
function buildMockUser(role: string) {
  return {
    id: `user-${role}-001`,
    email: `${role}@test.serenitycare.com`,
    firstName: role.charAt(0).toUpperCase() + role.slice(1),
    lastName: 'Test',
    role: role,
    organizationId: 'org-serenity-test-001',
    permissions: [],
    podMemberships: [],
    mfaEnabled: false,
    lastLogin: new Date().toISOString(),
    sessionId: `session_${Date.now()}`
  };
}

/**
 * Inject auth tokens and user data into localStorage.
 * Page MUST already be on the app's origin (e.g. after page.goto('/'))
 */
async function injectAuthState(page: Page, role: string) {
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

    // Set tokens with all possible keys the app might check
    localStorage.setItem('serenity_access_token', mockToken);
    localStorage.setItem('serenity_refresh_token', `refresh-${mockToken}`);
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('token', mockToken);

    // Store user object
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('serenity_user', JSON.stringify(mockUser));
  }, role);
}

/**
 * Set up authentication and navigate directly to a page
 * This bypasses the login flow and sets up mocks + auth state directly
 */
export async function setupAuthAndNavigate(page: Page, role: string, targetUrl: string) {
  // Set up API router with mocks FIRST (before any navigation)
  const router = new ApiRouter(page);
  await router.mockAllEndpoints();
  await router.mockAuthWithRole(role);

  // Navigate to the app's origin so localStorage is on the correct domain.
  // Use a lightweight page load — the root '/' will render the public home page
  // but we just need the origin established.
  await page.goto('/', { waitUntil: 'commit' });

  // Now set localStorage on the correct origin
  await injectAuthState(page, role);

  // Navigate to the actual target page
  await page.goto(targetUrl);

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Give React time to hydrate with auth state
  await page.waitForTimeout(500);

  return router;
}

/**
 * Quick auth setup for tests that need to test multiple pages.
 * Establishes auth state so subsequent page.goto() calls will be authenticated.
 */
export async function setupQuickAuth(page: Page, role: string) {
  const router = new ApiRouter(page);
  await router.mockAllEndpoints();
  await router.mockAuthWithRole(role);

  // Navigate to app origin first so localStorage works
  await page.goto('/', { waitUntil: 'commit' });

  await injectAuthState(page, role);

  return router;
}
