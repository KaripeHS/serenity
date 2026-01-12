import { test, expect } from '@playwright/test';
import { MOCK_ME_RESPONSE } from '../../mocks/auth.mocks';

test.describe('Phase 3.6: Denials', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('admin'))
            });
        });
    });

    test('Can navigate to Denials Dashboard', async ({ page }) => {
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.history.pushState(null, '', '/dashboard/denials');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        await page.waitForTimeout(2000);
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });
    });
});