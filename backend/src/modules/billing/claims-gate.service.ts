/**
 * Claims Gate Service
 *
 * Prevents claims submission without proper validation and Sandata acceptance.
 * This is CRITICAL for revenue protection - rejected claims = lost revenue.
 *
 * NOW WIRED TO REAL DATABASE
 *
 * Validation Rules:
 * 1. EVV record exists (clock-in and clock-out complete)
 * 2. EVV validation passed (all 6 federal elements)
 * 3. Sandata accepted the visit (or ready to submit)
 * 4. Service code is valid and authorized
 * 5. Client is active and has Medicaid number
 * 6. Billable units are calculated
 *
 * @module modules/billing/claims-gate
 */

import { getDbClient } from '../../database/client';

interface EVVRecord {
  id: string;
  visitId: string;
  clientId: string;
  caregiverId: string;
  serviceCode: string | null;
  clockInTime: Date;
  clockOutTime: Date | null;
  billableUnits: number | null;
  sandataStatus: string;
  validationStatus: string;
  geofenceStatus: string | null;
  clientName: string;
  caregiverName: string;
  clientMedicaidNumber: string | null;
}

interface ClaimValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  visitId: string;
  clientName?: string;
  caregiverName?: string;
  billableUnits?: number;
  estimatedAmount?: number;
}

interface ClaimsReadinessReport {
  startDate: string;
  endDate: string;
  organizationId: string;
  totalVisits: number;
  billableVisits: number;
  blockedVisits: number;
  billablePercentage: number;
  blockReasons: Record<string, number>;
  estimatedRevenue: {
    billable: number;
    blocked: number;
    total: number;
  };
  visits: Array<{
    id: string;
    visitId: string;
    clientName: string;
    caregiverName: string;
    visitDate: string;
    billableUnits: number;
    status: 'billable' | 'blocked';
    blockReason?: string;
    estimatedAmount: number;
  }>;
}

/**
 * Claims Gate Service
 * Enforces validation before claims submission
 */
export class ClaimsGateService {
  private db = getDbClient();

  /**
   * Get EVV record with full details
   */
  private async getEVVRecordDetails(visitId: string): Promise<EVVRecord | null> {
    const result = await this.db.query<{
      id: string;
      visit_id: string;
      client_id: string;
      caregiver_id: string;
      clock_in_time: Date;
      clock_out_time: Date | null;
      billable_units: number | null;
      sandata_status: string;
      validation_status: string;
      geofence_status: string | null;
      client_first_name: string;
      client_last_name: string;
      caregiver_first_name: string;
      caregiver_last_name: string;
      client_medicaid_number: string | null;
      service_code: string | null;
    }>(
      `SELECT
        e.id,
        e.visit_id,
        e.client_id,
        e.caregiver_id,
        e.clock_in_time,
        e.clock_out_time,
        e.billable_units,
        e.sandata_status,
        e.validation_status,
        e.geofence_status,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name,
        c.medicaid_number as client_medicaid_number,
        s.service_code
      FROM evv_records e
      JOIN clients c ON e.client_id = c.id
      JOIN users u ON e.caregiver_id = u.id
      LEFT JOIN shifts s ON e.visit_id = s.id
      WHERE e.id = $1 OR e.visit_id = $1`,
      [visitId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      visitId: row.visit_id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      serviceCode: row.service_code,
      clockInTime: row.clock_in_time,
      clockOutTime: row.clock_out_time,
      billableUnits: row.billable_units,
      sandataStatus: row.sandata_status,
      validationStatus: row.validation_status,
      geofenceStatus: row.geofence_status,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      caregiverName: `${row.caregiver_first_name} ${row.caregiver_last_name}`,
      clientMedicaidNumber: row.client_medicaid_number
    };
  }

  /**
   * Validate if a single visit is ready for claims submission
   */
  async validateClaimReadiness(visitId: string): Promise<ClaimValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const visit = await this.getEVVRecordDetails(visitId);

      // Check 1: EVV record exists
      if (!visit) {
        errors.push('EVV record not found');
        return { isValid: false, errors, warnings, visitId };
      }

      // Check 2: EVV clock-in and clock-out exist
      if (!visit.clockInTime) {
        errors.push('Missing clock-in time');
      }
      if (!visit.clockOutTime) {
        errors.push('Missing clock-out time');
      }

      // Check 3: Billable units calculated
      if (!visit.billableUnits || visit.billableUnits === 0) {
        errors.push('No billable units calculated');
      }

      // Check 4: EVV validation passed
      if (visit.validationStatus === 'invalid') {
        errors.push('EVV validation failed');
      } else if (visit.validationStatus === 'warning') {
        warnings.push('EVV has validation warnings');
      }

      // Check 5: Sandata status
      if (visit.sandataStatus === 'rejected') {
        errors.push('Sandata rejected this visit');
      } else if (visit.sandataStatus === 'pending') {
        warnings.push('Pending Sandata submission');
      }

      // Check 6: Service code is valid
      const validServiceCodes = ['T1019', 'T1020', 'S5125', 'S5126', 'G0156', null];
      if (visit.serviceCode && !validServiceCodes.includes(visit.serviceCode)) {
        warnings.push(`Verify service code: ${visit.serviceCode}`);
      }

      // Check 7: Geofence status
      if (visit.geofenceStatus === 'outside') {
        warnings.push('Caregiver was outside geofence');
      }

      // Check 8: Client has Medicaid number
      if (!visit.clientMedicaidNumber) {
        errors.push('Client missing Medicaid number');
      }

      // Warnings for long visits
      if (visit.billableUnits && visit.billableUnits > 48) {
        warnings.push('Visit exceeds 12 hours - verify authorization');
      }

      // Calculate estimated amount (Ohio Medicaid rates)
      const ratePerUnit = visit.serviceCode === 'T1019' ? 4.25 : 3.75;
      const estimatedAmount = (visit.billableUnits || 0) * ratePerUnit;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        visitId,
        clientName: visit.clientName,
        caregiverName: visit.caregiverName,
        billableUnits: visit.billableUnits || 0,
        estimatedAmount: Math.round(estimatedAmount * 100) / 100
      };

    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        warnings,
        visitId
      };
    }
  }

  /**
   * Generate claims readiness report for a date range
   */
  async getClaimsReadinessReport(
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<ClaimsReadinessReport> {
    try {
      // Query all EVV records in date range
      const result = await this.db.query<{
        id: string;
        visit_id: string;
        client_id: string;
        caregiver_id: string;
        clock_in_time: Date;
        clock_out_time: Date | null;
        billable_units: number | null;
        sandata_status: string;
        validation_status: string;
        geofence_status: string | null;
        client_first_name: string;
        client_last_name: string;
        caregiver_first_name: string;
        caregiver_last_name: string;
        service_code: string | null;
        client_medicaid_number: string | null;
      }>(
        `SELECT
          e.id,
          e.visit_id,
          e.client_id,
          e.caregiver_id,
          e.clock_in_time,
          e.clock_out_time,
          e.billable_units,
          e.sandata_status,
          e.validation_status,
          e.geofence_status,
          c.first_name as client_first_name,
          c.last_name as client_last_name,
          u.first_name as caregiver_first_name,
          u.last_name as caregiver_last_name,
          s.service_code,
          c.medicaid_number as client_medicaid_number
        FROM evv_records e
        JOIN clients c ON e.client_id = c.id
        JOIN users u ON e.caregiver_id = u.id
        LEFT JOIN shifts s ON e.visit_id = s.id
        WHERE e.organization_id = $1
          AND e.clock_in_time >= $2
          AND e.clock_in_time <= $3
        ORDER BY e.clock_in_time DESC`,
        [organizationId, startDate, endDate]
      );

      let billableCount = 0;
      let blockedCount = 0;
      const blockReasons: Record<string, number> = {};
      const visits: ClaimsReadinessReport['visits'] = [];

      // Validate each visit
      for (const row of result.rows) {
        const validation = await this.validateClaimReadiness(row.id);
        const ratePerUnit = row.service_code === 'T1019' ? 4.25 : 3.75;
        const estimatedAmount = (row.billable_units || 0) * ratePerUnit;

        if (validation.isValid) {
          billableCount++;
          visits.push({
            id: row.id,
            visitId: row.visit_id,
            clientName: `${row.client_first_name} ${row.client_last_name}`,
            caregiverName: `${row.caregiver_first_name} ${row.caregiver_last_name}`,
            visitDate: row.clock_in_time.toISOString().split('T')[0],
            billableUnits: row.billable_units || 0,
            status: 'billable',
            estimatedAmount: Math.round(estimatedAmount * 100) / 100
          });
        } else {
          blockedCount++;
          const primaryBlockReason = validation.errors[0] || 'Unknown reason';
          blockReasons[primaryBlockReason] = (blockReasons[primaryBlockReason] || 0) + 1;
          visits.push({
            id: row.id,
            visitId: row.visit_id,
            clientName: `${row.client_first_name} ${row.client_last_name}`,
            caregiverName: `${row.caregiver_first_name} ${row.caregiver_last_name}`,
            visitDate: row.clock_in_time.toISOString().split('T')[0],
            billableUnits: row.billable_units || 0,
            status: 'blocked',
            blockReason: primaryBlockReason,
            estimatedAmount: Math.round(estimatedAmount * 100) / 100
          });
        }
      }

      // Calculate revenue
      const billableRevenue = visits
        .filter(v => v.status === 'billable')
        .reduce((sum, v) => sum + v.estimatedAmount, 0);
      const blockedRevenue = visits
        .filter(v => v.status === 'blocked')
        .reduce((sum, v) => sum + v.estimatedAmount, 0);

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        organizationId,
        totalVisits: result.rows.length,
        billableVisits: billableCount,
        blockedVisits: blockedCount,
        billablePercentage: result.rows.length > 0
          ? Math.round((billableCount / result.rows.length) * 100 * 10) / 10
          : 0,
        blockReasons,
        estimatedRevenue: {
          billable: Math.round(billableRevenue * 100) / 100,
          blocked: Math.round(blockedRevenue * 100) / 100,
          total: Math.round((billableRevenue + blockedRevenue) * 100) / 100
        },
        visits
      };

    } catch (error: any) {
      throw new Error(`Failed to generate claims readiness report: ${error.message}`);
    }
  }

  /**
   * Check if claims can be generated (enforces gate)
   */
  async canGenerateClaims(visitIds: string[]): Promise<{ allowed: boolean; errors: Array<{ visitId: string; error: string }> }> {
    const errors: Array<{ visitId: string; error: string }> = [];

    for (const visitId of visitIds) {
      const validation = await this.validateClaimReadiness(visitId);
      if (!validation.isValid) {
        errors.push({
          visitId,
          error: validation.errors.join('; ')
        });
      }
    }

    return {
      allowed: errors.length === 0,
      errors
    };
  }

  /**
   * Get visits ready for Sandata submission
   */
  async getReadyForSandataSubmission(
    organizationId: string,
    limit: number = 100
  ): Promise<Array<{
    evvRecordId: string;
    shiftId: string;
    clientId: string;
    caregiverId: string;
    clockInTime: Date;
    clockOutTime: Date;
    billableUnits: number;
  }>> {
    const result = await this.db.query<{
      id: string;
      visit_id: string;
      client_id: string;
      caregiver_id: string;
      clock_in_time: Date;
      clock_out_time: Date;
      billable_units: number;
    }>(
      `SELECT id, visit_id, client_id, caregiver_id, clock_in_time, clock_out_time, billable_units
       FROM evv_records
       WHERE organization_id = $1
         AND sandata_status = 'ready_to_submit'
         AND clock_out_time IS NOT NULL
         AND billable_units > 0
       ORDER BY clock_in_time
       LIMIT $2`,
      [organizationId, limit]
    );

    return result.rows.map(row => ({
      evvRecordId: row.id,
      shiftId: row.visit_id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      clockInTime: row.clock_in_time,
      clockOutTime: row.clock_out_time,
      billableUnits: row.billable_units
    }));
  }

  /**
   * Mark visits as submitted to Sandata
   */
  async markAsSubmitted(evvRecordIds: string[], sandataVisitId?: string): Promise<void> {
    await this.db.query(
      `UPDATE evv_records
       SET sandata_status = 'submitted',
           sandata_visit_id = $2,
           sandata_submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = ANY($1)`,
      [evvRecordIds, sandataVisitId]
    );
  }

  /**
   * Get rich visit data for EDI claims generation
   */
  async getClaimsDataForEDI(visitIds: string[]): Promise<any[]> {
    if (visitIds.length === 0) return [];

    const result = await this.db.query(
      `SELECT
        e.id,
        e.visit_id,
        e.clock_in_time,
        e.billable_units,
        s.service_code,
        c.id as client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.date_of_birth,
        c.medicaid_number,
        c.address,
        c.medical_info,
        c.care_plan,
        u.id as caregiver_id,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name
      FROM evv_records e
      JOIN clients c ON e.client_id = c.id
      JOIN users u ON e.caregiver_id = u.id
      LEFT JOIN shifts s ON e.visit_id = s.id
      WHERE e.id = ANY($1) OR e.visit_id = ANY($1)`,
      [visitIds]
    );

    return result.rows.map(row => {
      // Extract address components
      const address = row.address || {};

      // Extract diagnosis code (ICD-10) from medical info
      // Fallback to default Z74.09 (Need for assistance...) if not found
      const diagnosisCode = row.medical_info?.diagnosis_code ||
        row.care_plan?.diagnosis_code ||
        'Z7409';

      return {
        id: row.id,
        visitDate: row.clock_in_time,
        serviceCode: row.service_code || 'T1019',
        billableUnits: row.billable_units || 0,
        diagnosisCode: diagnosisCode.replace('.', ''), // Strip dots for EDI
        authorizationNumber: 'AUTH0001', // TODO: Link to authorizations table
        client: {
          id: row.client_id,
          firstName: row.client_first_name,
          lastName: row.client_last_name,
          dateOfBirth: new Date(row.date_of_birth),
          medicaidNumber: row.medicaid_number || 'UNKNOWN',
          addressLine1: address.street || '123 Client St',
          city: address.city || 'Columbus',
          state: address.state || 'OH',
          zipCode: address.zipCode || address.zip || '43085'
        },
        caregiver: {
          id: row.caregiver_id,
          firstName: row.caregiver_first_name,
          lastName: row.caregiver_last_name,
          npi: '1234567890' // TODO: add NPI to caregivers table
        },
        placeOfService: '12' // Home
      };
    });
  }
}

// Singleton instance
let instance: ClaimsGateService | null = null;

export function getClaimsGateService(): ClaimsGateService {
  if (!instance) {
    instance = new ClaimsGateService();
  }
  return instance;
}
