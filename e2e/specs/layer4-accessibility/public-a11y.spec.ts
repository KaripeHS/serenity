/**
 * Layer 4: Public Page Accessibility Audit
 *
 * Runs axe-core WCAG 2.1 AA audit on every public page.
 * Hard-fails on critical and serious accessibility violations.
 * Logs moderate/minor violations as warnings.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PUBLIC_ROUTES } from '../../helpers/route-registry';

test.describe('Layer 4: Public Page Accessibility Audit', () => {

  for (const route of PUBLIC_ROUTES) {
    test(`A11y audit: ${route.name} (${route.path})`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = results.violations;

      // Log all violations for review
      if (violations.length > 0) {
        const report = violations.map(v =>
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instance(s))`
        ).join('\n');
        console.log(`\nA11y violations on ${route.path}:\n${report}\n`);
      }

      // Hard fail on critical and serious issues
      const critical = violations.filter(v => v.impact === 'critical' || v.impact === 'serious');

      expect(critical.length,
        `"${route.name}" has ${critical.length} critical/serious a11y violation(s):\n` +
        critical.map(v => `  [${v.impact}] ${v.id}: ${v.description}`).join('\n')
      ).toBe(0);
    });
  }

  test('All images on public pages have alt text', async ({ page }) => {
    const missingAlt: Array<{ page: string; src: string }> = [];

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 20000 });

      const images = page.locator('img:visible');
      const imgCount = await images.count();

      for (let i = 0; i < imgCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src') || 'unknown';

        // alt="" is valid (decorative image), but missing alt attribute is not
        if (alt === null) {
          missingAlt.push({ page: route.path, src: src.slice(0, 80) });
        }
      }
    }

    expect(missingAlt.length,
      `${missingAlt.length} image(s) missing alt attribute:\n` +
      missingAlt.map(m => `  [${m.page}] ${m.src}`).join('\n')
    ).toBe(0);
  });

  test('All form inputs on public pages have labels', async ({ page }) => {
    const formPages = PUBLIC_ROUTES.filter(r =>
      ['/contact', '/referral', '/client-intake'].includes(r.path)
    );

    const unlabeled: Array<{ page: string; input: string }> = [];

    for (const route of formPages) {
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 20000 });

      const inputs = page.locator('input:visible:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea:visible, select:visible');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const name = await input.getAttribute('name') || 'unnamed';

        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        const hasLabeling = hasLabel || !!ariaLabel || !!ariaLabelledby;

        if (!hasLabeling) {
          unlabeled.push({ page: route.path, input: name });
        }
      }
    }

    if (unlabeled.length > 0) {
      console.warn(`\n[A11Y WARNING] ${unlabeled.length} input(s) missing label association:\n` +
        unlabeled.map(u => `  [${u.page}] input name="${u.input}"`).join('\n'));
    }

    // Soft assertion — log but don't fail for now
    expect.soft(unlabeled.length,
      `${unlabeled.length} input(s) without label association`
    ).toBe(0);
  });
});
