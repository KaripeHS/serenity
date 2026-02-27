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

const SLUG = 'handbook-ack-hiring';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FormData {
  employeeName: string;
  hireDate: string;
  atWillAcknowledged: boolean;
  receivedHandbook: boolean;
  responsibleForReading: boolean;
  understandUpdates: boolean;
  signatureDate: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  hireDate: '',
  atWillAcknowledged: false,
  receivedHandbook: false,
  responsibleForReading: false,
  understandUpdates: false,
  signatureDate: '',
  signature: null,
};

export default function HandbookAckForm() {
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
    if (applicantData.hireDate && !data.hireDate) {
      updateField('hireDate', applicantData.hireDate);
    } else if (applicantData.startDate && !data.hireDate) {
      updateField('hireDate', applicantData.startDate);
    }
    if (!data.signatureDate) {
      updateField('signatureDate', new Date().toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName, applicantData.hireDate, applicantData.startDate]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
  };

  const allChecked = data.atWillAcknowledged && data.receivedHandbook && data.responsibleForReading && data.understandUpdates;

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
                <Label>Hire Date</Label>
                <input
                  type="date"
                  value={data.hireDate}
                  onChange={(e) => updateField('hireDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Handbook Acknowledgment */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Handbook Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 leading-relaxed">
                  I acknowledge that I have received a copy of the Serenity Care Partners LLC Employee
                  Handbook. I understand that it is my responsibility to read and comply with the policies
                  contained in this handbook.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At-Will Employment / IO Waiver */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>At-Will Employment Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-gray-800 leading-relaxed">
                  I acknowledge that my employment with Serenity Care Partners LLC is "at-will". This
                  means that either I or the company may terminate the employment relationship at any
                  time, with or without cause or notice. No supervisor, manager, or representative of
                  the company has the authority to enter into any agreement with me for employment for
                  any specified period of time or to make any promises or commitments contrary to the
                  at-will nature of my employment.
                </p>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.atWillAcknowledged}
                  onChange={(e) => updateField('atWillAcknowledged', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 font-medium">
                  I understand the at-will nature of my employment
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Additional Acknowledgments */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                Additional Acknowledgments
                <Badge variant="default" className={allChecked ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-gray-100 text-gray-500 text-[10px]'}>
                  {[data.atWillAcknowledged, data.receivedHandbook, data.responsibleForReading, data.understandUpdates].filter(Boolean).length}/4 Acknowledged
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.receivedHandbook}
                  onChange={(e) => updateField('receivedHandbook', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I have received the Employee Handbook
                </span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.responsibleForReading}
                  onChange={(e) => updateField('responsibleForReading', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I understand I am responsible for reading and following all policies
                </span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.understandUpdates}
                  onChange={(e) => updateField('understandUpdates', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I understand the handbook may be updated and I will be notified of changes
                </span>
              </label>
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

              {!allChecked && !data.signature && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    Please acknowledge all items above before signing.
                  </p>
                </div>
              )}

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
                  attestationText="By signing below, I acknowledge that I have received and reviewed the Employee Handbook, I understand the at-will nature of my employment, and I agree to comply with all company policies."
                  required
                  disabled={!allChecked}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
