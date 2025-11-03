/**
 * Mobile Routes
 * Mobile app EVV endpoints (clock-in/out)
 *
 * @module api/routes/mobile
 */

import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import jwt from 'jsonwebtoken';

const router = Router();

// ========================================
// AUTHENTICATION (No auth required)
// ========================================

/**
 * POST /api/mobile/auth/login
 * Authenticate caregiver with phone + PIN
 */
router.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      throw ApiErrors.badRequest('Phone and PIN are required');
    }

    // TODO: Query database for caregiver
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT id, first_name, last_name, pin_hash
    //   FROM caregivers
    //   WHERE phone = $1 AND status = 'active'
    // `, [phone]);

    // Mock authentication for development
    const mockCaregivers: Record<string, { id: string; name: string; pin: string }> = {
      '5551234567': { id: 'cg-001', name: 'Mary Smith', pin: '1234' },
      '5559876543': { id: 'cg-002', name: 'John Doe', pin: '5678' }
    };

    const cleanPhone = phone.replace(/\D/g, '');
    const caregiver = mockCaregivers[cleanPhone];

    if (!caregiver || caregiver.pin !== pin) {
      throw ApiErrors.unauthorized('Invalid phone number or PIN');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: caregiver.id, caregiverId: caregiver.id, role: 'caregiver' },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      caregiverId: caregiver.id,
      caregiverName: caregiver.name
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// SHIFTS (Auth required)
// ========================================

/**
 * GET /api/mobile/shifts/today
 * Get today's assigned shifts for caregiver
 */
router.get('/shifts/today', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const caregiverId = req.user?.id;

    if (!caregiverId) {
      throw ApiErrors.unauthorized('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // TODO: Query database for shifts
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     s.id,
    //     s.scheduled_start,
    //     s.scheduled_end,
    //     s.status,
    //     c.id as patient_id,
    //     c.first_name || ' ' || c.last_name as patient_name,
    //     c.address,
    //     c.latitude,
    //     c.longitude,
    //     e.clock_in_time,
    //     e.clock_out_time
    //   FROM shifts s
    //   JOIN clients c ON c.id = s.patient_id
    //   LEFT JOIN evv_records e ON e.shift_id = s.id
    //   WHERE s.caregiver_id = $1
    //     AND DATE(s.scheduled_start) = $2
    //   ORDER BY s.scheduled_start
    // `, [caregiverId, today]);

    // Mock shifts for development
    const mockShifts = [
      {
        id: 'shift-001',
        patient: {
          id: 'patient-001',
          name: 'Margaret Johnson',
          address: '123 Main St, Dayton, OH 45402',
          latitude: 39.7589,
          longitude: -84.1916
        },
        scheduledStart: `${today}T08:00:00Z`,
        scheduledEnd: `${today}T09:30:00Z`,
        status: 'scheduled',
        clockInTime: null,
        clockOutTime: null
      },
      {
        id: 'shift-002',
        patient: {
          id: 'patient-002',
          name: 'Robert Williams',
          address: '456 Oak Ave, Dayton, OH 45420',
          latitude: 39.7797,
          longitude: -84.1998
        },
        scheduledStart: `${today}T10:00:00Z`,
        scheduledEnd: `${today}T11:00:00Z`,
        status: 'scheduled',
        clockInTime: null,
        clockOutTime: null
      },
      {
        id: 'shift-003',
        patient: {
          id: 'patient-003',
          name: 'Dorothy Miller',
          address: '789 Elm St, Dayton, OH 45419',
          latitude: 39.7392,
          longitude: -84.1694
        },
        scheduledStart: `${today}T13:00:00Z`,
        scheduledEnd: `${today}T14:30:00Z`,
        status: 'scheduled',
        clockInTime: null,
        clockOutTime: null
      }
    ];

    res.json({
      date: today,
      caregiverId,
      shifts: mockShifts
    });
  } catch (error) {
    next(error);
  }
});

// All EVV routes require authentication
// (Moved requireAuth to individual routes where needed)

// ========================================
// EVV CLOCK IN/OUT (Auth required)
// ========================================

/**
 * POST /api/mobile/evv/clock-in
 * Record clock-in event with GPS and geofence validation
 */
router.post('/evv/clock-in', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const caregiverId = req.user?.id;
    const { shiftId, timestamp, gps, deviceInfo } = req.body;

    if (!shiftId || !timestamp || !gps) {
      throw ApiErrors.badRequest('shiftId, timestamp, and gps are required');
    }

    if (!gps.latitude || !gps.longitude || !gps.accuracy) {
      throw ApiErrors.badRequest('GPS data must include latitude, longitude, and accuracy');
    }

    // TODO: Validate geofence
    // const shift = await getShift(shiftId);
    // const distance = calculateDistance(gps.latitude, gps.longitude, shift.patient.latitude, shift.patient.longitude);
    // const geofenceRadius = await getConfigValue('evv_geofence_radius_meters'); // Default: 150m
    // if (distance > geofenceRadius) {
    //   throw ApiErrors.badRequest(`Geofence validation failed. You are ${distance}m from patient location (must be within ${geofenceRadius}m)`);
    // }

    // TODO: Save to database
    // const db = DatabaseClient.getInstance();
    // const evvRecordId = uuidv4();
    // await db.query(`
    //   INSERT INTO evv_records (
    //     id, shift_id, caregiver_id, clock_in_time,
    //     clock_in_latitude, clock_in_longitude, clock_in_accuracy,
    //     clock_in_device, validation_status, created_at
    //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'valid', NOW())
    // `, [evvRecordId, shiftId, caregiverId, timestamp, gps.latitude, gps.longitude, gps.accuracy, deviceInfo]);

    // TODO: Update shift status to 'in_progress'
    // await db.query(`UPDATE shifts SET status = 'in_progress' WHERE id = $1`, [shiftId]);

    // Mock response for development
    console.log(`[EVV CLOCK-IN] Caregiver ${caregiverId} clocked in to shift ${shiftId}`);
    console.log(`  GPS: ${gps.latitude}, ${gps.longitude} (accuracy: ${gps.accuracy}m)`);
    console.log(`  Time: ${timestamp}`);

    res.status(201).json({
      success: true,
      evvRecordId: `evv-${Date.now()}`,
      clockInTime: timestamp,
      gps: {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy
      },
      geofenceValid: true,
      message: 'Clocked in successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mobile/evv/clock-out
 * Record clock-out event with GPS, tasks completed, and visit notes
 */
router.post('/evv/clock-out', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const caregiverId = req.user?.id;
    const { shiftId, timestamp, gps, deviceInfo, tasksCompleted, notes } = req.body;

    if (!shiftId || !timestamp || !gps) {
      throw ApiErrors.badRequest('shiftId, timestamp, and gps are required');
    }

    if (!gps.latitude || !gps.longitude || !gps.accuracy) {
      throw ApiErrors.badRequest('GPS data must include latitude, longitude, and accuracy');
    }

    if (!tasksCompleted || !Array.isArray(tasksCompleted) || tasksCompleted.length === 0) {
      throw ApiErrors.badRequest('At least one task must be completed');
    }

    // TODO: Validate geofence
    // const shift = await getShift(shiftId);
    // const distance = calculateDistance(gps.latitude, gps.longitude, shift.patient.latitude, shift.patient.longitude);
    // const geofenceRadius = await getConfigValue('evv_geofence_radius_meters');
    // if (distance > geofenceRadius) {
    //   throw ApiErrors.badRequest(`Geofence validation failed. You are ${distance}m from patient location`);
    // }

    // TODO: Update EVV record in database
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE evv_records
    //   SET clock_out_time = $1,
    //       clock_out_latitude = $2,
    //       clock_out_longitude = $3,
    //       clock_out_accuracy = $4,
    //       tasks_completed = $5,
    //       notes = $6,
    //       validation_status = 'valid'
    //   WHERE shift_id = $7
    // `, [timestamp, gps.latitude, gps.longitude, gps.accuracy, tasksCompleted, notes, shiftId]);

    // TODO: Update shift status to 'completed'
    // await db.query(`UPDATE shifts SET status = 'completed' WHERE id = $1`, [shiftId]);

    // TODO: Trigger Sandata submission (if auto-submit enabled)
    // await sandataVisitsService.submitVisit(evvRecord);

    // Mock response for development
    console.log(`[EVV CLOCK-OUT] Caregiver ${caregiverId} clocked out from shift ${shiftId}`);
    console.log(`  GPS: ${gps.latitude}, ${gps.longitude} (accuracy: ${gps.accuracy}m)`);
    console.log(`  Time: ${timestamp}`);
    console.log(`  Tasks: ${tasksCompleted.join(', ')}`);
    console.log(`  Notes: ${notes || '(none)'}`);

    res.json({
      success: true,
      clockOutTime: timestamp,
      gps: {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy
      },
      geofenceValid: true,
      tasksCompleted,
      sandataStatus: 'pending_submission',
      message: 'Clocked out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// OFFLINE SYNC (Auth required)
// ========================================

/**
 * POST /api/mobile/evv/sync
 * Sync offline EVV records when connection is restored
 */
router.post('/evv/sync', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      throw ApiErrors.badRequest('records array is required and must not be empty');
    }

    const results = [];

    for (const record of records) {
      try {
        if (record.type === 'clock-in') {
          // Process clock-in
          // TODO: await processClockIn(record.data);
          results.push({ id: record.data.shiftId, status: 'success', type: 'clock-in' });
        } else if (record.type === 'clock-out') {
          // Process clock-out
          // TODO: await processClockOut(record.data);
          results.push({ id: record.data.shiftId, status: 'success', type: 'clock-out' });
        } else {
          results.push({ id: record.data?.shiftId, status: 'failed', error: 'Invalid record type' });
        }
      } catch (error: any) {
        results.push({ id: record.data?.shiftId, status: 'failed', error: error.message });
      }
    }

    const syncedCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`[OFFLINE SYNC] Synced ${syncedCount}/${records.length} records. ${failedCount} failed.`);

    res.json({
      success: true,
      synced: syncedCount,
      failed: failedCount,
      results,
      message: `Synced ${syncedCount} of ${records.length} offline records`
    });
  } catch (error) {
    next(error);
  }
});

export { router as mobileRouter };
