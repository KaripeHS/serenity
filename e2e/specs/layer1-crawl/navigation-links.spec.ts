/**
 * Layer 1: Navigation Link Audit
 *
 * Clicks every link in the sidebar, public header, and public footer.
 * Verifies each link navigates to a valid page (no 404, no crash).
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

// Give navigation tests more time — they visit many pages sequentially
test.describe('Layer 1: Navigation Link Audit', () => {
  test.setTimeout(180_000); // 3 minutes

  test('All sidebar navigation links work (founder)', async ({ page }) => {
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // Expand all collapsed sidebar sections
    const sectionHeaders = page.locator('nav button');
    const headerCount = await sectionHeaders.count();

    for (let i = 0; i < headerCount; i++) {
      const btn = sectionHeaders.nth(i);
      const isExpandable = await btn.locator('svg').count() > 0;
      if (isExpandable) {
        try {
          await btn.click({ timeout: 2000 });
          await page.waitForTimeout(200);
        } catch {
          // Some buttons might not be expandable
        }
      }
    }

    // Collect all sidebar links
    const links = page.locator('nav a[href]');
    const linkCount = await links.count();
    const hrefs: string[] = [];

    for (let i = 0; i < linkCount; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
        hrefs.push(href);
      }
    }

    // Deduplicate
    const uniqueHrefs = [...new Set(hrefs)];
    const brokenLinks: Array<{ href: string; issue: string }> = [];

    // Visit each link — use domcontentloaded (faster than networkidle)
    for (const href of uniqueHrefs) {
      try {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 10000 });
        // Brief wait for React to render
        await page.waitForTimeout(500);
      } catch {
        brokenLinks.push({ href, issue: 'Navigation timeout' });
        continue;
      }

      const bodyText = await page.locator('body').textContent() || '';
      const is404 = bodyText.includes('404') && bodyText.includes('Page not found');
      const isCrash = bodyText.includes('Component Error');

      if (is404) brokenLinks.push({ href, issue: 'Shows 404' });
      if (isCrash) brokenLinks.push({ href, issue: 'ErrorBoundary crash' });
    }

    expect(brokenLinks.length,
      `Found ${brokenLinks.length} broken sidebar links:\n${brokenLinks.map(l => `  ${l.href}: ${l.issue}`).join('\n')}`
    ).toBe(0);
  });

  test('All public header links work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const headerLinks = page.locator('header a[href]');
    const linkCount = await headerLinks.count();
    const hrefs: string[] = [];

    for (let i = 0; i < linkCount; i++) {
      const href = await headerLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
        hrefs.push(href);
      }
    }

    const uniqueHrefs = [...new Set(hrefs)];
    const brokenLinks: Array<{ href: string; issue: string }> = [];

    for (const href of uniqueHrefs) {
      await page.goto(href, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
        brokenLinks.push({ href, issue: 'Navigation timeout' });
      });

      const bodyText = await page.locator('body').textContent() || '';
      if (bodyText.includes('404') && bodyText.includes('Page not found')) {
        brokenLinks.push({ href, issue: 'Shows 404' });
      }
    }

    expect(brokenLinks.length,
      `Found ${brokenLinks.length} broken header links:\n${brokenLinks.map(l => `  ${l.href}: ${l.issue}`).join('\n')}`
    ).toBe(0);
  });

  test('All public footer links work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const footerLinks = page.locator('footer a[href]');
    const linkCount = await footerLinks.count();
    const hrefs: string[] = [];

    for (let i = 0; i < linkCount; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
        hrefs.push(href);
      }
    }

    const uniqueHrefs = [...new Set(hrefs)];
    const brokenLinks: Array<{ href: string; issue: string }> = [];

    for (const href of uniqueHrefs) {
      // Handle hash links (e.g., /services#personal-care)
      const basePath = href.split('#')[0] || '/';
      await page.goto(basePath, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
        brokenLinks.push({ href, issue: 'Navigation timeout' });
      });

      const bodyText = await page.locator('body').textContent() || '';
      if (bodyText.includes('404') && bodyText.includes('Page not found')) {
        brokenLinks.push({ href, issue: 'Shows 404' });
      }
    }

    expect(brokenLinks.length,
      `Found ${brokenLinks.length} broken footer links:\n${brokenLinks.map(l => `  ${l.href}: ${l.issue}`).join('\n')}`
    ).toBe(0);
  });
});
