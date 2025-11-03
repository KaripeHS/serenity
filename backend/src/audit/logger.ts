/**
 * Audit Logger for Serenity ERP
 * HIPAA-compliant audit logging with structured data and security event tracking
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('audit');

export interface AuditContext {
  userId?: string;
  organizationId?: string;
  podId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceIds?: string[];
  dataClassification?: 'public' | 'internal' | 'confidential' | 'phi';
  accessReason?: string;
}

export interface SecurityContext {
  userId?: string;
  organizationId?: string;
  podId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  blocked?: boolean;
  details?: Record<string, any>;
}

export type SecurityEvent =
  | 'authentication_failure'
  | 'authorization_failure'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'phi_access_violation'
  | 'rate_limit_exceeded'
  | 'malicious_request'
  | 'privilege_escalation'
  | 'account_lockout'
  | 'password_reset'
  | 'session_hijack_attempt'
  | 'injection_attempt'
  | 'file_upload_violation'
  | 'api_abuse';

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
  userId?: string;
  organizationId?: string;
  podId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceIds?: string[];
  dataClassification?: 'public' | 'internal' | 'confidential' | 'phi';
  accessReason?: string;
}

export interface SecurityLogEntry {
  timestamp: Date;
  event: SecurityEvent;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  organizationId?: string;
  podId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  details?: Record<string, any>;
  blocked: boolean;
}

export class AuditLogger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Log an audit event for compliance tracking
   */
  logAudit(action: string, resource: string, outcome: 'success' | 'failure', context?: AuditContext): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      action,
      resource,
      outcome,
      ...(context?.userId && { userId: context.userId }),
      ...(context?.organizationId && { organizationId: context.organizationId }),
      ...(context?.podId && { podId: context.podId }),
      ...(context?.sessionId && { sessionId: context.sessionId }),
      ...(context?.ipAddress && { ipAddress: context.ipAddress }),
      ...(context?.userAgent && { userAgent: context.userAgent }),
      ...(context?.resourceIds && { resourceIds: context.resourceIds }),
      ...(context?.dataClassification && { dataClassification: context.dataClassification }),
      ...(context?.accessReason && { accessReason: context.accessReason })
    };

    logger.info(`AUDIT: ${action} on ${resource} - ${outcome}`, {
      service: this.serviceName,
      auditEntry: entry,
      hipaaProtected: entry.dataClassification === 'phi'
    });

    // If this is a PHI access event, ensure special handling
    if (entry.dataClassification === 'phi') {
      this.logPHIAccess(action, resource, outcome, context);
    }
  }

  /**
   * Log a security event
   */
  logSecurity(event: SecurityEvent, severity: 'low' | 'medium' | 'high' | 'critical', context?: SecurityContext): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date(),
      event,
      severity,
      description: this.getSecurityEventDescription(event),
      blocked: context?.blocked || false,
      ...(context?.userId && { userId: context.userId }),
      ...(context?.organizationId && { organizationId: context.organizationId }),
      ...(context?.podId && { podId: context.podId }),
      ...(context?.sessionId && { sessionId: context.sessionId }),
      ...(context?.ipAddress && { ipAddress: context.ipAddress }),
      ...(context?.userAgent && { userAgent: context.userAgent }),
      ...(context?.details && { details: context.details })
    };

    const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    logger[logLevel](`SECURITY: ${event} - ${severity}`, {
      service: this.serviceName,
      securityEntry: entry,
      hipaaProtected: false
    });

    // For critical security events, also send to external monitoring
    if (severity === 'critical') {
      this.alertSecurityTeam(entry);
    }
  }

  /**
   * Log PHI access for HIPAA compliance
   */
  private logPHIAccess(action: string, resource: string, outcome: 'success' | 'failure', context?: AuditContext): void {
    logger.info(`PHI_ACCESS: ${action} on ${resource} - ${outcome}`, {
      service: this.serviceName,
      userId: context?.userId,
      organizationId: context?.organizationId,
      sessionId: context?.sessionId,
      ipAddress: context?.ipAddress,
      accessReason: context?.accessReason,
      resourceIds: context?.resourceIds,
      hipaaProtected: true,
      auditType: 'phi_access'
    });
  }

  /**
   * Log data access events
   */
  logDataAccess(
    tableName: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    recordIds: string[],
    context?: AuditContext
  ): void {
    this.logAudit(
      `data_${operation.toLowerCase()}`,
      `table:${tableName}`,
      'success',
      {
        ...context,
        resourceIds: recordIds,
        dataClassification: this.determineDataClassification(tableName)
      }
    );
  }

  /**
   * Log authentication events
   */
  logAuthentication(event: 'login' | 'logout' | 'login_failed', userId?: string, context?: Partial<AuditContext>): void {
    const outcome = event === 'login_failed' ? 'failure' : 'success';

    this.logAudit(
      event,
      'authentication_system',
      outcome,
      {
        ...context,
        ...(userId && { userId }),
        dataClassification: 'internal'
      }
    );

    // Log security event for failed logins
    if (event === 'login_failed') {
      this.logSecurity('authentication_failure', 'medium', {
        ...(userId && { userId }),
        ...context,
        blocked: false
      });
    }
  }

  /**
   * Log authorization events
   */
  logAuthorization(
    action: string,
    resource: string,
    granted: boolean,
    userId?: string,
    context?: Partial<AuditContext>
  ): void {
    this.logAudit(
      `authorization_${action}`,
      resource,
      granted ? 'success' : 'failure',
      {
        ...context,
        ...(userId && { userId }),
        dataClassification: 'internal'
      }
    );

    // Log security event for authorization failures
    if (!granted) {
      this.logSecurity('authorization_failure', 'medium', {
        ...(userId && { userId }),
        ...context,
        details: { action, resource },
        blocked: true
      });
    }
  }

  /**
   * Get description for security events
   */
  private getSecurityEventDescription(event: SecurityEvent): string {
    const descriptions: Record<SecurityEvent, string> = {
      'authentication_failure': 'Failed authentication attempt',
      'authorization_failure': 'Unauthorized access attempt',
      'suspicious_activity': 'Suspicious user activity detected',
      'data_breach_attempt': 'Potential data breach attempt',
      'phi_access_violation': 'Unauthorized PHI access attempt',
      'rate_limit_exceeded': 'Rate limit exceeded',
      'malicious_request': 'Malicious request detected',
      'privilege_escalation': 'Privilege escalation attempt',
      'account_lockout': 'Account locked due to security policy',
      'password_reset': 'Password reset requested',
      'session_hijack_attempt': 'Session hijacking attempt detected',
      'injection_attempt': 'SQL/Code injection attempt',
      'file_upload_violation': 'Malicious file upload attempt',
      'api_abuse': 'API abuse detected'
    };

    return descriptions[event] || 'Unknown security event';
  }

  /**
   * Determine data classification based on table name
   */
  private determineDataClassification(tableName: string): 'public' | 'internal' | 'confidential' | 'phi' {
    const phiTables = ['patients', 'medical_records', 'health_data', 'diagnoses', 'treatments', 'medications'];
    const confidentialTables = ['employees', 'payroll', 'financial_records', 'contracts'];
    const internalTables = ['audit_logs', 'system_config', 'user_sessions'];

    if (phiTables.some(table => tableName.includes(table))) {
      return 'phi';
    } else if (confidentialTables.some(table => tableName.includes(table))) {
      return 'confidential';
    } else if (internalTables.some(table => tableName.includes(table))) {
      return 'internal';
    }

    return 'internal'; // Default to internal for safety
  }

  /**
   * Generic log method
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](message, {
      service: this.serviceName,
      data
    });
  }

  /**
   * Log activity for backwards compatibility
   */
  async logActivity(activity: {
    action: string;
    resource: string;
    outcome?: 'success' | 'failure';
    userId?: string;
    organizationId?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    this.logAudit(
      activity.action,
      activity.resource,
      activity.outcome || 'success',
      {
        ...(activity.userId && { userId: activity.userId }),
        ...(activity.organizationId && { organizationId: activity.organizationId })
      }
    );
  }

  /**
   * Alert security team for critical events
   */
  private alertSecurityTeam(entry: SecurityLogEntry): void {
    // In a real implementation, this would send alerts to security monitoring systems
    logger.error('CRITICAL SECURITY ALERT', {
      service: this.serviceName,
      securityEntry: entry,
      alertType: 'security_team_notification',
      priority: 'immediate'
    });
  }
}

// Export a default instance for backward compatibility
export const auditLogger = new AuditLogger('default');