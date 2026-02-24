/**
 * Route Registry - Single source of truth for all application routes
 *
 * Used by all 5 test layers to determine what to test.
 * When a new route is added to App.tsx, add it here and all layers will test it automatically.
 */

// ─── Public Routes (No Auth Required) ──────────────────────────────────────

export interface RouteEntry {
  path: string;
  name: string;
}

export const PUBLIC_ROUTES: RouteEntry[] = [
  { path: '/', name: 'Homepage' },
  { path: '/about', name: 'About' },
  { path: '/services', name: 'Services' },
  { path: '/careers', name: 'Careers' },
  { path: '/contact', name: 'Contact' },
  { path: '/referral', name: 'Referral' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/hipaa', name: 'HIPAA' },
  { path: '/non-discrimination', name: 'Non-Discrimination' },
  { path: '/accessibility', name: 'Accessibility' },
  { path: '/family', name: 'Family Portal (Public)' },
  { path: '/client-intake', name: 'Client Self Intake' },
];

// ─── ERP Routes (Auth Required) ────────────────────────────────────────────

export type TestableRole =
  | 'founder' | 'ceo' | 'coo' | 'cfo'
  | 'hr_manager' | 'caregiver' | 'pod_lead'
  | 'billing_manager' | 'compliance_officer';

export interface ERPRouteEntry {
  path: string;
  name: string;
  /** Role to use when testing this route (must have access) */
  testRole: TestableRole;
  /** Roles that should be DENIED access (for RBAC tests) */
  deniedRoles: TestableRole[];
  /** Whether route has dynamic params — use paramExample instead */
  hasParams?: boolean;
  /** Example URL with params filled in for parameterized routes */
  paramExample?: string;
}

export const ERP_ROUTES: ERPRouteEntry[] = [
  // ── Entry Points & Global ──
  { path: '/erp', name: 'ERP Login', testRole: 'founder', deniedRoles: [] },
  { path: '/search', name: 'Search Results', testRole: 'founder', deniedRoles: [] },
  { path: '/alerts', name: 'System Alerts', testRole: 'founder', deniedRoles: [] },

  // ── Executive Dashboards ──
  { path: '/dashboard/executive', name: 'Executive Dashboard', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/executive-v2', name: 'Executive Opportunity Dashboard', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },

  // ── Command Centers ──
  { path: '/dashboard/hr', name: 'Talent Command Center', testRole: 'hr_manager', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/dashboard/clinical', name: 'Clinical Command Center', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/compliance', name: 'Compliance Command Center', testRole: 'compliance_officer', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/operations', name: 'Operations Command Center', testRole: 'coo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/billing', name: 'Billing Dashboard', testRole: 'billing_manager', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },

  // ── Care Delivery & Scheduling ──
  { path: '/dashboard/scheduling', name: 'Scheduling Calendar', testRole: 'founder', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/dashboard/scheduling-calendar', name: 'Scheduling Calendar Alt', testRole: 'founder', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/dashboard/dispatch', name: 'Coverage Dispatch', testRole: 'coo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/care-plans', name: 'Care Plan Editor', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/supervisory-visits', name: 'Supervisory Visits', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/sandata-evv', name: 'Sandata EVV Dashboard', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager'] },

  // ── Clinical ──
  { path: '/dashboard/incidents', name: 'Incidents Dashboard', testRole: 'founder', deniedRoles: ['billing_manager'] },
  { path: '/dashboard/client-intake', name: 'Client Intake Wizard', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },

  // ── Billing & Revenue ──
  { path: '/dashboard/billing-ar', name: 'Billing AR', testRole: 'billing_manager', deniedRoles: ['caregiver', 'hr_manager'] },
  { path: '/dashboard/claims-workflow', name: 'Claims Workflow', testRole: 'billing_manager', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },
  { path: '/dashboard/denials', name: 'Denial Management', testRole: 'billing_manager', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },
  { path: '/dashboard/authorizations', name: 'Authorization Dashboard', testRole: 'billing_manager', deniedRoles: ['caregiver', 'hr_manager'] },

  // ── HR & Workforce ──
  { path: '/dashboard/credentials', name: 'Credential Expiration', testRole: 'hr_manager', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/dashboard/background-checks', name: 'Background Checks', testRole: 'hr_manager', deniedRoles: ['caregiver', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/training', name: 'Training Dashboard', testRole: 'hr_manager', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/dashboard/payroll-v2', name: 'Payroll Dashboard', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },
  { path: '/dashboard/caregiver-bonuses', name: 'Caregiver Bonuses', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },

  // ── Compliance & Audit ──
  { path: '/dashboard/licenses', name: 'License Management', testRole: 'compliance_officer', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/dashboard/tax', name: 'Tax Compliance', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager'] },
  { path: '/dashboard/lms', name: 'Learning Management', testRole: 'founder', deniedRoles: [] },

  // ── Operations & Programs ──
  { path: '/dashboard/crm', name: 'CRM Lead Pipeline', testRole: 'coo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/dodd-hpc', name: 'DODD HPC Dashboard', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/dashboard/consumer-directed', name: 'Consumer Directed', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },

  // ── Portals ──
  { path: '/caregiver-portal', name: 'Caregiver Portal', testRole: 'caregiver', deniedRoles: ['billing_manager'] },
  { path: '/dashboard/pod-lead', name: 'Pod Lead Dashboard', testRole: 'pod_lead', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/family-portal', name: 'Family Portal (ERP)', testRole: 'founder', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/partners', name: 'Partner Portal', testRole: 'founder', deniedRoles: [] },

  // ── EVV ──
  { path: '/evv-clock', name: 'EVV Clock (Standalone)', testRole: 'caregiver', deniedRoles: [] },
  { path: '/evv/clock', name: 'EVV Clock (Dashboard)', testRole: 'caregiver', deniedRoles: [] },

  // ── Patients ──
  { path: '/patients', name: 'Patient List', testRole: 'founder', deniedRoles: ['billing_manager'] },
  { path: '/patients/new', name: 'New Patient Intake', testRole: 'founder', deniedRoles: [] },

  // ── Patient Intake Steps (New Patient) ──
  { path: '/patients/intake/new/demographics', name: 'Intake: Demographics', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/insurance', name: 'Intake: Insurance', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/assessment', name: 'Intake: Assessment', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/physician-orders', name: 'Intake: Physician Orders', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/care-plan', name: 'Intake: Care Plan', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/caregiver-assignment', name: 'Intake: Caregiver Assignment', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/service-authorization', name: 'Intake: Service Auth', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/first-visit', name: 'Intake: First Visit', testRole: 'founder', deniedRoles: [] },
  { path: '/patients/intake/new/binder', name: 'Intake: Binder', testRole: 'founder', deniedRoles: [] },

  // ── Admin ──
  { path: '/admin/users', name: 'User Management', testRole: 'founder', deniedRoles: ['caregiver', 'billing_manager', 'compliance_officer'] },
  { path: '/admin/roles', name: 'Roles & Permissions', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/admin/pods', name: 'Pod Management', testRole: 'coo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/admin/pods/new', name: 'Create Pod', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/admin/subscriptions', name: 'Subscriptions', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'compliance_officer'] },
  { path: '/admin/audit', name: 'Audit Logs', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager'] },
  { path: '/admin/images', name: 'Image Management', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/admin/intake-invitations', name: 'Intake Invitations', testRole: 'founder', deniedRoles: ['caregiver', 'billing_manager'] },
  { path: '/admin/settings/communications', name: 'Communication Settings', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/admin/settings/email-accounts', name: 'Email Accounts', testRole: 'founder', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },

  // ── Finance ──
  { path: '/dashboard/finance/bank-accounts', name: 'Bank Accounts', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/finance/reports', name: 'Financial Reports', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/finance/vendors', name: 'Vendor Center', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/finance/expenses', name: 'Expense Portal', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/finance/bank-feeds', name: 'Bank Feed', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },
  { path: '/dashboard/finance/payroll', name: 'Payroll Manager', testRole: 'cfo', deniedRoles: ['caregiver', 'hr_manager', 'billing_manager', 'compliance_officer'] },

  // ── HR Sub-Routes ──
  { path: '/hr/onboarding/test-applicant-001', name: 'Onboarding Dashboard', testRole: 'hr_manager', deniedRoles: ['caregiver', 'billing_manager'], hasParams: true, paramExample: '/hr/onboarding/test-applicant-001' },
  { path: '/hr/staff/test-staff-001', name: 'Staff Profile', testRole: 'hr_manager', deniedRoles: ['caregiver', 'billing_manager'], hasParams: true, paramExample: '/hr/staff/test-staff-001' },

  // ── Profile (All Authenticated Users) ──
  { path: '/profile', name: 'Profile', testRole: 'founder', deniedRoles: [] },
  { path: '/profile/edit', name: 'Edit Profile', testRole: 'founder', deniedRoles: [] },
  { path: '/profile/password', name: 'Change Password', testRole: 'founder', deniedRoles: [] },

  // ── Misc ──
  { path: '/onboarding/my-tasks', name: 'New Hire Portal', testRole: 'founder', deniedRoles: [] },
  { path: '/ai-assistant', name: 'AI Assistant', testRole: 'founder', deniedRoles: [] },
];

// ─── Derived Lists ─────────────────────────────────────────────────────────

/** All ERP routes that do NOT have dynamic params (can be visited directly) */
export const STATIC_ERP_ROUTES = ERP_ROUTES.filter(r => !r.hasParams);

/** All ERP routes that are protected by RBAC (have deniedRoles) */
export const RBAC_ROUTES = ERP_ROUTES.filter(r => r.deniedRoles.length > 0);

/** All dashboard routes */
export const DASHBOARD_ROUTES = ERP_ROUTES.filter(r => r.path.startsWith('/dashboard/'));

/** All admin routes */
export const ADMIN_ROUTES = ERP_ROUTES.filter(r => r.path.startsWith('/admin/'));

/** All patient intake routes */
export const INTAKE_ROUTES = ERP_ROUTES.filter(r => r.path.startsWith('/patients/intake/'));

/** All finance routes */
export const FINANCE_ROUTES = ERP_ROUTES.filter(r => r.path.startsWith('/dashboard/finance/'));

/** Routes that are known to have forms */
export const FORM_ROUTES = [
  ...PUBLIC_ROUTES.filter(r => ['/contact', '/referral', '/client-intake'].includes(r.path)),
  ...ERP_ROUTES.filter(r => [
    '/admin/users', '/patients/new', '/dashboard/client-intake',
    '/dashboard/crm', '/admin/pods/new',
  ].includes(r.path)),
];

/** Total route count for reporting */
export const TOTAL_ROUTE_COUNT = PUBLIC_ROUTES.length + ERP_ROUTES.length;
