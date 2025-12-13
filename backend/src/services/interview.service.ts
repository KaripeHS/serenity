/**
 * Interview Scheduling Service
 * Manages interview scheduling, tracking, and feedback
 *
 * @module services/interview
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('interview-service');

interface InterviewFilters {
  applicantId?: string;
  interviewerId?: string;
  status?: string;
  interviewType?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateInterviewData {
  applicantId: string;
  interviewType: 'phone' | 'video' | 'in_person' | 'panel';
  scheduledDate: string;
  interviewerId: string;
  secondaryInterviewerId?: string;
  questions?: Array<{
    question: string;
    category: string;
    weight?: number;
  }>;
}

interface UpdateInterviewData {
  scheduledDate?: string;
  interviewerId?: string;
  secondaryInterviewerId?: string;
  status?: string;
}

interface InterviewFeedback {
  responses?: Array<{
    questionIndex: number;
    response: string;
    rating: number;
    notes?: string;
  }>;
  overallRating?: number;
  notes?: string;
  recommendation?: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
}

class InterviewService {
  /**
   * Get interviews with filters
   */
  async getInterviews(
    organizationId: string,
    filters: InterviewFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        i.*,
        a.first_name || ' ' || a.last_name AS applicant_name,
        a.position_applied_for,
        a.email AS applicant_email,
        a.phone AS applicant_phone,
        u1.first_name || ' ' || u1.last_name AS interviewer_name,
        u1.email AS interviewer_email,
        u2.first_name || ' ' || u2.last_name AS secondary_interviewer_name
      FROM interviews i
      JOIN applicants a ON a.id = i.applicant_id
      JOIN users u1 ON u1.id = i.interviewer_id
      LEFT JOIN users u2 ON u2.id = i.secondary_interviewer_id
      WHERE a.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.applicantId) {
      query += ` AND i.applicant_id = $${paramIndex++}`;
      params.push(filters.applicantId);
    }

    if (filters.interviewerId) {
      query += ` AND (i.interviewer_id = $${paramIndex} OR i.secondary_interviewer_id = $${paramIndex})`;
      params.push(filters.interviewerId);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND i.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.interviewType) {
      query += ` AND i.interview_type = $${paramIndex++}`;
      params.push(filters.interviewType);
    }

    if (filters.fromDate) {
      query += ` AND i.scheduled_date >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND i.scheduled_date <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ` ORDER BY i.scheduled_date ASC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single interview by ID
   */
  async getInterviewById(
    interviewId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        i.*,
        a.first_name || ' ' || a.last_name AS applicant_name,
        a.position_applied_for,
        a.email AS applicant_email,
        a.phone AS applicant_phone,
        a.resume_file_id,
        u1.first_name || ' ' || u1.last_name AS interviewer_name,
        u1.email AS interviewer_email,
        u2.first_name || ' ' || u2.last_name AS secondary_interviewer_name
      FROM interviews i
      JOIN applicants a ON a.id = i.applicant_id
      JOIN users u1 ON u1.id = i.interviewer_id
      LEFT JOIN users u2 ON u2.id = i.secondary_interviewer_id
      WHERE i.id = $1 AND a.organization_id = $2
    `,
      [interviewId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Schedule a new interview
   */
  async scheduleInterview(
    organizationId: string,
    data: CreateInterviewData,
    createdBy: string
  ): Promise<any> {
    const db = await getDbClient();

    // Verify applicant belongs to organization
    const applicantCheck = await db.query(
      `SELECT id FROM applicants WHERE id = $1 AND organization_id = $2`,
      [data.applicantId, organizationId]
    );

    if (applicantCheck.rows.length === 0) {
      throw new Error('Applicant not found');
    }

    // Check for scheduling conflicts
    const conflictCheck = await db.query(
      `
      SELECT id FROM interviews
      WHERE interviewer_id = $1
        AND scheduled_date BETWEEN $2::TIMESTAMPTZ - INTERVAL '1 hour' AND $2::TIMESTAMPTZ + INTERVAL '1 hour'
        AND status = 'scheduled'
    `,
      [data.interviewerId, data.scheduledDate]
    );

    if (conflictCheck.rows.length > 0) {
      throw new Error('Interviewer has a scheduling conflict');
    }

    const result = await db.query(
      `
      INSERT INTO interviews (
        applicant_id,
        interview_type,
        scheduled_date,
        interviewer_id,
        secondary_interviewer_id,
        questions,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7)
      RETURNING *
    `,
      [
        data.applicantId,
        data.interviewType,
        data.scheduledDate,
        data.interviewerId,
        data.secondaryInterviewerId,
        JSON.stringify(data.questions || this.getDefaultQuestions(data.interviewType)),
        createdBy,
      ]
    );

    // Update applicant stage if needed
    await db.query(
      `
      UPDATE applicants
      SET current_stage = CASE
        WHEN current_stage IN ('application', 'ai_screening', 'phone_screen') THEN 'interviews'
        ELSE current_stage
      END,
      status = CASE
        WHEN status = 'screening' THEN 'interviewing'
        ELSE status
      END,
      updated_at = NOW()
      WHERE id = $1
    `,
      [data.applicantId]
    );

    logger.info('Interview scheduled', {
      interviewId: result.rows[0].id,
      applicantId: data.applicantId,
      type: data.interviewType,
      scheduledDate: data.scheduledDate,
    });

    return result.rows[0];
  }

  /**
   * Update an interview
   */
  async updateInterview(
    interviewId: string,
    organizationId: string,
    data: UpdateInterviewData
  ): Promise<any | null> {
    const db = await getDbClient();

    // Verify interview belongs to organization
    const existing = await this.getInterviewById(interviewId, organizationId);
    if (!existing) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.scheduledDate) {
      fields.push(`scheduled_date = $${paramIndex++}`);
      values.push(data.scheduledDate);
    }

    if (data.interviewerId) {
      fields.push(`interviewer_id = $${paramIndex++}`);
      values.push(data.interviewerId);
    }

    if (data.secondaryInterviewerId !== undefined) {
      fields.push(`secondary_interviewer_id = $${paramIndex++}`);
      values.push(data.secondaryInterviewerId);
    }

    if (data.status) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return existing;
    }

    values.push(interviewId);

    const result = await db.query(
      `
      UPDATE interviews
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0];
  }

  /**
   * Reschedule an interview
   */
  async rescheduleInterview(
    interviewId: string,
    organizationId: string,
    newDate: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getInterviewById(interviewId, organizationId);
    if (!existing) {
      return null;
    }

    const result = await db.query(
      `
      UPDATE interviews
      SET scheduled_date = $1,
          status = 'rescheduled'
      WHERE id = $2
      RETURNING *
    `,
      [newDate, interviewId]
    );

    // Create a new scheduled interview
    const newInterview = await db.query(
      `
      INSERT INTO interviews (
        applicant_id,
        interview_type,
        scheduled_date,
        interviewer_id,
        secondary_interviewer_id,
        questions,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7)
      RETURNING *
    `,
      [
        existing.applicant_id,
        existing.interview_type,
        newDate,
        existing.interviewer_id,
        existing.secondary_interviewer_id,
        existing.questions,
        existing.created_by,
      ]
    );

    logger.info('Interview rescheduled', {
      oldInterviewId: interviewId,
      newInterviewId: newInterview.rows[0].id,
      newDate,
    });

    return newInterview.rows[0];
  }

  /**
   * Cancel an interview
   */
  async cancelInterview(
    interviewId: string,
    organizationId: string,
    reason?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getInterviewById(interviewId, organizationId);
    if (!existing) {
      return null;
    }

    const result = await db.query(
      `
      UPDATE interviews
      SET status = 'cancelled',
          notes = COALESCE(notes || E'\n', '') || 'Cancelled: ' || $1
      WHERE id = $2
      RETURNING *
    `,
      [reason || 'No reason provided', interviewId]
    );

    logger.info('Interview cancelled', { interviewId, reason });

    return result.rows[0];
  }

  /**
   * Mark interview as no-show
   */
  async markNoShow(
    interviewId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getInterviewById(interviewId, organizationId);
    if (!existing) {
      return null;
    }

    const result = await db.query(
      `
      UPDATE interviews
      SET status = 'no_show'
      WHERE id = $1
      RETURNING *
    `,
      [interviewId]
    );

    logger.info('Interview marked as no-show', { interviewId });

    return result.rows[0];
  }

  /**
   * Submit interview feedback
   */
  async submitFeedback(
    interviewId: string,
    organizationId: string,
    feedback: InterviewFeedback
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getInterviewById(interviewId, organizationId);
    if (!existing) {
      return null;
    }

    const result = await db.query(
      `
      UPDATE interviews
      SET responses = $1,
          overall_rating = $2,
          notes = $3,
          recommendation = $4,
          status = 'completed',
          completed_at = NOW()
      WHERE id = $5
      RETURNING *
    `,
      [
        JSON.stringify(feedback.responses || []),
        feedback.overallRating,
        feedback.notes,
        feedback.recommendation,
        interviewId,
      ]
    );

    logger.info('Interview feedback submitted', {
      interviewId,
      rating: feedback.overallRating,
      recommendation: feedback.recommendation,
    });

    return result.rows[0];
  }

  /**
   * Get upcoming interviews for an interviewer
   */
  async getUpcomingInterviewsForUser(
    userId: string,
    organizationId: string,
    days: number = 7
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        i.*,
        a.first_name || ' ' || a.last_name AS applicant_name,
        a.position_applied_for,
        a.email AS applicant_email,
        a.phone AS applicant_phone
      FROM interviews i
      JOIN applicants a ON a.id = i.applicant_id
      WHERE (i.interviewer_id = $1 OR i.secondary_interviewer_id = $1)
        AND a.organization_id = $2
        AND i.status = 'scheduled'
        AND i.scheduled_date >= NOW()
        AND i.scheduled_date <= NOW() + ($3 || ' days')::INTERVAL
      ORDER BY i.scheduled_date ASC
    `,
      [userId, organizationId, days]
    );

    return result.rows;
  }

  /**
   * Get interview statistics
   */
  async getInterviewStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_interviews,
        COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows,
        ROUND(AVG(overall_rating) FILTER (WHERE overall_rating IS NOT NULL), 1) AS avg_rating,
        COUNT(*) FILTER (WHERE recommendation = 'strong_yes') AS strong_yes_count,
        COUNT(*) FILTER (WHERE recommendation = 'yes') AS yes_count,
        COUNT(*) FILTER (WHERE recommendation = 'maybe') AS maybe_count,
        COUNT(*) FILTER (WHERE recommendation = 'no') AS no_count,
        COUNT(*) FILTER (WHERE recommendation = 'strong_no') AS strong_no_count,
        COUNT(*) FILTER (WHERE scheduled_date >= CURRENT_DATE) AS upcoming_count,
        COUNT(*) FILTER (WHERE scheduled_date::DATE = CURRENT_DATE) AS today_count
      FROM interviews i
      JOIN applicants a ON a.id = i.applicant_id
      WHERE a.organization_id = $1
    `,
      [organizationId]
    );

    return result.rows[0];
  }

  /**
   * Get available interview slots for a date range
   */
  async getAvailableSlots(
    organizationId: string,
    interviewerId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const db = await getDbClient();

    // Get existing interviews
    const existingResult = await db.query(
      `
      SELECT scheduled_date
      FROM interviews
      WHERE interviewer_id = $1
        AND status = 'scheduled'
        AND scheduled_date BETWEEN $2 AND $3
    `,
      [interviewerId, startDate, endDate]
    );

    const busyTimes = existingResult.rows.map((r) => new Date(r.scheduled_date));

    // Generate available slots (9 AM to 5 PM, 1-hour slots)
    const slots: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

      for (let hour = 9; hour < 17; hour++) {
        const slotTime = new Date(d);
        slotTime.setHours(hour, 0, 0, 0);

        const isBusy = busyTimes.some(
          (bt) => Math.abs(bt.getTime() - slotTime.getTime()) < 3600000
        );

        if (!isBusy && slotTime > new Date()) {
          slots.push({
            datetime: slotTime.toISOString(),
            available: true,
          });
        }
      }
    }

    return slots;
  }

  /**
   * Get default interview questions based on type
   */
  private getDefaultQuestions(interviewType: string): any[] {
    const commonQuestions = [
      { question: 'Tell me about yourself and your experience in caregiving.', category: 'experience', weight: 1 },
      { question: 'Why are you interested in working with our organization?', category: 'motivation', weight: 1 },
      { question: 'Describe a challenging situation with a client and how you handled it.', category: 'problem_solving', weight: 1.5 },
      { question: 'How do you ensure client safety and follow care plans?', category: 'compliance', weight: 1.5 },
      { question: 'What does excellent client care mean to you?', category: 'values', weight: 1 },
    ];

    const phoneScreenQuestions = [
      { question: 'What is your availability for work (days/times)?', category: 'logistics', weight: 1 },
      { question: 'Do you have reliable transportation?', category: 'logistics', weight: 1 },
      { question: 'Are you currently certified (STNA/HHA)?', category: 'credentials', weight: 1 },
    ];

    const inPersonQuestions = [
      ...commonQuestions,
      { question: 'Walk me through how you would assist a client with bathing.', category: 'skills', weight: 1.5 },
      { question: 'How do you handle clients with dementia or cognitive challenges?', category: 'skills', weight: 1.5 },
      { question: 'What would you do if you noticed signs of abuse or neglect?', category: 'compliance', weight: 2 },
    ];

    switch (interviewType) {
      case 'phone':
        return phoneScreenQuestions;
      case 'video':
      case 'in_person':
      case 'panel':
        return inPersonQuestions;
      default:
        return commonQuestions;
    }
  }
}

export const interviewService = new InterviewService();
