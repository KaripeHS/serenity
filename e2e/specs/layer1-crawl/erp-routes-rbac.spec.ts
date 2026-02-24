/**
 * Layer 1: RBAC Route Denial Verification
 *
 * For routes with deniedRoles, verifies that those roles
 * see "Access Denied" or get redirected away.
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { RBAC_ROUTES, type TestableRole } from '../../helpers/route-registry';
import { isAccessDenied } from '../../helpers/page-health.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

// Build test cases: for each route with denied roles, test each denied role
const rbacTestCases: Array<{ routePath: string; routeName: string; deniedRole: TestableRole }> = [];

for (const route of RBAC_ROUTES) {
  for (const role of route.deniedRoles) {
    rbacTestCases.push({
      routePath: route.hasParams ? route.paramExample! : route.path,
      routeName: route.name,
      deniedRole: role,
    });
  }
}

test.describe('Layer 1: RBAC Denial Verification', () => {
  for (const tc of rbacTestCases) {
    test(`${tc.deniedRole} CANNOT access "${tc.routeName}" (${tc.routePath})`, async ({ page }) => {
      await installCatchAllMock(page);
      await setupAuthAndNavigate(page, tc.deniedRole, tc.routePath);

      // Wait for loading to finish
      await page.waitForFunction(() => {
        const text = document.body.textContent || '';
        return !text.includes('Loading...');
      }, { timeout: 10000 }).catch(() => {
        // Loading state may not exist on all pages
      });

      // Should see Access Denied OR be redirected away from the route
      const denied = await isAccessDenied(page);
      const wasRedirected = !page.url().includes(tc.routePath);

      expect(
        denied || wasRedirected,
        `${tc.deniedRole} should be blocked from "${tc.routeName}" (${tc.routePath}) but was not. ` +
        `URL: ${page.url()}, Access Denied visible: ${denied}`
      ).toBe(true);
    });
  }
});
