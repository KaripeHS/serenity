/**
 * Background Check Service
 * Manages background check requests, tracking, and compliance reporting
 *
 * Ohio Compliance Requirements:
 * - BCI check required for all caregivers
 * - FBI check required if lived outside Ohio in past 5 years
 * - Checks valid for 5 years (organization may require more frequent)
 * - OIG/SAM exclusion check required for Medicaid billing
 *
 * @module services/background-check
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('background-check-service');

export interface BackgroundCheck {
  id: string;
  organizationId: string;
  caregiverId?: string;
  employeeId?: string;
  applicantId?: string;
  checkType: 'bci' | 'fbi' | 'bci_fbi' | 'oig_sam' | 'driving_record' | 'reference' | 'employment' | 'education' | 'drug_screen';
  checkProvider?: string;
  requestedAt: string;
  requestedBy?: string;
  reason: 'new_hire' | 'annual_renewal' | 'incident_triggered' | 'license_renewal' | 'promotion' | 'random';
  submittedAt?: string;
  submissionReference?: string;
  fingerprintDate?: string;
  fingerprintLocation?: string;
  completedAt?: string;
  status: 'pending' | 'submitted' | 'in_progress' | 'completed' | 'expired' | 'failed';
  result?: 'clear' | 'flagged' | 'disqualifying' | 'pending_review';
  findings?: any[];
  disqualifyingOffenses?: string[];
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewDecision?: 'approved' | 'conditional' | 'denied' | 'appeal_pending';
  conditions?: string;
  expiresAt?: string;
  daysUntilExpiry?: number;
  subjectType?: 'caregiver' | 'employee' | 'applicant';
  subjectName?: string;
  healthStatus?: string;
}

export interface BackgroundCheckStats {
  total: number;
  clear: number;
  flagged: number;
  disqualifying: number;
  inProgress: number;
  expired: number;
  expiringSoon: number;
  needsReview: number;
}

export interface CaregiverComplianceStatus {
  caregiverId: string;
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string;
  latestCheckId?: string;
  latestCheckType?: string;
  latestCheckDate?: string;
  latestExpiresAt?: string;
  checkStatus: 'never_checked' | 'expired' | 'expiring_soon' | 'in_progress' | 'valid';
  daysUntilExpiry: number;
}

class BackgroundCheckService {
  /**
   * Get all background checks for an organization
   */
  async getBackgroundChecks(
    organizationId: string,
    options: {
      status?: string;
      checkType?: string;
      caregiverId?: string;
      employeeId?: string;
      applicantId?: string;
      healthStatus?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<BackgroundCheck[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM background_check_dashboard
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (options.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(options.status);
    }
    if (options.checkType) {
      query += ` AND check_type = $${params.length + 1}`;
      params.push(options.checkType);
    }
    if (options.caregiverId) {
      query += ` AND subject_id = $${params.length + 1} AND subject_type = 'caregiver'`;
      params.push(options.caregiverId);
    }
    if (options.employeeId) {
      query += ` AND subject_id = $${params.length + 1} AND subject_type = 'employee'`;
      params.push(options.employeeId);
    }
    if (options.applicantId) {
      query += ` AND subject_id = $${params.length + 1} AND subject_type = 'applicant'`;
      params.push(options.applicantId);
    }
    if (options.healthStatus) {
      query += ` AND health_status = $${params.length + 1}`;
      params.push(options.healthStatus);
    }

    query += ` ORDER BY requested_at DESC`;

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }
    if (options.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const result = await db.query(query, params);

    return result.rows.map(this.mapBackgroundCheckRow);
  }

  /**
   * Get a single background check by ID
   */
  async getBackgroundCheckById(
    checkId: string,
    organizationId: string
  ): Promise<BackgroundCheck | null> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM background_check_dashboard
       WHERE id = $1 AND organization_id = $2`,
      [checkId, organizationId]
    );

    if (result.rows.length === 0) return null;

    return this.mapBackgroundCheckRow(result.rows[0]);
  }

  /**
   * Create a new background check request
   */
  async createBackgroundCheck(
    organizationId: string,
    data: {
      caregiverId?: string;
      employeeId?: string;
      applicantId?: string;
      checkType: string;
      checkProvider?: string;
      reason: string;
      requestedBy: string;
      livedOutsideOhio5yr?: boolean;
      subjectDob?: string;
      subjectSsnLast4?: string;
    }
  ): Promise<BackgroundCheck> {
    const db = await getDbClient();

    // Validate that exactly one subject type is provided
    const subjectCount = [data.caregiverId, data.employeeId, data.applicantId].filter(Boolean).length;
    if (subjectCount !== 1) {
      throw new Error('Exactly one of caregiverId, employeeId, or applicantId must be provided');
    }

    // Calculate expiration (5 years from now for Ohio compliance)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 5);

    const result = await db.query(
      `INSERT INTO background_checks (
        organization_id, caregiver_id, employee_id, applicant_id,
        check_type, check_provider, reason, requested_by,
        lived_outside_ohio_5yr, subject_dob, subject_ssn_last4,
        expires_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
      RETURNING id`,
      [
        organizationId,
        data.caregiverId,
        data.employeeId,
        data.applicantId,
        data.checkType,
        data.checkProvider,
        data.reason,
        data.requestedBy,
        data.livedOutsideOhio5yr || false,
        data.subjectDob,
        data.subjectSsnLast4,
        expiresAt.toISOString().split('T')[0],
      ]
    );

    logger.info('Background check created', {
      checkId: result.rows[0].id,
      checkType: data.checkType,
      reason: data.reason,
    });

    return this.getBackgroundCheckById(result.rows[0].id, organizationId) as Promise<BackgroundCheck>;
  }

  /**
   * Submit background check to provider
   */
  async submitToProvider(
    checkId: string,
    organizationId: string,
    data: {
      submissionReference?: string;
      fingerprintDate?: string;
      fingerprintLocation?: string;
    }
  ): Promise<BackgroundCheck | null> {
    const db = await getDbClient();

    await db.query(
      `UPDATE background_checks
       SET status = 'submitted',
           submitted_at = NOW(),
           submission_reference = $3,
           fingerprint_date = $4,
           fingerprint_location = $5,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [
        checkId,
        organizationId,
        data.submissionReference,
        data.fingerprintDate,
        data.fingerprintLocation,
      ]
    );

    logger.info('Background check submitted', { checkId });

    return this.getBackgroundCheckById(checkId, organizationId);
  }

  /**
   * Record background check results
   */
  async recordResults(
    checkId: string,
    organizationId: string,
    data: {
      result: 'clear' | 'flagged' | 'disqualifying' | 'pending_review';
      findings?: any[];
      disqualifyingOffenses?: string[];
      reportFileUrl?: string;
    }
  ): Promise<BackgroundCheck | null> {
    const db = await getDbClient();

    await db.query(
      `UPDATE background_checks
       SET status = 'completed',
           completed_at = NOW(),
           result = $3,
           findings = $4,
           disqualifying_offenses = $5,
           report_file_url = $6,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [
        checkId,
        organizationId,
        data.result,
        JSON.stringify(data.findings || []),
        data.disqualifyingOffenses,
        data.reportFileUrl,
      ]
    );

    logger.info('Background check results recorded', {
      checkId,
      result: data.result,
    });

    return this.getBackgroundCheckById(checkId, organizationId);
  }

  /**
   * Review flagged background check
   */
  async reviewCheck(
    checkId: string,
    organizationId: string,
    data: {
      reviewerId: string;
      decision: 'approved' | 'conditional' | 'denied' | 'appeal_pending';
      reviewNotes?: string;
      conditions?: string;
    }
  ): Promise<BackgroundCheck | null> {
    const db = await getDbClient();

    await db.query(
      `UPDATE background_checks
       SET reviewed_by = $3,
           reviewed_at = NOW(),
           review_decision = $4,
           review_notes = $5,
           conditions = $6,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [
        checkId,
        organizationId,
        data.reviewerId,
        data.decision,
        data.reviewNotes,
        data.conditions,
      ]
    );

    logger.info('Background check reviewed', {
      checkId,
      decision: data.decision,
      reviewerId: data.reviewerId,
    });

    return this.getBackgroundCheckById(checkId, organizationId);
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStats(organizationId: string): Promise<BackgroundCheckStats> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM background_check_compliance WHERE organization_id = $1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      return {
        total: 0,
        clear: 0,
        flagged: 0,
        disqualifying: 0,
        inProgress: 0,
        expired: 0,
        expiringSoon: 0,
        needsReview: 0,
      };
    }

    const row = result.rows[0];
    return {
      total: parseInt(row.total_checks) || 0,
      clear: parseInt(row.clear_count) || 0,
      flagged: parseInt(row.flagged_count) || 0,
      disqualifying: parseInt(row.disqualifying_count) || 0,
      inProgress: parseInt(row.in_progress_count) || 0,
      expired: parseInt(row.expired_count) || 0,
      expiringSoon: parseInt(row.expiring_soon_count) || 0,
      needsReview: parseInt(row.needs_review_count) || 0,
    };
  }

  /**
   * Get caregivers needing background checks
   */
  async getCaregiversNeedingChecks(
    organizationId: string,
    options: {
      status?: 'never_checked' | 'expired' | 'expiring_soon' | 'in_progress' | 'valid';
      limit?: number;
    } = {}
  ): Promise<CaregiverComplianceStatus[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM caregivers_needing_background_check
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (options.status) {
      query += ` AND check_status = $2`;
      params.push(options.status);
    }

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      caregiverId: row.caregiver_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      hireDate: row.hire_date,
      latestCheckId: row.latest_check_id,
      latestCheckType: row.latest_check_type,
      latestCheckDate: row.latest_check_date,
      latestExpiresAt: row.latest_expires_at,
      checkStatus: row.check_status,
      daysUntilExpiry: parseInt(row.days_until_expiry) || 0,
    }));
  }

  /**
   * Check if a caregiver has valid background check
   */
  async hasValidCheck(
    caregiverId: string,
    checkTypes: string[] = ['bci', 'bci_fbi']
  ): Promise<boolean> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT has_valid_background_check($1, $2) AS is_valid`,
      [caregiverId, checkTypes]
    );

    return result.rows[0]?.is_valid || false;
  }

  /**
   * Get disqualifying offenses catalog
   */
  async getDisqualifyingOffenses(): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM disqualifying_offense_codes ORDER BY offense_type, offense_code`
    );

    return result.rows;
  }

  /**
   * Run expiration check and send reminders
   */
  async runExpirationCheck(organizationId: string): Promise<{
    expired: number;
    expiringSoon: number;
    remindersSent: number;
  }> {
    const db = await getDbClient();

    // Mark expired checks
    const expiredResult = await db.query(`
      UPDATE background_checks
      SET status = 'expired', updated_at = NOW()
      WHERE organization_id = $1
        AND status = 'completed'
        AND expires_at < CURRENT_DATE
      RETURNING id
    `, [organizationId]);

    // Get expiring soon checks that haven't had reminders sent
    const expiringSoonResult = await db.query(`
      UPDATE background_checks
      SET renewal_reminder_sent = TRUE, updated_at = NOW()
      WHERE organization_id = $1
        AND status = 'completed'
        AND expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
        AND renewal_reminder_sent = FALSE
      RETURNING id, caregiver_id, employee_id
    `, [organizationId]);

    // TODO: Send actual reminder notifications here

    logger.info('Background check expiration check completed', {
      organizationId,
      expired: expiredResult.rowCount,
      remindersSent: expiringSoonResult.rowCount,
    });

    return {
      expired: expiredResult.rowCount || 0,
      expiringSoon: expiringSoonResult.rowCount || 0,
      remindersSent: expiringSoonResult.rowCount || 0,
    };
  }

  /**
   * Add reference check to a background check
   */
  async addReferenceCheck(
    backgroundCheckId: string,
    organizationId: string,
    data: {
      referenceName: string;
      referenceRelationship: string;
      referenceCompany?: string;
      referencePhone?: string;
      referenceEmail?: string;
    }
  ): Promise<{ id: string }> {
    const db = await getDbClient();

    // Verify background check belongs to org
    const checkResult = await db.query(
      `SELECT id FROM background_checks WHERE id = $1 AND organization_id = $2`,
      [backgroundCheckId, organizationId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Background check not found');
    }

    const result = await db.query(
      `INSERT INTO reference_checks (
        background_check_id, reference_name, reference_relationship,
        reference_company, reference_phone, reference_email
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        backgroundCheckId,
        data.referenceName,
        data.referenceRelationship,
        data.referenceCompany,
        data.referencePhone,
        data.referenceEmail,
      ]
    );

    return { id: result.rows[0].id };
  }

  /**
   * Complete a reference check
   */
  async completeReferenceCheck(
    referenceCheckId: string,
    organizationId: string,
    data: {
      completedBy: string;
      questionsAsked?: any[];
      responses?: any[];
      overallRating?: number;
      wouldRehire?: string;
      concernsRaised?: boolean;
      concernDetails?: string;
      verifiedEmployment?: boolean;
      verifiedDatesMatch?: boolean;
      verifiedTitleMatch?: boolean;
      notes?: string;
    }
  ): Promise<{ success: boolean }> {
    const db = await getDbClient();

    await db.query(
      `UPDATE reference_checks rc
       SET contact_successful = TRUE,
           contacted_at = NOW(),
           questions_asked = $3,
           responses = $4,
           overall_rating = $5,
           would_rehire = $6,
           concerns_raised = $7,
           concern_details = $8,
           verified_employment = $9,
           verified_dates_match = $10,
           verified_title_match = $11,
           notes = $12,
           completed_at = NOW(),
           completed_by = $13
       FROM background_checks bc
       WHERE rc.id = $1
         AND rc.background_check_id = bc.id
         AND bc.organization_id = $2`,
      [
        referenceCheckId,
        organizationId,
        JSON.stringify(data.questionsAsked || []),
        JSON.stringify(data.responses || []),
        data.overallRating,
        data.wouldRehire,
        data.concernsRaised || false,
        data.concernDetails,
        data.verifiedEmployment,
        data.verifiedDatesMatch,
        data.verifiedTitleMatch,
        data.notes,
        data.completedBy,
      ]
    );

    return { success: true };
  }

  private mapBackgroundCheckRow(row: any): BackgroundCheck {
    return {
      id: row.id,
      organizationId: row.organization_id,
      caregiverId: row.caregiver_id,
      employeeId: row.employee_id,
      applicantId: row.applicant_id,
      checkType: row.check_type,
      checkProvider: row.check_provider,
      requestedAt: row.requested_at,
      requestedBy: row.requested_by,
      reason: row.reason,
      submittedAt: row.submitted_at,
      submissionReference: row.submission_reference,
      fingerprintDate: row.fingerprint_date,
      fingerprintLocation: row.fingerprint_location,
      completedAt: row.completed_at,
      status: row.status,
      result: row.result,
      findings: row.findings,
      disqualifyingOffenses: row.disqualifying_offenses,
      reviewNotes: row.review_notes,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewDecision: row.review_decision,
      conditions: row.conditions,
      expiresAt: row.expires_at,
      daysUntilExpiry: row.days_until_expiry,
      subjectType: row.subject_type,
      subjectName: row.subject_name,
      healthStatus: row.health_status,
    };
  }
}

export const backgroundCheckService = new BackgroundCheckService();
