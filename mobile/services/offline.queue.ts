
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { Config } from '../constants/Config';
import * as SecureStore from 'expo-secure-store';

const QUEUE_KEY = 'evv_offline_queue';
const STORAGE_KEY = 'serenity_auth_token';

interface QueuedItem {
    id: string;
    url: string;
    method: 'POST' | 'PUT';
    data: any;
    timestamp: number;
}

export const OfflineQueue = {
    async addToQueue(url: string, method: 'POST' | 'PUT', data: any) {
        const item: QueuedItem = {
            id: Math.random().toString(36).substring(7),
            url,
            method,
            data,
            timestamp: Date.now(),
        };

        const existing = await this.getQueue();
        const updated = [...existing, item];
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
        console.log('Request queued offline:', item.id);
    },

    async getQueue(): Promise<QueuedItem[]> {
        const json = await AsyncStorage.getItem(QUEUE_KEY);
        return json ? JSON.parse(json) : [];
    },

    async clearQueue() {
        await AsyncStorage.removeItem(QUEUE_KEY);
    },

    async processQueue() {
        const state = await NetInfo.fetch();
        if (!state.isConnected) return; // Still offline

        const queue = await this.getQueue();
        if (queue.length === 0) return;

        console.log(`Processing ${queue.length} offline items...`);
        const token = await SecureStore.getItemAsync(STORAGE_KEY);

        // Process strictly in order (FIFO)
        const failed: QueuedItem[] = [];

        for (const item of queue) {
            try {
                await axios({
                    url: `${Config.API_URL}${item.url}`,
                    method: item.method,
                    data: item.data,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Offline-Sync': 'true', // Flag for backend
                        'X-Original-Timestamp': item.timestamp.toString()
                    }
                });
                console.log('Synced item:', item.id);
            } catch (error) {
                console.error('Failed to sync item:', item.id, error);
                failed.push(item); // Keep failed items to retry later
            }
        }

        // Update queue with only failed items
        if (failed.length > 0) {
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
        } else {
            await this.clearQueue();
        }
    }
};
