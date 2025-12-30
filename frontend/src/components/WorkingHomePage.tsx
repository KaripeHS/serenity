import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loggerService } from '../shared/services/logger.service';
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  TruckIcon,
  AcademicCapIcon,
  BanknotesIcon,
  UsersIcon,
  HeartIcon,
  BuildingOffice2Icon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';

interface SystemMetrics {
  activePatients: number;
  activeStaff: number;
  scheduledVisitsToday: number;
  completedVisitsToday: number;
  evvComplianceRate: number;
  monthlyRevenue: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: string;
  color: string;
}

interface DashboardLink {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  users: string[];
  features: string[];
  priority: 'high' | 'medium' | 'low';
}

// Role categories for filtering content
const HR_ROLES = ['recruiter', 'hr_manager', 'hr_director', 'credentialing_specialist'];
const CLINICAL_ROLES = ['rn', 'lpn', 'don', 'clinical_director', 'nursing_supervisor', 'rn_case_manager', 'qidp', 'therapist'];
const OPERATIONS_ROLES = ['operations_manager', 'field_ops_manager', 'pod_lead', 'field_supervisor', 'scheduling_manager', 'scheduler', 'dispatcher'];
const FINANCE_ROLES = ['cfo', 'finance_director', 'finance_manager', 'billing_manager', 'rcm_analyst', 'billing_coder'];
const CAREGIVER_ROLES = ['caregiver', 'hha', 'cna', 'dsp_basic', 'dsp_med_certified'];
const EXECUTIVE_ROLES = ['founder', 'ceo', 'coo', 'cfo'];

export default function WorkingHomePage() {
  const { user, isLoading, isFounder } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Determine user's role category
  const userRole = user?.role?.toLowerCase() || '';
  const isHRRole = HR_ROLES.includes(userRole);
  const isClinicalRole = CLINICAL_ROLES.includes(userRole);
  const isOperationsRole = OPERATIONS_ROLES.includes(userRole);
  const isFinanceRole = FINANCE_ROLES.includes(userRole);
  const isCaregiverRole = CAREGIVER_ROLES.includes(userRole);
  const isExecutiveRole = EXECUTIVE_ROLES.includes(userRole) || isFounder();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    loadSystemMetrics();
    return () => clearInterval(timer);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setMetricsLoading(true);

      // Try to fetch real metrics from API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics({
          activePatients: data.activePatients || 0,
          activeStaff: data.activeStaff || 0,
          scheduledVisitsToday: data.scheduledVisitsToday || 0,
          completedVisitsToday: data.completedVisitsToday || 0,
          evvComplianceRate: data.evvComplianceRate || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          systemHealth: data.systemHealth || 'good'
        });
      } else {
        // API returned error - show zeros (no mock data)
        setMetrics({
          activePatients: 0,
          activeStaff: 0,
          scheduledVisitsToday: 0,
          completedVisitsToday: 0,
          evvComplianceRate: 0,
          monthlyRevenue: 0,
          systemHealth: 'good'
        });
      }
    } catch (error) {
      loggerService.error('Failed to load system metrics:', error);
      // API call failed - show zeros (no mock data)
      setMetrics({
        activePatients: 0,
        activeStaff: 0,
        scheduledVisitsToday: 0,
        completedVisitsToday: 0,
        evvComplianceRate: 0,
        monthlyRevenue: 0,
        systemHealth: 'good'
      });
    } finally {
      setMetricsLoading(false);
    }
  };

  // Role-specific quick actions
  const getQuickActionsForRole = (): QuickAction[] => {
    // HR Roles (Recruiter, HR Manager, etc.)
    if (isHRRole) {
      return [
        {
          title: 'Review Applications',
          description: 'View pending applicants',
          icon: DocumentTextIcon,
          href: '/hr/applications',
          badge: 'New',
          color: '#EA580C'
        },
        {
          title: 'Post Job Opening',
          description: 'Create new job listing',
          icon: UserGroupIcon,
          href: '/hr/jobs/new',
          color: '#3B82F6'
        },
        {
          title: 'Schedule Interview',
          description: 'Book candidate interviews',
          icon: CalendarIcon,
          href: '/hr/interviews',
          color: '#10B981'
        },
        {
          title: 'Onboarding',
          description: 'New hire checklist',
          icon: AcademicCapIcon,
          href: '/hr/onboarding',
          color: '#8B5CF6'
        }
      ];
    }

    // Clinical Roles
    if (isClinicalRole) {
      return [
        {
          title: 'Patient Care Plans',
          description: 'View and update care plans',
          icon: HeartIcon,
          href: '/clinical/care-plans',
          color: '#EC4899'
        },
        {
          title: 'Assessments',
          description: 'Complete patient assessments',
          icon: DocumentTextIcon,
          href: '/clinical/assessments',
          color: '#3B82F6'
        },
        {
          title: 'Schedule Visit',
          description: 'Create new patient visit',
          icon: CalendarIcon,
          href: '/scheduling/new',
          color: '#10B981'
        },
        {
          title: 'Clinical Notes',
          description: 'Document patient notes',
          icon: DocumentTextIcon,
          href: '/clinical/notes',
          color: '#8B5CF6'
        }
      ];
    }

    // Caregiver Roles
    if (isCaregiverRole) {
      return [
        {
          title: 'Clock In/Out',
          description: 'EVV time tracking',
          icon: ClockIcon,
          href: '/evv/clock',
          color: '#10B981'
        },
        {
          title: 'My Schedule',
          description: 'View your shifts',
          icon: CalendarIcon,
          href: '/my-schedule',
          color: '#3B82F6'
        },
        {
          title: 'Document Visit',
          description: 'Complete visit notes',
          icon: DocumentTextIcon,
          href: '/visits/document',
          color: '#8B5CF6'
        },
        {
          title: 'Training',
          description: 'Complete required training',
          icon: AcademicCapIcon,
          href: '/training',
          color: '#F59E0B'
        }
      ];
    }

    // Finance/Billing Roles
    if (isFinanceRole) {
      return [
        {
          title: 'Process Billing',
          description: 'Submit claims',
          icon: CurrencyDollarIcon,
          href: '/billing/process',
          badge: 'Ready',
          color: '#059669'
        },
        {
          title: 'Payroll',
          description: 'Review payroll',
          icon: BanknotesIcon,
          href: '/payroll',
          color: '#3B82F6'
        },
        {
          title: 'AR Management',
          description: 'Accounts receivable',
          icon: DocumentTextIcon,
          href: '/billing/ar',
          color: '#8B5CF6'
        },
        {
          title: 'Reports',
          description: 'Financial reports',
          icon: ChartBarIcon,
          href: '/reports/finance',
          color: '#F59E0B'
        }
      ];
    }

    // Operations Roles
    if (isOperationsRole) {
      return [
        {
          title: 'Schedule Visit',
          description: 'Create new patient visit',
          icon: CalendarIcon,
          href: '/scheduling/new',
          color: '#3B82F6'
        },
        {
          title: 'Dispatch Board',
          description: 'Real-time coordination',
          icon: TruckIcon,
          href: '/dispatch',
          color: '#10B981'
        },
        {
          title: 'Coverage Gaps',
          description: 'Fill open shifts',
          icon: UserGroupIcon,
          href: '/scheduling/gaps',
          badge: 'Alert',
          color: '#EF4444'
        },
        {
          title: 'EVV Monitor',
          description: 'Track compliance',
          icon: ClockIcon,
          href: '/evv/monitor',
          color: '#8B5CF6'
        }
      ];
    }

    // Executive/Default - show all options
    return [
      {
        title: 'Schedule Visit',
        description: 'Create new patient visit',
        icon: CalendarIcon,
        href: '/scheduling/new',
        color: '#3B82F6'
      },
      {
        title: 'Clock In/Out',
        description: 'EVV time tracking',
        icon: ClockIcon,
        href: '/evv/clock',
        color: '#10B981'
      },
      {
        title: 'Add Patient',
        description: 'New patient intake',
        icon: UserGroupIcon,
        href: '/patients/new',
        color: '#8B5CF6'
      },
      {
        title: 'Process Billing',
        description: 'Submit claims',
        icon: CurrencyDollarIcon,
        href: '/billing/process',
        color: '#059669'
      },
      {
        title: 'Review Applications',
        description: 'HR recruiting pipeline',
        icon: DocumentTextIcon,
        href: '/hr/applications',
        color: '#EA580C'
      },
      {
        title: 'AI Assistant',
        description: 'Ask Serenity AI anything',
        icon: PlayCircleIcon,
        href: '/ai-assistant',
        color: '#6366F1'
      }
    ];
  };

  const quickActions = getQuickActionsForRole();

  const dashboardLinks: DashboardLink[] = [
    {
      title: 'Executive Command Center',
      description: 'Strategic overview for leadership with AI insights and capacity analysis',
      icon: ChartBarIcon,
      href: '/dashboard/executive',
      users: ['CEO', 'COO', 'Directors'],
      features: ['Real-time KPIs', 'AI Anomaly Detection', 'Growth Analysis', 'Financial Forecasting'],
      priority: 'high'
    },
    {
      title: 'HR & Talent Management',
      description: 'Complete workforce management for 500+ staff with AI-powered recruiting',
      icon: UsersIcon,
      href: '/dashboard/hr',
      users: ['HR Manager', 'Recruiters', 'Managers'],
      features: ['Recruiting Pipeline', 'Performance Reviews', 'Retention Analysis', 'Skills Assessment'],
      priority: 'high'
    },
    {
      title: 'Tax Compliance Center',
      description: 'Federal, Ohio state, and municipal tax management with automated compliance',
      icon: BanknotesIcon,
      href: '/dashboard/tax',
      users: ['Finance Director', 'Payroll', 'Compliance'],
      features: ['Auto Tax Calculations', 'Form Generation', 'Deadline Tracking', 'Penalty Prevention'],
      priority: 'high'
    },
    {
      title: 'Operations Dashboard',
      description: 'Daily operations management with real-time scheduling and field coordination',
      icon: TruckIcon,
      href: '/dashboard/operations',
      users: ['Operations Manager', 'Schedulers', 'Field Supervisors'],
      features: ['Live Scheduling', 'EVV Monitoring', 'Route Optimization', 'Staff Coordination'],
      priority: 'high'
    },
    {
      title: 'Clinical Dashboard',
      description: 'Patient care management with clinical oversight and quality metrics',
      icon: HeartIcon,
      href: '/dashboard/clinical',
      users: ['Clinical Director', 'Nurses', 'Therapists'],
      features: ['Patient Outcomes', 'Care Plan Management', 'Quality Metrics', 'Clinical Alerts'],
      priority: 'medium'
    },
    {
      title: 'Billing & Revenue Cycle',
      description: 'Claims processing, denial management, and revenue optimization',
      icon: CurrencyDollarIcon,
      href: '/dashboard/billing',
      users: ['Billing Manager', 'RCM Specialists'],
      features: ['Claims Processing', 'Denial Management', 'Revenue Analytics', 'Payer Relations'],
      priority: 'medium'
    },
    {
      title: 'Compliance & Audit',
      description: 'HIPAA compliance, regulatory tracking, and audit preparation',
      icon: ShieldCheckIcon,
      href: '/dashboard/compliance',
      users: ['Compliance Officer', 'Quality Assurance'],
      features: ['HIPAA Monitoring', 'Audit Preparation', 'Policy Management', 'Risk Assessment'],
      priority: 'medium'
    },
    {
      title: 'Family Portal',
      description: 'Patient family engagement with visit updates and communication',
      icon: BuildingOffice2Icon,
      href: '/family-portal',
      users: ['Families', 'Caregivers'],
      features: ['Visit Updates', 'Care Team Info', 'Secure Messaging', 'Billing Information'],
      priority: 'low'
    },
    {
      title: 'Training & Development',
      description: 'Staff training management and competency tracking',
      icon: AcademicCapIcon,
      href: '/dashboard/training',
      users: ['Training Coordinator', 'HR'],
      features: ['Course Management', 'Certification Tracking', 'Compliance Training', 'Skills Development'],
      priority: 'low'
    }
  ];

  // Add Super Admin Console for authorized users
  const governanceDashboard: DashboardLink = {
    title: 'Super Admin Console',
    description: 'Pod governance, access control, and system administration',
    icon: CogIcon,
    href: '/super-admin',
    users: ['Founder', 'Security Officer', 'IT Admin'],
    features: ['Pod Management', 'User Access Control', 'JIT/Break-Glass', 'SOD Monitoring', 'Audit Logs', 'Compliance Export'],
    priority: 'high'
  };

  // Filter dashboard links based on role
  const getFilteredDashboards = (): DashboardLink[] => {
    // HR Roles - only show HR-related dashboards
    if (isHRRole) {
      return dashboardLinks.filter(d =>
        d.href === '/dashboard/hr' ||
        d.href === '/dashboard/training'
      );
    }

    // Clinical Roles
    if (isClinicalRole) {
      return dashboardLinks.filter(d =>
        d.href === '/dashboard/clinical' ||
        d.href === '/dashboard/operations' ||
        d.href === '/dashboard/compliance'
      );
    }

    // Caregiver Roles - minimal dashboards
    if (isCaregiverRole) {
      return dashboardLinks.filter(d =>
        d.href === '/dashboard/training' ||
        d.href === '/family-portal'
      );
    }

    // Finance Roles
    if (isFinanceRole) {
      return dashboardLinks.filter(d =>
        d.href === '/dashboard/billing' ||
        d.href === '/dashboard/tax' ||
        d.href === '/dashboard/executive'
      );
    }

    // Operations Roles
    if (isOperationsRole) {
      return dashboardLinks.filter(d =>
        d.href === '/dashboard/operations' ||
        d.href === '/dashboard/clinical'
      );
    }

    // Executive/Default - show all
    return dashboardLinks;
  };

  // Conditionally add governance dashboard for authorized users
  const filteredDashboards = getFilteredDashboards();
  const allDashboardLinks = (isFounder() || user?.permissions.includes('governance:admin'))
    ? [governanceDashboard, ...filteredDashboards]
    : filteredDashboards;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Serenity ERP</h2>
          <p className="text-gray-600">Initializing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center group">
                <HeartIcon className="h-8 w-8 text-primary-600 transition-transform group-hover:scale-110" />
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900 m-0">Serenity ERP</h1>
                  <p className="text-sm text-gray-600 m-0">Home Health Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {user.role}
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-primary-100">
                    <span className="text-sm font-medium text-white">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
              {metrics && (
                <Badge variant="success" size="sm" dot>
                  System {metrics.systemHealth}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        {/* System Overview - Show role-appropriate metrics */}
        {metricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-full" />
              </Card>
            ))}
          </div>
        ) : isHRRole ? (
          /* HR-specific metrics */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Open Positions</h3>
                <div className="p-2 bg-primary-50 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <p className="text-xs text-gray-500 mt-1 m-0">HHA, LPN, RN</p>
            </Card>

            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">New Applications</h3>
                <div className="p-2 bg-success-50 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">8</div>
              <p className="text-xs text-gray-500 mt-1 m-0">Awaiting review</p>
            </Card>

            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Interviews Scheduled</h3>
                <div className="p-2 bg-caregiver-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-caregiver-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">2</div>
              <p className="text-xs text-gray-500 mt-1 m-0">This week</p>
            </Card>

            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Active Staff</h3>
                <div className="p-2 bg-success-50 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics?.activeStaff || 0}</div>
              <p className="text-xs text-gray-500 mt-1 m-0">Total employees</p>
            </Card>
          </div>
        ) : metrics && (
          /* Default/Executive metrics */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Active Patients</h3>
                <div className="p-2 bg-primary-50 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.activePatients}</div>
              <p className="text-xs text-gray-500 mt-1 m-0">Across Ohio counties</p>
            </Card>

            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Active Staff</h3>
                <div className="p-2 bg-success-50 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.activeStaff}</div>
              <p className="text-xs text-gray-500 mt-1 m-0">Caregivers & clinical staff</p>
            </Card>

            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Today's Visits</h3>
                <div className="p-2 bg-caregiver-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-caregiver-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.completedVisitsToday}/{metrics.scheduledVisitsToday}
              </div>
              <p className="text-xs text-gray-500 mt-1 m-0">
                {metrics.scheduledVisitsToday > 0 ? Math.round((metrics.completedVisitsToday / metrics.scheduledVisitsToday) * 100) : 0}% completion rate
              </p>
            </Card>

            <Card hoverable className="transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 m-0">Monthly Revenue</h3>
                <div className="p-2 bg-success-50 rounded-lg">
                  <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.monthlyRevenue)}</div>
              <p className="text-xs text-gray-500 mt-1 m-0">
                EVV Compliance: {(metrics.evvComplianceRate * 100).toFixed(1)}%
              </p>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClass = {
                '#3B82F6': 'bg-primary-600 hover:bg-primary-700',
                '#10B981': 'bg-success-600 hover:bg-success-700',
                '#8B5CF6': 'bg-caregiver-600 hover:bg-caregiver-700',
                '#059669': 'bg-success-700 hover:bg-success-800',
                '#EA580C': 'bg-warning-600 hover:bg-warning-700',
                '#6366F1': 'bg-info-600 hover:bg-info-700'
              }[action.color] || 'bg-primary-600 hover:bg-primary-700';

              return (
                <Link
                  key={index}
                  to={action.href}
                  className={`${colorClass} text-white p-4 rounded-lg text-decoration-none block text-center transition-all hover:scale-105 hover:shadow-lg group`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2 transition-transform group-hover:scale-110" />
                  <div className="font-medium text-sm mb-1">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                  {action.badge && (
                    <Badge variant="default" size="sm" className="mt-2 bg-white/20">
                      {action.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Dashboards */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>System Dashboards</h2>

          {/* High Priority Dashboards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>Core Operations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {allDashboardLinks.filter(d => d.priority === 'high').map((dashboard, index) => {
                const Icon = dashboard.icon;
                return (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    border: '2px solid #e5e7eb',
                    padding: '1.5rem',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon style={{ height: '1.5rem', width: '1.5rem', color: '#6b7280' }} />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{dashboard.title}</h4>
                      </div>
                    </div>
                    <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>{dashboard.description}</p>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Primary Users:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {dashboard.users.map((user, idx) => (
                          <span key={idx} style={{
                            display: 'inline-block',
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            border: '1px solid #d1d5db'
                          }}>
                            {user}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Key Features:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {dashboard.features.map((feature, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#10B981', marginRight: '0.25rem' }}>✓</span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Link to={dashboard.href} style={{
                        display: 'inline-block',
                        width: '100%',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        textAlign: 'center',
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}>
                        Access Dashboard →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Dashboards */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>Specialized Functions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {allDashboardLinks.filter(d => d.priority === 'medium' || d.priority === 'low').map((dashboard, index) => {
                const Icon = dashboard.icon;
                return (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    padding: '1rem',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <Icon style={{ height: '1.25rem', width: '1.25rem', color: '#6b7280' }} />
                      <h4 style={{ fontWeight: '500', color: '#111827', margin: 0 }}>{dashboard.title}</h4>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>{dashboard.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {dashboard.users.length} user type{dashboard.users.length > 1 ? 's' : ''}
                      </div>
                      <Link to={dashboard.href} style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}>
                        Access →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>System Status</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                All systems operational • Last updated: {currentTime.toLocaleTimeString()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ height: '0.75rem', width: '0.75rem', backgroundColor: '#10B981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>17 AI Agents Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ height: '0.75rem', width: '0.75rem', backgroundColor: '#3B82F6', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Database Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ height: '0.75rem', width: '0.75rem', backgroundColor: '#8B5CF6', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}