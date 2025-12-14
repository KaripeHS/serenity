/**
 * Analytics Controller
 * Handles HTTP requests for Strategic Growth Dashboard endpoints
 *
 * Routes:
 * - GET /api/analytics/growth-overview
 * - GET /api/analytics/hiring-forecast
 * - GET /api/analytics/churn-predictions
 * - GET /api/analytics/lead-scoring
 */

import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { AuthRequest } from '../middleware/auth';

export class AnalyticsController {
  /**
   * GET /api/analytics/growth-overview
   * Get growth overview with client acquisition forecast
   *
   * Required Permissions: STRATEGIC_GROWTH dashboard
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR
   */
  async getGrowthOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access strategic growth data'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const forecastDays = parseInt(req.query.forecastDays as string) || 90;

      // Validate forecastDays
      if (forecastDays < 1 || forecastDays > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'forecastDays must be between 1 and 365'
          }
        });
      }

      const data = await analyticsService.getGrowthOverview(organizationId, forecastDays);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          forecastDays,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getGrowthOverview:', error);
      next(error);
    }
  }

  /**
   * GET /api/analytics/hiring-forecast
   * Get hiring recommendations based on client growth forecast
   *
   * Required Permissions: STRATEGIC_GROWTH dashboard, VIEW_PREDICTIVE_ANALYTICS feature
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR, HR_MANAGER
   */
  async getHiringForecast(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'FINANCE_DIRECTOR', 'HR_MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access hiring forecast data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_PREDICTIVE_ANALYTICS')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view predictive analytics'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const forecastDays = parseInt(req.query.forecastDays as string) || 90;

      if (forecastDays < 1 || forecastDays > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'forecastDays must be between 1 and 365'
          }
        });
      }

      const data = await analyticsService.getHiringForecast(organizationId, forecastDays);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          forecastDays,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getHiringForecast:', error);
      next(error);
    }
  }

  /**
   * GET /api/analytics/churn-predictions
   * Get caregiver churn risk predictions
   *
   * Required Permissions: STRATEGIC_GROWTH dashboard, VIEW_PREDICTIVE_ANALYTICS feature
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR, HR_MANAGER
   */
  async getChurnPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'FINANCE_DIRECTOR', 'HR_MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access churn prediction data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_PREDICTIVE_ANALYTICS')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view predictive analytics'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const riskThreshold = parseFloat(req.query.riskThreshold as string) || 0.5;

      if (riskThreshold < 0 || riskThreshold > 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'riskThreshold must be between 0 and 1'
          }
        });
      }

      const data = await analyticsService.getChurnPredictions(organizationId, riskThreshold);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          riskThreshold,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getChurnPredictions:', error);
      next(error);
    }
  }

  /**
   * GET /api/analytics/lead-scoring
   * Get lead conversion scores and recommendations
   *
   * Required Permissions: STRATEGIC_GROWTH dashboard, VIEW_PREDICTIVE_ANALYTICS feature
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR
   */
  async getLeadScoring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access lead scoring data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_PREDICTIVE_ANALYTICS')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view predictive analytics'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const minScore = parseInt(req.query.minScore as string) || 0;
      const status = req.query.status as string;

      if (minScore < 0 || minScore > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'minScore must be between 0 and 100'
          }
        });
      }

      if (status) {
        const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            }
          });
        }
      }

      const data = await analyticsService.getLeadScoring(organizationId, minScore, status);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          minScore,
          status: status || 'all',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getLeadScoring:', error);
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
