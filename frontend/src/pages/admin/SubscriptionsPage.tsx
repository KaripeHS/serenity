/**
 * Subscriptions & Integrations Management Dashboard
 * Real-time view of all third-party services, APIs, and integrations
 * Displays actual configuration status from environment variables
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface EnvVar {
  name: string;
  configured: boolean;
  value?: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'configured' | 'not_configured';
  configured: boolean;
  hasCredentials: boolean;
  endpoint?: string;
  envVars: EnvVar[];
  monthlyEstimate?: number;
}

interface SubscriptionSummary {
  total: number;
  active: number;
  configured: number;
  notConfigured: number;
  monthlyTotal: number;
  annualTotal: number;
}

interface SubscriptionData {
  success: boolean;
  services: Service[];
  summary: SubscriptionSummary;
  lastUpdated: string;
}

const CATEGORY_LABELS: Record<string, { name: string; color: string }> = {
  communication: { name: 'Communication', color: 'blue' },
  ai: { name: 'AI & ML', color: 'purple' },
  compliance: { name: 'Compliance & EVV', color: 'green' },
  payroll: { name: 'Payroll', color: 'yellow' },
  billing: { name: 'Billing', color: 'pink' },
  hr: { name: 'HR & Recruiting', color: 'indigo' },
  infrastructure: { name: 'Infrastructure', color: 'gray' }
};

export function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch subscriptions:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredServices = data?.services.filter(service =>
    selectedCategory === 'all' || service.category === selectedCategory
  ) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'configured':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'not_configured':
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      configured: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Configured' },
      not_configured: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Not Configured' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: 'Inactive' }
    };

    const badge = badges[status] || badges.inactive;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscription data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Subscriptions</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <CreditCardIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscriptions & Integrations</h1>
              <p className="text-sm text-gray-600">Manage all third-party services and API integrations</p>
            </div>
          </div>
          <button
            onClick={fetchSubscriptions}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {data?.lastUpdated && (
          <p className="text-xs text-gray-500">Last updated: {new Date(data.lastUpdated).toLocaleString()}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          to="/admin/subscriptions/summary"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-600">Monthly Cost</p>
            <CreditCardIcon className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-900">${data?.summary.monthlyTotal.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-1">Click to view details</p>
        </Link>

        <Link
          to="/admin/subscriptions/summary"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-600">Annual Cost</p>
            <CreditCardIcon className="h-6 w-6 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-900">${data?.summary.annualTotal.toFixed(2)}</p>
          <p className="text-xs text-purple-600 mt-1">Click to view details</p>
        </Link>

        <Link
          to="/admin/subscriptions/active"
          className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-600">Active Services</p>
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-900">{data?.summary.active}</p>
          <p className="text-xs text-green-600 mt-1">Click to view active services</p>
        </Link>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Services</p>
            <CreditCardIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.summary.total}</p>
          <p className="text-xs text-gray-500 mt-1">{data?.summary.configured} configured</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All ({data?.services.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { name, color }]) => {
          const count = data?.services.filter(s => s.category === key).length || 0;
          if (count === 0) return null;

          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === key
                  ? `bg-${color}-600 text-white`
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {name} ({count})
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <Link
            key={service.id}
            to={`/admin/subscriptions/${service.id}`}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{CATEGORY_LABELS[service.category]?.name}</p>
                </div>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400" />
            </div>

            <div className="mb-4">
              {getStatusBadge(service.status)}
            </div>

            {service.endpoint && (
              <p className="text-xs text-gray-500 mb-3 truncate">{service.endpoint}</p>
            )}

            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">Environment Variables:</p>
              <div className="flex flex-wrap gap-1">
                {service.envVars.slice(0, 3).map(envVar => (
                  <span
                    key={envVar.name}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      envVar.configured
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {envVar.configured ? '✓' : '○'} {envVar.name}
                  </span>
                ))}
                {service.envVars.length > 3 && (
                  <span className="text-xs text-gray-500">+{service.envVars.length - 3} more</span>
                )}
              </div>
            </div>

            {service.monthlyEstimate !== undefined && service.monthlyEstimate > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  ${service.monthlyEstimate}/month
                </p>
                <p className="text-xs text-gray-500">${(service.monthlyEstimate * 12).toFixed(2)}/year</p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No services found in this category</p>
        </div>
      )}
    </div>
  );
}
