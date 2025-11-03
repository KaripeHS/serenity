/**
 * Secure Storage Service
 * Handles local data persistence with encryption for sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, User, Visit } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

class StorageService {
  /**
   * Save auth tokens securely
   */
  async saveAuthTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
  }

  /**
   * Get auth tokens
   */
  async getAuthTokens(): Promise<AuthTokens | null> {
    const tokensStr = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKENS);
    return tokensStr ? JSON.parse(tokensStr) : null;
  }

  /**
   * Clear auth tokens (logout)
   */
  async clearAuthTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKENS);
  }

  /**
   * Save user profile
   */
  async saveUserProfile(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Clear user profile
   */
  async clearUserProfile(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  }

  /**
   * Save pending visits (offline mode)
   */
  async savePendingVisits(visits: Visit[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_VISITS, JSON.stringify(visits));
  }

  /**
   * Get pending visits
   */
  async getPendingVisits(): Promise<Visit[]> {
    const visitsStr = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_VISITS);
    return visitsStr ? JSON.parse(visitsStr) : [];
  }

  /**
   * Add a single pending visit
   */
  async addPendingVisit(visit: Visit): Promise<void> {
    const visits = await this.getPendingVisits();
    visits.push(visit);
    await this.savePendingVisits(visits);
  }

  /**
   * Remove a pending visit (after successful sync)
   */
  async removePendingVisit(visitId: string): Promise<void> {
    const visits = await this.getPendingVisits();
    const filtered = visits.filter(v => v.id !== visitId);
    await this.savePendingVisits(filtered);
  }

  /**
   * Clear all pending visits
   */
  async clearPendingVisits(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_VISITS);
  }

  /**
   * Get pending visits count
   */
  async getPendingVisitsCount(): Promise<number> {
    const visits = await this.getPendingVisits();
    return visits.length;
  }

  /**
   * Save last sync timestamp
   */
  async saveLastSync(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  /**
   * Clear all app data (for logout)
   */
  async clearAll(): Promise<void> {
    await this.clearAuthTokens();
    await this.clearUserProfile();
    await this.clearPendingVisits();
    await AsyncStorage.clear();
  }
}

// Singleton instance
export const storageService = new StorageService();
