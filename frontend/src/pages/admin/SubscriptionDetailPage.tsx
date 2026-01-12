/**
 * Subscription Service Detail Page
 * Detailed view of a specific service/integration with full configuration management
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  KeyIcon,
  ClockIcon,
  ChartBarIcon
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

export function SubscriptionDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('serenity_access_token');

      // Fetch all subscriptions and find the specific one
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const data = await response.json();
      const foundService = data.services.find((s: Service) => s.id === serviceId);

      if (!foundService) {
        throw new Error('Service not found');
      }

      setService(foundService);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch service details:', err);
      setError(err.message || 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'configured':
        return <CheckCircleIcon className="h-8 w-8 text-blue-500" />;
      case 'not_configured':
        return <XCircleIcon className="h-8 w-8 text-gray-400" />;
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />;
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
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
            <p className="text-gray-600">Loading service details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/admin/subscriptions')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Subscriptions
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Service</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <button
        onClick={() => navigate('/admin/subscriptions')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Subscriptions
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {getStatusIcon(service.status)}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-600 capitalize">{service.category} Service</p>
          </div>
        </div>
        <div>{getStatusBadge(service.status)}</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <CogIcon className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Configuration</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${service.configured ? 'text-green-600' : 'text-gray-400'}`}>
                {service.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Credentials:</span>
              <span className={`font-medium ${service.hasCredentials ? 'text-green-600' : 'text-red-600'}`}>
                {service.hasCredentials ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Cost</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly:</span>
              <span className="font-medium text-gray-900">
                ${service.monthlyEstimate?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Annual:</span>
              <span className="font-medium text-gray-900">
                ${((service.monthlyEstimate || 0) * 12).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <KeyIcon className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Environment Variables</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium text-gray-900">{service.envVars.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Configured:</span>
              <span className="font-medium text-green-600">
                {service.envVars.filter(ev => ev.configured).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Information */}
      {service.endpoint && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">API Endpoint</h3>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
            {service.endpoint}
          </div>
        </div>
      )}

      {/* Environment Variables */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Environment Variables Configuration</h3>
        <div className="space-y-3">
          {service.envVars.map(envVar => (
            <div key={envVar.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {envVar.configured ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{envVar.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {envVar.configured ? 'Configured' : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {envVar.value !== 'not set' ? (
                  <span className="font-mono">{envVar.value}</span>
                ) : (
                  <span className="text-red-600">Not set</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Setup Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>To configure this service:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Update the environment variables in your backend configuration</li>
            <li>Restart the backend service to apply changes</li>
            <li>Return to this page to verify the configuration status</li>
          </ol>
          <p className="mt-4 text-xs text-blue-600">
            <strong>Note:</strong> Environment variables are managed server-side for security. Contact your system administrator to update credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
