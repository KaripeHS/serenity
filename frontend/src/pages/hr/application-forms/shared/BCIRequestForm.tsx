import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'bci-request';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FormData {
  // Employee info (auto-populated)
  employeeName: string;
  ssnMasked: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  // Ohio 5-year residency question
  ohioFiveYearResident: 'yes' | 'no' | '';
  statesLivedIn: string;
  // Check type (auto-determined)
  checkType: string;
  // Previous names
  previousNames: string;
  // Authorization
  dateOfAuthorization: string;
  // BCI clearance tracking (HR fills)
  bciSubmissionDate: string;
  bciResultDate: string;
  bciResult: 'clear' | 'flagged' | 'disqualified' | '';
  fbiSubmissionDate: string;
  fbiResultDate: string;
  fbiResult: 'clear' | 'flagged' | 'disqualified' | '';
  // Signature
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  ssnMasked: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: 'OH',
  zip: '',
  ohioFiveYearResident: '',
  statesLivedIn: '',
  checkType: '',
  previousNames: '',
  dateOfAuthorization: '',
  bciSubmissionDate: '',
  bciResultDate: '',
  bciResult: '',
  fbiSubmissionDate: '',
  fbiResultDate: '',
  fbiResult: '',
  signature: null,
};

function maskSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return ssn;
  return `***-**-${digits.slice(-4)}`;
}

function calculateRecheckDate(clearanceDate: string): string {
  if (!clearanceDate) return '';
  const d = new Date(clearanceDate);
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().split('T')[0];
}

export default function BCIRequestForm() {
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
    if (!data.dateOfAuthorization) {
      updateField('dateOfAuthorization', new Date().toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    applicantData.firstName, applicantData.lastName, applicantData.ssn,
    applicantData.dateOfBirth, applicantData.address, applicantData.city,
    applicantData.state, applicantData.zip,
  ]);

  // Auto-determine check type based on residency answer
  useEffect(() => {
    if (data.ohioFiveYearResident === 'yes') {
      updateField('checkType', 'Ohio BCI Only');
    } else if (data.ohioFiveYearResident === 'no') {
      updateField('checkType', 'Ohio BCI + FBI (Dual Check Required)');
    } else {
      updateField('checkType', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.ohioFiveYearResident]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
  };

  const requiresDualCheck = data.ohioFiveYearResident === 'no';

  // Calculate next recheck date from BCI clearance date
  const nextRecheckDate = useMemo(() => {
    return calculateRecheckDate(data.bciResultDate);
  }, [data.bciResultDate]);

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>State</Label>
                  <input
                    type="text"
                    value={data.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="OH"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <input
                    type="text"
                    value={data.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="43215"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ohio 5-Year Residency Question */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Ohio Residency Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium text-gray-900">
                  Have you lived continuously in the State of Ohio for the past 5 years?
                </Label>
                <div className="flex gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ohioFiveYearResident"
                      value="yes"
                      checked={data.ohioFiveYearResident === 'yes'}
                      onChange={(e) => updateField('ohioFiveYearResident', e.target.value as 'yes' | 'no')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ohioFiveYearResident"
                      value="no"
                      checked={data.ohioFiveYearResident === 'no'}
                      onChange={(e) => updateField('ohioFiveYearResident', e.target.value as 'yes' | 'no')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {requiresDualCheck && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-blue-800">Dual Background Check Required</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Because you have not lived continuously in Ohio for the past 5 years, you are
                          required to complete <strong>both</strong> an Ohio Bureau of Criminal Investigation (BCI)
                          background check <strong>and</strong> a Federal Bureau of Investigation (FBI) background check.
                          This is required by Ohio Administrative Code for home health care providers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>States lived in during the past 5 years</Label>
                    <input
                      type="text"
                      value={data.statesLivedIn}
                      onChange={(e) => updateField('statesLivedIn', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Ohio, Pennsylvania, West Virginia"
                    />
                  </div>
                </>
              )}

              {data.ohioFiveYearResident && (
                <div className="flex items-center gap-2 mt-2">
                  <Label>Check Type:</Label>
                  <Badge
                    variant="default"
                    className={requiresDualCheck ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}
                  >
                    {data.checkType}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previous Names */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Previous Names / Aliases</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Previous names or aliases (for accurate records search)</Label>
              <input
                type="text"
                value={data.previousNames}
                onChange={(e) => updateField('previousNames', e.target.value)}
                className={INPUT_CLASS}
                placeholder="List any previous legal names, maiden names, or aliases"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter all names you have used, separated by commas. Leave blank if none.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Authorization */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Authorization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  I, <strong>{data.employeeName || '_______________'}</strong>, hereby authorize Serenity Care
                  Partners LLC to conduct a criminal background check through the Ohio Bureau of Criminal
                  Investigation (BCI){requiresDualCheck ? ' and the Federal Bureau of Investigation (FBI)' : ''}.
                  I understand that this background check is a condition of employment and that the results will
                  be used to determine my eligibility for employment as a home health care provider.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mt-3">
                  I certify that all information provided on this form is true and complete. I understand that
                  any misrepresentation or omission may be grounds for denial of employment or termination if
                  already employed. I authorize the release of background check results to Serenity Care Partners
                  LLC and its designated representatives.
                </p>
              </div>

              <div>
                <Label>Date of Authorization</Label>
                <input
                  type="date"
                  value={data.dateOfAuthorization}
                  onChange={(e) => updateField('dateOfAuthorization', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BCI Clearance Tracking (HR Section) */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>BCI Clearance Tracking</CardTitle>
              <Badge variant="default" className="bg-purple-100 text-purple-700 text-[10px]">HR Only</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Ohio BCI */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Ohio BCI</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>BCI Submission Date</Label>
                    <input
                      type="date"
                      value={data.bciSubmissionDate}
                      onChange={(e) => updateField('bciSubmissionDate', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label>BCI Result Date</Label>
                    <input
                      type="date"
                      value={data.bciResultDate}
                      onChange={(e) => updateField('bciResultDate', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label>BCI Result</Label>
                    <select
                      value={data.bciResult}
                      onChange={(e) => updateField('bciResult', e.target.value as FormData['bciResult'])}
                      className={INPUT_CLASS}
                    >
                      <option value="">-- Pending --</option>
                      <option value="clear">Clear</option>
                      <option value="flagged">Flagged</option>
                      <option value="disqualified">Disqualified</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FBI (conditional on dual check) */}
              {requiresDualCheck && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">FBI Background Check</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>FBI Submission Date</Label>
                      <input
                        type="date"
                        value={data.fbiSubmissionDate}
                        onChange={(e) => updateField('fbiSubmissionDate', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>FBI Result Date</Label>
                      <input
                        type="date"
                        value={data.fbiResultDate}
                        onChange={(e) => updateField('fbiResultDate', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>FBI Result</Label>
                      <select
                        value={data.fbiResult}
                        onChange={(e) => updateField('fbiResult', e.target.value as FormData['fbiResult'])}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Pending --</option>
                        <option value="clear">Clear</option>
                        <option value="flagged">Flagged</option>
                        <option value="disqualified">Disqualified</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Recertification */}
              {nextRecheckDate && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-1">Recertification Reminder</h4>
                  <p className="text-sm text-amber-700">
                    Next BCI recheck due:{' '}
                    <strong>{new Date(nextRecheckDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>{' '}
                    (5 years from clearance date)
                  </p>
                </div>
              )}

              {/* Result summary badges */}
              {(data.bciResult || data.fbiResult) && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <span className="text-sm text-gray-500">Results:</span>
                  {data.bciResult && (
                    <Badge
                      variant="default"
                      className={
                        data.bciResult === 'clear' ? 'bg-green-100 text-green-700' :
                        data.bciResult === 'flagged' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }
                    >
                      BCI: {data.bciResult.charAt(0).toUpperCase() + data.bciResult.slice(1)}
                    </Badge>
                  )}
                  {data.fbiResult && (
                    <Badge
                      variant="default"
                      className={
                        data.fbiResult === 'clear' ? 'bg-green-100 text-green-700' :
                        data.fbiResult === 'flagged' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }
                    >
                      FBI: {data.fbiResult.charAt(0).toUpperCase() + data.fbiResult.slice(1)}
                    </Badge>
                  )}
                </div>
              )}
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
                attestationText={`By signing below, I authorize Serenity Care Partners LLC to conduct a criminal background check through the Ohio Bureau of Criminal Investigation (BCI)${requiresDualCheck ? ' and the Federal Bureau of Investigation (FBI)' : ''} and I certify that all information provided on this form is true and complete.`}
                required
              />
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
