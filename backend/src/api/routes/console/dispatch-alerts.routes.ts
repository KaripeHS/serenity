/**
 * Dispatch Alerts Routes
 * API endpoints for coverage gap detection and dispatch notifications
 *
 * @module api/routes/console/dispatch-alerts
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { dispatchAlertsService } from '../../../services/dispatch-alerts.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('dispatch-alerts-routes');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/dispatch-alerts/dashboard
 * Get dispatch dashboard summary
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await dispatchAlertsService.getDispatchDashboard(organizationId);

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    logger.error('Failed to get dispatch dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/dispatch-alerts/gaps
 * Get current coverage gaps
 */
router.get('/gaps', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { includeUnassigned, lookAheadHours } = req.query;

    const gaps = await dispatchAlertsService.detectCoverageGaps(organizationId, {
      includeUnassigned: includeUnassigned !== 'false',
      lookAheadHours: lookAheadHours ? parseInt(lookAheadHours as string) : 4,
    });

    res.json({
      success: true,
      gaps,
      count: gaps.length,
      summary: {
        critical: gaps.filter(g => g.urgency === 'critical').length,
        high: gaps.filter(g => g.urgency === 'high').length,
        medium: gaps.filter(g => g.urgency === 'medium').length,
        low: gaps.filter(g => g.urgency === 'low').length,
        noShow: gaps.filter(g => g.reason === 'no_show').length,
        unassigned: gaps.filter(g => g.reason === 'unassigned').length,
      },
    });
  } catch (error) {
    logger.error('Failed to detect coverage gaps', { error });
    next(error);
  }
});

/**
 * GET /api/console/dispatch-alerts/gaps/:gapId/candidates
 * Get available caregivers for a specific gap
 */
router.get('/gaps/:gapId/candidates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { gapId } = req.params;
    const { maxDistance, maxCandidates } = req.query;

    // First get the gap details
    const gaps = await dispatchAlertsService.detectCoverageGaps(organizationId);
    const gap = gaps.find(g => g.id === gapId);

    if (!gap) {
      throw ApiErrors.notFound('Coverage gap');
    }

    const candidates = await dispatchAlertsService.findDispatchCandidates(organizationId, gap, {
      maxDistance: maxDistance ? parseFloat(maxDistance as string) : 25,
      maxCandidates: maxCandidates ? parseInt(maxCandidates as string) : 10,
    });

    res.json({
      success: true,
      gap,
      candidates,
      count: candidates.length,
    });
  } catch (error) {
    logger.error('Failed to find dispatch candidates', { error });
    next(error);
  }
});

/**
 * POST /api/console/dispatch-alerts/gaps/:gapId/dispatch
 * Send dispatch alerts to available caregivers
 */
router.post('/gaps/:gapId/dispatch', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { gapId } = req.params;
    const { caregiverIds, methods, batchSize } = req.body;

    // Get the gap details
    const gaps = await dispatchAlertsService.detectCoverageGaps(organizationId);
    const gap = gaps.find(g => g.id === gapId);

    if (!gap) {
      throw ApiErrors.notFound('Coverage gap');
    }

    // Get candidates (either specified or auto-selected)
    let candidates;
    if (caregiverIds && caregiverIds.length > 0) {
      const allCandidates = await dispatchAlertsService.findDispatchCandidates(organizationId, gap, {
        maxCandidates: 50,
      });
      candidates = allCandidates.filter(c => caregiverIds.includes(c.caregiverId));
    } else {
      candidates = await dispatchAlertsService.findDispatchCandidates(organizationId, gap, {
        maxCandidates: batchSize || 5,
      });
    }

    if (candidates.length === 0) {
      throw ApiErrors.badRequest('No available caregivers found');
    }

    // Send alerts
    const notifications = await dispatchAlertsService.sendDispatchAlerts(
      organizationId,
      gap,
      candidates,
      { methods, batchSize }
    );

    logger.info('Dispatch alerts sent', {
      gapId,
      candidateCount: candidates.length,
      notificationCount: notifications.length,
      sentBy: userId,
    });

    res.json({
      success: true,
      message: `Sent ${notifications.length} dispatch alerts`,
      notifications: notifications.map(n => ({
        caregiverId: n.caregiverId,
        method: n.method,
        status: n.status,
      })),
    });
  } catch (error) {
    logger.error('Failed to send dispatch alerts', { error });
    next(error);
  }
});

/**
 * POST /api/console/dispatch-alerts/respond
 * Handle caregiver response to dispatch alert (webhook for SMS/push)
 */
router.post('/respond', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const caregiverId = req.user?.userId; // Caregiver responding
    if (!organizationId || !caregiverId) {
      throw ApiErrors.unauthorized('Authentication required');
    }

    const { gapId, accepted } = req.body;

    if (!gapId || accepted === undefined) {
      throw ApiErrors.badRequest('gapId and accepted are required');
    }

    const result = await dispatchAlertsService.handleDispatchResponse(
      organizationId,
      gapId,
      caregiverId,
      accepted
    );

    res.json(result);
  } catch (error) {
    logger.error('Failed to process dispatch response', { error });
    next(error);
  }
});

/**
 * POST /api/console/dispatch-alerts/gaps/:gapId/assign
 * Manually assign a caregiver to fill a gap
 */
router.post('/gaps/:gapId/assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { gapId } = req.params;
    const { caregiverId } = req.body;

    if (!caregiverId) {
      throw ApiErrors.badRequest('caregiverId is required');
    }

    const result = await dispatchAlertsService.handleDispatchResponse(
      organizationId,
      gapId,
      caregiverId,
      true
    );

    res.json(result);
  } catch (error) {
    logger.error('Failed to manually assign gap', { error });
    next(error);
  }
});

export default router;
