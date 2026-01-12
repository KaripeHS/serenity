import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
  Users,
  Phone,
  Mail,
  AlertTriangle,
  Shield,
  BookOpen,
  HelpCircle,
  CreditCard,
  Heart,
  ClipboardList,
} from 'lucide-react';

function CaregiverPortal() {
  const [selectedTab, setSelectedTab] = useState('today');

  // Fetch urgent items for caregivers
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['caregiver-portal', 'urgent'],
    queryFn: async () => {
      const [todayVisits, upcomingDeadlines]: any[] = await Promise.all([
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
      id: 'patients',
      label: 'My Patients',
      icon: <Users className="w-4 h-4" />,
      content: <MyPatientsTab />,
    },
    {
      id: 'schedule',
      label: 'My Schedule',
      icon: <Clock className="w-4 h-4" />,
      content: <ScheduleTab />,
    },
    {
      id: 'pay',
      label: 'My Pay',
      icon: <CreditCard className="w-4 h-4" />,
      content: <MyPayTab />,
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
    {
      id: 'resources',
      label: 'Resources',
      icon: <HelpCircle className="w-4 h-4" />,
      content: <ResourcesTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions - clickable stats
  const headerActions = (
    <div className="flex items-center gap-4">
      <div
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setSelectedTab('today')}
        title="Click to view today's schedule"
      >
        <StatWidget
          label="Today's Visits"
          value={urgentData?.todayVisits?.length || '0'}
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>
      <div
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setSelectedTab('performance')}
        title="Click to view performance details"
      >
        <StatWidget
          label="SPI Score"
          value="94.2"
          icon={<Award className="w-4 h-4" />}
          variant="success"
        />
      </div>
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

  // Helper to scroll to visit section
  const scrollToVisits = () => {
    document.getElementById('today-visits-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Summary - Clickable Stats */}
      <WidgetGrid columns={4}>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={scrollToVisits} title="Click to view all visits">
          <StatWidget
            label="Total Visits"
            value={todayData?.summary?.total || '0'}
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={scrollToVisits} title="Click to view completed visits">
          <StatWidget
            label="Completed"
            value={todayData?.summary?.completed || '0'}
            variant="success"
            icon={<CheckCircle className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={scrollToVisits} title="Click to view in-progress visits">
          <StatWidget
            label="In Progress"
            value={todayData?.summary?.inProgress || '0'}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={scrollToVisits} title="Click to view upcoming visits">
          <StatWidget
            label="Upcoming"
            value={todayData?.summary?.upcoming || '0'}
            icon={<Navigation className="w-5 h-5" />}
          />
        </div>
      </WidgetGrid>

      {/* Today's Visits */}
      <div id="today-visits-section">
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
                      <button
                        onClick={() => window.location.href = `/caregiver/visits/${visit.id}/check-in`}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Check In
                      </button>
                      <button
                        onClick={() => {
                          const address = encodeURIComponent(visit.address);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Navigate
                      </button>
                    </>
                  )}
                  {visit.status === 'in_progress' && (
                    <button
                      onClick={() => window.location.href = `/caregiver/visits/${visit.id}/check-out`}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Check Out
                    </button>
                  )}
                  {visit.status === 'completed' && (
                    <button
                      onClick={() => window.location.href = `/caregiver/visits/${visit.id}/details`}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                    >
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
  const navigate = useNavigate();

  // Scroll to training list
  const scrollToTraining = () => {
    document.getElementById('training-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Training Progress - Clickable */}
      <WidgetGrid columns={3}>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={scrollToTraining} title="View completed training">
          <StatWidget
            label="Completed"
            value="11/11"
            variant="success"
            icon={<CheckCircle className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={scrollToTraining} title="View in-progress training">
          <StatWidget
            label="In Progress"
            value="0"
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all rounded-lg" onClick={() => navigate('/dashboard/training')} title="View overdue training">
          <StatWidget
            label="Overdue"
            value="0"
            icon={<FileText className="w-5 h-5" />}
          />
        </div>
      </WidgetGrid>

      {/* Required Training */}
      <div id="training-list">
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
    </div>
  );
}

/**
 * Performance Tab
 */
function PerformanceTab() {
  const navigate = useNavigate();
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

/**
 * My Patients Tab - View assigned patients and care plans
 */
function MyPatientsTab() {
  // Mock patient data - will be replaced with API call
  const mockPatients = [
    {
      id: '1',
      name: 'Mary Johnson',
      address: '123 Oak Street, Columbus, OH',
      phone: '(614) 555-1234',
      diagnosis: 'Diabetes Type 2, Hypertension',
      allergies: 'Penicillin',
      emergencyContact: 'John Johnson (Son) - (614) 555-5678',
      carePlanSummary: 'ADL assistance, medication reminders, light housekeeping',
      nextVisit: '2025-01-06 8:00 AM',
      specialInstructions: 'Patient prefers morning visits. Use walker for ambulation.',
    },
    {
      id: '2',
      name: 'Robert Williams',
      address: '456 Maple Ave, Columbus, OH',
      phone: '(614) 555-2345',
      diagnosis: 'COPD, CHF',
      allergies: 'None known',
      emergencyContact: 'Sarah Williams (Wife) - (614) 555-6789',
      carePlanSummary: 'Vital signs monitoring, medication management, respiratory exercises',
      nextVisit: '2025-01-06 10:00 AM',
      specialInstructions: 'O2 at 2L via nasal cannula. Check pulse ox every visit.',
    },
    {
      id: '3',
      name: 'Patricia Davis',
      address: '789 Elm Drive, Columbus, OH',
      phone: '(614) 555-3456',
      diagnosis: 'Alzheimer\'s Disease (mild)',
      allergies: 'Sulfa drugs',
      emergencyContact: 'Mike Davis (Son) - (614) 555-7890',
      carePlanSummary: 'Supervision, meal preparation, medication reminders, companionship',
      nextVisit: '2025-01-07 9:00 AM',
      specialInstructions: 'Use memory cues. Keep routine consistent. Family photos in living room help orientation.',
    },
  ];

  const [selectedPatient, setSelectedPatient] = useState<typeof mockPatients[0] | null>(null);

  return (
    <div className="space-y-6">
      {/* Patient List */}
      <WidgetContainer title="My Assigned Patients" subtitle="Click a patient to view care plan details">
        <div className="space-y-3">
          {mockPatients.map((patient) => (
            <div
              key={patient.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPatient?.id === patient.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{patient.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{patient.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Next visit: {patient.nextVisit}</span>
                  </div>
                </div>
                <Link
                  to={`/patients/${patient.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Full Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>

      {/* Selected Patient Care Plan */}
      {selectedPatient && (
        <WidgetContainer
          title={`Care Plan: ${selectedPatient.name}`}
          subtitle="Instructions from your clinical supervisor"
          icon={<ClipboardList className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Info */}
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h5>
                <p className="text-gray-900">{selectedPatient.phone}</p>
                <p className="text-gray-600 text-sm">{selectedPatient.address}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-1">Emergency Contact</h5>
                <p className="text-gray-900">{selectedPatient.emergencyContact}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-1">Diagnosis</h5>
                <p className="text-gray-900">{selectedPatient.diagnosis}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-red-500 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Allergies
                </h5>
                <p className="text-red-600 font-medium">{selectedPatient.allergies}</p>
              </div>
            </div>

            {/* Care Instructions */}
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-1">Care Plan Summary</h5>
                <p className="text-gray-900">{selectedPatient.carePlanSummary}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-yellow-800 mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Special Instructions from RN
                </h5>
                <p className="text-yellow-900">{selectedPatient.specialInstructions}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  View Full Care Plan
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                  View Visit History
                </button>
              </div>
            </div>
          </div>
        </WidgetContainer>
      )}

      {/* Quick Actions */}
      <WidgetContainer title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/dashboard/incidents"
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition text-center"
          >
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-red-700">Report Incident</span>
          </Link>
          <a
            href="tel:+16145551234"
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-center"
          >
            <Phone className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700">Call Supervisor</span>
          </a>
          <Link
            to="/evv/clock"
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-center"
          >
            <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-700">EVV Clock</span>
          </Link>
          <Link
            to="/dashboard/scheduling-calendar"
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition text-center"
          >
            <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-700">View Schedule</span>
          </Link>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * My Pay Tab - View wages, bonuses, and pay history
 */
function MyPayTab() {
  return (
    <div className="space-y-6">
      {/* Current Pay Period */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Current Pay Period"
          value="$1,247.50"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatWidget
          label="Hours Worked"
          value="38.5"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatWidget
          label="Hourly Rate"
          value="$16.50"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatWidget
          label="Pending Bonus"
          value="$125.00"
          variant="success"
          icon={<Award className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* Pay Rate Information */}
      <WidgetContainer title="My Pay Rate" icon={<CreditCard className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Base Hourly Rate</span>
              <span className="font-bold text-gray-900">$16.50/hr</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Weekend Differential</span>
              <span className="font-bold text-green-600">+$2.00/hr</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Holiday Rate</span>
              <span className="font-bold text-green-600">1.5x ($24.75/hr)</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Mileage Reimbursement</span>
              <span className="font-bold text-gray-900">$0.67/mile</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Active Bonus Programs</h4>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex justify-between">
                <span className="text-green-800">90-Day Retention Bonus</span>
                <span className="font-bold text-green-600">$500</span>
              </div>
              <p className="text-sm text-green-700 mt-1">Eligible on: March 15, 2025</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex justify-between">
                <span className="text-blue-800">Show-Up Bonus (per shift)</span>
                <span className="font-bold text-blue-600">$5.00</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <div className="flex justify-between">
                <span className="text-purple-800">Hours Bonus (1% of wages)</span>
                <span className="font-bold text-purple-600">~$12/week</span>
              </div>
            </div>
          </div>
        </div>
      </WidgetContainer>

      {/* Recent Pay Stubs */}
      <WidgetContainer title="Recent Pay Stubs" action={{ label: 'View All', onClick: () => {} }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { period: 'Dec 16 - Dec 31, 2024', hours: 76, gross: 1320.00, net: 1056.00 },
                { period: 'Dec 1 - Dec 15, 2024', hours: 80, gross: 1380.00, net: 1104.00 },
                { period: 'Nov 16 - Nov 30, 2024', hours: 72, gross: 1254.00, net: 1003.20 },
              ].map((stub, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{stub.period}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{stub.hours}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">${stub.gross.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${stub.net.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">View Stub</button>
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
 * Resources Tab - Contact info, policies, help
 */
function ResourcesTab() {
  return (
    <div className="space-y-6">
      {/* Key Contacts */}
      <WidgetContainer title="Key Contacts" icon={<Phone className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">My Pod Lead</h4>
            <p className="text-gray-600">Sarah Johnson</p>
            <div className="flex gap-2 mt-2">
              <a href="tel:+16145551234" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                <Phone className="w-4 h-4" /> (614) 555-1234
              </a>
              <a href="mailto:sjohnson@serenitycarepartners.com" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-4">
                <Mail className="w-4 h-4" /> Email
              </a>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">HR Department</h4>
            <p className="text-gray-600">For scheduling, pay, and benefits</p>
            <div className="flex gap-2 mt-2">
              <a href="tel:+16145551235" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                <Phone className="w-4 h-4" /> (614) 555-1235
              </a>
              <a href="mailto:hr@serenitycarepartners.com" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-4">
                <Mail className="w-4 h-4" /> Email
              </a>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Clinical Questions</h4>
            <p className="text-gray-600">RN Supervisor / DON</p>
            <div className="flex gap-2 mt-2">
              <a href="tel:+16145551236" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                <Phone className="w-4 h-4" /> (614) 555-1236
              </a>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">Emergency After-Hours</h4>
            <p className="text-red-700">For urgent clinical/safety issues</p>
            <a href="tel:+16145559999" className="flex items-center gap-1 text-red-600 font-bold mt-2">
              <Phone className="w-4 h-4" /> (614) 555-9999
            </a>
          </div>
        </div>
      </WidgetContainer>

      {/* Quick Links */}
      <WidgetContainer title="Policies & Resources" icon={<BookOpen className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="#" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">HIPAA Guidelines</p>
              <p className="text-sm text-gray-500">Privacy and security requirements</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <FileText className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Employee Handbook</p>
              <p className="text-sm text-gray-500">Policies and procedures</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Emergency Procedures</p>
              <p className="text-sm text-gray-500">What to do in emergencies</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <Heart className="w-5 h-5 text-pink-600" />
            <div>
              <p className="font-medium text-gray-900">Infection Control</p>
              <p className="text-sm text-gray-500">PPE and safety protocols</p>
            </div>
          </a>
          <Link to="/dashboard/training" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <Award className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Training Portal</p>
              <p className="text-sm text-gray-500">Required courses and certifications</p>
            </div>
          </Link>
          <a href="#" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">FAQ & Help</p>
              <p className="text-sm text-gray-500">Common questions answered</p>
            </div>
          </a>
        </div>
      </WidgetContainer>

      {/* Credential Status */}
      <WidgetContainer title="My Credentials" icon={<Shield className="w-5 h-5" />}>
        <div className="space-y-3">
          {[
            { name: 'CPR/First Aid Certification', expiry: '2026-06-15', status: 'valid', daysLeft: 160 },
            { name: 'Ohio STNA License', expiry: '2026-01-01', status: 'valid', daysLeft: 360 },
            { name: 'Background Check (BCI/FBI)', expiry: '2026-03-15', status: 'valid', daysLeft: 68 },
            { name: 'TB Test', expiry: '2025-06-01', status: 'expiring_soon', daysLeft: 145 },
          ].map((cred, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
              cred.status === 'expiring_soon' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
            }`}>
              <div>
                <p className="font-medium text-gray-900">{cred.name}</p>
                <p className="text-sm text-gray-600">Expires: {cred.expiry}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  cred.daysLeft > 90 ? 'bg-green-100 text-green-700' :
                  cred.daysLeft > 30 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {cred.daysLeft} days left
                </span>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(CaregiverPortal, DashboardPermission.CAREGIVER_PORTAL);
