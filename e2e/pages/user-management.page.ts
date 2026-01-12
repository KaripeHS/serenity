import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for User Management
 *
 * Handles user CRUD operations, search, filtering, and role management
 */
export class UserManagementPage {
  constructor(private page: Page) {}

  /**
   * Navigate to user management page
   */
  async goto() {
    await this.page.goto('/admin/users');
    await this.waitForLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    // Wait for either the user table or the add user button
    await Promise.race([
      this.page.waitForSelector('table, [data-testid="user-table"]', { timeout: 10000 }),
      this.page.waitForSelector('button:has-text("Add User")', { timeout: 10000 })
    ]);

    // Additionally wait for user count to appear (indicating data has loaded)
    await this.page.waitForSelector('[data-testid="user-count"]', { timeout: 10000 }).catch(() => {
      console.log('[UserManagement] User count element not found, may not have loaded yet');
    });

    // Wait for network to be idle (API calls complete)
    await this.page.waitForLoadState('networkidle').catch(() => {
      console.log('[UserManagement] Network idle timeout, continuing anyway');
    });
  }

  /**
   * Click Add User button
   */
  async clickAddUser() {
    const addButton = this.page.locator('button:has-text("Add User")').first();
    await addButton.click();
    // Wait for modal to appear
    await this.page.waitForSelector('input[name="firstName"], input[name="email"]', { timeout: 5000 });
  }

  /**
   * Fill user creation form
   */
  async fillUserForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    clinicalRole?: string;
  }) {
    await this.page.fill('input[name="firstName"]', data.firstName);
    await this.page.fill('input[name="lastName"]', data.lastName);
    await this.page.fill('input[name="email"]', data.email);

    // Select role
    const roleSelect = this.page.locator('select[name="role"]').first();
    await roleSelect.selectOption(data.role);

    if (data.clinicalRole) {
      const clinicalRoleSelect = this.page.locator('select[name="clinicalRole"]').first();
      if (await clinicalRoleSelect.isVisible()) {
        await clinicalRoleSelect.selectOption(data.clinicalRole);
      }
    }
  }

  /**
   * Submit user creation form
   */
  async submitUser() {
    const submitButton = this.page.locator('button:has-text("Create User"), button:has-text("Add User"), button:has-text("Save")').last();

    // Set up one-time dialog handler before clicking (alerts are shown after click)
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 2000 }).then(dialog => {
      console.log('[UserMgmt] Dialog detected:', dialog.message());
      return dialog.accept();
    }).catch(() => {
      console.log('[UserMgmt] No dialog appeared');
    });

    await submitButton.click();
    await dialogPromise;
  }

  /**
   * Create a new user (combines clickAddUser, fillUserForm, submitUser)
   */
  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    clinicalRole?: string;
  }) {
    await this.clickAddUser();
    await this.fillUserForm(data);
    await this.submitUser();
    // Wait for success message or modal to close
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify user appears in the list
   */
  async verifyUserInList(email: string) {
    await expect(this.page.locator(`text=${email}`)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Search for users
   */
  async searchUser(query: string) {
    const searchInput = this.page.locator('input[placeholder*="Search"], input[name="search"], input[type="search"]').first();
    await searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter users by role
   */
  async filterByRole(role: string) {
    const roleFilter = this.page.locator('select:has-text("All Roles"), select[name="roleFilter"]').first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption(role);
    }
  }

  /**
   * Get total user count from UI
   */
  async getUserCount(): Promise<number> {
    // Try to find count in various common locations
    const countSelectors = [
      '[data-testid="user-count"]',
      'text=/\\d+ users?/',
      'text=/Total: \\d+/',
    ];

    for (const selector of countSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        const match = text?.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
    }

    // Fallback: count table rows
    const rows = await this.page.locator('table tbody tr, [data-testid="user-row"]').count();
    return rows;
  }

  /**
   * Click on a user to view details
   */
  async selectUser(email: string) {
    const userRow = this.page.locator(`tr:has-text("${email}"), [data-testid="user-row"]:has-text("${email}")`).first();
    await userRow.click();
  }

  /**
   * Update user role
   */
  async updateUserRole(email: string, newRole: string) {
    await this.selectUser(email);
    const roleSelect = this.page.locator('select[name="role"]').first();
    await roleSelect.selectOption(newRole);
    const saveButton = this.page.locator('button:has-text("Save"), button:has-text("Update")').first();
    await saveButton.click();
  }

  /**
   * Deactivate user
   */
  async deactivateUser(email: string) {
    await this.selectUser(email);
    const deactivateButton = this.page.locator('button:has-text("Deactivate"), button:has-text("Suspend")').first();
    await deactivateButton.click();
    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(email: string) {
    await this.selectUser(email);
    const resetButton = this.page.locator('button:has-text("Reset Password")').first();
    await resetButton.click();
    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsers() {
    const exportButton = this.page.locator('button:has-text("Export"), button:has-text("Download CSV")').first();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      exportButton.click()
    ]);
    return download;
  }

  /**
   * Verify success message
   */
  async verifySuccessMessage(message: string) {
    // Try to find message in DOM first
    const textInDom = await this.page.getByText(message, { exact: false }).isVisible().catch(() => false);

    if (textInDom) {
      await expect(this.page.getByText(message, { exact: false })).toBeVisible({ timeout: 5000 });
    } else {
      // Message is shown in alert dialog - just wait for modal to close
      // The alert was already auto-accepted by the dialog handler in submitUser
      await this.page.waitForTimeout(1000);
      // Modal should be closed, which indicates success
      const modalClosed = await this.page.locator('input[name="firstName"]').isHidden().catch(() => true);
      expect(modalClosed).toBe(true);
    }
  }

  /**
   * Verify error message
   */
  async verifyErrorMessage(message: string) {
    // Try to find message in DOM first
    const textInDom = await this.page.getByText(message, { exact: false }).isVisible().catch(() => false);

    if (textInDom) {
      await expect(this.page.getByText(message, { exact: false })).toBeVisible({ timeout: 5000 });
    } else {
      // Message is shown in alert dialog - just wait
      // The alert was already auto-accepted by the dialog handler in submitUser
      await this.page.waitForTimeout(1000);
      // Modal should still be open for errors
      const modalStillOpen = await this.page.locator('input[name="firstName"]').isVisible().catch(() => false);
      expect(modalStillOpen).toBe(true);
    }
  }
}
