import { Router, Response, NextFunction } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import { UserRole } from '../../../auth/access-control';

const router = Router();
const db = getDbClient();

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// POD MANAGEMENT
// ============================================================================

/**
 * GET /api/console/admin/pods
 * List all pods
 */
router.get('/pods', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.code,
        p.name,
        p.city,
        p.state,
        p.status,
        p.capacity,
        p.team_lead_id,
        p.created_at,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_caregivers,
        COUNT(DISTINCT cl.id) FILTER (WHERE cl.status = 'active') as active_clients,
        u.first_name || ' ' || u.last_name as team_lead_name
      FROM pods p
      LEFT JOIN users c ON c.pod_id = p.id AND c.role IN ('caregiver', 'dsp_basic', 'dsp_med', 'exposed_caregiver')
      LEFT JOIN clients cl ON cl.pod_id = p.id
      LEFT JOIN users u ON u.id = p.team_lead_id
      WHERE p.organization_id = $1
      GROUP BY p.id, u.first_name, u.last_name
      ORDER BY p.code
    `, [req.user?.organizationId]);

    // Map to camelCase
    const pods = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      city: row.city,
      state: row.state,
      status: row.status,
      capacity: row.capacity,
      activeCaregivers: parseInt(row.active_caregivers),
      activeClients: parseInt(row.active_clients),
      teamLeadId: row.team_lead_id,
      teamLeadName: row.team_lead_name,
      evvComplianceRate: 0, // Placeholder calculation
      createdAt: row.created_at
    }));

    res.json(pods);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/pods
 * Create new pod
 */
router.post('/pods', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { code, name, city, state, capacity, teamLeadId } = req.body;

    if (!code || !name || !city || !state || !capacity) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const result = await db.query(`
      INSERT INTO pods (code, name, city, state, capacity, team_lead_id, organization_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [code, name, city, state, capacity, teamLeadId, req.user?.organizationId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/admin/pods/:podId
 * Update pod
 */
router.put('/pods/:podId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.params;
    const { name, city, state, capacity, teamLeadId, status } = req.body;

    const result = await db.query(`
      UPDATE pods 
      SET name = $1, city = $2, state = $3, capacity = $4, team_lead_id = $5, status = $6
      WHERE id = $7 AND organization_id = $8
      RETURNING *
    `, [name, city, state, capacity, teamLeadId, status, podId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Pod');
    }

    res.json({ success: true, podId, pod: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/admin/pods/:podId
 * Delete pod (soft delete)
 */
router.delete('/pods/:podId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.params;

    await db.query(`
      UPDATE pods SET status = 'inactive', deleted_at = NOW()
      WHERE id = $1 AND organization_id = $2
    `, [podId, req.user?.organizationId]);

    res.json({ success: true, podId });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/console/admin/users
 * List all users with real DB data
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Determine sort order
    const { sort, order, role, search } = req.query;

    let query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.clinical_role,
        u.status,
        u.last_login,
        u.created_at,
        CASE WHEN u.status = 'active' THEN true ELSE false END as is_active,
        upm.pod_id,
        p.name as pod_name
      FROM users u
      LEFT JOIN user_pod_memberships upm ON u.id = upm.user_id AND upm.is_primary = true
      LEFT JOIN pods p ON upm.pod_id = p.id
      WHERE u.organization_id = $1
    `;

    const params: any[] = [req.user?.organizationId];
    let paramIndex = 2;

    if (role) {
      query += ` AND u.role = $${paramIndex++}`;
      params.push(role);
    }

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Default sort
    query += ` ORDER BY u.last_name ASC, u.first_name ASC`;

    const result = await db.query(query, params);

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      clinicalRole: row.clinical_role,
      status: row.status, // Already a string: 'active', 'inactive', 'suspended', 'pending'
      isActive: row.is_active, // Boolean field
      lastLogin: row.last_login,
      podId: row.pod_id,
      podName: row.pod_name
    }));

    res.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/users
 * Create new user - Delegating to simple DB insert for now, should ideally use HRService
 */
router.post('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, role, podId, clinicalRole } = req.body;

    if (!email || !firstName || !lastName || !role) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    // Using simple query for prototype, assuming users table structure from schema
    // Use 'status' column instead of 'is_active' for compatibility with production DB
    const result = await db.query(`
       INSERT INTO users (organization_id, email, first_name, last_name, role, clinical_role, status, pod_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, clinical_role, status, created_at
     `, [req.user?.organizationId, email, firstName, lastName, role, clinicalRole || null, podId || null]);

    const newUser = result.rows[0];

    // Log the user creation to audit log
    try {
      await db.query(`
        INSERT INTO audit_log (
          organization_id,
          event_type,
          user_id,
          resource_type,
          resource_id,
          action,
          outcome,
          ip_address,
          event_data,
          timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9, NOW())
      `, [
        req.user?.organizationId,
        'USER_MANAGEMENT',
        req.user?.userId,  // Use userId instead of id
        'user',
        newUser.id,
        'USER_CREATED',
        'success',
        req.ip || '0.0.0.0',
        JSON.stringify({
          createdUserId: newUser.id,
          createdUserEmail: email,
          createdUserRole: role,
          createdByUserId: req.user?.userId,
          createdByRole: req.user?.role
        })
      ]);
    } catch (auditError) {
      console.error('Failed to write audit log for user creation:', auditError);
      // Don't fail the request if audit logging fails
    }

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/admin/users/:userId
 * Update user details
 */
router.put('/users/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, role, isActive, podId } = req.body;

    const result = await db.query(`
      UPDATE users
      SET first_name = COALESCE($1, first_name), 
          last_name = COALESCE($2, last_name), 
          role = COALESCE($3, role), 
          is_active = COALESCE($4, is_active),
          pod_id = COALESCE($5, pod_id),
          updated_at = NOW()
      WHERE id = $6 AND organization_id = $7
      RETURNING id, first_name, last_name, role, is_active
    `, [firstName, lastName, role, isActive, podId, userId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('User');
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/admin/users/:userId/role
 * Change user role specifically
 */
router.put('/users/:userId/role', requireRole(UserRole.IT_ADMIN, UserRole.HR_MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role, clinicalRole } = req.body;

    if (!role) {
      throw ApiErrors.badRequest('Role is required');
    }

    // Also validdate role against UserRole enum if needed

    const result = await db.query(`
      UPDATE users 
      SET role = $1, 
          clinical_role = $2,
          updated_at = NOW() 
      WHERE id = $3 AND organization_id = $4
      RETURNING id, role, clinical_role
    `, [role, clinicalRole || null, userId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('User');
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POD ASSIGNMENTS
// ============================================================================

/**
 * POST /api/console/admin/pod-assignments
 * Assign user to pod
 */
router.post('/pod-assignments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, podId, role, accessLevel, expiresAt } = req.body;

    if (!userId || !podId || !role) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    // TODO: Create pod assignment in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   INSERT INTO pod_memberships (user_id, pod_id, role, access_level, expires_at, is_primary)
    //   VALUES ($1, $2, $3, $4, $5, false)
    //   ON CONFLICT (user_id, pod_id) DO UPDATE
    //   SET role = EXCLUDED.role, access_level = EXCLUDED.access_level, expires_at = EXCLUDED.expires_at
    // `, [userId, podId, role, accessLevel || 'standard', expiresAt]);

    res.json({ success: true, userId, podId });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/admin/pod-assignments/:userId/:podId
 * Remove user from pod
 */
router.delete('/pod-assignments/:userId/:podId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, podId } = req.params;

    // TODO: Delete pod assignment
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   DELETE FROM pod_memberships WHERE user_id = $1 AND pod_id = $2
    // `, [userId, podId]);

    res.json({ success: true, userId, podId });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// JUST-IN-TIME (JIT) ACCESS
// ============================================================================

/**
 * GET /api/console/admin/jit-grants
 * List JIT access grants
 */
router.get('/jit-grants', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     j.id,
    //     j.user_id,
    //     u.first_name || ' ' || u.last_name as user_name,
    //     j.permissions,
    //     j.justification,
    //     j.emergency_type,
    //     j.duration_minutes as duration,
    //     j.granted_at,
    //     j.expires_at,
    //     j.status,
    //     j.usage_count
    //   FROM jit_access_grants j
    //   JOIN users u ON u.id = j.user_id
    //   WHERE j.organization_id = $1
    //     AND ($2::text IS NULL OR j.status = $2)
    //   ORDER BY j.granted_at DESC
    //   LIMIT 50
    // `, [req.user.organizationId, status]);

    // Mock data
    const grants = [
      {
        id: 'jit-001',
        userId: 'user-003',
        userName: 'Jessica Martinez',
        permissions: ['billing:edit', 'claims:submit'],
        justification: 'Emergency claim submission for Medicare deadline',
        emergencyType: 'billing_deadline',
        duration: 240, // minutes
        grantedAt: new Date('2025-11-03T06:00:00'),
        expiresAt: new Date('2025-11-03T10:00:00'),
        status: 'active',
        usageCount: 3
      },
      {
        id: 'jit-002',
        userId: 'user-004',
        userName: 'Admin User',
        permissions: ['users:manage', 'pods:configure'],
        justification: 'Onboarding new pod lead',
        emergencyType: null,
        duration: 120,
        grantedAt: new Date('2025-11-02T14:00:00'),
        expiresAt: new Date('2025-11-02T16:00:00'),
        status: 'expired',
        usageCount: 7
      }
    ];

    const filtered = status ? grants.filter(g => g.status === status) : grants;
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/jit-grants
 * Grant JIT access
 */
router.post('/jit-grants', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, permissions, justification, emergencyType, durationMinutes } = req.body;

    if (!userId || !permissions || !justification || !durationMinutes) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60000);

    // TODO: Create JIT grant in database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   INSERT INTO jit_access_grants (
    //     user_id, permissions, justification, emergency_type,
    //     duration_minutes, granted_at, expires_at, granted_by,
    //     organization_id, status
    //   )
    //   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
    //   RETURNING *
    // `, [userId, permissions, justification, emergencyType, durationMinutes, now, expiresAt, req.user.id, req.user.organizationId]);

    const grant = {
      id: `jit-${Date.now()}`,
      userId,
      permissions,
      justification,
      emergencyType,
      duration: durationMinutes,
      grantedAt: now,
      expiresAt,
      status: 'active',
      usageCount: 0
    };

    res.status(201).json(grant);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/jit-grants/:grantId/revoke
 * Revoke JIT access
 */
router.post('/jit-grants/:grantId/revoke', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { grantId } = req.params;
    const { reason } = req.body;

    // TODO: Revoke in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE jit_access_grants
    //   SET status = 'revoked', revoked_at = NOW(), revoked_by = $1, revocation_reason = $2
    //   WHERE id = $3 AND organization_id = $4
    // `, [req.user.id, reason, grantId, req.user.organizationId]);

    res.json({ success: true, grantId });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// BREAK GLASS ACCESS
// ============================================================================

/**
 * GET /api/console/admin/break-glass
 * List break glass access events
 */
router.get('/break-glass', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     bg.id,
    //     bg.user_id,
    //     u.first_name || ' ' || u.last_name as user_name,
    //     bg.emergency_type,
    //     bg.severity,
    //     bg.description,
    //     bg.permissions_granted,
    //     bg.activated_at,
    //     bg.expires_at,
    //     bg.compliance_review_required
    //   FROM break_glass_access bg
    //   JOIN users u ON u.id = bg.user_id
    //   WHERE bg.organization_id = $1
    //     AND bg.expires_at > NOW()
    //   ORDER BY bg.activated_at DESC
    // `, [req.user.organizationId]);

    // Mock data
    const breakGlassEvents = [
      {
        id: 'bg-001',
        userId: 'user-001',
        userName: 'Sarah Johnson',
        emergencyType: 'patient_safety',
        severity: 'high',
        description: 'Patient fall incident - immediate access to medical records required',
        permissionsGranted: ['phi:read', 'phi:write', 'incident:create'],
        activatedAt: new Date('2025-11-03T05:30:00'),
        expiresAt: new Date('2025-11-03T11:30:00'),
        complianceReviewRequired: true
      }
    ];

    res.json(breakGlassEvents);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/break-glass
 * Activate break glass access
 */
router.post('/break-glass', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { emergencyType, severity, description, permissions } = req.body;

    if (!emergencyType || !severity || !description || !permissions) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 6 * 60 * 60000); // 6 hours

    // TODO: Activate break glass in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   INSERT INTO break_glass_access (
    //     user_id, emergency_type, severity, description,
    //     permissions_granted, activated_at, expires_at,
    //     organization_id, compliance_review_required
    //   )
    //   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    // `, [req.user.id, emergencyType, severity, description, permissions, now, expiresAt, req.user.organizationId]);

    res.status(201).json({
      success: true,
      message: 'Break glass access activated',
      expiresAt,
      complianceReviewRequired: true
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SEGREGATION OF DUTIES (SOD) VIOLATIONS
// ============================================================================

/**
 * GET /api/console/admin/sod-violations
 * List SOD violations
 */
router.get('/sod-violations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     s.id,
    //     s.user_id,
    //     u.first_name || ' ' || u.last_name as user_name,
    //     s.violation_type,
    //     s.description,
    //     s.permissions_involved,
    //     s.severity,
    //     s.status,
    //     s.detected_at
    //   FROM sod_violations s
    //   JOIN users u ON u.id = s.user_id
    //   WHERE s.organization_id = $1
    //     AND ($2::text IS NULL OR s.status = $2)
    //   ORDER BY s.severity DESC, s.detected_at DESC
    // `, [req.user.organizationId, status]);

    // Mock data
    const violations = [
      {
        id: 'sod-001',
        userId: 'user-002',
        userName: 'Michael Chen',
        violationType: 'billing_approval_conflict',
        description: 'User has both billing submission and approval permissions',
        permissionsInvolved: ['billing:submit', 'billing:approve'],
        severity: 'medium',
        status: 'open',
        detectedAt: new Date('2025-11-01T10:00:00')
      },
      {
        id: 'sod-002',
        userId: 'user-004',
        userName: 'Admin User',
        violationType: 'user_management_conflict',
        description: 'User can create and approve user accounts',
        permissionsInvolved: ['users:create', 'users:approve'],
        severity: 'high',
        status: 'investigating',
        detectedAt: new Date('2025-10-28T14:30:00')
      }
    ];

    const filtered = status ? violations.filter(v => v.status === status) : violations;
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/admin/sod-violations/:violationId
 * Update SOD violation status
 */
router.put('/sod-violations/:violationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { violationId } = req.params;
    const { status, resolution } = req.body;

    // TODO: Update in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE sod_violations
    //   SET status = $1, resolution = $2, resolved_at = NOW(), resolved_by = $3
    //   WHERE id = $4 AND organization_id = $5
    // `, [status, resolution, req.user.id, violationId, req.user.organizationId]);

    res.json({ success: true, violationId });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SECURITY METRICS
// ============================================================================

/**
 * GET /api/console/admin/security-metrics
 * Get security and compliance metrics
 */
router.get('/security-metrics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Calculate from database
    // const db = DatabaseClient.getInstance();
    // const metrics = await db.query(`
    //   SELECT
    //     (SELECT COUNT(*) FROM users WHERE organization_id = $1 AND status = 'active') as total_users,
    //     (SELECT COUNT(*) FROM jit_access_grants WHERE organization_id = $1 AND status = 'active') as active_jit_grants,
    //     (SELECT COUNT(*) FROM break_glass_access WHERE organization_id = $1 AND expires_at > NOW()) as active_break_glass,
    //     (SELECT COUNT(*) FROM sod_violations WHERE organization_id = $1 AND status = 'open') as open_sod_violations,
    //     (SELECT COUNT(*) FROM audit_logs WHERE organization_id = $1 AND resource_type = 'phi' AND created_at >= NOW() - INTERVAL '24 hours') as phi_access_events,
    //     (SELECT COUNT(*) FROM failed_logins WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '24 hours') as failed_login_attempts
    // `, [req.user.organizationId]);

    // Mock data
    const metrics = {
      totalUsers: 32,
      activeJITGrants: 1,
      activeBreakGlass: 1,
      openSODViolations: 2,
      complianceScore: 94.5,
      phiAccessEvents: 127,
      failedLoginAttempts: 3
    };

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COMPREHENSIVE USER MANAGEMENT
// ============================================================================

/**
 * POST /api/console/admin/users/:userId/reset-password
 * Reset user password and send email
 */
router.post('/users/:userId/reset-password', requireRole(UserRole.IT_ADMIN, UserRole.HR_MANAGER, UserRole.CEO), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { sendEmail = true } = req.body;

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update password and force reset on next login
    const result = await db.query(`
      UPDATE users
      SET password_hash = $1,
          password_reset_required = true,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING id, email, first_name, last_name
    `, [hashedPassword, userId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('User');
    }

    const user = result.rows[0];

    // TODO: Send email with temp password
    if (sendEmail) {
      // await emailService.sendPasswordReset(user.email, tempPassword);
      console.log(`Password reset for ${user.email}: ${tempPassword}`);
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword: sendEmail ? undefined : tempPassword // Only return if not sending email
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/users/:userId/activate
 * Activate user account
 */
router.post('/users/:userId/activate', requireRole(UserRole.IT_ADMIN, UserRole.HR_MANAGER, UserRole.CEO), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const result = await db.query(`
      UPDATE users
      SET status = 'active',
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING id, email, first_name, last_name, status
    `, [userId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('User');
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/users/:userId/deactivate
 * Deactivate user account
 */
router.post('/users/:userId/deactivate', requireRole(UserRole.IT_ADMIN, UserRole.HR_MANAGER, UserRole.CEO), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await db.query(`
      UPDATE users
      SET status = 'inactive',
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING id, email, first_name, last_name, status
    `, [userId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('User');
    }

    // TODO: Log deactivation reason in audit table
    // await db.query(`
    //   INSERT INTO user_audit_log (user_id, action, reason, performed_by, created_at)
    //   VALUES ($1, 'deactivate', $2, $3, NOW())
    // `, [userId, reason, req.user?.id]);

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/admin/users/:userId
 * Soft delete user (archive)
 */
router.delete('/users/:userId', requireRole(UserRole.IT_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Soft delete by setting deleted_at timestamp
    const result = await db.query(`
      UPDATE users
      SET status = 'archived',
          deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING id
    `, [userId, req.user?.organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('User');
    }

    res.json({ success: true, message: 'User archived successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/admin/users/:userId/activity
 * Get user activity log
 */
router.get('/users/:userId/activity', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // TODO: Query actual audit log table
    // const result = await db.query(`
    //   SELECT
    //     action,
    //     resource_type,
    //     resource_id,
    //     details,
    //     ip_address,
    //     user_agent,
    //     created_at
    //   FROM audit_logs
    //   WHERE user_id = $1 AND organization_id = $2
    //   ORDER BY created_at DESC
    //   LIMIT $3 OFFSET $4
    // `, [userId, req.user?.organizationId, limit, offset]);

    // Mock data for now
    const activities = [
      {
        id: '1',
        action: 'login',
        resourceType: 'auth',
        details: 'Successful login',
        ipAddress: '192.168.1.100',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({ success: true, activities });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/admin/users/:userId/sessions
 * Get active sessions for user
 */
router.get('/users/:userId/sessions', requireRole(UserRole.IT_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // TODO: Query session table
    // const result = await db.query(`
    //   SELECT
    //     id,
    //     ip_address,
    //     user_agent,
    //     last_activity,
    //     created_at
    //   FROM user_sessions
    //   WHERE user_id = $1 AND organization_id = $2 AND expires_at > NOW()
    //   ORDER BY last_activity DESC
    // `, [userId, req.user?.organizationId]);

    const sessions = [];

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/admin/users/:userId/sessions/:sessionId
 * Terminate a specific user session
 */
router.delete('/users/:userId/sessions/:sessionId', requireRole(UserRole.IT_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = req.params;

    // TODO: Delete session from database
    // await db.query(`
    //   DELETE FROM user_sessions
    //   WHERE id = $1 AND user_id = $2 AND organization_id = $3
    // `, [sessionId, userId, req.user?.organizationId]);

    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/users/:userId/sessions/terminate-all
 * Terminate all sessions for a user
 */
router.post('/users/:userId/sessions/terminate-all', requireRole(UserRole.IT_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // TODO: Delete all sessions
    // await db.query(`
    //   DELETE FROM user_sessions
    //   WHERE user_id = $1 AND organization_id = $2
    // `, [userId, req.user?.organizationId]);

    res.json({ success: true, message: 'All sessions terminated' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/admin/users/bulk-update
 * Bulk update users
 */
router.post('/users/bulk-update', requireRole(UserRole.IT_ADMIN, UserRole.HR_MANAGER, UserRole.CEO), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw ApiErrors.badRequest('userIds array is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw ApiErrors.badRequest('updates object is required');
    }

    const allowedFields = ['role', 'status', 'clinical_role'];
    const setStatements: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setStatements.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setStatements.length === 0) {
      throw ApiErrors.badRequest('No valid fields to update');
    }

    // Add updated_at
    setStatements.push(`updated_at = NOW()`);

    // Add userIds and organizationId to params
    params.push(userIds);
    params.push(req.user?.organizationId);

    const query = `
      UPDATE users
      SET ${setStatements.join(', ')}
      WHERE id = ANY($${paramIndex}) AND organization_id = $${paramIndex + 1}
      RETURNING id
    `;

    const result = await db.query(query, params);

    res.json({
      success: true,
      message: `Updated ${result.rowCount} users`,
      updatedCount: result.rowCount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/admin/users/export
 * Export users to CSV
 */
router.get('/users/export', requireRole(UserRole.IT_ADMIN, UserRole.HR_MANAGER, UserRole.CEO), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role, status, podId } = req.query;

    let query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.clinical_role,
        u.status,
        u.phone,
        u.created_at,
        u.last_login,
        p.name as pod_name
      FROM users u
      LEFT JOIN user_pod_memberships upm ON u.id = upm.user_id AND upm.is_primary = true
      LEFT JOIN pods p ON upm.pod_id = p.id
      WHERE u.organization_id = $1
    `;

    const params: any[] = [req.user?.organizationId];
    let paramIndex = 2;

    if (role) {
      query += ` AND u.role = $${paramIndex++}`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.status = $${paramIndex++}`;
      params.push(status);
    }

    if (podId) {
      query += ` AND upm.pod_id = $${paramIndex++}`;
      params.push(podId);
    }

    query += ` ORDER BY u.last_name, u.first_name`;

    const result = await db.query(query, params);

    // Convert to CSV
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Clinical Role', 'Status', 'Phone', 'Pod', 'Created At', 'Last Login'];
    const csvRows = [headers.join(',')];

    result.rows.forEach(row => {
      const values = [
        row.id,
        row.email,
        row.first_name,
        row.last_name,
        row.role,
        row.clinical_role || '',
        row.status,
        row.phone || '',
        row.pod_name || '',
        row.created_at,
        row.last_login || ''
      ];
      csvRows.push(values.map(v => `"${v}"`).join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/admin/users/stats
 * Get user statistics
 */
router.get('/users/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_last_week,
        COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as active_last_month,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(DISTINCT role) as total_roles
      FROM users
      WHERE organization_id = $1 AND status != 'archived'
    `, [req.user?.organizationId]);

    const stats = result.rows[0];

    // Get role distribution
    const roleResult = await db.query(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE organization_id = $1 AND status != 'archived'
      GROUP BY role
      ORDER BY count DESC
    `, [req.user?.organizationId]);

    res.json({
      success: true,
      stats: {
        activeUsers: parseInt(stats.active_users),
        inactiveUsers: parseInt(stats.inactive_users),
        suspendedUsers: parseInt(stats.suspended_users),
        activeLastWeek: parseInt(stats.active_last_week),
        activeLastMonth: parseInt(stats.active_last_month),
        newThisMonth: parseInt(stats.new_this_month),
        totalRoles: parseInt(stats.total_roles),
        roleDistribution: roleResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

/**
 * GET /api/console/admin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', requireRole(UserRole.FOUNDER, UserRole.CEO, UserRole.COO, UserRole.COMPLIANCE_OFFICER, UserRole.IT_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      limit = 50,
      offset = 0,
      category,
      eventType,
      userId,
      dateFrom,
      dateTo,
      search
    } = req.query;

    let query = `
      SELECT
        a.id,
        a.event_type,
        a.action,
        a.resource_type,
        a.resource_id,
        a.outcome,
        a.ip_address,
        a.user_agent,
        a.event_data,
        a.phi_accessed,
        a.data_classification,
        a.timestamp,
        u.first_name,
        u.last_name,
        u.email,
        u.role as user_role
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.organization_id = $1
    `;

    const params: any[] = [req.user?.organizationId];
    let paramIndex = 2;

    // Filter by event type
    if (eventType) {
      query += ` AND a.action = $${paramIndex++}`;
      params.push(eventType);
    }

    // Filter by resource type (category)
    if (category) {
      query += ` AND a.resource_type = $${paramIndex++}`;
      params.push(category);
    }

    // Filter by user
    if (userId) {
      query += ` AND a.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Filter by date range
    if (dateFrom) {
      query += ` AND a.timestamp >= $${paramIndex++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND a.timestamp <= $${paramIndex++}`;
      params.push(dateTo + 'T23:59:59');
    }

    // Search filter
    if (search) {
      query += ` AND (
        a.action ILIKE $${paramIndex} OR
        a.event_data::text ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY a.timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(Number(limit), Number(offset));

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM audit_log a WHERE a.organization_id = $1`;
    const countParams: any[] = [req.user?.organizationId];

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Map to frontend format
    const logs = result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      eventType: mapActionToEventType(row.action),
      category: mapResourceToCategory(row.resource_type),
      action: row.action,
      description: formatEventDescription(row),
      userId: row.user_id,
      userName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : 'System',
      userEmail: row.email || 'system@serenitycare.com',
      userRole: row.user_role || 'system',
      ipAddress: row.ip_address || '0.0.0.0',
      userAgent: row.user_agent || 'Unknown',
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      status: row.outcome === 'success' ? 'success' : row.outcome === 'failure' ? 'failure' : 'warning',
      metadata: row.event_data,
      sessionId: row.session_id || 'N/A'
    }));

    res.json({
      logs,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/admin/audit-logs/stats
 * Get audit log statistics
 */
router.get('/audit-logs/stats', requireRole(UserRole.FOUNDER, UserRole.CEO, UserRole.COO, UserRole.COMPLIANCE_OFFICER, UserRole.IT_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE resource_type = 'phi' OR phi_accessed = true) as phi_access,
        COUNT(*) FILTER (WHERE action LIKE '%SECURITY%' OR action LIKE '%ALERT%') as security_events,
        COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED') as failed_logins,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_log
      WHERE organization_id = $1
        AND timestamp >= NOW() - INTERVAL '30 days'
    `, [req.user?.organizationId]);

    const stats = result.rows[0] || {
      total: 0,
      phi_access: 0,
      security_events: 0,
      failed_logins: 0,
      unique_users: 0
    };

    res.json({
      total: parseInt(stats.total),
      phiAccess: parseInt(stats.phi_access),
      securityEvents: parseInt(stats.security_events),
      failedLogins: parseInt(stats.failed_logins),
      uniqueUsers: parseInt(stats.unique_users)
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions to map database values to frontend types
function mapActionToEventType(action: string): string {
  const actionMap: Record<string, string> = {
    'USER_CREATED': 'USER_CREATE',
    'USER_UPDATED': 'USER_UPDATE',
    'USER_DELETED': 'USER_DELETE',
    'LOGIN': 'LOGIN',
    'LOGOUT': 'LOGOUT',
    'LOGIN_FAILED': 'LOGIN_FAILED',
    'PATIENT_VIEWED': 'PATIENT_VIEW',
    'PATIENT_CREATED': 'PATIENT_CREATE',
    'PATIENT_UPDATED': 'PATIENT_UPDATE',
    'PHI_ACCESS': 'PHI_ACCESS',
    'DOCUMENT_VIEWED': 'DOCUMENT_VIEW',
    'CLAIM_CREATED': 'CLAIM_CREATE',
    'SETTINGS_CHANGED': 'SETTINGS_CHANGE',
    'ROLE_CHANGED': 'ROLE_CHANGE'
  };
  return actionMap[action] || action;
}

function mapResourceToCategory(resourceType: string): string {
  const categoryMap: Record<string, string> = {
    'user': 'user_management',
    'auth': 'authentication',
    'patient': 'patient_data',
    'phi': 'phi_access',
    'claim': 'billing',
    'schedule': 'scheduling',
    'config': 'system',
    'security': 'security'
  };
  return categoryMap[resourceType] || 'system';
}

function formatEventDescription(row: any): string {
  const data = row.event_data || {};
  const userName = row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : 'System';

  switch (row.action) {
    case 'USER_CREATED':
      return `${userName} created new user: ${data.createdUserEmail || 'Unknown'} with role ${data.createdUserRole || 'Unknown'}`;
    case 'USER_UPDATED':
      return `${userName} updated user: ${data.targetUserEmail || 'Unknown'}`;
    case 'LOGIN':
      return `${userName} logged in successfully`;
    case 'LOGOUT':
      return `${userName} logged out`;
    case 'LOGIN_FAILED':
      return `Failed login attempt for ${data.email || 'Unknown'}`;
    default:
      return `${userName} performed ${row.action} on ${row.resource_type || 'resource'}`;
  }
}

export default router;
