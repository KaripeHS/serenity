import { useState } from 'react';
import { Badge } from './Badge';
import { Alert } from './Alert';
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  variant: 'primary' | 'success' | 'warning' | 'danger';
  action: (selectedIds: string[]) => Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface BulkOperationsProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onClear: () => void;
  entityName?: string; // e.g., "visits", "claims", "staff"
}

export function BulkOperations({
  selectedCount,
  totalCount,
  actions,
  onClear,
  entityName = 'items'
}: BulkOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  if (selectedCount === 0) return null;

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirm(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    setIsProcessing(true);
    try {
      await action.action([]);
      onClear();
      setShowConfirm(false);
      setPendingAction(null);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Bulk Actions Toolbar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-white rounded-lg shadow-2xl border-2 border-primary-600 p-4 min-w-[600px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 rounded-full p-2">
                <CheckIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedCount} {entityName} selected
                </p>
                <p className="text-sm text-gray-600">
                  {selectedCount} of {totalCount} selected
                </p>
              </div>
            </div>

            <button
              onClick={onClear}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Clear selection"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              const variantClasses = {
                primary: 'bg-primary-600 hover:bg-primary-700 text-white',
                success: 'bg-success-600 hover:bg-success-700 text-white',
                warning: 'bg-warning-600 hover:bg-warning-700 text-white',
                danger: 'bg-danger-600 hover:bg-danger-700 text-white'
              };

              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={isProcessing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[action.variant]}`}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-primary-600">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Processing {selectedCount} {entityName}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && pendingAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <Alert variant="warning" className="mb-4">
              <h3 className="text-lg font-semibold text-warning-900 mb-2">
                Confirm Bulk Action
              </h3>
              <p className="text-sm text-warning-800">
                {pendingAction.confirmationMessage ||
                  `Are you sure you want to ${pendingAction.label.toLowerCase()} ${selectedCount} ${entityName}?`}
              </p>
              <p className="text-xs text-warning-700 mt-2">
                This action cannot be undone.
              </p>
            </Alert>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingAction(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => pendingAction && executeAction(pendingAction)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Example usage hook
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isSelected = (id: string) => selectedIds.has(id);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected
  };
}

// Common bulk actions for different entity types
export const commonBulkActions = {
  // Visit Management
  visits: {
    assign: (caregiverId: string): BulkAction => ({
      id: 'assign-caregiver',
      label: 'Assign Caregiver',
      icon: CheckCircleIcon,
      variant: 'success',
      action: async (ids) => {
        // API call to assign caregiver to visits
        console.log(`Assigning caregiver ${caregiverId} to visits:`, ids);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }),
    cancel: {
      id: 'cancel-visits',
      label: 'Cancel Visits',
      icon: XMarkIcon,
      variant: 'danger',
      action: async (ids) => {
        console.log('Cancelling visits:', ids);
        await new Promise(resolve => setTimeout(resolve, 2000));
      },
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to cancel these visits? Patients and caregivers will be notified.'
    } as BulkAction,
    reschedule: {
      id: 'reschedule-visits',
      label: 'Reschedule',
      icon: ArrowPathIcon,
      variant: 'warning',
      action: async (ids) => {
        console.log('Rescheduling visits:', ids);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } as BulkAction
  },

  // Claims Management
  claims: {
    submit: {
      id: 'submit-claims',
      label: 'Submit to Payer',
      icon: CheckIcon,
      variant: 'success',
      action: async (ids) => {
        console.log('Submitting claims:', ids);
        await new Promise(resolve => setTimeout(resolve, 3000));
      },
      requiresConfirmation: true,
      confirmationMessage: 'Submit these claims to the clearinghouse for processing?'
    } as BulkAction,
    delete: {
      id: 'delete-claims',
      label: 'Delete',
      icon: TrashIcon,
      variant: 'danger',
      action: async (ids) => {
        console.log('Deleting claims:', ids);
        await new Promise(resolve => setTimeout(resolve, 1500));
      },
      requiresConfirmation: true
    } as BulkAction
  },

  // Staff Management
  staff: {
    activate: {
      id: 'activate-staff',
      label: 'Activate',
      icon: CheckCircleIcon,
      variant: 'success',
      action: async (ids) => {
        console.log('Activating staff:', ids);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } as BulkAction,
    deactivate: {
      id: 'deactivate-staff',
      label: 'Deactivate',
      icon: XMarkIcon,
      variant: 'danger',
      action: async (ids) => {
        console.log('Deactivating staff:', ids);
        await new Promise(resolve => setTimeout(resolve, 1500));
      },
      requiresConfirmation: true
    } as BulkAction,
    sendReminder: {
      id: 'send-reminder',
      label: 'Send Training Reminder',
      icon: DocumentDuplicateIcon,
      variant: 'primary',
      action: async (ids) => {
        console.log('Sending reminders to staff:', ids);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } as BulkAction
  }
};
