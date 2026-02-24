/**
 * Layer 1: Public Route Crawler
 *
 * Visits every public marketing page and verifies:
 * - No 404 errors
 * - No ErrorBoundary crashes
 * - No critical console errors
 * - Header and footer are visible
 * - Page has meaningful content
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../helpers/route-registry';
import { assertPageHealthy, assertNoConsoleErrors, trackConsoleErrors } from '../../helpers/page-health.helper';

test.describe('Layer 1: Public Route Crawler', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`Public page "${route.name}" (${route.path}) loads without errors`, async ({ page }) => {
      const { errors, cleanup } = trackConsoleErrors(page);

      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });

      // Page should be healthy
      await assertPageHealthy(page, route.name);

      // No critical console errors
      assertNoConsoleErrors(errors, route.name);

      // Public pages should have a header
      const header = page.locator('header').first();
      await expect(header, `"${route.name}" is missing <header>`).toBeVisible({ timeout: 5000 });

      // Public pages should have a footer
      const footer = page.locator('footer').first();
      await expect(footer, `"${route.name}" is missing <footer>`).toBeVisible({ timeout: 5000 });

      cleanup();
    });
  }
});
