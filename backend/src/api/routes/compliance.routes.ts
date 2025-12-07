
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { complianceService } from '../../services/operations/compliance.service';

const router = Router();

/**
 * GET /api/compliance/audit-queue/:organizationId
 * Get flagged shifts for review
 */
router.get('/audit-queue/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { organizationId } = req.params;
        const results = await complianceService.getAuditQueue(organizationId);
        res.json(results.rows);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/compliance/verify/:shiftId
 * Manually verify a shift
 */
router.post('/verify/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { shiftId } = req.params;
        const { note } = req.body;
        const userId = req.user?.userId;

        if (!userId) throw new Error('User ID required');

        const result = await complianceService.manualVerify(shiftId, userId, note);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/compliance/reject/:shiftId
 * Reject a shift (Non-Billable)
 */
router.post('/reject/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { shiftId } = req.params;
        const { note } = req.body;
        const userId = req.user?.userId;

        if (!userId) throw new Error('User ID required');

        const result = await complianceService.rejectShift(shiftId, userId, note);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

export default router;
