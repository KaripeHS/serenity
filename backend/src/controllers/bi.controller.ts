/**
 * Business Intelligence Controller
 * Handles HTTP requests for BI Dashboard endpoints
 *
 * Routes:
 * - GET /api/bi/reports
 */

import { Request, Response, NextFunction } from 'express';
import { biService } from '../services/bi.service';
import { AuthRequest } from '../middleware/auth';

export class BIController {
  /**
   * GET /api/bi/reports
   * Get business intelligence reports catalog with data
   *
   * Query Parameters:
   * - reportType: string (optional) - Specific report to generate
   *   Options: 'revenue_analysis', 'visit_completion', 'caregiver_utilization',
   *            'client_retention', 'referral_sources', 'payer_mix', 'cost_analysis'
   *
   * Required Permissions: BUSINESS_INTELLIGENCE_DASHBOARD dashboard
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR, OPERATIONS_MANAGER
   */
  async getReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'FINANCE_DIRECTOR', 'OPERATIONS_MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access business intelligence data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_BI_REPORTS')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view BI reports'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const reportType = req.query.reportType as string | undefined;

      // Validate report type if provided
      if (reportType) {
        const validReportTypes = [
          'revenue_analysis',
          'visit_completion',
          'caregiver_utilization',
          'client_retention',
          'referral_sources',
          'payer_mix',
          'cost_analysis'
        ];

        if (!validReportTypes.includes(reportType)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid reportType. Must be one of: ${validReportTypes.join(', ')}`
            }
          });
        }
      }

      const data = await biService.getReports(organizationId, reportType);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          reportType: reportType || 'all',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      next(error);
    }
  }
}

export const biController = new BIController();
