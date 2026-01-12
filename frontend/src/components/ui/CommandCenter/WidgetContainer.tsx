import React from 'react';
import { cn } from '@/lib/utils';

interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Reusable widget container for dashboard metrics and charts
 * Provides consistent styling and layout for all dashboard widgets
 */
export function WidgetContainer({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  variant = 'default',
}: WidgetContainerProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {/* Widget Header */}
      <div className={cn('border-b border-gray-200', variant === 'compact' ? 'px-4 py-3' : 'px-6 py-4')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="flex-shrink-0 text-gray-400">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className={cn(variant === 'compact' ? 'px-4 py-3' : 'px-6 py-4')}>
        {children}
      </div>
    </div>
  );
}

interface StatWidgetProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

/**
 * Stat widget for displaying key metrics
 * Supports click navigation for drill-down functionality
 */
export function StatWidget({ label, value, change, icon, variant = 'default', onClick }: StatWidgetProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const baseClasses = cn('rounded-lg border p-4', getVariantStyles());
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200' : '';

  const content = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn('text-xs font-medium', change.isPositive ? 'text-green-600' : 'text-red-600')}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </span>
            {change.label && (
              <span className="text-xs text-gray-500">{change.label}</span>
            )}
          </div>
        )}
      </div>
      {icon && (
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          {icon}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(baseClasses, clickableClasses, 'w-full text-left')}>
        {content}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
}

interface GridProps {
  columns?: 1 | 2 | 3 | 4 | 5;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive grid layout for widgets
 */
export function WidgetGrid({ columns = 3, gap = 6, children, className }: GridProps) {
  const getGridCols = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 lg:grid-cols-2';
      case 3:
        return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
      case 4:
        return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4';
      case 5:
        return 'grid-cols-1 lg:grid-cols-3 xl:grid-cols-5';
      default:
        return 'grid-cols-1 lg:grid-cols-3';
    }
  };

  return (
    <div className={cn('grid', getGridCols(), `gap-${gap}`, className)}>
      {children}
    </div>
  );
}
