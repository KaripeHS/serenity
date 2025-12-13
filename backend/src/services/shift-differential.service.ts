/**
 * Shift Differential Pay Service
 * Manages shift differential rules, holiday calendars, and pay calculations
 *
 * Best-in-Class Feature: Configurable shift differentials for weekends,
 * holidays, nights, and skill-based premiums
 *
 * @module services/shift-differential
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('shift-differential-service');

interface DifferentialRule {
  id?: string;
  organizationId: string;
  ruleName: string;
  ruleCode?: string;
  description?: string;
  ruleType: string;
  differentialType: string;
  differentialValue: number;
  conditions: Record<string, any>;
  priority?: number;
  isStackable?: boolean;
  stackGroup?: string;
  maxStackPercent?: number;
  appliesToRoles?: string[];
  appliesToEmployeeTypes?: string[];
  minTenureDays?: number;
  effectiveDate: string;
  expirationDate?: string;
  isActive?: boolean;
}

interface HolidayCalendar {
  id?: string;
  organizationId: string;
  calendarName: string;
  calendarYear: number;
  isDefault?: boolean;
}

interface HolidayDate {
  id?: string;
  calendarId: string;
  holidayName: string;
  holidayCode?: string;
  holidayDate: string;
  differentialMultiplier?: number;
  isObservedDate?: boolean;
  actualDate?: string;
}

interface DifferentialApplication {
  organizationId: string;
  employeeId: string;
  shiftId?: string;
  visitId?: string;
  evvRecordId?: string;
  shiftDate: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  hoursWorked: number;
  baseHourlyRate: number;
  differentialRuleId: string;
  ruleName: string;
  ruleType: string;
  differentialType: string;
  differentialValue: number;
  differentialAmount: number;
  effectiveRate: number;
  totalDifferentialPay: number;
  stackingOrder?: number;
  wasCapped?: boolean;
}

interface DifferentialCalculation {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  differentialType: string;
  differentialValue: number;
  differentialAmount: number;
  effectiveRate: number;
  priority: number;
  stackGroup?: string;
}

interface RuleFilters {
  ruleType?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

class ShiftDifferentialService {
  private db = getDbClient();

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  /**
   * Get shift differential dashboard metrics
   */
  async getDashboard(organizationId: string, month?: string): Promise<any> {
    try {
      // Try to use the view if it exists
      const viewQuery = `
        SELECT * FROM shift_differential_dashboard
        WHERE organization_id = $1
        ${month ? "AND period_month = DATE_TRUNC('month', $2::date)" : ''}
        ORDER BY period_month DESC
        LIMIT 12
      `;

      const params: any[] = [organizationId];
      if (month) params.push(month);

      try {
        const result = await this.db.query(viewQuery, params);
        if (result.rows.length > 0) {
          return {
            monthlyData: result.rows,
            currentMonth: result.rows[0] || null
          };
        }
      } catch (e) {
        // View might not exist yet
      }

      // Fallback: return empty dashboard
      return {
        monthlyData: [],
        currentMonth: {
          employeesWithDifferentials: 0,
          totalDifferentialApplications: 0,
          totalDifferentialHours: 0,
          totalDifferentialCost: 0,
          weekendDifferentialCost: 0,
          holidayDifferentialCost: 0,
          nightDifferentialCost: 0,
          skillDifferentialCost: 0
        }
      };
    } catch (error) {
      logger.error('Error getting differential dashboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // DIFFERENTIAL RULES
  // ============================================================================

  /**
   * Get all differential rules for an organization
   */
  async getRules(organizationId: string, filters: RuleFilters = {}): Promise<{ rules: any[]; count: number }> {
    try {
      const conditions: string[] = ['organization_id = $1'];
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (filters.ruleType) {
        conditions.push(`rule_type = $${paramIndex++}`);
        params.push(filters.ruleType);
      }

      if (filters.isActive !== undefined) {
        conditions.push(`is_active = $${paramIndex++}`);
        params.push(filters.isActive);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const query = `
        SELECT *
        FROM shift_differential_rules
        WHERE ${conditions.join(' AND ')}
        ORDER BY priority ASC, rule_name
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as count
        FROM shift_differential_rules
        WHERE ${conditions.join(' AND ')}
      `;

      const [rulesResult, countResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(countQuery, params)
      ]);

      return {
        rules: rulesResult.rows,
        count: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error getting differential rules:', error);
      throw error;
    }
  }

  /**
   * Get a single rule by ID
   */
  async getRuleById(ruleId: string): Promise<any> {
    try {
      const query = `SELECT * FROM shift_differential_rules WHERE id = $1`;
      const result = await this.db.query(query, [ruleId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting rule by ID:', error);
      throw error;
    }
  }

  /**
   * Create a differential rule
   */
  async createRule(rule: DifferentialRule): Promise<any> {
    try {
      const query = `
        INSERT INTO shift_differential_rules (
          organization_id, rule_name, rule_code, description, rule_type,
          differential_type, differential_value, conditions, priority,
          is_stackable, stack_group, max_stack_percent,
          applies_to_roles, applies_to_employee_types, min_tenure_days,
          effective_date, expiration_date, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        rule.organizationId,
        rule.ruleName,
        rule.ruleCode,
        rule.description,
        rule.ruleType,
        rule.differentialType,
        rule.differentialValue,
        JSON.stringify(rule.conditions),
        rule.priority || 100,
        rule.isStackable !== false,
        rule.stackGroup,
        rule.maxStackPercent,
        rule.appliesToRoles || ['caregiver'],
        rule.appliesToEmployeeTypes || ['hourly', 'part_time', 'full_time'],
        rule.minTenureDays || 0,
        rule.effectiveDate,
        rule.expirationDate,
        rule.isActive !== false,
        rule.organizationId // Using org ID as placeholder for created_by
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating differential rule:', error);
      throw error;
    }
  }

  /**
   * Update a differential rule
   */
  async updateRule(ruleId: string, updates: Partial<DifferentialRule>): Promise<any> {
    try {
      const allowedFields = [
        'rule_name', 'rule_code', 'description', 'rule_type',
        'differential_type', 'differential_value', 'conditions', 'priority',
        'is_stackable', 'stack_group', 'max_stack_percent',
        'applies_to_roles', 'applies_to_employee_types', 'min_tenure_days',
        'effective_date', 'expiration_date', 'is_active'
      ];

      const fieldMap: Record<string, string> = {
        ruleName: 'rule_name',
        ruleCode: 'rule_code',
        ruleType: 'rule_type',
        differentialType: 'differential_type',
        differentialValue: 'differential_value',
        isStackable: 'is_stackable',
        stackGroup: 'stack_group',
        maxStackPercent: 'max_stack_percent',
        appliesToRoles: 'applies_to_roles',
        appliesToEmployeeTypes: 'applies_to_employee_types',
        minTenureDays: 'min_tenure_days',
        effectiveDate: 'effective_date',
        expirationDate: 'expiration_date',
        isActive: 'is_active'
      };

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        if (allowedFields.includes(dbField) && value !== undefined) {
          setClauses.push(`${dbField} = $${paramIndex++}`);
          params.push(key === 'conditions' ? JSON.stringify(value) : value);
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(ruleId);

      const query = `
        UPDATE shift_differential_rules
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating differential rule:', error);
      throw error;
    }
  }

  /**
   * Delete (soft-delete) a differential rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE shift_differential_rules
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
      `;
      await this.db.query(query, [ruleId]);
      return true;
    } catch (error) {
      logger.error('Error deleting differential rule:', error);
      throw error;
    }
  }

  /**
   * Create default rules for an organization
   */
  async createDefaultRules(organizationId: string): Promise<any[]> {
    try {
      const defaultRules: Partial<DifferentialRule>[] = [
        {
          organizationId,
          ruleName: 'Weekend Differential',
          ruleCode: 'WEEKEND',
          description: 'Additional pay for weekend shifts (Saturday & Sunday)',
          ruleType: 'day_of_week',
          differentialType: 'percentage',
          differentialValue: 0.10, // 10%
          conditions: { days: [0, 6] }, // Sunday=0, Saturday=6
          priority: 100,
          isStackable: true,
          effectiveDate: new Date().toISOString().split('T')[0]
        },
        {
          organizationId,
          ruleName: 'Holiday Differential',
          ruleCode: 'HOLIDAY',
          description: 'Additional pay for working on recognized holidays',
          ruleType: 'holiday',
          differentialType: 'multiplier',
          differentialValue: 1.5, // Time and a half
          conditions: { holidays: ['NEW_YEARS_DAY', 'MEMORIAL_DAY', 'JULY_4TH', 'LABOR_DAY', 'THANKSGIVING', 'CHRISTMAS'] },
          priority: 50, // Higher priority than weekend
          isStackable: false, // Don't stack with weekend
          stackGroup: 'day_type',
          effectiveDate: new Date().toISOString().split('T')[0]
        },
        {
          organizationId,
          ruleName: 'Night Shift Differential',
          ruleCode: 'NIGHT',
          description: 'Additional pay for overnight shifts (6 PM - 6 AM)',
          ruleType: 'time_of_day',
          differentialType: 'flat',
          differentialValue: 2.00, // $2/hour
          conditions: { start_time: '18:00', end_time: '06:00' },
          priority: 80,
          isStackable: true,
          effectiveDate: new Date().toISOString().split('T')[0]
        }
      ];

      const createdRules: any[] = [];
      for (const rule of defaultRules) {
        const created = await this.createRule(rule as DifferentialRule);
        createdRules.push(created);
      }

      return createdRules;
    } catch (error) {
      logger.error('Error creating default rules:', error);
      throw error;
    }
  }

  // ============================================================================
  // HOLIDAY CALENDARS
  // ============================================================================

  /**
   * Get holiday calendars for an organization
   */
  async getHolidayCalendars(organizationId: string, year?: number): Promise<any[]> {
    try {
      const query = `
        SELECT hc.*,
          (SELECT COUNT(*) FROM holiday_calendar_dates WHERE calendar_id = hc.id) as holiday_count
        FROM holiday_calendars hc
        WHERE hc.organization_id = $1
        ${year ? 'AND hc.calendar_year = $2' : ''}
        ORDER BY hc.calendar_year DESC, hc.is_default DESC
      `;

      const params: any[] = [organizationId];
      if (year) params.push(year);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting holiday calendars:', error);
      return [];
    }
  }

  /**
   * Create a holiday calendar
   */
  async createHolidayCalendar(calendar: HolidayCalendar): Promise<any> {
    try {
      const query = `
        INSERT INTO holiday_calendars (organization_id, calendar_name, calendar_year, is_default)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        calendar.organizationId,
        calendar.calendarName,
        calendar.calendarYear,
        calendar.isDefault || false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating holiday calendar:', error);
      throw error;
    }
  }

  /**
   * Get holiday dates for a calendar
   */
  async getHolidayDates(calendarId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM holiday_calendar_dates
        WHERE calendar_id = $1
        ORDER BY holiday_date
      `;

      const result = await this.db.query(query, [calendarId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting holiday dates:', error);
      return [];
    }
  }

  /**
   * Add a holiday date to a calendar
   */
  async addHolidayDate(holiday: HolidayDate): Promise<any> {
    try {
      const query = `
        INSERT INTO holiday_calendar_dates (
          calendar_id, holiday_name, holiday_code, holiday_date,
          differential_multiplier, is_observed_date, actual_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        holiday.calendarId,
        holiday.holidayName,
        holiday.holidayCode,
        holiday.holidayDate,
        holiday.differentialMultiplier,
        holiday.isObservedDate || false,
        holiday.actualDate
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error adding holiday date:', error);
      throw error;
    }
  }

  /**
   * Create default holiday calendar with US federal holidays
   */
  async createDefaultHolidayCalendar(organizationId: string, year: number): Promise<any> {
    try {
      // Create calendar
      const calendar = await this.createHolidayCalendar({
        organizationId,
        calendarName: `${year} US Holidays`,
        calendarYear: year,
        isDefault: true
      });

      // US Federal Holidays for the year
      const holidays = [
        { name: "New Year's Day", code: 'NEW_YEARS_DAY', month: 1, day: 1 },
        { name: 'Martin Luther King Jr. Day', code: 'MLK_DAY', month: 1, day: 20 }, // 3rd Monday
        { name: "Presidents' Day", code: 'PRESIDENTS_DAY', month: 2, day: 17 }, // 3rd Monday
        { name: 'Memorial Day', code: 'MEMORIAL_DAY', month: 5, day: 26 }, // Last Monday
        { name: 'Independence Day', code: 'JULY_4TH', month: 7, day: 4 },
        { name: 'Labor Day', code: 'LABOR_DAY', month: 9, day: 1 }, // 1st Monday
        { name: 'Veterans Day', code: 'VETERANS_DAY', month: 11, day: 11 },
        { name: 'Thanksgiving Day', code: 'THANKSGIVING', month: 11, day: 27 }, // 4th Thursday
        { name: 'Christmas Day', code: 'CHRISTMAS', month: 12, day: 25 }
      ];

      for (const h of holidays) {
        const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
        await this.addHolidayDate({
          calendarId: calendar.id,
          holidayName: h.name,
          holidayCode: h.code,
          holidayDate: dateStr
        });
      }

      return calendar;
    } catch (error) {
      logger.error('Error creating default holiday calendar:', error);
      throw error;
    }
  }

  // ============================================================================
  // DIFFERENTIAL CALCULATIONS
  // ============================================================================

  /**
   * Calculate applicable differentials for a shift
   */
  async calculateDifferentials(
    organizationId: string,
    employeeId: string,
    shiftDate: string,
    startTime: string,
    endTime: string,
    serviceCode?: string,
    clientId?: string,
    baseRate?: number
  ): Promise<DifferentialCalculation[]> {
    try {
      // Try to use database function if it exists
      const funcQuery = `
        SELECT * FROM calculate_shift_differentials($1, $2, $3::date, $4::time, $5::time, $6, $7, $8)
      `;

      try {
        const result = await this.db.query(funcQuery, [
          organizationId,
          employeeId,
          shiftDate,
          startTime,
          endTime,
          serviceCode,
          clientId,
          baseRate
        ]);

        if (result.rows.length > 0) {
          return result.rows.map(row => ({
            ruleId: row.rule_id,
            ruleName: row.rule_name,
            ruleType: row.rule_type,
            differentialType: row.differential_type,
            differentialValue: parseFloat(row.differential_value),
            differentialAmount: parseFloat(row.differential_amount),
            effectiveRate: parseFloat(row.effective_rate),
            priority: row.priority,
            stackGroup: row.stack_group
          }));
        }
      } catch (e) {
        // Function might not exist
      }

      // Fallback: calculate in JavaScript
      return this.calculateDifferentialsJs(
        organizationId,
        employeeId,
        shiftDate,
        startTime,
        endTime,
        serviceCode,
        baseRate
      );
    } catch (error) {
      logger.error('Error calculating differentials:', error);
      return [];
    }
  }

  /**
   * JavaScript fallback for differential calculation
   */
  private async calculateDifferentialsJs(
    organizationId: string,
    employeeId: string,
    shiftDate: string,
    startTime: string,
    endTime: string,
    serviceCode?: string,
    baseRate?: number
  ): Promise<DifferentialCalculation[]> {
    const results: DifferentialCalculation[] = [];

    // Get base rate if not provided
    if (!baseRate) {
      const rateQuery = `
        SELECT amount FROM pay_rates
        WHERE user_id = $1 AND rate_type = 'hourly'
        ORDER BY effective_date DESC LIMIT 1
      `;
      const rateResult = await this.db.query(rateQuery, [employeeId]);
      baseRate = rateResult.rows[0]?.amount || 15.00;
    }

    // Get applicable rules
    const { rules } = await this.getRules(organizationId, { isActive: true });

    const shiftDateObj = new Date(shiftDate);
    const dayOfWeek = shiftDateObj.getDay(); // 0=Sunday, 6=Saturday

    // Check if holiday
    const holidayQuery = `
      SELECT EXISTS (
        SELECT 1 FROM holiday_calendar_dates hcd
        JOIN holiday_calendars hc ON hcd.calendar_id = hc.id
        WHERE hc.organization_id = $1
          AND hc.is_default = TRUE
          AND hcd.holiday_date = $2
      ) as is_holiday
    `;
    const holidayResult = await this.db.query(holidayQuery, [organizationId, shiftDate]);
    const isHoliday = holidayResult.rows[0]?.is_holiday || false;

    for (const rule of rules) {
      let applies = false;

      switch (rule.rule_type) {
        case 'day_of_week':
          const days = rule.conditions?.days || [];
          applies = days.includes(dayOfWeek);
          break;

        case 'holiday':
          applies = isHoliday;
          break;

        case 'time_of_day':
          const ruleStart = rule.conditions?.start_time;
          const ruleEnd = rule.conditions?.end_time;
          if (ruleStart && ruleEnd) {
            // Simplified: just check if shift start is in window
            applies = startTime >= ruleStart || startTime <= ruleEnd;
          }
          break;

        case 'service_type':
          if (serviceCode && rule.conditions?.service_codes) {
            applies = rule.conditions.service_codes.includes(serviceCode);
          }
          break;
      }

      if (applies) {
        let differentialAmount: number;
        let effectiveRate: number;

        switch (rule.differential_type) {
          case 'percentage':
            differentialAmount = baseRate * rule.differential_value;
            effectiveRate = baseRate * (1 + rule.differential_value);
            break;
          case 'flat':
            differentialAmount = rule.differential_value;
            effectiveRate = baseRate + rule.differential_value;
            break;
          case 'multiplier':
            differentialAmount = baseRate * (rule.differential_value - 1);
            effectiveRate = baseRate * rule.differential_value;
            break;
          default:
            differentialAmount = 0;
            effectiveRate = baseRate;
        }

        results.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          ruleType: rule.rule_type,
          differentialType: rule.differential_type,
          differentialValue: parseFloat(rule.differential_value),
          differentialAmount,
          effectiveRate,
          priority: rule.priority,
          stackGroup: rule.stack_group
        });
      }
    }

    return results;
  }

  /**
   * Apply differentials to a shift and record them
   */
  async applyDifferentials(application: DifferentialApplication): Promise<any> {
    try {
      const query = `
        INSERT INTO shift_differential_applications (
          organization_id, employee_id, shift_id, visit_id, evv_record_id,
          shift_date, shift_start_time, shift_end_time, hours_worked,
          base_hourly_rate, differential_rule_id, rule_name, rule_type,
          differential_type, differential_value, differential_amount,
          effective_rate, total_differential_pay, stacking_order, was_capped
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        application.organizationId,
        application.employeeId,
        application.shiftId,
        application.visitId,
        application.evvRecordId,
        application.shiftDate,
        application.shiftStartTime,
        application.shiftEndTime,
        application.hoursWorked,
        application.baseHourlyRate,
        application.differentialRuleId,
        application.ruleName,
        application.ruleType,
        application.differentialType,
        application.differentialValue,
        application.differentialAmount,
        application.effectiveRate,
        application.totalDifferentialPay,
        application.stackingOrder || 1,
        application.wasCapped || false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error applying differential:', error);
      throw error;
    }
  }

  /**
   * Get differential applications for a period
   */
  async getApplications(
    organizationId: string,
    filters: {
      employeeId?: string;
      startDate?: string;
      endDate?: string;
      ruleType?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ applications: any[]; count: number }> {
    try {
      const conditions: string[] = ['sda.organization_id = $1'];
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (filters.employeeId) {
        conditions.push(`sda.employee_id = $${paramIndex++}`);
        params.push(filters.employeeId);
      }

      if (filters.startDate) {
        conditions.push(`sda.shift_date >= $${paramIndex++}`);
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`sda.shift_date <= $${paramIndex++}`);
        params.push(filters.endDate);
      }

      if (filters.ruleType) {
        conditions.push(`sda.rule_type = $${paramIndex++}`);
        params.push(filters.ruleType);
      }

      if (filters.status) {
        conditions.push(`sda.status = $${paramIndex++}`);
        params.push(filters.status);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const query = `
        SELECT sda.*,
          u.first_name || ' ' || u.last_name as employee_name
        FROM shift_differential_applications sda
        JOIN users u ON sda.employee_id = u.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY sda.shift_date DESC, sda.calculated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as count
        FROM shift_differential_applications sda
        WHERE ${conditions.join(' AND ')}
      `;

      const [appResult, countResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(countQuery, params)
      ]);

      return {
        applications: appResult.rows,
        count: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error getting differential applications:', error);
      throw error;
    }
  }

  /**
   * Get employee differential summary
   */
  async getEmployeeSummary(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      const conditions: string[] = ['employee_id = $1'];
      const params: any[] = [employeeId];
      let paramIndex = 2;

      if (startDate) {
        conditions.push(`shift_date >= $${paramIndex++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`shift_date <= $${paramIndex++}`);
        params.push(endDate);
      }

      const query = `
        SELECT
          rule_type,
          rule_name,
          COUNT(*) as shift_count,
          SUM(hours_worked) as total_hours,
          SUM(total_differential_pay) as total_differential_pay,
          AVG(differential_amount) as avg_differential_per_hour
        FROM shift_differential_applications
        WHERE ${conditions.join(' AND ')} AND status != 'reversed'
        GROUP BY rule_type, rule_name
        ORDER BY total_differential_pay DESC
      `;

      const totalsQuery = `
        SELECT
          SUM(hours_worked) as total_hours,
          SUM(hours_worked * base_hourly_rate) as base_pay,
          SUM(total_differential_pay) as total_differential_pay,
          COUNT(DISTINCT shift_date) as shifts_with_differential
        FROM shift_differential_applications
        WHERE ${conditions.join(' AND ')} AND status != 'reversed'
      `;

      const [byTypeResult, totalsResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(totalsQuery, params)
      ]);

      return {
        byType: byTypeResult.rows,
        totals: totalsResult.rows[0] || {
          totalHours: 0,
          basePay: 0,
          totalDifferentialPay: 0,
          shiftsWithDifferential: 0
        }
      };
    } catch (error) {
      logger.error('Error getting employee summary:', error);
      throw error;
    }
  }
}

export const shiftDifferentialService = new ShiftDifferentialService();
