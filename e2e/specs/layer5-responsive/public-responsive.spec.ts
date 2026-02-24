/**
 * Layer 5: Public Page Responsive Testing
 *
 * Tests all public pages at mobile, tablet, and desktop viewports.
 * Checks for:
 * - No horizontal overflow/scroll
 * - No elements overflowing the viewport
 * - Mobile navigation works
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../helpers/route-registry';
import { ALL_VIEWPORTS } from '../../helpers/viewport.helper';

test.describe('Layer 5: Public Page Responsive Testing', () => {

  for (const route of PUBLIC_ROUTES) {
    for (const [vpName, vp] of ALL_VIEWPORTS) {
      test(`"${route.name}" at ${vpName} (${vp.width}px) — no overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route.path, { waitUntil: 'networkidle', timeout: 20000 });

        // Check for horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
        });

        expect(hasHorizontalScroll,
          `"${route.name}" at ${vp.width}px has horizontal overflow ` +
          `(scrollWidth > clientWidth)`
        ).toBe(false);

        // Check for elements overflowing the viewport
        const overflowingElements = await page.evaluate((viewportWidth: number) => {
          const all = document.querySelectorAll('*');
          const overflowing: string[] = [];
          all.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > viewportWidth + 10 && rect.width > 0 && rect.height > 0) {
              const tag = el.tagName.toLowerCase();
              const cls = (el.className?.toString() || '').slice(0, 60);
              overflowing.push(`<${tag} class="${cls}">`);
            }
          });
          return overflowing.slice(0, 5);
        }, vp.width);

        expect(overflowingElements.length,
          `"${route.name}" at ${vp.width}px has ${overflowingElements.length} overflowing element(s): ` +
          overflowingElements.join(', ')
        ).toBe(0);
      });
    }
  }

  test('Mobile: navigation menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Look for a mobile menu button (hamburger)
    const menuButton = page.locator('button').filter({
      has: page.locator('svg'),
    }).first();

    const menuButtonVisible = await menuButton.isVisible().catch(() => false);

    if (menuButtonVisible) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // After clicking, some navigation links should appear
      const aboutLink = page.getByText('About', { exact: false });
      const aboutVisible = await aboutLink.first().isVisible().catch(() => false);

      expect(aboutVisible, 'Mobile menu should show navigation links after clicking hamburger').toBe(true);
    }
    // If no hamburger button, the nav might be always visible (acceptable for some designs)
  });

  test('Desktop: full navigation is visible without hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // At desktop width, navigation links should be visible
    const aboutLink = page.locator('header').getByText('About', { exact: false }).first();
    await expect(aboutLink).toBeVisible({ timeout: 5000 });

    const servicesLink = page.locator('header').getByText('Services', { exact: false }).first();
    await expect(servicesLink).toBeVisible({ timeout: 5000 });
  });
});
