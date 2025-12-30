import { useState } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RejectionModalProps {
  applicantName: string;
  position: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, sendEmail: boolean) => void;
}

const REJECTION_REASONS = [
  { value: 'position_filled', label: 'Position has been filled' },
  { value: 'not_qualified', label: 'Does not meet minimum qualifications' },
  { value: 'experience', label: 'Insufficient experience for the role' },
  { value: 'better_candidate', label: 'More qualified candidate selected' },
  { value: 'failed_background', label: 'Did not pass background check' },
  { value: 'failed_reference', label: 'Reference check concerns' },
  { value: 'no_show_interview', label: 'No-show for scheduled interview' },
  { value: 'withdrew', label: 'Candidate withdrew application' },
  { value: 'salary_mismatch', label: 'Salary expectations mismatch' },
  { value: 'location', label: 'Location/commute concerns' },
  { value: 'availability', label: 'Schedule/availability mismatch' },
  { value: 'culture_fit', label: 'Not the right cultural fit' },
  { value: 'other', label: 'Other (specify below)' }
];

export function RejectionModal({
  applicantName,
  position,
  isOpen,
  onClose,
  onConfirm
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('Please select a rejection reason.');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      alert('Please specify the rejection reason.');
      return;
    }

    setSubmitting(true);
    try {
      const reason = selectedReason === 'other'
        ? customReason
        : REJECTION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

      await onConfirm(reason, sendEmail);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setSendEmail(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="bg-danger-50 border-b border-danger-100 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger-100 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-danger-900">Reject Application</h2>
                  <p className="text-sm text-danger-700">{applicantName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-danger-600 hover:bg-danger-100 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              You are about to reject the application for <strong>{position}</strong>.
              Please select a reason for the rejection.
            </p>

            {/* Reason Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-danger-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason Text */}
            {selectedReason === 'other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter the rejection reason..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                />
              </div>
            )}

            {/* Additional Notes */}
            {selectedReason && selectedReason !== 'other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                />
              </div>
            )}

            {/* Send Email Checkbox */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Send rejection notification email to applicant
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                A professional rejection email will be sent automatically
              </p>
            </div>

            {/* Warning */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-warning-800">
                <strong>Note:</strong> This action cannot be undone. The applicant's status will be
                permanently changed to "Rejected" and they will be removed from the active pipeline.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedReason}
                className="bg-danger-600 hover:bg-danger-700"
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
