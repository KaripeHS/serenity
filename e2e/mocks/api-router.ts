import { Page, Route } from '@playwright/test';
import { authFixtures } from './api-fixtures/auth.fixtures';
import { userFixtures } from './api-fixtures/users.fixtures';
import { patientFixtures } from './api-fixtures/patients.fixtures';
import { credentialFixtures } from './api-fixtures/credentials.fixtures';
import { adminFixtures } from './api-fixtures/admin.fixtures';
import { hrFixtures } from './api-fixtures/hr.fixtures';
import { evvFixtures } from './api-fixtures/evv.fixtures';
import { billingFixtures } from './api-fixtures/billing.fixtures';

/**
 * Global API Router for Playwright tests
 *
 * This class provides centralized API mocking for all E2E tests.
 * It routes API requests to appropriate fixture responses.
 */
export class ApiRouter {
  private currentRole: string = 'founder';

  constructor(private page: Page) {}

  /**
   * Mock all API endpoints with default responses
   */
  async mockAllEndpoints() {
    // CRITICAL: Log all network requests FIRST to debug routing
    await this.page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.includes('/api/')) {
        console.log('[MOCK] API Request seen:', route.request().method(), url);
      }
      route.continue();
    });

    await this.mockAuthEndpoints();
    await this.mockUserEndpoints();
    await this.mockPatientEndpoints();
    await this.mockCredentialEndpoints();
    await this.mockAuditEndpoints();
    await this.mockHREndpoints();
    await this.mockEVVEndpoints();
    await this.mockBillingEndpoints();
  }

  /**
   * Set the current user role for auth responses
   */
  async mockAuthWithRole(role: string) {
    this.currentRole = role;
    await this.mockAuthEndpoints();
  }

  /**
   * Override a specific endpoint with custom response
   */
  async mockEndpoint(url: string, response: any, status: number = 200) {
    await this.page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Mock authentication endpoints
   */
  private async mockAuthEndpoints() {
    // POST /api/auth/login
    await this.page.route('**/api/auth/login', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Check credentials
      if (postData.email && postData.password === 'TestPassword123!') {
        const role = this.getRoleFromEmail(postData.email);
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(authFixtures.loginSuccess(role))
        });
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify(authFixtures.loginFailure)
        });
      }
    });

    // GET /api/auth/me
    await this.page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: authFixtures.meSuccess(this.currentRole) })
      });
    });

    // POST /api/auth/logout
    await this.page.route('**/api/auth/logout', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authFixtures.logoutSuccess)
      });
    });

    // POST /api/auth/password-reset
    await this.page.route('**/api/auth/password-reset', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authFixtures.passwordResetSuccess())
      });
    });
  }

  /**
   * Mock user management endpoints
   */
  private async mockUserEndpoints() {
    // Single comprehensive handler for ALL /api/console/admin/users* endpoints
    await this.page.route('**/api/console/admin/users**', async (route) => {
      try {
        const method = route.request().method();
        const url = route.request().url();

        console.log('[MOCK] ======== USER ENDPOINT INTERCEPTED ========');
        console.log('[MOCK] Method:', method);
        console.log('[MOCK] URL:', url);

        // Handle export endpoint
        if (url.includes('/export')) {
          console.log('[MOCK] → Handling export request');
          if (method === 'GET') {
            const csvContent = 'Name,Email,Role,Status\nJohn Doe,john@example.com,caregiver,active\nJane Smith,jane@example.com,nurse,active';
            await route.fulfill({
              status: 200,
              contentType: 'text/csv',
              headers: { 'Content-Disposition': 'attachment; filename="users-export.csv"' },
              body: csvContent
            });
            console.log('[MOCK] ✓ Export fulfilled');
            return;
          }
        }

        // Handle stats endpoint
        if (url.includes('/stats')) {
          console.log('[MOCK] → Handling stats request');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userFixtures.getUserStatsResponse())
          });
          console.log('[MOCK] ✓ Stats fulfilled');
          return;
        }

        // Handle GET list users (base endpoint with optional query params)
        if (method === 'GET' && !url.match(/\/users\/[^/]+/)) {
          console.log('[MOCK] → Handling GET users list');
          const urlObj = new URL(url);
          const params = {
            role: urlObj.searchParams.get('role') || undefined,
            status: urlObj.searchParams.get('status') || undefined,
            search: urlObj.searchParams.get('search') || undefined
          };
          const response = userFixtures.getUsersResponse(params);
          console.log('[MOCK] → Returning', response.length, 'users');

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response)
          });
          console.log('[MOCK] ✓ Users list fulfilled');
          return;
        }

        // Handle POST create user
        if (method === 'POST' && !url.match(/\/users\/[^/]+/)) {
          console.log('[MOCK] → Handling POST create user');
          const postData = route.request().postDataJSON();
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(userFixtures.createUserResponse(postData))
          });
          console.log('[MOCK] ✓ Create user fulfilled');
          return;
        }

        // For specific user operations, continue to other handlers
        console.log('[MOCK] → Continuing to specific user operation handlers');
        await route.continue();

      } catch (error) {
        console.error('[MOCK] ✗ CRITICAL ERROR in user endpoint handler:', error);
        await route.abort('failed');
      }
    });

    // Specific user operation handlers (these are called via route.continue() from main handler)

    // PUT /api/console/admin/users/:id/role
    await this.page.route('**/api/console/admin/users/*/role', (route) => {
      const postData = route.request().postDataJSON();
      const userId = route.request().url().split('/').slice(-2)[0];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(userFixtures.updateUserResponse(userId, { role: postData.role }))
      });
    });

    // POST /api/console/admin/users/:id/reset-password
    await this.page.route('**/api/console/admin/users/*/reset-password', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(userFixtures.resetPasswordResponse)
      });
    });
  }

  /**
   * Mock patient endpoints
   */
  private async mockPatientEndpoints() {
    // GET /api/console/patients
    await this.page.route('**/api/console/patients*', (route) => {
      if (route.request().method() === 'GET') {
        const url = new URL(route.request().url());
        const params = {
          status: url.searchParams.get('status') || undefined,
          search: url.searchParams.get('search') || undefined
        };
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(patientFixtures.getPatientsResponse(params))
        });
      } else {
        route.continue();
      }
    });

    // POST /api/console/patients - Create patient
    await this.page.route('**/api/console/patients', (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(patientFixtures.createPatientResponse(postData))
        });
      } else {
        route.continue();
      }
    });

    // GET /api/console/patients/:id
    await this.page.route('**/api/console/patients/*', (route) => {
      if (route.request().method() === 'GET') {
        const patientId = route.request().url().split('/').pop();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(patientFixtures.getPatientByIdResponse(patientId!))
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Mock credential endpoints
   */
  private async mockCredentialEndpoints() {
    // GET /api/console/credentials/expiring
    await this.page.route('**/api/console/credentials/expiring*', (route) => {
      const url = new URL(route.request().url());
      const days = parseInt(url.searchParams.get('days') || '30');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(credentialFixtures.getExpiringCredentialsResponse(days))
      });
    });

    // GET /api/console/credentials/expired
    await this.page.route('**/api/console/credentials/expired', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(credentialFixtures.getExpiredCredentialsResponse())
      });
    });

    // GET /api/console/credentials/summary
    await this.page.route('**/api/console/credentials/summary', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(credentialFixtures.getCredentialSummaryResponse())
      });
    });

    // GET /api/console/credentials/caregiver/:id
    await this.page.route('**/api/console/credentials/caregiver/*', (route) => {
      const caregiverId = route.request().url().split('/').pop();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(credentialFixtures.getCaregiverCredentialsResponse(caregiverId!))
      });
    });
  }

  /**
   * Mock audit log endpoints
   */
  private async mockAuditEndpoints() {
    // GET /api/console/admin/audit-logs
    await this.page.route('**/api/console/admin/audit-logs*', (route) => {
      const url = new URL(route.request().url());
      const params = {
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        eventType: url.searchParams.get('eventType') || undefined,
        category: url.searchParams.get('category') || undefined
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminFixtures.getAuditLogsResponse(params))
      });
    });

    // GET /api/console/admin/audit-logs/stats
    await this.page.route('**/api/console/admin/audit-logs/stats', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminFixtures.getAuditStatsResponse())
      });
    });
  }

  /**
   * Mock HR endpoints (recruiting, onboarding)
   */
  private async mockHREndpoints() {
    // GET /api/console/hr/applicants
    await this.page.route('**/api/console/hr/applicants*', (route) => {
      const url = new URL(route.request().url());
      const params = {
        stage: url.searchParams.get('stage') || undefined,
        status: url.searchParams.get('status') || undefined
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(hrFixtures.getApplicantsResponse(params))
      });
    });

    // POST /api/console/hr/applicants - Submit application
    await this.page.route('**/api/console/hr/applicants', (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(hrFixtures.createApplicantResponse(postData))
        });
      } else {
        route.continue();
      }
    });

    // GET /api/console/hr/onboarding
    await this.page.route('**/api/console/hr/onboarding*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(hrFixtures.getOnboardingRecordsResponse())
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Mock EVV and scheduling endpoints
   */
  private async mockEVVEndpoints() {
    // GET /api/console/evv/visits
    await this.page.route('**/api/console/evv/visits*', (route) => {
      const url = new URL(route.request().url());
      const params = {
        patientId: url.searchParams.get('patientId') || undefined,
        caregiverId: url.searchParams.get('caregiverId') || undefined,
        status: url.searchParams.get('status') || undefined
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(evvFixtures.getVisitsResponse(params))
      });
    });

    // GET /api/console/evv/active-visit
    await this.page.route('**/api/console/evv/active-visit', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(evvFixtures.getActiveVisitResponse('caregiver-123'))
      });
    });

    // POST /api/console/evv/clock-in
    await this.page.route('**/api/console/evv/clock-in', (route) => {
      const postData = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(evvFixtures.clockInResponse(postData.visitId, postData.location))
      });
    });

    // POST /api/console/evv/clock-out
    await this.page.route('**/api/console/evv/clock-out', (route) => {
      const postData = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(evvFixtures.clockOutResponse(postData.visitId, postData.location))
      });
    });

    // GET /api/console/scheduling/shifts
    await this.page.route('**/api/console/scheduling/shifts*', (route) => {
      const url = new URL(route.request().url());
      const params = {
        date: url.searchParams.get('date') || undefined,
        patientId: url.searchParams.get('patientId') || undefined,
        caregiverId: url.searchParams.get('caregiverId') || undefined,
        status: url.searchParams.get('status') || undefined
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(evvFixtures.getShiftsResponse(params))
      });
    });

    // POST /api/console/scheduling/shifts - Create shift
    await this.page.route('**/api/console/scheduling/shifts', (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(evvFixtures.createShiftResponse(postData))
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Mock billing and claims endpoints
   */
  private async mockBillingEndpoints() {
    // GET /api/console/billing/claims
    await this.page.route('**/api/console/billing/claims*', (route) => {
      const url = new URL(route.request().url());
      const params = {
        status: url.searchParams.get('status') || undefined,
        patientId: url.searchParams.get('patientId') || undefined
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(billingFixtures.getClaimsResponse(params))
      });
    });

    // POST /api/console/billing/claims/submit
    await this.page.route('**/api/console/billing/claims/submit', (route) => {
      const postData = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(billingFixtures.submitClaimResponse(postData.claimId))
      });
    });

    // GET /api/console/billing/denials
    await this.page.route('**/api/console/billing/denials*', (route) => {
      const url = new URL(route.request().url());
      const params = {
        appealStatus: url.searchParams.get('appealStatus') || undefined
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(billingFixtures.getDenialsResponse(params))
      });
    });

    // GET /api/console/billing/ar-aging
    await this.page.route('**/api/console/billing/ar-aging', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(billingFixtures.getARAgingResponse())
      });
    });
  }

  /**
   * Helper to determine role from email
   */
  private getRoleFromEmail(email: string): string {
    if (email.includes('founder')) return 'founder';
    if (email.includes('ceo')) return 'ceo';
    if (email.includes('coo')) return 'coo';
    if (email.includes('cfo')) return 'cfo';
    if (email.includes('hr.manager') || email.includes('hr_manager')) return 'hr_manager';
    if (email.includes('podlead') || email.includes('pod_lead')) return 'pod_lead';
    if (email.includes('caregiver') || email.includes('maria')) return 'caregiver';
    return 'caregiver';
  }
}
