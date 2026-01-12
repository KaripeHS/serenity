import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { MOCK_LOGIN_RESPONSE, MOCK_ME_RESPONSE } from './mocks/auth.mocks';

const authFile = path.resolve(process.cwd(), 'e2e/.auth/manual_user.json');

setup('authenticate', async ({ page }) => {
    // Ensure .auth directory exists
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    // Perform authentication steps
    console.log('Navigating to login page...');
    await page.goto('/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });


    // Setup API Mocks
    await page.route('**/api/auth/login', async route => {
        console.log('MOCK: Intercepting Login Request');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_LOGIN_RESPONSE('founder'))
        });
    });

    await page.route('**/api/auth/me', async route => {
        console.log('MOCK: Intercepting Me Request');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_ME_RESPONSE('founder'))
        });
    });

    await page.route('**/api/auth/refresh', async route => {
        await route.fulfill({ status: 401 }); // Force re-login if needed, or mock it?
    });

    // Client-side navigate to /erp (which uses HomePage -> LoginForm)
    console.log('Performing client-side navigation to /erp...');
    await page.evaluate(() => {
        window.history.pushState(null, '', '/erp');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Give React time to render
    await page.waitForTimeout(2000);
    console.log(`URL after nav: ${page.url()}`);
    // Force a re-render if needed or wait for router
    // This depends on how React Router listens. 
    // Alternative: Find a non-existent login button or use router instance if accessible.
    // Let's try attempting to find the input immediately after.

    console.log('Waiting for email input...');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });

    console.log('Filling credentials...');
    await page.getByPlaceholder('you@serenitycarepartners.com').fill('founder@serenitycarepartners.com');
    await page.getByPlaceholder('Enter your password').fill('ChangeMe123!');
    console.log('Clicking sign in...');
    await page.getByRole('button', { name: /sign in/i }).click();

    console.log('Waiting for dashboard...');
    // Wait until the page receives the cookies/storage state
    try {
        // "Serenity ERP" is present on Login page too, so we MUST wait for something only on Dashboard.
        // "Sign Out" is in the sidebar.
        await expect(page.getByRole('button', { name: /sign out/i }).first()).toBeVisible({ timeout: 15000 });
        console.log('Login successful, dashboard visible.');

        // Final verification that token exists before saving
        await page.waitForFunction(() => !!localStorage.getItem('serenity_access_token'), { timeout: 5000 });

    } catch (e) {
        console.log('Dashboard (Sign Out) not found, dumping content...');
        throw e;
    }

    // Manually save storage state to ensure correct format
    const origins = await page.evaluate(() => {
        const ls: { name: string; value: string }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) ls.push({ name: key, value: localStorage.getItem(key)! });
        }
        return [{
            origin: window.location.origin,
            localStorage: ls
        }];
    });

    const storageState = {
        cookies: [], // We don't use cookies for auth
        origins: origins
    };

    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2), 'utf8');

    // Verify file written
    if (fs.existsSync(authFile)) {
        console.log(`Auth file created manually at ${authFile}, size: ${fs.statSync(authFile).size} bytes`);
    } else {
        console.error('Auth file NOT created!');
    }
});
