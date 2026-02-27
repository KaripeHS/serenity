import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';
import {
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// ── US States (50 + DC) ──────────────────────────────────────────────────────
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// ── Schedule options ──────────────────────────────────────────────────────────
const SCHEDULE_OPTIONS = [
  { key: 'fullTime', label: 'Full-Time' },
  { key: 'partTime', label: 'Part-Time' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'weekends', label: 'Weekends' },
  { key: 'evenings', label: 'Evenings' },
  { key: 'nights', label: 'Nights' },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface EducationEntry {
  schoolName: string;
  cityState: string;
  yearsAttended: string;
  degreeDiploma: string;
  major: string;
}

interface EmployerEntry {
  employer: string;
  address: string;
  phone: string;
  position: string;
  supervisor: string;
  startDate: string;
  endDate: string;
  reasonForLeaving: string;
  mayWeContact: 'yes' | 'no' | '';
}

interface ReferenceEntry {
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  relationship: string;
}

interface SchedulePreferences {
  fullTime: boolean;
  partTime: boolean;
  weekdays: boolean;
  weekends: boolean;
  evenings: boolean;
  nights: boolean;
}

interface FormData {
  // Section 1: Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  positionAppliedFor: string;
  // Section 2: Education
  education: [EducationEntry, EducationEntry, EducationEntry];
  // Section 3: Employment History
  employmentHistory: EmployerEntry[];
  // Section 4: References
  references: [ReferenceEntry, ReferenceEntry, ReferenceEntry];
  // Section 5: Availability
  availableStartDate: string;
  schedulePreferences: SchedulePreferences;
  hasReliableTransportation: 'yes' | 'no' | '';
  hasValidDriversLicense: 'yes' | 'no' | '';
  // Section 6: Declaration & Signature
  signature: SignatureData | null;
}

const DEFAULT_EDUCATION: EducationEntry = {
  schoolName: '',
  cityState: '',
  yearsAttended: '',
  degreeDiploma: '',
  major: '',
};

const DEFAULT_EMPLOYER: EmployerEntry = {
  employer: '',
  address: '',
  phone: '',
  position: '',
  supervisor: '',
  startDate: '',
  endDate: '',
  reasonForLeaving: '',
  mayWeContact: '',
};

const DEFAULT_REFERENCE: ReferenceEntry = {
  name: '',
  company: '',
  title: '',
  phone: '',
  email: '',
  relationship: '',
};

const DEFAULT_DATA: FormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  ssn: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: 'OH',
  zip: '',
  phone: '',
  email: '',
  positionAppliedFor: '',
  education: [
    { ...DEFAULT_EDUCATION },
    { ...DEFAULT_EDUCATION },
    { ...DEFAULT_EDUCATION },
  ],
  employmentHistory: [{ ...DEFAULT_EMPLOYER }],
  references: [
    { ...DEFAULT_REFERENCE },
    { ...DEFAULT_REFERENCE },
    { ...DEFAULT_REFERENCE },
  ],
  availableStartDate: '',
  schedulePreferences: {
    fullTime: false,
    partTime: false,
    weekdays: false,
    weekends: false,
    evenings: false,
    nights: false,
  },
  hasReliableTransportation: '',
  hasValidDriversLicense: '',
  signature: null,
};

// ── Shared input class ────────────────────────────────────────────────────────
const INPUT_CLASS =
  'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
const TABLE_INPUT_CLASS =
  'w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm';

// ── SSN Utilities ─────────────────────────────────────────────────────────────

/** Format raw digits into XXX-XX-XXXX shape as user types */
function formatSSNInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** Return masked display: XXX-XX-1234 */
function maskSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 9) return formatSSNInput(ssn);
  return `XXX-XX-${digits.slice(5)}`;
}

// ── Education row labels ──────────────────────────────────────────────────────
const EDUCATION_LABELS = ['High School', 'College / University', 'Other / Trade School'];

// ══════════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════════

export default function EmploymentApplicationForm() {
  // ── Employee ID from localStorage (set by ApplicationPackageHub) ──
  const [employeeId] = useState<string>(() => {
    try {
      return localStorage.getItem('serenity_hiring_current_employee') || 'emp-001';
    } catch {
      return 'emp-001';
    }
  });

  const formDef = getHiringFormBySlug('employment-application')!;

  // ── Shared applicant data (propagates to all other forms) ──
  const {
    applicantData,
    updateSharedField,
    updateMultipleSharedFields,
    markFormStatus,
    syncFormToServer,
  } = useHiringFormData(employeeId);

  // ── Local form persistence (auto-saves to localStorage) ──
  const {
    data,
    updateField,
    updateNestedField,
    resetForm,
    lastSaved,
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    auditTrail,
    addAuditEntry,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_employment-application`, DEFAULT_DATA);

  // ── SSN display state ──
  const [ssnFocused, setSsnFocused] = useState(false);

  // ── Sync shared fields whenever key personal data changes ──
  // We batch shared updates on blur or explicit change to avoid re-render storms.
  const syncSharedFields = useCallback(
    (partial: Partial<FormData>) => {
      const sharedUpdates: Record<string, unknown> = {};
      if ('firstName' in partial) sharedUpdates.firstName = partial.firstName;
      if ('middleName' in partial) sharedUpdates.middleName = partial.middleName;
      if ('lastName' in partial) sharedUpdates.lastName = partial.lastName;
      if ('ssn' in partial) sharedUpdates.ssn = partial.ssn;
      if ('dateOfBirth' in partial) sharedUpdates.dateOfBirth = partial.dateOfBirth;
      if ('address' in partial) sharedUpdates.address = partial.address;
      if ('city' in partial) sharedUpdates.city = partial.city;
      if ('state' in partial) sharedUpdates.state = partial.state;
      if ('zip' in partial) sharedUpdates.zip = partial.zip;
      if ('phone' in partial) sharedUpdates.phone = partial.phone;
      if ('email' in partial) sharedUpdates.email = partial.email;
      if ('positionAppliedFor' in partial) sharedUpdates.positionAppliedFor = partial.positionAppliedFor;

      if (Object.keys(sharedUpdates).length > 0) {
        updateMultipleSharedFields(sharedUpdates as any);
      }
    },
    [updateMultipleSharedFields],
  );

  // Sync references to shared data whenever they change
  useEffect(() => {
    updateSharedField('references', data.references);
  }, [data.references, updateSharedField]);

  // Sync employment history to shared data whenever it changes
  useEffect(() => {
    const mapped = data.employmentHistory.map((e) => ({
      employer: e.employer,
      address: e.address,
      phone: e.phone,
      position: e.position,
      supervisor: e.supervisor,
      startDate: e.startDate,
      endDate: e.endDate,
      reasonForLeaving: e.reasonForLeaving,
    }));
    updateSharedField('employmentHistory', mapped);
  }, [data.employmentHistory, updateSharedField]);

  // ── Mark as in-progress once any field is filled ──
  useEffect(() => {
    if (data.firstName || data.lastName || data.email) {
      markFormStatus('employment-application', 'in_progress');
    }
  }, [data.firstName, data.lastName, data.email, markFormStatus]);

  // ── Pre-fill from shared data on first mount (if returning to form) ──
  useEffect(() => {
    if (applicantData.firstName && !data.firstName) {
      updateField('firstName', applicantData.firstName as any);
    }
    if (applicantData.lastName && !data.lastName) {
      updateField('lastName', applicantData.lastName as any);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Update a simple text field and sync to shared data on blur */
  const handleFieldChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      updateField(field, value);
    },
    [updateField],
  );

  /** Called onBlur for personal fields — pushes to shared data */
  const handlePersonalFieldBlur = useCallback(
    (field: keyof FormData) => {
      syncSharedFields({ [field]: data[field] } as Partial<FormData>);
    },
    [data, syncSharedFields],
  );

  // ── SSN Handlers ──
  const handleSSNChange = useCallback(
    (raw: string) => {
      const formatted = formatSSNInput(raw);
      handleFieldChange('ssn', formatted);
    },
    [handleFieldChange],
  );

  const handleSSNBlur = useCallback(() => {
    setSsnFocused(false);
    syncSharedFields({ ssn: data.ssn });
  }, [data.ssn, syncSharedFields]);

  // ── Education update ──
  const updateEducation = useCallback(
    (index: number, field: keyof EducationEntry, value: string) => {
      updateNestedField(`education.${index}.${field}`, value);
    },
    [updateNestedField],
  );

  // ── Employment History ──
  const addEmployer = useCallback(() => {
    if (data.employmentHistory.length >= 5) return;
    const updated = [...data.employmentHistory, { ...DEFAULT_EMPLOYER }];
    updateField('employmentHistory', updated);
  }, [data.employmentHistory, updateField]);

  const removeEmployer = useCallback(
    (index: number) => {
      if (data.employmentHistory.length <= 1) return;
      const updated = data.employmentHistory.filter((_, i) => i !== index);
      updateField('employmentHistory', updated);
    },
    [data.employmentHistory, updateField],
  );

  const updateEmployer = useCallback(
    (index: number, field: keyof EmployerEntry, value: string) => {
      updateNestedField(`employmentHistory.${index}.${field}`, value);
    },
    [updateNestedField],
  );

  // ── References ──
  const updateReference = useCallback(
    (index: number, field: keyof ReferenceEntry, value: string) => {
      updateNestedField(`references.${index}.${field}`, value);
    },
    [updateNestedField],
  );

  // ── Schedule Preferences ──
  const toggleSchedule = useCallback(
    (key: keyof SchedulePreferences) => {
      updateNestedField(`schedulePreferences.${key}`, !data.schedulePreferences[key]);
    },
    [data.schedulePreferences, updateNestedField],
  );

  // ── Signature Handler ──
  const handleSign = useCallback(
    (sig: SignatureData) => {
      updateField('signature', sig);
      markFormStatus('employment-application', 'signed');
      addAuditEntry('FORM_SIGNED', 'Employment Application signed by applicant');
      syncFormToServer('employment-application', data as unknown as Record<string, unknown>, sig);
    },
    [updateField, markFormStatus, addAuditEntry, syncFormToServer, data],
  );

  const handleClearSignature = useCallback(() => {
    updateField('signature', null);
    markFormStatus('employment-application', 'in_progress');
  }, [updateField, markFormStatus]);

  // ── Computed ──
  const employeeName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ') || 'New Applicant';
  const isSigned = !!data.signature;

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <HiringFormShell
      formDef={formDef}
      employeeId={employeeId}
      employeeName={employeeName}
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile}
      auditTrail={auditTrail}
    >
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: Personal Information                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary-100 text-primary-700 text-[10px]">Section 1</Badge>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row: Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">
                First Name <span className="text-danger-500">*</span>
              </Label>
              <input
                id="firstName"
                type="text"
                value={data.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('firstName')}
                className={INPUT_CLASS}
                placeholder="First name"
                disabled={isSigned}
              />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <input
                id="middleName"
                type="text"
                value={data.middleName}
                onChange={(e) => handleFieldChange('middleName', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('middleName')}
                className={INPUT_CLASS}
                placeholder="Middle name"
                disabled={isSigned}
              />
            </div>
            <div>
              <Label htmlFor="lastName">
                Last Name <span className="text-danger-500">*</span>
              </Label>
              <input
                id="lastName"
                type="text"
                value={data.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('lastName')}
                className={INPUT_CLASS}
                placeholder="Last name"
                disabled={isSigned}
              />
            </div>
          </div>

          {/* Row: SSN + DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ssn">
                Social Security Number <span className="text-danger-500">*</span>
              </Label>
              <input
                id="ssn"
                type="text"
                value={ssnFocused ? data.ssn : maskSSN(data.ssn)}
                onChange={(e) => handleSSNChange(e.target.value)}
                onFocus={() => setSsnFocused(true)}
                onBlur={handleSSNBlur}
                className={INPUT_CLASS}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
                autoComplete="off"
                disabled={isSigned}
              />
              <p className="text-xs text-gray-400 mt-1">
                Stored securely. Displayed as XXX-XX-{data.ssn.replace(/\D/g, '').slice(5) || '____'}
              </p>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-danger-500">*</span>
              </Label>
              <input
                id="dateOfBirth"
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('dateOfBirth')}
                className={INPUT_CLASS}
                disabled={isSigned}
              />
            </div>
          </div>

          {/* Row: Address */}
          <div>
            <Label htmlFor="address">
              Street Address <span className="text-danger-500">*</span>
            </Label>
            <input
              id="address"
              type="text"
              value={data.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onBlur={() => handlePersonalFieldBlur('address')}
              className={INPUT_CLASS}
              placeholder="123 Main Street, Apt 4B"
              disabled={isSigned}
            />
          </div>

          {/* Row: City, State, Zip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">
                City <span className="text-danger-500">*</span>
              </Label>
              <input
                id="city"
                type="text"
                value={data.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('city')}
                className={INPUT_CLASS}
                placeholder="City"
                disabled={isSigned}
              />
            </div>
            <div>
              <Label htmlFor="state">
                State <span className="text-danger-500">*</span>
              </Label>
              <select
                id="state"
                value={data.state}
                onChange={(e) => {
                  handleFieldChange('state', e.target.value);
                  syncSharedFields({ state: e.target.value });
                }}
                className={INPUT_CLASS}
                disabled={isSigned}
              >
                <option value="">Select state...</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="zip">
                ZIP Code <span className="text-danger-500">*</span>
              </Label>
              <input
                id="zip"
                type="text"
                value={data.zip}
                onChange={(e) => handleFieldChange('zip', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => handlePersonalFieldBlur('zip')}
                className={INPUT_CLASS}
                placeholder="44101"
                maxLength={10}
                disabled={isSigned}
              />
            </div>
          </div>

          {/* Row: Phone + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">
                Phone Number <span className="text-danger-500">*</span>
              </Label>
              <input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('phone')}
                className={INPUT_CLASS}
                placeholder="(555) 123-4567"
                disabled={isSigned}
              />
            </div>
            <div>
              <Label htmlFor="email">
                Email Address <span className="text-danger-500">*</span>
              </Label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handlePersonalFieldBlur('email')}
                className={INPUT_CLASS}
                placeholder="applicant@email.com"
                disabled={isSigned}
              />
            </div>
          </div>

          {/* Row: Position Applied For */}
          <div className="max-w-md">
            <Label htmlFor="positionAppliedFor">
              Position Applied For <span className="text-danger-500">*</span>
            </Label>
            <input
              id="positionAppliedFor"
              type="text"
              value={data.positionAppliedFor}
              onChange={(e) => handleFieldChange('positionAppliedFor', e.target.value)}
              onBlur={() => handlePersonalFieldBlur('positionAppliedFor')}
              className={INPUT_CLASS}
              placeholder="e.g., Home Health Aide, STNA, LPN"
              disabled={isSigned}
            />
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: Education History                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary-100 text-primary-700 text-[10px]">Section 2</Badge>
            <CardTitle className="text-base">Education History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600 w-[140px]">Level</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">School Name</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">City / State</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600 w-[100px]">Years Attended</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Degree / Diploma</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Major</th>
                </tr>
              </thead>
              <tbody>
                {data.education.map((edu, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-2">
                      <span className="text-xs font-medium text-gray-700">{EDUCATION_LABELS[idx]}</span>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={edu.schoolName}
                        onChange={(e) => updateEducation(idx, 'schoolName', e.target.value)}
                        className={TABLE_INPUT_CLASS}
                        placeholder="School name"
                        disabled={isSigned}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={edu.cityState}
                        onChange={(e) => updateEducation(idx, 'cityState', e.target.value)}
                        className={TABLE_INPUT_CLASS}
                        placeholder="City, ST"
                        disabled={isSigned}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={edu.yearsAttended}
                        onChange={(e) => updateEducation(idx, 'yearsAttended', e.target.value)}
                        className={TABLE_INPUT_CLASS}
                        placeholder="e.g., 4"
                        disabled={isSigned}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={edu.degreeDiploma}
                        onChange={(e) => updateEducation(idx, 'degreeDiploma', e.target.value)}
                        className={TABLE_INPUT_CLASS}
                        placeholder="Diploma / Degree"
                        disabled={isSigned}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => updateEducation(idx, 'major', e.target.value)}
                        className={TABLE_INPUT_CLASS}
                        placeholder="Major / Field"
                        disabled={isSigned}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: Employment History                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary-100 text-primary-700 text-[10px]">Section 3</Badge>
              <CardTitle className="text-base">Employment History</CardTitle>
            </div>
            {!isSigned && data.employmentHistory.length < 5 && (
              <button
                type="button"
                onClick={addEmployer}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Employer
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 ml-0 mt-1">
            List your most recent employer first. Include at least your last 3 employers.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.employmentHistory.map((emp, idx) => (
            <Card key={idx} className="border border-gray-200 shadow-none">
              <CardContent className="p-4 space-y-3">
                {/* Header with employer number and remove button */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Employer {idx + 1}
                  </span>
                  {!isSigned && data.employmentHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmployer(idx)}
                      className="text-gray-400 hover:text-danger-500 transition-colors"
                      title="Remove employer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Row 1: Employer Name + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Employer Name</Label>
                    <input
                      type="text"
                      value={emp.employer}
                      onChange={(e) => updateEmployer(idx, 'employer', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Company name"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <input
                      type="tel"
                      value={emp.phone}
                      onChange={(e) => updateEmployer(idx, 'phone', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="(555) 123-4567"
                      disabled={isSigned}
                    />
                  </div>
                </div>

                {/* Row 2: Address */}
                <div>
                  <Label>Address</Label>
                  <input
                    type="text"
                    value={emp.address}
                    onChange={(e) => updateEmployer(idx, 'address', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Full address"
                    disabled={isSigned}
                  />
                </div>

                {/* Row 3: Position + Supervisor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Position / Title</Label>
                    <input
                      type="text"
                      value={emp.position}
                      onChange={(e) => updateEmployer(idx, 'position', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Job title"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Supervisor Name</Label>
                    <input
                      type="text"
                      value={emp.supervisor}
                      onChange={(e) => updateEmployer(idx, 'supervisor', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Supervisor's full name"
                      disabled={isSigned}
                    />
                  </div>
                </div>

                {/* Row 4: Dates + Reason + May Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <input
                      type="date"
                      value={emp.startDate}
                      onChange={(e) => updateEmployer(idx, 'startDate', e.target.value)}
                      className={INPUT_CLASS}
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <input
                      type="date"
                      value={emp.endDate}
                      onChange={(e) => updateEmployer(idx, 'endDate', e.target.value)}
                      className={INPUT_CLASS}
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Reason for Leaving</Label>
                    <input
                      type="text"
                      value={emp.reasonForLeaving}
                      onChange={(e) => updateEmployer(idx, 'reasonForLeaving', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Relocation"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>May We Contact?</Label>
                    <select
                      value={emp.mayWeContact}
                      onChange={(e) => updateEmployer(idx, 'mayWeContact', e.target.value)}
                      className={INPUT_CLASS}
                      disabled={isSigned}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!isSigned && data.employmentHistory.length < 5 && (
            <button
              type="button"
              onClick={addEmployer}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Add Another Employer ({data.employmentHistory.length}/5)
            </button>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: Professional References                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary-100 text-primary-700 text-[10px]">Section 4</Badge>
            <CardTitle className="text-base">Professional References</CardTitle>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provide 3 professional references (not relatives). These will be contacted during the hiring process.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.references.map((ref, idx) => (
            <Card key={idx} className="border border-gray-200 shadow-none">
              <CardContent className="p-4 space-y-3">
                <span className="text-sm font-semibold text-gray-700">
                  Reference {idx + 1}
                </span>

                {/* Row 1: Name + Company + Title */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Full Name <span className="text-danger-500">*</span></Label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => updateReference(idx, 'name', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Full name"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Company / Organization</Label>
                    <input
                      type="text"
                      value={ref.company}
                      onChange={(e) => updateReference(idx, 'company', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Company name"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <input
                      type="text"
                      value={ref.title}
                      onChange={(e) => updateReference(idx, 'title', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Job title"
                      disabled={isSigned}
                    />
                  </div>
                </div>

                {/* Row 2: Phone + Email + Relationship */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Phone <span className="text-danger-500">*</span></Label>
                    <input
                      type="tel"
                      value={ref.phone}
                      onChange={(e) => updateReference(idx, 'phone', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="(555) 123-4567"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <input
                      type="email"
                      value={ref.email}
                      onChange={(e) => updateReference(idx, 'email', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="email@example.com"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <Label>Relationship <span className="text-danger-500">*</span></Label>
                    <input
                      type="text"
                      value={ref.relationship}
                      onChange={(e) => updateReference(idx, 'relationship', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Former Supervisor"
                      disabled={isSigned}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: Availability                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary-100 text-primary-700 text-[10px]">Section 5</Badge>
            <CardTitle className="text-base">Availability</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Available Start Date */}
          <div className="max-w-xs">
            <Label htmlFor="availableStartDate">
              Available Start Date <span className="text-danger-500">*</span>
            </Label>
            <input
              id="availableStartDate"
              type="date"
              value={data.availableStartDate}
              onChange={(e) => handleFieldChange('availableStartDate', e.target.value)}
              className={INPUT_CLASS}
              disabled={isSigned}
            />
          </div>

          {/* Schedule Preferences */}
          <div>
            <Label className="mb-2 block">Schedule Preferences</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {SCHEDULE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                    data.schedulePreferences[opt.key]
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  } ${isSigned ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={data.schedulePreferences[opt.key]}
                    onChange={() => toggleSchedule(opt.key)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={isSigned}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Transportation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hasReliableTransportation">
                Do you have reliable transportation? <span className="text-danger-500">*</span>
              </Label>
              <select
                id="hasReliableTransportation"
                value={data.hasReliableTransportation}
                onChange={(e) => handleFieldChange('hasReliableTransportation', e.target.value as 'yes' | 'no' | '')}
                className={INPUT_CLASS}
                disabled={isSigned}
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <Label htmlFor="hasValidDriversLicense">
                Do you have a valid driver's license? <span className="text-danger-500">*</span>
              </Label>
              <select
                id="hasValidDriversLicense"
                value={data.hasValidDriversLicense}
                onChange={(e) => handleFieldChange('hasValidDriversLicense', e.target.value as 'yes' | 'no' | '')}
                className={INPUT_CLASS}
                disabled={isSigned}
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: Declaration & Signature                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary-100 text-primary-700 text-[10px]">Section 6</Badge>
            <CardTitle className="text-base">Declaration & Signature</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Declaration Text */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-gray-800 leading-relaxed">
              I certify that all information provided in this application is true, complete, and accurate to the best
              of my knowledge. I understand that any false statement, omission, or misrepresentation on this
              application is grounds for rejection of my application or, if employed, immediate dismissal.
            </p>
            <p className="text-sm text-gray-800 leading-relaxed mt-3">
              I authorize Serenity Care Partners LLC to verify the information provided herein and to contact the
              references and previous employers listed above. I release all parties from any liability for damages
              that may result from furnishing such information.
            </p>
            <p className="text-sm text-gray-800 leading-relaxed mt-3">
              I understand that this application does not constitute an offer or contract of employment, and that
              if hired, my employment is at-will and may be terminated at any time by either party with or without
              cause or notice, unless otherwise stated in a written employment agreement.
            </p>
          </div>

          {/* Signature */}
          {data.signature ? (
            <SignatureDisplay
              signatureData={data.signature}
              signerName={employeeName}
              onClear={handleClearSignature}
            />
          ) : (
            <ESignature
              onSign={handleSign}
              signerName={employeeName}
              attestationText="By signing below, I certify that all information provided in this Employment Application is true, complete, and accurate to the best of my knowledge. I understand that any false statement may result in rejection of my application or immediate dismissal."
              required
            />
          )}

          {/* Signed confirmation badge */}
          {data.signature && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Badge className="bg-green-100 text-green-800">Signed</Badge>
              <span className="text-sm text-green-700">
                Employment Application completed and signed by {employeeName} on{' '}
                {new Date(data.signature.signedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </HiringFormShell>
  );
}
