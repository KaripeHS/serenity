/**
 * Notifications Service
 * Frontend service for fetching and managing system notifications
 *
 * @module services/notifications
 */

import api from './api';

export interface SystemNotification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  category: 'credentials' | 'coverage' | 'training' | 'claims' | 'incidents' | 'authorizations' | 'compliance' | 'system';
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface NotificationsResponse {
  success: boolean;
  notifications: SystemNotification[];
  unreadCount: number;
  totalCount: number;
}

/**
 * Notifications Service API
 */
export const notificationsService = {
  /**
   * Get all notifications for the current user
   * Aggregates alerts from various system sources
   */
  async getNotifications(): Promise<NotificationsResponse> {
    try {
      const response = await api.get('/console/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Return empty state on error
      return {
        success: false,
        notifications: [],
        unreadCount: 0,
        totalCount: 0
      };
    }
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await api.post(`/console/notifications/${notificationId}/read`);
      return response.data.success;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await api.post('/console/notifications/read-all');
      return response.data.success;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }
};

export default notificationsService;
