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

const SLUG = 'homemaker-qualifications';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const QUALIFICATION_REQUIREMENTS = [
  'At least 18 years of age',
  'Can read, write, and follow written/verbal instructions in English',
  'Has reliable transportation to and from client homes',
  'Has a valid Ohio driver\'s license (if driving for work)',
  'Has current automobile insurance (if driving for work)',
  'Has completed required orientation/training',
  'Has passed BCI/FBI background check',
  'Is physically capable of performing required duties',
  'Has no disqualifying criminal convictions per OAC 173-39-02',
  'Has current CPR/First Aid certification or will obtain within 90 days',
] as const;

interface QualificationEntry {
  met: 'yes' | 'no' | '';
  dateVerified: string;
}

interface FormData {
  employeeName: string;
  qualifications: QualificationEntry[];
  additionalQualifications: string;
  supervisorVerified: boolean;
  supervisorName: string;
  supervisorSignature: SignatureData | null;
  supervisorSignatureDate: string;
  employeeCertified: boolean;
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  qualifications: QUALIFICATION_REQUIREMENTS.map(() => ({ met: '' as const, dateVerified: '' })),
  additionalQualifications: '',
  supervisorVerified: false,
  supervisorName: '',
  supervisorSignature: null,
  supervisorSignatureDate: '',
  employeeCertified: false,
  employeeSignature: null,
  employeeSignatureDate: '',
};

export default function HomemakerQualForm() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName]);

  const verifiedCount = data.qualifications.filter((q) => q.met === 'yes').length;
  const answeredCount = data.qualifications.filter((q) => q.met !== '').length;
  const allMet = verifiedCount === QUALIFICATION_REQUIREMENTS.length;

  const handleQualChange = (index: number, field: keyof QualificationEntry, value: string) => {
    updateNestedField(`qualifications.${index}.${field}`, value);
  };

  const handleSupervisorSignature = (sigData: SignatureData) => {
    updateField('supervisorSignature', sigData);
    updateField('supervisorSignatureDate', new Date().toISOString().split('T')[0]);
  };

  const handleEmployeeSignature = (sigData: SignatureData) => {
    updateField('employeeSignature', sigData);
    updateField('employeeSignatureDate', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
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
        {/* Employee Info */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Qualification Requirements */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Qualification Requirements Verification</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className={
                    allMet
                      ? 'bg-green-100 text-green-700'
                      : answeredCount === QUALIFICATION_REQUIREMENTS.length
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }
                >
                  {verifiedCount}/{QUALIFICATION_REQUIREMENTS.length} Met
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Verify each qualification requirement with a Yes/No response and the date verified.
            </p>
            <div className="space-y-4">
              {QUALIFICATION_REQUIREMENTS.map((req, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    data.qualifications[idx]?.met === 'yes'
                      ? 'border-green-200 bg-green-50'
                      : data.qualifications[idx]?.met === 'no'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium text-gray-500 mt-1 min-w-[24px]">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 mb-3">{req}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Meets Requirement</Label>
                          <div className="flex items-center gap-4 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`qual-${idx}`}
                                value="yes"
                                checked={data.qualifications[idx]?.met === 'yes'}
                                onChange={() => handleQualChange(idx, 'met', 'yes')}
                                className="h-4 w-4 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm text-green-700 font-medium">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`qual-${idx}`}
                                value="no"
                                checked={data.qualifications[idx]?.met === 'no'}
                                onChange={() => handleQualChange(idx, 'met', 'no')}
                                className="h-4 w-4 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm text-red-700 font-medium">No</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Date Verified</Label>
                          <input
                            type="date"
                            value={data.qualifications[idx]?.dateVerified || ''}
                            onChange={(e) => handleQualChange(idx, 'dateVerified', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Qualifications */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Additional Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Certifications, Prior Experience, and Other Notes</Label>
            <textarea
              value={data.additionalQualifications}
              onChange={(e) => updateField('additionalQualifications', e.target.value)}
              className={INPUT_CLASS}
              rows={4}
              placeholder="List any additional certifications, relevant prior experience, special training, or other qualifications..."
            />
          </CardContent>
        </Card>

        {/* Supervisor Verification */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Supervisor Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary-200 bg-primary-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.supervisorVerified}
                  onChange={(e) => updateField('supervisorVerified', e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  I verify that the above individual meets all requirements for homemaker services as outlined by the Ohio Administrative Code and agency policy.
                </span>
              </label>

              <div>
                <Label>Supervisor Name</Label>
                <input
                  type="text"
                  value={data.supervisorName}
                  onChange={(e) => updateField('supervisorName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Supervisor full name"
                />
              </div>

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
                    attestationText="By signing below, I verify that I have reviewed the qualifications of the above individual and confirm they meet all requirements for homemaker services under Ohio Administrative Code."
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Acknowledgment */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary-200 bg-primary-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.employeeCertified}
                  onChange={(e) => updateField('employeeCertified', e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  I certify that the above information is true and accurate to the best of my knowledge. I understand that providing false information may result in termination of employment.
                </span>
              </label>

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
                    attestationText="By signing below, I certify that the information provided above is true and accurate to the best of my knowledge."
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
