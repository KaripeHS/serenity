import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import { Badge } from './Badge';
import { Sparkline } from './Chart';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export interface KPIWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendData?: number[];
  icon?: React.ComponentType<any>;
  iconColor?: string;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onClick?: () => void;
  href?: string; // For drill-down navigation
  drillDownLabel?: string; // Label for drill-down link
  className?: string;
}

export function KPIWidget({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  trend,
  trendData,
  icon: Icon,
  iconColor = 'bg-primary-600',
  status = 'neutral',
  onClick,
  href,
  drillDownLabel = 'View Details',
  className = ''
}: KPIWidgetProps) {
  // Determine trend from change if not explicitly provided
  const effectiveTrend = trend || (
    change !== undefined
      ? change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      : 'neutral'
  );

  // Color mappings
  const statusColors = {
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
    info: 'text-info-600',
    neutral: 'text-gray-600'
  };

  const trendColors = {
    up: 'text-success-600 bg-success-50',
    down: 'text-danger-600 bg-danger-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  const trendIcons = {
    up: ArrowTrendingUpIcon,
    down: ArrowTrendingDownIcon,
    neutral: MinusIcon
  };

  const TrendIcon = trendIcons[effectiveTrend];

  return (
    <Card
      hoverable={!!onClick}
      clickable={!!onClick}
      onClick={onClick}
      className={`transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
            {title}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2 ${iconColor} rounded-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <div className="flex-1">
          <p className={`text-3xl font-bold ${statusColors[status]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {trendData && trendData.length > 0 && (
          <div className="ml-4">
            <Sparkline
              data={trendData}
              width={80}
              height={30}
              color={status !== 'neutral' ? statusColors[status].replace('text-', '#') : '#3b82f6'}
            />
          </div>
        )}
      </div>

      {(change !== undefined || changeLabel) && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium ${trendColors[effectiveTrend]}`}>
            <TrendIcon className="h-4 w-4" />
            {change !== undefined && (
              <span>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
          {changeLabel && (
            <span className="text-xs text-gray-500">{changeLabel}</span>
          )}
        </div>
      )}

      {/* Drill-down link */}
      {href && (
        <Link
          to={href}
          className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group"
        >
          <span>{drillDownLabel}</span>
          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </Card>
  );
}

// Grid layout for multiple KPI widgets
export interface KPIGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function KPIGrid({ children, columns = 4, className = '' }: KPIGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Comparison KPI - shows two values side by side
export interface ComparisonKPIProps {
  title: string;
  leftValue: string | number;
  leftLabel: string;
  rightValue: string | number;
  rightLabel: string;
  icon?: React.ComponentType<any>;
  iconColor?: string;
  className?: string;
}

export function ComparisonKPI({
  title,
  leftValue,
  leftLabel,
  rightValue,
  rightLabel,
  icon: Icon,
  iconColor = 'bg-primary-600',
  className = ''
}: ComparisonKPIProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 ${iconColor} rounded-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{leftValue}</p>
          <p className="text-xs text-gray-500 mt-1">{leftLabel}</p>
        </div>
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <p className="text-2xl font-bold text-primary-600">{rightValue}</p>
          <p className="text-xs text-gray-500 mt-1">{rightLabel}</p>
        </div>
      </div>
    </Card>
  );
}

// Target KPI - shows progress towards a goal
export interface TargetKPIProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  icon?: React.ComponentType<any>;
  iconColor?: string;
  className?: string;
}

export function TargetKPI({
  title,
  current,
  target,
  unit = '',
  icon: Icon,
  iconColor = 'bg-primary-600',
  className = ''
}: TargetKPIProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const status = percentage >= 100 ? 'success' : percentage >= 75 ? 'warning' : 'danger';

  const statusColors = {
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600'
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 ${iconColor} rounded-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">{current}</span>
          <span className="text-lg text-gray-500">/ {target} {unit}</span>
        </div>
        <Badge variant={status} size="sm">{percentage}% of target</Badge>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${statusColors[status]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Card>
  );
}
