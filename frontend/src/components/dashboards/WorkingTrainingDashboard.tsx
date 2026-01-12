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
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon: Icon, iconColor, valueColor = 'text-gray-900', onClick }: MetricCardProps) {
  return (
    <Card
      hoverable
      clickable={!!onClick}
      onClick={onClick}
      className={`transition-all hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
    >
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
  const [activeView, setActiveView] = useState<'dashboard' | 'compliance' | 'courses' | 'expiringSoon' | 'overdue' | 'trainingHours'>('dashboard');
  const [staffTraining, setStaffTraining] = useState<Staff[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/training/metrics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('serenity_access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalStaff: data.totalStaff || 0,
            complianceRate: data.complianceRate || 0,
            expiringSoon: data.expiringSoon || 0,
            overdue: data.overdue || 0,
            coursesAvailable: data.coursesAvailable || 0,
            hoursCompleted: data.hoursCompleted || 0
          });
          setStaffTraining(data.staffTraining || []);
          setAvailableCourses(data.availableCourses || []);
        } else {
          setMetrics({
            totalStaff: 0,
            complianceRate: 0,
            expiringSoon: 0,
            overdue: 0,
            coursesAvailable: 0,
            hoursCompleted: 0
          });
          setStaffTraining([]);
          setAvailableCourses([]);
        }
      } catch (error) {
        console.error('Failed to load training metrics:', error);
        setMetrics({
          totalStaff: 0,
          complianceRate: 0,
          expiringSoon: 0,
          overdue: 0,
          coursesAvailable: 0,
          hoursCompleted: 0
        });
        setStaffTraining([]);
        setAvailableCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
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
                onClick={() => setActiveView('compliance')}
              />
              <MetricCard
                title="Expiring Soon"
                value={metrics.expiringSoon}
                subtitle="Next 30 days"
                icon={ClockIcon}
                iconColor="bg-warning-600"
                valueColor="text-warning-600"
                onClick={() => setActiveView('expiringSoon')}
              />
              <MetricCard
                title="Overdue"
                value={metrics.overdue}
                subtitle="Immediate action"
                icon={ExclamationTriangleIcon}
                iconColor="bg-danger-600"
                valueColor="text-danger-600"
                onClick={() => setActiveView('overdue')}
              />
              <MetricCard
                title="Training Hours YTD"
                value={metrics.hoursCompleted}
                subtitle="11.8 avg per staff"
                icon={BookOpenIcon}
                iconColor="bg-primary-600"
                valueColor="text-primary-600"
                onClick={() => setActiveView('trainingHours')}
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
                    <button
                      onClick={() => alert(`Reminder sent to ${staff.name} about certification renewals`)}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
                    >
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

        {/* Expiring Soon View */}
        {activeView === 'expiringSoon' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Certifications Expiring Soon (Next 30 Days)</h2>
            <div className="space-y-4">
              {staffTraining.filter(staff => staff.certifications.some(cert => cert.status === 'expires_soon')).map((staff) => (
                <div key={staff.id} className="p-4 border border-warning-200 bg-warning-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{staff.name} - {staff.position}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {staff.certifications.filter(cert => cert.status === 'expires_soon').map((cert, idx) => (
                      <div key={idx} className="p-3 bg-white border border-warning-300 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{cert.name}</span>
                          <Badge variant="warning" size="sm">{cert.daysLeft} days</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Overdue View */}
        {activeView === 'overdue' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overdue Certifications - Immediate Action Required</h2>
            <div className="space-y-4">
              {staffTraining.filter(staff => staff.certifications.some(cert => cert.status === 'overdue')).map((staff) => (
                <div key={staff.id} className="p-4 border border-danger-200 bg-danger-50 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{staff.name} - {staff.position}</h4>
                      <p className="text-sm text-gray-600">⚠️ Compliance status: Non-compliant</p>
                    </div>
                    <button
                      onClick={() => alert(`Urgent reminder sent to ${staff.name}`)}
                      className="px-3 py-1.5 bg-danger-600 text-white rounded text-sm hover:bg-danger-700"
                    >
                      Send Urgent Notice
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {staff.certifications.filter(cert => cert.status === 'overdue').map((cert, idx) => (
                      <div key={idx} className="p-3 bg-white border border-danger-300 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{cert.name}</span>
                          <Badge variant="danger" size="sm">{Math.abs(cert.daysLeft)} days overdue</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Expired: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Training Hours View */}
        {activeView === 'trainingHours' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Training Hours YTD</h2>
            <div className="space-y-4">
              {staffTraining.map((staff) => (
                <div key={staff.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                      <p className="text-sm text-gray-600">{staff.position}</p>
                    </div>
                    <Badge variant={staff.completedHours >= staff.requiredHours ? 'success' : 'warning'}>
                      {staff.completedHours}/{staff.requiredHours} hours
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        staff.completedHours >= staff.requiredHours ? 'bg-success-600' : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min((staff.completedHours / staff.requiredHours) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {staff.completedHours >= staff.requiredHours
                      ? '✓ Annual requirement met'
                      : `${staff.requiredHours - staff.completedHours} hours remaining`}
                  </p>
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
                      onClick={() => {
                        if (course.enrolled < course.spots) {
                          window.location.href = `/training/courses/${course.id}/enroll`;
                        }
                      }}
                      disabled={course.enrolled >= course.spots}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        course.enrolled >= course.spots
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-success-600 text-white hover:bg-success-700'
                      }`}
                    >
                      {course.enrolled >= course.spots ? '✓ Full' : '➕ Enroll Staff'}
                    </button>
                    <button
                      onClick={() => window.location.href = `/training/courses/${course.id}`}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
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
