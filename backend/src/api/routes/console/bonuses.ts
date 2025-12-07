import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { getDbClient } from '../../../database/client';
import { BonusService } from '../../../modules/hr/bonus.service';
import { FinancialSafeguardService } from '../../../modules/finance/safeguard.service';
import { EmailService } from '../../../services/notifications/email.service';

const router = Router();
const db = getDbClient();
const emailService = new EmailService();
const safeguardService = new FinancialSafeguardService(db, emailService);
const bonusService = new BonusService(db, safeguardService);

/**
 * GET /api/console/bonuses
 * List recent bonus payouts
 */
router.get('/', requireAuth, requireRole('admin', 'owner'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const organizationId = req.user!.organizationId;

        const result = await db.query(`
      SELECT 
        bh.*,
        u.first_name,
        u.last_name
      FROM bonus_history bh
      JOIN users u ON bh.caregiver_id = u.id
      WHERE u.organization_id = $1
      ORDER BY bh.paid_at DESC
      LIMIT $2 OFFSET $3
    `, [organizationId, limit, offset]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching bonuses:', error);
        res.status(500).json({ error: 'Failed to fetch bonuses' });
    }
});

/**
 * POST /api/console/bonuses/run-check
 * Manually trigger bonus check for a caregiver
 */
router.post('/run-check', requireAuth, requireRole('admin', 'owner'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { caregiverId } = req.body;
        const organizationId = req.user!.organizationId;

        if (!caregiverId) {
            return res.status(400).json({ error: 'Caregiver ID is required' });
        }

        await bonusService.processAllBonuses(caregiverId, organizationId);

        res.json({ success: true, message: 'Bonus check completed' });
    } catch (error) {
        console.error('Error running bonus check:', error);
        res.status(500).json({ error: 'Failed to run bonus check' });
    }
});

export default router;
