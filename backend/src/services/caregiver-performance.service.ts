/**
 * Caregiver Performance Service
 * Handles performance tracking, metrics, and dashboards
 *
 * @module services/caregiver-performance
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('caregiver-performance-service');

interface PerformanceFilters {
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  podId?: string;
}

class CaregiverPerformanceService {
  /**
   * Get daily performance for a caregiver
   */
  async getDailyPerformance(
    caregiverId: string,
    organizationId: string,
    date?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `
      SELECT cpd.*,
        c.first_name || ' ' || c.last_name AS caregiver_name
      FROM caregiver_performance_daily cpd
      JOIN caregivers c ON c.id = cpd.caregiver_id
      WHERE cpd.caregiver_id = $1
        AND cpd.organization_id = $2
        AND cpd.performance_date = $3
    `,
      [caregiverId, organizationId, targetDate]
    );

    return result.rows[0] || null;
  }

  /**
   * Get monthly performance for a caregiver
   */
  async getMonthlyPerformance(
    caregiverId: string,
    organizationId: string,
    month?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const result = await db.query(
      `
      SELECT cpm.*,
        c.first_name || ' ' || c.last_name AS caregiver_name
      FROM caregiver_performance_monthly cpm
      JOIN caregivers c ON c.id = cpm.caregiver_id
      WHERE cpm.caregiver_id = $1
        AND cpm.organization_id = $2
        AND cpm.performance_month = DATE_TRUNC('month', $3::DATE)
    `,
      [caregiverId, organizationId, targetMonth]
    );

    return result.rows[0] || null;
  }

  /**
   * Get performance history for a caregiver
   */
  async getPerformanceHistory(
    caregiverId: string,
    organizationId: string,
    months: number = 6
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT *
      FROM caregiver_performance_monthly
      WHERE caregiver_id = $1
        AND organization_id = $2
        AND performance_month >= DATE_TRUNC('month', CURRENT_DATE) - ($3 || ' months')::INTERVAL
      ORDER BY performance_month DESC
    `,
      [caregiverId, organizationId, months]
    );

    return result.rows;
  }

  /**
   * Calculate and record daily performance
   */
  async calculateDailyPerformance(
    caregiverId: string,
    organizationId: string,
    date: string
  ): Promise<any> {
    const db = await getDbClient();

    // Calculate metrics from shifts
    const metricsResult = await db.query(
      `
      SELECT
        COUNT(*) AS scheduled_shifts,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_shifts,
        COUNT(*) FILTER (WHERE status = 'missed') AS missed_shifts,
        COUNT(*) FILTER (
          WHERE status = 'completed'
            AND clock_in_time > start_time + INTERVAL '5 minutes'
        ) AS late_arrivals,
        COUNT(*) FILTER (
          WHERE status = 'completed'
            AND clock_out_time < end_time - INTERVAL '5 minutes'
        ) AS early_departures,
        SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) AS scheduled_hours,
        SUM(
          CASE WHEN clock_out_time IS NOT NULL AND clock_in_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (clock_out_time - clock_in_time)) / 3600
            ELSE 0
          END
        ) AS worked_hours
      FROM shifts
      WHERE caregiver_id = $1
        AND start_time::DATE = $2
    `,
      [caregiverId, date]
    );

    // Get EVV metrics from visits
    const evvResult = await db.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE clock_in_time IS NOT NULL) AS evv_clock_ins,
        COUNT(*) FILTER (WHERE clock_out_time IS NOT NULL) AS evv_clock_outs,
        COUNT(*) FILTER (WHERE manual_entry = TRUE) AS evv_manual_entries,
        COUNT(*) FILTER (WHERE has_exception = TRUE) AS evv_exceptions
      FROM shifts
      WHERE caregiver_id = $1
        AND visit_date = $2
    `,
      [caregiverId, date]
    );

    // Get complaints and compliments
    const feedbackResult = await db.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE feedback_type = 'complaint') AS complaints,
        COUNT(*) FILTER (WHERE feedback_type = 'compliment') AS compliments
      FROM caregiver_feedback
      WHERE caregiver_id = $1
        AND created_at::DATE = $2
    `,
      [caregiverId, date]
    );

    const metrics = metricsResult.rows[0];
    const evv = evvResult.rows[0];
    const feedback = feedbackResult.rows[0];

    // Calculate EVV compliance rate
    const totalEvvActions = (parseInt(evv.evv_clock_ins) || 0) + (parseInt(evv.evv_clock_outs) || 0);
    const evvExceptions = parseInt(evv.evv_exceptions) || 0;
    const evvComplianceRate = totalEvvActions > 0
      ? ((totalEvvActions - evvExceptions) / totalEvvActions) * 100
      : 100;

    // Insert or update daily performance
    const result = await db.query(
      `
      INSERT INTO caregiver_performance_daily (
        caregiver_id,
        organization_id,
        performance_date,
        scheduled_shifts,
        completed_shifts,
        missed_shifts,
        late_arrivals,
        early_departures,
        scheduled_hours,
        worked_hours,
        evv_clock_ins,
        evv_clock_outs,
        evv_manual_entries,
        evv_exceptions,
        evv_compliance_rate,
        client_complaints,
        client_compliments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (caregiver_id, performance_date)
      DO UPDATE SET
        scheduled_shifts = EXCLUDED.scheduled_shifts,
        completed_shifts = EXCLUDED.completed_shifts,
        missed_shifts = EXCLUDED.missed_shifts,
        late_arrivals = EXCLUDED.late_arrivals,
        early_departures = EXCLUDED.early_departures,
        scheduled_hours = EXCLUDED.scheduled_hours,
        worked_hours = EXCLUDED.worked_hours,
        evv_clock_ins = EXCLUDED.evv_clock_ins,
        evv_clock_outs = EXCLUDED.evv_clock_outs,
        evv_manual_entries = EXCLUDED.evv_manual_entries,
        evv_exceptions = EXCLUDED.evv_exceptions,
        evv_compliance_rate = EXCLUDED.evv_compliance_rate,
        client_complaints = EXCLUDED.client_complaints,
        client_compliments = EXCLUDED.client_compliments
      RETURNING *
    `,
      [
        caregiverId,
        organizationId,
        date,
        metrics.scheduled_shifts || 0,
        metrics.completed_shifts || 0,
        metrics.missed_shifts || 0,
        metrics.late_arrivals || 0,
        metrics.early_departures || 0,
        metrics.scheduled_hours || 0,
        metrics.worked_hours || 0,
        evv.evv_clock_ins || 0,
        evv.evv_clock_outs || 0,
        evv.evv_manual_entries || 0,
        evv.evv_exceptions || 0,
        evvComplianceRate,
        feedback.complaints || 0,
        feedback.compliments || 0,
      ]
    );

    return result.rows[0];
  }

  /**
   * Calculate and record monthly performance
   */
  async calculateMonthlyPerformance(
    caregiverId: string,
    organizationId: string,
    month: string
  ): Promise<any> {
    const db = await getDbClient();

    // Aggregate daily metrics for the month
    const aggregateResult = await db.query(
      `
      SELECT
        SUM(scheduled_shifts) AS total_scheduled_shifts,
        SUM(completed_shifts) AS total_completed_shifts,
        ROUND(
          (SUM(completed_shifts)::DECIMAL / NULLIF(SUM(scheduled_shifts), 0)) * 100,
          1
        ) AS attendance_rate,
        ROUND(
          ((SUM(completed_shifts) - SUM(late_arrivals))::DECIMAL /
           NULLIF(SUM(completed_shifts), 0)) * 100,
          1
        ) AS on_time_rate,
        SUM(scheduled_hours) AS total_scheduled_hours,
        SUM(worked_hours) AS total_worked_hours,
        SUM(overtime_hours) AS total_overtime_hours,
        AVG(evv_compliance_rate) AS evv_compliance_rate,
        SUM(client_complaints) AS total_complaints,
        SUM(client_compliments) AS total_compliments,
        AVG(documentation_score) AS avg_documentation_score
      FROM caregiver_performance_daily
      WHERE caregiver_id = $1
        AND organization_id = $2
        AND performance_date >= DATE_TRUNC('month', $3::DATE)
        AND performance_date < DATE_TRUNC('month', $3::DATE) + INTERVAL '1 month'
    `,
      [caregiverId, organizationId, month]
    );

    const agg = aggregateResult.rows[0];

    // Calculate performance score using the database function
    const scoreResult = await db.query(
      `
      SELECT calculate_caregiver_performance_score(
        $1, $2, $3, $4, $5, $6
      ) AS performance_score
    `,
      [
        agg.attendance_rate || 0,
        agg.on_time_rate || 0,
        agg.evv_compliance_rate || 0,
        agg.avg_documentation_score || 75,
        agg.total_complaints || 0,
        agg.total_compliments || 0,
      ]
    );

    const performanceScore = parseFloat(scoreResult.rows[0].performance_score);

    // Get tier from score
    const tierResult = await db.query(
      `SELECT get_performance_tier($1) AS tier`,
      [performanceScore]
    );
    const tier = tierResult.rows[0].tier;

    // Get previous month's score for trend
    const prevResult = await db.query(
      `
      SELECT performance_score
      FROM caregiver_performance_monthly
      WHERE caregiver_id = $1
        AND organization_id = $2
        AND performance_month = DATE_TRUNC('month', $3::DATE) - INTERVAL '1 month'
    `,
      [caregiverId, organizationId, month]
    );

    const prevScore = prevResult.rows[0]?.performance_score || performanceScore;
    const scoreChange = performanceScore - parseFloat(prevScore);

    // Insert or update monthly performance
    const result = await db.query(
      `
      INSERT INTO caregiver_performance_monthly (
        caregiver_id,
        organization_id,
        performance_month,
        total_scheduled_shifts,
        total_completed_shifts,
        attendance_rate,
        on_time_rate,
        total_scheduled_hours,
        total_worked_hours,
        total_overtime_hours,
        evv_compliance_rate,
        total_complaints,
        total_compliments,
        avg_documentation_score,
        performance_score,
        performance_tier,
        score_change_from_last_month
      ) VALUES ($1, $2, DATE_TRUNC('month', $3::DATE), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (caregiver_id, performance_month)
      DO UPDATE SET
        total_scheduled_shifts = EXCLUDED.total_scheduled_shifts,
        total_completed_shifts = EXCLUDED.total_completed_shifts,
        attendance_rate = EXCLUDED.attendance_rate,
        on_time_rate = EXCLUDED.on_time_rate,
        total_scheduled_hours = EXCLUDED.total_scheduled_hours,
        total_worked_hours = EXCLUDED.total_worked_hours,
        total_overtime_hours = EXCLUDED.total_overtime_hours,
        evv_compliance_rate = EXCLUDED.evv_compliance_rate,
        total_complaints = EXCLUDED.total_complaints,
        total_compliments = EXCLUDED.total_compliments,
        avg_documentation_score = EXCLUDED.avg_documentation_score,
        performance_score = EXCLUDED.performance_score,
        performance_tier = EXCLUDED.performance_tier,
        score_change_from_last_month = EXCLUDED.score_change_from_last_month,
        updated_at = NOW()
      RETURNING *
    `,
      [
        caregiverId,
        organizationId,
        month,
        agg.total_scheduled_shifts || 0,
        agg.total_completed_shifts || 0,
        agg.attendance_rate || 0,
        agg.on_time_rate || 0,
        agg.total_scheduled_hours || 0,
        agg.total_worked_hours || 0,
        agg.total_overtime_hours || 0,
        agg.evv_compliance_rate || 0,
        agg.total_complaints || 0,
        agg.total_compliments || 0,
        agg.avg_documentation_score || 75,
        performanceScore,
        tier,
        scoreChange,
      ]
    );

    logger.info('Monthly performance calculated', {
      caregiverId,
      month,
      score: performanceScore,
      tier,
    });

    return result.rows[0];
  }

  /**
   * Get leaderboard for organization
   */
  async getLeaderboard(
    organizationId: string,
    filters: PerformanceFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        cpm.*,
        c.first_name || ' ' || c.last_name AS caregiver_name,
        c.employee_id,
        c.status,
        p.name AS pod_name,
        RANK() OVER (ORDER BY cpm.performance_score DESC) AS rank
      FROM caregiver_performance_monthly cpm
      JOIN caregivers c ON c.id = cpm.caregiver_id
      LEFT JOIN pods p ON p.id = c.primary_pod_id
      WHERE cpm.organization_id = $1
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        AND c.status = 'active'
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.tier) {
      query += ` AND cpm.performance_tier = $${paramIndex++}`;
      params.push(filters.tier);
    }

    if (filters.podId) {
      query += ` AND c.primary_pod_id = $${paramIndex++}`;
      params.push(filters.podId);
    }

    query += ` ORDER BY cpm.performance_score DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get tier distribution for organization
   */
  async getTierDistribution(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        performance_tier,
        COUNT(*) AS count,
        AVG(performance_score) AS avg_score,
        AVG(attendance_rate) AS avg_attendance,
        AVG(evv_compliance_rate) AS avg_evv_compliance
      FROM caregiver_performance_monthly cpm
      JOIN caregivers c ON c.id = cpm.caregiver_id
      WHERE cpm.organization_id = $1
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        AND c.status = 'active'
      GROUP BY performance_tier
      ORDER BY
        CASE performance_tier
          WHEN 'gold' THEN 1
          WHEN 'silver' THEN 2
          WHEN 'bronze' THEN 3
          ELSE 4
        END
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get performance dashboard
   */
  async getDashboard(organizationId: string): Promise<any> {
    const [leaderboard, tierDistribution, topPerformers, needsImprovement, orgStats] =
      await Promise.all([
        this.getLeaderboard(organizationId),
        this.getTierDistribution(organizationId),
        this.getTopPerformers(organizationId),
        this.getNeedsImprovement(organizationId),
        this.getOrganizationStats(organizationId),
      ]);

    return {
      stats: orgStats,
      tierDistribution,
      topPerformers,
      needsImprovement,
      leaderboard: leaderboard.slice(0, 10), // Top 10
    };
  }

  /**
   * Get top performers
   */
  private async getTopPerformers(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cpm.*,
        c.first_name || ' ' || c.last_name AS caregiver_name
      FROM caregiver_performance_monthly cpm
      JOIN caregivers c ON c.id = cpm.caregiver_id
      WHERE cpm.organization_id = $1
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        AND cpm.performance_tier = 'gold'
        AND c.status = 'active'
      ORDER BY cpm.performance_score DESC
      LIMIT 5
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get caregivers needing improvement
   */
  private async getNeedsImprovement(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cpm.*,
        c.first_name || ' ' || c.last_name AS caregiver_name,
        CASE
          WHEN cpm.attendance_rate < 80 THEN 'Low attendance (' || ROUND(cpm.attendance_rate, 1) || '%)'
          WHEN cpm.evv_compliance_rate < 90 THEN 'EVV compliance (' || ROUND(cpm.evv_compliance_rate, 1) || '%)'
          WHEN cpm.total_complaints > 0 THEN cpm.total_complaints || ' complaint(s) this month'
          ELSE 'Performance below threshold'
        END AS primary_issue
      FROM caregiver_performance_monthly cpm
      JOIN caregivers c ON c.id = cpm.caregiver_id
      WHERE cpm.organization_id = $1
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        AND cpm.performance_tier = 'needs_improvement'
        AND c.status = 'active'
      ORDER BY cpm.performance_score
      LIMIT 10
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get organization-wide stats
   */
  private async getOrganizationStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_caregivers,
        AVG(performance_score) AS avg_performance_score,
        AVG(attendance_rate) AS avg_attendance_rate,
        AVG(evv_compliance_rate) AS avg_evv_compliance,
        SUM(total_worked_hours) AS total_hours_worked,
        SUM(total_complaints) AS total_complaints,
        SUM(total_compliments) AS total_compliments,
        COUNT(*) FILTER (WHERE performance_tier = 'gold') AS gold_count,
        COUNT(*) FILTER (WHERE performance_tier = 'silver') AS silver_count,
        COUNT(*) FILTER (WHERE performance_tier = 'bronze') AS bronze_count,
        COUNT(*) FILTER (WHERE performance_tier = 'needs_improvement') AS needs_improvement_count
      FROM caregiver_performance_monthly cpm
      JOIN caregivers c ON c.id = cpm.caregiver_id
      WHERE cpm.organization_id = $1
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        AND c.status = 'active'
    `,
      [organizationId]
    );

    return result.rows[0];
  }

  /**
   * Calculate performance for all active caregivers
   */
  async calculateAllPerformance(
    organizationId: string,
    date?: string
  ): Promise<{ daily: number; monthly: number }> {
    const db = await getDbClient();

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get all active caregivers
    const caregiversResult = await db.query(
      `SELECT id FROM caregivers WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );

    let dailyCount = 0;
    let monthlyCount = 0;

    for (const caregiver of caregiversResult.rows) {
      try {
        await this.calculateDailyPerformance(caregiver.id, organizationId, targetDate);
        dailyCount++;

        // Also update monthly if end of day
        await this.calculateMonthlyPerformance(caregiver.id, organizationId, targetDate);
        monthlyCount++;
      } catch (error) {
        logger.error('Failed to calculate performance', {
          caregiverId: caregiver.id,
          date: targetDate,
          error,
        });
      }
    }

    logger.info('Performance calculation complete', {
      organizationId,
      date: targetDate,
      dailyCount,
      monthlyCount,
    });

    return { daily: dailyCount, monthly: monthlyCount };
  }
}

export const caregiverPerformanceService = new CaregiverPerformanceService();
