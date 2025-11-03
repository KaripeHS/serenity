/**
 * Console Shifts Routes
 * Manages shift scheduling, assignment, and tracking
 *
 * @module api/routes/console/shifts
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const repository = getSandataRepository(getDbClient());

/**
 * GET /api/console/shifts/:organizationId
 * Get shifts with filtering
 */
router.get('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const {
      startDate,
      endDate,
      caregiverId,
      clientId,
      podId,
      status,
      limit = '100',
    } = req.query;

    const filters: any = {
      organizationId,
      limit: parseInt(limit as string),
    };

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (caregiverId) filters.caregiverId = caregiverId;
    if (clientId) filters.clientId = clientId;
    if (podId) filters.podId = podId;
    if (status) filters.status = status;

    const shifts = await repository.getShiftsWithFilters(filters);

    res.json({
      organizationId,
      filters,
      shifts: shifts.map((shift: any) => ({
        id: shift.id,
        caregiverId: shift.caregiver_id,
        caregiverName: shift.caregiver_name,
        clientId: shift.client_id,
        clientName: shift.client_name,
        scheduledStartTime: shift.scheduled_start_time,
        scheduledEndTime: shift.scheduled_end_time,
        actualStartTime: shift.actual_start_time,
        actualEndTime: shift.actual_end_time,
        status: shift.status,
        serviceCode: shift.service_code,
        podId: shift.pod_id,
        podName: shift.pod_name,
        evvRecordId: shift.evv_record_id,
        createdAt: shift.created_at,
      })),
      count: shifts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/shifts/:organizationId/:shiftId
 * Get detailed shift information
 */
router.get('/:organizationId/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId, shiftId } = req.params;

    const shift = await repository.getShift(shiftId);

    if (!shift) {
      throw ApiErrors.notFound('Shift');
    }

    if (shift.organization_id !== organizationId) {
      throw ApiErrors.forbidden('Shift does not belong to this organization');
    }

    // Get associated EVV record if exists
    const evvRecord = shift.evv_record_id
      ? await repository.getEVVRecord(shift.evv_record_id)
      : null;

    res.json({
      id: shift.id,
      organizationId: shift.organization_id,
      caregiverId: shift.caregiver_id,
      caregiverName: `${shift.caregiver_first_name} ${shift.caregiver_last_name}`,
      clientId: shift.client_id,
      clientName: `${shift.client_first_name} ${shift.client_last_name}`,
      scheduledStartTime: shift.scheduled_start_time,
      scheduledEndTime: shift.scheduled_end_time,
      actualStartTime: shift.actual_start_time,
      actualEndTime: shift.actual_end_time,
      status: shift.status,
      serviceCode: shift.service_code,
      authorizationNumber: shift.authorization_number,
      podId: shift.pod_id,
      podName: shift.pod_name,
      evvRecord: evvRecord
        ? {
            id: evvRecord.id,
            visitKey: evvRecord.visit_key,
            sandataStatus: evvRecord.sandata_status,
            sandataVisitId: evvRecord.sandata_visit_id,
            billableUnits: evvRecord.billable_units,
          }
        : null,
      notes: shift.notes,
      createdAt: shift.created_at,
      updatedAt: shift.updated_at,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shifts/:organizationId
 * Create a new shift
 */
router.post('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const {
      caregiverId,
      clientId,
      scheduledStartTime,
      scheduledEndTime,
      serviceCode,
      authorizationNumber,
      notes,
    } = req.body;

    // Validate required fields
    if (!caregiverId || !clientId || !scheduledStartTime || !scheduledEndTime) {
      throw ApiErrors.badRequest(
        'caregiverId, clientId, scheduledStartTime, and scheduledEndTime are required'
      );
    }

    // Validate caregiver belongs to organization
    const caregiver = await repository.getUser(caregiverId);
    if (!caregiver || caregiver.organization_id !== organizationId) {
      throw ApiErrors.badRequest('Invalid caregiver for this organization');
    }

    // Validate client belongs to organization
    const client = await repository.getClient(clientId);
    if (!client || client.organization_id !== organizationId) {
      throw ApiErrors.badRequest('Invalid client for this organization');
    }

    // Validate times
    const start = new Date(scheduledStartTime);
    const end = new Date(scheduledEndTime);
    if (end <= start) {
      throw ApiErrors.badRequest('Scheduled end time must be after start time');
    }

    const shiftId = await repository.createShift({
      organizationId,
      caregiverId,
      clientId,
      scheduledStartTime: start.toISOString(),
      scheduledEndTime: end.toISOString(),
      serviceCode: serviceCode || null,
      authorizationNumber: authorizationNumber || null,
      status: 'scheduled',
      notes: notes || null,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      id: shiftId,
      organizationId,
      caregiverId,
      clientId,
      scheduledStartTime: start.toISOString(),
      scheduledEndTime: end.toISOString(),
      serviceCode,
      status: 'scheduled',
      message: 'Shift created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/shifts/:organizationId/:shiftId
 * Update shift details
 */
router.put('/:organizationId/:shiftId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId, shiftId } = req.params;
    const {
      caregiverId,
      clientId,
      scheduledStartTime,
      scheduledEndTime,
      status,
      serviceCode,
      authorizationNumber,
      notes,
    } = req.body;

    const shift = await repository.getShift(shiftId);
    if (!shift) {
      throw ApiErrors.notFound('Shift');
    }

    if (shift.organization_id !== organizationId) {
      throw ApiErrors.forbidden('Shift does not belong to this organization');
    }

    // If shift has EVV record, prevent certain changes
    if (shift.evv_record_id && (caregiverId || clientId || scheduledStartTime || scheduledEndTime)) {
      throw ApiErrors.badRequest(
        'Cannot modify shift details after EVV record has been created. Use corrections instead.'
      );
    }

    // Validate time changes if provided
    if (scheduledStartTime && scheduledEndTime) {
      const start = new Date(scheduledStartTime);
      const end = new Date(scheduledEndTime);
      if (end <= start) {
        throw ApiErrors.badRequest('Scheduled end time must be after start time');
      }
    }

    await repository.updateShift(shiftId, {
      caregiverId,
      clientId,
      scheduledStartTime,
      scheduledEndTime,
      status,
      serviceCode,
      authorizationNumber,
      notes,
      updatedBy: req.user?.id,
    });

    res.json({
      id: shiftId,
      message: 'Shift updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/shifts/:organizationId/:shiftId
 * Cancel/delete a shift
 */
router.delete(
  '/:organizationId/:shiftId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, shiftId } = req.params;

      const shift = await repository.getShift(shiftId);
      if (!shift) {
        throw ApiErrors.notFound('Shift');
      }

      if (shift.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Shift does not belong to this organization');
      }

      // If shift has EVV record, don't delete - just cancel
      if (shift.evv_record_id) {
        await repository.updateShift(shiftId, {
          status: 'cancelled',
          updatedBy: req.user?.id,
        });

        res.json({
          id: shiftId,
          status: 'cancelled',
          message: 'Shift cancelled (EVV record exists)',
          timestamp: new Date().toISOString(),
        });
      } else {
        // No EVV record, safe to delete
        await repository.deleteShift(shiftId);

        res.json({
          id: shiftId,
          message: 'Shift deleted successfully',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/shifts/:organizationId/today
 * Get today's shifts
 */
router.get('/:organizationId/today', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { podId } = req.query;

    const today = new Date().toISOString().split('T')[0];

    const shifts = await repository.getShiftsByDate(organizationId, today);

    // Filter by pod if specified
    let filteredShifts = shifts;
    if (podId) {
      filteredShifts = shifts.filter((s: any) => s.pod_id === podId);
    }

    // Group by status
    const statusGroups = {
      scheduled: filteredShifts.filter((s: any) => s.status === 'scheduled'),
      inProgress: filteredShifts.filter((s: any) => s.status === 'in_progress'),
      completed: filteredShifts.filter((s: any) => s.status === 'completed'),
      missed: filteredShifts.filter((s: any) => s.status === 'missed'),
      cancelled: filteredShifts.filter((s: any) => s.status === 'cancelled'),
    };

    res.json({
      organizationId,
      podId: podId || 'all',
      date: today,
      summary: {
        total: filteredShifts.length,
        scheduled: statusGroups.scheduled.length,
        inProgress: statusGroups.inProgress.length,
        completed: statusGroups.completed.length,
        missed: statusGroups.missed.length,
        cancelled: statusGroups.cancelled.length,
      },
      shifts: filteredShifts.map((shift: any) => ({
        id: shift.id,
        caregiverId: shift.caregiver_id,
        caregiverName: shift.caregiver_name,
        clientId: shift.client_id,
        clientName: shift.client_name,
        scheduledStartTime: shift.scheduled_start_time,
        scheduledEndTime: shift.scheduled_end_time,
        actualStartTime: shift.actual_start_time,
        actualEndTime: shift.actual_end_time,
        status: shift.status,
        serviceCode: shift.service_code,
        podName: shift.pod_name,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shifts/:organizationId/:shiftId/start
 * Mark shift as started (clock-in)
 */
router.post(
  '/:organizationId/:shiftId/start',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, shiftId } = req.params;
      const { actualStartTime } = req.body;

      const shift = await repository.getShift(shiftId);
      if (!shift) {
        throw ApiErrors.notFound('Shift');
      }

      if (shift.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Shift does not belong to this organization');
      }

      if (shift.status !== 'scheduled') {
        throw ApiErrors.badRequest(`Cannot start shift with status: ${shift.status}`);
      }

      const startTime = actualStartTime ? new Date(actualStartTime) : new Date();

      await repository.updateShift(shiftId, {
        actualStartTime: startTime.toISOString(),
        status: 'in_progress',
        updatedBy: req.user?.id,
      });

      res.json({
        id: shiftId,
        status: 'in_progress',
        actualStartTime: startTime.toISOString(),
        message: 'Shift started',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/console/shifts/:organizationId/:shiftId/complete
 * Mark shift as completed (clock-out)
 */
router.post(
  '/:organizationId/:shiftId/complete',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, shiftId } = req.params;
      const { actualEndTime } = req.body;

      const shift = await repository.getShift(shiftId);
      if (!shift) {
        throw ApiErrors.notFound('Shift');
      }

      if (shift.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Shift does not belong to this organization');
      }

      if (shift.status !== 'in_progress') {
        throw ApiErrors.badRequest(`Cannot complete shift with status: ${shift.status}`);
      }

      const endTime = actualEndTime ? new Date(actualEndTime) : new Date();

      await repository.updateShift(shiftId, {
        actualEndTime: endTime.toISOString(),
        status: 'completed',
        updatedBy: req.user?.id,
      });

      res.json({
        id: shiftId,
        status: 'completed',
        actualEndTime: endTime.toISOString(),
        message: 'Shift completed',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
