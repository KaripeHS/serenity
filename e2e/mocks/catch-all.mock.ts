/**
 * Catch-All API Mock
 *
 * Prevents uncaught 500 errors when crawling pages that make API calls
 * not covered by the existing fixture files. Returns safe empty responses.
 */

import { Page } from '@playwright/test';

/**
 * Install a catch-all route handler that returns empty data for any
 * unmocked API endpoint. Call this AFTER mockAllEndpoints() so it
 * only catches what slips through.
 */
export async function installCatchAllMock(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Log for debugging which endpoints aren't mocked
    console.log(`[catch-all] ${method} ${url}`);

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 25 }),
      });
    } else {
      // POST/PUT/DELETE
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Mock response' }),
      });
    }
  });
}
