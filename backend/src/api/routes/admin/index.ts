/**
 * Admin Routes
 * Admin-only configuration endpoints
 *
 * @module api/routes/admin
 */

import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';
import { sandataConfigRouter } from './sandata-config';
import contentRouter from './content';

const router = Router();
const repository = getSandataRepository(getDbClient());

// All Admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));

// ============================================================================
// ORGANIZATIONS
// ============================================================================

/**
 * GET /api/admin/organizations
 * Get all organizations
 */
router.get('/organizations', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizations = await repository.getAllOrganizations();

    res.json({
      organizations: organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        status: org.status,
        createdAt: org.created_at,
        userCount: org.user_count || 0,
        clientCount: org.client_count || 0,
        sandataProviderId: org.sandata_provider_id,
      })),
      count: organizations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/organizations
 * Create a new organization
 */
router.post('/organizations', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { name, sandataProviderId } = req.body;

    if (!name) {
      throw ApiErrors.badRequest('Organization name is required');
    }

    const orgId = await repository.createOrganization({
      name,
      sandataProviderId: sandataProviderId || null,
      status: 'active',
      createdBy: req.user?.id,
    });

    res.status(201).json({
      id: orgId,
      name,
      message: 'Organization created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/organizations/:organizationId
 * Update organization details
 */
router.put('/organizations/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { name, status, sandataProviderId } = req.body;

    await repository.updateOrganization(organizationId, {
      name,
      status,
      sandataProviderId,
      updatedBy: req.user?.id,
    });

    res.json({
      id: organizationId,
      message: 'Organization updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SANDATA CONFIGURATION
// ============================================================================

/**
 * GET /api/admin/sandata/config/:organizationId
 * Get Sandata configuration for an organization
 */
router.get('/sandata/config/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;

    const config = await repository.getConfig(organizationId);

    if (!config) {
      throw ApiErrors.notFound('Sandata configuration');
    }

    res.json({
      organizationId,
      sandataProviderId: config.sandata_provider_id,
      sandataApiKey: config.sandata_api_key ? '***REDACTED***' : null,
      sandataEnvironment: config.sandata_environment || 'sandbox',
      credentialsConfigured: !!config.sandata_api_key,
      updatedAt: config.updated_at,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/sandata/config/:organizationId
 * Update Sandata configuration for an organization
 */
router.put('/sandata/config/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { sandataProviderId, sandataApiKey, sandataEnvironment } = req.body;

    // Validate organization exists
    const org = await repository.getOrganization(organizationId);
    if (!org) {
      throw ApiErrors.notFound('Organization');
    }

    // Check if config exists
    const existingConfig = await repository.getConfig(organizationId);

    if (existingConfig) {
      // Update existing
      await repository.updateConfig(organizationId, {
        sandataProviderId,
        sandataApiKey,
        sandataEnvironment,
        updatedBy: req.user?.id,
      });
    } else {
      // Create new
      await repository.createConfig({
        organizationId,
        sandataProviderId,
        sandataApiKey,
        sandataEnvironment: sandataEnvironment || 'sandbox',
        createdBy: req.user?.id,
      });
    }

    // Audit log
    await repository.createAuditLog({
      userId: req.user?.id,
      organizationId,
      action: 'sandata_config_updated',
      entityType: 'sandata_config',
      entityId: organizationId,
      changes: {
        sandataProviderId,
        sandataEnvironment,
        apiKeyUpdated: !!sandataApiKey,
      },
    });

    res.json({
      organizationId,
      message: 'Sandata configuration updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * GET /api/admin/feature-flags
 * Get all feature flags
 */
router.get('/feature-flags', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const flags = await repository.getFeatureFlags();

    res.json({
      flags: flags.map((flag: any) => ({
        key: flag.key,
        value: flag.value,
        description: flag.description,
        updatedAt: flag.updated_at,
        updatedBy: flag.updated_by,
      })),
      count: flags.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/feature-flags/:key
 * Update a feature flag
 */
router.put('/feature-flags/:key', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      throw ApiErrors.badRequest('value is required');
    }

    // Check if flag exists
    const existingFlag = await repository.getFeatureFlag(key);

    if (existingFlag) {
      // Update existing
      await repository.updateFeatureFlag(key, {
        value,
        description,
        updatedBy: req.user?.id,
      });
    } else {
      // Create new
      await repository.createFeatureFlag({
        key,
        value,
        description: description || '',
        createdBy: req.user?.id,
      });
    }

    // Audit log
    await repository.createAuditLog({
      userId: req.user?.id,
      action: 'feature_flag_updated',
      entityType: 'feature_flag',
      entityId: key,
      changes: {
        key,
        oldValue: existingFlag?.value,
        newValue: value,
      },
    });

    res.json({
      key,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id,
      message: 'Feature flag updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users across all organizations
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId, role, status, search, limit = '100' } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
    };

    if (organizationId) filters.organizationId = organizationId;
    if (role) filters.role = role;
    if (status) filters.status = status;
    if (search) filters.search = search;

    const users = await repository.getUsersWithFilters(filters);

    res.json({
      filters,
      users: users.map((user: any) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        sandataEmployeeId: user.sandata_employee_id,
        createdAt: user.created_at,
      })),
      count: users.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Update user role (admin-only)
 */
router.put('/users/:userId/role', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      throw ApiErrors.badRequest('role is required');
    }

    const validRoles = ['caregiver', 'nurse', 'admin', 'super_admin', 'pod_lead'];
    if (!validRoles.includes(role)) {
      throw ApiErrors.badRequest(`role must be one of: ${validRoles.join(', ')}`);
    }

    const user = await repository.getUser(userId);
    if (!user) {
      throw ApiErrors.notFound('User');
    }

    const oldRole = user.role;

    await repository.updateUser(userId, {
      role,
      updatedBy: req.user?.id,
    });

    // Audit log
    await repository.createAuditLog({
      userId: req.user?.id,
      organizationId: user.organization_id,
      action: 'user_role_updated',
      entityType: 'user',
      entityId: userId,
      changes: {
        oldRole,
        newRole: role,
      },
    });

    res.json({
      userId,
      role,
      message: 'User role updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      organizationId,
      userId,
      action,
      entityType,
      startDate,
      endDate,
      limit = '50',
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
    };

    if (organizationId) filters.organizationId = organizationId;
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const logs = await repository.getAuditLogs(filters);

    res.json({
      filters,
      logs: logs.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userName: log.user_name,
        organizationId: log.organization_id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        changes: log.changes,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at,
      })),
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SYSTEM METRICS
// ============================================================================

/**
 * GET /api/admin/metrics
 * Get system-wide metrics
 */
router.get('/metrics', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { period = '7' } = req.query;

    const daysBack = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const metrics = await repository.getSystemMetrics(
      startDate.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    res.json({
      period: `${daysBack} days`,
      metrics: {
        totalOrganizations: metrics.total_organizations,
        totalUsers: metrics.total_users,
        totalClients: metrics.total_clients,
        totalShifts: metrics.total_shifts,
        totalEVVRecords: metrics.total_evv_records,
        sandataSubmissions: {
          total: metrics.sandata_total_submissions,
          accepted: metrics.sandata_accepted,
          rejected: metrics.sandata_rejected,
          pending: metrics.sandata_pending,
          successRate: Math.round(
            (metrics.sandata_accepted / metrics.sandata_total_submissions) * 100 * 10
          ) / 10,
        },
        activeSessions: metrics.active_sessions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SANDATA CONFIGURATION UI (OAuth, Business Rules, Feature Flags)
// ============================================================================

/**
 * Mount the Sandata Config Router
 * Handles:
 * - GET /api/admin/sandata/config - Get current configuration
 * - POST /api/admin/sandata/config - Update configuration
 * - POST /api/admin/sandata/test-connection - Test Sandata credentials
 * - GET /api/admin/sandata/validation-status - Get validation status
 */
router.use('/sandata', sandataConfigRouter);

// ============================================================================
// CONTENT MANAGEMENT SYSTEM
// ============================================================================

/**
 * Mount the Content Management Router
 * Handles public website content management:
 * - Pages (pages, sections)
 * - Team members
 * - Testimonials
 * - Services
 * - Organization settings
 * - Media assets
 */
router.use('/content', contentRouter);

export { router as adminRouter };
