/**
 * Offer Letter Service
 * Manages offer letter generation, approval, and tracking
 *
 * @module services/offer-letter
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('offer-letter-service');

interface OfferLetterFilters {
  applicantId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateOfferLetterData {
  applicantId: string;
  jobRequisitionId?: string;
  positionTitle: string;
  department?: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temp';
  salaryType: 'hourly' | 'salary' | 'per_visit';
  payRate: number;
  payFrequency?: string;
  includesBonusProgram?: boolean;
  bonusDetails?: Record<string, any>;
  benefitsTier?: string;
  ptoDays?: number;
  sickDays?: number;
  benefitsStartDate?: string;
  benefitsDetails?: Record<string, any>;
  expectedHoursPerWeek?: number;
  scheduleType?: string;
  scheduleNotes?: string;
  proposedStartDate: string;
  responseDeadline?: string;
  contingencies?: string[];
  specialConditions?: string;
}

interface UpdateOfferLetterData {
  status?: string;
  payRate?: number;
  proposedStartDate?: string;
  responseDeadline?: string;
  specialConditions?: string;
}

class OfferLetterService {
  /**
   * Get offer letters with filters
   */
  async getOfferLetters(
    organizationId: string,
    filters: OfferLetterFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        ol.*,
        a.first_name || ' ' || a.last_name AS applicant_name,
        a.email AS applicant_email,
        a.phone AS applicant_phone,
        u_created.first_name || ' ' || u_created.last_name AS created_by_name,
        u_approved.first_name || ' ' || u_approved.last_name AS approved_by_name
      FROM offer_letters ol
      JOIN applicants a ON a.id = ol.applicant_id
      LEFT JOIN users u_created ON u_created.id = ol.created_by
      LEFT JOIN users u_approved ON u_approved.id = ol.approved_by
      WHERE ol.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.applicantId) {
      query += ` AND ol.applicant_id = $${paramIndex++}`;
      params.push(filters.applicantId);
    }

    if (filters.status) {
      query += ` AND ol.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.fromDate) {
      query += ` AND ol.created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND ol.created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ` ORDER BY ol.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single offer letter by ID
   */
  async getOfferLetterById(
    offerLetterId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        ol.*,
        a.first_name || ' ' || a.last_name AS applicant_name,
        a.email AS applicant_email,
        a.phone AS applicant_phone,
        a.address AS applicant_address,
        u_created.first_name || ' ' || u_created.last_name AS created_by_name,
        u_approved.first_name || ' ' || u_approved.last_name AS approved_by_name
      FROM offer_letters ol
      JOIN applicants a ON a.id = ol.applicant_id
      LEFT JOIN users u_created ON u_created.id = ol.created_by
      LEFT JOIN users u_approved ON u_approved.id = ol.approved_by
      WHERE ol.id = $1 AND ol.organization_id = $2
    `,
      [offerLetterId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new offer letter
   */
  async createOfferLetter(
    organizationId: string,
    data: CreateOfferLetterData,
    createdBy: string
  ): Promise<any> {
    const db = await getDbClient();

    // Verify applicant belongs to organization
    const applicantCheck = await db.query(
      `SELECT id, first_name, last_name FROM applicants WHERE id = $1 AND organization_id = $2`,
      [data.applicantId, organizationId]
    );

    if (applicantCheck.rows.length === 0) {
      throw new Error('Applicant not found');
    }

    // Default bonus details for caregivers
    const defaultBonusDetails = {
      ninetyDay: 150,
      showUp: 100,
      hours: true,
      loyalty: true,
    };

    // Default contingencies for home care
    const defaultContingencies = [
      'background_check',
      'drug_screen',
      'credential_verification',
    ];

    // Generate offer letter content
    const applicant = applicantCheck.rows[0];
    const offerContent = this.generateOfferLetterContent({
      applicantName: `${applicant.first_name} ${applicant.last_name}`,
      ...data,
      bonusDetails: data.bonusDetails || defaultBonusDetails,
    });

    const result = await db.query(
      `
      INSERT INTO offer_letters (
        organization_id,
        applicant_id,
        job_requisition_id,
        position_title,
        department,
        employment_type,
        salary_type,
        pay_rate,
        pay_frequency,
        includes_bonus_program,
        bonus_details,
        benefits_tier,
        pto_days,
        sick_days,
        benefits_start_date,
        benefits_details,
        expected_hours_per_week,
        schedule_type,
        schedule_notes,
        proposed_start_date,
        response_deadline,
        contingencies,
        special_conditions,
        offer_letter_content,
        status,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, 'draft', $25
      )
      RETURNING *
    `,
      [
        organizationId,
        data.applicantId,
        data.jobRequisitionId,
        data.positionTitle,
        data.department,
        data.employmentType,
        data.salaryType,
        data.payRate,
        data.payFrequency || 'biweekly',
        data.includesBonusProgram !== false,
        JSON.stringify(data.bonusDetails || defaultBonusDetails),
        data.benefitsTier,
        data.ptoDays || 0,
        data.sickDays || 0,
        data.benefitsStartDate,
        data.benefitsDetails ? JSON.stringify(data.benefitsDetails) : null,
        data.expectedHoursPerWeek,
        data.scheduleType,
        data.scheduleNotes,
        data.proposedStartDate,
        data.responseDeadline,
        data.contingencies || defaultContingencies,
        data.specialConditions,
        offerContent,
        createdBy,
      ]
    );

    logger.info('Offer letter created', {
      offerLetterId: result.rows[0].id,
      applicantId: data.applicantId,
      position: data.positionTitle,
    });

    return result.rows[0];
  }

  /**
   * Update an offer letter
   */
  async updateOfferLetter(
    offerLetterId: string,
    organizationId: string,
    data: UpdateOfferLetterData
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getOfferLetterById(offerLetterId, organizationId);
    if (!existing) {
      return null;
    }

    // Only allow updates in draft or pending_approval status
    if (!['draft', 'pending_approval'].includes(existing.status)) {
      throw new Error('Cannot update offer letter in current status');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      payRate: 'pay_rate',
      proposedStartDate: 'proposed_start_date',
      responseDeadline: 'response_deadline',
      specialConditions: 'special_conditions',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof UpdateOfferLetterData] !== undefined) {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(data[key as keyof UpdateOfferLetterData]);
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = NOW()');
    values.push(offerLetterId);

    const result = await db.query(
      `
      UPDATE offer_letters
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0];
  }

  /**
   * Submit offer letter for approval
   */
  async submitForApproval(
    offerLetterId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'pending_approval',
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND status = 'draft'
      RETURNING *
    `,
      [offerLetterId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Offer letter submitted for approval', { offerLetterId });
    }

    return result.rows[0] || null;
  }

  /**
   * Approve an offer letter
   */
  async approveOfferLetter(
    offerLetterId: string,
    organizationId: string,
    approvedBy: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3 AND status = 'pending_approval'
      RETURNING *
    `,
      [approvedBy, offerLetterId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Offer letter approved', { offerLetterId, approvedBy });
    }

    return result.rows[0] || null;
  }

  /**
   * Send offer letter to applicant
   */
  async sendOfferLetter(
    offerLetterId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getOfferLetterById(offerLetterId, organizationId);
    if (!existing) {
      return null;
    }

    if (existing.status !== 'approved') {
      throw new Error('Offer letter must be approved before sending');
    }

    // Set response deadline if not set (7 days from now)
    const responseDeadline = existing.response_deadline ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'sent',
          sent_at = NOW(),
          response_deadline = COALESCE(response_deadline, $1),
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [responseDeadline, offerLetterId, organizationId]
    );

    // Update applicant stage
    if (result.rows[0]) {
      await db.query(
        `
        UPDATE applicants
        SET current_stage = 'offer',
            status = 'offer_pending',
            updated_at = NOW()
        WHERE id = $1
      `,
        [existing.applicant_id]
      );

      logger.info('Offer letter sent', { offerLetterId });
    }

    // TODO: Send actual email notification

    return result.rows[0] || null;
  }

  /**
   * Mark offer letter as viewed
   */
  async markViewed(
    offerLetterId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE offer_letters
      SET viewed_at = COALESCE(viewed_at, NOW()),
          status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `,
      [offerLetterId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Accept an offer letter
   */
  async acceptOfferLetter(
    offerLetterId: string,
    organizationId: string,
    actualStartDate?: string,
    signedOfferUrl?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getOfferLetterById(offerLetterId, organizationId);
    if (!existing) {
      return null;
    }

    if (!['sent', 'viewed'].includes(existing.status)) {
      throw new Error('Offer letter is not in a state that can be accepted');
    }

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'accepted',
          accepted_at = NOW(),
          responded_at = NOW(),
          actual_start_date = COALESCE($1, proposed_start_date),
          signed_offer_file_url = $2,
          updated_at = NOW()
      WHERE id = $3 AND organization_id = $4
      RETURNING *
    `,
      [actualStartDate, signedOfferUrl, offerLetterId, organizationId]
    );

    // Update applicant status
    if (result.rows[0]) {
      await db.query(
        `
        UPDATE applicants
        SET status = 'hired',
            current_stage = 'onboarding',
            hired_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = $1
      `,
        [existing.applicant_id]
      );

      logger.info('Offer letter accepted', { offerLetterId });
    }

    return result.rows[0] || null;
  }

  /**
   * Decline an offer letter
   */
  async declineOfferLetter(
    offerLetterId: string,
    organizationId: string,
    reason?: string,
    counterOfferRequested?: boolean,
    counterOfferNotes?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'declined',
          responded_at = NOW(),
          decline_reason = $1,
          counter_offer_requested = $2,
          counter_offer_notes = $3,
          updated_at = NOW()
      WHERE id = $4 AND organization_id = $5
      RETURNING *
    `,
      [reason, counterOfferRequested || false, counterOfferNotes, offerLetterId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Offer letter declined', {
        offerLetterId,
        reason,
        counterOfferRequested,
      });
    }

    return result.rows[0] || null;
  }

  /**
   * Rescind an offer letter
   */
  async rescindOfferLetter(
    offerLetterId: string,
    organizationId: string,
    reason: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'rescinded',
          special_conditions = COALESCE(special_conditions || E'\n', '') || 'RESCINDED: ' || $1,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [reason, offerLetterId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Offer letter rescinded', { offerLetterId, reason });
    }

    return result.rows[0] || null;
  }

  /**
   * Get offer letter statistics
   */
  async getOfferLetterStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_offers,
        COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
        COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent,
        COUNT(*) FILTER (WHERE status = 'viewed') AS viewed,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
        COUNT(*) FILTER (WHERE status = 'declined') AS declined,
        COUNT(*) FILTER (WHERE status = 'expired') AS expired,
        COUNT(*) FILTER (WHERE status = 'rescinded') AS rescinded,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL /
           NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'declined')), 0)) * 100,
          1
        ) AS acceptance_rate,
        AVG(EXTRACT(EPOCH FROM (responded_at - sent_at)) / 86400)
          FILTER (WHERE responded_at IS NOT NULL AND sent_at IS NOT NULL) AS avg_response_days
      FROM offer_letters
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    return result.rows[0];
  }

  /**
   * Get pipeline view
   */
  async getPipelineView(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM offer_letter_pipeline WHERE organization_id = $1`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Check for expired offers and update status
   */
  async checkExpiredOffers(organizationId: string): Promise<number> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE offer_letters
      SET status = 'expired',
          updated_at = NOW()
      WHERE organization_id = $1
        AND status IN ('sent', 'viewed')
        AND response_deadline < CURRENT_DATE
      RETURNING id
    `,
      [organizationId]
    );

    if (result.rows.length > 0) {
      logger.info('Expired offer letters', {
        count: result.rows.length,
        organizationId,
      });
    }

    return result.rows.length;
  }

  /**
   * Generate offer letter content
   */
  private generateOfferLetterContent(data: any): string {
    const payDescription =
      data.salaryType === 'hourly'
        ? `$${data.payRate.toFixed(2)} per hour`
        : data.salaryType === 'salary'
        ? `$${data.payRate.toFixed(2)} annually`
        : `$${data.payRate.toFixed(2)} per visit`;

    const hoursDescription = data.expectedHoursPerWeek
      ? `approximately ${data.expectedHoursPerWeek} hours per week`
      : 'as scheduled';

    const startDate = new Date(data.proposedStartDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let bonusSection = '';
    if (data.includesBonusProgram !== false && data.bonusDetails) {
      bonusSection = `

BONUS PROGRAM:
As a valued team member, you will be eligible for our comprehensive bonus program:
• 90-Day Bonus: $${data.bonusDetails.ninetyDay || 150} after 90 days of successful employment
• Show Up Bonus: $${data.bonusDetails.showUp || 100} quarterly for maintaining 95%+ attendance and EVV compliance
• Hours Bonus: 1% of eligible earnings paid in June and December
• Loyalty Bonus: $200-$500 based on tenure milestones

Bonus eligibility requires maintaining good standing with no substantiated complaints and meeting attendance/EVV requirements.`;
    }

    const content = `
OFFER OF EMPLOYMENT

Dear ${data.applicantName},

We are pleased to offer you the position of ${data.positionTitle} at Serenity Care Partners. After careful consideration of your qualifications and interviews, we believe you will be an excellent addition to our care team.

POSITION DETAILS:
• Position: ${data.positionTitle}
${data.department ? `• Department: ${data.department}` : ''}
• Employment Type: ${data.employmentType.replace('_', ' ').toUpperCase()}
• Compensation: ${payDescription}
• Pay Frequency: ${(data.payFrequency || 'biweekly').charAt(0).toUpperCase() + (data.payFrequency || 'biweekly').slice(1)}
• Expected Hours: ${hoursDescription}
• Start Date: ${startDate}
${bonusSection}

${data.benefitsTier ? `
BENEFITS:
• Benefits Tier: ${data.benefitsTier}
• PTO Days: ${data.ptoDays || 0}
• Sick Days: ${data.sickDays || 0}
${data.benefitsStartDate ? `• Benefits Start: ${data.benefitsStartDate}` : ''}
` : ''}

CONTINGENCIES:
This offer is contingent upon successful completion of the following:
${(data.contingencies || ['background_check', 'drug_screen', 'credential_verification'])
  .map((c: string) => `• ${c.replace(/_/g, ' ').toUpperCase()}`)
  .join('\n')}

${data.specialConditions ? `
ADDITIONAL TERMS:
${data.specialConditions}
` : ''}

Please indicate your acceptance of this offer by signing below and returning this letter${data.responseDeadline ? ` by ${new Date(data.responseDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

We are excited about the possibility of you joining our team and look forward to working together to provide exceptional care to our clients.

Sincerely,

Serenity Care Partners
Human Resources

---

ACCEPTANCE:

I, ${data.applicantName}, accept the offer of employment as described above.

Signature: ___________________________ Date: _______________

Printed Name: ${data.applicantName}
`;

    return content.trim();
  }
}

export const offerLetterService = new OfferLetterService();
