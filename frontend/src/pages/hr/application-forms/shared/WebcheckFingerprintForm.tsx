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

const SLUG = 'webcheck-fingerprint';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FormData {
  employeeName: string;
  ssnMasked: string;
  dateOfBirth: string;
  fingerprintSite: string;
  scheduledDate: string;
  scheduledTime: string;
  reasonForFingerprinting: string;
  ocaNumber: string;
  trackingNumber: string;
  codeWords: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  ssnMasked: '',
  dateOfBirth: '',
  fingerprintSite: 'Serenity Care Partners LLC',
  scheduledDate: '',
  scheduledTime: '',
  reasonForFingerprinting: 'Employment — Home Health Care Provider',
  ocaNumber: '',
  trackingNumber: '',
  codeWords: '',
  signature: null,
};

function maskSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return ssn;
  return `***-**-${digits.slice(-4)}`;
}

export default function WebcheckFingerprintForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from shared applicant data
  useEffect(() => {
    const fullName = `${applicantData.firstName} ${applicantData.lastName}`.trim();
    if (fullName && !data.employeeName) {
      updateField('employeeName', fullName);
    }
    if (applicantData.ssn && !data.ssnMasked) {
      updateField('ssnMasked', maskSSN(applicantData.ssn));
    }
    if (applicantData.dateOfBirth && !data.dateOfBirth) {
      updateField('dateOfBirth', applicantData.dateOfBirth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName, applicantData.ssn, applicantData.dateOfBirth]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
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
      <div className="space-y-6">
        {/* Employee Info */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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
                <Label>SSN (Masked)</Label>
                <input
                  type="text"
                  value={data.ssnMasked}
                  readOnly
                  className={`${INPUT_CLASS} bg-gray-50`}
                  placeholder="***-**-1234"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-populated from application</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Fingerprint Information */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Fingerprint Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Fingerprint Site</Label>
                <select
                  value={data.fingerprintSite}
                  onChange={(e) => updateField('fingerprintSite', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="Serenity Care Partners LLC">Serenity Care Partners LLC</option>
                  <option value="IdentoGO - Columbus">IdentoGO - Columbus</option>
                  <option value="IdentoGO - Cleveland">IdentoGO - Cleveland</option>
                  <option value="IdentoGO - Cincinnati">IdentoGO - Cincinnati</option>
                  <option value="IdentoGO - Dayton">IdentoGO - Dayton</option>
                  <option value="IdentoGO - Toledo">IdentoGO - Toledo</option>
                  <option value="IdentoGO - Akron">IdentoGO - Akron</option>
                  <option value="other">Other Location</option>
                </select>
                {data.fingerprintSite === 'other' && (
                  <input
                    type="text"
                    value=""
                    onChange={(e) => updateField('fingerprintSite', e.target.value)}
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="Enter fingerprint site name and address"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Date</Label>
                  <input
                    type="date"
                    value={data.scheduledDate}
                    onChange={(e) => updateField('scheduledDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label>Scheduled Time</Label>
                  <input
                    type="time"
                    value={data.scheduledTime}
                    onChange={(e) => updateField('scheduledTime', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <Label>Reason for Fingerprinting</Label>
                <input
                  type="text"
                  value={data.reasonForFingerprinting}
                  onChange={(e) => updateField('reasonForFingerprinting', e.target.value)}
                  className={`${INPUT_CLASS} bg-gray-50`}
                  readOnly
                />
                <p className="text-xs text-gray-400 mt-1">Pre-filled for employment purposes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Information */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Tracking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>OCA (Originating Contributing Agency) Number</Label>
                <input
                  type="text"
                  value={data.ocaNumber}
                  onChange={(e) => updateField('ocaNumber', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="OCA number"
                />
              </div>
              <div>
                <Label>Tracking Number</Label>
                <input
                  type="text"
                  value={data.trackingNumber}
                  onChange={(e) => updateField('trackingNumber', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Webcheck tracking number"
                />
              </div>
              <div>
                <Label>Code Words</Label>
                <input
                  type="text"
                  value={data.codeWords}
                  onChange={(e) => updateField('codeWords', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Code words (if applicable)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Important Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">What to Bring to Your Fingerprint Appointment</h4>
              <ul className="list-disc ml-6 space-y-2 text-sm text-blue-700">
                <li>
                  <strong>Government-issued photo ID</strong> &mdash; valid driver's license, state ID card, or U.S. passport
                </li>
                <li>
                  A copy of this form or the tracking/confirmation number
                </li>
                <li>
                  Payment (if not pre-paid by Serenity Care Partners LLC)
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Ensure your hands are clean and free of cuts, bandages, or lotions.
                  If you have any skin condition affecting your fingertips, please notify us in advance.
                  Failed or unreadable prints may require a re-appointment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Authorization Signature</CardTitle>
          </CardHeader>
          <CardContent>
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
                attestationText="By signing below, I authorize Serenity Care Partners LLC to collect my fingerprints for the purpose of conducting a criminal background check through the Ohio Bureau of Criminal Investigation (BCI) and/or the Federal Bureau of Investigation (FBI) as required for employment."
                required
              />
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
