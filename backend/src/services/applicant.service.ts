/**
 * Applicant Tracking Service
 * Manages the recruiting pipeline from application to hiring
 *
 * @module services/applicant
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('applicant-service');

interface ApplicantFilters {
  status?: string;
  stage?: string;
  positionAppliedFor?: string;
  source?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

interface CreateApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  positionAppliedFor: string;
  source?: string;
  referredBy?: string;
  resumeFileId?: string;
  coverLetterFileId?: string;
  experienceLevel?: string;
  certifications?: string[];
  skills?: string[];
  availability?: Record<string, boolean>;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  availableStartDate?: string;
}

interface UpdateApplicantData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  currentStage?: string;
  aiScreeningScore?: number;
  aiScreeningNotes?: string;
  backgroundCheckStatus?: string;
  referenceCheckStatus?: string;
  rejectionReason?: string;
}

class ApplicantService {
  /**
   * Get applicants with filters
   */
  async getApplicants(
    organizationId: string,
    filters: ApplicantFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        a.*,
        u.first_name || ' ' || u.last_name AS created_by_name,
        r.first_name || ' ' || r.last_name AS referred_by_name,
        (SELECT COUNT(*) FROM interviews i WHERE i.applicant_id = a.id) AS interview_count,
        (SELECT MAX(i.scheduled_date) FROM interviews i WHERE i.applicant_id = a.id AND i.status = 'scheduled') AS next_interview
      FROM applicants a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN employees r ON r.id = a.referred_by
      WHERE a.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.stage) {
      query += ` AND a.current_stage = $${paramIndex++}`;
      params.push(filters.stage);
    }

    if (filters.positionAppliedFor) {
      query += ` AND a.position_applied_for = $${paramIndex++}`;
      params.push(filters.positionAppliedFor);
    }

    if (filters.source) {
      query += ` AND a.source = $${paramIndex++}`;
      params.push(filters.source);
    }

    if (filters.fromDate) {
      query += ` AND a.application_date >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND a.application_date <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    if (filters.search) {
      query += ` AND (
        a.first_name ILIKE $${paramIndex} OR
        a.last_name ILIKE $${paramIndex} OR
        a.email ILIKE $${paramIndex} OR
        a.phone ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY a.application_date DESC, a.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single applicant by ID
   */
  async getApplicantById(
    applicantId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        a.*,
        u.first_name || ' ' || u.last_name AS created_by_name,
        r.first_name || ' ' || r.last_name AS referred_by_name
      FROM applicants a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN employees r ON r.id = a.referred_by
      WHERE a.id = $1 AND a.organization_id = $2
    `,
      [applicantId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new applicant
   */
  async createApplicant(
    organizationId: string,
    data: CreateApplicantData,
    createdBy: string
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO applicants (
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        date_of_birth,
        position_applied_for,
        source,
        referred_by,
        resume_file_id,
        cover_letter_file_id,
        experience_level,
        certifications,
        skills,
        availability,
        desired_salary_min,
        desired_salary_max,
        available_start_date,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `,
      [
        organizationId,
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.address,
        data.dateOfBirth,
        data.positionAppliedFor,
        data.source || 'website',
        data.referredBy,
        data.resumeFileId,
        data.coverLetterFileId,
        data.experienceLevel || 'entry',
        data.certifications || [],
        data.skills || [],
        data.availability || {},
        data.desiredSalaryMin,
        data.desiredSalaryMax,
        data.availableStartDate,
        createdBy,
      ]
    );

    logger.info('Applicant created', {
      applicantId: result.rows[0].id,
      position: data.positionAppliedFor,
    });

    return result.rows[0];
  }

  /**
   * Update an applicant
   */
  async updateApplicant(
    applicantId: string,
    organizationId: string,
    data: UpdateApplicantData
  ): Promise<any | null> {
    const db = await getDbClient();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      address: 'address',
      status: 'status',
      currentStage: 'current_stage',
      aiScreeningScore: 'ai_screening_score',
      aiScreeningNotes: 'ai_screening_notes',
      backgroundCheckStatus: 'background_check_status',
      referenceCheckStatus: 'reference_check_status',
      rejectionReason: 'rejection_reason',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof UpdateApplicantData] !== undefined) {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(data[key as keyof UpdateApplicantData]);
      }
    }

    if (fields.length === 0) {
      return this.getApplicantById(applicantId, organizationId);
    }

    fields.push('updated_at = NOW()');
    values.push(applicantId, organizationId);

    const result = await db.query(
      `
      UPDATE applicants
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Advance applicant to next stage
   */
  async advanceStage(
    applicantId: string,
    organizationId: string,
    newStage: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const stageOrder = [
      'application',
      'ai_screening',
      'phone_screen',
      'interviews',
      'final_review',
      'offer',
      'onboarding',
    ];

    const statusMap: Record<string, string> = {
      application: 'new',
      ai_screening: 'screening',
      phone_screen: 'screening',
      interviews: 'interviewing',
      final_review: 'reference_check',
      offer: 'offer_pending',
      onboarding: 'hired',
    };

    const result = await db.query(
      `
      UPDATE applicants
      SET current_stage = $1,
          status = $2,
          updated_at = NOW()
      WHERE id = $3 AND organization_id = $4
      RETURNING *
    `,
      [newStage, statusMap[newStage] || 'screening', applicantId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Applicant stage advanced', {
        applicantId,
        newStage,
        newStatus: statusMap[newStage],
      });
    }

    return result.rows[0] || null;
  }

  /**
   * Reject an applicant
   */
  async rejectApplicant(
    applicantId: string,
    organizationId: string,
    reason: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE applicants
      SET status = 'rejected',
          rejection_reason = $1,
          rejection_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [reason, applicantId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Applicant rejected', { applicantId, reason });
    }

    return result.rows[0] || null;
  }

  /**
   * Mark applicant as hired
   */
  async markHired(
    applicantId: string,
    organizationId: string,
    employeeId?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE applicants
      SET status = 'hired',
          current_stage = 'onboarding',
          hired_date = CURRENT_DATE,
          hired_as_employee_id = $1,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [employeeId, applicantId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Applicant marked as hired', { applicantId, employeeId });
    }

    return result.rows[0] || null;
  }

  /**
   * Get pipeline summary
   */
  async getPipelineSummary(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT * FROM recruiting_pipeline_summary
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    // Also get conversion rates
    const conversionResult = await db.query(
      `
      SELECT
        COUNT(*) AS total_applicants,
        COUNT(*) FILTER (WHERE status = 'hired') AS total_hired,
        COUNT(*) FILTER (WHERE status = 'rejected') AS total_rejected,
        COUNT(*) FILTER (WHERE status NOT IN ('hired', 'rejected', 'withdrawn')) AS active_pipeline,
        COUNT(*) FILTER (WHERE application_date >= CURRENT_DATE - INTERVAL '30 days') AS last_30_days,
        COUNT(*) FILTER (WHERE application_date >= CURRENT_DATE - INTERVAL '7 days') AS last_7_days
      FROM applicants
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    return {
      byStage: result.rows,
      metrics: conversionResult.rows[0],
    };
  }

  /**
   * Get applicants needing action
   */
  async getApplicantsNeedingAction(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        a.*,
        CASE
          WHEN a.current_stage = 'application' AND a.application_date < CURRENT_DATE - INTERVAL '3 days'
            THEN 'Review application (>3 days old)'
          WHEN a.current_stage = 'ai_screening' AND a.ai_screening_score IS NULL
            THEN 'Complete AI screening'
          WHEN a.current_stage = 'interviews' AND NOT EXISTS (
            SELECT 1 FROM interviews i WHERE i.applicant_id = a.id AND i.status = 'scheduled'
          ) THEN 'Schedule interview'
          WHEN a.current_stage = 'reference_check' AND a.reference_check_status = 'not_started'
            THEN 'Start reference check'
          WHEN a.current_stage = 'background_check' AND a.background_check_status = 'not_started'
            THEN 'Start background check'
          WHEN a.current_stage = 'offer' AND NOT EXISTS (
            SELECT 1 FROM offer_letters ol WHERE ol.applicant_id = a.id AND ol.status NOT IN ('declined', 'expired', 'rescinded')
          ) THEN 'Create offer letter'
          ELSE NULL
        END AS action_needed
      FROM applicants a
      WHERE a.organization_id = $1
        AND a.status NOT IN ('hired', 'rejected', 'withdrawn')
      ORDER BY a.application_date ASC
    `,
      [organizationId]
    );

    return result.rows.filter((r) => r.action_needed !== null);
  }

  /**
   * Search for duplicate applicants
   */
  async checkDuplicate(
    organizationId: string,
    email: string,
    phone?: string
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT id, first_name, last_name, email, phone, status, application_date
      FROM applicants
      WHERE organization_id = $1
        AND (email = $2
    `;
    const params: any[] = [organizationId, email];

    if (phone) {
      query += ` OR phone = $3`;
      params.push(phone);
    }

    query += `)`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get source analytics
   */
  async getSourceAnalytics(
    organizationId: string,
    period: string = '90 days'
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        source,
        COUNT(*) AS total_applicants,
        COUNT(*) FILTER (WHERE status = 'hired') AS hired,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'hired')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
          1
        ) AS hire_rate,
        AVG(ai_screening_score) FILTER (WHERE ai_screening_score IS NOT NULL) AS avg_screening_score
      FROM applicants
      WHERE organization_id = $1
        AND application_date >= CURRENT_DATE - $2::INTERVAL
      GROUP BY source
      ORDER BY total_applicants DESC
    `,
      [organizationId, period]
    );

    return result.rows;
  }
}

export const applicantService = new ApplicantService();
