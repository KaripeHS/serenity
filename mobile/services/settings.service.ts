
import axios from 'axios';
import { Config } from '../constants/Config';
import { AuthService } from './auth.service';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
    baseURL: Config.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Reuse the interceptor from AuthService if possible, or redefine it here.
// Best practice: Export the configured 'api' instance from AuthService or a shared 'api.ts' file.
// However, since AuthService uses a local 'api' const, we will duplicate the interceptor logic solely for this MVP speed.
// In a refactor, we should centralize the Axios instance.
const STORAGE_KEY = 'serenity_auth_token';
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const SettingsService = {
    async changePassword(currentPassword: string, newPassword: string) {
        try {
            const response = await api.post('/mobile/settings/password', {
                currentPassword,
                newPassword
            });
            return response.data;
        } catch (error: any) {
            console.error('Change password failed', error.response?.data || error.message);
            throw error; // Let UI handle it
        }
    },

    async updateNotificationPreferences(pushEnabled: boolean, emailEnabled: boolean) {
        try {
            const response = await api.put('/mobile/settings/notifications', {
                pushEnabled,
                emailEnabled
            });
            return response.data;
        } catch (error: any) {
            console.error('Update notifications failed', error.response?.data || error.message);
            throw error;
        }
    }
};
