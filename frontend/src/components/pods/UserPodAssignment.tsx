/**
 * User Pod Assignment Component
 * Allows assigning/reassigning users to pods from the user detail page
 * Includes validation and audit logging
 */

import { useState, useEffect } from 'react';
import { PencilIcon, UserGroupIcon, XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';
import { assignMemberToPod, getMemberCurrentPod, removeMemberFromPod } from '../../utils/podAssignment';

interface Pod {
  id: string;
  name: string;
  description?: string;
  region?: string;
  status: 'active' | 'inactive';
  memberCount: number;
}

interface UserPodAssignmentProps {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  memberType: 'staff' | 'patient';
  currentPodId?: string;
  currentPodName?: string;
  onAssignmentChange?: () => void; // Callback to refresh user data
}

const PODS_STORAGE_KEY = 'serenity_pods';

export function UserPodAssignment({
  userId,
  userName,
  userEmail,
  userRole,
  memberType,
  currentPodId,
  currentPodName,
  onAssignmentChange
}: UserPodAssignmentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pods, setPods] = useState<Pod[]>([]);
  const [selectedPodId, setSelectedPodId] = useState(currentPodId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPods();
  }, []);

  useEffect(() => {
    setSelectedPodId(currentPodId || '');
  }, [currentPodId]);

  const fetchPods = async () => {
    try {
      // TODO: Replace with API call
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const allPods: Pod[] = storedPods ? JSON.parse(storedPods) : [];

      // Only show active pods
      const activePods = allPods.filter(p => p.status === 'active');
      setPods(activePods);
    } catch (err) {
      console.error('Failed to load pods:', err);
      setPods([]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user info from localStorage
      const currentUser = JSON.parse(localStorage.getItem('serenity_user') || '{}');
      const performedBy = currentUser.id || 'system';
      const performedByName = currentUser.firstName && currentUser.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'System';

      if (selectedPodId) {
        // Assign to pod
        const result = assignMemberToPod({
          memberId: userId,
          memberName: userName,
          memberEmail: userEmail,
          memberRole: userRole,
          memberType,
          podId: selectedPodId,
          performedBy,
          performedByName,
          notes: 'Manual assignment from user detail page'
        });

        if (!result.success) {
          setError(result.error || 'Failed to assign to pod');
          return;
        }

        const podName = pods.find(p => p.id === selectedPodId)?.name || 'Pod';
        setSuccess(`Successfully assigned to ${podName}`);
      } else if (currentPodId) {
        // Remove from pod
        const result = removeMemberFromPod(
          userId,
          userName,
          memberType,
          performedBy,
          performedByName,
          'Manual removal from user detail page'
        );

        if (!result.success) {
          setError(result.error || 'Failed to remove from pod');
          return;
        }

        setSuccess(`Successfully removed from pod`);
      }

      // Close edit mode and refresh
      setTimeout(() => {
        setIsEditing(false);
        setSuccess(null);
        if (onAssignmentChange) {
          onAssignmentChange();
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedPodId(currentPodId || '');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <dt className="text-sm font-medium text-gray-500">
            {memberType === 'staff' ? 'Care Team Pod' : 'Assigned Pod'}
          </dt>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <PencilIcon className="h-4 w-4" />
            {currentPodName ? 'Change' : 'Assign'}
          </button>
        </div>
        <dd className="mt-1">
          {currentPodName ? (
            <div className="flex items-center gap-2">
              <Badge variant="info" className="text-sm">
                <UserGroupIcon className="h-3 w-3 inline mr-1" />
                {currentPodName}
              </Badge>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Not assigned to any pod</span>
          )}
        </dd>
      </div>
    );
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
        <UserGroupIcon className="h-5 w-5 text-blue-600" />
        {currentPodName ? 'Change Pod Assignment' : 'Assign to Pod'}
      </h4>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {pods.length === 0 ? (
        <div className="text-sm text-gray-600 mb-4">
          No active pods available. Please create a pod first.
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Pod
            </label>
            <select
              value={selectedPodId}
              onChange={(e) => setSelectedPodId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Remove from pod</option>
              {pods.map(pod => (
                <option key={pod.id} value={pod.id}>
                  {pod.name} {pod.region ? `(${pod.region})` : ''} - {pod.memberCount} members
                </option>
              ))}
            </select>
          </div>

          {currentPodName && selectedPodId && selectedPodId !== currentPodId && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Note:</strong> {userName} will be moved from <strong>{currentPodName}</strong> to the selected pod. This action will be logged in the audit trail.
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading || (selectedPodId === currentPodId) || pods.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <XMarkIcon className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
