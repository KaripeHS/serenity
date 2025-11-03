import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Chart } from '../ui/Chart';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import { ProgressRing } from '../ui/ProgressRing';
import { StatCard } from '../ui/StatCard';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface SystemMetrics {
  activePatients: number;
  activeStaff: number;
  monthlyRevenue: number;
  completionRate: number;
  complianceScore: number;
}

export function WorkingExecutiveDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const revenueData = [
    { label: 'Jan', value: 752 },
    { label: 'Feb', value: 798 },
    { label: 'Mar', value: 823 },
    { label: 'Apr', value: 801 },
    { label: 'May', value: 856 },
    { label: 'Jun', value: 892 }
  ];

  const visitData = [
    { label: 'Mon', value: 127 },
    { label: 'Tue', value: 134 },
    { label: 'Wed', value: 142 },
    { label: 'Thu', value: 138 },
    { label: 'Fri', value: 151 },
    { label: 'Sat', value: 89 },
    { label: 'Sun', value: 67 }
  ];

  const trendData = [752, 798, 823, 801, 856, 892];

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

        {/* Key Metrics with Trends */}
        <KPIGrid columns={4} className="mb-8 animate-fade-in">
          <KPIWidget
            title="Active Patients"
            value={metrics.activePatients.toLocaleString()}
            subtitle="Across Ohio"
            change={12}
            changeLabel="vs last month"
            trendData={[782, 805, 819, 831, 847]}
            icon={UserGroupIcon}
            iconColor="bg-patient-600"
            status="success"
          />
          <KPIWidget
            title="Active Staff"
            value={metrics.activeStaff}
            subtitle="Caregivers & Nurses"
            change={5}
            changeLabel="vs last month"
            trendData={[148, 150, 152, 154, 156]}
            icon={UsersIcon}
            iconColor="bg-caregiver-600"
            status="success"
          />
          <KPIWidget
            title="Monthly Revenue"
            value={formatRevenue(metrics.monthlyRevenue)}
            subtitle="June 2024"
            change={8}
            changeLabel="vs last month"
            trendData={trendData}
            icon={CurrencyDollarIcon}
            iconColor="bg-success-600"
            status="success"
          />
          <KPIWidget
            title="Completion Rate"
            value={`${metrics.completionRate}%`}
            subtitle="Visit Success Rate"
            change={2.3}
            changeLabel="vs last month"
            trendData={[92.1, 92.8, 93.5, 94.1, 94.8]}
            icon={CheckCircleIcon}
            iconColor="bg-primary-600"
            status="success"
          />
        </KPIGrid>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          {/* Revenue Trend Chart */}
          <div>
            <Chart
              type="area"
              data={revenueData}
              title="Revenue Trend (Last 6 Months)"
              height={280}
              width={600}
              showGrid={true}
              showAxes={true}
              color="#10b981"
              gradientFrom="#10b981"
              gradientTo="#34d399"
            />
            <div className="mt-2 px-4">
              <p className="text-sm text-success-600 font-medium">
                ↑ +8% growth this month • ${(revenueData[5].value - revenueData[4].value)}K increase
              </p>
            </div>
          </div>

          {/* Weekly Visits Chart */}
          <div>
            <Chart
              type="bar"
              data={visitData}
              title="Daily Visits (This Week)"
              height={280}
              width={600}
              showGrid={true}
              showAxes={true}
              showValues={true}
              color="#3b82f6"
            />
            <div className="mt-2 px-4">
              <p className="text-sm text-primary-600 font-medium">
                Average: {Math.round(visitData.reduce((sum, d) => sum + d.value, 0) / visitData.length)} visits/day
              </p>
            </div>
          </div>
        </div>

        {/* Compliance & Performance Rings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <Card className="text-center">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              Compliance Score
            </h3>
            <ProgressRing
              percentage={metrics.complianceScore}
              size={150}
              strokeWidth={10}
              color="#10b981"
              label="HIPAA & Medicaid"
            />
          </Card>

          <Card className="text-center">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              Visit Completion
            </h3>
            <ProgressRing
              percentage={metrics.completionRate}
              size={150}
              strokeWidth={10}
              color="#3b82f6"
              label="Success Rate"
            />
          </Card>

          <Card className="text-center">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              Staff Utilization
            </h3>
            <ProgressRing
              percentage={82.5}
              size={150}
              strokeWidth={10}
              color="#f59e0b"
              label="Average Capacity"
            />
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
