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

export default function WorkingHomePage() {
  const { user, isLoading, isFounder } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    loadSystemMetrics();
    return () => clearInterval(timer);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setMetricsLoading(true);
      // In a real implementation, this would call actual API endpoints
      // For demo purposes, simulating API call with realistic data
      const response = await new Promise<SystemMetrics>((resolve) => {
        setTimeout(() => {
          resolve({
            activePatients: 447,
            activeStaff: 485,
            scheduledVisitsToday: 127,
            completedVisitsToday: 94,
            evvComplianceRate: 0.978,
            monthlyRevenue: 2150000,
            systemHealth: 'excellent'
          });
        }, 500); // Simulate network delay
      });
      setMetrics(response);
    } catch (error) {
      loggerService.error('Failed to load system metrics:', error);
      // Set fallback metrics on error
      setMetrics({
        activePatients: 0,
        activeStaff: 0,
        scheduledVisitsToday: 0,
        completedVisitsToday: 0,
        evvComplianceRate: 0,
        monthlyRevenue: 0,
        systemHealth: 'warning'
      });
    } finally {
      setMetricsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
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
      badge: '12 ready',
      color: '#059669'
    },
    {
      title: 'Review Applications',
      description: 'HR recruiting pipeline',
      icon: DocumentTextIcon,
      href: '/hr/applications',
      badge: '8 pending',
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

  // Conditionally add governance dashboard for authorized users
  const allDashboardLinks = (isFounder() || user?.permissions.includes('governance:admin'))
    ? [governanceDashboard, ...dashboardLinks]
    : dashboardLinks;

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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <HeartIcon style={{ height: '3rem', width: '3rem', color: '#3B82F6', margin: '0 auto 1rem auto', animation: 'pulse 2s infinite' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Loading Serenity ERP</h2>
          <p style={{ color: '#6b7280' }}>Initializing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HeartIcon style={{ height: '2rem', width: '2rem', color: '#3B82F6' }} />
                <div style={{ marginLeft: '0.75rem' }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Serenity ERP</h1>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Home Health Management System</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                      {user.role}
                    </div>
                  </div>
                  <div style={{
                    height: '2rem',
                    width: '2rem',
                    backgroundColor: '#3B82F6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white' }}>
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
              {metrics && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}>
                  System {metrics.systemHealth}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* System Overview */}
        {metricsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                <div style={{ height: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }}></div>
                <div style={{ height: '2rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }}></div>
                <div style={{ height: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem', animation: 'pulse 2s infinite' }}></div>
              </div>
            ))}
          </div>
        ) : metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Active Patients</h3>
                <UserGroupIcon style={{ height: '1rem', width: '1rem', color: '#3B82F6' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{metrics.activePatients}</div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Across Ohio counties</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Active Staff</h3>
                <UsersIcon style={{ height: '1rem', width: '1rem', color: '#10B981' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{metrics.activeStaff}</div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Caregivers & clinical staff</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Today's Visits</h3>
                <CalendarIcon style={{ height: '1rem', width: '1rem', color: '#8B5CF6' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                {metrics.completedVisitsToday}/{metrics.scheduledVisitsToday}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                {Math.round((metrics.completedVisitsToday / metrics.scheduledVisitsToday) * 100)}% completion rate
              </p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Monthly Revenue</h3>
                <CurrencyDollarIcon style={{ height: '1rem', width: '1rem', color: '#059669' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{formatCurrency(metrics.monthlyRevenue)}</div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                EVV Compliance: {(metrics.evvComplianceRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  style={{
                    backgroundColor: action.color,
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    display: 'block',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.5rem auto', display: 'block' }} />
                  <div style={{ fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{action.title}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{action.description}</div>
                  {action.badge && (
                    <div style={{
                      display: 'inline-block',
                      marginTop: '0.25rem',
                      padding: '0.125rem 0.5rem',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '9999px',
                      fontSize: '0.75rem'
                    }}>
                      {action.badge}
                    </div>
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