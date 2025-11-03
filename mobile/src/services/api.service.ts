/**
 * API Service
 * Handles all backend API communication with offline support
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as Network from 'expo-network';
import { User, Shift, Visit, AuthTokens, NetworkStatus } from '../types';
import { API_BASE_URL } from '../utils/constants';
import { storageService } from './storage.service';

class APIService {
  private client: AxiosInstance;
  private networkStatus: NetworkStatus = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
  };

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const tokens = await storageService.getAuthTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If 401 and haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await storageService.getAuthTokens();
            if (tokens?.refreshToken) {
              const newTokens = await this.refreshToken(tokens.refreshToken);
              await storageService.saveAuthTokens(newTokens);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await storageService.clearAll();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );

    // Monitor network status
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      const status = await Network.getNetworkStateAsync();
      this.networkStatus = {
        isConnected: status.isConnected || false,
        isInternetReachable: status.isInternetReachable || false,
        type: status.type || 'unknown',
      };
    } catch (error) {
      console.error('Error monitoring network:', error);
    }
  }

  /**
   * Get current network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    await this.initializeNetworkMonitoring();
    return this.networkStatus;
  }

  /**
   * Check if online
   */
  async isOnline(): Promise<boolean> {
    const status = await this.getNetworkStatus();
    return status.isConnected && status.isInternetReachable;
  }

  // ========================================
  // AUTHENTICATION
  // ========================================

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.client.post('/auth/login', { email, password });

    const { user, accessToken, refreshToken, expiresIn } = response.data;

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    // Save to storage
    await storageService.saveAuthTokens(tokens);
    await storageService.saveUserProfile(user);

    return { user, tokens };
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await storageService.clearAll();
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post('/auth/refresh', { refreshToken });

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

    return {
      accessToken,
      refreshToken: newRefreshToken || refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  }

  // ========================================
  // SHIFTS
  // ========================================

  /**
   * Get today's shifts for caregiver
   */
  async getTodaysShifts(): Promise<Shift[]> {
    const response = await this.client.get('/mobile/shifts/today');
    return response.data.shifts || [];
  }

  /**
   * Get shift by ID
   */
  async getShift(shiftId: string): Promise<Shift> {
    const response = await this.client.get(`/mobile/shifts/${shiftId}`);
    return response.data;
  }

  // ========================================
  // EVV / VISITS
  // ========================================

  /**
   * Clock in (start visit)
   */
  async clockIn(data: {
    shiftId: string;
    clockInTime: string;
    latitude: number;
    longitude: number;
    photoUri?: string;
    notes?: string;
  }): Promise<Visit> {
    const response = await this.client.post('/mobile/evv/clock-in', data);
    return response.data.visit;
  }

  /**
   * Clock out (end visit)
   */
  async clockOut(data: {
    visitId: string;
    clockOutTime: string;
    latitude: number;
    longitude: number;
    photoUri?: string;
    notes?: string;
  }): Promise<Visit> {
    const response = await this.client.post('/mobile/evv/clock-out', data);
    return response.data.visit;
  }

  /**
   * Get visit history
   */
  async getVisitHistory(page: number = 1, limit: number = 20): Promise<{ visits: Visit[]; total: number }> {
    const response = await this.client.get('/mobile/evv/history', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Sync pending visits (offline mode)
   */
  async syncPendingVisits(visits: Visit[]): Promise<{ synced: number; failed: number; errors: any[] }> {
    try {
      const response = await this.client.post('/mobile/evv/sync', { visits });
      return response.data;
    } catch (error: any) {
      console.error('Sync error:', error);
      return {
        synced: 0,
        failed: visits.length,
        errors: [error.message],
      };
    }
  }

  // ========================================
  // PROFILE
  // ========================================

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.client.get('/mobile/profile');
    const user = response.data;
    await storageService.saveUserProfile(user);
    return user;
  }

  /**
   * Update profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.client.patch('/mobile/profile', updates);
    const user = response.data;
    await storageService.saveUserProfile(user);
    return user;
  }

  // ========================================
  // ERROR HANDLING
  // ========================================

  /**
   * Handle API error
   */
  handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error
        return error.response.data?.message || error.response.data?.error || 'Server error occurred';
      } else if (error.request) {
        // Request made but no response
        return 'No response from server. Please check your internet connection.';
      }
    }

    return error.message || 'An unexpected error occurred';
  }
}

// Singleton instance
export const apiService = new APIService();
