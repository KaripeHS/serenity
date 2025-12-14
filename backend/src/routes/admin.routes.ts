/**
 * Admin & System Routes
 * API routes for Admin & System Dashboard
 *
 * Base path: /api/admin
 */

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/overview
 * Get system overview with users, security, and performance metrics
 *
 * Required Permissions:
 * - Dashboard: ADMIN_SYSTEM_DASHBOARD
 * - Roles: FOUNDER, SYSTEM_ADMIN
 */
router.get(
  '/overview',
  adminController.getOverview.bind(adminController)
);

/**
 * GET /api/admin/security
 * Get detailed security audit with logs, sessions, and compliance
 *
 * Query Parameters:
 * - days: number (optional, default: 30, max: 90) - Number of days to look back
 *
 * Required Permissions:
 * - Dashboard: ADMIN_SYSTEM_DASHBOARD
 * - Feature: VIEW_SECURITY_AUDIT
 * - Roles: FOUNDER, SYSTEM_ADMIN, COMPLIANCE_OFFICER
 */
router.get(
  '/security',
  adminController.getSecurityAudit.bind(adminController)
);

export default router;
