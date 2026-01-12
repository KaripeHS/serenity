import { randomUUID } from 'crypto';
import { authFixtures } from './auth.fixtures';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicalRole?: string;
  status: string;
  isActive: boolean;
  lastLogin?: string;
  podId?: string;
  podName?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStats {
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  activeLastWeek: number;
  activeLastMonth: number;
  newThisMonth: number;
  totalRoles: number;
  roleDistribution: Array<{ role: string; count: string }>;
}

export interface UserActivity {
  id: string;
  action: string;
  resourceType: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
}

const roles = [
  'founder', 'ceo', 'coo', 'cfo',
  'hr_manager', 'hr_director',
  'caregiver', 'pod_lead', 'nurse',
  'billing_manager', 'compliance_officer'
];

const firstNames = ['John', 'Maria', 'Sarah', 'Michael', 'Jennifer', 'Robert', 'Lisa', 'David', 'Emily', 'James'];
const lastNames = ['Smith', 'Garcia', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'];

export const userFixtures = {
  // Generate single user
  generateUser: (overrides?: Partial<User>): User => ({
    id: randomUUID(),
    email: `${Math.random().toString(36).substring(7)}@test.serenitycare.com`,
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    role: 'caregiver',
    status: 'active',
    isActive: true,
    organizationId: authFixtures.defaultOrgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  // Generate user by role
  founder: (): User => userFixtures.generateUser({
    id: 'user-founder-001',
    email: 'founder@test.serenitycare.com',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: 'founder'
  }),

  ceo: (): User => userFixtures.generateUser({
    id: 'user-ceo-001',
    email: 'ceo@test.serenitycare.com',
    firstName: 'John',
    lastName: 'Executive',
    role: 'ceo'
  }),

  coo: (): User => userFixtures.generateUser({
    id: 'user-coo-001',
    email: 'coo@test.serenitycare.com',
    firstName: 'Emily',
    lastName: 'Operations',
    role: 'coo'
  }),

  hrManager: (): User => userFixtures.generateUser({
    id: 'user-hr-manager-001',
    email: 'hr.manager@test.serenitycare.com',
    firstName: 'Lisa',
    lastName: 'Smith',
    role: 'hr_manager'
  }),

  caregiver: (): User => userFixtures.generateUser({
    role: 'caregiver',
    clinicalRole: 'aide'
  }),

  nurse: (): User => userFixtures.generateUser({
    role: 'nurse',
    clinicalRole: 'rn'
  }),

  podLead: (): User => userFixtures.generateUser({
    role: 'pod_lead'
  }),

  // Generate list of users
  activeUsers: (count: number = 20): User[] => {
    return Array.from({ length: count }, (_, i) => {
      const role = roles[i % roles.length];
      return userFixtures.generateUser({
        role,
        status: 'active',
        isActive: true,
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    });
  },

  inactiveUsers: (count: number = 5): User[] => {
    return Array.from({ length: count }, () =>
      userFixtures.generateUser({
        status: 'inactive',
        isActive: false,
        lastLogin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      })
    );
  },

  // API Response generators
  getUsersResponse: (params?: { role?: string; status?: string; search?: string }): User[] => {
    let users = userFixtures.activeUsers(50);

    if (params?.role) {
      users = users.filter(u => u.role === params.role);
    }

    if (params?.status) {
      users = users.filter(u => u.status === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search)
      );
    }

    // Return array directly to match frontend expectation
    return users.slice(0, 20);
  },

  createUserResponse: (userData: Partial<User>): User => {
    return userFixtures.generateUser(userData);
  },

  updateUserResponse: (userId: string, updates: Partial<User>): { success: boolean; user: User } => ({
    success: true,
    user: {
      id: userId,
      email: 'existing.user@test.serenitycare.com',
      firstName: 'Existing',
      lastName: 'User',
      role: 'caregiver',
      status: 'active',
      isActive: true,
      organizationId: authFixtures.defaultOrgId,
      ...updates
    }
  }),

  deleteUserResponse: { success: true, message: 'User deleted successfully' },

  // User stats
  getUserStatsResponse: (): { success: boolean; stats: UserStats } => ({
    success: true,
    stats: {
      activeUsers: 145,
      inactiveUsers: 23,
      suspendedUsers: 5,
      activeLastWeek: 132,
      activeLastMonth: 140,
      newThisMonth: 12,
      totalRoles: 11,
      roleDistribution: [
        { role: 'caregiver', count: '85' },
        { role: 'nurse', count: '25' },
        { role: 'pod_lead', count: '15' },
        { role: 'hr_manager', count: '8' },
        { role: 'billing_manager', count: '5' },
        { role: 'compliance_officer', count: '3' },
        { role: 'coo', count: '1' },
        { role: 'cfo', count: '1' },
        { role: 'ceo', count: '1' },
        { role: 'founder', count: '1' }
      ]
    }
  }),

  // User activity
  getUserActivityResponse: (userId: string): { success: boolean; activities: UserActivity[] } => ({
    success: true,
    activities: Array.from({ length: 10 }, (_, i) => ({
      id: randomUUID(),
      action: ['LOGIN', 'LOGOUT', 'VIEW_PATIENT', 'UPDATE_PROFILE', 'CREATE_VISIT'][i % 5],
      resourceType: 'user',
      details: `Activity ${i + 1}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      createdAt: new Date(Date.now() - i * 3600000).toISOString()
    }))
  }),

  // User sessions
  getUserSessionsResponse: (userId: string): { success: boolean; sessions: UserSession[] } => ({
    success: true,
    sessions: Array.from({ length: 3 }, (_, i) => ({
      id: randomUUID(),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      lastActivity: new Date(Date.now() - i * 3600000).toISOString(),
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }))
  }),

  terminateSessionResponse: { success: true, message: 'Session terminated successfully' },
  terminateAllSessionsResponse: { success: true, message: 'All sessions terminated successfully' },

  resetPasswordResponse: { success: true, message: 'Password reset email sent', tempPassword: 'TempPass123!' },

  activateUserResponse: (userId: string): { success: boolean; user: User } => ({
    success: true,
    user: userFixtures.generateUser({ id: userId, status: 'active', isActive: true })
  }),

  deactivateUserResponse: (userId: string): { success: boolean; user: User } => ({
    success: true,
    user: userFixtures.generateUser({ id: userId, status: 'inactive', isActive: false })
  }),

  bulkUpdateResponse: (count: number): { success: boolean; message: string; updatedCount: number } => ({
    success: true,
    message: `${count} users updated successfully`,
    updatedCount: count
  }),

  // Error responses
  validationError: (field: string) => ({
    error: 'Validation failed',
    message: `${field} is required`,
    details: { [field]: `${field} is required` }
  }),

  duplicateEmailError: {
    error: 'Duplicate email',
    message: 'Email already exists'
  },

  userNotFoundError: {
    error: 'Not found',
    message: 'User not found'
  },

  unauthorizedError: {
    error: 'Unauthorized',
    message: 'You do not have permission to perform this action'
  }
};
