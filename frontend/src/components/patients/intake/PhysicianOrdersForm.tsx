import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PhysicianOrdersFormProps {
  data: any;
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

interface Diagnosis {
  id: string;
  code: string;
  description: string;
  isPrimary: boolean;
}

interface Order {
  id: string;
  orderType: string;
  description: string;
  frequency: string;
}

export function PhysicianOrdersForm({ data, onSave, onClose }: PhysicianOrdersFormProps) {
  const [formData, setFormData] = useState({
    // Physician Info
    physicianName: data?.physicianName || '',
    physicianNPI: data?.physicianNPI || '',
    physicianPhone: data?.physicianPhone || '',
    physicianFax: data?.physicianFax || '',
    practiceName: data?.practiceName || '',
    practiceAddress: data?.practiceAddress || '',

    // Face-to-Face
    faceToFaceDate: data?.faceToFaceDate || '',
    faceToFaceLocation: data?.faceToFaceLocation || '',
    faceToFaceDocumented: data?.faceToFaceDocumented || false,

    // Diagnoses
    diagnoses: data?.diagnoses || [] as Diagnosis[],

    // Orders
    orders: data?.orders || [] as Order[],

    // Certification
    certificationPeriodStart: data?.certificationPeriodStart || '',
    certificationPeriodEnd: data?.certificationPeriodEnd || '',
    orderSignedDate: data?.orderSignedDate || '',
    orderReceivedDate: data?.orderReceivedDate || '',

    // Notes
    physicianNotes: data?.physicianNotes || '',
  });

  const requiredFieldMapping: Record<string, string[]> = {
    'Physician Name': ['physicianName'],
    'NPI': ['physicianNPI'],
    'Diagnoses': ['diagnoses'],
    'Orders': ['orders'],
    'Face-to-Face Date': ['faceToFaceDate'],
  };

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      if (fieldName === 'Diagnoses') {
        if (formData.diagnoses.length > 0) {
          completed.push(fieldName);
        }
      } else if (fieldName === 'Orders') {
        if (formData.orders.length > 0) {
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

  const addDiagnosis = () => {
    const newDiagnosis: Diagnosis = {
      id: Date.now().toString(),
      code: '',
      description: '',
      isPrimary: formData.diagnoses.length === 0,
    };
    setFormData(prev => ({
      ...prev,
      diagnoses: [...prev.diagnoses, newDiagnosis],
    }));
  };

  const updateDiagnosis = (id: string, field: keyof Diagnosis, value: any) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map((d: Diagnosis) =>
        d.id === id ? { ...d, [field]: value } : field === 'isPrimary' && value ? { ...d, isPrimary: false } : d
      ),
    }));
  };

  const removeDiagnosis = (id: string) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.filter((d: Diagnosis) => d.id !== id),
    }));
  };

  const addOrder = () => {
    const newOrder: Order = {
      id: Date.now().toString(),
      orderType: '',
      description: '',
      frequency: '',
    };
    setFormData(prev => ({
      ...prev,
      orders: [...prev.orders, newOrder],
    }));
  };

  const updateOrder = (id: string, field: keyof Order, value: string) => {
    setFormData(prev => ({
      ...prev,
      orders: prev.orders.map((o: Order) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
    }));
  };

  const removeOrder = (id: string) => {
    setFormData(prev => ({
      ...prev,
      orders: prev.orders.filter((o: Order) => o.id !== id),
    }));
  };

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  const orderTypes = [
    'Personal Care Services',
    'Homemaker Services',
    'Skilled Nursing',
    'Physical Therapy',
    'Occupational Therapy',
    'Speech Therapy',
    'Medical Social Services',
    'Home Health Aide',
    'Companion Services',
    'Respite Care',
    'Other',
  ];

  const frequencyOptions = [
    'Daily',
    '2x Daily',
    '3x Daily',
    '2x Weekly',
    '3x Weekly',
    '4x Weekly',
    '5x Weekly',
    'Weekly',
    'Bi-Weekly',
    'Monthly',
    'As Needed',
    'Per Care Plan',
  ];

  return (
    <div className="space-y-6">
      {/* Physician Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ordering Physician Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Physician Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="physicianName"
              value={formData.physicianName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Dr. John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NPI Number <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="physicianNPI"
              value={formData.physicianNPI}
              onChange={handleChange}
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="physicianPhone"
              value={formData.physicianPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
            <input
              type="tel"
              name="physicianFax"
              value={formData.physicianFax}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(555) 123-4568"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
            <input
              type="text"
              name="practiceName"
              value={formData.practiceName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Medical Practice Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Practice Address</label>
            <input
              type="text"
              name="practiceAddress"
              value={formData.practiceAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="123 Medical Blvd, Suite 100"
            />
          </div>
        </div>
      </div>

      {/* Face-to-Face Encounter */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Face-to-Face Encounter <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Encounter Date</label>
            <input
              type="date"
              name="faceToFaceDate"
              value={formData.faceToFaceDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              name="faceToFaceLocation"
              value={formData.faceToFaceLocation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select location</option>
              <option value="office">Physician Office</option>
              <option value="hospital">Hospital</option>
              <option value="home">Patient Home</option>
              <option value="telehealth">Telehealth</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="faceToFaceDocumented"
                checked={formData.faceToFaceDocumented}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Documentation Received</span>
            </label>
          </div>
        </div>
      </div>

      {/* Diagnoses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Diagnoses <span className="text-danger-500">*</span></h3>
          <button
            type="button"
            onClick={addDiagnosis}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Diagnosis
          </button>
        </div>

        {formData.diagnoses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No diagnoses added yet. Click "Add Diagnosis" to begin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.diagnoses.map((diagnosis: Diagnosis, index: number) => (
              <div key={diagnosis.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 pt-2">
                  <input
                    type="radio"
                    checked={diagnosis.isPrimary}
                    onChange={() => updateDiagnosis(diagnosis.id, 'isPrimary', true)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    title="Primary diagnosis"
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ICD-10 Code</label>
                    <input
                      type="text"
                      value={diagnosis.code}
                      onChange={(e) => updateDiagnosis(diagnosis.id, 'code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="e.g., I10, E11.9, G20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={diagnosis.description}
                      onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Diagnosis description"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDiagnosis(diagnosis.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-danger-600 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">Select the radio button next to the primary diagnosis.</p>
      </div>

      {/* Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Physician Orders <span className="text-danger-500">*</span></h3>
          <button
            type="button"
            onClick={addOrder}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Order
          </button>
        </div>

        {formData.orders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No orders added yet. Click "Add Order" to begin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.orders.map((order: Order) => (
              <div key={order.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service Type</label>
                    <select
                      value={order.orderType}
                      onChange={(e) => updateOrder(order.id, 'orderType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select type</option>
                      {orderTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={order.description}
                      onChange={(e) => updateOrder(order.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Order details"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                    <select
                      value={order.frequency}
                      onChange={(e) => updateOrder(order.id, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select frequency</option>
                      {frequencyOptions.map((freq) => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeOrder(order.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-danger-600 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certification Period */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Certification Period & Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certification Start Date</label>
            <input
              type="date"
              name="certificationPeriodStart"
              value={formData.certificationPeriodStart}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certification End Date</label>
            <input
              type="date"
              name="certificationPeriodEnd"
              value={formData.certificationPeriodEnd}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Signed Date</label>
            <input
              type="date"
              name="orderSignedDate"
              value={formData.orderSignedDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Received Date</label>
            <input
              type="date"
              name="orderReceivedDate"
              value={formData.orderReceivedDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
        <textarea
          name="physicianNotes"
          value={formData.physicianNotes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Any additional notes about physician orders..."
        />
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
