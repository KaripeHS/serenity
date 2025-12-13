/**
 * Shift Differential Pay Routes
 * API endpoints for managing shift differentials, holiday calendars, and pay calculations
 *
 * Best-in-Class Feature: Configurable shift differentials for weekends,
 * holidays, nights, and skill-based premiums
 *
 * @module api/routes/console/shift-differential
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { shiftDifferentialService as ShiftDifferentialService } from '../../../services/shift-differential.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('shift-differential-routes');

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * GET /api/console/shift-differential/dashboard
 * Get shift differential dashboard metrics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { month } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const dashboard = await ShiftDifferentialService.getDashboard(
      organizationId,
      month as string
    );

    res.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DIFFERENTIAL RULES
// ============================================================================

/**
 * GET /api/console/shift-differential/rules
 * Get all differential rules
 */
router.get('/rules', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { ruleType, isActive, limit, offset } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { rules, count } = await ShiftDifferentialService.getRules(organizationId, {
      ruleType: ruleType as string,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json({
      rules,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/shift-differential/rules/:ruleId
 * Get a specific rule
 */
router.get('/rules/:ruleId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { ruleId } = req.params;

    const rule = await ShiftDifferentialService.getRuleById(ruleId);

    if (!rule) {
      throw ApiErrors.notFound('Rule not found');
    }

    res.json({
      rule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shift-differential/rules
 * Create a differential rule
 */
router.post('/rules', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      ruleName,
      ruleCode,
      description,
      ruleType,
      differentialType,
      differentialValue,
      conditions,
      priority,
      isStackable,
      stackGroup,
      maxStackPercent,
      appliesToRoles,
      appliesToEmployeeTypes,
      minTenureDays,
      effectiveDate,
      expirationDate,
      isActive
    } = req.body;

    if (!ruleName || !ruleType || !differentialType || differentialValue === undefined || !effectiveDate) {
      throw ApiErrors.badRequest('Missing required fields: ruleName, ruleType, differentialType, differentialValue, effectiveDate');
    }

    const rule = await ShiftDifferentialService.createRule({
      organizationId,
      ruleName,
      ruleCode,
      description,
      ruleType,
      differentialType,
      differentialValue: parseFloat(differentialValue),
      conditions: conditions || {},
      priority: priority ? parseInt(priority) : undefined,
      isStackable,
      stackGroup,
      maxStackPercent: maxStackPercent ? parseFloat(maxStackPercent) : undefined,
      appliesToRoles,
      appliesToEmployeeTypes,
      minTenureDays: minTenureDays ? parseInt(minTenureDays) : undefined,
      effectiveDate,
      expirationDate,
      isActive
    });

    logger.info(`Differential rule created: ${rule.id} - ${ruleName}`);

    res.status(201).json({
      rule,
      message: 'Differential rule created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/shift-differential/rules/:ruleId
 * Update a differential rule
 */
router.put('/rules/:ruleId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await ShiftDifferentialService.updateRule(ruleId, updates);

    logger.info(`Differential rule updated: ${ruleId}`);

    res.json({
      rule,
      message: 'Differential rule updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/shift-differential/rules/:ruleId
 * Delete (deactivate) a differential rule
 */
router.delete('/rules/:ruleId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { ruleId } = req.params;

    await ShiftDifferentialService.deleteRule(ruleId);

    logger.info(`Differential rule deactivated: ${ruleId}`);

    res.json({
      message: 'Differential rule deactivated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shift-differential/rules/defaults
 * Create default differential rules for the organization
 */
router.post('/rules/defaults', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const rules = await ShiftDifferentialService.createDefaultRules(organizationId);

    logger.info(`Default differential rules created for org ${organizationId}`);

    res.status(201).json({
      rules,
      count: rules.length,
      message: 'Default differential rules created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// HOLIDAY CALENDARS
// ============================================================================

/**
 * GET /api/console/shift-differential/holidays
 * Get holiday calendars
 */
router.get('/holidays', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { year } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const calendars = await ShiftDifferentialService.getHolidayCalendars(
      organizationId,
      year ? parseInt(year as string) : undefined
    );

    res.json({
      calendars,
      count: calendars.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shift-differential/holidays
 * Create a holiday calendar
 */
router.post('/holidays', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { calendarName, calendarYear, isDefault } = req.body;

    if (!calendarName || !calendarYear) {
      throw ApiErrors.badRequest('Missing required fields: calendarName, calendarYear');
    }

    const calendar = await ShiftDifferentialService.createHolidayCalendar({
      organizationId,
      calendarName,
      calendarYear: parseInt(calendarYear),
      isDefault
    });

    logger.info(`Holiday calendar created: ${calendar.id}`);

    res.status(201).json({
      calendar,
      message: 'Holiday calendar created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/shift-differential/holidays/:calendarId/dates
 * Get holiday dates for a calendar
 */
router.get('/holidays/:calendarId/dates', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { calendarId } = req.params;

    const dates = await ShiftDifferentialService.getHolidayDates(calendarId);

    res.json({
      dates,
      count: dates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shift-differential/holidays/:calendarId/dates
 * Add a holiday date to a calendar
 */
router.post('/holidays/:calendarId/dates', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { calendarId } = req.params;
    const { holidayName, holidayCode, holidayDate, differentialMultiplier, isObservedDate, actualDate } = req.body;

    if (!holidayName || !holidayDate) {
      throw ApiErrors.badRequest('Missing required fields: holidayName, holidayDate');
    }

    const holiday = await ShiftDifferentialService.addHolidayDate({
      calendarId,
      holidayName,
      holidayCode,
      holidayDate,
      differentialMultiplier: differentialMultiplier ? parseFloat(differentialMultiplier) : undefined,
      isObservedDate,
      actualDate
    });

    logger.info(`Holiday date added: ${holidayName} on ${holidayDate}`);

    res.status(201).json({
      holiday,
      message: 'Holiday date added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shift-differential/holidays/defaults
 * Create default holiday calendar with US federal holidays
 */
router.post('/holidays/defaults', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { year } = req.body;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const calendarYear = year ? parseInt(year) : new Date().getFullYear();
    const calendar = await ShiftDifferentialService.createDefaultHolidayCalendar(
      organizationId,
      calendarYear
    );

    logger.info(`Default holiday calendar created for ${calendarYear}`);

    res.status(201).json({
      calendar,
      message: `Default holiday calendar created for ${calendarYear}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DIFFERENTIAL CALCULATIONS
// ============================================================================

/**
 * POST /api/console/shift-differential/calculate
 * Calculate applicable differentials for a shift
 */
router.post('/calculate', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      employeeId,
      shiftDate,
      startTime,
      endTime,
      serviceCode,
      clientId,
      baseRate
    } = req.body;

    if (!employeeId || !shiftDate || !startTime || !endTime) {
      throw ApiErrors.badRequest('Missing required fields: employeeId, shiftDate, startTime, endTime');
    }

    const differentials = await ShiftDifferentialService.calculateDifferentials(
      organizationId,
      employeeId,
      shiftDate,
      startTime,
      endTime,
      serviceCode,
      clientId,
      baseRate ? parseFloat(baseRate) : undefined
    );

    // Calculate totals
    let totalDifferential = 0;
    for (const d of differentials) {
      totalDifferential += d.differentialAmount;
    }

    res.json({
      differentials,
      count: differentials.length,
      totalDifferentialPerHour: totalDifferential,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/shift-differential/apply
 * Apply differentials to a shift
 */
router.post('/apply', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      employeeId,
      shiftId,
      visitId,
      evvRecordId,
      shiftDate,
      shiftStartTime,
      shiftEndTime,
      hoursWorked,
      baseHourlyRate,
      differentialRuleId,
      ruleName,
      ruleType,
      differentialType,
      differentialValue,
      differentialAmount,
      effectiveRate,
      stackingOrder,
      wasCapped
    } = req.body;

    if (!employeeId || !shiftDate || !hoursWorked || !baseHourlyRate || !differentialRuleId) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const totalDifferentialPay = hoursWorked * differentialAmount;

    const application = await ShiftDifferentialService.applyDifferentials({
      organizationId,
      employeeId,
      shiftId,
      visitId,
      evvRecordId,
      shiftDate,
      shiftStartTime,
      shiftEndTime,
      hoursWorked: parseFloat(hoursWorked),
      baseHourlyRate: parseFloat(baseHourlyRate),
      differentialRuleId,
      ruleName,
      ruleType,
      differentialType,
      differentialValue: parseFloat(differentialValue),
      differentialAmount: parseFloat(differentialAmount),
      effectiveRate: parseFloat(effectiveRate),
      totalDifferentialPay,
      stackingOrder,
      wasCapped
    });

    logger.info(`Differential applied: ${application.id} for employee ${employeeId}`);

    res.status(201).json({
      application,
      message: 'Differential applied successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DIFFERENTIAL APPLICATIONS
// ============================================================================

/**
 * GET /api/console/shift-differential/applications
 * Get differential applications
 */
router.get('/applications', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { employeeId, startDate, endDate, ruleType, status, limit, offset } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { applications, count } = await ShiftDifferentialService.getApplications(
      organizationId,
      {
        employeeId: employeeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        ruleType: ruleType as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    );

    res.json({
      applications,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/shift-differential/employee/:employeeId/summary
 * Get employee differential summary
 */
router.get('/employee/:employeeId/summary', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const summary = await ShiftDifferentialService.getEmployeeSummary(
      employeeId,
      startDate as string,
      endDate as string
    );

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
