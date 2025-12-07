import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { ClaimsStatusBadge } from '../ui/Badge';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface BillingMetrics {
  monthlyRevenue: number;
  pendingClaims: number;
  deniedClaims: number;
  daysInAR: number;
  collectionRate: number;
  claimsSubmitted: number;
}

interface Claim {
  id: string;
  patientName: string;
  claimNumber: string;
  amount: number;
  status: 'draft' | 'submitted' | 'paid' | 'denied';
  submittedDate: string;
  payer: string;
}

export function WorkingBillingDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        monthlyRevenue: 892450,
        pendingClaims: 47,
        deniedClaims: 12,
        daysInAR: 28.5,
        collectionRate: 94.2,
        claimsSubmitted: 342
      });

      setRecentClaims([
        {
          id: '1',
          patientName: 'John Doe',
          claimNumber: 'CLM-2024-001',
          amount: 1250.00,
          status: 'submitted',
          submittedDate: '2024-03-10',
          payer: 'Medicare'
        },
        {
          id: '2',
          patientName: 'Mary Smith',
          claimNumber: 'CLM-2024-002',
          amount: 980.50,
          status: 'paid',
          submittedDate: '2024-03-08',
          payer: 'Medicaid'
        },
        {
          id: '3',
          patientName: 'Robert Johnson',
          claimNumber: 'CLM-2024-003',
          amount: 1500.00,
          status: 'denied',
          submittedDate: '2024-03-05',
          payer: 'Blue Cross'
        }
      ]);

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

  if (!metrics) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Billing & Revenue Cycle
            </h1>
            <p className="text-gray-600">
              Claims processing, denial management, and revenue optimization
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Monthly Revenue</h3>
              <div className="p-2 bg-success-100 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.monthlyRevenue)}</p>
            <p className="text-sm text-success-600 mt-1">+8% vs last month</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Pending Claims</h3>
              <div className="p-2 bg-warning-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning-600">{metrics.pendingClaims}</p>
            <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Denied Claims</h3>
              <div className="p-2 bg-danger-100 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-danger-600">{metrics.deniedClaims}</p>
            <p className="text-sm text-gray-500 mt-1">Needs attention</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Days in A/R</h3>
              <div className="p-2 bg-primary-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">{metrics.daysInAR}</p>
            <Badge variant="success" size="sm" className="mt-2">Excellent</Badge>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Collection Rate</h3>
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success-600">{metrics.collectionRate}%</p>
            <p className="text-sm text-success-600 mt-1">Above target</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Claims This Month</h3>
              <div className="p-2 bg-info-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-info-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.claimsSubmitted}</p>
            <p className="text-sm text-gray-500 mt-1">Processed claims</p>
          </Card>
        </div>

        {/* Alerts */}
        {metrics.deniedClaims > 10 && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="warning"
              title="High Denial Rate Alert"
              onClose={() => {}}
            >
              {metrics.deniedClaims} claims denied this month. Review denial reasons and resubmit.
            </Alert>
          </div>
        )}

        {/* Recent Claims & Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Claims */}
          <Card className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Claims</h3>
              </div>
              <Badge variant="info" size="sm">{recentClaims.length} claims</Badge>
            </div>

            <div className="space-y-3">
              {recentClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{claim.patientName}</h4>
                      <p className="text-sm text-gray-600">{claim.claimNumber}</p>
                    </div>
                    <ClaimsStatusBadge status={claim.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{claim.payer}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(claim.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Revenue Trend Chart */}
          <Card className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <ArrowTrendingUpIcon className="h-6 w-6 text-success-600" />
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            </div>
            <div className="h-80 bg-gradient-to-br from-success-50 to-success-100 rounded-lg border-2 border-dashed border-success-200 flex items-center justify-center">
              <div className="text-center">
                <ArrowTrendingUpIcon className="h-16 w-16 text-success-600 mx-auto mb-4" />
                <p className="text-success-700 font-medium">Revenue trending up +8% this month</p>
                <p className="text-sm text-success-600 mt-1">Interactive chart coming soon</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Process Claims</h4>
                  <p className="text-sm text-gray-500">Submit batch</p>
                </div>
              </div>
            </Card>

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Review Denials</h4>
                  <p className="text-sm text-gray-500">Fix and resubmit</p>
                </div>
              </div>
            </Card>

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success-100 rounded-lg">
                  <BanknotesIcon className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Post 835 ERA</h4>
                  <p className="text-sm text-gray-500">Auto-posting</p>
                </div>
              </div>
            </Card>

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-info-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-info-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Revenue Reports</h4>
                  <p className="text-sm text-gray-500">Detailed analytics</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
