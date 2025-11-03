/**
 * Serenity ERP Home Page
 * Main landing page with navigation to all system features
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  AcademicCapIcon,
  BanknotesIcon,
  UsersIcon,
  HeartIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';

interface SystemMetrics {
  activePatients: number;
  activeStaff: number;
  scheduledVisitsToday: number;
  completedVisitsToday: number;
  evvComplianceRate: number;
  overdueItems: number;
  criticalAlerts: number;
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
  color: string;
  priority: 'high' | 'medium' | 'low';
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Serenity ERP</h2>
          <p className="text-gray-600">Initializing your dashboard...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Load system metrics
    loadSystemMetrics();

    return () => clearInterval(timer);
  }, []);

  const loadSystemMetrics = async () => {
    // Simulate loading real metrics - in production this would call your API
    setMetrics({
      activePatients: 447,
      activeStaff: 485,
      scheduledVisitsToday: 127,
      completedVisitsToday: 94,
      evvComplianceRate: 0.978,
      overdueItems: 3,
      criticalAlerts: 1,
      monthlyRevenue: 2150000,
      systemHealth: 'excellent'
    });
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Schedule Visit',
      description: 'Create new patient visit',
      icon: CalendarIcon,
      href: '/scheduling/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Clock In/Out',
      description: 'EVV time tracking',
      icon: ClockIcon,
      href: '/evv/clock',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Add Patient',
      description: 'New patient intake',
      icon: UserGroupIcon,
      href: '/patients/new',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Process Billing',
      description: 'Submit claims',
      icon: CurrencyDollarIcon,
      href: '/billing/process',
      badge: '12 ready',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'Review Applications',
      description: 'HR recruiting pipeline',
      icon: DocumentTextIcon,
      href: '/hr/applications',
      badge: '8 pending',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'AI Assistant',
      description: 'Ask Serenity AI anything',
      icon: PlayCircleIcon,
      href: '/ai-assistant',
      color: 'bg-indigo-500 hover:bg-indigo-600'
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
      color: 'border-blue-500 hover:border-blue-600',
      priority: 'high'
    },
    {
      title: 'HR & Talent Management',
      description: 'Complete workforce management for 500+ staff with AI-powered recruiting',
      icon: UsersIcon,
      href: '/dashboard/hr',
      users: ['HR Manager', 'Recruiters', 'Managers'],
      features: ['Recruiting Pipeline', 'Performance Reviews', 'Retention Analysis', 'Skills Assessment'],
      color: 'border-green-500 hover:border-green-600',
      priority: 'high'
    },
    {
      title: 'Tax Compliance Center',
      description: 'Federal, Ohio state, and municipal tax management with automated compliance',
      icon: BanknotesIcon,
      href: '/dashboard/tax',
      users: ['Finance Director', 'Payroll', 'Compliance'],
      features: ['Auto Tax Calculations', 'Form Generation', 'Deadline Tracking', 'Penalty Prevention'],
      color: 'border-purple-500 hover:border-purple-600',
      priority: 'high'
    },
    {
      title: 'Operations Dashboard',
      description: 'Daily operations management with real-time scheduling and field coordination',
      icon: TruckIcon,
      href: '/dashboard/operations',
      users: ['Operations Manager', 'Schedulers', 'Field Supervisors'],
      features: ['Live Scheduling', 'EVV Monitoring', 'Route Optimization', 'Staff Coordination'],
      color: 'border-orange-500 hover:border-orange-600',
      priority: 'high'
    },
    {
      title: 'Clinical Dashboard',
      description: 'Patient care management with clinical oversight and quality metrics',
      icon: HeartIcon,
      href: '/dashboard/clinical',
      users: ['Clinical Director', 'Nurses', 'Therapists'],
      features: ['Patient Outcomes', 'Care Plan Management', 'Quality Metrics', 'Clinical Alerts'],
      color: 'border-red-500 hover:border-red-600',
      priority: 'medium'
    },
    {
      title: 'Billing & Revenue Cycle',
      description: 'Claims processing, denial management, and revenue optimization',
      icon: CurrencyDollarIcon,
      href: '/dashboard/billing',
      users: ['Billing Manager', 'RCM Specialists'],
      features: ['Claims Processing', 'Denial Management', 'Revenue Analytics', 'Payer Relations'],
      color: 'border-emerald-500 hover:border-emerald-600',
      priority: 'medium'
    },
    {
      title: 'Compliance & Audit',
      description: 'HIPAA compliance, regulatory tracking, and audit preparation',
      icon: ShieldCheckIcon,
      href: '/dashboard/compliance',
      users: ['Compliance Officer', 'Quality Assurance'],
      features: ['HIPAA Monitoring', 'Audit Preparation', 'Policy Management', 'Risk Assessment'],
      color: 'border-yellow-500 hover:border-yellow-600',
      priority: 'medium'
    },
    {
      title: 'Family Portal',
      description: 'Patient family engagement with visit updates and communication',
      icon: BuildingOffice2Icon,
      href: '/family-portal',
      users: ['Families', 'Caregivers'],
      features: ['Visit Updates', 'Care Team Info', 'Secure Messaging', 'Billing Information'],
      color: 'border-pink-500 hover:border-pink-600',
      priority: 'low'
    },
    {
      title: 'Training & Development',
      description: 'Staff training management and competency tracking',
      icon: AcademicCapIcon,
      href: '/dashboard/training',
      users: ['Training Coordinator', 'HR'],
      features: ['Course Management', 'Certification Tracking', 'Compliance Training', 'Skills Development'],
      color: 'border-indigo-500 hover:border-indigo-600',
      priority: 'low'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HeartIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Serenity ERP</h1>
                <p className="text-sm text-gray-500">Home Health Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
              {metrics && (
                <Badge className={`${getHealthColor(metrics.systemHealth)} font-medium`}>
                  System {metrics.systemHealth}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Alerts */}
        {metrics && metrics.criticalAlerts > 0 && (
          <div className="mb-6">
            <Alert className="border-red-500 bg-red-50">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-800">
                {metrics.criticalAlerts} critical alert{metrics.criticalAlerts > 1 ? 's' : ''} require immediate attention.
                <Link to="/alerts" className="ml-2 underline font-medium">View details →</Link>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* System Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <UserGroupIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activePatients}</div>
                <p className="text-xs text-muted-foreground">Across Ohio counties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <UsersIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeStaff}</div>
                <p className="text-xs text-muted-foreground">Caregivers & clinical staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
                <CalendarIcon className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.completedVisitsToday}/{metrics.scheduledVisitsToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.completedVisitsToday / metrics.scheduledVisitsToday) * 100)}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <CurrencyDollarIcon className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  EVV Compliance: {(metrics.evvComplianceRate * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className={`${action.color} text-white p-4 rounded-lg transition-colors duration-200 group`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Icon className="h-6 w-6" />
                    <div>
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                      {action.badge && (
                        <Badge variant="secondary" className="mt-1 text-xs bg-white/20">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Dashboards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Dashboards</h2>

          {/* High Priority Dashboards */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Core Operations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardLinks.filter(d => d.priority === 'high').map((dashboard, index) => {
                const Icon = dashboard.icon;
                return (
                  <Card key={index} className={`border-2 ${dashboard.color} transition-all duration-200 hover:shadow-lg`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-6 w-6 text-gray-600" />
                          <CardTitle className="text-lg">{dashboard.title}</CardTitle>
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{dashboard.description}</p>

                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Primary Users:</div>
                          <div className="flex flex-wrap gap-1">
                            {dashboard.users.map((user, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {user}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Key Features:</div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            {dashboard.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center">
                                <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link to={dashboard.href}>
                          <Button className="w-full">
                            Access Dashboard
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Secondary Dashboards */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Specialized Functions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardLinks.filter(d => d.priority === 'medium' || d.priority === 'low').map((dashboard, index) => {
                const Icon = dashboard.icon;
                return (
                  <Card key={index} className={`${dashboard.color} transition-all duration-200 hover:shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{dashboard.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{dashboard.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {dashboard.users.length} user type{dashboard.users.length > 1 ? 's' : ''}
                        </div>
                        <Link to={dashboard.href}>
                          <Button variant="outline" size="sm">
                            Access
                            <ArrowRightIcon className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">System Status</h3>
              <p className="text-sm text-gray-600">
                All systems operational • Last updated: {currentTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">17 AI Agents Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Database Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}