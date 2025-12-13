/**
 * Caregiver Bonus Routes
 * API endpoints for the Serenity Caregiver Bonus Program
 *
 * @module api/routes/console/bonus
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import BonusService from '../../../services/bonus.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const db = getDbClient();
const logger = createLogger('bonus-routes');

// ============================================================================
// BONUS CONFIGURATION
// ============================================================================

/**
 * GET /api/console/bonus/config
 * Get bonus configuration for the organization
 */
router.get('/config', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const config = await BonusService.getBonusConfiguration(organizationId);

    res.json({
      config,
      policyReference: {
        ninetyDayBonus: {
          amount: config.ninetyDayBonusAmount,
          criteria: [
            'Employed continuously for 90 calendar days',
            'In good standing (no active disciplinary action)',
            `Worked ≥${config.showUpShiftThreshold}% of scheduled shifts`,
            `≥${config.showUpEvvThreshold}% clean EVV`,
            'Zero no-call/no-shows',
            'Zero substantiated complaints'
          ]
        },
        showUpBonus: {
          amount: config.showUpBonusAmount,
          frequency: 'quarterly',
          criteria: [
            `Worked ≥${config.showUpShiftThreshold}% of scheduled shifts`,
            `≥${config.showUpEvvThreshold}% clean EVV`,
            'Zero no-call/no-shows',
            'Zero substantiated complaints'
          ],
          payoutMonths: ['April', 'July', 'October', 'January']
        },
        hoursBonus: {
          percentage: config.hoursBonusPercentage * 100,
          formula: 'Total Hours × Hourly Rate × 1%',
          payoutSchedule: '50% in June, 50% in December'
        },
        loyaltyBonus: {
          amounts: {
            year1: config.loyaltyBonusYear1,
            year2: config.loyaltyBonusYear2,
            year3: config.loyaltyBonusYear3,
            year4: config.loyaltyBonusYear4,
            year5Plus: config.loyaltyBonusYear5Plus
          },
          payoutTiming: 'On anniversary date'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/bonus/config
 * Update bonus configuration (admin only)
 */
router.put('/config', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const updates = req.body;

    // Check for existing config
    const existing = await db.query(`
      SELECT id FROM bonus_configurations WHERE organization_id = $1
    `, [organizationId]);

    if (existing.rows.length === 0) {
      // Create new
      await db.query(`
        INSERT INTO bonus_configurations (
          organization_id,
          ninety_day_bonus_amount,
          ninety_day_bonus_enabled,
          show_up_bonus_amount,
          show_up_bonus_enabled,
          show_up_shift_threshold,
          show_up_evv_threshold,
          hours_bonus_percentage,
          hours_bonus_enabled,
          loyalty_bonus_enabled,
          loyalty_bonus_year_1,
          loyalty_bonus_year_2,
          loyalty_bonus_year_3,
          loyalty_bonus_year_4,
          loyalty_bonus_year_5_plus
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        organizationId,
        updates.ninetyDayBonusAmount || 150,
        updates.ninetyDayBonusEnabled ?? true,
        updates.showUpBonusAmount || 100,
        updates.showUpBonusEnabled ?? true,
        updates.showUpShiftThreshold || 95,
        updates.showUpEvvThreshold || 95,
        updates.hoursBonusPercentage || 0.01,
        updates.hoursBonusEnabled ?? true,
        updates.loyaltyBonusEnabled ?? true,
        updates.loyaltyBonusYear1 || 200,
        updates.loyaltyBonusYear2 || 300,
        updates.loyaltyBonusYear3 || 400,
        updates.loyaltyBonusYear4 || 400,
        updates.loyaltyBonusYear5Plus || 500
      ]);
    } else {
      // Update existing
      await db.query(`
        UPDATE bonus_configurations SET
          ninety_day_bonus_amount = COALESCE($2, ninety_day_bonus_amount),
          ninety_day_bonus_enabled = COALESCE($3, ninety_day_bonus_enabled),
          show_up_bonus_amount = COALESCE($4, show_up_bonus_amount),
          show_up_bonus_enabled = COALESCE($5, show_up_bonus_enabled),
          show_up_shift_threshold = COALESCE($6, show_up_shift_threshold),
          show_up_evv_threshold = COALESCE($7, show_up_evv_threshold),
          hours_bonus_percentage = COALESCE($8, hours_bonus_percentage),
          hours_bonus_enabled = COALESCE($9, hours_bonus_enabled),
          loyalty_bonus_enabled = COALESCE($10, loyalty_bonus_enabled),
          loyalty_bonus_year_1 = COALESCE($11, loyalty_bonus_year_1),
          loyalty_bonus_year_2 = COALESCE($12, loyalty_bonus_year_2),
          loyalty_bonus_year_3 = COALESCE($13, loyalty_bonus_year_3),
          loyalty_bonus_year_4 = COALESCE($14, loyalty_bonus_year_4),
          loyalty_bonus_year_5_plus = COALESCE($15, loyalty_bonus_year_5_plus),
          updated_at = NOW()
        WHERE organization_id = $1
      `, [
        organizationId,
        updates.ninetyDayBonusAmount,
        updates.ninetyDayBonusEnabled,
        updates.showUpBonusAmount,
        updates.showUpBonusEnabled,
        updates.showUpShiftThreshold,
        updates.showUpEvvThreshold,
        updates.hoursBonusPercentage,
        updates.hoursBonusEnabled,
        updates.loyaltyBonusEnabled,
        updates.loyaltyBonusYear1,
        updates.loyaltyBonusYear2,
        updates.loyaltyBonusYear3,
        updates.loyaltyBonusYear4,
        updates.loyaltyBonusYear5Plus
      ]);
    }

    res.json({
      message: 'Bonus configuration updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CAREGIVER BONUS SUMMARY
// ============================================================================

/**
 * GET /api/console/bonus/caregivers/:caregiverId
 * Get complete bonus summary for a caregiver
 */
router.get('/caregivers/:caregiverId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const organizationId = req.user?.organizationId!;

    const summary = await BonusService.getCaregiverBonusSummary(organizationId, caregiverId);

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/bonus/dashboard
 * Get bonus dashboard for all caregivers
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { quarter, year } = req.query;

    const current = BonusService.getCurrentQuarter();
    const targetYear = year ? parseInt(year as string) : current.year;
    const targetQuarter = quarter ? parseInt(quarter as string) : current.quarter;

    const { start, end, label } = BonusService.getQuarterDates(targetYear, targetQuarter);

    // Get all active caregivers
    const caregiversResult = await db.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.created_at as hire_date,
        u.status
      FROM users u
      WHERE u.organization_id = $1
        AND u.role = 'caregiver'
        AND u.status = 'active'
      ORDER BY u.last_name, u.first_name
    `, [organizationId]);

    const caregivers = await Promise.all(
      caregiversResult.rows.map(async (cg: any) => {
        const eligibility = await BonusService.checkShowUpEligibility(
          organizationId!,
          cg.id,
          targetYear,
          targetQuarter
        );

        const daysEmployed = Math.floor(
          (Date.now() - new Date(cg.hire_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: cg.id,
          name: `${cg.first_name} ${cg.last_name}`,
          hireDate: cg.hire_date,
          daysEmployed,
          showUpEligibility: eligibility,
          isNewHire: daysEmployed <= 90
        };
      })
    );

    // Calculate summary stats
    const eligibleCount = caregivers.filter(c => c.showUpEligibility.isEligible).length;
    const totalPotentialPayout = eligibleCount * (await BonusService.getBonusConfiguration(organizationId!)).showUpBonusAmount;

    // Get common disqualification reasons
    const allReasons = caregivers
      .filter(c => !c.showUpEligibility.isEligible)
      .flatMap(c => c.showUpEligibility.disqualificationReasons);

    const reasonCounts = allReasons.reduce((acc: Record<string, number>, reason) => {
      // Simplify reason text
      const key = reason.includes('Shift attendance') ? 'Low Shift Attendance'
        : reason.includes('EVV compliance') ? 'Low EVV Compliance'
        : reason.includes('no-call') ? 'NCNS Incidents'
        : reason.includes('complaint') ? 'Substantiated Complaints'
        : reason;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      period: {
        quarter: targetQuarter,
        year: targetYear,
        label,
        startDate: start,
        endDate: end
      },
      summary: {
        totalCaregivers: caregivers.length,
        eligibleForShowUp: eligibleCount,
        ineligible: caregivers.length - eligibleCount,
        eligibilityRate: caregivers.length > 0
          ? Math.round((eligibleCount / caregivers.length) * 100)
          : 0,
        totalPotentialPayout,
        newHires: caregivers.filter(c => c.isNewHire).length
      },
      disqualificationBreakdown: reasonCounts,
      caregivers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SPECIFIC BONUS ELIGIBILITY CHECKS
// ============================================================================

/**
 * GET /api/console/bonus/caregivers/:caregiverId/90-day
 * Check 90-day bonus eligibility
 */
router.get('/caregivers/:caregiverId/90-day', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const organizationId = req.user?.organizationId!;

    const eligibility = await BonusService.check90DayEligibility(organizationId, caregiverId);

    res.json({
      eligibility,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/bonus/caregivers/:caregiverId/show-up
 * Check Show Up bonus eligibility for current quarter
 */
router.get('/caregivers/:caregiverId/show-up', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const { quarter, year } = req.query;
    const organizationId = req.user?.organizationId!;

    const eligibility = await BonusService.checkShowUpEligibility(
      organizationId,
      caregiverId,
      year ? parseInt(year as string) : undefined,
      quarter ? parseInt(quarter as string) : undefined
    );

    const current = BonusService.getCurrentQuarter();
    const { label } = BonusService.getQuarterDates(
      year ? parseInt(year as string) : current.year,
      quarter ? parseInt(quarter as string) : current.quarter
    );

    res.json({
      period: label,
      eligibility,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/bonus/caregivers/:caregiverId/hours
 * Calculate Hours bonus
 */
router.get('/caregivers/:caregiverId/hours', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const { year } = req.query;
    const organizationId = req.user?.organizationId!;

    const calculation = await BonusService.calculateHoursBonus(
      organizationId,
      caregiverId,
      year ? parseInt(year as string) : undefined
    );

    res.json({
      year: year || new Date().getFullYear() - 1,
      calculation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/bonus/caregivers/:caregiverId/loyalty
 * Check Loyalty bonus eligibility
 */
router.get('/caregivers/:caregiverId/loyalty', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { caregiverId } = req.params;
    const organizationId = req.user?.organizationId!;

    const eligibility = await BonusService.checkLoyaltyEligibility(organizationId, caregiverId);

    res.json({
      eligibility,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// NCNS MANAGEMENT
// ============================================================================

/**
 * GET /api/console/bonus/ncns
 * Get all NCNS incidents for the organization
 */
router.get('/ncns', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { caregiverId, startDate, endDate, excused } = req.query;

    let query = `
      SELECT
        n.*,
        u.first_name || ' ' || u.last_name as caregiver_name,
        eu.first_name || ' ' || eu.last_name as excused_by_name
      FROM no_call_no_shows n
      JOIN users u ON n.caregiver_id = u.id
      LEFT JOIN users eu ON n.excused_by = eu.id
      WHERE n.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (caregiverId) {
      query += ` AND n.caregiver_id = $${paramIndex++}`;
      params.push(caregiverId);
    }

    if (startDate) {
      query += ` AND n.scheduled_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND n.scheduled_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (excused !== undefined) {
      query += ` AND n.excused = $${paramIndex++}`;
      params.push(excused === 'true');
    }

    query += ` ORDER BY n.scheduled_date DESC`;

    const result = await db.query(query, params);

    res.json({
      incidents: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/bonus/ncns
 * Record a new NCNS incident
 */
router.post('/ncns', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.userId!;
    const {
      caregiverId,
      shiftId,
      scheduledDate,
      scheduledStartTime,
      incidentType,
      notes
    } = req.body;

    if (!caregiverId || !scheduledDate || !scheduledStartTime || !incidentType) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const id = await BonusService.recordNCNS(
      organizationId,
      caregiverId,
      shiftId,
      new Date(scheduledDate),
      scheduledStartTime,
      incidentType,
      userId,
      notes
    );

    res.status(201).json({
      id,
      message: 'NCNS incident recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/bonus/ncns/:ncnsId/excuse
 * Excuse an NCNS incident
 */
router.put('/ncns/:ncnsId/excuse', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { ncnsId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId!;

    if (!reason) {
      throw ApiErrors.badRequest('Excuse reason is required');
    }

    await BonusService.excuseNCNS(ncnsId, userId, reason);

    res.json({
      message: 'NCNS incident excused',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COMPLAINTS MANAGEMENT
// ============================================================================

/**
 * GET /api/console/bonus/complaints
 * Get all complaints for the organization
 */
router.get('/complaints', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { caregiverId, status, startDate, endDate } = req.query;

    let query = `
      SELECT
        c.*,
        u.first_name || ' ' || u.last_name as caregiver_name,
        cl.first_name || ' ' || cl.last_name as client_name,
        iu.first_name || ' ' || iu.last_name as investigated_by_name
      FROM client_complaints c
      JOIN users u ON c.caregiver_id = u.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users iu ON c.investigated_by = iu.id
      WHERE c.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (caregiverId) {
      query += ` AND c.caregiver_id = $${paramIndex++}`;
      params.push(caregiverId);
    }

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND c.complaint_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND c.complaint_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY c.complaint_date DESC`;

    const result = await db.query(query, params);

    res.json({
      complaints: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/bonus/complaints
 * Record a new complaint
 */
router.post('/complaints', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId!;
    const {
      caregiverId,
      clientId,
      complaintDate,
      complaintType,
      description,
      reportedBy,
      reportedByRelationship
    } = req.body;

    if (!caregiverId || !complaintDate || !complaintType || !description) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const id = await BonusService.recordComplaint(
      organizationId,
      caregiverId,
      clientId || null,
      new Date(complaintDate),
      complaintType,
      description,
      reportedBy,
      reportedByRelationship
    );

    res.status(201).json({
      id,
      message: 'Complaint recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/bonus/complaints/:complaintId/investigate
 * Update complaint investigation status
 */
router.put('/complaints/:complaintId/investigate', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { complaintId } = req.params;
    const { status, investigationNotes, resolution } = req.body;
    const userId = req.user?.userId!;

    if (!status || !investigationNotes) {
      throw ApiErrors.badRequest('Status and investigation notes are required');
    }

    await BonusService.updateComplaintStatus(
      complaintId,
      status,
      userId,
      investigationNotes,
      resolution
    );

    res.json({
      message: 'Complaint status updated',
      affectsBonus: status === 'substantiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PAYOUTS
// ============================================================================

/**
 * GET /api/console/bonus/payouts
 * Get all bonus payouts
 */
router.get('/payouts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { caregiverId, bonusType, status, year } = req.query;

    let query = `
      SELECT
        p.*,
        u.first_name || ' ' || u.last_name as caregiver_name,
        au.first_name || ' ' || au.last_name as approved_by_name
      FROM bonus_payouts p
      JOIN users u ON p.caregiver_id = u.id
      LEFT JOIN users au ON p.approved_by = au.id
      WHERE p.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (caregiverId) {
      query += ` AND p.caregiver_id = $${paramIndex++}`;
      params.push(caregiverId);
    }

    if (bonusType) {
      query += ` AND p.bonus_type = $${paramIndex++}`;
      params.push(bonusType);
    }

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (year) {
      query += ` AND EXTRACT(YEAR FROM p.scheduled_payout_date) = $${paramIndex++}`;
      params.push(year);
    }

    query += ` ORDER BY p.scheduled_payout_date DESC`;

    const result = await db.query(query, params);

    // Calculate totals
    const totals = result.rows.reduce((acc: any, payout: any) => {
      acc.total += parseFloat(payout.amount);
      acc[payout.status] = (acc[payout.status] || 0) + parseFloat(payout.amount);
      return acc;
    }, { total: 0 });

    res.json({
      payouts: result.rows,
      count: result.rows.length,
      totals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/bonus/payouts
 * Create a new bonus payout
 */
router.post('/payouts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId!;
    const {
      caregiverId,
      bonusType,
      periodLabel,
      amount,
      scheduledPayoutDate,
      eligibilityId
    } = req.body;

    if (!caregiverId || !bonusType || !amount || !scheduledPayoutDate) {
      throw ApiErrors.badRequest('Missing required fields');
    }

    const id = await BonusService.createBonusPayout(
      organizationId,
      caregiverId,
      bonusType,
      periodLabel,
      amount,
      new Date(scheduledPayoutDate),
      eligibilityId
    );

    res.status(201).json({
      id,
      message: 'Bonus payout created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/bonus/payouts/:payoutId/approve
 * Approve a bonus payout
 */
router.put('/payouts/:payoutId/approve', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { payoutId } = req.params;
    const userId = req.user?.userId!;

    await BonusService.approveBonusPayout(payoutId, userId);

    res.json({
      message: 'Bonus payout approved',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/bonus/payouts/:payoutId/paid
 * Mark a bonus as paid
 */
router.put('/payouts/:payoutId/paid', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { payoutId } = req.params;
    const { payrollReference } = req.body;

    if (!payrollReference) {
      throw ApiErrors.badRequest('Payroll reference is required');
    }

    await BonusService.markBonusPaid(payoutId, payrollReference);

    res.json({
      message: 'Bonus marked as paid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PAYOUT CALENDAR
// ============================================================================

/**
 * GET /api/console/bonus/calendar
 * Get bonus payout calendar for the year
 */
router.get('/calendar', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const calendar = [
      { month: 'January', bonusType: 'show_up', description: 'Show Up Bonus for Q4 (Oct-Dec)', periodLabel: `Q4 ${targetYear - 1}` },
      { month: 'April', bonusType: 'show_up', description: 'Show Up Bonus for Q1 (Jan-Mar)', periodLabel: `Q1 ${targetYear}` },
      { month: 'June', bonusType: 'hours', description: 'Hours Bonus (50%) for Prior Year', periodLabel: `Year ${targetYear - 1}` },
      { month: 'July', bonusType: 'show_up', description: 'Show Up Bonus for Q2 (Apr-Jun)', periodLabel: `Q2 ${targetYear}` },
      { month: 'October', bonusType: 'show_up', description: 'Show Up Bonus for Q3 (Jul-Sep)', periodLabel: `Q3 ${targetYear}` },
      { month: 'December', bonusType: 'hours', description: 'Hours Bonus (50%) for Prior Year', periodLabel: `Year ${targetYear - 1}` }
    ];

    // Add rolling bonuses
    const rollingBonuses = [
      { bonusType: '90-day', description: '90-Day Bonus', timing: 'Per hire date - after 90 days employment' },
      { bonusType: 'loyalty', description: 'Loyalty Bonus', timing: 'Per anniversary date' }
    ];

    res.json({
      year: targetYear,
      scheduledPayouts: calendar,
      rollingBonuses,
      keyRules: [
        'Client cancellations do NOT count against caregiver attendance',
        'Employee cancellations with <24 hours notice DO count as missed shifts',
        'All data comes from official systems (EVV, scheduling, payroll)',
        '95% threshold means exactly 95.00% or higher - no rounding',
        'Must be employed on payout date to receive bonus'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
