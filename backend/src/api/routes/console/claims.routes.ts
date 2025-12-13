/**
 * Claims Routes
 * API endpoints for claims generation, validation, and management
 *
 * @module api/routes/console/claims
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { claimsService } from '../../../services/billing/claims.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('claims-routes');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/claims/dashboard
 * Get claims dashboard summary
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await claimsService.getClaimsDashboard(organizationId);

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    logger.error('Failed to get claims dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/claims/billable
 * Get billable visits ready for claims
 */
router.get('/billable', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { startDate, endDate, clientId } = req.query;

    const visits = await claimsService.getBillableVisits(organizationId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      clientId: clientId as string,
      status: 'unbilled',
    });

    const totalChargeAmount = visits.reduce((sum, v) => sum + v.chargeAmount, 0);
    const totalUnits = visits.reduce((sum, v) => sum + v.units, 0);

    res.json({
      success: true,
      visits,
      summary: {
        count: visits.length,
        totalUnits,
        totalChargeAmount,
      },
    });
  } catch (error) {
    logger.error('Failed to get billable visits', { error });
    next(error);
  }
});

/**
 * POST /api/console/claims/validate
 * Validate visits before generating claims
 */
router.post('/validate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { visitIds } = req.body;

    if (!Array.isArray(visitIds) || visitIds.length === 0) {
      throw ApiErrors.badRequest('visitIds array is required');
    }

    const validation = await claimsService.validateVisitsForClaims(organizationId, visitIds);

    res.json({
      success: true,
      ...validation,
    });
  } catch (error) {
    logger.error('Failed to validate visits', { error });
    next(error);
  }
});

/**
 * POST /api/console/claims/generate
 * Generate claims from validated visits
 */
router.post('/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;

    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { visitIds } = req.body;

    if (!Array.isArray(visitIds) || visitIds.length === 0) {
      throw ApiErrors.badRequest('visitIds array is required');
    }

    const batch = await claimsService.generateClaims(organizationId, visitIds, userId);

    logger.info('Claims batch generated', {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      claimCount: batch.claimCount,
      userId,
    });

    res.status(201).json({
      success: true,
      batch,
      message: `Generated ${batch.claimCount} claims totaling $${batch.totalChargeAmount.toFixed(2)}`,
    });
  } catch (error) {
    logger.error('Failed to generate claims', { error });
    next(error);
  }
});

/**
 * GET /api/console/claims/batches
 * Get claim batches
 */
router.get('/batches', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, startDate, endDate, limit } = req.query;

    const batches = await claimsService.getClaimBatches(organizationId, {
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json({
      success: true,
      batches,
      count: batches.length,
    });
  } catch (error) {
    logger.error('Failed to get claim batches', { error });
    next(error);
  }
});

/**
 * GET /api/console/claims/batches/:batchId
 * Get claim batch details
 */
router.get('/batches/:batchId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.params;

    const batch = await claimsService.getClaimBatchDetails(batchId);

    if (!batch) {
      throw ApiErrors.notFound('Claim batch');
    }

    res.json({
      success: true,
      batch,
    });
  } catch (error) {
    logger.error('Failed to get batch details', { error });
    next(error);
  }
});

/**
 * POST /api/console/claims/batches/:batchId/edi
 * Generate EDI 837P file for a batch
 */
router.post('/batches/:batchId/edi', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.params;
    const { senderId, receiverId, isTest = true } = req.body;

    if (!senderId || !receiverId) {
      throw ApiErrors.badRequest('senderId and receiverId are required');
    }

    const ediContent = await claimsService.generateEDI837P(batchId, {
      senderId,
      receiverId,
      isTest,
    });

    // Return as downloadable file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="837P_${batchId}.edi"`);
    res.send(ediContent);
  } catch (error) {
    logger.error('Failed to generate EDI file', { error });
    next(error);
  }
});

/**
 * GET /api/console/claims/rates
 * Get Ohio Medicaid rate table
 */
router.get('/rates', async (_req: AuthenticatedRequest, res: Response) => {
  const { OHIO_MEDICAID_RATES } = await import('../../../services/billing/claims.service');

  res.json({
    success: true,
    rates: Object.entries(OHIO_MEDICAID_RATES).map(([code, info]) => ({
      serviceCode: code,
      ...info,
    })),
    effectiveDate: '2024-01-01',
    source: 'Ohio Department of Medicaid',
  });
});

export default router;
