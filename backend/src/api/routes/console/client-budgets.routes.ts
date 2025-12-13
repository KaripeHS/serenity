/**
 * Client Budget & Funds Management Routes
 * API endpoints for real-time client budget tracking and alerts
 *
 * Best-in-Class Feature: Real-time visibility into client private-pay
 * or waiver fund balances with automated low-balance alerts
 *
 * @module api/routes/console/client-budgets
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import ClientBudgetService from '../../../services/client-budget.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('client-budget-routes');

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * GET /api/console/client-budgets/dashboard
 * Get budget dashboard summary for the organization
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const dashboard = await ClientBudgetService.getDashboard(organizationId);

    res.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/client-budgets/client-summaries
 * Get budget summaries grouped by client
 */
router.get('/client-summaries', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const summaries = await ClientBudgetService.getClientSummaries(organizationId);

    res.json({
      summaries,
      count: summaries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// BUDGETS
// ============================================================================

/**
 * GET /api/console/client-budgets
 * Get all client budgets for the organization
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { clientId, status, budgetType, lowBalanceOnly, limit, offset } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { budgets, count } = await ClientBudgetService.getBudgets(organizationId, {
      clientId: clientId as string,
      status: status as string,
      budgetType: budgetType as string,
      lowBalanceOnly: lowBalanceOnly === 'true',
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json({
      budgets,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/client-budgets/client/:clientId
 * Get all budgets for a specific client
 */
router.get('/client/:clientId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { clientId } = req.params;

    const budgets = await ClientBudgetService.getClientBudgets(clientId);

    res.json({
      budgets,
      count: budgets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/client-budgets/:budgetId
 * Get a specific budget by ID
 */
router.get('/:budgetId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;

    const budget = await ClientBudgetService.getBudgetById(budgetId);

    if (!budget) {
      throw ApiErrors.notFound('Budget not found');
    }

    // Get recent transactions
    const transactions = await ClientBudgetService.getTransactions(budgetId, { limit: 10 });

    // Get forecast
    const forecast = await ClientBudgetService.getForecast(budgetId);

    res.json({
      budget,
      transactions,
      forecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/client-budgets
 * Create a new client budget
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      clientId,
      authorizationId,
      budgetType,
      fundingSource,
      totalBudget,
      effectiveDate,
      expirationDate,
      renewalDate,
      hourlyRate,
      totalAuthorizedHours,
      alertThresholdPercent,
      alertThresholdAmount,
      notes
    } = req.body;

    if (!clientId || !budgetType || !totalBudget || !effectiveDate) {
      throw ApiErrors.badRequest('Missing required fields: clientId, budgetType, totalBudget, effectiveDate');
    }

    const budget = await ClientBudgetService.createBudget({
      clientId,
      organizationId,
      authorizationId,
      budgetType,
      fundingSource,
      totalBudget: parseFloat(totalBudget),
      effectiveDate: new Date(effectiveDate),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      renewalDate: renewalDate ? new Date(renewalDate) : undefined,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      totalAuthorizedHours: totalAuthorizedHours ? parseFloat(totalAuthorizedHours) : undefined,
      alertThresholdPercent: alertThresholdPercent ? parseFloat(alertThresholdPercent) : undefined,
      alertThresholdAmount: alertThresholdAmount ? parseFloat(alertThresholdAmount) : undefined,
      notes
    });

    logger.info(`Client budget created: ${budget.id} for client ${clientId}`);

    res.status(201).json({
      budget,
      message: 'Budget created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/client-budgets/:budgetId
 * Update a client budget
 */
router.put('/:budgetId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;
    const updates = req.body;

    const budget = await ClientBudgetService.updateBudget(budgetId, updates);

    logger.info(`Client budget updated: ${budgetId}`);

    res.json({
      budget,
      message: 'Budget updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * GET /api/console/client-budgets/:budgetId/transactions
 * Get transactions for a budget
 */
router.get('/:budgetId/transactions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;
    const { startDate, endDate, limit, offset } = req.query;

    const transactions = await ClientBudgetService.getTransactions(budgetId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json({
      transactions,
      count: transactions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/client-budgets/:budgetId/transactions
 * Record a manual transaction against a budget
 */
router.post('/:budgetId/transactions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;
    const userId = req.user?.userId;

    const { transactionType, amount, hoursUsed, description, visitId, claimId } = req.body;

    if (!transactionType || amount === undefined || !description) {
      throw ApiErrors.badRequest('Missing required fields: transactionType, amount, description');
    }

    const transaction = await ClientBudgetService.recordTransaction({
      budgetId,
      transactionType,
      amount: parseFloat(amount),
      hoursUsed: hoursUsed ? parseFloat(hoursUsed) : undefined,
      description,
      visitId,
      claimId,
      createdBy: userId
    });

    logger.info(`Budget transaction recorded: ${transaction.id} for budget ${budgetId}`);

    res.status(201).json({
      transaction,
      message: 'Transaction recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/client-budgets/:budgetId/add-funds
 * Add funds to a budget (payment/deposit)
 */
router.post('/:budgetId/add-funds', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;
    const userId = req.user?.userId;
    const { amount, description } = req.body;

    if (!amount || !description) {
      throw ApiErrors.badRequest('Missing required fields: amount, description');
    }

    const transaction = await ClientBudgetService.addFunds(
      budgetId,
      parseFloat(amount),
      description,
      userId
    );

    logger.info(`Funds added to budget: ${budgetId}, amount: ${amount}`);

    res.status(201).json({
      transaction,
      message: 'Funds added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ALERTS
// ============================================================================

/**
 * GET /api/console/client-budgets/alerts
 * Get all budget alerts for the organization
 */
router.get('/alerts/all', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { alertType, unacknowledgedOnly } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const alerts = await ClientBudgetService.getAlerts(organizationId, {
      alertType: alertType as string,
      unacknowledgedOnly: unacknowledgedOnly === 'true'
    });

    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/client-budgets/:budgetId/alerts
 * Get alerts for a specific budget
 */
router.get('/:budgetId/alerts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const alerts = await ClientBudgetService.getAlerts(organizationId, {
      budgetId
    });

    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/client-budgets/alerts/:alertId/acknowledge
 * Acknowledge a budget alert
 */
router.put('/alerts/:alertId/acknowledge', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiErrors.badRequest('User context required');
    }

    await ClientBudgetService.acknowledgeAlert(alertId, userId);

    logger.info(`Budget alert acknowledged: ${alertId} by user ${userId}`);

    res.json({
      message: 'Alert acknowledged',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/client-budgets/check-alerts
 * Run alert check for the organization (scheduled job or manual trigger)
 */
router.post('/check-alerts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const alertsCreated = await ClientBudgetService.checkAlerts(organizationId);

    logger.info(`Budget alerts checked: ${alertsCreated} new alerts created`);

    res.json({
      alertsCreated,
      message: `Alert check complete - ${alertsCreated} new alerts created`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FORECASTS
// ============================================================================

/**
 * GET /api/console/client-budgets/:budgetId/forecast
 * Get the latest forecast for a budget
 */
router.get('/:budgetId/forecast', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;

    const forecast = await ClientBudgetService.getForecast(budgetId);

    res.json({
      forecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/client-budgets/:budgetId/forecast
 * Generate a new forecast for a budget
 */
router.post('/:budgetId/forecast', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { budgetId } = req.params;

    const forecast = await ClientBudgetService.generateForecast(budgetId);

    logger.info(`Budget forecast generated: ${forecast.id} for budget ${budgetId}`);

    res.status(201).json({
      forecast,
      message: 'Forecast generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
