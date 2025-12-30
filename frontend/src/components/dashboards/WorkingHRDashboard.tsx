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

  const [applications, setApplications] = useState<Application[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [hiringTrendData, setHiringTrendData] = useState<{ label: string; value: number }[]>([]);
  const [departmentStaffData, setDepartmentStaffData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('serenity_access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        // Load metrics, applications, and staff in parallel
        const [metricsRes, applicantsRes, staffRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/metrics`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff`, { headers }).catch(() => null)
        ]);

        // Process metrics
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics({
            totalStaff: data.totalStaff || 0,
            openPositions: data.openPositions || 0,
            pendingApplications: data.pendingApplications || 0,
            trainingCompliance: data.trainingCompliance || 0,
            avgTimeToHire: data.avgTimeToHire || 0,
            turnoverRate: data.turnoverRate || 0
          });
        } else {
          setMetrics({
            totalStaff: 0,
            openPositions: 0,
            pendingApplications: 0,
            trainingCompliance: 0,
            avgTimeToHire: 0,
            turnoverRate: 0
          });
        }

        // Process applicants - map to component's Application interface
        if (applicantsRes.ok) {
          const data = await applicantsRes.json();
          const applicants = (data.applicants || []).map((a: any, idx: number) => ({
            id: idx + 1,
            name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Unknown',
            position: a.positionAppliedFor || 'Not specified',
            status: mapApplicantStatus(a.status || a.currentStage),
            experience: a.experienceLevel || 'Not specified',
            location: a.city ? `${a.city}, OH` : 'Ohio',
            applied: formatTimeAgo(a.applicationDate || a.createdAt)
          }));
          setApplications(applicants);
        }

        // Process staff list
        if (staffRes && staffRes.ok) {
          const data = await staffRes.json();
          const staff = (data.staff || []).map((s: any, idx: number) => ({
            id: idx + 1,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
            position: s.role || s.position || 'Staff',
            department: s.department || 'General',
            hireDate: s.hireDate || s.createdAt || '',
            certifications: s.certifications || [],
            trainingDue: s.trainingDue || []
          }));
          setStaffList(staff);
        }

      } catch (error) {
        console.error('Failed to load HR data:', error);
        setMetrics({
          totalStaff: 0,
          openPositions: 0,
          pendingApplications: 0,
          trainingCompliance: 0,
          avgTimeToHire: 0,
          turnoverRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper to map backend status to component status
  function mapApplicantStatus(status: string): Application['status'] {
    const statusMap: Record<string, Application['status']> = {
      'pending': 'new',
      'new': 'new',
      'reviewing': 'reviewing',
      'review': 'reviewing',
      'interview': 'interview',
      'interview_scheduled': 'scheduled',
      'scheduled': 'scheduled',
      'rejected': 'rejected',
      'declined': 'rejected'
    };
    return statusMap[status?.toLowerCase()] || 'new';
  }

  // Helper to format time ago
  function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

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
              { key: 'training', label: 'Training', count: staffList.filter(staff => staff.trainingDue.length > 0).length }
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
                subtitle="Active employees"
                icon={UserGroupIcon}
                iconColor="bg-caregiver-600"
              />
              <MetricCard
                title="Open Positions"
                value={metrics.openPositions}
                subtitle={metrics.openPositions > 0 ? "Need to be filled" : "All positions filled"}
                icon={BriefcaseIcon}
                iconColor="bg-danger-600"
                valueColor={metrics.openPositions > 0 ? "text-danger-600" : "text-success-600"}
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
                subtitle={metrics.avgTimeToHire > 0 ? "Average hiring time" : "No hires yet"}
                icon={ClockIcon}
                iconColor="bg-info-600"
              />
              <MetricCard
                title="Turnover Rate"
                value={`${metrics.turnoverRate}%`}
                subtitle={metrics.turnoverRate < 15 ? "Below industry average" : "Monitor closely"}
                icon={ArrowTrendingDownIcon}
                iconColor="bg-success-600"
                valueColor={metrics.turnoverRate < 15 ? "text-success-600" : "text-warning-600"}
              />
            </div>

            {/* Alerts - Dynamic based on actual data */}
            <div className="space-y-4 mb-8 animate-fade-in">
              {staffList.filter(s => s.trainingDue.length > 0).length > 0 && (
                <Alert variant="danger" title="Training Renewals Due">
                  {staffList.filter(s => s.trainingDue.length > 0).length} staff member{staffList.filter(s => s.trainingDue.length > 0).length > 1 ? 's' : ''} need training renewal
                </Alert>
              )}
              {metrics.openPositions > 0 && (
                <Alert variant="warning" title="Open Positions">
                  {metrics.openPositions} position{metrics.openPositions > 1 ? 's' : ''} need to be filled
                </Alert>
              )}
              {metrics.pendingApplications > 0 && (
                <Alert variant="info" title="Pending Applications">
                  {metrics.pendingApplications} application{metrics.pendingApplications > 1 ? 's' : ''} awaiting review
                </Alert>
              )}
              {staffList.filter(s => s.trainingDue.length > 0).length === 0 && metrics.openPositions === 0 && metrics.pendingApplications === 0 && (
                <Alert variant="success" title="All Clear">
                  No urgent items requiring attention
                </Alert>
              )}
            </div>

            {/* HR Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
              {/* Training Compliance Ring */}
              <Card className="text-center">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
                  Training Compliance
                </h3>
                <ProgressRing
                  percentage={metrics.trainingCompliance}
                  size={150}
                  strokeWidth={10}
                  color="#10b981"
                  label="Target: 90%"
                />
                <p className="text-sm text-success-600 font-medium mt-3">
                  Above target ✓
                </p>
              </Card>

              {/* Hiring Trend Chart */}
              <Card className="lg:col-span-2">
                <Chart
                  type="area"
                  data={hiringTrendData}
                  title="Monthly Hiring Trend (6 Months)"
                  height={220}
                  width={600}
                  showGrid={true}
                  showAxes={true}
                  color="#3b82f6"
                  gradientFrom="#3b82f6"
                  gradientTo="#60a5fa"
                />
              </Card>
            </div>

            {/* Department Staffing Chart */}
            <div className="mb-8 animate-fade-in">
              <Chart
                type="bar"
                data={departmentStaffData}
                title="Staff Distribution by Department"
                height={240}
                width={1200}
                showGrid={true}
                showAxes={true}
                showValues={true}
                color="#f97316"
              />
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
            {/* Staff with training due */}
            {staffList.filter(s => s.trainingDue.length > 0).length > 0 ? (
              <Card>
                <Alert variant="danger" title={`Training Renewals Due (${staffList.filter(s => s.trainingDue.length > 0).length} staff)`}>
                  The following staff members have training that needs to be renewed
                </Alert>
                <div className="mt-4 space-y-3">
                  {staffList.filter(s => s.trainingDue.length > 0).map((staff) => (
                    <div key={staff.id} className="p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {staff.trainingDue.map((training, i) => (
                          <Badge key={i} variant="warning" size="sm">{training}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <Alert variant="success" title="All Training Up to Date">
                  No staff members have pending training renewals
                </Alert>
              </Card>
            )}

            {/* Training Compliance Summary */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Compliance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-success-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-success-600">{metrics.trainingCompliance}%</p>
                  <p className="text-sm text-gray-600">Overall Compliance Rate</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary-600">{metrics.totalStaff}</p>
                  <p className="text-sm text-gray-600">Total Staff</p>
                </div>
                <div className="p-4 bg-warning-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-warning-600">{staffList.filter(s => s.trainingDue.length > 0).length}</p>
                  <p className="text-sm text-gray-600">Needing Renewal</p>
                </div>
              </div>
            </Card>

            {/* Note about training courses */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Management</h3>
              <p className="text-gray-600">
                Training courses and enrollment will be available once the training module is fully configured.
                Contact your administrator to set up training courses for your organization.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
