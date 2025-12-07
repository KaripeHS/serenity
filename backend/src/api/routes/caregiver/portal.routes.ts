/**
 * Caregiver Portal Routes
 * Self-service endpoints for caregivers to view their schedule, earnings, and metrics.
 *
 * @module api/routes/caregiver/portal
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';
import { SPIService } from '../../../modules/hr/spi.service';

const router = Router();
const repository = getSandataRepository(getDbClient());
const spiService = new SPIService();

/**
 * GET /api/caregiver/me/schedule
 * Get my upcoming schedule
 */
router.get('/me/schedule', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const caregiverId = req.user?.userId;
        if (!caregiverId) throw ApiErrors.unauthorized('User not authenticated');

        const { startDate, endDate, days = '7' } = req.query;

        const start = startDate
            ? new Date(startDate as string)
            : new Date();
        const end = endDate
            ? new Date(endDate as string)
            : new Date(start.getTime() + parseInt(days as string) * 24 * 60 * 60 * 1000);

        const shifts = await repository.getCaregiverShiftsByDateRange(
            caregiverId,
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0]
        );

        res.json({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            shifts: shifts.map((shift: any) => ({
                id: shift.id,
                clientName: shift.client_name,
                clientAddress: {
                    line1: shift.client_address_line1,
                    city: shift.client_city,
                    zip: shift.client_zip
                },
                scheduledStartTime: shift.scheduled_start_time,
                scheduledEndTime: shift.scheduled_end_time,
                status: shift.status,
                serviceCode: shift.service_code,
                notes: shift.notes
            })),
            count: shifts.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/caregiver/me/earnings
 * Get my earnings (estimated)
 */
router.get('/me/earnings', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const caregiverId = req.user?.userId;
        if (!caregiverId) throw ApiErrors.unauthorized('User not authenticated');

        const { month } = req.query;
        const targetMonth = month ? new Date(month as string) : new Date();

        // Calculate start and end of month
        const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
        const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

        // Get completed shifts for the month
        const shifts = await repository.getCaregiverShiftsByDateRange(
            caregiverId,
            startOfMonth.toISOString().split('T')[0],
            endOfMonth.toISOString().split('T')[0]
        );

        const completedShifts = shifts.filter((s: any) => s.status === 'completed');

        // Simple calculation (replace with complex payroll logic if needed)
        // Assuming rate is stored on caregiver profile or shift
        const caregiver = await repository.getUser(caregiverId);
        const hourlyRate = (caregiver as any)?.pay_rate || 20.00; // Fallback rate

        let totalHours = 0;
        let estimatedEarnings = 0;

        completedShifts.forEach((shift: any) => {
            const durationMs = new Date(shift.actual_end_time || shift.scheduled_end_time).getTime() -
                new Date(shift.actual_start_time || shift.scheduled_start_time).getTime();
            const hours = durationMs / (1000 * 60 * 60);
            totalHours += hours;
            estimatedEarnings += hours * hourlyRate;
        });

        res.json({
            month: targetMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
            totalHours: parseFloat(totalHours.toFixed(2)),
            estimatedEarnings: parseFloat(estimatedEarnings.toFixed(2)),
            shiftsCount: completedShifts.length,
            currency: 'USD'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/caregiver/me/metrics
 * Get my reliability score (SPI)
 */
router.get('/me/metrics', async (req: AuthenticatedRequest, res: Response, next) => {
    try {
        const caregiverId = req.user?.userId;
        if (!caregiverId) throw ApiErrors.unauthorized('User not authenticated');

        const { month } = req.query;
        const targetDate = month ? new Date(month as string) : new Date();
        const monthStr = targetDate.toISOString().split('T')[0].substring(0, 7); // YYYY-MM

        const spiResult = await spiService.calculateMonthlySPI(caregiverId, monthStr);

        res.json({
            overallScore: spiResult.overallScore,
            tier: spiResult.tier,
            components: spiResult.components,
            earnedOTEligible: spiResult.earnedOTEligible,
            month: monthStr
        });

    } catch (error) {
        next(error);
    }
});

export default router;
