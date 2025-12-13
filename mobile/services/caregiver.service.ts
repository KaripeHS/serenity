import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/Config';

const STORAGE_KEY = 'serenity_auth_token';

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

export const CaregiverService = {
    /**
     * Get Earnings for current month
     * GET /api/caregiver/me/earnings
     */
    async getEarnings() {
        try {
            const api = await getApi();
            const response = await api.get('/caregiver/me/earnings');
            return response.data;
        } catch (error) {
            console.error('[CaregiverService] Failed to fetch earnings:', error);
            // Return fallback structure for UI safety
            return { estimatedEarnings: 0, totalHours: 0 };
        }
    },

    /**
     * Get Performance Metrics (SPI)
     * GET /api/caregiver/me/metrics
     */
    async getMetrics() {
        try {
            const api = await getApi();
            const response = await api.get('/caregiver/me/metrics');
            return response.data;
        } catch (error) {
            console.error('[CaregiverService] Failed to fetch metrics:', error);
            // Return fallback structure
            return { overallScore: 0, tier: 'Bronze' };
        }
    }
};
