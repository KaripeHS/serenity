import { test, expect } from '@playwright/test';
import { MOCK_ME_RESPONSE } from '../../mocks/auth.mocks';

test.describe('Phase 1.1: User Creation (Sanity Check)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock /api/auth/me to return valid user when app checks session
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('founder'))
            });
        });
    });

    test('Admin can access authenticated dashboard', async ({ page }) => {
        // Navigate to app root
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

        // Force router to dashboard route
        await page.evaluate(() => {
            window.history.pushState(null, '', '/erp');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        // Wait for potential render
        await page.waitForTimeout(2000);

        // Check for authenticated content using the same check as auth.setup.ts
        // In WorkingHomePage/DashboardLayout, "Sign Out" should be visible.
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });

        // Also check if text "Serenity ERP" is visible (it is on both login and dashboard, but if Sign Out is visible, we are good)
        await expect(page.getByText('Serenity ERP', { exact: false }).first()).toBeVisible();
    });
});