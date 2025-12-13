/**
 * Scheduling Recommendations Service
 * Generates intelligent scheduling recommendations for optimization
 *
 * @module services/scheduling-recommendations
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('scheduling-recommendations-service');

interface RecommendationFilters {
  status?: string;
  type?: string;
  priority?: string;
}

interface ProposedChange {
  action: 'assign' | 'reassign' | 'swap' | 'cancel' | 'create';
  shiftId?: string;
  caregiverId?: string;
  newCaregiverId?: string;
  reason: string;
}

interface CreateRecommendationData {
  recommendationType: string;
  priority?: string;
  title: string;
  description?: string;
  reasoning?: string;
  affectedShifts?: string[];
  affectedCaregivers?: string[];
  affectedClients?: string[];
  proposedChanges: ProposedChange[];
  estimatedSavingsMinutes?: number;
  estimatedCostSavings?: number;
  confidenceScore?: number;
  expiresAt?: string;
}

class SchedulingRecommendationsService {
  /**
   * Get recommendations with filters
   */
  async getRecommendations(
    organizationId: string,
    filters: RecommendationFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT *
      FROM schedule_recommendations
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.type) {
      query += ` AND recommendation_type = $${paramIndex++}`;
      params.push(filters.type);
    }

    if (filters.priority) {
      query += ` AND priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    // Only show non-expired recommendations by default
    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
    query += ` ORDER BY
      CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      created_at DESC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single recommendation by ID
   */
  async getRecommendationById(
    recommendationId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT sr.*,
        u.first_name || ' ' || u.last_name AS reviewed_by_name
      FROM schedule_recommendations sr
      LEFT JOIN users u ON u.id = sr.reviewed_by
      WHERE sr.id = $1 AND sr.organization_id = $2
    `,
      [recommendationId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create a recommendation
   */
  async createRecommendation(
    organizationId: string,
    data: CreateRecommendationData
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO schedule_recommendations (
        organization_id,
        recommendation_type,
        priority,
        title,
        description,
        reasoning,
        affected_shifts,
        affected_caregivers,
        affected_clients,
        proposed_changes,
        estimated_savings_minutes,
        estimated_cost_savings,
        confidence_score,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
      [
        organizationId,
        data.recommendationType,
        data.priority || 'normal',
        data.title,
        data.description,
        data.reasoning,
        JSON.stringify(data.affectedShifts || []),
        JSON.stringify(data.affectedCaregivers || []),
        JSON.stringify(data.affectedClients || []),
        JSON.stringify(data.proposedChanges),
        data.estimatedSavingsMinutes,
        data.estimatedCostSavings,
        data.confidenceScore,
        data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
      ]
    );

    logger.info('Recommendation created', {
      recommendationId: result.rows[0].id,
      type: data.recommendationType,
    });

    return result.rows[0];
  }

  /**
   * Accept a recommendation
   */
  async acceptRecommendation(
    recommendationId: string,
    organizationId: string,
    userId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    // Get the recommendation
    const recommendation = await this.getRecommendationById(recommendationId, organizationId);
    if (!recommendation) {
      return null;
    }

    // Update status
    const result = await db.query(
      `
      UPDATE schedule_recommendations
      SET status = 'accepted',
          reviewed_by = $1,
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [userId, recommendationId, organizationId]
    );

    // TODO: Apply the proposed changes
    // This would integrate with the scheduling service to actually make the changes

    logger.info('Recommendation accepted', {
      recommendationId,
      acceptedBy: userId,
    });

    return result.rows[0];
  }

  /**
   * Reject a recommendation
   */
  async rejectRecommendation(
    recommendationId: string,
    organizationId: string,
    userId: string,
    reason?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE schedule_recommendations
      SET status = 'rejected',
          reviewed_by = $1,
          reviewed_at = NOW(),
          rejection_reason = $2,
          updated_at = NOW()
      WHERE id = $3 AND organization_id = $4
      RETURNING *
    `,
      [userId, reason, recommendationId, organizationId]
    );

    logger.info('Recommendation rejected', {
      recommendationId,
      rejectedBy: userId,
      reason,
    });

    return result.rows[0] || null;
  }

  /**
   * Generate coverage gap recommendations
   */
  async generateCoverageGapRecommendations(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    // Find uncovered shifts
    const gapsResult = await db.query(
      `
      SELECT
        s.id AS shift_id,
        s.client_id,
        c.first_name || ' ' || c.last_name AS client_name,
        s.start_time,
        s.end_time,
        s.service_type
      FROM shifts s
      JOIN clients c ON c.id = s.client_id
      WHERE s.organization_id = $1
        AND s.caregiver_id IS NULL
        AND s.status = 'scheduled'
        AND s.start_time >= NOW()
        AND s.start_time <= NOW() + INTERVAL '7 days'
      ORDER BY s.start_time
      LIMIT 20
    `,
      [organizationId]
    );

    const recommendations = [];

    for (const gap of gapsResult.rows) {
      // Find available caregivers
      const availableResult = await db.query(
        `
        SELECT
          cg.id AS caregiver_id,
          cg.first_name || ' ' || cg.last_name AS caregiver_name,
          COALESCE(cpm.performance_score, 75) AS performance_score,
          cl.latitude,
          cl.longitude
        FROM caregivers cg
        LEFT JOIN caregiver_locations cl ON cl.caregiver_id = cg.id
        LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
          AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        WHERE cg.organization_id = $1
          AND cg.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM shifts s2
            WHERE s2.caregiver_id = cg.id
              AND s2.start_time < $3
              AND s2.end_time > $2
              AND s2.status NOT IN ('cancelled', 'missed')
          )
        ORDER BY performance_score DESC
        LIMIT 5
      `,
        [organizationId, gap.start_time, gap.end_time]
      );

      if (availableResult.rows.length > 0) {
        const topCandidate = availableResult.rows[0];

        const recommendation = await this.createRecommendation(organizationId, {
          recommendationType: 'fill_gap',
          priority: this.getGapPriority(gap.start_time),
          title: `Fill coverage gap for ${gap.client_name}`,
          description: `Shift on ${new Date(gap.start_time).toLocaleDateString()} from ${new Date(gap.start_time).toLocaleTimeString()} to ${new Date(gap.end_time).toLocaleTimeString()} needs coverage.`,
          reasoning: `${topCandidate.caregiver_name} is available and has a performance score of ${topCandidate.performance_score}.`,
          affectedShifts: [gap.shift_id],
          affectedCaregivers: [topCandidate.caregiver_id],
          affectedClients: [gap.client_id],
          proposedChanges: [
            {
              action: 'assign',
              shiftId: gap.shift_id,
              caregiverId: topCandidate.caregiver_id,
              reason: 'Best available caregiver based on performance and availability',
            },
          ],
          confidenceScore: Math.min(0.95, topCandidate.performance_score / 100),
        });

        recommendations.push(recommendation);
      }
    }

    logger.info('Generated coverage gap recommendations', {
      organizationId,
      count: recommendations.length,
    });

    return recommendations;
  }

  /**
   * Generate travel optimization recommendations
   */
  async generateTravelOptimizationRecommendations(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    // Find caregivers with inefficient routes
    const inefficientRoutesResult = await db.query(
      `
      WITH caregiver_routes AS (
        SELECT
          s.caregiver_id,
          cg.first_name || ' ' || cg.last_name AS caregiver_name,
          s.start_time::DATE AS shift_date,
          array_agg(s.id ORDER BY s.start_time) AS shift_ids,
          array_agg(s.client_id ORDER BY s.start_time) AS client_ids,
          COUNT(*) AS visit_count
        FROM shifts s
        JOIN caregivers cg ON cg.id = s.caregiver_id
        WHERE s.organization_id = $1
          AND s.start_time::DATE >= CURRENT_DATE
          AND s.start_time::DATE <= CURRENT_DATE + INTERVAL '7 days'
          AND s.status NOT IN ('cancelled', 'missed')
          AND s.caregiver_id IS NOT NULL
        GROUP BY s.caregiver_id, cg.first_name, cg.last_name, s.start_time::DATE
        HAVING COUNT(*) >= 3
      )
      SELECT *
      FROM caregiver_routes
      ORDER BY shift_date, caregiver_id
      LIMIT 20
    `,
      [organizationId]
    );

    const recommendations = [];

    for (const route of inefficientRoutesResult.rows) {
      // Check if route could be optimized by reordering visits
      // In a real implementation, we would use actual geocoding and routing APIs
      // For now, we'll create a placeholder recommendation

      if (route.visit_count >= 4) {
        const recommendation = await this.createRecommendation(organizationId, {
          recommendationType: 'optimize_travel',
          priority: 'normal',
          title: `Optimize route for ${route.caregiver_name} on ${new Date(route.shift_date).toLocaleDateString()}`,
          description: `${route.caregiver_name} has ${route.visit_count} visits scheduled. Reordering may reduce travel time.`,
          reasoning: 'Multiple visits detected. Route optimization analysis available.',
          affectedShifts: route.shift_ids,
          affectedCaregivers: [route.caregiver_id],
          affectedClients: route.client_ids,
          proposedChanges: [
            {
              action: 'reassign',
              reason: 'Optimize visit order for reduced travel time',
            },
          ],
          estimatedSavingsMinutes: Math.floor(route.visit_count * 5), // Estimate 5 min savings per visit
          confidenceScore: 0.7,
        });

        recommendations.push(recommendation);
      }
    }

    logger.info('Generated travel optimization recommendations', {
      organizationId,
      count: recommendations.length,
    });

    return recommendations;
  }

  /**
   * Generate workload rebalancing recommendations
   */
  async generateRebalanceRecommendations(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    // Find caregivers with uneven workloads
    const workloadResult = await db.query(
      `
      SELECT
        cg.id AS caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        COUNT(s.id) AS weekly_shifts,
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) AS weekly_hours,
        COALESCE(cpm.performance_score, 75) AS performance_score
      FROM caregivers cg
      LEFT JOIN shifts s ON s.caregiver_id = cg.id
        AND s.start_time >= DATE_TRUNC('week', CURRENT_DATE)
        AND s.start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
        AND s.status NOT IN ('cancelled', 'missed')
      LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
      WHERE cg.organization_id = $1
        AND cg.status = 'active'
      GROUP BY cg.id, cg.first_name, cg.last_name, cpm.performance_score
      ORDER BY weekly_hours DESC NULLS LAST
    `,
      [organizationId]
    );

    const recommendations = [];
    const caregivers = workloadResult.rows;

    if (caregivers.length >= 2) {
      const avgHours =
        caregivers.reduce((sum, c) => sum + (parseFloat(c.weekly_hours) || 0), 0) /
        caregivers.length;

      const overloaded = caregivers.filter((c) => (parseFloat(c.weekly_hours) || 0) > avgHours * 1.3);
      const underutilized = caregivers.filter((c) => (parseFloat(c.weekly_hours) || 0) < avgHours * 0.7);

      for (const over of overloaded.slice(0, 3)) {
        for (const under of underutilized.slice(0, 3)) {
          const recommendation = await this.createRecommendation(organizationId, {
            recommendationType: 'rebalance',
            priority: 'normal',
            title: `Rebalance workload: ${over.caregiver_name} → ${under.caregiver_name}`,
            description: `${over.caregiver_name} has ${parseFloat(over.weekly_hours || 0).toFixed(1)} hours this week. ${under.caregiver_name} has ${parseFloat(under.weekly_hours || 0).toFixed(1)} hours.`,
            reasoning: `Moving shifts from ${over.caregiver_name} to ${under.caregiver_name} would balance workload.`,
            affectedCaregivers: [over.caregiver_id, under.caregiver_id],
            proposedChanges: [
              {
                action: 'reassign',
                caregiverId: over.caregiver_id,
                newCaregiverId: under.caregiver_id,
                reason: 'Workload rebalancing',
              },
            ],
            confidenceScore: 0.65,
          });

          recommendations.push(recommendation);
          break; // One recommendation per overloaded caregiver
        }
      }
    }

    logger.info('Generated rebalance recommendations', {
      organizationId,
      count: recommendations.length,
    });

    return recommendations;
  }

  /**
   * Get recommendation stats
   */
  async getRecommendationStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_recommendations,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
        COUNT(*) FILTER (WHERE recommendation_type = 'fill_gap') AS gap_recommendations,
        COUNT(*) FILTER (WHERE recommendation_type = 'optimize_travel') AS travel_recommendations,
        COUNT(*) FILTER (WHERE recommendation_type = 'rebalance') AS rebalance_recommendations,
        SUM(estimated_savings_minutes) FILTER (WHERE status = 'accepted') AS total_savings_minutes,
        SUM(estimated_cost_savings) FILTER (WHERE status = 'accepted') AS total_cost_savings
      FROM schedule_recommendations
      WHERE organization_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [organizationId]
    );

    return result.rows[0];
  }

  /**
   * Get dashboard data
   */
  async getDashboard(organizationId: string): Promise<any> {
    const [stats, pending, recent] = await Promise.all([
      this.getRecommendationStats(organizationId),
      this.getRecommendations(organizationId, { status: 'pending' }),
      this.getRecentlyActioned(organizationId),
    ]);

    return {
      stats,
      pending: {
        items: pending.slice(0, 10),
        count: pending.length,
      },
      recentlyActioned: recent,
    };
  }

  /**
   * Get recently accepted/rejected recommendations
   */
  private async getRecentlyActioned(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT sr.*,
        u.first_name || ' ' || u.last_name AS reviewed_by_name
      FROM schedule_recommendations sr
      LEFT JOIN users u ON u.id = sr.reviewed_by
      WHERE sr.organization_id = $1
        AND sr.status IN ('accepted', 'rejected')
        AND sr.reviewed_at >= NOW() - INTERVAL '7 days'
      ORDER BY sr.reviewed_at DESC
      LIMIT 10
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Determine priority based on gap timing
   */
  private getGapPriority(startTime: Date): string {
    const hoursUntil = (new Date(startTime).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 24) return 'urgent';
    if (hoursUntil < 48) return 'high';
    return 'normal';
  }

  /**
   * Run all recommendation generators
   */
  async generateAllRecommendations(organizationId: string): Promise<{
    gaps: number;
    travel: number;
    rebalance: number;
  }> {
    const [gapRecs, travelRecs, rebalanceRecs] = await Promise.all([
      this.generateCoverageGapRecommendations(organizationId),
      this.generateTravelOptimizationRecommendations(organizationId),
      this.generateRebalanceRecommendations(organizationId),
    ]);

    return {
      gaps: gapRecs.length,
      travel: travelRecs.length,
      rebalance: rebalanceRecs.length,
    };
  }
}

export const schedulingRecommendationsService = new SchedulingRecommendationsService();
