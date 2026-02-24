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
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Navigation,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';

interface ScheduleIssue {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientName: string;
  issueType: 'late' | 'no_show' | 'overtime' | 'double_booked';
  scheduledTime: string;
  actualTime?: string;
  description: string;
}

interface GeofenceViolation {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientName: string;
  violationType: 'check_in_outside' | 'check_out_outside' | 'never_entered';
  timestamp: string;
  distance: number; // meters from geofence
}

interface Visit {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  geofenceCompliant: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

interface MileageReimbursement {
  id: string;
  caregiverId: string;
  caregiverName: string;
  period: string;
  totalMiles: number;
  reimbursementAmount: number;
  status: 'pending' | 'approved' | 'paid';
}

function OperationsCommandCenter() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch urgent items for operations
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['operations', 'urgent'],
    queryFn: async () => {
      const [scheduleIssues, geofenceViolations]: any[] = await Promise.all([
        api.get('/operations/schedule/issues'),
        api.get('/operations/geofence/violations'),
      ]);
      return {
        scheduleIssues: scheduleIssues.data as ScheduleIssue[],
        geofenceViolations: geofenceViolations.data as GeofenceViolation[],
      };
    },
  });

  // Build urgent items array
  const urgentItems = [
    // Schedule issues
    ...(urgentData?.scheduleIssues || []).map((issue) => ({
      id: `schedule-${issue.id}`,
      title: `${issue.issueType === 'no_show' ? '🚫 No Show' : issue.issueType === 'late' ? '⏰ Late Check-In' : issue.issueType === 'double_booked' ? '📅 Double Booked' : '⏳ Overtime'}: ${issue.caregiverName}`,
      description: `${issue.clientName} - ${issue.description}`,
      priority: issue.issueType === 'no_show' ? ('urgent' as const) : ('important' as const),
      action: {
        label: 'Resolve',
        onClick: () => (window.location.href = `/operations/schedule/${issue.id}`),
      },
    })),
    // Geofence violations
    ...(urgentData?.geofenceViolations || []).map((violation) => ({
      id: `geofence-${violation.id}`,
      title: `📍 Geofence Violation: ${violation.caregiverName}`,
      description: `${violation.clientName} - ${violation.violationType.replace(/_/g, ' ')} (${Math.round(violation.distance)}m away)`,
      priority: 'important' as const,
      action: {
        label: 'Review',
        onClick: () => (window.location.href = `/operations/geofence/${violation.id}`),
      },
    })),
  ];

  // Define tabs with RBAC filtering
  // Executives (Founder, CEO, COO) get full access to all tabs for oversight
  const isExecutive = roleAccess.isFounder || roleAccess.isExecutive;

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <MapPin className="w-4 h-4" />,
      content: <OverviewTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_SCHEDULE)) && {
      id: 'scheduling',
      label: 'Scheduling',
      icon: <Calendar className="w-4 h-4" />,
      badge: urgentData?.scheduleIssues?.length || 0,
      badgeColor: (urgentData?.scheduleIssues?.length || 0) > 0 ? 'red' : 'green',
      content: <SchedulingTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_GPS_TRACKING)) && {
      id: 'gps',
      label: 'GPS Tracking',
      icon: <Navigation className="w-4 h-4" />,
      badge: urgentData?.geofenceViolations?.length || 0,
      badgeColor: (urgentData?.geofenceViolations?.length || 0) > 0 ? 'yellow' : 'green',
      content: <GPSTrackingTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_MILEAGE)) && {
      id: 'mileage',
      label: 'Mileage',
      icon: <DollarSign className="w-4 h-4" />,
      content: <MileageTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-4">
      <StatWidget
        label="Active Visits"
        value="24"
        icon={<Users className="w-4 h-4" />}
        variant="success"
      />
      <StatWidget
        label="On-Time Rate"
        value="94.2%"
        change={{ value: 2.1, isPositive: true, label: 'vs yesterday' }}
        icon={<TrendingUp className="w-4 h-4" />}
      />
    </div>
  );

  return (
    <DashboardLayout
      title="Operations Command Center"
      subtitle="Real-time operations monitoring, scheduling, and GPS tracking"
      urgentSection={<UrgentSection items={urgentItems} />}
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
 * Overview Tab - Operations Dashboard
 */
function OverviewTab() {
  const roleAccess = useRoleAccess();

  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['operations', 'overview'],
    queryFn: async () => {
      const response: any = await api.get('/operations/overview');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading operations overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Today's Visits"
          value={overviewData?.todayVisits || '87'}
          change={{ value: 12, isPositive: true, label: 'vs yesterday' }}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatWidget
          label="In Progress"
          value={overviewData?.inProgress || '24'}
          variant="default"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatWidget
          label="Completed"
          value={overviewData?.completed || '48'}
          variant="success"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatWidget
          label="Issues"
          value={overviewData?.issues || '3'}
          variant={overviewData?.issues > 5 ? 'danger' : 'warning'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Visit Status Breakdown */}
      <WidgetContainer
        title="Visit Status (Today)"
        subtitle="Real-time view of all scheduled visits"
        icon={<MapPin className="w-5 h-5" />}
      >
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {overviewData?.statusBreakdown?.scheduled || 87}
            </p>
            <p className="text-sm text-gray-600 mt-1">Scheduled</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">
              {overviewData?.statusBreakdown?.inProgress || 24}
            </p>
            <p className="text-sm text-gray-600 mt-1">In Progress</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {overviewData?.statusBreakdown?.completed || 48}
            </p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">
              {overviewData?.statusBreakdown?.missed || 2}
            </p>
            <p className="text-sm text-gray-600 mt-1">Missed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-600">
              {overviewData?.statusBreakdown?.cancelled || 1}
            </p>
            <p className="text-sm text-gray-600 mt-1">Cancelled</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Performance Metrics */}
      <WidgetGrid columns={3}>
        <WidgetContainer title="On-Time Performance" variant="compact">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Check-In On Time</span>
              <span className="text-lg font-bold text-green-600">94.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
            </div>
            <p className="text-xs text-gray-500">+2.1% vs yesterday</p>
          </div>
        </WidgetContainer>

        <WidgetContainer title="Geofence Compliance" variant="compact">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Within Geofence</span>
              <span className="text-lg font-bold text-yellow-600">89.7%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '89.7%' }}></div>
            </div>
            <p className="text-xs text-gray-500">3 violations today</p>
          </div>
        </WidgetContainer>

        <WidgetContainer title="Schedule Utilization" variant="compact">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Capacity Used</span>
              <span className="text-lg font-bold text-blue-600">87.3%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.3%' }}></div>
            </div>
            <p className="text-xs text-gray-500">15 slots available</p>
          </div>
        </WidgetContainer>
      </WidgetGrid>

      {/* Quick Actions (Only for Scheduler role) */}
      {roleAccess.canAccessFeature(FeaturePermission.MANAGE_SCHEDULE) && (
        <WidgetContainer
          title="Quick Actions"
          icon={<AlertTriangle className="w-5 h-5" />}
        >
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/dashboard/scheduling'}
              className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Schedule
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/scheduling?view=open-slots'}
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Fill Open Slots
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/scheduling?view=conflicts'}
              className="px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Resolve Conflicts
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/scheduling?view=optimize'}
              className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Optimize Routes
            </button>
          </div>
        </WidgetContainer>
      )}
    </div>
  );
}

/**
 * Scheduling Tab - Schedule Management & Optimization
 */
function SchedulingTab() {
  const roleAccess = useRoleAccess();

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['operations', 'schedule'],
    queryFn: async () => {
      const response: any = await api.get('/operations/schedule');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading schedule data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Schedule Issues */}
      <WidgetContainer
        title="Schedule Issues Requiring Attention"
        subtitle="Real-time alerts for scheduling problems"
        icon={<AlertTriangle className="w-5 h-5" />}
        action={
          roleAccess.canAccessFeature(FeaturePermission.MANAGE_SCHEDULE)
            ? {
                label: 'Resolve All',
                onClick: () => (window.location.href = '/operations/schedule/resolve'),
              }
            : undefined
        }
      >
        {scheduleData?.issues?.length > 0 ? (
          <div className="space-y-3">
            {scheduleData.issues.map((issue: ScheduleIssue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{issue.caregiverName}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        issue.issueType === 'no_show'
                          ? 'bg-red-100 text-red-700'
                          : issue.issueType === 'late'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {issue.issueType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {issue.clientName} - {issue.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Scheduled: {new Date(issue.scheduledTime).toLocaleString()}
                  </p>
                </div>
                {roleAccess.canAccessFeature(FeaturePermission.MANAGE_SCHEDULE) && (
                  <button
                    onClick={() => alert(`Resolving ${issue.issueType} for ${issue.caregiverName} - ${issue.clientName}`)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            ✅ No schedule issues - All visits on track!
          </div>
        )}
      </WidgetContainer>

      {/* Schedule Optimization Suggestions */}
      {roleAccess.canAccessFeature(FeaturePermission.MANAGE_SCHEDULE) && (
        <WidgetContainer
          title="Optimization Suggestions"
          subtitle="AI-powered recommendations to improve scheduling efficiency"
          icon={<TrendingUp className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Reduce drive time by 45 minutes
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Reassign Jane Smith's 2pm visit to nearby caregiver John Doe (currently
                    has open slot)
                  </p>
                  <button
                    onClick={() => alert('Applying optimization: Reassign Jane Smith\'s 2pm visit to John Doe')}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Apply Suggestion →
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Fill 3 open slots this week</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Add new clients in zip codes 43215, 43214 to maximize utilization
                  </p>
                  <button
                    onClick={() => window.location.href = '/patients?status=available&zip=43215,43214'}
                    className="mt-2 text-sm text-green-600 hover:underline"
                  >
                    View Available Clients →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </WidgetContainer>
      )}

      {/* Schedule Calendar View */}
      <WidgetContainer title="Schedule Calendar" subtitle="Weekly view of all visits">
        <div className="text-center py-8 text-gray-500">
          📅 Schedule calendar visualization would go here
          <p className="text-sm mt-2">
            (Day/Week/Month views with drag-and-drop scheduling)
          </p>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * GPS Tracking Tab - Real-time Caregiver Location Monitoring
 */
function GPSTrackingTab() {
  const roleAccess = useRoleAccess();

  const { data: gpsData, isLoading } = useQuery({
    queryKey: ['operations', 'gps'],
    queryFn: async () => {
      const response: any = await api.get('/operations/gps');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading GPS data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Geofence Violations */}
      <WidgetContainer
        title="Geofence Violations"
        subtitle="Check-ins/outs outside client geofence boundary"
        icon={<AlertTriangle className="w-5 h-5" />}
        action={
          roleAccess.canAccessFeature(FeaturePermission.MANAGE_GEOFENCE)
            ? {
                label: 'Adjust Geofences',
                onClick: () => (window.location.href = '/operations/geofence/manage'),
              }
            : undefined
        }
      >
        {gpsData?.violations?.length > 0 ? (
          <div className="space-y-3">
            {gpsData.violations.map((violation: GeofenceViolation) => (
              <div
                key={violation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{violation.caregiverName}</span>
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      {violation.violationType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{violation.clientName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(violation.distance)}m from geofence -{' '}
                    {new Date(violation.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = `/operations/geofence/${violation.id}`}
                  className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            ✅ No geofence violations - All caregivers within boundaries!
          </div>
        )}
      </WidgetContainer>

      {/* Live Map View */}
      <WidgetContainer
        title="Live GPS Tracking Map"
        subtitle="Real-time caregiver locations"
        icon={<MapPin className="w-5 h-5" />}
      >
        <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-500">
          🗺️ Interactive map with caregiver pins would go here
          <p className="text-sm mt-2">
            (Google Maps integration showing real-time locations, geofence boundaries, and
            routes)
          </p>
        </div>
      </WidgetContainer>

      {/* Geofence Compliance Stats */}
      <WidgetGrid columns={3}>
        <StatWidget
          label="Within Geofence"
          value={gpsData?.compliance?.withinGeofence || '89.7%'}
          variant="success"
        />
        <StatWidget
          label="Minor Violations"
          value={gpsData?.compliance?.minorViolations || '7'}
          variant="warning"
        />
        <StatWidget
          label="Major Violations"
          value={gpsData?.compliance?.majorViolations || '3'}
          variant="danger"
        />
      </WidgetGrid>
    </div>
  );
}

/**
 * Mileage Tab - Mileage Reimbursement Tracking
 */
function MileageTab() {
  const roleAccess = useRoleAccess();

  const { data: mileageData, isLoading } = useQuery({
    queryKey: ['operations', 'mileage'],
    queryFn: async () => {
      const response: any = await api.get('/operations/mileage');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading mileage data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Mileage Summary */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Pending Approval"
          value={mileageData?.summary?.pendingCount || '12'}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <StatWidget
          label="Total Miles (Pending)"
          value={mileageData?.summary?.pendingMiles || '1,247'}
          icon={<Navigation className="w-5 h-5" />}
        />
        <StatWidget
          label="Pending Amount"
          value={mileageData?.summary?.pendingAmount || '$811.55'}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatWidget
          label="YTD Reimbursed"
          value={mileageData?.summary?.ytdReimbursed || '$42,350'}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
      </WidgetGrid>

      {/* Pending Mileage Reimbursements */}
      <WidgetContainer
        title="Pending Mileage Reimbursements"
        subtitle="Awaiting finance approval"
        icon={<DollarSign className="w-5 h-5" />}
        action={
          roleAccess.canAccessFeature(FeaturePermission.APPROVE_MILEAGE)
            ? {
                label: 'Approve All',
                onClick: () => (window.location.href = '/operations/mileage/approve-all'),
              }
            : undefined
        }
      >
        {mileageData?.pending?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Caregiver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Miles
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {roleAccess.canAccessFeature(FeaturePermission.APPROVE_MILEAGE) && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mileageData.pending.map((reimbursement: MileageReimbursement) => (
                  <tr key={reimbursement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {reimbursement.caregiverName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {reimbursement.period}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {reimbursement.totalMiles.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${reimbursement.reimbursementAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          reimbursement.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : reimbursement.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {reimbursement.status.toUpperCase()}
                      </span>
                    </td>
                    {roleAccess.canAccessFeature(FeaturePermission.APPROVE_MILEAGE) && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => alert(`Approving mileage reimbursement for ${reimbursement.caregiverName}: $${reimbursement.reimbursementAmount.toFixed(2)}`)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                        >
                          Approve
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            ✅ No pending mileage reimbursements
          </div>
        )}
      </WidgetContainer>

      {/* Mileage Insights */}
      <WidgetContainer title="Mileage Insights" subtitle="Cost optimization opportunities">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Top Mileage Caregivers (This Month)</h4>
            <div className="space-y-2">
              {[
                { name: 'Jane Smith', miles: 487, amount: '$316.55' },
                { name: 'John Doe', miles: 412, amount: '$267.80' },
                { name: 'Mary Johnson', miles: 398, amount: '$258.70' },
              ].map((caregiver, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">{caregiver.name}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold">{caregiver.miles} mi</p>
                    <p className="text-xs text-gray-600">{caregiver.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Cost Optimization Tips</h4>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-900">
                  💡 Cluster scheduling in zip codes 43215-43220
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Could save ~$180/month in mileage
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm font-medium text-green-900">
                  💡 Assign new clients to nearby caregivers
                </p>
                <p className="text-xs text-green-700 mt-1">Reduce drive time by 15%</p>
              </div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(
  OperationsCommandCenter,
  DashboardPermission.OPERATIONS_COMMAND_CENTER
);
