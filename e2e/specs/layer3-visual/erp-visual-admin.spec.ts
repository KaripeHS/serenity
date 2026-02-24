/**
 * Layer 3: ERP Admin/Patient/Finance Visual Regression
 *
 * Screenshots admin, patient, finance, and other non-dashboard pages.
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { ADMIN_ROUTES, FINANCE_ROUTES, ERP_ROUTES } from '../../helpers/route-registry';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

// Combine admin, finance, patient, profile, and portal routes
const NON_DASHBOARD_ROUTES = ERP_ROUTES.filter(r =>
  !r.path.startsWith('/dashboard/') &&
  !r.hasParams &&
  r.path !== '/erp' // Skip login page
);

const ALL_ROUTES = [...ADMIN_ROUTES, ...FINANCE_ROUTES, ...NON_DASHBOARD_ROUTES];

// Deduplicate by path
const UNIQUE_ROUTES = ALL_ROUTES.filter((route, index, self) =>
  index === self.findIndex(r => r.path === route.path)
);

test.describe('Layer 3: ERP Admin & Other Visual Regression', () => {

  for (const route of UNIQUE_ROUTES) {
    if (route.hasParams) continue;

    test(`Visual: ${route.name}`, async ({ page }) => {
      await installCatchAllMock(page);
      await setupAuthAndNavigate(page, route.testRole, route.path);

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Disable animations
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `;
        document.head.appendChild(style);
      });

      const safeName = route.path.replace(/\//g, '-').replace(/^-/, '');

      await expect(page).toHaveScreenshot(`erp-${safeName}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
