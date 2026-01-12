/**
 * DODD/HPC Dashboard
 * Manages DODD certification, HPC authorizations, and caregiver eligibility
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
import { ProgressRing } from '../ui/ProgressRing';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import {
  year2Service,
  DoddDashboard,
  HpcDashboard,
  HpcAuthorization,
  CaregiverDoddStatus,
} from '../../services/year2.service';

type TabType = 'overview' | 'certifications' | 'authorizations' | 'caregivers';

export function DoddHpcDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [doddData, setDoddData] = useState<DoddDashboard | null>(null);
  const [hpcData, setHpcData] = useState<HpcDashboard | null>(null);
  const [expiringAuths, setExpiringAuths] = useState<HpcAuthorization[]>([]);
  const [lowUtilization, setLowUtilization] = useState<any[]>([]);
  const [caregivers, setCaregivers] = useState<CaregiverDoddStatus[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [dodd, hpc, expiring, lowUtil, cgStatus] = await Promise.all([
        year2Service.getDoddDashboard(),
        year2Service.getHpcDashboard(),
        year2Service.getHpcExpiringAuthorizations(30),
        year2Service.getHpcLowUtilizationAlerts(50),
        year2Service.getCaregiverDoddStatus(),
      ]);
      setDoddData(dodd);
      setHpcData(hpc);
      setExpiringAuths(expiring);
      setLowUtilization(lowUtil);
      setCaregivers(cgStatus);
    } catch (error) {
      console.error('Failed to load DODD/HPC dashboard:', error);
    } finally {
      setLoading(false);
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
    { id: 'certifications', label: 'DODD Certification' },
    { id: 'authorizations', label: 'HPC Authorizations' },
    { id: 'caregivers', label: 'Caregiver Eligibility' },
  ];

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              DODD & HPC Management
            </h1>
            <p className="text-gray-600">
              Manage DD waiver certifications, HPC authorizations, and caregiver eligibility
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
            {/* DODD Certification Status */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">DODD Certification Status</h2>
                {doddData?.hasCertification ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Not Certified</Badge>
                )}
              </div>
              {doddData?.hasCertification ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-lg font-semibold text-gray-900">{doddData.certificationStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiration Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {doddData.certificationExpiration ? new Date(doddData.certificationExpiration).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Eligible Caregivers</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {doddData.stats.doddEligible} / {doddData.stats.totalCaregivers}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert variant="info" title="DODD Certification Required">
                  To provide HPC services, you need DODD Provider Certification. This unlocks access to
                  DD waiver rates of $7.15-$11.17 per 15-minute unit.
                  <div className="mt-4">
                    <Button
                      size="sm"
                      onClick={() => window.location.href = '/dodd/certification/start'}
                    >
                      Start Certification Process
                    </Button>
                  </div>
                </Alert>
              )}
            </Card>

            {/* KPI Grid */}
            <KPIGrid columns={4}>
              <KPIWidget
                title="Active Authorizations"
                value={hpcData?.summary.activeAuthorizations || 0}
                icon={ClipboardDocumentListIcon}
                iconColor="bg-primary-600"
                status="success"
              />
              <KPIWidget
                title="Avg Utilization"
                value={formatPercent(hpcData?.summary.avgUtilization || 0)}
                icon={CheckBadgeIcon}
                iconColor="bg-success-600"
                status={Number(hpcData?.summary.avgUtilization) >= 80 ? 'success' : 'warning'}
              />
              <KPIWidget
                title="Expiring Soon"
                value={hpcData?.summary.expiringSoon || 0}
                subtitle="Within 30 days"
                icon={ClockIcon}
                iconColor="bg-warning-600"
                status={Number(hpcData?.summary.expiringSoon) > 0 ? 'warning' : 'success'}
              />
              <KPIWidget
                title="Eligible Caregivers"
                value={doddData?.stats.doddEligible || 0}
                subtitle={`of ${doddData?.stats.totalCaregivers || 0} total`}
                icon={UserGroupIcon}
                iconColor="bg-caregiver-600"
                status="info"
              />
            </KPIGrid>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expiring Authorizations */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                  Expiring Authorizations
                </h3>
                {expiringAuths.length === 0 ? (
                  <p className="text-gray-500">No authorizations expiring within 30 days</p>
                ) : (
                  <div className="space-y-3">
                    {expiringAuths.slice(0, 5).map((auth) => (
                      <div key={auth.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{auth.clientName}</p>
                          <p className="text-sm text-gray-500">{auth.serviceName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-warning-600">
                            Expires {new Date(auth.ispEndDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">{auth.unitsRemaining} units remaining</p>
                        </div>
                      </div>
                    ))}
                    {expiringAuths.length > 5 && (
                      <button
                        onClick={() => setActiveTab('authorizations')}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View all {expiringAuths.length} expiring authorizations
                      </button>
                    )}
                  </div>
                )}
              </Card>

              {/* Low Utilization Alerts */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-info-500" />
                  Low Utilization Alerts
                </h3>
                {lowUtilization.length === 0 ? (
                  <p className="text-gray-500">All authorizations are well-utilized</p>
                ) : (
                  <div className="space-y-3">
                    {lowUtilization.slice(0, 5).map((alert) => (
                      <div key={alert.authorizationId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{alert.clientName}</p>
                          <p className="text-sm text-gray-500">{alert.serviceName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-info-600">
                            {alert.utilizationPercent}% utilized
                          </p>
                          <p className="text-xs text-gray-500">{alert.periodElapsedPercent}% of period elapsed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Revenue by Service Code */}
            {hpcData && hpcData.byServiceCode.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service Code</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth Count</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Authorized</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Used</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Potential Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {hpcData.byServiceCode.map((svc) => (
                        <tr key={svc.serviceCode}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{svc.serviceCode}</p>
                              <p className="text-sm text-gray-500">{svc.serviceName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">{svc.authCount}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">{svc.totalAuthorized.toLocaleString()}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900">{svc.totalUsed.toLocaleString()}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${svc.utilization >= 80 ? 'bg-success-500' : svc.utilization >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`}
                                  style={{ width: `${Math.min(svc.utilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{svc.utilization}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                            {formatCurrency(svc.potentialRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">DODD Provider Certification</h2>
                <Button onClick={() => window.location.href = '/dodd/certification/add'}>
                  Add Certification
                </Button>
              </div>
              {doddData?.hasCertification ? (
                <div className="space-y-6">
                  <Alert variant="success" title="Active DODD Certification">
                    Your organization is certified to provide DODD waiver services.
                  </Alert>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Certification Type</p>
                      <p className="text-lg font-semibold text-gray-900">HPC Provider</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-lg font-semibold text-success-600">{doddData.certificationStatus}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Expiration</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {doddData.certificationExpiration ? new Date(doddData.certificationExpiration).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Services Authorized</p>
                      <p className="text-lg font-semibold text-gray-900">HPC, Respite</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Alert variant="warning" title="DODD Certification Required">
                    To provide DD waiver services (HPC, Respite), you need DODD Provider Certification.
                  </Alert>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Certification Requirements</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <DocumentCheckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Provider Application</p>
                          <p className="text-sm text-gray-500">Complete DODD provider enrollment through PNM</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Staff Training</p>
                          <p className="text-sm text-gray-500">Complete required DD orientation and EVV training</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckBadgeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Background Checks</p>
                          <p className="text-sm text-gray-500">BCI/FBI checks for all direct service staff</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Authorizations Tab */}
        {activeTab === 'authorizations' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">HPC Authorizations</h2>
                <Button>New Authorization</Button>
              </div>
              {hpcData && hpcData.summary.activeAuthorizations > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISP Period</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expiringAuths.map((auth) => (
                        <tr key={auth.id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{auth.clientName}</p>
                              <p className="text-sm text-gray-500">{auth.clientMedicaidId}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{auth.serviceCode}</p>
                              <p className="text-sm text-gray-500">{auth.serviceName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(auth.ispStartDate).toLocaleDateString()} - {new Date(auth.ispEndDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-gray-900">{auth.unitsUsed} / {auth.unitsAuthorized}</p>
                            <p className="text-xs text-gray-500">{auth.unitsRemaining} remaining</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ProgressRing percentage={auth.utilizationPercent} size={32} strokeWidth={3} />
                              <span className="text-sm text-gray-600">{auth.utilizationPercent}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={auth.status === 'active' ? 'success' : 'warning'}>
                              {auth.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Button size="sm" variant="outline">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No HPC Authorizations</h3>
                  <p className="text-gray-500 mb-4">Create authorizations to track HPC service usage</p>
                  <Button>Create Authorization</Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Caregivers Tab */}
        {activeTab === 'caregivers' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-success-100 rounded-lg">
                    <CheckBadgeIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DODD Eligible</p>
                    <p className="text-2xl font-bold text-gray-900">{doddData?.stats.doddEligible || 0}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-warning-100 rounded-lg">
                    <AcademicCapIcon className="h-6 w-6 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Orientation</p>
                    <p className="text-2xl font-bold text-gray-900">{doddData?.stats.pendingOrientation || 0}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-info-100 rounded-lg">
                    <DocumentCheckIcon className="h-6 w-6 text-info-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending EVV Cert</p>
                    <p className="text-2xl font-bold text-gray-900">{doddData?.stats.pendingEvv || 0}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-danger-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending BG Check</p>
                    <p className="text-2xl font-bold text-gray-900">{doddData?.stats.pendingBackgroundCheck || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Caregiver List */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Caregiver DODD Eligibility Status</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caregiver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Background Check</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DD Orientation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EVV Certified</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eligibility</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {caregivers.map((cg) => (
                      <tr key={cg.caregiverId}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">{cg.name}</p>
                            <p className="text-sm text-gray-500">{cg.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {cg.backgroundCheckStatus === 'passed' ? (
                            <Badge variant="success">Passed</Badge>
                          ) : cg.backgroundCheckStatus === 'pending' ? (
                            <Badge variant="warning">Pending</Badge>
                          ) : (
                            <Badge variant="default">Not Started</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {cg.orientationCompleted ? (
                            <Badge variant="success">Complete</Badge>
                          ) : (
                            <Badge variant="warning">Incomplete</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {cg.evvCertified ? (
                            <Badge variant="success">Certified</Badge>
                          ) : (
                            <Badge variant="warning">Not Certified</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {cg.isDoddEligible ? (
                            <Badge variant="success">Eligible</Badge>
                          ) : (
                            <Badge variant="danger">Not Eligible</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Button size="sm" variant="outline">Update</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
