/**
 * Executive Routes
 * API routes for Executive Command Center
 *
 * Base path: /api/executive
 */

import { Router } from 'express';
import { executiveController } from '../controllers/executive.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// All executive routes require authentication
router.use(authenticate);

/**
 * GET /api/executive/overview
 * Get executive overview including business health scorecard, KPIs, and urgent items
 *
 * Query Parameters:
 * - dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 *
 * Required Permissions:
 * - Dashboard: EXECUTIVE_COMMAND_CENTER
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
const overviewSchema = z.object({
  query: z.object({
    dateRange: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional().default('month')
  })
});

router.get(
  '/overview',
  validateRequest(overviewSchema),
  executiveController.getOverview.bind(executiveController)
);

/**
 * GET /api/executive/revenue
 * Get revenue analytics by service line, payer, and profitability
 *
 * Query Parameters:
 * - startDate: ISO 8601 date (required)
 * - endDate: ISO 8601 date (required)
 * - groupBy: 'day' | 'week' | 'month' (default: 'month')
 *
 * Required Permissions:
 * - Dashboard: EXECUTIVE_COMMAND_CENTER
 * - Feature: VIEW_REVENUE_ANALYTICS
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
const revenueSchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('month')
  })
});

router.get(
  '/revenue',
  validateRequest(revenueSchema),
  executiveController.getRevenueAnalytics.bind(executiveController)
);

/**
 * GET /api/executive/risks
 * Get strategic risk dashboard with mitigation tracking
 *
 * Required Permissions:
 * - Dashboard: EXECUTIVE_COMMAND_CENTER
 * - Feature: VIEW_RISK_DASHBOARD
 * - Roles: FOUNDER, FINANCE_DIRECTOR
 */
router.get(
  '/risks',
  executiveController.getRisks.bind(executiveController)
);

export default router;
