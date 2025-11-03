import { ReactNode } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

export interface Stat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<any>;
  iconColor?: string;
  valueColor?: string;
}

export interface StatCardProps {
  stats: Stat[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCard({
  stats,
  layout = 'horizontal',
  columns = 3,
  className = ''
}: StatCardProps) {
  if (layout === 'grid') {
    const gridCols = {
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };

    return (
      <Card className={className}>
        <div className={`grid ${gridCols[columns]} gap-6`}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {stat.icon && (
                <div className={`inline-flex p-3 ${stat.iconColor || 'bg-primary-100'} rounded-lg mb-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor?.includes('bg-') ? 'text-white' : 'text-primary-600'}`} />
                </div>
              )}
              <p className={`text-3xl font-bold ${stat.valueColor || 'text-gray-900'}`}>
                {stat.value}
              </p>
              <p className="text-sm font-medium text-gray-600 mt-1">{stat.label}</p>
              {stat.change !== undefined && (
                <div className="mt-2">
                  <Badge
                    variant={stat.change >= 0 ? 'success' : 'danger'}
                    size="sm"
                  >
                    {stat.change >= 0 ? '+' : ''}{stat.change}%
                  </Badge>
                  {stat.changeLabel && (
                    <span className="text-xs text-gray-500 ml-2">{stat.changeLabel}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (layout === 'vertical') {
    return (
      <Card className={className}>
        <div className="space-y-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4">
              {stat.icon && (
                <div className={`p-3 ${stat.iconColor || 'bg-primary-100'} rounded-lg flex-shrink-0`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor?.includes('bg-') ? 'text-white' : 'text-primary-600'}`} />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.valueColor || 'text-gray-900'} mt-1`}>
                  {stat.value}
                </p>
                {stat.change !== undefined && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={stat.change >= 0 ? 'success' : 'danger'}
                      size="sm"
                    >
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </Badge>
                    {stat.changeLabel && (
                      <span className="text-xs text-gray-500">{stat.changeLabel}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Horizontal layout (default)
  return (
    <Card className={className}>
      <div className="flex items-center justify-around divide-x divide-gray-200">
        {stats.map((stat, index) => (
          <div key={index} className="flex-1 text-center px-4">
            {stat.icon && (
              <div className={`inline-flex p-2 ${stat.iconColor || 'bg-primary-100'} rounded-lg mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor?.includes('bg-') ? 'text-white' : 'text-primary-600'}`} />
              </div>
            )}
            <p className={`text-2xl font-bold ${stat.valueColor || 'text-gray-900'}`}>
              {stat.value}
            </p>
            <p className="text-sm font-medium text-gray-600 mt-1">{stat.label}</p>
            {stat.change !== undefined && (
              <div className="mt-2">
                <Badge
                  variant={stat.change >= 0 ? 'success' : 'danger'}
                  size="sm"
                >
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Simple stat display without card wrapper
export interface SimpleStatProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<any>;
  iconColor?: string;
  valueColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SimpleStat({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary-600',
  valueColor = 'text-gray-900',
  size = 'md',
  className = ''
}: SimpleStatProps) {
  const sizes = {
    sm: { value: 'text-xl', label: 'text-xs', icon: 'h-4 w-4' },
    md: { value: 'text-2xl', label: 'text-sm', icon: 'h-5 w-5' },
    lg: { value: 'text-3xl', label: 'text-base', icon: 'h-6 w-6' }
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Icon && (
        <div className="flex-shrink-0">
          <Icon className={`${sizeClasses.icon} ${iconColor}`} />
        </div>
      )}
      <div>
        <p className={`${sizeClasses.value} font-bold ${valueColor}`}>
          {value}
        </p>
        <p className={`${sizeClasses.label} font-medium text-gray-600`}>
          {label}
        </p>
      </div>
    </div>
  );
}

// Metric comparison card
export interface MetricComparisonProps {
  title: string;
  metrics: Array<{
    label: string;
    current: number;
    previous: number;
    unit?: string;
  }>;
  className?: string;
}

export function MetricComparison({
  title,
  metrics,
  className = ''
}: MetricComparisonProps) {
  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const change = ((metric.current - metric.previous) / metric.previous * 100);
          const isPositive = change >= 0;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {metric.current}{metric.unit}
                  </span>
                  <Badge
                    variant={isPositive ? 'success' : 'danger'}
                    size="sm"
                  >
                    {isPositive ? '+' : ''}{change.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Previous: {metric.previous}{metric.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Summary stats with icons
export interface SummaryStatsProps {
  title?: string;
  stats: Array<{
    label: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color?: string;
  }>;
  columns?: 2 | 3 | 4 | 6;
  className?: string;
}

export function SummaryStats({
  title,
  stats,
  columns = 3,
  className = ''
}: SummaryStatsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color || 'text-primary-600'}`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
