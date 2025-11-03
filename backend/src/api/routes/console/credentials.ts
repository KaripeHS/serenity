/**
 * Credentials Routes
 * API endpoints for managing and monitoring caregiver credentials
 *
 * @module api/routes/console/credentials
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

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

    // TODO: Query database for expiring credentials
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     cr.id,
    //     cr.caregiver_id,
    //     c.first_name,
    //     c.last_name,
    //     c.email,
    //     cr.type,
    //     cr.expiration_date,
    //     cr.status,
    //     EXTRACT(DAY FROM (cr.expiration_date - NOW())) as days_left
    //   FROM credentials cr
    //   JOIN caregivers c ON c.id = cr.caregiver_id
    //   WHERE cr.expiration_date <= NOW() + INTERVAL '${days} days'
    //     AND cr.status = 'active'
    //     AND c.status IN ('active', 'onboarding')
    //   ORDER BY cr.expiration_date ASC
    // `);

    // Mock data for development
    const mockExpiring = [
      {
        id: 'cred-001',
        caregiverId: 'cg-001',
        firstName: 'Mary',
        lastName: 'Smith',
        email: 'mary@example.com',
        type: 'CPR Certification',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        daysLeft: 7
      },
      {
        id: 'cred-002',
        caregiverId: 'cg-002',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        type: 'HHA License',
        expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        daysLeft: 15
      },
      {
        id: 'cred-004',
        caregiverId: 'cg-004',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily@example.com',
        type: 'Background Check',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        daysLeft: 30
      }
    ].filter(c => c.daysLeft <= days);

    res.json({
      success: true,
      days,
      count: mockExpiring.length,
      credentials: mockExpiring
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
    // TODO: Query database for expired credentials
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     cr.id,
    //     cr.caregiver_id,
    //     c.first_name,
    //     c.last_name,
    //     c.email,
    //     cr.type,
    //     cr.expiration_date,
    //     cr.status,
    //     EXTRACT(DAY FROM (NOW() - cr.expiration_date)) as days_expired
    //   FROM credentials cr
    //   JOIN caregivers c ON c.id = cr.caregiver_id
    //   WHERE cr.expiration_date < NOW()
    //     AND cr.status = 'active'
    //     AND c.status IN ('active', 'onboarding')
    //   ORDER BY cr.expiration_date ASC
    // `);

    // Mock data for development
    const mockExpired = [
      {
        id: 'cred-003',
        caregiverId: 'cg-003',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com',
        type: 'TB Test',
        expirationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'expired',
        daysExpired: 1
      }
    ];

    res.json({
      success: true,
      count: mockExpired.length,
      credentials: mockExpired
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
    // TODO: Query database for summary statistics
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     COUNT(CASE WHEN expiration_date < NOW() THEN 1 END) as expired_count,
    //     COUNT(CASE WHEN expiration_date <= NOW() + INTERVAL '7 days' AND expiration_date >= NOW() THEN 1 END) as expiring_7_days,
    //     COUNT(CASE WHEN expiration_date <= NOW() + INTERVAL '15 days' AND expiration_date >= NOW() THEN 1 END) as expiring_15_days,
    //     COUNT(CASE WHEN expiration_date <= NOW() + INTERVAL '30 days' AND expiration_date >= NOW() THEN 1 END) as expiring_30_days,
    //     COUNT(*) as total_active
    //   FROM credentials cr
    //   JOIN caregivers c ON c.id = cr.caregiver_id
    //   WHERE cr.status = 'active'
    //     AND c.status IN ('active', 'onboarding')
    // `);

    // Mock summary for development
    const mockSummary = {
      expired: 1,
      expiring_7_days: 1,
      expiring_15_days: 2,
      expiring_30_days: 3,
      total_active: 50,
      by_type: {
        'HHA License': { total: 20, expiring: 1, expired: 0 },
        'LPN License': { total: 8, expiring: 0, expired: 0 },
        'RN License': { total: 2, expiring: 0, expired: 0 },
        'CPR Certification': { total: 30, expiring: 1, expired: 0 },
        'TB Test': { total: 30, expiring: 0, expired: 1 },
        'Background Check': { total: 30, expiring: 1, expired: 0 }
      }
    };

    res.json({
      success: true,
      summary: mockSummary
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

    // TODO: Query database for caregiver credentials
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     id,
    //     type,
    //     number,
    //     issue_date,
    //     expiration_date,
    //     status,
    //     EXTRACT(DAY FROM (expiration_date - NOW())) as days_left
    //   FROM credentials
    //   WHERE caregiver_id = $1
    //   ORDER BY expiration_date ASC
    // `, [caregiverId]);

    // Mock data for development
    const mockCredentials = [
      {
        id: 'cred-001',
        type: 'HHA License',
        number: 'HHA123456',
        issueDate: '2023-01-15',
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        daysLeft: 180
      },
      {
        id: 'cred-002',
        type: 'CPR Certification',
        number: 'CPR789012',
        issueDate: '2024-06-01',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        daysLeft: 7
      },
      {
        id: 'cred-003',
        type: 'TB Test',
        number: null,
        issueDate: '2024-01-10',
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        daysLeft: 90
      }
    ];

    res.json({
      success: true,
      caregiverId,
      count: mockCredentials.length,
      credentials: mockCredentials
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

    // TODO: Update credential in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE credentials
    //   SET
    //     expiration_date = COALESCE($1, expiration_date),
    //     number = COALESCE($2, number),
    //     status = COALESCE($3, status),
    //     updated_at = NOW()
    //   WHERE id = $4
    // `, [expirationDate, number, status, credentialId]);

    console.log(`[CREDENTIALS] Updated credential ${credentialId}`);

    res.json({
      success: true,
      credentialId,
      message: 'Credential updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
