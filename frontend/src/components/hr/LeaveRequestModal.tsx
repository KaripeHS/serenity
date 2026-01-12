import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarDaysIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';

interface LeaveRequestModalProps {
  staffId: string;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leave: LeaveRequest) => Promise<void>;
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
  data: string;
}

export interface LeaveRequest {
  type: 'fmla' | 'medical' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'military' | 'jury_duty' | 'other';
  startDate: string;
  endDate: string;
  returnDate?: string;
  isPaid: boolean;
  reason: string;
  documentation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  coverageArranged: boolean;
  attachments?: AttachedFile[];
}

const LEAVE_TYPES = [
  { value: 'fmla', label: 'FMLA Leave', description: 'Family and Medical Leave Act' },
  { value: 'medical', label: 'Medical Leave', description: 'Personal illness or medical procedure' },
  { value: 'personal', label: 'Personal Leave', description: 'Personal matters' },
  { value: 'maternity', label: 'Maternity Leave', description: 'Childbirth and recovery' },
  { value: 'paternity', label: 'Paternity Leave', description: 'New father leave' },
  { value: 'bereavement', label: 'Bereavement Leave', description: 'Death of family member' },
  { value: 'military', label: 'Military Leave', description: 'Active duty or training' },
  { value: 'jury_duty', label: 'Jury Duty', description: 'Court service requirement' },
  { value: 'other', label: 'Other', description: 'Other leave type' },
];

export function LeaveRequestModal({ staffId, staffName, isOpen, onClose, onSubmit }: LeaveRequestModalProps) {
  const [formData, setFormData] = useState<LeaveRequest>({
    type: 'personal',
    startDate: '',
    endDate: '',
    returnDate: '',
    isPaid: false,
    reason: '',
    documentation: '',
    emergencyContact: '',
    emergencyPhone: '',
    coverageArranged: false,
    attachments: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    if (!formData.startDate || !formData.endDate) {
      setError('Please provide both start and end dates');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the leave');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        type: 'personal',
        startDate: '',
        endDate: '',
        returnDate: '',
        isPaid: false,
        reason: '',
        documentation: '',
        emergencyContact: '',
        emergencyPhone: '',
        coverageArranged: false,
        attachments: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const selectedType = LEAVE_TYPES.find(t => t.value === formData.type);

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
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-info-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-info-100 rounded-full">
                      <CalendarDaysIcon className="h-6 w-6 text-info-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Request Leave of Absence
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">For: {staffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-info-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {error && (
                    <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as LeaveRequest['type'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      {LEAVE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {selectedType && (
                      <p className="mt-1 text-xs text-gray-500">{selectedType.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Return
                      </label>
                      <input
                        type="date"
                        value={formData.returnDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {calculateDays() > 0 && (
                    <div className="p-3 bg-info-50 rounded-lg">
                      <p className="text-sm text-info-700">
                        Total leave duration: <strong>{calculateDays()} days</strong>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Leave *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Provide details about the leave request..."
                      required
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPaid}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Paid Leave</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.coverageArranged}
                        onChange={(e) => setFormData(prev => ({ ...prev, coverageArranged: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Coverage Arranged</span>
                    </label>
                  </div>

                  {/* Supporting Documents */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supporting Documents (e.g., Medical Note, FMLA Forms)
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

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact During Leave</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
