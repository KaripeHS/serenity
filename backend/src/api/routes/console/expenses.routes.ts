/**
 * Expense & Mileage Tracking Routes
 * API endpoints for caregiver expense reimbursement and mileage tracking
 *
 * Best-in-Class Feature: Caregivers log mileage and expenses
 * via mobile app with receipt uploads and auto-reimbursement
 *
 * @module api/routes/console/expenses
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { expenseService as ExpenseService } from '../../../services/expense.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('expense-routes');

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * GET /api/console/expenses/dashboard
 * Get expense dashboard summary for the organization
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const dashboard = await ExpenseService.getDashboard(organizationId);

    res.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EXPENSE CATEGORIES
// ============================================================================

/**
 * GET /api/console/expenses/categories
 * Get all expense categories for the organization
 */
router.get('/categories', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const categories = await ExpenseService.getCategories(organizationId);

    res.json({
      categories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/expenses/mileage-rate
 * Get current mileage reimbursement rate
 */
router.get('/mileage-rate', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const rate = await ExpenseService.getMileageRate(organizationId);

    res.json({
      rate,
      ratePerMile: rate,
      description: 'IRS standard mileage rate for business travel',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EXPENSE CLAIMS
// ============================================================================

/**
 * GET /api/console/expenses/claims
 * Get all expense claims (for coordinators/admins)
 */
router.get('/claims', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { status, startDate, endDate, caregiverId, categoryId, limit, offset } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { claims, count } = await ExpenseService.getExpenseClaims(organizationId, {
      status: status as string,
      dateFrom: startDate as string,
      dateTo: endDate as string,
      caregiverId: caregiverId as string,
      categoryId: categoryId as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json({
      claims,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/expenses/claims/pending
 * Get all claims pending approval
 */
router.get('/claims/pending', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const claims = await ExpenseService.getPendingApprovals(organizationId);

    res.json({
      claims,
      count: claims.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/expenses/claims/caregiver/:caregiverId
 * Get expense claims for a specific caregiver
 */
router.get('/claims/caregiver/:caregiverId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const { status, startDate, endDate } = req.query;

    const claims = await ExpenseService.getCaregiverClaims(caregiverId, {
      status: status as string,
      dateFrom: startDate as string,
      dateTo: endDate as string
    });

    res.json({
      claims,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/expenses/claims/my
 * Get current user's expense claims
 */
router.get('/claims/my', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.user?.userId;
    const { status } = req.query;

    if (!caregiverId) {
      throw ApiErrors.badRequest('User context required');
    }

    const claims = await ExpenseService.getCaregiverClaims(caregiverId, {
      status: status as string
    });

    res.json({
      claims,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/expenses/claims
 * Submit a new expense claim
 */
router.post('/claims', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const caregiverId = req.body.caregiverId || req.user?.userId;

    if (!organizationId || !caregiverId) {
      throw ApiErrors.badRequest('Organization and caregiver context required');
    }

    const {
      categoryId,
      description,
      amount,
      expenseDate,
      visitId,
      clientId,
      isMileage,
      startLocation,
      endLocation,
      miles,
      mileageRate,
      receiptUrl,
      receiptFilename
    } = req.body;

    if (!categoryId || !description || !amount || !expenseDate) {
      throw ApiErrors.badRequest('Missing required fields: categoryId, description, amount, expenseDate');
    }

    const claim = await ExpenseService.createExpenseClaim({
      organizationId,
      caregiverId,
      categoryId,
      description,
      amount: parseFloat(amount),
      expenseDate, // Pass as string, service handles conversion
      visitId,
      clientId,
      isMileage: isMileage || false,
      startLocation,
      endLocation,
      miles: miles ? parseFloat(miles) : undefined,
      mileageRate: mileageRate ? parseFloat(mileageRate) : undefined,
      receiptUrl,
      receiptFilename
    });

    logger.info(`Expense claim created: ${claim.id} by caregiver ${caregiverId}`);

    res.status(201).json({
      claim,
      message: 'Expense claim submitted',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/expenses/claims/:claimId/approve
 * Approve an expense claim
 */
router.put('/claims/:claimId/approve', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { claimId } = req.params;
    const organizationId = req.user?.organizationId;
    const reviewerId = req.user?.userId;
    const { notes } = req.body;

    if (!organizationId || !reviewerId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const claim = await ExpenseService.approveClaim(claimId, organizationId, reviewerId, notes);

    logger.info(`Expense claim ${claimId} approved by ${reviewerId}`);

    res.json({
      claim,
      message: 'Expense claim approved',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/expenses/claims/:claimId/reject
 * Reject an expense claim
 */
router.put('/claims/:claimId/reject', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { claimId } = req.params;
    const organizationId = req.user?.organizationId;
    const reviewerId = req.user?.userId;
    const { reason } = req.body;

    if (!organizationId || !reviewerId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    if (!reason) {
      throw ApiErrors.badRequest('Rejection reason is required');
    }

    const claim = await ExpenseService.rejectClaim(claimId, organizationId, reviewerId, reason);

    logger.info(`Expense claim ${claimId} rejected by ${reviewerId}: ${reason}`);

    res.json({
      claim,
      message: 'Expense claim rejected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/expenses/claims/mark-paid
 * Mark multiple claims as paid (batch operation)
 */
router.put('/claims/mark-paid', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { claimIds, payrollRunId, paymentReference } = req.body;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      throw ApiErrors.badRequest('Claim IDs array is required');
    }

    const count = await ExpenseService.markClaimsAsPaid(claimIds, payrollRunId, paymentReference);

    logger.info(`${count} expense claims marked as paid`);

    res.json({
      message: `${count} claims marked as paid`,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MILEAGE LOGS
// ============================================================================

/**
 * GET /api/console/expenses/mileage
 * Get mileage logs for a caregiver
 */
router.get('/mileage', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.query.caregiverId as string || req.user?.userId;
    const { startDate, endDate, unclaimedOnly } = req.query;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    const logs = await ExpenseService.getMileageLogs(caregiverId, {
      dateFrom: startDate as string,
      dateTo: endDate as string,
      unsubmitted: unclaimedOnly === 'true'
    });

    res.json({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/expenses/mileage
 * Log a mileage entry
 */
router.post('/mileage', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.body.caregiverId || req.user?.userId;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    const {
      logDate,
      startTime,
      endTime,
      startAddress,
      startLat,
      startLng,
      endAddress,
      endLat,
      endLng,
      purpose,
      visitId,
      clientId,
      odometerStart,
      odometerEnd,
      calculatedMiles,
      reportedMiles,
      gpsTracked,
      gpsRoute,
      notes
    } = req.body;

    if (!logDate || !startAddress || !endAddress) {
      throw ApiErrors.badRequest('Missing required fields: logDate, startAddress, endAddress');
    }

    const log = await ExpenseService.logMileage({
      caregiverId,
      logDate, // Pass as string, service handles conversion
      startTime,
      endTime,
      startAddress,
      startLat: startLat ? parseFloat(startLat) : undefined,
      startLng: startLng ? parseFloat(startLng) : undefined,
      endAddress,
      endLat: endLat ? parseFloat(endLat) : undefined,
      endLng: endLng ? parseFloat(endLng) : undefined,
      purpose: purpose || 'client_visit',
      visitId,
      clientId,
      odometerStart: odometerStart ? parseInt(odometerStart) : undefined,
      odometerEnd: odometerEnd ? parseInt(odometerEnd) : undefined,
      reportedMiles: reportedMiles ? parseFloat(reportedMiles) : undefined,
      gpsTracked: gpsTracked || false,
      gpsRoute,
      notes
    });

    logger.info(`Mileage logged: ${log.id} by caregiver ${caregiverId}`);

    res.status(201).json({
      log,
      message: 'Mileage entry logged',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/expenses/mileage/calculate
 * Calculate mileage reimbursement for a date range
 */
router.get('/mileage/calculate', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.query.caregiverId as string || req.user?.userId;
    const { startDate, endDate } = req.query;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('Start and end dates are required');
    }

    const calculation = await ExpenseService.calculateMileageReimbursement(
      caregiverId,
      startDate as string,
      endDate as string
    );

    res.json({
      calculation,
      period: { startDate, endDate },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/expenses/mileage/create-claim
 * Create an expense claim from accumulated mileage logs
 */
router.post('/mileage/create-claim', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.body.caregiverId || req.user?.userId;
    const { startDate, endDate } = req.body;

    if (!caregiverId) {
      throw ApiErrors.badRequest('Caregiver context required');
    }

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('Start and end dates are required');
    }

    const claim = await ExpenseService.createMileageClaim(caregiverId, startDate, endDate);

    if (!claim) {
      throw ApiErrors.badRequest('No unclaimed mileage found for the specified period');
    }

    logger.info(`Mileage claim created: ${claim.id} for caregiver ${caregiverId}`);

    res.status(201).json({
      claim,
      message: 'Mileage claim created from accumulated logs',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CAREGIVER SUMMARY
// ============================================================================

/**
 * GET /api/console/expenses/summary/:caregiverId
 * Get expense summary for a caregiver by month
 */
router.get('/summary/:caregiverId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const { month } = req.query;

    const summary = await ExpenseService.getCaregiverSummary(caregiverId, month as string);

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/expenses/summary/my
 * Get current user's expense summary
 */
router.get('/summary/my', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const caregiverId = req.user?.userId;

    if (!caregiverId) {
      throw ApiErrors.badRequest('User context required');
    }

    const summary = await ExpenseService.getCaregiverSummary(caregiverId);

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
