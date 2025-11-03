/**
 * Coverage Gap Management API Routes
 * Real-time gap detection and dispatch management for Pod Leads
 *
 * @module api/routes/console/gaps
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { getGapDetectionService } from '../../../services/operations/gap-detection.service';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/gaps/active
 * Get all active coverage gaps for organization/pod
 */
router.get('/active', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.query;

    const gapService = getGapDetectionService();
    const result = await gapService.getActiveGaps(
      req.user.organizationId,
      podId as string | undefined
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/gaps/:gapId/mark-notified
 * Mark gap as notified (Pod Lead acknowledged)
 */
router.post('/:gapId/mark-notified', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;

    const gapService = getGapDetectionService();
    await gapService.markAsNotified(gapId);

    res.json({
      success: true,
      message: 'Gap marked as notified',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/gaps/:gapId/mark-dispatched
 * Mark gap as dispatched (on-call caregiver sent)
 */
router.post('/:gapId/mark-dispatched', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;
    const { replacementCaregiverId } = req.body;

    if (!replacementCaregiverId) {
      return res.status(400).json({
        success: false,
        error: 'replacementCaregiverId is required',
      });
    }

    const gapService = getGapDetectionService();
    await gapService.markAsDispatched(gapId, replacementCaregiverId);

    res.json({
      success: true,
      message: 'Gap marked as dispatched',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/gaps/:gapId/mark-covered
 * Mark gap as covered (replacement caregiver clocked in)
 */
router.post('/:gapId/mark-covered', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;

    const gapService = getGapDetectionService();
    await gapService.markAsCovered(gapId);

    res.json({
      success: true,
      message: 'Gap marked as covered',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/gaps/:gapId/cancel
 * Mark gap as canceled (visit canceled, no coverage needed)
 */
router.post('/:gapId/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required',
      });
    }

    const gapService = getGapDetectionService();
    await gapService.markAsCanceled(gapId, reason);

    res.json({
      success: true,
      message: 'Gap marked as canceled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/gaps/statistics
 * Get gap statistics for reporting
 */
router.get('/statistics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId, startDate, endDate } = req.query;

    const gapService = getGapDetectionService();
    const stats = await gapService.getGapStatistics(
      req.user.organizationId,
      podId as string | undefined,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
