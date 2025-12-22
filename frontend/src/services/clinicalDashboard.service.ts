import { request } from './api';
import { shouldUseMockData } from '../config/environment';

export interface ClinicalMetrics {
    activePatients: number;
    criticalAlerts: number;
    medicationCompliance: number;
    vitalSignsUpdated: number;
    careplanReviews: number;
    admissionsToday: number;
}

export interface ClinicalAlert {
    id: string;
    type: 'danger' | 'warning' | 'info';
    message: string;
    patientName?: string;
    timestamp: string;
}

export const clinicalDashboardService = {
    /**
     * Get clinical metrics
     */
    async getMetrics(organizationId: string): Promise<ClinicalMetrics> {
        try {
            // Parallel fetch KPIs and Alerts
            const [kpiData, alertsData] = await Promise.all([
                request<{ kpis: any }>(`/api/console/dashboard/kpis/${organizationId}?period=7`), // 7 days context
                request<{ alerts: any[] }>(`/api/console/dashboard/alerts/${organizationId}`)
            ]);

            const { kpis } = kpiData;
            const { alerts } = alertsData;

            const criticalAlertsCount = alerts.filter((a: any) => a.severity === 'high' || a.severity === 'critical').length;

            return {
                activePatients: kpis.activeClients || 0,
                criticalAlerts: criticalAlertsCount,
                medicationCompliance: 0,
                vitalSignsUpdated: 0,
                careplanReviews: 0,
                admissionsToday: 0
            };
        } catch (error) {
            console.error('Failed to fetch clinical metrics:', error);
            // Fallback
            return {
                activePatients: 0,
                criticalAlerts: 0,
                medicationCompliance: 0,
                vitalSignsUpdated: 0,
                careplanReviews: 0,
                admissionsToday: 0
            };
        }
    },

    /**
     * Get recent clinical alerts
     */
    async getAlerts(organizationId: string): Promise<ClinicalAlert[]> {
        try {
            const data = await request<{ alerts: any[] }>(`/api/console/dashboard/alerts/${organizationId}`);
            return data.alerts.map(alert => ({
                id: alert.id,
                type: alert.severity === 'critical' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info',
                message: alert.message,
                timestamp: alert.createdAt
                // patientName is not always in alert payload, might need enhancement
            }));
        } catch (error) {
            console.error('Failed to fetch clinical alerts:', error);
            return [];
        }
    },

    /**
     * Get Clinical Charts (Vital Signs, Admissions)
     */
    async getChartsData(organizationId: string): Promise<{ vitals: any[]; admissions: any[] }> {
        try {
            const [vitalsData] = await Promise.all([
                request<{ chart: any }>(`/api/console/dashboard/charts/${organizationId}?type=visits&period=7d`),
            ]);

            return {
                vitals: vitalsData.chart.data.map((val: number, i: number) => ({
                    label: vitalsData.chart.labels[i],
                    value: val
                })),
                admissions: []
            };
        } catch (error) {
            console.error('Failed to fetch clinical charts:', error);
            return { vitals: [], admissions: [] };
        }
    }
};
