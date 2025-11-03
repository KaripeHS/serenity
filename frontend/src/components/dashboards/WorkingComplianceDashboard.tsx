import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface ComplianceMetrics {
  hipaaComplianceScore: number;
  activeAudits: number;
  expiredCertifications: number;
  pendingTrainings: number;
  securityIncidents: number;
  dataBreaches: number;
}

interface ComplianceItem {
  id: string;
  type: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue' | 'expired';
  dueDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
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

function StatusBadge({ status }: { status: ComplianceItem['status'] }) {
  const variants: Record<ComplianceItem['status'], any> = {
    completed: 'success',
    in_progress: 'info',
    pending: 'warning',
    overdue: 'danger',
    expired: 'danger'
  };

  return <Badge variant={variants[status]} size="sm">{status.replace('_', ' ')}</Badge>;
}

function PriorityBadge({ priority }: { priority: ComplianceItem['priority'] }) {
  const variants: Record<ComplianceItem['priority'], any> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'gray'
  };

  return <Badge variant={variants[priority]} size="sm">{priority}</Badge>;
}

export function WorkingComplianceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const complianceItems: ComplianceItem[] = [
    { id: 'HIPAA001', type: 'HIPAA', description: 'Annual HIPAA Risk Assessment', status: 'completed', dueDate: '2024-12-31', priority: 'high' },
    { id: 'CERT002', type: 'Certification', description: 'CPR Certification - Maria Rodriguez', status: 'expired', dueDate: '2024-01-15', priority: 'critical' },
    { id: 'TRAIN003', type: 'Training', description: 'HIPAA Privacy Training - New Hires', status: 'pending', dueDate: '2024-01-20', priority: 'medium' },
    { id: 'AUDIT004', type: 'Audit', description: 'Q1 Internal Compliance Audit', status: 'in_progress', dueDate: '2024-03-31', priority: 'high' },
    { id: 'SEC005', type: 'Security', description: 'Password Policy Compliance Check', status: 'overdue', dueDate: '2024-01-10', priority: 'critical' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        hipaaComplianceScore: 87.5,
        activeAudits: 3,
        expiredCertifications: 8,
        pendingTrainings: 12,
        securityIncidents: 0,
        dataBreaches: 0
      });
      setLoading(false);
    }, 950);

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
    <div className="min-h-screen bg-gray-50">
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

        {/* HIPAA Compliance Score */}
        <Card className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              HIPAA Compliance Score
            </h3>
            <span className={`text-4xl font-bold ${getComplianceColor()}`}>
              {metrics.hipaaComplianceScore}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.hipaaComplianceScore >= 85
                  ? 'bg-success-600'
                  : metrics.hipaaComplianceScore >= 70
                  ? 'bg-warning-600'
                  : 'bg-danger-600'
              }`}
              style={{ width: `${metrics.hipaaComplianceScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">Target: 85% minimum for full compliance</p>
        </Card>

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
            {complianceItems.filter(item => item.status !== 'completed').map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg transition-all hover:border-primary-300 hover:bg-primary-50 ${
                  item.status === 'overdue' || item.status === 'expired'
                    ? 'border-danger-300 bg-danger-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">{item.description}</h4>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {item.type} • Due: {item.dueDate}
                    </p>
                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(item.status === 'pending' || item.status === 'overdue') && (
                    <button className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors">
                      ✓ Mark Complete
                    </button>
                  )}
                  {item.status === 'expired' && (
                    <>
                      <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                        📅 Schedule Renewal
                      </button>
                      <button className="px-3 py-1.5 bg-warning-600 text-white rounded-lg text-sm font-medium hover:bg-warning-700 transition-colors">
                        ⏰ Request Extension
                      </button>
                    </>
                  )}
                  <button className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                    👁️ View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
