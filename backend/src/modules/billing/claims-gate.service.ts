/**
 * Claims Gate Service
 *
 * Prevents claims submission without proper validation and Sandata acceptance.
 * This is CRITICAL for revenue protection - rejected claims = lost revenue.
 *
 * Validation Rules:
 * 1. EVV record exists (clock-in and clock-out complete)
 * 2. EVV validation passed (all 6 federal elements)
 * 3. Sandata accepted the visit
 * 4. Service code is valid and authorized
 * 5. Authorization has remaining units
 * 6. Client is active and eligible
 * 7. Caregiver credentials are current
 *
 * @module modules/billing/claims-gate
 */

import { DatabaseClient } from '../../database/client';
// import { getSandataRepository } from '../../services/sandata/repositories/sandata.repository';
// import { getDbClient } from '../../database/client';

interface EVVRecord {
  id: string;
  shiftId: string;
  clientId: string;
  caregiverId: string;
  serviceCode: string;
  serviceDate: Date;
  clockInTime: Date;
  clockOutTime: Date;
  billableUnits: number;
  sandataStatus: string;
  sandataRejectedReason?: string;
  validationStatus?: string;
  validationErrors?: string[];
}

interface ClaimValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  visitId: string;
  clientName?: string;
  caregiverName?: string;
}

interface ClaimsReadinessReport {
  startDate: string;
  endDate: string;
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
  visits: {
    billable: EVVRecord[];
    blocked: Array<EVVRecord & { blockReason: string }>;
  };
}

/**
 * Claims Gate Service
 * Enforces validation before claims submission
 */
export class ClaimsGateService {
  // private readonly repository = getSandataRepository(getDbClient());

  /**
   * Validate if a single visit is ready for claims submission
   */
  async validateClaimReadiness(visitId: string): Promise<ClaimValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // TODO: Query database for EVV record
      // const db = DatabaseClient.getInstance();
      // const visitResult = await db.query(`
      //   SELECT
      //     e.*,
      //     c.first_name || ' ' || c.last_name as client_name,
      //     cg.first_name || ' ' || cg.last_name as caregiver_name,
      //     s.authorization_number,
      //     s.service_code
      //   FROM evv_records e
      //   JOIN clients c ON c.id = e.client_id
      //   JOIN caregivers cg ON cg.id = e.caregiver_id
      //   JOIN shifts s ON s.id = e.shift_id
      //   WHERE e.id = $1
      // `, [visitId]);

      // Mock EVV record for development
      const visit: EVVRecord = {
        id: visitId,
        shiftId: 'shift-123',
        clientId: 'client-001',
        caregiverId: 'cg-001',
        serviceCode: 'T1019',
        serviceDate: new Date(),
        clockInTime: new Date(),
        clockOutTime: new Date(),
        billableUnits: 8,
        sandataStatus: 'accepted',
        validationStatus: 'valid'
      };

      // Check 1: EVV record exists
      if (!visit) {
        errors.push('EVV record not found');
        return { isValid: false, errors, warnings, visitId };
      }

      // Check 2: EVV clock-in and clock-out exist
      if (!visit.clockInTime || !visit.clockOutTime) {
        errors.push('Missing EVV clock-in or clock-out');
      }

      // Check 3: EVV validation passed
      if (visit.validationStatus !== 'valid') {
        errors.push(`EVV validation failed: ${visit.validationErrors?.join(', ') || 'Unknown reason'}`);
      }

      // Check 4: Sandata accepted
      if (visit.sandataStatus !== 'accepted') {
        if (visit.sandataStatus === 'rejected') {
          errors.push(`Sandata rejected: ${visit.sandataRejectedReason || 'Unknown reason'}`);
        } else if (visit.sandataStatus === 'pending') {
          errors.push('Sandata submission pending - wait for acceptance');
        } else {
          errors.push('Visit not submitted to Sandata');
        }
      }

      // Check 5: Service code is valid
      const validServiceCodes = ['T1019', 'T1020', 'S5125', 'S5126', 'G0156'];
      if (!validServiceCodes.includes(visit.serviceCode)) {
        errors.push(`Invalid service code: ${visit.serviceCode}`);
      }

      // Check 6: Authorization has remaining units
      // TODO: Query authorization
      // const authResult = await db.query(`
      //   SELECT
      //     authorized_units,
      //     used_units,
      //     (authorized_units - used_units) as remaining_units
      //   FROM authorizations
      //   WHERE client_id = $1
      //     AND service_code = $2
      //     AND start_date <= $3
      //     AND end_date >= $3
      //     AND status = 'active'
      // `, [visit.clientId, visit.serviceCode, visit.serviceDate]);
      //
      // if (!authResult.rows[0]) {
      //   errors.push('No active authorization found for this service');
      // } else if (authResult.rows[0].remaining_units < visit.billableUnits) {
      //   errors.push(`Insufficient authorized units (need ${visit.billableUnits}, have ${authResult.rows[0].remaining_units})`);
      // }

      // Mock authorization check
      const mockAuthorization = {
        authorizedUnits: 160,
        usedUnits: 120,
        remainingUnits: 40
      };

      if (mockAuthorization.remainingUnits < visit.billableUnits) {
        errors.push(`Insufficient authorized units (need ${visit.billableUnits}, have ${mockAuthorization.remainingUnits})`);
      }

      // Check 7: Client is active
      // TODO: Query client status
      // const clientResult = await db.query(`
      //   SELECT status, medicaid_number
      //   FROM clients
      //   WHERE id = $1
      // `, [visit.clientId]);
      //
      // if (clientResult.rows[0]?.status !== 'active') {
      //   errors.push('Client is not active');
      // }
      // if (!clientResult.rows[0]?.medicaid_number) {
      //   errors.push('Client missing Medicaid number');
      // }

      // Check 8: Caregiver credentials are current
      // TODO: Query credentials
      // const credResult = await db.query(`
      //   SELECT type, expiration_date
      //   FROM credentials
      //   WHERE caregiver_id = $1
      //     AND status = 'active'
      //     AND expiration_date < NOW()
      // `, [visit.caregiverId]);
      //
      // if (credResult.rows.length > 0) {
      //   const expired = credResult.rows.map(r => r.type).join(', ');
      //   errors.push(`Caregiver has expired credentials: ${expired}`);
      // }

      // Warnings (non-blocking)
      if (visit.billableUnits > 12) {
        warnings.push('Visit exceeds 12 units - verify authorization allows extended hours');
      }

      const result: ClaimValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        visitId,
        clientName: 'Margaret Johnson', // Mock
        caregiverName: 'Mary Smith' // Mock
      };

      return result;

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
      // TODO: Query all visits in date range
      // const db = DatabaseClient.getInstance();
      // const result = await db.query(`
      //   SELECT
      //     e.*,
      //     c.first_name || ' ' || c.last_name as client_name,
      //     cg.first_name || ' ' || cg.last_name as caregiver_name,
      //     s.service_code
      //   FROM evv_records e
      //   JOIN clients c ON c.id = e.client_id
      //   JOIN caregivers cg ON cg.id = e.caregiver_id
      //   JOIN shifts s ON s.id = e.shift_id
      //   WHERE e.service_date >= $1
      //     AND e.service_date <= $2
      //     AND e.organization_id = $3
      //     AND e.clock_out_time IS NOT NULL
      //   ORDER BY e.service_date, e.clock_in_time
      // `, [startDate, endDate, organizationId]);

      // Mock visits for development
      const mockVisits: EVVRecord[] = [
        {
          id: 'evv-001',
          shiftId: 'shift-101',
          clientId: 'client-001',
          caregiverId: 'cg-001',
          serviceCode: 'T1019',
          serviceDate: new Date(),
          clockInTime: new Date(),
          clockOutTime: new Date(),
          billableUnits: 8,
          sandataStatus: 'accepted',
          validationStatus: 'valid'
        },
        {
          id: 'evv-002',
          shiftId: 'shift-102',
          clientId: 'client-002',
          caregiverId: 'cg-002',
          serviceCode: 'S5125',
          serviceDate: new Date(),
          clockInTime: new Date(),
          clockOutTime: new Date(),
          billableUnits: 6,
          sandataStatus: 'rejected',
          sandataRejectedReason: 'GPS coordinates outside geofence',
          validationStatus: 'valid'
        },
        {
          id: 'evv-003',
          shiftId: 'shift-103',
          clientId: 'client-003',
          caregiverId: 'cg-003',
          serviceCode: 'T1020',
          serviceDate: new Date(),
          clockInTime: new Date(),
          clockOutTime: new Date(),
          billableUnits: 4,
          sandataStatus: 'pending',
          validationStatus: 'valid'
        }
      ];

      const visits = mockVisits; // Replace with: result.rows

      let billableCount = 0;
      let blockedCount = 0;
      const blockReasons: Record<string, number> = {};
      const billableVisits: EVVRecord[] = [];
      const blockedVisits: Array<EVVRecord & { blockReason: string }> = [];

      // Validate each visit
      for (const visit of visits) {
        const validation = await this.validateClaimReadiness(visit.id);

        if (validation.isValid) {
          billableCount++;
          billableVisits.push(visit);
        } else {
          blockedCount++;
          const primaryBlockReason = validation.errors[0] || 'Unknown reason';
          blockReasons[primaryBlockReason] = (blockReasons[primaryBlockReason] || 0) + 1;
          blockedVisits.push({ ...visit, blockReason: primaryBlockReason });
        }
      }

      // Calculate estimated revenue (assuming $25/unit average)
      const averageReimbursementPerUnit = 25;
      const billableRevenue = billableVisits.reduce((sum, v) => sum + (v.billableUnits * averageReimbursementPerUnit), 0);
      const blockedRevenue = blockedVisits.reduce((sum, v) => sum + (v.billableUnits * averageReimbursementPerUnit), 0);

      const report: ClaimsReadinessReport = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalVisits: visits.length,
        billableVisits: billableCount,
        blockedVisits: blockedCount,
        billablePercentage: visits.length > 0 ? Math.round((billableCount / visits.length) * 100 * 10) / 10 : 0,
        blockReasons,
        estimatedRevenue: {
          billable: billableRevenue,
          blocked: blockedRevenue,
          total: billableRevenue + blockedRevenue
        },
        visits: {
          billable: billableVisits,
          blocked: blockedVisits
        }
      };

      return report;

    } catch (error: any) {
      throw new Error(`Failed to generate claims readiness report: ${error.message}`);
    }
  }

  /**
   * Check if claims can be generated (enforces gate)
   */
  async canGenerateClaims(visitIds: string[]): Promise<{ allowed: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const visitId of visitIds) {
      const validation = await this.validateClaimReadiness(visitId);
      if (!validation.isValid) {
        errors.push(`Visit ${visitId}: ${validation.errors.join(', ')}`);
      }
    }

    return {
      allowed: errors.length === 0,
      errors
    };
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
