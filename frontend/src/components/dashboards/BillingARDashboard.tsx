/**
 * Billing & AR Aging Dashboard
 * Comprehensive billing management with AR aging breakdown, claims management, and payer analytics
 */
import { useState, useEffect } from 'react';
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
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ArrowPathIcon,
  FunnelIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

// Types
interface BillingMetrics {
  monthlyRevenue: number;
  mtdCollections: number;
  pendingClaims: number;
  pendingClaimsAmount: number;
  deniedClaims: number;
  deniedClaimsAmount: number;
  daysInAR: number;
  collectionRate: number;
  claimsSubmitted: number;
  cleanClaimRate: number;
}

interface ARAgingBucket {
  label: string;
  dayRange: string;
  claimCount: number;
  totalAmount: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface PayerBreakdown {
  payerId: string;
  payerName: string;
  claimCount: number;
  totalBilled: number;
  totalCollected: number;
  avgDaysToPayment: number;
  denialRate: number;
}

interface Claim {
  id: string;
  claimNumber: string;
  clientId: string;
  clientName: string;
  serviceDate: string;
  submitDate: string;
  amount: number;
  payerName: string;
  status: 'draft' | 'submitted' | 'pending' | 'paid' | 'partial' | 'denied' | 'appealed';
  daysOutstanding: number;
  denialReason?: string;
}

type TabType = 'overview' | 'claims' | 'ar_aging' | 'payers' | 'denials';

export function BillingARDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [arAging, setArAging] = useState<ARAgingBucket[]>([]);
  const [payerBreakdown, setPayerBreakdown] = useState<PayerBreakdown[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimFilter, setClaimFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Mock data - replace with API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      setMetrics({
        monthlyRevenue: 892450,
        mtdCollections: 756230,
        pendingClaims: 47,
        pendingClaimsAmount: 156800,
        deniedClaims: 12,
        deniedClaimsAmount: 34200,
        daysInAR: 28.5,
        collectionRate: 94.2,
        claimsSubmitted: 342,
        cleanClaimRate: 96.8
      });

      setArAging([
        { label: 'Current', dayRange: '0-30 days', claimCount: 89, totalAmount: 178500, percentage: 52, status: 'healthy' },
        { label: '31-60', dayRange: '31-60 days', claimCount: 45, totalAmount: 92000, percentage: 27, status: 'healthy' },
        { label: '61-90', dayRange: '61-90 days', claimCount: 23, totalAmount: 48500, percentage: 14, status: 'warning' },
        { label: '91-120', dayRange: '91-120 days', claimCount: 8, totalAmount: 16200, percentage: 5, status: 'critical' },
        { label: '120+', dayRange: '120+ days', claimCount: 4, totalAmount: 8600, percentage: 2, status: 'critical' }
      ]);

      setPayerBreakdown([
        { payerId: 'medicare', payerName: 'Medicare', claimCount: 156, totalBilled: 312500, totalCollected: 298400, avgDaysToPayment: 21, denialRate: 2.3 },
        { payerId: 'medicaid', payerName: 'Ohio Medicaid', claimCount: 134, totalBilled: 268000, totalCollected: 254200, avgDaysToPayment: 35, denialRate: 4.1 },
        { payerId: 'anthem', payerName: 'Anthem BCBS', claimCount: 67, totalBilled: 134000, totalCollected: 121800, avgDaysToPayment: 28, denialRate: 3.2 },
        { payerId: 'aetna', payerName: 'Aetna', claimCount: 45, totalBilled: 90000, totalCollected: 84600, avgDaysToPayment: 25, denialRate: 2.8 },
        { payerId: 'private', payerName: 'Private Pay', claimCount: 28, totalBilled: 56000, totalCollected: 52800, avgDaysToPayment: 14, denialRate: 0 }
      ]);

      setClaims([
        { id: '1', claimNumber: 'CLM-2024-0342', clientId: 'c1', clientName: 'Eleanor Johnson', serviceDate: '2024-03-01', submitDate: '2024-03-05', amount: 1250, payerName: 'Medicare', status: 'submitted', daysOutstanding: 8 },
        { id: '2', claimNumber: 'CLM-2024-0341', clientId: 'c2', clientName: 'Robert Smith', serviceDate: '2024-02-28', submitDate: '2024-03-04', amount: 980.50, payerName: 'Ohio Medicaid', status: 'paid', daysOutstanding: 0 },
        { id: '3', claimNumber: 'CLM-2024-0340', clientId: 'c3', clientName: 'Mary Williams', serviceDate: '2024-02-25', submitDate: '2024-03-01', amount: 1500, payerName: 'Anthem BCBS', status: 'denied', daysOutstanding: 12, denialReason: 'Missing prior authorization' },
        { id: '4', claimNumber: 'CLM-2024-0339', clientId: 'c4', clientName: 'James Brown', serviceDate: '2024-02-20', submitDate: '2024-02-25', amount: 875, payerName: 'Medicare', status: 'pending', daysOutstanding: 18 },
        { id: '5', claimNumber: 'CLM-2024-0338', clientId: 'c5', clientName: 'Patricia Davis', serviceDate: '2024-02-15', submitDate: '2024-02-20', amount: 2100, payerName: 'Aetna', status: 'partial', daysOutstanding: 23 },
        { id: '6', claimNumber: 'CLM-2024-0337', clientId: 'c1', clientName: 'Eleanor Johnson', serviceDate: '2024-02-10', submitDate: '2024-02-15', amount: 1650, payerName: 'Medicare', status: 'appealed', daysOutstanding: 28, denialReason: 'Service not covered' },
      ]);

    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const getStatusBadge = (status: Claim['status']) => {
    const variants: Record<Claim['status'], { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      submitted: { variant: 'info', label: 'Submitted' },
      pending: { variant: 'warning', label: 'Pending' },
      paid: { variant: 'success', label: 'Paid' },
      partial: { variant: 'warning', label: 'Partial' },
      denied: { variant: 'danger', label: 'Denied' },
      appealed: { variant: 'info', label: 'Appealed' }
    };
    const config = variants[status];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getAgingStatusColor = (status: ARAgingBucket['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (claimFilter === 'all') return true;
    return claim.status === claimFilter;
  });

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: ChartBarIcon },
    { id: 'claims' as TabType, label: 'Claims', icon: DocumentTextIcon },
    { id: 'ar_aging' as TabType, label: 'AR Aging', icon: ClockIcon },
    { id: 'payers' as TabType, label: 'Payers', icon: BuildingOfficeIcon },
    { id: 'denials' as TabType, label: 'Denials', icon: ExclamationTriangleIcon },
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

  if (!metrics) return null;

  const totalAR = arAging.reduce((sum, bucket) => sum + bucket.totalAmount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Revenue Cycle</h1>
          <p className="text-gray-600 mt-1">
            Claims processing, AR aging analysis, and revenue optimization
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
                  {tab.id === 'denials' && metrics.deniedClaims > 0 && (
                    <Badge variant="danger" size="sm">{metrics.deniedClaims}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPIs */}
            <KPIGrid columns={4}>
              <KPIWidget
                title="Monthly Revenue"
                value={formatCurrency(metrics.monthlyRevenue)}
                subtitle="+8% vs last month"
                trend="up"
                icon={CurrencyDollarIcon}
                iconColor="bg-success-600"
                status="success"
              />
              <KPIWidget
                title="MTD Collections"
                value={formatCurrency(metrics.mtdCollections)}
                subtitle={`${((metrics.mtdCollections / metrics.monthlyRevenue) * 100).toFixed(1)}% of billed`}
                icon={BanknotesIcon}
                iconColor="bg-green-600"
              />
              <KPIWidget
                title="Days in A/R"
                value={metrics.daysInAR.toFixed(1)}
                subtitle="Industry avg: 35 days"
                trend="down"
                icon={ClockIcon}
                iconColor="bg-primary-600"
                status="success"
              />
              <KPIWidget
                title="Clean Claim Rate"
                value={`${metrics.cleanClaimRate}%`}
                subtitle="Target: 95%"
                icon={CheckCircleIcon}
                iconColor="bg-success-600"
                status="success"
              />
            </KPIGrid>

            {/* Alerts */}
            {metrics.deniedClaims > 10 && (
              <Alert variant="warning" title="High Denial Volume">
                {metrics.deniedClaims} claims denied totaling {formatCurrency(metrics.deniedClaimsAmount)}.
                <Button variant="ghost" size="sm" className="ml-2" onClick={() => setActiveTab('denials')}>
                  Review Denials
                </Button>
              </Alert>
            )}

            {/* AR Aging Summary */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">A/R Aging Summary</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('ar_aging')}>
                  View Details
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {arAging.map((bucket) => (
                  <div key={bucket.label} className="text-center">
                    <div className="text-sm text-gray-500 mb-1">{bucket.dayRange}</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(bucket.totalAmount)}</div>
                    <div className="text-sm text-gray-500">{bucket.claimCount} claims</div>
                    <div className={`h-2 rounded-full mt-2 ${getAgingStatusColor(bucket.status)}`}
                      style={{ width: `${Math.max(bucket.percentage, 10)}%`, marginLeft: 'auto', marginRight: 'auto' }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-gray-600">Total Outstanding A/R</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalAR)}</span>
              </div>
            </Card>

            {/* Payer Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Payers by Volume</h3>
                <div className="space-y-3">
                  {payerBreakdown.slice(0, 5).map((payer, idx) => (
                    <div key={payer.payerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{payer.payerName}</p>
                          <p className="text-sm text-gray-500">{payer.claimCount} claims</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(payer.totalBilled)}</p>
                        <p className="text-sm text-gray-500">{payer.avgDaysToPayment} days avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Rate by Payer</h3>
                <div className="space-y-4">
                  {payerBreakdown.map((payer) => {
                    const collectionRate = (payer.totalCollected / payer.totalBilled) * 100;
                    return (
                      <div key={payer.payerId}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">{payer.payerName}</span>
                          <span className="text-sm text-gray-600">{collectionRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              collectionRate >= 95 ? 'bg-green-500' :
                              collectionRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${collectionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card hoverable clickable onClick={() => setActiveTab('claims')}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <PlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">New Claim</h4>
                    <p className="text-sm text-gray-500">Create claim</p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-success-100 rounded-lg">
                    <ArrowPathIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Batch Submit</h4>
                    <p className="text-sm text-gray-500">{metrics.pendingClaims} ready</p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-info-100 rounded-lg">
                    <BanknotesIcon className="h-6 w-6 text-info-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Post ERA/835</h4>
                    <p className="text-sm text-gray-500">Auto-posting</p>
                  </div>
                </div>
              </Card>

              <Card hoverable clickable onClick={() => setActiveTab('denials')}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-warning-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Work Denials</h4>
                    <p className="text-sm text-gray-500">{metrics.deniedClaims} to review</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Claims Management</h2>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={claimFilter}
                  onChange={(e) => setClaimFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
              <Button variant="primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Claim
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Out</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {claim.claimNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {claim.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {new Date(claim.serviceDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {claim.payerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {formatCurrency(claim.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(claim.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            claim.daysOutstanding > 60 ? 'text-red-600' :
                            claim.daysOutstanding > 30 ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {claim.daysOutstanding}
                          </span>
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
            </Card>
          </div>
        )}

        {/* AR Aging Tab */}
        {activeTab === 'ar_aging' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900">Accounts Receivable Aging</h2>

            {/* AR Aging Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {arAging.map((bucket) => (
                <Card
                  key={bucket.label}
                  className={`border-t-4 ${
                    bucket.status === 'healthy' ? 'border-t-green-500' :
                    bucket.status === 'warning' ? 'border-t-yellow-500' : 'border-t-red-500'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">{bucket.dayRange}</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(bucket.totalAmount)}</p>
                    <p className="text-lg text-gray-600">{bucket.claimCount} claims</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getAgingStatusColor(bucket.status)}`}></div>
                      <span className="text-sm text-gray-500">{bucket.percentage}% of total</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* AR Aging Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AR Distribution</h3>
              <Chart
                type="bar"
                data={arAging.map(b => ({ label: b.dayRange, value: b.totalAmount }))}
                title=""
                height={300}
                width={1000}
                showGrid={true}
                showAxes={true}
                showValues={true}
                color="#3b82f6"
              />
            </Card>

            {/* AR Recommendations */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
              <div className="space-y-3">
                {arAging.filter(b => b.status !== 'healthy').map((bucket) => (
                  <Alert
                    key={bucket.label}
                    variant={bucket.status === 'critical' ? 'danger' : 'warning'}
                    title={`${bucket.dayRange}: ${bucket.claimCount} claims (${formatCurrency(bucket.totalAmount)})`}
                  >
                    {bucket.status === 'critical'
                      ? 'Immediate action required. Consider phone follow-up and escalation.'
                      : 'Follow up with payers. Review for missing information or pending authorizations.'}
                    <Button variant="ghost" size="sm" className="ml-2">
                      View Claims
                    </Button>
                  </Alert>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Payers Tab */}
        {activeTab === 'payers' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900">Payer Performance Analysis</h2>

            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claims</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Billed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denial Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payerBreakdown.map((payer) => {
                      const collectionRate = (payer.totalCollected / payer.totalBilled) * 100;
                      return (
                        <tr key={payer.payerId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {payer.payerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {payer.claimCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {formatCurrency(payer.totalBilled)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {formatCurrency(payer.totalCollected)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={collectionRate >= 95 ? 'success' : collectionRate >= 90 ? 'warning' : 'danger'}>
                              {collectionRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {payer.avgDaysToPayment} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-medium ${
                              payer.denialRate > 5 ? 'text-red-600' :
                              payer.denialRate > 3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {payer.denialRate}%
                            </span>
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

        {/* Denials Tab */}
        {activeTab === 'denials' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Denial Management</h2>
              <div className="flex gap-2">
                <Button variant="secondary">
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Refresh
                </Button>
                <Button variant="primary">
                  Bulk Appeal
                </Button>
              </div>
            </div>

            {/* Denial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-red-50 border-red-200">
                <p className="text-sm text-red-600">Total Denied</p>
                <p className="text-3xl font-bold text-red-700">{metrics.deniedClaims}</p>
                <p className="text-sm text-red-600">{formatCurrency(metrics.deniedClaimsAmount)}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Awaiting Appeal</p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">In Appeal</p>
                <p className="text-3xl font-bold text-gray-900">3</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Appeal Success Rate</p>
                <p className="text-3xl font-bold text-green-600">67%</p>
              </Card>
            </div>

            {/* Denied Claims List */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Denied Claims</h3>
              <div className="space-y-4">
                {claims.filter(c => c.status === 'denied' || c.status === 'appealed').map((claim) => (
                  <div
                    key={claim.id}
                    className={`p-4 rounded-lg border ${
                      claim.status === 'denied' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{claim.claimNumber}</span>
                          {getStatusBadge(claim.status)}
                        </div>
                        <p className="text-gray-600">{claim.clientName} - {claim.payerName}</p>
                        <p className="text-sm text-gray-500">Service Date: {new Date(claim.serviceDate).toLocaleDateString()}</p>
                        {claim.denialReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Reason:</strong> {claim.denialReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(claim.amount)}</p>
                        <p className="text-sm text-gray-500">{claim.daysOutstanding} days old</p>
                        <div className="mt-2 flex gap-2">
                          {claim.status === 'denied' && (
                            <Button variant="primary" size="sm">Appeal</Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
