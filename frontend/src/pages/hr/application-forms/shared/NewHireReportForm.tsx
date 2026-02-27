import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'new-hire-report';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

function maskSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length <= 4) return ssn;
  return '***-**-' + digits.slice(-4);
}

interface FormData {
  // Employee Information
  firstName: string;
  lastName: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  hireDate: string;
  // Employer Information
  companyName: string;
  federalEIN: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  // State Reporting
  reportSubmittedToOhio: boolean;
  reportSubmissionDate: string;
  confirmationNumber: string;
}

const DEFAULT_DATA: FormData = {
  firstName: '',
  lastName: '',
  ssn: '',
  address: '',
  city: '',
  state: 'OH',
  zip: '',
  dateOfBirth: '',
  hireDate: '',
  companyName: 'Serenity Care Partners LLC',
  federalEIN: '',
  companyAddress: '',
  companyCity: '',
  companyState: 'Ohio',
  companyZip: '',
  reportSubmittedToOhio: false,
  reportSubmissionDate: '',
  confirmationNumber: '',
};

export default function NewHireReportForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from applicantData
  useEffect(() => {
    if (applicantData.firstName && !data.firstName) {
      updateField('firstName', applicantData.firstName);
    }
    if (applicantData.lastName && !data.lastName) {
      updateField('lastName', applicantData.lastName);
    }
    if (applicantData.ssn && !data.ssn) {
      updateField('ssn', applicantData.ssn);
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
    if (applicantData.dateOfBirth && !data.dateOfBirth) {
      updateField('dateOfBirth', applicantData.dateOfBirth);
    }
    if (applicantData.startDate && !data.hireDate) {
      updateField('hireDate', applicantData.startDate);
    } else if (applicantData.hireDate && !data.hireDate) {
      updateField('hireDate', applicantData.hireDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    applicantData.firstName, applicantData.lastName, applicantData.ssn,
    applicantData.address, applicantData.city, applicantData.state, applicantData.zip,
    applicantData.dateOfBirth, applicantData.startDate, applicantData.hireDate,
  ]);

  // Mark as completed when the report is submitted
  const handleMarkComplete = () => {
    markFormStatus(SLUG, 'completed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>);
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
        {/* HR Only Banner */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
          <Badge variant="default" className="bg-purple-100 text-purple-700">HR Only</Badge>
          <span className="text-sm text-purple-700">
            This is an administrative form to be completed by HR personnel only.
          </span>
        </div>

        {/* Employee Information */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Last name"
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

        {/* Employer Information */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Company Name</Label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className={`${INPUT_CLASS} bg-gray-50`}
                  readOnly
                />
              </div>
              <div>
                <Label>Federal EIN</Label>
                <input
                  type="text"
                  value={data.federalEIN}
                  onChange={(e) => updateField('federalEIN', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div>
                <Label>State</Label>
                <input
                  type="text"
                  value={data.companyState}
                  onChange={(e) => updateField('companyState', e.target.value)}
                  className={`${INPUT_CLASS} bg-gray-50`}
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <Label>Company Address</Label>
                <input
                  type="text"
                  value={data.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Company street address"
                />
              </div>
              <div>
                <Label>City</Label>
                <input
                  type="text"
                  value={data.companyCity}
                  onChange={(e) => updateField('companyCity', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <input
                  type="text"
                  value={data.companyZip}
                  onChange={(e) => updateField('companyZip', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Reporting */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Ohio New Hire Reporting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ohio law requires employers to report new hires to the Ohio Department of Job and Family
                Services (DJFS) within 20 days of the hire date.
              </p>

              <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.reportSubmittedToOhio}
                  onChange={(e) => updateField('reportSubmittedToOhio', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Report submitted to Ohio DJFS
                </span>
              </label>

              {data.reportSubmittedToOhio && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div>
                    <Label>Report Submission Date</Label>
                    <input
                      type="date"
                      value={data.reportSubmissionDate}
                      onChange={(e) => updateField('reportSubmissionDate', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label>Confirmation Number</Label>
                    <input
                      type="text"
                      value={data.confirmationNumber}
                      onChange={(e) => updateField('confirmationNumber', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="DJFS confirmation number"
                    />
                  </div>
                </div>
              )}

              {/* Deadline tracking */}
              {data.hireDate && (
                <div className="mt-4">
                  {(() => {
                    const hireDate = new Date(data.hireDate);
                    const deadline = new Date(hireDate);
                    deadline.setDate(deadline.getDate() + 20);
                    const now = new Date();
                    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysRemaining < 0;
                    const isUrgent = daysRemaining >= 0 && daysRemaining <= 5;

                    if (data.reportSubmittedToOhio) {
                      return (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                          Report submitted. Deadline was {deadline.toLocaleDateString()}.
                        </div>
                      );
                    }

                    return (
                      <div className={`p-3 rounded-lg text-sm border ${
                        isOverdue
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : isUrgent
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <strong>Reporting deadline:</strong> {deadline.toLocaleDateString()}
                        {isOverdue
                          ? ` (${Math.abs(daysRemaining)} days overdue!)`
                          : ` (${daysRemaining} days remaining)`
                        }
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mark Complete Button */}
        <Card padding={false}>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                No signature is required for this administrative form. Click "Mark Complete" when all
                information has been entered and the new hire report has been submitted to Ohio DJFS.
              </p>
              <button
                type="button"
                onClick={handleMarkComplete}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm whitespace-nowrap ml-4"
              >
                Mark Complete
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
