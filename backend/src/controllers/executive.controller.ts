/**
 * Executive Controller
 * Handles HTTP requests for Executive Command Center endpoints
 *
 * Routes:
 * - GET /api/executive/overview
 * - GET /api/executive/revenue
 * - GET /api/executive/risks
 */

import { Request, Response, NextFunction } from 'express';
import { executiveService } from '../services/executive.service';
import { AuthRequest } from '../middleware/auth';

export class ExecutiveController {
  /**
   * GET /api/executive/overview
   * Get executive overview data including business health scorecard
   *
   * Required Permissions: EXECUTIVE_COMMAND_CENTER dashboard
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR
   */
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Must be Founder or Finance Director
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access executive data'
          }
        });
      }

      // Get organization ID from authenticated user
      const organizationId = req.user!.organizationId;

      // Validate query parameters
      const dateRange = (req.query.dateRange as string) || 'month';
      const validDateRanges = ['today', 'week', 'month', 'quarter', 'year'];

      if (!validDateRanges.includes(dateRange)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid dateRange. Must be one of: ${validDateRanges.join(', ')}`
          }
        });
      }

      // Fetch data from service
      const data = await executiveService.getOverview(
        organizationId,
        dateRange as any
      );

      // Return success response
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
   * GET /api/executive/revenue
   * Get revenue analytics by service line and payer
   *
   * Required Permissions: EXECUTIVE_COMMAND_CENTER dashboard, VIEW_REVENUE_ANALYTICS feature
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR
   */
  async getRevenueAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access executive data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_REVENUE_ANALYTICS')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view revenue analytics'
          }
        });
      }

      const organizationId = req.user!.organizationId;

      // Validate query parameters
      const { startDate, endDate, groupBy } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate are required'
          }
        });
      }

      // Validate dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)'
          }
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate must be before endDate'
          }
        });
      }

      const validGroupBy = ['day', 'week', 'month'];
      const groupByValue = (groupBy as string) || 'month';

      if (!validGroupBy.includes(groupByValue)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`
          }
        });
      }

      // Fetch data from service (to be implemented)
      const data = {
        revenueByServiceLine: [],
        revenueByPayer: [],
        profitabilityAnalysis: {},
        revenueTimeline: []
      };

      return res.status(200).json({
        success: true,
        data,
        meta: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          groupBy: groupByValue,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getRevenueAnalytics:', error);
      next(error);
    }
  }

  /**
   * GET /api/executive/risks
   * Get strategic risk dashboard
   *
   * Required Permissions: EXECUTIVE_COMMAND_CENTER dashboard, VIEW_RISK_DASHBOARD feature
   * Allowed Roles: FOUNDER, FINANCE_DIRECTOR
   */
  async getRisks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // RBAC Check - Dashboard level
      if (!['FOUNDER', 'FINANCE_DIRECTOR'].includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access executive data'
          }
        });
      }

      // RBAC Check - Feature level
      if (!req.user!.permissions?.includes('VIEW_RISK_DASHBOARD')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view risk dashboard'
          }
        });
      }

      const organizationId = req.user!.organizationId;

      // Fetch strategic risks from database
      const query = `
        WITH risk_actions AS (
          SELECT
            risk_id,
            json_agg(
              json_build_object(
                'description', description,
                'status', status,
                'completedAt', completed_at
              )
              ORDER BY created_at
            ) as actions
          FROM strategic_risk_actions
          GROUP BY risk_id
        )
        SELECT
          sr.id,
          sr.category,
          sr.title,
          sr.description,
          sr.severity,
          sr.likelihood,
          sr.impact,
          sr.mitigation_status,
          u.name as owner,
          sr.due_date,
          COALESCE(ra.actions, '[]'::json) as actions
        FROM strategic_risks sr
        LEFT JOIN users u ON sr.owner_id = u.id
        LEFT JOIN risk_actions ra ON sr.id = ra.risk_id
        WHERE sr.organization_id = $1
        ORDER BY
          CASE severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          sr.due_date ASC NULLS LAST
      `;

      const risksResult = await req.db.query(query, [organizationId]);

      const strategicRisks = risksResult.rows.map(row => ({
        id: row.id,
        category: row.category,
        title: row.title,
        description: row.description,
        severity: row.severity,
        likelihood: row.likelihood,
        impact: row.impact,
        mitigationStatus: row.mitigation_status,
        owner: row.owner,
        dueDate: row.due_date,
        actions: row.actions
      }));

      // Calculate risk trend
      const trendQuery = `
        SELECT
          COUNT(*) FILTER (WHERE severity = 'critical') as critical,
          COUNT(*) FILTER (WHERE severity = 'high') as high,
          COUNT(*) FILTER (WHERE severity = 'medium') as medium,
          COUNT(*) FILTER (WHERE severity = 'low') as low
        FROM strategic_risks
        WHERE organization_id = $1
          AND mitigation_status != 'mitigated'
      `;

      const trendResult = await req.db.query(trendQuery, [organizationId]);
      const { critical, high, medium, low } = trendResult.rows[0];

      const riskTrend = {
        critical: parseInt(critical),
        high: parseInt(high),
        medium: parseInt(medium),
        low: parseInt(low),
        trend: 'stable' as const // Would calculate from historical data
      };

      // Get compliance risks
      const complianceRisks = []; // Would fetch from compliance_items table

      return res.status(200).json({
        success: true,
        data: {
          strategicRisks,
          riskTrend,
          complianceRisks
        },
        meta: {
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getRisks:', error);
      next(error);
    }
  }
}

export const executiveController = new ExecutiveController();
