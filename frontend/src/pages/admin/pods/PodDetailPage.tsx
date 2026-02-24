import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Settings, Activity, ArrowLeft, Edit2, Save, X, UserPlus, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { AddPodMemberModal } from '../../../components/pods/AddPodMemberModal';
import { assignMemberToPod, removeMemberFromPod } from '../../../utils/podAssignment';

const PODS_STORAGE_KEY = 'serenity_pods';
const POD_MEMBERS_STORAGE_KEY = 'serenity_pod_members';
const POD_AUDIT_LOG_KEY = 'serenity_pod_audit_log';

interface Pod {
  id: string;
  name: string;
  description: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  region: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface PodMember {
  id: string;
  name: string;
  email: string;
  role: string;
  memberType: 'staff' | 'patient'; // Distinguish between staff and patients
  joinedAt: string;
  status: 'active' | 'inactive';
}

interface PodAuditLog {
  id: string;
  podId: string;
  podName: string;
  memberId: string;
  memberName: string;
  memberType: 'staff' | 'patient';
  action: 'assigned' | 'reassigned' | 'removed';
  previousPodId?: string;
  previousPodName?: string;
  performedBy: string; // User ID who performed the action
  performedByName: string;
  timestamp: string;
  notes?: string;
}

type TabType = 'overview' | 'members' | 'activity' | 'settings';

export function PodDetailPage() {
  const { podId } = useParams<{ podId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [pod, setPod] = useState<Pod | null>(null);
  const [members, setMembers] = useState<PodMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<PodAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPod, setEditedPod] = useState<Partial<Pod>>({});
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  // Computed values
  const staffMembers = members.filter(m => m.memberType === 'staff');
  const patientMembers = members.filter(m => m.memberType === 'patient');

  useEffect(() => {
    fetchPodDetails();
  }, [podId]);

  const fetchPodDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await adminService.getPodById(podId);

      // Load from localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const pods: Pod[] = storedPods ? JSON.parse(storedPods) : [];
      const foundPod = pods.find(p => p.id === podId);

      if (!foundPod) {
        setError('Pod not found');
        setLoading(false);
        return;
      }

      // Load pod members from localStorage
      const storedMembers = localStorage.getItem(POD_MEMBERS_STORAGE_KEY);
      const allMembers: Record<string, PodMember[]> = storedMembers ? JSON.parse(storedMembers) : {};
      const podMembers = allMembers[podId ?? ""] || [];

      // Load audit logs for this pod
      const storedLogs = localStorage.getItem(POD_AUDIT_LOG_KEY);
      const allLogs: PodAuditLog[] = storedLogs ? JSON.parse(storedLogs) : [];
      const podLogs = allLogs.filter(log => log.podId === podId || log.previousPodId === podId);

      // Update member count to match actual members
      foundPod.memberCount = podMembers.length;

      setPod(foundPod);
      setMembers(podMembers);
      setAuditLogs(podLogs);
      setEditedPod(foundPod);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pod details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Replace with actual API call
      // await adminService.updatePod(podId, editedPod);

      // Update localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const pods: Pod[] = storedPods ? JSON.parse(storedPods) : [];
      const podIndex = pods.findIndex(p => p.id === podId);

      if (podIndex !== -1) {
        pods[podIndex] = { ...pods[podIndex], ...editedPod };
        localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(pods));
      }

      setPod({ ...pod, ...editedPod } as Pod);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pod');
    }
  };

  const handleAddMember = async (
    userId: string,
    userName: string,
    userEmail: string,
    userRole: string,
    memberType: 'staff' | 'patient'
  ) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('serenity_user') || '{}');
      const performedBy = currentUser.id || 'system';
      const performedByName = currentUser.firstName && currentUser.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'System';

      const result = assignMemberToPod({
        memberId: userId,
        memberName: userName,
        memberEmail: userEmail,
        memberRole: userRole,
        memberType,
        podId: podId!,
        performedBy,
        performedByName,
        notes: 'Manual assignment from pod detail page'
      });

      if (!result.success) {
        setError(result.error || 'Failed to add member to pod');
        return;
      }

      // Refresh pod data
      fetchPodDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the pod?')) {
      return;
    }

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const currentUser = JSON.parse(localStorage.getItem('serenity_user') || '{}');
      const performedBy = currentUser.id || 'system';
      const performedByName = currentUser.firstName && currentUser.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'System';

      const result = removeMemberFromPod(
        memberId,
        member.name,
        member.memberType,
        performedBy,
        performedByName,
        'Manual removal from pod detail page'
      );

      if (!result.success) {
        setError(result.error || 'Failed to remove member');
        return;
      }

      // Refresh pod data
      fetchPodDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleDeactivatePod = async () => {
    if (!confirm('Are you sure you want to deactivate this pod? All members will be unassigned.')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await adminService.updatePod(podId, { status: 'inactive' });

      const updatedPod = { ...pod!, status: 'inactive' as const };
      setPod(updatedPod);

      // Update localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const pods: Pod[] = storedPods ? JSON.parse(storedPods) : [];
      const podIndex = pods.findIndex(p => p.id === podId);
      if (podIndex !== -1) {
        pods[podIndex].status = 'inactive';
        localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(pods));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate pod');
    }
  };

  const handleActivatePod = async () => {
    try {
      // TODO: Replace with actual API call
      // await adminService.updatePod(podId, { status: 'active' });

      const updatedPod = { ...pod!, status: 'active' as const };
      setPod(updatedPod);

      // Update localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const pods: Pod[] = storedPods ? JSON.parse(storedPods) : [];
      const podIndex = pods.findIndex(p => p.id === podId);
      if (podIndex !== -1) {
        pods[podIndex].status = 'active';
        localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(pods));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate pod');
    }
  };

  const handleDeletePod = async () => {
    if (!confirm('Are you sure you want to delete this pod? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await adminService.deletePod(podId);

      // Remove from localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const pods: Pod[] = storedPods ? JSON.parse(storedPods) : [];
      const filteredPods = pods.filter(p => p.id !== podId);
      localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(filteredPods));

      // Remove members
      const storedMembers = localStorage.getItem(POD_MEMBERS_STORAGE_KEY);
      const allMembers: Record<string, PodMember[]> = storedMembers ? JSON.parse(storedMembers) : {};
      delete allMembers[podId!];
      localStorage.setItem(POD_MEMBERS_STORAGE_KEY, JSON.stringify(allMembers));

      // Navigate back to pods list
      navigate('/admin/pods');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pod');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pod details...</div>
      </div>
    );
  }

  if (error || !pod) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">{error || 'Pod not found'}</div>
        <button
          onClick={() => navigate('/admin/pods')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pods
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity },
    { id: 'members' as TabType, label: 'Members', icon: Users },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/pods')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pods
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pod.name}</h1>
            <p className="text-gray-600 mt-1">{pod.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={pod.status === 'active' ? 'success' : 'danger'}>
              {pod.status.toUpperCase()}
            </Badge>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Pod
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedPod(pod);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Staff Count Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Staff Members</p>
                    <p className="text-3xl font-bold text-blue-900">{staffMembers.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-400" />
                </div>
              </div>

              {/* Patients Count Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Patients</p>
                    <p className="text-3xl font-bold text-green-900">{patientMembers.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-green-400" />
                </div>
              </div>

              {/* Total Members Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Total Members</p>
                    <p className="text-3xl font-bold text-purple-900">{members.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Pod Details */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pod Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Pod Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPod.name || ''}
                        onChange={(e) => setEditedPod({ ...editedPod, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-900">{pod.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Region
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPod.region || ''}
                        onChange={(e) => setEditedPod({ ...editedPod, region: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-900">{pod.region || 'All Regions'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Pod Leader
                    </label>
                    {isEditing ? (
                      <select
                        value={editedPod.leaderId || ''}
                        onChange={(e) => {
                          const selectedMember = members.find(m => m.id === e.target.value);
                          setEditedPod({
                            ...editedPod,
                            leaderId: e.target.value || undefined,
                            leaderName: selectedMember?.name || undefined
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No leader assigned</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-lg font-medium text-gray-900">{pod.leaderName || 'No leader assigned'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <Badge variant={pod.status === 'active' ? 'success' : 'danger'}>
                      {pod.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedPod.description || ''}
                        onChange={(e) => setEditedPod({ ...editedPod, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{pod.description || 'No description provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Created Date
                    </label>
                    <p className="text-base text-gray-700">
                      {new Date(pod.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-6 space-y-8">
            {/* Staff Members Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Staff Members ({staffMembers.length})</h2>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Staff Member
                </button>
              </div>

              {staffMembers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No staff members assigned to this pod yet</p>
                  <p className="text-sm text-gray-500 mt-1">Staff will be assigned during the hiring process</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                          {member.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              )}
            </div>

            {/* Patients Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Patients ({patientMembers.length})</h2>
                <button
                  onClick={() => setShowAddPatientModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Patient
                </button>
              </div>

              {patientMembers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No patients assigned to this pod yet</p>
                  <p className="text-sm text-gray-500 mt-1">Patients will be assigned during the intake process</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Care Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patientMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                              {member.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pod Assignment History</h2>
            <p className="text-gray-600 mb-6">Audit trail of all pod assignment and reassignment activities</p>

            {auditLogs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No activity logs yet</p>
                <p className="text-sm text-gray-500 mt-1">Assignment changes will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                  <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            log.action === 'assigned' ? 'success' :
                            log.action === 'reassigned' ? 'warning' :
                            'danger'
                          }>
                            {log.action.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {log.memberType === 'staff' ? '👤 Staff' : '🏥 Patient'}
                          </span>
                        </div>

                        <p className="text-sm text-gray-900 mb-2">
                          <strong>{log.memberName}</strong>
                          {log.action === 'assigned' && ` was assigned to ${log.podName}`}
                          {log.action === 'reassigned' && ` was moved from ${log.previousPodName} to ${log.podName}`}
                          {log.action === 'removed' && ` was removed from ${log.podName}`}
                        </p>

                        {log.notes && (
                          <p className="text-xs text-gray-600 italic mb-2">Note: {log.notes}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>By: {log.performedByName}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pod Settings</h2>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pod Status</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {pod.status === 'active'
                    ? 'This pod is currently active and accepting members.'
                    : 'This pod is currently inactive. Members cannot be assigned.'}
                </p>
                {pod.status === 'active' ? (
                  <button
                    onClick={handleDeactivatePod}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Deactivate Pod
                  </button>
                ) : (
                  <button
                    onClick={handleActivatePod}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Activate Pod
                  </button>
                )}
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Deleting a pod is permanent and cannot be undone. All members will be unassigned.
                </p>
                <button
                  onClick={handleDeletePod}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Pod
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modals */}
      <AddPodMemberModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onAdd={handleAddMember}
        memberType="staff"
        currentPodId={podId!}
        currentPodName={pod?.name || ''}
      />

      <AddPodMemberModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onAdd={handleAddMember}
        memberType="patient"
        currentPodId={podId!}
        currentPodName={pod?.name || ''}
      />
    </div>
  );
}
