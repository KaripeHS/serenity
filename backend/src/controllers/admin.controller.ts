/**
 * Admin & System Controller
 * Handles HTTP requests for Admin & System Dashboard endpoints
 *
 * Routes:
 * - GET /api/admin/overview
 * - GET /api/admin/security
 */

import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth';

export class AdminController {
  /**
   * GET /api/admin/overview
   * Get system overview with users, security, and performance metrics
   *
   * Required Permissions: ADMIN_SYSTEM_DASHBOARD dashboard
   * Allowed Roles: FOUNDER, SYSTEM_ADMIN
   */
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'SYSTEM_ADMIN'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access admin dashboard'
          }
        });
      }

      const organizationId = req.user!.organizationId;

      const data = await adminService.getOverview(organizationId);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getOverview:', error);
      next(error);
    }
  }

  /**
   * GET /api/admin/security
   * Get detailed security audit with logs, sessions, and compliance
   *
   * Query Parameters:
   * - days: number (optional, default: 30, max: 90) - Number of days to look back
   *
   * Required Permissions: ADMIN_SYSTEM_DASHBOARD dashboard, VIEW_SECURITY_AUDIT feature
   * Allowed Roles: FOUNDER, SYSTEM_ADMIN, COMPLIANCE_OFFICER
   */
  async getSecurityAudit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access security audit data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_SECURITY_AUDIT')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view security audit data'
          }
        });
      }

      const organizationId = req.user!.organizationId;

      // Parse days parameter
      let days = 30; // Default
      if (req.query.days) {
        days = parseInt(req.query.days as string);
        if (isNaN(days) || days < 1 || days > 90) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'days must be between 1 and 90'
            }
          });
        }
      }

      const data = await adminService.getSecurityAudit(organizationId, days);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          days,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getSecurityAudit:', error);
      next(error);
    }
  }
}

export const adminController = new AdminController();
