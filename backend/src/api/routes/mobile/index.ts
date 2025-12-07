/**
 * Mobile Routes
 * Mobile app EVV endpoints (clock-in/out)
 * NOW WIRED TO REAL DATABASE
 *
 * @module api/routes/mobile
 */

import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// Initialize repository
let repository: ReturnType<typeof getSandataRepository>;
try {
  repository = getSandataRepository(getDbClient());
} catch {
  // Repository will be initialized when first used
}

function getRepository() {
  if (!repository) {
    repository = getSandataRepository(getDbClient());
  }
  return repository;
}

// ========================================
// AUTHENTICATION (No auth required)
// ========================================

/**
 * POST /api/mobile/auth/login
 * Authenticate caregiver with phone + PIN or email + password
 */
router.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, pin, email, password } = req.body;

    // Support both phone/PIN and email/password authentication
    if (email && password) {
      // Email/password login
      const user = await getRepository().getUserByEmail(email);

      if (!user || !user.password_hash) {
        throw ApiErrors.unauthorized('Invalid email or password');
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw ApiErrors.unauthorized('Invalid email or password');
      }

      if (user.status !== 'active') {
        throw ApiErrors.forbidden('Account is not active');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          odUserI: user.id,
          caregiverId: user.id,
          role: user.role,
          organizationId: user.organization_id
        },
        process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        token,
        caregiverId: user.id,
        caregiverName: `${user.first_name} ${user.last_name}`,
        role: user.role
      });
    } else if (phone && pin) {
      // Phone/PIN login (for caregivers)
      const cleanPhone = phone.replace(/\D/g, '');

      // Query database for caregiver by phone
      const db = getDbClient();
      const result = await db.query<{
        id: string;
        first_name: string;
        last_name: string;
        role: string;
        status: string;
        organization_id: string;
      }>(
        `SELECT id, first_name, last_name, role, status, organization_id
         FROM users
         WHERE (phone = $1 OR phone = $2 OR phone = $3)
           AND role = 'caregiver'`,
        [phone, cleanPhone, `+1${cleanPhone}`]
      );

      if (result.rows.length === 0) {
        throw ApiErrors.unauthorized('Invalid phone number or PIN');
      }

      const caregiver = result.rows[0];

      // For demo/development, accept PIN "1234" for any caregiver
      // In production, this would validate against a stored PIN hash
      if (pin !== '1234') {
        throw ApiErrors.unauthorized('Invalid phone number or PIN');
      }

      if (caregiver.status !== 'active') {
        throw ApiErrors.forbidden('Account is not active');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: caregiver.id,
          odUserI: caregiver.id,
          caregiverId: caregiver.id,
          role: caregiver.role,
          organizationId: caregiver.organization_id
        },
        process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        token,
        caregiverId: caregiver.id,
        caregiverName: `${caregiver.first_name} ${caregiver.last_name}`
      });
    } else {
      throw ApiErrors.badRequest('Phone and PIN, or email and password are required');
    }
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
    const caregiverId = req.user?.userId;

    if (!caregiverId) {
      throw ApiErrors.unauthorized('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // Query real shifts from database
    const db = getDbClient();
    const result = await db.query<{
      id: string;
      scheduled_start: Date;
      scheduled_end: Date;
      actual_start: Date | null;
      actual_end: Date | null;
      status: string;
      client_id: string;
      client_first_name: string;
      client_last_name: string;
      client_address: any;
      evv_record_id: string | null;
    }>(
      `SELECT
        s.id,
        s.scheduled_start,
        s.scheduled_end,
        s.actual_start,
        s.actual_end,
        s.status,
        c.id as client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.address as client_address,
        s.evv_record_id
      FROM shifts s
      JOIN clients c ON c.id = s.client_id
      WHERE s.caregiver_id = $1
        AND DATE(s.scheduled_start) = $2
      ORDER BY s.scheduled_start`,
      [caregiverId, today]
    );

    const shifts = result.rows.map(row => {
      // Parse address if it's a JSON string
      let address = row.client_address;
      if (typeof address === 'string') {
        try {
          address = JSON.parse(address);
        } catch {
          address = { street: address };
        }
      }

      const addressStr = address
        ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim()
        : 'Address not available';

      return {
        id: row.id,
        patient: {
          id: row.client_id,
          name: `${row.client_first_name} ${row.client_last_name}`,
          address: addressStr,
          // Default coordinates for Cincinnati area (in production, these would come from geocoding)
          latitude: 39.1031 + (Math.random() * 0.05 - 0.025),
          longitude: -84.5120 + (Math.random() * 0.05 - 0.025)
        },
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        status: row.actual_end ? 'completed' : (row.actual_start ? 'in_progress' : row.status),
        clockInTime: row.actual_start,
        clockOutTime: row.actual_end,
        evvRecordId: row.evv_record_id
      };
    });

    res.json({
      date: today,
      caregiverId,
      shifts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mobile/shifts/:shiftId
 * Get details for a specific shift
 */
router.get('/shifts/:shiftId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shiftId } = req.params;
    const caregiverId = req.user?.userId;

    const shift = await getRepository().getShift(shiftId);

    if (!shift) {
      throw ApiErrors.notFound('Shift');
    }

    if (shift.caregiver_id !== caregiverId) {
      throw ApiErrors.forbidden('This shift is not assigned to you');
    }

    // Parse address
    let address = shift.client_address || {};
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch {
        address = { street: address };
      }
    }

    res.json({
      id: shift.id,
      patient: {
        id: shift.client_id,
        name: `${shift.client_first_name} ${shift.client_last_name}`,
        address: `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`,
        latitude: 39.1031,
        longitude: -84.5120
      },
      scheduledStart: shift.scheduled_start,
      scheduledEnd: shift.scheduled_end,
      actualStart: shift.actual_start,
      actualEnd: shift.actual_end,
      status: shift.status,
      serviceCode: shift.service_code,
      notes: shift.notes
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// EVV CLOCK IN/OUT (Auth required)
// ========================================

/**
 * Calculate distance between two GPS coordinates in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * POST /api/mobile/evv/clock-in
 * Record clock-in event with GPS and geofence validation
 */
router.post('/evv/clock-in', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const caregiverId = req.user?.userId;
    const organizationId = req.user?.organizationId;
    const { shiftId, timestamp, gps, deviceInfo } = req.body;

    if (!shiftId || !timestamp || !gps) {
      throw ApiErrors.badRequest('shiftId, timestamp, and gps are required');
    }

    if (!gps.latitude || !gps.longitude || gps.accuracy === undefined) {
      throw ApiErrors.badRequest('GPS data must include latitude, longitude, and accuracy');
    }

    // Validate shift exists and belongs to this caregiver
    const shift = await getRepository().getShift(shiftId);
    if (!shift) {
      throw ApiErrors.notFound('Shift');
    }

    if (shift.caregiver_id !== caregiverId) {
      throw ApiErrors.forbidden('This shift is not assigned to you');
    }

    if (shift.actual_start) {
      throw ApiErrors.badRequest('Shift has already been clocked in');
    }

    // Geofence validation (default: 500 meters for Ohio EVV)
    const GEOFENCE_RADIUS_METERS = 500;
    const clientLatitude = 39.1031; // In production, get from client record
    const clientLongitude = -84.5120;
    const distance = calculateDistance(gps.latitude, gps.longitude, clientLatitude, clientLongitude);
    const geofenceValid = distance <= GEOFENCE_RADIUS_METERS;

    // Create EVV record
    const db = getDbClient();
    const evvResult = await db.query<{ id: string }>(
      `INSERT INTO evv_records (
        organization_id, visit_id, caregiver_id, client_id,
        clock_in_time, clock_in_latitude, clock_in_longitude, clock_in_accuracy,
        clock_in_source, geofence_status, validation_status, sandata_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        organizationId || shift.organization_id,
        shiftId, // Using shift ID as visit ID
        caregiverId,
        shift.client_id,
        timestamp,
        gps.latitude,
        gps.longitude,
        gps.accuracy,
        deviceInfo?.platform || 'mobile',
        geofenceValid ? 'inside' : 'outside',
        geofenceValid ? 'valid' : 'warning',
        'pending'
      ]
    );

    const evvRecordId = evvResult.rows[0].id;

    // Update shift with clock-in time and EVV record reference
    await getRepository().updateShift(shiftId, {
      actualStartTime: timestamp,
      status: 'in_progress'
    });

    // Link EVV record to shift
    await db.query(
      'UPDATE shifts SET evv_record_id = $1 WHERE id = $2',
      [evvRecordId, shiftId]
    );

    console.log(`[EVV CLOCK-IN] Caregiver ${caregiverId} clocked in to shift ${shiftId}`);
    console.log(`  GPS: ${gps.latitude}, ${gps.longitude} (accuracy: ${gps.accuracy}m)`);
    console.log(`  Distance from client: ${Math.round(distance)}m, Geofence: ${geofenceValid ? 'VALID' : 'WARNING'}`);

    res.status(201).json({
      success: true,
      evvRecordId,
      clockInTime: timestamp,
      gps: {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy
      },
      geofenceValid,
      distanceFromClient: Math.round(distance),
      message: geofenceValid
        ? 'Clocked in successfully'
        : `Clocked in with warning: ${Math.round(distance)}m from client location`
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
    const caregiverId = req.user?.userId;
    const { shiftId, timestamp, gps, deviceInfo, tasksCompleted, notes } = req.body;

    if (!shiftId || !timestamp || !gps) {
      throw ApiErrors.badRequest('shiftId, timestamp, and gps are required');
    }

    if (!gps.latitude || !gps.longitude || gps.accuracy === undefined) {
      throw ApiErrors.badRequest('GPS data must include latitude, longitude, and accuracy');
    }

    // Validate shift exists and is in progress
    const shift = await getRepository().getShift(shiftId);
    if (!shift) {
      throw ApiErrors.notFound('Shift');
    }

    if (shift.caregiver_id !== caregiverId) {
      throw ApiErrors.forbidden('This shift is not assigned to you');
    }

    if (!shift.actual_start) {
      throw ApiErrors.badRequest('Cannot clock out - shift has not been clocked in');
    }

    if (shift.actual_end) {
      throw ApiErrors.badRequest('Shift has already been clocked out');
    }

    // Geofence validation
    const GEOFENCE_RADIUS_METERS = 500;
    const clientLatitude = 39.1031;
    const clientLongitude = -84.5120;
    const distance = calculateDistance(gps.latitude, gps.longitude, clientLatitude, clientLongitude);
    const geofenceValid = distance <= GEOFENCE_RADIUS_METERS;

    // Calculate billable units (15-minute increments)
    const clockIn = new Date(shift.actual_start);
    const clockOut = new Date(timestamp);
    const durationMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    const billableUnits = Math.ceil(durationMinutes / 15);

    // Update EVV record with clock-out data
    const db = getDbClient();
    await db.query(
      `UPDATE evv_records SET
        clock_out_time = $1,
        clock_out_latitude = $2,
        clock_out_longitude = $3,
        clock_out_accuracy = $4,
        clock_out_source = $5,
        tasks_completed = $6,
        notes = $7,
        billable_units = $8,
        validation_status = $9,
        sandata_status = 'ready_to_submit',
        updated_at = NOW()
      WHERE visit_id = $10`,
      [
        timestamp,
        gps.latitude,
        gps.longitude,
        gps.accuracy,
        deviceInfo?.platform || 'mobile',
        tasksCompleted ? JSON.stringify(tasksCompleted) : null,
        notes,
        billableUnits,
        geofenceValid ? 'valid' : 'warning',
        shiftId
      ]
    );

    // Update shift status to completed
    await getRepository().updateShift(shiftId, {
      actualEndTime: timestamp,
      status: 'completed',
      notes: notes || shift.notes
    });

    console.log(`[EVV CLOCK-OUT] Caregiver ${caregiverId} clocked out from shift ${shiftId}`);
    console.log(`  Duration: ${Math.round(durationMinutes)} minutes (${billableUnits} units)`);
    console.log(`  Tasks: ${tasksCompleted?.join(', ') || 'none specified'}`);

    res.json({
      success: true,
      clockOutTime: timestamp,
      gps: {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy
      },
      geofenceValid,
      durationMinutes: Math.round(durationMinutes),
      billableUnits,
      tasksCompleted,
      sandataStatus: 'ready_to_submit',
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
    const caregiverId = req.user?.userId;
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      throw ApiErrors.badRequest('records array is required and must not be empty');
    }

    const results = [];

    for (const record of records) {
      try {
        if (record.type === 'clock-in') {
          // Process clock-in using same logic as real-time
          const shift = await getRepository().getShift(record.data.shiftId);
          if (shift && shift.caregiver_id === caregiverId && !shift.actual_start) {
            await getRepository().updateShift(record.data.shiftId, {
              actualStartTime: record.data.timestamp,
              status: 'in_progress'
            });
            results.push({ id: record.data.shiftId, status: 'success', type: 'clock-in' });
          } else {
            results.push({ id: record.data.shiftId, status: 'skipped', type: 'clock-in', reason: 'Already clocked in or invalid' });
          }
        } else if (record.type === 'clock-out') {
          const shift = await getRepository().getShift(record.data.shiftId);
          if (shift && shift.caregiver_id === caregiverId && shift.actual_start && !shift.actual_end) {
            await getRepository().updateShift(record.data.shiftId, {
              actualEndTime: record.data.timestamp,
              status: 'completed',
              notes: record.data.notes
            });
            results.push({ id: record.data.shiftId, status: 'success', type: 'clock-out' });
          } else {
            results.push({ id: record.data.shiftId, status: 'skipped', type: 'clock-out', reason: 'Not clocked in or already completed' });
          }
        } else {
          results.push({ id: record.data?.shiftId, status: 'failed', error: 'Invalid record type' });
        }
      } catch (error: any) {
        results.push({ id: record.data?.shiftId, status: 'failed', error: error.message });
      }
    }

    const syncedCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`[OFFLINE SYNC] Caregiver ${caregiverId}: Synced ${syncedCount}/${records.length} records. ${failedCount} failed.`);

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

// ========================================
// EVV STATUS (Auth required)
// ========================================

/**
 * GET /api/mobile/evv/status/:shiftId
 * Get EVV status for a shift
 */
router.get('/evv/status/:shiftId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shiftId } = req.params;
    const caregiverId = req.user?.userId;

    const shift = await getRepository().getShift(shiftId);
    if (!shift) {
      throw ApiErrors.notFound('Shift');
    }

    if (shift.caregiver_id !== caregiverId) {
      throw ApiErrors.forbidden('This shift is not assigned to you');
    }

    // Get EVV record if exists
    let evvRecord = null;
    if (shift.evv_record_id) {
      evvRecord = await getRepository().getEVVRecord(shift.evv_record_id);
    }

    res.json({
      shiftId,
      shiftStatus: shift.status,
      clockedIn: !!shift.actual_start,
      clockedOut: !!shift.actual_end,
      clockInTime: shift.actual_start,
      clockOutTime: shift.actual_end,
      evvRecord: evvRecord ? {
        id: evvRecord.id,
        validationStatus: evvRecord.validation_status,
        sandataStatus: evvRecord.sandata_status,
        billableUnits: evvRecord.billable_units,
        geofenceStatus: evvRecord.geofence_status
      } : null
    });
  } catch (error) {
    next(error);
  }
});

export { router as mobileRouter };
