/**
 * Console Operations Routes
 * Manages operational dashboard and shift monitoring
 *
 * Features:
 * - Morning Check-In Dashboard (shift status monitoring)
 * - Coverage gap detection
 * - EVV compliance tracking
 * - Sandata sync status
 *
 * @module api/routes/console/operations
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('operations');

/**
 * GET /api/console/operations/morning-check-in
 * Get today's shift status for Morning Check-In Dashboard
 *
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 * - podId: UUID (optional - filter by pod)
 */
router.get('/morning-check-in', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { date, podId } = req.query;

    // Use today if no date specified
    const targetDate = date ? new Date(date as string) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    logger.info('Fetching morning check-in data', { date: dateStr, podId });

    // For now, return mock data until database is set up
    // This matches the manifesto requirements exactly
    const mockData = {
      date: dateStr,
      podId: podId || 'pod-1',
      podName: podId === 'pod-2' ? 'Pod-2 (Columbus)' : podId === 'pod-3' ? 'Pod-3 (Cincinnati)' : 'Pod-1 (Dayton)',
      shifts: [
        {
          id: 'shift-1',
          patient: {
            name: 'Jane Doe',
            address: '123 Main St, Dayton, OH 45402',
            phone: '937-555-0101',
          },
          caregiver: {
            name: 'Mary Smith',
            phone: '937-555-0201',
            email: 'mary.smith@serenitycare.com',
          },
          scheduledStart: `${dateStr}T08:00:00Z`,
          scheduledEnd: `${dateStr}T09:30:00Z`,
          clockInTime: `${dateStr}T08:05:00Z`,
          clockOutTime: null,
          clockInStatus: 'on_time',
          sandataStatus: 'pending',
          sandataError: null,
          gpsAccuracy: 15,
        },
        {
          id: 'shift-2',
          patient: {
            name: 'John Williams',
            address: '456 Oak Ave, Dayton, OH 45403',
            phone: '937-555-0102',
          },
          caregiver: {
            name: 'Sarah Johnson',
            phone: '937-555-0202',
            email: 'sarah.j@serenitycare.com',
          },
          scheduledStart: `${dateStr}T08:30:00Z`,
          scheduledEnd: `${dateStr}T10:00:00Z`,
          clockInTime: `${dateStr}T08:50:00Z`,
          clockOutTime: null,
          clockInStatus: 'late',
          sandataStatus: 'not_submitted',
          sandataError: null,
          gpsAccuracy: 22,
        },
        {
          id: 'shift-3',
          patient: {
            name: 'Betty Martinez',
            address: '789 Elm St, Dayton, OH 45404',
            phone: '937-555-0103',
          },
          caregiver: {
            name: 'Mike Davis',
            phone: '937-555-0203',
            email: 'mike.d@serenitycare.com',
          },
          scheduledStart: `${dateStr}T09:00:00Z`,
          scheduledEnd: `${dateStr}T10:30:00Z`,
          clockInTime: null,
          clockOutTime: null,
          clockInStatus: 'missing',
          sandataStatus: 'not_submitted',
          sandataError: null,
          gpsAccuracy: null,
        },
        {
          id: 'shift-4',
          patient: {
            name: 'Robert Lee',
            address: '321 Pine Rd, Dayton, OH 45405',
            phone: '937-555-0104',
          },
          caregiver: {
            name: 'Linda Brown',
            phone: '937-555-0204',
            email: 'linda.b@serenitycare.com',
          },
          scheduledStart: `${dateStr}T07:30:00Z`,
          scheduledEnd: `${dateStr}T09:00:00Z`,
          clockInTime: `${dateStr}T07:32:00Z`,
          clockOutTime: `${dateStr}T09:05:00Z`,
          clockInStatus: 'on_time',
          sandataStatus: 'accepted',
          sandataError: null,
          gpsAccuracy: 12,
        },
        {
          id: 'shift-5',
          patient: {
            name: 'Nancy Garcia',
            address: '654 Maple Dr, Dayton, OH 45406',
            phone: '937-555-0105',
          },
          caregiver: {
            name: 'Tom Wilson',
            phone: '937-555-0205',
            email: 'tom.w@serenitycare.com',
          },
          scheduledStart: `${dateStr}T10:00:00Z`,
          scheduledEnd: `${dateStr}T11:30:00Z`,
          clockInTime: null,
          clockOutTime: null,
          clockInStatus: 'not_started',
          sandataStatus: 'not_submitted',
          sandataError: null,
          gpsAccuracy: null,
        },
        {
          id: 'shift-6',
          patient: {
            name: 'Paul Anderson',
            address: '987 Cedar Ln, Dayton, OH 45407',
            phone: '937-555-0106',
          },
          caregiver: {
            name: 'Jennifer White',
            phone: '937-555-0206',
            email: 'jen.white@serenitycare.com',
          },
          scheduledStart: `${dateStr}T09:30:00Z`,
          scheduledEnd: `${dateStr}T11:00:00Z`,
          clockInTime: `${dateStr}T09:31:00Z`,
          clockOutTime: null,
          clockInStatus: 'on_time',
          sandataStatus: 'pending',
          sandataError: null,
          gpsAccuracy: 18,
        },
      ],
      summary: {
        total: 6,
        clockedIn: 3,
        late: 1,
        noShow: 1,
        notYetStarted: 1,
        sandataAccepted: 1,
        sandataRejected: 0,
      },
    };

    res.json(mockData);
  } catch (error) {
    logger.error('Error fetching morning check-in data', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/find-coverage
 * Find coverage for a no-show shift
 *
 * Body:
 * - shiftId: UUID of shift needing coverage
 * - priority: 'urgent' | 'high' | 'normal'
 */
router.post('/find-coverage', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { shiftId, priority = 'urgent' } = req.body;

    if (!shiftId) {
      throw ApiErrors.badRequest('shiftId is required');
    }

    logger.info('Finding coverage for shift', { shiftId, priority });

    // Mock response - in production, this would:
    // 1. Query available caregivers with matching skills
    // 2. Check proximity to patient address
    // 3. Check schedule conflicts
    // 4. Sort by SPI score and availability
    // 5. Send SMS/email notifications

    const mockCandidates = [
      {
        caregiverId: 'cg-101',
        name: 'Amanda Rodriguez',
        phone: '937-555-0301',
        email: 'amanda.r@serenitycare.com',
        spiScore: 95,
        distance: 2.3,
        availability: 'available',
        matchScore: 98,
      },
      {
        caregiverId: 'cg-102',
        name: 'Kevin Martinez',
        phone: '937-555-0302',
        email: 'kevin.m@serenitycare.com',
        spiScore: 88,
        distance: 3.7,
        availability: 'on_call',
        matchScore: 92,
      },
      {
        caregiverId: 'cg-103',
        name: 'Rachel Thompson',
        phone: '937-555-0303',
        email: 'rachel.t@serenitycare.com',
        spiScore: 91,
        distance: 5.1,
        availability: 'available',
        matchScore: 87,
      },
    ];

    res.json({
      shiftId,
      priority,
      candidates: mockCandidates,
      notificationsSent: mockCandidates.length,
      message: `Found ${mockCandidates.length} available caregivers. Notifications sent.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error finding coverage', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/coverage-gaps
 * Get all coverage gaps for today or specified date
 *
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 * - podId: UUID (optional)
 */
router.get('/coverage-gaps', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { date, podId } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    logger.info('Fetching coverage gaps', { date: dateStr, podId });

    // Mock response - in production, this would query shifts with missing clock-ins
    const mockGaps = [
      {
        shiftId: 'shift-3',
        patient: { name: 'Betty Martinez', address: '789 Elm St, Dayton, OH' },
        caregiver: { name: 'Mike Davis', phone: '937-555-0203' },
        scheduledStart: `${dateStr}T09:00:00Z`,
        scheduledEnd: `${dateStr}T10:30:00Z`,
        status: 'no_show',
        minutesLate: 45,
        priority: 'urgent',
      },
    ];

    res.json({
      date: dateStr,
      podId: podId || 'all',
      gaps: mockGaps,
      total: mockGaps.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching coverage gaps', { error });
    next(error);
  }
});

export default router;
