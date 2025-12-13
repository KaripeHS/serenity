/**
 * Background Check Routes
 * API endpoints for background check management and compliance tracking
 *
 * @module api/routes/console/background-checks
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { backgroundCheckService } from '../../../services/background-check.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('background-checks-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/background-checks/dashboard
 * Get background check dashboard with stats and alerts
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [stats, needingChecks, recentChecks] = await Promise.all([
      backgroundCheckService.getComplianceStats(organizationId),
      backgroundCheckService.getCaregiversNeedingChecks(organizationId, { limit: 10 }),
      backgroundCheckService.getBackgroundChecks(organizationId, { limit: 10 }),
    ]);

    res.json({
      success: true,
      stats,
      needingChecks: {
        items: needingChecks,
        count: needingChecks.length,
        byStatus: {
          neverChecked: needingChecks.filter(c => c.checkStatus === 'never_checked').length,
          expired: needingChecks.filter(c => c.checkStatus === 'expired').length,
          expiringSoon: needingChecks.filter(c => c.checkStatus === 'expiring_soon').length,
        },
      },
      recentChecks: {
        items: recentChecks,
        count: recentChecks.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get background check dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/background-checks/stats
 * Get compliance statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await backgroundCheckService.getComplianceStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get compliance stats', { error });
    next(error);
  }
});

/**
 * GET /api/console/background-checks/caregivers-needing-checks
 * Get list of caregivers who need background checks
 */
router.get('/caregivers-needing-checks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, limit } = req.query;

    const caregivers = await backgroundCheckService.getCaregiversNeedingChecks(organizationId, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      caregivers,
      count: caregivers.length,
    });
  } catch (error) {
    logger.error('Failed to get caregivers needing checks', { error });
    next(error);
  }
});

// ============================================================
// BACKGROUND CHECK CRUD
// ============================================================

/**
 * GET /api/console/background-checks
 * Get all background checks with filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, checkType, caregiverId, employeeId, applicantId, healthStatus, limit, offset } = req.query;

    const checks = await backgroundCheckService.getBackgroundChecks(organizationId, {
      status: status as string,
      checkType: checkType as string,
      caregiverId: caregiverId as string,
      employeeId: employeeId as string,
      applicantId: applicantId as string,
      healthStatus: healthStatus as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      checks,
      count: checks.length,
    });
  } catch (error) {
    logger.error('Failed to get background checks', { error });
    next(error);
  }
});

/**
 * GET /api/console/background-checks/:id
 * Get a specific background check
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const check = await backgroundCheckService.getBackgroundCheckById(id, organizationId);

    if (!check) {
      throw ApiErrors.notFound('Background check');
    }

    res.json({
      success: true,
      check,
    });
  } catch (error) {
    logger.error('Failed to get background check', { error });
    next(error);
  }
});

/**
 * POST /api/console/background-checks
 * Create a new background check request
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      caregiverId,
      employeeId,
      applicantId,
      checkType,
      checkProvider,
      reason,
      livedOutsideOhio5yr,
      subjectDob,
      subjectSsnLast4,
    } = req.body;

    if (!checkType || !reason) {
      throw ApiErrors.badRequest('checkType and reason are required');
    }

    if (!caregiverId && !employeeId && !applicantId) {
      throw ApiErrors.badRequest('One of caregiverId, employeeId, or applicantId is required');
    }

    const check = await backgroundCheckService.createBackgroundCheck(organizationId, {
      caregiverId,
      employeeId,
      applicantId,
      checkType,
      checkProvider,
      reason,
      requestedBy: userId,
      livedOutsideOhio5yr,
      subjectDob,
      subjectSsnLast4,
    });

    logger.info('Background check created', {
      checkId: check.id,
      checkType,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      check,
    });
  } catch (error) {
    logger.error('Failed to create background check', { error });
    next(error);
  }
});

/**
 * POST /api/console/background-checks/:id/submit
 * Submit background check to provider
 */
router.post('/:id/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { submissionReference, fingerprintDate, fingerprintLocation } = req.body;

    const check = await backgroundCheckService.submitToProvider(id, organizationId, {
      submissionReference,
      fingerprintDate,
      fingerprintLocation,
    });

    if (!check) {
      throw ApiErrors.notFound('Background check');
    }

    logger.info('Background check submitted', { checkId: id });

    res.json({
      success: true,
      check,
    });
  } catch (error) {
    logger.error('Failed to submit background check', { error });
    next(error);
  }
});

/**
 * POST /api/console/background-checks/:id/results
 * Record background check results
 */
router.post('/:id/results', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { result, findings, disqualifyingOffenses, reportFileUrl } = req.body;

    if (!result) {
      throw ApiErrors.badRequest('result is required');
    }

    const check = await backgroundCheckService.recordResults(id, organizationId, {
      result,
      findings,
      disqualifyingOffenses,
      reportFileUrl,
    });

    if (!check) {
      throw ApiErrors.notFound('Background check');
    }

    logger.info('Background check results recorded', {
      checkId: id,
      result,
      recordedBy: req.user?.userId,
    });

    res.json({
      success: true,
      check,
    });
  } catch (error) {
    logger.error('Failed to record background check results', { error });
    next(error);
  }
});

/**
 * POST /api/console/background-checks/:id/review
 * Review a flagged background check
 */
router.post('/:id/review', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { decision, reviewNotes, conditions } = req.body;

    if (!decision) {
      throw ApiErrors.badRequest('decision is required');
    }

    const check = await backgroundCheckService.reviewCheck(id, organizationId, {
      reviewerId: userId,
      decision,
      reviewNotes,
      conditions,
    });

    if (!check) {
      throw ApiErrors.notFound('Background check');
    }

    logger.info('Background check reviewed', {
      checkId: id,
      decision,
      reviewerId: userId,
    });

    res.json({
      success: true,
      check,
    });
  } catch (error) {
    logger.error('Failed to review background check', { error });
    next(error);
  }
});

// ============================================================
// VALIDATION
// ============================================================

/**
 * GET /api/console/background-checks/validate/:caregiverId
 * Check if a caregiver has valid background check
 */
router.get('/validate/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const { checkTypes } = req.query;

    const types = checkTypes
      ? (checkTypes as string).split(',')
      : ['bci', 'bci_fbi'];

    const isValid = await backgroundCheckService.hasValidCheck(caregiverId, types);

    res.json({
      success: true,
      caregiverId,
      isValid,
      checkTypes: types,
    });
  } catch (error) {
    logger.error('Failed to validate background check', { error });
    next(error);
  }
});

// ============================================================
// REFERENCE CHECKS
// ============================================================

/**
 * POST /api/console/background-checks/:id/references
 * Add a reference to a background check
 */
router.post('/:id/references', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const {
      referenceName,
      referenceRelationship,
      referenceCompany,
      referencePhone,
      referenceEmail,
    } = req.body;

    if (!referenceName || !referenceRelationship) {
      throw ApiErrors.badRequest('referenceName and referenceRelationship are required');
    }

    const result = await backgroundCheckService.addReferenceCheck(id, organizationId, {
      referenceName,
      referenceRelationship,
      referenceCompany,
      referencePhone,
      referenceEmail,
    });

    res.status(201).json({
      success: true,
      referenceCheckId: result.id,
    });
  } catch (error) {
    logger.error('Failed to add reference check', { error });
    next(error);
  }
});

/**
 * PUT /api/console/background-checks/references/:referenceId/complete
 * Complete a reference check with results
 */
router.put('/references/:referenceId/complete', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { referenceId } = req.params;
    const {
      questionsAsked,
      responses,
      overallRating,
      wouldRehire,
      concernsRaised,
      concernDetails,
      verifiedEmployment,
      verifiedDatesMatch,
      verifiedTitleMatch,
      notes,
    } = req.body;

    await backgroundCheckService.completeReferenceCheck(referenceId, organizationId, {
      completedBy: userId,
      questionsAsked,
      responses,
      overallRating,
      wouldRehire,
      concernsRaised,
      concernDetails,
      verifiedEmployment,
      verifiedDatesMatch,
      verifiedTitleMatch,
      notes,
    });

    res.json({
      success: true,
      message: 'Reference check completed',
    });
  } catch (error) {
    logger.error('Failed to complete reference check', { error });
    next(error);
  }
});

// ============================================================
// UTILITIES
// ============================================================

/**
 * GET /api/console/background-checks/disqualifying-offenses
 * Get list of Ohio disqualifying offenses
 */
router.get('/disqualifying-offenses/list', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const offenses = await backgroundCheckService.getDisqualifyingOffenses();

    res.json({
      success: true,
      offenses,
      count: offenses.length,
    });
  } catch (error) {
    logger.error('Failed to get disqualifying offenses', { error });
    next(error);
  }
});

/**
 * POST /api/console/background-checks/run-expiration-check
 * Run expiration check and send reminders (admin only)
 */
router.post('/run-expiration-check', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const result = await backgroundCheckService.runExpirationCheck(organizationId);

    res.json({
      success: true,
      message: 'Expiration check completed',
      ...result,
    });
  } catch (error) {
    logger.error('Failed to run expiration check', { error });
    next(error);
  }
});

export default router;
