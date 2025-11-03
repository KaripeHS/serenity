/**
 * Payroll API Routes
 * Abstracted payroll integration (Gusto, ADP, etc.)
 *
 * @module api/routes/console/payroll
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { getPayrollProvider } from '../../../services/payroll/payroll.interface';
import type { PayrollHours, PayrollEmployee } from '../../../services/payroll/payroll.interface';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/payroll/provider
 * Get current payroll provider info
 */
router.get('/provider', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payrollService = getPayrollProvider();

    res.json({
      success: true,
      provider: {
        name: payrollService.getProviderName(),
        configured: payrollService.isConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/payroll/sync-employees
 * Sync employees from Serenity to payroll system
 *
 * Body: { employees: PayrollEmployee[] }
 */
router.post('/sync-employees', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employees } = req.body;

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        error: 'employees array is required',
      });
    }

    const payrollService = getPayrollProvider();
    const result = await payrollService.syncEmployees(employees);

    res.json({
      success: result.success,
      result,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/payroll/submit-hours
 * Submit hours for a pay period
 *
 * Body: { hours: PayrollHours[] }
 */
router.post('/submit-hours', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { hours } = req.body;

    if (!hours || !Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        error: 'hours array is required',
      });
    }

    const payrollService = getPayrollProvider();
    const result = await payrollService.submitHours(hours);

    res.json({
      success: result.success,
      result,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/payroll/current-period
 * Get current pay period dates
 */
router.get('/current-period', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payrollService = getPayrollProvider();
    const period = await payrollService.getCurrentPayPeriod();

    res.json({
      success: true,
      period,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/payroll/runs
 * Get payroll run history
 *
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/runs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 90 days
    let start = new Date();
    start.setDate(start.getDate() - 90);
    let end = new Date();

    if (startDate) {
      start = new Date(startDate as string);
    }

    if (endDate) {
      end = new Date(endDate as string);
    }

    const payrollService = getPayrollProvider();
    const runs = await payrollService.getPayrollRuns(start, end);

    res.json({
      success: true,
      runs,
      count: runs.length,
      provider: payrollService.getProviderName(),
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/payroll/employee/:employeeId
 * Get employee from payroll system
 */
router.get('/employee/:employeeId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;

    const payrollService = getPayrollProvider();
    const employee = await payrollService.getEmployee(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found in payroll system',
      });
    }

    res.json({
      success: true,
      employee,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/payroll/employee
 * Create employee in payroll system
 *
 * Body: PayrollEmployee
 */
router.post('/employee', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const employee = req.body as PayrollEmployee;

    if (!employee.firstName || !employee.lastName || !employee.email) {
      return res.status(400).json({
        success: false,
        error: 'firstName, lastName, and email are required',
      });
    }

    const payrollService = getPayrollProvider();
    const result = await payrollService.createEmployee(employee);

    res.json({
      success: result.success,
      externalId: result.externalId,
      error: result.error,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/payroll/employee/:employeeId
 * Update employee in payroll system
 *
 * Body: PayrollEmployee (partial)
 */
router.put('/employee/:employeeId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const employee = { ...req.body, id: employeeId } as PayrollEmployee;

    const payrollService = getPayrollProvider();
    const result = await payrollService.updateEmployee(employee);

    res.json({
      success: result.success,
      error: result.error,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/payroll/employee/:employeeId/terminate
 * Terminate employee in payroll system
 *
 * Body: { terminationDate: string }
 */
router.post('/employee/:employeeId/terminate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const { terminationDate } = req.body;

    if (!terminationDate) {
      return res.status(400).json({
        success: false,
        error: 'terminationDate is required',
      });
    }

    const payrollService = getPayrollProvider();
    const result = await payrollService.terminateEmployee(employeeId, new Date(terminationDate));

    res.json({
      success: result.success,
      error: result.error,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/payroll/employee/:employeeId/paystub
 * Get pay stub for employee
 *
 * Query: ?payPeriodEnd=YYYY-MM-DD
 */
router.get('/employee/:employeeId/paystub', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const { payPeriodEnd } = req.query;

    if (!payPeriodEnd) {
      return res.status(400).json({
        success: false,
        error: 'payPeriodEnd query parameter is required',
      });
    }

    const payrollService = getPayrollProvider();
    const paystub = await payrollService.getPayStub(employeeId, new Date(payPeriodEnd as string));

    if (!paystub) {
      return res.status(404).json({
        success: false,
        error: 'Pay stub not found',
      });
    }

    res.json({
      success: true,
      paystub,
      provider: payrollService.getProviderName(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/payroll/export-hours
 * Generate CSV export file for manual import
 *
 * Body: { hours: PayrollHours[] }
 */
router.post('/export-hours', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { hours } = req.body;

    if (!hours || !Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        error: 'hours array is required',
      });
    }

    const payrollService = getPayrollProvider();
    const csvContent = await payrollService.generateHoursExportFile(hours);

    // Return as downloadable CSV file
    const filename = `payroll_hours_${new Date().toISOString().split('T')[0]}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

export default router;
