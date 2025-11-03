import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SystemMetrics {
  activePatients: number;
  activeStaff: number;
  monthlyRevenue: number;
  completionRate: number;
  complianceScore: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'neutral';
  icon: React.ComponentType<any>;
  iconColor: string;
}

function MetricCard({ title, value, change, changeType, icon: Icon, iconColor }: MetricCardProps) {
  return (
    <Card hoverable className="transition-all hover:scale-105">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        <Badge variant={changeType === 'positive' ? 'success' : 'default'} size="sm">
          {change}
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconColor} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {value}
        </p>
      </div>
    </Card>
  );
}

export function WorkingExecutiveDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading metrics
    const timer = setTimeout(() => {
      setMetrics({
        activePatients: 847,
        activeStaff: 156,
        monthlyRevenue: 892450,
        completionRate: 94.8,
        complianceScore: 98.2
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

  const formatRevenue = (amount: number) => {
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Executive Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Here's your business overview.
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Active Patients"
            value={metrics.activePatients.toLocaleString()}
            change="+12%"
            changeType="positive"
            icon={UserGroupIcon}
            iconColor="bg-patient-600"
          />
          <MetricCard
            title="Active Staff"
            value={metrics.activeStaff}
            change="+5%"
            changeType="positive"
            icon={UsersIcon}
            iconColor="bg-caregiver-600"
          />
          <MetricCard
            title="Monthly Revenue"
            value={formatRevenue(metrics.monthlyRevenue)}
            change="+8%"
            changeType="positive"
            icon={CurrencyDollarIcon}
            iconColor="bg-success-600"
          />
          <MetricCard
            title="Completion Rate"
            value={`${metrics.completionRate}%`}
            change="✓"
            changeType="positive"
            icon={CheckCircleIcon}
            iconColor="bg-primary-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ArrowTrendingUpIcon className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Trend
              </h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border-2 border-dashed border-primary-200">
              <div className="text-center">
                <ArrowTrendingUpIcon className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                <p className="text-primary-700 font-medium">Revenue trending up +8% this month</p>
                <p className="text-sm text-primary-600 mt-1">Chart visualization coming soon</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-patient-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Demographics
              </h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-patient-50 to-patient-100 rounded-lg border-2 border-dashed border-patient-200">
              <div className="text-center">
                <UserGroupIcon className="h-12 w-12 text-patient-600 mx-auto mb-3" />
                <p className="text-patient-700 font-medium">847 active patients across Ohio</p>
                <p className="text-sm text-patient-600 mt-1">Demographics chart coming soon</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Executive Alerts */}
        <div className="animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Executive Alerts
          </h3>
          <div className="space-y-4">
            <Alert
              variant="success"
              title="Monthly Goals Exceeded"
              onClose={() => {}}
            >
              Revenue target exceeded by $47K this month. Great work!
            </Alert>

            <Alert
              variant="warning"
              title="Staff Training Due"
            >
              12 staff members need compliance training renewal this week.
            </Alert>

            <Alert
              variant="info"
              title="Compliance Score Update"
            >
              Your organization's compliance score is {metrics.complianceScore}% - excellent performance!
            </Alert>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">View Full Reports</h4>
                  <p className="text-sm text-gray-500">Detailed analytics</p>
                </div>
              </div>
            </Card>

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Financial Overview</h4>
                  <p className="text-sm text-gray-500">Revenue & expenses</p>
                </div>
              </div>
            </Card>

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-caregiver-100 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-caregiver-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Workforce Analytics</h4>
                  <p className="text-sm text-gray-500">Staff performance</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
