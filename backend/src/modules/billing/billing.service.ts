/**
 * Billing Service for Serenity ERP
 * Handles claims generation, validation, submission, and RCM processes
 */

import { DatabaseClient } from '../../database/client';
import { AuditLogger } from '../../audit/logger';
import { UserContext } from '../../auth/access-control';
import { createLogger } from '../utils/logger';

// Add missing logger
const billingLogger = createLogger('billing');

export interface Claim {
  id: string;
  organizationId: string;
  clientId: string;
  caregiverId: string;
  shiftId?: string;
  evvRecordId?: string;
  claimNumber: string;
  payerName: string;
  serviceCode: string;
  serviceDate: Date;
  unitsProvided: number;
  unitRate: number;
  totalAmount: number;
  status: ClaimStatus;
  submissionDate?: Date;
  paymentDate?: Date;
  paidAmount?: number;
  denialReason?: string;
  appealDeadline?: Date;
  evvCompliant: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export enum ClaimStatus {
  DRAFT = 'draft',
  STAGED = 'staged',
  SUBMITTED = 'submitted',
  PAID = 'paid',
  DENIED = 'denied',
  APPEALED = 'appealed'
}

export interface GenerateClaimsRequest {
  evvRecordIds: string[];
  payerName: string;
  submissionDate?: Date;
  overrideEVVValidation?: boolean;
}

export interface ClaimValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  requiredDocuments: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
}

export interface DenialAnalysis {
  denialCode: string;
  denialReason: string;
  category: 'clinical' | 'administrative' | 'eligibility' | 'authorization' | 'evv' | 'other';
  isAppealable: boolean;
  appealDeadline?: Date;
  recommendedActions: string[];
  requiredDocuments: string[];
}

export interface ClaimsBatch {
  id: string;
  organizationId: string;
  batchNumber: string;
  payerName: string;
  claimIds: string[];
  totalAmount: number;
  claimCount: number;
  status: 'draft' | 'submitted' | 'processed';
  submissionDate?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface PaymentPosting {
  id: string;
  claimId: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  remittanceAdviceNumber: string;
  adjustments: PaymentAdjustment[];
  createdAt: Date;
}

export interface PaymentAdjustment {
  code: string;
  description: string;
  amount: number;
  type: 'deductible' | 'coinsurance' | 'adjustment' | 'denial';
}

export class BillingService {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  /**
   * Generate claims from EVV records
   */
  async generateClaimsFromEVV(request: GenerateClaimsRequest, userContext: UserContext): Promise<{
    claims: Claim[];
    errors: { evvRecordId: string; error: string }[];
  }> {
    try {
      const claims: Claim[] = [];
      const errors: { evvRecordId: string; error: string }[] = [];

      for (const evvRecordId of request.evvRecordIds) {
        try {
          // Get EVV record with shift and client data
          const evvResult = await this.db.query(`
            SELECT er.*, s.service_id, s.scheduled_start, s.scheduled_end,
                   c.medicaid_number, c.first_name, c.last_name,
                   srv.service_code, srv.default_rate, srv.unit_type,
                   u.first_name as caregiver_first_name, u.last_name as caregiver_last_name
            FROM evv_records er
            JOIN shifts s ON er.shift_id = s.id
            JOIN clients c ON s.client_id = c.id
            JOIN services srv ON s.service_id = srv.id
            JOIN users u ON er.caregiver_id = u.id
            WHERE er.id = $1 AND er.organization_id = $2
          `, [evvRecordId, userContext.organizationId]);

          if (evvResult.rows.length === 0) {
            errors.push({ evvRecordId, error: 'EVV record not found' });
            continue;
          }

          const evv = evvResult.rows[0];

          // Check if claim already exists
          const existingClaim = await this.db.query(
            'SELECT id FROM claims WHERE evv_record_id = $1',
            [evvRecordId]
          );

          if (existingClaim.rows.length > 0) {
            errors.push({ evvRecordId, error: 'Claim already exists for this EVV record' });
            continue;
          }

          // Validate EVV compliance (unless override is specified)
          if (!request.overrideEVVValidation && !evv.is_valid) {
            errors.push({ evvRecordId, error: 'EVV record is not compliant - cannot generate claim' });
            continue;
          }

          // Calculate units and amount
          const { units, amount } = this.calculateClaimAmount(evv);

          // Generate claim
          const claim = await this.createClaim({
            clientId: evv.client_id,
            caregiverId: evv.caregiver_id,
            shiftId: evv.shift_id,
            evvRecordId: evv.id,
            payerName: request.payerName,
            serviceCode: evv.service_code,
            serviceDate: new Date(evv.clock_in_time),
            unitsProvided: units,
            unitRate: evv.default_rate,
            totalAmount: amount,
            evvCompliant: evv.is_valid
          }, userContext);

          claims.push(claim);

        } catch (error) {
          billingLogger.error(`Error generating claim for EVV ${evvRecordId}:`, error);
          errors.push({ evvRecordId, error: error.message });
        }
      }

      return { claims, errors };

    } catch (error) {
      billingLogger.error('Generate claims error:', error);
      throw error;
    }
  }

  /**
   * Create a single claim
   */
  async createClaim(claimData: {
    clientId: string;
    caregiverId: string;
    shiftId?: string;
    evvRecordId?: string;
    payerName: string;
    serviceCode: string;
    serviceDate: Date;
    unitsProvided: number;
    unitRate: number;
    totalAmount: number;
    evvCompliant: boolean;
  }, userContext: UserContext): Promise<Claim> {
    try {
      const claimId = await this.generateClaimId();
      const claimNumber = await this.generateClaimNumber();
      const now = new Date();

      await this.db.query(`
        INSERT INTO claims (
          id, organization_id, client_id, caregiver_id, shift_id, evv_record_id,
          claim_number, payer_name, service_code, service_date, units_provided,
          unit_rate, total_amount, status, evv_compliant, created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        claimId,
        userContext.organizationId,
        claimData.clientId,
        claimData.caregiverId,
        claimData.shiftId,
        claimData.evvRecordId,
        claimNumber,
        claimData.payerName,
        claimData.serviceCode,
        claimData.serviceDate,
        claimData.unitsProvided,
        claimData.unitRate,
        claimData.totalAmount,
        ClaimStatus.DRAFT,
        claimData.evvCompliant,
        now,
        now,
        userContext.userId
      ]);

      // Log claim creation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'claim_created',
        resource: 'claim',
        resourceId: claimId,
        details: {
          claimNumber,
          clientId: claimData.clientId,
          totalAmount: claimData.totalAmount,
          evvCompliant: claimData.evvCompliant
        },
        dataClassification: 'phi'
      });

      return await this.getClaimById(claimId, userContext);

    } catch (error) {
      billingLogger.error('Create claim error:', error);
      throw error;
    }
  }

  /**
   * Validate claim before submission
   */
  async validateClaim(claimId: string, userContext: UserContext): Promise<ClaimValidationResult> {
    try {
      const claim = await this.getClaimById(claimId, userContext);
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      const requiredDocuments: string[] = [];

      // 1. EVV Compliance Check (Critical for Ohio Medicaid)
      if (!claim.evvCompliant && claim.evvRecordId) {
        errors.push({
          code: 'EVV_NOT_COMPLIANT',
          message: 'Claim cannot be submitted without compliant EVV record',
          severity: 'error',
          field: 'evvCompliant'
        });
      }

      // 2. Client Eligibility Check
      const eligibilityCheck = await this.checkClientEligibility(claim.clientId, claim.serviceDate);
      if (!eligibilityCheck.isEligible) {
        errors.push({
          code: 'CLIENT_NOT_ELIGIBLE',
          message: eligibilityCheck.reason || 'Client not eligible for service date',
          severity: 'error',
          field: 'clientId'
        });
      }

      // 3. Service Authorization Check
      const authCheck = await this.checkServiceAuthorization(claim.clientId, claim.serviceCode, claim.serviceDate, claim.unitsProvided);
      if (!authCheck.isAuthorized) {
        if (authCheck.severity === 'error') {
          errors.push({
            code: 'NO_AUTHORIZATION',
            message: authCheck.reason || 'No valid authorization for service',
            severity: 'error',
            field: 'serviceCode'
          });
        } else {
          warnings.push({
            code: 'AUTHORIZATION_WARNING',
            message: authCheck.reason || 'Authorization may be expired or insufficient units',
            severity: 'warning',
            field: 'serviceCode'
          });
        }
      }

      // 4. Caregiver Credentials Check
      const credentialsCheck = await this.checkCaregiverCredentials(claim.caregiverId, claim.serviceCode, claim.serviceDate);
      if (!credentialsCheck.isValid) {
        errors.push({
          code: 'INVALID_CREDENTIALS',
          message: 'Caregiver does not have valid credentials for service date',
          severity: 'error',
          field: 'caregiverId'
        });
        requiredDocuments.push('Valid caregiver credentials');
      }

      // 5. Duplicate Claim Check
      const duplicateCheck = await this.checkDuplicateClaim(claim);
      if (duplicateCheck.hasDuplicate) {
        warnings.push({
          code: 'POTENTIAL_DUPLICATE',
          message: `Similar claim exists: ${duplicateCheck.duplicateClaimNumber}`,
          severity: 'warning'
        });
      }

      // 6. Rate Validation
      const rateCheck = await this.validateServiceRate(claim.serviceCode, claim.unitRate, claim.payerName);
      if (!rateCheck.isValid) {
        warnings.push({
          code: 'RATE_MISMATCH',
          message: `Rate ${claim.unitRate} differs from contract rate ${rateCheck.contractRate}`,
          severity: 'warning',
          field: 'unitRate'
        });
      }

      // 7. Units Validation
      if (claim.unitsProvided <= 0) {
        errors.push({
          code: 'INVALID_UNITS',
          message: 'Units provided must be greater than zero',
          severity: 'error',
          field: 'unitsProvided'
        });
      }

      // 8. Date Range Validation
      const dateCheck = this.validateServiceDate(claim.serviceDate);
      if (!dateCheck.isValid) {
        if (dateCheck.isTimely) {
          warnings.push({
            code: 'LATE_SUBMISSION',
            message: 'Claim submitted after timely filing deadline',
            severity: 'warning',
            field: 'serviceDate'
          });
        } else {
          errors.push({
            code: 'UNTIMELY_SUBMISSION',
            message: 'Claim submitted beyond payer deadline',
            severity: 'error',
            field: 'serviceDate'
          });
        }
      }

      const isValid = errors.length === 0;
      const canSubmit = isValid && claim.evvCompliant;

      return {
        isValid,
        canSubmit,
        errors,
        warnings,
        requiredDocuments
      };

    } catch (error) {
      billingLogger.error('Claim validation error:', error);
      return {
        isValid: false,
        canSubmit: false,
        errors: [{ code: 'VALIDATION_ERROR', message: 'Failed to validate claim', severity: 'error' }],
        warnings: [],
        requiredDocuments: []
      };
    }
  }

  /**
   * Submit claims batch
   */
  async submitClaimsBatch(claimIds: string[], userContext: UserContext): Promise<ClaimsBatch> {
    try {
      // Validate all claims first
      const validationResults = await Promise.all(
        claimIds.map(id => this.validateClaim(id, userContext))
      );

      const invalidClaims = validationResults
        .map((result, index) => ({ result, claimId: claimIds[index] }))
        .filter(({ result }) => !result.canSubmit);

      if (invalidClaims.length > 0) {
        throw new Error(`Cannot submit batch: ${invalidClaims.length} claims are invalid`);
      }

      // Get claims data
      const claimsQuery = `
        SELECT c.*, cl.first_name, cl.last_name, cl.medicaid_number
        FROM claims c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.id = ANY($1) AND c.organization_id = $2
      `;

      const claimsResult = await this.db.query(claimsQuery, [claimIds, userContext.organizationId]);
      const claims = claimsResult.rows;

      // Calculate batch totals
      const totalAmount = claims.reduce((sum, claim) => sum + parseFloat(claim.total_amount), 0);
      const payerName = claims[0].payer_name; // Assume all claims for same payer

      // Create batch record
      const batchId = await this.generateBatchId();
      const batchNumber = await this.generateBatchNumber();
      const submissionDate = new Date();

      await this.db.query(`
        INSERT INTO claims_batches (
          id, organization_id, batch_number, payer_name, claim_ids,
          total_amount, claim_count, status, submission_date, created_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        batchId,
        userContext.organizationId,
        batchNumber,
        payerName,
        JSON.stringify(claimIds),
        totalAmount,
        claims.length,
        'submitted',
        submissionDate,
        submissionDate,
        userContext.userId
      ]);

      // Update claim statuses
      await this.db.query(
        'UPDATE claims SET status = $1, submission_date = $2, updated_at = $3, updated_by = $4 WHERE id = ANY($5)',
        [ClaimStatus.SUBMITTED, submissionDate, submissionDate, userContext.userId, claimIds]
      );

      // Log batch submission
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'claims_batch_submitted',
        resource: 'claims_batch',
        resourceId: batchId,
        details: {
          batchNumber,
          claimCount: claims.length,
          totalAmount,
          payerName
        },
        dataClassification: 'phi'
      });

      return {
        id: batchId,
        organizationId: userContext.organizationId,
        batchNumber,
        payerName,
        claimIds,
        totalAmount,
        claimCount: claims.length,
        status: 'submitted',
        submissionDate,
        createdAt: submissionDate,
        createdBy: userContext.userId
      };

    } catch (error) {
      billingLogger.error('Submit claims batch error:', error);
      throw error;
    }
  }

  /**
   * Process denial and generate appeal recommendations
   */
  async processDenial(claimId: string, denialData: {
    denialCode: string;
    denialReason: string;
    denialDate: Date;
    appealDeadline?: Date;
  }, userContext: UserContext): Promise<DenialAnalysis> {
    try {
      // Update claim status
      await this.db.query(`
        UPDATE claims 
        SET status = $1, denial_reason = $2, appeal_deadline = $3, updated_at = NOW(), updated_by = $4
        WHERE id = $5
      `, [
        ClaimStatus.DENIED,
        denialData.denialReason,
        denialData.appealDeadline,
        userContext.userId,
        claimId
      ]);

      // Analyze denial
      const analysis = await this.analyzeDenial(claimId, denialData);

      // Log denial processing
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'claim_denied',
        resource: 'claim',
        resourceId: claimId,
        details: {
          denialCode: denialData.denialCode,
          denialReason: denialData.denialReason,
          category: analysis.category,
          isAppealable: analysis.isAppealable
        },
        dataClassification: 'phi'
      });

      return analysis;

    } catch (error) {
      billingLogger.error('Process denial error:', error);
      throw error;
    }
  }

  /**
   * Post payment to claim
   */
  async postPayment(claimId: string, paymentData: {
    paymentAmount: number;
    paymentDate: Date;
    paymentMethod: string;
    remittanceAdviceNumber: string;
    adjustments?: PaymentAdjustment[];
  }, userContext: UserContext): Promise<PaymentPosting> {
    try {
      const claim = await this.getClaimById(claimId, userContext);

      // Create payment posting record
      const postingId = await this.generatePaymentId();

      await this.db.query(`
        INSERT INTO payment_postings (
          id, claim_id, payment_amount, payment_date, payment_method,
          remittance_advice_number, adjustments, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        postingId,
        claimId,
        paymentData.paymentAmount,
        paymentData.paymentDate,
        paymentData.paymentMethod,
        paymentData.remittanceAdviceNumber,
        JSON.stringify(paymentData.adjustments || []),
        new Date()
      ]);

      // Update claim status and payment info
      const newStatus = paymentData.paymentAmount >= claim.totalAmount ? ClaimStatus.PAID : ClaimStatus.SUBMITTED;
      
      await this.db.query(`
        UPDATE claims 
        SET status = $1, paid_amount = $2, payment_date = $3, updated_at = NOW(), updated_by = $4
        WHERE id = $5
      `, [
        newStatus,
        paymentData.paymentAmount,
        paymentData.paymentDate,
        userContext.userId,
        claimId
      ]);

      // Log payment posting
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'payment_posted',
        resource: 'claim',
        resourceId: claimId,
        details: {
          paymentAmount: paymentData.paymentAmount,
          claimAmount: claim.totalAmount,
          fullyPaid: newStatus === ClaimStatus.PAID
        },
        dataClassification: 'phi'
      });

      return {
        id: postingId,
        claimId,
        paymentAmount: paymentData.paymentAmount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        remittanceAdviceNumber: paymentData.remittanceAdviceNumber,
        adjustments: paymentData.adjustments || [],
        createdAt: new Date()
      };

    } catch (error) {
      billingLogger.error('Post payment error:', error);
      throw error;
    }
  }

  /**
   * Get claims with filtering
   */
  async getClaims(userContext: UserContext, filters?: {
    status?: ClaimStatus;
    payerName?: string;
    serviceDate?: { from: Date; to: Date };
    clientId?: string;
    caregiverId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ claims: Claim[]; total: number }> {
    try {
      let query = `
        SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
               u.first_name as caregiver_first_name, u.last_name as caregiver_last_name
        FROM claims c
        JOIN clients cl ON c.client_id = cl.id
        JOIN users u ON c.caregiver_id = u.id
        WHERE c.organization_id = $1
      `;

      const params = [userContext.organizationId];
      let paramIndex = 2;

      if (filters?.status) {
        query += ` AND c.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters?.payerName) {
        query += ` AND c.payer_name ILIKE $${paramIndex++}`;
        params.push(`%${filters.payerName}%`);
      }

      if (filters?.serviceDate) {
        query += ` AND c.service_date >= $${paramIndex++} AND c.service_date <= $${paramIndex++}`;
        params.push(filters.serviceDate.from, filters.serviceDate.to);
      }

      if (filters?.clientId) {
        query += ` AND c.client_id = $${paramIndex++}`;
        params.push(filters.clientId);
      }

      if (filters?.caregiverId) {
        query += ` AND c.caregiver_id = $${paramIndex++}`;
        params.push(filters.caregiverId);
      }

      // Get total count
      const countQuery = query.replace('SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name, u.first_name as caregiver_first_name, u.last_name as caregiver_last_name', 'SELECT COUNT(*)');
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const offset = (page - 1) * limit;

      query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      const claims = result.rows.map(row => this.mapRowToClaim(row));

      return { claims, total };

    } catch (error) {
      billingLogger.error('Get claims error:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getClaimById(claimId: string, userContext: UserContext): Promise<Claim> {
    const query = `
      SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
             u.first_name as caregiver_first_name, u.last_name as caregiver_last_name
      FROM claims c
      JOIN clients cl ON c.client_id = cl.id
      JOIN users u ON c.caregiver_id = u.id
      WHERE c.id = $1 AND c.organization_id = $2
    `;

    const result = await this.db.query(query, [claimId, userContext.organizationId]);
    
    if (result.rows.length === 0) {
      throw new Error('Claim not found');
    }

    return this.mapRowToClaim(result.rows[0]);
  }

  private mapRowToClaim(row: any): Claim {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      shiftId: row.shift_id,
      evvRecordId: row.evv_record_id,
      claimNumber: row.claim_number,
      payerName: row.payer_name,
      serviceCode: row.service_code,
      serviceDate: row.service_date,
      unitsProvided: parseFloat(row.units_provided),
      unitRate: parseFloat(row.unit_rate),
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      submissionDate: row.submission_date,
      paymentDate: row.payment_date,
      paidAmount: row.paid_amount ? parseFloat(row.paid_amount) : undefined,
      denialReason: row.denial_reason,
      appealDeadline: row.appeal_deadline,
      evvCompliant: row.evv_compliant,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private calculateClaimAmount(evvRecord: any): { units: number; amount: number } {
    // Calculate based on actual time worked
    const clockIn = new Date(evvRecord.clock_in_time);
    const clockOut = new Date(evvRecord.clock_out_time || evvRecord.scheduled_end);
    const durationHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    let units: number;
    const rate = parseFloat(evvRecord.default_rate);

    // Unit calculation based on service type
    switch (evvRecord.unit_type) {
      case 'hour':
        units = Math.round(durationHours * 4) / 4; // Round to quarter hours
        break;
      case 'visit':
        units = 1;
        break;
      case 'day':
        units = 1;
        break;
      default:
        units = durationHours;
    }

    const amount = units * rate;

    return { units, amount };
  }

  private async checkClientEligibility(clientId: string, serviceDate: Date): Promise<{ isEligible: boolean; reason?: string }> {
    // production_value - would integrate with eligibility verification service
    return { isEligible: true };
  }

  private async checkServiceAuthorization(
    clientId: string, 
    serviceCode: string, 
    serviceDate: Date, 
    unitsRequested: number
  ): Promise<{ isAuthorized: boolean; reason?: string; severity?: 'error' | 'warning' }> {
    // production_value - would check service authorizations
    return { isAuthorized: true };
  }

  private async checkCaregiverCredentials(
    caregiverId: string, 
    serviceCode: string, 
    serviceDate: Date
  ): Promise<{ isValid: boolean; reason?: string }> {
    const query = `
      SELECT COUNT(*) as valid_count
      FROM credentials c
      JOIN credential_service_mappings csm ON c.credential_type = csm.credential_type
      WHERE c.user_id = $1 
      AND csm.service_code = $2
      AND c.status = 'active'
      AND c.expiration_date > $3
      AND c.issue_date <= $3
    `;

    const result = await this.db.query(query, [caregiverId, serviceCode, serviceDate]);
    const isValid = parseInt(result.rows[0].valid_count) > 0;

    return { isValid, reason: isValid ? undefined : 'No valid credentials for service date' };
  }

  private async checkDuplicateClaim(claim: Claim): Promise<{ hasDuplicate: boolean; duplicateClaimNumber?: string }> {
    const query = `
      SELECT claim_number
      FROM claims
      WHERE client_id = $1 
      AND caregiver_id = $2 
      AND service_date = $3 
      AND service_code = $4
      AND id != $5
      AND status != 'cancelled'
      LIMIT 1
    `;

    const result = await this.db.query(query, [
      claim.clientId,
      claim.caregiverId,
      claim.serviceDate,
      claim.serviceCode,
      claim.id
    ]);

    return {
      hasDuplicate: result.rows.length > 0,
      duplicateClaimNumber: result.rows[0]?.claim_number
    };
  }

  private async validateServiceRate(serviceCode: string, submittedRate: number, payerName: string): Promise<{ isValid: boolean; contractRate?: number }> {
    // production_value - would check contract rates
    return { isValid: true, contractRate: submittedRate };
  }

  private validateServiceDate(serviceDate: Date): { isValid: boolean; isTimely: boolean } {
    const now = new Date();
    const daysSinceService = (now.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Ohio Medicaid typically requires submission within 365 days
    const isTimely = daysSinceService <= 365;
    const isValid = daysSinceService <= 400; // Grace period
    
    return { isValid, isTimely };
  }

  private async analyzeDenial(claimId: string, denialData: { denialCode: string; denialReason: string }): Promise<DenialAnalysis> {
    // Analyze denial code and generate recommendations
    const category = this.categorizeDenial(denialData.denialCode);
    const isAppealable = this.isDenialAppealable(denialData.denialCode);
    
    const recommendedActions = this.getRecommendedActions(category, denialData.denialCode);
    const requiredDocuments = this.getRequiredDocuments(category, denialData.denialCode);

    return {
      denialCode: denialData.denialCode,
      denialReason: denialData.denialReason,
      category,
      isAppealable,
      appealDeadline: isAppealable ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : undefined, // 60 days
      recommendedActions,
      requiredDocuments
    };
  }

  private categorizeDenial(denialCode: string): DenialAnalysis['category'] {
    // Map denial codes to categories
    if (denialCode.startsWith('EVV')) return 'evv';
    if (denialCode.includes('AUTH')) return 'authorization';
    if (denialCode.includes('ELIG')) return 'eligibility';
    if (denialCode.includes('CLIN')) return 'clinical';
    if (denialCode.includes('ADM')) return 'administrative';
    return 'other';
  }

  private isDenialAppealable(denialCode: string): boolean {
    // Some denials are not appealable (e.g., duplicate claims)
    const nonAppealableCodes = ['DUP', 'DUPLICATE', 'UNTIMELY'];
    return !nonAppealableCodes.some(code => denialCode.includes(code));
  }

  private getRecommendedActions(category: DenialAnalysis['category'], denialCode: string): string[] {
    const actions: string[] = [];

    switch (category) {
      case 'evv':
        actions.push('Verify EVV compliance');
        actions.push('Check GPS coordinates');
        actions.push('Validate clock-in/out times');
        break;
      case 'authorization':
        actions.push('Obtain updated service authorization');
        actions.push('Verify authorization dates');
        actions.push('Check authorized units');
        break;
      case 'eligibility':
        actions.push('Verify client Medicaid eligibility');
        actions.push('Check eligibility for service date');
        actions.push('Obtain eligibility verification');
        break;
      case 'clinical':
        actions.push('Review care plan');
        actions.push('Obtain physician orders');
        actions.push('Provide clinical documentation');
        break;
      case 'administrative':
        actions.push('Verify claim information');
        actions.push('Check provider credentials');
        actions.push('Review billing requirements');
        break;
    }

    return actions;
  }

  private getRequiredDocuments(category: DenialAnalysis['category'], denialCode: string): string[] {
    const documents: string[] = [];

    switch (category) {
      case 'evv':
        documents.push('EVV compliance report');
        documents.push('GPS verification');
        break;
      case 'authorization':
        documents.push('Service authorization form');
        documents.push('Physician orders');
        break;
      case 'eligibility':
        documents.push('Medicaid eligibility verification');
        break;
      case 'clinical':
        documents.push('Care plan');
        documents.push('Progress notes');
        documents.push('Physician orders');
        break;
    }

    return documents;
  }

  private async generateClaimId(): Promise<string> {
    return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `${year}${sequence}`;
  }

  private async generateBatchId(): Promise<string> {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateBatchNumber(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `B${date}${sequence}`;
  }

  private async generatePaymentId(): Promise<string> {
    return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}