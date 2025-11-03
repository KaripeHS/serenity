/**
 * Morning Check-In API Routes
 * Real-time operational dashboard for Pod Leads
 *
 * @module api/routes/console/check-in
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { getCheckInService } from '../../../services/operations/check-in.service';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/check-in/today
 * Get all today's visits with real-time status
 */
router.get('/today', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.query;

    const checkInService = getCheckInService();
    const visits = await checkInService.getTodaysVisits(
      req.user.organizationId,
      podId as string | undefined
    );

    res.json({
      date: new Date().toISOString().split('T')[0],
      visits,
      total: visits.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/check-in/summary
 * Get summary stats for today
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.query;

    const checkInService = getCheckInService();
    const summary = await checkInService.getCheckInSummary(
      req.user.organizationId,
      podId as string | undefined
    );

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/check-in/on-call
 * Get available on-call caregivers for dispatch
 */
router.get('/on-call', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId, lat, lon } = req.query;

    const gapLocation = lat && lon
      ? { lat: parseFloat(lat as string), lon: parseFloat(lon as string) }
      : undefined;

    const checkInService = getCheckInService();
    const onCall = await checkInService.getOnCallCaregivers(
      req.user.organizationId,
      podId as string | undefined,
      gapLocation
    );

    res.json({
      caregivers: onCall,
      total: onCall.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
