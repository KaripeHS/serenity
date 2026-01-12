import { useState, useRef } from 'react';
import { PlusIcon, TrashIcon, DocumentCheckIcon, ExclamationTriangleIcon, PencilIcon, ArrowUpTrayIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SignaturePad } from '../../ui/SignaturePad';

interface ServiceAuthorizationFormProps {
  data: any;
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

interface ApprovedService {
  id: string;
  serviceType: string;
  unitsApproved: string;
  unitType: string;
  frequency: string;
}

export function ServiceAuthorizationForm({ data, onSave, onClose }: ServiceAuthorizationFormProps) {
  const [formData, setFormData] = useState({
    // Authorization Info
    authNumber: data?.authNumber || '',
    authStatus: data?.authStatus || '',
    authSource: data?.authSource || '',
    requestDate: data?.requestDate || '',
    approvalDate: data?.approvalDate || '',

    // Authorization Period
    authStartDate: data?.authStartDate || '',
    authEndDate: data?.authEndDate || '',
    renewalDate: data?.renewalDate || '',

    // Approved Services
    approvedServices: data?.approvedServices || [] as ApprovedService[],
    totalApprovedHours: data?.totalApprovedHours || '',
    hoursPerWeek: data?.hoursPerWeek || '',

    // Payer Info
    payerName: data?.payerName || '',
    payerPhone: data?.payerPhone || '',
    payerContact: data?.payerContact || '',
    payerAuthLine: data?.payerAuthLine || '',

    // Documentation
    authDocumentReceived: data?.authDocumentReceived || false,
    authDocumentDate: data?.authDocumentDate || '',

    // Notes
    authNotes: data?.authNotes || '',
    restrictions: data?.restrictions || '',

    // Patient/Representative Signature
    signatureMethod: data?.signatureMethod || '', // 'electronic' or 'paper'
    signatureData: data?.signatureData || '', // Base64 for electronic, URL for paper upload
    signerName: data?.signerName || '',
    signerRelationship: data?.signerRelationship || 'self', // 'self', 'representative', 'guardian', etc.
    signatureDate: data?.signatureDate || '',
    paperSignatureFileName: data?.paperSignatureFileName || '',
  });

  // File input ref for paper signature upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFieldMapping: Record<string, string[]> = {
    'Auth Number': ['authNumber'],
    'Approved Services': ['approvedServices'],
    'Approved Hours': ['totalApprovedHours'],
    'Auth Period': ['authStartDate', 'authEndDate'],
    'Patient Signature': ['signatureData', 'signerName', 'signatureDate'],
  };

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      if (fieldName === 'Approved Services') {
        if (formData.approvedServices.length > 0) {
          completed.push(fieldName);
        }
      } else if (fieldName === 'Patient Signature') {
        if (formData.signatureData && formData.signerName && formData.signatureDate) {
          completed.push(fieldName);
        }
      } else {
        const allFilled = keys.every(key => formData[key as keyof typeof formData]?.toString().trim());
        if (allFilled) {
          completed.push(fieldName);
        }
      }
    }
    return completed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const addService = () => {
    const newService: ApprovedService = {
      id: Date.now().toString(),
      serviceType: '',
      unitsApproved: '',
      unitType: 'hours',
      frequency: '',
    };
    setFormData(prev => ({
      ...prev,
      approvedServices: [...prev.approvedServices, newService],
    }));
  };

  const updateService = (id: string, field: keyof ApprovedService, value: string) => {
    setFormData(prev => ({
      ...prev,
      approvedServices: prev.approvedServices.map((s: ApprovedService) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      approvedServices: prev.approvedServices.filter((s: ApprovedService) => s.id !== id),
    }));
  };

  // Handle paper signature file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        signatureMethod: 'paper',
        signatureData: reader.result as string,
        paperSignatureFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle electronic signature change
  const handleSignatureChange = (signatureData: string | null) => {
    setFormData(prev => ({
      ...prev,
      signatureMethod: signatureData ? 'electronic' : '',
      signatureData: signatureData || '',
    }));
  };

  // Clear signature
  const clearSignature = () => {
    setFormData(prev => ({
      ...prev,
      signatureMethod: '',
      signatureData: '',
      paperSignatureFileName: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  const serviceTypes = [
    'Personal Care Services',
    'Homemaker Services',
    'Respite Care',
    'Companion Services',
    'Skilled Nursing',
    'Home Health Aide',
    'Physical Therapy',
    'Occupational Therapy',
    'Speech Therapy',
    'Medical Social Services',
    'Other',
  ];

  // Calculate if auth is expiring soon
  const authEndDate = formData.authEndDate ? new Date(formData.authEndDate) : null;
  const today = new Date();
  const daysUntilExpiry = authEndDate ? Math.ceil((authEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div className="space-y-6">
      {/* Expiry Warning */}
      {(isExpiringSoon || isExpired) && (
        <div className={`p-4 rounded-xl ${isExpired ? 'bg-danger-50 border border-danger-200' : 'bg-warning-50 border border-warning-200'}`}>
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className={`h-6 w-6 ${isExpired ? 'text-danger-600' : 'text-warning-600'}`} />
            <div>
              <h4 className={`font-medium ${isExpired ? 'text-danger-900' : 'text-warning-900'}`}>
                {isExpired ? 'Authorization Expired' : 'Authorization Expiring Soon'}
              </h4>
              <p className={`text-sm ${isExpired ? 'text-danger-700' : 'text-warning-700'}`}>
                {isExpired
                  ? `Authorization expired ${Math.abs(daysUntilExpiry!)} days ago. Renewal required immediately.`
                  : `Authorization expires in ${daysUntilExpiry} days. Consider initiating renewal process.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Authorization Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Authorization Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Authorization Number <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="authNumber"
              value={formData.authNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Auth number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="authStatus"
              value={formData.authStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="expired">Expired</option>
              <option value="renewal_pending">Renewal Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
            <input
              type="date"
              name="requestDate"
              value={formData.requestDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
            <input
              type="date"
              name="approvalDate"
              value={formData.approvalDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Authorization Period */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Authorization Period <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="authStartDate"
              value={formData.authStartDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="authEndDate"
              value={formData.authEndDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
            <input
              type="date"
              name="renewalDate"
              value={formData.renewalDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Set reminder to initiate renewal</p>
          </div>
        </div>
      </div>

      {/* Approved Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Approved Services <span className="text-danger-500">*</span></h3>
            <p className="text-sm text-gray-500">List all services approved under this authorization.</p>
          </div>
          <button
            type="button"
            onClick={addService}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Service
          </button>
        </div>

        {formData.approvedServices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No services added yet. Click "Add Service" to begin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.approvedServices.map((service: ApprovedService) => (
              <div key={service.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service Type</label>
                    <select
                      value={service.serviceType}
                      onChange={(e) => updateService(service.id, 'serviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select type</option>
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Units Approved</label>
                    <input
                      type="number"
                      value={service.unitsApproved}
                      onChange={(e) => updateService(service.id, 'unitsApproved', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Number of units"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Type</label>
                    <select
                      value={service.unitType}
                      onChange={(e) => updateService(service.id, 'unitType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="hours">Hours</option>
                      <option value="visits">Visits</option>
                      <option value="days">Days</option>
                      <option value="units">Units</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                    <select
                      value={service.frequency}
                      onChange={(e) => updateService(service.id, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Per Day</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                      <option value="auth_period">Per Auth Period</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-danger-600 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Approved Hours */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Total Approved Hours <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours for Auth Period</label>
            <input
              type="number"
              name="totalApprovedHours"
              value={formData.totalApprovedHours}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Total approved hours"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours Per Week</label>
            <input
              type="number"
              name="hoursPerWeek"
              value={formData.hoursPerWeek}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Weekly hours limit"
            />
          </div>
        </div>
      </div>

      {/* Payer Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payer Name</label>
            <input
              type="text"
              name="payerName"
              value={formData.payerName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., CareSource, Molina"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authorization Line</label>
            <input
              type="tel"
              name="payerAuthLine"
              value={formData.payerAuthLine}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Phone number for auth inquiries"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input
              type="text"
              name="payerContact"
              value={formData.payerContact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Authorization contact"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              name="payerPhone"
              value={formData.payerPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Direct contact number"
            />
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="authDocumentReceived"
              checked={formData.authDocumentReceived}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Authorization document received</span>
          </label>
          {formData.authDocumentReceived && (
            <div className="flex items-center gap-2">
              <DocumentCheckIcon className="h-5 w-5 text-success-600" />
              <input
                type="date"
                name="authDocumentDate"
                value={formData.authDocumentDate}
                onChange={handleChange}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Patient/Representative Signature */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Patient/Representative Signature <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">
          Collect the patient's or authorized representative's signature to acknowledge and consent to the services.
        </p>

        {/* Signature Method Selection */}
        {!formData.signatureData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, signatureMethod: 'electronic' }))}
              className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                formData.signatureMethod === 'electronic'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="p-3 bg-primary-100 rounded-xl">
                <PencilIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Sign Electronically</h4>
                <p className="text-sm text-gray-500">Patient or representative signs on screen</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                formData.signatureMethod === 'paper'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="p-3 bg-primary-100 rounded-xl">
                <ArrowUpTrayIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Upload Paper Signature</h4>
                <p className="text-sm text-gray-500">Upload a scanned or photographed document</p>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />
          </div>
        )}

        {/* Electronic Signature Pad */}
        {formData.signatureMethod === 'electronic' && !formData.signatureData && (
          <div className="space-y-4">
            <SignaturePad
              value={formData.signatureData}
              onChange={handleSignatureChange}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, signatureMethod: '' }))}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Choose different method
              </button>
            </div>
          </div>
        )}

        {/* Signature Collected - Display */}
        {formData.signatureData && (
          <div className="bg-success-50 border border-success-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
                <div>
                  <h4 className="font-medium text-success-900">Signature Collected</h4>
                  <p className="text-sm text-success-700">
                    {formData.signatureMethod === 'electronic' ? 'Electronic signature' : `Paper document: ${formData.paperSignatureFileName}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="p-1 text-success-600 hover:text-success-800 hover:bg-success-100 rounded-lg transition-colors"
                title="Remove signature"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Preview signature */}
            {formData.signatureMethod === 'electronic' && formData.signatureData && (
              <div className="mt-3 bg-white rounded-lg p-2 border border-success-200">
                <img
                  src={formData.signatureData}
                  alt="Electronic signature"
                  className="max-h-20 mx-auto"
                />
              </div>
            )}

            {formData.signatureMethod === 'paper' && formData.signatureData && (
              <div className="mt-3 bg-white rounded-lg p-2 border border-success-200">
                {formData.signatureData.startsWith('data:image') ? (
                  <img
                    src={formData.signatureData}
                    alt="Uploaded signature document"
                    className="max-h-32 mx-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center py-4 text-gray-500">
                    <DocumentCheckIcon className="h-8 w-8 mr-2" />
                    <span>PDF Document Uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Signer Information */}
        {(formData.signatureMethod || formData.signatureData) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signer's Full Name <span className="text-danger-500">*</span></label>
              <input
                type="text"
                name="signerName"
                value={formData.signerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Patient</label>
              <select
                name="signerRelationship"
                value={formData.signerRelationship}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="self">Self (Patient)</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Adult Child</option>
                <option value="guardian">Legal Guardian</option>
                <option value="poa">Power of Attorney</option>
                <option value="representative">Authorized Representative</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature Date <span className="text-danger-500">*</span></label>
              <input
                type="date"
                name="signatureDate"
                value={formData.signatureDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes and Restrictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Authorization Notes</label>
          <textarea
            name="authNotes"
            value={formData.authNotes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Any additional notes about the authorization..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Restrictions</label>
          <textarea
            name="restrictions"
            value={formData.restrictions}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Any restrictions or limitations on services..."
          />
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">
            {getCompletedFields().length} of 5 required sections
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedFields().length / 5) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(requiredFieldMapping).map((field) => (
            <span
              key={field}
              className={`text-xs px-2 py-1 rounded-full ${
                getCompletedFields().includes(field)
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}
