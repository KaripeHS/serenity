/**
 * Business Intelligence Service
 * Business logic for BI Dashboard endpoints
 *
 * Endpoints:
 * - GET /api/bi/reports
 */

import { pool } from '../config/database';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export class BIService {
  /**
   * GET /api/bi/reports
   * Get business intelligence reports catalog with data
   *
   * @param organizationId - Organization ID
   * @param reportType - Optional report type filter
   * @returns BI reports data
   */
  async getReports(organizationId: string, reportType?: string) {
    // Available report types
    const reportTypes = [
      'revenue_analysis',
      'visit_completion',
      'caregiver_utilization',
      'client_retention',
      'referral_sources',
      'payer_mix',
      'cost_analysis'
    ];

    // If specific report requested, return only that one
    if (reportType && reportTypes.includes(reportType)) {
      const reportData = await this.generateReport(organizationId, reportType);
      return {
        reports: [reportData],
        availableReports: reportTypes
      };
    }

    // Otherwise return summary of all reports
    const reports = await Promise.all(
      reportTypes.map(type => this.generateReportSummary(organizationId, type))
    );

    return {
      reports,
      availableReports: reportTypes
    };
  }

  /**
   * Generate full report data
   */
  private async generateReport(organizationId: string, reportType: string) {
    switch (reportType) {
      case 'revenue_analysis':
        return await this.generateRevenueAnalysis(organizationId);
      case 'visit_completion':
        return await this.generateVisitCompletion(organizationId);
      case 'caregiver_utilization':
        return await this.generateCaregiverUtilization(organizationId);
      case 'client_retention':
        return await this.generateClientRetention(organizationId);
      case 'referral_sources':
        return await this.generateReferralSources(organizationId);
      case 'payer_mix':
        return await this.generatePayerMix(organizationId);
      case 'cost_analysis':
        return await this.generateCostAnalysis(organizationId);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Generate report summary
   */
  private async generateReportSummary(organizationId: string, reportType: string) {
    const reportMetadata = {
      revenue_analysis: {
        name: 'Revenue Analysis',
        description: 'Monthly revenue trends, payer breakdown, and forecasts',
        category: 'Financial'
      },
      visit_completion: {
        name: 'Visit Completion Rate',
        description: 'Visit completion trends, missed visits, and on-time performance',
        category: 'Operations'
      },
      caregiver_utilization: {
        name: 'Caregiver Utilization',
        description: 'Caregiver capacity, scheduled hours, and efficiency metrics',
        category: 'Workforce'
      },
      client_retention: {
        name: 'Client Retention',
        description: 'Client churn rate, retention by service type, and lifetime value',
        category: 'Growth'
      },
      referral_sources: {
        name: 'Referral Source Analysis',
        description: 'Client acquisition channels and conversion rates',
        category: 'Marketing'
      },
      payer_mix: {
        name: 'Payer Mix Analysis',
        description: 'Revenue distribution by payer, reimbursement rates, and trends',
        category: 'Financial'
      },
      cost_analysis: {
        name: 'Cost Analysis',
        description: 'Labor costs, overhead, and profitability by service line',
        category: 'Financial'
      }
    };

    const metadata = reportMetadata[reportType as keyof typeof reportMetadata];

    return {
      reportType,
      name: metadata.name,
      description: metadata.description,
      category: metadata.category,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Revenue Analysis Report
   */
  private async generateRevenueAnalysis(organizationId: string) {
    // Last 12 months revenue
    const revenueResult = await pool.query(
      `
      SELECT
        DATE_TRUNC('month', payment_date) as month,
        SUM(amount) as total_revenue,
        COUNT(*) as payment_count
      FROM billing_payments
      WHERE organization_id = $1
        AND payment_date >= NOW() - INTERVAL '12 months'
        AND status = 'completed'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY month ASC
      `,
      [organizationId]
    );

    // Revenue by payer
    const payerResult = await pool.query(
      `
      SELECT
        bp.payer_type,
        SUM(bp.amount) as total_revenue,
        COUNT(DISTINCT bp.client_id) as client_count,
        AVG(bp.amount) as avg_payment
      FROM billing_payments bp
      WHERE bp.organization_id = $1
        AND bp.payment_date >= NOW() - INTERVAL '12 months'
        AND bp.status = 'completed'
      GROUP BY bp.payer_type
      ORDER BY total_revenue DESC
      `,
      [organizationId]
    );

    // Year-over-year comparison
    const yoyResult = await pool.query(
      `
      SELECT
        SUM(CASE WHEN payment_date >= NOW() - INTERVAL '12 months' THEN amount ELSE 0 END) as current_year,
        SUM(CASE WHEN payment_date >= NOW() - INTERVAL '24 months' AND payment_date < NOW() - INTERVAL '12 months' THEN amount ELSE 0 END) as previous_year
      FROM billing_payments
      WHERE organization_id = $1
        AND status = 'completed'
      `,
      [organizationId]
    );

    const currentYear = parseFloat(yoyResult.rows[0].current_year) || 0;
    const previousYear = parseFloat(yoyResult.rows[0].previous_year) || 0;
    const growthRate = previousYear > 0 ? ((currentYear - previousYear) / previousYear) * 100 : 0;

    return {
      reportType: 'revenue_analysis',
      name: 'Revenue Analysis',
      category: 'Financial',
      generatedAt: new Date().toISOString(),
      data: {
        monthlyRevenue: revenueResult.rows.map(row => ({
          month: format(new Date(row.month), 'MMM yyyy'),
          revenue: parseFloat(row.total_revenue),
          paymentCount: parseInt(row.payment_count)
        })),
        byPayer: payerResult.rows.map(row => ({
          payerType: row.payer_type,
          totalRevenue: parseFloat(row.total_revenue),
          clientCount: parseInt(row.client_count),
          avgPayment: parseFloat(row.avg_payment)
        })),
        yearOverYear: {
          currentYear,
          previousYear,
          growthRate: Math.round(growthRate * 10) / 10
        }
      }
    };
  }

  /**
   * Visit Completion Report
   */
  private async generateVisitCompletion(organizationId: string) {
    // Last 12 months visit completion
    const completionResult = await pool.query(
      `
      SELECT
        DATE_TRUNC('month', scheduled_start) as month,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM visits
      WHERE organization_id = $1
        AND scheduled_start >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', scheduled_start)
      ORDER BY month ASC
      `,
      [organizationId]
    );

    // On-time performance
    const onTimeResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_completed,
        COUNT(CASE
          WHEN vc.check_in_time <= v.scheduled_start + INTERVAL '15 minutes'
          THEN 1
        END) as on_time
      FROM visits v
      INNER JOIN visit_check_ins vc ON v.id = vc.visit_id
      WHERE v.organization_id = $1
        AND v.status = 'completed'
        AND v.scheduled_start >= NOW() - INTERVAL '30 days'
      `,
      [organizationId]
    );

    const totalCompleted = parseInt(onTimeResult.rows[0].total_completed) || 0;
    const onTime = parseInt(onTimeResult.rows[0].on_time) || 0;
    const onTimeRate = totalCompleted > 0 ? (onTime / totalCompleted) * 100 : 0;

    return {
      reportType: 'visit_completion',
      name: 'Visit Completion Rate',
      category: 'Operations',
      generatedAt: new Date().toISOString(),
      data: {
        monthlyTrends: completionResult.rows.map(row => {
          const total = parseInt(row.total_visits);
          const completed = parseInt(row.completed);
          const missed = parseInt(row.missed);
          const cancelled = parseInt(row.cancelled);

          return {
            month: format(new Date(row.month), 'MMM yyyy'),
            totalVisits: total,
            completed,
            missed,
            cancelled,
            completionRate: total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0
          };
        }),
        onTimePerformance: {
          totalCompleted,
          onTime,
          onTimeRate: Math.round(onTimeRate * 10) / 10
        }
      }
    };
  }

  /**
   * Caregiver Utilization Report
   */
  private async generateCaregiverUtilization(organizationId: string) {
    const result = await pool.query(
      `
      SELECT
        u.id as caregiver_id,
        u.first_name,
        u.last_name,
        u.max_hours_per_week,
        COUNT(v.id) as total_visits,
        SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) as scheduled_hours,
        COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits
      FROM users u
      LEFT JOIN visits v ON u.id = v.caregiver_id
        AND v.scheduled_start >= NOW() - INTERVAL '30 days'
        AND v.scheduled_start < NOW()
      WHERE u.organization_id = $1
        AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
        AND u.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.max_hours_per_week
      ORDER BY scheduled_hours DESC
      LIMIT 50
      `,
      [organizationId]
    );

    return {
      reportType: 'caregiver_utilization',
      name: 'Caregiver Utilization',
      category: 'Workforce',
      generatedAt: new Date().toISOString(),
      data: {
        caregivers: result.rows.map(row => {
          const scheduledHours = parseFloat(row.scheduled_hours) || 0;
          const maxHours = parseFloat(row.max_hours_per_week) * 4.33 || 0; // Monthly
          const utilizationRate = maxHours > 0 ? (scheduledHours / maxHours) * 100 : 0;

          return {
            caregiverId: row.caregiver_id,
            name: `${row.first_name} ${row.last_name}`,
            totalVisits: parseInt(row.total_visits),
            completedVisits: parseInt(row.completed_visits),
            scheduledHours: Math.round(scheduledHours * 10) / 10,
            maxHoursMonthly: Math.round(maxHours * 10) / 10,
            utilizationRate: Math.round(utilizationRate * 10) / 10
          };
        })
      }
    };
  }

  /**
   * Client Retention Report
   */
  private async generateClientRetention(organizationId: string) {
    // Active clients by cohort
    const cohortResult = await pool.query(
      `
      SELECT
        DATE_TRUNC('month', c.created_at) as cohort_month,
        COUNT(*) as clients_acquired,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as still_active
      FROM clients c
      WHERE c.organization_id = $1
        AND c.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', c.created_at)
      ORDER BY cohort_month ASC
      `,
      [organizationId]
    );

    // Churn rate
    const churnResult = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN status = 'inactive' AND updated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as churned_clients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients
      FROM clients
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    const churned = parseInt(churnResult.rows[0].churned_clients) || 0;
    const active = parseInt(churnResult.rows[0].active_clients) || 0;
    const churnRate = active > 0 ? (churned / active) * 100 : 0;

    return {
      reportType: 'client_retention',
      name: 'Client Retention',
      category: 'Growth',
      generatedAt: new Date().toISOString(),
      data: {
        cohortAnalysis: cohortResult.rows.map(row => {
          const acquired = parseInt(row.clients_acquired);
          const stillActive = parseInt(row.still_active);
          const retentionRate = acquired > 0 ? (stillActive / acquired) * 100 : 0;

          return {
            cohortMonth: format(new Date(row.cohort_month), 'MMM yyyy'),
            clientsAcquired: acquired,
            stillActive,
            retentionRate: Math.round(retentionRate * 10) / 10
          };
        }),
        currentChurnRate: Math.round(churnRate * 100) / 100,
        activeClients: active,
        churnedLast30Days: churned
      }
    };
  }

  /**
   * Referral Sources Report
   */
  private async generateReferralSources(organizationId: string) {
    const result = await pool.query(
      `
      SELECT
        referral_source,
        COUNT(*) as client_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) as avg_days_as_client
      FROM clients
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY referral_source
      ORDER BY client_count DESC
      `,
      [organizationId]
    );

    return {
      reportType: 'referral_sources',
      name: 'Referral Source Analysis',
      category: 'Marketing',
      generatedAt: new Date().toISOString(),
      data: {
        sources: result.rows.map(row => ({
          source: row.referral_source || 'Unknown',
          totalClients: parseInt(row.client_count),
          activeClients: parseInt(row.active_count),
          avgDaysAsClient: Math.round(parseFloat(row.avg_days_as_client) || 0)
        }))
      }
    };
  }

  /**
   * Payer Mix Report
   */
  private async generatePayerMix(organizationId: string) {
    const result = await pool.query(
      `
      SELECT
        payer_type,
        COUNT(DISTINCT client_id) as client_count,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_payment,
        COUNT(*) as payment_count
      FROM billing_payments
      WHERE organization_id = $1
        AND payment_date >= NOW() - INTERVAL '12 months'
        AND status = 'completed'
      GROUP BY payer_type
      ORDER BY total_revenue DESC
      `,
      [organizationId]
    );

    const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0);

    return {
      reportType: 'payer_mix',
      name: 'Payer Mix Analysis',
      category: 'Financial',
      generatedAt: new Date().toISOString(),
      data: {
        payers: result.rows.map(row => {
          const revenue = parseFloat(row.total_revenue);
          const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

          return {
            payerType: row.payer_type,
            clientCount: parseInt(row.client_count),
            totalRevenue: revenue,
            avgPayment: parseFloat(row.avg_payment),
            paymentCount: parseInt(row.payment_count),
            revenuePercentage: Math.round(percentage * 10) / 10
          };
        }),
        totalRevenue
      }
    };
  }

  /**
   * Cost Analysis Report
   */
  private async generateCostAnalysis(organizationId: string) {
    // Labor costs (caregiver wages + benefits)
    const laborResult = await pool.query(
      `
      SELECT
        SUM(gross_pay) as total_labor_cost,
        COUNT(DISTINCT user_id) as caregiver_count
      FROM payroll
      WHERE organization_id = $1
        AND pay_period_end >= NOW() - INTERVAL '12 months'
      `,
      [organizationId]
    );

    // Revenue for same period
    const revenueResult = await pool.query(
      `
      SELECT SUM(amount) as total_revenue
      FROM billing_payments
      WHERE organization_id = $1
        AND payment_date >= NOW() - INTERVAL '12 months'
        AND status = 'completed'
      `,
      [organizationId]
    );

    const laborCost = parseFloat(laborResult.rows[0].total_labor_cost) || 0;
    const revenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;
    const laborCostPercentage = revenue > 0 ? (laborCost / revenue) * 100 : 0;
    const grossMargin = revenue > 0 ? ((revenue - laborCost) / revenue) * 100 : 0;

    return {
      reportType: 'cost_analysis',
      name: 'Cost Analysis',
      category: 'Financial',
      generatedAt: new Date().toISOString(),
      data: {
        laborCost,
        revenue,
        laborCostPercentage: Math.round(laborCostPercentage * 10) / 10,
        grossMargin: Math.round(grossMargin * 10) / 10,
        caregiverCount: parseInt(laborResult.rows[0].caregiver_count) || 0
      }
    };
  }
}

export const biService = new BIService();
