/**
 * Executive Service
 * Handles business logic for Executive Command Center endpoints
 *
 * Endpoints:
 * - GET /api/executive/overview
 * - GET /api/executive/revenue
 * - GET /api/executive/risks
 */

import { db } from '../database/connection';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

interface BusinessHealthMetric {
  value: number;
  target: number;
  status: 'green' | 'yellow' | 'red';
}

interface BusinessHealthScore {
  score: number;
  trend: 'up' | 'down' | 'stable';
  metrics: {
    revenueGrowth: BusinessHealthMetric;
    clientRetention: BusinessHealthMetric;
    caregiverRetention: BusinessHealthMetric;
    onTimeRate: BusinessHealthMetric;
    complianceScore: BusinessHealthMetric;
    cashFlow: BusinessHealthMetric;
    profitMargin: BusinessHealthMetric;
    nps: BusinessHealthMetric;
  };
}

interface ExecutiveOverview {
  businessHealth: BusinessHealthScore;
  kpis: {
    totalRevenue: number;
    revenueChange: number;
    activeClients: number;
    clientsChange: number;
    activeCaregivers: number;
    caregiversChange: number;
    totalVisits: number;
    visitsChange: number;
  };
  revenueTrend: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
  urgentItems: Array<{
    type: 'risk' | 'opportunity' | 'alert';
    title: string;
    description: string;
    priority: 'urgent' | 'important' | 'info';
    deadline?: string;
    action?: {
      label: string;
      route: string;
    };
  }>;
}

export class ExecutiveService {
  /**
   * Get executive overview data
   * Endpoint: GET /api/executive/overview
   */
  async getOverview(
    organizationId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ExecutiveOverview> {
    // Calculate date ranges
    const currentPeriodStart = this.getPeriodStart(dateRange);
    const currentPeriodEnd = new Date();
    const previousPeriodStart = this.getPreviousPeriodStart(dateRange);
    const previousPeriodEnd = this.getPreviousPeriodEnd(dateRange);

    // Fetch all data in parallel for performance
    const [
      businessHealth,
      kpis,
      revenueTrend,
      urgentItems
    ] = await Promise.all([
      this.calculateBusinessHealth(organizationId, currentPeriodStart, currentPeriodEnd),
      this.calculateKPIs(organizationId, currentPeriodStart, previousPeriodStart),
      this.getRevenueTrend(organizationId, 12),
      this.getUrgentItems(organizationId)
    ]);

    return {
      businessHealth,
      kpis,
      revenueTrend,
      urgentItems
    };
  }

  /**
   * Calculate business health score (0-100)
   */
  private async calculateBusinessHealth(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthScore> {
    // Revenue Growth
    const revenueGrowth = await this.getRevenueGrowthRate(organizationId, startDate, endDate);

    // Client Retention
    const clientRetention = await this.getClientRetentionRate(organizationId, startDate, endDate);

    // Caregiver Retention
    const caregiverRetention = await this.getCaregiverRetentionRate(organizationId, startDate, endDate);

    // On-Time Rate
    const onTimeRate = await this.getOnTimeRate(organizationId, startDate, endDate);

    // Compliance Score
    const complianceScore = await this.getComplianceScore(organizationId);

    // Cash Flow (Days Sales Outstanding)
    const cashFlow = await this.getCashFlowMetric(organizationId);

    // Profit Margin
    const profitMargin = await this.getProfitMargin(organizationId, startDate, endDate);

    // NPS (Net Promoter Score)
    const nps = await this.getNPS(organizationId, startDate, endDate);

    // Calculate overall score (weighted average)
    const weights = {
      revenueGrowth: 0.20,
      clientRetention: 0.15,
      caregiverRetention: 0.15,
      onTimeRate: 0.15,
      complianceScore: 0.15,
      cashFlow: 0.10,
      profitMargin: 0.05,
      nps: 0.05
    };

    const score = Math.round(
      revenueGrowth.value * weights.revenueGrowth +
      clientRetention.value * weights.clientRetention +
      caregiverRetention.value * weights.caregiverRetention +
      onTimeRate.value * weights.onTimeRate +
      complianceScore.value * weights.complianceScore +
      cashFlow.value * weights.cashFlow +
      profitMargin.value * weights.profitMargin +
      nps.value * weights.nps
    );

    // Calculate trend (compare to previous period)
    const previousScore = await this.getPreviousBusinessHealthScore(organizationId);
    const trend = score > previousScore + 2 ? 'up' :
                  score < previousScore - 2 ? 'down' : 'stable';

    return {
      score,
      trend,
      metrics: {
        revenueGrowth,
        clientRetention,
        caregiverRetention,
        onTimeRate,
        complianceScore,
        cashFlow,
        profitMargin,
        nps
      }
    };
  }

  /**
   * Get revenue growth rate
   */
  private async getRevenueGrowthRate(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthMetric> {
    const query = `
      SELECT
        COALESCE(SUM(bp.amount), 0) as current_revenue,
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM billing_payments
          WHERE organization_id = $1
            AND payment_date >= $2 - INTERVAL '1 month'
            AND payment_date < $2
        ) as previous_revenue
      FROM billing_payments bp
      WHERE bp.organization_id = $1
        AND bp.payment_date >= $2
        AND bp.payment_date <= $3
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const { current_revenue, previous_revenue } = result.rows[0];

    const growthRate = previous_revenue > 0
      ? ((current_revenue - previous_revenue) / previous_revenue) * 100
      : 0;

    const target = 10; // 10% growth target
    const status = growthRate >= target ? 'green' :
                   growthRate >= target * 0.7 ? 'yellow' : 'red';

    return {
      value: Math.round(growthRate * 10) / 10,
      target,
      status
    };
  }

  /**
   * Get client retention rate
   */
  private async getClientRetentionRate(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthMetric> {
    const query = `
      WITH client_counts AS (
        SELECT
          COUNT(*) FILTER (WHERE enrollment_date < $2) as start_count,
          COUNT(*) FILTER (WHERE status = 'discharged' AND discharge_date >= $2 AND discharge_date <= $3) as churned_count
        FROM clients
        WHERE organization_id = $1
      )
      SELECT
        start_count,
        churned_count,
        CASE
          WHEN start_count > 0 THEN ((start_count - churned_count)::DECIMAL / start_count) * 100
          ELSE 100
        END as retention_rate
      FROM client_counts
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const retentionRate = parseFloat(result.rows[0].retention_rate) || 100;

    const target = 95; // 95% retention target
    const status = retentionRate >= target ? 'green' :
                   retentionRate >= target * 0.95 ? 'yellow' : 'red';

    return {
      value: Math.round(retentionRate * 10) / 10,
      target,
      status
    };
  }

  /**
   * Get caregiver retention rate
   */
  private async getCaregiverRetentionRate(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthMetric> {
    const query = `
      WITH caregiver_counts AS (
        SELECT
          COUNT(*) FILTER (WHERE hire_date < $2) as start_count,
          COUNT(*) FILTER (WHERE termination_date >= $2 AND termination_date <= $3) as churned_count
        FROM users
        WHERE organization_id = $1
          AND role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
      )
      SELECT
        start_count,
        churned_count,
        CASE
          WHEN start_count > 0 THEN ((start_count - churned_count)::DECIMAL / start_count) * 100
          ELSE 100
        END as retention_rate
      FROM caregiver_counts
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const retentionRate = parseFloat(result.rows[0].retention_rate) || 100;

    const target = 85; // 85% retention target
    const status = retentionRate >= target ? 'green' :
                   retentionRate >= target * 0.90 ? 'yellow' : 'red';

    return {
      value: Math.round(retentionRate * 10) / 10,
      target,
      status
    };
  }

  /**
   * Get on-time visit rate
   */
  private async getOnTimeRate(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthMetric> {
    const query = `
      WITH visit_stats AS (
        SELECT
          COUNT(*) as total_visits,
          COUNT(*) FILTER (
            WHERE vci.actual_check_in <= v.scheduled_start + INTERVAL '15 minutes'
          ) as on_time_visits
        FROM visits v
        LEFT JOIN visit_check_ins vci ON v.id = vci.visit_id
        WHERE v.organization_id = $1
          AND v.scheduled_start >= $2
          AND v.scheduled_start <= $3
          AND v.status = 'completed'
      )
      SELECT
        total_visits,
        on_time_visits,
        CASE
          WHEN total_visits > 0 THEN (on_time_visits::DECIMAL / total_visits) * 100
          ELSE 100
        END as on_time_rate
      FROM visit_stats
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const onTimeRate = parseFloat(result.rows[0].on_time_rate) || 100;

    const target = 95; // 95% on-time target
    const status = onTimeRate >= target ? 'green' :
                   onTimeRate >= target * 0.95 ? 'yellow' : 'red';

    return {
      value: Math.round(onTimeRate * 10) / 10,
      target,
      status
    };
  }

  /**
   * Get compliance score
   */
  private async getComplianceScore(organizationId: string): Promise<BusinessHealthMetric> {
    // This would calculate compliance based on various compliance items
    // For now, return placeholder
    const target = 98;
    const value = 98; // From compliance remediation work

    return {
      value,
      target,
      status: value >= target ? 'green' : value >= target * 0.95 ? 'yellow' : 'red'
    };
  }

  /**
   * Get cash flow metric (Days Sales Outstanding)
   */
  private async getCashFlowMetric(organizationId: string): Promise<BusinessHealthMetric> {
    const query = `
      WITH ar_data AS (
        SELECT
          SUM(balance) as total_ar,
          SUM(balance * EXTRACT(DAY FROM NOW() - invoice_date)) as weighted_ar,
          (
            SELECT COALESCE(SUM(amount), 0)
            FROM billing_payments
            WHERE organization_id = $1
              AND payment_date >= NOW() - INTERVAL '90 days'
          ) / 90.0 as avg_daily_revenue
        FROM billing_invoices
        WHERE organization_id = $1
          AND status IN ('unpaid', 'partial')
      )
      SELECT
        CASE
          WHEN avg_daily_revenue > 0 THEN total_ar / avg_daily_revenue
          ELSE 0
        END as dso
      FROM ar_data
    `;

    const result = await db.query(query, [organizationId]);
    const dso = parseFloat(result.rows[0].dso) || 0;

    const target = 30; // Target: 30 days or less
    const status = dso <= target ? 'green' :
                   dso <= target * 1.5 ? 'yellow' : 'red';

    // Convert to score (lower DSO is better, so invert)
    const score = Math.max(0, 100 - (dso * 2));

    return {
      value: Math.round(score * 10) / 10,
      target: 100 - (target * 2), // Inverted target
      status
    };
  }

  /**
   * Get profit margin
   */
  private async getProfitMargin(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthMetric> {
    const query = `
      WITH financials AS (
        SELECT
          COALESCE(SUM(bp.amount), 0) as revenue,
          COALESCE(
            (SELECT SUM(gross_pay + taxes + deductions)
             FROM payroll
             WHERE organization_id = $1
               AND pay_period_start >= $2
               AND pay_period_end <= $3),
            0
          ) as costs
        FROM billing_payments bp
        WHERE bp.organization_id = $1
          AND bp.payment_date >= $2
          AND bp.payment_date <= $3
      )
      SELECT
        revenue,
        costs,
        CASE
          WHEN revenue > 0 THEN ((revenue - costs) / revenue) * 100
          ELSE 0
        END as margin
      FROM financials
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const margin = parseFloat(result.rows[0].margin) || 0;

    const target = 20; // 20% margin target
    const status = margin >= target ? 'green' :
                   margin >= target * 0.75 ? 'yellow' : 'red';

    return {
      value: Math.round(margin * 10) / 10,
      target,
      status
    };
  }

  /**
   * Get Net Promoter Score
   */
  private async getNPS(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessHealthMetric> {
    // Placeholder - would calculate from client satisfaction surveys
    const target = 50;
    const value = 65; // Placeholder

    return {
      value,
      target,
      status: value >= target ? 'green' : value >= target * 0.8 ? 'yellow' : 'red'
    };
  }

  /**
   * Get previous business health score for trend calculation
   */
  private async getPreviousBusinessHealthScore(organizationId: string): Promise<number> {
    // Placeholder - would retrieve from historical data
    return 85;
  }

  /**
   * Calculate KPIs with period-over-period comparison
   */
  private async calculateKPIs(
    organizationId: string,
    currentPeriodStart: Date,
    previousPeriodStart: Date
  ) {
    const query = `
      WITH current_period AS (
        SELECT
          COALESCE(SUM(bp.amount), 0) as revenue,
          COUNT(DISTINCT c.id) as clients,
          COUNT(DISTINCT u.id) as caregivers,
          COUNT(DISTINCT v.id) as visits
        FROM organizations o
        LEFT JOIN billing_payments bp ON bp.organization_id = o.id
          AND bp.payment_date >= $2
        LEFT JOIN clients c ON c.organization_id = o.id
          AND c.status = 'active'
        LEFT JOIN users u ON u.organization_id = o.id
          AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
          AND u.status = 'active'
        LEFT JOIN visits v ON v.organization_id = o.id
          AND v.scheduled_start >= $2
        WHERE o.id = $1
      ),
      previous_period AS (
        SELECT
          COALESCE(SUM(bp.amount), 0) as revenue,
          COUNT(DISTINCT v.id) as visits
        FROM organizations o
        LEFT JOIN billing_payments bp ON bp.organization_id = o.id
          AND bp.payment_date >= $3
          AND bp.payment_date < $2
        LEFT JOIN visits v ON v.organization_id = o.id
          AND v.scheduled_start >= $3
          AND v.scheduled_start < $2
        WHERE o.id = $1
      )
      SELECT
        cp.revenue as current_revenue,
        pp.revenue as previous_revenue,
        cp.clients,
        cp.caregivers,
        cp.visits as current_visits,
        pp.visits as previous_visits
      FROM current_period cp, previous_period pp
    `;

    const result = await db.query(query, [
      organizationId,
      currentPeriodStart,
      previousPeriodStart
    ]);

    const row = result.rows[0];

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    return {
      totalRevenue: parseFloat(row.current_revenue),
      revenueChange: calculateChange(
        parseFloat(row.current_revenue),
        parseFloat(row.previous_revenue)
      ),
      activeClients: parseInt(row.clients),
      clientsChange: 0, // Would need historical tracking
      activeCaregivers: parseInt(row.caregivers),
      caregiversChange: 0, // Would need historical tracking
      totalVisits: parseInt(row.current_visits),
      visitsChange: calculateChange(
        parseInt(row.current_visits),
        parseInt(row.previous_visits)
      )
    };
  }

  /**
   * Get revenue trend for last N months
   */
  private async getRevenueTrend(organizationId: string, months: number = 12) {
    const query = `
      WITH month_series AS (
        SELECT
          generate_series(
            date_trunc('month', NOW() - INTERVAL '${months} months'),
            date_trunc('month', NOW()),
            INTERVAL '1 month'
          )::DATE as month
      )
      SELECT
        TO_CHAR(ms.month, 'YYYY-MM') as month,
        COALESCE(SUM(bp.amount), 0) as revenue,
        0 as target
      FROM month_series ms
      LEFT JOIN billing_payments bp ON
        date_trunc('month', bp.payment_date) = ms.month
        AND bp.organization_id = $1
      GROUP BY ms.month
      ORDER BY ms.month
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
      target: parseFloat(row.target)
    }));
  }

  /**
   * Get urgent items requiring executive attention
   */
  private async getUrgentItems(organizationId: string) {
    const items = [];

    // Check for strategic risks
    const risksQuery = `
      SELECT id, title, description, severity, due_date
      FROM strategic_risks
      WHERE organization_id = $1
        AND mitigation_status != 'mitigated'
        AND severity IN ('critical', 'high')
      ORDER BY severity DESC, due_date ASC
      LIMIT 5
    `;
    const risks = await db.query(risksQuery, [organizationId]);

    for (const risk of risks.rows) {
      items.push({
        type: 'risk' as const,
        title: risk.title,
        description: risk.description,
        priority: risk.severity === 'critical' ? 'urgent' as const : 'important' as const,
        deadline: risk.due_date,
        action: {
          label: 'View Risk',
          route: `/executive/risks/${risk.id}`
        }
      });
    }

    // Check for cash flow issues
    const arQuery = `
      SELECT COUNT(*) as overdue_count, SUM(balance) as overdue_amount
      FROM billing_invoices
      WHERE organization_id = $1
        AND status IN ('unpaid', 'partial')
        AND due_date < NOW() - INTERVAL '30 days'
    `;
    const arResult = await db.query(arQuery, [organizationId]);

    if (parseInt(arResult.rows[0].overdue_count) > 10) {
      items.push({
        type: 'alert' as const,
        title: 'High Overdue AR Balance',
        description: `${arResult.rows[0].overdue_count} invoices overdue >30 days ($${Math.round(parseFloat(arResult.rows[0].overdue_amount)).toLocaleString()})`,
        priority: 'urgent' as const,
        action: {
          label: 'Review AR',
          route: '/revenue/ar-aging'
        }
      });
    }

    return items;
  }

  /**
   * Helper: Get period start date
   */
  private getPeriodStart(dateRange: string): Date {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return startOfMonth(now);
      case 'quarter':
        return startOfMonth(subMonths(now, 3));
      case 'year':
        return startOfMonth(subMonths(now, 12));
      default:
        return startOfMonth(now);
    }
  }

  /**
   * Helper: Get previous period start date
   */
  private getPreviousPeriodStart(dateRange: string): Date {
    const periodStart = this.getPeriodStart(dateRange);
    switch (dateRange) {
      case 'today':
        return new Date(periodStart.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return startOfMonth(subMonths(periodStart, 1));
      case 'quarter':
        return startOfMonth(subMonths(periodStart, 3));
      case 'year':
        return startOfMonth(subMonths(periodStart, 12));
      default:
        return startOfMonth(subMonths(periodStart, 1));
    }
  }

  /**
   * Helper: Get previous period end date
   */
  private getPreviousPeriodEnd(dateRange: string): Date {
    return new Date(this.getPeriodStart(dateRange).getTime() - 1);
  }
}

export const executiveService = new ExecutiveService();
