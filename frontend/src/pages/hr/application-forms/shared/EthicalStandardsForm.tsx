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

const SLUG = 'oac-ethical-standards';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const ETHICAL_STANDARDS = [
  {
    number: 1,
    text: 'Provider shall not solicit or receive anything of value from the individual receiving services.',
  },
  {
    number: 2,
    text: 'Provider shall not borrow money or property from the individual.',
  },
  {
    number: 3,
    text: 'Provider shall not have the individual sign any legal documents on behalf of the provider.',
  },
  {
    number: 4,
    text: 'Provider shall not use the individual\'s property for personal use.',
  },
  {
    number: 5,
    text: 'Provider shall not sell goods or services to the individual.',
  },
  {
    number: 6,
    text: 'Provider shall not engage in sexual conduct with the individual.',
  },
  {
    number: 7,
    text: 'Provider shall maintain professional boundaries at all times.',
  },
  {
    number: 8,
    text: 'Provider shall not use alcohol or non-prescribed drugs while providing services.',
  },
  {
    number: 9,
    text: 'Provider shall not misrepresent qualifications, competencies, or credentials.',
  },
  {
    number: 10,
    text: 'Provider shall report any known or suspected abuse, neglect, or exploitation.',
  },
];

interface FormData {
  employeeName: string;
  date: string;
  acknowledgments: boolean[];
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  date: '',
  acknowledgments: new Array(10).fill(false),
  signature: null,
};

export default function EthicalStandardsForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, updateNestedField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from shared applicant data
  useEffect(() => {
    const fullName = `${applicantData.firstName} ${applicantData.lastName}`.trim();
    if (fullName && !data.employeeName) {
      updateField('employeeName', fullName);
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

  const handleToggleAcknowledgment = (index: number) => {
    const updated = [...data.acknowledgments];
    updated[index] = !updated[index];
    updateField('acknowledgments', updated);
  };

  const acknowledgedCount = data.acknowledgments.filter(Boolean).length;
  const allAcknowledged = acknowledgedCount === 10;

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

        {/* OAC Standards */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>OAC 173-39-02(B)(8) Ethical Standards</CardTitle>
              <Badge
                variant="default"
                className={allAcknowledged ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
              >
                {acknowledgedCount}/10 Acknowledged
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                The following ethical standards are established under Ohio Administrative Code 173-39-02(B)(8).
                As a provider of home health services, you are required to understand and comply with each standard.
                Please read each item carefully and check the acknowledgment box.
              </p>
            </div>

            <div className="space-y-4">
              {ETHICAL_STANDARDS.map((standard, idx) => (
                <div
                  key={standard.number}
                  className={`p-4 rounded-lg border ${
                    data.acknowledgments[idx]
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`standard-${standard.number}`}
                      checked={data.acknowledgments[idx] || false}
                      onChange={() => handleToggleAcknowledgment(idx)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor={`standard-${standard.number}`} className="flex-1 cursor-pointer">
                      <span className="text-sm font-semibold text-gray-700">{standard.number}.</span>{' '}
                      <span className="text-sm text-gray-700">{standard.text}</span>
                      {data.acknowledgments[idx] && (
                        <span className="ml-2 text-xs text-green-600 font-medium">Acknowledged</span>
                      )}
                    </label>
                  </div>
                </div>
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
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                I have read and understand the ethical standards set forth in Ohio Administrative Code
                173-39-02(B)(8) as listed above. I agree to abide by these standards in my role as a
                home health care provider. I understand that failure to comply with these standards may
                result in disciplinary action, including termination of employment, and may also result
                in action by the Ohio Department of Aging or other regulatory agencies.
              </p>
            </div>
            {!allAcknowledged && (
              <p className="mt-3 text-sm text-amber-600">
                Please acknowledge all 10 ethical standards above before signing.
              </p>
            )}
          </CardContent>
        </Card>

        {/* E-Signature */}
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
                attestationText="By signing below, I acknowledge that I have read, understand, and agree to comply with all ethical standards outlined in OAC 173-39-02(B)(8) as listed above."
                required
                disabled={!allAcknowledged}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
