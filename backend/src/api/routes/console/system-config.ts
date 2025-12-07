/**
 * System Configuration API Routes
 * Organization settings, integration config, feature flags
 *
 * @module api/routes/console/system-config
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { UserRole } from '../../../auth/access-control';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

// All routes require authentication and admin permissions
router.use(requireAuth);

// Middleware to check admin permissions
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.FOUNDER && req.user?.role !== UserRole.IT_ADMIN) {
    throw ApiErrors.forbidden('Admin permissions required');
  }
  next();
};

router.use(requireAdmin);

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

/**
 * GET /api/console/config
 * Get organization configuration
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     o.id,
    //     o.name,
    //     o.legal_name,
    //     o.npi,
    //     o.tax_id,
    //     o.address_line1,
    //     o.address_line2,
    //     o.city,
    //     o.state,
    //     o.zip_code,
    //     o.phone,
    //     o.email,
    //     o.website,
    //     o.timezone,
    //     o.settings
    //   FROM organizations o
    //   WHERE o.id = $1
    // `, [req.user.organizationId]);

    // Mock data
    const config = {
      id: req.user.organizationId,
      name: 'Serenity Care Partners',
      legalName: 'Serenity Care Partners, LLC',
      npi: '1234567890',
      taxId: '12-3456789',
      addressLine1: '123 Healthcare Ave',
      addressLine2: 'Suite 200',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30303',
      phone: '(404) 555-0100',
      email: 'info@serenity.care',
      website: 'https://serenity.care',
      timezone: 'America/New_York',
      settings: {
        businessHours: {
          start: '08:00',
          end: '17:00',
          daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
        },
        evvSettings: {
          geofenceRadiusMeters: 100,
          allowManualClockIn: false,
          requirePhotos: true,
          gracePeriodMinutes: 15
        },
        billingSettings: {
          defaultServiceCode: 'T1019',
          autoSubmitClaims: true,
          claimsSubmissionDay: 1, // 1st of month
          requireAuthorizationForAll: true
        },
        notificationSettings: {
          sendEmail: true,
          sendSms: true,
          sendPush: true
        }
      }
    };

    res.json(config);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/config
 * Update organization configuration
 */
router.put('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      legalName,
      npi,
      taxId,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      timezone,
      settings
    } = req.body;

    // TODO: Update in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE organizations
    //   SET
    //     name = $1,
    //     legal_name = $2,
    //     npi = $3,
    //     tax_id = $4,
    //     address_line1 = $5,
    //     address_line2 = $6,
    //     city = $7,
    //     state = $8,
    //     zip_code = $9,
    //     phone = $10,
    //     email = $11,
    //     website = $12,
    //     timezone = $13,
    //     settings = $14,
    //     updated_at = NOW()
    //   WHERE id = $15
    // `, [name, legalName, npi, taxId, addressLine1, addressLine2, city, state, zipCode, phone, email, website, timezone, settings, req.user.organizationId]);

    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// INTEGRATION SETTINGS
// ============================================================================

/**
 * GET /api/console/config/integrations
 * Get integration settings
 */
router.get('/integrations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     integration_name,
    //     enabled,
    //     configuration,
    //     last_sync_at,
    //     sync_status
    //   FROM integrations
    //   WHERE organization_id = $1
    // `, [req.user.organizationId]);

    // Mock data
    const integrations = {
      sandata: {
        enabled: true,
        environment: 'production',
        baseUrl: 'https://api.sandata.com/v1',
        apiKey: '***************', // Masked
        submitterId: 'SERENITY001',
        autoSubmit: true,
        submitInterval: 15, // minutes
        lastSyncAt: new Date('2025-11-03T09:00:00'),
        syncStatus: 'success',
        stats: {
          totalSubmitted: 2340,
          accepted: 2280,
          rejected: 60,
          acceptanceRate: 97.4
        }
      },
      adp: {
        enabled: true,
        environment: 'production',
        companyCode: '001',
        apiEndpoint: 'https://api.adp.com/payroll',
        clientId: '***************', // Masked
        lastSyncAt: new Date('2025-11-01T00:00:00'),
        syncStatus: 'success'
      },
      gusto: {
        enabled: false,
        environment: null,
        apiKey: null,
        lastSyncAt: null,
        syncStatus: null
      },
      sendgrid: {
        enabled: true,
        apiKey: '***************', // Masked
        fromEmail: 'noreply@serenity.care',
        fromName: 'Serenity Care Partners',
        templates: {
          welcomeEmail: 'd-abc123',
          passwordReset: 'd-def456',
          shiftReminder: 'd-ghi789'
        },
        lastSyncAt: new Date('2025-11-03T08:30:00'),
        syncStatus: 'success'
      },
      twilio: {
        enabled: true,
        accountSid: '***************', // Masked
        authToken: '***************', // Masked
        fromPhone: '+14045550100',
        lastSyncAt: new Date('2025-11-03T08:45:00'),
        syncStatus: 'success',
        stats: {
          smsSentToday: 47,
          callsMadeToday: 12
        }
      },
      openai: {
        enabled: true,
        apiKey: '***************', // Masked
        model: 'gpt-4',
        maxTokens: 2000,
        lastUsedAt: new Date('2025-11-03T09:15:00')
      }
    };

    res.json(integrations);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/config/integrations/:integrationName
 * Update integration settings
 */
router.put('/integrations/:integrationName', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { integrationName } = req.params;
    const { enabled, configuration } = req.body;

    // TODO: Update in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   INSERT INTO integrations (organization_id, integration_name, enabled, configuration)
    //   VALUES ($1, $2, $3, $4)
    //   ON CONFLICT (organization_id, integration_name) DO UPDATE
    //   SET enabled = EXCLUDED.enabled, configuration = EXCLUDED.configuration, updated_at = NOW()
    // `, [req.user.organizationId, integrationName, enabled, configuration]);

    res.json({ success: true, integrationName, message: 'Integration updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/config/integrations/:integrationName/test
 * Test integration connection
 */
router.post('/integrations/:integrationName/test', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { integrationName } = req.params;

    // TODO: Test actual integration
    // Example for Sandata:
    // if (integrationName === 'sandata') {
    //   const sandataService = getSandataVisitsService();
    //   const testResult = await sandataService.testConnection();
    //   return res.json({ success: testResult.success, message: testResult.message });
    // }

    // Mock response
    const testResults: Record<string, any> = {
      sandata: {
        success: true,
        message: 'Successfully connected to Sandata API',
        version: 'v1.2.3',
        responseTime: 142 // ms
      },
      adp: {
        success: true,
        message: 'Successfully authenticated with ADP',
        companyCode: '001',
        responseTime: 89
      },
      sendgrid: {
        success: true,
        message: 'SendGrid API key is valid',
        dailyLimit: 100000,
        usedToday: 234,
        responseTime: 56
      },
      twilio: {
        success: true,
        message: 'Twilio account is active',
        balance: '$125.43',
        responseTime: 78
      },
      openai: {
        success: true,
        message: 'OpenAI API key is valid',
        model: 'gpt-4',
        responseTime: 234
      }
    };

    const result = testResults[integrationName] || {
      success: false,
      message: `Unknown integration: ${integrationName}`
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * GET /api/console/config/features
 * Get feature flags
 */
router.get('/features', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT feature_name, enabled, rollout_percentage, conditions
    //   FROM feature_flags
    //   WHERE organization_id = $1
    // `, [req.user.organizationId]);

    // Mock data
    const features = {
      evvGeofencing: {
        enabled: true,
        rolloutPercentage: 100,
        description: 'GPS-based visit verification'
      },
      autoClaimsSubmission: {
        enabled: true,
        rolloutPercentage: 100,
        description: 'Automatic claims file generation'
      },
      aiAppealWriter: {
        enabled: true,
        rolloutPercentage: 50,
        description: 'AI-powered denial appeal letters'
      },
      spiScoring: {
        enabled: true,
        rolloutPercentage: 100,
        description: 'Serenity Performance Index tracking'
      },
      earnedOvertime: {
        enabled: true,
        rolloutPercentage: 100,
        description: 'Performance-based OT bonuses'
      },
      podScorecard: {
        enabled: true,
        rolloutPercentage: 100,
        description: 'Pod-level KPI tracking'
      },
      mobileApp: {
        enabled: false,
        rolloutPercentage: 0,
        description: 'React Native mobile app'
      },
      familyPortal: {
        enabled: false,
        rolloutPercentage: 0,
        description: 'Family member portal'
      },
      advancedScheduling: {
        enabled: true,
        rolloutPercentage: 75,
        description: 'AI-powered schedule optimization'
      },
      breakGlassAccess: {
        enabled: true,
        rolloutPercentage: 100,
        description: 'Emergency access controls'
      }
    };

    res.json(features);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/config/features/:featureName
 * Update feature flag
 */
router.put('/features/:featureName', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { featureName } = req.params;
    const { enabled, rolloutPercentage } = req.body;

    // TODO: Update in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   INSERT INTO feature_flags (organization_id, feature_name, enabled, rollout_percentage)
    //   VALUES ($1, $2, $3, $4)
    //   ON CONFLICT (organization_id, feature_name) DO UPDATE
    //   SET enabled = EXCLUDED.enabled, rollout_percentage = EXCLUDED.rollout_percentage, updated_at = NOW()
    // `, [req.user.organizationId, featureName, enabled, rolloutPercentage]);

    res.json({ success: true, featureName, enabled, rolloutPercentage });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * GET /api/console/config/audit-log
 * Get configuration change audit log
 */
router.get('/audit-log', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     a.id,
    //     a.action,
    //     a.resource_type,
    //     a.resource_id,
    //     a.changes,
    //     a.created_at,
    //     u.first_name || ' ' || u.last_name as user_name,
    //     a.ip_address
    //   FROM audit_logs a
    //   JOIN users u ON u.id = a.user_id
    //   WHERE a.organization_id = $1
    //     AND a.resource_type IN ('config', 'integration', 'feature_flag')
    //   ORDER BY a.created_at DESC
    //   LIMIT $2 OFFSET $3
    // `, [req.user.organizationId, limit, offset]);

    // Mock data
    const auditLog = [
      {
        id: 'audit-001',
        action: 'update',
        resourceType: 'integration',
        resourceId: 'sandata',
        changes: {
          before: { autoSubmit: false },
          after: { autoSubmit: true }
        },
        userName: 'Admin User',
        ipAddress: '192.168.1.100',
        createdAt: new Date('2025-11-03T08:00:00')
      },
      {
        id: 'audit-002',
        action: 'update',
        resourceType: 'feature_flag',
        resourceId: 'aiAppealWriter',
        changes: {
          before: { rolloutPercentage: 25 },
          after: { rolloutPercentage: 50 }
        },
        userName: 'Admin User',
        ipAddress: '192.168.1.100',
        createdAt: new Date('2025-11-02T14:30:00')
      },
      {
        id: 'audit-003',
        action: 'update',
        resourceType: 'config',
        resourceId: 'organization',
        changes: {
          before: { phone: '(404) 555-0000' },
          after: { phone: '(404) 555-0100' }
        },
        userName: 'Sarah Johnson',
        ipAddress: '192.168.1.105',
        createdAt: new Date('2025-11-01T10:15:00')
      }
    ];

    res.json({
      items: auditLog,
      total: auditLog.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
