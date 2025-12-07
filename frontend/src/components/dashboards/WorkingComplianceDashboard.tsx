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
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { complianceDashboardService, ComplianceMetric, AuditItem } from '../../services/complianceDashboard.service';

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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    'completed': 'success',
    'resolved': 'success',
    'in-progress': 'info',
    'open': 'warning',
    'pending': 'warning',
    'overdue': 'danger',
    'expired': 'danger'
  };

  return <Badge variant={variants[status] || 'gray'} size="sm">{status ? status.replace('_', ' ') : 'Unknown'}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, any> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'gray'
  };

  return <Badge variant={variants[priority] || 'gray'} size="sm">{priority}</Badge>;
}

export function WorkingComplianceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any | null>(null); // Simplified typing for now
  const [complianceItems, setComplianceItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock chart data (Still kept mock as no endpoint yet for compliance trend chart time series)
  const complianceTrendData = [
    { label: 'Jan', value: 82.5 },
    { label: 'Feb', value: 84.2 },
    { label: 'Mar', value: 85.8 },
    { label: 'Apr', value: 86.5 },
    { label: 'May', value: 87.0 },
    { label: 'Jun', value: 87.5 }
  ];

  const trainingCompletionData = [
    { label: 'Week 1', value: 45 },
    { label: 'Week 2', value: 67 },
    { label: 'Week 3', value: 82 },
    { label: 'Week 4', value: 94 }
  ];

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.organizationId) return;

      try {
        setLoading(true);
        const data = await complianceDashboardService.getComplianceData(user.organizationId);

        // Transform metrics list to object for the view
        const metricsObj = {
          hipaaComplianceScore: data.metrics.find(m => m.area.includes('HIPAA'))?.score || 0,
          activeAudits: data.metrics.find(m => m.area.includes('EVV'))?.status === 'non-compliant' ? 1 : 0,
          expiredCertifications: data.items.filter(i => i.category === 'Certification').length,
          pendingTrainings: 0, // Placeholder
          securityIncidents: 0,
          dataBreaches: 0
        };

        setMetrics(metricsObj);
        setComplianceItems(data.items);
      } catch (error) {
        console.error("Failed to load compliance data", error);
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

  const getComplianceColor = () => {
    if (metrics.hipaaComplianceScore >= 85) return 'text-success-600';
    if (metrics.hipaaComplianceScore >= 70) return 'text-warning-600';
    return 'text-danger-600';
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Compliance & Security Management
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. HIPAA compliance, audit management, and regulatory oversight
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

        {/* Critical Alerts */}
        {(metrics.expiredCertifications > 0 || metrics.securityIncidents > 0) && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="danger"
              title="🚨 Critical Compliance Issues Detected"
            >
              {metrics.expiredCertifications} expired certifications, {metrics.securityIncidents} security incidents
            </Alert>
          </div>
        )}

        {/* HIPAA Compliance Score & Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {/* HIPAA Score Ring */}
          <Card className="text-center">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              <ShieldCheckIcon className="h-5 w-5 inline mr-2 text-primary-600" />
              HIPAA Compliance
            </h3>
            <ProgressRing
              percentage={metrics.hipaaComplianceScore}
              size={160}
              strokeWidth={12}
              color={metrics.hipaaComplianceScore >= 85 ? '#10b981' : metrics.hipaaComplianceScore >= 70 ? '#f59e0b' : '#ef4444'}
              label="Target: 85%"
            />
            <p className={`text-sm font-medium mt-3 ${getComplianceColor()}`}>
              {metrics.hipaaComplianceScore >= 85 ? 'Fully Compliant ✓' : 'Below Target'}
            </p>
          </Card>

          {/* Compliance Trend */}
          <Card className="lg:col-span-2">
            <Chart
              type="area"
              data={complianceTrendData}
              title="HIPAA Compliance Trend (6 Months)"
              height={220}
              width={600}
              showGrid={true}
              showAxes={true}
              color="#10b981"
              gradientFrom="#10b981"
              gradientTo="#34d399"
            />
          </Card>
        </div>

        {/* Training Completion Chart */}
        <div className="mb-8 animate-fade-in">
          <Chart
            type="bar"
            data={trainingCompletionData}
            title="Training Completion Rate (This Month)"
            height={240}
            width={1200}
            showGrid={true}
            showAxes={true}
            showValues={true}
            color="#3b82f6"
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Active Audits"
            value={metrics.activeAudits}
            subtitle="In progress"
            icon={DocumentTextIcon}
            iconColor="bg-primary-600"
            valueColor="text-primary-600"
          />
          <MetricCard
            title="Expired Certifications"
            value={metrics.expiredCertifications}
            subtitle="Need renewal"
            icon={ExclamationTriangleIcon}
            iconColor="bg-danger-600"
            valueColor="text-danger-600"
          />
          <MetricCard
            title="Pending Trainings"
            value={metrics.pendingTrainings}
            subtitle="Staff members"
            icon={AcademicCapIcon}
            iconColor="bg-warning-600"
            valueColor="text-warning-600"
          />
          <MetricCard
            title="Security Incidents"
            value={metrics.securityIncidents}
            subtitle="This month"
            icon={ExclamationTriangleIcon}
            iconColor={metrics.securityIncidents === 0 ? 'bg-success-600' : 'bg-danger-600'}
            valueColor={metrics.securityIncidents === 0 ? 'text-success-600' : 'text-danger-600'}
          />
          <MetricCard
            title="Data Breaches"
            value={metrics.dataBreaches}
            subtitle={metrics.dataBreaches === 0 ? 'Secure' : 'Critical'}
            icon={ShieldCheckIcon}
            iconColor={metrics.dataBreaches === 0 ? 'bg-success-600' : 'bg-danger-600'}
            valueColor={metrics.dataBreaches === 0 ? 'text-success-600' : 'text-danger-600'}
          />
        </div>

        {/* Compliance Items */}
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Items Requiring Attention
          </h3>
          <div className="space-y-4">
            {complianceItems.filter(item => item.status !== 'resolved').map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg transition-all hover:border-primary-300 hover:bg-primary-50 ${item.status === 'open' || item.status === 'overdue' // Mapped status from service
                    ? 'border-danger-300 bg-danger-50'
                    : 'border-gray-200 bg-gray-50'
                  }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">{item.finding}</h4>
                      <PriorityBadge priority={item.severity} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {item.category} • Due: {item.dueDate}
                    </p>
                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                    👁️ View Details
                  </button>
                  {item.status === 'open' && (
                    <button className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors">
                      ✓ Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
