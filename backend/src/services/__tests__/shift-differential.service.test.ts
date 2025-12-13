/**
 * Shift Differential Service Tests
 * Tests for shift differential rules, holiday pay, and calculations
 */

import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock database client
const mockQuery = jest.fn() as jest.Mock<any>;
jest.mock('../../database/client', () => ({
  getDbClient: () => ({
    query: mockQuery,
  }),
}));

import { shiftDifferentialService } from '../shift-differential.service';

describe('ShiftDifferentialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return shift differential dashboard metrics', async () => {
      const mockDashboardData = {
        rows: [{
          total_differential_mtd: '24560.00',
          weekend_pay_mtd: '8920.00',
          holiday_pay_mtd: '4200.00',
          night_pay_mtd: '6840.00',
          skill_pay_mtd: '4600.00',
          avg_differential: '18.50',
          active_rules: '12',
          pending_approvals: '8',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockDashboardData);

      const result = await shiftDifferentialService.getDashboard('org-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getRules', () => {
    it('should return all active differential rules', async () => {
      const mockRules = {
        rows: [
          {
            id: 'rule-1',
            rule_name: 'Weekend Premium',
            rule_type: 'weekend',
            differential_type: 'percentage',
            differential_value: 15,
            is_active: true,
          },
          {
            id: 'rule-2',
            rule_name: 'Night Shift',
            rule_type: 'night',
            differential_type: 'flat',
            differential_value: 2.50,
            is_active: true,
          },
        ],
      };
      const mockCount = { rows: [{ count: '2' }] };

      mockQuery
        .mockResolvedValueOnce(mockRules)
        .mockResolvedValueOnce(mockCount);

      const result = await shiftDifferentialService.getRules('org-123');

      expect(result.rules).toHaveLength(2);
      expect(result.rules[0].rule_name).toBe('Weekend Premium');
    });

    it('should filter rules by type', async () => {
      const mockRules = {
        rows: [{ id: 'rule-1', rule_type: 'weekend', is_active: true }],
      };
      const mockCount = { rows: [{ count: '1' }] };

      mockQuery
        .mockResolvedValueOnce(mockRules)
        .mockResolvedValueOnce(mockCount);

      const result = await shiftDifferentialService.getRules('org-123', {
        ruleType: 'weekend',
      });

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].rule_type).toBe('weekend');
    });
  });

  describe('createRule', () => {
    const mockRuleData = {
      organizationId: 'org-123',
      ruleName: 'Weekend Premium',
      ruleType: 'weekend',
      differentialType: 'percentage',
      differentialValue: 15,
      conditions: { dayOfWeek: [0, 6] },
      priority: 1,
      description: '15% premium for weekend shifts',
      effectiveDate: '2024-12-01',
    };

    it('should create a new differential rule', async () => {
      const mockResult = {
        rows: [{
          id: 'rule-123',
          ...mockRuleData,
          is_active: true,
          effective_date: new Date().toISOString(),
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await shiftDifferentialService.createRule(mockRuleData);

      expect(result).toBeDefined();
      expect(result.id).toBe('rule-123');
    });
  });

  describe('updateRule', () => {
    it('should update an existing rule', async () => {
      const mockResult = {
        rows: [{
          id: 'rule-123',
          differential_value: 20,
          updated_at: new Date().toISOString(),
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await shiftDifferentialService.updateRule('rule-123', {
        differentialValue: 20,
      });

      expect(result.differential_value).toBe(20);
    });

    it('should toggle rule active status', async () => {
      const mockResult = {
        rows: [{ id: 'rule-123', is_active: false }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await shiftDifferentialService.updateRule('rule-123', {
        isActive: false,
      });

      expect(result.is_active).toBe(false);
    });
  });

  describe('calculateDifferentials', () => {
    it('should calculate weekend differential', async () => {
      const mockDifferentials = {
        rows: [{
          rule_id: 'rule-1',
          rule_name: 'Weekend Premium',
          rule_type: 'weekend',
          differential_type: 'percentage',
          differential_value: '15',
          differential_amount: '18.00',
          effective_rate: '17.25',
          priority: 1,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockDifferentials);

      const result = await shiftDifferentialService.calculateDifferentials(
        'org-123',
        'emp-123',
        '2024-12-07', // Saturday
        '09:00',
        '17:00',
        'PC',
        'client-123',
        15.00
      );

      expect(result).toBeDefined();
    });

    it('should calculate night shift differential', async () => {
      const mockDifferentials = {
        rows: [{
          rule_id: 'rule-2',
          rule_name: 'Night Shift',
          rule_type: 'night',
          differential_type: 'flat',
          differential_value: '2.50',
          differential_amount: '20.00',
          effective_rate: '16.50',
          priority: 2,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockDifferentials);

      const result = await shiftDifferentialService.calculateDifferentials(
        'org-123',
        'emp-123',
        '2024-12-10',
        '23:00',
        '07:00',
        'PC',
        'client-123',
        14.00
      );

      expect(result).toBeDefined();
    });
  });

  describe('getHolidayCalendars', () => {
    it('should return holiday calendars for a year', async () => {
      const mockCalendars = {
        rows: [
          { id: 'cal-1', calendar_year: 2024, calendar_name: 'US Holidays', is_active: true },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockCalendars);

      const result = await shiftDifferentialService.getHolidayCalendars('org-123', 2024);

      expect(result).toHaveLength(1);
    });
  });

  describe('addHolidayDate', () => {
    it('should add a holiday date to a calendar', async () => {
      const mockResult = {
        rows: [{
          id: 'date-123',
          calendar_id: 'cal-123',
          holiday_date: '2024-12-25',
          holiday_name: 'Christmas Day',
          differential_multiplier: 2.0,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await shiftDifferentialService.addHolidayDate({
        calendarId: 'cal-123',
        holidayDate: '2024-12-25',
        holidayName: 'Christmas Day',
        differentialMultiplier: 2.0,
      });

      expect(result.holiday_name).toBe('Christmas Day');
    });
  });

  describe('getApplications', () => {
    it('should return differential applications', async () => {
      const mockApplications = {
        rows: [
          {
            id: 'app-1',
            caregiver_name: 'Maria Garcia',
            shift_date: '2024-12-07',
            rule_name: 'Weekend Premium',
            differential_amount: 9.00,
            status: 'pending',
          },
        ],
      };
      const mockCount = { rows: [{ count: '1' }] };

      mockQuery
        .mockResolvedValueOnce(mockApplications)
        .mockResolvedValueOnce(mockCount);

      const result = await shiftDifferentialService.getApplications('org-123');

      expect(result.applications).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const mockApplications = {
        rows: [{ id: 'app-1', status: 'pending' }],
      };
      const mockCount = { rows: [{ count: '1' }] };

      mockQuery
        .mockResolvedValueOnce(mockApplications)
        .mockResolvedValueOnce(mockCount);

      const result = await shiftDifferentialService.getApplications('org-123', {
        status: 'pending',
      });

      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].status).toBe('pending');
    });
  });

  describe('applyDifferentials', () => {
    it('should apply differentials to a visit', async () => {
      const mockResult = {
        rows: [{
          id: 'app-123',
          visit_id: 'visit-123',
          total_differential: 18.50,
          status: 'applied',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await shiftDifferentialService.applyDifferentials({
        organizationId: 'org-123',
        employeeId: 'emp-123',
        visitId: 'visit-123',
        shiftDate: '2024-12-07',
        shiftStartTime: '09:00',
        shiftEndTime: '17:00',
        hoursWorked: 8,
        baseHourlyRate: 15.00,
        differentialRuleId: 'rule-123',
        ruleName: 'Weekend Premium',
        ruleType: 'weekend',
        differentialType: 'percentage',
        differentialValue: 15,
        differentialAmount: 18.00,
        effectiveRate: 17.25,
        totalDifferentialPay: 18.00,
      });

      expect(result).toBeDefined();
    });
  });

  describe('getEmployeeSummary', () => {
    it('should get employee differential summary', async () => {
      const mockByType = {
        rows: [{
          rule_type: 'weekend',
          total_differential: 120.00,
        }],
      };
      const mockTotals = {
        rows: [{
          total_hours: 40,
          base_pay: 600.00,
          total_differential_pay: 250.00,
        }],
      };

      mockQuery
        .mockResolvedValueOnce(mockByType)
        .mockResolvedValueOnce(mockTotals);

      const result = await shiftDifferentialService.getEmployeeSummary(
        'org-123',
        '2024-12-01',
        '2024-12-15'
      );

      expect(result).toBeDefined();
    });
  });
});
