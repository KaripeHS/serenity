import { test, expect, Page } from '@playwright/test';
import { MOCK_LOGIN_RESPONSE, MOCK_ME_RESPONSE } from '../../mocks/auth.mocks';

test.describe('Phase 1.2: RBAC Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Admin for the first test (Admin Access)
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('admin'))
            });
        });
    });

    // Helper for SPA navigation
    const navigateTo = async (page: Page, path: string) => {
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        await page.evaluate((targetPath) => {
            window.history.pushState(null, '', targetPath);
            window.dispatchEvent(new PopStateEvent('popstate'));
        }, path);
        await page.waitForTimeout(1000); // Give React time to render
    };

    // Test 1: Admin Access (uses default auth state)
    test('Admin has full access to User Management', async ({ page }) => {
        // Use SPA navigation workaround
        await navigateTo(page, '/admin/users');

        // Verify access based on "Sign Out" visibility (authenticated) and URL
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });

        // Check for specific admin content or URL
        await expect(page).toHaveURL(/.*admin\/users/);
    });

    // Test 2: Caregiver Access Restricted
    test('Caregiver is restricted from Admin areas', async ({ page }) => {
        // Override the /me mock for this specific test to return Caregiver
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('caregiver'))
            });
        });

        // Navigate to dashboard first to initialize auth state
        await navigateTo(page, '/erp');
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });

        // Attempt access to admin
        await navigateTo(page, '/admin/users');

        // Expect redirect away/access denied (Dashboard or fallback)
        // ProtectedRoute renders "Access Denied" in-place
        await expect(page.getByText('Access Denied')).toBeVisible();
    });

    // Test 3: Pod Lead (Field Supervisor) Access
    test('Pod Lead has access to Pod Dashboard but not Org Settings', async ({ page }) => {
        // Override the /me mock for this specific test
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('podLead'))
            });
        });

        // Navigate to dashboard first
        await navigateTo(page, '/erp');
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });

        // Should access Pod Lead Dashboard
        await navigateTo(page, '/dashboard/pod-lead');
        await expect(page).toHaveURL(/.*dashboard\/pod-lead/);

        // Should NOT access Organization Settings
        await navigateTo(page, '/admin/settings/communications');

        // ProtectedRoute renders "Access Denied" in-place, URL stays checking
        await expect(page.getByText('Access Denied')).toBeVisible();
    });
});