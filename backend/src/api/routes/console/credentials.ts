/**
 * Credentials Routes
 * API endpoints for managing and monitoring caregiver credentials
 * Enhanced with 30/60/90 day alerts and compliance tracking
 *
 * @module api/routes/console/credentials
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';

const router = Router();
const db = getDbClient();
const logger = createLogger('credentials-routes');

// Alert thresholds in days
const ALERT_THRESHOLDS = {
  CRITICAL: 7,    // Red - Urgent action required
  WARNING: 30,    // Yellow - Action needed soon
  NOTICE: 60,     // Orange - Plan ahead
  INFO: 90        // Blue - Upcoming renewal
};

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/credentials/expiring
 * Get list of credentials expiring within specified days
 */
router.get('/expiring', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    if (days < 1 || days > 365) {
      throw ApiErrors.badRequest('Days must be between 1 and 365');
    }

    const result = await db.query(`
      SELECT
        cr.id,
        cr.user_id as "caregiverId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        cr.credential_type as type,
        cr.expiration_date as "expirationDate",
        cr.status,
        EXTRACT(DAY FROM (cr.expiration_date - NOW())) as "daysLeft"
      FROM credentials cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.expiration_date <= NOW() + INTERVAL '${days} days'
        AND cr.status = 'active'
        AND u.status = 'active'
        AND u.organization_id = $1
      ORDER BY cr.expiration_date ASC
    `, [req.user?.organizationId]);

    res.json({
      success: true,
      days,
      count: result.rows.length,
      credentials: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/credentials/expired
 * Get list of expired credentials
 */
router.get('/expired', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(`
      SELECT
        cr.id,
        cr.user_id as "caregiverId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        cr.credential_type as type,
        cr.expiration_date as "expirationDate",
        cr.status,
        EXTRACT(DAY FROM (NOW() - cr.expiration_date)) as "daysExpired"
      FROM credentials cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.expiration_date < NOW()
        AND cr.status = 'active'
        AND u.status = 'active'
        AND u.organization_id = $1
      ORDER BY cr.expiration_date ASC
    `, [req.user?.organizationId]);

    res.json({
      success: true,
      count: result.rows.length,
      credentials: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/credentials/summary
 * Get summary stats for credential monitoring dashboard
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(CASE WHEN cr.expiration_date < NOW() THEN 1 END) as expired,
        COUNT(CASE WHEN cr.expiration_date <= NOW() + INTERVAL '7 days' AND cr.expiration_date >= NOW() THEN 1 END) as "expiring_7_days",
        COUNT(CASE WHEN cr.expiration_date <= NOW() + INTERVAL '15 days' AND cr.expiration_date >= NOW() THEN 1 END) as "expiring_15_days",
        COUNT(CASE WHEN cr.expiration_date <= NOW() + INTERVAL '30 days' AND cr.expiration_date >= NOW() THEN 1 END) as "expiring_30_days",
        COUNT(*) as "total_active"
      FROM credentials cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.status = 'active'
        AND u.status = 'active'
        AND u.organization_id = $1
    `, [req.user?.organizationId]);

    res.json({
      success: true,
      summary: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/credentials/caregiver/:caregiverId
 * Get all credentials for a specific caregiver
 */
router.get('/caregiver/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver ID is required');
    }

    const result = await db.query(`
      SELECT
        id,
        credential_type as type,
        credential_number as number,
        issue_date as "issueDate",
        expiration_date as "expirationDate",
        status,
        document_url as "documentUrl",
        verification_status as "verificationStatus",
        EXTRACT(DAY FROM (expiration_date - NOW())) as "daysLeft"
      FROM credentials
      WHERE user_id = $1
      ORDER BY expiration_date ASC
    `, [caregiverId]);

    res.json({
      success: true,
      caregiverId,
      count: result.rows.length,
      credentials: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/credentials/:credentialId
 * Update credential (e.g., mark as renewed)
 */
router.put('/:credentialId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { credentialId } = req.params;
    const { expirationDate, number, status } = req.body;

    if (!credentialId) {
      throw ApiErrors.badRequest('Credential ID is required');
    }

    const result = await db.query(`
      UPDATE credentials
      SET
        expiration_date = COALESCE($1, expiration_date),
        credential_number = COALESCE($2, credential_number),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [expirationDate, number, status, credentialId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Credential');
    }

    res.json({
      success: true,
      credentialId,
      message: 'Credential updated successfully',
      credential: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/credentials/dashboard
 * Get comprehensive credential expiration dashboard with 30/60/90 day alerts
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;

    // Get credentials grouped by alert level
    const alertsQuery = await db.query(`
      WITH credential_alerts AS (
        SELECT
          cr.id,
          cr.user_id,
          cr.credential_type,
          cr.expiration_date,
          cr.status,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          CASE
            WHEN cr.expiration_date < NOW() THEN 'EXPIRED'
            WHEN cr.expiration_date <= NOW() + INTERVAL '7 days' THEN 'CRITICAL'
            WHEN cr.expiration_date <= NOW() + INTERVAL '30 days' THEN 'WARNING'
            WHEN cr.expiration_date <= NOW() + INTERVAL '60 days' THEN 'NOTICE'
            WHEN cr.expiration_date <= NOW() + INTERVAL '90 days' THEN 'INFO'
            ELSE 'OK'
          END as alert_level,
          EXTRACT(DAY FROM (cr.expiration_date - NOW()))::int as days_left
        FROM credentials cr
        JOIN users u ON u.id = cr.user_id
        WHERE cr.status = 'active'
          AND u.status = 'active'
          AND u.organization_id = $1
      )
      SELECT
        alert_level as "alertLevel",
        COUNT(*) as count,
        json_agg(
          json_build_object(
            'id', id,
            'caregiverId', user_id,
            'firstName', first_name,
            'lastName', last_name,
            'email', email,
            'phone', phone,
            'credentialType', credential_type,
            'expirationDate', expiration_date,
            'daysLeft', days_left
          ) ORDER BY expiration_date ASC
        ) as credentials
      FROM credential_alerts
      WHERE alert_level != 'OK'
      GROUP BY alert_level
      ORDER BY
        CASE alert_level
          WHEN 'EXPIRED' THEN 1
          WHEN 'CRITICAL' THEN 2
          WHEN 'WARNING' THEN 3
          WHEN 'NOTICE' THEN 4
          WHEN 'INFO' THEN 5
        END
    `, [organizationId]);

    // Get summary counts by credential type
    const typeBreakdownQuery = await db.query(`
      SELECT
        cr.credential_type as "credentialType",
        COUNT(*) as total,
        COUNT(CASE WHEN cr.expiration_date < NOW() THEN 1 END) as expired,
        COUNT(CASE WHEN cr.expiration_date <= NOW() + INTERVAL '30 days' AND cr.expiration_date >= NOW() THEN 1 END) as "expiringSoon",
        COUNT(CASE WHEN cr.expiration_date > NOW() + INTERVAL '30 days' THEN 1 END) as "valid"
      FROM credentials cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.status = 'active'
        AND u.status = 'active'
        AND u.organization_id = $1
      GROUP BY cr.credential_type
      ORDER BY expired DESC, "expiringSoon" DESC
    `, [organizationId]);

    // Get caregivers with compliance issues (any expired or critical credentials)
    const complianceIssuesQuery = await db.query(`
      SELECT DISTINCT
        u.id as "caregiverId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.phone,
        (
          SELECT json_agg(json_build_object(
            'type', cr2.credential_type,
            'expirationDate', cr2.expiration_date,
            'daysLeft', EXTRACT(DAY FROM (cr2.expiration_date - NOW()))::int
          ))
          FROM credentials cr2
          WHERE cr2.user_id = u.id
            AND cr2.status = 'active'
            AND cr2.expiration_date <= NOW() + INTERVAL '7 days'
        ) as "expiredCredentials",
        (
          SELECT COUNT(*)
          FROM credentials cr3
          WHERE cr3.user_id = u.id
            AND cr3.status = 'active'
            AND cr3.expiration_date < NOW()
        )::int as "expiredCount"
      FROM users u
      JOIN credentials cr ON cr.user_id = u.id
      WHERE u.organization_id = $1
        AND u.status = 'active'
        AND cr.status = 'active'
        AND cr.expiration_date <= NOW() + INTERVAL '7 days'
      ORDER BY "expiredCount" DESC
    `, [organizationId]);

    // Build alerts object
    const alerts: Record<string, any> = {
      EXPIRED: { count: 0, credentials: [] },
      CRITICAL: { count: 0, credentials: [] },
      WARNING: { count: 0, credentials: [] },
      NOTICE: { count: 0, credentials: [] },
      INFO: { count: 0, credentials: [] }
    };

    for (const row of alertsQuery.rows) {
      alerts[row.alertLevel] = {
        count: parseInt(row.count),
        credentials: row.credentials
      };
    }

    // Calculate overall compliance rate
    const totalCredentialsQuery = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN cr.expiration_date > NOW() THEN 1 END) as valid
      FROM credentials cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.status = 'active'
        AND u.status = 'active'
        AND u.organization_id = $1
    `, [organizationId]);

    const totalCreds = parseInt(totalCredentialsQuery.rows[0].total) || 1;
    const validCreds = parseInt(totalCredentialsQuery.rows[0].valid) || 0;
    const complianceRate = Math.round((validCreds / totalCreds) * 100);

    res.json({
      success: true,
      dashboard: {
        complianceRate,
        totalCredentials: totalCreds,
        validCredentials: validCreds,
        alerts,
        byCredentialType: typeBreakdownQuery.rows,
        caregiversWithIssues: complianceIssuesQuery.rows,
        thresholds: ALERT_THRESHOLDS
      }
    });
  } catch (error) {
    logger.error('Failed to get credential dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/credentials/alerts
 * Get credential alerts for notification system
 */
router.get('/alerts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const threshold = parseInt(req.query.threshold as string) || 30;

    const result = await db.query(`
      SELECT
        cr.id,
        cr.user_id as "caregiverId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.phone,
        cr.credential_type as "credentialType",
        cr.expiration_date as "expirationDate",
        EXTRACT(DAY FROM (cr.expiration_date - NOW()))::int as "daysLeft",
        CASE
          WHEN cr.expiration_date < NOW() THEN 'expired'
          WHEN cr.expiration_date <= NOW() + INTERVAL '7 days' THEN 'critical'
          WHEN cr.expiration_date <= NOW() + INTERVAL '30 days' THEN 'warning'
          ELSE 'notice'
        END as "alertLevel",
        CASE
          WHEN cr.expiration_date < NOW() THEN 'Credential has expired'
          WHEN cr.expiration_date <= NOW() + INTERVAL '7 days' THEN 'Expires within 7 days - Urgent action required'
          WHEN cr.expiration_date <= NOW() + INTERVAL '30 days' THEN 'Expires within 30 days - Schedule renewal'
          ELSE 'Expires within ' || EXTRACT(DAY FROM (cr.expiration_date - NOW()))::int || ' days'
        END as "message"
      FROM credentials cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.status = 'active'
        AND u.status = 'active'
        AND u.organization_id = $1
        AND cr.expiration_date <= NOW() + INTERVAL '1 day' * $2
      ORDER BY cr.expiration_date ASC
    `, [organizationId, threshold]);

    res.json({
      success: true,
      threshold,
      count: result.rows.length,
      alerts: result.rows
    });
  } catch (error) {
    logger.error('Failed to get credential alerts', { error });
    next(error);
  }
});

/**
 * GET /api/console/credentials/types
 * Get all credential types and their requirements
 */
router.get('/types', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Ohio-specific credential types based on the handbook
    const credentialTypes = [
      {
        type: 'BCI_BACKGROUND_CHECK',
        name: 'BCI Background Check',
        description: 'Ohio Bureau of Criminal Investigation background check',
        required: true,
        renewalPeriod: null,
        notes: 'Required for all staff. No expiration.'
      },
      {
        type: 'FBI_BACKGROUND_CHECK',
        name: 'FBI Background Check',
        description: 'Federal Bureau of Investigation background check',
        required: false,
        renewalPeriod: null,
        notes: 'Required if lived outside Ohio in past 5 years.'
      },
      {
        type: 'CPR_FIRST_AID',
        name: 'CPR/First Aid Certification',
        description: 'Current CPR and First Aid certification with in-person skills assessment',
        required: true,
        renewalPeriod: 24,
        notes: 'Must include hands-on skills assessment. Online-only not accepted.'
      },
      {
        type: 'STNA',
        name: 'State Tested Nursing Assistant',
        description: 'Ohio STNA certification',
        required: false,
        renewalPeriod: 24,
        notes: 'Required for personal care services under T1019 billing.'
      },
      {
        type: 'HHA',
        name: 'Home Health Aide',
        description: 'Home Health Aide certification',
        required: false,
        renewalPeriod: 24,
        notes: 'Alternative to STNA for some services.'
      },
      {
        type: 'DRIVERS_LICENSE',
        name: 'Valid Driver\'s License',
        description: 'Current state driver\'s license',
        required: true,
        renewalPeriod: 48,
        notes: 'Required for caregivers who transport clients or drive for errands.'
      },
      {
        type: 'AUTO_INSURANCE',
        name: 'Auto Insurance',
        description: 'Current auto insurance policy',
        required: true,
        renewalPeriod: 12,
        notes: 'Minimum liability coverage required.'
      },
      {
        type: 'EVV_TRAINING',
        name: 'EVV Training',
        description: 'Electronic Visit Verification system training',
        required: true,
        renewalPeriod: null,
        notes: 'Required before first shift. One-time training.'
      },
      {
        type: 'HIPAA_TRAINING',
        name: 'HIPAA Training',
        description: 'Health Insurance Portability and Accountability Act training',
        required: true,
        renewalPeriod: 12,
        notes: 'Annual refresher required.'
      },
      {
        type: 'ABUSE_NEGLECT_TRAINING',
        name: 'Abuse/Neglect Recognition Training',
        description: 'Training on recognizing and reporting abuse and neglect',
        required: true,
        renewalPeriod: 12,
        notes: 'Annual refresher required per Ohio regulations.'
      }
    ];

    res.json({
      success: true,
      credentialTypes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/credentials
 * Add a new credential for a caregiver
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      caregiverId,
      credentialType,
      credentialNumber,
      issueDate,
      expirationDate,
      documentUrl,
      notes
    } = req.body;

    if (!caregiverId || !credentialType) {
      throw ApiErrors.badRequest('Caregiver ID and credential type are required');
    }

    // Verify caregiver belongs to organization
    const caregiverCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [caregiverId, req.user?.organizationId]
    );

    if (caregiverCheck.rows.length === 0) {
      throw ApiErrors.notFound('Caregiver');
    }

    const result = await db.query(`
      INSERT INTO credentials (
        user_id,
        credential_type,
        credential_number,
        issue_date,
        expiration_date,
        document_url,
        notes,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
      RETURNING *
    `, [
      caregiverId,
      credentialType,
      credentialNumber,
      issueDate,
      expirationDate,
      documentUrl,
      notes
    ]);

    logger.info('Credential added', {
      credentialId: result.rows[0].id,
      caregiverId,
      type: credentialType,
      userId: req.user?.userId
    });

    res.status(201).json({
      success: true,
      message: 'Credential added successfully',
      credential: result.rows[0]
    });
  } catch (error) {
    logger.error('Failed to add credential', { error });
    next(error);
  }
});

/**
 * POST /api/console/credentials/:credentialId/renew
 * Renew a credential (creates audit trail)
 */
router.post('/:credentialId/renew', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { credentialId } = req.params;
    const { newExpirationDate, newCredentialNumber, documentUrl, notes } = req.body;

    if (!newExpirationDate) {
      throw ApiErrors.badRequest('New expiration date is required');
    }

    // Get current credential
    const current = await db.query(
      'SELECT * FROM credentials WHERE id = $1',
      [credentialId]
    );

    if (current.rows.length === 0) {
      throw ApiErrors.notFound('Credential');
    }

    // Update the credential
    const result = await db.query(`
      UPDATE credentials
      SET
        expiration_date = $1,
        credential_number = COALESCE($2, credential_number),
        document_url = COALESCE($3, document_url),
        notes = COALESCE($4, notes),
        renewed_at = NOW(),
        renewed_by = $5,
        previous_expiration_date = expiration_date,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [
      newExpirationDate,
      newCredentialNumber,
      documentUrl,
      notes,
      req.user?.userId,
      credentialId
    ]);

    logger.info('Credential renewed', {
      credentialId,
      previousExpiration: current.rows[0].expiration_date,
      newExpiration: newExpirationDate,
      userId: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Credential renewed successfully',
      credential: result.rows[0]
    });
  } catch (error) {
    logger.error('Failed to renew credential', { error });
    next(error);
  }
});

/**
 * GET /api/console/credentials/compliance-report
 * Generate compliance report for all caregivers
 */
router.get('/compliance-report', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;

    // Get all caregivers with their credential status
    const result = await db.query(`
      WITH required_creds AS (
        SELECT unnest(ARRAY['BCI_BACKGROUND_CHECK', 'CPR_FIRST_AID', 'DRIVERS_LICENSE', 'AUTO_INSURANCE', 'EVV_TRAINING', 'HIPAA_TRAINING', 'ABUSE_NEGLECT_TRAINING']) as credential_type
      ),
      caregiver_creds AS (
        SELECT
          u.id as caregiver_id,
          u.first_name,
          u.last_name,
          u.email,
          u.hire_date,
          cr.credential_type,
          cr.expiration_date,
          cr.status as cred_status,
          CASE
            WHEN cr.id IS NULL THEN 'MISSING'
            WHEN cr.expiration_date IS NOT NULL AND cr.expiration_date < NOW() THEN 'EXPIRED'
            WHEN cr.expiration_date IS NOT NULL AND cr.expiration_date <= NOW() + INTERVAL '30 days' THEN 'EXPIRING'
            ELSE 'VALID'
          END as compliance_status
        FROM users u
        CROSS JOIN required_creds rc
        LEFT JOIN credentials cr ON cr.user_id = u.id
          AND cr.credential_type = rc.credential_type
          AND cr.status = 'active'
        WHERE u.organization_id = $1
          AND u.status = 'active'
          AND u.role IN ('caregiver', 'nurse', 'scheduler')
      )
      SELECT
        caregiver_id as "caregiverId",
        first_name as "firstName",
        last_name as "lastName",
        email,
        hire_date as "hireDate",
        COUNT(*) as "totalRequired",
        COUNT(CASE WHEN compliance_status = 'VALID' THEN 1 END) as "validCount",
        COUNT(CASE WHEN compliance_status = 'MISSING' THEN 1 END) as "missingCount",
        COUNT(CASE WHEN compliance_status = 'EXPIRED' THEN 1 END) as "expiredCount",
        COUNT(CASE WHEN compliance_status = 'EXPIRING' THEN 1 END) as "expiringCount",
        ROUND(
          COUNT(CASE WHEN compliance_status = 'VALID' THEN 1 END)::numeric /
          COUNT(*)::numeric * 100
        ) as "compliancePercent",
        json_agg(
          json_build_object(
            'type', credential_type,
            'status', compliance_status,
            'expirationDate', expiration_date
          )
        ) as credentials
      FROM caregiver_creds
      GROUP BY caregiver_id, first_name, last_name, email, hire_date
      ORDER BY "compliancePercent" ASC, last_name ASC
    `, [organizationId]);

    // Calculate organization-wide compliance
    const totalCaregivers = result.rows.length;
    const fullyCompliant = result.rows.filter(r => r.compliancePercent === 100).length;
    const overallComplianceRate = totalCaregivers > 0
      ? Math.round((fullyCompliant / totalCaregivers) * 100)
      : 0;

    res.json({
      success: true,
      report: {
        generatedAt: new Date().toISOString(),
        organizationId,
        summary: {
          totalCaregivers,
          fullyCompliant,
          partiallyCompliant: totalCaregivers - fullyCompliant,
          overallComplianceRate
        },
        caregivers: result.rows
      }
    });
  } catch (error) {
    logger.error('Failed to generate compliance report', { error });
    next(error);
  }
});

/**
 * DELETE /api/console/credentials/:credentialId
 * Soft delete a credential (mark as inactive)
 */
router.delete('/:credentialId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { credentialId } = req.params;

    const result = await db.query(`
      UPDATE credentials
      SET status = 'inactive', updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [credentialId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Credential');
    }

    logger.info('Credential deleted', { credentialId, userId: req.user?.userId });

    res.json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete credential', { error });
    next(error);
  }
});

export default router;
