import { useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface FirstVisitFormProps {
  data: any;
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

export function FirstVisitForm({ data, onSave, onClose }: FirstVisitFormProps) {
  const [formData, setFormData] = useState({
    // Visit Scheduling
    visitDate: data?.visitDate || '',
    visitTimeStart: data?.visitTimeStart || '',
    visitTimeEnd: data?.visitTimeEnd || '',
    visitDuration: data?.visitDuration || '2',

    // Caregiver Confirmation
    assignedCaregiver: data?.assignedCaregiver || '',
    caregiverPhone: data?.caregiverPhone || '',
    caregiverConfirmed: data?.caregiverConfirmed || false,
    caregiverConfirmedDate: data?.caregiverConfirmedDate || '',

    // Patient Notification
    patientNotified: data?.patientNotified || false,
    patientNotifiedDate: data?.patientNotifiedDate || '',
    patientNotifiedBy: data?.patientNotifiedBy || '',
    patientNotificationMethod: data?.patientNotificationMethod || '',

    // Visit Details
    visitLocation: data?.visitLocation || 'patient_home',
    visitAddress: data?.visitAddress || '',
    accessInstructions: data?.accessInstructions || '',
    parkingInstructions: data?.parkingInstructions || '',

    // Visit Checklist
    carePlanReviewed: data?.carePlanReviewed || false,
    emergencyInfoReviewed: data?.emergencyInfoReviewed || false,
    suppliesChecked: data?.suppliesChecked || false,
    documentsReady: data?.documentsReady || false,

    // Pre-Visit Contact
    preVisitCallScheduled: data?.preVisitCallScheduled || false,
    preVisitCallDate: data?.preVisitCallDate || '',
    preVisitCallNotes: data?.preVisitCallNotes || '',

    // Notes
    visitNotes: data?.visitNotes || '',
    specialInstructions: data?.specialInstructions || '',
  });

  const requiredFieldMapping: Record<string, string[]> = {
    'Visit Date': ['visitDate'],
    'Visit Time': ['visitTimeStart'],
    'Caregiver Confirmed': ['caregiverConfirmed'],
    'Patient Notified': ['patientNotified'],
  };

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      if (fieldName === 'Caregiver Confirmed' || fieldName === 'Patient Notified') {
        const key = keys[0];
        if (formData[key as keyof typeof formData]) {
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

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  // Calculate visit end time based on duration
  const calculateEndTime = () => {
    if (!formData.visitTimeStart || !formData.visitDuration) return '';
    const [hours, minutes] = formData.visitTimeStart.split(':').map(Number);
    const duration = parseFloat(formData.visitDuration);
    const endHours = hours + Math.floor(duration);
    const endMinutes = minutes + Math.round((duration % 1) * 60);
    const finalHours = endHours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Visit Summary Card */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <CalendarDaysIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">First Visit Details</h3>
            <p className="text-sm text-gray-600">
              Schedule and confirm the patient's first home care visit
            </p>
          </div>
        </div>

        {formData.visitDate && formData.visitTimeStart && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">
                {new Date(formData.visitDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
              <ClockIcon className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">
                {formData.visitTimeStart} - {calculateEndTime() || formData.visitTimeEnd}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visit Scheduling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Schedule <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
            <input
              type="date"
              name="visitDate"
              value={formData.visitDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              name="visitTimeStart"
              value={formData.visitTimeStart}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <select
              name="visitDuration"
              value={formData.visitDuration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="1">1 hour</option>
              <option value="1.5">1.5 hours</option>
              <option value="2">2 hours</option>
              <option value="2.5">2.5 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              name="visitTimeEnd"
              value={formData.visitTimeEnd || calculateEndTime()}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Caregiver Confirmation */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Caregiver Confirmation <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Caregiver</label>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="assignedCaregiver"
                value={formData.assignedCaregiver}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Caregiver name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caregiver Phone</label>
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="caregiverPhone"
                value={formData.caregiverPhone}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="caregiverConfirmed"
              checked={formData.caregiverConfirmed}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Caregiver confirmed for visit</span>
          </label>
          {formData.caregiverConfirmed && (
            <div className="flex items-center gap-2 text-success-600">
              <CheckCircleIcon className="h-5 w-5" />
              <input
                type="date"
                name="caregiverConfirmedDate"
                value={formData.caregiverConfirmedDate}
                onChange={handleChange}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Patient Notification */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Notification <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notified By</label>
            <input
              type="text"
              name="patientNotifiedBy"
              value={formData.patientNotifiedBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Staff member name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Method</label>
            <select
              name="patientNotificationMethod"
              value={formData.patientNotificationMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select method</option>
              <option value="phone">Phone Call</option>
              <option value="text">Text Message</option>
              <option value="email">Email</option>
              <option value="in_person">In Person</option>
              <option value="family_contact">Via Family/Caregiver</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="patientNotified"
              checked={formData.patientNotified}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Patient/family notified of visit</span>
          </label>
          {formData.patientNotified && (
            <div className="flex items-center gap-2 text-success-600">
              <CheckCircleIcon className="h-5 w-5" />
              <input
                type="date"
                name="patientNotifiedDate"
                value={formData.patientNotifiedDate}
                onChange={handleChange}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Visit Location */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
            <select
              name="visitLocation"
              value={formData.visitLocation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="patient_home">Patient's Home</option>
              <option value="facility">Care Facility</option>
              <option value="family_home">Family Member's Home</option>
              <option value="other">Other Location</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Address</label>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="visitAddress"
                value={formData.visitAddress}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Full address"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Instructions</label>
            <textarea
              name="accessInstructions"
              value={formData.accessInstructions}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Gate code, apartment access, key location..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Instructions</label>
            <textarea
              name="parkingInstructions"
              value={formData.parkingInstructions}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Where to park, any restrictions..."
            />
          </div>
        </div>
      </div>

      {/* Pre-Visit Checklist */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-Visit Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="carePlanReviewed"
              checked={formData.carePlanReviewed}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Care plan reviewed with caregiver</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="emergencyInfoReviewed"
              checked={formData.emergencyInfoReviewed}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Emergency information reviewed</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="suppliesChecked"
              checked={formData.suppliesChecked}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Supplies and equipment checked</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="documentsReady"
              checked={formData.documentsReady}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Required documents prepared</span>
          </label>
        </div>
      </div>

      {/* Pre-Visit Call */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-Visit Contact</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="preVisitCallScheduled"
              checked={formData.preVisitCallScheduled}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Pre-visit call scheduled</span>
          </label>
          {formData.preVisitCallScheduled && (
            <input
              type="date"
              name="preVisitCallDate"
              value={formData.preVisitCallDate}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Visit Call Notes</label>
          <textarea
            name="preVisitCallNotes"
            value={formData.preVisitCallNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Notes from pre-visit call with patient/family..."
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visit Notes</label>
          <textarea
            name="visitNotes"
            value={formData.visitNotes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="General notes about the first visit..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
          <textarea
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Special instructions for the caregiver..."
          />
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">
            {getCompletedFields().length} of 4 required sections
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedFields().length / 4) * 100}%` }}
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
