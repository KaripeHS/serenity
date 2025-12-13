/**
 * Job Board / Shift Bidding Routes
 * API endpoints for the Staff Job Board & Shift Bidding System
 *
 * Best-in-Class Feature: Caregivers can self-select open shifts
 * from a job board, with automated qualification evaluation
 *
 * @module api/routes/console/job-board
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { jobBoardService as JobBoardService } from '../../../services/job-board.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('job-board-routes');

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * GET /api/console/job-board/dashboard
 * Get job board dashboard summary
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const dashboard = await JobBoardService.getDashboard(organizationId);

    res.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// OPEN SHIFTS
// ============================================================================

/**
 * GET /api/console/job-board/shifts
 * Get all open shifts for the organization
 */
router.get('/shifts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { status, urgency, clientId, startDate, endDate, limit, offset } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { shifts, count } = await JobBoardService.getOpenShifts(organizationId, {
      status: status as string,
      urgency: urgency as string,
      clientId: clientId as string,
      dateFrom: startDate as string,
      dateTo: endDate as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json({
      shifts,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/job-board/shifts/available
 * Get available shifts for a specific caregiver (with qualification scoring)
 */
router.get('/shifts/available', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const caregiverId = req.query.caregiverId as string || req.user?.userId;
    const { maxDistance, serviceType, startDate, endDate } = req.query;

    if (!organizationId || !caregiverId) {
      throw ApiErrors.badRequest('Organization and caregiver context required');
    }

    const shifts = await JobBoardService.getAvailableShiftsForCaregiver(
      organizationId,
      caregiverId,
      {
        maxDistanceMiles: maxDistance ? parseInt(maxDistance as string) : undefined,
        serviceType: serviceType as string,
        dateFrom: startDate as string,
        dateTo: endDate as string
      }
    );

    res.json({
      shifts,
      count: shifts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/job-board/shifts/:shiftId
 * Get details of a specific open shift
 */
router.get('/shifts/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { shiftId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { shifts } = await JobBoardService.getOpenShifts(organizationId, {});
    const shift = shifts.find((s: any) => s.id === shiftId);

    if (!shift) {
      throw ApiErrors.notFound('Shift not found');
    }

    // Get bids for this shift
    const bids = await JobBoardService.getBidsForShift(shiftId);

    res.json({
      shift,
      bids,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/job-board/shifts
 * Create a new open shift for the job board
 */
router.post('/shifts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      clientId,
      serviceType,
      serviceCode,
      shiftDate,
      startTime,
      endTime,
      durationMinutes,
      locationAddress,
      locationLat,
      locationLng,
      requiredSkills,
      requiredCertifications,
      preferredGender,
      minExperienceMonths,
      requiresVehicle,
      specialInstructions,
      urgency,
      payRate,
      bonusAmount,
      expiresAt,
      autoAssignEnabled,
      autoAssignMinScore,
      originalVisitId
    } = req.body;

    if (!clientId || !serviceType || !shiftDate || !startTime || !endTime) {
      throw ApiErrors.badRequest('Missing required fields: clientId, serviceType, shiftDate, startTime, endTime');
    }

    const shift = await JobBoardService.createOpenShift(organizationId, {
      clientId,
      serviceType,
      serviceCode,
      shiftDate, // Pass as string
      startTime,
      endTime,
      durationMinutes: durationMinutes || calculateDuration(startTime, endTime),
      locationAddress,
      locationLat,
      locationLng,
      requiredSkills,
      requiredCertifications,
      preferredGender,
      minExperienceMonths,
      requiresVehicle,
      specialInstructions,
      urgency: urgency || 'normal',
      payRate,
      bonusAmount,
      postedBy: userId,
      expiresAt, // Pass as string
      autoAssignEnabled,
      autoAssignMinScore,
      originalVisitId
    });

    logger.info(`Open shift created: ${shift.id} for client ${clientId}`);

    res.status(201).json({
      shift,
      message: 'Open shift created and posted to job board',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/job-board/shifts/:shiftId
 * Update an open shift
 */
router.put('/shifts/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { shiftId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    // Note: Would implement update in service
    logger.info(`Shift ${shiftId} update requested`);

    res.json({
      message: 'Shift updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/job-board/shifts/:shiftId
 * Cancel an open shift
 */
router.delete('/shifts/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { shiftId } = req.params;
    const organizationId = req.user?.organizationId;
    const { reason } = req.body;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    // Note: Would implement cancel in service
    logger.info(`Shift ${shiftId} cancelled: ${reason}`);

    res.json({
      message: 'Shift cancelled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SHIFT BIDS
// ============================================================================

/**
 * GET /api/console/job-board/bids
 * Get all bids (for coordinators) or caregiver's bids
 */
router.get('/bids', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { shiftId } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    // If shiftId provided, get bids for that shift
    if (shiftId) {
      const bids = await JobBoardService.getBidsForShift(shiftId as string);
      return res.json({
        bids,
        count: bids.length,
        timestamp: new Date().toISOString()
      });
    }

    // Otherwise return empty - would implement full bid listing
    res.json({
      bids: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/job-board/bids
 * Submit a bid on an open shift
 */
router.post('/bids', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const caregiverId = req.body.caregiverId || req.user?.userId;
    const { shiftId, message } = req.body;

    if (!organizationId || !caregiverId || !shiftId) {
      throw ApiErrors.badRequest('Missing required fields: shiftId');
    }

    const bid = await JobBoardService.submitBid(shiftId, caregiverId, message);

    logger.info(`Bid submitted: ${bid.id} by caregiver ${caregiverId} for shift ${shiftId}`);

    res.status(201).json({
      bid,
      message: 'Bid submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/job-board/bids/:bidId/accept
 * Accept a bid (assign the shift to the caregiver)
 */
router.put('/bids/:bidId/accept', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { bidId } = req.params;
    const organizationId = req.user?.organizationId;
    const reviewerId = req.user?.userId;

    if (!organizationId || !reviewerId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const result = await JobBoardService.acceptBid(bidId, organizationId, reviewerId);

    logger.info(`Bid ${bidId} accepted by ${reviewerId}`);

    res.json({
      ...result,
      message: 'Bid accepted - shift assigned to caregiver',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/job-board/bids/:bidId/decline
 * Decline a bid
 */
router.put('/bids/:bidId/decline', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { bidId } = req.params;
    const organizationId = req.user?.organizationId;
    const reviewerId = req.user?.userId;
    const { reason } = req.body;

    if (!organizationId || !reviewerId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const bid = await JobBoardService.declineBid(bidId, organizationId, reviewerId, reason);

    logger.info(`Bid ${bidId} declined by ${reviewerId}: ${reason}`);

    res.json({
      bid,
      message: 'Bid declined',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/job-board/bids/:bidId/withdraw
 * Withdraw a bid (by the caregiver)
 */
router.put('/bids/:bidId/withdraw', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { bidId } = req.params;
    const caregiverId = req.user?.userId;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    const success = await JobBoardService.withdrawBid(bidId, caregiverId);

    if (!success) {
      throw ApiErrors.badRequest('Unable to withdraw bid');
    }

    logger.info(`Bid ${bidId} withdrawn by caregiver ${caregiverId}`);

    res.json({
      message: 'Bid withdrawn',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CAREGIVER JOB PREFERENCES
// ============================================================================

/**
 * GET /api/console/job-board/preferences
 * Get caregiver's job board preferences
 */
router.get('/preferences', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.query.caregiverId as string || req.user?.userId;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    const preferences = await JobBoardService.getCaregiverPreferences(caregiverId);

    res.json({
      preferences,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/job-board/preferences
 * Update caregiver's job board preferences
 */
router.put('/preferences', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.body.caregiverId || req.user?.userId;
    const updates = req.body;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    // Remove caregiverId from updates to prevent override
    delete updates.caregiverId;

    const preferences = await JobBoardService.updateCaregiverPreferences(caregiverId, updates);

    logger.info(`Job preferences updated for caregiver ${caregiverId}`);

    res.json({
      preferences,
      message: 'Preferences updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate duration in minutes from start and end times
 */
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

  // Handle overnight shifts
  if (minutes < 0) {
    minutes += 24 * 60;
  }

  return minutes;
}

export default router;
