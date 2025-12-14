/**
 * Operations Controller
 * Handles HTTP requests for Operations Command Center endpoints
 *
 * Routes:
 * - GET /api/operations/overview
 * - GET /api/operations/schedule
 * - GET /api/operations/gps
 * - GET /api/operations/mileage
 */

import { Request, Response, NextFunction } from 'express';
import { operationsService } from '../services/operations.service';
import { AuthRequest } from '../middleware/auth';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

export class OperationsController {
  /**
   * GET /api/operations/overview
   * Get operations overview with today's visit statistics and schedule issues
   *
   * Required Permissions: OPERATIONS_COMMAND_CENTER dashboard
   * Allowed Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR, CLINICAL_DIRECTOR
   */
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'CLINICAL_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access operations data'
          }
        });
      }

      const organizationId = req.user!.organizationId;

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

      const data = await operationsService.getOverview(organizationId, date);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          date: date.toISOString().split('T')[0],
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getOverview:', error);
      next(error);
    }
  }

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
   * Required Permissions: OPERATIONS_COMMAND_CENTER dashboard, VIEW_SCHEDULE feature
   * Allowed Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR, CLINICAL_DIRECTOR
   */
  async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'CLINICAL_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access schedule data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_SCHEDULE')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view schedules'
          }
        });
      }

      const organizationId = req.user!.organizationId;

      // Parse and validate date range
      if (!req.query.startDate || !req.query.endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate query parameters are required'
          }
        });
      }

      let startDate: Date, endDate: Date;
      try {
        startDate = parseISO(req.query.startDate as string);
        endDate = parseISO(req.query.endDate as string);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)'
          }
        });
      }

      // Validate date range is reasonable (max 90 days)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'endDate must be after startDate'
          }
        });
      }
      if (daysDiff > 90) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date range cannot exceed 90 days'
          }
        });
      }

      // Optional filters
      const caregiverId = req.query.caregiverId as string | undefined;
      const clientId = req.query.clientId as string | undefined;
      const status = req.query.status as string | undefined;

      // Validate status if provided
      if (status) {
        const validStatuses = ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled'];
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

      const data = await operationsService.getSchedule(
        organizationId,
        startDate,
        endDate,
        caregiverId,
        clientId,
        status
      );

      return res.status(200).json({
        success: true,
        data,
        meta: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          filters: {
            caregiverId: caregiverId || null,
            clientId: clientId || null,
            status: status || 'all'
          },
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getSchedule:', error);
      next(error);
    }
  }

  /**
   * GET /api/operations/gps
   * Get real-time GPS tracking for caregivers on duty
   *
   * Query Parameters:
   * - caregiverId: UUID (optional) - Filter by specific caregiver
   * - activeOnly: boolean (optional, default: true) - Only show active visits
   *
   * Required Permissions: OPERATIONS_COMMAND_CENTER dashboard, VIEW_GPS_TRACKING feature
   * Allowed Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR
   */
  async getGPSTracking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access GPS tracking data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_GPS_TRACKING')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view GPS tracking'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const caregiverId = req.query.caregiverId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default to true

      const data = await operationsService.getGPSTracking(organizationId, caregiverId, activeOnly);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          caregiverId: caregiverId || 'all',
          activeOnly,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getGPSTracking:', error);
      next(error);
    }
  }

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
   * Required Permissions: OPERATIONS_COMMAND_CENTER dashboard, VIEW_MILEAGE or APPROVE_MILEAGE feature
   * Allowed Roles: FOUNDER, SCHEDULER, FIELD_SUPERVISOR, FINANCE_DIRECTOR
   */
  async getMileageReimbursements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access mileage reimbursement data'
          }
        });
      }

      // RBAC Check - Feature level
      const canView = req.user!.permissions?.includes('VIEW_MILEAGE');
      const canApprove = req.user!.permissions?.includes('APPROVE_MILEAGE');

      if (!canView && !canApprove) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view mileage reimbursements'
          }
        });
      }

      const organizationId = req.user!.organizationId;
      const status = req.query.status as string | undefined;
      const caregiverId = req.query.caregiverId as string | undefined;

      // Validate status if provided
      if (status) {
        const validStatuses = ['pending', 'approved', 'paid', 'rejected'];
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

      // Parse optional date range
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (req.query.startDate) {
        try {
          startDate = parseISO(req.query.startDate as string);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid startDate format. Use ISO 8601 (YYYY-MM-DD)'
            }
          });
        }
      }

      if (req.query.endDate) {
        try {
          endDate = parseISO(req.query.endDate as string);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid endDate format. Use ISO 8601 (YYYY-MM-DD)'
            }
          });
        }
      }

      const data = await operationsService.getMileageReimbursements(
        organizationId,
        status,
        caregiverId,
        startDate,
        endDate
      );

      return res.status(200).json({
        success: true,
        data,
        meta: {
          filters: {
            status: status || 'all',
            caregiverId: caregiverId || 'all',
            startDate: startDate?.toISOString().split('T')[0] || null,
            endDate: endDate?.toISOString().split('T')[0] || null
          },
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getMileageReimbursements:', error);
      next(error);
    }
  }
}

export const operationsController = new OperationsController();
