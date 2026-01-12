import { test, expect } from '@playwright/test';
import { MOCK_ME_RESPONSE } from '../../mocks/auth.mocks';

test.describe('Phase 7.1: Error Handling', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('admin'))
            });
        });
    });

    test('Application handles navigation errors gracefully', async ({ page }) => {
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        // Try to navigate to a non-existent route
        await page.evaluate(() => {
            window.history.pushState(null, '', '/nonexistent-route-12345');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        await page.waitForTimeout(2000);
        // Create a locator for the 404 content
        await expect(page.getByText('404', { exact: true })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Page not found')).toBeVisible();
    });
});