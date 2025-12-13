/**
 * Consumer-Directed Care Dashboard
 * Manages employers, workers, and timesheets for consumer-directed personal care program
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import {
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  year2Service,
  CdEmployer,
  CdWorker,
  CdTimesheet,
  CdDashboard
} from '../../services/year2.service';

type TabType = 'overview' | 'employers' | 'workers' | 'timesheets';

export function ConsumerDirectedDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CdDashboard | null>(null);
  const [employers, setEmployers] = useState<CdEmployer[]>([]);
  const [timesheets, setTimesheets] = useState<CdTimesheet[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<CdWorker[]>([]);
  const [expandedEmployer, setExpandedEmployer] = useState<string | null>(null);
  const [timesheetFilter, setTimesheetFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'employers') {
      loadEmployers();
    } else if (activeTab === 'timesheets') {
      loadTimesheets();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedEmployerId) {
      loadWorkers(selectedEmployerId);
    }
  }, [selectedEmployerId]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const data = await year2Service.getCdDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployers() {
    try {
      const data = await year2Service.getCdEmployers();
      setEmployers(data);
    } catch (error) {
      console.error('Failed to load employers:', error);
    }
  }

  async function loadWorkers(employerId: string) {
    try {
      const data = await year2Service.getCdWorkers(employerId);
      setWorkers(data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  }

  async function loadTimesheets() {
    try {
      const data = await year2Service.getCdTimesheets({ status: timesheetFilter });
      setTimesheets(data);
    } catch (error) {
      console.error('Failed to load timesheets:', error);
    }
  }

  async function handleApproveTimesheet(id: string) {
    try {
      setActionLoading(id);
      await year2Service.approveCdTimesheet(id);
      await loadTimesheets();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectTimesheet(id: string) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setActionLoading(id);
      await year2Service.rejectCdTimesheet(id, reason);
      await loadTimesheets();
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
    } finally {
      setActionLoading(null);
    }
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'submitted':
        return <Badge variant="info">Submitted</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'terminated':
        return <Badge variant="secondary">Terminated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: ChartIcon },
    { id: 'employers' as TabType, label: 'Employers', icon: UserGroupIcon },
    { id: 'workers' as TabType, label: 'Workers', icon: UsersIcon },
    { id: 'timesheets' as TabType, label: 'Timesheets', icon: DocumentTextIcon },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Consumer-Directed Care</h1>
          <p className="text-gray-600 mt-1">
            Manage employers, workers, and FMS timesheets for consumer-directed personal care
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-6 animate-fade-in">
            {/* KPIs */}
            <KPIGrid columns={4}>
              <KPIWidget
                title="Active Employers"
                value={dashboard.summary.activeEmployers.toString()}
                subtitle="Employer accounts"
                icon={UserGroupIcon}
                iconColor="bg-primary-600"
              />
              <KPIWidget
                title="Active Workers"
                value={dashboard.summary.activeWorkers.toString()}
                subtitle="Consumer-hired"
                icon={UsersIcon}
                iconColor="bg-caregiver-600"
              />
              <KPIWidget
                title="Pending Timesheets"
                value={dashboard.summary.pendingTimesheets.toString()}
                subtitle="Awaiting approval"
                icon={DocumentTextIcon}
                iconColor="bg-warning-600"
                status={dashboard.summary.pendingTimesheets > 0 ? 'warning' : 'success'}
              />
              <KPIWidget
                title="MTD Approved Hours"
                value={dashboard.summary.mtdApprovedHours.toFixed(1)}
                subtitle="Hours this month"
                icon={ClockIcon}
                iconColor="bg-success-600"
              />
              <KPIWidget
                title="MTD Approved Amount"
                value={formatCurrency(dashboard.summary.mtdApprovedAmount)}
                subtitle="Amount this month"
                icon={CurrencyDollarIcon}
                iconColor="bg-green-600"
              />
            </KPIGrid>

            {/* Pending Timesheets Alert */}
            {dashboard.summary.pendingTimesheets > 0 && (
              <Alert variant="warning" title="Timesheets Require Attention">
                You have {dashboard.summary.pendingTimesheets} pending timesheets awaiting approval.
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4"
                  onClick={() => setActiveTab('timesheets')}
                >
                  Review Now
                </Button>
              </Alert>
            )}

            {/* Recent Activity */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {dashboard.recentActivity.length === 0 ? (
                <p className="text-gray-500">No recent timesheet activity.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Worker
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pay Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboard.recentActivity.map((activity) => (
                        <tr key={activity.timesheetId}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {activity.workerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {activity.clientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {activity.payPeriod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {activity.totalHours.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(activity.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {activity.submittedAt
                              ? new Date(activity.submittedAt).toLocaleDateString()
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card hoverable clickable onClick={() => setActiveTab('employers')}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <PlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Add Employer</h4>
                    <p className="text-sm text-gray-500">Create new employer account</p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable onClick={() => setActiveTab('workers')}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-caregiver-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-caregiver-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Workers</h4>
                    <p className="text-sm text-gray-500">View and add workers</p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable onClick={() => setActiveTab('timesheets')}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-success-100 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Review Timesheets</h4>
                    <p className="text-sm text-gray-500">Approve pending timesheets</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Employers Tab */}
        {activeTab === 'employers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Employer Accounts</h2>
              <Button variant="primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Employer
              </Button>
            </div>

            {employers.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No employers found.</p>
                  <Button variant="primary" className="mt-4">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create First Employer
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {employers.map((employer) => (
                  <Card key={employer.id}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedEmployer(
                        expandedEmployer === employer.id ? null : employer.id
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-100 rounded-full">
                          <UserGroupIcon className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {employer.clientName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            EOR: {employer.employerOfRecordName} ({employer.employerOfRecordRelationship})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Workers</p>
                          <p className="font-semibold text-gray-900">{employer.activeWorkersCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">MTD Hours</p>
                          <p className="font-semibold text-gray-900">{employer.mtdHours.toFixed(1)}</p>
                        </div>
                        {getStatusBadge(employer.status)}
                        {expandedEmployer === employer.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedEmployer === employer.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Medicaid ID</p>
                            <p className="font-medium">{employer.clientMedicaidId || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">FMS Account</p>
                            <p className="font-medium">{employer.fmsAccountNumber || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Monthly Budget</p>
                            <p className="font-medium">
                              {employer.authorizedMonthlyBudget
                                ? formatCurrency(employer.authorizedMonthlyBudget)
                                : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Effective Date</p>
                            <p className="font-medium">
                              {new Date(employer.effectiveDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedEmployerId(employer.id)}
                          >
                            <UsersIcon className="h-4 w-4 mr-1" />
                            Manage Workers
                          </Button>
                          <Button variant="secondary" size="sm">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            View Timesheets
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workers Tab */}
        {activeTab === 'workers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Workers</h2>
                <p className="text-sm text-gray-500">
                  {selectedEmployerId
                    ? 'Showing workers for selected employer'
                    : 'Select an employer to view workers'}
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={selectedEmployerId || ''}
                  onChange={(e) => setSelectedEmployerId(e.target.value || null)}
                >
                  <option value="">Select Employer...</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.clientName}
                    </option>
                  ))}
                </select>
                <Button variant="primary" disabled={!selectedEmployerId}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Worker
                </Button>
              </div>
            </div>

            {!selectedEmployerId ? (
              <Card>
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select an employer to view their workers.</p>
                </div>
              </Card>
            ) : workers.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No workers found for this employer.</p>
                  <Button variant="primary" className="mt-4">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add First Worker
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Worker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hourly Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Max Hours/Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        MTD Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        YTD Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workers.map((worker) => (
                      <tr key={worker.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{worker.name}</div>
                          {worker.caregiverId && (
                            <div className="text-sm text-gray-500">
                              Linked to caregiver
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ${worker.hourlyRate.toFixed(2)}/hr
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {worker.maxHoursPerWeek || 'No limit'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {worker.mtdHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {worker.ytdHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(worker.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Timesheets Tab */}
        {activeTab === 'timesheets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">FMS Timesheets</h2>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={timesheetFilter}
                  onChange={(e) => {
                    setTimesheetFilter(e.target.value);
                    loadTimesheets();
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button variant="secondary" onClick={loadTimesheets}>
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {timesheets.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No {timesheetFilter ? timesheetFilter : ''} timesheets found.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Worker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pay Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {timesheets.map((ts) => (
                      <tr key={ts.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {ts.workerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {ts.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {new Date(ts.payPeriodStart).toLocaleDateString()} -
                          {new Date(ts.payPeriodEnd).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {ts.totalHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ${ts.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ts.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            {(ts.status === 'pending' || ts.status === 'submitted') && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApproveTimesheet(ts.id)}
                                  disabled={actionLoading === ts.id}
                                >
                                  {actionLoading === ts.id ? (
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircleIcon className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRejectTimesheet(ts.id)}
                                  disabled={actionLoading === ts.id}
                                >
                                  <XCircleIcon className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper icon component
function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}
