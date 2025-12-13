/**
 * Client Satisfaction Service
 * Handles surveys, responses, and satisfaction tracking
 *
 * @module services/client-satisfaction
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('client-satisfaction-service');

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'nps' | 'text' | 'yes_no' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

interface CreateTemplateData {
  name: string;
  description?: string;
  surveyType: string;
  questions: SurveyQuestion[];
  autoSend?: boolean;
  sendFrequency?: string;
}

interface CreateResponseData {
  templateId: string;
  respondentType: string;
  respondentId?: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentPhone?: string;
  clientId?: string;
  caregiverId?: string;
  visitId?: string;
  responses: Record<string, any>;
  comments?: string;
}

interface SurveyFilters {
  status?: string;
  templateId?: string;
  clientId?: string;
  caregiverId?: string;
  fromDate?: string;
  toDate?: string;
}

class ClientSatisfactionService {
  // ============================================================
  // SURVEY TEMPLATES
  // ============================================================

  /**
   * Get all survey templates
   */
  async getTemplates(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        sst.*,
        (SELECT COUNT(*) FROM satisfaction_survey_responses ssr
         WHERE ssr.template_id = sst.id) AS response_count
      FROM satisfaction_survey_templates sst
      WHERE sst.organization_id = $1
      ORDER BY sst.is_active DESC, sst.name
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(
    templateId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT *
      FROM satisfaction_survey_templates
      WHERE id = $1 AND organization_id = $2
    `,
      [templateId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create a survey template
   */
  async createTemplate(
    organizationId: string,
    data: CreateTemplateData
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO satisfaction_survey_templates (
        organization_id,
        name,
        description,
        survey_type,
        questions,
        is_active,
        auto_send,
        send_frequency
      ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)
      RETURNING *
    `,
      [
        organizationId,
        data.name,
        data.description,
        data.surveyType,
        JSON.stringify(data.questions),
        data.autoSend || false,
        data.sendFrequency,
      ]
    );

    logger.info('Survey template created', {
      templateId: result.rows[0].id,
      name: data.name,
    });

    return result.rows[0];
  }

  /**
   * Update a survey template
   */
  async updateTemplate(
    templateId: string,
    organizationId: string,
    data: Partial<CreateTemplateData>
  ): Promise<any | null> {
    const db = await getDbClient();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.questions !== undefined) {
      fields.push(`questions = $${paramIndex++}`);
      values.push(JSON.stringify(data.questions));
    }
    if (data.autoSend !== undefined) {
      fields.push(`auto_send = $${paramIndex++}`);
      values.push(data.autoSend);
    }
    if (data.sendFrequency !== undefined) {
      fields.push(`send_frequency = $${paramIndex++}`);
      values.push(data.sendFrequency);
    }

    if (fields.length === 0) {
      return this.getTemplateById(templateId, organizationId);
    }

    fields.push('updated_at = NOW()');
    values.push(templateId, organizationId);

    const result = await db.query(
      `
      UPDATE satisfaction_survey_templates
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Deactivate a template
   */
  async deactivateTemplate(
    templateId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE satisfaction_survey_templates
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `,
      [templateId, organizationId]
    );

    return result.rows[0] || null;
  }

  // ============================================================
  // SURVEY RESPONSES
  // ============================================================

  /**
   * Get survey responses with filters
   */
  async getResponses(
    organizationId: string,
    filters: SurveyFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        ssr.*,
        sst.name AS template_name,
        c.first_name || ' ' || c.last_name AS client_name,
        cg.first_name || ' ' || cg.last_name AS caregiver_name
      FROM satisfaction_survey_responses ssr
      JOIN satisfaction_survey_templates sst ON sst.id = ssr.template_id
      LEFT JOIN clients c ON c.id = ssr.client_id
      LEFT JOIN caregivers cg ON cg.id = ssr.caregiver_id
      WHERE ssr.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND ssr.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.templateId) {
      query += ` AND ssr.template_id = $${paramIndex++}`;
      params.push(filters.templateId);
    }

    if (filters.clientId) {
      query += ` AND ssr.client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }

    if (filters.caregiverId) {
      query += ` AND ssr.caregiver_id = $${paramIndex++}`;
      params.push(filters.caregiverId);
    }

    if (filters.fromDate) {
      query += ` AND ssr.submitted_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND ssr.submitted_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ` ORDER BY ssr.submitted_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single response by ID
   */
  async getResponseById(
    responseId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        ssr.*,
        sst.name AS template_name,
        sst.questions AS template_questions,
        c.first_name || ' ' || c.last_name AS client_name,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        u.first_name || ' ' || u.last_name AS followed_up_by_name
      FROM satisfaction_survey_responses ssr
      JOIN satisfaction_survey_templates sst ON sst.id = ssr.template_id
      LEFT JOIN clients c ON c.id = ssr.client_id
      LEFT JOIN caregivers cg ON cg.id = ssr.caregiver_id
      LEFT JOIN users u ON u.id = ssr.followed_up_by
      WHERE ssr.id = $1 AND ssr.organization_id = $2
    `,
      [responseId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Submit a survey response
   */
  async submitResponse(
    organizationId: string,
    data: CreateResponseData
  ): Promise<any> {
    const db = await getDbClient();

    // Get template to calculate scores
    const template = await this.getTemplateById(data.templateId, organizationId);
    if (!template) {
      throw new Error('Survey template not found');
    }

    // Calculate satisfaction score and NPS
    const { satisfactionScore, npsScore, overallRating, requiresFollowUp, followUpReason } =
      this.calculateScores(template.questions, data.responses);

    const result = await db.query(
      `
      INSERT INTO satisfaction_survey_responses (
        organization_id,
        template_id,
        respondent_type,
        respondent_id,
        respondent_name,
        respondent_email,
        respondent_phone,
        client_id,
        caregiver_id,
        visit_id,
        responses,
        overall_rating,
        comments,
        satisfaction_score,
        nps_score,
        requires_follow_up,
        follow_up_reason,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `,
      [
        organizationId,
        data.templateId,
        data.respondentType,
        data.respondentId,
        data.respondentName,
        data.respondentEmail,
        data.respondentPhone,
        data.clientId,
        data.caregiverId,
        data.visitId,
        JSON.stringify(data.responses),
        overallRating,
        data.comments,
        satisfactionScore,
        npsScore,
        requiresFollowUp,
        followUpReason,
        requiresFollowUp ? 'follow_up_needed' : 'completed',
      ]
    );

    // Update client satisfaction scores
    if (data.clientId) {
      await this.updateClientSatisfactionScore(data.clientId, organizationId);
    }

    logger.info('Survey response submitted', {
      responseId: result.rows[0].id,
      clientId: data.clientId,
      satisfactionScore,
      npsScore,
    });

    return result.rows[0];
  }

  /**
   * Record follow-up on a response
   */
  async recordFollowUp(
    responseId: string,
    organizationId: string,
    userId: string,
    notes: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE satisfaction_survey_responses
      SET followed_up_by = $1,
          followed_up_at = NOW(),
          follow_up_notes = $2,
          status = 'resolved'
      WHERE id = $3 AND organization_id = $4
      RETURNING *
    `,
      [userId, notes, responseId, organizationId]
    );

    return result.rows[0] || null;
  }

  // ============================================================
  // CLIENT SATISFACTION SCORES
  // ============================================================

  /**
   * Get client satisfaction score
   */
  async getClientSatisfactionScore(
    clientId: string,
    organizationId: string,
    month?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const result = await db.query(
      `
      SELECT css.*,
        c.first_name || ' ' || c.last_name AS client_name
      FROM client_satisfaction_scores css
      JOIN clients c ON c.id = css.client_id
      WHERE css.client_id = $1
        AND css.organization_id = $2
        AND css.score_period = DATE_TRUNC('month', $3::DATE)
    `,
      [clientId, organizationId, targetMonth]
    );

    return result.rows[0] || null;
  }

  /**
   * Update client satisfaction score
   */
  async updateClientSatisfactionScore(
    clientId: string,
    organizationId: string
  ): Promise<any> {
    const db = await getDbClient();

    const month = new Date().toISOString().slice(0, 7) + '-01';

    // Aggregate responses for the month
    const aggregateResult = await db.query(
      `
      SELECT
        AVG(satisfaction_score) AS avg_satisfaction_score,
        AVG(nps_score) AS avg_nps_score,
        COUNT(*) AS response_count,
        COUNT(*) FILTER (WHERE overall_rating = 5) AS excellent_count,
        COUNT(*) FILTER (WHERE overall_rating = 4) AS good_count,
        COUNT(*) FILTER (WHERE overall_rating = 3) AS neutral_count,
        COUNT(*) FILTER (WHERE overall_rating = 2) AS poor_count,
        COUNT(*) FILTER (WHERE overall_rating = 1) AS terrible_count
      FROM satisfaction_survey_responses
      WHERE client_id = $1
        AND organization_id = $2
        AND submitted_at >= DATE_TRUNC('month', $3::DATE)
        AND submitted_at < DATE_TRUNC('month', $3::DATE) + INTERVAL '1 month'
    `,
      [clientId, organizationId, month]
    );

    const agg = aggregateResult.rows[0];

    // Get previous month's score for trend
    const prevResult = await db.query(
      `
      SELECT avg_satisfaction_score
      FROM client_satisfaction_scores
      WHERE client_id = $1
        AND organization_id = $2
        AND score_period = DATE_TRUNC('month', $3::DATE) - INTERVAL '1 month'
    `,
      [clientId, organizationId, month]
    );

    const prevScore = parseFloat(prevResult.rows[0]?.avg_satisfaction_score) || 0;
    const currentScore = parseFloat(agg.avg_satisfaction_score) || 0;
    const scoreChange = currentScore - prevScore;

    let trendDirection = 'stable';
    if (scoreChange > 5) trendDirection = 'improving';
    else if (scoreChange < -5) trendDirection = 'declining';

    const atRisk = currentScore < 60 || trendDirection === 'declining';

    // Insert or update
    const result = await db.query(
      `
      INSERT INTO client_satisfaction_scores (
        client_id,
        organization_id,
        score_period,
        avg_satisfaction_score,
        avg_nps_score,
        response_count,
        excellent_count,
        good_count,
        neutral_count,
        poor_count,
        terrible_count,
        score_change,
        trend_direction,
        at_risk
      ) VALUES ($1, $2, DATE_TRUNC('month', $3::DATE), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (client_id, score_period)
      DO UPDATE SET
        avg_satisfaction_score = EXCLUDED.avg_satisfaction_score,
        avg_nps_score = EXCLUDED.avg_nps_score,
        response_count = EXCLUDED.response_count,
        excellent_count = EXCLUDED.excellent_count,
        good_count = EXCLUDED.good_count,
        neutral_count = EXCLUDED.neutral_count,
        poor_count = EXCLUDED.poor_count,
        terrible_count = EXCLUDED.terrible_count,
        score_change = EXCLUDED.score_change,
        trend_direction = EXCLUDED.trend_direction,
        at_risk = EXCLUDED.at_risk,
        updated_at = NOW()
      RETURNING *
    `,
      [
        clientId,
        organizationId,
        month,
        agg.avg_satisfaction_score || 0,
        agg.avg_nps_score || 0,
        agg.response_count || 0,
        agg.excellent_count || 0,
        agg.good_count || 0,
        agg.neutral_count || 0,
        agg.poor_count || 0,
        agg.terrible_count || 0,
        scoreChange,
        trendDirection,
        atRisk,
      ]
    );

    return result.rows[0];
  }

  // ============================================================
  // ANALYTICS
  // ============================================================

  /**
   * Get satisfaction dashboard
   */
  async getDashboard(organizationId: string): Promise<any> {
    const [stats, atRiskClients, recentResponses, npsBreakdown, caregiverScores] =
      await Promise.all([
        this.getOrganizationStats(organizationId),
        this.getAtRiskClients(organizationId),
        this.getRecentResponses(organizationId),
        this.getNPSBreakdown(organizationId),
        this.getCaregiverSatisfactionScores(organizationId),
      ]);

    return {
      stats,
      atRiskClients: {
        items: atRiskClients,
        count: atRiskClients.length,
      },
      recentResponses,
      npsBreakdown,
      caregiverScores: caregiverScores.slice(0, 10),
    };
  }

  /**
   * Get organization-wide stats
   */
  private async getOrganizationStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(DISTINCT client_id) AS clients_surveyed,
        COUNT(*) AS total_responses,
        AVG(satisfaction_score) AS avg_satisfaction,
        AVG(nps_score) AS avg_nps,
        COUNT(*) FILTER (WHERE nps_score >= 9) AS promoters,
        COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score < 9) AS passives,
        COUNT(*) FILTER (WHERE nps_score < 7) AS detractors,
        COUNT(*) FILTER (WHERE requires_follow_up AND status != 'resolved') AS pending_follow_ups
      FROM satisfaction_survey_responses
      WHERE organization_id = $1
        AND submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
    `,
      [organizationId]
    );

    const stats = result.rows[0];

    // Calculate NPS score
    const totalNPS = (parseInt(stats.promoters) || 0) + (parseInt(stats.passives) || 0) + (parseInt(stats.detractors) || 0);
    const nps = totalNPS > 0
      ? Math.round(((parseInt(stats.promoters) - parseInt(stats.detractors)) / totalNPS) * 100)
      : 0;

    return {
      ...stats,
      nps,
    };
  }

  /**
   * Get at-risk clients
   */
  private async getAtRiskClients(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        css.*,
        c.first_name || ' ' || c.last_name AS client_name,
        CASE
          WHEN css.avg_satisfaction_score < 40 THEN 'Very low satisfaction'
          WHEN css.trend_direction = 'declining' THEN 'Declining satisfaction'
          WHEN css.avg_nps_score < 5 THEN 'Low NPS score'
          ELSE 'At risk'
        END AS risk_reason
      FROM client_satisfaction_scores css
      JOIN clients c ON c.id = css.client_id
      WHERE css.organization_id = $1
        AND css.score_period = DATE_TRUNC('month', CURRENT_DATE)
        AND css.at_risk = TRUE
      ORDER BY css.avg_satisfaction_score
      LIMIT 10
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get recent responses
   */
  private async getRecentResponses(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        ssr.*,
        sst.name AS template_name,
        c.first_name || ' ' || c.last_name AS client_name
      FROM satisfaction_survey_responses ssr
      JOIN satisfaction_survey_templates sst ON sst.id = ssr.template_id
      LEFT JOIN clients c ON c.id = ssr.client_id
      WHERE ssr.organization_id = $1
      ORDER BY ssr.submitted_at DESC
      LIMIT 10
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get NPS breakdown
   */
  private async getNPSBreakdown(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        DATE_TRUNC('week', submitted_at) AS week,
        COUNT(*) FILTER (WHERE nps_score >= 9) AS promoters,
        COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score < 9) AS passives,
        COUNT(*) FILTER (WHERE nps_score < 7) AS detractors
      FROM satisfaction_survey_responses
      WHERE organization_id = $1
        AND submitted_at >= CURRENT_DATE - INTERVAL '12 weeks'
        AND nps_score IS NOT NULL
      GROUP BY DATE_TRUNC('week', submitted_at)
      ORDER BY week
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get caregiver satisfaction scores
   */
  private async getCaregiverSatisfactionScores(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        ssr.caregiver_id,
        c.first_name || ' ' || c.last_name AS caregiver_name,
        COUNT(*) AS response_count,
        AVG(ssr.satisfaction_score) AS avg_satisfaction,
        AVG(ssr.nps_score) AS avg_nps
      FROM satisfaction_survey_responses ssr
      JOIN caregivers c ON c.id = ssr.caregiver_id
      WHERE ssr.organization_id = $1
        AND ssr.caregiver_id IS NOT NULL
        AND ssr.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY ssr.caregiver_id, c.first_name, c.last_name
      HAVING COUNT(*) >= 3
      ORDER BY avg_satisfaction DESC
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Calculate scores from survey responses
   */
  private calculateScores(
    questions: SurveyQuestion[],
    responses: Record<string, any>
  ): {
    satisfactionScore: number;
    npsScore: number | null;
    overallRating: number | null;
    requiresFollowUp: boolean;
    followUpReason: string | null;
  } {
    let ratingSum = 0;
    let ratingCount = 0;
    let npsScore: number | null = null;
    let overallRating: number | null = null;
    let requiresFollowUp = false;
    let followUpReason: string | null = null;

    for (const question of questions) {
      const response = responses[question.id];

      if (question.type === 'rating' && typeof response === 'number') {
        ratingSum += response;
        ratingCount++;

        // Check for low ratings
        if (response <= 2) {
          requiresFollowUp = true;
          followUpReason = `Low rating on: ${question.text}`;
        }

        // Use first rating question as overall rating
        if (overallRating === null) {
          overallRating = response;
        }
      }

      if (question.type === 'nps' && typeof response === 'number') {
        npsScore = response;

        // Detractors need follow-up
        if (response <= 6) {
          requiresFollowUp = true;
          followUpReason = followUpReason || 'Low NPS score (detractor)';
        }
      }
    }

    // Calculate satisfaction score (0-100 scale)
    const satisfactionScore = ratingCount > 0
      ? ((ratingSum / ratingCount) / 5) * 100
      : 0;

    return {
      satisfactionScore: Math.round(satisfactionScore * 10) / 10,
      npsScore,
      overallRating,
      requiresFollowUp,
      followUpReason,
    };
  }
}

export const clientSatisfactionService = new ClientSatisfactionService();
