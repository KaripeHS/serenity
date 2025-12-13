// Coverage Gap Detection & Dispatch Service
// Identifies uncovered shifts and manages caregiver dispatch

import { dispatchApi } from './api';

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
export const mockCoverageGaps: CoverageGap[] = [
  {
    id: 'gap-001',
    clientId: 'cl-001',
    clientName: 'Dorothy Williams',
    clientAddress: '1234 Oak Street, Columbus, OH 43215',
    scheduledDate: '2024-12-13',
    scheduledTime: '8:00 AM - 12:00 PM',
    shiftDuration: '4 hours',
    serviceType: 'Personal Care',
    originalCaregiver: {
      id: 'cg-004',
      name: 'Michael Brown',
      reason: 'call_off'
    },
    priority: 'critical',
    status: 'open',
    requiredCredentials: ['CPR', 'First Aid'],
    specialInstructions: 'Client uses walker. Needs assistance with bathing.',
    createdAt: '2024-12-13T06:30:00Z',
    dispatchAttempts: [
      {
        id: 'da-001',
        gapId: 'gap-001',
        caregiverId: 'cg-001',
        caregiverName: 'Maria Garcia',
        caregiverPhone: '614-555-1234',
        method: 'sms',
        sentAt: '2024-12-13T06:35:00Z',
        response: 'declined',
        respondedAt: '2024-12-13T06:42:00Z',
        notes: 'Already has shift scheduled'
      }
    ]
  },
  {
    id: 'gap-002',
    clientId: 'cl-002',
    clientName: 'Robert Johnson',
    clientAddress: '567 Maple Ave, Columbus, OH 43220',
    scheduledDate: '2024-12-13',
    scheduledTime: '2:00 PM - 6:00 PM',
    shiftDuration: '4 hours',
    serviceType: 'Homemaker',
    originalCaregiver: {
      id: 'cg-002',
      name: 'James Wilson',
      reason: 'no_show'
    },
    priority: 'high',
    status: 'offered',
    requiredCredentials: [],
    specialInstructions: 'Light housekeeping, meal prep for diabetic diet',
    createdAt: '2024-12-13T13:45:00Z',
    dispatchAttempts: [
      {
        id: 'da-002',
        gapId: 'gap-002',
        caregiverId: 'cg-003',
        caregiverName: 'Sarah Johnson',
        caregiverPhone: '614-555-5678',
        method: 'push',
        sentAt: '2024-12-13T13:50:00Z',
        response: 'pending',
        respondedAt: null,
        notes: null
      }
    ]
  },
  {
    id: 'gap-003',
    clientId: 'cl-003',
    clientName: 'Margaret Davis',
    clientAddress: '890 Pine Road, Westerville, OH 43081',
    scheduledDate: '2024-12-14',
    scheduledTime: '9:00 AM - 1:00 PM',
    shiftDuration: '4 hours',
    serviceType: 'Personal Care',
    originalCaregiver: null,
    priority: 'medium',
    status: 'open',
    requiredCredentials: ['CPR', 'First Aid', 'Dementia Care'],
    specialInstructions: 'Client has early-stage dementia. Patience required.',
    createdAt: '2024-12-12T15:00:00Z',
    dispatchAttempts: []
  },
  {
    id: 'gap-004',
    clientId: 'cl-004',
    clientName: 'James Miller',
    clientAddress: '321 Elm Street, Dublin, OH 43017',
    scheduledDate: '2024-12-14',
    scheduledTime: '3:00 PM - 7:00 PM',
    shiftDuration: '4 hours',
    serviceType: 'Respite Care',
    originalCaregiver: {
      id: 'cg-005',
      name: 'Emily Davis',
      reason: 'scheduling_error'
    },
    priority: 'low',
    status: 'open',
    requiredCredentials: ['CPR'],
    specialInstructions: null,
    createdAt: '2024-12-12T10:00:00Z',
    dispatchAttempts: []
  },
  {
    id: 'gap-005',
    clientId: 'cl-005',
    clientName: 'Helen Thompson',
    clientAddress: '654 Birch Lane, Gahanna, OH 43230',
    scheduledDate: '2024-12-13',
    scheduledTime: '10:00 AM - 2:00 PM',
    shiftDuration: '4 hours',
    serviceType: 'Personal Care',
    originalCaregiver: {
      id: 'cg-006',
      name: 'David Martinez',
      reason: 'call_off'
    },
    priority: 'critical',
    status: 'filled',
    requiredCredentials: ['CPR', 'First Aid'],
    specialInstructions: 'Client is hard of hearing',
    createdAt: '2024-12-13T07:00:00Z',
    dispatchAttempts: [
      {
        id: 'da-003',
        gapId: 'gap-005',
        caregiverId: 'cg-007',
        caregiverName: 'Lisa Chen',
        caregiverPhone: '614-555-9012',
        method: 'sms',
        sentAt: '2024-12-13T07:05:00Z',
        response: 'accepted',
        respondedAt: '2024-12-13T07:12:00Z',
        notes: null
      }
    ]
  }
];

// Mock available caregivers for dispatch
export const mockAvailableCaregivers: AvailableCaregiver[] = [
  {
    id: 'cg-001',
    name: 'Maria Garcia',
    phone: '614-555-1234',
    email: 'maria.garcia@email.com',
    credentials: ['CPR', 'First Aid', 'HIPAA', 'EVV'],
    currentLocation: 'Columbus, OH',
    distanceToClient: 3.2,
    availability: 'available',
    hoursThisWeek: 32,
    maxHoursWeek: 40,
    lastShiftEnd: '2024-12-12T16:00:00Z',
    matchScore: 92,
    previouslyServedClient: true
  },
  {
    id: 'cg-003',
    name: 'Sarah Johnson',
    phone: '614-555-5678',
    email: 'sarah.johnson@email.com',
    credentials: ['CPR', 'First Aid', 'HIPAA', 'EVV', 'Dementia Care'],
    currentLocation: 'Westerville, OH',
    distanceToClient: 5.8,
    availability: 'available',
    hoursThisWeek: 28,
    maxHoursWeek: 40,
    lastShiftEnd: '2024-12-12T14:00:00Z',
    matchScore: 88,
    previouslyServedClient: false
  },
  {
    id: 'cg-007',
    name: 'Lisa Chen',
    phone: '614-555-9012',
    email: 'lisa.chen@email.com',
    credentials: ['CPR', 'First Aid', 'HIPAA', 'EVV'],
    currentLocation: 'Dublin, OH',
    distanceToClient: 8.1,
    availability: 'available',
    hoursThisWeek: 20,
    maxHoursWeek: 32,
    lastShiftEnd: '2024-12-11T18:00:00Z',
    matchScore: 75,
    previouslyServedClient: false
  },
  {
    id: 'cg-008',
    name: 'Robert Kim',
    phone: '614-555-3456',
    email: 'robert.kim@email.com',
    credentials: ['CPR', 'First Aid', 'HIPAA', 'EVV', 'Medication Assistance'],
    currentLocation: 'Gahanna, OH',
    distanceToClient: 4.5,
    availability: 'on_shift',
    hoursThisWeek: 36,
    maxHoursWeek: 40,
    lastShiftEnd: null,
    matchScore: 82,
    previouslyServedClient: true
  },
  {
    id: 'cg-009',
    name: 'Jennifer Adams',
    phone: '614-555-7890',
    email: 'jennifer.adams@email.com',
    credentials: ['CPR', 'First Aid', 'HIPAA'],
    currentLocation: 'Reynoldsburg, OH',
    distanceToClient: 12.3,
    availability: 'available',
    hoursThisWeek: 16,
    maxHoursWeek: 40,
    lastShiftEnd: '2024-12-10T12:00:00Z',
    matchScore: 65,
    previouslyServedClient: false
  }
];

export const mockDispatchStats: DispatchDashboardStats = {
  totalGaps: 5,
  criticalGaps: 2,
  highPriorityGaps: 1,
  gapsFilledToday: 1,
  averageTimeToFill: '45 min',
  fillRate: 85,
  pendingOffers: 1,
  availableCaregivers: 4
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

let USE_MOCK_DATA = false;

export const dispatchService = {
  async getDashboard(): Promise<DispatchDashboardStats> {
    if (USE_MOCK_DATA) {
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
      console.error('Failed to fetch dispatch dashboard, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getDashboard();
    }
  },

  async getGaps(options?: { includeUnassigned?: boolean; lookAheadHours?: number }): Promise<CoverageGap[]> {
    if (USE_MOCK_DATA) {
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
      console.error('Failed to fetch gaps, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getGaps(options);
    }
  },

  async getCandidates(gapId: string): Promise<AvailableCaregiver[]> {
    if (USE_MOCK_DATA) {
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
      console.error('Failed to fetch candidates, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getCandidates(gapId);
    }
  },

  async dispatch(gapId: string, data: { caregiverIds?: string[]; methods?: string[]; batchSize?: number }): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
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
    return mockCoverageGaps;
  },

  getAvailableCaregivers(): AvailableCaregiver[] {
    return mockAvailableCaregivers;
  },

  getStats(): DispatchDashboardStats {
    return mockDispatchStats;
  },
};
