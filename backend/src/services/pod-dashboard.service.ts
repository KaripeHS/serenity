/**
 * Pod Dashboard Service
 * Provides pod-level performance metrics, regional reporting, and management
 *
 * Phase 3, Months 7-8 - Multi-Pod Operations
 */

import { getDbClient } from '../database/client';

interface PodFilters {
  regionId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateRegionData {
  name: string;
  description?: string;
  counties?: string[];
  zipCodes?: string[];
  regionalManagerId?: string;
}

interface UpdateRegionData {
  name?: string;
  description?: string;
  counties?: string[];
  zipCodes?: string[];
  regionalManagerId?: string;
  isActive?: boolean;
}

interface PodTargets {
  targetClientCount?: number;
  targetCaregiverCount?: number;
}

export class PodDashboardService {
  /**
   * Get pod dashboard overview for an organization
   */
  async getPodsDashboard(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        p.id AS pod_id,
        p.name AS pod_name,
        pr.id AS region_id,
        pr.name AS region_name,
        p.target_client_count,
        p.target_caregiver_count,

        -- Current counts
        (SELECT COUNT(*) FROM clients c WHERE c.primary_pod_id = p.id AND c.status = 'active') AS active_clients,
        (SELECT COUNT(*) FROM caregivers cg WHERE cg.primary_pod_id = p.id AND cg.status = 'active') AS active_caregivers,

        -- Today's metrics
        COALESCE(ppd.scheduled_shifts, 0) AS today_scheduled,
        COALESCE(ppd.completed_shifts, 0) AS today_completed,
        COALESCE(ppd.coverage_gaps, 0) AS today_gaps,
        ppd.evv_compliance_rate AS today_evv,
        ppd.fill_rate AS today_fill_rate,

        -- Monthly metrics
        ppm.attendance_rate AS monthly_attendance,
        ppm.fill_rate AS monthly_fill_rate,
        ppm.pod_score AS monthly_score,
        ppm.rank_in_region,
        ppm.total_worked_hours AS monthly_hours,

        -- Compliance
        pcs.compliance_score,
        pcs.caregivers_fully_compliant,
        pcs.caregivers_expired AS expired_credentials,
        pcs.training_overdue,

        -- Cross-pod activity
        (SELECT COUNT(*) FROM cross_pod_assignments cpa
         WHERE cpa.assigned_pod_id = p.id AND cpa.status = 'active') AS incoming_floaters,
        (SELECT COUNT(*) FROM cross_pod_assignments cpa
         WHERE cpa.primary_pod_id = p.id AND cpa.status = 'active') AS outgoing_floaters

      FROM pods p
      LEFT JOIN pod_regions pr ON pr.id = p.region_id
      LEFT JOIN pod_performance_daily ppd ON ppd.pod_id = p.id
        AND ppd.performance_date = CURRENT_DATE
      LEFT JOIN pod_performance_monthly ppm ON ppm.pod_id = p.id
        AND ppm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
      LEFT JOIN pod_compliance_snapshots pcs ON pcs.pod_id = p.id
        AND pcs.snapshot_date = (SELECT MAX(snapshot_date) FROM pod_compliance_snapshots WHERE pod_id = p.id)
      WHERE p.organization_id = $1
        AND p.status = 'active'
      ORDER BY ppm.pod_score DESC NULLS LAST, p.name
    `,
      [organizationId]
    );

    return result.rows.map((row) => ({
      podId: row.pod_id,
      podName: row.pod_name,
      regionId: row.region_id,
      regionName: row.region_name,
      targets: {
        clients: row.target_client_count,
        caregivers: row.target_caregiver_count,
      },
      current: {
        clients: parseInt(row.active_clients) || 0,
        caregivers: parseInt(row.active_caregivers) || 0,
        clientUtilization: row.target_client_count
          ? ((parseInt(row.active_clients) || 0) / row.target_client_count) * 100
          : 0,
        caregiverUtilization: row.target_caregiver_count
          ? ((parseInt(row.active_caregivers) || 0) / row.target_caregiver_count) * 100
          : 0,
      },
      today: {
        scheduled: row.today_scheduled,
        completed: row.today_completed,
        gaps: row.today_gaps,
        evvCompliance: parseFloat(row.today_evv) || null,
        fillRate: parseFloat(row.today_fill_rate) || null,
      },
      monthly: {
        attendance: parseFloat(row.monthly_attendance) || null,
        fillRate: parseFloat(row.monthly_fill_rate) || null,
        score: parseFloat(row.monthly_score) || null,
        rank: row.rank_in_region,
        hoursWorked: parseFloat(row.monthly_hours) || 0,
      },
      compliance: {
        score: parseFloat(row.compliance_score) || null,
        fullyCompliant: row.caregivers_fully_compliant,
        expiredCredentials: row.expired_credentials,
        trainingOverdue: row.training_overdue,
      },
      crossPod: {
        incomingFloaters: parseInt(row.incoming_floaters) || 0,
        outgoingFloaters: parseInt(row.outgoing_floaters) || 0,
      },
    }));
  }

  /**
   * Get detailed pod performance for a specific pod
   */
  async getPodDetail(podId: string, organizationId: string): Promise<any | null> {
    const db = await getDbClient();

    const [podInfo, dailyTrend, weeklyStats, topCaregivers] = await Promise.all([
      // Basic pod info with current stats
      db.query(
        `
        SELECT
          p.id, p.name, p.description,
          p.target_client_count, p.target_caregiver_count,
          pr.id AS region_id, pr.name AS region_name,
          u.id AS manager_id, u.first_name || ' ' || u.last_name AS manager_name,
          (SELECT COUNT(*) FROM clients c WHERE c.primary_pod_id = p.id AND c.status = 'active') AS active_clients,
          (SELECT COUNT(*) FROM caregivers cg WHERE cg.primary_pod_id = p.id AND cg.status = 'active') AS active_caregivers
        FROM pods p
        LEFT JOIN pod_regions pr ON pr.id = p.region_id
        LEFT JOIN users u ON u.id = p.pod_lead_id
        WHERE p.id = $1 AND p.organization_id = $2
      `,
        [podId, organizationId]
      ),

      // Daily performance trend (last 30 days)
      db.query(
        `
        SELECT
          performance_date,
          scheduled_shifts,
          completed_shifts,
          fill_rate,
          completion_rate,
          evv_compliance_rate,
          coverage_gaps,
          worked_hours
        FROM pod_performance_daily
        WHERE pod_id = $1
          AND performance_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY performance_date
      `,
        [podId]
      ),

      // Weekly aggregated stats (last 12 weeks)
      db.query(
        `
        SELECT
          DATE_TRUNC('week', performance_date) AS week_start,
          SUM(scheduled_shifts) AS scheduled,
          SUM(completed_shifts) AS completed,
          AVG(fill_rate) AS avg_fill_rate,
          AVG(evv_compliance_rate) AS avg_evv,
          SUM(worked_hours) AS total_hours
        FROM pod_performance_daily
        WHERE pod_id = $1
          AND performance_date >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', performance_date)
        ORDER BY week_start
      `,
        [podId]
      ),

      // Top performing caregivers in pod
      db.query(
        `
        SELECT
          cg.id,
          cg.first_name || ' ' || cg.last_name AS name,
          cpm.performance_score,
          cpm.performance_tier,
          cpm.attendance_rate,
          cpm.evv_compliance_rate
        FROM caregivers cg
        JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
          AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        WHERE cg.primary_pod_id = $1
          AND cg.status = 'active'
        ORDER BY cpm.performance_score DESC
        LIMIT 10
      `,
        [podId]
      ),
    ]);

    if (podInfo.rows.length === 0) {
      return null;
    }

    const pod = podInfo.rows[0];

    return {
      id: pod.id,
      name: pod.name,
      description: pod.description,
      region: pod.region_id
        ? {
            id: pod.region_id,
            name: pod.region_name,
          }
        : null,
      manager: pod.manager_id
        ? {
            id: pod.manager_id,
            name: pod.manager_name,
          }
        : null,
      targets: {
        clients: pod.target_client_count,
        caregivers: pod.target_caregiver_count,
      },
      current: {
        clients: parseInt(pod.active_clients) || 0,
        caregivers: parseInt(pod.active_caregivers) || 0,
      },
      dailyTrend: dailyTrend.rows.map((row) => ({
        date: row.performance_date,
        scheduled: row.scheduled_shifts,
        completed: row.completed_shifts,
        fillRate: parseFloat(row.fill_rate),
        completionRate: parseFloat(row.completion_rate),
        evvCompliance: parseFloat(row.evv_compliance_rate),
        gaps: row.coverage_gaps,
        hoursWorked: parseFloat(row.worked_hours),
      })),
      weeklyStats: weeklyStats.rows.map((row) => ({
        weekStart: row.week_start,
        scheduled: parseInt(row.scheduled),
        completed: parseInt(row.completed),
        avgFillRate: parseFloat(row.avg_fill_rate),
        avgEvv: parseFloat(row.avg_evv),
        totalHours: parseFloat(row.total_hours),
      })),
      topCaregivers: topCaregivers.rows.map((row) => ({
        id: row.id,
        name: row.name,
        score: parseFloat(row.performance_score),
        tier: row.performance_tier,
        attendance: parseFloat(row.attendance_rate),
        evvCompliance: parseFloat(row.evv_compliance_rate),
      })),
    };
  }

  /**
   * Get pod comparison across the organization
   */
  async getPodComparison(
    organizationId: string,
    month?: Date
  ): Promise<any[]> {
    const db = await getDbClient();

    const targetMonth = month || new Date();
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);

    const result = await db.query(
      `
      WITH ranked_pods AS (
        SELECT
          p.id AS pod_id,
          p.name AS pod_name,
          pr.name AS region_name,
          ppm.*,
          pcs.compliance_score,
          RANK() OVER (ORDER BY ppm.pod_score DESC NULLS LAST) AS org_rank,
          RANK() OVER (PARTITION BY p.region_id ORDER BY ppm.pod_score DESC NULLS LAST) AS region_rank
        FROM pods p
        LEFT JOIN pod_regions pr ON pr.id = p.region_id
        LEFT JOIN pod_performance_monthly ppm ON ppm.pod_id = p.id
          AND ppm.performance_month = $2
        LEFT JOIN pod_compliance_snapshots pcs ON pcs.pod_id = p.id
          AND pcs.snapshot_date = (SELECT MAX(snapshot_date) FROM pod_compliance_snapshots WHERE pod_id = p.id)
        WHERE p.organization_id = $1
          AND p.status = 'active'
      )
      SELECT * FROM ranked_pods
      ORDER BY org_rank
    `,
      [organizationId, monthStart]
    );

    return result.rows.map((row) => ({
      podId: row.pod_id,
      podName: row.pod_name,
      regionName: row.region_name,
      orgRank: parseInt(row.org_rank),
      regionRank: parseInt(row.region_rank),
      metrics: {
        avgClients: parseFloat(row.avg_clients) || 0,
        avgCaregivers: parseFloat(row.avg_caregivers) || 0,
        scheduledShifts: row.total_scheduled_shifts || 0,
        completedShifts: row.total_completed_shifts || 0,
        attendanceRate: parseFloat(row.attendance_rate) || null,
        fillRate: parseFloat(row.fill_rate) || null,
        hoursWorked: parseFloat(row.total_worked_hours) || 0,
        evvCompliance: parseFloat(row.avg_evv_compliance) || null,
        complianceScore: parseFloat(row.compliance_score) || null,
        podScore: parseFloat(row.pod_score) || null,
      },
    }));
  }

  // ============================================
  // REGION MANAGEMENT
  // ============================================

  /**
   * Get all regions for organization
   */
  async getRegions(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        pr.id,
        pr.name,
        pr.description,
        pr.counties,
        pr.zip_codes,
        pr.is_active,
        u.id AS manager_id,
        u.first_name || ' ' || u.last_name AS manager_name,
        (SELECT COUNT(*) FROM pods p WHERE p.region_id = pr.id AND p.status = 'active') AS pod_count,
        (SELECT SUM(c.count) FROM (
          SELECT COUNT(*) FROM clients cl
          JOIN pods p ON p.id = cl.primary_pod_id
          WHERE p.region_id = pr.id AND cl.status = 'active'
        ) c) AS client_count,
        (SELECT SUM(c.count) FROM (
          SELECT COUNT(*) FROM caregivers cg
          JOIN pods p ON p.id = cg.primary_pod_id
          WHERE p.region_id = pr.id AND cg.status = 'active'
        ) c) AS caregiver_count
      FROM pod_regions pr
      LEFT JOIN users u ON u.id = pr.regional_manager_id
      WHERE pr.organization_id = $1
      ORDER BY pr.name
    `,
      [organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      counties: row.counties || [],
      zipCodes: row.zip_codes || [],
      isActive: row.is_active,
      manager: row.manager_id
        ? {
            id: row.manager_id,
            name: row.manager_name,
          }
        : null,
      stats: {
        pods: parseInt(row.pod_count) || 0,
        clients: parseInt(row.client_count) || 0,
        caregivers: parseInt(row.caregiver_count) || 0,
      },
    }));
  }

  /**
   * Create a new region
   */
  async createRegion(
    organizationId: string,
    data: CreateRegionData
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO pod_regions (
        organization_id, name, description, counties, zip_codes, regional_manager_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        organizationId,
        data.name,
        data.description || null,
        JSON.stringify(data.counties || []),
        JSON.stringify(data.zipCodes || []),
        data.regionalManagerId || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update a region
   */
  async updateRegion(
    regionId: string,
    organizationId: string,
    data: UpdateRegionData
  ): Promise<any | null> {
    const db = await getDbClient();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.counties !== undefined) {
      updates.push(`counties = $${paramIndex++}`);
      values.push(JSON.stringify(data.counties));
    }
    if (data.zipCodes !== undefined) {
      updates.push(`zip_codes = $${paramIndex++}`);
      values.push(JSON.stringify(data.zipCodes));
    }
    if (data.regionalManagerId !== undefined) {
      updates.push(`regional_manager_id = $${paramIndex++}`);
      values.push(data.regionalManagerId);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = NOW()`);
    values.push(regionId, organizationId);

    const result = await db.query(
      `
      UPDATE pod_regions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Assign pod to region
   */
  async assignPodToRegion(
    podId: string,
    regionId: string | null,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE pods
      SET region_id = $1, updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [regionId, podId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update pod targets
   */
  async updatePodTargets(
    podId: string,
    organizationId: string,
    targets: PodTargets
  ): Promise<any | null> {
    const db = await getDbClient();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (targets.targetClientCount !== undefined) {
      updates.push(`target_client_count = $${paramIndex++}`);
      values.push(targets.targetClientCount);
    }
    if (targets.targetCaregiverCount !== undefined) {
      updates.push(`target_caregiver_count = $${paramIndex++}`);
      values.push(targets.targetCaregiverCount);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = NOW()`);
    values.push(podId, organizationId);

    const result = await db.query(
      `
      UPDATE pods
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  // ============================================
  // PERFORMANCE SNAPSHOTS
  // ============================================

  /**
   * Generate daily performance snapshot for a pod
   */
  async generateDailySnapshot(podId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT generate_pod_daily_snapshot($1) AS snapshot_id`,
      [podId]
    );

    return { snapshotId: result.rows[0]?.snapshot_id };
  }

  /**
   * Generate daily snapshots for all active pods
   */
  async generateAllDailySnapshots(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const pods = await db.query(
      `SELECT id FROM pods WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );

    const results = await Promise.all(
      pods.rows.map((pod) => this.generateDailySnapshot(pod.id))
    );

    return {
      podsProcessed: results.length,
      snapshots: results,
    };
  }

  /**
   * Generate monthly performance aggregate
   */
  async generateMonthlyAggregate(
    podId: string,
    month: Date
  ): Promise<any> {
    const db = await getDbClient();

    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Calculate aggregates from daily data
    const result = await db.query(
      `
      WITH daily_data AS (
        SELECT * FROM pod_performance_daily
        WHERE pod_id = $1
          AND performance_date BETWEEN $2 AND $3
      ),
      compliance_data AS (
        SELECT compliance_score FROM pod_compliance_snapshots
        WHERE pod_id = $1
        ORDER BY snapshot_date DESC
        LIMIT 1
      )
      INSERT INTO pod_performance_monthly (
        pod_id, organization_id, performance_month,
        avg_clients, avg_caregivers, avg_ratio,
        total_scheduled_shifts, total_completed_shifts,
        attendance_rate, fill_rate,
        total_scheduled_hours, total_worked_hours,
        overtime_percentage,
        avg_evv_compliance,
        pod_score
      )
      SELECT
        $1,
        (SELECT organization_id FROM pods WHERE id = $1),
        $2,
        AVG(active_clients),
        AVG(active_caregivers),
        AVG(client_to_caregiver_ratio),
        SUM(scheduled_shifts),
        SUM(completed_shifts),
        CASE WHEN SUM(scheduled_shifts) > 0
          THEN (SUM(completed_shifts)::DECIMAL / SUM(scheduled_shifts)) * 100
          ELSE 100 END,
        AVG(fill_rate),
        SUM(scheduled_hours),
        SUM(worked_hours),
        CASE WHEN SUM(worked_hours) > 0
          THEN (SUM(overtime_hours) / SUM(worked_hours)) * 100
          ELSE 0 END,
        AVG(evv_compliance_rate),
        calculate_pod_score(
          CASE WHEN SUM(scheduled_shifts) > 0
            THEN (SUM(completed_shifts)::DECIMAL / SUM(scheduled_shifts)) * 100
            ELSE 100 END,
          AVG(fill_rate),
          AVG(evv_compliance_rate),
          (SELECT compliance_score FROM compliance_data)
        )
      FROM daily_data
      ON CONFLICT (pod_id, performance_month)
      DO UPDATE SET
        avg_clients = EXCLUDED.avg_clients,
        avg_caregivers = EXCLUDED.avg_caregivers,
        avg_ratio = EXCLUDED.avg_ratio,
        total_scheduled_shifts = EXCLUDED.total_scheduled_shifts,
        total_completed_shifts = EXCLUDED.total_completed_shifts,
        attendance_rate = EXCLUDED.attendance_rate,
        fill_rate = EXCLUDED.fill_rate,
        total_scheduled_hours = EXCLUDED.total_scheduled_hours,
        total_worked_hours = EXCLUDED.total_worked_hours,
        overtime_percentage = EXCLUDED.overtime_percentage,
        avg_evv_compliance = EXCLUDED.avg_evv_compliance,
        pod_score = EXCLUDED.pod_score,
        updated_at = NOW()
      RETURNING *
    `,
      [podId, monthStart, monthEnd]
    );

    return result.rows[0];
  }

  /**
   * Generate compliance snapshot for a pod
   */
  async generateComplianceSnapshot(podId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      WITH caregiver_stats AS (
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM caregiver_credentials cc
            WHERE cc.caregiver_id = cg.id
              AND (cc.expiration_date IS NOT NULL AND cc.expiration_date < CURRENT_DATE)
          )) AS fully_compliant,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM caregiver_credentials cc
            WHERE cc.caregiver_id = cg.id
              AND cc.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          )) AS expiring_30,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM caregiver_credentials cc
            WHERE cc.caregiver_id = cg.id
              AND cc.expiration_date < CURRENT_DATE
          )) AS expired
        FROM caregivers cg
        WHERE cg.primary_pod_id = $1 AND cg.status = 'active'
      ),
      training_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE ta.status = 'completed') AS compliant,
          COUNT(*) FILTER (WHERE ta.status = 'overdue') AS overdue,
          COUNT(*) FILTER (WHERE ta.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS due_soon
        FROM training_assignments ta
        JOIN caregivers cg ON cg.user_id = ta.assigned_to
        WHERE cg.primary_pod_id = $1 AND cg.status = 'active'
      ),
      evv_stats AS (
        SELECT
          AVG(cpd.evv_compliance_rate) AS avg_evv,
          COUNT(*) FILTER (WHERE cpd.evv_compliance_rate < 95) AS below_threshold
        FROM caregiver_performance_daily cpd
        JOIN caregivers cg ON cg.id = cpd.caregiver_id
        WHERE cg.primary_pod_id = $1
          AND cpd.performance_date >= CURRENT_DATE - INTERVAL '30 days'
      )
      INSERT INTO pod_compliance_snapshots (
        pod_id, organization_id, snapshot_date,
        total_caregivers, caregivers_fully_compliant,
        caregivers_expiring_30_days, caregivers_expired,
        training_compliant, training_overdue, training_due_soon,
        avg_evv_compliance, evv_below_threshold,
        compliance_score
      )
      SELECT
        $1,
        (SELECT organization_id FROM pods WHERE id = $1),
        CURRENT_DATE,
        cs.total,
        cs.fully_compliant,
        cs.expiring_30,
        cs.expired,
        ts.compliant,
        ts.overdue,
        ts.due_soon,
        es.avg_evv,
        es.below_threshold,
        -- Calculate compliance score
        CASE WHEN cs.total > 0
          THEN (
            (cs.fully_compliant::DECIMAL / cs.total) * 40 +
            (CASE WHEN ts.compliant + ts.overdue > 0
              THEN (ts.compliant::DECIMAL / (ts.compliant + ts.overdue)) * 30
              ELSE 30 END) +
            (COALESCE(es.avg_evv, 95) / 100) * 30
          )
          ELSE 100
        END
      FROM caregiver_stats cs, training_stats ts, evv_stats es
      ON CONFLICT (pod_id, snapshot_date)
      DO UPDATE SET
        total_caregivers = EXCLUDED.total_caregivers,
        caregivers_fully_compliant = EXCLUDED.caregivers_fully_compliant,
        caregivers_expiring_30_days = EXCLUDED.caregivers_expiring_30_days,
        caregivers_expired = EXCLUDED.caregivers_expired,
        training_compliant = EXCLUDED.training_compliant,
        training_overdue = EXCLUDED.training_overdue,
        training_due_soon = EXCLUDED.training_due_soon,
        avg_evv_compliance = EXCLUDED.avg_evv_compliance,
        evv_below_threshold = EXCLUDED.evv_below_threshold,
        compliance_score = EXCLUDED.compliance_score
      RETURNING *
    `,
      [podId]
    );

    return result.rows[0];
  }

  /**
   * Get regional compliance summary
   */
  async getRegionalComplianceSummary(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        pr.id AS region_id,
        pr.name AS region_name,
        COUNT(DISTINCT p.id) AS pod_count,
        SUM(pcs.total_caregivers) AS total_caregivers,
        SUM(pcs.caregivers_fully_compliant) AS compliant_caregivers,
        ROUND(
          (SUM(pcs.caregivers_fully_compliant)::DECIMAL / NULLIF(SUM(pcs.total_caregivers), 0)) * 100,
          1
        ) AS compliance_rate,
        SUM(pcs.caregivers_expired) AS expired_credentials,
        SUM(pcs.training_overdue) AS training_overdue,
        AVG(pcs.compliance_score) AS avg_compliance_score
      FROM pod_regions pr
      JOIN pods p ON p.region_id = pr.id AND p.status = 'active'
      LEFT JOIN pod_compliance_snapshots pcs ON pcs.pod_id = p.id
        AND pcs.snapshot_date = (
          SELECT MAX(snapshot_date) FROM pod_compliance_snapshots
          WHERE pod_id = p.id
        )
      WHERE pr.organization_id = $1
        AND pr.is_active = TRUE
      GROUP BY pr.id, pr.name
      ORDER BY avg_compliance_score DESC NULLS LAST
    `,
      [organizationId]
    );

    return result.rows.map((row) => ({
      regionId: row.region_id,
      regionName: row.region_name,
      podCount: parseInt(row.pod_count) || 0,
      totalCaregivers: parseInt(row.total_caregivers) || 0,
      compliantCaregivers: parseInt(row.compliant_caregivers) || 0,
      complianceRate: parseFloat(row.compliance_rate) || 0,
      expiredCredentials: parseInt(row.expired_credentials) || 0,
      trainingOverdue: parseInt(row.training_overdue) || 0,
      avgComplianceScore: parseFloat(row.avg_compliance_score) || 0,
    }));
  }
}

export const podDashboardService = new PodDashboardService();
