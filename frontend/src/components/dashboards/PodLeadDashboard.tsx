/**
 * Pod Lead Dashboard
 * The "Mini-COO" portal for pod leads to manage their pod independently
 * within RBAC/HIPAA boundaries
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Tab type definition
type TabId = 'overview' | 'team' | 'clients' | 'operations' | 'schedule' | 'approvals' | 'metrics' | 'incidents' | 'resources';

interface TabConfig {
  id: TabId;
  name: string;
  icon: React.ComponentType<any>;
}

const tabs: TabConfig[] = [
  { id: 'overview', name: 'My Pod', icon: HomeIcon },
  { id: 'team', name: 'My Team', icon: UserGroupIcon },
  { id: 'clients', name: 'My Clients', icon: UsersIcon },
  { id: 'operations', name: "Today's Ops", icon: ClockIcon },
  { id: 'schedule', name: 'Scheduling', icon: CalendarIcon },
  { id: 'approvals', name: 'Approvals', icon: ClipboardDocumentCheckIcon },
  { id: 'metrics', name: 'Pod Metrics', icon: ChartBarIcon },
  { id: 'incidents', name: 'Incidents', icon: ExclamationTriangleIcon },
  { id: 'resources', name: 'Resources', icon: QuestionMarkCircleIcon },
];

// Mock data for demonstration - will be replaced with API calls
const mockPodData = {
  podName: 'Columbus Central Pod',
  region: 'Central Ohio',
  podLeadName: 'Sarah Johnson',
  clientCount: 45,
  caregiverCount: 12,
  activeToday: 10,
  spiScore: 87,
  evvCompliance: 94,
  coverageRate: 92,
  hoursThisWeek: 480,
  targetHours: 520,
  satisfactionScore: 4.6,
};

const mockCaregivers = [
  { id: '1', name: 'Maria Garcia', status: 'active', currentLocation: 'Client: Johnson, M.', trainingCompliance: 100, credentialExpiry: 45, spiScore: 92, clockedIn: true },
  { id: '2', name: 'James Wilson', status: 'active', currentLocation: 'In Transit', trainingCompliance: 85, credentialExpiry: 12, spiScore: 88, clockedIn: true },
  { id: '3', name: 'Emily Davis', status: 'active', currentLocation: 'Client: Williams, R.', trainingCompliance: 100, credentialExpiry: 90, spiScore: 95, clockedIn: true },
  { id: '4', name: 'Robert Brown', status: 'on_leave', currentLocation: 'N/A', trainingCompliance: 75, credentialExpiry: 30, spiScore: 82, clockedIn: false },
  { id: '5', name: 'Lisa Martinez', status: 'active', currentLocation: 'Not Started', trainingCompliance: 90, credentialExpiry: 60, spiScore: 89, clockedIn: false },
];

const mockClients = [
  { id: '1', name: 'Mary Johnson', status: 'active', assignedCaregiver: 'Maria Garcia', authUnitsRemaining: 120, authExpiring: false, lastVisit: '2025-01-05', nextVisit: '2025-01-06' },
  { id: '2', name: 'Robert Williams', status: 'active', assignedCaregiver: 'Emily Davis', authUnitsRemaining: 24, authExpiring: true, lastVisit: '2025-01-05', nextVisit: '2025-01-06' },
  { id: '3', name: 'Patricia Davis', status: 'active', assignedCaregiver: 'James Wilson', authUnitsRemaining: 200, authExpiring: false, lastVisit: '2025-01-04', nextVisit: '2025-01-07' },
  { id: '4', name: 'James Brown', status: 'on_hold', assignedCaregiver: 'Unassigned', authUnitsRemaining: 0, authExpiring: false, lastVisit: '2024-12-20', nextVisit: null },
];

const mockTodayVisits = [
  { id: '1', client: 'Mary Johnson', caregiver: 'Maria Garcia', scheduledTime: '8:00 AM', status: 'in_progress', clockIn: '7:58 AM', clockOut: null },
  { id: '2', client: 'Robert Williams', caregiver: 'Emily Davis', scheduledTime: '9:00 AM', status: 'in_progress', clockIn: '9:02 AM', clockOut: null },
  { id: '3', client: 'Patricia Davis', caregiver: 'James Wilson', scheduledTime: '10:00 AM', status: 'scheduled', clockIn: null, clockOut: null },
  { id: '4', client: 'Linda Martinez', caregiver: 'Lisa Martinez', scheduledTime: '11:00 AM', status: 'not_started', clockIn: null, clockOut: null },
];

const mockApprovals = [
  { id: '1', type: 'expense', requester: 'Maria Garcia', description: 'Mileage reimbursement - 45 miles', amount: 29.25, date: '2025-01-05', status: 'pending' },
  { id: '2', type: 'time_off', requester: 'James Wilson', description: 'PTO Request - Jan 15-17', amount: null, date: '2025-01-04', status: 'pending' },
  { id: '3', type: 'timesheet', requester: 'Emily Davis', description: 'Week ending 01/05/2025 - 38 hours', amount: null, date: '2025-01-05', status: 'pending' },
];

const mockIncidents = [
  { id: '1', client: 'Mary Johnson', type: 'Fall', severity: 'reportable', date: '2025-01-04', status: 'open', reporter: 'Maria Garcia' },
  { id: '2', client: 'Robert Williams', type: 'Medication Error', severity: 'critical', date: '2025-01-03', status: 'investigating', reporter: 'Emily Davis' },
];

export default function PodLeadDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
      case 'on_leave':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">On Leave</span>;
      case 'on_hold':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">On Hold</span>;
      case 'terminated':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Terminated</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCredentialWarning = (days: number) => {
    if (days <= 14) return 'text-red-600 font-bold';
    if (days <= 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Pod Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{mockPodData.podName}</h2>
            <p className="text-blue-100 flex items-center gap-2 mt-1">
              <MapPinIcon className="h-4 w-4" />
              {mockPodData.region}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{mockPodData.spiScore}</div>
            <div className="text-blue-100 text-sm">Pod SPI Score</div>
          </div>
        </div>
      </div>

      {/* Urgent Alerts */}
      {(mockIncidents.filter(i => i.severity === 'critical').length > 0 ||
        mockCaregivers.filter(c => c.credentialExpiry <= 14).length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BellAlertIcon className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-900">Urgent Alerts</h3>
          </div>
          <ul className="space-y-2">
            {mockIncidents.filter(i => i.severity === 'critical').map(incident => (
              <li key={incident.id} className="text-sm text-red-700 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Critical incident: {incident.type} - {incident.client} (requires 24hr ODA reporting)
              </li>
            ))}
            {mockCaregivers.filter(c => c.credentialExpiry <= 14).map(cg => (
              <li key={cg.id} className="text-sm text-red-700 flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                Credential expiring: {cg.name} - {cg.credentialExpiry} days remaining
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('clients')}>
          <div className="flex items-center justify-between">
            <UsersIcon className="h-8 w-8 text-blue-500" />
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{mockPodData.clientCount}</div>
            <div className="text-sm text-gray-500">Active Clients</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('team')}>
          <div className="flex items-center justify-between">
            <UserGroupIcon className="h-8 w-8 text-green-500" />
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{mockPodData.activeToday}/{mockPodData.caregiverCount}</div>
            <div className="text-sm text-gray-500">Caregivers Active</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('operations')}>
          <div className="flex items-center justify-between">
            <CheckCircleIcon className="h-8 w-8 text-purple-500" />
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{mockPodData.evvCompliance}%</div>
            <div className="text-sm text-gray-500">EVV Compliance</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('schedule')}>
          <div className="flex items-center justify-between">
            <CalendarIcon className="h-8 w-8 text-orange-500" />
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{mockPodData.coverageRate}%</div>
            <div className="text-sm text-gray-500">Coverage Rate</div>
          </div>
        </div>
      </div>

      {/* Hours & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-900 mb-3">Hours This Week</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-blue-600">{mockPodData.hoursThisWeek}</span>
            <span className="text-gray-500 mb-1">/ {mockPodData.targetHours} target</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${Math.min((mockPodData.hoursThisWeek / mockPodData.targetHours) * 100, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {Math.round((mockPodData.hoursThisWeek / mockPodData.targetHours) * 100)}% of weekly target
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-900 mb-3">Client Satisfaction</h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-green-600">{mockPodData.satisfactionScore}</div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`text-xl ${star <= Math.round(mockPodData.satisfactionScore) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">Based on recent feedback</div>
        </div>
      </div>

      {/* Pending Approvals Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Pending Approvals</h3>
          <button
            onClick={() => setActiveTab('approvals')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </button>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">{mockApprovals.filter(a => a.type === 'expense').length}</span>
            </div>
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">{mockApprovals.filter(a => a.type === 'time_off').length}</span>
            </div>
            <span className="text-sm text-gray-600">Time Off</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">{mockApprovals.filter(a => a.type === 'timesheet').length}</span>
            </div>
            <span className="text-sm text-gray-600">Timesheets</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Team Tab
  const renderTeam = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Team ({mockCaregivers.length} Caregivers)</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          <PaperAirplaneIcon className="h-4 w-4 inline mr-2" />
          Send Team Announcement
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caregiver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credentials</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SPI</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockCaregivers.map(caregiver => (
              <tr key={caregiver.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${caregiver.clockedIn ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <Link to={`/hr/staff/${caregiver.id}`} className="text-blue-600 hover:underline font-medium">
                      {caregiver.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-4">{getStatusBadge(caregiver.status)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{caregiver.currentLocation}</td>
                <td className="px-4 py-4">
                  <span className={`font-medium ${getComplianceColor(caregiver.trainingCompliance)}`}>
                    {caregiver.trainingCompliance}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={getCredentialWarning(caregiver.credentialExpiry)}>
                    {caregiver.credentialExpiry} days
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium">{caregiver.spiScore}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Message</button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm">Schedule</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Clients Tab
  const renderClients = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Clients ({mockClients.length})</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Caregiver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth Units</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Visit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockClients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <Link to={`/patients/${client.id}`} className="text-blue-600 hover:underline font-medium">
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-4">{getStatusBadge(client.status)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{client.assignedCaregiver}</td>
                <td className="px-4 py-4">
                  <span className={`font-medium ${client.authExpiring ? 'text-red-600' : 'text-gray-900'}`}>
                    {client.authUnitsRemaining}
                    {client.authExpiring && <span className="ml-1 text-xs text-red-500">(expiring)</span>}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{client.lastVisit}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{client.nextVisit || '-'}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Link to={`/patients/${client.id}`} className="text-blue-600 hover:text-blue-800 text-sm">View</Link>
                    <button className="text-gray-600 hover:text-gray-800 text-sm">Schedule</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Today's Operations Tab
  const renderOperations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today's Operations</h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {mockTodayVisits.filter(v => v.status === 'completed' || v.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-500">Visits In Progress/Complete</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{mockTodayVisits.length}</div>
          <div className="text-sm text-gray-500">Total Scheduled</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{mockPodData.evvCompliance}%</div>
          <div className="text-sm text-gray-500">EVV Compliance</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">
            {mockTodayVisits.filter(v => v.status === 'not_started').length}
          </div>
          <div className="text-sm text-gray-500">Not Yet Started</div>
        </div>
      </div>

      {/* Today's Visits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-medium">Today's Visit Schedule</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caregiver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockTodayVisits.map(visit => (
              <tr key={visit.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-medium">{visit.client}</td>
                <td className="px-4 py-4">{visit.caregiver}</td>
                <td className="px-4 py-4">{visit.scheduledTime}</td>
                <td className="px-4 py-4">
                  {visit.clockIn ? (
                    <span className="text-green-600">{visit.clockIn}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {visit.clockOut ? (
                    <span className="text-green-600">{visit.clockOut}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {visit.status === 'in_progress' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Progress</span>
                  )}
                  {visit.status === 'scheduled' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Scheduled</span>
                  )}
                  {visit.status === 'not_started' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Not Started</span>
                  )}
                  {visit.status === 'completed' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Completed</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {visit.status === 'not_started' && (
                    <button className="text-orange-600 hover:text-orange-800 text-sm">Dispatch</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Schedule Tab
  const renderSchedule = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pod Schedule</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            Request Coverage
          </button>
          <Link to="/dashboard/scheduling-calendar" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            Open Full Calendar
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p>Schedule view will display here</p>
          <p className="text-sm">Click "Open Full Calendar" for detailed scheduling</p>
        </div>
      </div>
    </div>
  );

  // Approvals Tab
  const renderApprovals = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pending Approvals ({mockApprovals.length})</h2>

      <div className="space-y-4">
        {mockApprovals.map(approval => (
          <div key={approval.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {approval.type === 'expense' && <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />}
                  {approval.type === 'time_off' && <CalendarIcon className="h-5 w-5 text-blue-500" />}
                  {approval.type === 'timesheet' && <ClockIcon className="h-5 w-5 text-green-500" />}
                  <span className="font-medium capitalize">{approval.type.replace('_', ' ')}</span>
                </div>
                <p className="text-gray-900">{approval.description}</p>
                <p className="text-sm text-gray-500">Requested by {approval.requester} on {approval.date}</p>
                {approval.amount && (
                  <p className="text-lg font-semibold text-gray-900 mt-2">${approval.amount.toFixed(2)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                  Approve
                </button>
                <button className="px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm">
                  Deny
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Metrics Tab
  const renderMetrics = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pod Metrics & Reports</h2>
        <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Billable Hours (MTD)</h3>
          <div className="text-2xl font-bold">{mockPodData.hoursThisWeek * 4}</div>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-4 w-4" /> +5% vs last month
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">EVV Compliance</h3>
          <div className="text-2xl font-bold">{mockPodData.evvCompliance}%</div>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-4 w-4" /> Target: 95%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Client Satisfaction</h3>
          <div className="text-2xl font-bold">{mockPodData.satisfactionScore}/5.0</div>
          <div className="text-sm text-gray-500">Based on 12 reviews</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Caregiver Retention</h3>
          <div className="text-2xl font-bold">92%</div>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-4 w-4" /> +3% vs avg
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Auth Utilization</h3>
          <div className="text-2xl font-bold">87%</div>
          <div className="text-sm text-yellow-600">2 clients low on units</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pod Ranking</h3>
          <div className="text-2xl font-bold">#2</div>
          <div className="text-sm text-gray-500">of 5 pods</div>
        </div>
      </div>
    </div>
  );

  // Incidents Tab
  const renderIncidents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pod Incidents ({mockIncidents.length})</h2>
        <Link to="/dashboard/incidents" className="text-blue-600 hover:text-blue-800 text-sm">
          View All Incidents →
        </Link>
      </div>

      <div className="space-y-4">
        {mockIncidents.map(incident => (
          <div key={incident.id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${
            incident.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    incident.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {incident.severity}
                  </span>
                  <span className="font-medium">{incident.type}</span>
                </div>
                <p className="text-gray-900">Client: {incident.client}</p>
                <p className="text-sm text-gray-500">Reported by {incident.reporter} on {incident.date}</p>
              </div>
              <div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  incident.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {incident.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Resources Tab
  const renderResources = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Resources & Support</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Cards */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3">Key Contacts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Admin Office</p>
                <p className="text-sm text-gray-500">General inquiries</p>
              </div>
              <div className="flex gap-2">
                <a href="tel:+16145551234" className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200">
                  <PhoneIcon className="h-4 w-4" />
                </a>
                <a href="mailto:admin@serenitycarepartners.com" className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200">
                  <EnvelopeIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium">HR Department</p>
                <p className="text-sm text-gray-500">Staff issues, policies</p>
              </div>
              <div className="flex gap-2">
                <a href="tel:+16145551235" className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200">
                  <PhoneIcon className="h-4 w-4" />
                </a>
                <a href="mailto:hr@serenitycarepartners.com" className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200">
                  <EnvelopeIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Clinical Director</p>
                <p className="text-sm text-gray-500">Clinical questions</p>
              </div>
              <div className="flex gap-2">
                <a href="tel:+16145551236" className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200">
                  <PhoneIcon className="h-4 w-4" />
                </a>
                <a href="mailto:clinical@serenitycarepartners.com" className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200">
                  <EnvelopeIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3">Quick Links</h3>
          <div className="space-y-2">
            <a href="#" className="block p-2 hover:bg-gray-50 rounded flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <span>Policies & Procedures</span>
            </a>
            <a href="#" className="block p-2 hover:bg-gray-50 rounded flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
              <span>HIPAA Guidelines</span>
            </a>
            <a href="#" className="block p-2 hover:bg-gray-50 rounded flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
              <span>Emergency Procedures</span>
            </a>
            <a href="#" className="block p-2 hover:bg-gray-50 rounded flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5 text-gray-400" />
              <span>Pod Lead Training Resources</span>
            </a>
            <a href="#" className="block p-2 hover:bg-gray-50 rounded flex items-center gap-2">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span>Escalation Procedures</span>
            </a>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-medium text-red-900 mb-2">Emergency After-Hours Line</h3>
        <p className="text-red-700">For urgent clinical or safety issues outside business hours:</p>
        <a href="tel:+16145559999" className="text-xl font-bold text-red-600 hover:underline">
          (614) 555-9999
        </a>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'team': return renderTeam();
      case 'clients': return renderClients();
      case 'operations': return renderOperations();
      case 'schedule': return renderSchedule();
      case 'approvals': return renderApprovals();
      case 'metrics': return renderMetrics();
      case 'incidents': return renderIncidents();
      case 'resources': return renderResources();
      default: return renderOverview();
    }
  };

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}
