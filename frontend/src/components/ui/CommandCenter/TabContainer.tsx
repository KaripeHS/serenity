import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  badgeColor?: 'red' | 'yellow' | 'green' | 'blue' | 'gray';
  content: React.ReactNode;
}

interface TabContainerProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

/**
 * Tabbed navigation for Command Center dashboards
 * Features:
 * - Badge counts for urgent items
 * - Color-coded badges (red = urgent, yellow = important, green = on track)
 * - Icon support
 * - Responsive design
 */
export function TabContainer({ tabs, defaultTab, onChange, className }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      case 'green':
        return 'bg-green-500 text-white';
      case 'blue':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {tab.icon && (
                <span className={cn(isActive ? 'text-blue-600' : 'text-gray-400')}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full',
                    getBadgeColor(tab.badgeColor)
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto py-6">
        {activeTabContent}
      </div>
    </div>
  );
}
