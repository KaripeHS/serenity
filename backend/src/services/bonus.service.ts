/**
 * Caregiver Bonus Service
 * Implements the Serenity Caregiver Bonus Policy
 *
 * Bonus Components:
 * 1. 90-Day Bonus: $150 one-time after 90 days
 * 2. Show Up Bonus: $100/quarter (95% shifts, 95% EVV, 0 NCNS, 0 complaints)
 * 3. Hours Bonus: 1% of annual earnings (50% June, 50% December)
 * 4. Loyalty Bonus: $200-$500 on anniversary
 *
 * @module services/bonus
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const db = getDbClient();
const logger = createLogger('bonus-service');

// ============================================================================
// TYPES
// ============================================================================

export interface BonusConfiguration {
  ninetyDayBonusAmount: number;
  ninetyDayBonusEnabled: boolean;
  showUpBonusAmount: number;
  showUpBonusEnabled: boolean;
  showUpShiftThreshold: number;
  showUpEvvThreshold: number;
  hoursBonusPercentage: number;
  hoursBonusEnabled: boolean;
  loyaltyBonusEnabled: boolean;
  loyaltyBonusYear1: number;
  loyaltyBonusYear2: number;
  loyaltyBonusYear3: number;
  loyaltyBonusYear4: number;
  loyaltyBonusYear5Plus: number;
}

export interface ShowUpEligibility {
  isEligible: boolean;
  shiftPercentage: number;
  evvPercentage: number;
  ncnsCount: number;
  complaintsCount: number;
  disqualificationReasons: string[];
  bonusAmount: number;
}

export interface NinetyDayEligibility {
  isEligible: boolean;
  hireDate: Date;
  ninetyDayDate: Date;
  daysEmployed: number;
  inGoodStanding: boolean;
  shiftPercentage: number;
  evvPercentage: number;
  ncnsCount: number;
  complaintsCount: number;
  disqualificationReasons: string[];
  bonusAmount: number;
}

export interface HoursBonusCalculation {
  totalHoursWorked: number;
  hourlyRate: number;
  grossEarnings: number;
  bonusPercentage: number;
  totalBonus: number;
  juneInstallment: number;
  decemberInstallment: number;
}

export interface LoyaltyBonusEligibility {
  isEligible: boolean;
  hireDate: Date;
  anniversaryDate: Date;
  yearsOfService: number;
  bonusAmount: number;
}

export interface CaregiverBonusSummary {
  caregiverId: string;
  caregiverName: string;
  hireDate: Date;
  currentQuarter: string;
  ninetyDayBonus: NinetyDayEligibility | null;
  showUpBonus: ShowUpEligibility;
  hoursBonus: HoursBonusCalculation;
  loyaltyBonus: LoyaltyBonusEligibility | null;
  totalPotentialBonus: number;
  totalEarnedYTD: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get bonus configuration for an organization
 */
export async function getBonusConfiguration(organizationId: string): Promise<BonusConfiguration> {
  const result = await db.query(`
    SELECT * FROM bonus_configurations
    WHERE organization_id = $1
  `, [organizationId]);

  if (result.rows.length === 0) {
    // Return defaults
    return {
      ninetyDayBonusAmount: 150,
      ninetyDayBonusEnabled: true,
      showUpBonusAmount: 100,
      showUpBonusEnabled: true,
      showUpShiftThreshold: 95,
      showUpEvvThreshold: 95,
      hoursBonusPercentage: 0.01,
      hoursBonusEnabled: true,
      loyaltyBonusEnabled: true,
      loyaltyBonusYear1: 200,
      loyaltyBonusYear2: 300,
      loyaltyBonusYear3: 400,
      loyaltyBonusYear4: 400,
      loyaltyBonusYear5Plus: 500
    };
  }

  const config = result.rows[0];
  return {
    ninetyDayBonusAmount: parseFloat(config.ninety_day_bonus_amount),
    ninetyDayBonusEnabled: config.ninety_day_bonus_enabled,
    showUpBonusAmount: parseFloat(config.show_up_bonus_amount),
    showUpBonusEnabled: config.show_up_bonus_enabled,
    showUpShiftThreshold: parseFloat(config.show_up_shift_threshold),
    showUpEvvThreshold: parseFloat(config.show_up_evv_threshold),
    hoursBonusPercentage: parseFloat(config.hours_bonus_percentage),
    hoursBonusEnabled: config.hours_bonus_enabled,
    loyaltyBonusEnabled: config.loyalty_bonus_enabled,
    loyaltyBonusYear1: parseFloat(config.loyalty_bonus_year_1),
    loyaltyBonusYear2: parseFloat(config.loyalty_bonus_year_2),
    loyaltyBonusYear3: parseFloat(config.loyalty_bonus_year_3),
    loyaltyBonusYear4: parseFloat(config.loyalty_bonus_year_4),
    loyaltyBonusYear5Plus: parseFloat(config.loyalty_bonus_year_5_plus)
  };
}

// ============================================================================
// QUARTER UTILITIES
// ============================================================================

/**
 * Get quarter boundaries
 */
export function getQuarterDates(year: number, quarter: number): { start: Date; end: Date; label: string } {
  const quarters: Record<number, { start: string; end: string }> = {
    1: { start: `${year}-01-01`, end: `${year}-03-31` },
    2: { start: `${year}-04-01`, end: `${year}-06-30` },
    3: { start: `${year}-07-01`, end: `${year}-09-30` },
    4: { start: `${year}-10-01`, end: `${year}-12-31` }
  };

  return {
    start: new Date(quarters[quarter].start),
    end: new Date(quarters[quarter].end),
    label: `Q${quarter} ${year}`
  };
}

/**
 * Get current quarter
 */
export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month <= 3) return { year, quarter: 1 };
  if (month <= 6) return { year, quarter: 2 };
  if (month <= 9) return { year, quarter: 3 };
  return { year, quarter: 4 };
}

// ============================================================================
// 90-DAY BONUS
// ============================================================================

/**
 * Check 90-day bonus eligibility
 */
export async function check90DayEligibility(
  organizationId: string,
  caregiverId: string
): Promise<NinetyDayEligibility> {
  const config = await getBonusConfiguration(organizationId);

  // Get caregiver info
  const caregiverResult = await db.query(`
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.created_at as hire_date,
      u.status,
      COALESCE(c.disciplinary_action_active, FALSE) as has_disciplinary_action
    FROM users u
    LEFT JOIN caregivers c ON u.id = c.user_id
    WHERE u.id = $1
  `, [caregiverId]);

  if (caregiverResult.rows.length === 0) {
    throw new Error('Caregiver not found');
  }

  const caregiver = caregiverResult.rows[0];
  const hireDate = new Date(caregiver.hire_date);
  const ninetyDayDate = new Date(hireDate);
  ninetyDayDate.setDate(ninetyDayDate.getDate() + 90);

  const daysEmployed = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24));

  const disqualificationReasons: string[] = [];
  let isEligible = true;

  // Check if already received
  const alreadyReceived = await db.query(`
    SELECT id FROM bonus_payouts
    WHERE caregiver_id = $1 AND bonus_type = 'ninety_day' AND status IN ('paid', 'scheduled', 'approved')
  `, [caregiverId]);

  if (alreadyReceived.rows.length > 0) {
    return {
      isEligible: false,
      hireDate,
      ninetyDayDate,
      daysEmployed,
      inGoodStanding: true,
      shiftPercentage: 0,
      evvPercentage: 0,
      ncnsCount: 0,
      complaintsCount: 0,
      disqualificationReasons: ['Already received 90-day bonus'],
      bonusAmount: 0
    };
  }

  // Check days employed
  if (daysEmployed < 90) {
    isEligible = false;
    disqualificationReasons.push(`Only ${daysEmployed} days employed (need 90)`);
  }

  // Check good standing
  const inGoodStanding = caregiver.status === 'active' && !caregiver.has_disciplinary_action;
  if (!inGoodStanding) {
    isEligible = false;
    disqualificationReasons.push('Not in good standing (disciplinary action or inactive)');
  }

  // Calculate metrics for first 90 days
  const periodEnd = new Date(Math.min(ninetyDayDate.getTime(), Date.now()));

  // Get shift attendance
  const shiftResult = await db.query(`
    SELECT * FROM calculate_shift_attendance($1, $2, $3)
  `, [caregiverId, hireDate.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]]);

  const shiftPct = parseFloat(shiftResult.rows[0]?.attendance_percentage || 0);

  // Get EVV compliance
  const evvResult = await db.query(`
    SELECT * FROM calculate_evv_compliance($1, $2, $3)
  `, [caregiverId, hireDate.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]]);

  const evvPct = parseFloat(evvResult.rows[0]?.compliance_percentage || 0);

  // Get NCNS count
  const ncnsResult = await db.query(`
    SELECT count_ncns($1, $2, $3) as count
  `, [caregiverId, hireDate.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]]);

  const ncnsCount = parseInt(ncnsResult.rows[0]?.count || 0);

  // Get complaints count
  const complaintsResult = await db.query(`
    SELECT count_substantiated_complaints($1, $2, $3) as count
  `, [caregiverId, hireDate.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]]);

  const complaintsCount = parseInt(complaintsResult.rows[0]?.count || 0);

  // Check criteria
  if (shiftPct < config.showUpShiftThreshold) {
    isEligible = false;
    disqualificationReasons.push(`Shift attendance ${shiftPct.toFixed(2)}% below ${config.showUpShiftThreshold}%`);
  }

  if (evvPct < config.showUpEvvThreshold) {
    isEligible = false;
    disqualificationReasons.push(`EVV compliance ${evvPct.toFixed(2)}% below ${config.showUpEvvThreshold}%`);
  }

  if (ncnsCount > 0) {
    isEligible = false;
    disqualificationReasons.push(`${ncnsCount} no-call/no-show incident(s)`);
  }

  if (complaintsCount > 0) {
    isEligible = false;
    disqualificationReasons.push(`${complaintsCount} substantiated complaint(s)`);
  }

  return {
    isEligible,
    hireDate,
    ninetyDayDate,
    daysEmployed,
    inGoodStanding,
    shiftPercentage: shiftPct,
    evvPercentage: evvPct,
    ncnsCount,
    complaintsCount,
    disqualificationReasons,
    bonusAmount: isEligible ? config.ninetyDayBonusAmount : 0
  };
}

// ============================================================================
// SHOW UP BONUS
// ============================================================================

/**
 * Check Show Up bonus eligibility for a quarter
 */
export async function checkShowUpEligibility(
  organizationId: string,
  caregiverId: string,
  year?: number,
  quarter?: number
): Promise<ShowUpEligibility> {
  const config = await getBonusConfiguration(organizationId);

  // Default to current quarter
  const current = getCurrentQuarter();
  const targetYear = year || current.year;
  const targetQuarter = quarter || current.quarter;

  const { start, end } = getQuarterDates(targetYear, targetQuarter);

  // Use the database function
  const result = await db.query(`
    SELECT * FROM check_show_up_eligibility($1, $2, $3, $4, $5)
  `, [
    caregiverId,
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0],
    config.showUpShiftThreshold,
    config.showUpEvvThreshold
  ]);

  const row = result.rows[0];

  return {
    isEligible: row.is_eligible,
    shiftPercentage: parseFloat(row.shift_percentage || 0),
    evvPercentage: parseFloat(row.evv_percentage || 0),
    ncnsCount: parseInt(row.ncns_count || 0),
    complaintsCount: parseInt(row.complaints_count || 0),
    disqualificationReasons: row.disqualification_reasons || [],
    bonusAmount: row.is_eligible ? config.showUpBonusAmount : 0
  };
}

// ============================================================================
// HOURS BONUS
// ============================================================================

/**
 * Calculate Hours Bonus for a year
 */
export async function calculateHoursBonus(
  organizationId: string,
  caregiverId: string,
  year?: number
): Promise<HoursBonusCalculation> {
  const config = await getBonusConfiguration(organizationId);
  const targetYear = year || new Date().getFullYear() - 1; // Default to prior year

  // Get total hours and current rate
  const result = await db.query(`
    SELECT
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (e.clock_out_time - e.clock_in_time)) / 3600
      ), 0) as total_hours,
      (
        SELECT COALESCE(pr.rate, 15.00)
        FROM pay_rates pr
        WHERE pr.user_id = $1
        ORDER BY pr.effective_date DESC
        LIMIT 1
      ) as hourly_rate
    FROM evv_records e
    JOIN shifts s ON e.shift_id = s.id
    WHERE s.caregiver_id = $1
      AND EXTRACT(YEAR FROM e.visit_date) = $2
      AND e.clock_in_time IS NOT NULL
      AND e.clock_out_time IS NOT NULL
  `, [caregiverId, targetYear]);

  const totalHours = parseFloat(result.rows[0]?.total_hours || 0);
  const hourlyRate = parseFloat(result.rows[0]?.hourly_rate || 15.00);

  const grossEarnings = totalHours * hourlyRate;
  const totalBonus = grossEarnings * config.hoursBonusPercentage;

  return {
    totalHoursWorked: Math.round(totalHours * 100) / 100,
    hourlyRate,
    grossEarnings: Math.round(grossEarnings * 100) / 100,
    bonusPercentage: config.hoursBonusPercentage * 100,
    totalBonus: Math.round(totalBonus * 100) / 100,
    juneInstallment: Math.round(totalBonus * 50) / 100, // 50%
    decemberInstallment: Math.round(totalBonus * 50) / 100 // 50%
  };
}

// ============================================================================
// LOYALTY BONUS
// ============================================================================

/**
 * Check Loyalty Bonus eligibility
 */
export async function checkLoyaltyEligibility(
  organizationId: string,
  caregiverId: string
): Promise<LoyaltyBonusEligibility> {
  const config = await getBonusConfiguration(organizationId);

  // Get hire date
  const result = await db.query(`
    SELECT created_at as hire_date FROM users WHERE id = $1
  `, [caregiverId]);

  if (result.rows.length === 0) {
    throw new Error('Caregiver not found');
  }

  const hireDate = new Date(result.rows[0].hire_date);
  const now = new Date();

  // Calculate years of service
  let yearsOfService = now.getFullYear() - hireDate.getFullYear();
  const monthDiff = now.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) {
    yearsOfService--;
  }

  // Calculate next anniversary
  const nextAnniversary = new Date(hireDate);
  nextAnniversary.setFullYear(now.getFullYear());
  if (nextAnniversary < now) {
    nextAnniversary.setFullYear(now.getFullYear() + 1);
  }

  // Determine bonus amount based on years
  let bonusAmount = 0;
  if (yearsOfService >= 5) {
    bonusAmount = config.loyaltyBonusYear5Plus;
  } else if (yearsOfService === 4) {
    bonusAmount = config.loyaltyBonusYear4;
  } else if (yearsOfService === 3) {
    bonusAmount = config.loyaltyBonusYear3;
  } else if (yearsOfService === 2) {
    bonusAmount = config.loyaltyBonusYear2;
  } else if (yearsOfService === 1) {
    bonusAmount = config.loyaltyBonusYear1;
  }

  return {
    isEligible: yearsOfService >= 1,
    hireDate,
    anniversaryDate: nextAnniversary,
    yearsOfService,
    bonusAmount
  };
}

// ============================================================================
// COMPLETE BONUS SUMMARY
// ============================================================================

/**
 * Get complete bonus summary for a caregiver
 */
export async function getCaregiverBonusSummary(
  organizationId: string,
  caregiverId: string
): Promise<CaregiverBonusSummary> {
  // Get caregiver info
  const caregiverResult = await db.query(`
    SELECT id, first_name, last_name, created_at as hire_date
    FROM users WHERE id = $1
  `, [caregiverId]);

  if (caregiverResult.rows.length === 0) {
    throw new Error('Caregiver not found');
  }

  const caregiver = caregiverResult.rows[0];
  const hireDate = new Date(caregiver.hire_date);
  const daysEmployed = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24));

  const current = getCurrentQuarter();
  const { label: currentQuarterLabel } = getQuarterDates(current.year, current.quarter);

  // Get all bonus components
  const ninetyDayBonus = daysEmployed <= 120 // Only show if within ~4 months of hire
    ? await check90DayEligibility(organizationId, caregiverId)
    : null;

  const showUpBonus = await checkShowUpEligibility(organizationId, caregiverId);
  const hoursBonus = await calculateHoursBonus(organizationId, caregiverId);
  const loyaltyBonus = await checkLoyaltyEligibility(organizationId, caregiverId);

  // Calculate totals
  const totalPotentialBonus =
    (ninetyDayBonus?.bonusAmount || 0) +
    (showUpBonus.bonusAmount * 4) + // Annual Show Up potential
    hoursBonus.totalBonus +
    (loyaltyBonus.isEligible ? loyaltyBonus.bonusAmount : 0);

  // Get YTD earned
  const ytdResult = await db.query(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM bonus_payouts
    WHERE caregiver_id = $1
      AND status = 'paid'
      AND EXTRACT(YEAR FROM actual_payout_date) = $2
  `, [caregiverId, current.year]);

  const totalEarnedYTD = parseFloat(ytdResult.rows[0]?.total || 0);

  return {
    caregiverId,
    caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
    hireDate,
    currentQuarter: currentQuarterLabel,
    ninetyDayBonus,
    showUpBonus,
    hoursBonus,
    loyaltyBonus: loyaltyBonus.isEligible ? loyaltyBonus : null,
    totalPotentialBonus: Math.round(totalPotentialBonus * 100) / 100,
    totalEarnedYTD
  };
}

// ============================================================================
// NCNS & COMPLAINTS MANAGEMENT
// ============================================================================

/**
 * Record a no-call/no-show incident
 */
export async function recordNCNS(
  organizationId: string,
  caregiverId: string,
  shiftId: string,
  scheduledDate: Date,
  scheduledStartTime: string,
  incidentType: 'no_call_no_show' | 'late_cancel',
  reportedBy: string,
  notes?: string
): Promise<string> {
  const result = await db.query(`
    INSERT INTO no_call_no_shows (
      organization_id, caregiver_id, shift_id,
      scheduled_date, scheduled_start_time, incident_type,
      reported_by, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    organizationId, caregiverId, shiftId,
    scheduledDate.toISOString().split('T')[0],
    scheduledStartTime, incidentType,
    reportedBy, notes
  ]);

  logger.info('NCNS recorded', {
    organizationId,
    caregiverId,
    incidentType,
    scheduledDate
  });

  return result.rows[0].id;
}

/**
 * Excuse an NCNS incident
 */
export async function excuseNCNS(
  ncnsId: string,
  excusedBy: string,
  reason: string
): Promise<void> {
  await db.query(`
    UPDATE no_call_no_shows
    SET excused = TRUE, excused_reason = $1, excused_by = $2, excused_at = NOW()
    WHERE id = $3
  `, [reason, excusedBy, ncnsId]);

  logger.info('NCNS excused', { ncnsId, excusedBy });
}

/**
 * Record a client complaint
 */
export async function recordComplaint(
  organizationId: string,
  caregiverId: string,
  clientId: string | null,
  complaintDate: Date,
  complaintType: string,
  description: string,
  reportedBy: string,
  reportedByRelationship: string
): Promise<string> {
  const result = await db.query(`
    INSERT INTO client_complaints (
      organization_id, caregiver_id, client_id,
      complaint_date, complaint_type, description,
      reported_by, reported_by_relationship
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    organizationId, caregiverId, clientId,
    complaintDate.toISOString().split('T')[0],
    complaintType, description,
    reportedBy, reportedByRelationship
  ]);

  logger.info('Complaint recorded', {
    organizationId,
    caregiverId,
    complaintType
  });

  return result.rows[0].id;
}

/**
 * Update complaint investigation status
 */
export async function updateComplaintStatus(
  complaintId: string,
  status: 'investigating' | 'substantiated' | 'unsubstantiated' | 'dismissed',
  investigatedBy: string,
  investigationNotes: string,
  resolution?: string
): Promise<void> {
  const affectsBonus = status === 'substantiated';

  // Get quarter for the complaint
  const complaintResult = await db.query(`
    SELECT complaint_date FROM client_complaints WHERE id = $1
  `, [complaintId]);

  const complaintDate = new Date(complaintResult.rows[0].complaint_date);
  const month = complaintDate.getMonth() + 1;
  let bonusPeriodAffected = '';
  if (month <= 3) bonusPeriodAffected = 'Q1';
  else if (month <= 6) bonusPeriodAffected = 'Q2';
  else if (month <= 9) bonusPeriodAffected = 'Q3';
  else bonusPeriodAffected = 'Q4';

  await db.query(`
    UPDATE client_complaints SET
      status = $1,
      investigated_by = $2,
      investigated_at = NOW(),
      investigation_notes = $3,
      resolution = $4,
      resolved_at = CASE WHEN $1 IN ('substantiated', 'unsubstantiated', 'dismissed') THEN NOW() ELSE resolved_at END,
      affects_bonus = $5,
      bonus_period_affected = $6,
      updated_at = NOW()
    WHERE id = $7
  `, [status, investigatedBy, investigationNotes, resolution, affectsBonus, bonusPeriodAffected, complaintId]);

  logger.info('Complaint status updated', { complaintId, status, affectsBonus });
}

// ============================================================================
// PAYOUT MANAGEMENT
// ============================================================================

/**
 * Create a bonus payout record
 */
export async function createBonusPayout(
  organizationId: string,
  caregiverId: string,
  bonusType: string,
  periodLabel: string,
  amount: number,
  scheduledPayoutDate: Date,
  eligibilityId?: string
): Promise<string> {
  const result = await db.query(`
    INSERT INTO bonus_payouts (
      organization_id, caregiver_id, eligibility_id,
      bonus_type, period_label, amount,
      scheduled_payout_date, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
    RETURNING id
  `, [
    organizationId, caregiverId, eligibilityId,
    bonusType, periodLabel, amount,
    scheduledPayoutDate.toISOString().split('T')[0]
  ]);

  logger.info('Bonus payout created', {
    organizationId,
    caregiverId,
    bonusType,
    amount
  });

  return result.rows[0].id;
}

/**
 * Approve a bonus payout
 */
export async function approveBonusPayout(
  payoutId: string,
  approvedBy: string
): Promise<void> {
  await db.query(`
    UPDATE bonus_payouts
    SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
    WHERE id = $2
  `, [approvedBy, payoutId]);

  logger.info('Bonus payout approved', { payoutId, approvedBy });
}

/**
 * Mark a bonus as paid
 */
export async function markBonusPaid(
  payoutId: string,
  payrollReference: string
): Promise<void> {
  await db.query(`
    UPDATE bonus_payouts
    SET status = 'paid',
        actual_payout_date = CURRENT_DATE,
        payroll_reference = $1,
        employment_verified = TRUE,
        employment_verified_at = NOW(),
        updated_at = NOW()
    WHERE id = $2
  `, [payrollReference, payoutId]);

  logger.info('Bonus marked as paid', { payoutId, payrollReference });
}

export default {
  getBonusConfiguration,
  check90DayEligibility,
  checkShowUpEligibility,
  calculateHoursBonus,
  checkLoyaltyEligibility,
  getCaregiverBonusSummary,
  recordNCNS,
  excuseNCNS,
  recordComplaint,
  updateComplaintStatus,
  createBonusPayout,
  approveBonusPayout,
  markBonusPaid,
  getQuarterDates,
  getCurrentQuarter
};
