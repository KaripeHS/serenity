import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressRing';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CloudArrowUpIcon,
  VideoCameraIcon,
  UserGroupIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { W4Form, DirectDepositForm, DocumentUpload, ESignature } from './index';
import type { W4FormData } from './W4Form';
import type { DirectDepositFormData } from './DirectDepositForm';
import type { SignatureData } from './ESignature';

interface OnboardingTask {
  id: string;
  order: number;
  taskName: string;
  description: string;
  category: string;
  isRequired: boolean;
  dueDate: string | null;
  assignedRole: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
  itemType?: 'task' | 'form' | 'upload' | 'video' | 'meeting' | 'signature';
  formTypes?: string[];
  requiresUpload?: boolean;
  requiresSignature?: boolean;
  trainingModules?: Array<{ id: string; name: string; duration: number; quizRequired: boolean }>;
  uploadCategories?: string[];
  formData?: Record<string, any>;
  uploadedFiles?: Array<{ id: string; fileName: string; fileUrl: string; verified: boolean }>;
}

interface OnboardingStatus {
  id: string;
  status: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  startDate: string | null;
  targetCompletionDate: string | null;
}

interface NewHireData {
  employee: {
    id: string;
    name: string;
    email: string;
    position: string;
  };
  onboarding: OnboardingStatus;
  tasks: OnboardingTask[];
  tasksByCategory: Record<string, OnboardingTask[]>;
  categories: string[];
}

/**
 * New Hire Self-Service Portal
 *
 * Allows new employees to:
 * - View their onboarding progress
 * - Complete digital forms (W-4, Direct Deposit, I-9)
 * - Upload required documents
 * - Watch training videos
 * - E-sign acknowledgments
 */
export function NewHirePortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewHireData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form modal state
  const [activeModal, setActiveModal] = useState<{
    type: 'w4' | 'direct_deposit' | 'upload' | 'signature' | null;
    task: OnboardingTask | null;
  }>({ type: null, task: null });

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/mobile/onboarding/my-tasks`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load onboarding data');
      }

      const result = await response.json();
      setData(result);

      // Select first category with pending tasks, or first category
      if (result.categories?.length > 0) {
        const categoryWithPending = result.categories.find((cat: string) =>
          result.tasksByCategory[cat]?.some((t: OnboardingTask) => t.status !== 'completed' && t.status !== 'skipped')
        );
        setSelectedCategory(categoryWithPending || result.categories[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (task: OnboardingTask, type: 'w4' | 'direct_deposit' | 'upload' | 'signature') => {
    setActiveModal({ type, task });
  };

  const closeModal = () => {
    setActiveModal({ type: null, task: null });
  };

  const handleFormSubmit = async (formType: string, formData: any) => {
    if (!activeModal.task) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/mobile/onboarding/tasks/${activeModal.task.id}/submit-form`,
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

      await fetchOnboardingData();
      closeModal();
    } catch (err: any) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUploadComplete = async () => {
    await fetchOnboardingData();
  };

  const getTaskIcon = (task: OnboardingTask) => {
    const itemType = task.itemType || 'task';
    switch (itemType) {
      case 'form':
        return <PencilSquareIcon className="h-5 w-5 text-blue-500" />;
      case 'upload':
        return <CloudArrowUpIcon className="h-5 w-5 text-purple-500" />;
      case 'video':
        return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
      case 'meeting':
        return <UserGroupIcon className="h-5 w-5 text-green-500" />;
      case 'signature':
        return <PencilSquareIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('paperwork') || lowerCategory.includes('document')) {
      return <DocumentTextIcon className="h-5 w-5" />;
    }
    if (lowerCategory.includes('training')) {
      return <VideoCameraIcon className="h-5 w-5" />;
    }
    if (lowerCategory.includes('equipment') || lowerCategory.includes('setup')) {
      return <BriefcaseIcon className="h-5 w-5" />;
    }
    if (lowerCategory.includes('compliance')) {
      return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
    return <ClipboardDocumentCheckIcon className="h-5 w-5" />;
  };

  const getCategoryStats = (category: string) => {
    if (!data) return { completed: 0, total: 0, percentage: 0 };
    const tasks = data.tasksByCategory[category] || [];
    const completed = tasks.filter(t => t.status === 'completed').length;
    return {
      completed,
      total: tasks.length,
      percentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    };
  };

  const getTaskAction = (task: OnboardingTask) => {
    if (task.status === 'completed' || task.status === 'skipped') return null;

    const itemType = task.itemType || 'task';
    const formTypes = task.formTypes || [];

    // For form types, show specific form buttons
    if (itemType === 'form') {
      return (
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {formTypes.includes('w4') && (
            <Button
              size="sm"
              onClick={() => openModal(task, 'w4')}
              className="w-full sm:w-auto"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Complete W-4 Form
            </Button>
          )}
          {formTypes.includes('direct_deposit') && (
            <Button
              size="sm"
              onClick={() => openModal(task, 'direct_deposit')}
              className="w-full sm:w-auto"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Set Up Direct Deposit
            </Button>
          )}
          {formTypes.includes('i9_section1') && (
            <Button
              size="sm"
              onClick={() => openModal(task, 'upload')}
              className="w-full sm:w-auto"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Complete I-9 Form
            </Button>
          )}
        </div>
      );
    }

    if (itemType === 'upload') {
      return (
        <Button
          size="sm"
          onClick={() => openModal(task, 'upload')}
          className="w-full sm:w-auto"
        >
          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      );
    }

    if (itemType === 'signature') {
      return (
        <Button
          size="sm"
          onClick={() => openModal(task, 'signature')}
          className="w-full sm:w-auto"
        >
          <PencilSquareIcon className="h-4 w-4 mr-2" />
          Review & Sign
        </Button>
      );
    }

    if (itemType === 'video') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => alert('Training videos coming soon!')}
          className="w-full sm:w-auto"
        >
          <VideoCameraIcon className="h-4 w-4 mr-2" />
          Watch Training
        </Button>
      );
    }

    // For meetings and tasks - these typically require HR action
    if (itemType === 'meeting' || itemType === 'task') {
      return (
        <Badge variant="default" className="text-xs">
          {task.assignedRole === 'hr' ? 'Waiting for HR' :
           task.assignedRole === 'supervisor' ? 'Waiting for Supervisor' : 'Scheduled'}
        </Badge>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your onboarding tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-danger-50 border-danger-200">
          <div className="flex items-center gap-3 text-danger-800">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">Unable to Load Onboarding</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <Button onClick={fetchOnboardingData} className="mt-4 w-full">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 font-semibold text-lg text-gray-900">No Onboarding Found</h3>
            <p className="text-gray-500 mt-2">
              You don't have any active onboarding tasks. Contact HR if you believe this is an error.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {data.employee.name.split(' ')[0]}!
              </h1>
              <p className="text-gray-500 mt-1">
                Complete these tasks to finish your onboarding
              </p>
            </div>

            <div className="flex items-center gap-4">
              <ProgressRing
                percentage={data.onboarding.progress}
                size={64}
                strokeWidth={6}
                color={data.onboarding.progress === 100 ? '#10b981' : '#3b82f6'}
                showPercentage
              />
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.onboarding.completedItems}/{data.onboarding.totalItems} tasks
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {data.categories.map(category => {
              const stats = getCategoryStats(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedCategory === category
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={selectedCategory === category ? 'text-primary-600' : 'text-gray-500'}>
                      {getCategoryIcon(category)}
                    </span>
                    <span className={`text-xs font-medium ${
                      selectedCategory === category ? 'text-primary-900' : 'text-gray-700'
                    }`}>
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
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
        </div>
      </div>

      {/* Tasks List */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {selectedCategory && (
          <Card>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {getCategoryIcon(selectedCategory)}
                <h2 className="text-lg font-semibold text-gray-900">{selectedCategory}</h2>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${getCategoryStats(selectedCategory).percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {getCategoryStats(selectedCategory).completed} of {getCategoryStats(selectedCategory).total} tasks completed
              </p>
            </div>

            <div className="space-y-4">
              {data.tasksByCategory[selectedCategory]?.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-all ${
                    task.status === 'completed'
                      ? 'bg-success-50/50 border-success-200'
                      : task.status === 'skipped'
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : task.status === 'in_progress'
                      ? 'bg-primary-50/50 border-primary-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {task.status === 'completed' ? (
                        <CheckCircleIcon className="h-6 w-6 text-success-600" />
                      ) : task.status === 'in_progress' ? (
                        <ClockIcon className="h-6 w-6 text-primary-600" />
                      ) : (
                        getTaskIcon(task)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-medium ${
                          task.status === 'completed' ? 'text-gray-500 line-through' :
                          task.status === 'skipped' ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}>
                          {task.taskName}
                        </span>
                        {task.isRequired && task.status !== 'completed' && task.status !== 'skipped' && (
                          <Badge variant="danger" className="text-xs">Required</Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className={`text-sm mb-2 ${
                          task.status === 'skipped' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && task.status !== 'completed' && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}

                      {task.completedAt && (
                        <p className="text-xs text-success-600 flex items-center gap-1 mt-1">
                          <CheckCircleIcon className="h-3 w-3" />
                          Completed: {new Date(task.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {getTaskAction(task)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Completion Message */}
        {data.onboarding.progress === 100 && (
          <Card className="mt-6 bg-success-50 border-success-200">
            <div className="text-center">
              <CheckCircleIcon className="h-16 w-16 text-success-600 mx-auto" />
              <h3 className="mt-4 text-xl font-bold text-success-900">
                Congratulations!
              </h3>
              <p className="text-success-700 mt-2">
                You've completed all your onboarding tasks. Welcome to the team!
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* W-4 Form Modal */}
      {activeModal.type === 'w4' && activeModal.task && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">W-4 Tax Withholding Form</h3>
                <p className="text-sm text-gray-500">Federal tax withholding information</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <W4Form
                employeeName={data.employee.name}
                onSubmit={(formData) => handleFormSubmit('w4', formData)}
                onCancel={closeModal}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Direct Deposit Modal */}
      {activeModal.type === 'direct_deposit' && activeModal.task && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Direct Deposit Authorization</h3>
                <p className="text-sm text-gray-500">Set up your paycheck deposit</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <DirectDepositForm
                employeeName={data.employee.name}
                onSubmit={(formData) => handleFormSubmit('direct_deposit', formData)}
                onCancel={closeModal}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {activeModal.type === 'upload' && activeModal.task && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
                <p className="text-sm text-gray-500">{activeModal.task.taskName}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">{activeModal.task.description}</p>
              <DocumentUpload
                itemId={activeModal.task.id}
                category={activeModal.task.uploadCategories?.[0] || 'document'}
                onUploadComplete={handleDocumentUploadComplete}
                existingDocuments={activeModal.task.uploadedFiles?.map(f => ({
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
                  activeModal.task.uploadCategories?.includes('identity_document')
                    ? 'Upload a clear photo or scan of your government-issued ID'
                    : undefined
                }
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={closeModal}>Done</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      {activeModal.type === 'signature' && activeModal.task && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Document</h3>
                <p className="text-sm text-gray-500">{activeModal.task.taskName}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-600">
                  {activeModal.task.description || 'Please read and sign below to acknowledge.'}
                </p>
              </div>
              <ESignature
                onSign={(signatureData) => handleFormSubmit('signature', signatureData)}
                signerName={data.employee.name}
                attestationText="By signing below, I acknowledge that I have read and agree to all terms and policies."
              />
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewHirePortal;
