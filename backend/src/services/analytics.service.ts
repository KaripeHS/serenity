/**
 * Analytics Service
 * Handles business logic for Strategic Growth Dashboard endpoints
 *
 * Endpoints:
 * - GET /api/analytics/growth-overview
 * - GET /api/analytics/hiring-forecast
 * - GET /api/analytics/churn-predictions
 * - GET /api/analytics/lead-scoring
 */

import { db } from '../database/connection';
import { subDays, addDays, format } from 'date-fns';

export class AnalyticsService {
  /**
   * Get growth overview with client acquisition forecast
   * Endpoint: GET /api/analytics/growth-overview
   */
  async getGrowthOverview(organizationId: string, forecastDays: number = 90) {
    const [
      currentMetrics,
      clientAcquisitionForecast,
      growthDrivers,
      marketOpportunities
    ] = await Promise.all([
      this.getCurrentMetrics(organizationId),
      this.getClientAcquisitionForecast(organizationId, forecastDays),
      this.getGrowthDrivers(organizationId),
      this.getMarketOpportunities(organizationId)
    ]);

    return {
      currentMetrics,
      clientAcquisitionForecast,
      growthDrivers,
      marketOpportunities
    };
  }

  /**
   * Get current growth metrics
   */
  private async getCurrentMetrics(organizationId: string) {
    const query = `
      WITH client_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') as active_clients,
          COUNT(*) FILTER (WHERE enrollment_date >= NOW() - INTERVAL '30 days') as new_clients_30d,
          COUNT(*) FILTER (WHERE enrollment_date >= NOW() - INTERVAL '60 days' AND enrollment_date < NOW() - INTERVAL '30 days') as new_clients_30_60d
        FROM clients
        WHERE organization_id = $1
      ),
      caregiver_stats AS (
        SELECT
          COUNT(*) as active_caregivers
        FROM users
        WHERE organization_id = $1
          AND role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
          AND status = 'active'
      ),
      market_stats AS (
        SELECT
          COUNT(DISTINCT zip_code) as total_zips,
          COUNT(DISTINCT CASE WHEN status = 'active' THEN zip_code END) as active_zips
        FROM clients
        WHERE organization_id = $1
      )
      SELECT
        cs.active_clients,
        cg.active_caregivers,
        CASE
          WHEN cg.active_caregivers > 0 THEN ROUND(cs.active_clients::DECIMAL / cg.active_caregivers, 2)
          ELSE 0
        END as clients_per_caregiver,
        CASE
          WHEN ms.total_zips > 0 THEN ROUND((ms.active_zips::DECIMAL / ms.total_zips) * 100, 1)
          ELSE 0
        END as market_penetration,
        CASE
          WHEN cs.new_clients_30_60d > 0 THEN ROUND(((cs.new_clients_30d - cs.new_clients_30_60d)::DECIMAL / cs.new_clients_30_60d) * 100, 1)
          ELSE 0
        END as monthly_growth_rate
      FROM client_stats cs, caregiver_stats cg, market_stats ms
    `;

    const result = await db.query(query, [organizationId]);
    const row = result.rows[0];

    return {
      activeClients: parseInt(row.active_clients),
      activeCaregivers: parseInt(row.active_caregivers),
      clientsPerCaregiver: parseFloat(row.clients_per_caregiver),
      marketPenetration: parseFloat(row.market_penetration),
      monthlyGrowthRate: parseFloat(row.monthly_growth_rate)
    };
  }

  /**
   * Get client acquisition forecast using simple linear regression
   * In Phase 3, this will be replaced with ML models (ARIMA/Prophet)
   */
  private async getClientAcquisitionForecast(organizationId: string, forecastDays: number) {
    // Get historical client acquisition data (last 90 days)
    const historyQuery = `
      SELECT
        DATE_TRUNC('day', enrollment_date)::DATE as day,
        COUNT(*) as new_clients
      FROM clients
      WHERE organization_id = $1
        AND enrollment_date >= NOW() - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('day', enrollment_date)
      ORDER BY day
    `;

    const historyResult = await db.query(historyQuery, [organizationId]);

    // Calculate simple moving average
    const dailyNewClients = historyResult.rows.map(r => parseInt(r.new_clients));
    const avgDailyNewClients = dailyNewClients.length > 0
      ? dailyNewClients.reduce((sum, val) => sum + val, 0) / dailyNewClients.length
      : 0;

    // Calculate standard deviation for confidence bands
    const variance = dailyNewClients.length > 0
      ? dailyNewClients.reduce((sum, val) => sum + Math.pow(val - avgDailyNewClients, 2), 0) / dailyNewClients.length
      : 0;
    const stdDev = Math.sqrt(variance);

    // Generate forecast timeline
    const timeline = [];
    let cumulativeClients = 0;

    for (let i = 0; i <= forecastDays; i++) {
      const date = addDays(new Date(), i);
      const predictedClients = avgDailyNewClients;
      cumulativeClients += predictedClients;

      timeline.push({
        date: format(date, 'yyyy-MM-dd'),
        predictedClients: Math.round(cumulativeClients),
        lowerBound: Math.max(0, Math.round(cumulativeClients - (stdDev * 1.96))), // 95% confidence
        upperBound: Math.round(cumulativeClients + (stdDev * 1.96))
      });
    }

    return {
      predicted: Math.round(cumulativeClients),
      confidence: dailyNewClients.length > 30 ? 0.85 : 0.65, // Higher confidence with more data
      timeline
    };
  }

  /**
   * Get growth drivers (sources of new clients)
   */
  private async getGrowthDrivers(organizationId: string) {
    const query = `
      WITH recent_clients AS (
        SELECT
          COALESCE(referral_source, 'unknown') as source,
          COUNT(*) as count
        FROM clients
        WHERE organization_id = $1
          AND enrollment_date >= NOW() - INTERVAL '90 days'
        GROUP BY COALESCE(referral_source, 'unknown')
      ),
      older_clients AS (
        SELECT
          COALESCE(referral_source, 'unknown') as source,
          COUNT(*) as count
        FROM clients
        WHERE organization_id = $1
          AND enrollment_date >= NOW() - INTERVAL '180 days'
          AND enrollment_date < NOW() - INTERVAL '90 days'
        GROUP BY COALESCE(referral_source, 'unknown')
      )
      SELECT
        rc.source as driver,
        rc.count as recent_count,
        COALESCE(oc.count, 0) as older_count,
        ROUND((rc.count::DECIMAL / (SELECT SUM(count) FROM recent_clients)) * 100, 1) as contribution,
        CASE
          WHEN COALESCE(oc.count, 0) > 0 THEN
            CASE
              WHEN rc.count > oc.count * 1.1 THEN 'up'
              WHEN rc.count < oc.count * 0.9 THEN 'down'
              ELSE 'stable'
            END
          ELSE 'stable'
        END as trend
      FROM recent_clients rc
      LEFT JOIN older_clients oc ON rc.source = oc.source
      ORDER BY contribution DESC
      LIMIT 10
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      driver: row.driver,
      contribution: parseFloat(row.contribution),
      trend: row.trend as 'up' | 'down' | 'stable'
    }));
  }

  /**
   * Get market opportunities by zip code
   */
  private async getMarketOpportunities(organizationId: string) {
    const query = `
      WITH zip_stats AS (
        SELECT
          zip_code,
          COUNT(*) FILTER (WHERE status = 'active') as current_clients,
          -- Estimate market size based on zip code population (would be enhanced with census data)
          CASE
            WHEN COUNT(*) > 50 THEN 200
            WHEN COUNT(*) > 20 THEN 100
            ELSE 50
          END as estimated_market_size
        FROM clients
        WHERE organization_id = $1
          AND zip_code IS NOT NULL
        GROUP BY zip_code
      )
      SELECT
        zip_code,
        current_clients,
        estimated_market_size,
        ROUND((current_clients::DECIMAL / estimated_market_size) * 100, 1) as penetration,
        CASE
          WHEN (current_clients::DECIMAL / estimated_market_size) < 0.1 THEN 'high'
          WHEN (current_clients::DECIMAL / estimated_market_size) < 0.3 THEN 'medium'
          ELSE 'low'
        END as growth_potential
      FROM zip_stats
      WHERE current_clients > 0
      ORDER BY
        CASE growth_potential
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        current_clients DESC
      LIMIT 20
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      zipCode: row.zip_code,
      currentClients: parseInt(row.current_clients),
      marketSize: parseInt(row.estimated_market_size),
      penetration: parseFloat(row.penetration),
      growthPotential: row.growth_potential as 'high' | 'medium' | 'low'
    }));
  }

  /**
   * Get hiring forecast based on client growth and caregiver:client ratio
   * Endpoint: GET /api/analytics/hiring-forecast
   */
  async getHiringForecast(organizationId: string, forecastDays: number = 90) {
    const [
      currentStaffing,
      hiringRecommendations,
      staffingForecast,
      capacityAnalysis
    ] = await Promise.all([
      this.getCurrentStaffing(organizationId),
      this.getHiringRecommendations(organizationId, forecastDays),
      this.getStaffingForecast(organizationId, forecastDays),
      this.getCapacityAnalysis(organizationId)
    ]);

    return {
      currentStaffing,
      hiringRecommendations,
      staffingForecast,
      capacityAnalysis
    };
  }

  /**
   * Get current staffing levels
   */
  private async getCurrentStaffing(organizationId: string) {
    const query = `
      WITH staffing AS (
        SELECT
          COUNT(*) FILTER (WHERE u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED') AND u.status = 'active') as total_caregivers,
          COUNT(*) FILTER (WHERE c.status = 'active') as total_clients
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id
        LEFT JOIN clients c ON c.organization_id = o.id
        WHERE o.id = $1
      )
      SELECT
        total_caregivers,
        total_clients,
        CASE
          WHEN total_caregivers > 0 THEN ROUND(total_clients::DECIMAL / total_caregivers, 2)
          ELSE 0
        END as ratio,
        8.0 as target_ratio,
        CASE
          WHEN total_caregivers > 0 THEN
            GREATEST(0, CEIL((total_clients / 8.0) - total_caregivers))
          ELSE CEIL(total_clients / 8.0)
        END as gap
      FROM staffing
    `;

    const result = await db.query(query, [organizationId]);
    const row = result.rows[0];

    return {
      totalCaregivers: parseInt(row.total_caregivers),
      totalClients: parseInt(row.total_clients),
      ratio: parseFloat(row.ratio),
      targetRatio: 8.0, // Industry standard: 1 caregiver per 8 clients
      gap: parseInt(row.gap)
    };
  }

  /**
   * Get hiring recommendations by role
   */
  private async getHiringRecommendations(organizationId: string, forecastDays: number) {
    // Get client growth forecast
    const clientForecast = await this.getClientAcquisitionForecast(organizationId, forecastDays);
    const predictedNewClients = clientForecast.predicted;

    // Calculate caregiver needs
    const targetRatio = 8.0;
    const additionalCaregiversNeeded = Math.ceil(predictedNewClients / targetRatio);

    // Get current staffing to determine role breakdown
    const roleQuery = `
      SELECT
        role,
        COUNT(*) as count
      FROM users
      WHERE organization_id = $1
        AND role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED', 'RN', 'LPN')
        AND status = 'active'
      GROUP BY role
    `;

    const roleResult = await db.query(roleQuery, [organizationId]);
    const roleCounts = Object.fromEntries(
      roleResult.rows.map(r => [r.role, parseInt(r.count)])
    );

    const totalCaregivers = Object.values(roleCounts).reduce((sum: number, val) => sum + (val as number), 0);

    // Calculate role percentages
    const recommendations = [];

    // DSP (70% of caregivers)
    const dspNeeded = Math.round(additionalCaregiversNeeded * 0.7);
    if (dspNeeded > 0) {
      recommendations.push({
        role: 'DSP',
        recommendedHires: dspNeeded,
        urgency: forecastDays <= 30 ? 'immediate' as const :
                forecastDays <= 60 ? '30_days' as const :
                '60_days' as const,
        reason: `Predicted ${predictedNewClients} new clients in ${forecastDays} days`,
        estimatedCost: dspNeeded * 45000 // Average DSP salary
      });
    }

    // RN (10% of caregivers, minimum 1 if hiring DSPs)
    const rnNeeded = dspNeeded > 0 ? Math.max(1, Math.round(additionalCaregiversNeeded * 0.1)) : 0;
    if (rnNeeded > 0) {
      recommendations.push({
        role: 'RN',
        recommendedHires: rnNeeded,
        urgency: '60_days' as const,
        reason: 'Clinical supervision requirements (OAC 173-39-02.11)',
        estimatedCost: rnNeeded * 75000
      });
    }

    // LPN (20% of caregivers)
    const lpnNeeded = Math.round(additionalCaregiversNeeded * 0.2);
    if (lpnNeeded > 0) {
      recommendations.push({
        role: 'LPN',
        recommendedHires: lpnNeeded,
        urgency: '60_days' as const,
        reason: `Support for ${predictedNewClients} new clients`,
        estimatedCost: lpnNeeded * 55000
      });
    }

    return recommendations;
  }

  /**
   * Get staffing forecast timeline
   */
  private async getStaffingForecast(organizationId: string, forecastDays: number) {
    const currentStaffing = await this.getCurrentStaffing(organizationId);
    const clientForecast = await this.getClientAcquisitionForecast(organizationId, forecastDays);

    const timeline = [];
    const targetRatio = 8.0;

    for (let i = 0; i <= forecastDays; i += 7) { // Weekly intervals
      const dateIndex = Math.min(i, clientForecast.timeline.length - 1);
      const forecastData = clientForecast.timeline[dateIndex];

      const predictedClients = currentStaffing.totalClients + forecastData.predictedClients;
      const predictedCaregivers = currentStaffing.totalCaregivers; // Assuming no hiring yet
      const predictedRatio = predictedCaregivers > 0 ? predictedClients / predictedCaregivers : 0;
      const recommendedHires = Math.max(0, Math.ceil(predictedClients / targetRatio) - predictedCaregivers);

      timeline.push({
        date: forecastData.date,
        predictedCaregivers,
        predictedClients,
        predictedRatio: Math.round(predictedRatio * 100) / 100,
        recommendedHires
      });
    }

    return timeline;
  }

  /**
   * Get capacity analysis
   */
  private async getCapacityAnalysis(organizationId: string) {
    const query = `
      WITH caregiver_hours AS (
        SELECT
          u.id,
          COALESCE(u.max_hours_per_week, 40) as max_hours,
          COALESCE(SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600), 0) as scheduled_hours
        FROM users u
        LEFT JOIN visits v ON v.caregiver_id = u.id
          AND v.scheduled_start >= DATE_TRUNC('week', NOW())
          AND v.scheduled_start < DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
          AND v.status != 'cancelled'
        WHERE u.organization_id = $1
          AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
          AND u.status = 'active'
        GROUP BY u.id, u.max_hours_per_week
      )
      SELECT
        COALESCE(SUM(max_hours), 0) as current_capacity,
        COALESCE(SUM(scheduled_hours), 0) as utilized_capacity,
        CASE
          WHEN SUM(max_hours) > 0 THEN ROUND((SUM(scheduled_hours) / SUM(max_hours)) * 100, 1)
          ELSE 0
        END as utilization_rate,
        GREATEST(0, COALESCE(SUM(max_hours) - SUM(scheduled_hours), 0)) as additional_capacity_available
      FROM caregiver_hours
    `;

    const result = await db.query(query, [organizationId]);
    const row = result.rows[0];

    return {
      currentCapacity: parseFloat(row.current_capacity),
      utilizedCapacity: parseFloat(row.utilized_capacity),
      utilizationRate: parseFloat(row.utilization_rate),
      additionalCapacityNeeded: Math.max(0, parseFloat(row.utilized_capacity) - parseFloat(row.current_capacity))
    };
  }

  /**
   * Get churn predictions (caregiver turnover risk)
   * Endpoint: GET /api/analytics/churn-predictions
   *
   * In Phase 3, this will use ML models (Random Forest/XGBoost)
   * For now, using rule-based scoring
   */
  async getChurnPredictions(organizationId: string, riskThreshold: number = 0.5) {
    const [churnRisks, churnStatistics, historicalChurn] = await Promise.all([
      this.getChurnRisks(organizationId, riskThreshold),
      this.getChurnStatistics(organizationId),
      this.getHistoricalChurn(organizationId)
    ]);

    return {
      churnRisks,
      churnStatistics,
      historicalChurn
    };
  }

  /**
   * Calculate churn risk scores for all caregivers
   */
  private async getChurnRisks(organizationId: string, riskThreshold: number) {
    const query = `
      WITH caregiver_data AS (
        SELECT
          u.id as caregiver_id,
          u.name as caregiver_name,
          u.role,
          u.hire_date,
          EXTRACT(DAY FROM NOW() - u.hire_date) as tenure_days,

          -- SPI score (performance metric)
          (
            SELECT AVG(daily_score)
            FROM spi_daily_scores
            WHERE caregiver_id = u.id
              AND score_date >= NOW() - INTERVAL '30 days'
          ) as avg_spi_score,

          -- Visit frequency
          (
            SELECT COUNT(*)
            FROM visits
            WHERE caregiver_id = u.id
              AND scheduled_start >= NOW() - INTERVAL '30 days'
          ) as visits_last_30d,

          (
            SELECT COUNT(*)
            FROM visits
            WHERE caregiver_id = u.id
              AND scheduled_start >= NOW() - INTERVAL '60 days'
              AND scheduled_start < NOW() - INTERVAL '30 days'
          ) as visits_30_60d,

          -- Disciplinary actions
          (
            SELECT COUNT(*)
            FROM disciplinary_actions
            WHERE user_id = u.id
              AND action_date >= NOW() - INTERVAL '90 days'
          ) as recent_discipline,

          -- Late check-ins
          (
            SELECT COUNT(*)
            FROM visits v
            JOIN visit_check_ins vci ON v.id = vci.visit_id
            WHERE v.caregiver_id = u.id
              AND vci.actual_check_in > v.scheduled_start + INTERVAL '15 minutes'
              AND v.scheduled_start >= NOW() - INTERVAL '30 days'
          ) as late_checkins

        FROM users u
        WHERE u.organization_id = $1
          AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
          AND u.status = 'active'
      )
      SELECT
        caregiver_id,
        caregiver_name,
        role,
        hire_date,
        tenure_days,
        avg_spi_score,
        visits_last_30d,
        visits_30_60d,
        recent_discipline,
        late_checkins
      FROM caregiver_data
    `;

    const result = await db.query(query, [organizationId]);

    const caregivers = result.rows.map(row => {
      // Calculate churn probability using rule-based scoring
      let riskScore = 0;
      const riskFactors = [];

      // Tenure (higher risk in first 90 days)
      const tenure = parseInt(row.tenure_days);
      if (tenure < 90) {
        riskScore += 0.3;
        riskFactors.push({
          factor: 'new_employee',
          impact: 'high' as const,
          value: `${tenure} days tenure (high risk in first 90 days)`
        });
      }

      // SPI score (low performance = higher churn risk)
      const spiScore = parseFloat(row.avg_spi_score) || 0;
      if (spiScore < 85) {
        const impact = spiScore < 75 ? 0.3 : 0.15;
        riskScore += impact;
        riskFactors.push({
          factor: 'low_spi_score',
          impact: spiScore < 75 ? 'high' as const : 'medium' as const,
          value: `SPI score: ${spiScore.toFixed(1)} (target: 95+)`
        });
      }

      // Declining visit frequency
      const visitsLast30 = parseInt(row.visits_last_30d);
      const visits3060 = parseInt(row.visits_30_60d);
      if (visits3060 > 0 && visitsLast30 < visits3060 * 0.7) {
        riskScore += 0.2;
        riskFactors.push({
          factor: 'declining_visits',
          impact: 'medium' as const,
          value: `${visitsLast30} visits (down from ${visits3060})`
        });
      }

      // Recent discipline
      const discipline = parseInt(row.recent_discipline);
      if (discipline > 0) {
        riskScore += Math.min(0.3, discipline * 0.15);
        riskFactors.push({
          factor: 'recent_discipline',
          impact: 'high' as const,
          value: `${discipline} disciplinary action(s) in 90 days`
        });
      }

      // Late check-ins
      const lateCheckins = parseInt(row.late_checkins);
      if (lateCheckins > 3) {
        riskScore += 0.1;
        riskFactors.push({
          factor: 'late_checkins',
          impact: 'low' as const,
          value: `${lateCheckins} late check-ins in 30 days`
        });
      }

      // Cap at 1.0
      const churnProbability = Math.min(1.0, riskScore);

      // Determine risk level
      const riskLevel = churnProbability >= 0.7 ? 'critical' :
                       churnProbability >= 0.5 ? 'high' :
                       churnProbability >= 0.3 ? 'medium' : 'low';

      // Generate interventions
      const interventions = [];
      if (spiScore < 85) {
        interventions.push({
          type: 'coaching',
          description: 'One-on-one performance coaching session',
          priority: 1
        });
      }
      if (tenure < 90) {
        interventions.push({
          type: 'mentorship',
          description: 'Assign experienced mentor for 90-day onboarding',
          priority: 1
        });
      }
      if (discipline > 0) {
        interventions.push({
          type: 'performance_improvement',
          description: 'Enroll in Performance Improvement Plan (PIP)',
          priority: 2
        });
      }
      if (lateCheckins > 3) {
        interventions.push({
          type: 'training',
          description: 'Time management and scheduling training',
          priority: 3
        });
      }
      if (riskFactors.length > 0) {
        interventions.push({
          type: 'recognition',
          description: 'Schedule recognition meeting to boost engagement',
          priority: 2
        });
      }

      return {
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        role: row.role,
        hireDate: row.hire_date,
        tenure: tenure,
        churnProbability: Math.round(churnProbability * 100) / 100,
        riskLevel,
        riskFactors,
        interventions: interventions.sort((a, b) => a.priority - b.priority)
      };
    });

    // Filter by risk threshold and sort by probability
    return caregivers
      .filter(c => c.churnProbability >= riskThreshold)
      .sort((a, b) => b.churnProbability - a.churnProbability);
  }

  /**
   * Get churn statistics
   */
  private async getChurnStatistics(organizationId: string) {
    const churnRisks = await this.getChurnRisks(organizationId, 0);

    const totalAtRisk = churnRisks.length;
    const criticalRisk = churnRisks.filter(c => c.riskLevel === 'critical').length;
    const highRisk = churnRisks.filter(c => c.riskLevel === 'high').length;
    const mediumRisk = churnRisks.filter(c => c.riskLevel === 'medium').length;
    const lowRisk = churnRisks.filter(c => c.riskLevel === 'low').length;

    // Estimate cost if all critical/high risk caregivers leave
    const avgReplacementCost = 5000; // Recruiting + training cost per caregiver
    const estimatedCost = (criticalRisk + highRisk) * avgReplacementCost;

    return {
      totalAtRisk,
      criticalRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      estimatedCostIfAllLeave: estimatedCost
    };
  }

  /**
   * Get historical churn data
   */
  private async getHistoricalChurn(organizationId: string) {
    const query = `
      WITH monthly_churn AS (
        SELECT
          TO_CHAR(DATE_TRUNC('month', termination_date), 'YYYY-MM') as month,
          COUNT(*) as churn_count,
          AVG(EXTRACT(DAY FROM termination_date - hire_date)) as avg_tenure_days,
          (
            SELECT COUNT(*)
            FROM users
            WHERE organization_id = $1
              AND role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
              AND hire_date < DATE_TRUNC('month', u.termination_date)
              AND (termination_date IS NULL OR termination_date >= DATE_TRUNC('month', u.termination_date))
          ) as total_caregivers
        FROM users u
        WHERE organization_id = $1
          AND role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
          AND termination_date IS NOT NULL
          AND termination_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', termination_date)
      )
      SELECT
        month,
        churn_count,
        ROUND(avg_tenure_days) as average_tenure,
        CASE
          WHEN total_caregivers > 0 THEN ROUND((churn_count::DECIMAL / total_caregivers) * 100, 1)
          ELSE 0
        END as churn_rate
      FROM monthly_churn
      ORDER BY month
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      month: row.month,
      churnCount: parseInt(row.churn_count),
      churnRate: parseFloat(row.churn_rate),
      averageTenure: parseInt(row.average_tenure)
    }));
  }

  /**
   * Get lead scoring data
   * Endpoint: GET /api/analytics/lead-scoring
   *
   * In Phase 3, this will use ML models (Logistic Regression/LightGBM)
   * For now, using rule-based scoring
   */
  async getLeadScoring(
    organizationId: string,
    minScore: number = 0,
    status?: string
  ) {
    const [leads, leadSummary, conversionFunnel] = await Promise.all([
      this.getLeadScores(organizationId, minScore, status),
      this.getLeadSummary(organizationId),
      this.getConversionFunnel(organizationId)
    ]);

    return {
      leads,
      leadSummary,
      conversionFunnel
    };
  }

  /**
   * Calculate lead scores
   */
  private async getLeadScores(organizationId: string, minScore: number, status?: string) {
    const statusFilter = status ? 'AND status = $2' : '';
    const params = status ? [organizationId, status] : [organizationId];

    const query = `
      SELECT
        id,
        name,
        source,
        created_at,
        contacted_at,
        status,
        EXTRACT(EPOCH FROM (contacted_at - created_at)) / 3600 as response_time_hours,
        notes
      FROM client_leads
      WHERE organization_id = $1
        ${statusFilter}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    const result = await db.query(query, params);

    const leads = result.rows.map(row => {
      let score = 50; // Base score
      const factors = [];

      // Source scoring (referrals convert better)
      if (row.source === 'referral') {
        score += 25;
        factors.push({
          factor: 'source_referral',
          impact: 25,
          value: 'Referral source'
        });
      } else if (row.source === 'website') {
        score += 10;
        factors.push({
          factor: 'source_website',
          impact: 10,
          value: 'Website inquiry'
        });
      }

      // Response time (fast response = higher conversion)
      const responseHours = row.response_time_hours;
      if (responseHours !== null) {
        if (responseHours < 1) {
          score += 20;
          factors.push({
            factor: 'response_time_fast',
            impact: 20,
            value: 'Contacted within 1 hour'
          });
        } else if (responseHours < 24) {
          score += 10;
          factors.push({
            factor: 'response_time_good',
            impact: 10,
            value: 'Contacted within 24 hours'
          });
        } else {
          score -= 15;
          factors.push({
            factor: 'response_time_slow',
            impact: -15,
            value: `Contacted after ${Math.round(responseHours)} hours`
          });
        }
      } else if (row.status === 'new') {
        score -= 20;
        factors.push({
          factor: 'not_contacted',
          impact: -20,
          value: 'Not yet contacted'
        });
      }

      // Status progression
      if (row.status === 'qualified') {
        score += 15;
        factors.push({
          factor: 'status_qualified',
          impact: 15,
          value: 'Lead qualified'
        });
      }

      // Cap score at 0-100
      score = Math.max(0, Math.min(100, score));
      const conversionProbability = score / 100;

      // Determine priority
      const priority = score >= 75 ? 'hot' :
                      score >= 50 ? 'warm' : 'cold';

      // Generate recommended actions
      const recommendedActions = [];
      if (!row.contacted_at) {
        recommendedActions.push({
          action: 'Make initial contact',
          timing: 'Immediately',
          expectedImpact: 'high' as const
        });
      } else if (row.status === 'contacted') {
        recommendedActions.push({
          action: 'Schedule in-home assessment',
          timing: 'Within 48 hours',
          expectedImpact: 'high' as const
        });
      } else if (row.status === 'qualified') {
        recommendedActions.push({
          action: 'Send service agreement',
          timing: 'Today',
          expectedImpact: 'high' as const
        });
      }

      return {
        leadId: row.id,
        name: row.name,
        source: row.source,
        createdAt: row.created_at,
        status: row.status,
        conversionScore: Math.round(score),
        conversionProbability: Math.round(conversionProbability * 100) / 100,
        priority,
        scoringFactors: factors,
        recommendedActions
      };
    });

    return leads.filter(l => l.conversionScore >= minScore);
  }

  /**
   * Get lead summary statistics
   */
  private async getLeadSummary(organizationId: string) {
    const query = `
      SELECT
        COUNT(*) as total_leads,
        AVG(conversion_score) as average_score,
        COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / NULLIF(COUNT(*), 0) * 100 as conversion_rate,
        AVG(EXTRACT(EPOCH FROM (converted_at - created_at)) / 86400) as avg_days_to_conversion
      FROM client_leads
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '90 days'
    `;

    const result = await db.query(query, [organizationId]);
    const row = result.rows[0];

    // Get leads by priority (using rule-based scoring)
    const allLeads = await this.getLeadScores(organizationId, 0);
    const hotLeads = allLeads.filter(l => l.priority === 'hot').length;
    const warmLeads = allLeads.filter(l => l.priority === 'warm').length;
    const coldLeads = allLeads.filter(l => l.priority === 'cold').length;

    return {
      totalLeads: parseInt(row.total_leads),
      hotLeads,
      warmLeads,
      coldLeads,
      averageScore: Math.round(parseFloat(row.average_score) || 50),
      conversionRate: Math.round((parseFloat(row.conversion_rate) || 0) * 10) / 10,
      averageTimeToConversion: Math.round(parseFloat(row.avg_days_to_conversion) || 0)
    };
  }

  /**
   * Get conversion funnel data
   */
  private async getConversionFunnel(organizationId: string) {
    const query = `
      WITH funnel_stats AS (
        SELECT
          status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (
            CASE
              WHEN status = 'contacted' THEN contacted_at - created_at
              WHEN status = 'qualified' THEN qualified_at - contacted_at
              WHEN status = 'converted' THEN converted_at - qualified_at
              ELSE NULL
            END
          )) / 86400) as avg_duration_days
        FROM client_leads
        WHERE organization_id = $1
          AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY status
      )
      SELECT * FROM funnel_stats
      ORDER BY
        CASE status
          WHEN 'new' THEN 1
          WHEN 'contacted' THEN 2
          WHEN 'qualified' THEN 3
          WHEN 'converted' THEN 4
          ELSE 5
        END
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map((row, index, arr) => {
      const count = parseInt(row.count);
      const nextStageCount = index < arr.length - 1 ? parseInt(arr[index + 1].count) : 0;
      const conversionRate = count > 0 && nextStageCount > 0
        ? Math.round((nextStageCount / count) * 1000) / 10
        : 0;

      return {
        stage: row.status,
        count,
        conversionRate,
        averageDuration: Math.round(parseFloat(row.avg_duration_days) || 0)
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
