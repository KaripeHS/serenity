/**
 * Layer 1: ERP Route Crawler (Founder)
 *
 * Visits every ERP route as the founder role (who has access to everything).
 * Verifies each page renders without crashing.
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { ERP_ROUTES } from '../../helpers/route-registry';
import { assertPageHealthy, assertNoConsoleErrors, trackConsoleErrors, isAccessDenied } from '../../helpers/page-health.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

test.describe('Layer 1: ERP Route Crawler (Founder Access)', () => {
  for (const route of ERP_ROUTES) {
    // Skip the /erp login page (it's the login form itself)
    if (route.path === '/erp') continue;

    test(`ERP page "${route.name}" (${route.path}) renders for founder`, async ({ page }) => {
      const { errors, cleanup } = trackConsoleErrors(page);

      // Install catch-all mock for any unmocked API endpoints
      await installCatchAllMock(page);

      const targetPath = route.hasParams ? route.paramExample! : route.path;
      await setupAuthAndNavigate(page, 'founder', targetPath);

      // Page should be healthy (no 404, no crash, has content)
      await assertPageHealthy(page, route.name);

      // Founder should never see Access Denied
      const denied = await isAccessDenied(page);
      expect(denied, `Founder should have access to "${route.name}" but got Access Denied`).toBe(false);

      // Check console errors (soft assertion — logged but doesn't block)
      assertNoConsoleErrors(errors, route.name);

      cleanup();
    });
  }
});
