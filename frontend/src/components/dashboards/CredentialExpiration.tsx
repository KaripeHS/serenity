/**
 * Credential Expiration Dashboard
 * Real-time credential monitoring with 30/60/90 day alerts
 * Integrated with backend API
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { ProgressRing } from '../ui/ProgressRing';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  XCircleIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import {
  credentialService,
  Credential,
  CredentialDashboard as DashboardData,
  AlertLevel,
} from '../../services/credential.service';
import { loggerService } from '../../shared/services/logger.service';

type TabType = 'overview' | 'expired' | 'expiring_30' | 'expiring_60' | 'expiring_90' | 'all';

// Status badge component
function CredentialStatusBadge({ status, daysLeft }: { status: Credential['status']; daysLeft: number }) {
  const config = {
    valid: { variant: 'success' as const, label: 'Valid' },
    expiring_soon: { variant: 'warning' as const, label: `Expires in ${daysLeft} days` },
    expired: { variant: 'danger' as const, label: `Expired ${Math.abs(daysLeft)} days ago` },
    missing: { variant: 'secondary' as const, label: 'Missing' },
  };
  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// Credential row component
function CredentialRow({
  credential,
  onRenew,
  loading,
}: {
  credential: Credential;
  onRenew: (id: string) => void;
  loading?: boolean;
}) {
  return (
    <tr
      className={`border-b border-gray-100 hover:bg-gray-50 ${
        credential.status === 'expired'
          ? 'bg-danger-50'
          : credential.status === 'expiring_soon' && credential.daysLeft <= 7
          ? 'bg-danger-50'
          : credential.status === 'expiring_soon'
          ? 'bg-warning-50'
          : ''
      }`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {credential.firstName} {credential.lastName}
            </p>
            <p className="text-xs text-gray-500">{credential.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="font-medium text-gray-900">{credential.credentialName}</p>
        <p className="text-xs text-gray-500">{credential.credentialType}</p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {credential.issueDate ? new Date(credential.issueDate).toLocaleDateString() : '-'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {new Date(credential.expirationDate).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <CredentialStatusBadge status={credential.status} daysLeft={credential.daysLeft} />
      </td>
      <td className="py-3 px-4">
        {credential.renewalInProgress ? (
          <Badge variant="info">In Progress</Badge>
        ) : credential.renewalRequired ? (
          <Button
            variant="primary"
            size="sm"
            disabled={loading}
            onClick={() => onRenew(credential.id)}
          >
            {loading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              'Initiate Renewal'
            )}
          </Button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
    </tr>
  );
}

// Main component
export function CredentialExpiration() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [allCredentials, setAllCredentials] = useState<Credential[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllCredentials();
    }
  }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await credentialService.getDashboard();
      setDashboard(data);
    } catch (error) {
      loggerService.error('Failed to load dashboard', { error });
    } finally {
      setLoading(false);
    }
  };

  const loadAllCredentials = async () => {
    try {
      const expiring = await credentialService.getExpiringCredentials(90);
      const expired = await credentialService.getExpiredCredentials();
      setAllCredentials([...expired, ...expiring]);
    } catch (error) {
      loggerService.error('Failed to load credentials', { error });
    }
  };

  const handleRenew = async (credentialId: string) => {
    setRenewingId(credentialId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await loadDashboard();
    } catch (error) {
      loggerService.error('Failed to initiate renewal', { error });
    } finally {
      setRenewingId(null);
    }
  };

  const getFilteredCredentials = (): Credential[] => {
    if (!dashboard) return [];

    let credentials: Credential[] = [];

    switch (activeTab) {
      case 'expired':
        credentials = dashboard.alerts.EXPIRED.credentials;
        break;
      case 'expiring_30':
        credentials = [
          ...dashboard.alerts.CRITICAL.credentials,
          ...dashboard.alerts.WARNING.credentials,
        ];
        break;
      case 'expiring_60':
        credentials = [
          ...dashboard.alerts.CRITICAL.credentials,
          ...dashboard.alerts.WARNING.credentials,
          ...dashboard.alerts.NOTICE.credentials,
        ];
        break;
      case 'expiring_90':
        credentials = [
          ...dashboard.alerts.CRITICAL.credentials,
          ...dashboard.alerts.WARNING.credentials,
          ...dashboard.alerts.NOTICE.credentials,
          ...dashboard.alerts.INFO.credentials,
        ];
        break;
      case 'all':
        credentials = allCredentials;
        break;
      default:
        credentials = [];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      credentials = credentials.filter(
        (c) =>
          (c.firstName?.toLowerCase() || '').includes(term) ||
          (c.lastName?.toLowerCase() || '').includes(term) ||
          (c.credentialName?.toLowerCase() || '').includes(term)
      );
    }

    if (filterType !== 'all') {
      credentials = credentials.filter((c) => c.credentialType === filterType);
    }

    return credentials;
  };

  const credentialTypes = dashboard
    ? [...new Set(dashboard.byCredentialType.map((t) => t.credentialType))]
    : [];

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-24" />
              </Card>
            ))}
          </div>
          <Card>
            <Skeleton className="h-96" />
          </Card>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { alerts, complianceRate, totalCredentials, byCredentialType, caregiversWithIssues } =
    dashboard;

  const tabItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: ShieldCheckIcon },
    { id: 'expired' as TabType, label: 'Expired', count: alerts.EXPIRED.count },
    { id: 'expiring_30' as TabType, label: '30 Day Alert', count: alerts.CRITICAL.count + alerts.WARNING.count },
    { id: 'expiring_60' as TabType, label: '60 Day Alert', count: alerts.NOTICE.count },
    { id: 'expiring_90' as TabType, label: '90 Day Alert', count: alerts.INFO.count },
    { id: 'all' as TabType, label: 'All Credentials' },
  ];

  const filteredCredentials = getFilteredCredentials();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Credential Expiration Tracking
            </h1>
            <p className="text-gray-600">
              Monitor and manage caregiver credentials with 30/60/90 day alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadDashboard}>
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </Button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors px-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {alerts.EXPIRED.count > 0 && (
          <Alert variant="danger" title="Expired Credentials" className="mb-6">
            {alerts.EXPIRED.count} credential(s) have expired and require immediate attention.
            Caregivers with expired credentials may not be eligible to provide services.
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setActiveTab('expired')}
            >
              View Details
            </Button>
          </Alert>
        )}

        {alerts.CRITICAL.count > 0 && activeTab === 'overview' && (
          <Alert variant="warning" title="Critical: Expiring Within 7 Days" className="mb-6">
            {alerts.CRITICAL.count} credential(s) will expire within 7 days. Schedule renewals immediately.
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon && <tab.icon className="h-5 w-5" />}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                        tab.id === 'expired'
                          ? 'bg-danger-100 text-danger-700'
                          : tab.id.includes('expiring')
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Summary */}
            <KPIGrid columns={4}>
              <KPIWidget
                title="Compliance Rate"
                value={`${complianceRate}%`}
                subtitle={`${dashboard.validCredentials} of ${totalCredentials} valid`}
                icon={ShieldCheckIcon}
                iconColor="bg-success-600"
                status={complianceRate >= 95 ? 'success' : complianceRate >= 85 ? 'warning' : 'danger'}
              />
              <KPIWidget
                title="Expired"
                value={alerts.EXPIRED.count.toString()}
                subtitle="Immediate action required"
                icon={XCircleIcon}
                iconColor="bg-danger-600"
                status={alerts.EXPIRED.count === 0 ? 'success' : 'danger'}
              />
              <KPIWidget
                title="Expiring in 30 Days"
                value={(alerts.CRITICAL.count + alerts.WARNING.count).toString()}
                subtitle="Schedule renewals"
                icon={BellAlertIcon}
                iconColor="bg-warning-600"
                status={alerts.CRITICAL.count + alerts.WARNING.count === 0 ? 'success' : 'warning'}
              />
              <KPIWidget
                title="Expiring in 90 Days"
                value={(alerts.NOTICE.count + alerts.INFO.count).toString()}
                subtitle="Plan ahead"
                icon={ClockIcon}
                iconColor="bg-primary-600"
              />
            </KPIGrid>

            {/* Compliance Ring and Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Compliance</h3>
                <ProgressRing
                  percentage={complianceRate}
                  size={160}
                  strokeWidth={12}
                  color={
                    complianceRate >= 95
                      ? '#10b981'
                      : complianceRate >= 85
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                  label="Target: 100%"
                />
                <p className="mt-4 text-sm text-gray-500">
                  {dashboard.validCredentials} valid credentials
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">By Credential Type</h3>
                <div className="space-y-3">
                  {byCredentialType.slice(0, 5).map((type) => (
                    <div key={type.credentialType} className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm truncate max-w-[150px]">
                        {type.credentialType.replace(/_/g, ' ')}
                      </span>
                      <div className="flex gap-2">
                        {type.expired > 0 && (
                          <Badge variant="danger" size="sm">
                            {type.expired}
                          </Badge>
                        )}
                        {type.expiringSoon > 0 && (
                          <Badge variant="warning" size="sm">
                            {type.expiringSoon}
                          </Badge>
                        )}
                        <Badge variant="success" size="sm">
                          {type.valid}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Caregivers with Issues</h3>
                {caregiversWithIssues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">All caregivers are compliant!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caregiversWithIssues.slice(0, 4).map((caregiver) => (
                      <div
                        key={caregiver.caregiverId}
                        className="flex items-center justify-between p-2 bg-danger-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {caregiver.firstName} {caregiver.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {caregiver.expiredCount} expired credential
                            {caregiver.expiredCount > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="danger" size="sm">
                          {caregiver.expiredCount}
                        </Badge>
                      </div>
                    ))}
                    {caregiversWithIssues.length > 4 && (
                      <button
                        onClick={() => setActiveTab('expired')}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View all {caregiversWithIssues.length} caregivers...
                      </button>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card hoverable clickable onClick={() => setActiveTab('expired')}>
                <div className="flex items-center gap-3 p-4">
                  <div className="p-3 bg-danger-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Expired Credentials</h4>
                    <p className="text-sm text-gray-500">
                      {alerts.EXPIRED.count} need immediate action
                    </p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable onClick={() => setActiveTab('expiring_30')}>
                <div className="flex items-center gap-3 p-4">
                  <div className="p-3 bg-warning-100 rounded-lg">
                    <BellAlertIcon className="h-6 w-6 text-warning-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">30 Day Alerts</h4>
                    <p className="text-sm text-gray-500">
                      {alerts.CRITICAL.count + alerts.WARNING.count} expiring soon
                    </p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable onClick={() => setActiveTab('all')}>
                <div className="flex items-center gap-3 p-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <DocumentCheckIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">All Credentials</h4>
                    <p className="text-sm text-gray-500">
                      View and manage {totalCredentials} credentials
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Credential List Tabs */}
        {activeTab !== 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by caregiver or credential..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    {credentialTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Credentials Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Caregiver
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Credential
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Issue Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Expiration
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCredentials.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">
                          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          {activeTab === 'expired'
                            ? 'No expired credentials!'
                            : 'No credentials found matching your criteria'}
                        </td>
                      </tr>
                    ) : (
                      filteredCredentials.map((credential) => (
                        <CredentialRow
                          key={credential.id}
                          credential={credential}
                          onRenew={handleRenew}
                          loading={renewingId === credential.id}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500" />
                <span>Expired - Immediate action required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning-500" />
                <span>Expiring Soon - Schedule renewal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span>Valid - No action needed</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CredentialExpiration;
