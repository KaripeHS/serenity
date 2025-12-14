/**
 * Time Rounding Utility for Sandata EVV
 * Implements 6-minute (0.1 hour) rounding for billing compliance
 *
 * Industry Standard:
 * - 6 minutes = 0.1 hour (standard for Medicare/Medicaid billing)
 * - 15 minutes = 0.25 hour (alternate for some payers)
 *
 * Rounding Modes:
 * - nearest: Round to nearest interval (e.g., 7 min → 6 min, 9 min → 12 min)
 * - up: Always round up (ceiling)
 * - down: Always round down (floor)
 *
 * FLSA Compliance:
 * - For PAYROLL, always round to benefit employee (7-minute rule)
 * - For BILLING, configurable rounding per payer requirements
 *
 * @module services/sandata/rounding
 */

import type { RoundingMode, RoundingResult, TimeRoundingOptions } from './types';

/**
 * Round time to nearest billing interval
 *
 * @param time - Time to round (Date object or ISO string)
 * @param options - Rounding options (minutes, mode)
 * @returns Rounding result with original and rounded times
 */
export function roundTime(
  time: Date | string,
  options: TimeRoundingOptions = { roundingMinutes: 6, roundingMode: 'nearest' }
): RoundingResult {
  const { roundingMinutes, roundingMode, preserveMidnight = true } = options;

  // Parse input time
  const originalTime = typeof time === 'string' ? new Date(time) : new Date(time);

  if (isNaN(originalTime.getTime())) {
    throw new Error(`Invalid time: ${time}`);
  }

  // Validate rounding minutes
  if (![6, 15].includes(roundingMinutes)) {
    throw new Error(`Invalid rounding minutes: ${roundingMinutes}. Must be 6 or 15.`);
  }

  // Get minutes and seconds from original time (using UTC to be timezone-agnostic)
  const minutes = originalTime.getUTCMinutes();
  const seconds = originalTime.getUTCSeconds();
  const totalMinutes = minutes + seconds / 60;

  // Calculate rounded minutes based on mode
  let roundedMinutes: number;

  switch (roundingMode) {
    case 'nearest':
      roundedMinutes = roundToNearest(totalMinutes, roundingMinutes);
      break;
    case 'up':
      roundedMinutes = roundUp(totalMinutes, roundingMinutes);
      break;
    case 'down':
      roundedMinutes = roundDown(totalMinutes, roundingMinutes);
      break;
    default:
      throw new Error(`Invalid rounding mode: ${roundingMode}`);
  }

  // Create rounded time (using UTC to be timezone-agnostic)
  const roundedTime = new Date(originalTime);

  // Handle hour overflow manually before setting minutes
  // (setUTCMinutes auto-handles overflow, but we need to know the original hours)
  const hoursToAdd = Math.floor(roundedMinutes / 60);
  const finalMinutes = roundedMinutes % 60;

  if (hoursToAdd > 0) {
    roundedTime.setUTCHours(roundedTime.getUTCHours() + hoursToAdd);
  }
  roundedTime.setUTCMinutes(finalMinutes);
  roundedTime.setUTCSeconds(0);
  roundedTime.setUTCMilliseconds(0);

  // Calculate difference
  const differenceMs = roundedTime.getTime() - originalTime.getTime();
  const differenceMinutes = Math.round(differenceMs / 60000);

  return {
    originalTime,
    roundedTime,
    roundingMinutes,
    roundingMode,
    differenceMinutes,
  };
}

/**
 * Round clock-in and clock-out times for a visit
 *
 * @param clockIn - Clock-in time
 * @param clockOut - Clock-out time
 * @param options - Rounding options
 * @returns Object with rounded clock-in and clock-out
 */
export function roundVisitTimes(
  clockIn: Date | string,
  clockOut: Date | string,
  options: TimeRoundingOptions = { roundingMinutes: 6, roundingMode: 'nearest' }
): {
  clockIn: RoundingResult;
  clockOut: RoundingResult;
  totalMinutesOriginal: number;
  totalMinutesRounded: number;
  billableUnits: number;
} {
  const clockInRounded = roundTime(clockIn, options);
  const clockOutRounded = roundTime(clockOut, options);

  // Calculate durations
  const originalDurationMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const roundedDurationMs = clockOutRounded.roundedTime.getTime() - clockInRounded.roundedTime.getTime();

  const totalMinutesOriginal = Math.round(originalDurationMs / 60000);
  const totalMinutesRounded = Math.round(roundedDurationMs / 60000);

  // Calculate billable units (15-min increments)
  const billableUnits = Math.floor(totalMinutesRounded / 15);

  return {
    clockIn: clockInRounded,
    clockOut: clockOutRounded,
    totalMinutesOriginal,
    totalMinutesRounded,
    billableUnits,
  };
}

/**
 * Calculate billable units from duration in minutes
 * Standard: 15 minutes = 1 unit
 *
 * @param durationMinutes - Duration in minutes
 * @returns Number of billable units
 */
export function calculateBillableUnits(durationMinutes: number): number {
  if (durationMinutes < 0) {
    throw new Error('Duration cannot be negative');
  }

  return Math.floor(durationMinutes / 15);
}

/**
 * Calculate billable units from clock-in and clock-out times
 * (with optional rounding)
 *
 * @param clockIn - Clock-in time
 * @param clockOut - Clock-out time
 * @param applyRounding - Whether to round times first
 * @param roundingOptions - Rounding options
 * @returns Billable units
 */
export function calculateBillableUnitsFromTimes(
  clockIn: Date | string,
  clockOut: Date | string,
  applyRounding: boolean = true,
  roundingOptions?: TimeRoundingOptions
): number {
  if (applyRounding) {
    const rounded = roundVisitTimes(clockIn, clockOut, roundingOptions);
    return rounded.billableUnits;
  } else {
    const durationMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    const durationMinutes = Math.round(durationMs / 60000);
    return calculateBillableUnits(durationMinutes);
  }
}

// ============================================================================
// Rounding Algorithms
// ============================================================================

/**
 * Round to nearest interval
 * Examples (6-min intervals):
 * - 0-3 min → 0 min
 * - 4-9 min → 6 min
 * - 10-15 min → 12 min
 */
function roundToNearest(minutes: number, interval: number): number {
  return Math.round(minutes / interval) * interval;
}

/**
 * Round up (ceiling)
 * Examples (6-min intervals):
 * - 0-6 min → 6 min
 * - 7-12 min → 12 min
 */
function roundUp(minutes: number, interval: number): number {
  return Math.ceil(minutes / interval) * interval;
}

/**
 * Round down (floor)
 * Examples (6-min intervals):
 * - 0-5 min → 0 min
 * - 6-11 min → 6 min
 */
function roundDown(minutes: number, interval: number): number {
  return Math.floor(minutes / interval) * interval;
}

// ============================================================================
// FLSA 7-Minute Rule (for payroll, not billing)
// ============================================================================

/**
 * FLSA 7-minute rounding rule for payroll
 * - 1-7 minutes: round down
 * - 8-14 minutes: round up to 15
 * This is for PAYROLL only, not for Sandata billing
 *
 * @param time - Time to round
 * @returns Rounded time
 */
export function roundFLSA(time: Date | string): RoundingResult {
  const originalTime = typeof time === 'string' ? new Date(time) : new Date(time);
  const minutes = originalTime.getUTCMinutes();
  const seconds = originalTime.getUTCSeconds();

  let roundedMinutes = minutes;

  // Apply 7-minute rule
  const remainder = minutes % 15;
  if (remainder >= 8) {
    roundedMinutes = minutes + (15 - remainder); // Round up
  } else if (remainder >= 1) {
    roundedMinutes = minutes - remainder; // Round down
  }

  const roundedTime = new Date(originalTime);

  // Handle hour overflow manually
  const hoursToAdd = Math.floor(roundedMinutes / 60);
  const finalMinutes = roundedMinutes % 60;

  if (hoursToAdd > 0) {
    roundedTime.setUTCHours(roundedTime.getUTCHours() + hoursToAdd);
  }
  roundedTime.setUTCMinutes(finalMinutes);
  roundedTime.setUTCSeconds(0);
  roundedTime.setUTCMilliseconds(0);

  const differenceMs = roundedTime.getTime() - originalTime.getTime();
  const differenceMinutes = Math.round(differenceMs / 60000);

  return {
    originalTime,
    roundedTime,
    roundingMinutes: 15,
    roundingMode: 'nearest', // Effectively nearest with 7-min threshold
    differenceMinutes,
  };
}

// ============================================================================
// Validation & Edge Cases
// ============================================================================

/**
 * Validate that rounded times don't cross midnight boundary
 * (important for per-diem services)
 *
 * @param clockIn - Clock-in time
 * @param clockOut - Clock-out time
 * @returns True if times are on same calendar day
 */
export function isSameDay(clockIn: Date, clockOut: Date): boolean {
  return (
    clockIn.getUTCFullYear() === clockOut.getUTCFullYear() &&
    clockIn.getUTCMonth() === clockOut.getUTCMonth() &&
    clockIn.getUTCDate() === clockOut.getUTCDate()
  );
}

/**
 * Check if rounding would cause times to cross midnight
 *
 * @param originalClockIn - Original clock-in
 * @param originalClockOut - Original clock-out
 * @param roundedClockIn - Rounded clock-in
 * @param roundedClockOut - Rounded clock-out
 * @returns True if midnight boundary crossed after rounding
 */
export function crossesMidnightAfterRounding(
  originalClockIn: Date,
  originalClockOut: Date,
  roundedClockIn: Date,
  roundedClockOut: Date
): boolean {
  const originalSameDay = isSameDay(originalClockIn, originalClockOut);
  const roundedSameDay = isSameDay(roundedClockIn, roundedClockOut);

  return originalSameDay && !roundedSameDay;
}

/**
 * Validate minimum visit duration
 * Most payers require minimum 15 minutes
 *
 * @param clockIn - Clock-in time
 * @param clockOut - Clock-out time
 * @param minimumMinutes - Minimum duration (default: 15)
 * @returns True if duration meets minimum
 */
export function meetsMinimumDuration(
  clockIn: Date | string,
  clockOut: Date | string,
  minimumMinutes: number = 15
): boolean {
  const durationMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const durationMinutes = durationMs / 60000;

  return durationMinutes >= minimumMinutes;
}

/**
 * Validate maximum visit duration
 * Detect anomalies (e.g., forgot to clock out)
 *
 * @param clockIn - Clock-in time
 * @param clockOut - Clock-out time
 * @param maximumHours - Maximum duration (default: 24 hours)
 * @returns True if duration is within maximum
 */
export function withinMaximumDuration(
  clockIn: Date | string,
  clockOut: Date | string,
  maximumHours: number = 24
): boolean {
  const durationMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const durationHours = durationMs / (60 * 60 * 1000);

  return durationHours <= maximumHours;
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format duration as hours and minutes
 *
 * @param durationMinutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m")
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Convert minutes to decimal hours
 *
 * @param minutes - Minutes to convert
 * @returns Decimal hours (e.g., 90 min → 1.5 hours)
 */
export function minutesToDecimalHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert decimal hours to minutes
 *
 * @param decimalHours - Decimal hours
 * @returns Minutes
 */
export function decimalHoursToMinutes(decimalHours: number): number {
  return Math.round(decimalHours * 60);
}

// ============================================================================
// Constants
// ============================================================================

export const ROUNDING_INTERVALS = {
  SIX_MINUTE: 6, // Standard for most billing
  FIFTEEN_MINUTE: 15, // Alternate for some payers
} as const;

export const BILLING_UNIT_MINUTES = 15; // 1 unit = 15 minutes

// ============================================================================
// Exports
// ============================================================================

export default {
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
};
