import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, AlertTriangle } from 'lucide-react';

interface UrgentItem {
  id: string;
  title: string;
  description?: string;
  deadline?: Date | string;
  priority: 'urgent' | 'important' | 'info';
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  };
}

interface UrgentSectionProps {
  items: UrgentItem[];
  title?: string;
  emptyMessage?: string;
}

/**
 * Urgent Section Component
 * Displays high-priority items requiring immediate attention
 * Features:
 * - Color-coded by priority (red = urgent, yellow = important, blue = info)
 * - Countdown timers for deadlines
 * - One-click action buttons
 */
export function UrgentSection({ items, title = '🚨 Urgent Items (Today)', emptyMessage }: UrgentSectionProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-gray-500">
        {emptyMessage || '✅ No urgent items - all caught up!'}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <UrgentItem key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}

function UrgentItem({ title, description, deadline, priority, action }: UrgentItem) {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          iconBg: 'bg-red-100',
          text: 'text-red-900',
        };
      case 'important':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          text: 'text-yellow-900',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Clock className="w-5 h-5 text-blue-600" />,
          iconBg: 'bg-blue-100',
          text: 'text-blue-900',
        };
    }
  };

  const styles = getPriorityStyles();

  const getCountdown = (deadline: Date | string) => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff < 0) return 'OVERDUE';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 24) {
      return `${hours}h ${minutes}m remaining`;
    }

    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  };

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', styles.bg, styles.border)}>
      {/* Icon */}
      <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', styles.iconBg)}>
        {styles.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium', styles.text)}>{title}</p>
          {deadline && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
              <Clock className="w-3 h-3" />
              {getCountdown(deadline)}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            action.variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
            action.variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
            action.variant === 'secondary' && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
            !action.variant && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
