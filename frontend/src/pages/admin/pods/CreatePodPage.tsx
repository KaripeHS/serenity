import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

interface PodFormData {
  name: string;
  description: string;
  region: string;
  status: 'active' | 'inactive';
}

interface Pod extends PodFormData {
  id: string;
  memberCount: number;
  leaderId?: string;
  leaderName?: string;
  createdAt: string;
}

const PODS_STORAGE_KEY = 'serenity_pods';

export function CreatePodPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PodFormData>({
    name: '',
    description: '',
    region: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Pod name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/console/admin/pods', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('serenity_access_token')}`
      //   },
      //   body: JSON.stringify(formData)
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Failed to create pod');
      // }
      //
      // const newPod = await response.json();

      // For now, save to localStorage
      const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
      const pods: Pod[] = storedPods ? JSON.parse(storedPods) : [];

      // Generate a new ID
      const newId = (Math.max(...pods.map(p => parseInt(p.id) || 0), 0) + 1).toString();

      const newPod: Pod = {
        id: newId,
        name: formData.name,
        description: formData.description,
        region: formData.region,
        status: formData.status,
        memberCount: 0,
        createdAt: new Date().toISOString()
      };

      pods.push(newPod);
      localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(pods));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate back without alert - user will see the new pod in the list
      navigate('/admin/pods');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pod');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/pods')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pods
        </button>

        <h1 className="text-3xl font-bold text-gray-900">Create New Pod</h1>
        <p className="text-gray-600 mt-1">Set up a new care team to organize your staff</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Pod Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., North Columbus Pod"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Choose a descriptive name that identifies the team's coverage area or purpose
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this pod's coverage area, responsibilities, or purpose"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Provide additional context about this pod's role and responsibilities
            </p>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <input
              type="text"
              id="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., North Columbus, Downtown, West Side"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Specify the geographic region this pod covers
            </p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Active pods can accept new members and assignments
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/pods')}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Pod
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
