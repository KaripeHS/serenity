/**
 * Payroll Dashboard
 * Manages payroll provider configuration, employee mappings, and payroll runs
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DocumentTextIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import {
  year2Service,
  PayrollDashboard as PayrollDashboardData,
  PayrollProvider,
  EmployeeMapping,
  PayrollRun,
} from '../../services/year2.service';

type TabType = 'overview' | 'provider' | 'mappings' | 'runs';

// Default empty dashboard data
const defaultDashboard: PayrollDashboardData = {
  provider: null,
  summary: {
    draftRuns: 0,
    approvedRuns: 0,
    submittedRuns: 0,
    processedRuns: 0,
    mtdGrossPay: 0,
    ytdGrossPay: 0,
  },
  unmappedEmployees: 0,
  recentRuns: [],
};

export function PayrollDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<PayrollDashboardData>(defaultDashboard);
  const [provider, setProvider] = useState<PayrollProvider | null>(null);
  const [mappings, setMappings] = useState<EmployeeMapping[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const [dashData, providerData, mappingData, runData] = await Promise.all([
        year2Service.getPayrollDashboard().catch(() => defaultDashboard),
        year2Service.getActivePayrollProvider().catch(() => null),
        year2Service.getEmployeeMappings().catch(() => []),
        year2Service.getPayrollRuns().catch(() => []),
      ]);
      setDashboard(dashData || defaultDashboard);
      setProvider(providerData);
      setMappings(mappingData);
      setRuns(runData);
    } catch (error) {
      console.error('Failed to load payroll dashboard:', error);
      setError('Failed to load payroll data. Please try again.');
      setDashboard(defaultDashboard);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!provider) return;

    try {
      setTestingConnection(true);
      setConnectionResult(null);
      const result = await year2Service.testPayrollProviderConnection(provider.id);
      setConnectionResult(result);
    } catch (error: any) {
      setConnectionResult({ success: false, message: error.message || 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'provider', label: 'Provider Setup' },
    { id: 'mappings', label: 'Employee Mappings' },
    { id: 'runs', label: 'Payroll Runs' },
  ];

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'approved': return 'info';
      case 'submitted': return 'warning';
      case 'processed': return 'success';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  const providerLogos: Record<string, string> = {
    adp: '🏢',
    gusto: '💚',
    paychex: '📊',
    quickbooks: '📒',
    manual: '📝',
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Payroll Integration
            </h1>
            <p className="text-gray-600">
              Manage payroll provider, employee mappings, and process payroll runs
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="warning" title="Connection Issue" className="mb-6">
            {error}
            <Button variant="ghost" size="sm" className="ml-2" onClick={loadDashboardData}>
              Retry
            </Button>
          </Alert>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Provider Status */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Payroll Provider</h2>
                <Button variant="outline" onClick={() => setActiveTab('provider')}>
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
              {dashboard?.provider ? (
                <div className="flex items-center gap-6">
                  <div className="text-4xl">{providerLogos[dashboard.provider.name] || '💼'}</div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{dashboard.provider.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={dashboard.provider.status === 'active' ? 'success' : 'warning'}>
                        {dashboard.provider.status}
                      </Badge>
                      {dashboard.provider.lastSyncAt && (
                        <span className="text-sm text-gray-500">
                          Last sync: {new Date(dashboard.provider.lastSyncAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert variant="warning" title="No Payroll Provider Configured">
                  Connect a payroll provider (ADP, Gusto, Paychex) to automate payroll processing.
                  <div className="mt-4">
                    <Button size="sm" onClick={() => setActiveTab('provider')}>Configure Provider</Button>
                  </div>
                </Alert>
              )}
            </Card>

            {/* KPI Grid */}
            <KPIGrid columns={4}>
              <KPIWidget
                title="MTD Gross Pay"
                value={formatCurrency(dashboard?.summary.mtdGrossPay || 0)}
                icon={CurrencyDollarIcon}
                iconColor="bg-success-600"
                status="success"
              />
              <KPIWidget
                title="YTD Gross Pay"
                value={formatCurrency(dashboard?.summary.ytdGrossPay || 0)}
                icon={BanknotesIcon}
                iconColor="bg-primary-600"
                status="info"
              />
              <KPIWidget
                title="Unmapped Employees"
                value={dashboard?.unmappedEmployees || 0}
                icon={UserGroupIcon}
                iconColor="bg-warning-600"
                status={Number(dashboard?.unmappedEmployees) > 0 ? 'warning' : 'success'}
              />
              <KPIWidget
                title="Pending Runs"
                value={(dashboard?.summary.draftRuns || 0) + (dashboard?.summary.approvedRuns || 0)}
                icon={ClockIcon}
                iconColor="bg-info-600"
                status="info"
              />
            </KPIGrid>

            {/* Unmapped Employees Alert */}
            {dashboard && dashboard.unmappedEmployees > 0 && (
              <Alert variant="warning" title={`${dashboard.unmappedEmployees} Employees Not Mapped`}>
                Some employees are missing payroll mappings. Map them to ensure they're included in payroll runs.
                <div className="mt-4">
                  <Button size="sm" onClick={() => setActiveTab('mappings')}>View Unmapped</Button>
                </div>
              </Alert>
            )}

            {/* Recent Runs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Payroll Runs</h3>
                <Button onClick={() => setActiveTab('runs')}>View All</Button>
              </div>
              {dashboard?.recentRuns && dashboard.recentRuns.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentRuns.map((run) => (
                    <div key={run.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{run.payPeriod}</p>
                        <p className="text-sm text-gray-500">Pay Date: {run.payDate}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(run.totalGrossPay)}</p>
                          <p className="text-sm text-gray-500">{run.employeeCount} employees</p>
                        </div>
                        <Badge variant={getStatusColor(run.status)}>{run.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payroll runs yet</p>
                </div>
              )}
            </Card>

            {/* Run Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard?.summary.draftRuns || 0}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-info-600">{dashboard?.summary.approvedRuns || 0}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-2xl font-bold text-warning-600">{dashboard?.summary.submittedRuns || 0}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Processed</p>
                <p className="text-2xl font-bold text-success-600">{dashboard?.summary.processedRuns || 0}</p>
              </Card>
            </div>
          </div>
        )}

        {/* Provider Setup Tab */}
        {activeTab === 'provider' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payroll Provider Configuration</h2>

              {provider ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{providerLogos[provider.providerName] || '💼'}</div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{provider.providerName}</p>
                        <p className="text-sm text-gray-500">Environment: {provider.environment}</p>
                      </div>
                    </div>
                    <Badge variant={provider.status === 'active' ? 'success' : 'warning'}>
                      {provider.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Company ID</p>
                      <p className="text-lg font-semibold text-gray-900">{provider.companyId || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">API Key</p>
                      <p className="text-lg font-semibold text-gray-900">{provider.hasApiKey ? '••••••••' : 'Not configured'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Sync</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {provider.lastSyncAt ? new Date(provider.lastSyncAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Connection Status</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={testingConnection}
                        >
                          {testingConnection ? (
                            <>
                              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                        {connectionResult && (
                          <Badge variant={connectionResult.success ? 'success' : 'danger'}>
                            {connectionResult.success ? 'Connected' : 'Failed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {connectionResult && (
                    <Alert
                      variant={connectionResult.success ? 'success' : 'danger'}
                      title={connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                    >
                      {connectionResult.message}
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-gray-600">Select a payroll provider to connect with Serenity:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['adp', 'gusto', 'paychex', 'quickbooks'].map((providerName) => (
                      <button
                        key={providerName}
                        onClick={() => window.location.href = `/payroll/connect/${providerName}`}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
                      >
                        <div className="text-4xl mb-2">{providerLogos[providerName]}</div>
                        <p className="font-semibold text-gray-900 capitalize">{providerName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Employee Mappings Tab */}
        {activeTab === 'mappings' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Employee Payroll Mappings</h2>
                <Button>Map Employee</Button>
              </div>

              {mappings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">External ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Frequency</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sync Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mappings.map((emp) => (
                        <tr key={emp.caregiverId}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{emp.name}</p>
                              <p className="text-sm text-gray-500">{emp.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                            {emp.mapping?.externalEmployeeId || (
                              <span className="text-gray-400">Not mapped</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                            {emp.mapping ? `$${emp.mapping.payRateHourly.toFixed(2)}/hr` : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900 capitalize">
                            {emp.mapping?.payFrequency || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {emp.mapping ? (
                              <Badge variant={emp.mapping.syncStatus === 'synced' ? 'success' : 'warning'}>
                                {emp.mapping.syncStatus}
                              </Badge>
                            ) : (
                              <Badge variant="default">Unmapped</Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Button size="sm" variant="outline">
                              {emp.mapping ? 'Edit' : 'Map'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Employee Mappings</h3>
                  <p className="text-gray-500 mb-4">Map employees to your payroll provider to process payroll</p>
                  <Button>Map Employees</Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Payroll Runs Tab */}
        {activeTab === 'runs' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Payroll Runs</h2>
                <Button>Create Payroll Run</Button>
              </div>

              {runs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {runs.map((run) => (
                        <tr key={run.id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="font-medium text-gray-900">
                              {new Date(run.payPeriodStart).toLocaleDateString()} - {new Date(run.payPeriodEnd).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                            {new Date(run.payDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                            {run.employeeCount}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                            <div>
                              <p>{run.totals.regularHours.toFixed(1)} reg</p>
                              {run.totals.overtimeHours > 0 && (
                                <p className="text-sm text-gray-500">{run.totals.overtimeHours.toFixed(1)} OT</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                            {formatCurrency(run.totals.grossPay)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-success-600">
                            {run.totals.bonus > 0 ? `+${formatCurrency(run.totals.bonus)}` : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={getStatusColor(run.status)}>{run.status}</Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">View</Button>
                              {run.status === 'draft' && (
                                <Button size="sm">Approve</Button>
                              )}
                              {run.status === 'approved' && (
                                <Button size="sm">Submit</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Runs</h3>
                  <p className="text-gray-500 mb-4">Create a payroll run to process employee payments</p>
                  <Button>Create Payroll Run</Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
