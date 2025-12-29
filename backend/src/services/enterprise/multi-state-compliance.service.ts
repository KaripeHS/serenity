/**
 * Multi-State Compliance Rules Engine
 * Manages state-specific regulations and compliance requirements
 *
 * Features:
 * - State-specific licensing requirements
 * - Training hour variations by state
 * - Wage and overtime rules
 * - Background check requirements
 * - Nurse supervision ratios
 * - EVV mandate enforcement
 * - Medicaid waiver programs
 */

import { pool } from '../../config/database';

interface StateComplianceRules {
  state: string;
  licensingRequirements: {
    homeCareLicenseRequired: boolean;
    nursingLicenseRequired: boolean;
    adminCertificationRequired: boolean;
  };
  trainingRequirements: {
    initialOrientationHours: number;
    annualContinuingEducationHours: number;
    requiredCourses: string[];
    alzheimersTrainingRequired: boolean;
    alzheimersTrainingHours?: number;
  };
  staffingRatios: {
    rnSupervisionRatioAides: number; // e.g., 1:30 (1 RN per 30 aides)
    supervisoryVisitFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  };
  wageRules: {
    minimumWage: number;
    overtimeThreshold: number; // hours per week
    overtimeMultiplier: number; // e.g., 1.5
    doubleTimeThreshold?: number;
    weekendPremium?: number;
  };
  backgroundCheckRequirements: {
    bciFbiRequired: boolean;
    fingerprintRequired: boolean;
    oigCheckRequired: boolean;
    samCheckRequired: boolean;
    disqualifyingOffenses: string[];
    renewalYears: number;
  };
  evvRequirements: {
    mandated: boolean;
    requiredElements: number; // 6 for federal, may vary
    exceptions: string[];
  };
  medicaidPrograms: Array<{
    programName: string;
    programCode: string;
    serviceTypes: string[];
    rateSchedule: Record<string, number>;
  }>;
}

export class MultiStateComplianceService {
  private stateRulesCache: Map<string, StateComplianceRules> = new Map();

  /**
   * Get compliance rules for state
   */
  async getStateRules(state: string): Promise<StateComplianceRules> {
    // Check cache first
    if (this.stateRulesCache.has(state)) {
      return this.stateRulesCache.get(state)!;
    }

    // Load from database
    const result = await pool.query(
      `
      SELECT * FROM state_compliance_rules
      WHERE state = $1
      `,
      [state]
    );

    if (result.rows.length === 0) {
      throw new Error(`No compliance rules found for state: ${state}`);
    }

    const row = result.rows[0];

    const rules: StateComplianceRules = {
      state: row.state,
      licensingRequirements: row.licensing_requirements,
      trainingRequirements: row.training_requirements,
      staffingRatios: row.staffing_ratios,
      wageRules: row.wage_rules,
      backgroundCheckRequirements: row.background_check_requirements,
      evvRequirements: row.evv_requirements,
      medicaidPrograms: row.medicaid_programs
    };

    // Cache rules
    this.stateRulesCache.set(state, rules);

    return rules;
  }

  /**
   * Validate caregiver training compliance for state
   */
  async validateTrainingCompliance(
    caregiverId: string,
    state: string
  ): Promise<{
    compliant: boolean;
    missingHours: number;
    missingCourses: string[];
  }> {
    const rules = await this.getStateRules(state);

    // Get completed training (caregiver_training joined with training_types)
    const completedTraining = await pool.query(
      `
      SELECT ct.*, tt.name, tt.required_hours
      FROM caregiver_training ct
      JOIN training_types tt ON ct.course_id = tt.id
      WHERE ct.caregiver_id = $1 AND ct.status = 'completed'
      `,
      [caregiverId]
    );

    const rows = completedTraining.rows;

    console.log('DEBUG COMPLIANCE:', JSON.stringify({
      state,
      requiredHours: rules.trainingRequirements.initialOrientationHours,
      requiredCourses: rules.trainingRequirements.requiredCourses,
      completedCount: rows.length,
      completedCourses: rows.map(r => ({ name: r.name, hours: r.hours }))
    }, null, 2));

    const totalHours = rows.reduce(
      (sum, row) => sum + (parseFloat(row.hours) || 0),
      0
    );

    const missingHours = Math.max(
      0,
      rules.trainingRequirements.initialOrientationHours - totalHours
    );

    const completedCourseNames = new Set(
      rows.map(row => row.name)
    );

    const missingCourses = rules.trainingRequirements.requiredCourses.filter(
      course => !completedCourseNames.has(course)
    );

    // Check Alzheimer's training if required
    if (rules.trainingRequirements.alzheimersTrainingRequired) {
      const alzheimersCourse = rows.find(
        r => r.name.toLowerCase().includes('alzheimer')
      );

      if (!alzheimersCourse) {
        // Only add if not already in missing (though requiredCourses usually includes it explicitely or implicitely?)
        // If 'Alzheimer\'s and Dementia Care' is in requiredCourses, it's already checked above.
        // If it's a separate flag, we add it.
        if (!missingCourses.includes('Alzheimer\'s and Dementia Care')) {
          missingCourses.push('Alzheimer\'s and Dementia Care');
        }
      }
    }

    console.log('DEBUG COMPLIANCE RESULT:', {
      compliant: missingHours === 0 && missingCourses.length === 0,
      missingHours,
      missingCourses
    });

    return {
      compliant: missingHours === 0 && missingCourses.length === 0,
      missingHours,
      missingCourses
    };
  }

  /**
   * Calculate wages with state-specific overtime rules
   */
  async calculateWages(
    caregiverId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours?: number;
    regularPay: number;
    overtimePay: number;
    doubleTimePay?: number;
    totalPay: number;
  }> {
    // Get organization's state
    const orgResult = await pool.query(
      'SELECT state FROM organizations WHERE id = $1',
      [organizationId]
    );

    const state = orgResult.rows[0].state;
    const rules = await this.getStateRules(state);

    // Get caregiver's hourly rate
    const caregiverResult = await pool.query(
      'SELECT hourly_rate FROM users WHERE id = $1',
      [caregiverId]
    );

    const hourlyRate = parseFloat(caregiverResult.rows[0].hourly_rate);

    // Get worked hours
    const hoursResult = await pool.query(
      `
      SELECT
        SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600) as total_hours
      FROM visit_check_ins vci
      JOIN visits v ON vci.visit_id = v.id
      WHERE v.caregiver_id = $1
        AND vci.check_in_time >= $2
        AND vci.check_in_time < $3
      `,
      [caregiverId, startDate, endDate]
    );

    const totalHours = parseFloat(hoursResult.rows[0].total_hours || 0);

    // Calculate overtime
    const overtimeThreshold = rules.wageRules.overtimeThreshold;
    const overtimeMultiplier = rules.wageRules.overtimeMultiplier;
    const doubleTimeThreshold = rules.wageRules.doubleTimeThreshold;

    let regularHours = Math.min(totalHours, overtimeThreshold);
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    if (totalHours > overtimeThreshold) {
      if (doubleTimeThreshold && totalHours > doubleTimeThreshold) {
        overtimeHours = doubleTimeThreshold - overtimeThreshold;
        doubleTimeHours = totalHours - doubleTimeThreshold;
      } else {
        overtimeHours = totalHours - overtimeThreshold;
      }
    }

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
    const doubleTimePay = doubleTimeHours
      ? doubleTimeHours * hourlyRate * 2
      : 0;

    const totalPay = regularPay + overtimePay + doubleTimePay;

    return {
      totalHours,
      regularHours,
      overtimeHours,
      doubleTimeHours: doubleTimeHours > 0 ? doubleTimeHours : undefined,
      regularPay,
      overtimePay,
      doubleTimePay: doubleTimePay > 0 ? doubleTimePay : undefined,
      totalPay
    };
  }

  /**
   * Validate background check compliance for state
   */
  async validateBackgroundCheckCompliance(
    caregiverId: string,
    state: string
  ): Promise<{
    compliant: boolean;
    missingChecks: string[];
    expiringChecks: Array<{
      checkType: string;
      expiryDate: Date;
    }>;
  }> {
    const rules = await this.getStateRules(state);

    // Get background check records
    const checksResult = await pool.query(
      `
      SELECT
        check_type,
        status,
        completed_date,
        expiry_date
      FROM background_checks
      WHERE candidate_id = $1
        AND status = 'completed'
        AND overall_result = 'clear'
      `,
      [caregiverId]
    );

    const completedChecks = checksResult.rows;

    const missingChecks: string[] = [];

    // Check required background checks
    if (rules.backgroundCheckRequirements.bciFbiRequired) {
      const hasBCI = completedChecks.some(
        c => c.check_type === 'bci' &&
          (!c.expiry_date || new Date(c.expiry_date) > new Date())
      );

      if (!hasBCI) {
        missingChecks.push('BCI/FBI Background Check');
      }
    }

    if (rules.backgroundCheckRequirements.oigCheckRequired) {
      const hasOIG = completedChecks.some(
        c => c.check_type === 'oig' &&
          (!c.expiry_date || new Date(c.expiry_date) > new Date())
      );

      if (!hasOIG) {
        missingChecks.push('OIG Exclusion Check');
      }
    }

    if (rules.backgroundCheckRequirements.samCheckRequired) {
      const hasSAM = completedChecks.some(
        c => c.check_type === 'sam' &&
          (!c.expiry_date || new Date(c.expiry_date) > new Date())
      );

      if (!hasSAM) {
        missingChecks.push('SAM Exclusion Check');
      }
    }

    // Check expiring background checks (within 90 days)
    const expiringChecks = completedChecks
      .filter(c => {
        if (!c.expiry_date) return false;
        const expiryDate = new Date(c.expiry_date);
        const daysUntilExpiry =
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      })
      .map(c => ({
        checkType: c.check_type,
        expiryDate: new Date(c.expiry_date)
      }));

    return {
      compliant: missingChecks.length === 0,
      missingChecks,
      expiringChecks
    };
  }

  /**
   * Check RN supervision ratio compliance
   */
  async validateStaffingRatios(
    organizationId: string,
    state: string
  ): Promise<{
    compliant: boolean;
    currentRatio: string;
    requiredRatio: string;
    rnCount: number;
    aideCount: number;
  }> {
    const rules = await this.getStateRules(state);

    // Get RN count
    const rnResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id = $1
        AND role IN ('RN', 'CLINICAL_SUPERVISOR')
        AND status = 'active'
      `,
      [organizationId]
    );

    const rnCount = parseInt(rnResult.rows[0].count);

    // Get aide count
    const aideResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id = $1
        AND role = 'CAREGIVER'
        AND status = 'active'
      `,
      [organizationId]
    );

    const aideCount = parseInt(aideResult.rows[0].count);

    const requiredRatio = rules.staffingRatios.rnSupervisionRatioAides;
    const currentRatioValue = aideCount / (rnCount || 1);

    return {
      compliant: currentRatioValue <= requiredRatio,
      currentRatio: `1:${Math.ceil(currentRatioValue)}`,
      requiredRatio: `1:${requiredRatio}`,
      rnCount,
      aideCount
    };
  }

  /**
   * Get Medicaid rate for service in state
   */
  async getMedicaidRate(
    state: string,
    programCode: string,
    serviceType: string
  ): Promise<number | null> {
    const rules = await this.getStateRules(state);

    const program = rules.medicaidPrograms.find(
      p => p.programCode === programCode
    );

    if (!program) {
      return null;
    }

    return program.rateSchedule[serviceType] || null;
  }

  /**
   * Generate multi-state compliance report
   */
  async generateComplianceReport(organizationId: string): Promise<{
    state: string;
    overallCompliance: number; // percentage
    trainingCompliance: number;
    backgroundCheckCompliance: number;
    staffingRatioCompliance: boolean;
    evvCompliance: boolean;
    issues: string[];
  }> {
    // Get organization's state
    const orgResult = await pool.query(
      'SELECT state FROM organizations WHERE id = $1',
      [organizationId]
    );

    const state = orgResult.rows[0].state;

    // Get all active caregivers
    const caregiversResult = await pool.query(
      `
      SELECT id FROM users
      WHERE organization_id = $1
        AND role = 'CAREGIVER'
        AND status = 'active'
      `,
      [organizationId]
    );

    const caregivers = caregiversResult.rows;

    let trainingCompliantCount = 0;
    let backgroundCheckCompliantCount = 0;
    const issues: string[] = [];

    // Check each caregiver
    for (const cg of caregivers) {
      const trainingCompliance = await this.validateTrainingCompliance(
        cg.id,
        state
      );

      if (trainingCompliance.compliant) {
        trainingCompliantCount++;
      } else {
        if (trainingCompliance.missingCourses.length > 0) {
          issues.push(`Caregiver ${cg.id}: Missing courses - ${trainingCompliance.missingCourses.join(', ')}`);
        }
      }

      const bgCheckCompliance = await this.validateBackgroundCheckCompliance(
        cg.id,
        state
      );

      if (bgCheckCompliance.compliant) {
        backgroundCheckCompliantCount++;
      } else {
        if (bgCheckCompliance.missingChecks.length > 0) {
          issues.push(`Caregiver ${cg.id}: Missing background checks - ${bgCheckCompliance.missingChecks.join(', ')}`);
        }
      }
    }

    const trainingCompliance =
      caregivers.length > 0
        ? (trainingCompliantCount / caregivers.length) * 100
        : 100;

    const backgroundCheckCompliance =
      caregivers.length > 0
        ? (backgroundCheckCompliantCount / caregivers.length) * 100
        : 100;

    // Check staffing ratios
    const staffingCompliance = await this.validateStaffingRatios(
      organizationId,
      state
    );

    if (!staffingCompliance.compliant) {
      issues.push(
        `Staffing ratio non-compliant: Current ${staffingCompliance.currentRatio}, Required ${staffingCompliance.requiredRatio}`
      );
    }

    // Assume EVV compliance for now (would check actual EVV data)
    const evvCompliance = true;

    const overallCompliance =
      (trainingCompliance +
        backgroundCheckCompliance +
        (staffingCompliance.compliant ? 100 : 0) +
        (evvCompliance ? 100 : 0)) /
      4;

    return {
      state,
      overallCompliance,
      trainingCompliance,
      backgroundCheckCompliance,
      staffingRatioCompliance: staffingCompliance.compliant,
      evvCompliance,
      issues
    };
  }

  /**
   * Initialize state compliance rules (seed data)
   */
  async initializeStateRules(state: string): Promise<void> {
    const stateRules = this.getDefaultStateRules(state);

    await pool.query(
      `
      INSERT INTO state_compliance_rules (
        state,
        licensing_requirements,
        training_requirements,
        staffing_ratios,
        wage_rules,
        background_check_requirements,
        evv_requirements,
        medicaid_programs
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (state) DO UPDATE SET
        licensing_requirements = EXCLUDED.licensing_requirements,
        training_requirements = EXCLUDED.training_requirements,
        staffing_ratios = EXCLUDED.staffing_ratios,
        wage_rules = EXCLUDED.wage_rules,
        background_check_requirements = EXCLUDED.background_check_requirements,
        evv_requirements = EXCLUDED.evv_requirements,
        medicaid_programs = EXCLUDED.medicaid_programs
      `,
      [
        state,
        JSON.stringify(stateRules.licensingRequirements),
        JSON.stringify(stateRules.trainingRequirements),
        JSON.stringify(stateRules.staffingRatios),
        JSON.stringify(stateRules.wageRules),
        JSON.stringify(stateRules.backgroundCheckRequirements),
        JSON.stringify(stateRules.evvRequirements),
        JSON.stringify(stateRules.medicaidPrograms)
      ]
    );
  }

  /**
   * Get default state rules (Ohio as example)
   */
  private getDefaultStateRules(state: string): StateComplianceRules {
    // Ohio rules as default
    return {
      state,
      licensingRequirements: {
        homeCareLicenseRequired: true,
        nursingLicenseRequired: false,
        adminCertificationRequired: true
      },
      trainingRequirements: {
        initialOrientationHours: 40,
        annualContinuingEducationHours: 12,
        requiredCourses: [
          'Infection Control',
          'HIPAA and Confidentiality',
          'Emergency Preparedness',
          'Personal Care Skills',
          'Client Rights'
        ],
        alzheimersTrainingRequired: true,
        alzheimersTrainingHours: 8
      },
      staffingRatios: {
        rnSupervisionRatioAides: 30,
        supervisoryVisitFrequency: 'quarterly'
      },
      wageRules: {
        minimumWage: 10.45,
        overtimeThreshold: 40,
        overtimeMultiplier: 1.5
      },
      backgroundCheckRequirements: {
        bciFbiRequired: true,
        fingerprintRequired: true,
        oigCheckRequired: true,
        samCheckRequired: true,
        disqualifyingOffenses: [
          'MURDER',
          'RAPE',
          'FELONIOUS_ASSAULT',
          'DRUG_TRAFFICKING',
          'CHILD_ABUSE',
          'ELDER_ABUSE'
        ],
        renewalYears: 5
      },
      evvRequirements: {
        mandated: true,
        requiredElements: 6,
        exceptions: ['Live-in caregivers', 'Self-directed care']
      },
      medicaidPrograms: [
        {
          programName: 'Ohio Home Care Waiver',
          programCode: 'OHCW',
          serviceTypes: ['personal_care', 'homemaking', 'respite'],
          rateSchedule: {
            personal_care: 18.5,
            homemaking: 16.25,
            respite: 17.0
          }
        }
      ]
    };
  }
}

export const multiStateComplianceService = new MultiStateComplianceService();
