/**
 * Super Admin/CEO Console - Pod Governance & Access Management
 * Serenity ERP - Complete Pod Structure & Governance Implementation
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { loggerService } from '../../shared/services/logger.service';

// ============================================================================
// Type Definitions
// ============================================================================

interface Pod {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  status: 'active' | 'inactive' | 'suspended';
  capacity: number;
  activeCaregivers: number;
  activeClients: number;
  teamLeadId?: string;
  teamLeadName?: string;
  evvComplianceRate: number;
  createdAt: Date;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  podMemberships: PodMembership[];
  lastLogin?: Date;
  mfaEnabled: boolean;
}

interface PodMembership {
  podId: string;
  podCode: string;
  podName: string;
  roleInPod: string;
  isPrimary: boolean;
  accessLevel: 'standard' | 'elevated' | 'emergency';
  expiresAt?: Date;
}

interface JITAccessGrant {
  id: string;
  userId: string;
  userName: string;
  permissions: string[];
  justification: string;
  emergencyType?: string;
  duration: number;
  grantedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
}

interface BreakGlassAccess {
  id: string;
  userId: string;
  userName: string;
  emergencyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  permissionsGranted: string[];
  activatedAt: Date;
  expiresAt: Date;
  complianceReviewRequired: boolean;
}

interface SODViolation {
  id: string;
  userId: string;
  userName: string;
  violationType: string;
  description: string;
  permissionsInvolved: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  detectedAt: Date;
}

interface SecurityMetrics {
  totalUsers: number;
  activeJITGrants: number;
  activeBreakGlass: number;
  openSODViolations: number;
  complianceScore: number;
  phiAccessEvents: number;
  failedLoginAttempts: number;
}

export function SuperAdminConsole() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [_pods, _setPods] = useState<Pod[]>([]);
  const [_users, _setUsers] = useState<User[]>([]);
  const [_jitGrants, _setJitGrants] = useState<JITAccessGrant[]>([]);
  const [_breakGlassAccess, _setBreakGlassAccess] = useState<BreakGlassAccess[]>([]);
  const [_sodViolations, _setSodViolations] = useState<SODViolation[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalUsers: 0,
    activeJITGrants: 0,
    activeBreakGlass: 0,
    openSODViolations: 0,
    complianceScore: 0,
    phiAccessEvents: 0,
    failedLoginAttempts: 0
  });

  const [loading, setLoading] = useState(true);
  const [_showCreatePodModal, _setShowCreatePodModal] = useState(false);
  const [_showAssignUserModal, _setShowAssignUserModal] = useState(false);
  const [_showJITModal, _setShowJITModal] = useState(false);
  const [_selectedPod, _setSelectedPod] = useState<Pod | null>(null);
  const [_selectedUser, _setSelectedUser] = useState<User | null>(null);

  const isFounder = () => user?.role === 'founder';

  // Check access
  if (!user || (!isFounder() && !user.permissions?.includes('governance:admin'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <h2 className="text-red-600 text-xl font-bold mb-4">🚫 Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Super Admin Console requires Founder or Governance Admin permissions.
          </p>
          <a href="/" className="text-blue-600 underline">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all governance data
      const [
        podsResponse,
        usersResponse,
        jitResponse,
        breakGlassResponse,
        sodResponse,
        metricsResponse
      ] = await Promise.all([
        fetch('/api/admin/pods'),
        fetch('/api/admin/users'),
        fetch('/api/admin/jit-grants'),
        fetch('/api/admin/break-glass'),
        fetch('/api/admin/sod-violations'),
        fetch('/api/admin/security-metrics')
      ]);

      _setPods(await podsResponse.json());
      _setUsers(await usersResponse.json());
      _setJitGrants(await jitResponse.json());
      _setBreakGlassAccess(await breakGlassResponse.json());
      _setSodViolations(await sodResponse.json());
      setSecurityMetrics(await metricsResponse.json());

      loggerService.info('Super Admin Console data loaded successfully');
    } catch (error) {
      loggerService.error('Failed to load Super Admin Console data:', error);
    } finally {
      setLoading(false);
    }
  };

  // const _handleCreatePod = async (podData: any) => {
  //   try {
  //     const response = await fetch('/api/admin/pods', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(podData)
  //     });

  //     if (response.ok) {
  //       loggerService.info('Pod created successfully:', podData);
  //       _setShowCreatePodModal(false);
  //       loadData();
  //     }
  //   } catch (error) {
  //     loggerService.error('Failed to create pod:', error);
  //   }
  // };

  // const _handleAssignUser = async (assignment: any) => {
  //   try {
  //     const response = await fetch('/api/admin/pod-assignments', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(assignment)
  //     });

  //     if (response.ok) {
  //       loggerService.info('User assigned to pod:', assignment);
  //       _setShowAssignUserModal(false);
  //       loadData();
  //     }
  //   } catch (error) {
  //     loggerService.error('Failed to assign user:', error);
  //   }
  // };

  // const _handleGrantJIT = async (jitData: any) => {
  //   try {
  //     const response = await fetch('/api/admin/jit-grants', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(jitData)
  //     });

  //     if (response.ok) {
  //       loggerService.info('JIT access granted:', jitData);
  //       _setShowJITModal(false);
  //       loadData();
  //     }
  //   } catch (error) {
  //     loggerService.error('Failed to grant JIT access:', error);
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Super Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏛️ Super Admin Console
            </h1>
            <p className="text-gray-600 text-lg">
              Pod Governance & Access Management | Serenity ERP
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm">
              <span className="text-gray-600">Current User:</span>{' '}
              <strong className="text-gray-900">{user.firstName} {user.lastName}</strong>{' '}
              <span className="text-green-600 font-medium">({user.role})</span>
            </div>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Security Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900">{securityMetrics.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active JIT Grants</h3>
            <p className="text-3xl font-bold text-orange-600">{securityMetrics.activeJITGrants}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">SOD Violations</h3>
            <p className="text-3xl font-bold text-red-600">{securityMetrics.openSODViolations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Compliance Score</h3>
            <p className="text-3xl font-bold text-green-600">{securityMetrics.complianceScore}%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview', count: null },
              { id: 'pods', label: '🏢 Pods', count: _pods.length },
              { id: 'users', label: '👥 Users', count: _users.length },
              { id: 'access', label: '🔑 Access Control', count: _jitGrants.length },
              { id: 'compliance', label: '✅ Compliance', count: _sodViolations.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pod Status</h3>
                  <div className="space-y-2">
                    {_pods.slice(0, 5).map((pod) => (
                      <div key={pod.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{pod.name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          pod.status === 'active' ? 'bg-green-100 text-green-800' :
                          pod.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pod.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {_jitGrants.slice(0, 5).map((grant) => (
                      <div key={grant.id} className="p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium">{grant.userName}</p>
                        <p className="text-xs text-gray-600">JIT access granted</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pods' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pod Management</h2>
                <button
                  onClick={() => _setShowCreatePodModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Create Pod
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pod
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {_pods.map((pod) => (
                      <tr key={pod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{pod.name}</div>
                            <div className="text-sm text-gray-500">{pod.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pod.city}, {pod.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pod.teamLeadName || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pod.activeCaregivers}/{pod.capacity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pod.status === 'active' ? 'bg-green-100 text-green-800' :
                            pod.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {pod.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <button
                  onClick={() => _setShowAssignUserModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Assign User to Pod
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pod Memberships
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {_users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.podMemberships?.length || 0} pods
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Access Control</h2>
                <button
                  onClick={() => _setShowJITModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Grant JIT Access
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active JIT Grants</h3>
                  <div className="space-y-4">
                    {_jitGrants.filter(grant => grant.status === 'active').map((grant) => (
                      <div key={grant.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{grant.userName}</p>
                            <p className="text-sm text-gray-600">{grant.justification}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Expires: {new Date(grant.expiresAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            {grant.permissions.length} permissions
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Glass Access</h3>
                  <div className="space-y-4">
                    {_breakGlassAccess.map((access) => (
                      <div key={access.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{access.userName}</p>
                            <p className="text-sm text-gray-600">{access.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Emergency: {access.emergencyType} ({access.severity})
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {access.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance Monitoring</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Compliance Score</h3>
                  <p className="text-3xl font-bold text-green-600">{securityMetrics.complianceScore}%</p>
                  <p className="text-sm text-green-700 mt-2">Last updated: Just now</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">PHI Access Events</h3>
                  <p className="text-3xl font-bold text-blue-600">{securityMetrics.phiAccessEvents}</p>
                  <p className="text-sm text-blue-700 mt-2">Last 24 hours</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Failed Logins</h3>
                  <p className="text-3xl font-bold text-red-600">{securityMetrics.failedLoginAttempts}</p>
                  <p className="text-sm text-red-700 mt-2">Requires attention</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">SOD Violations</h3>
              <div className="space-y-4">
                {_sodViolations.map((violation) => (
                  <div key={violation.id} className={`border rounded-lg p-4 ${
                    violation.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    violation.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                    violation.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{violation.userName}</p>
                        <p className="text-sm text-gray-600">{violation.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Type: {violation.violationType} | Detected: {new Date(violation.detectedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          violation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {violation.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          violation.status === 'open' ? 'bg-red-100 text-red-800' :
                          violation.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {violation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}