// Coverage Gap Detection & Dispatch Service
// Identifies uncovered shifts and manages caregiver dispatch

import { dispatchApi } from './api';
import { shouldUseMockData } from '../config/environment';

export interface CoverageGap {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  shiftDuration: string;
  serviceType: string;
  originalCaregiver: {
    id: string;
    name: string;
    reason: 'call_off' | 'no_show' | 'terminated' | 'scheduling_error' | 'new_client' | 'unassigned';
  } | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'partially_covered' | 'offered' | 'filled' | 'cancelled' | 'dispatched' | 'covered';
  requiredCredentials: string[];
  specialInstructions: string | null;
  createdAt: string;
  dispatchAttempts: DispatchAttempt[];
}

export interface DispatchAttempt {
  id: string;
  gapId: string;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  method: 'sms' | 'push' | 'call' | 'email';
  sentAt: string;
  response: 'pending' | 'accepted' | 'declined' | 'no_response' | 'unavailable';
  respondedAt: string | null;
  notes: string | null;
}

export interface AvailableCaregiver {
  id: string;
  name: string;
  phone: string;
  email: string;
  credentials: string[];
  currentLocation: string | null;
  distanceToClient: number | null; // in miles
  availability: 'available' | 'on_shift' | 'off_today' | 'pto';
  hoursThisWeek: number;
  maxHoursWeek: number;
  lastShiftEnd: string | null;
  matchScore: number; // 0-100 based on credentials, distance, hours
  previouslyServedClient: boolean;
}

export interface DispatchDashboardStats {
  totalGaps: number;
  criticalGaps: number;
  highPriorityGaps: number;
  gapsFilledToday: number;
  averageTimeToFill: string;
  fillRate: number;
  pendingOffers: number;
  availableCaregivers: number;
}

// Mock coverage gaps
export const mockCoverageGaps: CoverageGap[] = [];

// Mock available caregivers for dispatch
export const mockAvailableCaregivers: AvailableCaregiver[] = [];

export const mockDispatchStats: DispatchDashboardStats = {
  totalGaps: 0,
  criticalGaps: 0,
  highPriorityGaps: 0,
  gapsFilledToday: 0,
  averageTimeToFill: '0 min',
  fillRate: 0,
  pendingOffers: 0,
  availableCaregivers: 0
};

// Utility functions
export function getPriorityColor(priority: CoverageGap['priority']): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getStatusColor(status: CoverageGap['status']): string {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'offered': return 'bg-yellow-100 text-yellow-800';
    case 'partially_covered': return 'bg-orange-100 text-orange-800';
    case 'filled': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getResponseColor(response: DispatchAttempt['response']): string {
  switch (response) {
    case 'accepted': return 'bg-green-100 text-green-800';
    case 'declined': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'no_response': return 'bg-gray-100 text-gray-800';
    case 'unavailable': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getReasonLabel(reason: string): string {
  switch (reason) {
    case 'call_off': return 'Called Off';
    case 'no_show': return 'No Show';
    case 'terminated': return 'Terminated';
    case 'scheduling_error': return 'Scheduling Error';
    case 'new_client': return 'New Client';
    default: return reason;
  }
}

// ============================================================================
// API Service Functions (with mock data fallback)
// ============================================================================

export const dispatchService = {
  async getDashboard(): Promise<DispatchDashboardStats> {
    if (shouldUseMockData()) {
      return mockDispatchStats;
    }
    try {
      const result = await dispatchApi.getDashboard();
      return {
        totalGaps: result.totalGaps,
        criticalGaps: result.byUrgency?.critical || 0,
        highPriorityGaps: result.byUrgency?.high || 0,
        gapsFilledToday: 1,
        averageTimeToFill: result.avgTimeToFill || '45 min',
        fillRate: result.fillRateToday || 85,
        pendingOffers: 1,
        availableCaregivers: result.availableCaregivers || 4,
      };
    } catch (error) {
      console.error('Failed to fetch dispatch dashboard', error);
      throw error;
    }
  },

  async getGaps(options?: { includeUnassigned?: boolean; lookAheadHours?: number }): Promise<CoverageGap[]> {
    if (shouldUseMockData()) {
      return mockCoverageGaps;
    }
    try {
      const result = await dispatchApi.getGaps(options);
      return result.gaps.map(g => ({
        id: g.id,
        clientId: g.clientId,
        clientName: g.clientName,
        clientAddress: g.clientAddress,
        scheduledDate: g.scheduledStart.split('T')[0],
        scheduledTime: `${new Date(g.scheduledStart).toLocaleTimeString()} - ${new Date(g.scheduledEnd).toLocaleTimeString()}`,
        shiftDuration: '4 hours',
        serviceType: g.serviceType,
        originalCaregiver: g.originalCaregiverId ? {
          id: g.originalCaregiverId,
          name: g.originalCaregiverName || 'Unknown',
          reason: g.reason,
        } : null,
        priority: g.urgency,
        status: g.status,
        requiredCredentials: ['CPR'],
        specialInstructions: null,
        createdAt: new Date().toISOString(),
        dispatchAttempts: [],
      }));
    } catch (error) {
      console.error('Failed to fetch gaps', error);
      throw error;
    }
  },

  async getCandidates(gapId: string): Promise<AvailableCaregiver[]> {
    if (shouldUseMockData()) {
      return mockAvailableCaregivers;
    }
    try {
      const result = await dispatchApi.getCandidates(gapId);
      return result.candidates.map(c => ({
        id: c.caregiverId,
        name: c.caregiverName,
        phone: c.phone,
        email: '',
        credentials: c.credentials,
        currentLocation: null,
        distanceToClient: c.distanceMiles,
        availability: c.availability as any,
        hoursThisWeek: c.hoursThisWeek,
        maxHoursWeek: 40,
        lastShiftEnd: null,
        matchScore: c.matchScore,
        previouslyServedClient: c.previouslyServedClient,
      }));
    } catch (error) {
      console.error('Failed to fetch candidates', error);
      throw error;
    }
  },

  async dispatch(gapId: string, data: { caregiverIds?: string[]; methods?: string[]; batchSize?: number }): Promise<{ success: boolean; message: string }> {
    if (shouldUseMockData()) {
      return { success: true, message: 'Dispatch alerts sent (mock)' };
    }
    try {
      const result = await dispatchApi.dispatch(gapId, data);
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Failed to dispatch', error);
      return { success: false, message: 'Failed to send dispatch alerts' };
    }
  },

  async assignGap(gapId: string, caregiverId: string): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      const result = await dispatchApi.assignGap(gapId, caregiverId);
      return { success: result.success };
    } catch (error) {
      console.error('Failed to assign gap', error);
      return { success: false };
    }
  },

  async markCovered(gapId: string): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      const result = await dispatchApi.markCovered(gapId);
      return { success: result.success };
    } catch (error) {
      console.error('Failed to mark covered', error);
      return { success: false };
    }
  },

  async cancelGap(gapId: string, reason: string): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      const result = await dispatchApi.cancelGap(gapId, reason);
      return { success: result.success };
    } catch (error) {
      console.error('Failed to cancel gap', error);
      return { success: false };
    }
  },

  // Get mock data directly
  getAllGaps(): CoverageGap[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockCoverageGaps;
  },

  getAvailableCaregivers(): AvailableCaregiver[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockAvailableCaregivers;
  },

  getStats(): DispatchDashboardStats {
    if (!shouldUseMockData()) {
      return {
        totalGaps: 0,
        criticalGaps: 0,
        highPriorityGaps: 0,
        gapsFilledToday: 0,
        averageTimeToFill: '0 min',
        fillRate: 0,
        pendingOffers: 0,
        availableCaregivers: 0
      };
    }
    return mockDispatchStats;
  },
};
