import { useState } from 'react';
import { MagnifyingGlassIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { PodAssignment } from '../../pods/PodAssignment';

interface CaregiverAssignmentFormProps {
  data: any;
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

interface Caregiver {
  id: string;
  name: string;
  role: string;
  phone: string;
  skills: string[];
  availability: string;
  distance: string;
}

// Mock caregiver data for demonstration
const mockCaregivers: Caregiver[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'HHA',
    phone: '(555) 123-4567',
    skills: ['Personal Care', 'Meal Prep', 'Medication Reminders'],
    availability: 'Mon-Fri 8am-4pm',
    distance: '2.5 miles',
  },
  {
    id: '2',
    name: 'Michael Williams',
    role: 'CNA',
    phone: '(555) 234-5678',
    skills: ['Transfers', 'Wound Care', 'Vital Signs'],
    availability: 'Mon-Sat Flexible',
    distance: '4.0 miles',
  },
  {
    id: '3',
    name: 'Emily Davis',
    role: 'HHA',
    phone: '(555) 345-6789',
    skills: ['Dementia Care', 'Companionship', 'Light Housekeeping'],
    availability: 'Evenings & Weekends',
    distance: '1.8 miles',
  },
  {
    id: '4',
    name: 'James Brown',
    role: 'CNA',
    phone: '(555) 456-7890',
    skills: ['Mobility Assistance', 'Personal Care', 'Exercise'],
    availability: 'Full Time Available',
    distance: '3.2 miles',
  },
];

export function CaregiverAssignmentForm({ data, onSave, onClose }: CaregiverAssignmentFormProps) {
  const [formData, setFormData] = useState({
    // Primary Caregiver
    primaryCaregiverId: data?.primaryCaregiverId || '',
    primaryCaregiverName: data?.primaryCaregiverName || '',
    primaryCaregiverPhone: data?.primaryCaregiverPhone || '',

    // Backup Caregiver
    backupCaregiverId: data?.backupCaregiverId || '',
    backupCaregiverName: data?.backupCaregiverName || '',
    backupCaregiverPhone: data?.backupCaregiverPhone || '',

    // Pod Assignment
    podId: data?.podId || '',

    // Introduction
    introductionDate: data?.introductionDate || '',
    introductionTime: data?.introductionTime || '',
    introductionLocation: data?.introductionLocation || 'patient_home',
    introductionNotes: data?.introductionNotes || '',
    introductionCompleted: data?.introductionCompleted || false,

    // Matching Criteria
    matchingNotes: data?.matchingNotes || '',
    patientPreferences: data?.patientPreferences || '',
    specialRequirements: data?.specialRequirements || '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const requiredFieldMapping: Record<string, string[]> = {
    'Primary Caregiver': ['primaryCaregiverId', 'primaryCaregiverName'],
    'Backup Caregiver': ['backupCaregiverId', 'backupCaregiverName'],
    'Introduction Date': ['introductionDate'],
  };

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      const allFilled = keys.every(key => formData[key as keyof typeof formData]?.toString().trim());
      if (allFilled) {
        completed.push(fieldName);
      }
    }
    return completed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const selectCaregiver = (caregiver: Caregiver, type: 'primary' | 'backup') => {
    if (type === 'primary') {
      setFormData(prev => ({
        ...prev,
        primaryCaregiverId: caregiver.id,
        primaryCaregiverName: caregiver.name,
        primaryCaregiverPhone: caregiver.phone,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        backupCaregiverId: caregiver.id,
        backupCaregiverName: caregiver.name,
        backupCaregiverPhone: caregiver.phone,
      }));
    }
  };

  const filteredCaregivers = mockCaregivers.filter(cg =>
    cg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cg.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cg.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  const renderCaregiverCard = (caregiver: Caregiver, selectionType: 'primary' | 'backup') => {
    const isSelected = selectionType === 'primary'
      ? formData.primaryCaregiverId === caregiver.id
      : formData.backupCaregiverId === caregiver.id;

    const isOtherSelected = selectionType === 'primary'
      ? formData.backupCaregiverId === caregiver.id
      : formData.primaryCaregiverId === caregiver.id;

    return (
      <div
        key={`${caregiver.id}-${selectionType}`}
        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
          isSelected
            ? 'border-primary-500 bg-primary-50'
            : isOtherSelected
            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
        }`}
        onClick={() => !isOtherSelected && selectCaregiver(caregiver, selectionType)}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <CheckCircleIcon className="h-6 w-6 text-primary-600 bg-white rounded-full" />
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <UserIcon className="h-8 w-8 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{caregiver.name}</h4>
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                {caregiver.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{caregiver.phone}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {caregiver.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{caregiver.availability}</span>
              <span>{caregiver.distance}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matching Criteria */}
      <div className="bg-info-50 border border-info-200 rounded-xl p-4">
        <h4 className="font-medium text-info-900 mb-2">Patient Care Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Preferences</label>
            <textarea
              name="patientPreferences"
              value={formData.patientPreferences}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="e.g., Prefers female caregiver, Spanish-speaking..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
            <textarea
              name="specialRequirements"
              value={formData.specialRequirements}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="e.g., Dementia experience required, must have vehicle..."
            />
          </div>
        </div>
      </div>

      {/* Pod Assignment */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <PodAssignment
          selectedPodId={formData.podId}
          onPodSelect={(podId) => setFormData(prev => ({ ...prev, podId }))}
          required={false}
          label="Assign to Care Team Pod (Optional)"
          helperText="Select which pod/care team will be responsible for this patient's care"
          showOnlyActive={true}
        />
      </div>

      {/* Search Caregivers */}
      <div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search caregivers by name, role, or skills..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Primary Caregiver Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Primary Caregiver <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Select the main caregiver who will provide regular care to this patient.</p>

        {formData.primaryCaregiverName ? (
          <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
                <div>
                  <p className="font-medium text-success-900">Selected: {formData.primaryCaregiverName}</p>
                  <p className="text-sm text-success-700">{formData.primaryCaregiverPhone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  primaryCaregiverId: '',
                  primaryCaregiverName: '',
                  primaryCaregiverPhone: '',
                }))}
                className="text-sm text-success-700 hover:text-success-900"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCaregivers.map(cg => renderCaregiverCard(cg, 'primary'))}
          </div>
        )}
      </div>

      {/* Backup Caregiver Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Backup Caregiver <span className="text-danger-500">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Select a backup caregiver for coverage when the primary is unavailable.</p>

        {formData.backupCaregiverName ? (
          <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
                <div>
                  <p className="font-medium text-success-900">Selected: {formData.backupCaregiverName}</p>
                  <p className="text-sm text-success-700">{formData.backupCaregiverPhone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  backupCaregiverId: '',
                  backupCaregiverName: '',
                  backupCaregiverPhone: '',
                }))}
                className="text-sm text-success-700 hover:text-success-900"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCaregivers.map(cg => renderCaregiverCard(cg, 'backup'))}
          </div>
        )}
      </div>

      {/* Introduction Scheduling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Caregiver Introduction <span className="text-danger-500">*</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Introduction Date</label>
            <input
              type="date"
              name="introductionDate"
              value={formData.introductionDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              name="introductionTime"
              value={formData.introductionTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              name="introductionLocation"
              value={formData.introductionLocation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="patient_home">Patient's Home</option>
              <option value="office">Agency Office</option>
              <option value="virtual">Virtual Meeting</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Introduction Notes</label>
          <textarea
            name="introductionNotes"
            value={formData.introductionNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Any special arrangements or things to discuss during introduction..."
          />
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="introductionCompleted"
              checked={formData.introductionCompleted}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Introduction completed successfully</span>
          </label>
        </div>
      </div>

      {/* Matching Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Matching Notes</label>
        <textarea
          name="matchingNotes"
          value={formData.matchingNotes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Notes about why these caregivers were selected, any concerns, etc..."
        />
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">
            {getCompletedFields().length} of 3 required sections
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedFields().length / 3) * 100}%` }}
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
