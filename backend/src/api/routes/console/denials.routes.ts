/**
 * Denial Management Routes
 * API endpoints for claims denial tracking and appeals
 *
 * @module api/routes/console/denials
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { denialService } from '../../../services/denial.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('denials-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/denials/dashboard
 * Get denial management dashboard
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await denialService.getDenialDashboard(organizationId);

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    logger.error('Failed to get denial dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/denials/stats
 * Get denial statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await denialService.getDenialStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get denial stats', { error });
    next(error);
  }
});

// ============================================================
// DENIAL CRUD
// ============================================================

/**
 * GET /api/console/denials
 * Get denials with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, payerId, denialCode, assignedTo, priority } = req.query;

    const denials = await denialService.getDenials(organizationId, {
      status: status as string,
      payerId: payerId as string,
      denialCode: denialCode as string,
      assignedTo: assignedTo as string,
      priority: priority as string,
    });

    res.json({
      success: true,
      denials,
      count: denials.length,
    });
  } catch (error) {
    logger.error('Failed to get denials', { error });
    next(error);
  }
});

/**
 * GET /api/console/denials/:id
 * Get a specific denial with history
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const denial = await denialService.getDenialById(id, organizationId);

    if (!denial) {
      throw ApiErrors.notFound('Denial');
    }

    res.json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to get denial', { error });
    next(error);
  }
});

/**
 * POST /api/console/denials
 * Create a new denial record
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      claimLineId,
      denialCode,
      denialReason,
      deniedAmount,
      denialDate,
      payerId,
      remittanceId,
    } = req.body;

    if (!claimLineId || !denialCode || deniedAmount === undefined) {
      throw ApiErrors.badRequest('claimLineId, denialCode, and deniedAmount are required');
    }

    const denial = await denialService.createDenial(organizationId, {
      claimLineId,
      denialCode,
      denialReason,
      deniedAmount,
      denialDate,
      payerId,
      remittanceId,
    });

    logger.info('Denial created', {
      denialId: denial.id,
      code: denialCode,
      createdBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to create denial', { error });
    next(error);
  }
});

// ============================================================
// WORKFLOW ACTIONS
// ============================================================

/**
 * POST /api/console/denials/:id/assign
 * Assign a denial to a user
 */
router.post('/:id/assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      throw ApiErrors.badRequest('assignedTo is required');
    }

    const denial = await denialService.assignDenial(id, organizationId, assignedTo, userId);

    if (!denial) {
      throw ApiErrors.notFound('Denial');
    }

    res.json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to assign denial', { error });
    next(error);
  }
});

/**
 * POST /api/console/denials/:id/start-review
 * Start reviewing a denial
 */
router.post('/:id/start-review', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const denial = await denialService.updateDenialStatus(
      id,
      organizationId,
      'in_review',
      userId,
      'Started review'
    );

    if (!denial) {
      throw ApiErrors.notFound('Denial');
    }

    res.json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to start review', { error });
    next(error);
  }
});

/**
 * POST /api/console/denials/:id/file-appeal
 * File an appeal for a denial
 */
router.post('/:id/file-appeal', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { appealReason, appealDeadline, appealReference } = req.body;

    if (!appealReason) {
      throw ApiErrors.badRequest('appealReason is required');
    }

    const denial = await denialService.fileAppeal(
      id,
      organizationId,
      {
        appealReference,
        appealDeadline,
        notes: appealReason,
      },
      userId
    );

    if (!denial) {
      throw ApiErrors.notFound('Denial');
    }

    logger.info('Appeal filed', {
      denialId: id,
      filedBy: userId,
    });

    res.json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to file appeal', { error });
    next(error);
  }
});

/**
 * POST /api/console/denials/:id/resolve
 * Resolve a denial (recovered, written off, or upheld)
 */
router.post('/:id/resolve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { resolution, recoveredAmount, notes } = req.body;

    if (!resolution) {
      throw ApiErrors.badRequest('resolution is required (recovered, written_off, or upheld)');
    }

    const validResolutions = ['recovered', 'written_off', 'upheld'];
    if (!validResolutions.includes(resolution)) {
      throw ApiErrors.badRequest(`resolution must be one of: ${validResolutions.join(', ')}`);
    }

    const denial = await denialService.resolveDenial(
      id,
      organizationId,
      {
        resolutionType: resolution,
        resolutionNotes: notes,
        recoveryAmount: recoveredAmount,
      },
      userId
    );

    if (!denial) {
      throw ApiErrors.notFound('Denial');
    }

    logger.info('Denial resolved', {
      denialId: id,
      resolution,
      recoveredAmount,
      resolvedBy: userId,
    });

    res.json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to resolve denial', { error });
    next(error);
  }
});

/**
 * POST /api/console/denials/:id/add-note
 * Add a note to a denial
 */
router.post('/:id/add-note', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      throw ApiErrors.badRequest('note is required');
    }

    const action = await denialService.addNote(id, organizationId, userId, note);

    if (!action) {
      throw ApiErrors.notFound('Denial');
    }

    res.json({
      success: true,
      action,
    });
  } catch (error) {
    logger.error('Failed to add note', { error });
    next(error);
  }
});

/**
 * POST /api/console/denials/:id/set-priority
 * Set priority for a denial
 */
router.post('/:id/set-priority', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      throw ApiErrors.badRequest('priority is required');
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw ApiErrors.badRequest(`priority must be one of: ${validPriorities.join(', ')}`);
    }

    const denial = await denialService.setPriority(id, organizationId, userId, priority);

    if (!denial) {
      throw ApiErrors.notFound('Denial');
    }

    res.json({
      success: true,
      denial,
    });
  } catch (error) {
    logger.error('Failed to set priority', { error });
    next(error);
  }
});

// ============================================================
// ANALYTICS
// ============================================================

/**
 * GET /api/console/denials/analytics/by-code
 * Get denial analytics by denial code
 */
router.get('/analytics/by-code', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const analytics = await denialService.getDenialsByCode(organizationId);

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    logger.error('Failed to get denial analytics', { error });
    next(error);
  }
});

/**
 * GET /api/console/denials/analytics/by-payer
 * Get denial analytics by payer
 */
router.get('/analytics/by-payer', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const analytics = await denialService.getDenialsByPayer(organizationId);

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    logger.error('Failed to get denial analytics by payer', { error });
    next(error);
  }
});

/**
 * GET /api/console/denials/analytics/trend
 * Get denial trend over time
 */
router.get('/analytics/trend', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { days } = req.query;
    const trend = await denialService.getDenialTrend(
      organizationId,
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      trend,
    });
  } catch (error) {
    logger.error('Failed to get denial trend', { error });
    next(error);
  }
});

export default router;
