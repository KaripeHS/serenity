import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface TaxMetrics {
  q1Revenue: number;
  q2Revenue: number;
  q3Revenue: number;
  q4Revenue: number;
  annualRevenue: number;
  taxLiability: number;
  payrollTaxes: number;
  salesTax: number;
  nextFilingDate: string;
  pendingDeductions: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  valueColor?: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, iconColor, valueColor = 'text-gray-900' }: MetricCardProps) {
  return (
    <Card hoverable className="transition-all hover:scale-105">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconColor} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

export function WorkingTaxDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<TaxMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        q1Revenue: 2450000,
        q2Revenue: 2680000,
        q3Revenue: 2890000,
        q4Revenue: 3120000,
        annualRevenue: 11140000,
        taxLiability: 1892500,
        payrollTaxes: 478900,
        salesTax: 0,
        nextFilingDate: '2025-01-31',
        pendingDeductions: 81026.50
      });
      setLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Tax Management Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Federal and state tax compliance, filings, and deduction tracking
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Critical Tax Alerts */}
        <div className="mb-8 animate-fade-in">
          <Alert
            variant="danger"
            title="🚨 Tax Filings Due January 31st"
          >
            <p className="mb-3">3 critical filings require immediate attention - Total: $69,315.75</p>
            <button className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors">
              Review Filings
            </button>
          </Alert>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Annual Revenue (2024)"
            value={`$${(metrics.annualRevenue / 1000000).toFixed(1)}M`}
            subtitle="+15.2% vs 2023"
            icon={ChartBarIcon}
            iconColor="bg-primary-600"
            valueColor="text-primary-600"
          />
          <MetricCard
            title="Estimated Tax Liability"
            value={`$${(metrics.taxLiability / 1000).toFixed(0)}K`}
            subtitle="17% effective rate"
            icon={CurrencyDollarIcon}
            iconColor="bg-danger-600"
            valueColor="text-danger-600"
          />
          <MetricCard
            title="YTD Payroll Taxes"
            value={`$${(metrics.payrollTaxes / 1000).toFixed(0)}K`}
            subtitle="On schedule"
            icon={DocumentTextIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
          />
          <MetricCard
            title="Pending Deductions"
            value={`$${(metrics.pendingDeductions / 1000).toFixed(0)}K`}
            subtitle="Q4 2024 total"
            icon={CurrencyDollarIcon}
            iconColor="bg-info-600"
            valueColor="text-info-600"
          />
        </div>

        {/* Quarterly Revenue Chart */}
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            2024 Quarterly Revenue Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { quarter: 'Q1', revenue: metrics.q1Revenue, growth: '+12%' },
              { quarter: 'Q2', revenue: metrics.q2Revenue, growth: '+9%' },
              { quarter: 'Q3', revenue: metrics.q3Revenue, growth: '+8%' },
              { quarter: 'Q4', revenue: metrics.q4Revenue, growth: '+8%' }
            ].map((q) => (
              <div key={q.quarter} className="p-4 bg-info-50 border border-info-200 rounded-lg text-center">
                <h4 className="text-sm font-semibold text-info-700 mb-2">
                  {q.quarter} 2024
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  ${(q.revenue / 1000000).toFixed(1)}M
                </p>
                <Badge variant="success" size="sm">{q.growth}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
