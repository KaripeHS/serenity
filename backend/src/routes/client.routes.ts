/**
 * Client Portal Routes
 * API routes for Client & Family Portal
 *
 * Base path: /api/client-portal
 */

import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All client portal routes require authentication
router.use(authenticate);

/**
 * GET /api/client-portal/overview
 * Get overview for client portal with upcoming visits, recent activity, care team
 *
 * Required Permissions:
 * - Dashboard: CLIENT_FAMILY_PORTAL
 * - Roles: CLIENT, FAMILY_MEMBER
 * - Isolation: Clients can only view their own data
 */
router.get(
  '/overview',
  clientController.getOverview.bind(clientController)
);

/**
 * GET /api/client-portal/care-plan
 * Get detailed care plan with goals, interventions, and progress
 *
 * Required Permissions:
 * - Dashboard: CLIENT_FAMILY_PORTAL
 * - Roles: CLIENT, FAMILY_MEMBER
 * - Isolation: Clients can only view their own care plan
 */
router.get(
  '/care-plan',
  clientController.getCarePlan.bind(clientController)
);

/**
 * GET /api/client-portal/visits
 * Get visit history with filters
 *
 * Query Parameters:
 * - startDate: ISO 8601 date string (optional, defaults to 30 days ago)
 * - endDate: ISO 8601 date string (optional, defaults to today)
 * - status: string (optional) - 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
 *
 * Required Permissions:
 * - Dashboard: CLIENT_FAMILY_PORTAL
 * - Roles: CLIENT, FAMILY_MEMBER
 * - Isolation: Clients can only view their own visits
 */
router.get(
  '/visits',
  clientController.getVisits.bind(clientController)
);

/**
 * GET /api/client-portal/invoices
 * Get billing invoices for client
 *
 * Query Parameters:
 * - startDate: ISO 8601 date string (optional)
 * - endDate: ISO 8601 date string (optional)
 * - status: string (optional) - 'pending' | 'paid' | 'overdue' | 'cancelled'
 *
 * Required Permissions:
 * - Dashboard: CLIENT_FAMILY_PORTAL
 * - Roles: CLIENT, FAMILY_MEMBER
 * - Isolation: Clients can only view their own invoices
 */
router.get(
  '/invoices',
  clientController.getInvoices.bind(clientController)
);

export default router;
