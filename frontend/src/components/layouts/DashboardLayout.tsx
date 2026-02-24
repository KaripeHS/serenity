/**
 * Dashboard Layout Component
 * Provides consistent navigation and layout for all dashboard pages
 * Navigation items are filtered based on user role (RBAC)
 *
 * Role-specific navigation:
 * - Caregivers see a simplified, field-focused menu
 * - Pod Leads see a mini-COO view focused on pod management
 * - Other roles see the full navigation filtered by RBAC
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessRoute, UserRole } from '../../hooks/useRoleAccess';
import { getAccessToken } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
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
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightStartOnRectangleIcon,
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
  WrenchScrewdriverIcon,
  KeyIcon,
  EyeIcon,
  ScaleIcon,
  GiftIcon,
  BuildingLibraryIcon,
  ReceiptPercentIcon,
  DocumentMagnifyingGlassIcon,
  PhoneIcon,
  BookOpenIcon,
  CheckCircleIcon,
  FlagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserCircleIcon,
  PencilSquareIcon,
  PhotoIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';
import { GlobalSearch } from '../ui/GlobalSearch';

/**
 * Profile menu items for user profile dropdown
 */
const PROFILE_MENU_ITEMS = [
  { label: 'My Profile', href: '/profile', icon: UserCircleIcon },
  { label: 'Edit Profile', href: '/profile/edit', icon: PencilSquareIcon },
  { label: 'Change Password', href: '/profile/password', icon: LockClosedIcon },
  { label: 'Notification Settings', href: '/admin/settings/communications', icon: BellIcon },
];

/**
 * Default collapsed sections - sections that start collapsed to reduce sidebar length
 * These are typically less frequently accessed sections
 */
const DEFAULT_COLLAPSED_SECTIONS = ['Finance', 'Admin'];

/**
 * localStorage key for persisting collapsed section preferences
 */
const COLLAPSED_SECTIONS_STORAGE_KEY = 'serenity_sidebar_collapsed_sections';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  description: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Navigation Section Interface for grouped navigation
 */
interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

/**
 * All navigation items organized by section - will be filtered by user role
 */
const navigationSections: NavigationSection[] = [
  {
    title: 'Main',
    items: [
      { name: 'Home', href: '/', icon: HomeIcon, description: 'Main dashboard' },
      { name: 'Executive', href: '/dashboard/executive', icon: ChartBarIcon, description: 'Strategic overview and KPIs' },
    ]
  },
  {
    title: 'Portals',
    items: [
      { name: 'Caregiver Portal', href: '/caregiver-portal', icon: HeartIcon, description: 'Caregiver view & tools' },
      { name: 'Pod Lead Dashboard', href: '/dashboard/pod-lead', icon: UserGroupIcon, description: 'Pod management view' },
      { name: 'Family Portal', href: '/family-portal', icon: BuildingOffice2Icon, description: 'Family engagement' },
    ]
  },
  {
    title: 'Care Delivery & EVV',
    items: [
      { name: 'EVV Clock', href: '/evv/clock', icon: ClockIcon, description: 'Clock in/out for visits' },
      { name: 'Sandata EVV', href: '/dashboard/sandata-evv', icon: DocumentCheckIcon, description: 'Sandata compliance monitoring' },
      { name: 'Patients', href: '/patients', icon: UserGroupIcon, description: 'Patient directory' },
      { name: 'Scheduling', href: '/dashboard/scheduling-calendar', icon: CalendarIcon, description: 'Schedule calendar' },
      { name: 'Dispatch', href: '/dashboard/dispatch', icon: MapPinIcon, description: 'Coverage gaps & dispatch' },
      { name: 'Care Plans', href: '/dashboard/care-plans', icon: DocumentTextIcon, description: 'Care plan management' },
      { name: 'Supervisory Visits', href: '/dashboard/supervisory-visits', icon: EyeIcon, description: 'RN supervisory visits' },
    ]
  },
  {
    title: 'Clinical',
    items: [
      { name: 'Clinical Command Center', href: '/dashboard/clinical', icon: HeartIcon, description: 'Supervision, incidents, assessments, QAPI' },
      { name: 'Incidents', href: '/dashboard/incidents', icon: ExclamationTriangleIcon, description: 'Incident reporting' },
      { name: 'Client Intake', href: '/dashboard/client-intake', icon: UserPlusIcon, description: 'New client intake' },
    ]
  },
  {
    title: 'Billing & Revenue',
    items: [
      { name: 'Billing', href: '/dashboard/billing', icon: CurrencyDollarIcon, description: 'Revenue cycle' },
      { name: 'Claims', href: '/dashboard/claims-workflow', icon: DocumentCheckIcon, description: 'Claims submission' },
      { name: 'AR Aging', href: '/dashboard/billing-ar', icon: ReceiptPercentIcon, description: 'Accounts receivable' },
      { name: 'Denials', href: '/dashboard/denials', icon: ExclamationTriangleIcon, description: 'Denial management' },
      { name: 'Authorizations', href: '/dashboard/authorizations', icon: ClipboardDocumentCheckIcon, description: 'Service authorizations' },
    ]
  },
  {
    title: 'HR & Workforce',
    items: [
      { name: 'Talent Command Center', href: '/dashboard/hr', icon: UsersIcon, description: 'Recruiting, credentials, training, discipline' },
      { name: 'Credentials', href: '/dashboard/credentials', icon: IdentificationIcon, description: 'Credential tracking' },
      { name: 'Background Checks', href: '/dashboard/background-checks', icon: DocumentMagnifyingGlassIcon, description: 'Background check status' },
      { name: 'Training', href: '/dashboard/training', icon: AcademicCapIcon, description: 'Staff training' },
      { name: 'Payroll', href: '/dashboard/payroll-v2', icon: BanknotesIcon, description: 'Payroll management' },
      { name: 'Bonuses', href: '/dashboard/caregiver-bonuses', icon: GiftIcon, description: 'Caregiver bonuses' },
    ]
  },
  {
    title: 'Compliance',
    items: [
      { name: 'Compliance Command Center', href: '/dashboard/compliance', icon: ShieldCheckIcon, description: 'HIPAA, BAAs, emergency prep, audits' },
      { name: 'PASSPORT Certification', href: '/dashboard/passport-certification', icon: ClipboardDocumentCheckIcon, description: 'Pre-certification checklist & package' },
      { name: 'Operating Forms', href: '/dashboard/operating-forms', icon: DocumentTextIcon, description: '20 compliance forms — fill, print, upload' },
      { name: 'Licenses', href: '/dashboard/licenses', icon: ScaleIcon, description: 'Business licenses' },
      { name: 'Tax Compliance', href: '/dashboard/tax', icon: BuildingLibraryIcon, description: 'Tax management' },
      { name: 'Audit Logs', href: '/admin/audit', icon: DocumentTextIcon, description: 'System audit trail' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Operations Command Center', href: '/dashboard/operations', icon: TruckIcon, description: 'Scheduling, geofencing, mileage, metrics' },
      { name: 'CRM', href: '/dashboard/crm', icon: BriefcaseIcon, description: 'Lead pipeline' },
      { name: 'DODD HPC', href: '/dashboard/dodd-hpc', icon: BuildingOffice2Icon, description: 'DODD HPC programs' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { name: 'Bank Accounts', href: '/dashboard/finance/bank-accounts', icon: BuildingLibraryIcon, description: 'Bank account management' },
      { name: 'Financial Reports', href: '/dashboard/finance/reports', icon: ChartPieIcon, description: 'Financial reporting' },
      { name: 'Vendors', href: '/dashboard/finance/vendors', icon: BriefcaseIcon, description: 'Vendor management' },
      { name: 'Expenses', href: '/dashboard/finance/expenses', icon: ReceiptPercentIcon, description: 'Expense tracking' },
    ]
  },
  {
    title: 'Admin',
    items: [
      { name: 'Users', href: '/admin/users', icon: UsersIcon, description: 'User management' },
      { name: 'Pods', href: '/admin/pods', icon: UserGroupIcon, description: 'Pod management' },
      { name: 'Roles', href: '/admin/roles', icon: KeyIcon, description: 'Roles & permissions' },
      { name: 'Website Images', href: '/admin/images', icon: PhotoIcon, description: 'Manage public site images' },
      { name: 'Communications', href: '/admin/settings/communications', icon: CogIcon, description: 'Email & alerts config' },
      { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon, description: 'API integrations' },
    ]
  }
];

/**
 * Caregiver-specific navigation (simplified, field-focused)
 * Shows only what caregivers need for their daily work
 */
const caregiverNavigation: NavigationSection[] = [
  {
    title: 'My Work',
    items: [
      { name: 'My Portal', href: '/caregiver-portal', icon: HomeIcon, description: 'Your dashboard' },
      { name: 'My Patients', href: '/caregiver-portal?tab=patients', icon: UsersIcon, description: 'Assigned patients & care plans' },
      { name: 'EVV Clock', href: '/evv/clock', icon: ClockIcon, description: 'Clock in/out for visits' },
      { name: 'My Schedule', href: '/caregiver-portal?tab=schedule', icon: CalendarIcon, description: 'Your schedule' },
    ]
  },
  {
    title: 'Training & Pay',
    items: [
      { name: 'My Training', href: '/caregiver-portal?tab=training', icon: AcademicCapIcon, description: 'Required courses' },
      { name: 'My Pay', href: '/caregiver-portal?tab=pay', icon: CreditCardIcon, description: 'Wages & pay stubs' },
      { name: 'Expenses', href: '/caregiver-portal?tab=expenses', icon: ReceiptPercentIcon, description: 'Submit expenses' },
    ]
  },
  {
    title: 'Quick Actions',
    items: [
      { name: 'Report Incident', href: '/dashboard/incidents', icon: FlagIcon, description: 'Report an incident' },
      { name: 'Resources', href: '/caregiver-portal?tab=resources', icon: BookOpenIcon, description: 'Policies & contacts' },
    ]
  }
];

/**
 * Pod Lead navigation (mini-COO view)
 * Comprehensive visibility for pod management within RBAC boundaries
 */
const podLeadNavigation: NavigationSection[] = [
  {
    title: 'My Pod',
    items: [
      { name: 'Pod Dashboard', href: '/dashboard/pod-lead', icon: HomeIcon, description: 'Pod overview' },
      { name: 'My Team', href: '/dashboard/pod-lead?tab=team', icon: UserGroupIcon, description: 'Caregivers in your pod' },
      { name: 'My Clients', href: '/dashboard/pod-lead?tab=clients', icon: UsersIcon, description: 'Patients in your pod' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: "Today's Ops", href: '/dashboard/pod-lead?tab=operations', icon: ClockIcon, description: 'Real-time operations' },
      { name: 'Scheduling', href: '/dashboard/pod-lead?tab=schedule', icon: CalendarIcon, description: 'Pod schedule' },
      { name: 'Dispatch', href: '/dashboard/dispatch', icon: MapPinIcon, description: 'Coverage gaps' },
      { name: 'EVV Clock', href: '/evv/clock', icon: CheckCircleIcon, description: 'Clock in/out' },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Approvals', href: '/dashboard/pod-lead?tab=approvals', icon: ClipboardDocumentCheckIcon, description: 'Pending approvals' },
      { name: 'Pod Metrics', href: '/dashboard/pod-lead?tab=metrics', icon: ChartBarIcon, description: 'Performance metrics' },
      { name: 'Incidents', href: '/dashboard/pod-lead?tab=incidents', icon: ExclamationTriangleIcon, description: 'Pod incidents' },
    ]
  },
  {
    title: 'Resources',
    items: [
      { name: 'Support', href: '/dashboard/pod-lead?tab=resources', icon: PhoneIcon, description: 'Contacts & escalation' },
    ]
  }
];

/**
 * Roles that should see caregiver-specific navigation
 */
const CAREGIVER_ROLES = [
  UserRole.CAREGIVER,
  UserRole.DSP_BASIC,
  UserRole.DSP_MED,
  UserRole.HHA,
  UserRole.CNA,
];

/**
 * Roles that should see pod lead-specific navigation
 */
const POD_LEAD_ROLES = [
  UserRole.POD_LEAD,
];

// Flatten for backward compatibility
const allNavigation: NavigationItem[] = navigationSections.flatMap(section => section.items);

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();

  // Initialize collapsed sections from localStorage or defaults
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_SECTIONS_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load collapsed sections from localStorage:', e);
    }
    return new Set(DEFAULT_COLLAPSED_SECTIONS);
  });

  // Persist collapsed sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        COLLAPSED_SECTIONS_STORAGE_KEY,
        JSON.stringify(Array.from(collapsedSections))
      );
    } catch (e) {
      console.warn('Failed to save collapsed sections to localStorage:', e);
    }
  }, [collapsedSections]);

  // Toggle a section's collapsed state
  const toggleSection = useCallback((sectionTitle: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  }, []);

  // Determine which navigation sections to use based on role
  const activeNavigationSections = useMemo(() => {
    if (!user?.role) return [];

    const userRole = user.role as UserRole;

    // Caregivers get simplified navigation
    if (CAREGIVER_ROLES.includes(userRole)) {
      return caregiverNavigation;
    }

    // Pod Leads get mini-COO navigation
    if (POD_LEAD_ROLES.includes(userRole)) {
      return podLeadNavigation;
    }

    // All other roles get full navigation filtered by RBAC
    return navigationSections;
  }, [user?.role]);

  // Filter navigation items based on user role (for backward compatibility)
  const navigation = useMemo(() => {
    if (!user?.role) return [];

    return allNavigation.filter(item => {
      // Home is always accessible
      if (item.href === '/') return true;

      // Check if user can access this route
      return canAccessRoute(item.href, user.role);
    });
  }, [user?.role]);

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Check if we have a token - if so, we should wait for auth to complete
  const hasToken = !!getAccessToken();

  // Debug logging
  console.log('[DashboardLayout] Render state:', {
    isLoading,
    hasUser: !!user,
    hasToken,
    path: location.pathname,
    sidebarOpen
  });

  // Show loading while auth is initializing OR if we have a token but user isn't loaded yet
  // This prevents premature redirects during navigation
  if (isLoading || (hasToken && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (no token and no user)
  if (!user) {
    console.log('[DashboardLayout] No user and no token, redirecting to /');
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <HeartIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Serenity ERP</h1>
              <p className="text-xs text-gray-500">Home Health Management</p>
            </div>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {activeNavigationSections.map((section) => {
            // For caregiver/pod lead roles, show all items in their sections
            // For other roles, filter based on RBAC
            const isRoleSpecificNav = CAREGIVER_ROLES.includes(user?.role as UserRole) ||
                                       POD_LEAD_ROLES.includes(user?.role as UserRole);

            const filteredItems = isRoleSpecificNav
              ? section.items // Role-specific nav already curated
              : section.items.filter(item => {
                  if (item.href === '/') return true;
                  return canAccessRoute(item.href, user?.role);
                });

            // Don't render empty sections
            if (filteredItems.length === 0) return null;

            const isCollapsed = collapsedSections.has(section.title);
            // Check if any item in this section is active (to highlight the section header)
            const hasActiveItem = filteredItems.some(item => {
              const hrefPath = item.href.split('?')[0];
              return isActive(hrefPath);
            });

            return (
              <div key={section.title} className="mb-1">
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
                    hasActiveItem && isCollapsed
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center">
                    {section.title}
                    {hasActiveItem && isCollapsed && (
                      <span className="ml-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                  </span>
                  {isCollapsed ? (
                    <ChevronRightIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Section Items - with smooth collapse animation */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
                  }`}
                >
                  <div className="space-y-1 mt-1">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      // Handle query params in href for active state
                      const hrefPath = item.href.split('?')[0];
                      const active = isActive(hrefPath) ||
                                     (location.search && item.href.includes(location.search));

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${active
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                          <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                            }`} />
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-4">
          {user && (
            <Link
              to="/profile"
              className="flex items-center space-x-3 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user.role}
                </p>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          <div className="mt-4 space-y-1">
            {PROFILE_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <a
              href="mailto:support@serenitycarepartners.com?subject=Help Request"
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              <QuestionMarkCircleIcon className="mr-3 h-4 w-4" />
              Help & Support
            </a>
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              <ArrowRightStartOnRectangleIcon className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6 text-gray-400" />
              </button>

              <div className="hidden lg:block text-sm text-gray-500">
                {navigation.find(item => isActive(item.href))?.description || 'Dashboard'}
              </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <GlobalSearch placeholder="Search dashboards, pages, actions..." />
            </div>

            <div className="flex items-center space-x-4">
              {/* System status indicator */}
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 hidden sm:block">Live Data</span>
              </div>

              {/* Notifications dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                >
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown panel */}
                {notificationsOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => refreshNotifications()}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Refresh
                          </button>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notification list */}
                      <div className="overflow-y-auto max-h-72">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              to={notification.link || '#'}
                              onClick={() => {
                                markAsRead(notification.id);
                                setNotificationsOpen(false);
                              }}
                              className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                                !notification.read ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 mt-0.5 h-2 w-2 rounded-full ${
                                  notification.type === 'alert' ? 'bg-red-500' :
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  notification.type === 'success' ? 'bg-green-500' :
                                  'bg-blue-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.category}
                                  </p>
                                </div>
                                {notification.priority === 'critical' && (
                                  <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Critical
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                          <Link
                            to="/alerts"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all notifications →
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* User menu dropdown */}
              <div className="relative">
                {user && (
                  <>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                    </button>

                    {/* Profile dropdown menu */}
                    {profileMenuOpen && (
                      <>
                        {/* Backdrop to close menu when clicking outside */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setProfileMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          {/* User info header */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {user.role?.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>

                          {/* Profile menu items */}
                          <div className="py-1">
                            {PROFILE_MENU_ITEMS.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  to={item.href}
                                  onClick={() => setProfileMenuOpen(false)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Icon className="mr-3 h-4 w-4 text-gray-400" />
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>

                          {/* Divider */}
                          <div className="border-t border-gray-100 my-1" />

                          {/* Help & Sign out */}
                          <div className="py-1">
                            <a
                              href="mailto:support@serenitycarepartners.com?subject=Help Request"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <QuestionMarkCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
                              Help & Support
                            </a>
                            <button
                              onClick={() => {
                                setProfileMenuOpen(false);
                                logout();
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <ArrowRightStartOnRectangleIcon className="mr-3 h-4 w-4 text-red-500" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}