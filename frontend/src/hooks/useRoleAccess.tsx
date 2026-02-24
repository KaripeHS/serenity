import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Role-Based Access Control Hook
 * Determines which dashboards and features users can access
 *
 * This hook must be used to:
 * 1. Filter navigation items in sidebar
 * 2. Protect routes with ProtectedRoute component
 * 3. Conditionally render features within dashboards
 */

export enum UserRole {
  // Executive Leadership (C-Suite)
  FOUNDER = 'founder',
  CEO = 'ceo',
  CFO = 'cfo',
  COO = 'coo',

  // Security & Compliance
  SECURITY_OFFICER = 'security_officer',
  COMPLIANCE_OFFICER = 'compliance_officer',

  // Finance Department
  FINANCE_DIRECTOR = 'finance_director',
  FINANCE_MANAGER = 'finance_manager',
  BILLING_MANAGER = 'billing_manager',
  RCM_ANALYST = 'rcm_analyst',
  INSURANCE_MANAGER = 'insurance_manager',
  BILLING_CODER = 'billing_coder',

  // Operations Department
  OPERATIONS_MANAGER = 'operations_manager',
  FIELD_OPS_MANAGER = 'field_ops_manager', // Formerly regional_manager - flexible scope
  POD_LEAD = 'pod_lead',
  FIELD_SUPERVISOR = 'field_supervisor',
  SCHEDULING_MANAGER = 'scheduling_manager',
  SCHEDULER = 'scheduler',
  DISPATCHER = 'dispatcher',
  QA_MANAGER = 'qa_manager',

  // HR Department
  HR_DIRECTOR = 'hr_director',
  HR_MANAGER = 'hr_manager',
  RECRUITER = 'recruiter',
  CREDENTIALING_SPECIALIST = 'credentialing_specialist',

  // IT & Support
  IT_ADMIN = 'it_admin',
  SUPPORT_AGENT = 'support_agent',

  // Clinical Leadership
  DIRECTOR_OF_NURSING = 'director_of_nursing',
  CLINICAL_DIRECTOR = 'clinical_director',
  NURSING_SUPERVISOR = 'nursing_supervisor',

  // Clinical Staff
  RN_CASE_MANAGER = 'rn_case_manager',
  LPN_LVN = 'lpn_lvn',
  THERAPIST = 'therapist',
  QIDP = 'qidp',

  // Direct Care Staff
  DSP_MED = 'dsp_med',
  DSP_BASIC = 'dsp_basic',
  HHA = 'hha',
  CNA = 'cna',
  CAREGIVER = 'caregiver',

  // External Access
  CLIENT = 'client',
  FAMILY = 'family',
  PAYER_AUDITOR = 'payer_auditor',
}

export enum DashboardPermission {
  // Command Centers
  EXECUTIVE_COMMAND_CENTER = 'dashboard:executive_command_center',
  CLINICAL_COMMAND_CENTER = 'dashboard:clinical_command_center',
  TALENT_COMMAND_CENTER = 'dashboard:talent_command_center',
  REVENUE_COMMAND_CENTER = 'dashboard:revenue_command_center',
  COMPLIANCE_COMMAND_CENTER = 'dashboard:compliance_command_center',
  OPERATIONS_COMMAND_CENTER = 'dashboard:operations_command_center',

  // Specialized Dashboards
  STRATEGIC_GROWTH = 'dashboard:strategic_growth',
  BUSINESS_INTELLIGENCE = 'dashboard:business_intelligence',
  ADMIN_SYSTEM = 'dashboard:admin_system',

  // External Portals
  CLIENT_FAMILY_PORTAL = 'dashboard:client_family_portal',
  CAREGIVER_PORTAL = 'dashboard:caregiver_portal',
}

/**
 * Dashboard Access Control Matrix
 * Maps user roles to allowed dashboards
 */
const DASHBOARD_ACCESS: Record<DashboardPermission, UserRole[]> = {
  // Executive Command Center (C-Suite only)
  [DashboardPermission.EXECUTIVE_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
  ],

  // Clinical Command Center (Clinical staff)
  [DashboardPermission.CLINICAL_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.LPN_LVN,
    UserRole.THERAPIST,
    UserRole.QIDP,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.QA_MANAGER,
  ],

  // Talent Management Command Center (HR staff)
  [DashboardPermission.TALENT_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.RECRUITER,
    UserRole.CREDENTIALING_SPECIALIST,
    UserRole.DIRECTOR_OF_NURSING, // View access for clinical hiring
    UserRole.CLINICAL_DIRECTOR, // View access for supervision
  ],

  // Revenue Cycle Command Center (Finance/Billing staff)
  [DashboardPermission.REVENUE_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.BILLING_CODER,
    UserRole.INSURANCE_MANAGER,
  ],

  // Compliance Command Center (Compliance staff)
  [DashboardPermission.COMPLIANCE_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.QA_MANAGER,
    UserRole.DIRECTOR_OF_NURSING, // View access for clinical compliance
    UserRole.CLINICAL_DIRECTOR, // View access for clinical compliance
  ],

  // Operations Command Center (Operations staff)
  [DashboardPermission.OPERATIONS_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.POD_LEAD,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.DISPATCHER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Strategic Growth Dashboard (Executive only)
  [DashboardPermission.STRATEGIC_GROWTH]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
  ],

  // Business Intelligence (Analysts + Executives)
  [DashboardPermission.BUSINESS_INTELLIGENCE]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.QA_MANAGER,
  ],

  // Admin & System Dashboard (IT only)
  [DashboardPermission.ADMIN_SYSTEM]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.IT_ADMIN,
    UserRole.SECURITY_OFFICER,
  ],

  // Client & Family Portal
  [DashboardPermission.CLIENT_FAMILY_PORTAL]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],

  // Caregiver Portal - Executives can view for oversight
  [DashboardPermission.CAREGIVER_PORTAL]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CAREGIVER,
    UserRole.DSP_BASIC,
    UserRole.DSP_MED,
    UserRole.HHA,
    UserRole.CNA,
    UserRole.LPN_LVN,
    UserRole.RN_CASE_MANAGER,
    UserRole.THERAPIST,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],
};

/**
 * Feature-level access control (granular permissions within dashboards)
 */
export enum FeaturePermission {
  // Clinical Command Center features
  VIEW_SUPERVISORY_VISITS = 'feature:view_supervisory_visits',
  SCHEDULE_SUPERVISORY_VISITS = 'feature:schedule_supervisory_visits',
  VIEW_INCIDENTS = 'feature:view_incidents',
  REPORT_INCIDENTS = 'feature:report_incidents',
  REPORT_TO_ODA = 'feature:report_to_oda',
  VIEW_ASSESSMENTS = 'feature:view_assessments',
  CREATE_ASSESSMENTS = 'feature:create_assessments',
  VIEW_QAPI = 'feature:view_qapi',
  MANAGE_QAPI = 'feature:manage_qapi',

  // Compliance Command Center features
  VIEW_COMPLIANCE_SCORE = 'feature:view_compliance_score',
  MANAGE_BREACHES = 'feature:manage_breaches',
  MANAGE_BAAS = 'feature:manage_baas',
  MANAGE_EMERGENCY_PREP = 'feature:manage_emergency_prep',
  VIEW_AUDIT_LOGS = 'feature:view_audit_logs',

  // Talent Command Center features
  VIEW_HR_PIPELINE = 'feature:view_hr_pipeline',
  MANAGE_CREDENTIALS = 'feature:manage_credentials',
  MANAGE_TRAINING = 'feature:manage_training',
  MANAGE_DISCIPLINE = 'feature:manage_discipline',

  // Revenue Command Center features
  VIEW_AR_AGING = 'feature:view_ar_aging',
  MANAGE_CLAIMS = 'feature:manage_claims',
  MANAGE_DENIALS = 'feature:manage_denials',
  APPROVE_WRITEOFFS = 'feature:approve_writeoffs',

  // Executive Command Center features
  VIEW_REVENUE_ANALYTICS = 'feature:view_revenue_analytics',
  VIEW_GROWTH_FORECAST = 'feature:view_growth_forecast',
  VIEW_RISK_DASHBOARD = 'feature:view_risk_dashboard',

  // Operations Command Center features
  VIEW_SCHEDULE = 'feature:view_schedule',
  MANAGE_SCHEDULE = 'feature:manage_schedule',
  VIEW_GPS_TRACKING = 'feature:view_gps_tracking',
  MANAGE_GEOFENCE = 'feature:manage_geofence',
  VIEW_MILEAGE = 'feature:view_mileage',
  APPROVE_MILEAGE = 'feature:approve_mileage',

  // Client & Family Portal features
  VIEW_CARE_PLAN = 'feature:view_care_plan',
  VIEW_VISIT_LOGS = 'feature:view_visit_logs',
  VIEW_BILLING_STATEMENTS = 'feature:view_billing_statements',
  SUBMIT_FEEDBACK = 'feature:submit_feedback',
  REQUEST_SCHEDULE_CHANGE = 'feature:request_schedule_change',

  // Strategic/BI features
  VIEW_PREDICTIVE_ANALYTICS = 'feature:view_predictive_analytics',
  EXPORT_REPORTS = 'feature:export_reports',
  CREATE_CUSTOM_REPORTS = 'feature:create_custom_reports',

  // Admin features
  MANAGE_USERS = 'feature:manage_users',
  MANAGE_SYSTEM_SETTINGS = 'feature:manage_system_settings',
  VIEW_SYSTEM_LOGS = 'feature:view_system_logs',
}

const FEATURE_ACCESS: Record<FeaturePermission, UserRole[]> = {
  // Clinical features - CEO and COO have view access for executive oversight
  [FeaturePermission.VIEW_SUPERVISORY_VISITS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.SCHEDULE_SUPERVISORY_VISITS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
  ],
  [FeaturePermission.VIEW_INCIDENTS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.NURSING_SUPERVISOR,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.QA_MANAGER,
  ],
  [FeaturePermission.REPORT_INCIDENTS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.NURSING_SUPERVISOR,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.REPORT_TO_ODA]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.VIEW_ASSESSMENTS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.LPN_LVN,
    UserRole.THERAPIST,
    UserRole.QIDP,
  ],
  [FeaturePermission.CREATE_ASSESSMENTS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
  ],
  [FeaturePermission.VIEW_QAPI]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.QA_MANAGER,
  ],
  [FeaturePermission.MANAGE_QAPI]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
  ],

  // Compliance features - CEO/COO for executive oversight
  [FeaturePermission.VIEW_COMPLIANCE_SCORE]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
  ],
  [FeaturePermission.MANAGE_BREACHES]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
  ],
  [FeaturePermission.MANAGE_BAAS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.MANAGE_EMERGENCY_PREP]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.IT_ADMIN,
  ],
  [FeaturePermission.VIEW_AUDIT_LOGS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.IT_ADMIN,
  ],

  // Talent features - CEO/COO for executive oversight
  [FeaturePermission.VIEW_HR_PIPELINE]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.RECRUITER,
    UserRole.CREDENTIALING_SPECIALIST,
  ],
  [FeaturePermission.MANAGE_CREDENTIALS]: [
    UserRole.FOUNDER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.CREDENTIALING_SPECIALIST,
  ],
  [FeaturePermission.MANAGE_TRAINING]: [
    UserRole.FOUNDER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
  ],
  [FeaturePermission.MANAGE_DISCIPLINE]: [
    UserRole.FOUNDER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
  ],

  // Revenue features - CFO/CEO for executive oversight
  [FeaturePermission.VIEW_AR_AGING]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
  ],
  [FeaturePermission.MANAGE_CLAIMS]: [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.BILLING_CODER,
  ],
  [FeaturePermission.MANAGE_DENIALS]: [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
  ],
  [FeaturePermission.APPROVE_WRITEOFFS]: [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
  ],

  // Executive features - All C-Suite
  [FeaturePermission.VIEW_REVENUE_ANALYTICS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
  ],
  [FeaturePermission.VIEW_GROWTH_FORECAST]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
  ],
  [FeaturePermission.VIEW_RISK_DASHBOARD]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.COMPLIANCE_OFFICER,
  ],

  // Operations features - COO for executive oversight
  [FeaturePermission.VIEW_SCHEDULE]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.POD_LEAD,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.DIRECTOR_OF_NURSING,
  ],
  [FeaturePermission.MANAGE_SCHEDULE]: [
    UserRole.FOUNDER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
  ],
  [FeaturePermission.VIEW_GPS_TRACKING]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.POD_LEAD,
    UserRole.CLINICAL_DIRECTOR,
  ],
  [FeaturePermission.MANAGE_GEOFENCE]: [
    UserRole.FOUNDER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
  ],
  [FeaturePermission.VIEW_MILEAGE]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.FINANCE_DIRECTOR,
  ],
  [FeaturePermission.APPROVE_MILEAGE]: [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
  ],

  // Client & Family Portal features
  [FeaturePermission.VIEW_CARE_PLAN]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],
  [FeaturePermission.VIEW_VISIT_LOGS]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],
  [FeaturePermission.VIEW_BILLING_STATEMENTS]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],
  [FeaturePermission.SUBMIT_FEEDBACK]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],
  [FeaturePermission.REQUEST_SCHEDULE_CHANGE]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],

  // Strategic/BI features
  [FeaturePermission.VIEW_PREDICTIVE_ANALYTICS]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.HR_MANAGER,
  ],
  [FeaturePermission.EXPORT_REPORTS]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.HR_MANAGER,
    UserRole.CLINICAL_DIRECTOR,
  ],
  [FeaturePermission.CREATE_CUSTOM_REPORTS]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.RCM_ANALYST,
  ],

  // Admin features
  [FeaturePermission.MANAGE_USERS]: [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.IT_ADMIN,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
  ],
  [FeaturePermission.MANAGE_SYSTEM_SETTINGS]: [
    UserRole.FOUNDER,
    UserRole.IT_ADMIN,
  ],
  [FeaturePermission.VIEW_SYSTEM_LOGS]: [
    UserRole.FOUNDER,
    UserRole.IT_ADMIN,
    UserRole.SECURITY_OFFICER,
  ],
};

export function useRoleAccess() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const access = useMemo(() => {
    if (!userRole) {
      return {
        canAccessDashboard: () => false,
        canAccessFeature: () => false,
        allowedDashboards: [],
        isFounder: false,
        isExecutive: false,
        isClinical: false,
        isCompliance: false,
        isHR: false,
        isFinance: false,
        isOperations: false,
        isCaregiver: false,
      };
    }

    return {
      /**
       * Check if user can access a specific dashboard
       */
      canAccessDashboard: (dashboard: DashboardPermission): boolean => {
        const allowedRoles = DASHBOARD_ACCESS[dashboard] || [];
        return allowedRoles.includes(userRole);
      },

      /**
       * Check if user can access a specific feature within a dashboard
       */
      canAccessFeature: (feature: FeaturePermission): boolean => {
        const allowedRoles = FEATURE_ACCESS[feature] || [];
        return allowedRoles.includes(userRole);
      },

      /**
       * Get list of dashboards user can access
       */
      allowedDashboards: Object.entries(DASHBOARD_ACCESS)
        .filter(([_, roles]) => roles.includes(userRole))
        .map(([dashboard]) => dashboard as DashboardPermission),

      /**
       * Role-based flags for conditional rendering
       */
      isFounder: userRole === UserRole.FOUNDER,
      isExecutive: [
        UserRole.FOUNDER,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.COO,
      ].includes(userRole),
      isClinical: [
        UserRole.DIRECTOR_OF_NURSING,
        UserRole.CLINICAL_DIRECTOR,
        UserRole.NURSING_SUPERVISOR,
        UserRole.RN_CASE_MANAGER,
        UserRole.LPN_LVN,
        UserRole.THERAPIST,
        UserRole.QIDP,
      ].includes(userRole),
      isCompliance: [
        UserRole.COMPLIANCE_OFFICER,
        UserRole.SECURITY_OFFICER,
        UserRole.QA_MANAGER,
      ].includes(userRole),
      isHR: [
        UserRole.HR_DIRECTOR,
        UserRole.HR_MANAGER,
        UserRole.RECRUITER,
        UserRole.CREDENTIALING_SPECIALIST,
      ].includes(userRole),
      isFinance: [
        UserRole.CFO,
        UserRole.FINANCE_DIRECTOR,
        UserRole.FINANCE_MANAGER,
        UserRole.BILLING_MANAGER,
        UserRole.RCM_ANALYST,
      ].includes(userRole),
      isOperations: [
        UserRole.COO,
        UserRole.OPERATIONS_MANAGER,
        UserRole.FIELD_OPS_MANAGER,
        UserRole.POD_LEAD,
        UserRole.SCHEDULING_MANAGER,
        UserRole.SCHEDULER,
        UserRole.DISPATCHER,
        UserRole.FIELD_SUPERVISOR,
      ].includes(userRole),
      isCaregiver: [
        UserRole.CAREGIVER,
        UserRole.DSP_BASIC,
        UserRole.DSP_MED,
        UserRole.HHA,
        UserRole.CNA,
      ].includes(userRole),
    };
  }, [userRole]);

  return access;
}

/**
 * Route-based access control mapping
 * Maps routes to the roles that can access them
 */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  // Executive Command Center (C-Suite only)
  '/dashboard/executive': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
  ],
  '/dashboard/executive-v2': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.COO,
    UserRole.FINANCE_DIRECTOR,
  ],

  // HR & Talent (HR staff only)
  '/dashboard/hr': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.RECRUITER,
    UserRole.CREDENTIALING_SPECIALIST,
  ],
  '/hr/staff': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.RECRUITER,
    UserRole.CREDENTIALING_SPECIALIST,
  ],
  '/dashboard/background-checks': [
    UserRole.FOUNDER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.RECRUITER,
  ],

  // Tax Compliance (Finance only)
  '/dashboard/tax': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
  ],

  // Operations (Operations staff)
  '/dashboard/operations': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.POD_LEAD,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.DISPATCHER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Clinical (Clinical staff)
  '/dashboard/clinical': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.LPN_LVN,
    UserRole.THERAPIST,
    UserRole.QIDP,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.QA_MANAGER,
  ],
  '/dashboard/care-plans': [
    UserRole.FOUNDER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.THERAPIST,
    UserRole.QIDP,
  ],

  // Billing (Finance/Billing staff)
  '/dashboard/billing': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.BILLING_CODER,
    UserRole.INSURANCE_MANAGER,
  ],
  '/dashboard/billing-ar': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
  ],
  '/dashboard/claims-workflow': [
    UserRole.FOUNDER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.BILLING_CODER,
  ],

  // Compliance (Compliance staff)
  '/dashboard/compliance': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.QA_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // PASSPORT Pre-Certification (Compliance & Executive)
  '/dashboard/passport-certification': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.QA_MANAGER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],
  '/dashboard/operating-forms': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.QA_MANAGER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Training (HR + Clinical leadership)
  '/dashboard/training': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.COMPLIANCE_OFFICER,
  ],

  // Scheduling (Operations staff + Clinical)
  '/dashboard/scheduling': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.POD_LEAD,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.DISPATCHER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],
  '/dashboard/scheduling-calendar': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULING_MANAGER,
    UserRole.SCHEDULER,
    UserRole.DISPATCHER,
    UserRole.POD_LEAD,
  ],
  '/dashboard/dispatch': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SCHEDULING_MANAGER,
    UserRole.DISPATCHER,
    UserRole.POD_LEAD,
  ],

  // Credentials & Licenses
  '/dashboard/credentials': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
    UserRole.CREDENTIALING_SPECIALIST,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.RECRUITER,
  ],
  '/dashboard/licenses': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
  ],

  // Payroll & Bonuses (Finance + HR)
  '/dashboard/payroll-v2': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.HR_DIRECTOR,
  ],
  '/dashboard/caregiver-bonuses': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.HR_DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
  ],

  // Finance
  '/dashboard/finance/bank-accounts': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
  ],
  '/dashboard/finance/reports': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
  ],
  '/dashboard/finance/vendors': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
  ],
  '/dashboard/finance/expenses': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.FINANCE_MANAGER,
  ],
  '/dashboard/finance/bank-feeds': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
  ],
  '/dashboard/finance/payroll': [
    UserRole.FOUNDER,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.HR_DIRECTOR,
  ],

  // Admin routes (Founders + IT + Executive management)
  '/admin/users': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.IT_ADMIN,
    UserRole.HR_DIRECTOR,
    UserRole.HR_MANAGER,
  ],
  '/admin/roles': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.IT_ADMIN,
  ],
  '/admin/pods': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
  ],
  '/admin/audit': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.IT_ADMIN,
  ],
  '/admin/images': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.IT_ADMIN,
  ],
  '/admin/settings/communications': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.IT_ADMIN,
  ],
  '/admin/settings/email-accounts': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.IT_ADMIN,
  ],
  '/admin/subscriptions': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.IT_ADMIN,
  ],
  '/admin/intake-invitations': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.HR_MANAGER,
  ],

  // Patient routes (Clinical + Operations)
  '/patients': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.LPN_LVN,
    UserRole.THERAPIST,
    UserRole.QIDP,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.POD_LEAD,
    UserRole.SCHEDULER,
    UserRole.DSP_MED,
    UserRole.DSP_BASIC,
    UserRole.HHA,
    UserRole.CNA,
    UserRole.CAREGIVER,
  ],
  '/dashboard/client-intake': [
    UserRole.FOUNDER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
  ],

  // CRM (Sales/Admin)
  '/dashboard/crm': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.OPERATIONS_MANAGER,
  ],

  // EVV (Caregivers + Supervisors)
  '/evv/clock': [
    UserRole.FOUNDER,
    UserRole.CAREGIVER,
    UserRole.DSP_BASIC,
    UserRole.DSP_MED,
    UserRole.HHA,
    UserRole.CNA,
    UserRole.LPN_LVN,
    UserRole.RN_CASE_MANAGER,
    UserRole.THERAPIST,
    UserRole.FIELD_SUPERVISOR,
    UserRole.POD_LEAD,
  ],

  // Family Portal (Families + Admin)
  '/family-portal': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.FAMILY,
    UserRole.CLIENT,
    UserRole.OPERATIONS_MANAGER,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Special programs
  '/dashboard/dodd-hpc': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.CLINICAL_DIRECTOR,
  ],
  '/dashboard/consumer-directed': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.BILLING_MANAGER,
  ],

  // Supervisory Visits (Clinical supervision)
  '/dashboard/supervisory-visits': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.NURSING_SUPERVISOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
  ],

  // Incident Reporting (includes caregivers for reporting)
  '/dashboard/incidents': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.NURSING_SUPERVISOR,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.QA_MANAGER,
    UserRole.HR_DIRECTOR,
    UserRole.POD_LEAD,
    UserRole.CAREGIVER,
    UserRole.DSP_BASIC,
    UserRole.DSP_MED,
    UserRole.HHA,
    UserRole.CNA,
  ],

  // Denial Management
  '/dashboard/denials': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
  ],

  // Authorization Management
  '/dashboard/authorizations': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.OPERATIONS_MANAGER,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Caregiver Portal (Direct care staff)
  '/caregiver-portal': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CAREGIVER,
    UserRole.DSP_BASIC,
    UserRole.DSP_MED,
    UserRole.HHA,
    UserRole.CNA,
    UserRole.LPN_LVN,
    UserRole.RN_CASE_MANAGER,
    UserRole.THERAPIST,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Pod Lead Dashboard (Pod management)
  '/dashboard/pod-lead': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.POD_LEAD,
    UserRole.FIELD_OPS_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DIRECTOR_OF_NURSING,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Sandata EVV Dashboard (Operations + Compliance + Billing)
  '/dashboard/sandata-evv': [
    UserRole.FOUNDER,
    UserRole.CEO,
    UserRole.COO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.SCHEDULING_MANAGER,
    UserRole.IT_ADMIN,
  ],
};

/**
 * Check if a user role can access a specific route
 */
export function canAccessRoute(route: string, userRole: string | undefined): boolean {
  if (!userRole) return false;

  // Founders and CEO always have access to all routes
  if (userRole === UserRole.FOUNDER || userRole === UserRole.CEO || userRole === 'admin') return true;

  // Check exact match first
  const allowedRoles = ROUTE_ACCESS[route];
  if (allowedRoles) {
    return allowedRoles.includes(userRole as UserRole);
  }

  // Check prefix matches for nested routes
  for (const [routePattern, roles] of Object.entries(ROUTE_ACCESS)) {
    if (route.startsWith(routePattern + '/') || route === routePattern) {
      return roles.includes(userRole as UserRole);
    }
  }

  // Default: allow access to unprotected routes (home, login, etc.)
  return true;
}

/**
 * Get navigation items filtered by user role
 */
export function getNavigationForRole(userRole: string | undefined): string[] {
  if (!userRole) return [];

  return Object.entries(ROUTE_ACCESS)
    .filter(([_, roles]) => {
      if (userRole === UserRole.FOUNDER || userRole === UserRole.CEO || userRole === 'admin') return true;
      return roles.includes(userRole as UserRole);
    })
    .map(([route]) => route);
}

/**
 * Higher-order component to protect dashboards with role-based access
 */
export function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  requiredDashboard: DashboardPermission
) {
  return function ProtectedComponent(props: P) {
    const { canAccessDashboard } = useRoleAccess();

    if (!canAccessDashboard(requiredDashboard)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You do not have permission to access this dashboard.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Protected Route Component - Wrap routes to enforce RBAC
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  route: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, route, fallback }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const userRole = user?.role;

  // Debug logging
  console.log('[ProtectedRoute] Checking access:', { route, userRole, userId: user?.id, hasUser: !!user, isLoading });

  // Wait for auth to finish loading before making access decision
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  console.log('[ProtectedRoute] canAccessRoute result:', canAccessRoute(route, userRole));

  if (!canAccessRoute(route, userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You do not have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your role: <span className="font-medium capitalize">{userRole || 'Unknown'}</span>
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] Access granted, rendering children');
  return <>{children}</>;
}
