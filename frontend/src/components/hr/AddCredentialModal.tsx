import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface AddCredentialModalProps {
  staffId: string;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (credential: CredentialData) => Promise<void>;
}

export interface CredentialData {
  credentialType: string;
  credentialNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  issuingAuthority?: string;
  documentUrl?: string;
  notes?: string;
}

const CREDENTIAL_TYPES = [
  { value: 'CPR_FIRST_AID', label: 'CPR/First Aid Certification', hasExpiration: true },
  { value: 'BCI_BACKGROUND_CHECK', label: 'BCI Background Check', hasExpiration: false },
  { value: 'FBI_BACKGROUND_CHECK', label: 'FBI Background Check', hasExpiration: false },
  { value: 'STNA', label: 'STNA Certification', hasExpiration: true },
  { value: 'HHA', label: 'Home Health Aide (HHA)', hasExpiration: true },
  { value: 'CNA', label: 'Certified Nursing Assistant (CNA)', hasExpiration: true },
  { value: 'RN_LICENSE', label: 'RN License', hasExpiration: true },
  { value: 'LPN_LICENSE', label: 'LPN/LVN License', hasExpiration: true },
  { value: 'DRIVERS_LICENSE', label: "Driver's License", hasExpiration: true },
  { value: 'AUTO_INSURANCE', label: 'Auto Insurance', hasExpiration: true },
  { value: 'TB_TEST', label: 'TB Test Results', hasExpiration: true },
  { value: 'PHYSICAL_EXAM', label: 'Physical Exam', hasExpiration: true },
  { value: 'DRUG_TEST', label: 'Drug Test', hasExpiration: false },
  { value: 'HIPAA_TRAINING', label: 'HIPAA Training', hasExpiration: true },
  { value: 'EVV_TRAINING', label: 'EVV Training', hasExpiration: true },
  { value: 'ABUSE_NEGLECT_TRAINING', label: 'Abuse/Neglect Training', hasExpiration: true },
  { value: 'FIRST_AID', label: 'First Aid Only', hasExpiration: true },
  { value: 'MED_ADMINISTRATION', label: 'Medication Administration', hasExpiration: true },
  { value: 'DSP_CERTIFICATION', label: 'DSP Certification', hasExpiration: true },
  { value: 'OTHER', label: 'Other', hasExpiration: true },
];

export function AddCredentialModal({ staffId, staffName, isOpen, onClose, onSubmit }: AddCredentialModalProps) {
  const [formData, setFormData] = useState<CredentialData>({
    credentialType: '',
    credentialNumber: '',
    issueDate: '',
    expirationDate: '',
    issuingAuthority: '',
    documentUrl: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = CREDENTIAL_TYPES.find(t => t.value === formData.credentialType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.credentialType) {
      setError('Please select a credential type');
      return;
    }

    if (selectedType?.hasExpiration && !formData.expirationDate) {
      setError('Please provide an expiration date for this credential');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        credentialType: '',
        credentialNumber: '',
        issueDate: '',
        expirationDate: '',
        issuingAuthority: '',
        documentUrl: '',
        notes: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add credential');
    } finally {
      setSaving(false);
    }
  };

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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-primary-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-full">
                      <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Add Credential
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">For: {staffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-primary-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential Type *
                    </label>
                    <select
                      value={formData.credentialType}
                      onChange={(e) => setFormData(prev => ({ ...prev, credentialType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select credential type...</option>
                      {CREDENTIAL_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential/License Number
                    </label>
                    <input
                      type="text"
                      value={formData.credentialNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, credentialNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., License # or certificate #"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date {selectedType?.hasExpiration && '*'}
                      </label>
                      <input
                        type="date"
                        value={formData.expirationDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required={selectedType?.hasExpiration}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issuing Authority
                    </label>
                    <input
                      type="text"
                      value={formData.issuingAuthority}
                      onChange={(e) => setFormData(prev => ({ ...prev, issuingAuthority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Ohio Board of Nursing, American Red Cross"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Any additional notes about this credential..."
                    />
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
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Credential'}
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
