/**
 * Page Health Helper - Shared assertions for verifying pages load correctly
 *
 * Used across all 5 test layers to check for common issues:
 * - 404 pages
 * - ErrorBoundary crashes
 * - Console errors
 * - Empty/blank pages
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Assert a page loaded without critical issues
 */
export async function assertPageHealthy(page: Page, routeName: string) {
  // 1. Check for 404 page
  const body = page.locator('body');
  const bodyText = await body.textContent() || '';

  const shows404 = bodyText.includes('404') && bodyText.includes('Page not found');
  expect(shows404, `Route "${routeName}" shows 404 page`).toBe(false);

  // 2. Check for ErrorBoundary crash
  const hasErrorBoundary = bodyText.includes('Component Error') || bodyText.includes('Something went wrong');
  expect(hasErrorBoundary, `Route "${routeName}" crashed with ErrorBoundary`).toBe(false);

  // 3. Page should have meaningful content (not blank)
  const trimmed = bodyText.replace(/\s+/g, ' ').trim();
  expect(trimmed.length, `Route "${routeName}" rendered with empty/blank body`).toBeGreaterThan(10);
}

/**
 * Assert no critical console errors occurred
 * Filters out known noise like favicon 404s and React dev warnings
 */
export function assertNoConsoleErrors(errors: Error[], routeName: string) {
  const IGNORED_PATTERNS = [
    'favicon',
    'net::ERR_',
    'Failed to load resource',
    'the server responded with a status of 404',
    'Download the React DevTools',
    'React Router Future Flag Warning',
    'Consider adding an error boundary',
  ];

  const criticalErrors = errors.filter(e => {
    const msg = e.message || '';
    return !IGNORED_PATTERNS.some(pattern => msg.includes(pattern));
  });

  if (criticalErrors.length > 0) {
    const messages = criticalErrors.map(e => `  - ${e.message}`).join('\n');
    expect.soft(criticalErrors.length,
      `Route "${routeName}" has ${criticalErrors.length} console error(s):\n${messages}`
    ).toBe(0);
  }
}

/**
 * Collect console errors during page interaction
 * Returns a cleanup function and the error array
 */
export function trackConsoleErrors(page: Page): { errors: Error[]; cleanup: () => void } {
  const errors: Error[] = [];
  const handler = (error: Error) => errors.push(error);
  page.on('pageerror', handler);
  return {
    errors,
    cleanup: () => page.removeListener('pageerror', handler),
  };
}

/**
 * Get counts of interactive elements on the page
 */
export async function getInteractableCount(page: Page) {
  const buttons = await page.locator('button:visible:not([disabled])').count();
  const links = await page.locator('a[href]:visible').count();
  const inputs = await page.locator('input:visible:not([type="hidden"]), textarea:visible, select:visible').count();
  return { buttons, links, inputs, total: buttons + links + inputs };
}

/**
 * Check if clicking a button caused any observable effect
 * (URL change, DOM change, dialog/modal appearing)
 */
export async function didButtonCauseEffect(page: Page, button: Locator): Promise<boolean> {
  const urlBefore = page.url();
  const dialogVisible = await page.locator('[role="dialog"], [data-state="open"], .modal').isVisible().catch(() => false);

  try {
    await button.click({ timeout: 3000 });
  } catch {
    return false; // Button not clickable
  }

  await page.waitForTimeout(500);

  const urlAfter = page.url();
  const dialogNow = await page.locator('[role="dialog"], [data-state="open"], .modal').isVisible().catch(() => false);

  // Something changed: URL navigated, dialog appeared/disappeared
  return urlBefore !== urlAfter || dialogVisible !== dialogNow;
}

/**
 * Check if a page shows the Access Denied message
 */
export async function isAccessDenied(page: Page): Promise<boolean> {
  const bodyText = await page.locator('body').textContent() || '';
  return bodyText.includes('Access Denied') || bodyText.includes('do not have permission');
}
