/**
 * Analytics Routes
 * API routes for Strategic Growth Dashboard
 *
 * Base path: /api/analytics
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/growth-overview
 * Get growth overview with client acquisition forecast
 *
 * Query Parameters:
 * - forecastDays: number (optional, default: 90, max: 365)
 *
 * Required Permissions:
 * - Dashboard: STRATEGIC_GROWTH
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
router.get(
  '/growth-overview',
  analyticsController.getGrowthOverview.bind(analyticsController)
);

/**
 * GET /api/analytics/hiring-forecast
 * Get hiring recommendations based on client growth
 *
 * Query Parameters:
 * - forecastDays: number (optional, default: 90, max: 365)
 *
 * Required Permissions:
 * - Dashboard: STRATEGIC_GROWTH
 * - Feature: VIEW_PREDICTIVE_ANALYTICS
 * - Roles: FOUNDER, FINANCE_DIRECTOR, HR_MANAGER
 */
router.get(
  '/hiring-forecast',
  analyticsController.getHiringForecast.bind(analyticsController)
);

/**
 * GET /api/analytics/churn-predictions
 * Get caregiver churn risk predictions
 *
 * Query Parameters:
 * - riskThreshold: number (optional, default: 0.5, range: 0-1)
 *
 * Required Permissions:
 * - Dashboard: STRATEGIC_GROWTH
 * - Feature: VIEW_PREDICTIVE_ANALYTICS
 * - Roles: FOUNDER, FINANCE_DIRECTOR, HR_MANAGER
 */
router.get(
  '/churn-predictions',
  analyticsController.getChurnPredictions.bind(analyticsController)
);

/**
 * GET /api/analytics/lead-scoring
 * Get lead conversion scores and recommendations
 *
 * Query Parameters:
 * - minScore: number (optional, default: 0, range: 0-100)
 * - status: string (optional) - 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
 *
 * Required Permissions:
 * - Dashboard: STRATEGIC_GROWTH
 * - Feature: VIEW_PREDICTIVE_ANALYTICS
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
router.get(
  '/lead-scoring',
  analyticsController.getLeadScoring.bind(analyticsController)
);

export default router;
