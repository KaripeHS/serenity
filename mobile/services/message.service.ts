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

export const MessageService = {
    /**
     * Get All Conversations
     */
    async getConversations() {
        try {
            const api = await getApi();
            const response = await api.get('/mobile/messaging/conversations');
            return response.data || [];
        } catch (error) {
            console.error('[MessageService] Failed to fetch conversations:', error);
            return [];
        }
    },

    /**
     * Get Messages for a Conversation
     */
    async getMessages(conversationId: string) {
        try {
            const api = await getApi();
            const response = await api.get(`/mobile/messaging/conversations/${conversationId}/messages`);
            return response.data || [];
        } catch (error) {
            console.error('[MessageService] Failed to fetch messages:', error);
            return [];
        }
    },

    /**
     * Send a Message
     */
    async sendMessage(conversationId: string, content: string) {
        try {
            const api = await getApi();
            const response = await api.post('/mobile/messaging/messages', {
                conversationId,
                content
            });
            return response.data;
        } catch (error) {
            console.error('[MessageService] Failed to send message:', error);
            throw error;
        }
    }
};
