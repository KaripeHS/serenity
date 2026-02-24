import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

// Set environment variable to disable Vite proxy during tests
process.env.PLAYWRIGHT_TEST = 'true';

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0, // Enable retries on CI for flaky test resilience
    /* Increase workers for parallel execution */
    workers: process.env.CI ? 4 : 8, // More workers for faster test runs
    /* Test timeout - increased for complex workflows */
    timeout: 60 * 1000, // 60 seconds per test
    /* Expect timeout for assertions */
    expect: {
        timeout: 10000 // 10 seconds for assertions to pass
    },
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html', { outputFolder: 'test-results/html-report' }],
        ['json', { outputFile: 'test-results/test-results.json' }],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['list'] // Console output for real-time feedback
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://127.0.0.1:3000',
        ignoreHTTPSErrors: true,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        /* Standardize viewport for consistent test execution */
        viewport: { width: 1920, height: 1080 },

        /* Context options */
        contextOptions: {
            recordVideo: process.env.CI ? { dir: 'test-results/videos' } : undefined
        }
    },

    /* Configure projects for major browsers */
    projects: [
        // Authentication setup project
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        // Smoke tests - quick validation
        {
            name: 'smoke',
            testMatch: /.*smoke\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['setup'],
        },
        // Comprehensive E2E tests
        {
            name: 'e2e',
            testMatch: /.*\.spec\.ts/,
            testIgnore: [/.*smoke\.spec\.ts/, /.*regression\.spec\.ts/],
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/manual_user.json',
            },
            dependencies: ['setup'],
        },
        // Regression tests - run less frequently
        {
            name: 'regression',
            testMatch: /.*regression\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/manual_user.json',
            },
            dependencies: ['setup'],
        },

        // ── 5-Layer Audit Suite ──────────────────────────────────────

        // Layer 1: Route crawling — every route loads, no 404s, RBAC works
        {
            name: 'layer1-crawl',
            testMatch: /layer1-crawl\/.*.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['setup'],
        },
        // Layer 2: Interactive element audit — buttons, forms, modals
        {
            name: 'layer2-interaction',
            testMatch: /layer2-interaction\/.*.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['setup'],
        },
        // Layer 3: Visual regression — screenshot comparison
        {
            name: 'layer3-visual',
            testMatch: /layer3-visual\/.*.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['setup'],
        },
        // Layer 4: Accessibility — axe-core WCAG audit
        {
            name: 'layer4-accessibility',
            testMatch: /layer4-accessibility\/.*.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['setup'],
        },
        // Layer 5: Responsive — multi-viewport testing
        {
            name: 'layer5-responsive',
            testMatch: /layer5-responsive\/.*.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['setup'],
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev -- --port 3000 --mode test',
        cwd: 'frontend',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: false, // Force restart to pick up PLAYWRIGHT_TEST env var
        timeout: 120 * 1000,
        env: {
            // Disable Vite proxy to allow Playwright mocks to work
            PLAYWRIGHT_TEST: 'true',
            NODE_ENV: 'test'
        }
    },
});
