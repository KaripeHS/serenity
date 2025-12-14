/**
 * Unit Tests for Time Rounding Utility
 * Tests 6-minute billing rounding, FLSA compliance, and edge cases
 */

import {
  roundTime,
  roundVisitTimes,
  calculateBillableUnits,
  calculateBillableUnitsFromTimes,
  roundFLSA,
  isSameDay,
  crossesMidnightAfterRounding,
  meetsMinimumDuration,
  withinMaximumDuration,
  formatDuration,
  minutesToDecimalHours,
  decimalHoursToMinutes,
  ROUNDING_INTERVALS,
  BILLING_UNIT_MINUTES,
} from '../rounding';

describe('Time Rounding Utility', () => {
  describe('roundTime - nearest mode', () => {
    it('should round to nearest 6-minute interval', () => {
      const time = new Date('2025-11-03T09:07:00Z'); // 7 minutes
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(6); // Rounds to 6 minutes
    });

    it('should round 2 minutes down to 0', () => {
      // 2/6 = 0.33, rounds to 0
      const time = new Date('2025-11-03T09:02:00Z');
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(0);
      expect(result.roundedTime.getUTCHours()).toBe(9);
    });

    it('should round 9 minutes up to 12', () => {
      const time = new Date('2025-11-03T09:09:00Z');
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(12);
    });

    it('should handle exact interval (no rounding needed)', () => {
      const time = new Date('2025-11-03T09:12:00Z');
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(12);
      expect(result.differenceMinutes).toBe(0);
    });
  });

  describe('roundTime - up mode', () => {
    it('should always round up', () => {
      const time = new Date('2025-11-03T09:01:00Z'); // 1 minute
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'up' });

      expect(result.roundedTime.getUTCMinutes()).toBe(6);
    });

    it('should round 7 minutes up to 12', () => {
      const time = new Date('2025-11-03T09:07:00Z');
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'up' });

      expect(result.roundedTime.getUTCMinutes()).toBe(12);
    });
  });

  describe('roundTime - down mode', () => {
    it('should always round down', () => {
      const time = new Date('2025-11-03T09:11:00Z'); // 11 minutes
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'down' });

      expect(result.roundedTime.getUTCMinutes()).toBe(6);
    });

    it('should round 5 minutes down to 0', () => {
      const time = new Date('2025-11-03T09:05:00Z');
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'down' });

      expect(result.roundedTime.getUTCMinutes()).toBe(0);
    });
  });

  describe('roundTime - 15-minute intervals', () => {
    it('should round to nearest 15-minute interval', () => {
      const time = new Date('2025-11-03T09:08:00Z'); // 8 minutes
      const result = roundTime(time, { roundingMinutes: 15, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(15);
    });

    it('should round 6 minutes down to 0 with 15-min interval', () => {
      const time = new Date('2025-11-03T09:06:00Z');
      const result = roundTime(time, { roundingMinutes: 15, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(0);
    });
  });

  describe('roundVisitTimes', () => {
    it('should round both clock-in and clock-out times', () => {
      const clockIn = new Date('2025-11-03T09:07:00Z');
      const clockOut = new Date('2025-11-03T11:08:00Z');

      const result = roundVisitTimes(clockIn, clockOut, {
        roundingMinutes: 6,
        roundingMode: 'nearest',
      });

      expect(result.clockIn.roundedTime.getUTCMinutes()).toBe(6);
      expect(result.clockOut.roundedTime.getUTCMinutes()).toBe(6);
    });

    it('should calculate total duration correctly', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T11:00:00Z'); // 2 hours = 120 minutes

      const result = roundVisitTimes(clockIn, clockOut);

      expect(result.totalMinutesOriginal).toBe(120);
      expect(result.totalMinutesRounded).toBe(120);
    });

    it('should calculate billable units (15-min increments)', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T11:00:00Z'); // 2 hours = 8 units

      const result = roundVisitTimes(clockIn, clockOut);

      expect(result.billableUnits).toBe(8); // 120 minutes / 15 = 8 units
    });

    it('should handle duration changes after rounding', () => {
      const clockIn = new Date('2025-11-03T09:07:00Z'); // Rounds to 09:06
      const clockOut = new Date('2025-11-03T11:08:00Z'); // Rounds to 11:06

      const result = roundVisitTimes(clockIn, clockOut, {
        roundingMinutes: 6,
        roundingMode: 'nearest',
      });

      expect(result.totalMinutesOriginal).toBe(121);
      expect(result.totalMinutesRounded).toBe(120); // 2 hours exact after rounding
      expect(result.billableUnits).toBe(8);
    });
  });

  describe('calculateBillableUnits', () => {
    it('should calculate units from minutes', () => {
      expect(calculateBillableUnits(15)).toBe(1);
      expect(calculateBillableUnits(30)).toBe(2);
      expect(calculateBillableUnits(60)).toBe(4);
      expect(calculateBillableUnits(120)).toBe(8);
    });

    it('should floor partial units', () => {
      expect(calculateBillableUnits(14)).toBe(0); // 14 min < 15 min
      expect(calculateBillableUnits(29)).toBe(1); // 29 min = 1 unit (15 min)
      expect(calculateBillableUnits(44)).toBe(2); // 44 min = 2 units (30 min)
    });

    it('should throw error for negative duration', () => {
      expect(() => calculateBillableUnits(-10)).toThrow('Duration cannot be negative');
    });
  });

  describe('calculateBillableUnitsFromTimes', () => {
    it('should calculate units with rounding applied', () => {
      const clockIn = new Date('2025-11-03T09:07:00Z');
      const clockOut = new Date('2025-11-03T11:08:00Z');

      const units = calculateBillableUnitsFromTimes(clockIn, clockOut, true, {
        roundingMinutes: 6,
        roundingMode: 'nearest',
      });

      expect(units).toBe(8); // Rounds to 2 hours = 8 units
    });

    it('should calculate units without rounding', () => {
      const clockIn = new Date('2025-11-03T09:07:00Z');
      const clockOut = new Date('2025-11-03T11:08:00Z'); // 121 minutes

      const units = calculateBillableUnitsFromTimes(clockIn, clockOut, false);

      expect(units).toBe(8); // 121 / 15 = 8 units (floored)
    });
  });

  describe('roundFLSA - 7-minute rule for payroll', () => {
    it('should round 1-7 minutes down', () => {
      const time = new Date('2025-11-03T09:07:00Z');
      const result = roundFLSA(time);

      expect(result.roundedTime.getUTCMinutes()).toBe(0);
    });

    it('should round 8-14 minutes up to 15', () => {
      const time = new Date('2025-11-03T09:08:00Z');
      const result = roundFLSA(time);

      expect(result.roundedTime.getUTCMinutes()).toBe(15);
    });

    it('should not round exact 15-minute marks', () => {
      const time = new Date('2025-11-03T09:15:00Z');
      const result = roundFLSA(time);

      expect(result.roundedTime.getUTCMinutes()).toBe(15);
      expect(result.differenceMinutes).toBe(0);
    });

    it('should handle hour overflow', () => {
      // 53 minutes: remainder = 53 % 15 = 8, which is >= 8, so rounds UP to 60 (hour overflow)
      const time = new Date('2025-11-03T09:53:00Z');
      const result = roundFLSA(time);

      // Should round to 10:00 (hour overflow)
      expect(result.roundedTime.getUTCHours()).toBe(10);
      expect(result.roundedTime.getUTCMinutes()).toBe(0);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same calendar day', () => {
      const date1 = new Date('2025-11-03T09:00:00Z');
      const date2 = new Date('2025-11-03T23:00:00Z');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      // Use dates that are clearly different days in any timezone
      const date1 = new Date('2025-11-03T12:00:00Z');
      const date2 = new Date('2025-11-04T12:00:00Z');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('crossesMidnightAfterRounding', () => {
    it('should detect midnight crossing after rounding', () => {
      // Use UTC dates - same day originally, different days after rounding
      const originalClockIn = new Date('2025-11-03T14:50:00Z');   // Same UTC day
      const originalClockOut = new Date('2025-11-03T14:59:00Z');  // Same UTC day

      const roundedClockIn = new Date('2025-11-03T14:48:00Z');    // Same UTC day
      const roundedClockOut = new Date('2025-11-04T00:00:00Z');   // Next UTC day - crosses midnight

      expect(
        crossesMidnightAfterRounding(originalClockIn, originalClockOut, roundedClockIn, roundedClockOut)
      ).toBe(true);
    });

    it('should return false if no midnight crossing', () => {
      const originalClockIn = new Date('2025-11-03T09:00:00Z');
      const originalClockOut = new Date('2025-11-03T11:00:00Z');

      const roundedClockIn = new Date('2025-11-03T09:00:00Z');
      const roundedClockOut = new Date('2025-11-03T11:00:00Z');

      expect(
        crossesMidnightAfterRounding(originalClockIn, originalClockOut, roundedClockIn, roundedClockOut)
      ).toBe(false);
    });
  });

  describe('meetsMinimumDuration', () => {
    it('should return true for duration >= 15 minutes', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T09:15:00Z');

      expect(meetsMinimumDuration(clockIn, clockOut)).toBe(true);
    });

    it('should return false for duration < 15 minutes', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T09:10:00Z'); // Only 10 minutes

      expect(meetsMinimumDuration(clockIn, clockOut)).toBe(false);
    });

    it('should accept custom minimum duration', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T09:10:00Z');

      expect(meetsMinimumDuration(clockIn, clockOut, 10)).toBe(true);
      expect(meetsMinimumDuration(clockIn, clockOut, 15)).toBe(false);
    });
  });

  describe('withinMaximumDuration', () => {
    it('should return true for reasonable duration', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T17:00:00Z'); // 8 hours

      expect(withinMaximumDuration(clockIn, clockOut)).toBe(true);
    });

    it('should return false for > 24 hours (forgot to clock out)', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-04T10:00:00Z'); // 25 hours

      expect(withinMaximumDuration(clockIn, clockOut)).toBe(false);
    });

    it('should accept custom maximum duration', () => {
      const clockIn = new Date('2025-11-03T09:00:00Z');
      const clockOut = new Date('2025-11-03T20:00:00Z'); // 11 hours

      expect(withinMaximumDuration(clockIn, clockOut, 12)).toBe(true);
      expect(withinMaximumDuration(clockIn, clockOut, 10)).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format hours and minutes', () => {
      expect(formatDuration(150)).toBe('2h 30m');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(60)).toBe('1h');
    });
  });

  describe('minutesToDecimalHours', () => {
    it('should convert minutes to decimal hours', () => {
      expect(minutesToDecimalHours(60)).toBe(1.0);
      expect(minutesToDecimalHours(90)).toBe(1.5);
      expect(minutesToDecimalHours(45)).toBe(0.75);
      expect(minutesToDecimalHours(120)).toBe(2.0);
    });

    it('should round to 2 decimal places', () => {
      expect(minutesToDecimalHours(7)).toBe(0.12); // 7/60 = 0.11666...
    });
  });

  describe('decimalHoursToMinutes', () => {
    it('should convert decimal hours to minutes', () => {
      expect(decimalHoursToMinutes(1.0)).toBe(60);
      expect(decimalHoursToMinutes(1.5)).toBe(90);
      expect(decimalHoursToMinutes(0.75)).toBe(45);
      expect(decimalHoursToMinutes(2.0)).toBe(120);
    });

    it('should round to nearest minute', () => {
      expect(decimalHoursToMinutes(0.12)).toBe(7);
    });
  });

  describe('Constants', () => {
    it('should have correct rounding intervals', () => {
      expect(ROUNDING_INTERVALS.SIX_MINUTE).toBe(6);
      expect(ROUNDING_INTERVALS.FIFTEEN_MINUTE).toBe(15);
    });

    it('should have correct billing unit minutes', () => {
      expect(BILLING_UNIT_MINUTES).toBe(15);
    });
  });

  describe('Edge Cases', () => {
    it('should handle midnight boundary correctly', () => {
      // Use UTC time to test midnight boundary
      const time = new Date('2025-11-03T23:58:00Z'); // UTC 23:58
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'nearest', preserveMidnight: true });

      // Should round to 00:00 of next day (UTC)
      expect(result.roundedTime.getUTCDate()).toBe(4);
      expect(result.roundedTime.getUTCHours()).toBe(0);
      expect(result.roundedTime.getUTCMinutes()).toBe(0);
    });

    it('should handle ISO string input', () => {
      const result = roundTime('2025-11-03T09:07:00Z', { roundingMinutes: 6, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCMinutes()).toBe(6);
    });

    it('should throw error for invalid time', () => {
      expect(() => roundTime('invalid-date', { roundingMinutes: 6, roundingMode: 'nearest' })).toThrow('Invalid time');
    });

    it('should throw error for invalid rounding minutes', () => {
      expect(() => roundTime(new Date(), { roundingMinutes: 10, roundingMode: 'nearest' })).toThrow(
        'Invalid rounding minutes'
      );
    });

    it('should handle seconds in original time', () => {
      const time = new Date('2025-11-03T09:07:30Z'); // 7 minutes 30 seconds
      const result = roundTime(time, { roundingMinutes: 6, roundingMode: 'nearest' });

      expect(result.roundedTime.getUTCSeconds()).toBe(0); // Seconds should be zeroed
    });
  });
});
