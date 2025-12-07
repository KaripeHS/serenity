import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface TrainingMetrics {
  totalStaff: number;
  complianceRate: number;
  expiringSoon: number;
  overdue: number;
  coursesAvailable: number;
  hoursCompleted: number;
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

interface Certification {
  name: string;
  status: 'current' | 'expires_soon' | 'overdue';
  expiryDate: string;
  daysLeft: number;
}

interface Staff {
  id: number;
  name: string;
  position: string;
  certifications: Certification[];
  completedHours: number;
  requiredHours: number;
}

interface Course {
  id: number;
  title: string;
  provider: string;
  duration: number;
  format: 'In-Person' | 'Online' | 'Hybrid';
  nextDate: string;
  spots: number;
  enrolled: number;
  cost: number;
}

function CertificationBadge({ status, daysLeft }: { status: Certification['status']; daysLeft: number }) {
  const configs = {
    current: { variant: 'success' as const, label: `${daysLeft} days left` },
    expires_soon: { variant: 'warning' as const, label: `${daysLeft} days left` },
    overdue: { variant: 'danger' as const, label: `${Math.abs(daysLeft)} days overdue` }
  };

  const config = configs[status];
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

export function WorkingTrainingDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'compliance' | 'courses'>('dashboard');

  const staffTraining: Staff[] = [
    {
      id: 1,
      name: 'Maria Rodriguez',
      position: 'Senior Caregiver',
      certifications: [
        { name: 'CPR', status: 'expires_soon', expiryDate: '2025-02-15', daysLeft: 26 },
        { name: 'First Aid', status: 'current', expiryDate: '2025-08-20', daysLeft: 186 },
        { name: 'CNA', status: 'current', expiryDate: '2026-03-10', daysLeft: 384 }
      ],
      completedHours: 24,
      requiredHours: 32
    },
    {
      id: 2,
      name: 'David Chen',
      position: 'Physical Therapist',
      certifications: [
        { name: 'PT License', status: 'current', expiryDate: '2025-12-31', daysLeft: 345 },
        { name: 'CPR', status: 'overdue', expiryDate: '2024-12-15', daysLeft: -36 }
      ],
      completedHours: 18,
      requiredHours: 40
    }
  ];

  const availableCourses: Course[] = [
    {
      id: 1,
      title: 'CPR/AED Certification Renewal',
      provider: 'American Red Cross',
      duration: 4,
      format: 'In-Person',
      nextDate: '2025-01-25',
      spots: 12,
      enrolled: 8,
      cost: 65
    },
    {
      id: 2,
      title: 'Advanced Wound Care Management',
      provider: 'WoundSource',
      duration: 8,
      format: 'Online',
      nextDate: '2025-02-01',
      spots: 25,
      enrolled: 15,
      cost: 125
    },
    {
      id: 3,
      title: 'HIPAA Privacy & Security Update 2025',
      provider: 'HIPAA One',
      duration: 2,
      format: 'Online',
      nextDate: '2025-01-30',
      spots: 50,
      enrolled: 32,
      cost: 35
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        totalStaff: 156,
        complianceRate: 87.2,
        expiringSoon: 12,
        overdue: 8,
        coursesAvailable: 25,
        hoursCompleted: 1840
      });
      setLoading(false);
    }, 850);

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

  const getComplianceColor = () => {
    if (metrics.complianceRate >= 90) return 'text-success-600';
    if (metrics.complianceRate >= 80) return 'text-warning-600';
    return 'text-danger-600';
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Training & Compliance Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Staff certification tracking, course management, and compliance monitoring
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
        <div className="mb-8 animate-fade-in">
          <Alert
            variant="danger"
            title={`⚠️ ${metrics.overdue} Staff with Overdue Certifications`}
          >
            <p className="mb-3">{metrics.expiringSoon} additional certifications expire within 30 days</p>
            <button
              onClick={() => setActiveView('compliance')}
              className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
            >
              Review Compliance
            </button>
          </Alert>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-8 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'dashboard', label: 'Dashboard', count: null },
              { key: 'compliance', label: 'Compliance', count: metrics.overdue + metrics.expiringSoon },
              { key: 'courses', label: 'Courses', count: availableCourses.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeView === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <Badge variant="danger" size="sm">{tab.count}</Badge>
                  )}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
              <MetricCard
                title="Overall Compliance"
                value={`${metrics.complianceRate}%`}
                subtitle="Target: 95%"
                icon={AcademicCapIcon}
                iconColor={metrics.complianceRate >= 90 ? 'bg-success-600' : 'bg-warning-600'}
                valueColor={getComplianceColor()}
              />
              <MetricCard
                title="Expiring Soon"
                value={metrics.expiringSoon}
                subtitle="Next 30 days"
                icon={ClockIcon}
                iconColor="bg-warning-600"
                valueColor="text-warning-600"
              />
              <MetricCard
                title="Overdue"
                value={metrics.overdue}
                subtitle="Immediate action"
                icon={ExclamationTriangleIcon}
                iconColor="bg-danger-600"
                valueColor="text-danger-600"
              />
              <MetricCard
                title="Training Hours YTD"
                value={metrics.hoursCompleted}
                subtitle="11.8 avg per staff"
                icon={BookOpenIcon}
                iconColor="bg-primary-600"
                valueColor="text-primary-600"
              />
            </div>

            <Card className="animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Training Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="p-4 bg-info-50 border border-info-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{course.title}</h4>
                      <Badge variant="info" size="sm">{course.format}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {course.duration} hours • {new Date(course.nextDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-info-700">
                      {course.enrolled}/{course.spots} enrolled
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Compliance View */}
        {activeView === 'compliance' && (
          <Card className="animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Staff Certification Compliance</h3>
            <div className="space-y-4">
              {staffTraining.map((staff) => (
                <div key={staff.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{staff.name}</h4>
                      <p className="text-sm text-gray-600">{staff.position}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Training Progress: {staff.completedHours}/{staff.requiredHours} hours
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
                      📧 Send Reminder
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {staff.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          cert.status === 'overdue'
                            ? 'bg-danger-50 border-danger-200'
                            : cert.status === 'expires_soon'
                            ? 'bg-warning-50 border-warning-200'
                            : 'bg-success-50 border-success-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900 text-sm">{cert.name}</span>
                          <CertificationBadge status={cert.status} daysLeft={cert.daysLeft} />
                        </div>
                        <p className="text-xs text-gray-600">
                          Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Courses View */}
        {activeView === 'courses' && (
          <Card className="animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Available Training Courses</h3>
            <div className="space-y-4">
              {availableCourses.map((course) => (
                <div key={course.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                        <Badge variant="info" size="sm">{course.format}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {course.provider} • {course.duration} hours
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>📅 {new Date(course.nextDate).toLocaleDateString()}</span>
                        <span>👥 {course.enrolled}/{course.spots} enrolled</span>
                        <span>💰 {course.cost === 0 ? 'Free' : `$${course.cost}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={course.enrolled >= course.spots}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        course.enrolled >= course.spots
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-success-600 text-white hover:bg-success-700'
                      }`}
                    >
                      {course.enrolled >= course.spots ? '✓ Full' : '➕ Enroll Staff'}
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                      👁️ View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
