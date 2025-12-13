/**
 * Interviews Routes
 * API endpoints for interview scheduling and feedback
 *
 * @module api/routes/console/interviews
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { interviewService } from '../../../services/interview.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('interviews-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/interviews/dashboard
 * Get interview dashboard with stats
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [stats, myUpcoming] = await Promise.all([
      interviewService.getInterviewStats(organizationId),
      interviewService.getUpcomingInterviewsForUser(userId, organizationId),
    ]);

    res.json({
      success: true,
      stats,
      myUpcoming: {
        items: myUpcoming,
        count: myUpcoming.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get interviews dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/interviews/stats
 * Get interview statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await interviewService.getInterviewStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get interview stats', { error });
    next(error);
  }
});

// ============================================================
// INTERVIEW CRUD
// ============================================================

/**
 * GET /api/console/interviews
 * Get interviews with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { applicantId, interviewerId, status, type, fromDate, toDate } = req.query;

    const interviews = await interviewService.getInterviews(organizationId, {
      applicantId: applicantId as string,
      interviewerId: interviewerId as string,
      status: status as string,
      interviewType: type as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json({
      success: true,
      interviews,
      count: interviews.length,
    });
  } catch (error) {
    logger.error('Failed to get interviews', { error });
    next(error);
  }
});

/**
 * GET /api/console/interviews/my-upcoming
 * Get upcoming interviews for current user
 */
router.get('/my-upcoming', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { days } = req.query;

    const interviews = await interviewService.getUpcomingInterviewsForUser(
      userId,
      organizationId,
      days ? parseInt(days as string, 10) : 7
    );

    res.json({
      success: true,
      interviews,
      count: interviews.length,
    });
  } catch (error) {
    logger.error('Failed to get upcoming interviews', { error });
    next(error);
  }
});

/**
 * GET /api/console/interviews/:id
 * Get a specific interview by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const interview = await interviewService.getInterviewById(id, organizationId);

    if (!interview) {
      throw ApiErrors.notFound('Interview');
    }

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to get interview', { error });
    next(error);
  }
});

/**
 * POST /api/console/interviews
 * Schedule a new interview
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
      interviewType,
      scheduledDate,
      interviewerId,
      secondaryInterviewerId,
      questions,
    } = req.body;

    if (!applicantId || !interviewType || !scheduledDate || !interviewerId) {
      throw ApiErrors.badRequest('applicantId, interviewType, scheduledDate, and interviewerId are required');
    }

    const interview = await interviewService.scheduleInterview(
      organizationId,
      {
        applicantId,
        interviewType,
        scheduledDate,
        interviewerId,
        secondaryInterviewerId,
        questions,
      },
      userId
    );

    logger.info('Interview scheduled', {
      interviewId: interview.id,
      applicantId,
      type: interviewType,
      scheduledBy: userId,
    });

    res.status(201).json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to schedule interview', { error });
    next(error);
  }
});

/**
 * PUT /api/console/interviews/:id
 * Update an interview
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const interview = await interviewService.updateInterview(id, organizationId, req.body);

    if (!interview) {
      throw ApiErrors.notFound('Interview');
    }

    logger.info('Interview updated', {
      interviewId: id,
      updatedBy: req.user?.userId,
    });

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to update interview', { error });
    next(error);
  }
});

// ============================================================
// INTERVIEW ACTIONS
// ============================================================

/**
 * POST /api/console/interviews/:id/reschedule
 * Reschedule an interview
 */
router.post('/:id/reschedule', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { newDate } = req.body;

    if (!newDate) {
      throw ApiErrors.badRequest('newDate is required');
    }

    const interview = await interviewService.rescheduleInterview(id, organizationId, newDate);

    if (!interview) {
      throw ApiErrors.notFound('Interview');
    }

    logger.info('Interview rescheduled', {
      oldInterviewId: id,
      newInterviewId: interview.id,
      newDate,
      rescheduledBy: req.user?.userId,
    });

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to reschedule interview', { error });
    next(error);
  }
});

/**
 * POST /api/console/interviews/:id/cancel
 * Cancel an interview
 */
router.post('/:id/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { reason } = req.body;

    const interview = await interviewService.cancelInterview(id, organizationId, reason);

    if (!interview) {
      throw ApiErrors.notFound('Interview');
    }

    logger.info('Interview cancelled', {
      interviewId: id,
      reason,
      cancelledBy: req.user?.userId,
    });

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to cancel interview', { error });
    next(error);
  }
});

/**
 * POST /api/console/interviews/:id/no-show
 * Mark interview as no-show
 */
router.post('/:id/no-show', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const interview = await interviewService.markNoShow(id, organizationId);

    if (!interview) {
      throw ApiErrors.notFound('Interview');
    }

    logger.info('Interview marked as no-show', {
      interviewId: id,
      markedBy: req.user?.userId,
    });

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to mark interview as no-show', { error });
    next(error);
  }
});

/**
 * POST /api/console/interviews/:id/feedback
 * Submit interview feedback
 */
router.post('/:id/feedback', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { responses, overallRating, notes, recommendation } = req.body;

    const interview = await interviewService.submitFeedback(id, organizationId, {
      responses,
      overallRating,
      notes,
      recommendation,
    });

    if (!interview) {
      throw ApiErrors.notFound('Interview');
    }

    logger.info('Interview feedback submitted', {
      interviewId: id,
      rating: overallRating,
      recommendation,
      submittedBy: req.user?.userId,
    });

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    logger.error('Failed to submit interview feedback', { error });
    next(error);
  }
});

// ============================================================
// SCHEDULING
// ============================================================

/**
 * GET /api/console/interviews/available-slots
 * Get available interview slots for a date range
 */
router.get('/available-slots/:interviewerId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { interviewerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('startDate and endDate are required');
    }

    const slots = await interviewService.getAvailableSlots(
      organizationId,
      interviewerId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      interviewerId,
      startDate,
      endDate,
      slots,
      count: slots.length,
    });
  } catch (error) {
    logger.error('Failed to get available slots', { error });
    next(error);
  }
});

export default router;
