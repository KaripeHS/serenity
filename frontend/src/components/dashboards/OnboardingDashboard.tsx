import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressRing';
import {
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentArrowUpIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  PlayIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  CloudArrowUpIcon,
  VideoCameraIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { W4Form, DirectDepositForm, DocumentUpload, ESignature, SignatureData } from '../onboarding';
import { api } from '@/lib/api';

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
  skippedReason?: string | null;
  skippedBy?: string | null;
  skippedAt?: string | null;
  // Digital onboarding fields
  itemType?: 'task' | 'form' | 'upload' | 'video' | 'meeting' | 'signature';
  formTypes?: string[];
  requiresUpload?: boolean;
  requiresSignature?: boolean;
  trainingModules?: Array<{ id: string; name: string; duration: number; quizRequired: boolean }>;
  uploadCategories?: string[];
  formData?: Record<string, any>;
  uploadedFiles?: Array<{ id: string; fileName: string; fileUrl: string; verified: boolean }>;
  signature?: string;
  signedAt?: string;
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

export function OnboardingDashboard() {
  const { applicantId } = useParams<{ applicantId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Skip modal state
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [itemToSkip, setItemToSkip] = useState<OnboardingItem | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [skipping, setSkipping] = useState(false);

  // Form/Upload modal state
  const [activeFormModal, setActiveFormModal] = useState<{
    type: 'w4' | 'direct_deposit' | 'upload' | 'signature' | null;
    item: OnboardingItem | null;
  }>({ type: null, item: null });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Debug: log when component mounts
  console.log('[OnboardingDashboard] Component mounted, applicantId:', applicantId);

  useEffect(() => {
    console.log('[OnboardingDashboard] useEffect triggered, applicantId:', applicantId);
    if (applicantId) {
      fetchOnboardingData();
    }
  }, [applicantId]);

  const fetchOnboardingData = async () => {
    console.log('[OnboardingDashboard] fetchOnboardingData starting...');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/${applicantId}`;
      console.log('[OnboardingDashboard] Fetching:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[OnboardingDashboard] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[OnboardingDashboard] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to load onboarding data');
      }

      const result = await response.json();
      console.log('[OnboardingDashboard] Success, data:', result);
      setData(result);
      // Expand all categories by default
      if (result.categories && result.categories.length > 0) {
        setExpandedCategories(new Set(result.categories));
        // Select first category by default
        if (!selectedCategory) {
          setSelectedCategory(result.categories[0]);
        }
      }
    } catch (err: any) {
      console.log('[OnboardingDashboard] Catch error:', err.message);
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

  const openSkipModal = (item: OnboardingItem) => {
    setItemToSkip(item);
    setSkipReason('');
    setSkipModalOpen(true);
  };

  const closeSkipModal = () => {
    setSkipModalOpen(false);
    setItemToSkip(null);
    setSkipReason('');
  };

  const handleSkipItem = async () => {
    if (!itemToSkip || !skipReason.trim()) {
      alert('Please provide a reason for skipping this item');
      return;
    }

    setSkipping(true);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/items/${itemToSkip.id}/skip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: skipReason.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.requiresApproval) {
          alert('Required items can only be skipped by HR Director or above. Please contact your supervisor.');
        } else {
          throw new Error(result.error || 'Failed to skip item');
        }
        return;
      }

      // Refresh data and close modal
      await fetchOnboardingData();
      closeSkipModal();
    } catch (err: any) {
      alert('Failed to skip item: ' + err.message);
    } finally {
      setSkipping(false);
    }
  };

  const handleUnskipItem = async (itemId: string) => {
    setUpdatingItem(itemId);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/items/${itemId}/unskip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to restore item');
      }

      // Refresh data
      await fetchOnboardingData();
    } catch (err: any) {
      alert('Failed to restore item: ' + err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Form modal handlers
  const openFormModal = (item: OnboardingItem, formType: 'w4' | 'direct_deposit' | 'upload' | 'signature') => {
    setActiveFormModal({ type: formType, item });
  };

  const closeFormModal = () => {
    setActiveFormModal({ type: null, item: null });
  };

  const handleFormSubmit = async (formType: string, formData: any) => {
    if (!activeFormModal.item) return;

    setSubmittingForm(true);
    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/items/${activeFormModal.item.id}/submit-form`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ formType, formData })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit form');
      }

      // Refresh data and close modal
      await fetchOnboardingData();
      closeFormModal();
    } catch (err: any) {
      alert('Failed to submit form: ' + err.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDocumentUploadComplete = async () => {
    // Refresh data when a document is uploaded
    await fetchOnboardingData();
  };

  // Get item type icon for visual distinction
  const getItemTypeIcon = (item: OnboardingItem) => {
    const itemType = item.itemType || 'task';
    switch (itemType) {
      case 'form':
        return <PencilSquareIcon className="h-4 w-4 text-blue-500" />;
      case 'upload':
        return <CloudArrowUpIcon className="h-4 w-4 text-purple-500" />;
      case 'video':
        return <VideoCameraIcon className="h-4 w-4 text-red-500" />;
      case 'meeting':
        return <UserGroupIcon className="h-4 w-4 text-green-500" />;
      case 'signature':
        return <PencilSquareIcon className="h-4 w-4 text-indigo-500" />;
      default:
        return <ClipboardDocumentCheckIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get action buttons based on item type
  const getItemActions = (item: OnboardingItem) => {
    if (item.status === 'completed' || item.status === 'skipped') return null;

    const itemType = item.itemType || 'task';
    const formTypes = item.formTypes || [];

    switch (itemType) {
      case 'form':
        // Render buttons for each form type
        return (
          <div className="flex gap-2">
            {formTypes.includes('w4') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openFormModal(item, 'w4')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                W-4 Form
              </Button>
            )}
            {formTypes.includes('direct_deposit') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openFormModal(item, 'direct_deposit')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Direct Deposit
              </Button>
            )}
            {formTypes.includes('i9_section1') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openFormModal(item, 'upload')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                I-9 Form
              </Button>
            )}
          </div>
        );

      case 'upload':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openFormModal(item, 'upload')}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-1" />
            Upload Documents
          </Button>
        );

      case 'signature':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openFormModal(item, 'signature')}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Review & Sign
          </Button>
        );

      case 'video':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // TODO: Open video player modal
              alert('Training video player coming soon!');
            }}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <VideoCameraIcon className="h-4 w-4 mr-1" />
            Watch Training
          </Button>
        );

      case 'meeting':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // TODO: Schedule meeting integration
              alert('Meeting scheduling coming soon!');
            }}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Schedule
          </Button>
        );

      default:
        // Standard task actions
        return null;
    }
  };

  const getStatusIcon = (status: string, size = 'h-5 w-5') => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${size} text-success-600`} />;
      case 'in_progress':
        return <ClockIcon className={`${size} text-primary-600`} />;
      case 'skipped':
        return <div className={`${size} rounded-full bg-gray-300`} />;
      default:
        return <div className={`${size} rounded-full border-2 border-gray-300`} />;
    }
  };

  const getCategoryStats = (category: string) => {
    if (!data) return { completed: 0, total: 0, percentage: 0 };
    const items = data.itemsByCategory[category] || [];
    const completed = items.filter(i => i.status === 'completed').length;
    return {
      completed,
      total: items.length,
      percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0
    };
  };

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('document') || lowerCategory.includes('paperwork')) {
      return <DocumentTextIcon className="h-5 w-5" />;
    }
    if (lowerCategory.includes('training')) {
      return <ClipboardDocumentCheckIcon className="h-5 w-5" />;
    }
    if (lowerCategory.includes('equipment') || lowerCategory.includes('setup')) {
      return <BriefcaseIcon className="h-5 w-5" />;
    }
    if (lowerCategory.includes('compliance') || lowerCategory.includes('background')) {
      return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
    return <ClipboardDocumentCheckIcon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-lg text-gray-600">Loading onboarding data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-danger-50 border-danger-200">
          <div className="flex items-center gap-3 text-danger-800">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Onboarding</h3>
              <p>{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => navigate('/dashboard/hr')} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to HR Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data || !data.applicant || !data.onboarding) {
    return (
      <div className="p-6">
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3 text-yellow-800">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">No Onboarding Data</h3>
              <p>Onboarding data is not available for this applicant.</p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => navigate('/dashboard/hr')} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to HR Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/dashboard/hr"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to HR Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Onboarding: {data.applicant?.name || 'Unknown'}
            </h1>
            <p className="text-gray-500 mt-1">{data.applicant?.position || 'Position not set'}</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="success">
              {data.onboarding.status === 'not_started' ? 'Not Started' :
               data.onboarding.status === 'in_progress' ? 'In Progress' :
               data.onboarding.status === 'completed' ? 'Completed' : data.onboarding.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Progress Card */}
        <Card className="flex items-center gap-4">
          <ProgressRing
            percentage={data.onboarding.progress}
            size={60}
            strokeWidth={6}
            color={data.onboarding.progress === 100 ? '#10b981' : '#3b82f6'}
            showPercentage={false}
          />
          <div>
            <p className="text-sm text-gray-500">Progress</p>
            <p className="text-2xl font-bold text-gray-900">{data.onboarding.progress}%</p>
          </div>
        </Card>

        {/* Tasks Card */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks Completed</p>
              <p className="text-xl font-bold text-gray-900">
                {data.onboarding.completedItems} / {data.onboarding.totalItems}
              </p>
            </div>
          </div>
        </Card>

        {/* Start Date Card */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.onboarding.startDate
                  ? new Date(data.onboarding.startDate).toLocaleDateString()
                  : 'To be determined'}
              </p>
            </div>
          </div>
        </Card>

        {/* Email Card */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate" title={data.applicant.email}>
                {data.applicant.email}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {data.categories.map(category => {
                const stats = getCategoryStats(category);
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={isSelected ? 'text-primary-600' : 'text-gray-500'}>
                        {getCategoryIcon(category)}
                      </span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${stats.percentage === 100 ? 'text-success-600' : 'text-gray-500'}`}>
                        {stats.completed}/{stats.total}
                      </span>
                      {stats.percentage === 100 && (
                        <CheckCircleIcon className="h-4 w-4 text-success-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-3">
          <Card>
            {selectedCategory && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedCategory}</h3>
                    <p className="text-sm text-gray-500">
                      {getCategoryStats(selectedCategory).completed} of {getCategoryStats(selectedCategory).total} tasks completed
                    </p>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${getCategoryStats(selectedCategory).percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {data.itemsByCategory[selectedCategory]?.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-all ${
                        item.status === 'completed'
                          ? 'bg-success-50/50 border-success-200'
                          : item.status === 'skipped'
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : item.status === 'in_progress'
                          ? 'bg-primary-50/50 border-primary-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox / Status */}
                        <button
                          onClick={() => {
                            if (item.status === 'skipped') return;
                            updateItemStatus(
                              item.id,
                              item.status === 'completed' ? 'pending' : 'completed'
                            );
                          }}
                          disabled={updatingItem === item.id || item.status === 'skipped'}
                          className="flex-shrink-0 mt-1 disabled:opacity-50"
                        >
                          {updatingItem === item.id ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          ) : item.status === 'skipped' ? (
                            <NoSymbolIcon className="h-6 w-6 text-gray-400" />
                          ) : (
                            getStatusIcon(item.status, 'h-6 w-6')
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {/* Item type icon */}
                            <span className="flex-shrink-0" title={item.itemType || 'task'}>
                              {getItemTypeIcon(item)}
                            </span>
                            <span className={`font-medium ${
                              item.status === 'completed' ? 'text-gray-500 line-through' :
                              item.status === 'skipped' ? 'text-gray-400 line-through' : 'text-gray-900'
                            }`}>
                              {item.taskName}
                            </span>
                            {item.isRequired && item.status !== 'skipped' && (
                              <Badge variant="danger" className="text-xs">Required</Badge>
                            )}
                            {item.status === 'skipped' && (
                              <Badge variant="default" className="text-xs bg-gray-200">Skipped</Badge>
                            )}
                            {/* Item type badge */}
                            {item.itemType && item.itemType !== 'task' && item.status !== 'completed' && item.status !== 'skipped' && (
                              <Badge variant="info" className="text-xs capitalize">
                                {item.itemType === 'form' ? 'Digital Form' :
                                 item.itemType === 'upload' ? 'Upload Required' :
                                 item.itemType === 'video' ? 'Video Training' :
                                 item.itemType === 'meeting' ? 'Meeting' :
                                 item.itemType === 'signature' ? 'E-Signature' : item.itemType}
                              </Badge>
                            )}
                          </div>

                          {item.description && (
                            <p className={`text-sm mb-2 ${item.status === 'skipped' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item.description}
                            </p>
                          )}

                          {/* Show skip reason if skipped */}
                          {item.status === 'skipped' && item.skippedReason && (
                            <div className="text-xs text-gray-500 italic mb-2 flex items-center gap-1">
                              <NoSymbolIcon className="h-3 w-3" />
                              Reason: {item.skippedReason}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {item.assignedRole}
                            </span>
                            {item.dueDate && (
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Due: {new Date(item.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {item.completedAt && (
                              <span className="flex items-center gap-1 text-success-600">
                                <CheckCircleIcon className="h-3 w-3" />
                                Completed: {new Date(item.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.status === 'skipped' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnskipItem(item.id)}
                              disabled={updatingItem === item.id}
                              className="text-gray-600"
                            >
                              <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          ) : item.status !== 'completed' && (
                            <>
                              {/* Type-specific action buttons */}
                              {getItemActions(item)}

                              {/* Standard actions for task types or fallback */}
                              {(!item.itemType || item.itemType === 'task') && (
                                <>
                                  {item.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemStatus(item.id, 'in_progress')}
                                      disabled={updatingItem === item.id}
                                    >
                                      <PlayIcon className="h-4 w-4 mr-1" />
                                      Start
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button
                                size="sm"
                                onClick={() => updateItemStatus(item.id, 'completed')}
                                disabled={updatingItem === item.id}
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openSkipModal(item)}
                                disabled={updatingItem === item.id}
                                className="text-gray-500 hover:text-gray-700"
                                title="Skip this item"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Notes Section */}
      {data.onboarding.notes && (
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            Internal Notes
          </h4>
          <p className="text-yellow-800">{data.onboarding.notes}</p>
        </Card>
      )}

      {/* Skip Item Modal */}
      {skipModalOpen && itemToSkip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-full">
                  <NoSymbolIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Skip Onboarding Item</h3>
                  <p className="text-sm text-gray-500">Mark as not applicable</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{itemToSkip.taskName}</p>
                {itemToSkip.description && (
                  <p className="text-sm text-gray-500 mt-1">{itemToSkip.description}</p>
                )}
                {itemToSkip.isRequired && (
                  <div className="mt-2 flex items-center gap-1 text-amber-600 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    This is a required item. Only HR Director or above can skip it.
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for skipping <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="Explain why this item is not applicable..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeSkipModal}
                  disabled={skipping}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleSkipItem}
                  disabled={skipping || !skipReason.trim()}
                >
                  {skipping ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Skipping...
                    </>
                  ) : (
                    <>
                      <NoSymbolIcon className="h-4 w-4 mr-1" />
                      Skip Item
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* W-4 Form Modal */}
      {activeFormModal.type === 'w4' && activeFormModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">W-4 Tax Withholding Form</h3>
                <p className="text-sm text-gray-500">For: {data?.applicant?.name}</p>
              </div>
              <button
                onClick={closeFormModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <W4Form
                employeeName={data?.applicant?.name || ''}
                onSubmit={(formData) => handleFormSubmit('w4', formData)}
                onCancel={closeFormModal}
                loading={submittingForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* Direct Deposit Form Modal */}
      {activeFormModal.type === 'direct_deposit' && activeFormModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Direct Deposit Authorization</h3>
                <p className="text-sm text-gray-500">For: {data?.applicant?.name}</p>
              </div>
              <button
                onClick={closeFormModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <DirectDepositForm
                employeeName={data?.applicant?.name || ''}
                onSubmit={(formData) => handleFormSubmit('direct_deposit', formData)}
                onCancel={closeFormModal}
                loading={submittingForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {activeFormModal.type === 'upload' && activeFormModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
                <p className="text-sm text-gray-500">{activeFormModal.item.taskName}</p>
              </div>
              <button
                onClick={closeFormModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                {activeFormModal.item.description}
              </p>
              <DocumentUpload
                itemId={activeFormModal.item.id}
                category={activeFormModal.item.uploadCategories?.[0] || 'document'}
                onUploadComplete={handleDocumentUploadComplete}
                existingDocuments={activeFormModal.item.uploadedFiles?.map(f => ({
                  id: f.id,
                  fileName: f.fileName,
                  fileType: 'document',
                  fileUrl: f.fileUrl,
                  fileSize: 0,
                  category: 'document',
                  uploadedAt: new Date().toISOString(),
                  verified: f.verified
                })) || []}
                instructions={
                  activeFormModal.item.uploadCategories?.includes('identity_document')
                    ? 'Upload a clear photo or scan of your government-issued ID (passport, driver\'s license, or state ID)'
                    : undefined
                }
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={closeFormModal}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      {activeFormModal.type === 'signature' && activeFormModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Document</h3>
                <p className="text-sm text-gray-500">{activeFormModal.item.taskName}</p>
              </div>
              <button
                onClick={closeFormModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-600">
                  {activeFormModal.item.description || 'Please read and sign below to acknowledge that you have read and agree to the terms.'}
                </p>
              </div>
              <ESignature
                onSign={(signatureData) => {
                  handleFormSubmit('signature', signatureData);
                }}
                signerName={data?.applicant?.name || ''}
                attestationText="By signing below, I acknowledge that I have read and agree to all terms and policies described above."
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={closeFormModal}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
