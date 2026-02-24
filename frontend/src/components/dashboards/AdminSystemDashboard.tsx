import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardLayout,
  TabContainer,
  UrgentSection,
  WidgetContainer,
  StatWidget,
  WidgetGrid,
} from '@/components/ui/CommandCenter';
import type { Tab } from '@/components/ui/CommandCenter';
import { api } from '@/lib/api';
import {
  useRoleAccess,
  DashboardPermission,
  FeaturePermission,
  withRoleAccess,
} from '@/hooks/useRoleAccess';
import {
  Settings,
  Users,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';

function AdminSystemDashboard() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Executives (Founder, CEO, COO) get full access to all tabs for oversight
  const isExecutive = roleAccess.isFounder || roleAccess.isExecutive;

  // Fetch urgent items
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['admin', 'urgent'],
    queryFn: async () => {
      const [systemAlerts, securityEvents]: any[] = await Promise.all([
        api.get('/admin/alerts'),
        api.get('/admin/security/events'),
      ]);
      return {
        systemAlerts: systemAlerts.data,
        securityEvents: securityEvents.data,
      };
    },
  });

  // Build urgent items
  const urgentItems = [
    ...(urgentData?.systemAlerts || [])
      .filter((alert: any) => alert.severity === 'critical')
      .map((alert: any) => ({
        id: `alert-${alert.id}`,
        title: `🚨 System Alert: ${alert.title}`,
        description: alert.description,
        priority: 'urgent' as const,
        action: {
          label: 'Investigate',
          onClick: () => (window.location.href = `/admin/alerts/${alert.id}`),
        },
      })),
    ...(urgentData?.securityEvents || [])
      .filter((event: any) => event.requiresAction)
      .map((event: any) => ({
        id: `security-${event.id}`,
        title: `🔒 Security Event: ${event.type}`,
        description: event.description,
        priority: 'important' as const,
      })),
  ];

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: <Activity className="w-4 h-4" />,
      content: <OverviewTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.MANAGE_USERS)) && {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
      content: <UserManagementTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_SYSTEM_LOGS)) && {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-4 h-4" />,
      badge: urgentData?.securityEvents?.filter((e: any) => e.requiresAction).length || 0,
      badgeColor: 'red',
      content: <SecurityTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.MANAGE_SYSTEM_SETTINGS)) && {
      id: 'settings',
      label: 'System Settings',
      icon: <Settings className="w-4 h-4" />,
      content: <SystemSettingsTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_SYSTEM_LOGS)) && {
      id: 'database',
      label: 'Database',
      icon: <Database className="w-4 h-4" />,
      content: <DatabaseTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-4">
      <StatWidget
        label="System Health"
        value="98.2%"
        variant="success"
        icon={<Activity className="w-4 h-4" />}
      />
      <StatWidget
        label="Active Users"
        value="124"
        icon={<Users className="w-4 h-4" />}
      />
    </div>
  );

  return (
    <DashboardLayout
      title="Admin & System Dashboard"
      subtitle="System administration, security, and user management"
      urgentSection={urgentItems.length > 0 ? <UrgentSection items={urgentItems} /> : undefined}
      actions={headerActions}
    >
      <TabContainer
        tabs={tabs}
        defaultTab="overview"
        onChange={(tabId) => setSelectedTab(tabId)}
      />
    </DashboardLayout>
  );
}

/**
 * Overview Tab
 */
function OverviewTab() {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const response = await api.get<any>('/admin/overview');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading system overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* System Health */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Uptime"
          value="99.98%"
          change={{ value: 0.02, isPositive: true, label: 'this month' }}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="API Response Time"
          value="124ms"
          change={{ value: -15, isPositive: true, label: 'vs last week' }}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatWidget
          label="Database Size"
          value="2.4 GB"
          icon={<Database className="w-5 h-5" />}
        />
        <StatWidget
          label="Active Sessions"
          value="124"
          icon={<Users className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* System Metrics */}
      <WidgetContainer title="System Performance" icon={<Activity className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Server Metrics (Last Hour)</h5>
            <div className="space-y-3">
              <MetricRow label="CPU Usage" value={24} max={100} unit="%" />
              <MetricRow label="Memory Usage" value={62} max={100} unit="%" />
              <MetricRow label="Disk Usage" value={45} max={100} unit="%" />
              <MetricRow label="Network I/O" value={18} max={100} unit="MB/s" />
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Application Metrics</h5>
            <div className="space-y-3">
              <MetricRow label="API Requests/min" value={850} max={2000} unit="" />
              <MetricRow label="Active Database Connections" value={42} max={100} unit="" />
              <MetricRow label="Cache Hit Rate" value={94} max={100} unit="%" />
              <MetricRow label="Error Rate" value={0.12} max={1} unit="%" />
            </div>
          </div>
        </div>
      </WidgetContainer>

      {/* Recent Activity */}
      <WidgetContainer title="Recent System Events">
        <div className="space-y-2">
          {(overviewData?.recentEvents || []).map((event: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
              <div
                className={`w-2 h-2 rounded-full ${
                  event.type === 'success'
                    ? 'bg-green-600'
                    : event.type === 'warning'
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {new Date(event.timestamp).toLocaleString()}
              </span>
              <span className="text-sm text-gray-900">{event.message}</span>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * User Management Tab
 */
function UserManagementTab() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await api.get<any>('/admin/users');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <WidgetContainer
        title="User Accounts"
        subtitle="Manage user access and permissions"
        action={{
          label: 'Create User',
          onClick: () => {},
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Login
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(users?.users || []).map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{user.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => window.location.href = `/admin/users/${user.id}/edit`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to disable ${user.name}?`)) {
                            alert(`User ${user.name} has been disabled`);
                          }
                        }}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Security Tab
 */
function SecurityTab() {
  const { data: securityData, isLoading } = useQuery({
    queryKey: ['admin', 'security'],
    queryFn: async () => {
      const response = await api.get<any>('/admin/security');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading security data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Security Events */}
      <WidgetContainer
        title="Recent Security Events"
        subtitle="Failed logins, permission denials, and suspicious activity"
        icon={<Shield className="w-5 h-5" />}
      >
        <div className="space-y-3">
          {(securityData?.events || []).map((event: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                event.severity === 'high'
                  ? 'bg-red-50'
                  : event.severity === 'medium'
                    ? 'bg-yellow-50'
                    : 'bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        event.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : event.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {event.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{event.description}</p>
                  <p className="text-sm text-gray-600 mt-1">User: {event.user} | IP: {event.ip}</p>
                </div>
                {event.requiresAction && (
                  <button className="ml-4 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700">
                    Investigate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>

      {/* Audit Log Summary */}
      <WidgetContainer title="Audit Log Summary (Last 24 Hours)">
        <WidgetGrid columns={4}>
          <StatWidget label="Total Events" value="12,847" icon={<Activity className="w-4 h-4" />} />
          <StatWidget
            label="Failed Logins"
            value="24"
            variant="warning"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <StatWidget label="PHI Access" value="1,456" icon={<Shield className="w-4 h-4" />} />
          <StatWidget label="Permission Denials" value="8" icon={<Shield className="w-4 h-4" />} />
        </WidgetGrid>
      </WidgetContainer>
    </div>
  );
}

/**
 * System Settings Tab
 */
function SystemSettingsTab() {
  return (
    <div className="space-y-6">
      <WidgetContainer title="General Settings">
        <div className="space-y-4">
          {[
            { label: 'Organization Name', value: 'Serenity Care Partners', type: 'text' },
            { label: 'Primary Email', value: 'admin@serenitycare.com', type: 'email' },
            { label: 'Phone Number', value: '(614) 555-1234', type: 'tel' },
            { label: 'Time Zone', value: 'America/New_York', type: 'select' },
          ].map((setting, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">{setting.label}</label>
              <input
                type={setting.type}
                className="col-span-2 px-3 py-2 border rounded-md"
                defaultValue={setting.value}
              />
            </div>
          ))}
        </div>
      </WidgetContainer>

      <WidgetContainer title="Security Settings">
        <div className="space-y-4">
          {[
            { label: 'Session Timeout (minutes)', value: '30' },
            { label: 'Password Expiry (days)', value: '90' },
            { label: 'Max Login Attempts', value: '5' },
            { label: 'MFA Required', value: 'true', type: 'checkbox' },
          ].map((setting, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">{setting.label}</label>
              {setting.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  className="col-span-2"
                  defaultChecked={setting.value === 'true'}
                />
              ) : (
                <input
                  type="text"
                  className="col-span-2 px-3 py-2 border rounded-md"
                  defaultValue={setting.value}
                />
              )}
            </div>
          ))}
        </div>
      </WidgetContainer>

      <button
        onClick={() => alert('System settings have been saved successfully')}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Save Settings
      </button>
    </div>
  );
}

/**
 * Database Tab
 */
function DatabaseTab() {
  return (
    <div className="space-y-6">
      <WidgetContainer title="Database Statistics" icon={<Database className="w-5 h-5" />}>
        <WidgetGrid columns={4}>
          <StatWidget label="Total Size" value="2.4 GB" />
          <StatWidget label="Tables" value="87" />
          <StatWidget label="Total Records" value="1.2M" />
          <StatWidget label="Avg Query Time" value="18ms" variant="success" />
        </WidgetGrid>
      </WidgetContainer>

      <WidgetContainer title="Database Backups">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Backup Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { time: '2025-12-13 02:00:00', type: 'Full', size: '2.4 GB', status: 'completed' },
                { time: '2025-12-12 02:00:00', type: 'Full', size: '2.3 GB', status: 'completed' },
                { time: '2025-12-11 02:00:00', type: 'Full', size: '2.2 GB', status: 'completed' },
              ].map((backup, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{backup.time}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{backup.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{backup.size}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      {backup.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => alert('Initiating backup download...')}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetContainer>

      <button
        onClick={() => {
          if (confirm('Are you sure you want to initiate a database backup?')) {
            alert('Database backup initiated. You will be notified when complete.');
          }
        }}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Backup Now
      </button>
    </div>
  );
}

/**
 * Metric Row Component
 */
function MetricRow({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const percentage = (value / max) * 100;
  const getColor = () => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">
          {value}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${getColor()}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(AdminSystemDashboard, DashboardPermission.ADMIN_SYSTEM);
