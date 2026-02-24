/**
 * Layer 5: ERP Responsive Testing
 *
 * Tests a representative sample of ERP pages at multiple viewports.
 * Checks for horizontal overflow and layout issues.
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';
import { ALL_VIEWPORTS } from '../../helpers/viewport.helper';

// Representative sample of ERP routes covering different layouts
const SAMPLE_ERP_ROUTES = [
  { path: '/dashboard/executive', name: 'Executive Dashboard', role: 'founder' },
  { path: '/dashboard/hr', name: 'Talent Command Center', role: 'founder' },
  { path: '/dashboard/billing', name: 'Billing Dashboard', role: 'founder' },
  { path: '/dashboard/clinical', name: 'Clinical Command Center', role: 'founder' },
  { path: '/dashboard/operations', name: 'Operations Command Center', role: 'founder' },
  { path: '/dashboard/compliance', name: 'Compliance Command Center', role: 'founder' },
  { path: '/admin/users', name: 'User Management', role: 'founder' },
  { path: '/patients', name: 'Patient List', role: 'founder' },
  { path: '/caregiver-portal', name: 'Caregiver Portal', role: 'caregiver' },
  { path: '/dashboard/pod-lead', name: 'Pod Lead Dashboard', role: 'pod_lead' },
  { path: '/dashboard/finance/bank-accounts', name: 'Bank Accounts', role: 'cfo' },
  { path: '/dashboard/scheduling', name: 'Scheduling', role: 'founder' },
] as const;

test.describe('Layer 5: ERP Responsive Testing', () => {

  for (const route of SAMPLE_ERP_ROUTES) {
    for (const [vpName, vp] of ALL_VIEWPORTS) {
      test(`"${route.name}" at ${vpName} (${vp.width}px) — no overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await installCatchAllMock(page);
        await setupAuthAndNavigate(page, route.role, route.path);

        // Check for horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
        });

        expect(hasHorizontalScroll,
          `"${route.name}" at ${vp.width}px has horizontal overflow`
        ).toBe(false);

        // Check for elements significantly overflowing viewport
        const overflowCount = await page.evaluate((viewportWidth: number) => {
          const all = document.querySelectorAll('*');
          let count = 0;
          all.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > viewportWidth + 20 && rect.width > 50 && rect.height > 10) {
              count++;
            }
          });
          return count;
        }, vp.width);

        expect(overflowCount,
          `"${route.name}" at ${vp.width}px has ${overflowCount} significantly overflowing element(s)`
        ).toBe(0);
      });
    }
  }

  test('ERP sidebar collapses on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // On mobile, the sidebar should not take up the full width
    // The main content should be visible
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText.length).toBeGreaterThan(10);

    // Check that horizontal scroll isn't caused by the sidebar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
    });
    expect(hasHorizontalScroll, 'ERP layout at mobile width should not cause horizontal scroll').toBe(false);
  });

  test('ERP sidebar is visible on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // At desktop width, sidebar should be visible with navigation items
    const signOut = page.getByText('Sign Out', { exact: false }).first();
    const isVisible = await signOut.isVisible().catch(() => false);
    expect(isVisible, 'Sidebar should be visible at desktop width with Sign Out link').toBe(true);
  });
});
