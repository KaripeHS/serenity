import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Chart } from '../ui/Chart';
import { ProgressRing } from '../ui/ProgressRing';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  HeartIcon,
  BeakerIcon,
  DocumentCheckIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { clinicalDashboardService, ClinicalMetrics } from '../../services/clinicalDashboard.service';

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

export function WorkingClinicalDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ClinicalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // State for charts
  const [chartData, setChartData] = useState<{ vitals: any[]; admissions: any[] }>({
    vitals: [],
    admissions: []
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.organizationId) return;

      try {
        setLoading(true);
        const [metricsData, chartsData] = await Promise.all([
          clinicalDashboardService.getMetrics(user.organizationId),
          clinicalDashboardService.getChartsData(user.organizationId)
        ]);
        setMetrics(metricsData);
        setChartData(chartsData);
      } catch (error) {
        console.error("Failed to load clinical dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.organizationId]);

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              Clinical Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Patient care monitoring, clinical alerts, and care plan management
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

        {/* Critical Alerts Banner */}
        {metrics.criticalAlerts > 0 && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="danger"
              title={`🚨 ${metrics.criticalAlerts} Critical Clinical Alerts`}
            >
              <p className="mb-3">Immediate attention required</p>
              <button className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors">
                View Alerts
              </button>
            </Alert>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Active Patients"
            value={metrics.activePatients}
            subtitle="❤️ All monitored"
            icon={UserGroupIcon}
            iconColor="bg-patient-600"
          />
          <MetricCard
            title="Medication Compliance"
            value={`${metrics.medicationCompliance}%`}
            subtitle="Above target (95%)"
            icon={BeakerIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
          />
          <MetricCard
            title="Vital Signs Updated"
            value={metrics.vitalSignsUpdated}
            subtitle="Today's recordings"
            icon={HeartIcon}
            iconColor="bg-primary-600"
            valueColor="text-primary-600"
          />
          <MetricCard
            title="Care Plan Reviews"
            value={metrics.careplanReviews}
            subtitle="Pending this week"
            icon={DocumentCheckIcon}
            iconColor="bg-purple-600"
            valueColor="text-purple-600"
          />
          <MetricCard
            title="New Admissions"
            value={metrics.admissionsToday}
            subtitle="Today"
            icon={UserPlusIcon}
            iconColor="bg-success-600"
          />
          <MetricCard
            title="Critical Alerts"
            value={metrics.criticalAlerts}
            subtitle="Require attention"
            icon={ExclamationTriangleIcon}
            iconColor={metrics.criticalAlerts > 3 ? 'bg-danger-600' : 'bg-warning-600'}
            valueColor={metrics.criticalAlerts > 3 ? 'text-danger-600' : 'text-warning-600'}
          />
        </div>

        {/* Patient Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">High Priority Patients</h3>
            <div className="space-y-3">
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Eleanor Johnson (89)</p>
                    <p className="text-sm text-gray-600">Post-surgical wound care • Columbus</p>
                  </div>
                  <Badge variant="danger" size="sm">Critical</Badge>
                </div>
                <p className="text-sm text-danger-700 mt-2">
                  ⚠️ Infection risk - Daily monitoring required
                </p>
              </div>

              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Robert Smith (76)</p>
                    <p className="text-sm text-gray-600">Diabetes management • Dublin</p>
                  </div>
                  <Badge variant="warning" size="sm">Monitor</Badge>
                </div>
                <p className="text-sm text-warning-700 mt-2">
                  📊 Blood sugar trending high
                </p>
              </div>

              <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Mary Williams (82)</p>
                    <p className="text-sm text-gray-600">Medication management • Westerville</p>
                  </div>
                  <Badge variant="info" size="sm">Review</Badge>
                </div>
                <p className="text-sm text-info-700 mt-2">
                  📅 Care plan review due tomorrow
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Tasks Today</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">🩺 Wound Assessments</p>
                  <p className="text-sm text-gray-600">23 patients scheduled</p>
                </div>
                <Badge variant="info" size="sm">18/23</Badge>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">💊 Medication Reviews</p>
                  <p className="text-sm text-gray-600">15 patients scheduled</p>
                </div>
                <Badge variant="success" size="sm">15/15</Badge>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">📋 Care Plan Updates</p>
                  <p className="text-sm text-gray-600">8 patients scheduled</p>
                </div>
                <Badge variant="warning" size="sm">3/8</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Clinical Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {/* Medication Compliance Ring */}
          <Card className="text-center">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              Medication Compliance
            </h3>
            <ProgressRing
              percentage={metrics.medicationCompliance}
              size={150}
              strokeWidth={10}
              color="#10b981"
              label="Target: 95%"
            />
            <p className="text-sm text-success-600 font-medium mt-3">
              Above target 🎯
            </p>
          </Card>

          {/* Vital Signs Trend */}
          <Card className="lg:col-span-2">
            <Chart
              type="line"
              data={chartData.vitals}
              title="Vital Signs Recorded (This Week)"
              height={220}
              width={600}
              showGrid={true}
              showAxes={true}
              color="#3b82f6"
            />
          </Card>
        </div>

        {/* Admissions Chart */}
        <div className="mb-8 animate-fade-in">
          <Chart
            type="bar"
            data={chartData.admissions}
            title="Monthly Admissions Trend"
            height={240}
            width={1200}
            showGrid={true}
            showAxes={true}
            showValues={true}
            color="#8b5cf6"
          />
        </div>

        {/* Quick Actions */}
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="px-4 py-3 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 transition-all hover:scale-105">
              🚨 View Critical Alerts
            </button>
            <button className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all hover:scale-105">
              📊 Vital Signs Report
            </button>
            <button className="px-4 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-all hover:scale-105">
              💊 Medication Adherence
            </button>
            <button className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all hover:scale-105">
              📋 Care Plan Builder
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
