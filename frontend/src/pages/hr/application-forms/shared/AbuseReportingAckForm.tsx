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

const SLUG = 'abuse-reporting-ack';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FormData {
  employeeName: string;
  date: string;
  ackObligations: boolean;
  ackContact: boolean;
  ackRetaliation: boolean;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  date: '',
  ackObligations: false,
  ackContact: false,
  ackRetaliation: false,
  signature: null,
};

export default function AbuseReportingAckForm() {
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

  const allChecked = data.ackObligations && data.ackContact && data.ackRetaliation;

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

        {/* Mandatory Reporting Obligations */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Mandatory Reporting Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              {/* Ohio Revised Code */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Ohio Revised Code Section 5101.61 &mdash; Mandatory Reporting</h4>
                <p>
                  Under Ohio Revised Code Section 5101.61, any person who has reasonable cause to believe that
                  an adult is being abused, neglected, or exploited, or is in a condition which is the result
                  of abuse, neglect, or exploitation, shall immediately report such belief to the county
                  department of job and family services. As an employee of Serenity Care Partners LLC providing
                  home health care services, you are a mandatory reporter under Ohio law.
                </p>
                <p className="mt-2">
                  Failure to report known or suspected abuse, neglect, or exploitation is a violation of
                  Ohio law and may result in criminal charges, civil liability, and immediate termination
                  of employment.
                </p>
              </section>

              {/* Types of Abuse */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Types of Abuse, Neglect, and Exploitation</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-800">Physical Abuse:</span>{' '}
                    Infliction of physical pain or injury, including hitting, slapping, pushing, kicking,
                    pinching, burning, or improper use of physical restraints or medications.
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Emotional/Verbal Abuse:</span>{' '}
                    Infliction of mental anguish through threats, intimidation, humiliation, harassment,
                    yelling, name-calling, isolation, or any other verbal or non-verbal conduct that
                    causes emotional distress.
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Sexual Abuse:</span>{' '}
                    Any non-consensual sexual contact or conduct, including unwanted touching, sexual
                    harassment, indecent exposure, or sexual exploitation.
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Financial Exploitation:</span>{' '}
                    Unauthorized use of an individual's funds, property, or assets, including theft,
                    forgery, fraud, misuse of power of attorney, or coercing changes to legal documents.
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Neglect:</span>{' '}
                    Failure to provide necessary care, supervision, or services to maintain physical and
                    mental health, including failure to provide food, shelter, clothing, medical care, or
                    personal hygiene assistance.
                  </div>
                </div>
              </section>

              {/* Signs and Indicators */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Signs and Indicators</h4>
                <p className="mb-2">Be alert for the following signs that may indicate abuse, neglect, or exploitation:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Unexplained bruises, burns, fractures, or other injuries</li>
                  <li>Poor hygiene, malnutrition, or dehydration</li>
                  <li>Unusual changes in behavior, withdrawal, or fearfulness</li>
                  <li>Unexplained changes in financial situation or missing belongings</li>
                  <li>Caregiver not allowing the individual to speak for themselves</li>
                  <li>Unsanitary or unsafe living conditions</li>
                  <li>Lack of necessary medical aids (glasses, dentures, hearing aids)</li>
                  <li>Conflicting accounts of incidents between the individual and caregiver</li>
                </ul>
              </section>

              {/* Reporting Procedure */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Reporting Procedure</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                  <p className="font-semibold text-red-800 mb-2">When to Report: IMMEDIATELY</p>
                  <p className="text-red-700">
                    Reports must be made immediately upon having reasonable cause to believe abuse,
                    neglect, or exploitation has occurred. Do not wait, investigate on your own, or
                    attempt to verify before reporting.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-800">Who to Call:</span>
                    <ul className="list-disc ml-6 mt-1 space-y-1">
                      <li><strong>Adult Protective Services (APS):</strong> Contact your county Department of Job and Family Services</li>
                      <li><strong>Law Enforcement:</strong> Call 911 if the individual is in immediate danger</li>
                      <li><strong>Ohio Long-Term Care Ombudsman:</strong> 1-800-282-1206</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">What to Document:</span>
                    <ul className="list-disc ml-6 mt-1 space-y-1">
                      <li>Name and location of the individual</li>
                      <li>Nature and extent of the suspected abuse, neglect, or exploitation</li>
                      <li>Names of suspected perpetrators (if known)</li>
                      <li>Any other information that may help establish cause or identity</li>
                      <li>Date, time, and your observations</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Serenity Internal Procedure */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Serenity Care Partners Internal Reporting Procedure</h4>
                <p>In addition to filing an external report with the appropriate authorities, you must also:</p>
                <ol className="list-decimal ml-6 mt-2 space-y-1">
                  <li>Immediately notify your direct supervisor</li>
                  <li>Contact the Serenity Care Partners Compliance Officer</li>
                  <li>Complete an internal incident report within 24 hours</li>
                  <li>Cooperate fully with any investigation</li>
                  <li>Maintain confidentiality about the report and investigation</li>
                </ol>
              </section>

              {/* Protection from Retaliation */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Protection from Retaliation</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    Ohio law protects individuals who make good-faith reports of suspected abuse, neglect,
                    or exploitation. Under Ohio Revised Code Section 5101.61(D), any person who makes a
                    report in good faith is immune from civil or criminal liability that might otherwise
                    be incurred. Serenity Care Partners LLC strictly prohibits retaliation against any
                    employee who makes a good-faith report. Retaliation will result in disciplinary action
                    up to and including termination.
                  </p>
                </div>
              </section>

              {/* Penalties for Failure to Report */}
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Penalties for Failure to Report</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800">
                    Failure to report known or suspected abuse, neglect, or exploitation is a misdemeanor
                    under Ohio law. Penalties may include fines, criminal charges, and professional license
                    revocation. Additionally, failure to report will result in immediate termination of
                    employment with Serenity Care Partners LLC and may result in civil liability for any
                    harm that occurs as a result of the failure to report.
                  </p>
                </div>
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
                  checked={data.ackObligations}
                  onChange={(e) => updateField('ackObligations', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I understand my mandatory reporting obligations under Ohio Revised Code Section 5101.61 and
                  will immediately report any known or suspected abuse, neglect, or exploitation.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.ackContact}
                  onChange={(e) => updateField('ackContact', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I know who to contact to make a report, including Adult Protective Services, law enforcement,
                  my supervisor, and the Serenity Care Partners Compliance Officer.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.ackRetaliation}
                  onChange={(e) => updateField('ackRetaliation', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I understand that I am protected from retaliation for making good-faith reports and that
                  failure to report may result in criminal penalties and termination of employment.
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
                attestationText="By signing below, I acknowledge that I have read, understand, and will comply with the mandatory reporting obligations for abuse, neglect, and exploitation as outlined above and in accordance with Ohio Revised Code Section 5101.61."
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
