import { request } from './api';

export interface CaregiverMatch {
    caregiver: {
        id: string;
        name: string;
        role: string;
        email: string;
        phone?: string;
        skills: string[];
        location: { lat: number; lng: number };
    };
    score: number;
    reasons: string[];
    warnings: string[];
    travelDistance: number;
    availability: Array<{ start: Date; end: Date }>;
}

export interface OptimizationResult {
    changes: Array<{
        shiftId: string;
        originalCaregiverId?: string;
        newCaregiverId: string;
        reason: string;
        efficiencyGain: number;
    }>;
    summary: {
        totalDistanceSavings: number;
        totalTimeSavings: number;
        totalCostSavings: number;
    };
}

export interface SchedulingClient {
    id: string;
    name: string;
    address: string;
    location: string;
}

export interface SchedulingServiceType {
    id: string;
    name: string;
    code: string;
}

class SchedulingService {
    async getCaregiverMatches(
        clientId: string,
        serviceId: string,
        start: Date,
        end: Date,
        maxDistance?: number,
        continuity: boolean = true
    ): Promise<CaregiverMatch[]> {
        const params = new URLSearchParams({
            clientId,
            serviceId,
            start: start.toISOString(),
            end: end.toISOString(),
            continuity: String(continuity)
        });

        if (maxDistance) {
            params.append('maxDistance', String(maxDistance));
        }

        return request<CaregiverMatch[]>(`/api/console/scheduling/matches?${params.toString()}`);
    }

    async optimizeSchedule(
        start: Date,
        end: Date
    ): Promise<OptimizationResult> {
        const params = new URLSearchParams({
            start: start.toISOString(),
            end: end.toISOString()
        });

        return request<OptimizationResult>(`/api/console/scheduling/optimize?${params.toString()}`);
    }

    async getClients(): Promise<SchedulingClient[]> {
        return request<SchedulingClient[]>('/api/console/scheduling/clients');
    }

    async getServices(): Promise<SchedulingServiceType[]> {
        return request<SchedulingServiceType[]>('/api/console/scheduling/services');
    }
}

export const schedulingService = new SchedulingService();
