/**
 * Financial Tab - Executive Dashboard
 * Revenue, AR aging, payer mix, and collection metrics
 * All widgets are clickable for drill-down navigation
 */

import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  PieChart,
} from 'lucide-react';
import { WidgetContainer, StatWidget, WidgetGrid } from '@/components/ui/CommandCenter/WidgetContainer';
import { Chart } from '@/components/ui/Chart';
import { useExecutiveFinancial, useExecutiveTrends } from '@/hooks/useExecutiveData';

export function FinancialTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useExecutiveFinancial();
  const { data: revenueTrendData } = useExecutiveTrends('revenue');

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading financial data...</p>
      </div>
    );
  }

  const summary = data?.summary;
  const totalAR = summary?.totalAR || 0;
  const ar90Plus = summary?.ar90Plus || 0;
  const ar90Percent = totalAR > 0 ? (ar90Plus / totalAR) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics - All clickable */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <WidgetGrid columns={5}>
          <StatWidget
            label="Revenue MTD"
            value={`$${formatCurrency(summary?.currentMonthRevenue || 0)}`}
            icon={<DollarSign className="w-6 h-6" />}
            variant="success"
            onClick={() => navigate('/dashboard/billing')}
          />
          <StatWidget
            label="Revenue YTD"
            value={`$${formatCurrency(summary?.ytdRevenue || 0)}`}
            icon={<TrendingUp className="w-6 h-6" />}
            onClick={() => navigate('/dashboard/billing')}
          />
          <StatWidget
            label="Total AR"
            value={`$${formatCurrency(totalAR)}`}
            icon={<Clock className="w-6 h-6" />}
            variant={totalAR > 500000 ? 'warning' : 'default'}
            onClick={() => navigate('/dashboard/billing-ar')}
          />
          <StatWidget
            label="AR 90+ Days"
            value={`$${formatCurrency(ar90Plus)}`}
            icon={<AlertCircle className="w-6 h-6" />}
            variant={ar90Plus > 100000 ? 'danger' : ar90Plus > 50000 ? 'warning' : 'default'}
            onClick={() => navigate('/dashboard/billing-ar')}
          />
          <StatWidget
            label="Avg Days to Pay"
            value={`${summary?.avgDaysToPay || 0} days`}
            icon={<Clock className="w-6 h-6" />}
            variant={
              (summary?.avgDaysToPay || 0) > 45 ? 'danger' :
              (summary?.avgDaysToPay || 0) > 30 ? 'warning' : 'success'
            }
            onClick={() => navigate('/dashboard/billing-ar')}
          />
        </WidgetGrid>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend - Clickable */}
        <ClickableWidget
          title="12-Month Revenue Trend"
          subtitle="Monthly revenue over time"
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/billing')}
        >
          {data?.revenueByMonth && data.revenueByMonth.length > 0 ? (
            <Chart
              type="area"
              data={data.revenueByMonth.map(d => ({
                label: d.month.split(' ')[0],
                value: d.revenue,
              }))}
              height={220}
              width={500}
              color="#10b981"
              gradientFrom="#10b981"
              gradientTo="#d1fae5"
              showAxes={true}
              showGrid={true}
            />
          ) : (
            <EmptyChart message="No revenue history available" />
          )}
        </ClickableWidget>

        {/* AR Aging - Clickable container and bars */}
        <ClickableWidget
          title="AR Aging Distribution"
          subtitle="Outstanding claims by age"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/billing-ar')}
        >
          {data?.arAging && data.arAging.length > 0 ? (
            <div className="space-y-4">
              {data.arAging.map((bucket, idx) => (
                <ARAgingBar
                  key={bucket.bucket}
                  label={bucket.bucket}
                  amount={bucket.amount}
                  count={bucket.count}
                  total={totalAR}
                  isOldest={idx === data.arAging.length - 1}
                  onClick={() => navigate('/dashboard/billing-ar')}
                />
              ))}
            </div>
          ) : (
            <EmptyChart message="No outstanding AR" />
          )}
        </ClickableWidget>
      </div>

      {/* Payer Mix and Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payer Mix - Clickable */}
        <ClickableWidget
          title="Revenue by Payer (MTD)"
          subtitle="Distribution across payer types"
          icon={<PieChart className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/billing')}
        >
          {data?.payerMix && data.payerMix.length > 0 ? (
            <div className="space-y-3">
              {data.payerMix.map((payer, idx) => {
                const totalRevenue = data.payerMix.reduce((sum, p) => sum + p.revenue, 0);
                const percent = totalRevenue > 0 ? (payer.revenue / totalRevenue) * 100 : 0;

                return (
                  <PayerMixBar
                    key={payer.payer}
                    payer={payer.payer}
                    revenue={payer.revenue}
                    claimsCount={payer.claimsCount}
                    percent={percent}
                    colorIndex={idx}
                    onClick={() => navigate('/dashboard/claims-workflow')}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyChart message="No payer data available" />
          )}
        </ClickableWidget>

        {/* Financial Health Summary - Clickable */}
        <ClickableWidget
          title="Financial Health Indicators"
          subtitle="Key metrics at a glance"
          icon={<DollarSign className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/billing-ar')}
        >
          <div className="space-y-4">
            <HealthIndicator
              label="Collection Rate"
              value={totalAR > 0 ? Math.round((1 - ar90Plus / totalAR) * 100) : 100}
              suffix="%"
              target={90}
              description="Claims collected before 90 days"
              onClick={() => navigate('/dashboard/billing-ar')}
            />
            <HealthIndicator
              label="AR Turnover"
              value={summary?.avgDaysToPay || 0}
              suffix=" days"
              target={30}
              isLowerBetter
              description="Average days to receive payment"
              onClick={() => navigate('/dashboard/billing-ar')}
            />
            <HealthIndicator
              label="AR Health"
              value={Math.round(100 - ar90Percent)}
              suffix="%"
              target={85}
              description="AR under 90 days"
              onClick={() => navigate('/dashboard/billing-ar')}
            />
          </div>
        </ClickableWidget>
      </div>
    </div>
  );
}

// Clickable widget container
interface ClickableWidgetProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function ClickableWidget({ title, subtitle, icon, onClick, children }: ClickableWidgetProps) {
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

// AR Aging bar component - Clickable
interface ARAgingBarProps {
  label: string;
  amount: number;
  count: number;
  total: number;
  isOldest: boolean;
  onClick: () => void;
}

function ARAgingBar({ label, amount, count, total, isOldest, onClick }: ARAgingBarProps) {
  const percent = total > 0 ? (amount / total) * 100 : 0;

  const getColor = () => {
    if (label.includes('0-30')) return 'bg-green-500';
    if (label.includes('31-60')) return 'bg-yellow-500';
    if (label.includes('61-90')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{count} claims</span>
          <span className={`text-sm font-bold ${isOldest && amount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            ${formatCurrency(amount)}
          </span>
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

// Payer mix bar component - Clickable
interface PayerMixBarProps {
  payer: string;
  revenue: number;
  claimsCount: number;
  percent: number;
  colorIndex: number;
  onClick: () => void;
}

function PayerMixBar({ payer, revenue, claimsCount, percent, colorIndex, onClick }: PayerMixBarProps) {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  const color = colors[colorIndex % colors.length];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {payer.replace(/_/g, ' ')}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{claimsCount} claims</span>
          <span className="text-sm font-bold text-gray-900">
            ${formatCurrency(revenue)}
          </span>
          <span className="text-xs text-gray-500 w-10 text-right">
            {percent.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

// Health indicator component - Clickable
interface HealthIndicatorProps {
  label: string;
  value: number;
  suffix: string;
  target: number;
  isLowerBetter?: boolean;
  description: string;
  onClick: () => void;
}

function HealthIndicator({ label, value, suffix, target, isLowerBetter = false, description, onClick }: HealthIndicatorProps) {
  const isGood = isLowerBetter ? value <= target : value >= target;
  const isMedium = isLowerBetter
    ? value <= target * 1.5 && value > target
    : value >= target * 0.7 && value < target;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:shadow-sm transition-all"
    >
      <div className={`w-3 h-3 rounded-full ${
        isGood ? 'bg-green-500' : isMedium ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className={`text-lg font-bold ${
            isGood ? 'text-green-600' : isMedium ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {value}{suffix}
          </span>
        </div>
        <p className="text-xs text-gray-500">{description} (Target: {target}{suffix})</p>
      </div>
    </div>
  );
}

// Empty chart placeholder
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[220px] bg-gray-50 rounded-lg">
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
