
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/Config';
import { LocationService } from './location.service';
import { OfflineQueue } from './offline.queue';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEY = 'serenity_auth_token';

// Helper to get authenticated axios instance
const getApi = async () => {
    const token = await SecureStore.getItemAsync(STORAGE_KEY);
    return axios.create({
        baseURL: Config.API_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
};

export const VisitService = {
    async getUpcomingVisits() {
        const api = await getApi();
        const response = await api.get('/visits/upcoming');
        return response.data;
    },

    async getVisitDetails(visitId: string) {
        const api = await getApi();
        // Pointing to the new Real Clinical API
        const response = await api.get(`/clinical/visits/${visitId}/details`);
        return response.data;
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
    }
};
