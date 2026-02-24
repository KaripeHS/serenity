/**
 * Layer 3: ERP Dashboard Visual Regression
 *
 * Screenshots all dashboard routes to detect visual regressions.
 * Uses higher pixel tolerance (2%) to account for dynamic data.
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { DASHBOARD_ROUTES } from '../../helpers/route-registry';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

test.describe('Layer 3: ERP Dashboard Visual Regression', () => {

  for (const route of DASHBOARD_ROUTES) {
    if (route.hasParams) continue; // Skip parameterized routes for visual testing

    test(`Visual: ${route.name}`, async ({ page }) => {
      await installCatchAllMock(page);
      await setupAuthAndNavigate(page, route.testRole, route.path);

      // Wait for data and charts to render
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Disable animations
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
          .animate-spin, .animate-pulse, .animate-bounce {
            animation: none !important;
          }
        `;
        document.head.appendChild(style);
      });

      const safeName = route.path.replace(/\//g, '-').replace(/^-/, '');

      await expect(page).toHaveScreenshot(`erp-${safeName}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02, // 2% tolerance for dynamic data
      });
    });
  }
});
