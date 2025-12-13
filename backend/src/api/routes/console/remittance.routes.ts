/**
 * Remittance Routes
 * API endpoints for 835 remittance processing
 *
 * @module api/routes/console/remittance
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { remittanceService } from '../../../services/remittance.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('remittance-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/remittance/dashboard
 * Get remittance dashboard with stats
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [stats, pendingRemittances] = await Promise.all([
      remittanceService.getRemittanceStats(organizationId),
      remittanceService.getRemittances(organizationId, { status: 'parsed' }),
    ]);

    res.json({
      success: true,
      stats,
      pendingPosting: {
        items: pendingRemittances,
        count: pendingRemittances.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get remittance dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/remittance/stats
 * Get remittance statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await remittanceService.getRemittanceStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get remittance stats', { error });
    next(error);
  }
});

// ============================================================
// REMITTANCE CRUD
// ============================================================

/**
 * GET /api/console/remittance
 * Get remittances with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, payerId, fromDate, toDate } = req.query;

    const remittances = await remittanceService.getRemittances(organizationId, {
      status: status as string,
      payerId: payerId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json({
      success: true,
      remittances,
      count: remittances.length,
    });
  } catch (error) {
    logger.error('Failed to get remittances', { error });
    next(error);
  }
});

/**
 * GET /api/console/remittance/:id
 * Get a specific remittance with details
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const remittance = await remittanceService.getRemittanceById(id, organizationId);

    if (!remittance) {
      throw ApiErrors.notFound('Remittance');
    }

    res.json({
      success: true,
      remittance,
    });
  } catch (error) {
    logger.error('Failed to get remittance', { error });
    next(error);
  }
});

/**
 * POST /api/console/remittance
 * Create a new remittance record (manual entry or 835 import)
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      remittanceNumber,
      payerId,
      payerName,
      checkDate,
      paymentDate,
      paymentMethod,
      checkNumber,
      eftTraceNumber,
      totalPayment,
      totalClaims,
      fileName,
      filePath,
      rawContent,
    } = req.body;

    if (!remittanceNumber || !payerId || totalPayment === undefined) {
      throw ApiErrors.badRequest('remittanceNumber, payerId, and totalPayment are required');
    }

    const remittance = await remittanceService.createRemittance(organizationId, {
      remittanceNumber,
      payerId,
      payerName,
      checkDate,
      paymentDate,
      paymentMethod,
      checkNumber,
      eftTraceNumber,
      totalPayment,
      totalClaims: totalClaims || 0,
      fileName,
      filePath,
      rawContent,
    });

    logger.info('Remittance created', {
      remittanceId: remittance.id,
      number: remittanceNumber,
      createdBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      remittance,
    });
  } catch (error) {
    logger.error('Failed to create remittance', { error });
    next(error);
  }
});

// ============================================================
// 835 PROCESSING
// ============================================================

/**
 * POST /api/console/remittance/:id/parse
 * Parse 835 content for a remittance
 */
router.post('/:id/parse', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      throw ApiErrors.badRequest('835 content is required');
    }

    const result = await remittanceService.parse835Content(id, organizationId, content);

    logger.info('835 parsed', {
      remittanceId: id,
      ...result,
      parsedBy: req.user?.userId,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to parse 835', { error });
    next(error);
  }
});

/**
 * POST /api/console/remittance/:id/auto-post
 * Auto-post remittance to claim lines
 */
router.post('/:id/auto-post', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const result = await remittanceService.autoPostRemittance(id, organizationId, userId);

    logger.info('Remittance auto-posted', {
      remittanceId: id,
      ...result,
      postedBy: userId,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to auto-post remittance', { error });
    next(error);
  }
});

/**
 * POST /api/console/remittance/details/:detailId/manual-post
 * Manually post a claim detail
 */
router.post('/details/:detailId/manual-post', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { detailId } = req.params;
    const { claimLineId } = req.body;

    if (!claimLineId) {
      throw ApiErrors.badRequest('claimLineId is required');
    }

    const detail = await remittanceService.manualPostClaimDetail(
      detailId,
      organizationId,
      userId,
      claimLineId
    );

    if (!detail) {
      throw ApiErrors.notFound('Remittance claim detail');
    }

    res.json({
      success: true,
      detail,
    });
  } catch (error) {
    logger.error('Failed to manually post claim detail', { error });
    next(error);
  }
});

export default router;
