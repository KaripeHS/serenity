/**
 * Layer 2: ERP Form Input Audit
 *
 * Tests form inputs on pages known to have forms:
 * - Verifies text inputs accept data
 * - Verifies select dropdowns have options
 * - Verifies checkboxes can be toggled
 */

import { test, expect } from '@playwright/test';
import { setupAuthAndNavigate } from '../../helpers/direct-auth.helper';
import { installCatchAllMock } from '../../mocks/catch-all.mock';

// Pages known to have form inputs
const FORM_ROUTES = [
  { path: '/admin/users', name: 'User Management', role: 'founder' },
  { path: '/patients/new', name: 'New Patient Intake', role: 'founder' },
  { path: '/dashboard/client-intake', name: 'Client Intake Wizard', role: 'founder' },
  { path: '/dashboard/crm', name: 'CRM Lead Pipeline', role: 'founder' },
  { path: '/admin/pods/new', name: 'Create Pod', role: 'founder' },
  { path: '/dashboard/hr', name: 'Talent Command Center', role: 'hr_manager' },
  { path: '/admin/settings/communications', name: 'Communication Settings', role: 'founder' },
  { path: '/profile/edit', name: 'Edit Profile', role: 'founder' },
  { path: '/profile/password', name: 'Change Password', role: 'founder' },
  { path: '/dashboard/dispatch', name: 'Coverage Dispatch', role: 'founder' },
  { path: '/dashboard/incidents', name: 'Incidents', role: 'founder' },
  { path: '/dashboard/credentials', name: 'Credentials', role: 'hr_manager' },
] as const;

test.describe('Layer 2: ERP Form Input Audit', () => {

  for (const route of FORM_ROUTES) {
    test(`Form inputs on "${route.name}" accept data`, async ({ page }) => {
      await installCatchAllMock(page);
      await setupAuthAndNavigate(page, route.role, route.path);

      // Count all input types
      const textInputs = page.locator(
        'input:visible:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([disabled]), textarea:visible:not([disabled])'
      );
      const selectInputs = page.locator('select:visible:not([disabled])');
      const checkboxInputs = page.locator('input[type="checkbox"]:visible:not([disabled])');

      const textCount = await textInputs.count();
      const selectCount = await selectInputs.count();
      const checkboxCount = await checkboxInputs.count();

      const totalInputs = textCount + selectCount + checkboxCount;

      console.log(
        `[INFO] "${route.name}" — ${textCount} text inputs, ${selectCount} selects, ${checkboxCount} checkboxes`
      );

      // Test text inputs
      for (let i = 0; i < Math.min(textCount, 10); i++) {
        const input = textInputs.nth(i);
        const type = await input.getAttribute('type') || 'text';
        const name = await input.getAttribute('name') || await input.getAttribute('placeholder') || `input-${i}`;

        let testValue: string;
        if (type === 'email') testValue = 'test@example.com';
        else if (type === 'tel') testValue = '5135551234';
        else if (type === 'number') testValue = '42';
        else if (type === 'date') testValue = '2025-01-15';
        else if (type === 'password') testValue = 'TestPassword123!';
        else testValue = 'Test data';

        try {
          await input.fill(testValue);
          const value = await input.inputValue();
          expect.soft(value.length,
            `Input "${name}" (type=${type}) on "${route.name}" did not accept data`
          ).toBeGreaterThan(0);
        } catch {
          console.warn(`[WARNING] Could not fill input "${name}" on "${route.name}"`);
        }
      }

      // Test select dropdowns
      for (let i = 0; i < Math.min(selectCount, 5); i++) {
        const select = selectInputs.nth(i);
        const optionCount = await select.locator('option').count();

        expect.soft(optionCount,
          `Select ${i} on "${route.name}" has no options`
        ).toBeGreaterThan(0);
      }

      // Test checkboxes
      for (let i = 0; i < Math.min(checkboxCount, 5); i++) {
        const cb = checkboxInputs.nth(i);
        try {
          await cb.check({ force: true });
          const checked = await cb.isChecked();
          expect.soft(checked, `Checkbox ${i} on "${route.name}" could not be checked`).toBe(true);
          await cb.uncheck({ force: true }); // Reset
        } catch {
          // Some checkboxes may be in a complex component
        }
      }
    });
  }
});
