/**
 * Operations Routes
 * API routes for Operations Command Center
 *
 * Base path: /api/operations
 */

import { Router } from 'express';
import { operationsController } from '../controllers/operations.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All operations routes require authentication
router.use(authenticate);

/**
 * GET /api/operations/overview
 * Get operations overview with today's visit statistics
 *
 * Query Parameters:
 * - date: ISO 8601 date string (optional, defaults to today)
 *
 * Required Permissions:
 * - Dashboard: OPERATIONS_COMMAND_CENTER
 * - Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR, CLINICAL_DIRECTOR
 */
router.get(
  '/overview',
  operationsController.getOverview.bind(operationsController)
);

/**
 * GET /api/operations/schedule
 * Get schedule view with optimization suggestions
 *
 * Query Parameters:
 * - startDate: ISO 8601 date string (required)
 * - endDate: ISO 8601 date string (required)
 * - caregiverId: UUID (optional) - Filter by specific caregiver
 * - clientId: UUID (optional) - Filter by specific client
 * - status: string (optional) - 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
 *
 * Required Permissions:
 * - Dashboard: OPERATIONS_COMMAND_CENTER
 * - Feature: VIEW_SCHEDULE
 * - Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR, CLINICAL_DIRECTOR
 */
router.get(
  '/schedule',
  operationsController.getSchedule.bind(operationsController)
);

/**
 * GET /api/operations/gps
 * Get real-time GPS tracking for caregivers on duty
 *
 * Query Parameters:
 * - caregiverId: UUID (optional) - Filter by specific caregiver
 * - activeOnly: boolean (optional, default: true) - Only show active visits
 *
 * Required Permissions:
 * - Dashboard: OPERATIONS_COMMAND_CENTER
 * - Feature: VIEW_GPS_TRACKING
 * - Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR
 */
router.get(
  '/gps',
  operationsController.getGPSTracking.bind(operationsController)
);

/**
 * GET /api/operations/mileage
 * Get mileage reimbursement tracking
 *
 * Query Parameters:
 * - status: string (optional) - 'pending' | 'approved' | 'paid' | 'rejected'
 * - caregiverId: UUID (optional) - Filter by specific caregiver
 * - startDate: ISO 8601 date string (optional)
 * - endDate: ISO 8601 date string (optional)
 *
 * Required Permissions:
 * - Dashboard: OPERATIONS_COMMAND_CENTER
 * - Feature: VIEW_MILEAGE or APPROVE_MILEAGE
 * - Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR, FINANCE_DIRECTOR
 */
router.get(
  '/mileage',
  operationsController.getMileageReimbursements.bind(operationsController)
);

export default router;
