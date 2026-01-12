# Test Infrastructure Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR TEST FILE                          │
│  e2e/specs/01-auth/comprehensive-user-management.spec.ts    │
│                                                             │
│  test('Create new user', async ({ page }) => {             │
│    await loginAsRole(page, 'founder');        ←─────┐      │
│    const userMgmt = new UserManagementPage(page); ←─┼───┐  │
│    await userMgmt.createUser({ ... });         ←────┼───┼─┐│
│    await userMgmt.verifySuccess();             ←────┼───┼─┼┤
│  });                                                │   │ ││
└─────────────────────────────────────────────────────┼───┼─┼┘
                                                      │   │ │
                ┌─────────────────────────────────────┘   │ │
                │                                         │ │
                ▼                                         │ │
┌───────────────────────────────┐                        │ │
│      HELPER FUNCTION          │                        │ │
│  e2e/helpers/auth.helper.ts   │                        │ │
│                               │                        │ │
│  loginAsRole(page, 'founder') │                        │ │
│    ├─ Mock all APIs      ────────┐                     │ │
│    ├─ Set role                   │                     │ │
│    ├─ Navigate to login          │                     │ │
│    ├─ Fill credentials           │                     │ │
│    └─ Submit form                │                     │ │
└───────────────────────────────┘  │                     │ │
                                   │                     │ │
                ┌──────────────────┘                     │ │
                │                                        │ │
                ▼                                        │ │
┌───────────────────────────────────────────────┐       │ │
│           API ROUTER                          │       │ │
│      e2e/mocks/api-router.ts                  │       │ │
│                                               │       │ │
│  mockAllEndpoints() {                         │       │ │
│    ├─ Auth endpoints     → auth.fixtures     ─┼───┐   │ │
│    ├─ User endpoints     → users.fixtures    ─┼───┼─┐ │ │
│    ├─ Patient endpoints  → patients.fixtures ─┼───┼─┼┐│ │
│    ├─ HR endpoints       → hr.fixtures       ─┼───┼─┼┤ │
│    ├─ EVV endpoints      → evv.fixtures      ─┼───┼─┼┤ │
│    └─ Billing endpoints  → billing.fixtures  ─┼───┼─┼┤ │
│  }                                            │   │ │││ │
└───────────────────────────────────────────────┘   │ │││ │
                                                    │ │││ │
        ┌───────────────────────────────────────────┘ │││ │
        │   ┌─────────────────────────────────────────┘││ │
        │   │   ┌──────────────────────────────────────┘│ │
        │   │   │   ┌───────────────────────────────────┘ │
        ▼   ▼   ▼   ▼                                     │
┌────────────────────────────────────────┐                │
│         API FIXTURES                   │                │
│  e2e/mocks/api-fixtures/*.fixtures.ts  │                │
│                                        │                │
│  ┌──────────────────────────────────┐ │                │
│  │  auth.fixtures.ts                │ │                │
│  │  ├─ loginSuccess(role)           │ │                │
│  │  ├─ meSuccess(role)              │ │                │
│  │  └─ passwordResetSuccess()       │ │                │
│  └──────────────────────────────────┘ │                │
│                                        │                │
│  ┌──────────────────────────────────┐ │                │
│  │  users.fixtures.ts               │ │                │
│  │  ├─ generateUser()               │ │                │
│  │  ├─ getUsersResponse()           │ │                │
│  │  └─ createUserResponse()         │ │                │
│  └──────────────────────────────────┘ │                │
│                                        │                │
│  + 6 more fixture files...            │                │
└────────────────────────────────────────┘                │
                                                          │
                        ┌─────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│           PAGE OBJECT                         │
│   e2e/pages/user-management.page.ts           │
│                                               │
│  class UserManagementPage {                   │
│    goto() { ... }                             │
│    clickAddUser() { ... }                     │
│    fillUserForm(data) { ... }                 │
│    submitUser() { ... }                       │
│    createUser(data) {                         │
│      ├─ clickAddUser()                        │
│      ├─ fillUserForm(data)                    │
│      └─ submitUser()                          │
│    }                                          │
│    verifySuccessMessage(msg) { ... }          │
│  }                                            │
└───────────────────────────────────────────────┘
```

## How It All Works Together

### 1. You Write a Test

```typescript
test('Create new user', async ({ page }) => {
  // Step 1: Login
  await loginAsRole(page, 'founder');

  // Step 2: Use page object
  const userMgmt = new UserManagementPage(page);
  await userMgmt.goto();

  // Step 3: Perform action
  await userMgmt.createUser({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'caregiver'
  });

  // Step 4: Verify
  await userMgmt.verifySuccessMessage('User created successfully');
});
```

### 2. Auth Helper Mocks APIs

When you call `loginAsRole(page, 'founder')`:

```typescript
// e2e/helpers/auth.helper.ts
export async function loginAsRole(page, role) {
  // 1. Create API router
  const router = new ApiRouter(page);

  // 2. Mock ALL API endpoints
  await router.mockAllEndpoints();

  // 3. Set the current role
  await router.mockAuthWithRole(role);

  // 4. Navigate to login
  await page.goto('/erp');

  // 5. Fill credentials
  await page.fill('input[type="email"]', 'founder@test.serenitycare.com');
  await page.fill('input[type="password"]', 'TestPassword123!');

  // 6. Submit
  await page.click('button[type="submit"]');

  return router;
}
```

### 3. API Router Intercepts Requests

When frontend makes API call: `POST /api/auth/login`

```typescript
// e2e/mocks/api-router.ts
await page.route('**/api/auth/login', (route) => {
  const postData = route.request().postDataJSON();

  if (postData.password === 'TestPassword123!') {
    // Return mocked success response
    route.fulfill({
      status: 200,
      json: authFixtures.loginSuccess(role)
    });
  }
});
```

### 4. Fixture Returns Realistic Data

```typescript
// e2e/mocks/api-fixtures/auth.fixtures.ts
loginSuccess: (role: string) => ({
  success: true,
  user: {
    id: 'user-founder-001',
    email: 'founder@test.serenitycare.com',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: 'founder',
    status: 'active'
  },
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refreshToken: 'abc123...'
})
```

### 5. Page Object Abstracts UI

When you call `userMgmt.createUser(data)`:

```typescript
// e2e/pages/user-management.page.ts
async createUser(data) {
  // 1. Click Add User button
  await this.page.click('button:has-text("Add User")');

  // 2. Fill form
  await this.page.fill('input[name="firstName"]', data.firstName);
  await this.page.fill('input[name="lastName"]', data.lastName);
  await this.page.fill('input[name="email"]', data.email);
  await this.page.selectOption('select[name="role"]', data.role);

  // 3. Submit
  await this.page.click('button:has-text("Create User")');
}
```

### 6. Test Verifies Result

```typescript
await userMgmt.verifySuccessMessage('User created successfully');

// Which does:
await expect(this.page.getByText('User created successfully')).toBeVisible();
```

## Data Flow Diagram

```
┌─────────┐
│  TEST   │
└────┬────┘
     │
     │ 1. Call loginAsRole()
     ▼
┌─────────────┐
│   HELPER    │
└──────┬──────┘
       │
       │ 2. Create ApiRouter
       │ 3. Mock all endpoints
       ▼
┌──────────────┐     ┌──────────────┐
│  API ROUTER  │────▶│   FIXTURES   │
└──────┬───────┘     └──────────────┘
       │             (Realistic Data)
       │
       │ 4. Intercept API calls
       │ 5. Return mocked responses
       │
       ▼
┌──────────────┐
│   BROWSER    │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 6. Render UI with mocked data
       │
       ▼
┌──────────────┐
│ PAGE OBJECT  │
└──────┬───────┘
       │
       │ 7. Interact with UI
       │ 8. Fill forms
       │ 9. Click buttons
       │
       ▼
┌──────────────┐
│   BROWSER    │
│  (Updated)   │
└──────┬───────┘
       │
       │ 10. Verify results
       │
       ▼
┌──────────────┐
│     TEST     │
│   ✅ PASS    │
└──────────────┘
```

## Component Responsibilities

### Tests (`e2e/specs/**/*.spec.ts`)
**What**: High-level test scenarios
**Responsibilities**:
- Define WHAT to test
- Arrange, Act, Assert pattern
- Use helpers and page objects

**Example**:
```typescript
test('Admin can create user', async ({ page }) => {
  await loginAsRole(page, 'founder');
  const userMgmt = new UserManagementPage(page);
  await userMgmt.createUser({ ... });
  await userMgmt.verifySuccessMessage('Success');
});
```

### Helpers (`e2e/helpers/*.helper.ts`)
**What**: Reusable utility functions
**Responsibilities**:
- Common operations (login, navigation)
- Setup/teardown logic
- Mock orchestration

**Example**:
```typescript
export async function loginAsRole(page, role) {
  const router = new ApiRouter(page);
  await router.mockAllEndpoints();
  // ... login logic
  return router;
}
```

### Page Objects (`e2e/pages/*.page.ts`)
**What**: UI abstraction layer
**Responsibilities**:
- Encapsulate page interactions
- Hide implementation details
- Provide business-focused methods

**Example**:
```typescript
class UserManagementPage {
  async createUser(data) {
    await this.clickAddUser();
    await this.fillUserForm(data);
    await this.submitUser();
  }
}
```

### API Router (`e2e/mocks/api-router.ts`)
**What**: Central API mocking orchestrator
**Responsibilities**:
- Intercept all API calls
- Route to appropriate fixtures
- Handle role-based responses

**Example**:
```typescript
await page.route('**/api/auth/login', route => {
  route.fulfill({ json: authFixtures.loginSuccess(role) });
});
```

### Fixtures (`e2e/mocks/api-fixtures/*.fixtures.ts`)
**What**: Realistic test data generators
**Responsibilities**:
- Generate realistic data
- Provide predefined states
- Return API-shaped responses

**Example**:
```typescript
export const userFixtures = {
  generateUser: (overrides) => ({
    id: uuid(),
    email: 'test@example.com',
    firstName: 'Test',
    ...overrides
  })
};
```

## Why This Architecture?

### ✅ Benefits

**1. Maintainable**
- Change UI? Update page object only
- Change API? Update fixture only
- Tests remain stable

**2. Reusable**
- Page objects used across many tests
- Helpers used across many tests
- Fixtures used across many tests

**3. Readable**
- Tests read like plain English
- Business logic is clear
- No technical details in tests

**4. Fast**
- No real API calls (mocked)
- No database required
- Tests run in parallel

**5. Reliable**
- Consistent data (fixtures)
- No network flakiness
- No database state issues

### Example: What Happens When UI Changes?

**Scenario**: Button text changes from "Add User" to "Create New User"

**Without Page Objects** (Bad):
```typescript
// 50 tests all break!
test('Test 1', async ({ page }) => {
  await page.click('button:has-text("Add User")'); // ❌ BREAKS
});

test('Test 2', async ({ page }) => {
  await page.click('button:has-text("Add User")'); // ❌ BREAKS
});

// ... 48 more tests that break
```

**With Page Objects** (Good):
```typescript
// Fix in ONE place
class UserManagementPage {
  async clickAddUser() {
    await this.page.click('button:has-text("Create New User")'); // ✅ Fixed
  }
}

// All 50 tests work again!
test('Test 1', async ({ page }) => {
  const userMgmt = new UserManagementPage(page);
  await userMgmt.clickAddUser(); // ✅ WORKS
});
```

## Execution Flow (Step-by-Step)

```
1. You run: npm run test:e2e
   ↓
2. Playwright starts browser
   ↓
3. Test starts: test('Create user', async ({ page }) => { ... })
   ↓
4. Test calls: await loginAsRole(page, 'founder')
   ↓
5. Helper creates ApiRouter and mocks all endpoints
   ↓
6. Helper navigates to /erp
   ↓
7. Frontend loads and tries: POST /api/auth/login
   ↓
8. ApiRouter intercepts and returns: authFixtures.loginSuccess('founder')
   ↓
9. Frontend receives mocked response and redirects to /dashboard
   ↓
10. Test creates page object: new UserManagementPage(page)
    ↓
11. Test calls: userMgmt.goto()
    ↓
12. Page object navigates to: /admin/users
    ↓
13. Frontend tries: GET /api/console/admin/users
    ↓
14. ApiRouter intercepts and returns: userFixtures.getUsersResponse()
    ↓
15. Frontend renders user list with mocked users
    ↓
16. Test calls: userMgmt.createUser({ ... })
    ↓
17. Page object clicks "Add User" button
    ↓
18. Page object fills form fields
    ↓
19. Page object clicks "Submit"
    ↓
20. Frontend tries: POST /api/console/admin/users
    ↓
21. ApiRouter intercepts and returns: userFixtures.createUserResponse()
    ↓
22. Frontend shows success message
    ↓
23. Test verifies: await userMgmt.verifySuccessMessage('Success')
    ↓
24. Assertion passes ✅
    ↓
25. Test completes successfully
    ↓
26. Playwright closes browser
    ↓
27. Report generated: test-results/html-report/
```

## File Organization

```
e2e/
├── specs/                    # Your tests go here
│   ├── 01-auth/             # Authentication tests
│   ├── 02-hr/               # HR workflow tests (future)
│   ├── 03-patients/         # Patient management (future)
│   └── ...                  # More test suites
│
├── pages/                    # Page objects
│   ├── auth.page.ts         # Login/logout page
│   ├── user-management.page.ts  # User CRUD
│   └── ...                  # More page objects
│
├── helpers/                  # Utility functions
│   ├── auth.helper.ts       # Authentication utilities
│   └── ...                  # More helpers
│
├── mocks/                    # API mocking
│   ├── api-router.ts        # Central router
│   └── api-fixtures/        # Data generators
│       ├── auth.fixtures.ts
│       ├── users.fixtures.ts
│       └── ...
│
├── .auth/                    # Storage state files
│   └── manual_user.json     # Saved authentication
│
├── README.md                 # Main documentation
├── GETTING_STARTED.md        # Beginner guide
└── ARCHITECTURE.md           # This file
```

## Summary

The architecture follows these principles:

1. **Separation of Concerns**: Tests, UI, data, and mocking are separated
2. **DRY (Don't Repeat Yourself)**: Reusable components everywhere
3. **Abstraction**: Hide complexity behind simple interfaces
4. **Mock Everything**: No real APIs, fast and reliable
5. **Page Object Model**: UI interactions through page objects
6. **Fixture Pattern**: Realistic, reusable test data

This makes tests:
- ✅ Easy to write
- ✅ Easy to read
- ✅ Easy to maintain
- ✅ Fast to execute
- ✅ Reliable and consistent
