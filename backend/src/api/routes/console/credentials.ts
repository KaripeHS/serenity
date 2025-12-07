/**
 * Credentials Routes
 * API endpoints for managing and monitoring caregiver credentials
 *
 * @module api/routes/console/credentials
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';

const router = Router();
const db = getDbClient();

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

export default router;
