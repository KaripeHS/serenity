/**
 * Search Index Service
 * Centralized, dynamic search index for the Global Search / Command Palette
 *
 * IMPORTANT NOTES:
 * - Items are automatically filtered by RBAC (user role permissions)
 * - HIPAA-protected data (patient names, PHI, etc.) is NEVER indexed
 * - Only navigation items, dashboard links, and safe actions are indexed
 * - New pages/dashboards should register themselves here for searchability
 *
 * HIPAA Compliance:
 * - This index contains ONLY navigation metadata (page names, descriptions)
 * - NO patient/client data is ever included
 * - NO Protected Health Information (PHI) is indexed
 * - Users can only see items they have RBAC access to
 */

import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BanknotesIcon,
  TruckIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ChartPieIcon,
  UserPlusIcon,
  MapPinIcon,
  BriefcaseIcon,
  KeyIcon,
  EyeIcon,
  ScaleIcon,
  GiftIcon,
  BuildingLibraryIcon,
  ReceiptPercentIcon,
  DocumentMagnifyingGlassIcon,
  CogIcon,
  BookOpenIcon,
  FlagIcon,
  PhoneIcon,
  PresentationChartLineIcon,
  WrenchScrewdriverIcon,
  TableCellsIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
  DocumentDuplicateIcon,
  NewspaperIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

/**
 * Search item interface for the command palette
 */
export interface SearchItem {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Navigation path */
  href: string;
  /** Icon component */
  icon: React.ComponentType<any>;
  /** Category for grouping */
  category: SearchCategory;
  /** Keywords for search matching (lowercase) */
  keywords: string[];
  /**
   * Required route for RBAC check.
   * If different from href, specify the route that controls access.
   * Example: '/admin/users' might be controlled by '/admin' permission
   */
  rbacRoute?: string;
  /**
   * Priority for search results (higher = more relevant)
   * Used to boost commonly accessed items
   */
  priority?: number;
}

/**
 * Categories for organizing search results
 */
export type SearchCategory =
  | 'Main'
  | 'Portals'
  | 'Care Delivery'
  | 'Clinical'
  | 'Billing'
  | 'HR'
  | 'Compliance'
  | 'Operations'
  | 'Finance'
  | 'Admin'
  | 'Quick Actions'
  | 'Reports'
  | 'Settings';

/**
 * Master search index
 *
 * ADDING NEW ITEMS:
 * 1. Add the item to the appropriate category section below
 * 2. Include relevant keywords for better search matching
 * 3. Set rbacRoute if access control differs from href
 * 4. Set priority (1-10) to boost important items
 *
 * DO NOT ADD:
 * - Patient/client names or identifiers
 * - Any PHI (Protected Health Information)
 * - Dynamic data that could contain sensitive info
 */
const searchIndex: SearchItem[] = [
  // ============================================
  // MAIN NAVIGATION
  // ============================================
  {
    id: 'home',
    name: 'Home',
    description: 'Main dashboard overview',
    href: '/',
    icon: HomeIcon,
    category: 'Main',
    keywords: ['dashboard', 'home', 'main', 'start', 'overview'],
    priority: 10,
  },
  {
    id: 'executive',
    name: 'Executive Dashboard',
    description: 'Strategic overview, KPIs, and business metrics',
    href: '/dashboard/executive',
    icon: ChartBarIcon,
    category: 'Main',
    keywords: ['executive', 'ceo', 'kpi', 'metrics', 'strategic', 'overview', 'leadership', 'business'],
    priority: 9,
  },

  // ============================================
  // PORTALS
  // ============================================
  {
    id: 'caregiver-portal',
    name: 'Caregiver Portal',
    description: 'Caregiver view, schedule, training & resources',
    href: '/caregiver-portal',
    icon: HeartIcon,
    category: 'Portals',
    keywords: ['caregiver', 'portal', 'staff', 'employee', 'worker'],
    priority: 8,
  },
  {
    id: 'pod-lead',
    name: 'Pod Lead Dashboard',
    description: 'Pod management, team oversight, and operations',
    href: '/dashboard/pod-lead',
    icon: UserGroupIcon,
    category: 'Portals',
    keywords: ['pod', 'lead', 'supervisor', 'manager', 'team', 'oversight'],
    priority: 8,
  },
  {
    id: 'family-portal',
    name: 'Family Portal',
    description: 'Family engagement, schedule viewing, feedback',
    href: '/family-portal',
    icon: BuildingOffice2Icon,
    category: 'Portals',
    keywords: ['family', 'portal', 'client', 'relative', 'loved one'],
    priority: 7,
  },

  // ============================================
  // CARE DELIVERY & EVV
  // ============================================
  {
    id: 'evv-clock',
    name: 'EVV Clock',
    description: 'Clock in/out for visits with GPS verification',
    href: '/evv/clock',
    icon: ClockIcon,
    category: 'Care Delivery',
    keywords: ['evv', 'clock', 'time', 'visit', 'punch', 'check in', 'check out', 'gps'],
    priority: 9,
  },
  {
    id: 'patients',
    name: 'Patient Directory',
    description: 'View and manage patient records',
    href: '/patients',
    icon: UserGroupIcon,
    category: 'Care Delivery',
    keywords: ['patients', 'clients', 'directory', 'list', 'people', 'census'],
    priority: 8,
  },
  {
    id: 'scheduling',
    name: 'Scheduling Calendar',
    description: 'Visual schedule calendar for shifts and visits',
    href: '/dashboard/scheduling-calendar',
    icon: CalendarIcon,
    category: 'Care Delivery',
    keywords: ['schedule', 'calendar', 'shifts', 'appointments', 'booking', 'visits'],
    priority: 9,
  },
  {
    id: 'dispatch',
    name: 'Dispatch Center',
    description: 'Coverage gaps, on-call dispatch, shift assignment',
    href: '/dashboard/dispatch',
    icon: MapPinIcon,
    category: 'Care Delivery',
    keywords: ['dispatch', 'coverage', 'gaps', 'assign', 'send', 'on-call', 'urgent'],
    priority: 8,
  },
  {
    id: 'care-plans',
    name: 'Care Plans',
    description: 'Care plan management and documentation',
    href: '/dashboard/care-plans',
    icon: DocumentTextIcon,
    category: 'Care Delivery',
    keywords: ['care', 'plan', 'plans', 'service', 'treatment', 'documentation'],
    priority: 7,
  },
  {
    id: 'supervisory',
    name: 'Supervisory Visits',
    description: 'RN supervisory visit tracking and compliance',
    href: '/dashboard/supervisory-visits',
    icon: EyeIcon,
    category: 'Care Delivery',
    keywords: ['supervisory', 'visits', 'rn', 'nurse', 'supervision', 'oversight', '30 day'],
    priority: 7,
  },

  // ============================================
  // CLINICAL
  // ============================================
  {
    id: 'clinical',
    name: 'Clinical Dashboard',
    description: 'Clinical oversight, assessments, and quality',
    href: '/dashboard/clinical',
    icon: HeartIcon,
    category: 'Clinical',
    keywords: ['clinical', 'medical', 'health', 'care', 'nursing', 'quality'],
    priority: 8,
  },
  {
    id: 'incidents',
    name: 'Incidents',
    description: 'Incident reporting and tracking',
    href: '/dashboard/incidents',
    icon: ExclamationTriangleIcon,
    category: 'Clinical',
    keywords: ['incidents', 'report', 'accident', 'injury', 'issue', 'problem', 'safety'],
    priority: 8,
  },
  {
    id: 'client-intake',
    name: 'Client Intake',
    description: 'New client intake and onboarding',
    href: '/dashboard/client-intake',
    icon: UserPlusIcon,
    category: 'Clinical',
    keywords: ['intake', 'new', 'client', 'admission', 'onboard', 'referral'],
    priority: 7,
  },
  {
    id: 'patient-intake',
    name: 'Patient Intake Workflow',
    description: 'Clinical patient intake process',
    href: '/patients/intake/new',
    icon: ClipboardDocumentCheckIcon,
    category: 'Clinical',
    keywords: ['patient', 'intake', 'workflow', 'clinical', 'admission', 'new patient'],
    priority: 7,
  },

  // ============================================
  // BILLING & REVENUE
  // ============================================
  {
    id: 'billing',
    name: 'Billing Dashboard',
    description: 'Revenue cycle management overview',
    href: '/dashboard/billing',
    icon: CurrencyDollarIcon,
    category: 'Billing',
    keywords: ['billing', 'revenue', 'money', 'payment', 'invoice', 'rcm'],
    priority: 8,
  },
  {
    id: 'claims',
    name: 'Claims Workflow',
    description: 'Claims submission and tracking',
    href: '/dashboard/claims-workflow',
    icon: DocumentCheckIcon,
    category: 'Billing',
    keywords: ['claims', 'submission', 'insurance', 'medicare', 'medicaid', '837'],
    priority: 8,
  },
  {
    id: 'ar-aging',
    name: 'AR Aging',
    description: 'Accounts receivable aging and collections',
    href: '/dashboard/billing-ar',
    icon: ReceiptPercentIcon,
    category: 'Billing',
    keywords: ['ar', 'aging', 'receivable', 'outstanding', 'owed', 'collections', '30 60 90'],
    priority: 7,
  },
  {
    id: 'denials',
    name: 'Denial Management',
    description: 'Denial tracking and appeals workflow',
    href: '/dashboard/denials',
    icon: ExclamationTriangleIcon,
    category: 'Billing',
    keywords: ['denials', 'denied', 'rejected', 'appeals', 'resubmit', 'overturn'],
    priority: 7,
  },
  {
    id: 'authorizations',
    name: 'Authorizations',
    description: 'Service authorizations and units tracking',
    href: '/dashboard/authorizations',
    icon: ClipboardDocumentCheckIcon,
    category: 'Billing',
    keywords: ['authorizations', 'auth', 'approval', 'prior', 'units', 'hours', 'pa'],
    priority: 7,
  },

  // ============================================
  // HR & WORKFORCE
  // ============================================
  {
    id: 'hr',
    name: 'HR Dashboard',
    description: 'Workforce management and recruiting',
    href: '/dashboard/hr',
    icon: UsersIcon,
    category: 'HR',
    keywords: ['hr', 'human', 'resources', 'workforce', 'staff', 'employee', 'personnel', 'recruiting'],
    priority: 8,
  },
  {
    id: 'credentials',
    name: 'Credential Tracking',
    description: 'Credential expiration and compliance',
    href: '/dashboard/credentials',
    icon: IdentificationIcon,
    category: 'HR',
    keywords: ['credentials', 'certification', 'license', 'expiration', 'compliance', 'cpr', 'stna'],
    priority: 8,
  },
  {
    id: 'background-checks',
    name: 'Background Checks',
    description: 'BCI/FBI background check status',
    href: '/dashboard/background-checks',
    icon: DocumentMagnifyingGlassIcon,
    category: 'HR',
    keywords: ['background', 'check', 'bci', 'fbi', 'criminal', 'screening', 'clear'],
    priority: 7,
  },
  {
    id: 'training',
    name: 'Training Management',
    description: 'Staff training and LMS',
    href: '/dashboard/training',
    icon: AcademicCapIcon,
    category: 'HR',
    keywords: ['training', 'education', 'courses', 'learning', 'certification', 'lms', 'orientation'],
    priority: 7,
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'Payroll processing and management',
    href: '/dashboard/payroll-v2',
    icon: BanknotesIcon,
    category: 'HR',
    keywords: ['payroll', 'pay', 'wages', 'salary', 'compensation', 'gusto', 'adp'],
    priority: 8,
  },
  {
    id: 'bonuses',
    name: 'Caregiver Bonuses',
    description: 'Bonus programs and payouts',
    href: '/dashboard/caregiver-bonuses',
    icon: GiftIcon,
    category: 'HR',
    keywords: ['bonuses', 'bonus', 'incentive', 'reward', 'extra', 'payout'],
    priority: 6,
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'New hire onboarding workflow',
    href: '/dashboard/onboarding',
    icon: UserPlusIcon,
    category: 'HR',
    keywords: ['onboarding', 'new', 'hire', 'orientation', 'start', 'checklist'],
    priority: 7,
  },

  // ============================================
  // COMPLIANCE
  // ============================================
  {
    id: 'compliance',
    name: 'Compliance Center',
    description: 'HIPAA, regulatory compliance, and audits',
    href: '/dashboard/compliance',
    icon: ShieldCheckIcon,
    category: 'Compliance',
    keywords: ['compliance', 'hipaa', 'regulatory', 'audit', 'rules', 'odh', 'cms'],
    priority: 8,
  },
  {
    id: 'licenses',
    name: 'Business Licenses',
    description: 'Business license management',
    href: '/dashboard/licenses',
    icon: ScaleIcon,
    category: 'Compliance',
    keywords: ['licenses', 'license', 'business', 'state', 'permit', 'odh'],
    priority: 6,
  },
  {
    id: 'tax',
    name: 'Tax Compliance',
    description: 'Tax management and filings',
    href: '/dashboard/tax',
    icon: BuildingLibraryIcon,
    category: 'Compliance',
    keywords: ['tax', 'taxes', 'irs', '1099', 'w2', 'filing', 'quarterly'],
    priority: 6,
  },
  {
    id: 'audit-logs',
    name: 'Audit Logs',
    description: 'System audit trail and activity log',
    href: '/admin/audit',
    icon: DocumentTextIcon,
    category: 'Compliance',
    keywords: ['audit', 'logs', 'trail', 'history', 'activity', 'tracking', 'security'],
    priority: 7,
  },

  // ============================================
  // OPERATIONS
  // ============================================
  {
    id: 'operations',
    name: 'Operations Dashboard',
    description: 'Daily operations and metrics',
    href: '/dashboard/operations',
    icon: TruckIcon,
    category: 'Operations',
    keywords: ['operations', 'daily', 'ops', 'management', 'efficiency'],
    priority: 8,
  },
  {
    id: 'crm',
    name: 'CRM / Lead Pipeline',
    description: 'Lead tracking and referral management',
    href: '/dashboard/crm',
    icon: BriefcaseIcon,
    category: 'Operations',
    keywords: ['crm', 'leads', 'pipeline', 'sales', 'referrals', 'marketing', 'prospects'],
    priority: 7,
  },
  {
    id: 'dodd-hpc',
    name: 'DODD HPC',
    description: 'DODD HPC programs and services',
    href: '/dashboard/dodd-hpc',
    icon: BuildingOffice2Icon,
    category: 'Operations',
    keywords: ['dodd', 'hpc', 'developmental', 'disabilities', 'waiver', 'ohio'],
    priority: 6,
  },

  // ============================================
  // FINANCE
  // ============================================
  {
    id: 'bank-accounts',
    name: 'Bank Accounts',
    description: 'Bank account connections and management',
    href: '/dashboard/finance/bank-accounts',
    icon: BuildingLibraryIcon,
    category: 'Finance',
    keywords: ['bank', 'accounts', 'banking', 'plaid', 'connect', 'balance'],
    priority: 7,
  },
  {
    id: 'financial-reports',
    name: 'Financial Reports',
    description: 'P&L, balance sheet, financial statements',
    href: '/dashboard/finance/reports',
    icon: ChartPieIcon,
    category: 'Finance',
    keywords: ['financial', 'reports', 'statements', 'profit', 'loss', 'balance', 'p&l'],
    priority: 7,
  },
  {
    id: 'vendors',
    name: 'Vendor Management',
    description: 'Vendor and accounts payable',
    href: '/dashboard/finance/vendors',
    icon: BriefcaseIcon,
    category: 'Finance',
    keywords: ['vendors', 'suppliers', 'bills', 'payments', 'ap', 'accounts payable'],
    priority: 6,
  },
  {
    id: 'expenses',
    name: 'Expense Tracking',
    description: 'Expense and mileage reimbursement',
    href: '/dashboard/finance/expenses',
    icon: ReceiptPercentIcon,
    category: 'Finance',
    keywords: ['expenses', 'mileage', 'reimbursement', 'receipts', 'travel'],
    priority: 6,
  },

  // ============================================
  // ADMIN
  // ============================================
  {
    id: 'users',
    name: 'User Management',
    description: 'Manage user accounts and access',
    href: '/admin/users',
    icon: UsersIcon,
    category: 'Admin',
    keywords: ['users', 'user', 'management', 'accounts', 'people', 'staff'],
    rbacRoute: '/admin',
    priority: 8,
  },
  {
    id: 'pods',
    name: 'Pod Management',
    description: 'Manage pods and team assignments',
    href: '/admin/pods',
    icon: UserGroupIcon,
    category: 'Admin',
    keywords: ['pods', 'pod', 'teams', 'groups', 'regions', 'territories'],
    rbacRoute: '/admin',
    priority: 7,
  },
  {
    id: 'roles',
    name: 'Roles & Permissions',
    description: 'Role-based access control settings',
    href: '/admin/roles',
    icon: KeyIcon,
    category: 'Admin',
    keywords: ['roles', 'permissions', 'access', 'security', 'rbac', 'control'],
    rbacRoute: '/admin',
    priority: 7,
  },
  {
    id: 'communications',
    name: 'Communication Settings',
    description: 'Email templates and notification config',
    href: '/admin/settings/communications',
    icon: CogIcon,
    category: 'Settings',
    keywords: ['communications', 'email', 'alerts', 'notifications', 'settings', 'templates', 'sms'],
    rbacRoute: '/admin',
    priority: 6,
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions & Integrations',
    description: 'API integrations and third-party services',
    href: '/admin/subscriptions',
    icon: CreditCardIcon,
    category: 'Admin',
    keywords: ['subscriptions', 'integrations', 'api', 'third party', 'services', 'sandata', 'plaid'],
    rbacRoute: '/admin',
    priority: 6,
  },
  {
    id: 'intake-invitations',
    name: 'Intake Invitations',
    description: 'Send intake forms to clients and manage access codes',
    href: '/admin/intake-invitations',
    icon: EnvelopeIcon,
    category: 'Admin',
    keywords: ['intake', 'invitations', 'client', 'access', 'code', 'form', 'email', 'patient'],
    rbacRoute: '/admin/intake-invitations',
    priority: 7,
  },

  // ============================================
  // QUICK ACTIONS
  // ============================================
  {
    id: 'new-patient',
    name: 'Add New Patient',
    description: 'Create a new patient record',
    href: '/patients/new',
    icon: UserPlusIcon,
    category: 'Quick Actions',
    keywords: ['add', 'new', 'patient', 'create', 'client', 'admit'],
    rbacRoute: '/patients',
    priority: 8,
  },
  {
    id: 'new-shift',
    name: 'Create Shift',
    description: 'Schedule a new shift',
    href: '/dashboard/scheduling-calendar?action=new',
    icon: CalendarIcon,
    category: 'Quick Actions',
    keywords: ['add', 'new', 'shift', 'schedule', 'create', 'assign'],
    rbacRoute: '/dashboard/scheduling-calendar',
    priority: 7,
  },
  {
    id: 'report-incident',
    name: 'Report Incident',
    description: 'File a new incident report',
    href: '/dashboard/incidents?action=new',
    icon: FlagIcon,
    category: 'Quick Actions',
    keywords: ['report', 'incident', 'file', 'new', 'create', 'safety'],
    rbacRoute: '/dashboard/incidents',
    priority: 8,
  },
  {
    id: 'clock-in',
    name: 'Clock In',
    description: 'Start EVV clock for a visit',
    href: '/evv/clock',
    icon: ClockIcon,
    category: 'Quick Actions',
    keywords: ['clock', 'in', 'start', 'begin', 'visit', 'evv'],
    rbacRoute: '/evv/clock',
    priority: 9,
  },

  // ============================================
  // REPORTS (commonly searched)
  // ============================================
  {
    id: 'lms-dashboard',
    name: 'LMS Dashboard',
    description: 'Learning Management System overview',
    href: '/dashboard/lms',
    icon: BookOpenIcon,
    category: 'Reports',
    keywords: ['lms', 'learning', 'courses', 'training', 'education'],
    priority: 5,
  },
];

/**
 * Get all search items (unfiltered)
 * Use getFilteredSearchItems for RBAC-filtered results
 */
export function getAllSearchItems(): SearchItem[] {
  return searchIndex;
}

/**
 * Get search items filtered by user role
 * This is the primary method for getting searchable items
 */
export function getFilteredSearchItems(
  userRole: string,
  canAccessRouteFn: (route: string, role: string) => boolean
): SearchItem[] {
  return searchIndex.filter(item => {
    // Home is always accessible
    if (item.href === '/') return true;

    // Use rbacRoute if specified, otherwise use href
    const routeToCheck = item.rbacRoute || item.href;

    // Check if user can access this route
    return canAccessRouteFn(routeToCheck, userRole);
  });
}

/**
 * Search items by query
 * Returns items sorted by relevance score
 */
export function searchItems(
  items: SearchItem[],
  query: string,
  limit: number = 15
): SearchItem[] {
  if (!query.trim()) {
    // Return top priority items when no query
    return items
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, limit);
  }

  const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

  const scoredItems = items.map(item => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    const keywordsStr = item.keywords.join(' ');

    for (const term of searchTerms) {
      // Exact name match = highest score
      if (nameLower === term) score += 100;
      // Name starts with term
      else if (nameLower.startsWith(term)) score += 50;
      // Word in name starts with term
      else if (nameLower.split(' ').some(w => w.startsWith(term))) score += 40;
      // Name contains term
      else if (nameLower.includes(term)) score += 30;
      // Keyword exact match
      else if (item.keywords.includes(term)) score += 35;
      // Keyword contains term
      else if (keywordsStr.includes(term)) score += 20;
      // Description contains term
      else if (descLower.includes(term)) score += 10;
      // Category contains term
      else if (item.category.toLowerCase().includes(term)) score += 5;
    }

    // Boost by priority
    score += (item.priority || 0) * 2;

    return { item, score };
  });

  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, limit);
}

/**
 * Register a new search item dynamically
 * Use this when adding new pages/dashboards at runtime
 *
 * IMPORTANT: Do not register items containing PHI or sensitive data
 */
export function registerSearchItem(item: SearchItem): void {
  // Check if item already exists
  const existingIndex = searchIndex.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    // Update existing item
    searchIndex[existingIndex] = item;
  } else {
    // Add new item
    searchIndex.push(item);
  }
}

/**
 * Unregister a search item
 */
export function unregisterSearchItem(itemId: string): void {
  const index = searchIndex.findIndex(i => i.id === itemId);
  if (index >= 0) {
    searchIndex.splice(index, 1);
  }
}

/**
 * Get items by category
 */
export function getItemsByCategory(
  items: SearchItem[],
  category: SearchCategory
): SearchItem[] {
  return items.filter(item => item.category === category);
}

/**
 * Group items by category
 */
export function groupByCategory(
  items: SearchItem[]
): Record<SearchCategory, SearchItem[]> {
  const groups: Partial<Record<SearchCategory, SearchItem[]>> = {};

  for (const item of items) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category]!.push(item);
  }

  return groups as Record<SearchCategory, SearchItem[]>;
}

export default {
  getAllSearchItems,
  getFilteredSearchItems,
  searchItems,
  registerSearchItem,
  unregisterSearchItem,
  getItemsByCategory,
  groupByCategory,
};
