
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { timeOffService } from '../../services/operations/time-off.service';
import { attendanceMonitor } from '../../services/operations/attendance-monitoring.service';
import { operationsDashboardService } from '../../services/operations/operations-dashboard.service';

const router = Router();

// ===================================
// Time Off Management
// ===================================

/**
 * POST /api/operations/time-off
 * Submit a time off request
 */
router.post('/time-off', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const result = await timeOffService.requestTimeOff(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/operations/time-off/pending/:organizationId
 * Get pending requests for Admin
 */
router.get('/time-off/pending/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { organizationId } = req.params;
        const results = await timeOffService.getPendingRequests(organizationId);
        res.json(results);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/operations/time-off/:requestId/review
 * Approve or Deny Request
 */
router.post('/time-off/:requestId/review', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { requestId } = req.params;
        const { status, reason } = req.body;
        const reviewerId = req.user?.userId;

        if (!reviewerId) throw new Error('Reviewer ID required');

        const result = await timeOffService.reviewRequest(requestId, status, reviewerId, reason);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ===================================
// Commuter & Attendance Monitoring
// ===================================

/**
 * POST /api/operations/commute/start
 * Log wake-up / commute start
 */
router.post('/commute/start', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { shiftId, latitude, longitude } = req.body;

        const result = await attendanceMonitor.logCommuteStart(shiftId, latitude, longitude);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/operations/cron/attendance
 * Trigger manual attendance check (Cron Job)
 */
router.post('/cron/attendance', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        await attendanceMonitor.checkUpcomingShifts();
        res.json({ success: true, message: 'Monitor run successfully' });
    } catch (err) {
        next(err);
    }
});

// ===================================
// Live Command Center
// ===================================

/**
 * GET /api/operations/live/:organizationId
 * Get real-time shift status grid
 */
router.get('/live/:organizationId', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const { organizationId } = req.params;
        const results = await operationsDashboardService.getLiveStatus(organizationId);
        res.json(results);
    } catch (err) {
        next(err);
    }
});

export default router;
