/**
 * Notification Context
 * Provides app-wide access to system notifications and alerts
 *
 * Features:
 * - Auto-refresh notifications every 60 seconds
 * - Mark notifications as read
 * - Unread count for badge display
 * - Manual refresh capability
 *
 * @module contexts/NotificationContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { notificationsService, SystemNotification } from '../services/notifications.service';

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Auto-refresh interval (60 seconds)
const REFRESH_INTERVAL = 60 * 1000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from the API
   */
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationsService.getNotifications();
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount);
        setTotalCount(response.totalCount);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Mark a specific notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await notificationsService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    const success = await notificationsService.markAllAsRead();
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Auto-refresh notifications periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  }), [notifications, unreadCount, totalCount, isLoading, error, refreshNotifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
