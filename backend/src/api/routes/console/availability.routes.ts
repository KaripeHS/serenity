/**
 * Availability Routes
 * API endpoints for caregiver availability management
 *
 * @module api/routes/console/availability
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { availabilityService } from '../../../services/availability.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('availability-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// AVAILABILITY PATTERNS
// ============================================================

/**
 * GET /api/console/availability/patterns/:caregiverId
 * Get a caregiver's weekly availability patterns
 */
router.get('/patterns/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const patterns = await availabilityService.getAvailabilityPatterns(organizationId, caregiverId);

    res.json({
      success: true,
      caregiverId,
      patterns,
    });
  } catch (error) {
    logger.error('Failed to get availability patterns', { error });
    next(error);
  }
});

/**
 * PUT /api/console/availability/patterns/:caregiverId
 * Update a caregiver's weekly availability patterns
 */
router.put('/patterns/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const { patterns } = req.body;

    if (!Array.isArray(patterns)) {
      throw ApiErrors.badRequest('patterns must be an array');
    }

    await availabilityService.setAvailabilityPatterns(organizationId, caregiverId, patterns);

    logger.info('Availability patterns updated', { caregiverId, updatedBy: userId });

    res.json({
      success: true,
      message: 'Availability patterns updated',
    });
  } catch (error) {
    logger.error('Failed to update availability patterns', { error });
    next(error);
  }
});

/**
 * GET /api/console/availability/check/:caregiverId
 * Check if a caregiver is available for a specific date/time
 */
router.get('/check/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      throw ApiErrors.badRequest('date, startTime, and endTime are required');
    }

    const availability = await availabilityService.checkAvailability(
      caregiverId,
      date as string,
      startTime as string,
      endTime as string
    );

    res.json({
      success: true,
      caregiverId,
      date,
      startTime,
      endTime,
      ...availability,
    });
  } catch (error) {
    logger.error('Failed to check availability', { error });
    next(error);
  }
});

// ============================================================
// TIME-OFF REQUESTS
// ============================================================

/**
 * GET /api/console/availability/time-off
 * Get time-off requests with optional filters
 */
router.get('/time-off', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId, status, startDate, endDate } = req.query;

    const requests = await availabilityService.getTimeOffRequests(organizationId, {
      userId: caregiverId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    logger.error('Failed to get time-off requests', { error });
    next(error);
  }
});

/**
 * GET /api/console/availability/time-off/:caregiverId
 * Get time-off requests for a specific caregiver
 */
router.get('/time-off/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const { status, startDate, endDate } = req.query;

    const requests = await availabilityService.getTimeOffRequests(organizationId, {
      userId: caregiverId,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      caregiverId,
      requests,
      count: requests.length,
    });
  } catch (error) {
    logger.error('Failed to get caregiver time-off requests', { error });
    next(error);
  }
});

/**
 * POST /api/console/availability/time-off
 * Create a new time-off request
 */
router.post('/time-off', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId, startDate, endDate, requestType, reason, isEmergency } = req.body;

    if (!caregiverId || !startDate || !endDate || !requestType) {
      throw ApiErrors.badRequest('caregiverId, startDate, endDate, and requestType are required');
    }

    const request = await availabilityService.createTimeOffRequest(organizationId, caregiverId, {
      requestType,
      startDate,
      endDate,
      reason,
    });

    logger.info('Time-off request created', { requestId: request.id, caregiverId });

    res.status(201).json({
      success: true,
      request,
    });
  } catch (error) {
    logger.error('Failed to create time-off request', { error });
    next(error);
  }
});

/**
 * PUT /api/console/availability/time-off/:requestId/review
 * Approve or deny a time-off request
 */
router.put('/time-off/:requestId/review', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const reviewerId = req.user?.userId;
    if (!organizationId || !reviewerId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { requestId } = req.params;
    const { approved, reviewerNotes } = req.body;

    if (approved === undefined) {
      throw ApiErrors.badRequest('approved (boolean) is required');
    }

    const request = await availabilityService.reviewTimeOffRequest(
      organizationId,
      requestId,
      reviewerId,
      {
        status: approved ? 'approved' : 'denied',
        notes: reviewerNotes,
      }
    );

    logger.info('Time-off request reviewed', {
      requestId,
      approved,
      reviewerId
    });

    res.json({
      success: true,
      request,
    });
  } catch (error) {
    logger.error('Failed to review time-off request', { error });
    next(error);
  }
});

// ============================================================
// WORK PREFERENCES
// ============================================================

/**
 * GET /api/console/availability/preferences/:caregiverId
 * Get a caregiver's work preferences
 */
router.get('/preferences/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const preferences = await availabilityService.getWorkPreferences(organizationId, caregiverId);

    res.json({
      success: true,
      caregiverId,
      preferences,
    });
  } catch (error) {
    logger.error('Failed to get work preferences', { error });
    next(error);
  }
});

/**
 * PUT /api/console/availability/preferences/:caregiverId
 * Update a caregiver's work preferences
 */
router.put('/preferences/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;
    const preferences = req.body;

    await availabilityService.updateWorkPreferences(organizationId, caregiverId, preferences);

    logger.info('Work preferences updated', { caregiverId, updatedBy: userId });

    res.json({
      success: true,
      message: 'Work preferences updated',
    });
  } catch (error) {
    logger.error('Failed to update work preferences', { error });
    next(error);
  }
});

// ============================================================
// CAREGIVER SEARCH
// ============================================================

/**
 * GET /api/console/availability/available-caregivers
 * Find caregivers available for a specific time slot
 */
router.get('/available-caregivers', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      throw ApiErrors.badRequest('date, startTime, and endTime are required');
    }

    const caregivers = await availabilityService.getAvailableCaregivers(
      organizationId,
      date as string,
      startTime as string,
      endTime as string
    );

    res.json({
      success: true,
      date,
      startTime,
      endTime,
      caregivers,
      count: caregivers.length,
    });
  } catch (error) {
    logger.error('Failed to find available caregivers', { error });
    next(error);
  }
});

/**
 * GET /api/console/availability/weekly-summary
 * Get weekly availability summary for all caregivers
 */
router.get('/weekly-summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { weekStartDate, podId } = req.query;

    // Use the view from migration
    const db = (await import('../../../database/client')).getDbClient();
    const client = await db;

    let query = `
      SELECT cwa.*, c.first_name, c.last_name, c.pod_id
      FROM caregiver_weekly_availability cwa
      JOIN caregivers c ON c.id = cwa.caregiver_id
      WHERE c.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (podId) {
      query += ` AND c.pod_id = $2`;
      params.push(podId);
    }

    query += ` ORDER BY c.last_name, c.first_name`;

    const result = await client.query(query, params);

    // Get upcoming time-off
    const timeOffResult = await client.query(`
      SELECT * FROM upcoming_time_off
      WHERE organization_id = $1
      ORDER BY start_date
    `, [organizationId]);

    res.json({
      success: true,
      weekStartDate: weekStartDate || 'current',
      availability: result.rows,
      upcomingTimeOff: timeOffResult.rows,
    });
  } catch (error) {
    logger.error('Failed to get weekly availability summary', { error });
    next(error);
  }
});

export default router;
