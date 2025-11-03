import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface HRMetrics {
  totalStaff: number;
  openPositions: number;
  pendingApplications: number;
  trainingCompliance: number;
  avgTimeToHire: number;
  turnoverRate: number;
}

interface Application {
  id: number;
  name: string;
  position: string;
  status: 'new' | 'reviewing' | 'interview' | 'scheduled' | 'rejected';
  experience: string;
  location: string;
  applied: string;
}

interface Staff {
  id: number;
  name: string;
  position: string;
  department: string;
  hireDate: string;
  certifications: string[];
  trainingDue: string[];
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

function ApplicationStatusBadge({ status }: { status: Application['status'] }) {
  const variants: Record<Application['status'], { variant: any; label: string }> = {
    new: { variant: 'info', label: 'New' },
    reviewing: { variant: 'warning', label: 'Reviewing' },
    interview: { variant: 'success', label: 'Interview' },
    scheduled: { variant: 'primary', label: 'Scheduled' },
    rejected: { variant: 'danger', label: 'Rejected' }
  };

  const config = variants[status];
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

export function WorkingHRDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'applications' | 'staff' | 'training'>('dashboard');

  const [applications] = useState<Application[]>([
    { id: 1, name: 'Sarah Chen', position: 'Registered Nurse', status: 'new', experience: '5 years', location: 'Columbus, OH', applied: '2 hours ago' },
    { id: 2, name: 'Michael Johnson', position: 'Physical Therapist', status: 'reviewing', experience: '8 years', location: 'Dublin, OH', applied: '4 hours ago' },
    { id: 3, name: 'Lisa Rodriguez', position: 'Home Health Aide', status: 'interview', experience: '3 years', location: 'Westerville, OH', applied: 'yesterday' },
    { id: 4, name: 'David Park', position: 'Occupational Therapist', status: 'new', experience: '6 years', location: 'Powell, OH', applied: '2 days ago' }
  ]);

  const [staffList] = useState<Staff[]>([
    { id: 1, name: 'Maria Rodriguez', position: 'Senior Caregiver', department: 'Clinical', hireDate: '2021-03-15', certifications: ['CNA', 'CPR'], trainingDue: [] },
    { id: 2, name: 'David Chen', position: 'Physical Therapist', department: 'Therapy', hireDate: '2020-08-22', certifications: ['PT', 'CPR'], trainingDue: ['CPR Renewal'] },
    { id: 3, name: 'Jennifer Miller', position: 'Registered Nurse', department: 'Clinical', hireDate: '2019-11-10', certifications: ['RN', 'BLS'], trainingDue: ['HIPAA Update'] },
    { id: 4, name: 'Robert Thompson', position: 'Home Health Aide', department: 'Care', hireDate: '2022-01-05', certifications: ['HHA'], trainingDue: ['CPR Renewal', 'First Aid'] }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        totalStaff: 156,
        openPositions: 12,
        pendingApplications: 28,
        trainingCompliance: 94.5,
        avgTimeToHire: 18,
        turnoverRate: 8.2
      });
      setLoading(false);
    }, 800);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Human Resources Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Staff management, recruitment, and compliance tracking
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

        {/* Navigation Tabs */}
        <Card className="mb-8 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'dashboard', label: 'Dashboard', count: null },
              { key: 'applications', label: 'Applications', count: applications.filter(app => app.status === 'new').length },
              { key: 'staff', label: 'Staff', count: staffList.filter(staff => staff.trainingDue.length > 0).length },
              { key: 'training', label: 'Training', count: 8 }
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
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
              <MetricCard
                title="Total Staff"
                value={metrics.totalStaff}
                subtitle="+3 this month"
                icon={UserGroupIcon}
                iconColor="bg-caregiver-600"
              />
              <MetricCard
                title="Open Positions"
                value={metrics.openPositions}
                subtitle="Need urgent filling"
                icon={BriefcaseIcon}
                iconColor="bg-danger-600"
                valueColor="text-danger-600"
              />
              <MetricCard
                title="Pending Applications"
                value={metrics.pendingApplications}
                subtitle="Awaiting review"
                icon={DocumentTextIcon}
                iconColor="bg-primary-600"
                valueColor="text-primary-600"
              />
              <MetricCard
                title="Training Compliance"
                value={`${metrics.trainingCompliance}%`}
                subtitle="Above target"
                icon={AcademicCapIcon}
                iconColor="bg-success-600"
                valueColor="text-success-600"
              />
              <MetricCard
                title="Avg Time to Hire"
                value={`${metrics.avgTimeToHire} days`}
                subtitle="-2 days improved"
                icon={ClockIcon}
                iconColor="bg-info-600"
              />
              <MetricCard
                title="Turnover Rate"
                value={`${metrics.turnoverRate}%`}
                subtitle="Below industry avg"
                icon={ArrowTrendingDownIcon}
                iconColor="bg-success-600"
                valueColor="text-success-600"
              />
            </div>

            {/* Alerts */}
            <div className="space-y-4 mb-8 animate-fade-in">
              <Alert variant="danger" title="Training Renewals Due">
                8 staff members need CPR renewal by Friday
              </Alert>
              <Alert variant="warning" title="Open Positions Critical">
                3 RN positions urgently needed in Columbus area
              </Alert>
              <Alert variant="info" title="Performance Reviews">
                12 quarterly reviews scheduled this week
              </Alert>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-600 hover:bg-primary-50 transition-all">
                      <p className="font-medium text-gray-900">{app.name} - {app.position}</p>
                      <p className="text-sm text-gray-600">Applied {app.applied} • {app.location}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveView('applications')}
                    className="w-full py-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                  >
                    View All Applications →
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Training Alerts</h3>
                <div className="space-y-3">
                  {staffList.filter(staff => staff.trainingDue.length > 0).map((staff) => (
                    <div key={staff.id} className="p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {staff.trainingDue.map((training, i) => (
                          <Badge key={i} variant="warning" size="sm">{training}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveView('training')}
                    className="w-full py-2 text-warning-600 hover:text-warning-700 text-sm font-medium transition-colors"
                  >
                    Manage Training →
                  </button>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Applications View */}
        {activeView === 'applications' && (
          <Card className="animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Job Applications</h3>
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{app.name}</h4>
                          <p className="text-sm text-gray-600">{app.position} • {app.experience} experience</p>
                          <p className="text-xs text-gray-500 mt-1">📍 {app.location} • Applied {app.applied}</p>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {app.status === 'new' && (
                          <>
                            <button className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors">
                              ✓ Move to Interview
                            </button>
                            <button className="px-3 py-1.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors">
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {app.status === 'interview' && (
                          <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                            📅 Schedule Interview
                          </button>
                        )}
                        <button className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                          👁️ View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Staff View */}
        {activeView === 'staff' && (
          <Card className="animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Staff Directory</h3>
            <div className="space-y-4">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-4 border rounded-lg transition-all ${
                    staff.trainingDue.length > 0
                      ? 'border-warning-300 bg-warning-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{staff.name}</h4>
                          <p className="text-sm text-gray-600">{staff.position} • {staff.department} Department</p>
                          <p className="text-xs text-gray-500 mt-1">📅 Hired: {new Date(staff.hireDate).toLocaleDateString()}</p>
                        </div>
                        {staff.trainingDue.length > 0 && (
                          <Badge variant="warning">Training Due</Badge>
                        )}
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Certifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {staff.certifications.map((cert, i) => (
                            <Badge key={i} variant="success" size="sm">{cert}</Badge>
                          ))}
                        </div>
                      </div>

                      {staff.trainingDue.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-danger-700 mb-1">Training Due:</p>
                          <div className="flex flex-wrap gap-1">
                            {staff.trainingDue.map((training, i) => (
                              <Badge key={i} variant="danger" size="sm">{training}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                          👁️ View Profile
                        </button>
                        {staff.trainingDue.length > 0 && (
                          <button className="px-3 py-1.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors">
                            📧 Send Training Reminder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Training View */}
        {activeView === 'training' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <Alert variant="danger" title="🚨 Urgent Training Renewals (8 staff)">
                CPR certification expires this Friday for 8 staff members
              </Alert>
              <button className="mt-4 w-full md:w-auto px-6 py-2 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 transition-colors">
                📧 Send Renewal Reminders
              </button>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Training Courses</h3>
              <div className="space-y-3">
                {[
                  { name: 'Advanced Wound Care', duration: '4 hours', available: 'Next Tuesday' },
                  { name: 'HIPAA Compliance Update', duration: '2 hours', available: 'Online' },
                  { name: 'Emergency Response', duration: '6 hours', available: 'This Friday' }
                ].map((course, index) => (
                  <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-4 bg-info-50 rounded-lg border border-info-200">
                    <div>
                      <p className="font-medium text-gray-900">{course.name}</p>
                      <p className="text-sm text-gray-600">{course.duration} • {course.available}</p>
                    </div>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
                      Enroll Staff
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
