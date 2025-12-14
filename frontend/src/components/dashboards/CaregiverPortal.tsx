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
  withRoleAccess,
} from '@/hooks/useRoleAccess';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Award,
  TrendingUp,
  CheckCircle,
  Navigation,
} from 'lucide-react';

function CaregiverPortal() {
  const [selectedTab, setSelectedTab] = useState('today');

  // Fetch urgent items for caregivers
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['caregiver-portal', 'urgent'],
    queryFn: async () => {
      const [todayVisits, upcomingDeadlines] = await Promise.all([
        api.get('/caregiver-portal/visits/today'),
        api.get('/caregiver-portal/deadlines'),
      ]);
      return {
        todayVisits: todayVisits.data,
        upcomingDeadlines: upcomingDeadlines.data,
      };
    },
  });

  // Build urgent items
  const urgentItems = [
    // Today's visits
    ...(urgentData?.todayVisits || [])
      .filter((visit: any) => !visit.checkedIn && new Date(visit.scheduledTime) < new Date())
      .map((visit: any) => ({
        id: `visit-${visit.id}`,
        title: `⏰ Late Check-In: ${visit.clientName}`,
        description: `Scheduled for ${new Date(visit.scheduledTime).toLocaleTimeString()}`,
        priority: 'urgent' as const,
        action: {
          label: 'Check In Now',
          onClick: () => (window.location.href = `/caregiver/visits/${visit.id}/check-in`),
        },
      })),
    // Upcoming deadlines
    ...(urgentData?.upcomingDeadlines || [])
      .filter((deadline: any) => deadline.daysRemaining <= 3)
      .map((deadline: any) => ({
        id: `deadline-${deadline.id}`,
        title: `📋 ${deadline.title}`,
        description: `Due in ${deadline.daysRemaining} days`,
        priority: deadline.daysRemaining === 0 ? ('urgent' as const) : ('important' as const),
      })),
  ];

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'today',
      label: "Today's Schedule",
      icon: <Calendar className="w-4 h-4" />,
      content: <TodayScheduleTab />,
    },
    {
      id: 'schedule',
      label: 'My Schedule',
      icon: <Clock className="w-4 h-4" />,
      content: <ScheduleTab />,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <DollarSign className="w-4 h-4" />,
      content: <ExpensesTab />,
    },
    {
      id: 'training',
      label: 'Training',
      icon: <FileText className="w-4 h-4" />,
      content: <TrainingTab />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Award className="w-4 h-4" />,
      content: <PerformanceTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-4">
      <StatWidget
        label="Today's Visits"
        value={urgentData?.todayVisits?.length || '0'}
        icon={<Calendar className="w-4 h-4" />}
      />
      <StatWidget
        label="SPI Score"
        value="94.2"
        icon={<Award className="w-4 h-4" />}
        variant="success"
      />
    </div>
  );

  return (
    <DashboardLayout
      title="Caregiver Portal"
      subtitle="Your schedule, visits, and performance"
      urgentSection={urgentItems.length > 0 ? <UrgentSection items={urgentItems} /> : undefined}
      actions={headerActions}
    >
      <TabContainer
        tabs={tabs}
        defaultTab="today"
        onChange={(tabId) => setSelectedTab(tabId)}
      />
    </DashboardLayout>
  );
}

/**
 * Today's Schedule Tab
 */
function TodayScheduleTab() {
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['caregiver-portal', 'today'],
    queryFn: async () => {
      const response = await api.get('/caregiver-portal/visits/today');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading today's schedule...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Total Visits"
          value={todayData?.summary?.total || '0'}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatWidget
          label="Completed"
          value={todayData?.summary?.completed || '0'}
          variant="success"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatWidget
          label="In Progress"
          value={todayData?.summary?.inProgress || '0'}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatWidget
          label="Upcoming"
          value={todayData?.summary?.upcoming || '0'}
          icon={<Navigation className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Today's Visits */}
      <WidgetContainer title="Today's Visits" subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}>
        <div className="space-y-4">
          {(todayData?.visits || []).map((visit: any) => (
            <div
              key={visit.id}
              className={`p-4 border-l-4 rounded-lg ${
                visit.status === 'completed'
                  ? 'border-green-500 bg-green-50'
                  : visit.status === 'in_progress'
                    ? 'border-blue-500 bg-blue-50'
                    : visit.status === 'missed'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{visit.clientName}</h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        visit.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : visit.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : visit.status === 'missed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {visit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(visit.scheduledStart).toLocaleTimeString()} -{' '}
                        {new Date(visit.scheduledEnd).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{visit.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{visit.services.join(', ')}</span>
                    </div>
                  </div>
                  {visit.notes && (
                    <p className="mt-2 text-sm text-gray-700 italic">{visit.notes}</p>
                  )}
                </div>
                <div className="ml-4 space-y-2">
                  {visit.status === 'scheduled' && (
                    <>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                        Check In
                      </button>
                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                        Navigate
                      </button>
                    </>
                  )}
                  {visit.status === 'in_progress' && (
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                      Check Out
                    </button>
                  )}
                  {visit.status === 'completed' && (
                    <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Schedule Tab
 */
function ScheduleTab() {
  const [view, setView] = useState<'week' | 'month'>('week');

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">My Schedule</h3>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setView('week')}
          >
            Week View
          </button>
          <button
            className={`px-4 py-2 rounded-md ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setView('month')}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Calendar */}
      <WidgetContainer>
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📅 {view === 'week' ? 'Week' : 'Month'} calendar view would go here
            <p className="text-sm mt-2">(Interactive calendar showing all scheduled visits)</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Upcoming Visits Summary */}
      <WidgetContainer title="Upcoming Visits (Next 7 Days)">
        <div className="space-y-2">
          {[
            { date: 'Tomorrow', count: 5 },
            { date: 'Monday', count: 6 },
            { date: 'Tuesday', count: 4 },
            { date: 'Wednesday', count: 5 },
          ].map((day, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium text-gray-900">{day.date}</span>
              <span className="text-sm text-gray-600">{day.count} visits</span>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Expenses Tab
 */
function ExpensesTab() {
  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <WidgetGrid columns={3}>
        <StatWidget
          label="This Month"
          value="$247.50"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatWidget
          label="Pending Approval"
          value="$180.00"
          variant="warning"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatWidget
          label="Approved"
          value="$67.50"
          variant="success"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Submit Expense */}
      <WidgetContainer
        title="Submit New Expense"
        action={{
          label: 'Submit Expense',
          onClick: () => {},
        }}
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option>Mileage</option>
                <option>Supplies</option>
                <option>Training</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Describe the expense..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt</label>
            <input type="file" className="w-full" />
          </div>
        </form>
      </WidgetContainer>

      {/* Recent Expenses */}
      <WidgetContainer title="Recent Expense Submissions">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { date: '2025-12-12', type: 'Mileage', amount: 48.5, status: 'pending' },
                { date: '2025-12-10', type: 'Supplies', amount: 19.0, status: 'approved' },
                { date: '2025-12-08', type: 'Mileage', amount: 67.5, status: 'approved' },
              ].map((expense, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{expense.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expense.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        expense.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {expense.status.toUpperCase()}
                    </span>
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
 * Training Tab
 */
function TrainingTab() {
  return (
    <div className="space-y-6">
      {/* Training Progress */}
      <WidgetGrid columns={3}>
        <StatWidget
          label="Completed"
          value="11/11"
          variant="success"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatWidget
          label="In Progress"
          value="0"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatWidget
          label="Overdue"
          value="0"
          icon={<FileText className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Required Training */}
      <WidgetContainer title="Required Training Courses">
        <div className="space-y-3">
          {[
            { course: 'Ohio Caregiver Training (75hr)', completed: true, dueDate: null },
            { course: 'CPR & First Aid', completed: true, dueDate: '2026-06-15' },
            { course: 'HIPAA Privacy & Security', completed: true, dueDate: '2026-01-01' },
            { course: 'Infection Control', completed: true, dueDate: '2026-01-01' },
          ].map((training, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                {training.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{training.course}</p>
                  {training.dueDate && (
                    <p className="text-sm text-gray-600">
                      {training.completed ? 'Valid until' : 'Due'}: {training.dueDate}
                    </p>
                  )}
                </div>
              </div>
              {training.completed ? (
                <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                  COMPLETED
                </span>
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  Start Course
                </button>
              )}
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Performance Tab
 */
function PerformanceTab() {
  return (
    <div className="space-y-6">
      {/* SPI Score */}
      <WidgetContainer
        title="Service Provider Index (SPI) Score"
        subtitle="Your overall performance rating"
        icon={<Award className="w-5 h-5" />}
      >
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-4xl font-bold text-green-600">94.2</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Tier: Gold</p>
          </div>
          <div className="flex-1 space-y-3">
            <ScoreRow label="Visit Completion Rate" score={98} />
            <ScoreRow label="On-Time Check-In" score={96} />
            <ScoreRow label="Geofence Compliance" score={92} />
            <ScoreRow label="Client Satisfaction" score={95} />
            <ScoreRow label="Documentation Quality" score={89} />
          </div>
        </div>
      </WidgetContainer>

      {/* Performance Metrics */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Visits This Month"
          value="87"
          change={{ value: 8, isPositive: true, label: 'vs last month' }}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatWidget
          label="Avg Rating"
          value="4.8/5"
          variant="success"
          icon={<Award className="w-5 h-5" />}
        />
        <StatWidget
          label="No-Shows"
          value="0"
          variant="success"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatWidget
          label="Late Check-Ins"
          value="2"
          variant="warning"
          icon={<Clock className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Recent Feedback */}
      <WidgetContainer title="Recent Client Feedback">
        <div className="space-y-3">
          {[
            { client: 'Mrs. Johnson', rating: 5, comment: 'Excellent care! Very compassionate.' },
            { client: 'Mr. Smith', rating: 5, comment: 'Always on time and professional.' },
            { client: 'Mrs. Davis', rating: 4, comment: 'Great caregiver, very helpful.' },
          ].map((feedback, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{feedback.client}</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">"{feedback.comment}"</p>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Score Row Component
 */
function ScoreRow({ label, score }: { label: string; score: number }) {
  const getColor = () => {
    if (score >= 95) return 'bg-green-600';
    if (score >= 85) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${getColor()}`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(CaregiverPortal, DashboardPermission.CAREGIVER_PORTAL);
