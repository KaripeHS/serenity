import { randomUUID } from 'crypto';
import { authFixtures } from './auth.fixtures';

export interface AuditLog {
  id: string;
  organizationId: string;
  eventType: string;
  userId: string;
  userName: string;
  userRole: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  outcome: string;
  ipAddress: string;
  eventData?: Record<string, any>;
  timestamp: string;
  category: string;
  status: string;
  description: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  failedActions: number;
  categories: Record<string, number>;
}

const eventTypes = [
  'USER_MANAGEMENT',
  'AUTHENTICATION',
  'PATIENT_ACCESS',
  'PHI_ACCESS',
  'SETTINGS_CHANGE',
  'SECURITY',
  'COMPLIANCE'
];

const actions = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_RESET',
  'PATIENT_VIEW',
  'PATIENT_CREATED',
  'PATIENT_UPDATED',
  'SETTINGS_UPDATED',
  'ROLE_CHANGED',
  'PERMISSION_CHANGED'
];

const categories = ['user', 'patient', 'system', 'security', 'phi_access', 'compliance'];

export const adminFixtures = {
  // Generate single audit log
  generateAuditLog: (overrides?: Partial<AuditLog>): AuditLog => {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      id: randomUUID(),
      organizationId: authFixtures.defaultOrgId,
      eventType,
      userId: randomUUID(),
      userName: 'Test User',
      userRole: 'founder',
      resourceType: 'user',
      resourceId: randomUUID(),
      action,
      outcome: 'success',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      eventData: {},
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      category,
      status: 'success',
      description: `${action} completed successfully`,
      ...overrides
    };
  },

  // Predefined audit logs
  userCreatedLog: (userId: string, createdUserId: string, createdUserEmail: string): AuditLog =>
    adminFixtures.generateAuditLog({
      eventType: 'USER_MANAGEMENT',
      userId,
      action: 'USER_CREATED',
      resourceType: 'user',
      resourceId: createdUserId,
      category: 'user',
      status: 'success',
      description: `Created user ${createdUserEmail}`,
      eventData: {
        createdUserId,
        createdUserEmail,
        createdUserRole: 'caregiver'
      }
    }),

  userLoginLog: (userId: string, userName: string): AuditLog =>
    adminFixtures.generateAuditLog({
      eventType: 'AUTHENTICATION',
      userId,
      userName,
      action: 'LOGIN',
      resourceType: 'session',
      category: 'security',
      status: 'success',
      description: `User ${userName} logged in`
    }),

  patientViewLog: (userId: string, patientId: string, patientName: string): AuditLog =>
    adminFixtures.generateAuditLog({
      eventType: 'PHI_ACCESS',
      userId,
      action: 'PATIENT_VIEW',
      resourceType: 'patient',
      resourceId: patientId,
      category: 'phi_access',
      status: 'success',
      description: `Viewed patient record for ${patientName}`,
      eventData: {
        patientId,
        patientName
      }
    }),

  settingsChangeLog: (userId: string, setting: string): AuditLog =>
    adminFixtures.generateAuditLog({
      eventType: 'SETTINGS_CHANGE',
      userId,
      action: 'SETTINGS_UPDATED',
      resourceType: 'settings',
      category: 'system',
      status: 'success',
      description: `Updated system setting: ${setting}`,
      eventData: {
        setting,
        oldValue: 'false',
        newValue: 'true'
      }
    }),

  failedLoginLog: (email: string, ipAddress: string): AuditLog =>
    adminFixtures.generateAuditLog({
      eventType: 'AUTHENTICATION',
      userId: 'anonymous',
      userName: email,
      action: 'LOGIN',
      resourceType: 'session',
      category: 'security',
      status: 'failure',
      outcome: 'failure',
      description: `Failed login attempt for ${email}`,
      ipAddress,
      eventData: {
        email,
        reason: 'Invalid credentials'
      }
    }),

  // Generate lists
  recentAuditLogs: (count: number = 50): AuditLog[] => {
    return Array.from({ length: count }, (_, i) => {
      const hoursAgo = Math.floor(Math.random() * 168); // Within last week
      return adminFixtures.generateAuditLog({
        timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
      });
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // Audit stats
  auditStats: (): AuditStats => ({
    totalLogs: 1547,
    todayLogs: 87,
    failedActions: 12,
    categories: {
      user: 456,
      patient: 623,
      system: 234,
      security: 145,
      phi_access: 89
    }
  }),

  // API Response generators
  getAuditLogsResponse: (params?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    category?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): { success: boolean; logs: AuditLog[]; total: number } => {
    let logs = adminFixtures.recentAuditLogs(500);

    if (params?.eventType) {
      logs = logs.filter(log => log.eventType === params.eventType);
    }

    if (params?.category) {
      logs = logs.filter(log => log.category === params.category);
    }

    if (params?.userId) {
      logs = logs.filter(log => log.userId === params.userId);
    }

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;

    return {
      success: true,
      logs: logs.slice(offset, offset + limit),
      total: logs.length
    };
  },

  getAuditStatsResponse: (): { success: boolean; stats: AuditStats } => ({
    success: true,
    stats: adminFixtures.auditStats()
  }),

  // Error responses
  unauthorizedError: {
    error: 'Unauthorized',
    message: 'You do not have permission to access audit logs'
  }
};
