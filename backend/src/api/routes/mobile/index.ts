/**
 * Mobile Routes
 * Mobile app EVV endpoints (clock-in/out)
 *
 * @module api/routes/mobile
 */

import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

// All Mobile routes require authentication
router.use(requireAuth);

/**
 * POST /api/mobile/evv/clock-in
 * Record clock-in event with GPS
 */
router.post('/evv/clock-in', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { shiftId, latitude, longitude, accuracy, timestamp } = req.body;

    if (!shiftId || !latitude || !longitude) {
      throw ApiErrors.badRequest('shiftId, latitude, and longitude are required');
    }

    // TODO: Validate GPS accuracy
    // TODO: Check geofence
    // TODO: Create EVV record in database

    res.status(201).json({
      success: true,
      evvRecordId: `evv-${Date.now()}`,
      clockInTime: timestamp || new Date().toISOString(),
      message: 'Clock-in recorded successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mobile/evv/clock-out
 * Record clock-out event with GPS
 */
router.post('/evv/clock-out', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { evvRecordId, latitude, longitude, accuracy, timestamp } = req.body;

    if (!evvRecordId || !latitude || !longitude) {
      throw ApiErrors.badRequest('evvRecordId, latitude, and longitude are required');
    }

    // TODO: Update EVV record with clock-out
    // TODO: Validate clock-out time > clock-in time
    // TODO: Calculate billable units
    // TODO: Auto-submit to Sandata if enabled

    res.json({
      success: true,
      evvRecordId,
      clockOutTime: timestamp || new Date().toISOString(),
      billableUnits: 4, // TODO: Calculate from times
      message: 'Clock-out recorded successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mobile/shifts/today
 * Get today's assigned shifts for caregiver
 */
router.get('/shifts/today', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.user?.id;

    if (!caregiverId) {
      throw ApiErrors.unauthorized('User not authenticated');
    }

    // TODO: Fetch shifts from database

    res.json({
      shifts: [
        {
          id: 'shift-1',
          clientName: 'John Doe',
          clientAddress: '123 Main St, Columbus, OH 43215',
          scheduledStart: '2025-11-02T09:00:00Z',
          scheduledEnd: '2025-11-02T13:00:00Z',
          serviceCode: 'T1019',
          status: 'scheduled',
        },
      ],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mobile/offline-queue/sync
 * Sync offline EVV records
 */
router.post('/offline-queue/sync', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      throw ApiErrors.badRequest('records array is required');
    }

    // TODO: Process offline records
    // TODO: Validate timestamps
    // TODO: Submit to Sandata

    res.json({
      success: true,
      processed: records.length,
      message: `Synced ${records.length} offline records`,
    });
  } catch (error) {
    next(error);
  }
});

export { router as mobileRouter };
