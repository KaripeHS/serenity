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
        u.pod_id,
        p.name as pod_name
      FROM users u
      LEFT JOIN pods p ON u.pod_id = p.id
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
      status: row.status ? 'active' : 'inactive', // map boolean to string if needed, or stick to DB schema
      isActive: row.status, // Assuming boolean in DB as per previous schema files, let's verify. usually is_active
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
    const { email, firstName, lastName, role, podId } = req.body;

    if (!email || !firstName || !lastName || !role) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    // Basic insert (In production, use authenticated HRService.createEmployee)
    const userId = `user-${Date.now()}`;
    const is_active = true;

    // Using simple query for prototype, assuming users table structure from schema
    // Note: This relies on DB definition.
    const result = await db.query(`
       INSERT INTO users (organization_id, email, first_name, last_name, role, is_active, pod_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, is_active, created_at
     `, [req.user?.organizationId, email, firstName, lastName, role, is_active, podId]);

    res.status(201).json(result.rows[0]);
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

export default router;
