import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentArrowUpIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface DocumentUploadModalProps {
  staffId: string;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (document: DocumentUpload) => Promise<void>;
}

export interface DocumentUpload {
  category: string;
  documentType: string;
  title: string;
  description?: string;
  expirationDate?: string;
  file: File;
  fileData?: string; // base64
}

const DOCUMENT_CATEGORIES = [
  {
    category: 'Employment',
    types: [
      'Employment Application',
      'Offer Letter',
      'Employment Contract',
      'Non-Disclosure Agreement',
      'Non-Compete Agreement',
      'Job Description',
    ]
  },
  {
    category: 'Tax & Payroll',
    types: [
      'W-4 Form',
      'I-9 Form',
      'Direct Deposit Authorization',
      'State Tax Withholding',
    ]
  },
  {
    category: 'Identification',
    types: [
      'Driver\'s License',
      'Passport',
      'Social Security Card',
      'Birth Certificate',
      'Work Authorization',
    ]
  },
  {
    category: 'Certifications',
    types: [
      'CPR/First Aid Certificate',
      'CNA License',
      'RN License',
      'LPN/LVN License',
      'DSP Certificate',
      'TB Test Results',
      'Drug Test Results',
      'Background Check',
      'Physical Exam',
      'Other Certification',
    ]
  },
  {
    category: 'Training',
    types: [
      'Training Certificate',
      'Orientation Completion',
      'Safety Training',
      'HIPAA Training',
      'Compliance Training',
    ]
  },
  {
    category: 'Performance',
    types: [
      'Performance Review',
      'Disciplinary Notice',
      'Written Warning',
      'Commendation Letter',
    ]
  },
  {
    category: 'Other',
    types: [
      'Other Document',
    ]
  }
];

export function DocumentUploadModal({ staffId, staffName, isOpen, onClose, onSubmit }: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    documentType: '',
    title: '',
    description: '',
    expirationDate: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTypes = DOCUMENT_CATEGORIES.find(c => c.category === formData.category)?.types || [];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, JPG, PNG, or GIF files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size exceeds 10MB limit.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Auto-fill title if empty
    if (!formData.title) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.category) {
      setError('Please select a document category');
      return;
    }

    if (!formData.documentType) {
      setError('Please select a document type');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a document title');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setSaving(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await onSubmit({
        ...formData,
        file: selectedFile,
        fileData,
      });

      // Reset form
      setFormData({
        category: '',
        documentType: '',
        title: '',
        description: '',
        expirationDate: '',
      });
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-success-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success-100 rounded-full">
                      <DocumentArrowUpIcon className="h-6 w-6 text-success-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Upload Document
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">For: {staffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-success-100 transition-colors"
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

                  {/* File Drop Zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive
                        ? 'border-primary-500 bg-primary-50'
                        : selectedFile
                        ? 'border-success-500 bg-success-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileInput}
                    />

                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-success-700">
                          <DocumentArrowUpIcon className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-sm text-danger-600 hover:text-danger-700"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <CloudArrowUpIcon className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Drag and drop a file here, or{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, PNG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          category: e.target.value,
                          documentType: '' // Reset type when category changes
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select category...</option>
                        {DOCUMENT_CATEGORIES.map(cat => (
                          <option key={cat.category} value={cat.category}>{cat.category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Type *
                      </label>
                      <select
                        value={formData.documentType}
                        onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                        disabled={!formData.category}
                      >
                        <option value="">Select type...</option>
                        {availableTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter document title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add notes about this document..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date (if applicable)
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                      disabled={saving || !selectedFile}
                      className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Uploading...' : 'Upload Document'}
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
