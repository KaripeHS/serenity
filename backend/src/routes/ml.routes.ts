/**
 * ML & Optimization Routes
 * API routes for ML-powered features
 *
 * Base path: /api/ml
 */

import { Router } from 'express';
import { mlController } from '../controllers/ml.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All ML routes require authentication
router.use(authenticate);

/**
 * GET /api/ml/forecast/client-acquisition
 * Get ML-powered client acquisition forecast using Holt-Winters
 *
 * Query Parameters:
 * - forecastDays: number (optional, default: 90, max: 365)
 *
 * Required Permissions:
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
router.get(
  '/forecast/client-acquisition',
  mlController.getClientAcquisitionForecast.bind(mlController)
);

/**
 * GET /api/ml/predictions/churn
 * Get ML-powered caregiver churn predictions using Gradient Boosting
 *
 * Query Parameters:
 * - riskThreshold: number (optional, default: 0.5, range: 0-1)
 *
 * Required Permissions:
 * - Roles: FOUNDER, FINANCE_DIRECTOR, HR_MANAGER
 */
router.get(
  '/predictions/churn',
  mlController.getCaregiverChurnPredictions.bind(mlController)
);

/**
 * GET /api/ml/scoring/leads
 * Get ML-powered lead scoring using Logistic Regression
 *
 * Query Parameters:
 * - minScore: number (optional, default: 0, range: 0-100)
 * - status: string (optional)
 *
 * Required Permissions:
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
router.get(
  '/scoring/leads',
  mlController.getLeadScoring.bind(mlController)
);

/**
 * POST /api/ml/optimize/schedule
 * Optimize schedule assignments using constraint satisfaction
 *
 * Request Body:
 * {
 *   startDate: string, // ISO 8601
 *   endDate: string    // ISO 8601
 * }
 *
 * Required Permissions:
 * - Roles: FOUNDER, SCHEDULER, OPERATIONS_MANAGER
 */
router.post(
  '/optimize/schedule',
  mlController.optimizeSchedule.bind(mlController)
);

/**
 * GET /api/ml/optimize/suggestions
 * Get schedule optimization suggestions
 *
 * Query Parameters:
 * - startDate: ISO 8601 date string (optional, defaults to today)
 * - endDate: ISO 8601 date string (optional, defaults to +7 days)
 *
 * Required Permissions:
 * - Roles: FOUNDER, SCHEDULER, OPERATIONS_MANAGER
 */
router.get(
  '/optimize/suggestions',
  mlController.getOptimizationSuggestions.bind(mlController)
);

export default router;
