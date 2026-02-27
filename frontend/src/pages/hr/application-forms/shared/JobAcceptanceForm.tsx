import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'job-acceptance';

type EmploymentType = '' | 'full-time' | 'part-time' | 'prn';
type PayType = '' | 'hourly' | 'salary';
type PayFrequency = '' | 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

interface JobAcceptanceFormData {
  employeeName: string;
  positionOffered: string;
  department: string;
  employmentType: EmploymentType;
  wage: string;
  payType: PayType;
  payFrequency: PayFrequency;
  benefitsEligible: '' | 'yes' | 'no';
  benefitsNotes: string;
  startDate: string;
  reportingSupervisor: string;
  workLocation: string;
  conditionalEmploymentAgreed: boolean;
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
  hrRepName: string;
  hrSignature: SignatureData | null;
  hrSignatureDate: string;
}

const DEFAULT_DATA: JobAcceptanceFormData = {
  employeeName: '',
  positionOffered: '',
  department: '',
  employmentType: '',
  wage: '',
  payType: '',
  payFrequency: '',
  benefitsEligible: '',
  benefitsNotes: '',
  startDate: '',
  reportingSupervisor: '',
  workLocation: '',
  conditionalEmploymentAgreed: false,
  employeeSignature: null,
  employeeSignatureDate: new Date().toISOString().split('T')[0],
  hrRepName: '',
  hrSignature: null,
  hrSignatureDate: new Date().toISOString().split('T')[0],
};

const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

export default function JobAcceptanceForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;

  const {
    data,
    updateField,
    resetForm,
    lastSaved,
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    auditTrail,
  } = useFormPersistence<JobAcceptanceFormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  const {
    applicantData,
    markFormStatus,
    syncFormToServer,
    updateSharedField,
  } = useHiringFormData(employeeId);

  // Auto-populate from shared applicant data
  useEffect(() => {
    if (applicantData.firstName || applicantData.lastName) {
      const fullName = [applicantData.firstName, applicantData.middleName, applicantData.lastName]
        .filter(Boolean)
        .join(' ');
      if (fullName && !data.employeeName) {
        updateField('employeeName', fullName);
      }
    }
    if (applicantData.positionAppliedFor && !data.positionOffered) {
      updateField('positionOffered', applicantData.positionAppliedFor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData]);

  const handleEmployeeSign = (sig: SignatureData) => {
    updateField('employeeSignature', sig);
    updateField('employeeSignatureDate', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>);

    // Update shared fields so downstream forms can use hire/wage info
    if (data.startDate) {
      updateSharedField('hireDate', data.startDate);
      updateSharedField('startDate', data.startDate);
    }
    if (data.wage) {
      updateSharedField('wage', data.wage);
    }
    if (data.payType) {
      updateSharedField('wageType', data.payType as 'hourly' | 'salary');
    }
  };

  const handleHrSign = (sig: SignatureData) => {
    updateField('hrSignature', sig);
    updateField('hrSignatureDate', new Date().toISOString().split('T')[0]);
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>);
  };

  return (
    <HiringFormShell
      formDef={formDef}
      employeeId={employeeId}
      employeeName={data.employeeName}
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile}
      auditTrail={auditTrail}
    >
      {/* Position Details */}
      <Card>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ja-employeeName">Employee Name</Label>
              <input
                id="ja-employeeName"
                type="text"
                value={data.employeeName}
                onChange={(e) => updateField('employeeName', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="ja-positionOffered">Position Offered</Label>
              <input
                id="ja-positionOffered"
                type="text"
                value={data.positionOffered}
                onChange={(e) => updateField('positionOffered', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ja-department">Department / Pod Assignment</Label>
              <input
                id="ja-department"
                type="text"
                value={data.department}
                onChange={(e) => updateField('department', e.target.value)}
                placeholder="e.g., Pod A — Franklin County"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="ja-workLocation">Work Location</Label>
              <input
                id="ja-workLocation"
                type="text"
                value={data.workLocation}
                onChange={(e) => updateField('workLocation', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <Label>Employment Type <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="employmentType"
                  value="full-time"
                  checked={data.employmentType === 'full-time'}
                  onChange={() => updateField('employmentType', 'full-time')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Full-Time</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="employmentType"
                  value="part-time"
                  checked={data.employmentType === 'part-time'}
                  onChange={() => updateField('employmentType', 'part-time')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Part-Time</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="employmentType"
                  value="prn"
                  checked={data.employmentType === 'prn'}
                  onChange={() => updateField('employmentType', 'prn')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">PRN (As Needed)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ja-wage">Wage / Salary Amount <span className="text-red-500">*</span></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="ja-wage"
                  type="text"
                  value={data.wage}
                  onChange={(e) => updateField('wage', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <Label>Pay Type <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-6 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payType"
                    value="hourly"
                    checked={data.payType === 'hourly'}
                    onChange={() => updateField('payType', 'hourly')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Hourly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payType"
                    value="salary"
                    checked={data.payType === 'salary'}
                    onChange={() => updateField('payType', 'salary')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Salary</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="ja-payFrequency">Pay Frequency <span className="text-red-500">*</span></Label>
              <select
                id="ja-payFrequency"
                value={data.payFrequency}
                onChange={(e) => updateField('payFrequency', e.target.value as PayFrequency)}
                className={INPUT_CLASS}
              >
                <option value="">Select frequency...</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="semi-monthly">Semi-monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Benefits Eligibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Benefits Eligibility</Label>
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="benefitsEligible"
                    value="yes"
                    checked={data.benefitsEligible === 'yes'}
                    onChange={() => updateField('benefitsEligible', 'yes')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="benefitsEligible"
                    value="no"
                    checked={data.benefitsEligible === 'no'}
                    onChange={() => updateField('benefitsEligible', 'no')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="ja-benefitsNotes">Benefits Notes</Label>
              <input
                id="ja-benefitsNotes"
                type="text"
                value={data.benefitsNotes}
                onChange={(e) => updateField('benefitsNotes', e.target.value)}
                placeholder="e.g., Eligible after 90-day probationary period"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule and Reporting */}
      <Card>
        <CardHeader>
          <CardTitle>Start Date and Reporting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ja-startDate">Start Date <span className="text-red-500">*</span></Label>
              <input
                id="ja-startDate"
                type="date"
                value={data.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="ja-supervisor">Reporting Supervisor Name</Label>
              <input
                id="ja-supervisor"
                type="text"
                value={data.reportingSupervisor}
                onChange={(e) => updateField('reportingSupervisor', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acceptance Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Acceptance Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p>
              I accept the position described above and agree to the terms and conditions of employment
              as outlined. I understand that employment with <strong>Serenity Care Partners LLC</strong> is at-will,
              meaning that either the employee or the employer may terminate the employment relationship
              at any time, with or without cause or notice.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="ja-conditional"
              checked={data.conditionalEmploymentAgreed}
              onChange={(e) => updateField('conditionalEmploymentAgreed', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="ja-conditional" className="text-sm text-amber-900 cursor-pointer">
              <strong>Conditional Employment:</strong> I understand that this offer is contingent upon
              satisfactory completion of background checks and all required pre-employment documentation.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Employee E-Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="ja-empSigDate">Date</Label>
              <input
                id="ja-empSigDate"
                type="date"
                value={data.employeeSignatureDate}
                onChange={(e) => updateField('employeeSignatureDate', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          {data.employeeSignature ? (
            <SignatureDisplay
              signatureData={data.employeeSignature}
              signerName={data.employeeName}
              onClear={() => updateField('employeeSignature', null)}
            />
          ) : (
            <ESignature
              onSign={handleEmployeeSign}
              signerName={data.employeeName}
              attestationText="I accept the position described above and agree to the terms and conditions of employment as outlined. I understand that employment with Serenity Care Partners LLC is at-will."
              required
            />
          )}
        </CardContent>
      </Card>

      {/* HR Representative Signature */}
      <Card>
        <CardHeader>
          <CardTitle>HR Representative Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ja-hrRepName">HR Representative Name</Label>
              <input
                id="ja-hrRepName"
                type="text"
                value={data.hrRepName}
                onChange={(e) => updateField('hrRepName', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="ja-hrSigDate">Date</Label>
              <input
                id="ja-hrSigDate"
                type="date"
                value={data.hrSignatureDate}
                onChange={(e) => updateField('hrSignatureDate', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          {data.hrSignature ? (
            <SignatureDisplay
              signatureData={data.hrSignature}
              signerName={data.hrRepName}
              onClear={() => updateField('hrSignature', null)}
            />
          ) : (
            <ESignature
              onSign={handleHrSign}
              signerName={data.hrRepName}
              attestationText="I confirm that the above offer of employment has been extended to the named employee under the terms described."
              required
            />
          )}
        </CardContent>
      </Card>
    </HiringFormShell>
  );
}
