/**
 * OT Analysis API
 * Analyze overtime patterns and identify cost optimization opportunities
 *
 * Features:
 * - OT cost breakdown by caregiver
 * - Earned OT tracking (SPI >= 80)
 * - Weekly OT pattern analysis
 * - OT prevention recommendations
 * - Shift optimization suggestions
 *
 * @module api/routes/console/ot-analysis
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

// All routes require authentication
router.use(requireAuth);

interface OTAnalysis {
  period: { start: string; end: string };
  summary: {
    totalOTHours: number;
    totalOTCost: number;
    earnedOTHours: number;
    earnedOTCost: number;
    avoidableOTHours: number;
    avoidableOTCost: number;
  };
  byCaregiver: Array<{
    caregiverId: string;
    name: string;
    totalHours: number;
    regularHours: number;
    otHours: number;
    earnedOTHours: number;
    otCost: number;
    spiScore: number;
    otRate: number; // % of total hours
  }>;
  patterns: {
    peakDays: string[]; // Days with most OT
    hotspots: string[]; // Time ranges with OT
    seasonality: string; // Trend description
  };
  recommendations: Array<{
    type: 'hire' | 'redistribute' | 'optimize_schedule';
    title: string;
    description: string;
    estimatedSavings: number;
  }>;
}

/**
 * GET /api/console/hr/ot-analysis
 * Get OT analysis for date range
 */
router.get('/ot-analysis', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('startDate and endDate are required');
    }

    // TODO: Query EVV records and calculate OT
    // const db = DatabaseClient.getInstance();
    // Calculate:
    // - Total hours by caregiver
    // - Regular vs OT breakdown
    // - Earned OT for high performers
    // - Cost analysis

    // Mock analysis for development
    const analysis: OTAnalysis = {
      period: {
        start: startDate as string,
        end: endDate as string
      },
      summary: {
        totalOTHours: 142.5,
        totalOTCost: 4275.00, // $30/hr base * 1.5
        earnedOTHours: 32.0,
        earnedOTCost: 960.00,
        avoidableOTHours: 28.5,
        avoidableOTCost: 855.00
      },
      byCaregiver: [
        {
          caregiverId: 'cg-001',
          name: 'Mary Smith',
          totalHours: 96.0,
          regularHours: 80.0,
          otHours: 8.0,
          earnedOTHours: 8.0,
          otCost: 360.00,
          spiScore: 92,
          otRate: 8.3
        },
        {
          caregiverId: 'cg-002',
          name: 'John Doe',
          totalHours: 92.0,
          regularHours: 80.0,
          otHours: 12.0,
          earnedOTHours: 0.0,
          otCost: 540.00,
          spiScore: 72,
          otRate: 13.0
        },
        {
          caregiverId: 'cg-003',
          name: 'Sarah Johnson',
          totalHours: 88.0,
          regularHours: 80.0,
          otHours: 8.0,
          earnedOTHours: 0.0,
          otCost: 360.00,
          spiScore: 78,
          otRate: 9.1
        }
      ],
      patterns: {
        peakDays: ['Monday', 'Friday'],
        hotspots: ['8am-10am', '4pm-6pm'],
        seasonality: 'OT increases 15% during flu season (Nov-Feb)'
      },
      recommendations: [
        {
          type: 'hire',
          title: 'Hire 1 Additional Caregiver',
          description: 'Current team is consistently over 40hrs/week. Adding 1 caregiver would reduce OT by 25%.',
          estimatedSavings: 3200.00
        },
        {
          type: 'redistribute',
          title: 'Balance Shift Distribution',
          description: 'John Doe averages 12 OT hours/month (13% OT rate). Redistribute 8 hours to Sarah Johnson.',
          estimatedSavings: 540.00
        },
        {
          type: 'optimize_schedule',
          title: 'Optimize Monday/Friday Schedules',
          description: 'Peak OT days are Monday and Friday. Adjust schedules to avoid clustering shifts.',
          estimatedSavings: 430.00
        }
      ]
    };

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/ot-analysis/caregiver/:id
 * Get detailed OT analysis for a specific caregiver
 */
router.get('/ot-analysis/caregiver/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('startDate and endDate are required');
    }

    // TODO: Query caregiver's EVV records

    const analysis = {
      caregiverId: id,
      name: 'Mary Smith',
      period: { start: startDate, end: endDate },
      totalHours: 96.0,
      regularHours: 80.0,
      otHours: 8.0,
      earnedOTHours: 8.0,
      otCost: 360.00,
      spiScore: 92,
      weeklyBreakdown: [
        { week: 'Week 1 (Oct 1-7)', hours: 42.0, otHours: 2.0 },
        { week: 'Week 2 (Oct 8-14)', hours: 40.0, otHours: 0.0 },
        { week: 'Week 3 (Oct 15-21)', hours: 38.0, otHours: 0.0 },
        { week: 'Week 4 (Oct 22-28)', hours: 44.0, otHours: 4.0 }
      ],
      reasons: [
        'Earned OT eligible (SPI 92)',
        'Covered 2 emergency gaps',
        'High-demand client preference'
      ]
    };

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

export default router;
