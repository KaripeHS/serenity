/**
 * Executive Dashboard with Opportunity Alerts
 * Shows strategic KPIs, revenue opportunities, and license status
 * Implements the opportunity alert system from the strategic growth plan
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Chart } from '../ui/Chart';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import { ProgressRing } from '../ui/ProgressRing';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { executiveDashboardService, KPIMetric, AIInsight } from '../../services/executiveDashboard.service';
import {
  licenseService,
  RevenueOpportunity,
  OpportunityDashboard,
  ServiceCapability
} from '../../services/license.service';

type TabType = 'overview' | 'opportunities' | 'licenses' | 'services';

export function ExecutiveOpportunityDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [alerts, setAlerts] = useState<AIInsight[]>([]);
  const [opportunityData, setOpportunityData] = useState<OpportunityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ revenue: any[]; visits: any[] }>({
    revenue: [],
    visits: []
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.organizationId) return;

      try {
        setLoading(true);
        const [metrics, fetchedAlerts, charts, opportunities] = await Promise.all([
          executiveDashboardService.getKPIMetrics(user.organizationId),
          executiveDashboardService.getAIInsights(user.organizationId),
          executiveDashboardService.getChartsData(user.organizationId),
          licenseService.getOpportunityDashboard()
        ]);
        setKpiMetrics(metrics);
        setAlerts(fetchedAlerts);
        setChartData(charts);
        setOpportunityData(opportunities);
      } catch (error) {
        console.error("Failed to load dashboard details", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.organizationId]);

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
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

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const getIconForMetric = (name: string) => {
    switch (name) {
      case 'Active Patients': return UserGroupIcon;
      case 'Active Staff': return UsersIcon;
      case 'Billable Hours': return CurrencyDollarIcon;
      case 'Sandata Sync Rate': return CheckCircleIcon;
      default: return ArrowTrendingUpIcon;
    }
  };

  const getColorForMetric = (name: string) => {
    switch (name) {
      case 'Active Patients': return 'bg-patient-600';
      case 'Active Staff': return 'bg-caregiver-600';
      case 'Billable Hours': return 'bg-success-600';
      case 'Sandata Sync Rate': return 'bg-primary-600';
      default: return 'bg-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: ChartBarIcon },
    { id: 'opportunities' as TabType, label: 'Revenue Opportunities', icon: SparklesIcon },
    { id: 'licenses' as TabType, label: 'License Status', icon: DocumentCheckIcon },
    { id: 'services' as TabType, label: 'Service Capabilities', icon: ClipboardDocumentCheckIcon },
  ];

  // Calculate unlocked opportunities count
  const unlockedOpportunities = opportunityData?.opportunities.filter(o => !o.currentlyUnlocked).length || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Executive Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Strategic overview and growth opportunities.
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

        {/* Opportunity Alert Banner */}
        {unlockedOpportunities > 0 && opportunityData && (
          <div className="mb-6 animate-fade-in">
            <Alert variant="info" title="Revenue Opportunities Available">
              <div className="flex items-center justify-between">
                <span>
                  You have <strong>{unlockedOpportunities} licensing opportunities</strong> that could unlock up to{' '}
                  <strong>{formatCurrency(opportunityData.totalPotentialRevenue)}/year</strong> in additional revenue.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('opportunities')}
                  className="ml-4"
                >
                  View Opportunities
                </Button>
              </div>
            </Alert>
          </div>
        )}

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
                  {tab.id === 'opportunities' && unlockedOpportunities > 0 && (
                    <Badge variant="danger" size="sm">{unlockedOpportunities}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Grid */}
            <KPIGrid columns={4}>
              {kpiMetrics.map((metric) => (
                <KPIWidget
                  key={metric.id}
                  title={metric.name}
                  value={metric.unit === 'USD' || metric.name.includes('Revenue')
                    ? formatCurrency(metric.value)
                    : metric.value.toLocaleString()}
                  subtitle={metric.period}
                  change={metric.change}
                  changeLabel={metric.period}
                  trend={metric.trend}
                  icon={getIconForMetric(metric.name)}
                  iconColor={getColorForMetric(metric.name)}
                  status={metric.trend === 'up' || metric.trend === 'neutral' ? 'success' : 'warning'}
                />
              ))}
            </KPIGrid>

            {/* Revenue Potential Summary */}
            {opportunityData && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Potential by License</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('opportunities')}>
                    View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {opportunityData.projectedRevenueByLicense.map((item) => (
                    <div
                      key={item.licenseType}
                      className={`p-4 rounded-lg border ${
                        item.unlocked
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {item.unlocked ? (
                          <LockOpenIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {item.displayName}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(item.potentialRevenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        /year @ {item.clientsRequired} clients
                      </p>
                      {!item.unlocked && (
                        <Badge variant="warning" size="sm" className="mt-2">
                          Locked
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Chart
                  type="area"
                  data={chartData.revenue}
                  title="Revenue Trend (Last 6 Months)"
                  height={280}
                  width={600}
                  showGrid={true}
                  showAxes={true}
                  color="#10b981"
                />
              </div>
              <div>
                <Chart
                  type="bar"
                  data={chartData.visits}
                  title="Daily Visits (Last 7 Days)"
                  height={280}
                  width={600}
                  showGrid={true}
                  showAxes={true}
                  showValues={true}
                  color="#3b82f6"
                />
              </div>
            </div>

            {/* Alerts */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Executive Alerts & Insights
              </h3>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-500">No active alerts. System is running smoothly.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      variant={alert.impact === 'high' ? 'danger' : alert.impact === 'medium' ? 'warning' : 'info'}
                      title={alert.title}
                    >
                      {alert.description}
                    </Alert>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/dashboard/operations">
                  <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Operations</h4>
                        <p className="text-sm text-gray-500">View reports</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link to="/dashboard/billing">
                  <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-success-100 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-success-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Billing</h4>
                        <p className="text-sm text-gray-500">Revenue & AR</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link to="/dashboard/hr">
                  <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-caregiver-100 rounded-lg">
                        <UsersIcon className="h-6 w-6 text-caregiver-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">HR</h4>
                        <p className="text-sm text-gray-500">Workforce</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link to="/dashboard/dodd-hpc">
                  <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <DocumentCheckIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">DODD/HPC</h4>
                        <p className="text-sm text-gray-500">DD Services</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && opportunityData && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">Total Unlockable Revenue</h3>
                  <p className="text-4xl font-bold text-primary-700 mt-2">
                    {formatCurrency(opportunityData.totalPotentialRevenue)}
                    <span className="text-lg font-normal text-primary-600">/year</span>
                  </p>
                  <p className="text-sm text-primary-600 mt-1">
                    Based on Ohio Medicaid rates with projected client volumes
                  </p>
                </div>
                <div className="hidden md:block">
                  <SparklesIcon className="h-24 w-24 text-primary-300" />
                </div>
              </div>
            </Card>

            {/* Opportunity Cards */}
            <div className="space-y-4">
              {opportunityData.opportunities.map((opp) => (
                <Card key={opp.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{opp.title}</h4>
                        <Badge className={getPriorityColor(opp.priority)}>
                          {opp.priority} priority
                        </Badge>
                        <Badge className={getEffortColor(opp.effort)}>
                          {opp.effort} effort
                        </Badge>
                        {opp.currentlyUnlocked && (
                          <Badge variant="success">Available Now</Badge>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">{opp.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Potential Revenue</p>
                          <p className="text-xl font-bold text-gray-900">
                            {opp.potentialRevenueRange}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Time to Implement</p>
                          <p className="text-xl font-bold text-gray-900">
                            {opp.timeToImplement}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="text-xl font-bold text-gray-900">
                            {opp.category}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Action Steps:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {opp.actionSteps.slice(0, 3).map((step, idx) => (
                            <li key={idx} className="text-sm text-gray-600">{step}</li>
                          ))}
                          {opp.actionSteps.length > 3 && (
                            <li className="text-sm text-gray-500 italic">
                              +{opp.actionSteps.length - 3} more steps
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {opp.requiredLicenses.map((license) => (
                        <Badge key={license} variant="secondary" size="sm">
                          {license.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                    <Link to={opp.cta.link}>
                      <Button variant="primary">
                        {opp.cta.text}
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Licenses Tab */}
        {activeTab === 'licenses' && opportunityData && (
          <div className="space-y-6 animate-fade-in">
            {/* Current Licenses */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Licenses</h3>
              <div className="space-y-4">
                {opportunityData.currentLicenses.map((license) => (
                  <div
                    key={license.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        license.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {license.status === 'active' ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {license.licenseType.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Issuing Authority: {license.issuingAuthority}
                        </p>
                        {license.licenseNumber && (
                          <p className="text-sm text-gray-500">
                            License #: {license.licenseNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={license.status === 'active' ? 'success' : 'warning'}>
                        {license.status}
                      </Badge>
                      {license.expirationDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          Expires: {new Date(license.expirationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Available Licenses to Obtain */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Licenses</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        License Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Issuing Authority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Application Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Timeline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {licenseService.getAllLicenseRequirements().map((req) => {
                      const hasLicense = opportunityData.currentLicenses.some(
                        l => l.licenseType === req.licenseType && l.status === 'active'
                      );
                      return (
                        <tr key={req.licenseType}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {hasLicense ? (
                                <LockOpenIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-900">
                                {req.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {req.issuingAuthority}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            ${req.applicationFee.toLocaleString()}
                            {req.bondRequired && (
                              <span className="text-xs block text-gray-400">
                                +${req.bondRequired.toLocaleString()} bond
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            ~{req.estimatedTimelineDays} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hasLicense ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Not Applied</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {!hasLicense && (
                              <a
                                href={req.applicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  Learn More
                                </Button>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && opportunityData && (
          <div className="space-y-6 animate-fade-in">
            {/* Unlocked Services */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <LockOpenIcon className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Available Services</h3>
              </div>
              {opportunityData.unlockedServices.length === 0 ? (
                <p className="text-gray-500">No services currently available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {opportunityData.unlockedServices.map((service) => (
                    <div
                      key={service.serviceCode}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{service.serviceName}</span>
                        <Badge variant="success" size="sm">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Code: {service.serviceCode}</span>
                        {service.medicaidBillable ? (
                          <span className="text-green-600 font-medium">
                            ${service.ratePerUnit}/{service.unitType}
                          </span>
                        ) : (
                          <span className="text-gray-500">Private Pay</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Blocked Services */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <LockClosedIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Locked Services</h3>
                <Badge variant="secondary">{opportunityData.blockedServices.length}</Badge>
              </div>
              <p className="text-gray-500 mb-4">
                These services require additional licensing. Click "Unlock" to learn how to get started.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {opportunityData.blockedServices.map((service) => (
                  <div
                    key={service.serviceCode}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{service.serviceName}</span>
                      <Badge variant="warning" size="sm">Locked</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{service.description}</p>
                    <p className="text-xs text-orange-600 mb-3">
                      {service.blockReason}
                    </p>
                    <div className="flex items-center justify-between">
                      {service.ratePerUnit && (
                        <span className="text-sm text-gray-500">
                          ${service.ratePerUnit}/{service.unitType}
                        </span>
                      )}
                      <Link to={`/dashboard/licenses?apply=${service.requiredLicense}`}>
                        <Button variant="ghost" size="sm">
                          Unlock
                          <ArrowRightIcon className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
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
