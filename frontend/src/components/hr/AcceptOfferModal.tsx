import { useState } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, CheckCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { PodAssignment } from '../pods/PodAssignment';

interface AcceptOfferModalProps {
  applicantName: string;
  position: string;
  applicantEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (data: AcceptOfferData) => void;
}

export interface AcceptOfferData {
  startDate: string | null;
  role: string;
  sendWelcomeEmail: boolean;
  notes: string;
  podId?: string;
}

export function AcceptOfferModal({
  applicantName,
  position,
  applicantEmail,
  isOpen,
  onClose,
  onAccept
}: AcceptOfferModalProps) {
  const [startDateOption, setStartDateOption] = useState<'later' | 'specific'>('later');
  const [startDate, setStartDate] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [notes, setNotes] = useState('');
  const [podId, setPodId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Allow start dates from today onwards
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onAccept({
        startDate: startDateOption === 'specific' && startDate ? startDate : null,
        role: 'caregiver',
        sendWelcomeEmail,
        notes,
        podId: podId || undefined
      });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartDateOption('later');
    setStartDate('');
    setSendWelcomeEmail(true);
    setNotes('');
    setPodId('');
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
        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-success-600 to-success-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-500 rounded-full">
                  <UserPlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Accept Offer & Start Onboarding</h2>
                  <p className="text-sm text-success-100">{applicantName} - {position}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-success-500 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* What will happen */}
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-success-900 mb-2 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                This action will:
              </h4>
              <ul className="text-sm text-success-800 space-y-1 ml-7 list-disc">
                <li>Create an employee record for {applicantName}</li>
                <li>Update applicant status to "Hired"</li>
                <li>Generate onboarding checklist (24 items)</li>
                {sendWelcomeEmail && <li>Send welcome email with next steps</li>}
              </ul>
            </div>

            {/* Start Date Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Start Date
              </label>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="startDateOption"
                    value="later"
                    checked={startDateOption === 'later'}
                    onChange={() => setStartDateOption('later')}
                    className="mt-1 h-4 w-4 text-success-600 border-gray-300 focus:ring-success-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Determine later (Recommended for talent pool)</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      HR will coordinate start date when a client assignment is available
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="startDateOption"
                    value="specific"
                    checked={startDateOption === 'specific'}
                    onChange={() => setStartDateOption('specific')}
                    className="mt-1 h-4 w-4 text-success-600 border-gray-300 focus:ring-success-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Set specific start date</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      For candidates with confirmed client assignments
                    </p>

                    {startDateOption === 'specific' && (
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={minDate}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 text-sm"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Pod Assignment */}
            <div className="mb-6">
              <PodAssignment
                selectedPodId={podId}
                onPodSelect={setPodId}
                required={false}
                label="Assign to Care Team Pod (Optional)"
                helperText="Select which pod/care team this new hire will join. You can change this later."
                showOnlyActive={true}
              />
            </div>

            {/* Send Welcome Email */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="h-4 w-4 text-success-600 border-gray-300 rounded focus:ring-success-500"
                />
                <span className="text-sm text-gray-700">
                  Send welcome email to new hire
                </span>
              </label>
              {applicantEmail && (
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Email will be sent to: {applicantEmail}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Preferred work area, special skills, client preferences..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 text-sm resize-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Candidate:</strong> {applicantName}</p>
                <p><strong>Position:</strong> {position}</p>
                <p><strong>Start Date:</strong> {startDateOption === 'later' ? 'To be determined' : (startDate || 'Not selected')}</p>
                <p><strong>Welcome Email:</strong> {sendWelcomeEmail ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
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
                disabled={submitting || (startDateOption === 'specific' && !startDate)}
                className="bg-success-600 hover:bg-success-700"
              >
                {submitting ? 'Processing...' : 'Confirm & Start Onboarding'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
