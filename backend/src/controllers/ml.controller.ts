/**
 * ML & Optimization Controller
 * Handles requests for ML-powered features and schedule optimization
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { mlForecastService } from '../services/ml/forecast.service';
import { scheduleOptimizerService } from '../services/ml/schedule-optimizer.service';
import { parseISO, addDays } from 'date-fns';

export class MLController {
  /**
   * GET /api/ml/forecast/client-acquisition
   * Get ML-powered client acquisition forecast
   */
  async getClientAcquisitionForecast(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access forecasting data'
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

      const data = await mlForecastService.forecastClientAcquisition(organizationId, forecastDays);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          forecastDays,
          model: 'Holt-Winters Triple Exponential Smoothing',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getClientAcquisitionForecast:', error);
      next(error);
    }
  }

  /**
   * GET /api/ml/predictions/churn
   * Get ML-powered caregiver churn predictions
   */
  async getCaregiverChurnPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check
      if (!['FOUNDER', 'FINANCE_DIRECTOR', 'HR_MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access churn prediction data'
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

      const data = await mlForecastService.predictCaregiverChurn(organizationId, riskThreshold);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          riskThreshold,
          model: 'Gradient Boosting Ensemble',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getCaregiverChurnPredictions:', error);
      next(error);
    }
  }

  /**
   * GET /api/ml/scoring/leads
   * Get ML-powered lead scoring
   */
  async getLeadScoring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access lead scoring data'
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

      const data = await mlForecastService.scoreLeads(organizationId, minScore, status);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          minScore,
          status: status || 'all',
          model: 'Logistic Regression Classifier',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getLeadScoring:', error);
      next(error);
    }
  }

  /**
   * POST /api/ml/optimize/schedule
   * Optimize schedule assignments
   */
  async optimizeSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check
      if (!['FOUNDER', 'SCHEDULER', 'OPERATIONS_MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to optimize schedules'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate are required'
          }
        });
      }

      let parsedStartDate: Date;
      let parsedEndDate: Date;

      try {
        parsedStartDate = parseISO(startDate);
        parsedEndDate = parseISO(endDate);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)'
          }
        });
      }

      const data = await scheduleOptimizerService.optimizeSchedule(
        organizationId,
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data,
        meta: {
          startDate,
          endDate,
          algorithm: 'Constraint Satisfaction + Greedy Optimization',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in optimizeSchedule:', error);
      next(error);
    }
  }

  /**
   * GET /api/ml/optimize/suggestions
   * Get schedule optimization suggestions
   */
  async getOptimizationSuggestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check
      if (!['FOUNDER', 'SCHEDULER', 'OPERATIONS_MANAGER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view optimization suggestions'
          }
        });
      }

      const organizationId = req.user!.organizationId;

      // Default to next 7 days
      let startDate: Date;
      let endDate: Date;

      try {
        startDate = req.query.startDate
          ? parseISO(req.query.startDate as string)
          : new Date();
        endDate = req.query.endDate
          ? parseISO(req.query.endDate as string)
          : addDays(new Date(), 7);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)'
          }
        });
      }

      const data = await scheduleOptimizerService.getOptimizationSuggestions(
        organizationId,
        startDate,
        endDate
      );

      return res.status(200).json({
        success: true,
        data,
        meta: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getOptimizationSuggestions:', error);
      next(error);
    }
  }
}

export const mlController = new MLController();
