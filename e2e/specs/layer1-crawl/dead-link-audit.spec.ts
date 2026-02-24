/**
 * Layer 1: Dead Link Audit
 *
 * For every page, finds all <a> elements and verifies their
 * internal href targets resolve to valid pages.
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '../../helpers/route-registry';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

test.describe('Layer 1: Dead Link Audit', () => {
  // Dead link audits visit many pages sequentially — need extra time
  test.setTimeout(180_000); // 3 minutes

  test('No dead internal links on public pages', async ({ page }) => {
    const brokenLinks: Array<{ sourcePage: string; href: string; issue: string }> = [];

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500); // Brief wait for React to render

      const anchors = page.locator('a[href]');
      const count = await anchors.count();
      const hrefs: string[] = [];

      for (let i = 0; i < count; i++) {
        const href = await anchors.nth(i).getAttribute('href');
        if (!href) continue;
        // Skip external links, mailto, tel, anchors-only
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') continue;
        // Skip hash-only links on the same page
        if (href.startsWith('#')) continue;
        hrefs.push(href);
      }

      // Deduplicate per page
      const uniqueHrefs = [...new Set(hrefs)];

      for (const href of uniqueHrefs) {
        const basePath = href.split('#')[0] || '/';
        try {
          await page.goto(basePath, { waitUntil: 'domcontentloaded', timeout: 10000 });

          const bodyText = await page.locator('body').textContent() || '';
          const is404 = bodyText.includes('404') && bodyText.includes('Page not found');

          if (is404) {
            brokenLinks.push({ sourcePage: route.path, href, issue: 'Shows 404 page' });
          }
        } catch {
          brokenLinks.push({ sourcePage: route.path, href, issue: 'Navigation timeout' });
        }
      }
    }

    expect(brokenLinks.length,
      `Found ${brokenLinks.length} broken links on public pages:\n` +
      brokenLinks.map(l => `  [${l.sourcePage}] → ${l.href}: ${l.issue}`).join('\n')
    ).toBe(0);
  });

  test('No dead internal links on key ERP dashboard pages', async ({ page }) => {
    await installCatchAllMock(page);

    // Test a representative sample of dashboard pages
    const sampleRoutes = DASHBOARD_ROUTES.filter(r => !r.hasParams).slice(0, 15);
    const brokenLinks: Array<{ sourcePage: string; href: string; issue: string }> = [];

    for (const route of sampleRoutes) {
      await setupAuthAndNavigate(page, 'founder', route.path);

      // Get all internal links on this page (excluding sidebar nav which is tested separately)
      const mainContent = page.locator('main a[href], [class*="content"] a[href], .p-6 a[href]');
      const count = await mainContent.count();
      const hrefs: string[] = [];

      for (let i = 0; i < count; i++) {
        const href = await mainContent.nth(i).getAttribute('href');
        if (!href) continue;
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') continue;
        hrefs.push(href);
      }

      const uniqueHrefs = [...new Set(hrefs)];

      for (const href of uniqueHrefs) {
        const basePath = href.split('#')[0] || '/';
        try {
          await page.goto(basePath, { waitUntil: 'domcontentloaded', timeout: 10000 });

          const bodyText = await page.locator('body').textContent() || '';
          const is404 = bodyText.includes('404') && bodyText.includes('Page not found');

          if (is404) {
            brokenLinks.push({ sourcePage: route.path, href, issue: 'Shows 404 page' });
          }
        } catch {
          brokenLinks.push({ sourcePage: route.path, href, issue: 'Navigation timeout' });
        }
      }
    }

    expect(brokenLinks.length,
      `Found ${brokenLinks.length} broken links on ERP pages:\n` +
      brokenLinks.map(l => `  [${l.sourcePage}] → ${l.href}: ${l.issue}`).join('\n')
    ).toBe(0);
  });
});
