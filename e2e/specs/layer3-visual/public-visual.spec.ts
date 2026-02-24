/**
 * Layer 3: Public Page Visual Regression
 *
 * Takes full-page screenshots of every public page at desktop and mobile.
 * Uses Playwright's toHaveScreenshot() for pixel-level comparison.
 *
 * First run: Generates baseline screenshots.
 * Subsequent runs: Compares against baselines to detect regressions.
 *
 * To update baselines after intentional changes:
 *   npx playwright test --project=layer3-visual --update-snapshots
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../helpers/route-registry';

test.describe('Layer 3: Public Page Visual Regression', () => {

  for (const route of PUBLIC_ROUTES) {
    test(`Visual: ${route.name} (desktop)`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for images and animations to settle
      await page.waitForTimeout(1500);

      // Disable animations for stable screenshots
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';
        document.head.appendChild(style);
      });

      const safeName = route.path.replace(/\//g, '-').replace(/^-/, '') || 'home';

      await expect(page).toHaveScreenshot(`public-${safeName}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });

    test(`Visual: ${route.name} (mobile)`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });

      await page.waitForTimeout(1500);

      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';
        document.head.appendChild(style);
      });

      const safeName = route.path.replace(/\//g, '-').replace(/^-/, '') || 'home';

      await expect(page).toHaveScreenshot(`public-${safeName}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
