import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for authentication flows
 *
 * Handles login, logout, password reset, and session management
 */
export class AuthPage {
  constructor(private page: Page) {}

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/erp');
    // Wait for login form to be visible
    await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string) {
    // Fill email
    const emailInput = this.page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(email);

    // Fill password
    const passwordInput = this.page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill(password);

    // Click login button
    const loginButton = this.page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for navigation
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Perform logout
   */
  async logout() {
    const signOutButton = this.page.getByText('Sign Out').first();
    await signOutButton.click();
    await this.page.waitForURL(/.*login|.*erp/, { timeout: 10000 });
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    const forgotPasswordLink = this.page.getByText('Forgot Password', { exact: false }).first();
    await forgotPasswordLink.click();
  }

  /**
   * Submit password reset request
   */
  async submitPasswordReset(email: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.click('button:has-text("Reset Password"), button:has-text("Send Reset Link")');
  }

  /**
   * Verify user is logged in
   */
  async verifyLoggedIn() {
    await expect(this.page.getByText('Sign Out')).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify user is logged out
   */
  async verifyLoggedOut() {
    await expect(this.page).toHaveURL(/.*login|.*erp/);
    await expect(this.page.getByText('Sign Out')).not.toBeVisible();
  }

  /**
   * Verify login error message
   */
  async verifyLoginError(message: string) {
    await expect(this.page.getByText(message, { exact: false })).toBeVisible();
  }

  /**
   * Verify password reset success message
   */
  async verifyPasswordResetSuccess() {
    await expect(this.page.getByText('Reset link sent', { exact: false })).toBeVisible();
  }
}
