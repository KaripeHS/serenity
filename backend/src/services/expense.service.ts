/**
 * Expense Service
 * Manages caregiver expense claims and mileage tracking
 * BIC Feature: Caregivers log mileage and expenses via mobile app
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const db = getDbClient();
const logger = createLogger('expense-service');

// Types
export interface ExpenseCategory {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  isMileage: boolean;
  mileageRatePerMile?: number;
  maxAmount?: number;
  requiresReceipt: boolean;
  requiresApproval: boolean;
  payrollCode?: string;
  isActive: boolean;
}

export interface ExpenseClaim {
  id: string;
  organizationId: string;
  caregiverId: string;
  caregiverName?: string;
  claimNumber: string;
  categoryId: string;
  categoryName?: string;
  categoryCode?: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  submittedAt: string;
  visitId?: string;
  clientId?: string;
  clientName?: string;
  isMileage: boolean;
  startLocation?: string;
  endLocation?: string;
  miles?: number;
  mileageRate?: number;
  receiptUrl?: string;
  receiptFilename?: string;
  receiptUploadedAt?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'void';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  paidAt?: string;
  payrollRunId?: string;
  paymentReference?: string;
}

export interface MileageLog {
  id: string;
  caregiverId: string;
  expenseClaimId?: string;
  logDate: string;
  startTime?: string;
  endTime?: string;
  startAddress: string;
  startLat?: number;
  startLng?: number;
  endAddress: string;
  endLat?: number;
  endLng?: number;
  purpose: 'client_visit' | 'between_clients' | 'office' | 'training' | 'other';
  visitId?: string;
  clientId?: string;
  clientName?: string;
  odometerStart?: number;
  odometerEnd?: number;
  calculatedMiles?: number;
  reportedMiles?: number;
  finalMiles?: number;
  gpsTracked: boolean;
  gpsRoute?: any;
  notes?: string;
}

export interface ExpenseDashboard {
  pendingApproval: number;
  approvedUnpaid: number;
  pendingAmount: number;
  approvedAmount: number;
  paidThisMonth: number;
  caregiversSubmittedThisWeek: number;
  avgHoursToReview: number;
}

export interface CaregiverExpenseSummary {
  caregiverId: string;
  month: string;
  totalClaims: number;
  approvedClaims: number;
  paidClaims: number;
  totalApproved: number;
  totalPaid: number;
  totalMiles: number;
  mileageAmount: number;
  otherAmount: number;
}

class ExpenseService {
  // ==========================================
  // Dashboard & Reports
  // ==========================================

  /**
   * Get expense dashboard stats
   */
  async getDashboard(organizationId: string): Promise<ExpenseDashboard> {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'submitted') AS pending_approval,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved_unpaid,
        COALESCE(SUM(amount) FILTER (WHERE status = 'submitted'), 0) AS pending_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS approved_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND paid_at >= DATE_TRUNC('month', NOW())), 0) AS paid_this_month,
        COUNT(DISTINCT caregiver_id) FILTER (WHERE submitted_at >= DATE_TRUNC('week', NOW())) AS caregivers_submitted_this_week,
        COALESCE(AVG(
          EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 3600
        ) FILTER (WHERE status IN ('approved', 'rejected')), 0) AS avg_hours_to_review
      FROM expense_claims
      WHERE organization_id = $1
    `, [organizationId]);

    const row = result.rows[0];
    return {
      pendingApproval: parseInt(row.pending_approval) || 0,
      approvedUnpaid: parseInt(row.approved_unpaid) || 0,
      pendingAmount: parseFloat(row.pending_amount) || 0,
      approvedAmount: parseFloat(row.approved_amount) || 0,
      paidThisMonth: parseFloat(row.paid_this_month) || 0,
      caregiversSubmittedThisWeek: parseInt(row.caregivers_submitted_this_week) || 0,
      avgHoursToReview: parseFloat(row.avg_hours_to_review) || 0,
    };
  }

  /**
   * Get caregiver expense summary
   */
  async getCaregiverSummary(
    caregiverId: string,
    month?: string
  ): Promise<CaregiverExpenseSummary[]> {
    let query = `
      SELECT
        caregiver_id,
        DATE_TRUNC('month', expense_date)::DATE AS month,
        COUNT(*) AS total_claims,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved_claims,
        COUNT(*) FILTER (WHERE status = 'paid') AS paid_claims,
        COALESCE(SUM(amount) FILTER (WHERE status IN ('approved', 'paid')), 0) AS total_approved,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_paid,
        COALESCE(SUM(miles) FILTER (WHERE is_mileage AND status IN ('approved', 'paid')), 0) AS total_miles,
        COALESCE(SUM(amount) FILTER (WHERE is_mileage AND status IN ('approved', 'paid')), 0) AS mileage_amount,
        COALESCE(SUM(amount) FILTER (WHERE NOT is_mileage AND status IN ('approved', 'paid')), 0) AS other_amount
      FROM expense_claims
      WHERE caregiver_id = $1
    `;

    const params: any[] = [caregiverId];

    if (month) {
      query += ` AND DATE_TRUNC('month', expense_date) = $2`;
      params.push(month);
    }

    query += ` GROUP BY caregiver_id, DATE_TRUNC('month', expense_date) ORDER BY month DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      caregiverId: row.caregiver_id,
      month: row.month,
      totalClaims: parseInt(row.total_claims) || 0,
      approvedClaims: parseInt(row.approved_claims) || 0,
      paidClaims: parseInt(row.paid_claims) || 0,
      totalApproved: parseFloat(row.total_approved) || 0,
      totalPaid: parseFloat(row.total_paid) || 0,
      totalMiles: parseFloat(row.total_miles) || 0,
      mileageAmount: parseFloat(row.mileage_amount) || 0,
      otherAmount: parseFloat(row.other_amount) || 0,
    }));
  }

  // ==========================================
  // Expense Categories
  // ==========================================

  /**
   * Get expense categories
   */
  async getCategories(organizationId: string): Promise<ExpenseCategory[]> {
    const result = await db.query(`
      SELECT * FROM expense_categories
      WHERE organization_id = $1 AND is_active = TRUE
      ORDER BY name
    `, [organizationId]);

    return result.rows.map(this.mapCategory);
  }

  /**
   * Get mileage rate for organization
   */
  async getMileageRate(organizationId: string): Promise<number> {
    const result = await db.query(`
      SELECT mileage_rate_per_mile FROM expense_categories
      WHERE organization_id = $1 AND is_mileage = TRUE AND is_active = TRUE
      LIMIT 1
    `, [organizationId]);

    return result.rows[0]?.mileage_rate_per_mile || 0.67; // Default IRS rate
  }

  // ==========================================
  // Expense Claims
  // ==========================================

  /**
   * Get expense claims
   */
  async getExpenseClaims(organizationId: string, filters?: {
    status?: string;
    caregiverId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ claims: ExpenseClaim[]; count: number }> {
    let query = `
      SELECT ec.*,
        c.first_name || ' ' || c.last_name AS caregiver_name,
        cat.name AS category_name,
        cat.code AS category_code,
        cl.first_name || ' ' || cl.last_name AS client_name
      FROM expense_claims ec
      JOIN caregivers c ON c.id = ec.caregiver_id
      JOIN expense_categories cat ON cat.id = ec.category_id
      LEFT JOIN clients cl ON cl.id = ec.client_id
      WHERE ec.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND ec.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.caregiverId) {
      query += ` AND ec.caregiver_id = $${paramIndex++}`;
      params.push(filters.caregiverId);
    }

    if (filters?.categoryId) {
      query += ` AND ec.category_id = $${paramIndex++}`;
      params.push(filters.categoryId);
    }

    if (filters?.dateFrom) {
      query += ` AND ec.expense_date >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND ec.expense_date <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }

    query += ` ORDER BY ec.submitted_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);

    return {
      claims: result.rows.map(this.mapClaim),
      count: result.rows.length,
    };
  }

  /**
   * Get pending claims for approval
   */
  async getPendingApprovals(organizationId: string): Promise<ExpenseClaim[]> {
    const result = await db.query(`
      SELECT ec.*,
        c.first_name || ' ' || c.last_name AS caregiver_name,
        cat.name AS category_name,
        cat.code AS category_code,
        cl.first_name || ' ' || cl.last_name AS client_name
      FROM expense_claims ec
      JOIN caregivers c ON c.id = ec.caregiver_id
      JOIN expense_categories cat ON cat.id = ec.category_id
      LEFT JOIN clients cl ON cl.id = ec.client_id
      WHERE ec.organization_id = $1 AND ec.status = 'submitted'
      ORDER BY ec.submitted_at
    `, [organizationId]);

    return result.rows.map(this.mapClaim);
  }

  /**
   * Get caregiver's expense claims
   */
  async getCaregiverClaims(caregiverId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ExpenseClaim[]> {
    let query = `
      SELECT ec.*,
        cat.name AS category_name,
        cat.code AS category_code,
        cl.first_name || ' ' || cl.last_name AS client_name
      FROM expense_claims ec
      JOIN expense_categories cat ON cat.id = ec.category_id
      LEFT JOIN clients cl ON cl.id = ec.client_id
      WHERE ec.caregiver_id = $1
    `;

    const params: any[] = [caregiverId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND ec.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.dateFrom) {
      query += ` AND ec.expense_date >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND ec.expense_date <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }

    query += ` ORDER BY ec.expense_date DESC`;

    const result = await db.query(query, params);

    return result.rows.map(this.mapClaim);
  }

  /**
   * Create expense claim
   */
  async createExpenseClaim(data: {
    organizationId: string;
    caregiverId: string;
    categoryId: string;
    description: string;
    amount: number;
    expenseDate: string;
    visitId?: string;
    clientId?: string;
    isMileage?: boolean;
    startLocation?: string;
    endLocation?: string;
    miles?: number;
    mileageRate?: number;
    receiptUrl?: string;
    receiptFilename?: string;
    status?: 'draft' | 'submitted';
  }): Promise<ExpenseClaim> {
    const claimNumber = 'EXP-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const result = await db.query(`
      INSERT INTO expense_claims (
        organization_id, caregiver_id, category_id, description,
        amount, expense_date, shift_id, client_id,
        is_mileage, start_location, end_location, miles, mileage_rate,
        receipt_url, receipt_filename, receipt_uploaded_at, status, claim_number
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::text, $15,
        CASE WHEN $14::text IS NOT NULL THEN NOW() ELSE NULL END,
        $16, $17
      )
      RETURNING *
    `, [
      data.organizationId, data.caregiverId, data.categoryId, data.description,
      data.amount, data.expenseDate, data.visitId, data.clientId,
      data.isMileage || false, data.startLocation, data.endLocation,
      data.miles, data.mileageRate, data.receiptUrl, data.receiptFilename,
      data.status || 'submitted', claimNumber
    ]);

    logger.info('Expense claim created', {
      claimId: result.rows[0].id,
      caregiverId: data.caregiverId,
      amount: data.amount
    });

    return this.mapClaim(result.rows[0]);
  }

  /**
   * Approve expense claim
   */
  async approveClaim(
    claimId: string,
    organizationId: string,
    reviewerId: string,
    notes?: string
  ): Promise<ExpenseClaim | null> {
    const result = await db.query(`
      UPDATE expense_claims
      SET status = 'approved',
          reviewed_by = $3,
          reviewed_at = NOW(),
          review_notes = $4,
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND status = 'submitted'
      RETURNING *
    `, [claimId, organizationId, reviewerId, notes]);

    if (!result.rows[0]) return null;

    logger.info('Expense claim approved', { claimId, reviewerId });

    return this.mapClaim(result.rows[0]);
  }

  /**
   * Reject expense claim
   */
  async rejectClaim(
    claimId: string,
    organizationId: string,
    reviewerId: string,
    reason: string
  ): Promise<ExpenseClaim | null> {
    const result = await db.query(`
      UPDATE expense_claims
      SET status = 'rejected',
          reviewed_by = $3,
          reviewed_at = NOW(),
          rejection_reason = $4,
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND status = 'submitted'
      RETURNING *
    `, [claimId, organizationId, reviewerId, reason]);

    if (!result.rows[0]) return null;

    logger.info('Expense claim rejected', { claimId, reviewerId, reason });

    return this.mapClaim(result.rows[0]);
  }

  /**
   * Mark claims as paid (bulk)
   */
  async markClaimsAsPaid(
    claimIds: string[],
    organizationId: string,
    payrollRunId?: string,
    paymentReference?: string
  ): Promise<number> {
    const result = await db.query(`
      UPDATE expense_claims
      SET status = 'paid',
          paid_at = NOW(),
          payroll_run_id = $3,
          payment_reference = $4,
          updated_at = NOW()
      WHERE id = ANY($1) AND organization_id = $2 AND status = 'approved'
      RETURNING id
    `, [claimIds, organizationId, payrollRunId, paymentReference]);

    logger.info('Expense claims marked as paid', {
      count: result.rows.length,
      payrollRunId
    });

    return result.rows.length;
  }

  // ==========================================
  // Mileage Logging
  // ==========================================

  /**
   * Log a mileage entry
   */
  async logMileage(data: {
    caregiverId: string;
    logDate: string;
    startTime?: string;
    endTime?: string;
    startAddress: string;
    startLat?: number;
    startLng?: number;
    endAddress: string;
    endLat?: number;
    endLng?: number;
    purpose: MileageLog['purpose'];
    visitId?: string;
    clientId?: string;
    odometerStart?: number;
    odometerEnd?: number;
    reportedMiles: number;
    gpsTracked?: boolean;
    gpsRoute?: any;
    notes?: string;
  }): Promise<MileageLog> {
    // Calculate miles from odometer if provided
    let calculatedMiles: number | undefined;
    if (data.odometerStart && data.odometerEnd) {
      calculatedMiles = data.odometerEnd - data.odometerStart;
    }

    const result = await db.query(`
      INSERT INTO mileage_logs (
        caregiver_id, log_date, start_time, end_time,
        start_address, start_lat, start_lng,
        end_address, end_lat, end_lng,
        purpose, visit_id, client_id,
        odometer_start, odometer_end, calculated_miles,
        reported_miles, final_miles,
        gps_tracked, gps_route, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, COALESCE($16, $17),
        $18, $19, $20
      )
      RETURNING *
    `, [
      data.caregiverId, data.logDate, data.startTime, data.endTime,
      data.startAddress, data.startLat, data.startLng,
      data.endAddress, data.endLat, data.endLng,
      data.purpose, data.visitId, data.clientId,
      data.odometerStart, data.odometerEnd, calculatedMiles,
      data.reportedMiles, data.gpsTracked || false, data.gpsRoute, data.notes
    ]);

    logger.info('Mileage logged', {
      caregiverId: data.caregiverId,
      miles: data.reportedMiles,
      purpose: data.purpose
    });

    return this.mapMileageLog(result.rows[0]);
  }

  /**
   * Get mileage logs for caregiver
   */
  async getMileageLogs(caregiverId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    unsubmitted?: boolean;
  }): Promise<MileageLog[]> {
    let query = `
      SELECT ml.*, c.first_name || ' ' || c.last_name AS client_name
      FROM mileage_logs ml
      LEFT JOIN clients c ON c.id = ml.client_id
      WHERE ml.caregiver_id = $1
    `;

    const params: any[] = [caregiverId];
    let paramIndex = 2;

    if (filters?.dateFrom) {
      query += ` AND ml.log_date >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND ml.log_date <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }

    if (filters?.unsubmitted) {
      query += ` AND ml.expense_claim_id IS NULL`;
    }

    query += ` ORDER BY ml.log_date DESC, ml.start_time DESC`;

    const result = await db.query(query, params);

    return result.rows.map(this.mapMileageLog);
  }

  /**
   * Calculate mileage reimbursement
   */
  async calculateMileageReimbursement(
    caregiverId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalMiles: number;
    reimbursementAmount: number;
    tripCount: number;
    byPurpose: Record<string, { miles: number; trips: number }>;
  }> {
    // Get organization for rate
    const caregiverResult = await db.query(`
      SELECT organization_id FROM caregivers WHERE id = $1
    `, [caregiverId]);

    const rate = await this.getMileageRate(caregiverResult.rows[0]?.organization_id);

    const result = await db.query(`
      SELECT
        COALESCE(SUM(final_miles), 0) AS total_miles,
        COUNT(*) AS trip_count,
        purpose,
        SUM(final_miles) FILTER (WHERE purpose = purpose) AS purpose_miles,
        COUNT(*) FILTER (WHERE purpose = purpose) AS purpose_trips
      FROM mileage_logs
      WHERE caregiver_id = $1
        AND log_date BETWEEN $2 AND $3
        AND expense_claim_id IS NULL
      GROUP BY purpose
    `, [caregiverId, startDate, endDate]);

    let totalMiles = 0;
    let tripCount = 0;
    const byPurpose: Record<string, { miles: number; trips: number }> = {};

    result.rows.forEach(row => {
      totalMiles += parseFloat(row.total_miles) || 0;
      tripCount += parseInt(row.trip_count) || 0;
      if (row.purpose) {
        byPurpose[row.purpose] = {
          miles: parseFloat(row.purpose_miles) || 0,
          trips: parseInt(row.purpose_trips) || 0,
        };
      }
    });

    return {
      totalMiles,
      reimbursementAmount: totalMiles * rate,
      tripCount,
      byPurpose,
    };
  }

  /**
   * Create mileage claim from logs
   */
  async createMileageClaim(
    caregiverId: string,
    startDate: string,
    endDate: string
  ): Promise<ExpenseClaim | null> {
    // Get caregiver org
    const caregiverResult = await db.query(`
      SELECT organization_id FROM caregivers WHERE id = $1
    `, [caregiverId]);

    if (!caregiverResult.rows[0]) return null;

    const organizationId = caregiverResult.rows[0].organization_id;

    // Get mileage category
    const categoryResult = await db.query(`
      SELECT id, mileage_rate_per_mile FROM expense_categories
      WHERE organization_id = $1 AND is_mileage = TRUE AND is_active = TRUE
      LIMIT 1
    `, [organizationId]);

    if (!categoryResult.rows[0]) return null;

    const categoryId = categoryResult.rows[0].id;
    const rate = categoryResult.rows[0].mileage_rate_per_mile || 0.67;

    // Calculate total
    const calculation = await this.calculateMileageReimbursement(caregiverId, startDate, endDate);

    if (calculation.totalMiles === 0) return null;

    // Create claim
    const claim = await this.createExpenseClaim({
      organizationId,
      caregiverId,
      categoryId,
      description: `Mileage reimbursement for ${startDate} to ${endDate}`,
      amount: calculation.reimbursementAmount,
      expenseDate: endDate,
      isMileage: true,
      miles: calculation.totalMiles,
      mileageRate: rate,
    });

    // Link mileage logs to claim
    await db.query(`
      UPDATE mileage_logs
      SET expense_claim_id = $1
      WHERE caregiver_id = $2
        AND log_date BETWEEN $3 AND $4
        AND expense_claim_id IS NULL
    `, [claim.id, caregiverId, startDate, endDate]);

    logger.info('Mileage claim created from logs', {
      claimId: claim.id,
      caregiverId,
      totalMiles: calculation.totalMiles,
      amount: calculation.reimbursementAmount
    });

    return claim;
  }

  // ==========================================
  // Mappers
  // ==========================================

  private mapCategory(row: any): ExpenseCategory {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      code: row.code,
      description: row.description,
      isMileage: row.is_mileage,
      mileageRatePerMile: row.mileage_rate_per_mile,
      maxAmount: row.max_amount,
      requiresReceipt: row.requires_receipt,
      requiresApproval: row.requires_approval,
      payrollCode: row.payroll_code,
      isActive: row.is_active,
    };
  }

  private mapClaim(row: any): ExpenseClaim {
    return {
      id: row.id,
      organizationId: row.organization_id,
      caregiverId: row.caregiver_id,
      caregiverName: row.caregiver_name,
      claimNumber: row.claim_number,
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryCode: row.category_code,
      description: row.description,
      amount: parseFloat(row.amount),
      currency: row.currency,
      expenseDate: row.expense_date,
      submittedAt: row.submitted_at,
      visitId: row.shift_id, // Map shift_id to visitId
      clientId: row.client_id,
      clientName: row.client_name,
      isMileage: row.is_mileage,
      startLocation: row.start_location,
      endLocation: row.end_location,
      miles: row.miles ? parseFloat(row.miles) : undefined,
      mileageRate: row.mileage_rate ? parseFloat(row.mileage_rate) : undefined,
      receiptUrl: row.receipt_url,
      receiptFilename: row.receipt_filename,
      receiptUploadedAt: row.receipt_uploaded_at,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      rejectionReason: row.rejection_reason,
      paidAt: row.paid_at,
      payrollRunId: row.payroll_run_id,
      paymentReference: row.payment_reference,
    };
  }

  private mapMileageLog(row: any): MileageLog {
    return {
      id: row.id,
      caregiverId: row.caregiver_id,
      expenseClaimId: row.expense_claim_id,
      logDate: row.log_date,
      startTime: row.start_time,
      endTime: row.end_time,
      startAddress: row.start_address,
      startLat: row.start_lat,
      startLng: row.start_lng,
      endAddress: row.end_address,
      endLat: row.end_lat,
      endLng: row.end_lng,
      purpose: row.purpose,
      visitId: row.visit_id,
      clientId: row.client_id,
      clientName: row.client_name,
      odometerStart: row.odometer_start,
      odometerEnd: row.odometer_end,
      calculatedMiles: row.calculated_miles ? parseFloat(row.calculated_miles) : undefined,
      reportedMiles: row.reported_miles ? parseFloat(row.reported_miles) : undefined,
      finalMiles: row.final_miles ? parseFloat(row.final_miles) : undefined,
      gpsTracked: row.gps_tracked,
      gpsRoute: row.gps_route,
      notes: row.notes,
    };
  }
}

export const expenseService = new ExpenseService();
