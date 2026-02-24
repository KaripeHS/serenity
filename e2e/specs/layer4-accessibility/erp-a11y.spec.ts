/**
 * Layer 4: ERP Page Accessibility Audit
 *
 * Runs axe-core WCAG 2.1 AA audit on ERP dashboard and admin pages.
 * Excludes loading spinners and animations from the audit.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { DASHBOARD_ROUTES, ADMIN_ROUTES, ERP_ROUTES } from '../../helpers/route-registry';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

// Combined list of routes to audit (deduplicated, no params)
const ROUTES_TO_AUDIT = ERP_ROUTES
  .filter(r => !r.hasParams && r.path !== '/erp')
  .filter((route, index, self) => index === self.findIndex(r => r.path === route.path));

test.describe('Layer 4: ERP Accessibility Audit', () => {

  for (const route of ROUTES_TO_AUDIT) {
    test(`A11y audit: ${route.name} (${route.path})`, async ({ page }) => {
      await installCatchAllMock(page);
      await setupAuthAndNavigate(page, route.testRole, route.path);

      // Wait for content to fully render
      await page.waitForTimeout(1500);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.animate-spin')
        .exclude('.animate-pulse')
        .exclude('.animate-bounce')
        .analyze();

      const violations = results.violations;

      // Log all violations
      if (violations.length > 0) {
        const report = violations.map(v =>
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instance(s))`
        ).join('\n');
        console.log(`\nA11y violations on ${route.path}:\n${report}\n`);
      }

      // Hard fail on critical issues only (ERP pages may have more warnings)
      const critical = violations.filter(v => v.impact === 'critical');

      expect(critical.length,
        `"${route.name}" has ${critical.length} critical a11y violation(s):\n` +
        critical.map(v => `  ${v.id}: ${v.description}`).join('\n')
      ).toBe(0);

      // Soft assert on serious issues (logged but doesn't block)
      const serious = violations.filter(v => v.impact === 'serious');
      expect.soft(serious.length,
        `"${route.name}" has ${serious.length} serious a11y issue(s):\n` +
        serious.map(v => `  ${v.id}: ${v.description}`).join('\n')
      ).toBe(0);
    });
  }

  test('Keyboard navigation works on executive dashboard', async ({ page }) => {
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // Tab through interactive elements
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify some element has focus
    const focusedTag = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : 'none';
    });

    // Focus should be on an interactive element, not stuck on body
    expect(
      focusedTag !== 'body' && focusedTag !== 'none',
      `After tabbing 15 times, focus is on <${focusedTag}> — should be on interactive element`
    ).toBe(true);
  });
});
