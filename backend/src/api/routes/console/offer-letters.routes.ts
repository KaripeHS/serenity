/**
 * Offer Letters Routes
 * API endpoints for offer letter management
 *
 * @module api/routes/console/offer-letters
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { offerLetterService } from '../../../services/offer-letter.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('offer-letters-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/offer-letters/dashboard
 * Get offer letter dashboard with stats
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [stats, pipeline] = await Promise.all([
      offerLetterService.getOfferLetterStats(organizationId),
      offerLetterService.getPipelineView(organizationId),
    ]);

    res.json({
      success: true,
      stats,
      pipeline,
    });
  } catch (error) {
    logger.error('Failed to get offer letters dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/offer-letters/stats
 * Get offer letter statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await offerLetterService.getOfferLetterStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get offer letter stats', { error });
    next(error);
  }
});

/**
 * GET /api/console/offer-letters/pipeline
 * Get offer letter pipeline view
 */
router.get('/pipeline', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const pipeline = await offerLetterService.getPipelineView(organizationId);

    res.json({
      success: true,
      pipeline,
      count: pipeline.length,
    });
  } catch (error) {
    logger.error('Failed to get offer letter pipeline', { error });
    next(error);
  }
});

// ============================================================
// OFFER LETTER CRUD
// ============================================================

/**
 * GET /api/console/offer-letters
 * Get offer letters with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { applicantId, status, fromDate, toDate } = req.query;

    const offerLetters = await offerLetterService.getOfferLetters(organizationId, {
      applicantId: applicantId as string,
      status: status as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json({
      success: true,
      offerLetters,
      count: offerLetters.length,
    });
  } catch (error) {
    logger.error('Failed to get offer letters', { error });
    next(error);
  }
});

/**
 * GET /api/console/offer-letters/:id
 * Get a specific offer letter by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const offerLetter = await offerLetterService.getOfferLetterById(id, organizationId);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to get offer letter', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters
 * Create a new offer letter
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      applicantId,
      jobRequisitionId,
      positionTitle,
      department,
      employmentType,
      salaryType,
      payRate,
      payFrequency,
      includesBonusProgram,
      bonusDetails,
      benefitsTier,
      ptoDays,
      sickDays,
      benefitsStartDate,
      benefitsDetails,
      expectedHoursPerWeek,
      scheduleType,
      scheduleNotes,
      proposedStartDate,
      responseDeadline,
      contingencies,
      specialConditions,
    } = req.body;

    if (!applicantId || !positionTitle || !employmentType || !salaryType || !payRate || !proposedStartDate) {
      throw ApiErrors.badRequest(
        'applicantId, positionTitle, employmentType, salaryType, payRate, and proposedStartDate are required'
      );
    }

    const offerLetter = await offerLetterService.createOfferLetter(
      organizationId,
      {
        applicantId,
        jobRequisitionId,
        positionTitle,
        department,
        employmentType,
        salaryType,
        payRate,
        payFrequency,
        includesBonusProgram,
        bonusDetails,
        benefitsTier,
        ptoDays,
        sickDays,
        benefitsStartDate,
        benefitsDetails,
        expectedHoursPerWeek,
        scheduleType,
        scheduleNotes,
        proposedStartDate,
        responseDeadline,
        contingencies,
        specialConditions,
      },
      userId
    );

    logger.info('Offer letter created', {
      offerLetterId: offerLetter.id,
      applicantId,
      position: positionTitle,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to create offer letter', { error });
    next(error);
  }
});

/**
 * PUT /api/console/offer-letters/:id
 * Update an offer letter
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const offerLetter = await offerLetterService.updateOfferLetter(id, organizationId, req.body);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter updated', {
      offerLetterId: id,
      updatedBy: req.user?.userId,
    });

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to update offer letter', { error });
    next(error);
  }
});

// ============================================================
// OFFER LETTER WORKFLOW
// ============================================================

/**
 * POST /api/console/offer-letters/:id/submit-for-approval
 * Submit offer letter for approval
 */
router.post('/:id/submit-for-approval', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const offerLetter = await offerLetterService.submitForApproval(id, organizationId);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter submitted for approval', {
      offerLetterId: id,
      submittedBy: req.user?.userId,
    });

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to submit offer letter for approval', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters/:id/approve
 * Approve an offer letter
 */
router.post('/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const offerLetter = await offerLetterService.approveOfferLetter(id, organizationId, userId);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter approved', {
      offerLetterId: id,
      approvedBy: userId,
    });

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to approve offer letter', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters/:id/send
 * Send offer letter to applicant
 */
router.post('/:id/send', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const offerLetter = await offerLetterService.sendOfferLetter(id, organizationId);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter sent', {
      offerLetterId: id,
      sentBy: req.user?.userId,
    });

    res.json({
      success: true,
      offerLetter,
      message: 'Offer letter sent successfully',
    });
  } catch (error) {
    logger.error('Failed to send offer letter', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters/:id/mark-viewed
 * Mark offer letter as viewed
 */
router.post('/:id/mark-viewed', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const offerLetter = await offerLetterService.markViewed(id, organizationId);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to mark offer letter as viewed', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters/:id/accept
 * Accept an offer letter
 */
router.post('/:id/accept', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { actualStartDate, signedOfferUrl } = req.body;

    const offerLetter = await offerLetterService.acceptOfferLetter(
      id,
      organizationId,
      actualStartDate,
      signedOfferUrl
    );

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter accepted', {
      offerLetterId: id,
      actualStartDate,
    });

    res.json({
      success: true,
      offerLetter,
      message: 'Offer letter accepted. Applicant marked as hired.',
    });
  } catch (error) {
    logger.error('Failed to accept offer letter', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters/:id/decline
 * Decline an offer letter
 */
router.post('/:id/decline', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { reason, counterOfferRequested, counterOfferNotes } = req.body;

    const offerLetter = await offerLetterService.declineOfferLetter(
      id,
      organizationId,
      reason,
      counterOfferRequested,
      counterOfferNotes
    );

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter declined', {
      offerLetterId: id,
      reason,
      counterOfferRequested,
    });

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to decline offer letter', { error });
    next(error);
  }
});

/**
 * POST /api/console/offer-letters/:id/rescind
 * Rescind an offer letter
 */
router.post('/:id/rescind', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const offerLetter = await offerLetterService.rescindOfferLetter(id, organizationId, reason);

    if (!offerLetter) {
      throw ApiErrors.notFound('Offer letter');
    }

    logger.info('Offer letter rescinded', {
      offerLetterId: id,
      reason,
      rescindedBy: req.user?.userId,
    });

    res.json({
      success: true,
      offerLetter,
    });
  } catch (error) {
    logger.error('Failed to rescind offer letter', { error });
    next(error);
  }
});

// ============================================================
// MAINTENANCE
// ============================================================

/**
 * POST /api/console/offer-letters/check-expired
 * Check for and update expired offer letters
 */
router.post('/check-expired', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const expiredCount = await offerLetterService.checkExpiredOffers(organizationId);

    res.json({
      success: true,
      message: `${expiredCount} offer letter(s) marked as expired`,
      expiredCount,
    });
  } catch (error) {
    logger.error('Failed to check expired offers', { error });
    next(error);
  }
});

export default router;
