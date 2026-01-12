/**
 * Executive Dashboard
 * Comprehensive CEO command center with real-time metrics
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Activity,
  Users,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { TabContainer, Tab } from '@/components/ui/CommandCenter/TabContainer';
import { UrgentSection } from '@/components/ui/CommandCenter/UrgentSection';
import { useExecutiveOverview, useExecutiveAlerts } from '@/hooks/useExecutiveData';
import { OverviewTab } from '@/components/executive/OverviewTab';
import { FinancialTab } from '@/components/executive/FinancialTab';
import { OperationsTab } from '@/components/executive/OperationsTab';
import { WorkforceTab } from '@/components/executive/WorkforceTab';
import { ComplianceTab } from '@/components/executive/ComplianceTab';

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useExecutiveOverview();
  const { data: alertsData, isLoading: alertsLoading } = useExecutiveAlerts();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchOverview();
    setIsRefreshing(false);
  };

  // Get user info from localStorage
  const userStr = localStorage.getItem('serenity_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Map alerts to UrgentSection format
  const urgentItems = (alertsData?.alerts || []).map((alert) => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    priority: alert.severity === 'critical' ? 'urgent' as const :
              alert.severity === 'warning' ? 'important' as const : 'info' as const,
    action: {
      label: 'View',
      onClick: () => navigate(alert.action),
      variant: alert.severity === 'critical' ? 'danger' as const : 'secondary' as const,
    },
  }));

  // Calculate badge counts for tabs
  const criticalCount = alertsData?.alerts?.filter(a => a.severity === 'critical').length || 0;
  const complianceIssues = (overview?.compliance?.expiredCredentials || 0) +
                          (overview?.compliance?.overdueTraining || 0);

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      content: <OverviewTab />,
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: <DollarSign className="w-4 h-4" />,
      badge: overview?.financial?.arBalance && overview.financial.arBalance > 100000 ?
             `$${Math.round(overview.financial.arBalance / 1000)}K AR` : undefined,
      badgeColor: 'yellow',
      content: <FinancialTab />,
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: <Activity className="w-4 h-4" />,
      badge: overview?.operations?.visitsToday || undefined,
      badgeColor: 'blue',
      content: <OperationsTab />,
    },
    {
      id: 'workforce',
      label: 'Workforce',
      icon: <Users className="w-4 h-4" />,
      badge: overview?.workforce?.openPositions || undefined,
      badgeColor: overview?.workforce?.openPositions && overview.workforce.openPositions > 5 ? 'yellow' : 'gray',
      content: <WorkforceTab />,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: complianceIssues || undefined,
      badgeColor: complianceIssues > 0 ? 'red' : 'green',
      content: <ComplianceTab />,
    },
  ];

  if (overviewLoading && !overview) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user?.first_name || 'Executive'}. Real-time overview of your agency.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6 mr-4">
              <QuickStat
                label="Revenue MTD"
                value={`$${formatNumber(overview?.financial?.monthlyRevenue || 0)}`}
                change={overview?.financial?.monthlyRevenueChange}
              />
              <QuickStat
                label="Active Patients"
                value={overview?.operations?.activePatients || 0}
              />
              <QuickStat
                label="Active Staff"
                value={overview?.workforce?.activeStaff || 0}
              />
              <QuickStat
                label="Compliance"
                value={`${overview?.compliance?.overallScore || 0}%`}
                variant={
                  (overview?.compliance?.overallScore || 0) >= 90 ? 'success' :
                  (overview?.compliance?.overallScore || 0) >= 70 ? 'warning' : 'danger'
                }
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {urgentItems.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <UrgentSection
            items={urgentItems}
            title={`Executive Alerts (${urgentItems.length})`}
          />
        </div>
      )}

      {/* No Alerts Message */}
      {urgentItems.length === 0 && !alertsLoading && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <div className="flex items-center gap-2 text-green-700">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">No active alerts. System is running smoothly.</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex-1 overflow-hidden px-6">
        <TabContainer tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  );
}

// Quick stat component for header
interface QuickStatProps {
  label: string;
  value: string | number;
  change?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function QuickStat({ label, value, change, variant = 'default' }: QuickStatProps) {
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-gray-900';
    }
  };

  return (
    <div className="text-center">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        <p className={`text-lg font-bold ${getVariantColor()}`}>{value}</p>
        {change !== undefined && (
          <span className={`flex items-center text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Utility function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}
