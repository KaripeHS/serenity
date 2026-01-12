# Playwright Quick Reference Card

## 🚀 Most Common Commands

```bash
# Start dev server (in separate terminal)
cd frontend && npm run dev

# Run all tests
npm run test:e2e

# Run with visual UI (BEST for learning!)
npm run test:e2e -- --ui

# Run specific test file
npm run test:e2e -- comprehensive-user-management.spec.ts

# Run in debug mode (step through tests)
npm run test:e2e -- --debug

# Show browser while testing
npm run test:e2e -- --headed

# View last test report
npx playwright show-report test-results/html-report
```

## 📝 Write a Basic Test (Copy & Paste Template)

```typescript
import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/auth.helper';

test.describe('My Feature Tests', () => {
  test('My first test', async ({ page }) => {
    // 1. Setup: Login as a role
    await loginAsRole(page, 'founder'); // or 'ceo', 'coo', 'hr_manager', etc.

    // 2. Navigate to page
    await page.goto('/your/page');

    // 3. Do something
    await page.click('button:has-text("Click Me")');
    await page.fill('input[name="email"]', 'test@example.com');

    // 4. Verify result
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## 🎯 Essential Selectors (How to Find Elements)

```typescript
// ✅ Best: By Role (accessibility-friendly)
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('link', { name: 'Home' })
page.getByRole('heading', { name: 'Welcome' })

// ✅ Good: By Text
page.getByText('Sign Out')
page.getByText('Success', { exact: false }) // partial match

// ✅ Good: By Label
page.getByLabel('Email')
page.getByLabel('Password')

// ✅ Good: By Test ID (best for testing)
page.getByTestId('user-row')
page.getByTestId('submit-btn')

// ✅ Good: By Placeholder
page.getByPlaceholder('Enter email')

// ⚠️ Use sparingly: CSS/XPath
page.locator('button.submit')
page.locator('#user-123')

// 🔧 Filters and chains
page.getByRole('button').filter({ hasText: 'Submit' })
page.locator('tr').filter({ hasText: 'John' })
page.getByRole('row').first()
page.getByRole('row').last()
page.getByRole('row').nth(2) // 0-indexed
```

## ✅ Essential Assertions

```typescript
// Visibility
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByText('Error')).not.toBeVisible();
await expect(page.getByText('Loading')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toHaveText('Welcome');
await expect(page.getByTestId('count')).toContainText('5');

// URL checks
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveURL('http://localhost:3002/admin');

// Element state
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('checkbox')).toBeChecked();

// Form values
await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);

// Attribute
await expect(page.locator('a')).toHaveAttribute('href', '/home');

// CSS class
await expect(page.locator('div')).toHaveClass(/active/);
```

## 🎬 Common Actions

```typescript
// Click
await page.click('button:has-text("Submit")');
await page.getByRole('button', { name: 'Submit' }).click();

// Type text
await page.fill('input[name="email"]', 'test@example.com');
await page.getByLabel('Email').fill('test@example.com');

// Select dropdown
await page.selectOption('select[name="role"]', 'admin');
await page.selectOption('select[name="role"]', { label: 'Administrator' });

// Check/uncheck
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// Upload file
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Press keys
await page.press('input', 'Enter');
await page.keyboard.press('Tab');
await page.keyboard.type('Hello World');

// Hover
await page.hover('button');

// Double click
await page.dblclick('button');

// Right click
await page.click('button', { button: 'right' });

// Navigate
await page.goto('/admin/users');
await page.goBack();
await page.goForward();
await page.reload();

// Wait for element
await page.waitForSelector('button:has-text("Loaded")');
await page.waitForURL(/dashboard/);
await page.waitForLoadState('networkidle');
```

## 🔍 Get Information from Page

```typescript
// Get text content
const text = await page.getByRole('heading').textContent();
const innerText = await page.getByRole('heading').innerText();

// Get attribute
const href = await page.locator('a').getAttribute('href');

// Get value
const value = await page.locator('input').inputValue();

// Count elements
const count = await page.locator('tr').count();

// Check if visible
const isVisible = await page.getByText('Success').isVisible();

// Check if enabled
const isEnabled = await page.getByRole('button').isEnabled();

// Get all elements
const items = await page.getByRole('listitem').all();
for (const item of items) {
  const text = await item.textContent();
  console.log(text);
}

// Evaluate JavaScript
const title = await page.evaluate(() => document.title);
```

## 📸 Debugging Tools

```typescript
// Take screenshot
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Pause test (opens inspector)
await page.pause();

// Console log
console.log('Current URL:', page.url());

// Wait for specific time (use sparingly!)
await page.waitForTimeout(1000); // 1 second

// Set slower execution
await page.setViewportSize({ width: 1920, height: 1080 });

// Get page title
const title = await page.title();
console.log('Page title:', title);
```

## 🏗️ Using Page Objects

```typescript
import { UserManagementPage } from '../../pages/user-management.page';

test('Use page object', async ({ page }) => {
  await loginAsRole(page, 'founder');

  // Create page object instance
  const userMgmt = new UserManagementPage(page);

  // Use page object methods
  await userMgmt.goto();
  await userMgmt.createUser({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'caregiver'
  });

  await userMgmt.verifySuccessMessage('User created successfully');
});
```

## 🎭 Different User Roles

```typescript
// Login as different roles
await loginAsRole(page, 'founder');     // Full access
await loginAsRole(page, 'ceo');         // Executive
await loginAsRole(page, 'coo');         // Operations
await loginAsRole(page, 'cfo');         // Finance
await loginAsRole(page, 'hr_manager');  // HR
await loginAsRole(page, 'caregiver');   // Caregiver
await loginAsRole(page, 'pod_lead');    // Pod Lead

// Test RBAC (Role-Based Access Control)
test('Admin can access page', async ({ page }) => {
  await loginAsRole(page, 'founder');
  await page.goto('/admin/users');
  await expect(page.getByText('Access Denied')).not.toBeVisible();
});

test('Caregiver cannot access page', async ({ page }) => {
  await loginAsRole(page, 'caregiver');
  await page.goto('/admin/users');
  await expect(page.getByText('Access Denied')).toBeVisible();
});
```

## 🔧 Test Organization

```typescript
// Group tests
test.describe('User Management', () => {
  // Run before each test
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'founder');
  });

  // Run after each test
  test.afterEach(async ({ page }) => {
    // Cleanup if needed
  });

  // Run before all tests in this group
  test.beforeAll(async () => {
    // Setup once
  });

  // Run after all tests in this group
  test.afterAll(async () => {
    // Cleanup once
  });

  test('Test 1', async ({ page }) => { ... });
  test('Test 2', async ({ page }) => { ... });
});

// Skip test
test.skip('Not ready yet', async ({ page }) => { ... });

// Only run this test
test.only('Focus on this', async ({ page }) => { ... });

// Conditional skip
test('Conditional test', async ({ page }) => {
  test.skip(process.env.CI === 'true', 'Skip on CI');
  // test logic
});

// Set timeout for specific test
test('Slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // test logic
});
```

## 🐛 Common Errors & Solutions

### "Element not found"
```typescript
// ❌ Bad
await page.click('button');

// ✅ Good - Wait for it
await page.waitForSelector('button');
await page.click('button');

// ✅ Better - Auto-waits
await page.getByRole('button', { name: 'Submit' }).click();
```

### "Test timeout"
```typescript
// Increase timeout
test('Slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ... test
});

// Or wait for specific condition
await page.waitForLoadState('networkidle');
```

### "Multiple elements found"
```typescript
// ❌ Bad - Ambiguous
await page.click('button');

// ✅ Good - Specific
await page.getByRole('button', { name: 'Submit' }).click();
await page.locator('button').first().click();
await page.locator('button').filter({ hasText: 'Submit' }).click();
```

### "Element is not visible"
```typescript
// Wait for visibility
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });

// Check if element exists but not visible
const isHidden = await page.getByText('Error').isHidden();
```

## 🎨 Mock API Responses

```typescript
import { loginAsRole } from '../../helpers/auth.helper';
import { ApiRouter } from '../../mocks/api-router';

test('Override API response', async ({ page }) => {
  const router = await loginAsRole(page, 'founder');

  // Override specific endpoint
  await router.mockEndpoint('**/api/console/admin/users', {
    error: 'Something went wrong',
    message: 'Server error'
  }, 500);

  // Now when app calls that endpoint, it gets the error
  await page.goto('/admin/users');
  await expect(page.getByText('Server error')).toBeVisible();
});
```

## 📊 Running Tests

```bash
# All tests
npm run test:e2e

# Specific file
npm run test:e2e -- my-test.spec.ts

# Specific project
npm run test:e2e -- --project=e2e

# By grep pattern
npm run test:e2e -- --grep "create user"

# Exclude pattern
npm run test:e2e -- --grep-invert "slow"

# With specific browser
npm run test:e2e -- --project=chromium

# Serial execution (one at a time)
npm run test:e2e -- --workers=1

# With retries
npm run test:e2e -- --retries=2

# Update snapshots
npm run test:e2e -- --update-snapshots

# Only failed tests from last run
npm run test:e2e -- --last-failed

# List all tests without running
npm run test:e2e -- --list

# Generate report
npx playwright show-report test-results/html-report
```

## 🎓 Learning Path

1. **Day 1**: Run `npm run test:e2e -- --ui` and watch tests execute
2. **Day 2**: Read `e2e/GETTING_STARTED.md`
3. **Day 3**: Read existing tests in `e2e/specs/01-auth/`
4. **Day 4**: Modify an existing test
5. **Day 5**: Write a simple test using the template above
6. **Day 6**: Create a page object for a new page
7. **Day 7**: Write comprehensive tests for a feature

## 📚 Documentation Files

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Beginner guide (start here!)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - How everything fits together
- **[README.md](README.md)** - Detailed documentation
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - This file
- **Official Docs**: https://playwright.dev

## 💡 Tips

1. **Use `--ui` mode** when learning - it's visual and interactive
2. **Use `--debug` mode** when stuck - step through line by line
3. **Read existing tests** - copy patterns that work
4. **Use page objects** - don't write selectors in tests
5. **Start simple** - one test at a time
6. **Run tests often** - catch issues early
7. **Use descriptive names** - "Admin can create user" not "test 1"
8. **Keep tests independent** - each test should work alone
9. **Use auto-waiting** - let Playwright handle timing
10. **Check the docs** - Playwright docs are excellent

---

**Need Help?**
1. Check this reference card
2. Read [GETTING_STARTED.md](GETTING_STARTED.md)
3. Run with `--ui` to see what's happening
4. Check official docs: https://playwright.dev
5. Ask the AI assistant

Happy Testing! 🎭
