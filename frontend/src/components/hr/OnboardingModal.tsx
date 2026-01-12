import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface OnboardingItem {
  id: string;
  order: number;
  taskName: string;
  description: string;
  isRequired: boolean;
  dueDate: string | null;
  assignedRole: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
}

interface OnboardingData {
  applicant: {
    id: string;
    name: string;
    email: string;
    position: string;
    hiredDate: string | null;
  };
  onboarding: {
    id: string;
    status: string;
    startDate: string | null;
    targetCompletionDate: string | null;
    totalItems: number;
    completedItems: number;
    progress: number;
    notes: string | null;
    createdAt: string;
  };
  itemsByCategory: Record<string, OnboardingItem[]>;
  categories: string[];
}

interface OnboardingModalProps {
  applicantId: string;
  applicantName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({
  applicantId,
  applicantName,
  isOpen,
  onClose
}: OnboardingModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && applicantId) {
      fetchOnboardingData();
    }
  }, [isOpen, applicantId]);

  const fetchOnboardingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/${applicantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load onboarding data');
      }

      const result = await response.json();
      setData(result);
      // Expand all categories by default
      setExpandedCategories(new Set(result.categories));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    setUpdatingItem(itemId);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      // Refresh data
      await fetchOnboardingData();
    } catch (err: any) {
      alert('Failed to update item: ' + err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-600" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-primary-600" />;
      case 'skipped':
        return <XMarkIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-primary-100 text-primary-700',
      completed: 'bg-success-100 text-success-700',
      skipped: 'bg-gray-100 text-gray-500'
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      skipped: 'Skipped'
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500 rounded-full">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Onboarding Checklist</h2>
                  <p className="text-sm text-primary-100">{applicantName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-primary-500 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Loading onboarding data...</span>
              </div>
            ) : error ? (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-danger-800">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            ) : data ? (
              <>
                {/* Progress Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{data.applicant.position}</h3>
                      <p className="text-sm text-gray-500">
                        Started: {data.onboarding.createdAt
                          ? new Date(data.onboarding.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{data.onboarding.progress}%</div>
                      <div className="text-sm text-gray-500">
                        {data.onboarding.completedItems} of {data.onboarding.totalItems} tasks
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${data.onboarding.progress}%` }}
                    />
                  </div>
                </div>

                {/* Categories and Items */}
                <div className="space-y-4">
                  {data.categories.map(category => (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(category) ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900">{category}</span>
                          <span className="text-sm text-gray-500">
                            ({data.itemsByCategory[category].filter(i => i.status === 'completed').length}/{data.itemsByCategory[category].length})
                          </span>
                        </div>
                      </button>

                      {/* Items */}
                      {expandedCategories.has(category) && (
                        <div className="divide-y divide-gray-100">
                          {data.itemsByCategory[category].map(item => (
                            <div
                              key={item.id}
                              className={`px-4 py-3 flex items-start gap-3 ${
                                item.status === 'completed' ? 'bg-success-50/30' : ''
                              }`}
                            >
                              {/* Status Toggle */}
                              <button
                                onClick={() => updateItemStatus(
                                  item.id,
                                  item.status === 'completed' ? 'pending' : 'completed'
                                )}
                                disabled={updatingItem === item.id}
                                className="flex-shrink-0 mt-0.5 disabled:opacity-50"
                              >
                                {updatingItem === item.id ? (
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                                ) : (
                                  getStatusIcon(item.status)
                                )}
                              </button>

                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium ${
                                    item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}>
                                    {item.taskName}
                                  </span>
                                  {item.isRequired && (
                                    <span className="px-1.5 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded">
                                      Required
                                    </span>
                                  )}
                                  {getStatusBadge(item.status)}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                  <span>Assigned: {item.assignedRole}</span>
                                  {item.dueDate && (
                                    <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                  )}
                                  {item.completedAt && (
                                    <span className="text-success-600">
                                      Completed: {new Date(item.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {data.onboarding.notes && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-1">Notes</h4>
                    <p className="text-sm text-yellow-800">{data.onboarding.notes}</p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
