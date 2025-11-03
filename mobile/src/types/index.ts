/**
 * Mobile App TypeScript Types
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'caregiver' | 'pod_lead' | 'admin';
  organizationId: string;
  phone: string;
  avatarUrl?: string;
}

export interface Shift {
  id: string;
  patientId: string;
  patientName: string;
  patientAddress: string;
  patientPhone: string;
  scheduledStart: string; // ISO datetime
  scheduledEnd: string; // ISO datetime
  serviceType: string;
  notes?: string;
  latitude: number;
  longitude: number;
}

export interface Visit {
  id: string;
  shiftId: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  clockInTime: string; // ISO datetime
  clockOutTime?: string; // ISO datetime
  clockInLatitude: number;
  clockInLongitude: number;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockInPhotoUri?: string;
  clockOutPhotoUri?: string;
  serviceType: string;
  notes?: string;
  status: 'in_progress' | 'completed' | 'synced';
  offlineCreated: boolean;
  syncedAt?: string; // ISO datetime
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  timestamp: number;
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  TodaysShifts: undefined;
  ClockIn: { shiftId: string };
  ClockOut: { visitId: string };
  History: undefined;
  Settings: undefined;
};
