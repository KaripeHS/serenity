# Getting Started with Playwright E2E Testing

## 📚 Table of Contents

1. [What is Playwright?](#what-is-playwright)
2. [Installation & Setup](#installation--setup)
3. [Running Your First Test](#running-your-first-test)
4. [Understanding the Test Structure](#understanding-the-test-structure)
5. [Writing Your First Test](#writing-your-first-test)
6. [Common Commands](#common-commands)
7. [Debugging Tests](#debugging-tests)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Additional Resources](#additional-resources)

---

## What is Playwright?

**Playwright** is a modern test automation framework that allows you to:
- Automate web browser interactions (click buttons, fill forms, navigate pages)
- Verify that your application works correctly
- Run tests automatically whenever code changes
- Catch bugs before they reach production

Think of it as a robot that uses your application exactly like a real user would, but much faster and more reliably.

### Why Use Automated Testing?

**Manual Testing** (what you've been doing):
- ✅ Good for exploratory testing
- ❌ Slow (humans are slow)
- ❌ Error-prone (humans make mistakes)
- ❌ Boring (repetitive tasks)
- ❌ Not scalable (can't test everything, every time)

**Automated Testing** (with Playwright):
- ✅ Fast (tests run in seconds/minutes)
- ✅ Reliable (always does the same thing)
- ✅ Comprehensive (can test 100+ scenarios easily)
- ✅ Runs 24/7 (in CI/CD pipelines)
- ✅ Catches bugs immediately

---

## Installation & Setup

### Prerequisites

You should already have:
- Node.js installed (v18+)
- Your Serenity01 project set up

### Verify Installation

```bash
# Check if Playwright is installed
npx playwright --version
# Should show: Version 1.x.x

# If not installed, run:
npm install
```

### Visual Studio Code Extension (Recommended)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Playwright Test for VSCode"
4. Install it

**Benefits**:
- Run tests directly from VS Code
- Set breakpoints and debug visually
- See test results inline
- Record new tests automatically

---

## Running Your First Test

### Quick Start

```bash
# Start the frontend dev server (in one terminal)
cd frontend
npm run dev

# In another terminal, run tests
npm run test:e2e
```

### What You'll See

```
Running 20 tests using 8 workers

  ✓ COO can access user management page (2.3s)
  ✓ HR Manager can access user management page (1.8s)
  ✓ Caregiver cannot access user management page (1.5s)
  ✓ Create new user with all required fields (3.1s)
  ...

  20 passed (45s)
```

### Run Specific Tests

```bash
# Run just user management tests
npm run test:e2e -- comprehensive-user-management.spec.ts

# Run tests matching a pattern
npm run test:e2e -- --grep "COO can"

# Run a single test
npm run test:e2e -- --grep "Create new user"
```

### Interactive Mode (Best for Learning!)

```bash
npm run test:e2e -- --ui
```

This opens a visual interface where you can:
- See all your tests
- Click to run individual tests
- Watch tests execute in slow motion
- See exactly what the test is doing

---

## Understanding the Test Structure

### Test Anatomy

Let's break down a simple test:

```typescript
// 1. Import Playwright and helpers
import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/auth.helper';
import { UserManagementPage } from '../../pages/user-management.page';

// 2. Group related tests together
test.describe('User Management Tests', () => {

  // 3. Run before each test (setup)
  test.beforeEach(async ({ page }) => {
    // Login as founder before each test
    await loginAsRole(page, 'founder');
  });

  // 4. Individual test
  test('Create new user', async ({ page }) => {
    // ARRANGE: Set up the page
    const userMgmt = new UserManagementPage(page);
    await userMgmt.goto();

    // ACT: Perform the action
    await userMgmt.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'caregiver'
    });

    // ASSERT: Verify the result
    await userMgmt.verifySuccessMessage('User created successfully');
  });
});
```

### Key Concepts

**1. `test.describe()`** - Groups related tests
- Like a folder for tests
- Can have multiple tests inside
- Can have shared setup/teardown

**2. `test.beforeEach()`** - Runs before each test
- Sets up common state
- Logs in the user
- Navigates to starting page

**3. `test()`** - Individual test case
- Tests one specific scenario
- Should be independent
- Should have a clear name

**4. `async/await`** - Handles timing
- Most Playwright actions are asynchronous
- Always use `await` before Playwright commands
- Think of it as "wait for this to finish"

**5. `expect()`** - Assertions
- Verifies that something is true
- If assertion fails, test fails
- Examples:
  ```typescript
  await expect(page.getByText('Success')).toBeVisible();
  await expect(page).toHaveURL(/dashboard/);
  ```

---

## Writing Your First Test

### Step 1: Create a Test File

Create `e2e/specs/my-first-test.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsRole } from '../helpers/auth.helper';

test.describe('My First Tests', () => {
  test('Login as founder works', async ({ page }) => {
    // Login
    await loginAsRole(page, 'founder');

    // Verify we're logged in
    await expect(page.getByText('Sign Out')).toBeVisible();
  });
});
```

### Step 2: Run Your Test

```bash
npm run test:e2e -- my-first-test.spec.ts
```

### Step 3: See It Pass! ✅

```
✓ Login as founder works (1.2s)

1 passed (1.2s)
```

---

## Common Commands

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific file
npm run test:e2e -- my-test.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "login"

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run in UI mode (interactive)
npm run test:e2e -- --ui

# Run in debug mode
npm run test:e2e -- --debug
```

### Viewing Reports

```bash
# Show last test run HTML report
npx playwright show-report test-results/html-report

# This opens a browser with:
# - List of all tests (passed/failed)
# - Screenshots of failures
# - Videos of test execution
# - Detailed error messages
```

### Useful Flags

```bash
# Run tests serially (one at a time)
npm run test:e2e -- --workers=1

# Update snapshots
npm run test:e2e -- --update-snapshots

# Run only failed tests
npm run test:e2e -- --last-failed

# Run with maximum timeout
npm run test:e2e -- --timeout=120000
```

---

## Debugging Tests

### Method 1: VS Code Debugger (Easiest)

1. Install "Playwright Test for VSCode" extension
2. Open your test file
3. Click the green ▶️ button next to any test
4. Test runs with browser visible
5. Set breakpoints by clicking line numbers

### Method 2: UI Mode (Best for Understanding)

```bash
npm run test:e2e -- --ui
```

Features:
- Click any test to run it
- See test steps in real-time
- Inspect page at any point
- Time-travel through test execution
- See network requests
- View console logs

### Method 3: Debug Mode

```bash
npm run test:e2e -- --debug my-test.spec.ts
```

Opens Playwright Inspector:
- Step through test line by line
- Inspect elements on page
- Try selectors interactively
- See exactly what's happening

### Method 4: Screenshots & Videos

When tests fail, Playwright automatically saves:

**Screenshots**:
```
test-results/
  my-test-spec-ts-create-new-user/
    test-failed-1.png
```

**Videos**:
```
test-results/
  videos/
    my-test.webm
```

### Method 5: Console Output

Add `console.log()` to your tests:

```typescript
test('Debug example', async ({ page }) => {
  console.log('Starting test...');

  await page.goto('/admin/users');
  console.log('Navigated to:', page.url());

  const count = await page.locator('tr').count();
  console.log('Found rows:', count);
});
```

---

## Best Practices

### ✅ DO

**1. Use Page Objects**
```typescript
// ✅ Good
const userMgmt = new UserManagementPage(page);
await userMgmt.createUser({ ... });

// ❌ Bad
await page.click('button');
await page.fill('input', 'value');
```

**2. Use Descriptive Test Names**
```typescript
// ✅ Good
test('COO can create new caregiver user with valid email', async ({ page }) => {

// ❌ Bad
test('test 1', async ({ page }) => {
```

**3. Keep Tests Independent**
```typescript
// ✅ Good - Each test sets up its own state
test('Test A', async ({ page }) => {
  await loginAsRole(page, 'founder');
  // test logic
});

test('Test B', async ({ page }) => {
  await loginAsRole(page, 'founder');
  // different test logic
});

// ❌ Bad - Test B depends on Test A
let userId;
test('Test A', async ({ page }) => {
  userId = await createUser();
});
test('Test B', async ({ page }) => {
  await deleteUser(userId); // Breaks if Test A fails!
});
```

**4. Use Built-in Waits**
```typescript
// ✅ Good - Playwright waits automatically
await expect(page.getByText('Success')).toBeVisible();

// ❌ Bad - Manual waits are brittle
await page.waitForTimeout(3000); // What if it loads in 3.1 seconds?
```

**5. Use Specific Selectors**
```typescript
// ✅ Good
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('test@example.com');
await page.getByTestId('user-row').click();

// ❌ Bad
await page.locator('.btn-primary').click(); // CSS classes change
await page.locator('input').first().fill('test@example.com'); // Too generic
```

### ❌ DON'T

**1. Don't Use Sleep/Timeouts**
```typescript
// ❌ Bad
await page.waitForTimeout(5000);

// ✅ Good
await page.waitForSelector('[data-testid="loaded"]');
await expect(page.getByText('Loaded')).toBeVisible();
```

**2. Don't Test Implementation Details**
```typescript
// ❌ Bad - Tests CSS classes
await expect(page.locator('.text-green-500')).toBeVisible();

// ✅ Good - Tests behavior
await expect(page.getByText('Success')).toBeVisible();
```

**3. Don't Share State Between Tests**
```typescript
// ❌ Bad
let globalUser;
test('create user', async ({ page }) => {
  globalUser = await createUser();
});
test('update user', async ({ page }) => {
  await updateUser(globalUser.id); // Breaks if first test fails
});

// ✅ Good
test('update user', async ({ page }) => {
  const user = await createUser();
  await updateUser(user.id);
});
```

---

## Troubleshooting

### Problem: "Test timed out"

**Cause**: Test took longer than 60 seconds

**Solutions**:
```typescript
// Option 1: Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // test logic
});

// Option 2: Check if something is stuck
// Add console.log to see where it hangs
test('debug timeout', async ({ page }) => {
  console.log('Step 1');
  await page.goto('/admin');
  console.log('Step 2');
  await page.click('button'); // Might be hanging here
  console.log('Step 3');
});

// Option 3: Use --headed to see what's happening
// npm run test:e2e -- --headed my-test.spec.ts
```

### Problem: "Element not found"

**Cause**: Selector doesn't match anything on page

**Solutions**:
```typescript
// Option 1: Use Playwright Inspector
// npm run test:e2e -- --debug my-test.spec.ts
// Try different selectors interactively

// Option 2: Take a screenshot to see page state
await page.screenshot({ path: 'debug.png' });

// Option 3: Use more flexible selectors
await page.getByText('Submit', { exact: false }); // Partial match
await page.getByRole('button').first(); // First button
```

### Problem: "Frontend not running"

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:3002`

**Solution**:
```bash
# Make sure frontend dev server is running
cd frontend
npm run dev

# Or run tests with webServer auto-start (already configured)
npm run test:e2e
```

### Problem: "Tests are flaky (sometimes pass, sometimes fail)"

**Solutions**:
```typescript
// 1. Don't use waitForTimeout
// ❌ Bad
await page.waitForTimeout(1000);

// ✅ Good
await expect(page.getByText('Loaded')).toBeVisible();

// 2. Wait for network to be idle
await page.goto('/admin', { waitUntil: 'networkidle' });

// 3. Wait for specific conditions
await page.waitForSelector('[data-loaded="true"]');

// 4. Use auto-waiting assertions
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
```

### Problem: "Test passes locally but fails in CI"

**Common Causes**:
1. **Timing differences**: CI is slower
   - Solution: Increase timeouts

2. **Different viewport**: CI uses different screen size
   - Solution: Set viewport explicitly
   ```typescript
   await page.setViewportSize({ width: 1920, height: 1080 });
   ```

3. **Missing dependencies**: CI doesn't have browser
   - Solution: Install Playwright browsers
   ```bash
   npx playwright install --with-deps
   ```

---

## Additional Resources

### Official Documentation

- **Playwright Docs**: https://playwright.dev
- **Getting Started Guide**: https://playwright.dev/docs/intro
- **API Reference**: https://playwright.dev/docs/api/class-playwright
- **Best Practices**: https://playwright.dev/docs/best-practices

### Learn by Example

**Our Test Files**:
1. Start here: `e2e/specs/01-auth/comprehensive-user-management.spec.ts`
2. Then read: `e2e/specs/01-auth/audit-logs.spec.ts`
3. Study the patterns, copy and modify for your needs

**Page Objects**:
1. Read: `e2e/pages/user-management.page.ts`
2. See how methods encapsulate UI interactions
3. Create your own following the same pattern

### Video Tutorials

- **Playwright Official Channel**: https://www.youtube.com/@Playwrightweb
- **Playwright Tutorial for Beginners**: Search YouTube for "Playwright testing tutorial"

### Community

- **Playwright Discord**: https://aka.ms/playwright/discord
- **GitHub Discussions**: https://github.com/microsoft/playwright/discussions
- **Stack Overflow**: Tag: `playwright`

---

## Quick Reference Card

### Essential Commands

| Command | What It Does |
|---------|-------------|
| `npm run test:e2e` | Run all tests |
| `npm run test:e2e -- --ui` | Open interactive UI |
| `npm run test:e2e -- --headed` | Show browser while testing |
| `npm run test:e2e -- --debug` | Debug mode with inspector |
| `npm run test:e2e -- mytest.spec.ts` | Run specific file |
| `npm run test:e2e -- --grep "login"` | Run tests matching pattern |
| `npx playwright show-report` | View HTML test report |

### Essential Assertions

```typescript
// Visibility
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByText('Error')).not.toBeVisible();

// URL
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveURL('http://localhost:3002/admin/users');

// Text content
await expect(page.getByRole('heading')).toHaveText('Welcome');
await expect(page.getByTestId('count')).toContainText('5');

// Attributes
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.locator('input')).toHaveValue('test@example.com');

// Counts
await expect(page.getByRole('listitem')).toHaveCount(5);
```

### Essential Selectors

```typescript
// By role (most robust)
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('link', { name: 'Home' })

// By text
page.getByText('Sign Out')
page.getByText('Welcome', { exact: false }) // Partial match

// By label
page.getByLabel('Email')
page.getByLabel('Password')

// By test ID (best for testing)
page.getByTestId('user-row')
page.getByTestId('submit-button')

// By placeholder
page.getByPlaceholder('Enter your email')

// CSS selector (last resort)
page.locator('.my-class')
page.locator('#my-id')
```

---

## Next Steps

1. **Run existing tests**: `npm run test:e2e -- --ui`
2. **Read the tests**: Open `e2e/specs/01-auth/` and read the test files
3. **Modify a test**: Change a test name or assertion
4. **Write a simple test**: Create `my-first-test.spec.ts` following the example above
5. **Use page objects**: Study `e2e/pages/user-management.page.ts`
6. **Read the implementation plan**: `C:\Users\bdegu\.claude\plans\abstract-yawning-frost.md`

---

## Getting Help

If you get stuck:

1. **Check this guide** for common solutions
2. **Run with `--ui`** to see what's happening visually
3. **Read existing tests** for patterns
4. **Check official docs**: https://playwright.dev
5. **Ask the AI assistant** for help with specific issues

Happy Testing! 🎭
