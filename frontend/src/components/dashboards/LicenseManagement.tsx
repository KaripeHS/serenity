import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  LockOpenIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  licenseService,
  OrganizationLicense,
  RevenueOpportunity,
  ServiceCapability,
  LicenseType,
  OpportunityDashboard
} from '../../services/license.service';

// License status badge
function LicenseStatusBadge({ status }: { status: OrganizationLicense['status'] }) {
  const config = {
    active: { variant: 'success' as const, label: 'Active' },
    expired: { variant: 'danger' as const, label: 'Expired' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    revoked: { variant: 'danger' as const, label: 'Revoked' }
  };
  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// Service capability card
function ServiceCard({ service, onUnlock }: { service: ServiceCapability; onUnlock?: () => void }) {
  const isLocked = service.status === 'blocked';

  return (
    <div className={`p-4 border rounded-lg transition-all ${
      isLocked
        ? 'border-gray-200 bg-gray-50 opacity-75'
        : 'border-success-200 bg-success-50'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <LockOpenIcon className="h-5 w-5 text-success-600" />
          )}
          <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
        </div>
        <Badge variant={isLocked ? 'secondary' : 'success'} size="sm">
          {service.serviceCode}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
      {service.medicaidBillable && service.ratePerUnit && (
        <p className="text-sm font-medium text-primary-600">
          ${service.ratePerUnit.toFixed(2)} / {service.unitType}
        </p>
      )}
      {isLocked && service.blockReason && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">{service.blockReason}</p>
          {onUnlock && (
            <button
              onClick={onUnlock}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Learn how to unlock
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Opportunity card
function OpportunityCard({ opportunity }: { opportunity: RevenueOpportunity }) {
  const priorityColors = {
    high: 'border-l-danger-500 bg-danger-50',
    medium: 'border-l-warning-500 bg-warning-50',
    low: 'border-l-info-500 bg-info-50'
  };

  const effortBadge = {
    low: { variant: 'success' as const, label: 'Easy' },
    medium: { variant: 'warning' as const, label: 'Moderate' },
    high: { variant: 'danger' as const, label: 'Complex' }
  };

  return (
    <Card className={`border-l-4 ${priorityColors[opportunity.priority]}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge variant={opportunity.priority === 'high' ? 'danger' : opportunity.priority === 'medium' ? 'warning' : 'info'} size="sm">
            {opportunity.priority.toUpperCase()} PRIORITY
          </Badge>
          <h3 className="text-lg font-semibold text-gray-900 mt-2">{opportunity.title}</h3>
        </div>
        {opportunity.currentlyUnlocked ? (
          <CheckCircleIcon className="h-6 w-6 text-success-600" />
        ) : (
          <SparklesIcon className="h-6 w-6 text-warning-500" />
        )}
      </div>

      <p className="text-gray-600 mb-4">{opportunity.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Potential Revenue</p>
          <p className="text-xl font-bold text-success-600">
            ${(opportunity.potentialRevenue / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500">{opportunity.potentialRevenueRange}</p>
        </div>
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Implementation</p>
          <p className="text-lg font-semibold text-gray-900">{opportunity.timeToImplement}</p>
          <Badge variant={effortBadge[opportunity.effort].variant} size="sm">
            {effortBadge[opportunity.effort].label}
          </Badge>
        </div>
      </div>

      {/* Action Steps */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Next Steps:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          {opportunity.actionSteps.slice(0, 3).map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
          {opportunity.actionSteps.length > 3 && (
            <li className="text-gray-500 ml-7">+{opportunity.actionSteps.length - 3} more steps</li>
          )}
        </ol>
      </div>

      <Link
        to={opportunity.cta.link}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full justify-center"
      >
        {opportunity.cta.text}
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </Link>
    </Card>
  );
}

// License application modal
function LicenseApplicationModal({ licenseType, onClose }: { licenseType: LicenseType; onClose: () => void }) {
  const requirement = licenseService.getLicenseRequirements(licenseType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{requirement.displayName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Issuing Authority</p>
            <p className="font-medium">{requirement.issuingAuthority}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Application Fee</p>
              <p className="font-medium text-lg">${requirement.applicationFee}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Timeline</p>
              <p className="font-medium text-lg">{requirement.estimatedTimelineDays} days</p>
            </div>
          </div>

          {requirement.bondRequired && (
            <Alert variant="warning" title="Surety Bond Required">
              This license requires a ${requirement.bondRequired.toLocaleString()} surety bond.
            </Alert>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
            <ul className="space-y-2">
              {requirement.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <a
              href={requirement.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center inline-flex items-center justify-center gap-2"
            >
              Start Application
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Main component
export function LicenseManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<OpportunityDashboard | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await licenseService.getOpportunityDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load license data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><Skeleton className="h-24" /></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Alert variant="danger" title="Failed to load license data">
        Unable to retrieve license information. Please try again.
      </Alert>
    );
  }

  const tabItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'licenses', label: 'Current Licenses', count: dashboard.currentLicenses.length },
    { id: 'opportunities', label: 'Opportunities', count: dashboard.opportunities.filter(o => !o.currentlyUnlocked).length },
    { id: 'services', label: 'Service Capabilities' }
  ];

  const unlockedRevenue = dashboard.projectedRevenueByLicense
    .filter(r => r.unlocked)
    .reduce((sum, r) => sum + r.potentialRevenue, 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              License & Opportunities
            </h1>
            <p className="text-gray-600">
              Manage certifications and unlock revenue opportunities
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

        {/* KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Licenses</h3>
              <div className="p-2 bg-success-100 rounded-lg">
                <ShieldCheckIcon className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success-600">
              {dashboard.currentLicenses.filter(l => l.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500">{dashboard.unlockedServices.length} services unlocked</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Current Revenue Potential</h3>
              <div className="p-2 bg-primary-100 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">{formatCurrency(unlockedRevenue)}</p>
            <p className="text-sm text-gray-500">With current licenses</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Locked Services</h3>
              <div className="p-2 bg-warning-100 rounded-lg">
                <LockClosedIcon className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning-600">{dashboard.blockedServices.length}</p>
            <p className="text-sm text-gray-500">Require additional certification</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Untapped Revenue</h3>
              <div className="p-2 bg-danger-100 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-danger-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-danger-600">{formatCurrency(dashboard.totalPotentialRevenue)}</p>
            <p className="text-sm text-gray-500">Available with new licenses</p>
          </Card>
        </div>

        {/* Alert for unlicensed opportunities */}
        {dashboard.totalPotentialRevenue > 0 && (
          <Alert variant="warning" title="Revenue Opportunity" className="mb-6">
            You're potentially leaving {formatCurrency(dashboard.totalPotentialRevenue)}/year on the table.
            Consider obtaining additional certifications to unlock Medicaid waiver services.
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by License Chart */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Revenue Potential by License</h3>
              </div>
              <div className="space-y-4">
                {dashboard.projectedRevenueByLicense.map(item => (
                  <div key={item.licenseType}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {item.unlocked ? (
                          <CheckCircleIcon className="h-5 w-5 text-success-600" />
                        ) : (
                          <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">{item.displayName}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(item.potentialRevenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-full rounded-full transition-all ${item.unlocked ? 'bg-success-500' : 'bg-gray-400'}`}
                        style={{ width: `${(item.potentialRevenue / 750000) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ~{item.clientsRequired} clients needed
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Opportunity */}
            {dashboard.opportunities.filter(o => !o.currentlyUnlocked)[0] && (
              <OpportunityCard opportunity={dashboard.opportunities.filter(o => !o.currentlyUnlocked)[0]} />
            )}
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="space-y-4">
            {dashboard.currentLicenses.length === 0 ? (
              <Card className="text-center py-12">
                <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No licenses on file</p>
                <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Add License
                </button>
              </Card>
            ) : (
              dashboard.currentLicenses.map(license => (
                <Card key={license.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {licenseService.getLicenseRequirements(license.licenseType).displayName}
                          </h3>
                          <LicenseStatusBadge status={license.status} />
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{license.issuingAuthority}</p>
                        {license.licenseNumber && (
                          <p className="text-sm text-gray-600">
                            License #: <span className="font-mono">{license.licenseNumber}</span>
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          {license.issuedDate && (
                            <span>Issued: {new Date(license.issuedDate).toLocaleDateString()}</span>
                          )}
                          {license.expirationDate && (
                            <span>Expires: {new Date(license.expirationDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Services Authorized</p>
                      <p className="text-lg font-semibold text-primary-600">{license.servicesAuthorized.length}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Add new license button */}
            <button
              onClick={() => setSelectedLicense('oda_passport')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
            >
              + Apply for New Certification
            </button>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.opportunities
              .filter(o => !o.currentlyUnlocked)
              .map(opp => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            {dashboard.opportunities.filter(o => !o.currentlyUnlocked).length === 0 && (
              <Card className="col-span-2 text-center py-12">
                <CheckCircleIcon className="h-12 w-12 text-success-500 mx-auto mb-4" />
                <p className="text-gray-500">All available certifications obtained!</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            {/* Unlocked Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LockOpenIcon className="h-5 w-5 text-success-600" />
                Available Services ({dashboard.unlockedServices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.unlockedServices.map(service => (
                  <ServiceCard key={service.serviceCode} service={service} />
                ))}
              </div>
            </div>

            {/* Locked Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                Locked Services ({dashboard.blockedServices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.blockedServices.map(service => (
                  <ServiceCard
                    key={service.serviceCode}
                    service={service}
                    onUnlock={() => setSelectedLicense(service.requiredLicense)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* License Application Modal */}
      {selectedLicense && (
        <LicenseApplicationModal
          licenseType={selectedLicense}
          onClose={() => setSelectedLicense(null)}
        />
      )}
    </div>
  );
}

export default LicenseManagement;
