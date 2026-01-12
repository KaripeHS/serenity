/**
 * Overview Tab - Executive Dashboard
 * Main KPIs, Business Health Score, and 12-month trends
 * All widgets are clickable for drill-down navigation
 */

import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Activity,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { WidgetContainer, StatWidget, WidgetGrid } from '@/components/ui/CommandCenter/WidgetContainer';
import { Chart } from '@/components/ui/Chart';
import { useOverviewTabData } from '@/hooks/useExecutiveData';

export function OverviewTab() {
  const navigate = useNavigate();
  const { overview, revenueTrend, visitsTrend, evvTrend, isLoading } = useOverviewTabData();

  const data = overview.data;

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading overview...</p>
      </div>
    );
  }

  // Calculate business health score components
  const healthScores = {
    revenue: Math.min(100, Math.max(0, 50 + (data?.financial?.monthlyRevenueChange || 0) * 2)),
    operations: data?.operations?.visitCompletionRate || 0,
    compliance: data?.compliance?.overallScore || 0,
    workforce: Math.max(0, 100 - (data?.workforce?.turnoverRate || 0) * 2),
  };

  const overallHealth = Math.round(
    (healthScores.revenue * 0.3 + healthScores.operations * 0.25 +
     healthScores.compliance * 0.25 + healthScores.workforce * 0.2)
  );

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
        <WidgetGrid columns={4}>
          <StatWidget
            label="Monthly Revenue"
            value={`$${formatCurrency(data?.financial?.monthlyRevenue || 0)}`}
            change={data?.financial?.monthlyRevenueChange ? {
              value: data.financial.monthlyRevenueChange,
              isPositive: data.financial.monthlyRevenueChange >= 0,
              label: 'vs last month',
            } : undefined}
            icon={<DollarSign className="w-6 h-6" />}
            variant={data?.financial?.monthlyRevenueChange && data.financial.monthlyRevenueChange >= 0 ? 'success' : 'default'}
            onClick={() => navigate('/dashboard/billing')}
          />
          <StatWidget
            label="Active Patients"
            value={data?.operations?.activePatients || 0}
            change={data?.operations?.newAdmissions ? {
              value: data.operations.newAdmissions,
              isPositive: true,
              label: 'new this month',
            } : undefined}
            icon={<Users className="w-6 h-6" />}
            onClick={() => navigate('/patients')}
          />
          <StatWidget
            label="Active Staff"
            value={data?.workforce?.activeStaff || 0}
            change={data?.workforce?.newHires ? {
              value: data.workforce.newHires,
              isPositive: true,
              label: 'new hires',
            } : undefined}
            icon={<Users className="w-6 h-6" />}
            onClick={() => navigate('/dashboard/hr')}
          />
          <StatWidget
            label="EVV Compliance"
            value={`${data?.operations?.evvComplianceRate || 0}%`}
            icon={<ShieldCheck className="w-6 h-6" />}
            variant={
              (data?.operations?.evvComplianceRate || 0) >= 95 ? 'success' :
              (data?.operations?.evvComplianceRate || 0) >= 85 ? 'warning' : 'danger'
            }
            onClick={() => navigate('/dashboard/operations')}
          />
        </WidgetGrid>
      </div>

      {/* Business Health Scorecard */}
      <WidgetContainer
        title="Business Health Scorecard"
        subtitle="Overall performance across key areas"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Overall Score */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-5xl font-bold ${
              overallHealth >= 80 ? 'text-green-600' :
              overallHealth >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {overallHealth}
            </div>
            <p className="text-sm text-gray-600 mt-2">Overall Score</p>
            <p className={`text-xs font-medium mt-1 ${
              overallHealth >= 80 ? 'text-green-600' :
              overallHealth >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {overallHealth >= 80 ? 'Excellent' : overallHealth >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </div>

          {/* Score Breakdown - Clickable */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreBar
              label="Revenue Growth"
              score={healthScores.revenue}
              icon={<DollarSign className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/billing')}
            />
            <ScoreBar
              label="Operations"
              score={healthScores.operations}
              icon={<Activity className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/operations')}
            />
            <ScoreBar
              label="Compliance"
              score={healthScores.compliance}
              icon={<ShieldCheck className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/compliance')}
            />
            <ScoreBar
              label="Workforce"
              score={healthScores.workforce}
              icon={<Users className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/hr')}
            />
          </div>
        </div>
      </WidgetContainer>

      {/* Trend Charts - Clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <ClickableChartContainer
          title="Revenue Trend"
          subtitle="12-month rolling"
          icon={<DollarSign className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/billing')}
        >
          {revenueTrend.data?.data && revenueTrend.data.data.length > 0 ? (
            <Chart
              type="area"
              data={revenueTrend.data.data.map(d => ({
                label: d.month,
                value: d.value,
              }))}
              height={180}
              width={350}
              color="#10b981"
              gradientFrom="#10b981"
              gradientTo="#d1fae5"
              showAxes={true}
              showGrid={true}
            />
          ) : (
            <EmptyChart message="No revenue data available" />
          )}
        </ClickableChartContainer>

        {/* Visits Trend */}
        <ClickableChartContainer
          title="Completed Visits"
          subtitle="12-month rolling"
          icon={<Activity className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/scheduling')}
        >
          {visitsTrend.data?.data && visitsTrend.data.data.length > 0 ? (
            <Chart
              type="bar"
              data={visitsTrend.data.data.map(d => ({
                label: d.month,
                value: d.value,
              }))}
              height={180}
              width={350}
              color="#3b82f6"
              showAxes={true}
              showGrid={true}
            />
          ) : (
            <EmptyChart message="No visit data available" />
          )}
        </ClickableChartContainer>

        {/* EVV Compliance Trend */}
        <ClickableChartContainer
          title="EVV Compliance Rate"
          subtitle="12-month rolling"
          icon={<ShieldCheck className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/operations')}
        >
          {evvTrend.data?.data && evvTrend.data.data.length > 0 ? (
            <Chart
              type="line"
              data={evvTrend.data.data.map(d => ({
                label: d.month,
                value: d.value,
              }))}
              height={180}
              width={350}
              color="#8b5cf6"
              showAxes={true}
              showGrid={true}
            />
          ) : (
            <EmptyChart message="No EVV data available" />
          )}
        </ClickableChartContainer>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <QuickLink
          title="Financial Reports"
          description="Revenue, AR aging, cash flow"
          icon={<DollarSign className="w-5 h-5" />}
          onClick={() => navigate('/dashboard/billing')}
          color="green"
        />
        <QuickLink
          title="Operations Center"
          description="Visits, scheduling, EVV"
          icon={<Activity className="w-5 h-5" />}
          onClick={() => navigate('/dashboard/operations')}
          color="blue"
        />
        <QuickLink
          title="HR & Recruiting"
          description="Staff, hiring, retention"
          icon={<Users className="w-5 h-5" />}
          onClick={() => navigate('/dashboard/hr')}
          color="purple"
        />
        <QuickLink
          title="Compliance Center"
          description="Credentials, training, audits"
          icon={<ShieldCheck className="w-5 h-5" />}
          onClick={() => navigate('/dashboard/compliance')}
          color="orange"
        />
      </div>
    </div>
  );
}

// Score bar component - Clickable
interface ScoreBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  onClick: () => void;
}

function ScoreBar({ label, score, icon, onClick }: ScoreBarProps) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <button
      onClick={onClick}
      className="p-3 bg-gray-50 rounded-lg w-full text-left hover:bg-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className={`text-sm font-bold ${
          score >= 80 ? 'text-green-600' :
          score >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {Math.round(score)}
        </span>
      </div>
    </button>
  );
}

// Clickable chart container
interface ClickableChartContainerProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function ClickableChartContainer({ title, subtitle, icon, onClick, children }: ClickableChartContainerProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 shadow-sm w-full text-left hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
    >
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 text-gray-400">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </button>
  );
}

// Quick link card
interface QuickLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function QuickLink({ title, description, icon, onClick, color }: QuickLinkProps) {
  const colors = {
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  };

  const iconColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-md ${colors[color]}`}
    >
      <div className={iconColors[color]}>{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

// Empty chart placeholder
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[180px] bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// Currency formatter
function formatCurrency(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toFixed(0);
}
