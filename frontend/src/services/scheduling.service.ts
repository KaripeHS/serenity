import { request } from './api';
import { loggerService } from '../shared/services/logger.service';
import { shouldUseMockData } from '../config/environment';

// =====================================================
// Calendar API Types
// =====================================================

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    resourceId?: string;
    clientId: string;
    clientName: string;
    caregiverId?: string;
    caregiverName?: string;
    serviceType: string;
    serviceCode: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    color: string;
    isUnassigned: boolean;
    notes?: string;
    address?: string;
}

export interface CalendarResource {
    id: string;
    name: string;
    role: string;
    hoursScheduled: number;
    hoursWorked: number;
    clientCount: number;
    status: 'available' | 'busy' | 'off';
    skills: string[];
}

export interface CoverageGap {
    id: string;
    clientId: string;
    clientName: string;
    serviceType: string;
    expectedDate: string;
    expectedHours: number;
    actualHours: number;
    gapHours: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    authorizationId?: string;
    authorizationNumber?: string;
}

export interface DispatchBoardData {
    date: string;
    openShifts: Array<{
        id: string;
        clientId: string;
        clientName: string;
        address: string;
        location: { lat: number; lng: number } | null;
        start: string;
        end: string;
        serviceType: string;
        urgency: 'normal' | 'urgent' | 'overdue';
    }>;
    availableCaregivers: Array<{
        id: string;
        name: string;
        phone: string;
        location: { lat: number; lng: number } | null;
        skills: string[];
    }>;
    summary: {
        openShiftCount: number;
        availableCaregiverCount: number;
        overdueCount: number;
    };
}

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

    // =====================================================
    // Calendar API Methods
    // =====================================================

    /**
     * Get calendar events for a date range
     */
    async getCalendarEvents(
        start: Date,
        end: Date,
        filters?: { caregiverId?: string; clientId?: string; podId?: string }
    ): Promise<{ events: CalendarEvent[]; count: number; unassignedCount: number }> {
        try {
            const params = new URLSearchParams({
                start: start.toISOString(),
                end: end.toISOString(),
            });

            if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
            if (filters?.clientId) params.append('clientId', filters.clientId);
            if (filters?.podId) params.append('podId', filters.podId);

            const data = await request<{
                success: boolean;
                events: CalendarEvent[];
                count: number;
                unassignedCount: number;
            }>(`/api/console/calendar/events?${params.toString()}`);

            return {
                events: data.events,
                count: data.count,
                unassignedCount: data.unassignedCount,
            };
        } catch (error) {
            loggerService.warn('Failed to fetch calendar events', { error });
            if (shouldUseMockData()) {
                return this.getMockCalendarEvents(start, end);
            }
            return { events: [], count: 0, unassignedCount: 0 };
        }
    }

    /**
     * Get caregiver resources for resource view
     */
    async getCalendarResources(
        start?: Date,
        end?: Date,
        podId?: string
    ): Promise<{ resources: CalendarResource[]; count: number }> {
        try {
            const params = new URLSearchParams();
            if (start) params.append('start', start.toISOString());
            if (end) params.append('end', end.toISOString());
            if (podId) params.append('podId', podId);

            const data = await request<{
                success: boolean;
                resources: CalendarResource[];
                count: number;
            }>(`/api/console/calendar/resources?${params.toString()}`);

            return {
                resources: data.resources,
                count: data.count,
            };
        } catch (error) {
            loggerService.warn('Failed to fetch calendar resources', { error });
            if (shouldUseMockData()) {
                return { resources: [], count: 0 };
            }
            return { resources: [], count: 0 };
        }
    }

    /**
     * Get coverage gaps for a date range
     */
    async getCoverageGaps(
        start?: Date,
        end?: Date,
        severity?: 'low' | 'medium' | 'high' | 'critical'
    ): Promise<{ gaps: CoverageGap[]; summary: any }> {
        try {
            const params = new URLSearchParams();
            if (start) params.append('start', start.toISOString());
            if (end) params.append('end', end.toISOString());
            if (severity) params.append('severity', severity);

            const data = await request<{
                success: boolean;
                gaps: CoverageGap[];
                summary: any;
            }>(`/api/console/calendar/coverage-gaps?${params.toString()}`);

            return {
                gaps: data.gaps,
                summary: data.summary,
            };
        } catch (error) {
            loggerService.warn('Failed to fetch coverage gaps', { error });
            if (shouldUseMockData()) {
                return { gaps: [], summary: {} };
            }
            return { gaps: [], summary: {} };
        }
    }

    /**
     * Assign or reassign a caregiver to a shift
     */
    async assignShift(
        shiftId: string,
        caregiverId: string | null,
        notify: boolean = true
    ): Promise<{ success: boolean; event: Partial<CalendarEvent>; message: string }> {
        const data = await request<{
            success: boolean;
            event: Partial<CalendarEvent>;
            message: string;
        }>(`/api/console/calendar/events/${shiftId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ caregiverId, notify }),
        });

        return data;
    }

    /**
     * Reschedule a shift to new times
     */
    async rescheduleShift(
        shiftId: string,
        start: Date,
        end: Date
    ): Promise<{ success: boolean; event: Partial<CalendarEvent>; message: string }> {
        const data = await request<{
            success: boolean;
            event: Partial<CalendarEvent>;
            message: string;
        }>(`/api/console/calendar/events/${shiftId}/reschedule`, {
            method: 'POST',
            body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() }),
        });

        return data;
    }

    /**
     * Get dispatch board data
     */
    async getDispatchBoard(date?: Date): Promise<DispatchBoardData> {
        try {
            const params = date ? `?date=${date.toISOString().split('T')[0]}` : '';
            const data = await request<DispatchBoardData & { success: boolean }>(
                `/api/console/calendar/dispatch-board${params}`
            );

            return data;
        } catch (error) {
            loggerService.warn('Failed to fetch dispatch board', { error });
            if (shouldUseMockData()) {
                return {
                    date: new Date().toISOString().split('T')[0],
                    openShifts: [],
                    availableCaregivers: [],
                    summary: { openShiftCount: 0, availableCaregiverCount: 0, overdueCount: 0 },
                };
            }
            return {
                date: new Date().toISOString().split('T')[0],
                openShifts: [],
                availableCaregivers: [],
                summary: { openShiftCount: 0, availableCaregiverCount: 0, overdueCount: 0 },
            };
        }
    }

    // =====================================================
    // Mock Data (Fallback)
    // =====================================================

    private getMockCalendarEvents(start: Date, end: Date): { events: CalendarEvent[]; count: number; unassignedCount: number } {
        return {
            events: [],
            count: 0,
            unassignedCount: 0,
        };
    }
}

export const schedulingService = new SchedulingService();
