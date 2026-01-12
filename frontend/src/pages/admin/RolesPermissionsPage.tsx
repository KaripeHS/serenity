/**
 * Roles & Permissions Page
 * Comprehensive RBAC management UI that integrates with useRoleAccess.tsx
 * Shows all system roles, their permissions, and access levels
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheckIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  HeartIcon,
  CogIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ComputerDesktopIcon,
  HomeIcon,
  KeyIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  UserRole,
  DashboardPermission,
  FeaturePermission,
  ROUTE_ACCESS,
} from '@/hooks/useRoleAccess';
import { adminService } from '@/services/admin.service';

// Role metadata for display
interface RoleInfo {
  role: UserRole;
  label: string;
  description: string;
  category: RoleCategory;
  icon: React.ElementType;
  color: string;
}

type RoleCategory =
  | 'executive'
  | 'security'
  | 'finance'
  | 'operations'
  | 'hr'
  | 'clinical'
  | 'it'
  | 'direct_care'
  | 'external';

const CATEGORY_INFO: Record<RoleCategory, { label: string; color: string; icon: React.ElementType }> = {
  executive: { label: 'Executive Leadership', color: 'purple', icon: BuildingOfficeIcon },
  security: { label: 'Security & Compliance', color: 'red', icon: ShieldCheckIcon },
  finance: { label: 'Finance Department', color: 'green', icon: CurrencyDollarIcon },
  operations: { label: 'Operations Department', color: 'blue', icon: ClipboardDocumentListIcon },
  hr: { label: 'Human Resources', color: 'orange', icon: UserGroupIcon },
  clinical: { label: 'Clinical Staff', color: 'teal', icon: HeartIcon },
  it: { label: 'IT & Support', color: 'slate', icon: ComputerDesktopIcon },
  direct_care: { label: 'Direct Care Staff', color: 'cyan', icon: HomeIcon },
  external: { label: 'External Access', color: 'gray', icon: UsersIcon },
};

// Complete role definitions with metadata
const ROLE_DEFINITIONS: RoleInfo[] = [
  // Executive Leadership
  { role: UserRole.FOUNDER, label: 'Founder', description: 'Full system access, all permissions', category: 'executive', icon: KeyIcon, color: 'purple' },
  { role: UserRole.CEO, label: 'CEO', description: 'Chief Executive Officer - Full operational access', category: 'executive', icon: BuildingOfficeIcon, color: 'purple' },
  { role: UserRole.CFO, label: 'CFO', description: 'Chief Financial Officer - Financial oversight', category: 'executive', icon: CurrencyDollarIcon, color: 'purple' },
  { role: UserRole.COO, label: 'COO', description: 'Chief Operating Officer - Operations oversight', category: 'executive', icon: ClipboardDocumentListIcon, color: 'purple' },

  // Security & Compliance
  { role: UserRole.SECURITY_OFFICER, label: 'Security Officer', description: 'System security and access management', category: 'security', icon: LockClosedIcon, color: 'red' },
  { role: UserRole.COMPLIANCE_OFFICER, label: 'Compliance Officer', description: 'Regulatory compliance and audits', category: 'security', icon: ShieldCheckIcon, color: 'red' },

  // Finance Department
  { role: UserRole.FINANCE_DIRECTOR, label: 'Finance Director', description: 'Finance department leadership', category: 'finance', icon: CurrencyDollarIcon, color: 'green' },
  { role: UserRole.FINANCE_MANAGER, label: 'Finance Manager', description: 'Financial operations management', category: 'finance', icon: CurrencyDollarIcon, color: 'green' },
  { role: UserRole.BILLING_MANAGER, label: 'Billing Manager', description: 'Billing operations and claims', category: 'finance', icon: CurrencyDollarIcon, color: 'green' },
  { role: UserRole.RCM_ANALYST, label: 'RCM Analyst', description: 'Revenue cycle management analysis', category: 'finance', icon: CurrencyDollarIcon, color: 'green' },
  { role: UserRole.INSURANCE_MANAGER, label: 'Insurance Manager', description: 'Insurance relationships and contracts', category: 'finance', icon: CurrencyDollarIcon, color: 'green' },
  { role: UserRole.BILLING_CODER, label: 'Billing Coder', description: 'Medical coding and claim preparation', category: 'finance', icon: CurrencyDollarIcon, color: 'green' },

  // Operations Department
  { role: UserRole.OPERATIONS_MANAGER, label: 'Operations Manager', description: 'Day-to-day operations oversight', category: 'operations', icon: ClipboardDocumentListIcon, color: 'blue' },
  { role: UserRole.FIELD_OPS_MANAGER, label: 'Field Ops Manager', description: 'Regional/field operations management', category: 'operations', icon: ClipboardDocumentListIcon, color: 'blue' },
  { role: UserRole.POD_LEAD, label: 'Pod Lead', description: 'Care pod leadership and supervision', category: 'operations', icon: UserGroupIcon, color: 'blue' },
  { role: UserRole.FIELD_SUPERVISOR, label: 'Field Supervisor', description: 'Field staff supervision', category: 'operations', icon: ClipboardDocumentListIcon, color: 'blue' },
  { role: UserRole.SCHEDULING_MANAGER, label: 'Scheduling Manager', description: 'Scheduling department leadership', category: 'operations', icon: ClipboardDocumentListIcon, color: 'blue' },
  { role: UserRole.SCHEDULER, label: 'Scheduler', description: 'Schedule creation and management', category: 'operations', icon: ClipboardDocumentListIcon, color: 'blue' },
  { role: UserRole.DISPATCHER, label: 'Dispatcher', description: 'Real-time dispatch and coverage', category: 'operations', icon: ClipboardDocumentListIcon, color: 'blue' },
  { role: UserRole.QA_MANAGER, label: 'QA Manager', description: 'Quality assurance management', category: 'operations', icon: ShieldCheckIcon, color: 'blue' },

  // HR Department
  { role: UserRole.HR_DIRECTOR, label: 'HR Director', description: 'Human resources leadership', category: 'hr', icon: UserGroupIcon, color: 'orange' },
  { role: UserRole.HR_MANAGER, label: 'HR Manager', description: 'HR operations management', category: 'hr', icon: UserGroupIcon, color: 'orange' },
  { role: UserRole.RECRUITER, label: 'Recruiter', description: 'Talent acquisition and hiring', category: 'hr', icon: BriefcaseIcon, color: 'orange' },
  { role: UserRole.CREDENTIALING_SPECIALIST, label: 'Credentialing Specialist', description: 'Credential verification and tracking', category: 'hr', icon: AcademicCapIcon, color: 'orange' },

  // IT & Support
  { role: UserRole.IT_ADMIN, label: 'IT Admin', description: 'System administration and IT support', category: 'it', icon: ComputerDesktopIcon, color: 'slate' },
  { role: UserRole.SUPPORT_AGENT, label: 'Support Agent', description: 'Help desk and user support', category: 'it', icon: ComputerDesktopIcon, color: 'slate' },

  // Clinical Leadership
  { role: UserRole.DIRECTOR_OF_NURSING, label: 'Director of Nursing', description: 'Nursing department leadership', category: 'clinical', icon: HeartIcon, color: 'teal' },
  { role: UserRole.CLINICAL_DIRECTOR, label: 'Clinical Director', description: 'Clinical operations leadership', category: 'clinical', icon: HeartIcon, color: 'teal' },
  { role: UserRole.NURSING_SUPERVISOR, label: 'Nursing Supervisor', description: 'Nursing staff supervision', category: 'clinical', icon: HeartIcon, color: 'teal' },

  // Clinical Staff
  { role: UserRole.RN_CASE_MANAGER, label: 'RN Case Manager', description: 'Registered nurse case management', category: 'clinical', icon: HeartIcon, color: 'teal' },
  { role: UserRole.LPN_LVN, label: 'LPN/LVN', description: 'Licensed practical/vocational nurse', category: 'clinical', icon: HeartIcon, color: 'teal' },
  { role: UserRole.THERAPIST, label: 'Therapist', description: 'PT/OT/ST therapy services', category: 'clinical', icon: HeartIcon, color: 'teal' },
  { role: UserRole.QIDP, label: 'QIDP', description: 'Qualified Intellectual Disabilities Professional', category: 'clinical', icon: HeartIcon, color: 'teal' },

  // Direct Care Staff
  { role: UserRole.DSP_MED, label: 'DSP (Med Admin)', description: 'Direct support professional with med admin', category: 'direct_care', icon: HomeIcon, color: 'cyan' },
  { role: UserRole.DSP_BASIC, label: 'DSP (Basic)', description: 'Direct support professional - basic care', category: 'direct_care', icon: HomeIcon, color: 'cyan' },
  { role: UserRole.HHA, label: 'Home Health Aide', description: 'Home health aide services', category: 'direct_care', icon: HomeIcon, color: 'cyan' },
  { role: UserRole.CNA, label: 'CNA', description: 'Certified nursing assistant', category: 'direct_care', icon: HomeIcon, color: 'cyan' },
  { role: UserRole.CAREGIVER, label: 'Caregiver', description: 'General caregiver / field staff', category: 'direct_care', icon: HomeIcon, color: 'cyan' },

  // External Access
  { role: UserRole.CLIENT, label: 'Client', description: 'Patient/client portal access', category: 'external', icon: UsersIcon, color: 'gray' },
  { role: UserRole.FAMILY, label: 'Family Member', description: 'Family portal access', category: 'external', icon: UsersIcon, color: 'gray' },
  { role: UserRole.PAYER_AUDITOR, label: 'Payer Auditor', description: 'Insurance company audit access', category: 'external', icon: ShieldCheckIcon, color: 'gray' },
];

// Route labels for display
const ROUTE_LABELS: Record<string, { label: string; category: string }> = {
  '/dashboard/executive': { label: 'Executive Dashboard', category: 'Executive' },
  '/dashboard/executive-v2': { label: 'Executive Dashboard V2', category: 'Executive' },
  '/dashboard/hr': { label: 'HR Dashboard', category: 'HR' },
  '/hr/staff': { label: 'Staff Directory', category: 'HR' },
  '/dashboard/background-checks': { label: 'Background Checks', category: 'HR' },
  '/dashboard/tax': { label: 'Tax Compliance', category: 'Finance' },
  '/dashboard/operations': { label: 'Operations Dashboard', category: 'Operations' },
  '/dashboard/clinical': { label: 'Clinical Dashboard', category: 'Clinical' },
  '/dashboard/care-plans': { label: 'Care Plans', category: 'Clinical' },
  '/dashboard/billing': { label: 'Billing Dashboard', category: 'Finance' },
  '/dashboard/billing-ar': { label: 'AR Aging', category: 'Finance' },
  '/dashboard/claims-workflow': { label: 'Claims Workflow', category: 'Finance' },
  '/dashboard/compliance': { label: 'Compliance Dashboard', category: 'Compliance' },
  '/dashboard/training': { label: 'Training Management', category: 'HR' },
  '/dashboard/scheduling': { label: 'Scheduling', category: 'Operations' },
  '/dashboard/scheduling-calendar': { label: 'Scheduling Calendar', category: 'Operations' },
  '/dashboard/dispatch': { label: 'Dispatch', category: 'Operations' },
  '/dashboard/credentials': { label: 'Credentials', category: 'HR' },
  '/dashboard/licenses': { label: 'Licenses', category: 'Compliance' },
  '/dashboard/payroll-v2': { label: 'Payroll', category: 'Finance' },
  '/dashboard/caregiver-bonuses': { label: 'Caregiver Bonuses', category: 'Finance' },
  '/dashboard/finance/bank-accounts': { label: 'Bank Accounts', category: 'Finance' },
  '/dashboard/finance/reports': { label: 'Financial Reports', category: 'Finance' },
  '/dashboard/finance/vendors': { label: 'Vendor Center', category: 'Finance' },
  '/dashboard/finance/expenses': { label: 'Expenses', category: 'Finance' },
  '/dashboard/finance/bank-feeds': { label: 'Bank Feeds', category: 'Finance' },
  '/dashboard/finance/payroll': { label: 'Payroll Processing', category: 'Finance' },
  '/admin/users': { label: 'User Management', category: 'Admin' },
  '/admin/roles': { label: 'Roles & Permissions', category: 'Admin' },
  '/admin/pods': { label: 'Pod Management', category: 'Admin' },
  '/admin/audit': { label: 'Audit Logs', category: 'Admin' },
  '/admin/settings/communications': { label: 'Communications', category: 'Admin' },
  '/admin/settings/email-accounts': { label: 'Email Accounts', category: 'Admin' },
  '/admin/subscriptions': { label: 'Subscriptions', category: 'Admin' },
  '/patients': { label: 'Patients', category: 'Clinical' },
  '/dashboard/client-intake': { label: 'Client Intake', category: 'Clinical' },
  '/dashboard/crm': { label: 'CRM', category: 'Sales' },
  '/evv/clock': { label: 'EVV Clock', category: 'Operations' },
  '/family-portal': { label: 'Family Portal', category: 'Portal' },
  '/dashboard/dodd-hpc': { label: 'DODD HPC', category: 'Compliance' },
  '/dashboard/consumer-directed': { label: 'Consumer Directed', category: 'Operations' },
  '/dashboard/supervisory-visits': { label: 'Supervisory Visits', category: 'Clinical' },
  '/dashboard/incidents': { label: 'Incidents', category: 'Clinical' },
  '/dashboard/denials': { label: 'Denials', category: 'Finance' },
  '/dashboard/authorizations': { label: 'Authorizations', category: 'Finance' },
  '/caregiver-portal': { label: 'Caregiver Portal', category: 'Portal' },
  '/dashboard/pod-lead': { label: 'Pod Lead Dashboard', category: 'Operations' },
};

// Color utilities
const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; lightBg: string }> = {
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', lightBg: 'bg-purple-50' },
    red: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-200', lightBg: 'bg-red-50' },
    green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', lightBg: 'bg-green-50' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', lightBg: 'bg-blue-50' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', lightBg: 'bg-orange-50' },
    teal: { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-200', lightBg: 'bg-teal-50' },
    slate: { bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-200', lightBg: 'bg-slate-50' },
    cyan: { bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-200', lightBg: 'bg-cyan-50' },
    gray: { bg: 'bg-gray-600', text: 'text-gray-600', border: 'border-gray-200', lightBg: 'bg-gray-50' },
  };
  return colors[color] || colors.gray;
};

// Get routes accessible by a role
function getAccessibleRoutes(role: UserRole): string[] {
  // Founders and CEO have access to all routes
  if (role === UserRole.FOUNDER || role === UserRole.CEO) {
    return Object.keys(ROUTE_ACCESS);
  }

  return Object.entries(ROUTE_ACCESS)
    .filter(([_, roles]) => roles.includes(role))
    .map(([route]) => route);
}

export function RolesPermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | 'all'>('all');
  const [expandedRoles, setExpandedRoles] = useState<Set<UserRole>>(new Set());
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Fetch user counts per role
  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const users = await adminService.getUsers({});
        const counts: Record<string, number> = {};
        users.forEach((user: any) => {
          const role = user.role?.toLowerCase() || 'unknown';
          counts[role] = (counts[role] || 0) + 1;
        });
        setUserCounts(counts);
      } catch (error) {
        console.error('Failed to fetch user counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchUserCounts();
  }, []);

  // Filter roles based on search and category
  const filteredRoles = useMemo(() => {
    return ROLE_DEFINITIONS.filter((roleInfo) => {
      const matchesSearch =
        roleInfo.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleInfo.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || roleInfo.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Group roles by category
  const rolesByCategory = useMemo(() => {
    const grouped: Record<RoleCategory, RoleInfo[]> = {
      executive: [],
      security: [],
      finance: [],
      operations: [],
      hr: [],
      clinical: [],
      it: [],
      direct_care: [],
      external: [],
    };
    filteredRoles.forEach((role) => {
      grouped[role.category].push(role);
    });
    return grouped;
  }, [filteredRoles]);

  const toggleRole = (role: UserRole) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(role)) {
      newExpanded.delete(role);
    } else {
      newExpanded.add(role);
    }
    setExpandedRoles(newExpanded);
  };

  const expandAll = () => {
    setExpandedRoles(new Set(ROLE_DEFINITIONS.map((r) => r.role)));
  };

  const collapseAll = () => {
    setExpandedRoles(new Set());
  };

  // Calculate stats
  const totalRoles = ROLE_DEFINITIONS.length;
  const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0);
  const totalRoutes = Object.keys(ROUTE_ACCESS).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-gray-500 mt-1">
          Manage role-based access control for {totalRoles} system roles across {totalRoutes} routes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <KeyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalRoles}</p>
              <p className="text-sm text-gray-500">System Roles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {loadingCounts ? '...' : totalUsers}
              </p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
              <p className="text-sm text-gray-500">Protected Routes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(CATEGORY_INFO).length}
              </p>
              <p className="text-sm text-gray-500">Role Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as RoleCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>

          {/* Expand/Collapse */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-6">
        {Object.entries(rolesByCategory).map(([category, roles]) => {
          if (roles.length === 0) return null;
          const categoryInfo = CATEGORY_INFO[category as RoleCategory];
          const CategoryIcon = categoryInfo.icon;
          const colors = getColorClasses(categoryInfo.color);

          return (
            <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Category Header */}
              <div className={`px-6 py-4 ${colors.lightBg} border-b ${colors.border}`}>
                <div className="flex items-center gap-3">
                  <CategoryIcon className={`h-6 w-6 ${colors.text}`} />
                  <div>
                    <h2 className={`text-lg font-semibold ${colors.text}`}>{categoryInfo.label}</h2>
                    <p className="text-sm text-gray-500">{roles.length} roles</p>
                  </div>
                </div>
              </div>

              {/* Roles in Category */}
              <div className="divide-y divide-gray-100">
                {roles.map((roleInfo) => {
                  const isExpanded = expandedRoles.has(roleInfo.role);
                  const accessibleRoutes = getAccessibleRoutes(roleInfo.role);
                  const userCount = userCounts[roleInfo.role] || 0;
                  const RoleIcon = roleInfo.icon;
                  const roleColors = getColorClasses(roleInfo.color);

                  return (
                    <div key={roleInfo.role} className="hover:bg-gray-50">
                      {/* Role Row */}
                      <button
                        onClick={() => toggleRole(roleInfo.role)}
                        className="w-full px-6 py-4 flex items-center gap-4 text-left"
                      >
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className={`p-2 rounded-lg ${roleColors.lightBg}`}>
                          <RoleIcon className={`h-5 w-5 ${roleColors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{roleInfo.label}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                              {roleInfo.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{roleInfo.description}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {loadingCounts ? '...' : userCount}
                            </p>
                            <p className="text-xs text-gray-500">users</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{accessibleRoutes.length}</p>
                            <p className="text-xs text-gray-500">routes</p>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Route Access */}
                      {isExpanded && (
                        <div className="px-6 pb-4 pl-20">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Accessible Routes ({accessibleRoutes.length})
                            </h4>
                            {accessibleRoutes.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">No routes configured</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {accessibleRoutes.map((route) => {
                                  const routeInfo = ROUTE_LABELS[route] || {
                                    label: route,
                                    category: 'Other',
                                  };
                                  return (
                                    <div
                                      key={route}
                                      className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded border border-gray-200"
                                    >
                                      <span
                                        className={`text-xs px-1.5 py-0.5 rounded ${
                                          routeInfo.category === 'Admin'
                                            ? 'bg-red-100 text-red-700'
                                            : routeInfo.category === 'Finance'
                                            ? 'bg-green-100 text-green-700'
                                            : routeInfo.category === 'Clinical'
                                            ? 'bg-teal-100 text-teal-700'
                                            : routeInfo.category === 'Operations'
                                            ? 'bg-blue-100 text-blue-700'
                                            : routeInfo.category === 'HR'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {routeInfo.category}
                                      </span>
                                      <span className="text-gray-700">{routeInfo.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Role Special Notes */}
                            {(roleInfo.role === UserRole.FOUNDER ||
                              roleInfo.role === UserRole.CEO) && (
                              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm text-purple-700">
                                  <strong>Note:</strong> This role has automatic access to all routes
                                  and dashboards in the system.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">About Role-Based Access Control</h3>
            <p className="text-sm text-blue-700 mt-1">
              This system uses role-based access control (RBAC) to manage user permissions. Each role
              has specific routes and features they can access. Roles are organized into categories
              based on department or function. Founders and CEOs have automatic access to all
              system resources.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              To modify role permissions, edit the <code className="bg-blue-100 px-1 rounded">ROUTE_ACCESS</code> and{' '}
              <code className="bg-blue-100 px-1 rounded">DASHBOARD_ACCESS</code> mappings in{' '}
              <code className="bg-blue-100 px-1 rounded">useRoleAccess.tsx</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RolesPermissionsPage;
