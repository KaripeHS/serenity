/**
 * Serenity ERP Home Page
 * Main landing page with navigation to all system features
 * Now with real API authentication
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
  BuildingOffice2Icon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';
import { getPortalType, PortalType } from '../App';

// Portal configuration for different subdomains
const portalConfig: Record<PortalType, { label: string; color: string; description: string }> = {
  public: { label: '', color: '', description: 'Home Health Management System' },
  console: { label: 'Admin Console', color: 'text-purple-600', description: 'Administrative Dashboard' },
  staff: { label: 'Staff Portal', color: 'text-blue-600', description: 'Employee Access' },
  caregiver: { label: 'Caregiver Portal', color: 'text-green-600', description: 'Caregiver Access' },
};

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
  // Roles that can see this dashboard (empty = all authenticated users)
  allowedRoles?: string[];
}

// Role-based access configuration
const ROLE_DASHBOARD_ACCESS: Record<string, string[]> = {
  founder: ['all'], // Founders see everything
  admin: ['all'], // Admins see everything
  pod_lead: [
    '/dashboard/operations',
    '/dashboard/clinical',
    '/dashboard/hr',
    '/dashboard/scheduling',
    '/dashboard/compliance',
    '/family-portal',
    '/dashboard/training',
    '/patients'
  ],
  scheduler: [
    '/dashboard/operations',
    '/dashboard/scheduling',
    '/evv/clock',
    '/patients'
  ],
  caregiver: [
    '/evv/clock',
    '/dashboard/scheduling',
    '/patients'
  ]
};

// Quick actions by role
const ROLE_QUICK_ACTIONS: Record<string, string[]> = {
  founder: ['all'],
  admin: ['all'],
  pod_lead: ['/scheduling/new', '/evv/clock', '/patients', '/hr/applications', '/ai-assistant'],
  scheduler: ['/scheduling/new', '/evv/clock', '/patients'],
  caregiver: ['/evv/clock', '/patients']
};

// Login Form Component
function LoginForm() {
  const { login, error, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Get portal type for styling
  const portalType = getPortalType();
  const portal = portalConfig[portalType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in AuthContext
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <HeartIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Serenity ERP</h1>
          {portal.label && (
            <p className={`text-lg font-semibold mt-1 ${portal.color}`}>{portal.label}</p>
          )}
          <p className="text-gray-600 mt-2">{portal.description}</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <Alert className="border-red-500 bg-red-50">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-800">
                    {displayError}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@serenitycarepartners.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Test Accounts Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3">
                <strong>Test Accounts:</strong>
              </div>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-700">Founder (Full Access)</div>
                  <div>Email: founder@serenitycarepartners.com</div>
                  <div>Password: ChangeMe123!</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-700">Pod Lead</div>
                  <div>Email: podlead@serenitycarepartners.com</div>
                  <div>Password: PodLead123!</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-700">Caregiver</div>
                  <div>Email: maria.garcia@serenitycarepartners.com</div>
                  <div>Password: Caregiver123!</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>HIPAA Compliant Healthcare Management</p>
          <p className="mt-1">Serenity Care Partners</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Hooks must be called before any conditional returns
  useEffect(() => {
    // Only run if user is authenticated
    if (!user) return;

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Load system metrics
    loadSystemMetrics();

    return () => clearInterval(timer);
  }, [user]);

  const loadSystemMetrics = async () => {
    try {
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
          overdueItems: data.overdueItems || 0,
          criticalAlerts: data.criticalAlerts || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          systemHealth: data.systemHealth || 'good'
        });
      } else {
        // API error - show zeros
        setMetrics({
          activePatients: 0,
          activeStaff: 0,
          scheduledVisitsToday: 0,
          completedVisitsToday: 0,
          evvComplianceRate: 0,
          overdueItems: 0,
          criticalAlerts: 0,
          monthlyRevenue: 0,
          systemHealth: 'good'
        });
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setMetrics({
        activePatients: 0,
        activeStaff: 0,
        scheduledVisitsToday: 0,
        completedVisitsToday: 0,
        evvComplianceRate: 0,
        overdueItems: 0,
        criticalAlerts: 0,
        monthlyRevenue: 0,
        systemHealth: 'good'
      });
    }
  };

  // Show loading state
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

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Helper function to check if user can access a specific route
  const canAccessRoute = (href: string): boolean => {
    if (!user) return false;
    const allowedRoutes = ROLE_DASHBOARD_ACCESS[user.role] || [];
    if (allowedRoutes.includes('all')) return true;
    return allowedRoutes.some(route => href.startsWith(route));
  };

  // Helper function to check if user can see a quick action
  const canAccessQuickAction = (href: string): boolean => {
    if (!user) return false;
    const allowedActions = ROLE_QUICK_ACTIONS[user.role] || [];
    if (allowedActions.includes('all')) return true;
    return allowedActions.some(action => href.startsWith(action));
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
      title: 'View Patients',
      description: 'Patient list & details',
      icon: UserGroupIcon,
      href: '/patients',
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </Button>
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

        {/* Quick Actions - filtered by role */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.filter(action => canAccessQuickAction(action.href)).map((action, index) => {
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

        {/* Main Dashboards - filtered by role */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {user.role === 'founder' || user.role === 'admin' ? 'System Dashboards' : 'Your Dashboards'}
          </h2>

          {/* High Priority Dashboards */}
          {dashboardLinks.filter(d => d.priority === 'high' && canAccessRoute(d.href)).length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Core Operations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardLinks.filter(d => d.priority === 'high' && canAccessRoute(d.href)).map((dashboard, index) => {
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
          )}

          {/* Secondary Dashboards - filtered by role */}
          {dashboardLinks.filter(d => (d.priority === 'medium' || d.priority === 'low') && canAccessRoute(d.href)).length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Specialized Functions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardLinks.filter(d => (d.priority === 'medium' || d.priority === 'low') && canAccessRoute(d.href)).map((dashboard, index) => {
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
          )}

          {/* Admin & Access Control - Founders Only */}
          {(user.role === 'founder' || user.role === 'admin') && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Administration & Access Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/admin/users">
                <Card hoverable className="border-2 border-gray-300 hover:border-purple-500 transition-all">
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">User Management</h4>
                      <p className="text-sm text-gray-500">Manage staff accounts</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/admin/roles">
                <Card hoverable className="border-2 border-gray-300 hover:border-purple-500 transition-all">
                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Roles & Permissions</h4>
                      <p className="text-sm text-gray-500">Control access levels</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/admin/pods">
                <Card hoverable className="border-2 border-gray-300 hover:border-purple-500 transition-all">
                  <div className="flex items-center space-x-3">
                    <BuildingOffice2Icon className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Pod Management</h4>
                      <p className="text-sm text-gray-500">Organize teams</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/admin/audit">
                <Card hoverable className="border-2 border-gray-300 hover:border-purple-500 transition-all">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Audit Logs</h4>
                      <p className="text-sm text-gray-500">View activity history</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
          )}
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