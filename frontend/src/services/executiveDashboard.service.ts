/**
 * Executive Dashboard Service
 * Provides strategic KPIs, AI insights, and business intelligence
 */
import { request } from './api';

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  change: number;
  period: string;
}

export interface CapacityAnalysis {
  currentUtilization: number;
  maxCapacity: number;
  projectedDemand: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface AIInsight {
  id: string;
  type: 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionRequired: boolean;
  timestamp: string;
}

export interface GrowthOpportunity {
  id: string;
  market: string;
  potential: number;
  timeline: string;
  requirements: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

class ExecutiveDashboardService {
  /**
   * Fetch real KPIs from the backend
   */
  async getKPIMetrics(organizationId: string): Promise<KPIMetric[]> {
    try {
      // Fetch high-level KPIs
      const data = await request<{ kpis: any }>(`/api/console/dashboard/kpis/${organizationId}?period=30`);
      const { kpis } = data;

      return [
        {
          id: '1',
          name: 'Active Patients',
          value: kpis.activeClients,
          target: Math.ceil(kpis.activeClients * 1.1), // Target 10% growth
          unit: 'patients',
          trend: 'up', // TODO: Calculate from historical data
          change: 0, // Placeholder
          period: 'vs last month'
        },
        {
          id: '2',
          name: 'Active Staff',
          value: kpis.activeCaregivers,
          target: Math.ceil(kpis.activeCaregivers * 1.1),
          unit: 'staff',
          trend: 'neutral',
          change: 0,
          period: 'vs last month'
        },
        {
          id: '3',
          name: 'Billable Hours',
          value: kpis.billableHours,
          target: kpis.activeClients * 40, // Rough estimate target
          unit: 'hrs',
          trend: 'up',
          change: 0,
          period: 'last 30 days'
        },
        {
          id: '4',
          name: 'Sandata Sync Rate',
          value: kpis.sandataSyncRate,
          target: 95,
          unit: '%',
          trend: kpis.sandataSyncRate >= 95 ? 'neutral' : 'down',
          change: 0,
          period: 'last 30 days'
        }
      ];
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      // Fallback to empty/safe data to prevent crash
      return [];
    }
  }

  /**
   * Get Alerts/Insights (Real data mapped to insight interface)
   */
  async getAIInsights(organizationId: string): Promise<AIInsight[]> {
    try {
      const data = await request<{ alerts: any[] }>(`/api/console/dashboard/alerts/${organizationId}`);

      return data.alerts.map((alert: any, index: number) => ({
        id: `alert-${index}`,
        type: alert.severity === 'high' ? 'risk' : 'recommendation', // Map 'error'/'warning' -> 'risk'
        title: alert.title,
        description: alert.message,
        impact: alert.severity,
        confidence: 100, // It's a real alert
        actionRequired: true,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  }

  /**
   * Fetch Chart Data (Real)
   */
  async getChartsData(organizationId: string): Promise<{ revenue: any[]; visits: any[] }> {
    try {
      const [revenueData, visitsData] = await Promise.all([
        request<{ chart: any }>(`/api/console/dashboard/charts/${organizationId}?type=revenue&period=6m`),
        request<{ chart: any }>(`/api/console/dashboard/charts/${organizationId}?type=visits&period=7d`)
      ]);

      return {
        revenue: revenueData.chart.data.map((val: number, i: number) => ({
          label: revenueData.chart.labels[i],
          value: val
        })),
        visits: visitsData.chart.data.map((val: number, i: number) => ({
          label: visitsData.chart.labels[i],
          value: val
        }))
      };
    } catch (error) {
      console.error('Failed to fetch charts', error);
      return { revenue: [], visits: [] };
    }
  }

  async getCapacityAnalysis(): Promise<CapacityAnalysis> {
    // TODO: Implement backend endpoint for capacity planning
    await this.delay(600);
    return {
      currentUtilization: 87.3,
      maxCapacity: 500,
      projectedDemand: 465,
      bottlenecks: ['Weekend coverage', 'Rural areas', 'Specialized therapy'],
      recommendations: [
        'Hire 2 additional weekend caregivers',
        'Expand rural route optimization',
        'Partner with local therapy clinics'
      ]
    };
  }

  async getGrowthOpportunities(): Promise<GrowthOpportunity[]> {
    await this.delay(400);
    return [
      {
        id: '1',
        market: 'Columbus Metropolitan',
        potential: 25000000,
        timeline: '12-18 months',
        requirements: ['Hire 50 additional staff', 'Open satellite office'],
        riskLevel: 'medium'
      },
      {
        id: '2',
        market: 'Telehealth Services',
        potential: 8000000,
        timeline: '6-9 months',
        requirements: ['Technology platform', 'Staff training'],
        riskLevel: 'low'
      }
    ];
  }

  async getFinancialForecast(): Promise<any> {
    await this.delay(800);
    return {
      nextQuarter: {
        revenue: 6600000,
        expenses: 5280000,
        profit: 1320000,
        confidence: 89
      },
      nextYear: {
        revenue: 27500000,
        expenses: 21450000,
        profit: 6050000,
        confidence: 75
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const executiveDashboardService = new ExecutiveDashboardService();