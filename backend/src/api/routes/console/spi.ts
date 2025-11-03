/**
 * SPI (Serenity Performance Index) Routes
 * API endpoints for calculating and viewing caregiver performance scores
 *
 * @module api/routes/console/spi
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { spiService } from '../../../modules/hr/spi.service';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/spi/:caregiverId
 * Get current SPI for a caregiver (current month)
 */
router.get('/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver ID is required');
    }

    // Calculate SPI for current month
    const currentMonth = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
    const spiResult = await spiService.calculateMonthlySPI(caregiverId, currentMonth);

    res.json({
      success: true,
      caregiverId,
      currentMonth,
      spi: spiResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/spi/:caregiverId/month/:month
 * Get SPI for a specific month
 */
router.get('/:caregiverId/month/:month', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId, month } = req.params;

    if (!caregiverId || !month) {
      throw ApiErrors.badRequest('Caregiver ID and month are required');
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw ApiErrors.badRequest('Invalid month format. Use YYYY-MM');
    }

    const spiResult = await spiService.calculateMonthlySPI(caregiverId, month);

    res.json({
      success: true,
      caregiverId,
      month,
      spi: spiResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/spi/:caregiverId/history
 * Get SPI history for a caregiver (last 12 months by default)
 */
router.get('/:caregiverId/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;
    const months = parseInt(req.query.months as string) || 12;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver ID is required');
    }

    if (months < 1 || months > 24) {
      throw ApiErrors.badRequest('Months must be between 1 and 24');
    }

    const history = await spiService.getSPIHistory(caregiverId, months);
    const rollingAverage = await spiService.calculateRollingAverage(caregiverId);

    res.json({
      success: true,
      caregiverId,
      months,
      rollingAverage,
      history
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/spi/:caregiverId/rolling-average
 * Get 12-month rolling average SPI
 */
router.get('/:caregiverId/rolling-average', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver ID is required');
    }

    const rollingAverage = await spiService.calculateRollingAverage(caregiverId);

    res.json({
      success: true,
      caregiverId,
      rollingAverage,
      earnedOTEligible: rollingAverage >= 80
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/spi/:caregiverId/calculate
 * Manually trigger SPI calculation for a caregiver
 */
router.post('/:caregiverId/calculate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;
    const { month } = req.body;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver ID is required');
    }

    // Use provided month or current month
    const targetMonth = month || new Date().toISOString().substring(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      throw ApiErrors.badRequest('Invalid month format. Use YYYY-MM');
    }

    // Calculate SPI
    const spiResult = await spiService.calculateMonthlySPI(caregiverId, targetMonth);

    // Save to database
    await spiService.saveSPISnapshot(spiResult);

    res.json({
      success: true,
      message: 'SPI calculated and saved successfully',
      caregiverId,
      month: targetMonth,
      spi: spiResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/spi/leaderboard
 * Get SPI leaderboard (top performers)
 */
router.get('/leaderboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);

    // TODO: Query database for top performers
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     s.caregiver_id,
    //     c.first_name,
    //     c.last_name,
    //     s.overall_score,
    //     s.tier,
    //     s.earned_ot_eligible
    //   FROM spi_snapshots s
    //   JOIN caregivers c ON c.id = s.caregiver_id
    //   WHERE s.month = $1
    //   ORDER BY s.overall_score DESC
    //   LIMIT $2
    // `, [month, limit]);

    // Mock leaderboard data
    const mockLeaderboard = [
      { caregiverId: 'cg-001', name: 'Mary Smith', score: 98, tier: 'exceptional', earnedOT: true },
      { caregiverId: 'cg-002', name: 'John Doe', score: 95, tier: 'exceptional', earnedOT: true },
      { caregiverId: 'cg-003', name: 'Sarah Johnson', score: 92, tier: 'good', earnedOT: true },
      { caregiverId: 'cg-004', name: 'Emily Rodriguez', score: 88, tier: 'good', earnedOT: true },
      { caregiverId: 'cg-005', name: 'James Thompson', score: 85, tier: 'good', earnedOT: true }
    ].slice(0, limit);

    res.json({
      success: true,
      month,
      limit,
      leaderboard: mockLeaderboard
    });
  } catch (error) {
    next(error);
  }
});

export default router;
