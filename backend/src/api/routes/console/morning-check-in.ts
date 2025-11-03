/**
 * Console Morning Check-In Routes
 * Manages daily morning check-in process for caregivers
 *
 * Features:
 * - Record caregiver availability status
 * - Track attendance issues (late, absent, no-show)
 * - Real-time pod roster status
 * - Historical check-in records
 *
 * @module api/routes/console/morning-check-in
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';

const router = Router();
const repository = getSandataRepository(getDbClient());

/**
 * GET /api/console/morning-check-in/:organizationId/today
 * Get today's morning check-in status for all pods
 */
router.get('/:organizationId/today', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { podId } = req.query;

    const today = new Date().toISOString().split('T')[0];

    // Get all check-ins for today
    let checkIns = await repository.getMorningCheckIns(organizationId, today);

    // Filter by pod if specified
    if (podId) {
      const podMembers = await repository.getPodMembers(podId as string);
      const podMemberIds = new Set(podMembers.map((m: any) => m.id));
      checkIns = checkIns.filter((c: any) => podMemberIds.has(c.user_id));
    }

    // Get all active caregivers to determine who hasn't checked in
    const caregivers = await repository.getActiveUsers(organizationId, 'caregiver');
    const checkedInUserIds = new Set(checkIns.map((c: any) => c.user_id));
    const notCheckedIn = caregivers.filter((c: any) => !checkedInUserIds.has(c.id));

    // Group by status
    const statusGroups = {
      available: checkIns.filter((c: any) => c.status === 'available'),
      unavailable: checkIns.filter((c: any) => c.status === 'unavailable'),
      late: checkIns.filter((c: any) => c.status === 'late'),
      absent: checkIns.filter((c: any) => c.status === 'absent'),
      notCheckedIn: notCheckedIn,
    };

    res.json({
      organizationId,
      podId: podId || 'all',
      date: today,
      summary: {
        totalCaregivers: caregivers.length,
        checkedIn: checkIns.length,
        notCheckedIn: notCheckedIn.length,
        available: statusGroups.available.length,
        unavailable: statusGroups.unavailable.length,
        late: statusGroups.late.length,
        absent: statusGroups.absent.length,
      },
      checkIns: checkIns.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        status: c.status,
        checkInTime: c.check_in_time,
        notes: c.notes,
        podId: c.pod_id,
        podName: c.pod_name,
      })),
      notCheckedIn: notCheckedIn.map((c: any) => ({
        userId: c.id,
        userName: `${c.first_name} ${c.last_name}`,
        podId: c.pod_id,
        phoneNumber: c.phone_number,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/morning-check-in/:organizationId
 * Record a morning check-in for a caregiver
 */
router.post('/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { userId, status, notes } = req.body;

    if (!userId) {
      throw ApiErrors.badRequest('userId is required');
    }

    if (!status || !['available', 'unavailable', 'late', 'absent'].includes(status)) {
      throw ApiErrors.badRequest('status must be one of: available, unavailable, late, absent');
    }

    // Validate user exists and belongs to organization
    const user = await repository.getUser(userId);
    if (!user) {
      throw ApiErrors.notFound('User');
    }

    if (user.organization_id !== organizationId) {
      throw ApiErrors.forbidden('User does not belong to this organization');
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existingCheckIn = await repository.getMorningCheckIn(userId, today);
    if (existingCheckIn) {
      throw ApiErrors.conflict('User has already checked in today');
    }

    // Create check-in record
    const checkInId = await repository.createMorningCheckIn({
      userId,
      organizationId,
      date: today,
      status,
      checkInTime: new Date().toISOString(),
      notes: notes || null,
      recordedBy: req.user?.id || userId,
    });

    res.status(201).json({
      id: checkInId,
      userId,
      status,
      date: today,
      checkInTime: new Date().toISOString(),
      notes,
      message: 'Morning check-in recorded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/morning-check-in/:organizationId/:checkInId
 * Update a morning check-in record
 */
router.put(
  '/:organizationId/:checkInId',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, checkInId } = req.params;
      const { status, notes } = req.body;

      const checkIn = await repository.getMorningCheckInById(checkInId);
      if (!checkIn) {
        throw ApiErrors.notFound('Check-in record');
      }

      if (checkIn.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Check-in does not belong to this organization');
      }

      if (status && !['available', 'unavailable', 'late', 'absent'].includes(status)) {
        throw ApiErrors.badRequest('status must be one of: available, unavailable, late, absent');
      }

      await repository.updateMorningCheckIn(checkInId, {
        status: status || checkIn.status,
        notes: notes !== undefined ? notes : checkIn.notes,
        updatedBy: req.user?.id,
      });

      res.json({
        id: checkInId,
        status: status || checkIn.status,
        notes: notes !== undefined ? notes : checkIn.notes,
        message: 'Morning check-in updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/morning-check-in/:organizationId/history
 * Get historical morning check-in records
 */
router.get(
  '/:organizationId/history',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId } = req.params;
      const { userId, startDate, endDate, status, limit = '30' } = req.query;

      const filters: any = {
        organizationId,
        limit: parseInt(limit as string),
      };

      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (status) filters.status = status;

      const checkIns = await repository.getMorningCheckInsWithFilters(filters);

      res.json({
        organizationId,
        filters,
        checkIns: checkIns.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user_name,
          date: c.date,
          status: c.status,
          checkInTime: c.check_in_time,
          notes: c.notes,
          recordedBy: c.recorded_by,
          createdAt: c.created_at,
        })),
        count: checkIns.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/morning-check-in/:organizationId/pod/:podId/today
 * Get today's check-in status for a specific pod
 */
router.get(
  '/:organizationId/pod/:podId/today',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { organizationId, podId } = req.params;

      const pod = await repository.getPod(podId);
      if (!pod) {
        throw ApiErrors.notFound('Pod');
      }

      if (pod.organization_id !== organizationId) {
        throw ApiErrors.forbidden('Pod does not belong to this organization');
      }

      const today = new Date().toISOString().split('T')[0];

      // Get pod members
      const podMembers = await repository.getPodMembers(podId);

      // Get check-ins for pod members today
      const checkIns = await repository.getMorningCheckIns(organizationId, today);
      const podMemberIds = new Set(podMembers.map((m: any) => m.id));
      const podCheckIns = checkIns.filter((c: any) => podMemberIds.has(c.user_id));

      // Determine who hasn't checked in
      const checkedInIds = new Set(podCheckIns.map((c: any) => c.user_id));
      const notCheckedIn = podMembers.filter((m: any) => !checkedInIds.has(m.id));

      res.json({
        organizationId,
        podId,
        podName: pod.pod_name,
        date: today,
        summary: {
          totalMembers: podMembers.length,
          checkedIn: podCheckIns.length,
          notCheckedIn: notCheckedIn.length,
          available: podCheckIns.filter((c: any) => c.status === 'available').length,
          unavailable: podCheckIns.filter((c: any) => c.status === 'unavailable').length,
          late: podCheckIns.filter((c: any) => c.status === 'late').length,
          absent: podCheckIns.filter((c: any) => c.status === 'absent').length,
        },
        checkIns: podCheckIns.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user_name,
          status: c.status,
          checkInTime: c.check_in_time,
          notes: c.notes,
        })),
        notCheckedIn: notCheckedIn.map((m: any) => ({
          userId: m.id,
          userName: `${m.first_name} ${m.last_name}`,
          phoneNumber: m.phone_number,
          email: m.email,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/console/morning-check-in/:organizationId/stats
 * Get morning check-in statistics and trends
 */
router.get('/:organizationId/stats', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { organizationId } = req.params;
    const { days = '30' } = req.query;

    const daysBack = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const stats = await repository.getMorningCheckInStats(
      organizationId,
      startDate.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    res.json({
      organizationId,
      period: `${daysBack} days`,
      stats: {
        totalCheckIns: stats.total_check_ins,
        averageCheckInsPerDay: Math.round((stats.total_check_ins / daysBack) * 10) / 10,
        availabilityRate: Math.round((stats.available_count / stats.total_check_ins) * 100 * 10) / 10,
        lateRate: Math.round((stats.late_count / stats.total_check_ins) * 100 * 10) / 10,
        absentRate: Math.round((stats.absent_count / stats.total_check_ins) * 100 * 10) / 10,
        byStatus: {
          available: stats.available_count,
          unavailable: stats.unavailable_count,
          late: stats.late_count,
          absent: stats.absent_count,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
