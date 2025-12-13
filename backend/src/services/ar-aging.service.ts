/**
 * AR Aging Service
 * Handles accounts receivable aging reports and analytics
 *
 * @module services/ar-aging
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('ar-aging-service');

interface ARAgingFilters {
  payerId?: string;
  bucket?: string;
  clientId?: string;
}

class ARAgingService {
  /**
   * Get AR aging summary
   */
  async getARAgingSummary(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COALESCE(SUM(amount_0_30), 0) AS current_0_30,
        COALESCE(SUM(amount_31_60), 0) AS aging_31_60,
        COALESCE(SUM(amount_61_90), 0) AS aging_61_90,
        COALESCE(SUM(amount_91_120), 0) AS aging_91_120,
        COALESCE(SUM(amount_over_120), 0) AS aging_over_120,
        COALESCE(SUM(total_outstanding), 0) AS total_ar,
        COALESCE(SUM(claim_count), 0) AS total_claims
      FROM ar_aging_summary
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    const summary = result.rows[0];

    // Calculate percentages
    const total = parseFloat(summary.total_ar) || 1;
    return {
      ...summary,
      percentages: {
        current_0_30: ((parseFloat(summary.current_0_30) / total) * 100).toFixed(1),
        aging_31_60: ((parseFloat(summary.aging_31_60) / total) * 100).toFixed(1),
        aging_61_90: ((parseFloat(summary.aging_61_90) / total) * 100).toFixed(1),
        aging_91_120: ((parseFloat(summary.aging_91_120) / total) * 100).toFixed(1),
        aging_over_120: ((parseFloat(summary.aging_over_120) / total) * 100).toFixed(1),
      },
    };
  }

  /**
   * Get AR aging by payer
   */
  async getARAgingByPayer(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        payer_id,
        payer_name,
        amount_0_30,
        amount_31_60,
        amount_61_90,
        amount_91_120,
        amount_over_120,
        total_outstanding,
        claim_count,
        ROUND(
          (amount_over_120 / NULLIF(total_outstanding, 0)) * 100,
          1
        ) AS over_120_percentage
      FROM ar_aging_summary
      WHERE organization_id = $1
      ORDER BY total_outstanding DESC
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get AR aging details (individual claims)
   */
  async getARAgingDetails(
    organizationId: string,
    filters: ARAgingFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM claim_ar_aging
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.payerId) {
      query += ` AND payer_id = $${paramIndex++}`;
      params.push(filters.payerId);
    }

    if (filters.bucket) {
      query += ` AND aging_bucket = $${paramIndex++}`;
      params.push(filters.bucket);
    }

    if (filters.clientId) {
      query += ` AND client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }

    query += ` ORDER BY days_outstanding DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Generate AR snapshot for today
   */
  async generateSnapshot(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT generate_ar_snapshot($1) AS snapshot_id`,
      [organizationId]
    );

    logger.info('AR snapshot generated', {
      organizationId,
      snapshotId: result.rows[0].snapshot_id,
    });

    return this.getSnapshotById(result.rows[0].snapshot_id, organizationId);
  }

  /**
   * Get AR snapshot by ID
   */
  async getSnapshotById(
    snapshotId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT * FROM ar_snapshots
      WHERE id = $1 AND organization_id = $2
    `,
      [snapshotId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get AR trend data (snapshots over time)
   */
  async getARTrend(
    organizationId: string,
    days: number = 30
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        snapshot_date,
        current_0_30,
        aging_31_60,
        aging_61_90,
        aging_91_120,
        aging_over_120,
        total_ar
      FROM ar_snapshots
      WHERE organization_id = $1
        AND snapshot_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL
      ORDER BY snapshot_date
    `,
      [organizationId, days]
    );

    return result.rows;
  }

  /**
   * Get AR KPIs
   */
  async getARKPIs(organizationId: string): Promise<any> {
    const db = await getDbClient();

    // Current AR summary
    const summaryResult = await db.query(
      `
      SELECT
        COALESCE(SUM(total_outstanding), 0) AS total_ar,
        COALESCE(SUM(claim_count), 0) AS total_claims,
        COALESCE(SUM(amount_over_120), 0) AS over_120_amount
      FROM ar_aging_summary
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    // DSO (Days Sales Outstanding)
    const dsoResult = await db.query(
      `
      SELECT
        CASE
          WHEN SUM(cl.charge_amount) > 0 THEN
            ROUND(
              (SUM(cl.charge_amount - COALESCE(cl.paid_amount, 0)) /
               (SUM(cl.charge_amount) / 30.0)),
              1
            )
          ELSE 0
        END AS dso
      FROM claim_lines cl
      JOIN claim_batches cb ON cb.id = cl.batch_id
      WHERE cb.organization_id = $1
        AND cb.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
    `,
      [organizationId]
    );

    // Collection rate (last 30 days)
    const collectionResult = await db.query(
      `
      SELECT
        COALESCE(SUM(cl.paid_amount), 0) AS collected,
        COALESCE(SUM(cl.charge_amount), 0) AS billed,
        CASE
          WHEN SUM(cl.charge_amount) > 0 THEN
            ROUND((SUM(cl.paid_amount) / SUM(cl.charge_amount)) * 100, 1)
          ELSE 0
        END AS collection_rate
      FROM claim_lines cl
      JOIN claim_batches cb ON cb.id = cl.batch_id
      WHERE cb.organization_id = $1
        AND cl.status = 'paid'
        AND cl.adjudication_date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [organizationId]
    );

    // Week-over-week change
    const wowResult = await db.query(
      `
      SELECT
        COALESCE(
          (SELECT total_ar FROM ar_snapshots
           WHERE organization_id = $1
           ORDER BY snapshot_date DESC LIMIT 1),
          0
        ) AS current_ar,
        COALESCE(
          (SELECT total_ar FROM ar_snapshots
           WHERE organization_id = $1
             AND snapshot_date <= CURRENT_DATE - INTERVAL '7 days'
           ORDER BY snapshot_date DESC LIMIT 1),
          0
        ) AS last_week_ar
    `,
      [organizationId]
    );

    const currentAR = parseFloat(wowResult.rows[0]?.current_ar) || 0;
    const lastWeekAR = parseFloat(wowResult.rows[0]?.last_week_ar) || currentAR;
    const wowChange = lastWeekAR > 0 ? ((currentAR - lastWeekAR) / lastWeekAR) * 100 : 0;

    return {
      totalAR: summaryResult.rows[0]?.total_ar || 0,
      totalClaims: summaryResult.rows[0]?.total_claims || 0,
      over120Amount: summaryResult.rows[0]?.over_120_amount || 0,
      dso: dsoResult.rows[0]?.dso || 0,
      collectionRate: collectionResult.rows[0]?.collection_rate || 0,
      collected30Days: collectionResult.rows[0]?.collected || 0,
      billed30Days: collectionResult.rows[0]?.billed || 0,
      weekOverWeekChange: wowChange.toFixed(1),
    };
  }

  /**
   * Get claims at risk (aging over 90 days or approaching timely filing limit)
   */
  async getClaimsAtRisk(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cl.id,
        cl.claim_number,
        c.first_name || ' ' || c.last_name AS client_name,
        cl.service_code,
        cl.service_date,
        cl.charge_amount,
        cl.status,
        cb.submitted_at,
        CURRENT_DATE - cb.submitted_at::date AS days_outstanding,
        CASE
          WHEN CURRENT_DATE - cb.submitted_at::date > 365 THEN 'Timely filing at risk'
          WHEN CURRENT_DATE - cb.submitted_at::date > 120 THEN 'Over 120 days'
          WHEN CURRENT_DATE - cb.submitted_at::date > 90 THEN 'Over 90 days'
          ELSE 'Approaching 90 days'
        END AS risk_level
      FROM claim_lines cl
      JOIN claim_batches cb ON cb.id = cl.batch_id
      JOIN clients c ON c.id = cl.client_id
      WHERE cb.organization_id = $1
        AND cl.status IN ('submitted', 'accepted')
        AND cb.submitted_at IS NOT NULL
        AND CURRENT_DATE - cb.submitted_at::date >= 80
      ORDER BY days_outstanding DESC
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get payer performance metrics
   */
  async getPayerPerformance(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        sa.payer_id,
        sa.payer_name,
        COUNT(cl.id) AS total_claims,
        SUM(cl.charge_amount) AS total_billed,
        SUM(COALESCE(cl.paid_amount, 0)) AS total_paid,
        SUM(cl.charge_amount - COALESCE(cl.paid_amount, 0)) FILTER (WHERE cl.status IN ('submitted', 'accepted')) AS outstanding,
        ROUND(
          (SUM(COALESCE(cl.paid_amount, 0))::DECIMAL / NULLIF(SUM(cl.charge_amount), 0)) * 100,
          1
        ) AS payment_rate,
        AVG(
          EXTRACT(EPOCH FROM (
            CASE WHEN cl.adjudication_date IS NOT NULL
              THEN cl.adjudication_date::TIMESTAMPTZ - cb.submitted_at
              ELSE NULL
            END
          )) / 86400
        )::INTEGER AS avg_days_to_pay,
        COUNT(*) FILTER (WHERE cl.status = 'rejected') AS rejected_count,
        ROUND(
          (COUNT(*) FILTER (WHERE cl.status = 'rejected')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
          1
        ) AS rejection_rate
      FROM claim_lines cl
      JOIN claim_batches cb ON cb.id = cl.batch_id
      LEFT JOIN service_authorizations sa ON sa.id = cl.authorization_id
      WHERE cb.organization_id = $1
        AND cb.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY sa.payer_id, sa.payer_name
      ORDER BY total_billed DESC
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get AR aging dashboard data
   */
  async getARDashboard(organizationId: string): Promise<any> {
    const [summary, byPayer, kpis, atRisk, trend] = await Promise.all([
      this.getARAgingSummary(organizationId),
      this.getARAgingByPayer(organizationId),
      this.getARKPIs(organizationId),
      this.getClaimsAtRisk(organizationId),
      this.getARTrend(organizationId, 30),
    ]);

    return {
      summary,
      byPayer,
      kpis,
      atRisk: {
        items: atRisk,
        count: atRisk.length,
      },
      trend,
    };
  }
}

export const arAgingService = new ARAgingService();
