/**
 * Executive Dashboard Service
 * Provides strategic KPIs, AI insights, and business intelligence
 *
 * NOTE: Mock data is only used in development with VITE_USE_MOCK_DATA=true
 */
import { request } from './api';
import { shouldUseMockData } from '../config/environment';

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
    return {
      currentUtilization: 0,
      maxCapacity: 0,
      projectedDemand: 0,
      bottlenecks: [],
      recommendations: []
    };
  }

  async getGrowthOpportunities(): Promise<GrowthOpportunity[]> {
    // TODO: Implement real growth analytics
    return [];
  }

  async getFinancialForecast(): Promise<any> {
    // TODO: Implement real financial forecasting
    return {
      nextQuarter: { revenue: 0, expenses: 0, profit: 0, confidence: 0 },
      nextYear: { revenue: 0, expenses: 0, profit: 0, confidence: 0 }
    };
  }
}

export const executiveDashboardService = new ExecutiveDashboardService();