/**
 * Client Portal Controller
 * Handles HTTP requests for Client & Family Portal endpoints
 *
 * Routes:
 * - GET /api/client-portal/overview
 * - GET /api/client-portal/care-plan
 * - GET /api/client-portal/visits
 * - GET /api/client-portal/invoices
 */

import { Request, Response, NextFunction } from 'express';
import { clientService } from '../services/client.service';
import { AuthRequest } from '../middleware/auth';
import { parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export class ClientController {
  /**
   * GET /api/client-portal/overview
   * Get overview for client portal with upcoming visits, recent activity, care team
   *
   * Required Permissions: CLIENT_FAMILY_PORTAL dashboard
   * Allowed Roles: CLIENT, FAMILY_MEMBER
   * Isolation: Clients can only view their own data
   */
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Client Portal)
      if (!['CLIENT', 'FAMILY_MEMBER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access client portal'
          }
        });
      }

      // User Isolation: Clients can only view their own data
      const clientId = req.user!.clientId || req.user!.id;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Client ID not found for user'
          }
        });
      }

      const data = await clientService.getOverview(clientId);

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
   * GET /api/client-portal/care-plan
   * Get detailed care plan with goals, interventions, and progress
   *
   * Required Permissions: CLIENT_FAMILY_PORTAL dashboard
   * Allowed Roles: CLIENT, FAMILY_MEMBER
   * Isolation: Clients can only view their own care plan
   */
  async getCarePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Client Portal)
      if (!['CLIENT', 'FAMILY_MEMBER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access client portal'
          }
        });
      }

      // User Isolation: Clients can only view their own data
      const clientId = req.user!.clientId || req.user!.id;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Client ID not found for user'
          }
        });
      }

      const data = await clientService.getCarePlan(clientId);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No active care plan found'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data,
        meta: {
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getCarePlan:', error);
      next(error);
    }
  }

  /**
   * GET /api/client-portal/visits
   * Get visit history with filters
   *
   * Query Parameters:
   * - startDate: ISO 8601 date string (optional, defaults to 30 days ago)
   * - endDate: ISO 8601 date string (optional, defaults to today)
   * - status: string (optional) - 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
   *
   * Required Permissions: CLIENT_FAMILY_PORTAL dashboard
   * Allowed Roles: CLIENT, FAMILY_MEMBER
   * Isolation: Clients can only view their own visits
   */
  async getVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Client Portal)
      if (!['CLIENT', 'FAMILY_MEMBER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access client portal'
          }
        });
      }

      // User Isolation: Clients can only view their own data
      const clientId = req.user!.clientId || req.user!.id;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Client ID not found for user'
          }
        });
      }

      // Parse date range (defaults to last 30 days)
      let startDate: Date;
      let endDate: Date;

      try {
        startDate = req.query.startDate
          ? parseISO(req.query.startDate as string)
          : subMonths(new Date(), 1);
        endDate = req.query.endDate
          ? parseISO(req.query.endDate as string)
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

      // Validate date range
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
      if (daysDiff > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date range cannot exceed 365 days'
          }
        });
      }

      // Optional status filter
      const status = req.query.status as string | undefined;
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

      const data = await clientService.getVisits(clientId, startDate, endDate, status);

      return res.status(200).json({
        success: true,
        data: {
          visits: data
        },
        meta: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          status: status || 'all',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getVisits:', error);
      next(error);
    }
  }

  /**
   * GET /api/client-portal/invoices
   * Get billing invoices for client
   *
   * Query Parameters:
   * - startDate: ISO 8601 date string (optional)
   * - endDate: ISO 8601 date string (optional)
   * - status: string (optional) - 'pending' | 'paid' | 'overdue' | 'cancelled'
   *
   * Required Permissions: CLIENT_FAMILY_PORTAL dashboard
   * Allowed Roles: CLIENT, FAMILY_MEMBER
   * Isolation: Clients can only view their own invoices
   */
  async getInvoices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level (Client Portal)
      if (!['CLIENT', 'FAMILY_MEMBER'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access client portal'
          }
        });
      }

      // User Isolation: Clients can only view their own data
      const clientId = req.user!.clientId || req.user!.id;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Client ID not found for user'
          }
        });
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

      // Optional status filter
      const status = req.query.status as string | undefined;
      if (status) {
        const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
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

      const data = await clientService.getInvoices(clientId, startDate, endDate, status);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          filters: {
            startDate: startDate?.toISOString().split('T')[0] || null,
            endDate: endDate?.toISOString().split('T')[0] || null,
            status: status || 'all'
          },
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getInvoices:', error);
      next(error);
    }
  }
}

export const clientController = new ClientController();
