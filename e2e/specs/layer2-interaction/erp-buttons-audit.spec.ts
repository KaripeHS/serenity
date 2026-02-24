/**
 * Layer 2: ERP Button Audit
 *
 * For each ERP dashboard/admin page, finds all visible buttons
 * and verifies they trigger some observable effect when clicked.
 *
 * Buttons that need specific preconditions may log as warnings
 * rather than hard failures.
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { DASHBOARD_ROUTES, ADMIN_ROUTES, ERP_ROUTES } from '../../helpers/route-registry';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

// All static ERP routes (no params) to audit
const ROUTES_TO_AUDIT = ERP_ROUTES
  .filter(r => !r.hasParams && r.path !== '/erp')
  .filter((r, i, self) => i === self.findIndex(x => x.path === r.path));

test.describe('Layer 2: ERP Button Audit', () => {

  for (const route of ROUTES_TO_AUDIT) {
    test(`Buttons on "${route.name}" (${route.path}) are functional`, async ({ page }) => {
      await installCatchAllMock(page);
      await setupAuthAndNavigate(page, route.testRole, route.path);

      const buttons = page.locator('button:visible:not([disabled])');
      const buttonCount = await buttons.count();

      // Page should have some interactive elements (unless it's a simple info page)
      // Don't hard-fail on zero buttons — some pages are purely informational
      if (buttonCount === 0) {
        console.log(`[INFO] "${route.name}" has no visible buttons`);
        return;
      }

      // Test up to 15 buttons per page (avoid excessive test time)
      const limit = Math.min(buttonCount, 15);
      const orphaned: string[] = [];
      const functional: string[] = [];

      for (let i = 0; i < limit; i++) {
        // Re-navigate to ensure clean state
        if (i > 0) {
          await setupAuthAndNavigate(page, route.testRole, route.path);
        }

        const currentButtons = page.locator('button:visible:not([disabled])');
        const currentCount = await currentButtons.count();
        if (i >= currentCount) break;

        const button = currentButtons.nth(i);
        const buttonText = (await button.textContent() || '').trim().slice(0, 40);

        // Skip Sign Out and sidebar navigation buttons (tested in Layer 1)
        if (buttonText.includes('Sign Out') || buttonText.includes('Sign In')) continue;

        // Capture state before click
        const urlBefore = page.url();
        const dialogBefore = await page.locator('[role="dialog"], [data-state="open"], .modal').count();
        const toastBefore = await page.locator('[data-sonner-toast], [role="status"]').count();

        try {
          await button.click({ timeout: 3000 });
          await page.waitForTimeout(600);
        } catch {
          continue; // Button became unavailable
        }

        // Check if anything changed
        const urlAfter = page.url();
        const dialogAfter = await page.locator('[role="dialog"], [data-state="open"], .modal').count();
        const toastAfter = await page.locator('[data-sonner-toast], [role="status"]').count();

        const somethingChanged =
          urlBefore !== urlAfter ||
          dialogBefore !== dialogAfter ||
          toastBefore !== toastAfter;

        if (somethingChanged) {
          functional.push(buttonText);
        } else {
          orphaned.push(buttonText);
        }
      }

      // Log results
      if (orphaned.length > 0) {
        console.warn(
          `[WARNING] "${route.name}" — ${orphaned.length} button(s) with no visible effect: ` +
          orphaned.join(' | ')
        );
      }

      if (functional.length > 0) {
        console.log(
          `[OK] "${route.name}" — ${functional.length} functional button(s)`
        );
      }

      // Soft assertion: at least some buttons should be functional on dashboard pages
      if (route.path.startsWith('/dashboard/') && limit > 2) {
        expect.soft(functional.length,
          `"${route.name}" — no buttons responded to clicks (${orphaned.length} tested)`
        ).toBeGreaterThan(0);
      }
    });
  }
});
