import { test, expect } from '@playwright/test';
import { MOCK_ME_RESPONSE } from '../../mocks/auth.mocks';

test.describe('Phase 1.3: Audit Logs', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Admin access
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ME_RESPONSE('admin'))
            });
        });

        // Mock Audit Logs API
        await page.route('**/api/console/admin/audit-logs?limit=500', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    logs: [
                        {
                            id: 'test-log-1',
                            timestamp: new Date().toISOString(),
                            eventType: 'LOGIN',
                            category: 'authentication',
                            action: 'User logged in',
                            description: 'Test User logged in successfully',
                            userId: 'u1',
                            userName: 'Test User',
                            userEmail: 'test@example.com',
                            userRole: 'Admin',
                            ipAddress: '127.0.0.1',
                            status: 'success',
                            sessionId: 'test-session'
                        }
                    ]
                })
            });
        });
    });

    test('Admin can view audit logs', async ({ page }) => {
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

        // Navigate to Audit Logs page
        await page.evaluate(() => {
            window.history.pushState(null, '', '/admin/audit');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        // Verify page loads
        await expect(page.getByText('Audit Logs', { exact: true })).toBeVisible({ timeout: 15000 });

        // Verify mock log entry is visible
        await expect(page.getByText('Test User logged in successfully')).toBeVisible();
        await expect(page.getByText('127.0.0.1')).toBeVisible();
    });
});