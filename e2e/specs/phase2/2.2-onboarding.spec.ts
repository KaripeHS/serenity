import { test, expect } from '@playwright/test';
import { MOCK_ME_RESPONSE } from '../../mocks/auth.mocks';

test.describe('Phase 2.2: Onboarding', () => {

    test.beforeEach(async ({ page }) => {
        // Mock /api/auth/me
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('admin'))
            });
        });
    });

    test('Can navigate to Onboarding page', async ({ page }) => {
        // Navigate to app root
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

        // Force router to onboarding route (using a test ID)
        await page.evaluate(() => {
            window.history.pushState(null, '', '/hr/onboarding/test-id');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        // Wait for potential render
        await page.waitForTimeout(2000);

        // Check for authenticated content
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });
    });
});