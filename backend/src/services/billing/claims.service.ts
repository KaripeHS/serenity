/**
 * Claims Service
 * Generates, validates, and manages Medicaid claims from EVV records
 * Integrates with license enforcement to ensure proper billing
 *
 * @module services/billing/claims
 */
import { createLogger } from '../../utils/logger';
import { getDbClient } from '../../database/client';
import { EdiGeneratorService, EdiClaim, EdiServiceLine } from './edi/edi-generator.service';
import { claimValidator, ValidationResult } from './edi/claim-validator.service';

const logger = createLogger('claims-service');

// Ohio Medicaid rate table (2024 rates from handbook)
export const OHIO_MEDICAID_RATES: Record<string, { rate: number; unit: string; description: string }> = {
  'T1019': { rate: 7.24, unit: '15min', description: 'Personal Care' },
  'S5130': { rate: 5.50, unit: '15min', description: 'Homemaker Services' },
  'S5150': { rate: 7.24, unit: '15min', description: 'Respite Care (In-Home)' },
  'T1001': { rate: 17.50, unit: '15min', description: 'Nursing Assessment (RN)' },
  'T1002': { rate: 12.00, unit: '15min', description: 'Nursing (LPN)' },
};

export interface ClaimLineItem {
  id: string;
  visitId: string;
  clientId: string;
  clientName: string;
  serviceCode: string;
  serviceName: string;
  serviceDate: Date;
  units: number;
  rate: number;
  chargeAmount: number;
  authorizationId?: string;
  authorizationNumber?: string;
  evvRecordId?: string;
  evvStatus?: string;
  signatureCaptured: boolean;
}

export interface ClaimBatch {
  id: string;
  organizationId: string;
  batchNumber: string;
  status: 'draft' | 'validated' | 'submitted' | 'accepted' | 'rejected' | 'paid';
  claimCount: number;
  totalChargeAmount: number;
  createdAt: Date;
  submittedAt?: Date;
  paidAt?: Date;
  validationResult?: ValidationResult;
  claims: GeneratedClaim[];
}

export interface GeneratedClaim {
  id: string;
  claimNumber: string;
  clientId: string;
  clientName: string;
  clientMedicaidNumber: string;
  serviceDate: Date;
  serviceCode: string;
  units: number;
  chargeAmount: number;
  status: string;
  evvRecordId?: string;
  authorizationId?: string;
  validationErrors?: string[];
}

export class ClaimsService {
  private db = getDbClient();

  /**
   * Get billable visits ready for claims generation
   */
  async getBillableVisits(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      clientId?: string;
      status?: string;
    } = {}
  ): Promise<ClaimLineItem[]> {
    logger.info('Fetching billable visits', { organizationId, options });

    const { startDate, endDate, clientId, status } = options;

    let query = `
      SELECT
        s.id as visit_id,
        s.client_id,
        c.first_name || ' ' || c.last_name as client_name,
        c.medicaid_number,
        s.service_code,
        s.service_type,
        s.scheduled_start as service_date,
        e.billable_units as units,
        e.id as evv_record_id,
        e.sandata_status as evv_status,
        e.signature_captured,
        s.signature_captured as shift_signature,
        sa.id as authorization_id,
        sa.authorization_number
      FROM shifts s
      JOIN clients c ON c.id = s.client_id
      LEFT JOIN evv_records e ON e.visit_id = s.id
      LEFT JOIN service_authorizations sa ON sa.client_id = s.client_id
        AND sa.service_code = s.service_code
        AND sa.start_date <= s.scheduled_start
        AND sa.end_date >= s.scheduled_start
        AND sa.status = 'active'
      WHERE s.organization_id = $1
        AND s.status = 'completed'
        AND e.billable_units > 0
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND s.scheduled_start >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND s.scheduled_start <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (clientId) {
      query += ` AND s.client_id = $${paramIndex++}`;
      params.push(clientId);
    }
    if (status === 'unbilled') {
      query += ` AND s.id NOT IN (SELECT visit_id FROM claim_lines WHERE status != 'rejected')`;
    }

    query += ` ORDER BY s.scheduled_start DESC`;

    const result = await this.db.query(query, params);

    return result.rows.map((row: any) => {
      const serviceCode = row.service_code || 'T1019';
      const rateInfo = OHIO_MEDICAID_RATES[serviceCode] || { rate: 7.24, unit: '15min', description: 'Personal Care' };
      const units = row.units || 1;
      const chargeAmount = units * rateInfo.rate;

      return {
        id: row.visit_id,
        visitId: row.visit_id,
        clientId: row.client_id,
        clientName: row.client_name,
        serviceCode,
        serviceName: rateInfo.description,
        serviceDate: row.service_date,
        units,
        rate: rateInfo.rate,
        chargeAmount,
        authorizationId: row.authorization_id,
        authorizationNumber: row.authorization_number,
        evvRecordId: row.evv_record_id,
        evvStatus: row.evv_status,
        signatureCaptured: row.signature_captured || row.shift_signature || false,
      };
    });
  }

  /**
   * Validate a set of visits before claim generation
   */
  async validateVisitsForClaims(
    organizationId: string,
    visitIds: string[]
  ): Promise<{
    valid: ClaimLineItem[];
    invalid: { visit: ClaimLineItem; errors: string[] }[];
    summary: {
      totalVisits: number;
      validCount: number;
      invalidCount: number;
      totalChargeAmount: number;
    };
  }> {
    logger.info('Validating visits for claims', { organizationId, visitCount: visitIds.length });

    const allVisits = await this.getBillableVisits(organizationId, { status: 'unbilled' });
    const selectedVisits = allVisits.filter(v => visitIds.includes(v.visitId));

    const valid: ClaimLineItem[] = [];
    const invalid: { visit: ClaimLineItem; errors: string[] }[] = [];

    for (const visit of selectedVisits) {
      const errors: string[] = [];

      // Validate EVV compliance
      if (!visit.evvRecordId) {
        errors.push('Missing EVV record');
      } else if (visit.evvStatus !== 'valid' && visit.evvStatus !== 'ready_to_submit') {
        errors.push(`EVV status is ${visit.evvStatus}, not ready for billing`);
      }

      // Validate authorization
      if (!visit.authorizationId) {
        errors.push('No active authorization found for this service');
      }

      // Validate units
      if (!visit.units || visit.units <= 0) {
        errors.push('No billable units recorded');
      }

      // Validate signature (required for Ohio Medicaid)
      if (!visit.signatureCaptured) {
        errors.push('Client signature not captured');
      }

      if (errors.length === 0) {
        valid.push(visit);
      } else {
        invalid.push({ visit, errors });
      }
    }

    const totalChargeAmount = valid.reduce((sum, v) => sum + v.chargeAmount, 0);

    return {
      valid,
      invalid,
      summary: {
        totalVisits: selectedVisits.length,
        validCount: valid.length,
        invalidCount: invalid.length,
        totalChargeAmount,
      },
    };
  }

  /**
   * Generate claims from validated visits
   */
  async generateClaims(
    organizationId: string,
    visitIds: string[],
    createdBy: string
  ): Promise<ClaimBatch> {
    logger.info('Generating claims', { organizationId, visitCount: visitIds.length });

    // Validate visits first
    const validation = await this.validateVisitsForClaims(organizationId, visitIds);

    if (validation.valid.length === 0) {
      throw new Error('No valid visits to generate claims from');
    }

    // Create batch
    const batchNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const batchResult = await this.db.query(
      `INSERT INTO claim_batches (
        organization_id, batch_number, status, claim_count, total_charge_amount, created_by, created_at
      ) VALUES ($1, $2, 'draft', $3, $4, $5, NOW())
      RETURNING id`,
      [organizationId, batchNumber, validation.valid.length, validation.summary.totalChargeAmount, createdBy]
    );
    const batchId = batchResult.rows[0].id;

    // Create claim lines
    const claims: GeneratedClaim[] = [];
    for (const visit of validation.valid) {
      const claimNumber = `${batchNumber}-${visit.visitId.substring(0, 8)}`;

      // Get client Medicaid number
      const clientResult = await this.db.query(
        'SELECT medicaid_number FROM clients WHERE id = $1',
        [visit.clientId]
      );
      const medicaidNumber = clientResult.rows[0]?.medicaid_number || '';

      await this.db.query(
        `INSERT INTO claim_lines (
          batch_id, visit_id, claim_number, client_id, service_code, service_date,
          units, rate, charge_amount, authorization_id, evv_record_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW())`,
        [
          batchId,
          visit.visitId,
          claimNumber,
          visit.clientId,
          visit.serviceCode,
          visit.serviceDate,
          visit.units,
          visit.rate,
          visit.chargeAmount,
          visit.authorizationId,
          visit.evvRecordId,
        ]
      );

      claims.push({
        id: visit.visitId,
        claimNumber,
        clientId: visit.clientId,
        clientName: visit.clientName,
        clientMedicaidNumber: medicaidNumber,
        serviceDate: visit.serviceDate,
        serviceCode: visit.serviceCode,
        units: visit.units,
        chargeAmount: visit.chargeAmount,
        status: 'pending',
        evvRecordId: visit.evvRecordId,
        authorizationId: visit.authorizationId,
      });
    }

    logger.info('Claims batch generated', { batchId, batchNumber, claimCount: claims.length });

    return {
      id: batchId,
      organizationId,
      batchNumber,
      status: 'draft',
      claimCount: claims.length,
      totalChargeAmount: validation.summary.totalChargeAmount,
      createdAt: new Date(),
      claims,
    };
  }

  /**
   * Get claim batches for organization
   */
  async getClaimBatches(
    organizationId: string,
    options: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<ClaimBatch[]> {
    const { status, startDate, endDate, limit = 50 } = options;

    let query = `
      SELECT
        cb.id,
        cb.batch_number,
        cb.status,
        cb.claim_count,
        cb.total_charge_amount,
        cb.created_at,
        cb.submitted_at,
        cb.paid_at
      FROM claim_batches cb
      WHERE cb.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (status) {
      query += ` AND cb.status = $${paramIndex++}`;
      params.push(status);
    }
    if (startDate) {
      query += ` AND cb.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND cb.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY cb.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.db.query(query, params);

    return result.rows.map((row: any) => ({
      id: row.id,
      organizationId,
      batchNumber: row.batch_number,
      status: row.status,
      claimCount: row.claim_count,
      totalChargeAmount: parseFloat(row.total_charge_amount),
      createdAt: row.created_at,
      submittedAt: row.submitted_at,
      paidAt: row.paid_at,
      claims: [],
    }));
  }

  /**
   * Get claim batch details with all claims
   */
  async getClaimBatchDetails(batchId: string): Promise<ClaimBatch | null> {
    const batchResult = await this.db.query(
      `SELECT * FROM claim_batches WHERE id = $1`,
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return null;
    }

    const batch = batchResult.rows[0];

    const claimsResult = await this.db.query(
      `SELECT
        cl.*,
        c.first_name || ' ' || c.last_name as client_name,
        c.medicaid_number
      FROM claim_lines cl
      JOIN clients c ON c.id = cl.client_id
      WHERE cl.batch_id = $1
      ORDER BY cl.service_date DESC`,
      [batchId]
    );

    return {
      id: batch.id,
      organizationId: batch.organization_id,
      batchNumber: batch.batch_number,
      status: batch.status,
      claimCount: batch.claim_count,
      totalChargeAmount: parseFloat(batch.total_charge_amount),
      createdAt: batch.created_at,
      submittedAt: batch.submitted_at,
      paidAt: batch.paid_at,
      claims: claimsResult.rows.map((row: any) => ({
        id: row.id,
        claimNumber: row.claim_number,
        clientId: row.client_id,
        clientName: row.client_name,
        clientMedicaidNumber: row.medicaid_number,
        serviceDate: row.service_date,
        serviceCode: row.service_code,
        units: row.units,
        chargeAmount: parseFloat(row.charge_amount),
        status: row.status,
        evvRecordId: row.evv_record_id,
        authorizationId: row.authorization_id,
      })),
    };
  }

  /**
   * Generate EDI 837P file for a claim batch
   */
  async generateEDI837P(
    batchId: string,
    config: {
      senderId: string;
      receiverId: string;
      isTest: boolean;
    }
  ): Promise<string> {
    const batch = await this.getClaimBatchDetails(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    // Get organization billing info
    const orgResult = await this.db.query(
      `SELECT * FROM organizations WHERE id = $1`,
      [batch.organizationId]
    );
    const org = orgResult.rows[0];

    const generator = new EdiGeneratorService({
      senderId: config.senderId,
      receiverId: config.receiverId,
      controlNumber: parseInt(batchId.substring(0, 8), 16) % 1000000000,
      isTest: config.isTest,
    });

    // Group claims by client for generating claims
    const claimsByClient = new Map<string, GeneratedClaim[]>();
    for (const claim of batch.claims) {
      const existing = claimsByClient.get(claim.clientId) || [];
      existing.push(claim);
      claimsByClient.set(claim.clientId, existing);
    }

    let ediContent = '';
    for (const [clientId, clientClaims] of claimsByClient) {
      // Get client details
      const clientResult = await this.db.query(
        `SELECT * FROM clients WHERE id = $1`,
        [clientId]
      );
      const client = clientResult.rows[0];

      const ediClaim: EdiClaim = {
        id: clientClaims[0].claimNumber,
        billingProvider: {
          name: org.name || 'SERENITY CARE PARTNERS',
          npi: org.npi || '1234567890',
          taxId: org.tax_id || '123456789',
          address: org.address_line_1 || '123 Main St',
          city: org.city || 'Cincinnati',
          state: org.state || 'OH',
          zip: org.zip || '45202',
        },
        subscriber: {
          firstName: client.first_name,
          lastName: client.last_name,
          memberId: client.medicaid_number,
          dob: client.date_of_birth?.toISOString().split('T')[0] || '1950-01-01',
          gender: client.gender || 'F',
          address: client.address_line_1 || '',
          city: client.city || '',
          state: client.state || 'OH',
          zip: client.zip_code || '',
        },
        payer: {
          name: 'OHIO MEDICAID',
          payerId: 'OHMED',
        },
        diagnoses: ['Z74.1'], // Need for assistance with personal care - common for home care
        services: clientClaims.map(c => ({
          procedureCode: c.serviceCode,
          chargeAmount: c.chargeAmount,
          date: new Date(c.serviceDate),
          units: c.units,
        })),
        totalCharge: clientClaims.reduce((sum, c) => sum + c.chargeAmount, 0),
      };

      ediContent += generator.generate837P(ediClaim) + '\n';
    }

    // Update batch status
    await this.db.query(
      `UPDATE claim_batches SET status = 'validated', updated_at = NOW() WHERE id = $1`,
      [batchId]
    );

    return ediContent;
  }

  /**
   * Get claims dashboard summary
   */
  async getClaimsDashboard(organizationId: string): Promise<{
    unbilledVisits: number;
    unbilledAmount: number;
    pendingClaims: number;
    pendingAmount: number;
    submittedClaims: number;
    submittedAmount: number;
    paidClaims: number;
    paidAmount: number;
    rejectedClaims: number;
    rejectedAmount: number;
    averageDaysToPay: number;
  }> {
    // Get unbilled visits
    const unbilledResult = await this.db.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(e.billable_units * 7.24), 0) as amount
      FROM shifts s
      JOIN evv_records e ON e.visit_id = s.id
      WHERE s.organization_id = $1
        AND s.status = 'completed'
        AND e.billable_units > 0
        AND s.id NOT IN (SELECT visit_id FROM claim_lines)
    `, [organizationId]);

    // Get claims by status
    const claimsResult = await this.db.query(`
      SELECT
        cl.status,
        COUNT(*) as count,
        COALESCE(SUM(cl.charge_amount), 0) as amount
      FROM claim_lines cl
      JOIN claim_batches cb ON cb.id = cl.batch_id
      WHERE cb.organization_id = $1
      GROUP BY cl.status
    `, [organizationId]);

    // Get average days to pay
    const daysToPayResult = await this.db.query(`
      SELECT AVG(EXTRACT(DAY FROM (cb.paid_at - cb.submitted_at))) as avg_days
      FROM claim_batches cb
      WHERE cb.organization_id = $1
        AND cb.status = 'paid'
        AND cb.paid_at IS NOT NULL
        AND cb.submitted_at IS NOT NULL
    `, [organizationId]);

    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const row of claimsResult.rows) {
      statusMap.set(row.status, { count: parseInt(row.count), amount: parseFloat(row.amount) });
    }

    return {
      unbilledVisits: parseInt(unbilledResult.rows[0]?.count || '0'),
      unbilledAmount: parseFloat(unbilledResult.rows[0]?.amount || '0'),
      pendingClaims: statusMap.get('pending')?.count || 0,
      pendingAmount: statusMap.get('pending')?.amount || 0,
      submittedClaims: statusMap.get('submitted')?.count || 0,
      submittedAmount: statusMap.get('submitted')?.amount || 0,
      paidClaims: statusMap.get('paid')?.count || 0,
      paidAmount: statusMap.get('paid')?.amount || 0,
      rejectedClaims: statusMap.get('rejected')?.count || 0,
      rejectedAmount: statusMap.get('rejected')?.amount || 0,
      averageDaysToPay: parseFloat(daysToPayResult.rows[0]?.avg_days || '0'),
    };
  }
}

export const claimsService = new ClaimsService();
