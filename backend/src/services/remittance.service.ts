/**
 * Remittance Service
 * Handles 835 Electronic Remittance Advice processing and auto-posting
 *
 * @module services/remittance
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('remittance-service');

interface RemittanceFilters {
  status?: string;
  payerId?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateRemittanceData {
  remittanceNumber: string;
  payerId: string;
  payerName?: string;
  checkDate?: string;
  paymentDate?: string;
  paymentMethod?: 'check' | 'eft' | 'vcp';
  checkNumber?: string;
  eftTraceNumber?: string;
  totalPayment: number;
  totalClaims: number;
  fileName?: string;
  filePath?: string;
  rawContent?: string;
}

interface ClaimDetailData {
  payerClaimId?: string;
  patientAccountNumber?: string;
  claimStatusCode?: string;
  claimStatusText?: string;
  chargeAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  adjustmentAmount?: number;
  serviceLines?: any[];
  adjustmentReasonCodes?: any[];
}

class RemittanceService {
  /**
   * Get remittances with filters
   */
  async getRemittances(
    organizationId: string,
    filters: RemittanceFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM remittance_processing_status
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.payerId) {
      query += ` AND payer_id = $${paramIndex++}`;
      params.push(filters.payerId);
    }

    if (filters.fromDate) {
      query += ` AND received_date >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND received_date <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ` ORDER BY received_date DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single remittance by ID with details
   */
  async getRemittanceById(
    remittanceId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const remittanceResult = await db.query(
      `
      SELECT ra.*,
        u.first_name || ' ' || u.last_name AS processed_by_name
      FROM remittance_advice ra
      LEFT JOIN users u ON u.id = ra.processed_by
      WHERE ra.id = $1 AND ra.organization_id = $2
    `,
      [remittanceId, organizationId]
    );

    if (remittanceResult.rows.length === 0) {
      return null;
    }

    const remittance = remittanceResult.rows[0];

    // Get claim details
    const detailsResult = await db.query(
      `
      SELECT rcd.*,
        cl.claim_number,
        c.first_name || ' ' || c.last_name AS client_name
      FROM remittance_claim_details rcd
      LEFT JOIN claim_lines cl ON cl.id = rcd.claim_line_id
      LEFT JOIN clients c ON c.id = cl.client_id
      WHERE rcd.remittance_id = $1
      ORDER BY rcd.created_at
    `,
      [remittanceId]
    );

    return {
      ...remittance,
      claimDetails: detailsResult.rows,
    };
  }

  /**
   * Create a new remittance record (from 835 import)
   */
  async createRemittance(
    organizationId: string,
    data: CreateRemittanceData
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO remittance_advice (
        organization_id,
        remittance_number,
        payer_id,
        payer_name,
        check_date,
        payment_date,
        payment_method,
        check_number,
        eft_trace_number,
        total_payment,
        total_claims,
        file_name,
        file_path,
        raw_content,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'received')
      RETURNING *
    `,
      [
        organizationId,
        data.remittanceNumber,
        data.payerId,
        data.payerName,
        data.checkDate,
        data.paymentDate,
        data.paymentMethod,
        data.checkNumber,
        data.eftTraceNumber,
        data.totalPayment,
        data.totalClaims,
        data.fileName,
        data.filePath,
        data.rawContent,
      ]
    );

    logger.info('Remittance created', {
      remittanceId: result.rows[0].id,
      number: data.remittanceNumber,
      amount: data.totalPayment,
    });

    return result.rows[0];
  }

  /**
   * Add claim details to remittance
   */
  async addClaimDetail(
    remittanceId: string,
    data: ClaimDetailData
  ): Promise<any> {
    const db = await getDbClient();

    // Try to match claim line by patient account number
    let claimLineId = null;
    if (data.patientAccountNumber) {
      const matchResult = await db.query(
        `SELECT id FROM claim_lines WHERE claim_number = $1`,
        [data.patientAccountNumber]
      );
      if (matchResult.rows.length > 0) {
        claimLineId = matchResult.rows[0].id;
      }
    }

    const result = await db.query(
      `
      INSERT INTO remittance_claim_details (
        remittance_id,
        claim_line_id,
        payer_claim_id,
        patient_account_number,
        claim_status_code,
        claim_status_text,
        charge_amount,
        paid_amount,
        patient_responsibility,
        adjustment_amount,
        service_lines,
        adjustment_reason_codes,
        posting_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        remittanceId,
        claimLineId,
        data.payerClaimId,
        data.patientAccountNumber,
        data.claimStatusCode,
        data.claimStatusText,
        data.chargeAmount,
        data.paidAmount,
        data.patientResponsibility,
        data.adjustmentAmount,
        JSON.stringify(data.serviceLines || []),
        JSON.stringify(data.adjustmentReasonCodes || []),
        claimLineId ? 'pending' : 'skipped',
      ]
    );

    return result.rows[0];
  }

  /**
   * Auto-post remittance to claim lines
   */
  async autoPostRemittance(
    remittanceId: string,
    organizationId: string,
    userId: string
  ): Promise<any> {
    const db = await getDbClient();

    // Verify remittance belongs to organization
    const checkResult = await db.query(
      `SELECT id FROM remittance_advice WHERE id = $1 AND organization_id = $2`,
      [remittanceId, organizationId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Remittance not found');
    }

    // Call the auto-post function
    const result = await db.query(
      `SELECT auto_post_remittance($1, $2) AS result`,
      [remittanceId, userId]
    );

    const postResult = result.rows[0].result;

    logger.info('Remittance auto-posted', {
      remittanceId,
      posted: postResult.posted,
      errors: postResult.errors,
      skipped: postResult.skipped,
    });

    return postResult;
  }

  /**
   * Manually post a single claim detail
   */
  async manualPostClaimDetail(
    detailId: string,
    organizationId: string,
    userId: string,
    claimLineId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    // Verify and get detail
    const detailResult = await db.query(
      `
      SELECT rcd.*, ra.organization_id
      FROM remittance_claim_details rcd
      JOIN remittance_advice ra ON ra.id = rcd.remittance_id
      WHERE rcd.id = $1 AND ra.organization_id = $2
    `,
      [detailId, organizationId]
    );

    if (detailResult.rows.length === 0) {
      return null;
    }

    const detail = detailResult.rows[0];

    // Update claim line
    await db.query(
      `
      UPDATE claim_lines
      SET
        status = CASE
          WHEN $1::DECIMAL > 0 THEN 'paid'
          WHEN $2::DECIMAL > 0 THEN 'adjusted'
          ELSE 'rejected'
        END,
        paid_amount = $1,
        adjustment_amount = $2,
        payer_claim_id = $3,
        adjudication_date = CURRENT_DATE,
        updated_at = NOW()
      WHERE id = $4
    `,
      [
        detail.paid_amount,
        detail.adjustment_amount,
        detail.payer_claim_id,
        claimLineId,
      ]
    );

    // Update detail as posted
    const result = await db.query(
      `
      UPDATE remittance_claim_details
      SET claim_line_id = $1,
          posting_status = 'posted',
          posted_at = NOW(),
          posted_by = $2
      WHERE id = $3
      RETURNING *
    `,
      [claimLineId, userId, detailId]
    );

    logger.info('Claim detail manually posted', {
      detailId,
      claimLineId,
      postedBy: userId,
    });

    return result.rows[0];
  }

  /**
   * Get remittance statistics
   */
  async getRemittanceStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_remittances,
        COUNT(*) FILTER (WHERE status = 'received') AS pending_parsing,
        COUNT(*) FILTER (WHERE status = 'parsed') AS pending_posting,
        COUNT(*) FILTER (WHERE status = 'posting') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'posted') AS fully_posted,
        COUNT(*) FILTER (WHERE status = 'partial') AS partial,
        COUNT(*) FILTER (WHERE status = 'error') AS errors,
        SUM(total_payment) AS total_payments,
        SUM(total_claims) AS total_claims,
        SUM(claims_paid) AS total_claims_paid,
        SUM(claims_denied) AS total_claims_denied
      FROM remittance_advice
      WHERE organization_id = $1
        AND received_date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [organizationId]
    );

    return result.rows[0];
  }

  /**
   * Parse 835 file content
   * Note: This is a simplified parser - production would use a full X12 library
   */
  async parse835Content(
    remittanceId: string,
    organizationId: string,
    content: string
  ): Promise<any> {
    const db = await getDbClient();

    // Update status to parsing
    await db.query(
      `UPDATE remittance_advice SET status = 'parsing' WHERE id = $1`,
      [remittanceId]
    );

    try {
      // Basic 835 parsing (simplified)
      // In production, use a proper X12 library like node-x12
      const segments = content.split('~');
      let claimsProcessed = 0;
      let claimsPaid = 0;
      let claimsDenied = 0;

      let currentClaim: any = null;

      for (const segment of segments) {
        const elements = segment.trim().split('*');
        const segmentId = elements[0];

        switch (segmentId) {
          case 'CLP': // Claim payment info
            if (currentClaim) {
              // Save previous claim
              await this.addClaimDetail(remittanceId, currentClaim);
              claimsProcessed++;
              if (currentClaim.paidAmount > 0) claimsPaid++;
              else claimsDenied++;
            }
            currentClaim = {
              patientAccountNumber: elements[1],
              claimStatusCode: elements[2],
              chargeAmount: parseFloat(elements[3]) || 0,
              paidAmount: parseFloat(elements[4]) || 0,
              patientResponsibility: parseFloat(elements[5]) || 0,
              payerClaimId: elements[7],
              adjustmentReasonCodes: [],
            };
            break;

          case 'CAS': // Claim adjustment
            if (currentClaim && elements.length >= 4) {
              currentClaim.adjustmentReasonCodes.push({
                group: elements[1],
                code: elements[2],
                amount: parseFloat(elements[3]) || 0,
              });
              currentClaim.adjustmentAmount =
                (currentClaim.adjustmentAmount || 0) + (parseFloat(elements[3]) || 0);
            }
            break;
        }
      }

      // Save last claim
      if (currentClaim) {
        await this.addClaimDetail(remittanceId, currentClaim);
        claimsProcessed++;
        if (currentClaim.paidAmount > 0) claimsPaid++;
        else claimsDenied++;
      }

      // Update remittance status
      await db.query(
        `
        UPDATE remittance_advice
        SET status = 'parsed',
            claims_paid = $1,
            claims_denied = $2,
            processing_date = NOW()
        WHERE id = $3
      `,
        [claimsPaid, claimsDenied, remittanceId]
      );

      logger.info('835 parsed successfully', {
        remittanceId,
        claimsProcessed,
        claimsPaid,
        claimsDenied,
      });

      return {
        success: true,
        claimsProcessed,
        claimsPaid,
        claimsDenied,
      };
    } catch (error) {
      // Update with error
      await db.query(
        `
        UPDATE remittance_advice
        SET status = 'error',
            error_message = $1
        WHERE id = $2
      `,
        [(error as Error).message, remittanceId]
      );

      throw error;
    }
  }
}

export const remittanceService = new RemittanceService();
