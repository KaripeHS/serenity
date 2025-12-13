/**
 * Applicants Routes
 * API endpoints for applicant tracking and recruiting pipeline
 *
 * @module api/routes/console/applicants
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { applicantService } from '../../../services/applicant.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('applicants-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/applicants/dashboard
 * Get recruiting dashboard with pipeline stats
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [pipelineSummary, needsAction, sourceAnalytics] = await Promise.all([
      applicantService.getPipelineSummary(organizationId),
      applicantService.getApplicantsNeedingAction(organizationId),
      applicantService.getSourceAnalytics(organizationId),
    ]);

    res.json({
      success: true,
      pipeline: pipelineSummary,
      needsAction: {
        items: needsAction,
        count: needsAction.length,
      },
      sourceAnalytics,
    });
  } catch (error) {
    logger.error('Failed to get applicants dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/applicants/pipeline
 * Get pipeline summary
 */
router.get('/pipeline', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const pipeline = await applicantService.getPipelineSummary(organizationId);

    res.json({
      success: true,
      ...pipeline,
    });
  } catch (error) {
    logger.error('Failed to get pipeline summary', { error });
    next(error);
  }
});

// ============================================================
// APPLICANT CRUD
// ============================================================

/**
 * GET /api/console/applicants
 * Get all applicants with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, stage, position, source, fromDate, toDate, search } = req.query;

    const applicants = await applicantService.getApplicants(organizationId, {
      status: status as string,
      stage: stage as string,
      positionAppliedFor: position as string,
      source: source as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      search: search as string,
    });

    res.json({
      success: true,
      applicants,
      count: applicants.length,
    });
  } catch (error) {
    logger.error('Failed to get applicants', { error });
    next(error);
  }
});

/**
 * GET /api/console/applicants/:id
 * Get a specific applicant by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const applicant = await applicantService.getApplicantById(id, organizationId);

    if (!applicant) {
      throw ApiErrors.notFound('Applicant');
    }

    res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    logger.error('Failed to get applicant', { error });
    next(error);
  }
});

/**
 * POST /api/console/applicants
 * Create a new applicant
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      positionAppliedFor,
      source,
      referredBy,
      resumeFileId,
      coverLetterFileId,
      experienceLevel,
      certifications,
      skills,
      availability,
      desiredSalaryMin,
      desiredSalaryMax,
      availableStartDate,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !positionAppliedFor) {
      throw ApiErrors.badRequest('firstName, lastName, email, phone, and positionAppliedFor are required');
    }

    // Check for duplicates
    const duplicates = await applicantService.checkDuplicate(organizationId, email, phone);
    if (duplicates.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_APPLICANT',
        message: 'An applicant with this email or phone already exists',
        duplicates,
      });
    }

    const applicant = await applicantService.createApplicant(
      organizationId,
      {
        firstName,
        lastName,
        email,
        phone,
        address,
        dateOfBirth,
        positionAppliedFor,
        source,
        referredBy,
        resumeFileId,
        coverLetterFileId,
        experienceLevel,
        certifications,
        skills,
        availability,
        desiredSalaryMin,
        desiredSalaryMax,
        availableStartDate,
      },
      userId
    );

    logger.info('Applicant created', {
      applicantId: applicant.id,
      position: positionAppliedFor,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      applicant,
    });
  } catch (error) {
    logger.error('Failed to create applicant', { error });
    next(error);
  }
});

/**
 * PUT /api/console/applicants/:id
 * Update an applicant
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const applicant = await applicantService.updateApplicant(id, organizationId, req.body);

    if (!applicant) {
      throw ApiErrors.notFound('Applicant');
    }

    logger.info('Applicant updated', {
      applicantId: id,
      updatedBy: req.user?.userId,
    });

    res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    logger.error('Failed to update applicant', { error });
    next(error);
  }
});

// ============================================================
// STAGE MANAGEMENT
// ============================================================

/**
 * POST /api/console/applicants/:id/advance
 * Advance applicant to next stage
 */
router.post('/:id/advance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      throw ApiErrors.badRequest('stage is required');
    }

    const applicant = await applicantService.advanceStage(id, organizationId, stage);

    if (!applicant) {
      throw ApiErrors.notFound('Applicant');
    }

    logger.info('Applicant stage advanced', {
      applicantId: id,
      newStage: stage,
      advancedBy: req.user?.userId,
    });

    res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    logger.error('Failed to advance applicant stage', { error });
    next(error);
  }
});

/**
 * POST /api/console/applicants/:id/reject
 * Reject an applicant
 */
router.post('/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw ApiErrors.badRequest('reason is required');
    }

    const applicant = await applicantService.rejectApplicant(id, organizationId, reason);

    if (!applicant) {
      throw ApiErrors.notFound('Applicant');
    }

    logger.info('Applicant rejected', {
      applicantId: id,
      reason,
      rejectedBy: req.user?.userId,
    });

    res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    logger.error('Failed to reject applicant', { error });
    next(error);
  }
});

/**
 * POST /api/console/applicants/:id/hire
 * Mark applicant as hired
 */
router.post('/:id/hire', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { employeeId } = req.body;

    const applicant = await applicantService.markHired(id, organizationId, employeeId);

    if (!applicant) {
      throw ApiErrors.notFound('Applicant');
    }

    logger.info('Applicant marked as hired', {
      applicantId: id,
      employeeId,
      hiredBy: req.user?.userId,
    });

    res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    logger.error('Failed to mark applicant as hired', { error });
    next(error);
  }
});

// ============================================================
// ANALYTICS
// ============================================================

/**
 * GET /api/console/applicants/analytics/sources
 * Get source analytics
 */
router.get('/analytics/sources', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { period } = req.query;
    const analytics = await applicantService.getSourceAnalytics(
      organizationId,
      (period as string) || '90 days'
    );

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    logger.error('Failed to get source analytics', { error });
    next(error);
  }
});

/**
 * GET /api/console/applicants/check-duplicate
 * Check for duplicate applicants
 */
router.get('/check-duplicate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { email, phone } = req.query;

    if (!email) {
      throw ApiErrors.badRequest('email is required');
    }

    const duplicates = await applicantService.checkDuplicate(
      organizationId,
      email as string,
      phone as string
    );

    res.json({
      success: true,
      hasDuplicates: duplicates.length > 0,
      duplicates,
    });
  } catch (error) {
    logger.error('Failed to check for duplicates', { error });
    next(error);
  }
});

export default router;
