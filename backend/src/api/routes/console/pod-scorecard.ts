/**
 * Pod Scorecard API
 * KPI tracking for pod performance
 *
 * Tier 1 KPIs (Day 1 Pods):
 * - EVV Compliance %
 * - Sandata Acceptance %
 * - Continuity %
 * - Visit Coverage %
 *
 * Tier 2 KPIs (Pod-2+):
 * - Credential Freshness %
 * - Retention Rate (90-day)
 * - Gap Fill Rate %
 * - Claims Readiness %
 *
 * Tier 3 KPIs (4+ Pods):
 * - Family Satisfaction
 * - Rehospitalization Rate
 * - Utilization %
 *
 * @module api/routes/console/pod-scorecard
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

// All routes require authentication
router.use(requireAuth);

interface PodScorecard {
  podId: string;
  podName: string;
  month: string;
  tier1: {
    evvCompliance: number;
    sandataAcceptance: number;
    continuity: number;
    visitCoverage: number;
  };
  tier2?: {
    credentialFreshness: number;
    retentionRate: number;
    gapFillRate: number;
    claimsReadiness: number;
  };
  tier3?: {
    familySatisfaction: number;
    rehospitalizationRate: number;
    utilization: number;
  };
  ranking: number;
  totalPods: number;
  trend: 'improving' | 'stable' | 'declining';
  overallScore: number;
}

/**
 * GET /api/console/pods/:podId/scorecard
 * Get pod scorecard for specific month
 */
router.get('/:podId/scorecard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.params;
    const { month } = req.query;

    if (!month) {
      throw ApiErrors.badRequest('month parameter is required (YYYY-MM format)');
    }

    // TODO: Query database for pod metrics
    // const db = DatabaseClient.getInstance();
    // Calculate all KPIs from EVV records, claims, etc.

    // Mock scorecard for development
    const scorecard: PodScorecard = {
      podId,
      podName: `Pod-${podId.split('-')[1]}`,
      month: month as string,
      tier1: {
        evvCompliance: 97.8,
        sandataAcceptance: 98.5,
        continuity: 92.3,
        visitCoverage: 95.1
      },
      tier2: {
        credentialFreshness: 100.0,
        retentionRate: 88.5,
        gapFillRate: 94.2,
        claimsReadiness: 96.7
      },
      tier3: {
        familySatisfaction: 4.7,
        rehospitalizationRate: 4.2,
        utilization: 88.3
      },
      ranking: 2,
      totalPods: 3,
      trend: 'improving',
      overallScore: 94.2
    };

    res.json(scorecard);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/pods/scorecard/leaderboard
 * Get all pods ranked by performance
 */
router.get('/scorecard/leaderboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { month } = req.query;

    if (!month) {
      throw ApiErrors.badRequest('month parameter is required (YYYY-MM format)');
    }

    // TODO: Query all pods and calculate rankings

    const leaderboard = [
      {
        podId: 'pod-3',
        podName: 'Pod-3 (Cincinnati)',
        overallScore: 96.8,
        ranking: 1,
        tier1Avg: 97.2,
        tier2Avg: 96.5,
        trend: 'improving'
      },
      {
        podId: 'pod-1',
        podName: 'Pod-1 (Dayton)',
        overallScore: 94.2,
        ranking: 2,
        tier1Avg: 95.9,
        tier2Avg: 94.5,
        trend: 'improving'
      },
      {
        podId: 'pod-2',
        podName: 'Pod-2 (Columbus)',
        overallScore: 91.7,
        ranking: 3,
        tier1Avg: 93.1,
        tier2Avg: 90.8,
        trend: 'stable'
      }
    ];

    res.json({
      month,
      totalPods: 3,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/pods/:podId/scorecard/trend
 * Get pod scorecard trend over time (last 6 months)
 */
router.get('/:podId/scorecard/trend', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.params;

    // TODO: Query last 6 months of metrics

    const trend = [
      { month: '2025-05', overallScore: 89.2, ranking: 2 },
      { month: '2025-06', overallScore: 90.5, ranking: 2 },
      { month: '2025-07', overallScore: 92.1, ranking: 2 },
      { month: '2025-08', overallScore: 93.4, ranking: 2 },
      { month: '2025-09', overallScore: 93.8, ranking: 2 },
      { month: '2025-10', overallScore: 94.2, ranking: 2 }
    ];

    res.json({
      podId,
      trend
    });
  } catch (error) {
    next(error);
  }
});

export default router;
