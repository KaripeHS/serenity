/**
 * Caregiver Portal Controller
 * Handles HTTP requests for Caregiver Portal endpoints
 *
 * Routes:
 * - GET /api/caregiver-portal/visits/today
 * - GET /api/caregiver-portal/expenses
 * - POST /api/caregiver-portal/expenses
 */

import { Request, Response, NextFunction } from 'express';
import { caregiverService } from '../services/caregiver.service';
import { AuthRequest } from '../middleware/auth';
import { parseISO } from 'date-fns';

export class CaregiverController {
  /**
   * GET /api/caregiver-portal/visits/today
   * Get today's visit schedule for caregiver with emergency contacts and tasks
   *
   * Query Parameters:
   * - date: ISO 8601 date string (optional, defaults to today)
   *
   * Required Permissions: CAREGIVER_PORTAL dashboard
   * Allowed Roles: CAREGIVER, DSP_BASIC, DSP_MED
   * Isolation: Caregivers can only view their own schedule
   */
  async getTodayVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Caregiver Portal)
      if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access caregiver portal'
          }
        });
      }

      // User Isolation: Caregivers can only view their own data
      const caregiverId = req.user!.id;

      // Parse date query parameter (defaults to today)
      let date: Date;
      try {
        date = req.query.date
          ? parseISO(req.query.date as string)
          : new Date();
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)'
          }
        });
      }

      const data = await caregiverService.getTodayVisits(caregiverId, date);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          date: date.toISOString().split('T')[0],
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTodayVisits:', error);
      next(error);
    }
  }

  /**
   * GET /api/caregiver-portal/expenses
   * Get expense history for caregiver with summary by status
   *
   * Query Parameters:
   * - status: string (optional) - 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected'
   *
   * Required Permissions: CAREGIVER_PORTAL dashboard
   * Allowed Roles: CAREGIVER, DSP_BASIC, DSP_MED
   * Isolation: Caregivers can only view their own expenses
   */
  async getExpenses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Caregiver Portal)
      if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access caregiver portal'
          }
        });
      }

      // User Isolation: Caregivers can only view their own data
      const caregiverId = req.user!.id;

      // Optional status filter
      const status = req.query.status as string | undefined;

      // Validate status if provided
      if (status) {
        const validStatuses = ['draft', 'submitted', 'approved', 'paid', 'rejected'];
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

      const data = await caregiverService.getExpenses(caregiverId, status);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          status: status || 'all',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getExpenses:', error);
      next(error);
    }
  }

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
   *   receiptBase64?: string // Optional receipt image
   * }
   *
   * Required Permissions: CAREGIVER_PORTAL dashboard
   * Allowed Roles: CAREGIVER, DSP_BASIC, DSP_MED
   * Isolation: Caregivers can only submit their own expenses
   */
  async submitExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Caregiver Portal)
      if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access caregiver portal'
          }
        });
      }

      // User Isolation: Caregivers can only submit their own expenses
      const caregiverId = req.user!.id;
      const organizationId = req.user!.organizationId;

      // Validate required fields
      const { expenseType, amount, expenseDate, description } = req.body;

      if (!expenseType || !amount || !expenseDate || !description) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: expenseType, amount, expenseDate, description'
          }
        });
      }

      // Validate expense type
      const validExpenseTypes = ['mileage', 'supplies', 'training', 'other'];
      if (!validExpenseTypes.includes(expenseType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid expenseType. Must be one of: ${validExpenseTypes.join(', ')}`
          }
        });
      }

      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Amount must be a positive number'
          }
        });
      }

      // Validate and parse date
      let parsedDate: Date;
      try {
        parsedDate = parseISO(expenseDate);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid expenseDate format. Use ISO 8601 (YYYY-MM-DD)'
          }
        });
      }

      // Validate description length
      if (typeof description !== 'string' || description.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Description must be at least 5 characters'
          }
        });
      }

      if (description.length > 500) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Description cannot exceed 500 characters'
          }
        });
      }

      // Optional receipt validation
      const receiptBase64 = req.body.receiptBase64;
      if (receiptBase64 && typeof receiptBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'receiptBase64 must be a base64 encoded string'
          }
        });
      }

      // Submit expense
      const result = await caregiverService.submitExpense(organizationId, caregiverId, {
        expenseType,
        amount,
        expenseDate: parsedDate,
        description: description.trim(),
        receiptBase64
      });

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: 'Expense submitted successfully and is pending approval',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in submitExpense:', error);
      next(error);
    }
  }

  /**
   * GET /api/caregiver-portal/training-status
   * Get training status for caregiver (placeholder for Phase 2)
   *
   * Required Permissions: CAREGIVER_PORTAL dashboard
   * Allowed Roles: CAREGIVER, DSP_BASIC, DSP_MED
   * Isolation: Caregivers can only view their own training status
   */
  async getTrainingStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Caregiver Portal)
      if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access caregiver portal'
          }
        });
      }

      // User Isolation: Caregivers can only view their own data
      const caregiverId = req.user!.id;

      const data = await caregiverService.getTrainingStatus(caregiverId);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTrainingStatus:', error);
      next(error);
    }
  }

  /**
   * GET /api/caregiver-portal/performance
   * Get performance metrics for caregiver (30-day SPI scores, on-time %, etc.)
   *
   * Required Permissions: CAREGIVER_PORTAL dashboard
   * Allowed Roles: CAREGIVER, DSP_BASIC, DSP_MED
   * Isolation: Caregivers can only view their own performance metrics
   */
  async getPerformanceMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Caregiver Portal)
      if (!['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access caregiver portal'
          }
        });
      }

      // User Isolation: Caregivers can only view their own data
      const caregiverId = req.user!.id;

      const data = await caregiverService.getPerformanceMetrics(caregiverId);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getPerformanceMetrics:', error);
      next(error);
    }
  }
}

export const caregiverController = new CaregiverController();
