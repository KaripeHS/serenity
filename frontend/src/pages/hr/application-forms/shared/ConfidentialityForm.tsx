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

const SLUG = 'confidentiality-agreement';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FormData {
  employeeName: string;
  date: string;
  ackRead: boolean;
  ackMaintain: boolean;
  ackViolation: boolean;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  date: '',
  ackRead: false,
  ackMaintain: false,
  ackViolation: false,
  signature: null,
};

export default function ConfidentialityForm() {
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

  const allChecked = data.ackRead && data.ackMaintain && data.ackViolation;

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

        {/* Confidentiality Agreement Text */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Confidentiality Agreement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              {/* HIPAA */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">1. HIPAA &mdash; Protected Health Information (PHI)</h4>
                <p>
                  As an employee of Serenity Care Partners LLC, you will have access to Protected Health
                  Information (PHI) as defined by the Health Insurance Portability and Accountability Act
                  of 1996 (HIPAA). PHI includes any individually identifiable health information, whether
                  oral, written, or electronic, that relates to an individual's past, present, or future
                  physical or mental health condition, the provision of health care, or payment for health care.
                </p>
                <p className="mt-2">
                  You must protect the privacy of all PHI in accordance with HIPAA regulations, including
                  the Privacy Rule (45 CFR Part 160 and Subparts A and E of Part 164) and the Security Rule
                  (45 CFR Part 160 and Subparts A and C of Part 164). Unauthorized access, use, or disclosure
                  of PHI is strictly prohibited.
                </p>
              </section>

              {/* Company Proprietary Information */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">2. Company Proprietary and Confidential Business Information</h4>
                <p>
                  Confidential business information includes, but is not limited to: business strategies,
                  financial data, marketing plans, employee records, operational procedures, vendor
                  contracts, pricing information, and any other information not publicly available.
                  You shall not disclose, publish, or otherwise reveal any confidential business
                  information to any third party during or after your employment without prior written
                  authorization from management.
                </p>
              </section>

              {/* Client Personal Information */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">3. Client Personal Information</h4>
                <p>
                  In the course of providing home health care services, you will have access to clients'
                  personal information including but not limited to: home addresses, daily schedules,
                  family members, care plans, medications, diagnoses, financial information, and personal
                  preferences. This information must be treated with the utmost confidentiality and used
                  solely for the purpose of providing care services. You must never share client information
                  with anyone outside the care team without proper authorization.
                </p>
              </section>

              {/* Electronic Records */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">4. Electronic Records and System Access</h4>
                <p>
                  Access credentials to company systems, including electronic health record (EHR) systems,
                  scheduling software, and communication platforms, are assigned individually and must not
                  be shared with any other person. You must log out of systems when not in use, use strong
                  passwords, and report any suspected security breaches immediately to your supervisor or
                  the IT department. Downloading, copying, or transmitting client or company data to personal
                  devices or unauthorized systems is strictly prohibited.
                </p>
              </section>

              {/* Social Media */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">5. Social Media Policy Regarding Clients</h4>
                <p>
                  You must never post, share, or reference any information about clients on any social
                  media platform, including but not limited to Facebook, Instagram, Twitter, TikTok, or
                  any other public or semi-public forum. This includes photographs, descriptions of care
                  activities, client names, locations, or any information that could be used to identify
                  a client. Even well-intentioned posts can violate client privacy and HIPAA regulations.
                </p>
              </section>

              {/* Consequences */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">6. Consequences of Unauthorized Disclosure</h4>
                <p>
                  Unauthorized disclosure of confidential information may result in:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Immediate termination of employment</li>
                  <li>Civil liability and monetary damages</li>
                  <li>Criminal penalties under HIPAA (fines up to $250,000 and/or imprisonment up to 10 years)</li>
                  <li>Professional license revocation or suspension</li>
                  <li>Reporting to appropriate regulatory authorities</li>
                </ul>
                <p className="mt-2">
                  The obligation to maintain confidentiality continues indefinitely after the termination
                  of your employment with Serenity Care Partners LLC.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment Checkboxes */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.ackRead}
                  onChange={(e) => updateField('ackRead', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I have read and understand the confidentiality requirements outlined above.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.ackMaintain}
                  onChange={(e) => updateField('ackMaintain', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to maintain confidentiality during and after my employment with Serenity Care Partners LLC.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.ackViolation}
                  onChange={(e) => updateField('ackViolation', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I understand that violation of this agreement may result in immediate termination of employment and legal action.
                </span>
              </label>

              {!allChecked && (
                <p className="text-sm text-amber-600">
                  Please acknowledge all three statements above before signing.
                </p>
              )}
            </div>
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
                attestationText="By signing below, I acknowledge that I have read, understand, and agree to comply with the Confidentiality Agreement of Serenity Care Partners LLC. I understand that violation of this agreement may result in disciplinary action, up to and including termination, and may also subject me to civil and criminal liability."
                required
                disabled={!allChecked}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
