/**
 * Business Intelligence Routes
 * API routes for BI Dashboard
 *
 * Base path: /api/bi
 */

import { Router } from 'express';
import { biController } from '../controllers/bi.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All BI routes require authentication
router.use(authenticate);

/**
 * GET /api/bi/reports
 * Get business intelligence reports catalog with data
 *
 * Query Parameters:
 * - reportType: string (optional) - Specific report to generate
 *   Options: 'revenue_analysis', 'visit_completion', 'caregiver_utilization',
 *            'client_retention', 'referral_sources', 'payer_mix', 'cost_analysis'
 *
 * Required Permissions:
 * - Dashboard: BUSINESS_INTELLIGENCE_DASHBOARD
 * - Feature: VIEW_BI_REPORTS
 * - Roles: FOUNDER, FINANCE_DIRECTOR, OPERATIONS_MANAGER
 */
router.get(
  '/reports',
  biController.getReports.bind(biController)
);

export default router;
