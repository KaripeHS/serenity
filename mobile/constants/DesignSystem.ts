/**
 * Serenity Care Partners - Mobile Design System
 * Unified design tokens matching web application
 *
 * @version 1.0.0
 */

// ==============================================
// COLOR PALETTE (Matching Web Tailwind Config)
// ==============================================

export const Colors = {
    // Primary Brand Color - Serenity Green (Public Website Brand)
    primary: {
        50: '#E8F4EE',
        100: '#d1e9dd',
        200: '#a3d3bb',
        300: '#75bd99',
        400: '#47a777',
        500: '#0C5A3D', // Main brand color
        600: '#0a4c32',
        700: '#083e28',
        800: '#06301f',
        900: '#042215',
        DEFAULT: '#0C5A3D',
    },

    // Secondary - Sage (Light green backgrounds)
    sage: {
        25: '#F3F6F4',
        50: '#f8fbf9',
        100: '#EAF2ED',
        200: '#d4ebe1',
        300: '#c0e2d4',
        DEFAULT: '#EAF2ED',
    },

    // Accent - Champagne Gold
    champagneGold: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#e3c580',
        500: '#D6B56C', // Main accent
        600: '#c29e54',
        700: '#a6863e',
        800: '#8a6f2a',
        900: '#6e5716',
        DEFAULT: '#D6B56C',
    },

    // Interactive Blue (for buttons, links in app contexts)
    interactive: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB', // Default interactive
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
        DEFAULT: '#2563EB',
    },

    // Semantic Colors
    success: {
        50: '#ECFDF5',
        100: '#D1FAE5',
        200: '#A7F3D0',
        300: '#6EE7B7',
        400: '#34D399',
        500: '#10B981',
        600: '#059669', // Default
        700: '#047857',
        800: '#065F46',
        900: '#064E3B',
        DEFAULT: '#10B981',
    },

    warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B', // Default
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
        DEFAULT: '#F59E0B',
    },

    danger: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        200: '#FECACA',
        300: '#FCA5A5',
        400: '#F87171',
        500: '#EF4444',
        600: '#DC2626', // Default
        700: '#B91C1C',
        800: '#991B1B',
        900: '#7F1D1D',
        DEFAULT: '#EF4444',
    },

    info: {
        50: '#ECFEFF',
        100: '#CFFAFE',
        200: '#A5F3FC',
        300: '#67E8F9',
        400: '#22D3EE',
        500: '#06B6D4',
        600: '#0891B2', // Default
        700: '#0E7490',
        800: '#155E75',
        900: '#164E63',
        DEFAULT: '#06B6D4',
    },

    // Domain Entity Colors
    caregiver: {
        500: '#8B5CF6',
        600: '#7C3AED', // Default
        700: '#6D28D9',
        DEFAULT: '#7C3AED',
    },

    patient: {
        500: '#EC4899',
        600: '#DB2777', // Default
        700: '#BE185D',
        DEFAULT: '#DB2777',
    },

    pod: {
        500: '#14B8A6',
        600: '#0D9488', // Default
        700: '#0F766E',
        DEFAULT: '#0D9488',
    },

    // Neutral / Gray Scale
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },

    // Background colors
    background: {
        primary: '#FFFFFF',
        secondary: '#F8FAFC',
        tertiary: '#F1F5F9',
    },

    // Text colors
    text: {
        primary: '#111827',
        secondary: '#4B5563',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF',
    },

    // Border colors
    border: {
        light: '#E5E7EB',
        default: '#D1D5DB',
        dark: '#9CA3AF',
    },
};

// ==============================================
// TYPOGRAPHY
// ==============================================

export const Typography = {
    fontFamily: {
        sans: 'System', // iOS: SF Pro, Android: Roboto
        mono: 'monospace',
    },

    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },

    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
};

// ==============================================
// SPACING (4px base unit)
// ==============================================

export const Spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
};

// ==============================================
// BORDER RADIUS
// ==============================================

export const BorderRadius = {
    none: 0,
    sm: 2,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
};

// ==============================================
// SHADOWS
// ==============================================

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 8,
    },
};

// ==============================================
// ROLE-BASED THEME COLORS
// ==============================================

export const RoleColors: Record<string, { primary: string; secondary: string; icon: string }> = {
    founder: { primary: Colors.primary.DEFAULT, secondary: Colors.sage.DEFAULT, icon: 'shield-check' },
    admin: { primary: Colors.primary.DEFAULT, secondary: Colors.sage.DEFAULT, icon: 'cog' },
    finance_director: { primary: Colors.champagneGold.DEFAULT, secondary: Colors.champagneGold[100], icon: 'currency-dollar' },
    hr_manager: { primary: Colors.caregiver[600], secondary: '#F5F3FF', icon: 'users' },
    clinical_director: { primary: Colors.patient[600], secondary: '#FDF2F8', icon: 'heart' },
    operations: { primary: Colors.primary[400], secondary: Colors.sage[100], icon: 'chart-bar' },
    pod_lead: { primary: Colors.pod[600], secondary: '#F0FDFA', icon: 'user-group' },
    scheduler: { primary: Colors.warning[600], secondary: Colors.warning[100], icon: 'calendar' },
    caregiver: { primary: Colors.caregiver[600], secondary: '#F5F3FF', icon: 'user' },
    nurse: { primary: Colors.patient[600], secondary: '#FDF2F8', icon: 'heart' },
    patient: { primary: Colors.info[600], secondary: Colors.info[100], icon: 'user' },
    family: { primary: Colors.primary[300], secondary: Colors.sage[50], icon: 'home' },
};

// ==============================================
// USER ROLES
// ==============================================

export enum UserRole {
    FOUNDER = 'founder',
    ADMIN = 'admin',
    FINANCE_DIRECTOR = 'finance_director',
    BILLING_MANAGER = 'billing_manager',
    HR_MANAGER = 'hr_manager',
    CLINICAL_DIRECTOR = 'clinical_director',
    COMPLIANCE_OFFICER = 'compliance_officer',
    POD_LEAD = 'pod_lead',
    SCHEDULER = 'scheduler',
    RN_CASE_MANAGER = 'rn_case_manager',
    LPN_LVN = 'lpn_lvn',
    THERAPIST = 'therapist',
    QIDP = 'qidp',
    DSP_MED = 'dsp_med',
    DSP_BASIC = 'dsp_basic',
    CAREGIVER = 'caregiver',
    PATIENT = 'patient',
    FAMILY = 'family',
    IT_ADMIN = 'it_admin',
    SUPPORT_AGENT = 'support_agent',
}

// Role groupings for routing
export const ExecutiveRoles = [UserRole.FOUNDER, UserRole.ADMIN];
export const FinanceRoles = [UserRole.FINANCE_DIRECTOR, UserRole.BILLING_MANAGER];
export const HRRoles = [UserRole.HR_MANAGER];
export const ClinicalRoles = [UserRole.CLINICAL_DIRECTOR, UserRole.RN_CASE_MANAGER, UserRole.LPN_LVN, UserRole.THERAPIST, UserRole.QIDP];
export const OperationsRoles = [UserRole.POD_LEAD, UserRole.SCHEDULER, UserRole.COMPLIANCE_OFFICER];
export const FieldRoles = [UserRole.CAREGIVER, UserRole.DSP_MED, UserRole.DSP_BASIC];
export const PatientRoles = [UserRole.PATIENT, UserRole.FAMILY];

// ==============================================
// HELPERS
// ==============================================

export const getRoleDisplayName = (role: string): string => {
    const displayNames: Record<string, string> = {
        founder: 'Founder',
        admin: 'Administrator',
        finance_director: 'Finance Director',
        billing_manager: 'Billing Manager',
        hr_manager: 'HR Manager',
        clinical_director: 'Clinical Director',
        compliance_officer: 'Compliance Officer',
        pod_lead: 'Pod Leader',
        scheduler: 'Scheduler',
        rn_case_manager: 'RN Case Manager',
        lpn_lvn: 'LPN/LVN',
        therapist: 'Therapist',
        qidp: 'QIDP',
        dsp_med: 'DSP (Med)',
        dsp_basic: 'DSP',
        caregiver: 'Caregiver',
        patient: 'Patient',
        family: 'Family Member',
        it_admin: 'IT Admin',
        support_agent: 'Support',
    };
    return displayNames[role.toLowerCase()] || role;
};

export const getRoleRouteGroup = (role: string): string => {
    const r = role.toLowerCase();
    if (ExecutiveRoles.includes(r as UserRole)) return '(executive)';
    if (FinanceRoles.includes(r as UserRole)) return '(finance)';
    if (HRRoles.includes(r as UserRole)) return '(hr)';
    if (ClinicalRoles.includes(r as UserRole)) return '(clinical)';
    if (OperationsRoles.includes(r as UserRole)) return '(operations)';
    if (PatientRoles.includes(r as UserRole)) return '(patient)';
    return '(tabs)'; // Default to caregiver tabs
};
