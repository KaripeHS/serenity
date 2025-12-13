/**
 * Regional Compliance Service
 * Provides regional-level compliance reporting, trend analysis,
 * and compliance alerts across pods and regions
 *
 * Phase 3, Months 7-8 - Multi-Pod Operations
 */

import { getDbClient } from '../database/client';

interface ComplianceFilters {
  regionId?: string;
  podId?: string;
  fromDate?: string;
  toDate?: string;
}

interface ComplianceAlert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  podId?: string;
  podName?: string;
  regionId?: string;
  regionName?: string;
  message: string;
  count: number;
  details?: any;
}

export class RegionalComplianceService {
  /**
   * Get organization-wide compliance dashboard
   */
  async getComplianceDashboard(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const [
      orgSummary,
      regionSummary,
      podSummary,
      alerts,
      recentSnapshots,
    ] = await Promise.all([
      // Organization-wide summary
      this.getOrganizationComplianceSummary(organizationId),

      // By region
      this.getRegionalComplianceSummary(organizationId),

      // By pod (top issues)
      this.getPodsWithComplianceIssues(organizationId),

      // Active alerts
      this.getComplianceAlerts(organizationId),

      // Recent snapshots trend
      this.getComplianceTrend(organizationId, 30),
    ]);

    return {
      organization: orgSummary,
      byRegion: regionSummary,
      podsWithIssues: podSummary,
      alerts,
      trend: recentSnapshots,
    };
  }

  /**
   * Get organization-wide compliance summary
   */
  async getOrganizationComplianceSummary(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      WITH latest_snapshots AS (
        SELECT DISTINCT ON (pod_id) *
        FROM pod_compliance_snapshots
        WHERE organization_id = $1
        ORDER BY pod_id, snapshot_date DESC
      )
      SELECT
        SUM(total_caregivers) AS total_caregivers,
        SUM(caregivers_fully_compliant) AS fully_compliant,
        SUM(caregivers_expiring_30_days) AS expiring_30_days,
        SUM(caregivers_expired) AS expired,
        SUM(training_compliant) AS training_compliant,
        SUM(training_overdue) AS training_overdue,
        SUM(training_due_soon) AS training_due_soon,
        SUM(background_checks_current) AS bg_current,
        SUM(background_checks_pending) AS bg_pending,
        SUM(background_checks_expired) AS bg_expired,
        AVG(avg_evv_compliance) AS avg_evv_compliance,
        SUM(evv_below_threshold) AS evv_below_threshold,
        AVG(compliance_score) AS avg_compliance_score,
        COUNT(*) AS pod_count
      FROM latest_snapshots
    `,
      [organizationId]
    );

    const row = result.rows[0];
    const totalCaregivers = parseInt(row.total_caregivers) || 0;

    return {
      totalCaregivers,
      fullyCompliant: parseInt(row.fully_compliant) || 0,
      complianceRate: totalCaregivers > 0
        ? ((parseInt(row.fully_compliant) || 0) / totalCaregivers) * 100
        : 100,
      credentials: {
        expiring30Days: parseInt(row.expiring_30_days) || 0,
        expired: parseInt(row.expired) || 0,
      },
      training: {
        compliant: parseInt(row.training_compliant) || 0,
        overdue: parseInt(row.training_overdue) || 0,
        dueSoon: parseInt(row.training_due_soon) || 0,
      },
      backgroundChecks: {
        current: parseInt(row.bg_current) || 0,
        pending: parseInt(row.bg_pending) || 0,
        expired: parseInt(row.bg_expired) || 0,
      },
      evv: {
        avgCompliance: parseFloat(row.avg_evv_compliance) || 0,
        belowThreshold: parseInt(row.evv_below_threshold) || 0,
      },
      avgComplianceScore: parseFloat(row.avg_compliance_score) || 0,
      podCount: parseInt(row.pod_count) || 0,
    };
  }

  /**
   * Get regional compliance summary
   */
  async getRegionalComplianceSummary(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      WITH latest_snapshots AS (
        SELECT DISTINCT ON (pod_id) *
        FROM pod_compliance_snapshots
        WHERE organization_id = $1
        ORDER BY pod_id, snapshot_date DESC
      )
      SELECT
        pr.id AS region_id,
        pr.name AS region_name,
        COUNT(DISTINCT p.id) AS pod_count,
        SUM(ls.total_caregivers) AS total_caregivers,
        SUM(ls.caregivers_fully_compliant) AS fully_compliant,
        ROUND(
          (SUM(ls.caregivers_fully_compliant)::DECIMAL / NULLIF(SUM(ls.total_caregivers), 0)) * 100,
          1
        ) AS compliance_rate,
        SUM(ls.caregivers_expired) AS expired_credentials,
        SUM(ls.training_overdue) AS training_overdue,
        AVG(ls.avg_evv_compliance) AS avg_evv_compliance,
        AVG(ls.compliance_score) AS avg_compliance_score,
        -- Rank regions by compliance score
        RANK() OVER (ORDER BY AVG(ls.compliance_score) DESC NULLS LAST) AS rank
      FROM pod_regions pr
      LEFT JOIN pods p ON p.region_id = pr.id AND p.status = 'active'
      LEFT JOIN latest_snapshots ls ON ls.pod_id = p.id
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
      rank: parseInt(row.rank),
      podCount: parseInt(row.pod_count) || 0,
      totalCaregivers: parseInt(row.total_caregivers) || 0,
      fullyCompliant: parseInt(row.fully_compliant) || 0,
      complianceRate: parseFloat(row.compliance_rate) || 0,
      expiredCredentials: parseInt(row.expired_credentials) || 0,
      trainingOverdue: parseInt(row.training_overdue) || 0,
      avgEvvCompliance: parseFloat(row.avg_evv_compliance) || 0,
      avgComplianceScore: parseFloat(row.avg_compliance_score) || 0,
    }));
  }

  /**
   * Get pods with compliance issues
   */
  async getPodsWithComplianceIssues(
    organizationId: string,
    limit: number = 10
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      WITH latest_snapshots AS (
        SELECT DISTINCT ON (pod_id) *
        FROM pod_compliance_snapshots
        WHERE organization_id = $1
        ORDER BY pod_id, snapshot_date DESC
      )
      SELECT
        p.id AS pod_id,
        p.name AS pod_name,
        pr.name AS region_name,
        ls.total_caregivers,
        ls.caregivers_fully_compliant,
        ls.caregivers_expired,
        ls.caregivers_expiring_30_days,
        ls.training_overdue,
        ls.evv_below_threshold,
        ls.compliance_score,
        -- Calculate issue count
        COALESCE(ls.caregivers_expired, 0) +
        COALESCE(ls.training_overdue, 0) +
        COALESCE(ls.background_checks_expired, 0) AS total_issues
      FROM pods p
      LEFT JOIN pod_regions pr ON pr.id = p.region_id
      LEFT JOIN latest_snapshots ls ON ls.pod_id = p.id
      WHERE p.organization_id = $1
        AND p.status = 'active'
        AND (
          COALESCE(ls.caregivers_expired, 0) > 0
          OR COALESCE(ls.training_overdue, 0) > 0
          OR COALESCE(ls.background_checks_expired, 0) > 0
          OR COALESCE(ls.compliance_score, 100) < 80
        )
      ORDER BY total_issues DESC, ls.compliance_score ASC NULLS LAST
      LIMIT $2
    `,
      [organizationId, limit]
    );

    return result.rows.map((row) => ({
      podId: row.pod_id,
      podName: row.pod_name,
      regionName: row.region_name,
      totalCaregivers: row.total_caregivers,
      fullyCompliant: row.caregivers_fully_compliant,
      issues: {
        expiredCredentials: row.caregivers_expired,
        expiringSoon: row.caregivers_expiring_30_days,
        trainingOverdue: row.training_overdue,
        evvBelowThreshold: row.evv_below_threshold,
        total: parseInt(row.total_issues) || 0,
      },
      complianceScore: parseFloat(row.compliance_score) || 0,
    }));
  }

  /**
   * Get compliance alerts across organization
   */
  async getComplianceAlerts(organizationId: string): Promise<ComplianceAlert[]> {
    const db = await getDbClient();
    const alerts: ComplianceAlert[] = [];

    // Check for expired credentials
    const expiredCreds = await db.query(
      `
      SELECT
        p.id AS pod_id,
        p.name AS pod_name,
        pr.id AS region_id,
        pr.name AS region_name,
        COUNT(*) AS count
      FROM caregiver_credentials cc
      JOIN caregivers cg ON cg.id = cc.caregiver_id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      LEFT JOIN pod_regions pr ON pr.id = p.region_id
      WHERE cc.organization_id = $1
        AND cc.expiration_date < CURRENT_DATE
        AND cg.status = 'active'
      GROUP BY p.id, p.name, pr.id, pr.name
      HAVING COUNT(*) > 0
      ORDER BY count DESC
    `,
      [organizationId]
    );

    for (const row of expiredCreds.rows) {
      alerts.push({
        type: 'expired_credentials',
        severity: 'critical',
        podId: row.pod_id,
        podName: row.pod_name,
        regionId: row.region_id,
        regionName: row.region_name,
        message: `${row.count} caregiver(s) with expired credentials`,
        count: parseInt(row.count),
      });
    }

    // Check for overdue training
    const overdueTraining = await db.query(
      `
      SELECT
        p.id AS pod_id,
        p.name AS pod_name,
        pr.id AS region_id,
        pr.name AS region_name,
        COUNT(*) AS count
      FROM training_assignments ta
      JOIN caregivers cg ON cg.user_id = ta.assigned_to
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      LEFT JOIN pod_regions pr ON pr.id = p.region_id
      WHERE ta.organization_id = $1
        AND ta.status = 'overdue'
        AND cg.status = 'active'
      GROUP BY p.id, p.name, pr.id, pr.name
      HAVING COUNT(*) > 0
      ORDER BY count DESC
    `,
      [organizationId]
    );

    for (const row of overdueTraining.rows) {
      alerts.push({
        type: 'overdue_training',
        severity: 'warning',
        podId: row.pod_id,
        podName: row.pod_name,
        regionId: row.region_id,
        regionName: row.region_name,
        message: `${row.count} caregiver(s) with overdue training`,
        count: parseInt(row.count),
      });
    }

    // Check for low EVV compliance
    const lowEvv = await db.query(
      `
      SELECT
        p.id AS pod_id,
        p.name AS pod_name,
        pr.id AS region_id,
        pr.name AS region_name,
        AVG(cpd.evv_compliance_rate) AS avg_evv,
        COUNT(*) FILTER (WHERE cpd.evv_compliance_rate < 95) AS below_threshold
      FROM caregiver_performance_daily cpd
      JOIN caregivers cg ON cg.id = cpd.caregiver_id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      LEFT JOIN pod_regions pr ON pr.id = p.region_id
      WHERE cpd.organization_id = $1
        AND cpd.performance_date >= CURRENT_DATE - INTERVAL '7 days'
        AND cg.status = 'active'
      GROUP BY p.id, p.name, pr.id, pr.name
      HAVING COUNT(*) FILTER (WHERE cpd.evv_compliance_rate < 95) > 2
      ORDER BY below_threshold DESC
    `,
      [organizationId]
    );

    for (const row of lowEvv.rows) {
      alerts.push({
        type: 'low_evv_compliance',
        severity: 'warning',
        podId: row.pod_id,
        podName: row.pod_name,
        regionId: row.region_id,
        regionName: row.region_name,
        message: `${row.below_threshold} caregiver(s) below 95% EVV compliance`,
        count: parseInt(row.below_threshold),
        details: {
          avgEvv: parseFloat(row.avg_evv),
        },
      });
    }

    // Check for expiring credentials in next 14 days
    const expiringSoon = await db.query(
      `
      SELECT
        p.id AS pod_id,
        p.name AS pod_name,
        pr.id AS region_id,
        pr.name AS region_name,
        COUNT(*) AS count
      FROM caregiver_credentials cc
      JOIN caregivers cg ON cg.id = cc.caregiver_id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      LEFT JOIN pod_regions pr ON pr.id = p.region_id
      WHERE cc.organization_id = $1
        AND cc.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
        AND cg.status = 'active'
      GROUP BY p.id, p.name, pr.id, pr.name
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
    `,
      [organizationId]
    );

    for (const row of expiringSoon.rows) {
      alerts.push({
        type: 'credentials_expiring_soon',
        severity: 'info',
        podId: row.pod_id,
        podName: row.pod_name,
        regionId: row.region_id,
        regionName: row.region_name,
        message: `${row.count} credential(s) expiring within 14 days`,
        count: parseInt(row.count),
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    return alerts;
  }

  /**
   * Get compliance trend over time
   */
  async getComplianceTrend(
    organizationId: string,
    days: number = 30
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        snapshot_date,
        SUM(total_caregivers) AS total_caregivers,
        SUM(caregivers_fully_compliant) AS fully_compliant,
        AVG(compliance_score) AS avg_compliance_score,
        SUM(caregivers_expired) AS expired_credentials,
        SUM(training_overdue) AS training_overdue,
        AVG(avg_evv_compliance) AS avg_evv_compliance
      FROM pod_compliance_snapshots
      WHERE organization_id = $1
        AND snapshot_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL
      GROUP BY snapshot_date
      ORDER BY snapshot_date
    `,
      [organizationId, days]
    );

    return result.rows.map((row) => ({
      date: row.snapshot_date,
      totalCaregivers: parseInt(row.total_caregivers) || 0,
      fullyCompliant: parseInt(row.fully_compliant) || 0,
      complianceRate:
        parseInt(row.total_caregivers) > 0
          ? ((parseInt(row.fully_compliant) || 0) / parseInt(row.total_caregivers)) * 100
          : 100,
      avgComplianceScore: parseFloat(row.avg_compliance_score) || 0,
      expiredCredentials: parseInt(row.expired_credentials) || 0,
      trainingOverdue: parseInt(row.training_overdue) || 0,
      avgEvvCompliance: parseFloat(row.avg_evv_compliance) || 0,
    }));
  }

  /**
   * Get detailed compliance report for a region
   */
  async getRegionComplianceDetail(
    regionId: string,
    organizationId: string
  ): Promise<any> {
    const db = await getDbClient();

    const [regionInfo, podDetails, credentialBreakdown, trainingBreakdown] =
      await Promise.all([
        // Region info
        db.query(
          `
        SELECT
          pr.id, pr.name, pr.description,
          u.first_name || ' ' || u.last_name AS manager_name,
          (SELECT COUNT(*) FROM pods p WHERE p.region_id = pr.id AND p.status = 'active') AS pod_count
        FROM pod_regions pr
        LEFT JOIN users u ON u.id = pr.regional_manager_id
        WHERE pr.id = $1 AND pr.organization_id = $2
      `,
          [regionId, organizationId]
        ),

        // Pod details with compliance
        db.query(
          `
        WITH latest_snapshots AS (
          SELECT DISTINCT ON (pod_id) *
          FROM pod_compliance_snapshots
          WHERE organization_id = $2
          ORDER BY pod_id, snapshot_date DESC
        )
        SELECT
          p.id AS pod_id,
          p.name AS pod_name,
          ls.*
        FROM pods p
        LEFT JOIN latest_snapshots ls ON ls.pod_id = p.id
        WHERE p.region_id = $1
          AND p.organization_id = $2
          AND p.status = 'active'
        ORDER BY ls.compliance_score ASC NULLS LAST
      `,
          [regionId, organizationId]
        ),

        // Credential type breakdown
        db.query(
          `
        SELECT
          cc.credential_type,
          COUNT(*) FILTER (WHERE cc.expiration_date >= CURRENT_DATE) AS current,
          COUNT(*) FILTER (WHERE cc.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_30,
          COUNT(*) FILTER (WHERE cc.expiration_date < CURRENT_DATE) AS expired
        FROM caregiver_credentials cc
        JOIN caregivers cg ON cg.id = cc.caregiver_id
        JOIN pods p ON p.id = cg.primary_pod_id
        WHERE p.region_id = $1
          AND cc.organization_id = $2
          AND cg.status = 'active'
        GROUP BY cc.credential_type
        ORDER BY expired DESC, expiring_30 DESC
      `,
          [regionId, organizationId]
        ),

        // Training breakdown by type
        db.query(
          `
        SELECT
          tt.name AS training_type,
          COUNT(*) FILTER (WHERE ta.status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE ta.status = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE ta.status = 'overdue') AS overdue,
          COUNT(*) FILTER (WHERE ta.status = 'not_started') AS not_started
        FROM training_assignments ta
        JOIN training_types tt ON tt.id = ta.training_type_id
        JOIN caregivers cg ON cg.user_id = ta.assigned_to
        JOIN pods p ON p.id = cg.primary_pod_id
        WHERE p.region_id = $1
          AND ta.organization_id = $2
          AND cg.status = 'active'
        GROUP BY tt.name
        ORDER BY overdue DESC
      `,
          [regionId, organizationId]
        ),
      ]);

    if (regionInfo.rows.length === 0) {
      return null;
    }

    const region = regionInfo.rows[0];

    return {
      id: region.id,
      name: region.name,
      description: region.description,
      manager: region.manager_name,
      podCount: parseInt(region.pod_count) || 0,
      pods: podDetails.rows.map((row) => ({
        podId: row.pod_id,
        podName: row.pod_name,
        totalCaregivers: row.total_caregivers,
        fullyCompliant: row.caregivers_fully_compliant,
        expiring30Days: row.caregivers_expiring_30_days,
        expired: row.caregivers_expired,
        trainingOverdue: row.training_overdue,
        evvBelowThreshold: row.evv_below_threshold,
        complianceScore: parseFloat(row.compliance_score) || 0,
        snapshotDate: row.snapshot_date,
      })),
      credentialBreakdown: credentialBreakdown.rows.map((row) => ({
        type: row.credential_type,
        current: parseInt(row.current) || 0,
        expiring30Days: parseInt(row.expiring_30) || 0,
        expired: parseInt(row.expired) || 0,
      })),
      trainingBreakdown: trainingBreakdown.rows.map((row) => ({
        type: row.training_type,
        completed: parseInt(row.completed) || 0,
        inProgress: parseInt(row.in_progress) || 0,
        overdue: parseInt(row.overdue) || 0,
        notStarted: parseInt(row.not_started) || 0,
      })),
    };
  }

  /**
   * Get detailed compliance report for a pod
   */
  async getPodComplianceDetail(
    podId: string,
    organizationId: string
  ): Promise<any> {
    const db = await getDbClient();

    const [podInfo, caregiverCompliance, recentSnapshots] = await Promise.all([
      // Pod info
      db.query(
        `
        SELECT
          p.id, p.name,
          pr.id AS region_id, pr.name AS region_name,
          u.first_name || ' ' || u.last_name AS lead_name,
          (SELECT COUNT(*) FROM caregivers cg WHERE cg.primary_pod_id = p.id AND cg.status = 'active') AS caregiver_count
        FROM pods p
        LEFT JOIN pod_regions pr ON pr.id = p.region_id
        LEFT JOIN users u ON u.id = p.pod_lead_id
        WHERE p.id = $1 AND p.organization_id = $2
      `,
        [podId, organizationId]
      ),

      // Individual caregiver compliance
      db.query(
        `
        SELECT
          cg.id,
          cg.first_name || ' ' || cg.last_name AS name,
          -- Credentials
          (SELECT COUNT(*) FROM caregiver_credentials cc
           WHERE cc.caregiver_id = cg.id AND cc.expiration_date >= CURRENT_DATE) AS active_credentials,
          (SELECT COUNT(*) FROM caregiver_credentials cc
           WHERE cc.caregiver_id = cg.id AND cc.expiration_date < CURRENT_DATE) AS expired_credentials,
          (SELECT COUNT(*) FROM caregiver_credentials cc
           WHERE cc.caregiver_id = cg.id
             AND cc.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_credentials,
          -- Training
          (SELECT COUNT(*) FROM training_assignments ta
           WHERE ta.assigned_to = cg.user_id AND ta.status = 'overdue') AS overdue_training,
          -- EVV
          cpm.evv_compliance_rate,
          cpm.performance_score,
          cpm.performance_tier
        FROM caregivers cg
        LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
          AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
        WHERE cg.primary_pod_id = $1
          AND cg.organization_id = $2
          AND cg.status = 'active'
        ORDER BY
          expired_credentials DESC,
          expiring_credentials DESC,
          overdue_training DESC
      `,
        [podId, organizationId]
      ),

      // Recent snapshots (last 30 days)
      db.query(
        `
        SELECT *
        FROM pod_compliance_snapshots
        WHERE pod_id = $1
          AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY snapshot_date
      `,
        [podId]
      ),
    ]);

    if (podInfo.rows.length === 0) {
      return null;
    }

    const pod = podInfo.rows[0];

    // Categorize caregivers
    const caregivers = caregiverCompliance.rows.map((row) => ({
      id: row.id,
      name: row.name,
      credentials: {
        active: parseInt(row.active_credentials) || 0,
        expired: parseInt(row.expired_credentials) || 0,
        expiring: parseInt(row.expiring_credentials) || 0,
      },
      overdueTraining: parseInt(row.overdue_training) || 0,
      evvCompliance: parseFloat(row.evv_compliance_rate) || null,
      performanceScore: parseFloat(row.performance_score) || null,
      performanceTier: row.performance_tier,
      status:
        parseInt(row.expired_credentials) > 0
          ? 'non_compliant'
          : parseInt(row.expiring_credentials) > 0 ||
            parseInt(row.overdue_training) > 0
          ? 'at_risk'
          : 'compliant',
    }));

    return {
      id: pod.id,
      name: pod.name,
      region: pod.region_id
        ? { id: pod.region_id, name: pod.region_name }
        : null,
      lead: pod.lead_name,
      caregiverCount: parseInt(pod.caregiver_count) || 0,
      summary: {
        compliant: caregivers.filter((c) => c.status === 'compliant').length,
        atRisk: caregivers.filter((c) => c.status === 'at_risk').length,
        nonCompliant: caregivers.filter((c) => c.status === 'non_compliant')
          .length,
      },
      caregivers,
      trend: recentSnapshots.rows.map((row) => ({
        date: row.snapshot_date,
        totalCaregivers: row.total_caregivers,
        fullyCompliant: row.caregivers_fully_compliant,
        expired: row.caregivers_expired,
        trainingOverdue: row.training_overdue,
        complianceScore: parseFloat(row.compliance_score) || 0,
      })),
    };
  }

  /**
   * Generate compliance report for all pods
   */
  async generateAllComplianceSnapshots(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const pods = await db.query(
      `SELECT id FROM pods WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );

    // Import pod dashboard service for snapshot generation
    const { podDashboardService } = await import('./pod-dashboard.service');

    const results = await Promise.all(
      pods.rows.map((pod) =>
        podDashboardService.generateComplianceSnapshot(pod.id)
      )
    );

    return {
      podsProcessed: results.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export compliance report as structured data
   */
  async exportComplianceReport(
    organizationId: string,
    format: 'summary' | 'detailed' = 'summary'
  ): Promise<any> {
    const db = await getDbClient();

    const [dashboard, regions] = await Promise.all([
      this.getComplianceDashboard(organizationId),
      this.getRegionalComplianceSummary(organizationId),
    ]);

    const report: any = {
      generatedAt: new Date().toISOString(),
      organizationSummary: dashboard.organization,
      alerts: dashboard.alerts,
      regions: regions,
    };

    if (format === 'detailed') {
      // Add per-pod details
      for (const region of regions) {
        const detail = await this.getRegionComplianceDetail(
          region.regionId,
          organizationId
        );
        region.detail = detail;
      }
    }

    return report;
  }
}

export const regionalComplianceService = new RegionalComplianceService();
