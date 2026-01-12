/**
 * Pod Assignment Component
 * Reusable component for assigning staff or patients to pods
 * Can be used in hiring workflow, patient intake, or user management
 */

import React, { useState, useEffect } from 'react';
import { UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';

interface Pod {
  id: string;
  name: string;
  description?: string;
  region?: string;
  status: 'active' | 'inactive';
  memberCount: number;
}

interface PodAssignmentProps {
  selectedPodId?: string;
  onPodSelect: (podId: string) => void;
  required?: boolean;
  label?: string;
  helperText?: string;
  showOnlyActive?: boolean;
}

const PODS_STORAGE_KEY = 'serenity_pods';

export function PodAssignment({
  selectedPodId,
  onPodSelect,
  required = false,
  label = 'Assign to Pod',
  helperText = 'Select the care team pod this person will be assigned to',
  showOnlyActive = true
}: PodAssignmentProps) {
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPods();
  }, []);

  const fetchPods = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/console/admin/pods');
      // const data = await response.json();

      // Load from localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      let allPods: Pod[] = storedPods ? JSON.parse(storedPods) : [];

      // Filter to only active pods if specified
      if (showOnlyActive) {
        allPods = allPods.filter(p => p.status === 'active');
      }

      setPods(allPods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pods');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading pods...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={fetchPods}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (pods.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            No {showOnlyActive ? 'active ' : ''}pods available. Please create a pod first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        {pods.map((pod) => {
          const isSelected = selectedPodId === pod.id;

          return (
            <button
              key={pod.id}
              type="button"
              onClick={() => onPodSelect(pod.id)}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <UserGroupIcon className={`h-5 w-5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium truncate ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {pod.name}
                    </h4>
                    {pod.status === 'active' && (
                      <Badge variant="success" className="text-xs">Active</Badge>
                    )}
                  </div>

                  {pod.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {pod.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {pod.region && (
                      <span>{pod.region}</span>
                    )}
                    <span>{pod.memberCount} members</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
