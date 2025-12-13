/**
 * Serenity Care Partners - Role-Based Access Control
 * Comprehensive role hierarchy and permissions matrix
 *
 * @version 1.0.0
 */

// ==============================================
// USER ROLES - Hierarchical Definition
// ==============================================

export enum UserRole {
    // Executive Level (Full Platform Access)
    FOUNDER = 'founder',
    CEO = 'ceo',
    CFO = 'cfo',
    COO = 'coo',

    // Administrative Level
    ADMIN = 'admin',
    IT_ADMIN = 'it_admin',

    // Finance & Billing
    FINANCE_DIRECTOR = 'finance_director',
    BILLING_MANAGER = 'billing_manager',
    RCM_ANALYST = 'rcm_analyst',
    BILLING_CODER = 'billing_coder',
    INSURANCE_MANAGER = 'insurance_manager',

    // Human Resources
    HR_DIRECTOR = 'hr_director',
    HR_MANAGER = 'hr_manager',
    RECRUITER = 'recruiter',
    CREDENTIALING_SPECIALIST = 'credentialing_specialist',

    // Clinical Leadership
    CLINICAL_DIRECTOR = 'clinical_director',
    NURSING_SUPERVISOR = 'nursing_supervisor',
    COMPLIANCE_OFFICER = 'compliance_officer',

    // Clinical Staff (Field)
    RN_CASE_MANAGER = 'rn_case_manager',
    LPN_LVN = 'lpn_lvn',
    THERAPIST = 'therapist',
    QIDP = 'qidp',

    // Operations
    OPERATIONS_MANAGER = 'operations_manager',
    POD_LEAD = 'pod_lead',
    SCHEDULER = 'scheduler',
    DISPATCHER = 'dispatcher',

    // Field Workers
    CAREGIVER = 'caregiver',
    DSP_MED = 'dsp_med',
    DSP_BASIC = 'dsp_basic',
    HHA = 'hha',
    CNA = 'cna',

    // Patient & Family
    PATIENT = 'patient',
    FAMILY_PRIMARY = 'family_primary', // Legal representative / primary contact
    FAMILY_MEMBER = 'family_member',   // Authorized family member (limited access)

    // External
    PAYER_AUDITOR = 'payer_auditor',
    SUPPORT_AGENT = 'support_agent',
}

// ==============================================
// PERMISSIONS - Granular Access Control
// ==============================================

export enum Permission {
    // Dashboard Access
    VIEW_EXECUTIVE_DASHBOARD = 'view_executive_dashboard',
    VIEW_FINANCE_DASHBOARD = 'view_finance_dashboard',
    VIEW_HR_DASHBOARD = 'view_hr_dashboard',
    VIEW_OPERATIONS_DASHBOARD = 'view_operations_dashboard',
    VIEW_CLINICAL_DASHBOARD = 'view_clinical_dashboard',
    VIEW_COMPLIANCE_DASHBOARD = 'view_compliance_dashboard',
    VIEW_BILLING_DASHBOARD = 'view_billing_dashboard',

    // User Management
    MANAGE_USERS = 'manage_users',
    VIEW_USERS = 'view_users',
    CREATE_USERS = 'create_users',
    EDIT_USER_ROLES = 'edit_user_roles',
    DEACTIVATE_USERS = 'deactivate_users',

    // Patient/Client Management
    VIEW_ALL_PATIENTS = 'view_all_patients',
    VIEW_ASSIGNED_PATIENTS = 'view_assigned_patients',
    VIEW_POD_PATIENTS = 'view_pod_patients',
    CREATE_PATIENT = 'create_patient',
    EDIT_PATIENT = 'edit_patient',
    VIEW_PHI = 'view_phi',
    EDIT_PHI = 'edit_phi',

    // Care Plan Management
    VIEW_CARE_PLANS = 'view_care_plans',
    CREATE_CARE_PLAN = 'create_care_plan',
    EDIT_CARE_PLAN = 'edit_care_plan',
    APPROVE_CARE_PLAN = 'approve_care_plan',

    // Scheduling
    VIEW_ALL_SCHEDULES = 'view_all_schedules',
    VIEW_POD_SCHEDULES = 'view_pod_schedules',
    VIEW_OWN_SCHEDULE = 'view_own_schedule',
    MANAGE_SCHEDULES = 'manage_schedules',
    APPROVE_TIME_OFF = 'approve_time_off',

    // EVV / Clock In-Out
    CLOCK_IN_OUT = 'clock_in_out',
    VIEW_EVV_RECORDS = 'view_evv_records',
    EDIT_EVV_RECORDS = 'edit_evv_records',
    OVERRIDE_GEOFENCE = 'override_geofence',

    // Finance
    VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
    MANAGE_BILLING = 'manage_billing',
    APPROVE_EXPENSES = 'approve_expenses',
    VIEW_PAYROLL = 'view_payroll',
    MANAGE_PAYROLL = 'manage_payroll',
    VIEW_OWN_EARNINGS = 'view_own_earnings',

    // HR
    VIEW_APPLICATIONS = 'view_applications',
    MANAGE_APPLICATIONS = 'manage_applications',
    VIEW_EMPLOYEE_RECORDS = 'view_employee_records',
    MANAGE_CREDENTIALS = 'manage_credentials',
    VIEW_OWN_CREDENTIALS = 'view_own_credentials',

    // Compliance & Audit
    VIEW_AUDIT_LOGS = 'view_audit_logs',
    MANAGE_COMPLIANCE = 'manage_compliance',
    BREAK_GLASS_ACCESS = 'break_glass_access',

    // Messaging
    MESSAGE_ANYONE = 'message_anyone',
    MESSAGE_CARE_TEAM = 'message_care_team',
    MESSAGE_OFFICE = 'message_office',
    VIEW_ALL_MESSAGES = 'view_all_messages',

    // Patient Portal Specific
    VIEW_OWN_CARE_NOTES = 'view_own_care_notes',
    MANAGE_CONSENT = 'manage_consent',
    VIEW_BILLING_STATEMENTS = 'view_billing_statements',

    // Family Portal Specific
    VIEW_PATIENT_SCHEDULE = 'view_patient_schedule',
    VIEW_PATIENT_UPDATES = 'view_patient_updates',
    SUBMIT_REFERRAL = 'submit_referral',
}

// ==============================================
// ROLE-PERMISSION MAPPING
// ==============================================

export const RolePermissions: Record<UserRole, Permission[]> = {
    // ========== EXECUTIVE ==========
    [UserRole.FOUNDER]: Object.values(Permission), // Full access

    [UserRole.CEO]: [
        Permission.VIEW_EXECUTIVE_DASHBOARD,
        Permission.VIEW_FINANCE_DASHBOARD,
        Permission.VIEW_HR_DASHBOARD,
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_CLINICAL_DASHBOARD,
        Permission.VIEW_COMPLIANCE_DASHBOARD,
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_USERS,
        Permission.VIEW_ALL_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.VIEW_EVV_RECORDS,
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.VIEW_PAYROLL,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MESSAGE_ANYONE,
        Permission.VIEW_ALL_MESSAGES,
    ],

    [UserRole.CFO]: [
        Permission.VIEW_EXECUTIVE_DASHBOARD,
        Permission.VIEW_FINANCE_DASHBOARD,
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.VIEW_PAYROLL,
        Permission.MANAGE_PAYROLL,
        Permission.APPROVE_EXPENSES,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.COO]: [
        Permission.VIEW_EXECUTIVE_DASHBOARD,
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_HR_DASHBOARD,
        Permission.VIEW_CLINICAL_DASHBOARD,
        Permission.VIEW_ALL_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.MANAGE_SCHEDULES,
        Permission.VIEW_EVV_RECORDS,
        Permission.EDIT_EVV_RECORDS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MESSAGE_ANYONE,
    ],

    // ========== ADMINISTRATIVE ==========
    [UserRole.ADMIN]: [
        Permission.VIEW_EXECUTIVE_DASHBOARD,
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.MANAGE_USERS,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.EDIT_USER_ROLES,
        Permission.DEACTIVATE_USERS,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.MANAGE_SCHEDULES,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.IT_ADMIN]: [
        Permission.MANAGE_USERS,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.EDIT_USER_ROLES,
        Permission.VIEW_AUDIT_LOGS,
    ],

    // ========== FINANCE & BILLING ==========
    [UserRole.FINANCE_DIRECTOR]: [
        Permission.VIEW_FINANCE_DASHBOARD,
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.MANAGE_BILLING,
        Permission.VIEW_PAYROLL,
        Permission.MANAGE_PAYROLL,
        Permission.APPROVE_EXPENSES,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.BILLING_MANAGER]: [
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.MANAGE_BILLING,
        Permission.VIEW_EVV_RECORDS,
        Permission.VIEW_ALL_PATIENTS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.RCM_ANALYST]: [
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.VIEW_EVV_RECORDS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.BILLING_CODER]: [
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_EVV_RECORDS,
        Permission.VIEW_CARE_PLANS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.INSURANCE_MANAGER]: [
        Permission.VIEW_BILLING_DASHBOARD,
        Permission.VIEW_ALL_PATIENTS,
        Permission.MESSAGE_OFFICE,
    ],

    // ========== HUMAN RESOURCES ==========
    [UserRole.HR_DIRECTOR]: [
        Permission.VIEW_HR_DASHBOARD,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.VIEW_APPLICATIONS,
        Permission.MANAGE_APPLICATIONS,
        Permission.VIEW_EMPLOYEE_RECORDS,
        Permission.MANAGE_CREDENTIALS,
        Permission.VIEW_PAYROLL,
        Permission.APPROVE_TIME_OFF,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.HR_MANAGER]: [
        Permission.VIEW_HR_DASHBOARD,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.VIEW_APPLICATIONS,
        Permission.MANAGE_APPLICATIONS,
        Permission.VIEW_EMPLOYEE_RECORDS,
        Permission.MANAGE_CREDENTIALS,
        Permission.APPROVE_TIME_OFF,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.RECRUITER]: [
        Permission.VIEW_HR_DASHBOARD,
        Permission.VIEW_APPLICATIONS,
        Permission.MANAGE_APPLICATIONS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.CREDENTIALING_SPECIALIST]: [
        Permission.VIEW_HR_DASHBOARD,
        Permission.VIEW_EMPLOYEE_RECORDS,
        Permission.MANAGE_CREDENTIALS,
        Permission.MESSAGE_OFFICE,
    ],

    // ========== CLINICAL LEADERSHIP ==========
    [UserRole.CLINICAL_DIRECTOR]: [
        Permission.VIEW_CLINICAL_DASHBOARD,
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_ALL_PATIENTS,
        Permission.VIEW_PHI,
        Permission.EDIT_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.CREATE_CARE_PLAN,
        Permission.EDIT_CARE_PLAN,
        Permission.APPROVE_CARE_PLAN,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.VIEW_EVV_RECORDS,
        Permission.VIEW_COMPLIANCE_DASHBOARD,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.NURSING_SUPERVISOR]: [
        Permission.VIEW_CLINICAL_DASHBOARD,
        Permission.VIEW_POD_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.EDIT_CARE_PLAN,
        Permission.APPROVE_CARE_PLAN,
        Permission.VIEW_POD_SCHEDULES,
        Permission.VIEW_EVV_RECORDS,
        Permission.MESSAGE_CARE_TEAM,
    ],

    [UserRole.COMPLIANCE_OFFICER]: [
        Permission.VIEW_COMPLIANCE_DASHBOARD,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_COMPLIANCE,
        Permission.VIEW_EVV_RECORDS,
        Permission.EDIT_EVV_RECORDS,
        Permission.VIEW_ALL_PATIENTS,
        Permission.VIEW_PHI,
        Permission.BREAK_GLASS_ACCESS,
        Permission.MESSAGE_ANYONE,
    ],

    // ========== CLINICAL STAFF (FIELD) ==========
    [UserRole.RN_CASE_MANAGER]: [
        Permission.VIEW_CLINICAL_DASHBOARD,
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.EDIT_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.CREATE_CARE_PLAN,
        Permission.EDIT_CARE_PLAN,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.MESSAGE_CARE_TEAM,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.LPN_LVN]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.MESSAGE_CARE_TEAM,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.THERAPIST]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.EDIT_CARE_PLAN,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.MESSAGE_CARE_TEAM,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.QIDP]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.EDIT_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.EDIT_CARE_PLAN,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.MESSAGE_CARE_TEAM,
        Permission.MESSAGE_OFFICE,
    ],

    // ========== OPERATIONS ==========
    [UserRole.OPERATIONS_MANAGER]: [
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.MANAGE_SCHEDULES,
        Permission.VIEW_EVV_RECORDS,
        Permission.EDIT_EVV_RECORDS,
        Permission.OVERRIDE_GEOFENCE,
        Permission.VIEW_ALL_PATIENTS,
        Permission.APPROVE_TIME_OFF,
        Permission.MESSAGE_ANYONE,
    ],

    [UserRole.POD_LEAD]: [
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_POD_SCHEDULES,
        Permission.MANAGE_SCHEDULES,
        Permission.VIEW_EVV_RECORDS,
        Permission.VIEW_POD_PATIENTS,
        Permission.VIEW_PHI,
        Permission.APPROVE_TIME_OFF,
        Permission.MESSAGE_CARE_TEAM,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.SCHEDULER]: [
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.MANAGE_SCHEDULES,
        Permission.VIEW_ALL_PATIENTS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.DISPATCHER]: [
        Permission.VIEW_OPERATIONS_DASHBOARD,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.MANAGE_SCHEDULES,
        Permission.OVERRIDE_GEOFENCE,
        Permission.MESSAGE_CARE_TEAM,
    ],

    // ========== FIELD WORKERS ==========
    [UserRole.CAREGIVER]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.VIEW_OWN_CREDENTIALS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.DSP_MED]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.VIEW_OWN_CREDENTIALS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.DSP_BASIC]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_CARE_PLANS,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.HHA]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.VIEW_OWN_CREDENTIALS,
        Permission.MESSAGE_OFFICE,
    ],

    [UserRole.CNA]: [
        Permission.VIEW_ASSIGNED_PATIENTS,
        Permission.VIEW_PHI,
        Permission.VIEW_CARE_PLANS,
        Permission.VIEW_OWN_SCHEDULE,
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_EARNINGS,
        Permission.VIEW_OWN_CREDENTIALS,
        Permission.MESSAGE_OFFICE,
    ],

    // ========== PATIENT & FAMILY ==========
    [UserRole.PATIENT]: [
        Permission.VIEW_OWN_SCHEDULE,
        Permission.VIEW_OWN_CARE_NOTES,
        Permission.MANAGE_CONSENT,
        Permission.VIEW_BILLING_STATEMENTS,
        Permission.MESSAGE_CARE_TEAM,
    ],

    [UserRole.FAMILY_PRIMARY]: [
        Permission.VIEW_PATIENT_SCHEDULE,
        Permission.VIEW_PATIENT_UPDATES,
        Permission.VIEW_OWN_CARE_NOTES,
        Permission.MANAGE_CONSENT,
        Permission.VIEW_BILLING_STATEMENTS,
        Permission.MESSAGE_CARE_TEAM,
        Permission.SUBMIT_REFERRAL,
    ],

    [UserRole.FAMILY_MEMBER]: [
        Permission.VIEW_PATIENT_SCHEDULE,
        Permission.VIEW_PATIENT_UPDATES,
        Permission.MESSAGE_CARE_TEAM,
    ],

    // ========== EXTERNAL ==========
    [UserRole.PAYER_AUDITOR]: [
        Permission.VIEW_EVV_RECORDS,
        Permission.VIEW_BILLING_DASHBOARD,
    ],

    [UserRole.SUPPORT_AGENT]: [
        Permission.VIEW_USERS,
        Permission.VIEW_ALL_PATIENTS,
        Permission.VIEW_ALL_SCHEDULES,
        Permission.MESSAGE_ANYONE,
    ],
};

// ==============================================
// ROLE GROUPINGS FOR ROUTING
// ==============================================

export const ExecutiveRoles = [UserRole.FOUNDER, UserRole.CEO, UserRole.CFO, UserRole.COO];
export const FinanceRoles = [UserRole.FINANCE_DIRECTOR, UserRole.BILLING_MANAGER, UserRole.RCM_ANALYST, UserRole.BILLING_CODER, UserRole.INSURANCE_MANAGER];
export const HRRoles = [UserRole.HR_DIRECTOR, UserRole.HR_MANAGER, UserRole.RECRUITER, UserRole.CREDENTIALING_SPECIALIST];
export const ClinicalLeadershipRoles = [UserRole.CLINICAL_DIRECTOR, UserRole.NURSING_SUPERVISOR, UserRole.COMPLIANCE_OFFICER];
export const ClinicalFieldRoles = [UserRole.RN_CASE_MANAGER, UserRole.LPN_LVN, UserRole.THERAPIST, UserRole.QIDP];
export const OperationsRoles = [UserRole.OPERATIONS_MANAGER, UserRole.POD_LEAD, UserRole.SCHEDULER, UserRole.DISPATCHER];
export const FieldWorkerRoles = [UserRole.CAREGIVER, UserRole.DSP_MED, UserRole.DSP_BASIC, UserRole.HHA, UserRole.CNA];
export const PatientFamilyRoles = [UserRole.PATIENT, UserRole.FAMILY_PRIMARY, UserRole.FAMILY_MEMBER];
export const AdminRoles = [UserRole.ADMIN, UserRole.IT_ADMIN];

// ==============================================
// HELPER FUNCTIONS
// ==============================================

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
    const permissions = RolePermissions[role];
    return permissions?.includes(permission) ?? false;
};

export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(role, p));
};

export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(role, p));
};

export const getRoleDisplayName = (role: string): string => {
    const displayNames: Record<string, string> = {
        founder: 'Founder',
        ceo: 'Chief Executive Officer',
        cfo: 'Chief Financial Officer',
        coo: 'Chief Operating Officer',
        admin: 'Administrator',
        it_admin: 'IT Administrator',
        finance_director: 'Finance Director',
        billing_manager: 'Billing Manager',
        rcm_analyst: 'RCM Analyst',
        billing_coder: 'Billing Coder',
        insurance_manager: 'Insurance Manager',
        hr_director: 'HR Director',
        hr_manager: 'HR Manager',
        recruiter: 'Recruiter',
        credentialing_specialist: 'Credentialing Specialist',
        clinical_director: 'Clinical Director',
        nursing_supervisor: 'Nursing Supervisor',
        compliance_officer: 'Compliance Officer',
        rn_case_manager: 'RN Case Manager',
        lpn_lvn: 'LPN/LVN',
        therapist: 'Therapist',
        qidp: 'QIDP',
        operations_manager: 'Operations Manager',
        pod_lead: 'Pod Leader',
        scheduler: 'Scheduler',
        dispatcher: 'Dispatcher',
        caregiver: 'Caregiver',
        dsp_med: 'DSP (Medication)',
        dsp_basic: 'DSP',
        hha: 'Home Health Aide',
        cna: 'CNA',
        patient: 'Patient',
        family_primary: 'Family (Primary)',
        family_member: 'Family Member',
        payer_auditor: 'Payer Auditor',
        support_agent: 'Support Agent',
    };
    return displayNames[role?.toLowerCase()] || role;
};

export const getRoleRouteGroup = (role: string): string => {
    const r = role?.toLowerCase() as UserRole;

    if (ExecutiveRoles.includes(r)) return '(executive)';
    if (FinanceRoles.includes(r)) return '(finance)';
    if (HRRoles.includes(r)) return '(hr)';
    if (ClinicalLeadershipRoles.includes(r)) return '(clinical)';
    if (OperationsRoles.includes(r)) return '(operations)';
    if (PatientFamilyRoles.includes(r)) return '(patient)';
    if (AdminRoles.includes(r)) return '(executive)'; // Admins use executive dashboard

    // Default to caregiver/field worker tabs
    return '(tabs)';
};

export const canAccessDashboard = (role: UserRole, dashboard: string): boolean => {
    const dashboardPermissions: Record<string, Permission> = {
        executive: Permission.VIEW_EXECUTIVE_DASHBOARD,
        finance: Permission.VIEW_FINANCE_DASHBOARD,
        hr: Permission.VIEW_HR_DASHBOARD,
        operations: Permission.VIEW_OPERATIONS_DASHBOARD,
        clinical: Permission.VIEW_CLINICAL_DASHBOARD,
        compliance: Permission.VIEW_COMPLIANCE_DASHBOARD,
        billing: Permission.VIEW_BILLING_DASHBOARD,
    };

    const requiredPermission = dashboardPermissions[dashboard];
    if (!requiredPermission) return false;

    return hasPermission(role, requiredPermission);
};
