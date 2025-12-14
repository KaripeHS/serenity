import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Role-Based Access Control Hook
 * Determines which dashboards and features users can access
 */

export enum UserRole {
  FOUNDER = 'founder',
  SECURITY_OFFICER = 'security_officer',
  COMPLIANCE_OFFICER = 'compliance_officer',
  FINANCE_DIRECTOR = 'finance_director',
  BILLING_MANAGER = 'billing_manager',
  RCM_ANALYST = 'rcm_analyst',
  SCHEDULER = 'scheduler',
  FIELD_SUPERVISOR = 'field_supervisor',
  HR_MANAGER = 'hr_manager',
  CREDENTIALING_SPECIALIST = 'credentialing_specialist',
  IT_ADMIN = 'it_admin',
  SUPPORT_AGENT = 'support_agent',
  RN_CASE_MANAGER = 'rn_case_manager',
  LPN_LVN = 'lpn_lvn',
  THERAPIST = 'therapist',
  CLINICAL_DIRECTOR = 'clinical_director',
  QIDP = 'qidp',
  DSP_MED = 'dsp_med',
  DSP_BASIC = 'dsp_basic',
  INSURANCE_MANAGER = 'insurance_manager',
  BILLING_CODER = 'billing_coder',
  CAREGIVER = 'caregiver',
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
    UserRole.FINANCE_DIRECTOR,
  ],

  // Clinical Command Center (Clinical staff)
  [DashboardPermission.CLINICAL_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.LPN_LVN,
    UserRole.THERAPIST,
    UserRole.QIDP,
    UserRole.COMPLIANCE_OFFICER,
  ],

  // Talent Management Command Center (HR staff)
  [DashboardPermission.TALENT_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.HR_MANAGER,
    UserRole.CREDENTIALING_SPECIALIST,
    UserRole.CLINICAL_DIRECTOR, // View access for supervision
  ],

  // Revenue Cycle Command Center (Finance/Billing staff)
  [DashboardPermission.REVENUE_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.BILLING_CODER,
    UserRole.INSURANCE_MANAGER,
  ],

  // Compliance Command Center (Compliance staff)
  [DashboardPermission.COMPLIANCE_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.CLINICAL_DIRECTOR, // View access for clinical compliance
  ],

  // Operations Command Center (Operations staff)
  [DashboardPermission.OPERATIONS_COMMAND_CENTER]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Strategic Growth Dashboard (Executive only)
  [DashboardPermission.STRATEGIC_GROWTH]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
  ],

  // Business Intelligence (Analysts + Executives)
  [DashboardPermission.BUSINESS_INTELLIGENCE]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
    UserRole.HR_MANAGER,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Admin & System Dashboard (IT only)
  [DashboardPermission.ADMIN_SYSTEM]: [
    UserRole.FOUNDER,
    UserRole.IT_ADMIN,
    UserRole.SECURITY_OFFICER,
  ],

  // Client & Family Portal
  [DashboardPermission.CLIENT_FAMILY_PORTAL]: [
    UserRole.CLIENT,
    UserRole.FAMILY,
  ],

  // Caregiver Portal
  [DashboardPermission.CAREGIVER_PORTAL]: [
    UserRole.CAREGIVER,
    UserRole.DSP_BASIC,
    UserRole.DSP_MED,
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
  // Clinical features
  [FeaturePermission.VIEW_SUPERVISORY_VISITS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.SCHEDULE_SUPERVISORY_VISITS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
  ],
  [FeaturePermission.VIEW_INCIDENTS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
  ],
  [FeaturePermission.REPORT_INCIDENTS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.REPORT_TO_ODA]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.VIEW_ASSESSMENTS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
    UserRole.LPN_LVN,
  ],
  [FeaturePermission.CREATE_ASSESSMENTS]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.RN_CASE_MANAGER,
  ],
  [FeaturePermission.VIEW_QAPI]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.MANAGE_QAPI]: [
    UserRole.FOUNDER,
    UserRole.CLINICAL_DIRECTOR,
  ],

  // Compliance features
  [FeaturePermission.VIEW_COMPLIANCE_SCORE]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.CLINICAL_DIRECTOR,
  ],
  [FeaturePermission.MANAGE_BREACHES]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
  ],
  [FeaturePermission.MANAGE_BAAS]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
  ],
  [FeaturePermission.MANAGE_EMERGENCY_PREP]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.IT_ADMIN,
  ],
  [FeaturePermission.VIEW_AUDIT_LOGS]: [
    UserRole.FOUNDER,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.SECURITY_OFFICER,
    UserRole.IT_ADMIN,
  ],

  // Talent features
  [FeaturePermission.VIEW_HR_PIPELINE]: [
    UserRole.FOUNDER,
    UserRole.HR_MANAGER,
    UserRole.CREDENTIALING_SPECIALIST,
  ],
  [FeaturePermission.MANAGE_CREDENTIALS]: [
    UserRole.FOUNDER,
    UserRole.HR_MANAGER,
    UserRole.CREDENTIALING_SPECIALIST,
  ],
  [FeaturePermission.MANAGE_TRAINING]: [
    UserRole.FOUNDER,
    UserRole.HR_MANAGER,
  ],
  [FeaturePermission.MANAGE_DISCIPLINE]: [
    UserRole.FOUNDER,
    UserRole.HR_MANAGER,
  ],

  // Revenue features
  [FeaturePermission.VIEW_AR_AGING]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
  ],
  [FeaturePermission.MANAGE_CLAIMS]: [
    UserRole.FOUNDER,
    UserRole.BILLING_MANAGER,
    UserRole.BILLING_CODER,
  ],
  [FeaturePermission.MANAGE_DENIALS]: [
    UserRole.FOUNDER,
    UserRole.BILLING_MANAGER,
    UserRole.RCM_ANALYST,
  ],
  [FeaturePermission.APPROVE_WRITEOFFS]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
  ],

  // Executive features
  [FeaturePermission.VIEW_REVENUE_ANALYTICS]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
  ],
  [FeaturePermission.VIEW_GROWTH_FORECAST]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
  ],
  [FeaturePermission.VIEW_RISK_DASHBOARD]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
    UserRole.COMPLIANCE_OFFICER,
  ],

  // Operations features
  [FeaturePermission.VIEW_SCHEDULE]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.CLINICAL_DIRECTOR,
  ],
  [FeaturePermission.MANAGE_SCHEDULE]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
  ],
  [FeaturePermission.VIEW_GPS_TRACKING]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.CLINICAL_DIRECTOR,
  ],
  [FeaturePermission.MANAGE_GEOFENCE]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
  ],
  [FeaturePermission.VIEW_MILEAGE]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.FINANCE_DIRECTOR,
  ],
  [FeaturePermission.APPROVE_MILEAGE]: [
    UserRole.FOUNDER,
    UserRole.FINANCE_DIRECTOR,
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
    UserRole.IT_ADMIN,
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
      isExecutive: [UserRole.FOUNDER, UserRole.FINANCE_DIRECTOR].includes(userRole),
      isClinical: [
        UserRole.CLINICAL_DIRECTOR,
        UserRole.RN_CASE_MANAGER,
        UserRole.LPN_LVN,
        UserRole.THERAPIST,
        UserRole.QIDP,
      ].includes(userRole),
      isCompliance: [UserRole.COMPLIANCE_OFFICER, UserRole.SECURITY_OFFICER].includes(userRole),
      isHR: [UserRole.HR_MANAGER, UserRole.CREDENTIALING_SPECIALIST].includes(userRole),
      isFinance: [
        UserRole.FINANCE_DIRECTOR,
        UserRole.BILLING_MANAGER,
        UserRole.RCM_ANALYST,
      ].includes(userRole),
    };
  }, [userRole]);

  return access;
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
