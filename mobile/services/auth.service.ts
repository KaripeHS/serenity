
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/Config';
import { Platform } from 'react-native';

const STORAGE_KEY = 'serenity_auth_token';
const USER_KEY = 'serenity_user_data';

// Configure Axios
const api = axios.create({
    baseURL: Config.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for Auth Token
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor for 401 Unauthorized (Auto-Logout)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.log('[AuthService] 401 Detected - Logging out');
            await AuthService.logout();
            // Use Expo Router's imperative API for navigation outside components
            const { router } = require('expo-router');
            // We use setTimeout to ensure this happens next tick to avoid conflicts
            setTimeout(() => {
                try {
                    router.replace('/login');
                } catch (e) {
                    console.error('Navigation failed', e);
                }
            }, 100);
        }
        return Promise.reject(error);
    }
);

export const AuthService = {
    async login(email: string, password: string) {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            // Securely store token
            await SecureStore.setItemAsync(STORAGE_KEY, token);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            return user;
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    },

    async logout() {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    },

    async getUser() {
        const userStr = await SecureStore.getItemAsync(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }
};
