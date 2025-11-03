import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  dismissible?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onAction?: (id: string) => void;
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const icons: Record<NotificationType, { icon: React.ComponentType<any>; color: string }> = {
    info: { icon: InformationCircleIcon, color: 'text-info-600' },
    success: { icon: CheckCircleIcon, color: 'text-success-600' },
    warning: { icon: ExclamationTriangleIcon, color: 'text-warning-600' },
    error: { icon: XCircleIcon, color: 'text-danger-600' }
  };

  const { icon: Icon, color } = icons[type];
  return <Icon className={`h-6 w-6 ${color}`} />;
}

function PriorityBadge({ priority }: { priority: NotificationPriority }) {
  const variants: Record<NotificationPriority, any> = {
    low: 'gray',
    medium: 'info',
    high: 'warning',
    urgent: 'danger'
  };

  const labels: Record<NotificationPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };

  if (priority === 'low') return null; // Don't show badge for low priority

  return <Badge variant={variants[priority]} size="sm">{labels[priority]}</Badge>;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAction
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || !n.read)
    .sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 right-4 z-50 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 animate-fade-in overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-primary-600" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm">{unreadCount} new</Badge>
                  )}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="w-full mt-2 px-3 py-1.5 bg-success-50 text-success-700 rounded-lg text-sm font-medium hover:bg-success-100 transition-colors"
                >
                  <CheckIcon className="h-4 w-4 inline mr-1" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">No notifications</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <NotificationIcon type={notification.type} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <PriorityBadge priority={notification.priority} />
                          </div>

                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {formatTime(notification.timestamp)}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Action Button */}
                              {notification.actionLabel && (
                                <button
                                  onClick={() => {
                                    if (notification.onAction) {
                                      notification.onAction();
                                    } else if (onAction) {
                                      onAction(notification.id);
                                    }
                                    if (!notification.read) {
                                      onMarkAsRead(notification.id);
                                    }
                                  }}
                                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                  {notification.actionLabel}
                                </button>
                              )}

                              {/* Mark as Read */}
                              {!notification.read && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="text-xs font-medium text-success-600 hover:text-success-700 transition-colors"
                                  title="Mark as read"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}

                              {/* Dismiss */}
                              {notification.dismissible !== false && (
                                <button
                                  onClick={() => onDismiss(notification.id)}
                                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                  title="Dismiss"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
}

// Example notification templates
export const notificationTemplates = {
  evvClockIn: (caregiverName: string, patientName: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
    title: 'EVV Clock-In',
    message: `${caregiverName} clocked in for ${patientName}`,
    type: 'success',
    priority: 'medium',
    actionLabel: 'View Visit',
    dismissible: true
  }),

  claimDenied: (claimNumber: string, reason: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
    title: 'Claim Denied',
    message: `Claim ${claimNumber} was denied: ${reason}`,
    type: 'error',
    priority: 'urgent',
    actionLabel: 'Review Claim',
    dismissible: false
  }),

  trainingExpiring: (staffName: string, certification: string, days: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
    title: 'Certification Expiring',
    message: `${staffName}'s ${certification} expires in ${days} days`,
    type: 'warning',
    priority: days <= 7 ? 'high' : 'medium',
    actionLabel: 'Schedule Renewal',
    dismissible: true
  }),

  visitUnassigned: (patientName: string, date: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
    title: 'Unassigned Visit',
    message: `Visit for ${patientName} on ${date} needs a caregiver`,
    type: 'warning',
    priority: 'high',
    actionLabel: 'Assign Caregiver',
    dismissible: false
  })
};
