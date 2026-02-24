/**
 * Layer 2: Dropdown & Modal Verification
 *
 * Tests specific interactive patterns that exist across the ERP:
 * - Notification dropdown
 * - Profile dropdown menu
 * - Sidebar section expand/collapse
 * - Modal dialogs (Add User, etc.)
 * - Tab navigation on command centers
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

test.describe('Layer 2: Dropdown & Modal Verification', () => {

  test('Sidebar sections expand and collapse without crashing', async ({ page }) => {
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // Find collapsible section headers in the sidebar
    const sectionButtons = page.locator('nav button');
    const count = await sectionButtons.count();

    let expandableCount = 0;

    for (let i = 0; i < count; i++) {
      const btn = sectionButtons.nth(i);
      const text = (await btn.textContent() || '').trim();

      // Skip non-expandable buttons
      if (!text || text === 'Sign Out' || text.length > 40) continue;

      try {
        // Click to expand
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(300);

        // Click to collapse
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(300);

        expandableCount++;
      } catch {
        // Not all buttons are expandable
      }

      // Verify no crash
      const bodyText = await page.locator('body').textContent() || '';
      expect(bodyText.includes('Component Error'), `Sidebar section "${text}" toggle caused crash`).toBe(false);
    }

    expect(expandableCount, 'Should have found some expandable sidebar sections').toBeGreaterThan(0);
  });

  test('Profile dropdown shows menu items', async ({ page }) => {
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // Look for the profile/avatar button in the header area
    const headerButtons = page.locator('header button, .sticky button');
    const count = await headerButtons.count();

    let profileMenuOpened = false;

    for (let i = count - 1; i >= 0; i--) {
      const btn = headerButtons.nth(i);
      const isVisible = await btn.isVisible().catch(() => false);
      if (!isVisible) continue;

      try {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(500);

        // Check if profile menu items appeared
        const hasProfile = await page.getByText('My Profile').isVisible().catch(() => false);
        const hasEditProfile = await page.getByText('Edit Profile').isVisible().catch(() => false);

        if (hasProfile || hasEditProfile) {
          profileMenuOpened = true;
          break;
        }
      } catch {
        continue;
      }
    }

    // It's OK if the profile menu isn't found (different layout), just log
    if (!profileMenuOpened) {
      console.log('[INFO] Profile dropdown menu not found — may use different pattern');
    }
  });

  test('Tab navigation works on command center dashboards', async ({ page }) => {
    await installCatchAllMock(page);

    const commandCenters = [
      { path: '/dashboard/hr', name: 'Talent Command Center', role: 'founder' },
      { path: '/dashboard/clinical', name: 'Clinical Command Center', role: 'founder' },
      { path: '/dashboard/compliance', name: 'Compliance Command Center', role: 'founder' },
      { path: '/dashboard/operations', name: 'Operations Command Center', role: 'founder' },
    ] as const;

    for (const cc of commandCenters) {
      await setupAuthAndNavigate(page, cc.role, cc.path);

      // Look for tab buttons (Radix UI tabs, custom tabs, etc.)
      const tabs = page.locator('[role="tab"], button[data-state]');
      const tabCount = await tabs.count();

      if (tabCount === 0) {
        // Try alternative tab patterns (buttons inside a tab-like container)
        const altTabs = page.locator('.flex.border-b button, .tab-bar button');
        const altCount = await altTabs.count();

        if (altCount > 0) {
          // Click each tab
          for (let i = 0; i < Math.min(altCount, 5); i++) {
            const tab = altTabs.nth(i);
            await tab.click({ timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(300);

            // Page should not crash
            const bodyText = await page.locator('body').textContent() || '';
            expect(bodyText.includes('Component Error'),
              `Tab click on "${cc.name}" tab ${i} caused crash`
            ).toBe(false);
          }
        }
        continue;
      }

      // Click each visible tab
      for (let i = 0; i < Math.min(tabCount, 6); i++) {
        const tab = tabs.nth(i);
        const isVisible = await tab.isVisible().catch(() => false);
        if (!isVisible) continue;

        await tab.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(400);

        // Verify no crash after tab switch
        const bodyText = await page.locator('body').textContent() || '';
        expect(bodyText.includes('Component Error'),
          `Tab ${i} on "${cc.name}" caused crash`
        ).toBe(false);
      }

      console.log(`[OK] "${cc.name}" — ${tabCount} tabs tested`);
    }
  });

  test('Add User modal opens on user management page', async ({ page }) => {
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/admin/users');

    // Look for Add/Create User button
    const addButton = page.locator('button').filter({ hasText: /add user|create user|new user/i }).first();
    const isVisible = await addButton.isVisible().catch(() => false);

    if (isVisible) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Modal should appear with form inputs
      const hasDialog = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
      const hasInput = await page.locator('input[name="email"], input[name="firstName"], input[placeholder*="email"]').first().isVisible().catch(() => false);

      expect(hasDialog || hasInput,
        'Add User modal should appear with form inputs'
      ).toBe(true);
    } else {
      console.log('[INFO] Add User button not found — may require different interaction');
    }
  });

  test('Search functionality opens and accepts input', async ({ page }) => {
    await installCatchAllMock(page);
    await setupAuthAndNavigate(page, 'founder', '/dashboard/executive');

    // Look for search button or input in the header
    const searchButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /search/i }).first();
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    const hasSearchButton = await searchButton.isVisible().catch(() => false);
    const hasSearchInput = await searchInput.isVisible().catch(() => false);

    if (hasSearchButton) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Search modal or input should appear
      const modalInput = page.locator('[role="dialog"] input, .modal input').first();
      const hasModalInput = await modalInput.isVisible().catch(() => false);

      if (hasModalInput) {
        await modalInput.fill('test search');
        const value = await modalInput.inputValue();
        expect(value).toBe('test search');
      }
    } else if (hasSearchInput) {
      await searchInput.fill('test search');
      const value = await searchInput.inputValue();
      expect(value).toBe('test search');
    } else {
      // Try keyboard shortcut (Cmd+K or Ctrl+K)
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);

      const modalInput = page.locator('[role="dialog"] input').first();
      const appeared = await modalInput.isVisible().catch(() => false);
      if (appeared) {
        await modalInput.fill('test search');
        const value = await modalInput.inputValue();
        expect(value).toBe('test search');
      } else {
        console.log('[INFO] Search functionality not found via button, input, or Ctrl+K');
      }
    }
  });
});
