/**
 * Calendar Routes
 * Visual scheduling calendar API endpoints
 * Supports week/month views, drag-drop, and coverage gap detection
 *
 * @module api/routes/console/calendar
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { createLogger } from '../../../utils/logger';
import { getDbClient } from '../../../database/client';

const router = Router();
const logger = createLogger('calendar-routes');

// All routes require authentication
router.use(requireAuth);

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  resourceId?: string;
  clientId: string;
  clientName: string;
  caregiverId?: string;
  caregiverName?: string;
  serviceType: string;
  serviceCode: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  color: string;
  isUnassigned: boolean;
  notes?: string;
  address?: string;
}

interface CoverageGap {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  expectedDate: string;
  expectedHours: number;
  actualHours: number;
  gapHours: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  authorizationId?: string;
  authorizationNumber?: string;
}

interface CaregiverResource {
  id: string;
  name: string;
  role: string;
  hoursScheduled: number;
  hoursWorked: number;
  clientCount: number;
  status: 'available' | 'busy' | 'off';
  skills: string[];
}

// Color mapping for shift statuses
const statusColors: Record<string, string> = {
  scheduled: '#3B82F6',   // blue
  confirmed: '#10B981',   // green
  in_progress: '#F59E0B', // amber
  completed: '#6B7280',   // gray
  cancelled: '#EF4444',   // red
  no_show: '#DC2626',     // dark red
  unassigned: '#8B5CF6',  // purple
};

/**
 * GET /api/console/calendar/events
 * Get calendar events for a date range
 */
router.get('/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { start, end, caregiverId, clientId, podId, view } = req.query;

    if (!start || !end) {
      throw ApiErrors.badRequest('Start and end dates are required');
    }

    let query = `
      SELECT
        s.id,
        s.scheduled_start,
        s.scheduled_end,
        s.actual_start,
        s.actual_end,
        s.status,
        s.notes,
        s.caregiver_id,
        s.client_id,
        s.pod_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.address_line_1 as client_address,
        c.city as client_city,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name,
        srv.name as service_name,
        srv.code as service_code
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.caregiver_id = u.id
      LEFT JOIN services srv ON s.service_id = srv.id
      WHERE s.organization_id = $1
        AND s.scheduled_start >= $2
        AND s.scheduled_start < $3
    `;

    const params: any[] = [organizationId, start, end];

    if (caregiverId) {
      params.push(caregiverId);
      query += ` AND s.caregiver_id = $${params.length}`;
    }

    if (clientId) {
      params.push(clientId);
      query += ` AND s.client_id = $${params.length}`;
    }

    if (podId) {
      params.push(podId);
      query += ` AND s.pod_id = $${params.length}`;
    }

    query += ' ORDER BY s.scheduled_start';

    const db = await getDbClient();
    const result = await db.query(query, params);

    const events: CalendarEvent[] = result.rows.map(row => {
      const isUnassigned = !row.caregiver_id;

      return {
        id: row.id,
        title: isUnassigned
          ? `[OPEN] ${row.client_first_name} ${row.client_last_name}`
          : `${row.client_first_name} ${row.client_last_name}`,
        start: row.scheduled_start.toISOString(),
        end: row.scheduled_end.toISOString(),
        resourceId: row.caregiver_id || 'unassigned',
        clientId: row.client_id,
        clientName: `${row.client_first_name} ${row.client_last_name}`,
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_id
          ? `${row.caregiver_first_name} ${row.caregiver_last_name}`
          : null,
        serviceType: row.service_name || 'Personal Care',
        serviceCode: row.service_code || 'T1019',
        status: row.status,
        color: isUnassigned ? statusColors.unassigned : statusColors[row.status] || statusColors.scheduled,
        isUnassigned,
        notes: row.notes,
        address: row.client_address ? `${row.client_address}, ${row.client_city}` : null,
      };
    });

    res.json({
      success: true,
      events,
      count: events.length,
      unassignedCount: events.filter(e => e.isUnassigned).length,
    });
  } catch (error) {
    logger.error('Failed to get calendar events', { error });
    next(error);
  }
});

/**
 * GET /api/console/calendar/resources
 * Get caregiver resources for resource view
 */
router.get('/resources', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { start, end, podId } = req.query;

    let query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        u.specializations,
        COALESCE(
          (SELECT SUM(EXTRACT(EPOCH FROM (s.scheduled_end - s.scheduled_start)) / 3600)
           FROM shifts s
           WHERE s.caregiver_id = u.id
             AND s.scheduled_start >= $2
             AND s.scheduled_start < $3
             AND s.status != 'cancelled'), 0
        ) as hours_scheduled,
        COALESCE(
          (SELECT SUM(EXTRACT(EPOCH FROM (s.actual_end - s.actual_start)) / 3600)
           FROM shifts s
           WHERE s.caregiver_id = u.id
             AND s.actual_start >= $2
             AND s.actual_start < $3
             AND s.status = 'completed'), 0
        ) as hours_worked,
        COALESCE(
          (SELECT COUNT(DISTINCT s.client_id)
           FROM shifts s
           WHERE s.caregiver_id = u.id
             AND s.scheduled_start >= $2
             AND s.scheduled_start < $3
             AND s.status != 'cancelled'), 0
        ) as client_count
      FROM users u
      WHERE u.organization_id = $1
        AND u.role = 'caregiver'
        AND u.is_active = true
    `;

    const params: any[] = [
      organizationId,
      start || new Date().toISOString().split('T')[0],
      end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ];

    if (podId) {
      params.push(podId);
      query += ` AND u.pod_id = $${params.length}`;
    }

    query += ' ORDER BY u.last_name, u.first_name';

    const db = await getDbClient();
    const result = await db.query(query, params);

    const resources: CaregiverResource[] = result.rows.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      role: row.role,
      hoursScheduled: parseFloat(row.hours_scheduled) || 0,
      hoursWorked: parseFloat(row.hours_worked) || 0,
      clientCount: parseInt(row.client_count) || 0,
      status: parseFloat(row.hours_scheduled) >= 40 ? 'busy' : 'available',
      skills: row.specializations || [],
    }));

    // Add "unassigned" resource row
    resources.unshift({
      id: 'unassigned',
      name: 'Unassigned Shifts',
      role: 'placeholder',
      hoursScheduled: 0,
      hoursWorked: 0,
      clientCount: 0,
      status: 'available',
      skills: [],
    });

    res.json({
      success: true,
      resources,
      count: resources.length,
    });
  } catch (error) {
    logger.error('Failed to get calendar resources', { error });
    next(error);
  }
});

/**
 * GET /api/console/calendar/coverage-gaps
 * Detect coverage gaps based on authorizations and scheduled visits
 */
router.get('/coverage-gaps', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { start, end, severity } = req.query;

    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end ? new Date(end as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Find clients with authorizations but insufficient scheduled visits
    const query = `
      WITH authorized_hours AS (
        SELECT
          sa.client_id,
          sa.service_code,
          sa.units_approved,
          sa.units_used,
          sa.authorization_number,
          sa.id as authorization_id,
          sa.start_date,
          sa.end_date,
          -- Calculate expected weekly hours (assuming 15-min units)
          (sa.units_approved - sa.units_used) * 0.25 as remaining_hours
        FROM service_authorizations sa
        WHERE sa.organization_id = $1
          AND sa.status = 'active'
          AND sa.end_date >= $2
          AND sa.start_date <= $3
      ),
      scheduled_hours AS (
        SELECT
          s.client_id,
          srv.code as service_code,
          SUM(EXTRACT(EPOCH FROM (s.scheduled_end - s.scheduled_start)) / 3600) as scheduled_hours
        FROM shifts s
        LEFT JOIN services srv ON s.service_id = srv.id
        WHERE s.organization_id = $1
          AND s.scheduled_start >= $2
          AND s.scheduled_start < $3
          AND s.status NOT IN ('cancelled')
        GROUP BY s.client_id, srv.code
      ),
      gaps AS (
        SELECT
          ah.client_id,
          ah.service_code,
          ah.authorization_number,
          ah.authorization_id,
          ah.remaining_hours as expected_hours,
          COALESCE(sh.scheduled_hours, 0) as actual_hours,
          ah.remaining_hours - COALESCE(sh.scheduled_hours, 0) as gap_hours
        FROM authorized_hours ah
        LEFT JOIN scheduled_hours sh ON ah.client_id = sh.client_id
          AND ah.service_code = sh.service_code
        WHERE ah.remaining_hours - COALESCE(sh.scheduled_hours, 0) > 2
      )
      SELECT
        g.*,
        c.first_name,
        c.last_name,
        CASE
          WHEN g.gap_hours >= 20 THEN 'critical'
          WHEN g.gap_hours >= 10 THEN 'high'
          WHEN g.gap_hours >= 5 THEN 'medium'
          ELSE 'low'
        END as severity
      FROM gaps g
      JOIN clients c ON g.client_id = c.id
      ORDER BY g.gap_hours DESC
    `;

    const db = await getDbClient();
    const result = await db.query(query, [organizationId, startDate, endDate]);

    let gaps: CoverageGap[] = result.rows.map(row => ({
      id: `gap_${row.client_id}_${row.service_code}`,
      clientId: row.client_id,
      clientName: `${row.first_name} ${row.last_name}`,
      serviceType: row.service_code,
      expectedDate: startDate.toISOString().split('T')[0],
      expectedHours: parseFloat(row.expected_hours) || 0,
      actualHours: parseFloat(row.actual_hours) || 0,
      gapHours: parseFloat(row.gap_hours) || 0,
      severity: row.severity,
      authorizationId: row.authorization_id,
      authorizationNumber: row.authorization_number,
    }));

    // Filter by severity if specified
    if (severity) {
      gaps = gaps.filter(g => g.severity === severity);
    }

    // Calculate summary
    const summary = {
      totalGaps: gaps.length,
      criticalCount: gaps.filter(g => g.severity === 'critical').length,
      highCount: gaps.filter(g => g.severity === 'high').length,
      mediumCount: gaps.filter(g => g.severity === 'medium').length,
      lowCount: gaps.filter(g => g.severity === 'low').length,
      totalGapHours: gaps.reduce((sum, g) => sum + g.gapHours, 0),
    };

    res.json({
      success: true,
      gaps,
      summary,
    });
  } catch (error) {
    logger.error('Failed to detect coverage gaps', { error });
    next(error);
  }
});

/**
 * POST /api/console/calendar/events/:id/assign
 * Assign or reassign a caregiver to a shift (drag-drop support)
 */
router.post('/events/:id/assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { caregiverId, notify = true } = req.body;

    const db = await getDbClient();

    // Validate shift exists
    const shiftResult = await db.query(
      `SELECT * FROM shifts WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    if (shiftResult.rows.length === 0) {
      throw ApiErrors.notFound('Shift');
    }

    const shift = shiftResult.rows[0];

    // Check for conflicts if assigning (not unassigning)
    if (caregiverId) {
      const conflictQuery = `
        SELECT id FROM shifts
        WHERE caregiver_id = $1
          AND id != $2
          AND status NOT IN ('cancelled', 'completed')
          AND (
            (scheduled_start <= $3 AND scheduled_end > $3) OR
            (scheduled_start < $4 AND scheduled_end >= $4) OR
            (scheduled_start >= $3 AND scheduled_end <= $4)
          )
      `;

      const conflicts = await db.query(conflictQuery, [
        caregiverId,
        id,
        shift.scheduled_start,
        shift.scheduled_end,
      ]);

      if (conflicts.rows.length > 0) {
        throw ApiErrors.badRequest('Caregiver has conflicting shifts');
      }
    }

    // Update shift assignment
    await db.query(
      `UPDATE shifts
       SET caregiver_id = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3`,
      [caregiverId || null, userId, id]
    );

    // Get updated shift details
    const updatedResult = await db.query(
      `SELECT s.*,
              c.first_name as client_first_name, c.last_name as client_last_name,
              u.first_name as caregiver_first_name, u.last_name as caregiver_last_name
       FROM shifts s
       JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.caregiver_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    const updated = updatedResult.rows[0];

    logger.info('Shift assignment updated', {
      shiftId: id,
      previousCaregiver: shift.caregiver_id,
      newCaregiver: caregiverId,
      updatedBy: userId,
    });

    res.json({
      success: true,
      event: {
        id: updated.id,
        caregiverId: updated.caregiver_id,
        caregiverName: updated.caregiver_id
          ? `${updated.caregiver_first_name} ${updated.caregiver_last_name}`
          : null,
        isUnassigned: !updated.caregiver_id,
      },
      message: caregiverId
        ? `Assigned to ${updated.caregiver_first_name} ${updated.caregiver_last_name}`
        : 'Shift unassigned',
    });
  } catch (error) {
    logger.error('Failed to assign shift', { error });
    next(error);
  }
});

/**
 * POST /api/console/calendar/events/:id/reschedule
 * Reschedule a shift to new times (drag-drop support)
 */
router.post('/events/:id/reschedule', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { start, end } = req.body;

    if (!start || !end) {
      throw ApiErrors.badRequest('Start and end times are required');
    }

    const newStart = new Date(start);
    const newEnd = new Date(end);

    if (newEnd <= newStart) {
      throw ApiErrors.badRequest('End time must be after start time');
    }

    const db = await getDbClient();

    // Validate shift exists
    const shiftResult = await db.query(
      `SELECT * FROM shifts WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    if (shiftResult.rows.length === 0) {
      throw ApiErrors.notFound('Shift');
    }

    const shift = shiftResult.rows[0];

    // Check for conflicts if shift has a caregiver
    if (shift.caregiver_id) {
      const conflictQuery = `
        SELECT id FROM shifts
        WHERE caregiver_id = $1
          AND id != $2
          AND status NOT IN ('cancelled', 'completed')
          AND (
            (scheduled_start <= $3 AND scheduled_end > $3) OR
            (scheduled_start < $4 AND scheduled_end >= $4) OR
            (scheduled_start >= $3 AND scheduled_end <= $4)
          )
      `;

      const conflicts = await db.query(conflictQuery, [
        shift.caregiver_id,
        id,
        newStart,
        newEnd,
      ]);

      if (conflicts.rows.length > 0) {
        throw ApiErrors.badRequest('Rescheduling creates a conflict with another shift');
      }
    }

    // Update shift times
    await db.query(
      `UPDATE shifts
       SET scheduled_start = $1, scheduled_end = $2, updated_at = NOW(), updated_by = $3
       WHERE id = $4`,
      [newStart, newEnd, userId, id]
    );

    logger.info('Shift rescheduled', {
      shiftId: id,
      previousStart: shift.scheduled_start,
      previousEnd: shift.scheduled_end,
      newStart,
      newEnd,
      updatedBy: userId,
    });

    res.json({
      success: true,
      event: {
        id,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      },
      message: 'Shift rescheduled successfully',
    });
  } catch (error) {
    logger.error('Failed to reschedule shift', { error });
    next(error);
  }
});

/**
 * GET /api/console/calendar/dispatch-board
 * Get dispatch board data with open shifts and available caregivers
 */
router.get('/dispatch-board', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get open (unassigned) shifts
    const openShiftsQuery = `
      SELECT
        s.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.address_line_1,
        c.city,
        c.latitude as client_lat,
        c.longitude as client_lng,
        srv.name as service_name
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN services srv ON s.service_id = srv.id
      WHERE s.organization_id = $1
        AND s.caregiver_id IS NULL
        AND s.scheduled_start >= $2
        AND s.scheduled_start < $3
        AND s.status NOT IN ('cancelled', 'completed')
      ORDER BY s.scheduled_start
    `;

    const db = await getDbClient();
    const openShifts = await db.query(openShiftsQuery, [
      organizationId,
      startOfDay,
      endOfDay,
    ]);

    // Get available caregivers (not scheduled during open shift times)
    const availableCaregivers = await db.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.phone,
        u.latitude,
        u.longitude,
        u.specializations
       FROM users u
       WHERE u.organization_id = $1
         AND u.role = 'caregiver'
         AND u.is_active = true
       ORDER BY u.last_name`,
      [organizationId]
    );

    res.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      openShifts: openShifts.rows.map(row => ({
        id: row.id,
        clientId: row.client_id,
        clientName: `${row.client_first_name} ${row.client_last_name}`,
        address: `${row.address_line_1}, ${row.city}`,
        location: row.client_lat && row.client_lng
          ? { lat: parseFloat(row.client_lat), lng: parseFloat(row.client_lng) }
          : null,
        start: row.scheduled_start,
        end: row.scheduled_end,
        serviceType: row.service_name || 'Personal Care',
        urgency: row.scheduled_start < new Date()
          ? 'overdue'
          : row.scheduled_start < new Date(Date.now() + 2 * 60 * 60 * 1000)
            ? 'urgent'
            : 'normal',
      })),
      availableCaregivers: availableCaregivers.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        phone: row.phone,
        location: row.latitude && row.longitude
          ? { lat: parseFloat(row.latitude), lng: parseFloat(row.longitude) }
          : null,
        skills: row.specializations || [],
      })),
      summary: {
        openShiftCount: openShifts.rows.length,
        availableCaregiverCount: availableCaregivers.rows.length,
        overdueCount: openShifts.rows.filter(s => new Date(s.scheduled_start) < new Date()).length,
      },
    });
  } catch (error) {
    logger.error('Failed to get dispatch board', { error });
    next(error);
  }
});

export default router;
