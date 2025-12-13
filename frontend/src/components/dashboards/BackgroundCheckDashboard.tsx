/**
 * Background Check Dashboard
 * Compliance tracking, background check management, and Ohio-specific requirements
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import { ProgressRing } from '../ui/ProgressRing';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  PaperAirplaneIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  backgroundCheckService,
  BackgroundCheck,
  CaregiverNeedingCheck,
  ComplianceStats,
  BackgroundCheckDashboard as DashboardData,
  CheckType,
  CheckStatus,
  CheckResult,
} from '../../services/backgroundCheck.service';
import { loggerService } from '../../shared/services/logger.service';

type TabType = 'overview' | 'needing_checks' | 'all_checks' | 'ohio_requirements';

export function BackgroundCheckDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [allChecks, setAllChecks] = useState<BackgroundCheck[]>([]);
  const [checkFilter, setCheckFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewCheckModal, setShowNewCheckModal] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverNeedingCheck | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'all_checks') {
      loadAllChecks();
    }
  }, [activeTab, checkFilter, typeFilter]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await backgroundCheckService.getDashboard();
      setDashboard(data);
    } catch (error) {
      loggerService.error('Failed to load dashboard', { error });
    } finally {
      setLoading(false);
    }
  }

  async function loadAllChecks() {
    try {
      const filters: any = {};
      if (checkFilter !== 'all') filters.status = checkFilter;
      if (typeFilter !== 'all') filters.checkType = typeFilter;
      const checks = await backgroundCheckService.getBackgroundChecks(filters);
      setAllChecks(checks);
    } catch (error) {
      loggerService.error('Failed to load checks', { error });
    }
  }

  async function handleInitiateCheck(caregiver: CaregiverNeedingCheck, checkType: CheckType) {
    try {
      setActionLoading(caregiver.caregiverId);
      await backgroundCheckService.createBackgroundCheck({
        caregiverId: caregiver.caregiverId,
        checkType,
        reason: 'Compliance renewal',
        livedOutsideOhio5yr: caregiver.livedOutsideOhio5yr
      });
      await loadDashboard();
    } catch (error) {
      loggerService.error('Failed to initiate check', { error });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRunExpirationCheck() {
    try {
      setActionLoading('expiration');
      await backgroundCheckService.runExpirationCheck();
      await loadDashboard();
    } catch (error) {
      loggerService.error('Failed to run expiration check', { error });
    } finally {
      setActionLoading(null);
    }
  }

  const getStatusBadge = (status: CheckStatus) => {
    const config: Record<CheckStatus, { variant: any; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      submitted: { variant: 'info', label: 'Submitted' },
      in_progress: { variant: 'info', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      failed: { variant: 'danger', label: 'Failed' },
      expired: { variant: 'danger', label: 'Expired' }
    };
    const c = config[status];
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

  const getResultBadge = (result?: CheckResult) => {
    if (!result) return null;
    const config: Record<CheckResult, { variant: any; label: string }> = {
      clear: { variant: 'success', label: 'Clear' },
      flagged: { variant: 'warning', label: 'Flagged' },
      disqualified: { variant: 'danger', label: 'Disqualified' },
      pending_review: { variant: 'info', label: 'Pending Review' }
    };
    const c = config[result];
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

  const getCaregiverStatusBadge = (status: CaregiverNeedingCheck['checkStatus']) => {
    const config = {
      never_checked: { variant: 'danger' as const, label: 'Never Checked' },
      valid: { variant: 'success' as const, label: 'Valid' },
      expired: { variant: 'danger' as const, label: 'Expired' },
      expiring_soon: { variant: 'warning' as const, label: 'Expiring Soon' }
    };
    const c = config[status];
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

  const getCheckTypeLabel = (type: CheckType) => {
    const labels: Record<CheckType, string> = {
      bci: 'BCI (Ohio)',
      bci_fbi: 'BCI + FBI',
      fbi_only: 'FBI Only',
      reference: 'Reference',
      drug_screen: 'Drug Screen',
      driving_record: 'Driving Record'
    };
    return labels[type];
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: ShieldCheckIcon },
    { id: 'needing_checks' as TabType, label: 'Needing Checks', icon: ExclamationTriangleIcon },
    { id: 'all_checks' as TabType, label: 'All Checks', icon: DocumentMagnifyingGlassIcon },
    { id: 'ohio_requirements' as TabType, label: 'Ohio Requirements', icon: ShieldExclamationIcon },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-96 mb-3" />
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

  if (!dashboard) return null;

  const { stats, needingChecks, recentChecks } = dashboard;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Background Check Compliance</h1>
          <p className="text-gray-600 mt-1">
            Track background checks, manage renewals, and maintain Ohio compliance
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
                  {tab.id === 'needing_checks' && needingChecks.count > 0 && (
                    <Badge variant="danger" size="sm">{needingChecks.count}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Compliance Alert */}
            {stats.nonCompliant > 0 && (
              <Alert variant="danger" title="Compliance Alert">
                {stats.nonCompliant} caregivers are currently non-compliant with background check requirements.
                {stats.expiringSoon > 0 && ` Additionally, ${stats.expiringSoon} checks are expiring soon.`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => setActiveTab('needing_checks')}
                >
                  View Details
                </Button>
              </Alert>
            )}

            {/* KPIs */}
            <KPIGrid columns={4}>
              <KPIWidget
                title="Compliance Rate"
                value={`${stats.complianceRate.toFixed(1)}%`}
                subtitle={`${stats.compliant} of ${stats.totalCaregivers} compliant`}
                icon={ShieldCheckIcon}
                iconColor="bg-success-600"
                status={stats.complianceRate >= 95 ? 'success' : stats.complianceRate >= 85 ? 'warning' : 'danger'}
              />
              <KPIWidget
                title="Non-Compliant"
                value={stats.nonCompliant.toString()}
                subtitle="Need immediate action"
                icon={ShieldExclamationIcon}
                iconColor="bg-danger-600"
                status={stats.nonCompliant === 0 ? 'success' : 'danger'}
              />
              <KPIWidget
                title="Expiring Soon"
                value={stats.expiringSoon.toString()}
                subtitle="Within 60 days"
                icon={ClockIcon}
                iconColor="bg-warning-600"
                status={stats.expiringSoon === 0 ? 'success' : 'warning'}
              />
              <KPIWidget
                title="Never Checked"
                value={stats.neverChecked.toString()}
                subtitle="New hires pending"
                icon={UserGroupIcon}
                iconColor="bg-primary-600"
              />
            </KPIGrid>

            {/* Compliance Ring and Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Compliance</h3>
                <ProgressRing
                  percentage={stats.complianceRate}
                  size={160}
                  strokeWidth={12}
                  color={stats.complianceRate >= 95 ? '#10b981' : stats.complianceRate >= 85 ? '#f59e0b' : '#ef4444'}
                  label="Target: 100%"
                />
                <p className="mt-4 text-sm text-gray-500">
                  Avg {stats.avgDaysToExpiration} days until next expiration
                </p>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Checks by Type</h3>
                <div className="space-y-3">
                  {Object.entries(stats.checksByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-gray-600">{getCheckTypeLabel(type as CheckType)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Checks by Status</h3>
                <div className="space-y-3">
                  {Object.entries(stats.checksByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                      {getStatusBadge(status as CheckStatus)}
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Recent Checks */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Background Checks</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('all_checks')}>
                  View All
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentChecks.items.map((check) => (
                      <tr key={check.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {check.caregiverName || check.applicantName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {getCheckTypeLabel(check.checkType)}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(check.status)}</td>
                        <td className="px-4 py-3">{getResultBadge(check.result) || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(check.requestedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card hoverable clickable onClick={() => setShowNewCheckModal(true)}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <PlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">New Check</h4>
                    <p className="text-sm text-gray-500">Initiate background check</p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                clickable
                onClick={handleRunExpirationCheck}
                className={actionLoading === 'expiration' ? 'opacity-50' : ''}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-warning-100 rounded-lg">
                    {actionLoading === 'expiration' ? (
                      <ArrowPathIcon className="h-6 w-6 text-warning-600 animate-spin" />
                    ) : (
                      <ClockIcon className="h-6 w-6 text-warning-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Expiration Check</h4>
                    <p className="text-sm text-gray-500">Run expiration scan</p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable onClick={() => setActiveTab('needing_checks')}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-danger-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Action Required</h4>
                    <p className="text-sm text-gray-500">{needingChecks.count} caregivers</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Needing Checks Tab */}
        {activeTab === 'needing_checks' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Caregivers Needing Checks</h2>
                <p className="text-sm text-gray-500">
                  {needingChecks.byStatus.neverChecked} never checked,
                  {needingChecks.byStatus.expired} expired,
                  {needingChecks.byStatus.expiringSoon} expiring soon
                </p>
              </div>
              <Button variant="primary" onClick={() => setShowNewCheckModal(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Bulk Initiate
              </Button>
            </div>

            {needingChecks.items.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">All caregivers are compliant!</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {needingChecks.items.map((caregiver) => (
                  <Card key={caregiver.caregiverId}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                          caregiver.checkStatus === 'expired' ? 'bg-red-100' :
                          caregiver.checkStatus === 'never_checked' ? 'bg-red-100' :
                          'bg-yellow-100'
                        }`}>
                          {caregiver.checkStatus === 'expired' || caregiver.checkStatus === 'never_checked' ? (
                            <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
                          ) : (
                            <ClockIcon className="h-6 w-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{caregiver.name}</h3>
                            {getCaregiverStatusBadge(caregiver.checkStatus)}
                          </div>
                          <p className="text-sm text-gray-500">{caregiver.email}</p>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Hire Date: {new Date(caregiver.hireDate).toLocaleDateString()}</p>
                            {caregiver.lastCheckDate && (
                              <p>Last Check: {new Date(caregiver.lastCheckDate).toLocaleDateString()} ({caregiver.lastCheckType})</p>
                            )}
                            {caregiver.daysUntilExpiration !== undefined && (
                              <p className={caregiver.daysUntilExpiration < 0 ? 'text-red-600 font-medium' : 'text-yellow-600'}>
                                {caregiver.daysUntilExpiration < 0
                                  ? `Expired ${Math.abs(caregiver.daysUntilExpiration)} days ago`
                                  : `Expires in ${caregiver.daysUntilExpiration} days`}
                              </p>
                            )}
                            {caregiver.livedOutsideOhio5yr && (
                              <p className="text-blue-600">FBI check required (lived outside Ohio)</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading === caregiver.caregiverId}
                          onClick={() => handleInitiateCheck(
                            caregiver,
                            caregiver.livedOutsideOhio5yr ? 'bci_fbi' : 'bci'
                          )}
                        >
                          {actionLoading === caregiver.caregiverId ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                              Initiate {caregiver.livedOutsideOhio5yr ? 'BCI+FBI' : 'BCI'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Checks Tab */}
        {activeTab === 'all_checks' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">All Background Checks</h2>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={checkFilter}
                  onChange={(e) => setCheckFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="bci">BCI Only</option>
                  <option value="bci_fbi">BCI + FBI</option>
                  <option value="reference">Reference</option>
                  <option value="drug_screen">Drug Screen</option>
                </select>
                <Button variant="secondary" onClick={loadAllChecks}>
                  <ArrowPathIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allChecks.map((check) => (
                      <tr key={check.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {check.caregiverName || check.applicantName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {getCheckTypeLabel(check.checkType)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {check.checkProvider || 'Manual'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(check.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(check.status)}</td>
                        <td className="px-4 py-3">{getResultBadge(check.result) || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {check.expiresAt ? new Date(check.expiresAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Ohio Requirements Tab */}
        {activeTab === 'ohio_requirements' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900">Ohio Background Check Requirements</h2>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
              <div className="prose max-w-none text-gray-600">
                <p>
                  Ohio law requires background checks for all individuals who provide direct care services.
                  The specific requirements depend on the type of services provided and the funding source.
                </p>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">BCI Check (Ohio)</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Required for:</strong> All caregivers</p>
                  <p><strong>Validity:</strong> 1 year</p>
                  <p><strong>Process:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Submit fingerprints to WebCheck location</li>
                    <li>Results typically within 5-10 business days</li>
                    <li>Cost: $22 BCI fee + service fee</li>
                  </ul>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FBI Check</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Required for:</strong> Caregivers who lived outside Ohio in past 5 years</p>
                  <p><strong>Validity:</strong> 1 year</p>
                  <p><strong>Process:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Submit with BCI check at WebCheck location</li>
                    <li>Results typically within 2-4 weeks</li>
                    <li>Cost: $18 FBI fee + service fee</li>
                  </ul>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Disqualifying Offenses</h3>
              <Alert variant="danger" title="Important">
                Certain criminal convictions result in automatic disqualification from providing care.
                Review the full list of disqualifying offenses before hiring.
              </Alert>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Examples</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disqualification Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">Violent Crimes</td>
                      <td className="px-4 py-3 text-gray-600">Murder, assault, kidnapping</td>
                      <td className="px-4 py-3"><Badge variant="danger">Permanent</Badge></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">Sexual Offenses</td>
                      <td className="px-4 py-3 text-gray-600">Sexual assault, rape</td>
                      <td className="px-4 py-3"><Badge variant="danger">Permanent</Badge></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">Drug Trafficking</td>
                      <td className="px-4 py-3 text-gray-600">Manufacturing, distribution</td>
                      <td className="px-4 py-3"><Badge variant="warning">10 Years</Badge></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">Theft/Fraud</td>
                      <td className="px-4 py-3 text-gray-600">Felony theft, identity fraud</td>
                      <td className="px-4 py-3"><Badge variant="warning">5 Years</Badge></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">Patient Abuse</td>
                      <td className="px-4 py-3 text-gray-600">Elder abuse, neglect</td>
                      <td className="px-4 py-3"><Badge variant="danger">Permanent</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">WebCheck Locations</h3>
              <p className="text-gray-600 mb-4">
                Find a WebCheck location near you for fingerprinting services:
              </p>
              <Button variant="secondary" onClick={() => window.open('https://www.ohioattorneygeneral.gov/Business/Services-for-Business/WebCheck', '_blank')}>
                Find WebCheck Location
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
