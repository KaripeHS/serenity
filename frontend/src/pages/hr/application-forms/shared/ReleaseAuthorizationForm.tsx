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

const SLUG = 'release-authorization';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const RELEASE_TYPES = [
  { key: 'employmentDates', label: 'Employment dates and position' },
  { key: 'jobPerformance', label: 'Job performance evaluations' },
  { key: 'attendance', label: 'Attendance records' },
  { key: 'separationReason', label: 'Reason for separation' },
  { key: 'trainingCerts', label: 'Training and certification records' },
  { key: 'backgroundCheck', label: 'Background check results' },
] as const;

interface FormData {
  employeeName: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  authorizedReleaseTypes: Record<string, boolean>;
  signatureDate: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  ssn: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  authorizedReleaseTypes: {
    employmentDates: false,
    jobPerformance: false,
    attendance: false,
    separationReason: false,
    trainingCerts: false,
    backgroundCheck: false,
  },
  signatureDate: '',
  signature: null,
};

function maskSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length <= 4) return ssn;
  return '***-**-' + digits.slice(-4);
}

export default function ReleaseAuthorizationForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, updateNestedField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from applicantData
  useEffect(() => {
    if (applicantData.firstName && !data.employeeName) {
      updateField('employeeName', `${applicantData.firstName} ${applicantData.lastName}`.trim());
    }
    if (applicantData.ssn && !data.ssn) {
      updateField('ssn', applicantData.ssn);
    }
    if (applicantData.dateOfBirth && !data.dateOfBirth) {
      updateField('dateOfBirth', applicantData.dateOfBirth);
    }
    if (applicantData.address && !data.address) {
      updateField('address', applicantData.address);
    }
    if (applicantData.city && !data.city) {
      updateField('city', applicantData.city);
    }
    if (applicantData.state && !data.state) {
      updateField('state', applicantData.state);
    }
    if (applicantData.zip && !data.zip) {
      updateField('zip', applicantData.zip);
    }
    if (!data.signatureDate) {
      updateField('signatureDate', new Date().toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName, applicantData.ssn, applicantData.dateOfBirth, applicantData.address, applicantData.city, applicantData.state, applicantData.zip]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
  };

  const toggleReleaseType = (key: string) => {
    updateNestedField(`authorizedReleaseTypes.${key}`, !data.authorizedReleaseTypes[key]);
  };

  const selectedCount = Object.values(data.authorizedReleaseTypes).filter(Boolean).length;

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
        {/* Employee Information */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Employee Name</Label>
                <input
                  type="text"
                  value={data.employeeName}
                  onChange={(e) => updateField('employeeName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Full legal name"
                />
              </div>
              <div>
                <Label>Social Security Number</Label>
                <div className="relative">
                  <input
                    type="text"
                    value={maskSSN(data.ssn)}
                    readOnly
                    className={`${INPUT_CLASS} bg-gray-50`}
                    placeholder="***-**-****"
                  />
                  <Badge variant="default" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-500 text-[9px]">
                    Masked
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <input
                  type="date"
                  value={data.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label>City</Label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <input
                    type="text"
                    value={data.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <input
                    type="text"
                    value={data.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authorization Statement */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Authorization to Release Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 leading-relaxed">
                  I hereby authorize Serenity Care Partners LLC to release information regarding my
                  employment to authorized parties including but not limited to: government agencies,
                  licensing boards, potential future employers (upon request), and insurance providers.
                </p>
              </div>

              {/* Release Types */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Types of Information Authorized for Release</Label>
                  <Badge variant="default" className={selectedCount === RELEASE_TYPES.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {selectedCount}/{RELEASE_TYPES.length} Selected
                  </Badge>
                </div>
                <div className="space-y-2">
                  {RELEASE_TYPES.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={data.authorizedReleaseTypes[key] || false}
                        onChange={() => toggleReleaseType(key)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  This authorization is valid for the duration of my employment and <strong>2 years after separation</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Signature Date</Label>
                  <input
                    type="date"
                    value={data.signatureDate}
                    onChange={(e) => updateField('signatureDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {data.signature ? (
                <SignatureDisplay
                  signatureData={data.signature}
                  signerName={data.employeeName}
                  onClear={handleClearSignature}
                />
              ) : (
                <ESignature
                  onSign={handleSignature}
                  signerName={data.employeeName}
                  attestationText="By signing below, I authorize Serenity Care Partners LLC to release the selected categories of employment information to authorized parties as described above."
                  required
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
