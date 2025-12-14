/**
 * Caregiver Portal Routes
 * API routes for Caregiver Portal
 *
 * Base path: /api/caregiver-portal
 */

import { Router } from 'express';
import { caregiverController } from '../controllers/caregiver.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All caregiver portal routes require authentication
router.use(authenticate);

/**
 * GET /api/caregiver-portal/visits/today
 * Get today's visit schedule for caregiver with emergency contacts and tasks
 *
 * Query Parameters:
 * - date: ISO 8601 date string (optional, defaults to today)
 *
 * Required Permissions:
 * - Dashboard: CAREGIVER_PORTAL
 * - Roles: CAREGIVER, DSP_BASIC, DSP_MED
 * - Isolation: Caregivers can only view their own schedule
 */
router.get(
  '/visits/today',
  caregiverController.getTodayVisits.bind(caregiverController)
);

/**
 * GET /api/caregiver-portal/expenses
 * Get expense history for caregiver with summary by status
 *
 * Query Parameters:
 * - status: string (optional) - 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected'
 *
 * Required Permissions:
 * - Dashboard: CAREGIVER_PORTAL
 * - Roles: CAREGIVER, DSP_BASIC, DSP_MED
 * - Isolation: Caregivers can only view their own expenses
 */
router.get(
  '/expenses',
  caregiverController.getExpenses.bind(caregiverController)
);

/**
 * POST /api/caregiver-portal/expenses
 * Submit a new expense for reimbursement
 *
 * Request Body:
 * {
 *   expenseType: string, // 'mileage' | 'supplies' | 'training' | 'other'
 *   amount: number,
 *   expenseDate: string, // ISO 8601 date
 *   description: string,
 *   receiptBase64?: string // Optional receipt image (base64 encoded)
 * }
 *
 * Required Permissions:
 * - Dashboard: CAREGIVER_PORTAL
 * - Roles: CAREGIVER, DSP_BASIC, DSP_MED
 * - Isolation: Caregivers can only submit their own expenses
 */
router.post(
  '/expenses',
  caregiverController.submitExpense.bind(caregiverController)
);

/**
 * GET /api/caregiver-portal/training-status
 * Get training status for caregiver (placeholder for Phase 2)
 *
 * Required Permissions:
 * - Dashboard: CAREGIVER_PORTAL
 * - Roles: CAREGIVER, DSP_BASIC, DSP_MED
 * - Isolation: Caregivers can only view their own training status
 */
router.get(
  '/training-status',
  caregiverController.getTrainingStatus.bind(caregiverController)
);

/**
 * GET /api/caregiver-portal/performance
 * Get performance metrics for caregiver (30-day SPI scores, on-time %, etc.)
 *
 * Required Permissions:
 * - Dashboard: CAREGIVER_PORTAL
 * - Roles: CAREGIVER, DSP_BASIC, DSP_MED
 * - Isolation: Caregivers can only view their own performance metrics
 */
router.get(
  '/performance',
  caregiverController.getPerformanceMetrics.bind(caregiverController)
);

export default router;
