import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DisciplinaryActionModalProps {
  staffId: string;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: DisciplinaryAction) => Promise<void>;
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
  data: string;
}

export interface DisciplinaryAction {
  type: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'performance_improvement_plan';
  date: string;
  reason: string;
  description: string;
  witnessName?: string;
  followUpDate?: string;
  acknowledgement: boolean;
  attachments?: AttachedFile[];
}

const ACTION_TYPES = [
  { value: 'verbal_warning', label: 'Verbal Warning', severity: 'low' },
  { value: 'written_warning', label: 'Written Warning', severity: 'medium' },
  { value: 'final_warning', label: 'Final Warning', severity: 'high' },
  { value: 'suspension', label: 'Suspension', severity: 'high' },
  { value: 'performance_improvement_plan', label: 'Performance Improvement Plan (PIP)', severity: 'medium' },
];

const REASON_CATEGORIES = [
  'Attendance/Tardiness',
  'Policy Violation',
  'Performance Issues',
  'Insubordination',
  'Safety Violation',
  'Harassment/Misconduct',
  'Documentation Issues',
  'Client Complaint',
  'Other',
];

export function DisciplinaryActionModal({ staffId, staffName, isOpen, onClose, onSubmit }: DisciplinaryActionModalProps) {
  const [formData, setFormData] = useState<DisciplinaryAction>({
    type: 'verbal_warning',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    description: '',
    witnessName: '',
    followUpDate: '',
    acknowledgement: false,
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

    if (!formData.reason) {
      setError('Please select a reason for the disciplinary action');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a detailed description');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        type: 'verbal_warning',
        date: new Date().toISOString().split('T')[0],
        reason: '',
        description: '',
        witnessName: '',
        followUpDate: '',
        acknowledgement: false,
        attachments: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record disciplinary action');
    } finally {
      setSaving(false);
    }
  };

  const selectedType = ACTION_TYPES.find(t => t.value === formData.type);

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
                <div className="flex items-center justify-between px-6 py-4 border-b bg-warning-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning-100 rounded-full">
                      <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Record Disciplinary Action
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">For: {staffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-warning-100 transition-colors"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DisciplinaryAction['type'] }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          selectedType?.severity === 'high' ? 'border-danger-300 bg-danger-50' :
                          selectedType?.severity === 'medium' ? 'border-warning-300 bg-warning-50' :
                          'border-gray-300'
                        }`}
                        required
                      >
                        {ACTION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Incident *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason Category *
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select a reason...</option>
                      {REASON_CATEGORIES.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe the incident, behavior, or performance issue in detail..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Witness Name (if any)
                      </label>
                      <input
                        type="text"
                        value={formData.witnessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, witnessName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Supporting Documents */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supporting Documents (Optional)
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

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="acknowledgement"
                      checked={formData.acknowledgement}
                      onChange={(e) => setFormData(prev => ({ ...prev, acknowledgement: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="acknowledgement" className="text-sm text-gray-700">
                      Employee has been notified and acknowledges this disciplinary action.
                      A copy will be placed in their personnel file.
                    </label>
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
                      className="px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Recording...' : 'Record Action'}
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
