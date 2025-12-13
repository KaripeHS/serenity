/**
 * Authorizations Routes
 * API endpoints for service authorization management, utilization tracking, and renewals
 *
 * @module api/routes/console/authorizations
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { authorizationService } from '../../../services/authorization.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('authorizations-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/authorizations/dashboard
 * Get authorization dashboard with stats and alerts
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [stats, alerts] = await Promise.all([
      authorizationService.getAuthorizationStats(organizationId),
      authorizationService.getAlertsDashboard(organizationId),
    ]);

    res.json({
      success: true,
      stats,
      alerts: {
        items: alerts,
        count: alerts.length,
        bySeverity: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get authorization dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/authorizations/alerts
 * Get authorization alerts that need attention
 */
router.get('/alerts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { severity, clientId, payerId } = req.query;

    const alerts = await authorizationService.getAlertsDashboard(organizationId, {
      severity: severity as string,
      clientId: clientId as string,
      payerId: payerId as string,
    });

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    logger.error('Failed to get authorization alerts', { error });
    next(error);
  }
});

// ============================================================
// AUTHORIZATION CRUD
// ============================================================

/**
 * GET /api/console/authorizations
 * Get all authorizations with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { clientId, status, includeExpired } = req.query;

    if (!clientId) {
      throw ApiErrors.badRequest('clientId is required');
    }

    const authorizations = await authorizationService.getClientAuthorizations(
      clientId as string,
      organizationId,
      {
        status: status as string,
        includeExpired: includeExpired === 'true',
      }
    );

    res.json({
      success: true,
      authorizations,
      count: authorizations.length,
    });
  } catch (error) {
    logger.error('Failed to get authorizations', { error });
    next(error);
  }
});

/**
 * GET /api/console/authorizations/:id
 * Get a specific authorization by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const authorization = await authorizationService.getAuthorizationById(id, organizationId);

    if (!authorization) {
      throw ApiErrors.notFound('Authorization');
    }

    res.json({
      success: true,
      authorization,
    });
  } catch (error) {
    logger.error('Failed to get authorization', { error });
    next(error);
  }
});

/**
 * POST /api/console/authorizations
 * Create a new authorization
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      clientId,
      payerId,
      authorizationNumber,
      serviceCode,
      description,
      unitsApproved,
      startDate,
      endDate,
      frequencyLimit,
      frequencyType,
      maxUnitsPerFrequency,
      unitType,
      priorAuthRequired,
      diagnosisCodes,
      notes,
    } = req.body;

    if (!clientId || !payerId || !serviceCode || !unitsApproved || !startDate || !endDate) {
      throw ApiErrors.badRequest('clientId, payerId, serviceCode, unitsApproved, startDate, and endDate are required');
    }

    const authorization = await authorizationService.createAuthorization(organizationId, {
      clientId,
      payerId,
      authorizationNumber,
      serviceCode,
      description,
      unitsApproved,
      startDate,
      endDate,
      frequencyLimit,
      frequencyType,
      maxUnitsPerFrequency,
      unitType,
      priorAuthRequired,
      diagnosisCodes,
      notes,
    });

    logger.info('Authorization created', {
      authorizationId: authorization.id,
      clientId,
      createdBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      authorization,
    });
  } catch (error) {
    logger.error('Failed to create authorization', { error });
    next(error);
  }
});

/**
 * PUT /api/console/authorizations/:id
 * Update an authorization
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const authorization = await authorizationService.updateAuthorization(id, organizationId, req.body);

    if (!authorization) {
      throw ApiErrors.notFound('Authorization');
    }

    logger.info('Authorization updated', {
      authorizationId: id,
      updatedBy: req.user?.userId,
    });

    res.json({
      success: true,
      authorization,
    });
  } catch (error) {
    logger.error('Failed to update authorization', { error });
    next(error);
  }
});

// ============================================================
// USAGE TRACKING
// ============================================================

/**
 * GET /api/console/authorizations/:id/usage
 * Get usage history for an authorization
 */
router.get('/:id/usage', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const usage = await authorizationService.getUsageHistory(id, organizationId);

    res.json({
      success: true,
      usage,
      count: usage.length,
    });
  } catch (error) {
    logger.error('Failed to get usage history', { error });
    next(error);
  }
});

/**
 * POST /api/console/authorizations/:id/usage
 * Record usage against an authorization
 */
router.post('/:id/usage', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { visitId, usageDate, unitsUsed, billingCode, notes } = req.body;

    if (!usageDate || !unitsUsed) {
      throw ApiErrors.badRequest('usageDate and unitsUsed are required');
    }

    const result = await authorizationService.recordUsage(id, organizationId, {
      visitId,
      usageDate,
      unitsUsed,
      billingCode,
      notes,
    });

    if (!result.success) {
      throw ApiErrors.badRequest(result.message);
    }

    res.json({
      success: true,
      message: result.message,
      remainingUnits: result.remainingUnits,
    });
  } catch (error) {
    logger.error('Failed to record usage', { error });
    next(error);
  }
});

// ============================================================
// VALIDATION
// ============================================================

/**
 * POST /api/console/authorizations/validate
 * Validate authorization for a service
 */
router.post('/validate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { clientId, serviceCode, serviceDate, unitsNeeded } = req.body;

    if (!clientId || !serviceCode || !serviceDate || !unitsNeeded) {
      throw ApiErrors.badRequest('clientId, serviceCode, serviceDate, and unitsNeeded are required');
    }

    const result = await authorizationService.validateForService(
      clientId,
      organizationId,
      serviceCode,
      serviceDate,
      unitsNeeded
    );

    res.json({
      success: true,
      valid: result.valid,
      message: result.message,
      authorization: result.authorization,
    });
  } catch (error) {
    logger.error('Failed to validate authorization', { error });
    next(error);
  }
});

// ============================================================
// RENEWALS
// ============================================================

/**
 * GET /api/console/authorizations/renewals
 * Get renewal requests
 */
router.get('/renewals/list', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, clientId } = req.query;

    const renewals = await authorizationService.getRenewalRequests(organizationId, {
      status: status as string,
      clientId: clientId as string,
    });

    res.json({
      success: true,
      renewals,
      count: renewals.length,
    });
  } catch (error) {
    logger.error('Failed to get renewal requests', { error });
    next(error);
  }
});

/**
 * POST /api/console/authorizations/:id/renewal
 * Create a renewal request for an authorization
 */
router.post('/:id/renewal', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const {
      requestedUnits,
      requestedStartDate,
      requestedEndDate,
      clinicalJustification,
      supportingDocuments,
    } = req.body;

    if (!requestedUnits || !requestedStartDate || !requestedEndDate) {
      throw ApiErrors.badRequest('requestedUnits, requestedStartDate, and requestedEndDate are required');
    }

    const renewal = await authorizationService.createRenewalRequest(organizationId, {
      originalAuthorizationId: id,
      requestedUnits,
      requestedStartDate,
      requestedEndDate,
      clinicalJustification,
      supportingDocuments,
    });

    logger.info('Renewal request created', {
      renewalId: renewal.id,
      originalAuthId: id,
      createdBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      renewal,
    });
  } catch (error) {
    logger.error('Failed to create renewal request', { error });
    next(error);
  }
});

/**
 * POST /api/console/authorizations/renewals/:renewalId/submit
 * Submit a renewal request to the payer
 */
router.post('/renewals/:renewalId/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { renewalId } = req.params;
    const { payerReferenceNumber } = req.body;

    const renewal = await authorizationService.submitRenewalRequest(
      renewalId,
      organizationId,
      userId,
      payerReferenceNumber
    );

    logger.info('Renewal request submitted', {
      renewalId,
      submittedBy: userId,
    });

    res.json({
      success: true,
      renewal,
    });
  } catch (error) {
    logger.error('Failed to submit renewal request', { error });
    next(error);
  }
});

/**
 * POST /api/console/authorizations/renewals/:renewalId/response
 * Process renewal response from payer
 */
router.post('/renewals/:renewalId/response', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { renewalId } = req.params;
    const {
      status,
      approvedUnits,
      approvedStartDate,
      approvedEndDate,
      denialReason,
      appealDeadline,
    } = req.body;

    if (!status) {
      throw ApiErrors.badRequest('status is required');
    }

    const renewal = await authorizationService.processRenewalResponse(renewalId, organizationId, {
      status,
      approvedUnits,
      approvedStartDate,
      approvedEndDate,
      denialReason,
      appealDeadline,
    });

    logger.info('Renewal response processed', {
      renewalId,
      status,
      processedBy: req.user?.userId,
    });

    res.json({
      success: true,
      renewal,
    });
  } catch (error) {
    logger.error('Failed to process renewal response', { error });
    next(error);
  }
});

// ============================================================
// MAINTENANCE
// ============================================================

/**
 * POST /api/console/authorizations/run-expiration-check
 * Run expiration check to update expired authorizations (admin only)
 */
router.post('/run-expiration-check', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const result = await authorizationService.runExpirationCheck();

    logger.info('Expiration check completed', {
      expired: result.expired,
      runBy: req.user?.userId,
    });

    res.json({
      success: true,
      message: `Expiration check completed. ${result.expired} authorizations expired.`,
      expired: result.expired,
    });
  } catch (error) {
    logger.error('Failed to run expiration check', { error });
    next(error);
  }
});

export default router;
