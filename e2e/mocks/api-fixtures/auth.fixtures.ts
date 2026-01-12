import { randomUUID } from 'crypto';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    status: string;
  };
  token: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  status: string;
  lastLogin?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export const authFixtures = {
  // Default test organization
  defaultOrgId: 'org-serenity-test-001',

  // Generate tokens
  generateToken: () => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({
    sub: randomUUID(),
    iat: Date.now() / 1000,
    exp: (Date.now() / 1000) + 86400
  })).toString('base64')}.signature`,

  generateRefreshToken: () => randomUUID(),

  // User fixtures by role
  founderUser: (): MeResponse => ({
    id: 'user-founder-001',
    userId: 'user-founder-001',
    email: 'founder@test.serenitycare.com',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: 'founder',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  ceoUser: (): MeResponse => ({
    id: 'user-ceo-001',
    userId: 'user-ceo-001',
    email: 'ceo@test.serenitycare.com',
    firstName: 'John',
    lastName: 'Executive',
    role: 'ceo',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  cooUser: (): MeResponse => ({
    id: 'user-coo-001',
    userId: 'user-coo-001',
    email: 'coo@test.serenitycare.com',
    firstName: 'Emily',
    lastName: 'Operations',
    role: 'coo',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  hrManagerUser: (): MeResponse => ({
    id: 'user-hr-manager-001',
    userId: 'user-hr-manager-001',
    email: 'hr.manager@test.serenitycare.com',
    firstName: 'Lisa',
    lastName: 'Smith',
    role: 'hr_manager',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  caregiverUser: (): MeResponse => ({
    id: 'user-caregiver-001',
    userId: 'user-caregiver-001',
    email: 'maria.garcia@test.serenitycare.com',
    firstName: 'Maria',
    lastName: 'Garcia',
    role: 'caregiver',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  podLeadUser: (): MeResponse => ({
    id: 'user-podlead-001',
    userId: 'user-podlead-001',
    email: 'podlead@test.serenitycare.com',
    firstName: 'Robert',
    lastName: 'Team',
    role: 'pod_lead',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  billingManagerUser: (): MeResponse => ({
    id: 'user-billing-001',
    userId: 'user-billing-001',
    email: 'billing@test.serenitycare.com',
    firstName: 'Beth',
    lastName: 'Billing',
    role: 'billing_manager',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  complianceOfficerUser: (): MeResponse => ({
    id: 'user-compliance-001',
    userId: 'user-compliance-001',
    email: 'compliance@test.serenitycare.com',
    firstName: 'Carol',
    lastName: 'Compliance',
    role: 'compliance_officer',
    organizationId: authFixtures.defaultOrgId,
    status: 'active',
    lastLogin: new Date().toISOString()
  }),

  // Get user by role
  getUserByRole: (role: string): MeResponse => {
    switch (role) {
      case 'founder':
        return authFixtures.founderUser();
      case 'ceo':
        return authFixtures.ceoUser();
      case 'coo':
        return authFixtures.cooUser();
      case 'hr_manager':
        return authFixtures.hrManagerUser();
      case 'caregiver':
        return authFixtures.caregiverUser();
      case 'pod_lead':
        return authFixtures.podLeadUser();
      case 'billing_manager':
        return authFixtures.billingManagerUser();
      case 'compliance_officer':
        return authFixtures.complianceOfficerUser();
      default:
        return authFixtures.caregiverUser();
    }
  },

  // Login responses
  loginSuccess: (role: string = 'founder'): LoginResponse => {
    const user = authFixtures.getUserByRole(role);
    return {
      success: true,
      user,
      token: authFixtures.generateToken(),
      refreshToken: authFixtures.generateRefreshToken()
    };
  },

  loginFailure: {
    success: false,
    error: 'Invalid credentials',
    message: 'Email or password is incorrect'
  },

  // Me endpoint responses
  meSuccess: (role: string = 'founder'): MeResponse => {
    return authFixtures.getUserByRole(role);
  },

  meUnauthorized: {
    error: 'Unauthorized',
    message: 'Invalid or expired token'
  },

  // Password reset responses
  passwordResetSuccess: (): PasswordResetResponse => ({
    success: true,
    message: 'Password reset link sent to your email'
  }),

  passwordResetNotFound: {
    success: false,
    error: 'User not found',
    message: 'No account found with this email address'
  },

  // Logout response
  logoutSuccess: {
    success: true,
    message: 'Logged out successfully'
  },

  // Session expired
  sessionExpired: {
    error: 'Token expired',
    message: 'Your session has expired. Please login again.'
  }
};
