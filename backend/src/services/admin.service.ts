/**
 * Admin & System Service
 * Business logic for Admin & System Dashboard endpoints
 *
 * Endpoints:
 * - GET /api/admin/overview
 * - GET /api/admin/security
 */

import { pool } from '../config/database';
import { subDays, subMonths } from 'date-fns';

export class AdminService {
  /**
   * GET /api/admin/overview
   * Get system overview with users, security, and performance metrics
   *
   * @param organizationId - Organization ID
   * @returns System overview data
   */
  async getOverview(organizationId: string) {
    // Parallel query execution for performance
    const [userStats, securityStats, systemHealth, recentActivity] = await Promise.all([
      this.getUserStats(organizationId),
      this.getSecurityStats(organizationId),
      this.getSystemHealth(organizationId),
      this.getRecentActivity(organizationId, 7)
    ]);

    return {
      userStats,
      securityStats,
      systemHealth,
      recentActivity
    };
  }

  /**
   * Get user statistics
   */
  private async getUserStats(organizationId: string) {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
        COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days
      FROM users
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    const stats = result.rows[0];

    // Get breakdown by role
    const roleResult = await pool.query(
      `
      SELECT
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM users
      WHERE organization_id = $1
      GROUP BY role
      ORDER BY count DESC
      `,
      [organizationId]
    );

    return {
      totalUsers: parseInt(stats.total_users),
      activeUsers: parseInt(stats.active_users),
      inactiveUsers: parseInt(stats.inactive_users),
      suspendedUsers: parseInt(stats.suspended_users),
      activeLast7Days: parseInt(stats.active_last_7_days),
      activeLast30Days: parseInt(stats.active_last_30_days),
      byRole: roleResult.rows.map(row => ({
        role: row.role,
        total: parseInt(row.count),
        active: parseInt(row.active_count)
      }))
    };
  }

  /**
   * Get security statistics
   */
  private async getSecurityStats(organizationId: string) {
    const last30Days = subDays(new Date(), 30);

    // Failed login attempts
    const failedLoginsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = $1
        AND action = 'login_failed'
        AND created_at >= $2
      `,
      [organizationId, last30Days]
    );

    // Successful logins
    const successLoginsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = $1
        AND action = 'login_success'
        AND created_at >= $2
      `,
      [organizationId, last30Days]
    );

    // PHI access events
    const phiAccessResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = $1
        AND action LIKE 'phi_%'
        AND created_at >= $2
      `,
      [organizationId, last30Days]
    );

    // Permission changes
    const permissionChangesResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = $1
        AND action IN ('permission_granted', 'permission_revoked', 'role_changed')
        AND created_at >= $2
      `,
      [organizationId, last30Days]
    );

    // Active sessions
    const activeSessionsResult = await pool.query(
      `
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_sessions
      WHERE organization_id = $1
        AND expires_at > NOW()
        AND revoked = false
      `,
      [organizationId]
    );

    // Recent security alerts
    const alertsResult = await pool.query(
      `
      SELECT
        id,
        alert_type,
        severity,
        message,
        user_id,
        created_at
      FROM security_alerts
      WHERE organization_id = $1
        AND created_at >= $2
        AND status = 'open'
      ORDER BY severity DESC, created_at DESC
      LIMIT 10
      `,
      [organizationId, last30Days]
    );

    return {
      failedLogins: parseInt(failedLoginsResult.rows[0].count),
      successLogins: parseInt(successLoginsResult.rows[0].count),
      phiAccessEvents: parseInt(phiAccessResult.rows[0].count),
      permissionChanges: parseInt(permissionChangesResult.rows[0].count),
      activeSessions: parseInt(activeSessionsResult.rows[0].count),
      recentAlerts: alertsResult.rows.map(row => ({
        alertId: row.id,
        alertType: row.alert_type,
        severity: row.severity,
        message: row.message,
        userId: row.user_id,
        createdAt: row.created_at
      }))
    };
  }

  /**
   * Get system health metrics
   */
  private async getSystemHealth(organizationId: string) {
    // Database connection pool stats
    const dbStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount
    };

    // Recent errors
    const errorsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM error_logs
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '24 hours'
      `,
      [organizationId]
    );

    // API response times (placeholder - would integrate with monitoring service)
    const apiMetrics = {
      avgResponseTime: 145, // ms
      p95ResponseTime: 280, // ms
      p99ResponseTime: 450, // ms
      requestsLast24h: 0 // Placeholder
    };

    // Background job status
    const jobsResult = await pool.query(
      `
      SELECT
        status,
        COUNT(*) as count
      FROM background_jobs
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY status
      `,
      [organizationId]
    );

    const jobStats = {
      completed: 0,
      failed: 0,
      pending: 0,
      running: 0
    };

    jobsResult.rows.forEach(row => {
      jobStats[row.status as keyof typeof jobStats] = parseInt(row.count);
    });

    return {
      database: dbStats,
      errors24h: parseInt(errorsResult.rows[0].count),
      apiMetrics,
      backgroundJobs: jobStats
    };
  }

  /**
   * Get recent administrative activity
   */
  private async getRecentActivity(organizationId: string, days: number) {
    const startDate = subDays(new Date(), days);

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.changes,
        al.created_at,
        u.first_name,
        u.last_name,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1
        AND al.created_at >= $2
        AND al.action IN (
          'user_created', 'user_updated', 'user_deleted',
          'role_changed', 'permission_granted', 'permission_revoked',
          'setting_changed', 'integration_configured'
        )
      ORDER BY al.created_at DESC
      LIMIT 50
      `,
      [organizationId, startDate]
    );

    return result.rows.map(row => {
      let changes = {};
      try {
        changes = typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes || {};
      } catch (e) {
        changes = {};
      }

      return {
        activityId: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        changes,
        performedBy: row.first_name ? {
          name: `${row.first_name} ${row.last_name}`,
          role: row.role
        } : null,
        createdAt: row.created_at
      };
    });
  }

  /**
   * GET /api/admin/security
   * Get detailed security audit with logs, sessions, and compliance
   *
   * @param organizationId - Organization ID
   * @param days - Number of days to look back (default 30)
   * @returns Security audit data
   */
  async getSecurityAudit(organizationId: string, days: number = 30) {
    const startDate = subDays(new Date(), days);

    // Parallel query execution
    const [auditLogs, activeSessions, failedLogins, phiAccess, complianceMetrics] = await Promise.all([
      this.getAuditLogs(organizationId, startDate),
      this.getActiveSessions(organizationId),
      this.getFailedLoginAttempts(organizationId, startDate),
      this.getPHIAccessLogs(organizationId, startDate),
      this.getComplianceMetrics(organizationId)
    ]);

    return {
      auditLogs,
      activeSessions,
      failedLogins,
      phiAccess,
      complianceMetrics
    };
  }

  /**
   * Get audit logs
   */
  private async getAuditLogs(organizationId: string, startDate: Date) {
    const result = await pool.query(
      `
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.ip_address,
        al.user_agent,
        al.changes,
        al.created_at,
        u.first_name,
        u.last_name,
        u.role,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1
        AND al.created_at >= $2
      ORDER BY al.created_at DESC
      LIMIT 500
      `,
      [organizationId, startDate]
    );

    return result.rows.map(row => {
      let changes = {};
      try {
        changes = typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes || {};
      } catch (e) {
        changes = {};
      }

      return {
        logId: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        changes,
        user: row.first_name ? {
          name: `${row.first_name} ${row.last_name}`,
          role: row.role,
          email: row.email
        } : null,
        timestamp: row.created_at
      };
    });
  }

  /**
   * Get active user sessions
   */
  private async getActiveSessions(organizationId: string) {
    const result = await pool.query(
      `
      SELECT
        us.id as session_id,
        us.user_id,
        us.ip_address,
        us.user_agent,
        us.created_at,
        us.last_activity,
        us.expires_at,
        u.first_name,
        u.last_name,
        u.role,
        u.email
      FROM user_sessions us
      LEFT JOIN users u ON us.user_id = u.id
      WHERE us.organization_id = $1
        AND us.expires_at > NOW()
        AND us.revoked = false
      ORDER BY us.last_activity DESC
      LIMIT 100
      `,
      [organizationId]
    );

    return result.rows.map(row => ({
      sessionId: row.session_id,
      user: {
        id: row.user_id,
        name: `${row.first_name} ${row.last_name}`,
        role: row.role,
        email: row.email
      },
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      lastActivity: row.last_activity,
      expiresAt: row.expires_at
    }));
  }

  /**
   * Get failed login attempts
   */
  private async getFailedLoginAttempts(organizationId: string, startDate: Date) {
    const result = await pool.query(
      `
      SELECT
        al.id,
        al.ip_address,
        al.user_agent,
        al.metadata,
        al.created_at
      FROM audit_logs al
      WHERE al.organization_id = $1
        AND al.action = 'login_failed'
        AND al.created_at >= $2
      ORDER BY al.created_at DESC
      LIMIT 200
      `,
      [organizationId, startDate]
    );

    return result.rows.map(row => {
      let metadata = {};
      try {
        metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
      } catch (e) {
        metadata = {};
      }

      return {
        logId: row.id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        attemptedEmail: (metadata as any).email || null,
        failureReason: (metadata as any).reason || null,
        timestamp: row.created_at
      };
    });
  }

  /**
   * Get PHI access logs (HIPAA compliance)
   */
  private async getPHIAccessLogs(organizationId: string, startDate: Date) {
    const result = await pool.query(
      `
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        u.first_name,
        u.last_name,
        u.role,
        u.email,
        c.first_name as client_first_name,
        c.last_name as client_last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN clients c ON al.entity_id::uuid = c.id
      WHERE al.organization_id = $1
        AND al.action LIKE 'phi_%'
        AND al.created_at >= $2
      ORDER BY al.created_at DESC
      LIMIT 500
      `,
      [organizationId, startDate]
    );

    return result.rows.map(row => ({
      logId: row.id,
      action: row.action,
      entityType: row.entity_type,
      accessedBy: {
        name: `${row.first_name} ${row.last_name}`,
        role: row.role,
        email: row.email
      },
      client: row.client_first_name ? {
        name: `${row.client_first_name} ${row.client_last_name}`
      } : null,
      timestamp: row.created_at
    }));
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics(organizationId: string) {
    // HIPAA compliance checks
    const hipaaResult = await pool.query(
      `
      SELECT
        COUNT(DISTINCT user_id) as users_with_phi_access,
        COUNT(*) as total_phi_access_events
      FROM audit_logs
      WHERE organization_id = $1
        AND action LIKE 'phi_%'
        AND created_at >= NOW() - INTERVAL '30 days'
      `,
      [organizationId]
    );

    // Data retention compliance
    const retentionResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_records,
        COUNT(CASE WHEN created_at < NOW() - INTERVAL '7 years' THEN 1 END) as records_past_retention
      FROM audit_logs
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    // Password policy compliance
    const passwordResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN password_changed_at < NOW() - INTERVAL '90 days' THEN 1 END) as passwords_expired,
        COUNT(CASE WHEN mfa_enabled = true THEN 1 END) as mfa_enabled_count
      FROM users
      WHERE organization_id = $1
        AND status = 'active'
      `,
      [organizationId]
    );

    const passwordStats = passwordResult.rows[0];

    return {
      hipaa: {
        usersWithPHIAccess: parseInt(hipaaResult.rows[0].users_with_phi_access),
        phiAccessEvents30d: parseInt(hipaaResult.rows[0].total_phi_access_events)
      },
      dataRetention: {
        totalRecords: parseInt(retentionResult.rows[0].total_records),
        recordsPastRetention: parseInt(retentionResult.rows[0].records_past_retention)
      },
      passwordPolicy: {
        totalActiveUsers: parseInt(passwordStats.total_users),
        passwordsExpired: parseInt(passwordStats.passwords_expired),
        mfaEnabledCount: parseInt(passwordStats.mfa_enabled_count),
        mfaComplianceRate: passwordStats.total_users > 0
          ? Math.round((parseInt(passwordStats.mfa_enabled_count) / parseInt(passwordStats.total_users)) * 100)
          : 0
      }
    };
  }
}

export const adminService = new AdminService();
