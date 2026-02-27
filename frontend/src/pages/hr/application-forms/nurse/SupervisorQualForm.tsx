import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'supervisor-qualification';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const QUALIFICATION_REQUIREMENTS = [
  'Holds current, unrestricted RN/LPN license in Ohio',
  'Minimum 2 years of clinical nursing experience',
  'Minimum 1 year of supervisory experience (preferred)',
  'Experience in home health or community-based care',
  'Knowledge of Ohio Administrative Code for home health agencies',
  'CPR/First Aid certification current',
  'BCI/FBI background check cleared',
  'Competent in assessment, care planning, and supervision',
] as const;

interface ProfessionalReference {
  name: string;
  title: string;
  organization: string;
  phone: string;
  email: string;
  yearsKnown: string;
}

interface FormData {
  employeeName: string;
  position: 'RN Supervisor' | 'LPN Supervisor' | '';
  licenseType: 'RN' | 'LPN' | '';
  licenseNumber: string;
  stateOfLicensure: string;
  licenseExpiration: string;
  licenseVerificationDate: string;
  qualifications: ('yes' | 'no' | '')[];
  additionalCertifications: string;
  references: [ProfessionalReference, ProfessionalReference];
  licenseDocumentName: string;
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
  hrDirectorSignature: SignatureData | null;
  hrDirectorSignatureDate: string;
}

const DEFAULT_REFERENCE: ProfessionalReference = {
  name: '',
  title: '',
  organization: '',
  phone: '',
  email: '',
  yearsKnown: '',
};

const DEFAULT_DATA: FormData = {
  employeeName: '',
  position: '',
  licenseType: '',
  licenseNumber: '',
  stateOfLicensure: 'Ohio',
  licenseExpiration: '',
  licenseVerificationDate: '',
  qualifications: new Array(QUALIFICATION_REQUIREMENTS.length).fill(''),
  additionalCertifications: '',
  references: [{ ...DEFAULT_REFERENCE }, { ...DEFAULT_REFERENCE }],
  licenseDocumentName: '',
  employeeSignature: null,
  employeeSignatureDate: '',
  hrDirectorSignature: null,
  hrDirectorSignatureDate: '',
};

export default function SupervisorQualForm() {
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

  const qualYesCount = data.qualifications.filter((q) => q === 'yes').length;
  const qualAnswered = data.qualifications.filter((q) => q !== '').length;

  const handleQualChange = (index: number, value: 'yes' | 'no') => {
    const updated = [...data.qualifications];
    updated[index] = value;
    updateField('qualifications', updated);
  };

  const handleRefChange = (refIdx: number, field: keyof ProfessionalReference, value: string) => {
    updateNestedField(`references.${refIdx}.${field}`, value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      addUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        dataUrl: reader.result as string,
      });
      updateField('licenseDocumentName', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleEmployeeSignature = (sigData: SignatureData) => {
    updateField('employeeSignature', sigData);
    updateField('employeeSignatureDate', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleHRDirectorSignature = (sigData: SignatureData) => {
    updateField('hrDirectorSignature', sigData);
    updateField('hrDirectorSignatureDate', new Date().toISOString().split('T')[0]);
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
                <Label>Position</Label>
                <select
                  value={data.position}
                  onChange={(e) => updateField('position', e.target.value as FormData['position'])}
                  className={INPUT_CLASS}
                >
                  <option value="">-- Select Position --</option>
                  <option value="RN Supervisor">RN Supervisor</option>
                  <option value="LPN Supervisor">LPN Supervisor</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>License Type</Label>
                <select
                  value={data.licenseType}
                  onChange={(e) => updateField('licenseType', e.target.value as FormData['licenseType'])}
                  className={INPUT_CLASS}
                >
                  <option value="">-- Select --</option>
                  <option value="RN">RN (Registered Nurse)</option>
                  <option value="LPN">LPN (Licensed Practical Nurse)</option>
                </select>
              </div>
              <div>
                <Label>License Number</Label>
                <input
                  type="text"
                  value={data.licenseNumber}
                  onChange={(e) => updateField('licenseNumber', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., RN.123456"
                />
              </div>
              <div>
                <Label>State of Licensure</Label>
                <input
                  type="text"
                  value={data.stateOfLicensure}
                  onChange={(e) => updateField('stateOfLicensure', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Ohio"
                />
              </div>
              <div>
                <Label>License Expiration Date</Label>
                <input
                  type="date"
                  value={data.licenseExpiration}
                  onChange={(e) => updateField('licenseExpiration', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="md:col-span-2">
                <Label>License Verification Date (HR verifies with state board)</Label>
                <input
                  type="date"
                  value={data.licenseVerificationDate}
                  onChange={(e) => updateField('licenseVerificationDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualification Requirements */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Qualification Requirements</CardTitle>
              <Badge
                variant="default"
                className={
                  qualYesCount === QUALIFICATION_REQUIREMENTS.length
                    ? 'bg-green-100 text-green-700'
                    : qualAnswered === QUALIFICATION_REQUIREMENTS.length
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-yellow-100 text-yellow-700'
                }
              >
                {qualYesCount}/{QUALIFICATION_REQUIREMENTS.length} Met
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Indicate whether the candidate meets each qualification requirement.
            </p>
            <div className="space-y-3">
              {QUALIFICATION_REQUIREMENTS.map((req, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    data.qualifications[idx] === 'yes'
                      ? 'border-green-200 bg-green-50'
                      : data.qualifications[idx] === 'no'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium text-gray-500 mt-0.5 min-w-[24px]">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 mb-2">{req}</p>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`qual-${idx}`}
                            value="yes"
                            checked={data.qualifications[idx] === 'yes'}
                            onChange={() => handleQualChange(idx, 'yes')}
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700 font-medium">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`qual-${idx}`}
                            value="no"
                            checked={data.qualifications[idx] === 'no'}
                            onChange={() => handleQualChange(idx, 'no')}
                            className="h-4 w-4 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700 font-medium">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Certifications */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Additional Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>List any additional certifications, specialized training, or continuing education</Label>
            <textarea
              value={data.additionalCertifications}
              onChange={(e) => updateField('additionalCertifications', e.target.value)}
              className={INPUT_CLASS}
              rows={4}
              placeholder="e.g., Wound Care Certification, IV Therapy Certification, OASIS training, etc."
            />
          </CardContent>
        </Card>

        {/* Professional References */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Professional References (2 Required)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.references.map((ref, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Reference {idx + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => handleRefChange(idx, 'name', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <input
                        type="text"
                        value={ref.title}
                        onChange={(e) => handleRefChange(idx, 'title', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Professional title"
                      />
                    </div>
                    <div>
                      <Label>Organization</Label>
                      <input
                        type="text"
                        value={ref.organization}
                        onChange={(e) => handleRefChange(idx, 'organization', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Organization name"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <input
                        type="tel"
                        value={ref.phone}
                        onChange={(e) => handleRefChange(idx, 'phone', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <input
                        type="email"
                        value={ref.email}
                        onChange={(e) => handleRefChange(idx, 'email', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>Years Known</Label>
                      <input
                        type="text"
                        value={ref.yearsKnown}
                        onChange={(e) => handleRefChange(idx, 'yearsKnown', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="e.g., 5 years"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* License Verification Document Upload */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>License Verification Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Upload a copy of the nursing license or state board verification document.
              </p>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-500">
                    Choose File
                  </span>
                </label>
                {data.licenseDocumentName && (
                  <span className="text-sm text-gray-600">
                    Uploaded: <span className="font-medium">{data.licenseDocumentName}</span>
                  </span>
                )}
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="default" className="bg-blue-100 text-blue-700 text-[10px]">
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                        <span className="text-gray-700">{file.name}</span>
                        <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(idx)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  attestationText="By signing below, I certify that the information provided in this form is true, accurate, and complete. I understand that any misrepresentation may be grounds for termination."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* HR Director E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>HR Director Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {data.hrDirectorSignature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={data.hrDirectorSignature}
                  signerName="HR Director"
                  onClear={() => updateField('hrDirectorSignature', null)}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Label>Date Signed</Label>
                  <span className="font-medium">{data.hrDirectorSignatureDate}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <input
                    type="date"
                    value={data.hrDirectorSignatureDate}
                    onChange={(e) => updateField('hrDirectorSignatureDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <ESignature
                  onSign={handleHRDirectorSignature}
                  signerName="HR Director"
                  attestationText="By signing below, I certify that I have reviewed the qualifications, license verification, and references for the above individual. I confirm they meet all requirements for the supervisor role at Serenity Care Partners LLC."
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
