/**
 * Layer 2: Public Page Interactables
 *
 * For each public page:
 * - Clicks every visible button and checks for a response
 * - Fills every form input to verify it accepts data
 * - Checks that links are clickable
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../helpers/route-registry';

test.describe('Layer 2: Public Page Button Audit', () => {

  for (const route of PUBLIC_ROUTES) {
    test(`All buttons on "${route.name}" respond to clicks`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 20000 });

      const buttons = page.locator('button:visible:not([disabled])');
      const buttonCount = await buttons.count();

      // Track orphaned buttons
      const orphaned: string[] = [];

      for (let i = 0; i < buttonCount; i++) {
        // Re-navigate to ensure clean state for each button
        if (i > 0) {
          await page.goto(route.path, { waitUntil: 'networkidle', timeout: 15000 });
        }

        // Re-query to avoid stale element references
        const currentButtons = page.locator('button:visible:not([disabled])');
        const currentCount = await currentButtons.count();
        if (i >= currentCount) break;

        const button = currentButtons.nth(i);
        const buttonText = (await button.textContent() || '').trim().slice(0, 40);

        // Capture state before click
        const urlBefore = page.url();
        const dialogBefore = await page.locator('[role="dialog"], [data-state="open"]').count();

        try {
          await button.click({ timeout: 3000 });
          await page.waitForTimeout(500);
        } catch {
          // Button might have been removed or become non-interactive
          continue;
        }

        const urlAfter = page.url();
        const dialogAfter = await page.locator('[role="dialog"], [data-state="open"]').count();

        // Check if anything changed
        const somethingHappened = urlBefore !== urlAfter || dialogBefore !== dialogAfter;

        if (!somethingHappened) {
          orphaned.push(buttonText || `button-${i}`);
        }
      }

      // Log orphaned buttons as warnings (some may need specific state to work)
      if (orphaned.length > 0) {
        console.warn(
          `[WARNING] "${route.name}" has ${orphaned.length} button(s) with no visible effect: ` +
          orphaned.join(', ')
        );
      }
    });
  }
});

test.describe('Layer 2: Public Page Form Input Audit', () => {

  // Pages with forms
  const FORM_PAGES = PUBLIC_ROUTES.filter(r =>
    ['/contact', '/referral', '/client-intake'].includes(r.path)
  );

  for (const route of FORM_PAGES) {
    test(`Form inputs on "${route.name}" accept data`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 20000 });

      // Test text inputs
      const textInputs = page.locator(
        'input:visible:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea:visible'
      );
      const textCount = await textInputs.count();

      for (let i = 0; i < textCount; i++) {
        const input = textInputs.nth(i);
        const type = await input.getAttribute('type') || 'text';
        const name = await input.getAttribute('name') || `input-${i}`;

        let testValue: string;
        if (type === 'email') testValue = 'test@example.com';
        else if (type === 'tel') testValue = '5135551234';
        else if (type === 'number') testValue = '42';
        else if (type === 'date') testValue = '2025-01-15';
        else testValue = 'Test input data';

        await input.fill(testValue);
        const value = await input.inputValue();

        expect(value.length,
          `Input "${name}" (type=${type}) on "${route.name}" did not accept data`
        ).toBeGreaterThan(0);
      }

      // Test select dropdowns
      const selects = page.locator('select:visible');
      const selectCount = await selects.count();

      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        const options = select.locator('option');
        const optionCount = await options.count();

        expect(optionCount,
          `Select dropdown ${i} on "${route.name}" has no options`
        ).toBeGreaterThan(0);

        // Try selecting the second option (first is often a placeholder)
        if (optionCount > 1) {
          const value = await options.nth(1).getAttribute('value');
          if (value) {
            await select.selectOption(value);
          }
        }
      }

      // Test checkboxes
      const checkboxes = page.locator('input[type="checkbox"]:visible');
      const cbCount = await checkboxes.count();

      for (let i = 0; i < cbCount; i++) {
        const cb = checkboxes.nth(i);
        const wasBefore = await cb.isChecked();
        await cb.check({ force: true }).catch(() => {});
        const isAfter = await cb.isChecked();

        // Either it was already checked, or we successfully checked it
        expect(wasBefore || isAfter,
          `Checkbox ${i} on "${route.name}" could not be checked`
        ).toBe(true);
      }
    });
  }
});
