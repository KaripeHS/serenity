import { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status?: string;
}

interface AddPodMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userId: string, userName: string, userEmail: string, userRole: string, memberType: 'staff' | 'patient') => void;
  memberType: 'staff' | 'patient';
  currentPodId: string;
  currentPodName: string;
}

const POD_MEMBERS_STORAGE_KEY = 'serenity_pod_members';

export function AddPodMemberModal({
  isOpen,
  onClose,
  onAdd,
  memberType,
  currentPodId,
  currentPodName
}: AddPodMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
  }, [isOpen, memberType]);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);

      // Fetch users from backend API
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const allUsers: User[] = data.users || [];

      // Get all pod members to filter out already assigned users
      const storedMembers = localStorage.getItem(POD_MEMBERS_STORAGE_KEY);
      const allMembers: Record<string, any[]> = storedMembers ? JSON.parse(storedMembers) : {};

      // Get IDs of users already in ANY pod
      const assignedUserIds = new Set<string>();
      Object.values(allMembers).forEach(podMembers => {
        podMembers.forEach(member => assignedUserIds.add(member.id));
      });

      // Filter users based on memberType and exclude already assigned
      let filteredUsers = allUsers.filter(user => {
        // Filter by type
        if (memberType === 'staff') {
          // Staff members are those with caregiver, nurse, admin roles, etc.
          const staffRoles = ['caregiver', 'nurse', 'care_coordinator', 'admin', 'hr_manager', 'hr_director'];
          if (!staffRoles.includes(user.role)) return false;
        } else {
          // Patients have 'patient' or 'client' role
          if (user.role !== 'patient' && user.role !== 'client') return false;
        }

        // Exclude users already assigned to pods
        if (assignedUserIds.has(user.id)) return false;

        // Only show active users
        if (user.status && user.status !== 'active' && user.status !== 'pending') return false;

        return true;
      });

      setAvailableUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const user = availableUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    const userName = `${user.firstName} ${user.lastName}`;
    onAdd(user.id, userName, user.email, user.role, memberType);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUserId('');
    onClose();
  };

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || user.email.toLowerCase().includes(search);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlusIcon className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">
                  Add {memberType === 'staff' ? 'Staff Member' : 'Patient'} to {currentPodName}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search {memberType === 'staff' ? 'Staff' : 'Patients'}
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* User List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {memberType === 'staff' ? 'Staff Member' : 'Patient'}
              </label>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    {availableUsers.length === 0
                      ? `No unassigned ${memberType === 'staff' ? 'staff members' : 'patients'} available`
                      : 'No matches found'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {availableUsers.length === 0
                      ? `All ${memberType === 'staff' ? 'staff' : 'patients'} are already assigned to pods`
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <input
                        type="radio"
                        name="user"
                        value={user.id}
                        checked={selectedUserId === user.id}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Info message */}
            {selectedUserId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  This {memberType === 'staff' ? 'staff member' : 'patient'} will be assigned to <strong>{currentPodName}</strong> and can be reassigned later if needed.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedUserId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add to Pod
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
