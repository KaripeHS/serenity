import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TerminationModalProps {
  staffId: string;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (termination: TerminationData) => Promise<void>;
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
  data: string;
}

export interface TerminationData {
  type: 'voluntary' | 'involuntary' | 'retirement' | 'layoff' | 'end_of_contract';
  reason: string;
  lastWorkDay: string;
  effectiveDate: string;
  exitInterviewScheduled: boolean;
  exitInterviewDate?: string;
  equipmentReturned: boolean;
  equipmentNotes?: string;
  accessRevoked: boolean;
  finalPaycheckDate?: string;
  cobraNotification: boolean;
  benefitsEndDate?: string;
  rehireEligible: boolean;
  notes: string;
  acknowledgement: boolean;
  attachments?: AttachedFile[];
}

const TERMINATION_TYPES = [
  { value: 'voluntary', label: 'Voluntary Resignation', description: 'Employee chose to leave' },
  { value: 'involuntary', label: 'Involuntary Termination', description: 'Company-initiated termination' },
  { value: 'retirement', label: 'Retirement', description: 'Employee retiring' },
  { value: 'layoff', label: 'Layoff', description: 'Position elimination or reduction in force' },
  { value: 'end_of_contract', label: 'End of Contract', description: 'Contract or temporary position ended' },
];

const TERMINATION_REASONS = {
  voluntary: [
    'Personal reasons',
    'Career advancement',
    'Relocation',
    'Return to school',
    'Family obligations',
    'Compensation/Benefits',
    'Work environment',
    'Health reasons',
    'Other',
  ],
  involuntary: [
    'Performance issues',
    'Policy violation',
    'Attendance/Tardiness',
    'Misconduct',
    'Failed background check',
    'Failed drug test',
    'Insubordination',
    'Theft/Fraud',
    'Violence/Threats',
    'Other',
  ],
  retirement: ['Standard retirement', 'Early retirement', 'Disability retirement'],
  layoff: ['Position eliminated', 'Budget cuts', 'Restructuring', 'Business closure', 'Other'],
  end_of_contract: ['Contract completed', 'Contract not renewed', 'Project ended', 'Other'],
};

export function TerminationModal({ staffId, staffName, isOpen, onClose, onSubmit }: TerminationModalProps) {
  const [formData, setFormData] = useState<TerminationData>({
    type: 'voluntary',
    reason: '',
    lastWorkDay: '',
    effectiveDate: '',
    exitInterviewScheduled: false,
    exitInterviewDate: '',
    equipmentReturned: false,
    equipmentNotes: '',
    accessRevoked: false,
    finalPaycheckDate: '',
    cobraNotification: false,
    benefitsEndDate: '',
    rehireEligible: true,
    notes: '',
    acknowledgement: false,
    attachments: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({ file, name: file.name, size: file.size, data });
    }
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments]
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.acknowledgement) {
      setError('Please acknowledge the termination process');
      return;
    }

    if (!formData.lastWorkDay || !formData.effectiveDate) {
      setError('Please provide both last work day and effective date');
      return;
    }

    if (!formData.reason) {
      setError('Please select a termination reason');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        type: 'voluntary',
        reason: '',
        lastWorkDay: '',
        effectiveDate: '',
        exitInterviewScheduled: false,
        exitInterviewDate: '',
        equipmentReturned: false,
        equipmentNotes: '',
        accessRevoked: false,
        finalPaycheckDate: '',
        cobraNotification: false,
        benefitsEndDate: '',
        rehireEligible: true,
        notes: '',
        acknowledgement: false,
        attachments: [],
      });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process termination');
    } finally {
      setSaving(false);
    }
  };

  const selectedType = TERMINATION_TYPES.find(t => t.value === formData.type);
  const reasons = TERMINATION_REASONS[formData.type as keyof typeof TERMINATION_REASONS] || [];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-danger-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-danger-100 rounded-full">
                      <ExclamationCircleIcon className="h-6 w-6 text-danger-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Initiate Termination
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">For: {staffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-danger-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="px-6 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        step === 1 ? 'bg-danger-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      1. Basic Info
                    </button>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <button
                      onClick={() => setStep(2)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        step === 2 ? 'bg-danger-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      2. Offboarding
                    </button>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <button
                      onClick={() => setStep(3)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        step === 3 ? 'bg-danger-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      3. Confirm
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {error && (
                    <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                      {error}
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Termination Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            type: e.target.value as TerminationData['type'],
                            reason: '' // Reset reason when type changes
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          {TERMINATION_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        {selectedType && (
                          <p className="mt-1 text-xs text-gray-500">{selectedType.description}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason *
                        </label>
                        <select
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Select a reason...</option>
                          {reasons.map(reason => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Work Day *
                          </label>
                          <input
                            type="date"
                            value={formData.lastWorkDay}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastWorkDay: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Effective Date *
                          </label>
                          <input
                            type="date"
                            value={formData.effectiveDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.rehireEligible}
                            onChange={(e) => setFormData(prev => ({ ...prev, rehireEligible: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Eligible for rehire</span>
                        </label>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Exit Interview</h4>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.exitInterviewScheduled}
                            onChange={(e) => setFormData(prev => ({ ...prev, exitInterviewScheduled: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Exit interview scheduled</span>
                        </label>
                        {formData.exitInterviewScheduled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Interview Date
                            </label>
                            <input
                              type="date"
                              value={formData.exitInterviewDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, exitInterviewDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-medium text-gray-900">Equipment & Access</h4>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.equipmentReturned}
                            onChange={(e) => setFormData(prev => ({ ...prev, equipmentReturned: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">All equipment returned</span>
                        </label>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Equipment Notes
                          </label>
                          <input
                            type="text"
                            value={formData.equipmentNotes}
                            onChange={(e) => setFormData(prev => ({ ...prev, equipmentNotes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., Laptop, badge, keys..."
                          />
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.accessRevoked}
                            onChange={(e) => setFormData(prev => ({ ...prev, accessRevoked: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">System access revoked</span>
                        </label>
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-medium text-gray-900">Benefits & Final Pay</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Final Paycheck Date
                            </label>
                            <input
                              type="date"
                              value={formData.finalPaycheckDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, finalPaycheckDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Benefits End Date
                            </label>
                            <input
                              type="date"
                              value={formData.benefitsEndDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, benefitsEndDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.cobraNotification}
                            onChange={(e) => setFormData(prev => ({ ...prev, cobraNotification: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">COBRA notification sent</span>
                        </label>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <h4 className="font-medium text-gray-900">Termination Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-2 font-medium">{selectedType?.label}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reason:</span>
                            <span className="ml-2 font-medium">{formData.reason}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Day:</span>
                            <span className="ml-2 font-medium">{formData.lastWorkDay}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Effective:</span>
                            <span className="ml-2 font-medium">{formData.effectiveDate}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rehire Eligible:</span>
                            <span className="ml-2 font-medium">{formData.rehireEligible ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Any additional notes about the termination..."
                        />
                      </div>

                      {/* Supporting Documents */}
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Supporting Documents (e.g., Resignation Letter, Termination Notice)
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <PaperClipIcon className="h-4 w-4" />
                          Attach Files
                        </button>
                        <p className="mt-1 text-xs text-gray-500">
                          Max 10MB per file. PDF, DOC, DOCX, JPG, PNG, TXT supported.
                        </p>
                        {formData.attachments && formData.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {formData.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <PaperClipIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{attachment.name}</span>
                                  <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(index)}
                                  className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-danger-50 rounded-lg border border-danger-200">
                        <input
                          type="checkbox"
                          id="termination-acknowledgement"
                          checked={formData.acknowledgement}
                          onChange={(e) => setFormData(prev => ({ ...prev, acknowledgement: e.target.checked }))}
                          className="mt-1 h-4 w-4 text-danger-600 border-gray-300 rounded focus:ring-danger-500"
                        />
                        <label htmlFor="termination-acknowledgement" className="text-sm text-danger-800">
                          <strong>I confirm that this termination action is final.</strong> The employee's status will be changed to "Terminated"
                          and their system access will be scheduled for revocation. This action will be logged
                          and cannot be undone without HR Director approval.
                        </label>
                      </div>
                    </>
                  )}
                </form>

                <div className="flex justify-between gap-3 px-6 py-4 border-t bg-gray-50">
                  <div>
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving || !formData.acknowledgement}
                        className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Processing...' : 'Confirm Termination'}
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
