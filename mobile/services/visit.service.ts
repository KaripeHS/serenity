/**
 * Visit Service
 * Handles visit management, clock in/out, task documentation, and signature capture
 * Supports offline-first architecture with queue sync
 *
 * @module services/visit
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Config } from '../constants/Config';
import { LocationService } from './location.service';
import { OfflineQueue } from './offline.queue';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEY = 'serenity_auth_token';

// Care task completion interface
export interface TaskCompletion {
  taskId: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

// Signature data interface
export interface SignatureData {
  signatureBase64: string;
  signedBy: 'client' | 'representative' | 'caregiver';
  signerName: string;
  signedAt: string;
}

// Visit details interface
export interface VisitDetails {
  id: string;
  patient: {
    id: string;
    name: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    allergies: string[];
    diagnosis: string;
  };
  carePlan: {
    id: string;
    tasks: TaskCompletion[];
    meds: { name: string; dosage: string; frequency: string; instructions?: string }[];
  };
}

// Helper to get authenticated axios instance
const getApi = async () => {
  const token = await SecureStore.getItemAsync(STORAGE_KEY);
  return axios.create({
    baseURL: Config.API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    timeout: 30000,
  });
};

export const VisitService = {
  async getUpcomingVisits() {
    const api = await getApi();
    const response = await api.get('/visits/upcoming');
    return response.data;
  },

  async getVisitDetails(visitId: string): Promise<VisitDetails> {
    const api = await getApi();
    const response = await api.get(`/clinical/visits/${visitId}/details`);
    return response.data;
  },

  async getCareTasks(visitId: string) {
    const api = await getApi();
    const response = await api.get(`/clinical/visits/${visitId}/details`);
    return response.data.carePlan?.tasks || [];
  },

  async clockIn(visitId: string) {
    // 1. Get GPS Proof
    const hasPermission = await LocationService.requestPermissions();
    if (!hasPermission) throw new Error('GPS Permission Required');

    const location = await LocationService.getCurrentLocation();

    const payload = {
      visitId,
      action: 'clock_in',
      latitude: location.latitude,
      longitude: location.longitude,
      gpsAccuracy: location.accuracy,
      timestamp: new Date().toISOString()
    };

    // 2. Check Network
    const state = await NetInfo.fetch();

    if (state.isConnected) {
      // Online: Send immediately
      const api = await getApi();
      return api.post(`/visits/${visitId}/clock-in`, payload);
    } else {
      // Offline: Queue it
      await OfflineQueue.addToQueue(`/visits/${visitId}/clock-in`, 'POST', payload);
      return { status: 'queued', message: 'Clock-in saved offline. Will sync when online.' };
    }
  },

  async clockOut(visitId: string, notes?: string, adls?: any[]) {
    const hasPermission = await LocationService.requestPermissions();
    if (!hasPermission) throw new Error('GPS Permission Required');

    const location = await LocationService.getCurrentLocation();

    const payload = {
      visitId,
      action: 'clock_out',
      latitude: location.latitude,
      longitude: location.longitude,
      gpsAccuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      notes,
      adls: adls || []
    };

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      const api = await getApi();
      return api.post(`/visits/${visitId}/clock-out`, payload);
    } else {
      await OfflineQueue.addToQueue(`/visits/${visitId}/clock-out`, 'POST', payload);
      return { status: 'queued', message: 'Clock-out saved offline.' };
    }
  },

  /**
   * Document task completions for a visit
   */
  async documentTasks(visitId: string, tasks: TaskCompletion[]) {
    const payload = {
      tasks: tasks.map(t => ({
        ...t,
        completedAt: t.completedAt || new Date().toISOString(),
      })),
    };

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      const api = await getApi();
      return api.post(`/clinical/visits/${visitId}/tasks`, payload);
    } else {
      await OfflineQueue.addToQueue(`/clinical/visits/${visitId}/tasks`, 'POST', payload);
      return { status: 'queued', message: 'Tasks saved offline. Will sync when online.' };
    }
  },

  /**
   * Save client/representative signature for visit verification
   */
  async saveSignature(visitId: string, signatureData: SignatureData) {
    const payload = {
      visitId,
      signatureBase64: signatureData.signatureBase64,
      signedBy: signatureData.signedBy,
      signerName: signatureData.signerName,
      signedAt: signatureData.signedAt || new Date().toISOString(),
    };

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      const api = await getApi();
      return api.post(`/visits/${visitId}/signature`, payload);
    } else {
      // Store signature locally first, then queue
      const signaturePath = `${FileSystem.documentDirectory}signatures/`;
      const fileName = `sig_${visitId}_${Date.now()}.json`;

      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(signaturePath, { intermediates: true }).catch(() => {});

      // Save signature file
      await FileSystem.writeAsStringAsync(
        signaturePath + fileName,
        JSON.stringify(payload),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      await OfflineQueue.addToQueue(`/visits/${visitId}/signature`, 'POST', {
        ...payload,
        localFilePath: signaturePath + fileName,
      });

      return { status: 'queued', message: 'Signature saved offline. Will sync when online.' };
    }
  },

  /**
   * Complete visit with all documentation
   */
  async completeVisit(
    visitId: string,
    data: {
      tasks: TaskCompletion[];
      notes?: string;
      signature?: SignatureData;
    }
  ) {
    const hasPermission = await LocationService.requestPermissions();
    if (!hasPermission) throw new Error('GPS Permission Required');

    const location = await LocationService.getCurrentLocation();

    const payload = {
      visitId,
      tasks: data.tasks,
      notes: data.notes,
      signature: data.signature,
      latitude: location.latitude,
      longitude: location.longitude,
      gpsAccuracy: location.accuracy,
      completedAt: new Date().toISOString(),
    };

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      const api = await getApi();
      return api.post(`/visits/${visitId}/complete`, payload);
    } else {
      await OfflineQueue.addToQueue(`/visits/${visitId}/complete`, 'POST', payload);
      return { status: 'queued', message: 'Visit completion saved offline. Will sync when online.' };
    }
  },

  async getTodaysShifts() {
    try {
      const api = await getApi();
      console.log(`[VisitService] Fetching shifts...`);
      const response = await api.get('/mobile/shifts/today');
      return response.data.shifts || [];
    } catch (error) {
      console.error('[VisitService] Failed to fetch shifts:', error);
      // Fallback: Return empty array for now (offline caching to be handled later)
      return [];
    }
  },

  /**
   * Get visit history for caregiver
   */
  async getVisitHistory(startDate?: string, endDate?: string) {
    try {
      const api = await getApi();
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/mobile/visits/history', { params });
      return response.data.visits || [];
    } catch (error) {
      console.error('[VisitService] Failed to fetch visit history:', error);
      return [];
    }
  },

  /**
   * Get task templates for care plan building
   */
  async getTaskTemplates(category?: string) {
    try {
      const api = await getApi();
      const params = category ? { category } : {};
      const response = await api.get('/clinical/task-templates', { params });
      return response.data;
    } catch (error) {
      console.error('[VisitService] Failed to fetch task templates:', error);
      return { templates: [], categories: [] };
    }
  },
};
