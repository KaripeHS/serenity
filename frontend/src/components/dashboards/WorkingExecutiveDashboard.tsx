/**
 * Executive Command Center - CEO Dashboard
 * Real-time business health monitoring with actionable insights
 * Every metric is clickable and drillable for immediate action
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  BellAlertIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface DashboardMetrics {
  activePatients: number;
  activeStaff: number;
  totalVisitsToday: number;
  evvCompliance: number;
  monthlyRevenue: number;
  activePatientsTrend?: number;
  activeStaffTrend?: number;
}

interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  count?: number;
  action: string;
}

export function WorkingExecutiveDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('serenity_access_token');

      console.log('[Executive Dashboard] Fetching metrics from:', `${import.meta.env.VITE_API_URL}/api/console/dashboard/metrics`);
      console.log('[Executive Dashboard] Token exists:', !!token);

      // Fetch real metrics from backend
      const metricsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/console/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Executive Dashboard] Metrics response status:', metricsResponse.status);

      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error('[Executive Dashboard] Error response:', errorText);
        throw new Error(`Failed to fetch metrics: ${metricsResponse.status} ${errorText}`);
      }

      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch alerts
      const user = JSON.parse(localStorage.getItem('serenity_user') || '{}');
      if (user.organizationId) {
        const alertsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/console/dashboard/alerts/${user.organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData);
        }
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellAlertIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return null;
    return trend > 0 ? (
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendText = (trend?: number) => {
    if (!trend) return null;
    const sign = trend > 0 ? '+' : '';
    const color = trend > 0 ? 'text-green-600' : 'text-red-600';
    return <span className={`text-xs ${color} font-medium`}>{sign}{trend}%</span>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchDashboardData}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
        <p className="text-gray-600">Welcome back, Test. Real-time overview of your agency.</p>
      </div>

      {/* Critical Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Needing Attention</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map(alert => (
              <button
                key={alert.id}
                onClick={() => navigate(alert.action)}
                className={`text-left border rounded-lg p-4 transition-all cursor-pointer ${getAlertStyle(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      {alert.count !== undefined && (
                        <p className="text-2xl font-bold text-gray-900 mt-1">{alert.count}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics - All Clickable */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Active Patients */}
          <Link
            to="/patients"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <UserGroupIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Active Patients</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">{metrics?.activePatients || 0}</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics?.activePatientsTrend)}
                {getTrendText(metrics?.activePatientsTrend)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click to view all patients</p>
          </Link>

          {/* Active Staff */}
          <Link
            to="/dashboard/hr"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-green-600">
                <UsersIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Active Staff</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">{metrics?.activeStaff || 0}</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics?.activeStaffTrend)}
                {getTrendText(metrics?.activeStaffTrend)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click to view HR dashboard</p>
          </Link>

          {/* Today's Visits */}
          <Link
            to="/dashboard/operations"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-purple-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-600">
                <ClockIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Visits Today</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics?.totalVisitsToday || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Click for operations details</p>
          </Link>

          {/* EVV Compliance */}
          <Link
            to="/dashboard/operations"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-yellow-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-yellow-600">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">EVV Compliance</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics?.evvCompliance || 0}%</p>
            <p className="text-xs text-gray-500 mt-2">Click for EVV health details</p>
          </Link>

          {/* Monthly Revenue */}
          <Link
            to="/dashboard/billing"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-indigo-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <CurrencyDollarIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Monthly Revenue</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${((metrics?.monthlyRevenue || 0) / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 mt-2">Click for billing details</p>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/billing"
            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-blue-900">View Full Reports</h3>
            </div>
            <p className="text-sm text-blue-700">Detailed analytics</p>
          </Link>

          <Link
            to="/dashboard/billing"
            className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold text-green-900">Financial Overview</h3>
            </div>
            <p className="text-sm text-green-700">Revenue & expenses</p>
          </Link>

          <Link
            to="/dashboard/hr"
            className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <UsersIcon className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Workforce Analytics</h3>
            </div>
            <p className="text-sm text-purple-700">Staff performance</p>
          </Link>
        </div>
      </div>

      {/* System Status */}
      {alerts.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Executive Alerts & Insights</h3>
              <p className="text-sm text-green-700 mt-1">No active alerts. System is running smoothly.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
