import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  urgentSection?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Standard layout for all Command Center dashboards
 * Provides consistent structure: Header → Urgent Section → Tabs → Content
 */
export function DashboardLayout({
  title,
  subtitle,
  urgentSection,
  tabs,
  children,
  actions,
  className,
  'data-testid': dataTestId,
}: DashboardLayoutProps) {
  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)} data-testid={dataTestId}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid={dataTestId ? `${dataTestId.replace('-dashboard', '')}-title` : undefined}>{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      </div>

      {/* Urgent Section (Red/Yellow Alerts) */}
      {urgentSection && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          {urgentSection}
        </div>
      )}

      {/* Tabs Navigation */}
      {tabs && (
        <div className="bg-white border-b border-gray-200 px-6">
          {tabs}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {children}
      </div>
    </div>
  );
}

interface DashboardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function DashboardHeader({ title, description, icon, badge }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {icon && (
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
