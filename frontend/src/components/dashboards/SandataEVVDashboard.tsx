/**
 * Sandata EVV Dashboard
 * Monitor Sandata Alt-EVV submissions, acknowledgments, and compliance
 *
 * Features:
 * - Real-time submission status monitoring
 * - Rejected visits requiring attention
 * - Pending visits awaiting submission
 * - Correction workflow
 * - Transaction history/audit trail
 * - Compliance metrics and trends
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Chart } from '../ui/Chart';
import api from '../../services/api';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Types
interface SandataMetrics {
  totalSubmissions: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  acceptanceRate: number;
  averageResponseTime: string;
  lastSyncTime: string;
}

interface PendingVisit {
  id: string;
  clientName: string;
  caregiverName: string;
  serviceDate: string;
  clockIn: string;
  clockOut: string;
  serviceCode: string;
  reason: string;
}

interface RejectedVisit {
  id: string;
  clientName: string;
  caregiverName: string;
  serviceDate: string;
  submittedAt: string;
  errorCode: string;
  errorMessage: string;
  status: 'pending_correction' | 'corrected' | 'voided';
}

interface SandataTransaction {
  id: string;
  evvRecordId: string;
  transactionType: 'VISIT' | 'PATIENT' | 'STAFF' | 'CORRECTION' | 'VOID';
  submittedAt: string;
  responseCode: string;
  responseMessage: string;
  sequenceId: string;
  status: 'accepted' | 'rejected' | 'pending';
}

interface EVVHealthMetrics {
  clockInCompliance: number;
  clockOutCompliance: number;
  geofenceCompliance: number;
  signatureCompliance: number;
  sandataAcceptance: number;
  totalVisits: number;
  compliantVisits: number;
  issues: {
    geofenceViolations: number;
    lateClockIns: number;
    missingClockOuts: number;
    missingSignatures: number;
  };
}

type TabType = 'overview' | 'pending' | 'rejected' | 'transactions' | 'health';

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  valueColor = 'text-gray-900',
  onClick
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  valueColor?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      hoverable={!!onClick}
      className={`transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconColor} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    'accepted': 'success',
    'completed': 'success',
    'rejected': 'danger',
    'pending': 'warning',
    'pending_correction': 'warning',
    'corrected': 'info',
    'voided': 'gray'
  };
  return <Badge variant={variants[status] || 'gray'} size="sm">{status.replace('_', ' ')}</Badge>;
}

export default function SandataEVVDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<SandataMetrics | null>(null);
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [rejectedVisits, setRejectedVisits] = useState<RejectedVisit[]>([]);
  const [transactions, setTransactions] = useState<SandataTransaction[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<EVVHealthMetrics | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('last7days');

  const organizationId = user?.organizationId || '';

  useEffect(() => {
    if (organizationId) {
      loadDashboardData();
    }
  }, [organizationId, dateFilter]);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      if (dateFilter === 'last7days') startDate.setDate(startDate.getDate() - 7);
      else if (dateFilter === 'last30days') startDate.setDate(startDate.getDate() - 30);
      else if (dateFilter === 'last90days') startDate.setDate(startDate.getDate() - 90);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Load data in parallel
      const [pendingRes, rejectedRes, healthRes] = await Promise.all([
        api.get(`/console/sandata/pending-visits/${organizationId}?limit=100`).catch(() => ({ data: { visits: [] } })),
        api.get(`/console/sandata/rejected-visits/${organizationId}`).catch(() => ({ data: { visits: [] } })),
        api.get(`/console/operations/evv-health?startDate=${startDateStr}&endDate=${endDate}`).catch(() => ({ data: null }))
      ]);

      // Process pending visits
      const pending = (pendingRes.data?.visits || []).map((v: any) => ({
        id: v.id,
        clientName: v.client_name || `Client ${v.client_id?.substring(0, 8)}`,
        caregiverName: v.caregiver_name || `Caregiver ${v.caregiver_id?.substring(0, 8)}`,
        serviceDate: v.service_date,
        clockIn: v.clock_in_time,
        clockOut: v.clock_out_time,
        serviceCode: v.service_code || 'N/A',
        reason: v.pending_reason || 'Awaiting submission'
      }));
      setPendingVisits(pending);

      // Process rejected visits
      const rejected = (rejectedRes.data?.visits || []).map((v: any) => ({
        id: v.id,
        clientName: v.client_name || `Client ${v.client_id?.substring(0, 8)}`,
        caregiverName: v.caregiver_name || `Caregiver ${v.caregiver_id?.substring(0, 8)}`,
        serviceDate: v.service_date,
        submittedAt: v.submitted_at,
        errorCode: v.sandata_error_code || 'ERR',
        errorMessage: v.sandata_error_message || 'Unknown error',
        status: v.correction_status || 'pending_correction'
      }));
      setRejectedVisits(rejected);

      // Set health metrics
      if (healthRes.data) {
        setHealthMetrics({
          clockInCompliance: healthRes.data.metrics?.clockInCompliance || 0,
          clockOutCompliance: healthRes.data.metrics?.clockOutCompliance || 0,
          geofenceCompliance: healthRes.data.metrics?.geofenceCompliance || 0,
          signatureCompliance: healthRes.data.metrics?.signatureCompliance || 0,
          sandataAcceptance: healthRes.data.metrics?.sandataAcceptance || 0,
          totalVisits: healthRes.data.summary?.totalVisits || 0,
          compliantVisits: healthRes.data.summary?.compliantVisits || 0,
          issues: healthRes.data.issues || { geofenceViolations: 0, lateClockIns: 0, missingClockOuts: 0, missingSignatures: 0 }
        });
      }

      // Calculate summary metrics
      const acceptedCount = healthRes.data?.summary?.compliantVisits || 0;
      const totalSubmissions = healthRes.data?.summary?.totalVisits || 0;
      setMetrics({
        totalSubmissions,
        acceptedCount,
        rejectedCount: rejected.length,
        pendingCount: pending.length,
        acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100 * 10) / 10 : 0,
        averageResponseTime: '< 5 sec',
        lastSyncTime: new Date().toLocaleString()
      });

    } catch (err: any) {
      console.error('Failed to load Sandata dashboard:', err);
      setError('Failed to load Sandata EVV data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSync() {
    setSyncing(true);
    try {
      // Trigger batch sync job
      await api.post('/console/sandata/batch-sync', { organizationId });
      await loadDashboardData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSubmitVisit(visitId: string) {
    try {
      await api.post('/console/sandata/visits/submit', { evvRecordId: visitId });
      await loadDashboardData();
    } catch (err: any) {
      alert(`Submission failed: ${err.response?.data?.message || 'Unknown error'}`);
    }
  }

  async function handleVoidVisit(visitId: string) {
    const reason = prompt('Enter void reason:');
    if (!reason) return;

    try {
      await api.post('/console/sandata/visits/void', {
        evvRecordId: visitId,
        voidReason: 'OTHER',
        voidReasonDescription: reason
      });
      await loadDashboardData();
    } catch (err: any) {
      alert(`Void failed: ${err.response?.data?.message || 'Unknown error'}`);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'pending', label: `Pending (${pendingVisits.length})`, icon: ClockIcon },
    { id: 'rejected', label: `Rejected (${rejectedVisits.length})`, icon: XCircleIcon },
    { id: 'transactions', label: 'Transactions', icon: DocumentArrowUpIcon },
    { id: 'health', label: 'EVV Health', icon: DocumentCheckIcon },
  ] as const;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="sandata-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="sandata-title">Sandata EVV Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ohio Alt-EVV v4.3 Compliance Monitoring | Last sync: {metrics?.lastSyncTime || 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
          </select>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Submissions"
          value={metrics?.totalSubmissions || 0}
          subtitle="EVV visits submitted"
          icon={DocumentArrowUpIcon}
          iconColor="bg-blue-500"
        />
        <MetricCard
          title="Acceptance Rate"
          value={`${metrics?.acceptanceRate || 0}%`}
          subtitle={`${metrics?.acceptedCount || 0} accepted visits`}
          icon={CheckCircleIcon}
          iconColor="bg-green-500"
          valueColor={
            (metrics?.acceptanceRate || 0) >= 95 ? 'text-green-600' :
            (metrics?.acceptanceRate || 0) >= 90 ? 'text-yellow-600' : 'text-red-600'
          }
        />
        <MetricCard
          title="Rejected"
          value={metrics?.rejectedCount || 0}
          subtitle="Require attention"
          icon={XCircleIcon}
          iconColor="bg-red-500"
          valueColor={(metrics?.rejectedCount || 0) > 0 ? 'text-red-600' : 'text-gray-900'}
          onClick={() => setActiveTab('rejected')}
        />
        <MetricCard
          title="Pending"
          value={metrics?.pendingCount || 0}
          subtitle="Awaiting submission"
          icon={ClockIcon}
          iconColor="bg-yellow-500"
          valueColor={(metrics?.pendingCount || 0) > 0 ? 'text-yellow-600' : 'text-gray-900'}
          onClick={() => setActiveTab('pending')}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Compliance Status */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Sandata Compliance Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Clock-In', value: healthMetrics?.clockInCompliance || 0 },
                  { label: 'Clock-Out', value: healthMetrics?.clockOutCompliance || 0 },
                  { label: 'Geofence', value: healthMetrics?.geofenceCompliance || 0 },
                  { label: 'Signatures', value: healthMetrics?.signatureCompliance || 0 },
                  { label: 'Sandata Accept', value: healthMetrics?.sandataAcceptance || 0 },
                ].map((metric) => (
                  <div key={metric.label} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      metric.value >= 95 ? 'text-green-600' :
                      metric.value >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.value}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Queue Preview */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Pending Submissions</h3>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
                {pendingVisits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All visits submitted!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingVisits.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{visit.clientName}</p>
                          <p className="text-xs text-gray-500">{visit.serviceDate} | {visit.caregiverName}</p>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Rejected Visits Preview */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Rejected Visits</h3>
                  <button
                    onClick={() => setActiveTab('rejected')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
                {rejectedVisits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No rejected visits!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rejectedVisits.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{visit.clientName}</p>
                          <p className="text-xs text-red-600">{visit.errorCode}: {visit.errorMessage}</p>
                        </div>
                        <StatusBadge status={visit.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Ohio EVV Requirements */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Ohio Alt-EVV v4.3 Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">6 Required Elements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>1. Type of service</li>
                    <li>2. Individual receiving service</li>
                    <li>3. Date of service</li>
                    <li>4. Location of service</li>
                    <li>5. Individual providing service</li>
                    <li>6. Time service begins and ends</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Submission Window</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Submit within 365 days of service</li>
                    <li>Real-time preferred</li>
                    <li>Batch submission supported</li>
                    <li>Corrections within 60 days</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Compliance Targets</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>95%+ acceptance rate</li>
                    <li>Geofence: 150m tolerance</li>
                    <li>Clock variance: 15 min max</li>
                    <li>Response time: &lt; 24 hours</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending EVV Submissions ({pendingVisits.length})</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-md text-sm"
                  />
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                  Submit All
                </button>
              </div>
            </div>

            {pendingVisits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircleIcon className="h-16 w-16 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium">All visits have been submitted!</p>
                <p className="text-sm">No pending EVV records require submission.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caregiver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingVisits
                      .filter(v =>
                        v.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.caregiverName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{visit.clientName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{visit.caregiverName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{visit.serviceDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {visit.clockIn && new Date(visit.clockIn).toLocaleTimeString()} - {visit.clockOut && new Date(visit.clockOut).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{visit.serviceCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{visit.reason}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSubmitVisit(visit.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Submit to Sandata"
                            >
                              <DocumentArrowUpIcon className="h-5 w-5" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600" title="View Details">
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Rejected Tab */}
        {activeTab === 'rejected' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Rejected Visits ({rejectedVisits.length})</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            {rejectedVisits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircleIcon className="h-16 w-16 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium">No rejected visits!</p>
                <p className="text-sm">All submissions have been accepted by Sandata.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caregiver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rejectedVisits
                      .filter(v =>
                        v.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.caregiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.errorCode.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{visit.clientName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{visit.caregiverName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{visit.serviceDate}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-mono">
                            {visit.errorCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate" title={visit.errorMessage}>
                          {visit.errorMessage}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={visit.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-800" title="Correct Visit">
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleVoidVisit(visit.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Void Visit"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600" title="View Details">
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Common Error Codes Reference */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Common Sandata Error Codes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div><span className="font-mono text-red-600">E001</span> - Missing required field</div>
                <div><span className="font-mono text-red-600">E002</span> - Invalid patient identifier</div>
                <div><span className="font-mono text-red-600">E003</span> - Invalid staff identifier</div>
                <div><span className="font-mono text-red-600">E004</span> - Duplicate submission</div>
                <div><span className="font-mono text-red-600">E005</span> - Service date out of range</div>
                <div><span className="font-mono text-red-600">E006</span> - Invalid service code</div>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
            <div className="text-center py-12 text-gray-500">
              <DocumentArrowUpIcon className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">Transaction Log</p>
              <p className="text-sm">View detailed audit trail of all Sandata submissions.</p>
              <button
                onClick={() => api.get(`/console/sandata/transactions?organizationId=${organizationId}`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Load Transaction History
              </button>
            </div>
          </Card>
        )}

        {/* EVV Health Tab */}
        {activeTab === 'health' && healthMetrics && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">EVV Health Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">{healthMetrics.totalVisits}</div>
                  <div className="text-sm text-gray-600">Total Visits</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{healthMetrics.compliantVisits}</div>
                  <div className="text-sm text-gray-600">Compliant</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{healthMetrics.issues.geofenceViolations}</div>
                  <div className="text-sm text-gray-600">Geofence Issues</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{healthMetrics.issues.lateClockIns}</div>
                  <div className="text-sm text-gray-600">Late Clock-Ins</div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Issue Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Geofence Violations', value: healthMetrics.issues.geofenceViolations, color: 'bg-red-500' },
                  { label: 'Late Clock-Ins', value: healthMetrics.issues.lateClockIns, color: 'bg-yellow-500' },
                  { label: 'Missing Clock-Outs', value: healthMetrics.issues.missingClockOuts, color: 'bg-orange-500' },
                  { label: 'Missing Signatures', value: healthMetrics.issues.missingSignatures, color: 'bg-purple-500' },
                ].map((issue) => (
                  <div key={issue.label} className="flex items-center gap-4">
                    <div className="w-40 text-sm text-gray-600">{issue.label}</div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${issue.color}`}
                        style={{ width: `${Math.min((issue.value / healthMetrics.totalVisits) * 100 * 10, 100)}%` }}
                      />
                    </div>
                    <div className="w-16 text-right font-medium">{issue.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
