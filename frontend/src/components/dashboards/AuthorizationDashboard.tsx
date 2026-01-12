/**
 * Authorization Management Dashboard
 * Tracks service authorizations, units used, expiring auths
 * Critical for ensuring services are billable before delivery
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  UserGroupIcon,
  BellAlertIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Authorization {
  id: string;
  patientName: string;
  patientId: string;
  serviceType: string;
  serviceCode: string;
  payer: string;
  authNumber: string;
  startDate: string;
  endDate: string;
  totalUnits: number;
  usedUnits: number;
  remainingUnits: number;
  status: 'active' | 'expiring' | 'expired' | 'pending' | 'denied';
  lastUpdated: string;
  notes?: string;
}

// Mock data for demonstration
const mockAuthorizations: Authorization[] = [
  {
    id: '1',
    patientName: 'Mary Johnson',
    patientId: 'P001',
    serviceType: 'Personal Care',
    serviceCode: 'T1019',
    payer: 'Ohio Medicaid',
    authNumber: 'AUTH-2025-001234',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    totalUnits: 480,
    usedUnits: 156,
    remainingUnits: 324,
    status: 'active',
    lastUpdated: '2025-01-05',
  },
  {
    id: '2',
    patientName: 'Robert Williams',
    patientId: 'P002',
    serviceType: 'Skilled Nursing',
    serviceCode: 'T1030',
    payer: 'Medicare',
    authNumber: 'AUTH-2025-001235',
    startDate: '2024-12-01',
    endDate: '2025-01-15',
    totalUnits: 120,
    usedUnits: 108,
    remainingUnits: 12,
    status: 'expiring',
    lastUpdated: '2025-01-04',
  },
  {
    id: '3',
    patientName: 'Patricia Davis',
    patientId: 'P003',
    serviceType: 'Home Health Aide',
    serviceCode: 'T1021',
    payer: 'Ohio Medicaid',
    authNumber: 'AUTH-2025-001236',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    totalUnits: 360,
    usedUnits: 360,
    remainingUnits: 0,
    status: 'expired',
    lastUpdated: '2025-01-01',
  },
  {
    id: '4',
    patientName: 'James Brown',
    patientId: 'P004',
    serviceType: 'Physical Therapy',
    serviceCode: 'T1002',
    payer: 'Anthem BCBS',
    authNumber: 'AUTH-2025-001237',
    startDate: '2025-01-10',
    endDate: '2025-04-10',
    totalUnits: 24,
    usedUnits: 0,
    remainingUnits: 24,
    status: 'pending',
    lastUpdated: '2025-01-05',
  },
  {
    id: '5',
    patientName: 'Linda Martinez',
    patientId: 'P005',
    serviceType: 'Respite Care',
    serviceCode: 'T1005',
    payer: 'PASSPORT',
    authNumber: 'AUTH-2025-001238',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    totalUnits: 720,
    usedUnits: 48,
    remainingUnits: 672,
    status: 'active',
    lastUpdated: '2025-01-06',
  },
  {
    id: '6',
    patientName: 'Michael Wilson',
    patientId: 'P006',
    serviceType: 'DODD Services',
    serviceCode: 'W7061',
    payer: 'DODD IO Waiver',
    authNumber: 'AUTH-2025-001239',
    startDate: '2025-01-01',
    endDate: '2025-01-10',
    totalUnits: 160,
    usedUnits: 145,
    remainingUnits: 15,
    status: 'expiring',
    lastUpdated: '2025-01-05',
  },
];

export default function AuthorizationDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payerFilter, setPayerFilter] = useState<string>('all');
  const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null);

  // Calculate metrics
  const totalAuths = mockAuthorizations.length;
  const activeAuths = mockAuthorizations.filter(a => a.status === 'active').length;
  const expiringAuths = mockAuthorizations.filter(a => a.status === 'expiring').length;
  const expiredAuths = mockAuthorizations.filter(a => a.status === 'expired').length;
  const pendingAuths = mockAuthorizations.filter(a => a.status === 'pending').length;

  // Filter authorizations
  const filteredAuths = mockAuthorizations.filter(auth => {
    const matchesSearch = auth.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.authNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || auth.status === statusFilter;
    const matchesPayer = payerFilter === 'all' || auth.payer === payerFilter;
    return matchesSearch && matchesStatus && matchesPayer;
  });

  // Get unique payers for filter
  const uniquePayers = [...new Set(mockAuthorizations.map(a => a.payer))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
      case 'expiring':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Expiring Soon</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Expired</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Pending</span>;
      case 'denied':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Denied</span>;
      default:
        return null;
    }
  };

  const getUtilizationColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authorization Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track service authorizations, units, and expiration dates
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Sync with Payers
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <DocumentPlusIcon className="h-4 w-4 mr-2" />
            Request Authorization
          </button>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Ohio Medicaid Prior Authorization Requirements</h3>
            <p className="text-sm text-blue-700 mt-1">
              Per OAC 5160-1-01, services requiring prior authorization must have an approved auth on file before service delivery.
              Claims submitted without valid authorization will be denied. Ensure all authorizations are renewed at least 14 days before expiration.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Authorizations</p>
              <p className="text-2xl font-bold text-gray-900">{totalAuths}</p>
            </div>
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('active')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeAuths}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('expiring')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expiring (14 days)</p>
              <p className="text-2xl font-bold text-yellow-600">{expiringAuths}</p>
            </div>
            <BellAlertIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('expired')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-red-600">{expiredAuths}</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('pending')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-purple-600">{pendingAuths}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, auth number, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="denied">Denied</option>
            </select>
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payers</option>
              {uniquePayers.map(payer => (
                <option key={payer} value={payer}>{payer}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Authorization Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Authorizations ({filteredAuths.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer / Auth #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Used</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAuths.map((auth) => {
                const daysLeft = getDaysUntilExpiry(auth.endDate);
                const utilizationPct = Math.round((auth.usedUnits / auth.totalUnits) * 100);

                return (
                  <tr
                    key={auth.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedAuth(auth)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <Link
                          to={`/patients/${auth.patientId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {auth.patientName}
                        </Link>
                        <div className="text-xs text-gray-500">ID: {auth.patientId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{auth.serviceType}</div>
                        <div className="text-xs text-gray-500">{auth.serviceCode}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{auth.payer}</div>
                        <div className="text-xs text-gray-500 font-mono">{auth.authNumber}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatDate(auth.startDate)} - {formatDate(auth.endDate)}
                        </div>
                        <div className={`text-xs ${daysLeft <= 14 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {daysLeft > 0 ? `${daysLeft} days remaining` : `Expired ${Math.abs(daysLeft)} days ago`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {auth.usedUnits} / {auth.totalUnits} ({utilizationPct}%)
                        </div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-2 rounded-full ${getUtilizationColor(auth.usedUnits, auth.totalUnits)}`}
                            style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {auth.remainingUnits} remaining
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(auth.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {auth.status === 'expiring' && (
                          <button className="text-blue-600 hover:text-blue-800 font-medium">
                            Renew
                          </button>
                        )}
                        {auth.status === 'expired' && (
                          <button className="text-green-600 hover:text-green-800 font-medium">
                            Reauthorize
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-800">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorization Detail Panel */}
      {selectedAuth && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Authorization Details</h3>
            <button
              onClick={() => setSelectedAuth(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Patient Information</h4>
              <Link
                to={`/patients/${selectedAuth.patientId}`}
                className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                {selectedAuth.patientName}
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
              <p className="text-sm text-gray-500">Patient ID: {selectedAuth.patientId}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Service Details</h4>
              <p className="text-lg font-semibold text-gray-900">{selectedAuth.serviceType}</p>
              <p className="text-sm text-gray-500">Code: {selectedAuth.serviceCode}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Payer Information</h4>
              <p className="text-lg font-semibold text-gray-900">{selectedAuth.payer}</p>
              <p className="text-sm text-gray-500 font-mono">{selectedAuth.authNumber}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Authorization Period</h4>
              <p className="text-sm text-gray-900">
                {formatDate(selectedAuth.startDate)} - {formatDate(selectedAuth.endDate)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getDaysUntilExpiry(selectedAuth.endDate)} days remaining
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Unit Utilization</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className={`h-3 rounded-full ${getUtilizationColor(selectedAuth.usedUnits, selectedAuth.totalUnits)}`}
                      style={{ width: `${Math.min((selectedAuth.usedUnits / selectedAuth.totalUnits) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round((selectedAuth.usedUnits / selectedAuth.totalUnits) * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAuth.usedUnits} used / {selectedAuth.totalUnits} total ({selectedAuth.remainingUnits} remaining)
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
              {getStatusBadge(selectedAuth.status)}
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {formatDate(selectedAuth.lastUpdated)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              Request Renewal
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
              View Claims
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
              Edit Details
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
              Print
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BellAlertIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Expiring This Week</h4>
              <p className="text-2xl font-bold text-yellow-600">
                {mockAuthorizations.filter(a => getDaysUntilExpiry(a.endDate) <= 7 && getDaysUntilExpiry(a.endDate) > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Low Units (&lt;20%)</h4>
              <p className="text-2xl font-bold text-red-600">
                {mockAuthorizations.filter(a => (a.remainingUnits / a.totalUnits) < 0.2 && a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Awaiting Response</h4>
              <p className="text-2xl font-bold text-purple-600">{pendingAuths}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Avg. Utilization</h4>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(
                  mockAuthorizations
                    .filter(a => a.status === 'active')
                    .reduce((acc, a) => acc + (a.usedUnits / a.totalUnits) * 100, 0) /
                  activeAuths
                )}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
