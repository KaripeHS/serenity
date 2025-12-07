import { request } from './api';

export interface ClaimsReadinessReport {
    startDate: string;
    endDate: string;
    organizationId: string;
    totalVisits: number;
    billableVisits: number;
    blockedVisits: number;
    billablePercentage: number;
    blockReasons: Record<string, number>;
    estimatedRevenue: {
        billable: number;
        blocked: number;
        total: number;
    };
    visits: Array<{
        id: string;
        visitId: string;
        clientName: string;
        caregiverName: string;
        visitDate: string;
        billableUnits: number;
        status: 'billable' | 'blocked';
        blockReason?: string;
        estimatedAmount: number;
    }>;
}

export interface ClaimValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    visitId: string;
    clientName?: string;
    caregiverName?: string;
    billableUnits?: number;
    estimatedAmount?: number;
}

export interface ClaimsBatch {
    id: string;
    batchNumber: string;
    totalClaims: number;
    totalAmount: number;
    status: 'draft' | 'ready' | 'submitted' | 'processing' | 'paid' | 'denied';
    createdDate: string;
    submissionDate?: string;
    payer: string;
    claims: any[]; // Detailed claims structure if needed
}

export const billingService = {
    /**
     * Get claims readiness report
     */
    async getClaimsReadiness(startDate: string, endDate: string) {
        return request<ClaimsReadinessReport>(`/api/console/billing/claims-readiness?startDate=${startDate}&endDate=${endDate}`);
    },

    /**
     * Validate a single visit for claims
     */
    async validateVisit(visitId: string) {
        return request<ClaimValidationResult>('/api/console/billing/claims-readiness/validate', {
            method: 'POST',
            body: JSON.stringify({ visitId })
        });
    },

    /**
     * Generate claims for a list of visits
     */
    async generateClaims(visitIds: string[]) {
        return request<{
            success: boolean;
            claimsFileId: string;
            fileName: string;
            visitCount: number;
            downloadUrl: string;
        }>('/api/console/billing/claims/generate', {
            method: 'POST',
            body: JSON.stringify({ visitIds })
        });
    },

    /**
     * Get billing dashboard metrics
     */
    async getDashboardMetrics(period: number = 30) {
        return request<any>(`/api/console/billing/dashboard?period=${period}`);
    },

    /**
     * Get denials
     */
    async getDenials(status: string = 'pending') {
        return request<any>(`/api/console/billing/denials?status=${status}`);
    },

    /**
     * Get claim batches
     */
    async getBatches(status?: string) {
        const query = status ? `?status=${status}` : '';
        return request<ClaimsBatch[]>(`/api/console/billing/batches${query}`);
    }
};
