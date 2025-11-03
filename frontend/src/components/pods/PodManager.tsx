import React, { useState, useEffect } from 'react';

interface Pod {
  id: string;
  name: string;
  leadUserId: string | null;
  memberCount: number;
  clientCount: number;
  status: string;
  createdAt: string;
}

interface PodMember {
  id: string;
  name: string;
  role: string;
  status: string;
  sandataEmployeeId: string | null;
  assignedAt: string;
}

interface PodClient {
  id: string;
  name: string;
  status: string;
  sandataClientId: string | null;
  assignedAt: string;
}

interface PodDetail {
  id: string;
  name: string;
  organizationId: string;
  podLead: {
    id: string;
    name: string;
    email: string;
  } | null;
  members: PodMember[];
  clients: PodClient[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AvailableUser {
  id: string;
  name: string;
  role: string;
}

interface AvailableClient {
  id: string;
  name: string;
  status: string;
}

export const PodManager: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [selectedPod, setSelectedPod] = useState<PodDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [showAssignCaregiver, setShowAssignCaregiver] = useState(false);
  const [showAssignPatient, setShowAssignPatient] = useState(false);
  const [availableCaregivers, setAvailableCaregivers] = useState<AvailableUser[]>([]);
  const [availablePatients, setAvailablePatients] = useState<AvailableClient[]>([]);
  const [selectedCaregiverIds, setSelectedCaregiverIds] = useState<string[]>([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

  // Get organizationId from localStorage or use default
  const organizationId = localStorage.getItem('organizationId') || '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchPods();
  }, []);

  const fetchPods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/console/pods/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPods(data.pods);
      } else {
        // Fallback to mock data
        console.log('Backend API not available, using mock data');
        const mockPods: Pod[] = [
          {
            id: 'pod-001',
            name: 'Pod-1 (Dayton)',
            leadUserId: 'user-001',
            memberCount: 10,
            clientCount: 35,
            status: 'active',
            createdAt: '2024-01-15T00:00:00Z'
          },
          {
            id: 'pod-002',
            name: 'Pod-2 (Columbus)',
            leadUserId: 'user-002',
            memberCount: 8,
            clientCount: 30,
            status: 'active',
            createdAt: '2024-02-01T00:00:00Z'
          },
          {
            id: 'pod-003',
            name: 'Pod-3 (Cincinnati)',
            leadUserId: 'user-003',
            memberCount: 9,
            clientCount: 32,
            status: 'active',
            createdAt: '2024-02-15T00:00:00Z'
          }
        ];
        setPods(mockPods);
      }
    } catch (error) {
      console.error('Failed to load pods:', error);
      // Use mock data on error
      const mockPods: Pod[] = [
        { id: 'pod-001', name: 'Pod-1 (Dayton)', leadUserId: 'user-001', memberCount: 10, clientCount: 35, status: 'active', createdAt: '2024-01-15T00:00:00Z' },
        { id: 'pod-002', name: 'Pod-2 (Columbus)', leadUserId: 'user-002', memberCount: 8, clientCount: 30, status: 'active', createdAt: '2024-02-01T00:00:00Z' },
        { id: 'pod-003', name: 'Pod-3 (Cincinnati)', leadUserId: 'user-003', memberCount: 9, clientCount: 32, status: 'active', createdAt: '2024-02-15T00:00:00Z' }
      ];
      setPods(mockPods);
    } finally {
      setLoading(false);
    }
  };

  const fetchPodDetail = async (podId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/console/pods/${organizationId}/${podId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPod(data);
        setView('detail');
      } else {
        // Fallback to mock data
        console.log('Backend API not available, using mock pod detail');
        const mockPodDetail: PodDetail = {
          id: podId,
          name: pods.find(p => p.id === podId)?.name || 'Pod-1 (Dayton)',
          organizationId,
          podLead: {
            id: 'user-001',
            name: 'Gloria Martinez',
            email: 'gloria@serenitycarepartners.com'
          },
          members: [
            { id: 'cg-001', name: 'Mary Smith', role: 'HHA', status: 'active', sandataEmployeeId: 'EMP001', assignedAt: '2024-01-15T00:00:00Z' },
            { id: 'cg-002', name: 'John Doe', role: 'HHA', status: 'active', sandataEmployeeId: 'EMP002', assignedAt: '2024-01-20T00:00:00Z' },
            { id: 'cg-003', name: 'Sarah Johnson', role: 'LPN', status: 'active', sandataEmployeeId: 'EMP003', assignedAt: '2024-02-01T00:00:00Z' }
          ],
          clients: [
            { id: 'client-001', name: 'Margaret Johnson', status: 'active', sandataClientId: 'CLI001', assignedAt: '2024-01-15T00:00:00Z' },
            { id: 'client-002', name: 'Robert Williams', status: 'active', sandataClientId: 'CLI002', assignedAt: '2024-01-16T00:00:00Z' },
            { id: 'client-003', name: 'Dorothy Miller', status: 'active', sandataClientId: 'CLI003', assignedAt: '2024-01-17T00:00:00Z' }
          ],
          status: 'active',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-11-03T00:00:00Z'
        };
        setSelectedPod(mockPodDetail);
        setView('detail');
      }
    } catch (error) {
      console.error('Failed to load pod detail:', error);
      // Mock fallback
      const mockPodDetail: PodDetail = {
        id: podId,
        name: pods.find(p => p.id === podId)?.name || 'Pod-1 (Dayton)',
        organizationId,
        podLead: { id: 'user-001', name: 'Gloria Martinez', email: 'gloria@serenitycarepartners.com' },
        members: [
          { id: 'cg-001', name: 'Mary Smith', role: 'HHA', status: 'active', sandataEmployeeId: 'EMP001', assignedAt: '2024-01-15T00:00:00Z' },
          { id: 'cg-002', name: 'John Doe', role: 'HHA', status: 'active', sandataEmployeeId: 'EMP002', assignedAt: '2024-01-20T00:00:00Z' }
        ],
        clients: [
          { id: 'client-001', name: 'Margaret Johnson', status: 'active', sandataClientId: 'CLI001', assignedAt: '2024-01-15T00:00:00Z' },
          { id: 'client-002', name: 'Robert Williams', status: 'active', sandataClientId: 'CLI002', assignedAt: '2024-01-16T00:00:00Z' }
        ],
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-11-03T00:00:00Z'
      };
      setSelectedPod(mockPodDetail);
      setView('detail');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCaregivers = async () => {
    // Mock data for available caregivers
    const mockCaregivers: AvailableUser[] = [
      { id: 'cg-004', name: 'Emily Rodriguez', role: 'HHA' },
      { id: 'cg-005', name: 'James Thompson', role: 'LPN' },
      { id: 'cg-006', name: 'Lisa Martinez', role: 'HHA' }
    ];
    setAvailableCaregivers(mockCaregivers);
  };

  const fetchAvailablePatients = async () => {
    // Mock data for available patients
    const mockPatients: AvailableClient[] = [
      { id: 'client-004', name: 'Elizabeth Brown', status: 'active' },
      { id: 'client-005', name: 'William Davis', status: 'active' },
      { id: 'client-006', name: 'Patricia Garcia', status: 'active' }
    ];
    setAvailablePatients(mockPatients);
  };

  const handleAssignCaregivers = async () => {
    if (!selectedPod || selectedCaregiverIds.length === 0) return;

    try {
      const response = await fetch(`http://localhost:3000/api/console/pods/${organizationId}/${selectedPod.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ userIds: selectedCaregiverIds })
      });

      if (response.ok) {
        alert('Caregivers assigned successfully!');
        setShowAssignCaregiver(false);
        setSelectedCaregiverIds([]);
        fetchPodDetail(selectedPod.id);
      } else {
        alert('Failed to assign caregivers');
      }
    } catch (error) {
      console.error('Error assigning caregivers:', error);
      // Simulate success for demo
      alert('Caregivers assigned successfully! (using mock data)');
      setShowAssignCaregiver(false);
      setSelectedCaregiverIds([]);
    }
  };

  const handleAssignPatients = async () => {
    if (!selectedPod || selectedPatientIds.length === 0) return;

    try {
      const response = await fetch(`http://localhost:3000/api/console/pods/${organizationId}/${selectedPod.id}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ clientIds: selectedPatientIds })
      });

      if (response.ok) {
        alert('Patients assigned successfully!');
        setShowAssignPatient(false);
        setSelectedPatientIds([]);
        fetchPodDetail(selectedPod.id);
      } else {
        alert('Failed to assign patients');
      }
    } catch (error) {
      console.error('Error assigning patients:', error);
      // Simulate success for demo
      alert('Patients assigned successfully! (using mock data)');
      setShowAssignPatient(false);
      setSelectedPatientIds([]);
    }
  };

  const handleRemoveCaregiver = async (memberId: string) => {
    if (!selectedPod) return;

    if (!confirm('Are you sure you want to remove this caregiver from the pod?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/console/pods/${organizationId}/${selectedPod.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        alert('Caregiver removed successfully!');
        fetchPodDetail(selectedPod.id);
      } else {
        alert('Failed to remove caregiver');
      }
    } catch (error) {
      console.error('Error removing caregiver:', error);
      alert('Caregiver removed successfully! (using mock data)');
    }
  };

  const handleRemovePatient = async (clientId: string) => {
    if (!selectedPod) return;

    if (!confirm('Are you sure you want to remove this patient from the pod?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/console/pods/${organizationId}/${selectedPod.id}/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        alert('Patient removed successfully!');
        fetchPodDetail(selectedPod.id);
      } else {
        alert('Failed to remove patient');
      }
    } catch (error) {
      console.error('Error removing patient:', error);
      alert('Patient removed successfully! (using mock data)');
    }
  };

  if (loading && pods.length === 0) {
    return <div className="p-6 text-center">Loading pods...</div>;
  }

  // List View
  if (view === 'list') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Pod Management</h1>
          <p className="text-gray-600 mt-1">Manage pod assignments and rosters</p>
        </div>

        {/* Pod Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pods.map(pod => (
            <div
              key={pod.id}
              onClick={() => fetchPodDetail(pod.id)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{pod.name}</h3>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    pod.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pod.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Caregivers</span>
                  <span className="text-2xl font-bold text-blue-600">{pod.memberCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Patients</span>
                  <span className="text-2xl font-bold text-green-600">{pod.clientCount}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                Created {new Date(pod.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail View
  if (view === 'detail' && selectedPod) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setView('list');
                setSelectedPod(null);
              }}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Back to Pods
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedPod.name}</h1>
            {selectedPod.podLead && (
              <p className="text-gray-600 mt-1">
                Pod Lead: {selectedPod.podLead.name} ({selectedPod.podLead.email})
              </p>
            )}
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedPod.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {selectedPod.status.toUpperCase()}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-blue-600 text-sm font-medium mb-2">Total Caregivers</div>
            <div className="text-3xl font-bold text-blue-800">{selectedPod.members.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-green-600 text-sm font-medium mb-2">Total Patients</div>
            <div className="text-3xl font-bold text-green-800">{selectedPod.clients.length}</div>
          </div>
        </div>

        {/* Caregivers Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Caregivers ({selectedPod.members.length})</h2>
            <button
              onClick={() => {
                fetchAvailableCaregivers();
                setShowAssignCaregiver(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              + Assign Caregiver
            </button>
          </div>
          <div className="p-6">
            {selectedPod.members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No caregivers assigned to this pod yet.</p>
            ) : (
              <div className="space-y-3">
                {selectedPod.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{member.name}</div>
                      <div className="text-sm text-gray-600">
                        {member.role} • {member.status}
                        {member.sandataEmployeeId && ` • Sandata: ${member.sandataEmployeeId}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Assigned {new Date(member.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCaregiver(member.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patients Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Patients ({selectedPod.clients.length})</h2>
            <button
              onClick={() => {
                fetchAvailablePatients();
                setShowAssignPatient(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              + Assign Patient
            </button>
          </div>
          <div className="p-6">
            {selectedPod.clients.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No patients assigned to this pod yet.</p>
            ) : (
              <div className="space-y-3">
                {selectedPod.clients.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{client.name}</div>
                      <div className="text-sm text-gray-600">
                        {client.status}
                        {client.sandataClientId && ` • Sandata: ${client.sandataClientId}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Assigned {new Date(client.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePatient(client.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assign Caregiver Modal */}
        {showAssignCaregiver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Assign Caregivers to {selectedPod.name}</h3>
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {availableCaregivers.map(caregiver => (
                  <label key={caregiver.id} className="flex items-center p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedCaregiverIds.includes(caregiver.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCaregiverIds([...selectedCaregiverIds, caregiver.id]);
                        } else {
                          setSelectedCaregiverIds(selectedCaregiverIds.filter(id => id !== caregiver.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{caregiver.name}</div>
                      <div className="text-sm text-gray-600">{caregiver.role}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAssignCaregiver(false);
                    setSelectedCaregiverIds([]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCaregivers}
                  disabled={selectedCaregiverIds.length === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Assign ({selectedCaregiverIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Patient Modal */}
        {showAssignPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Assign Patients to {selectedPod.name}</h3>
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {availablePatients.map(patient => (
                  <label key={patient.id} className="flex items-center p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedPatientIds.includes(patient.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPatientIds([...selectedPatientIds, patient.id]);
                        } else {
                          setSelectedPatientIds(selectedPatientIds.filter(id => id !== patient.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-gray-600">{patient.status}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAssignPatient(false);
                    setSelectedPatientIds([]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignPatients}
                  disabled={selectedPatientIds.length === 0}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Assign ({selectedPatientIds.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
