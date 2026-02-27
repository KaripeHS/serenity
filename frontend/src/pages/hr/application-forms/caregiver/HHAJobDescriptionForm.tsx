import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'hha-job-description';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const ESSENTIAL_DUTIES = [
  'Provide personal care services (bathing, grooming, dressing)',
  'Assist with ambulation and transfers',
  'Assist with toileting and incontinence care',
  'Perform light housekeeping duties',
  'Prepare meals and assist with feeding',
  'Assist with medication reminders (non-administration)',
  'Document care provided and report changes in condition',
  "Follow the individual's care plan",
  'Maintain a safe and clean environment',
  'Accompany individuals to appointments when assigned',
  'Use proper body mechanics and safety techniques',
  'Follow infection control procedures',
  'Maintain client confidentiality (HIPAA)',
  'Complete EVV documentation accurately',
  'Attend required in-service training',
] as const;

const QUALIFICATIONS = [
  'Active Ohio STNA/CNA/HHA certification',
  'Current CPR/First Aid certification',
  'Valid driver\'s license (if applicable)',
  'Clear BCI/FBI background check',
  'Ability to lift 50 lbs',
  'Reliable transportation',
] as const;

interface FormData {
  employeeName: string;
  position: string;
  jobTitle: 'HHA' | 'CNA' | 'STNA' | '';
  supervisorName: string;
  jobSummary: string;
  dutyAcknowledgments: boolean[];
  qualificationChecks: boolean[];
  readAndUnderstood: boolean;
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
  supervisorSignature: SignatureData | null;
  supervisorSignatureDate: string;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  position: '',
  jobTitle: '',
  supervisorName: '',
  jobSummary:
    'Under the direction and supervision of the Registered Nurse (RN) Supervisor, the Home Health Aide/CNA/STNA provides personal care services to individuals in their homes in accordance with the established care plan. The aide assists with activities of daily living, maintains a safe environment, and documents care provided.',
  dutyAcknowledgments: new Array(ESSENTIAL_DUTIES.length).fill(false),
  qualificationChecks: new Array(QUALIFICATIONS.length).fill(false),
  readAndUnderstood: false,
  employeeSignature: null,
  employeeSignatureDate: '',
  supervisorSignature: null,
  supervisorSignatureDate: '',
};

function deriveJobTitle(position: string): FormData['jobTitle'] {
  const pos = position.toLowerCase();
  if (pos.includes('hha') || pos.includes('home health aide')) return 'HHA';
  if (pos.includes('cna') || pos.includes('certified nursing assistant')) return 'CNA';
  if (pos.includes('stna') || pos.includes('state tested nursing')) return 'STNA';
  return '';
}

export default function HHAJobDescriptionForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, updateNestedField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from applicantData
  useEffect(() => {
    if (applicantData.firstName || applicantData.lastName) {
      const fullName = `${applicantData.firstName} ${applicantData.lastName}`.trim();
      if (!data.employeeName && fullName) {
        updateField('employeeName', fullName);
      }
    }
    if (applicantData.positionAppliedFor && !data.position) {
      updateField('position', applicantData.positionAppliedFor);
    }
    if (applicantData.positionAppliedFor && !data.jobTitle) {
      const derived = deriveJobTitle(applicantData.positionAppliedFor);
      if (derived) updateField('jobTitle', derived);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName, applicantData.positionAppliedFor]);

  const acknowledgedCount = data.dutyAcknowledgments.filter(Boolean).length;
  const qualCount = data.qualificationChecks.filter(Boolean).length;

  const handleDutyToggle = (index: number) => {
    const updated = [...data.dutyAcknowledgments];
    updated[index] = !updated[index];
    updateField('dutyAcknowledgments', updated);
  };

  const handleQualToggle = (index: number) => {
    const updated = [...data.qualificationChecks];
    updated[index] = !updated[index];
    updateField('qualificationChecks', updated);
  };

  const handleEmployeeSignature = (sigData: SignatureData) => {
    updateField('employeeSignature', sigData);
    updateField('employeeSignatureDate', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleSupervisorSignature = (sigData: SignatureData) => {
    updateField('supervisorSignature', sigData);
    updateField('supervisorSignatureDate', new Date().toISOString().split('T')[0]);
  };

  return (
    <HiringFormShell
      formDef={formDef}
      employeeId={employeeId}
      employeeName={`${applicantData.firstName} ${applicantData.lastName}`.trim()}
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile}
      auditTrail={auditTrail}
    >
      <div className="space-y-8">
        {/* Employee & Position Info */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee Name</Label>
                <input
                  type="text"
                  value={data.employeeName}
                  onChange={(e) => updateField('employeeName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Position Applied For</Label>
                <input
                  type="text"
                  value={data.position}
                  onChange={(e) => updateField('position', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., Home Health Aide"
                />
              </div>
              <div>
                <Label>Job Title</Label>
                <select
                  value={data.jobTitle}
                  onChange={(e) => updateField('jobTitle', e.target.value as FormData['jobTitle'])}
                  className={INPUT_CLASS}
                >
                  <option value="">-- Select Job Title --</option>
                  <option value="HHA">HHA (Home Health Aide)</option>
                  <option value="CNA">CNA (Certified Nursing Assistant)</option>
                  <option value="STNA">STNA (State Tested Nursing Assistant)</option>
                </select>
              </div>
              <div>
                <Label>Supervisor / Reports To</Label>
                <input
                  type="text"
                  value={data.supervisorName}
                  onChange={(e) => updateField('supervisorName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Supervisor name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Summary */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Job Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed">
              {data.jobSummary}
            </div>
          </CardContent>
        </Card>

        {/* Essential Duties */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Essential Duties and Responsibilities</CardTitle>
              <Badge
                variant="default"
                className={
                  acknowledgedCount === ESSENTIAL_DUTIES.length
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }
              >
                {acknowledgedCount}/{ESSENTIAL_DUTIES.length} Acknowledged
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Please review each duty and check the box to acknowledge your understanding and acceptance of the responsibility.
            </p>
            <div className="space-y-3">
              {ESSENTIAL_DUTIES.map((duty, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={data.dutyAcknowledgments[idx] || false}
                    onChange={() => handleDutyToggle(idx)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-gray-800">
                      <span className="font-medium text-gray-500 mr-2">{idx + 1}.</span>
                      {duty}
                    </span>
                    {data.dutyAcknowledgments[idx] && (
                      <span className="ml-2 text-xs text-green-600 font-medium">Acknowledged</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Qualifications</CardTitle>
              <Badge
                variant="default"
                className={
                  qualCount === QUALIFICATIONS.length
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }
              >
                {qualCount}/{QUALIFICATIONS.length} Confirmed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Confirm that you meet each of the following qualification requirements.
            </p>
            <div className="space-y-3">
              {QUALIFICATIONS.map((qual, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={data.qualificationChecks[idx] || false}
                    onChange={() => handleQualToggle(idx)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-800">{qual}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment Statement */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary-200 bg-primary-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.readAndUnderstood}
                onChange={(e) => updateField('readAndUnderstood', e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-800">
                I have read and understand the duties and requirements of this position. I acknowledge that I am capable of performing the essential functions described above, with or without reasonable accommodation.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Employee E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {data.employeeSignature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={data.employeeSignature}
                  signerName={data.employeeName}
                  onClear={() => updateField('employeeSignature', null)}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Label>Date Signed</Label>
                  <span className="font-medium">{data.employeeSignatureDate}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <input
                    type="date"
                    value={data.employeeSignatureDate}
                    onChange={(e) => updateField('employeeSignatureDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <ESignature
                  onSign={handleEmployeeSignature}
                  signerName={data.employeeName}
                  attestationText="By signing below, I acknowledge that I have read and understand the job description, essential duties, and qualification requirements outlined above. I accept these responsibilities as a condition of my employment."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supervisor E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Supervisor Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {data.supervisorSignature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={data.supervisorSignature}
                  signerName={data.supervisorName}
                  onClear={() => updateField('supervisorSignature', null)}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Label>Date Signed</Label>
                  <span className="font-medium">{data.supervisorSignatureDate}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <input
                    type="date"
                    value={data.supervisorSignatureDate}
                    onChange={(e) => updateField('supervisorSignatureDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <ESignature
                  onSign={handleSupervisorSignature}
                  signerName={data.supervisorName}
                  attestationText="By signing below, I confirm that I have reviewed this job description with the employee and they understand the duties and requirements of this position."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
