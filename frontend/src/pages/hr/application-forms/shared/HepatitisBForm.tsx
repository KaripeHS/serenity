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

const SLUG = 'hepatitis-b';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const OSHA_DECLINATION_TEXT =
  'I understand that due to my occupational exposure to blood or other potentially infectious materials I may be at risk of acquiring hepatitis B virus (HBV) infection. I have been given the opportunity to be vaccinated with hepatitis B vaccine, at no charge to myself. However, I decline hepatitis B vaccination at this time. I understand that by declining this vaccine, I continue to be at risk of acquiring hepatitis B, a serious disease. If in the future I continue to have occupational exposure to blood or other potentially infectious materials and I want to be vaccinated with hepatitis B vaccine, I can receive the vaccination series at no charge to me.';

interface FormData {
  employeeName: string;
  date: string;
  decision: 'accept' | 'decline' | '';
  // Acceptance fields
  dose1Date: string;
  dose2Date: string;
  dose3Date: string;
  // Declination fields
  declinationAcknowledged: boolean;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  date: '',
  decision: '',
  dose1Date: '',
  dose2Date: '',
  dose3Date: '',
  declinationAcknowledged: false,
  signature: null,
};

export default function HepatitisBForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from applicantData
  useEffect(() => {
    if (applicantData.firstName && !data.employeeName) {
      updateField('employeeName', `${applicantData.firstName} ${applicantData.lastName}`.trim());
    }
    if (!data.date) {
      updateField('date', new Date().toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName]);

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
      <div className="space-y-8">
        {/* Employee Information */}
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
                  placeholder="Full legal name"
                />
              </div>
              <div>
                <Label>Date</Label>
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Hepatitis B Vaccination Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                As an employee who may have occupational exposure to blood or other potentially infectious
                materials, you are being offered the Hepatitis B vaccination series at no cost. Please
                indicate your decision below.
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hepBDecision"
                    value="accept"
                    checked={data.decision === 'accept'}
                    onChange={() => updateField('decision', 'accept')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-green-700">Accept</span>
                    <p className="text-xs text-gray-500 mt-0.5">I wish to receive the Hepatitis B vaccination series</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hepBDecision"
                    value="decline"
                    checked={data.decision === 'decline'}
                    onChange={() => updateField('decision', 'decline')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-red-700">Decline</span>
                    <p className="text-xs text-gray-500 mt-0.5">I decline the Hepatitis B vaccination at this time</p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accept — Vaccination Tracking */}
        {data.decision === 'accept' && (
          <Card padding={false}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  Vaccination Tracking
                  <Badge variant="default" className="bg-green-100 text-green-700 text-[10px]">Accepted</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    I wish to receive the Hepatitis B vaccination series at no cost to me. The vaccination
                    schedule consists of three doses administered over a six-month period.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Dose 1 Date</Label>
                    <input
                      type="date"
                      value={data.dose1Date}
                      onChange={(e) => updateField('dose1Date', e.target.value)}
                      className={INPUT_CLASS}
                    />
                    <p className="text-xs text-gray-400 mt-1">Initial dose</p>
                  </div>
                  <div>
                    <Label>Dose 2 Date</Label>
                    <input
                      type="date"
                      value={data.dose2Date}
                      onChange={(e) => updateField('dose2Date', e.target.value)}
                      className={INPUT_CLASS}
                    />
                    <p className="text-xs text-gray-400 mt-1">1 month after Dose 1</p>
                  </div>
                  <div>
                    <Label>Dose 3 Date</Label>
                    <input
                      type="date"
                      value={data.dose3Date}
                      onChange={(e) => updateField('dose3Date', e.target.value)}
                      className={INPUT_CLASS}
                    />
                    <p className="text-xs text-gray-400 mt-1">6 months after Dose 1</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Dates will be filled in as each dose is administered. Leave blank until vaccination is given.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decline — OSHA Declination */}
        {data.decision === 'decline' && (
          <Card padding={false}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  OSHA Declination Statement
                  <Badge variant="default" className="bg-red-100 text-red-700 text-[10px]">Declined</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {OSHA_DECLINATION_TEXT}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="declination-ack"
                    checked={data.declinationAcknowledged}
                    onChange={(e) => updateField('declinationAcknowledged', e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="declination-ack" className="text-sm text-gray-700 font-medium">
                    I have read and understand the above declination statement
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* E-Signature */}
        {data.decision && (
          <Card padding={false}>
            <CardHeader>
              <CardTitle>Employee Signature</CardTitle>
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
                  attestationText={
                    data.decision === 'accept'
                      ? 'By signing below, I confirm my decision to accept the Hepatitis B vaccination series at no cost to me.'
                      : 'By signing below, I confirm that I have read and understand the OSHA Hepatitis B declination statement above, and I voluntarily decline the vaccination at this time.'
                  }
                  required
                  disabled={data.decision === 'decline' && !data.declinationAcknowledged}
                />
              )}
              {data.decision === 'decline' && !data.declinationAcknowledged && !data.signature && (
                <p className="text-xs text-amber-600 mt-2">
                  You must acknowledge the declination statement above before signing.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </HiringFormShell>
  );
}
