/**
 * AR Aging Routes
 * API endpoints for accounts receivable aging reports
 *
 * @module api/routes/console/ar-aging
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { arAgingService } from '../../../services/ar-aging.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('ar-aging-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD
// ============================================================

/**
 * GET /api/console/ar-aging/dashboard
 * Get AR aging dashboard with all key metrics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await arAgingService.getARDashboard(organizationId);

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    logger.error('Failed to get AR aging dashboard', { error });
    next(error);
  }
});

// ============================================================
// SUMMARY & BREAKDOWN
// ============================================================

/**
 * GET /api/console/ar-aging/summary
 * Get AR aging summary by bucket
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const summary = await arAgingService.getARAgingSummary(organizationId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error('Failed to get AR aging summary', { error });
    next(error);
  }
});

/**
 * GET /api/console/ar-aging/by-payer
 * Get AR aging breakdown by payer
 */
router.get('/by-payer', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const byPayer = await arAgingService.getARAgingByPayer(organizationId);

    res.json({
      success: true,
      byPayer,
    });
  } catch (error) {
    logger.error('Failed to get AR aging by payer', { error });
    next(error);
  }
});

/**
 * GET /api/console/ar-aging/details
 * Get AR aging details (individual claims)
 */
router.get('/details', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { payerId, bucket, clientId } = req.query;

    const details = await arAgingService.getARAgingDetails(organizationId, {
      payerId: payerId as string,
      bucket: bucket as string,
      clientId: clientId as string,
    });

    res.json({
      success: true,
      details,
      count: details.length,
    });
  } catch (error) {
    logger.error('Failed to get AR aging details', { error });
    next(error);
  }
});

// ============================================================
// KPIs & METRICS
// ============================================================

/**
 * GET /api/console/ar-aging/kpis
 * Get AR KPIs (DSO, collection rate, etc.)
 */
router.get('/kpis', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const kpis = await arAgingService.getARKPIs(organizationId);

    res.json({
      success: true,
      kpis,
    });
  } catch (error) {
    logger.error('Failed to get AR KPIs', { error });
    next(error);
  }
});

/**
 * GET /api/console/ar-aging/trend
 * Get AR trend over time
 */
router.get('/trend', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { days } = req.query;
    const trend = await arAgingService.getARTrend(
      organizationId,
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      trend,
    });
  } catch (error) {
    logger.error('Failed to get AR trend', { error });
    next(error);
  }
});

// ============================================================
// AT RISK & PAYER PERFORMANCE
// ============================================================

/**
 * GET /api/console/ar-aging/at-risk
 * Get claims at risk (aging over 90 days or approaching timely filing)
 */
router.get('/at-risk', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const atRisk = await arAgingService.getClaimsAtRisk(organizationId);

    res.json({
      success: true,
      atRisk,
      count: atRisk.length,
    });
  } catch (error) {
    logger.error('Failed to get claims at risk', { error });
    next(error);
  }
});

/**
 * GET /api/console/ar-aging/payer-performance
 * Get payer performance metrics
 */
router.get('/payer-performance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const performance = await arAgingService.getPayerPerformance(organizationId);

    res.json({
      success: true,
      performance,
    });
  } catch (error) {
    logger.error('Failed to get payer performance', { error });
    next(error);
  }
});

// ============================================================
// SNAPSHOTS
// ============================================================

/**
 * POST /api/console/ar-aging/snapshot
 * Generate a new AR snapshot
 */
router.post('/snapshot', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const snapshot = await arAgingService.generateSnapshot(organizationId);

    logger.info('AR snapshot generated', {
      organizationId,
      snapshotId: snapshot.id,
      generatedBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      snapshot,
    });
  } catch (error) {
    logger.error('Failed to generate AR snapshot', { error });
    next(error);
  }
});

/**
 * GET /api/console/ar-aging/snapshot/:id
 * Get a specific AR snapshot
 */
router.get('/snapshot/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const snapshot = await arAgingService.getSnapshotById(id, organizationId);

    if (!snapshot) {
      throw ApiErrors.notFound('AR Snapshot');
    }

    res.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    logger.error('Failed to get AR snapshot', { error });
    next(error);
  }
});

export default router;
