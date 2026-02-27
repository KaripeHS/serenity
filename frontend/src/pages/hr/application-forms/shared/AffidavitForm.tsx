import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'affidavit';

const OHIO_COUNTIES = [
  'Adams', 'Allen', 'Ashland', 'Ashtabula', 'Athens', 'Auglaize', 'Belmont', 'Brown',
  'Butler', 'Carroll', 'Champaign', 'Clark', 'Clermont', 'Clinton', 'Columbiana',
  'Coshocton', 'Crawford', 'Cuyahoga', 'Darke', 'Defiance', 'Delaware', 'Erie',
  'Fairfield', 'Fayette', 'Franklin', 'Fulton', 'Gallia', 'Geauga', 'Greene',
  'Guernsey', 'Hamilton', 'Hancock', 'Hardin', 'Harrison', 'Henry', 'Highland',
  'Hocking', 'Holmes', 'Huron', 'Jackson', 'Jefferson', 'Knox', 'Lake', 'Lawrence',
  'Licking', 'Logan', 'Lorain', 'Lucas', 'Madison', 'Mahoning', 'Marion', 'Medina',
  'Meigs', 'Mercer', 'Miami', 'Monroe', 'Montgomery', 'Morgan', 'Morrow', 'Muskingum',
  'Noble', 'Ottawa', 'Paulding', 'Perry', 'Pickaway', 'Pike', 'Portage', 'Preble',
  'Putnam', 'Richland', 'Ross', 'Sandusky', 'Scioto', 'Seneca', 'Shelby', 'Stark',
  'Summit', 'Trumbull', 'Tuscarawas', 'Union', 'Van Wert', 'Vinton', 'Warren',
  'Washington', 'Wayne', 'Williams', 'Wood', 'Wyandot',
];

interface AffidavitFormData {
  employeeName: string;
  ssnMasked: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  countyOfResidence: string;
  affidavitDate: string;
  notaryCounty: string;
  notaryDay: string;
  notaryMonth: string;
  notaryYear: string;
  notaryName: string;
  notaryCommissionExpiration: string;
  notarySealFile: string | null;
  notarySealFileName: string;
  notaryNote: string;
  employeeSignature: SignatureData | null;
}

const DEFAULT_DATA: AffidavitFormData = {
  employeeName: '',
  ssnMasked: '',
  address: '',
  city: '',
  state: 'OH',
  zip: '',
  countyOfResidence: '',
  affidavitDate: new Date().toISOString().split('T')[0],
  notaryCounty: '',
  notaryDay: '',
  notaryMonth: '',
  notaryYear: new Date().getFullYear().toString().slice(-2),
  notaryName: '',
  notaryCommissionExpiration: '',
  notarySealFile: null,
  notarySealFileName: '',
  notaryNote: '',
  employeeSignature: null,
};

function maskSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return '***-**-' + digits;
  return '***-**-' + digits.slice(-4);
}

export default function AffidavitForm() {
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
  } = useFormPersistence<AffidavitFormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  const {
    applicantData,
    markFormStatus,
    syncFormToServer,
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
    if (applicantData.ssn && !data.ssnMasked) {
      updateField('ssnMasked', maskSSN(applicantData.ssn));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData]);

  const employeeName = data.employeeName || '[Employee Name]';

  const handleNotarySealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateField('notarySealFile', reader.result as string);
      updateField('notarySealFileName', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleEmployeeSign = (sig: SignatureData) => {
    updateField('employeeSignature', sig);
    markFormStatus(SLUG, 'signed');
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
      {/* Affidavit Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Statement of Affidavit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p>
              I, <strong>{employeeName}</strong>, do hereby attest and affirm under penalty of
              perjury that I have been a continuous resident of the State of Ohio for a period of
              not less than five (5) years immediately preceding the date of this affidavit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="affidavit-employeeName">Full Name</Label>
              <input
                id="affidavit-employeeName"
                type="text"
                value={data.employeeName}
                onChange={(e) => updateField('employeeName', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="affidavit-ssn">Social Security Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="affidavit-ssn"
                  type="text"
                  value={data.ssnMasked}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <Badge variant="secondary" className="text-[10px] whitespace-nowrap">Masked</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="affidavit-address">Street Address</Label>
              <input
                id="affidavit-address"
                type="text"
                value={data.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="affidavit-city">City</Label>
              <input
                id="affidavit-city"
                type="text"
                value={data.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="affidavit-state">State</Label>
              <input
                id="affidavit-state"
                type="text"
                value={data.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="affidavit-zip">ZIP Code</Label>
              <input
                id="affidavit-zip"
                type="text"
                value={data.zip}
                onChange={(e) => updateField('zip', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="affidavit-county">Ohio County of Residence</Label>
              <select
                id="affidavit-county"
                value={data.countyOfResidence}
                onChange={(e) => updateField('countyOfResidence', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select county...</option>
                {OHIO_COUNTIES.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="affidavit-date">Date of Affidavit</Label>
              <input
                id="affidavit-date"
                type="date"
                value={data.affidavitDate}
                onChange={(e) => updateField('affidavitDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notary Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Digital notarization:</strong> Notary section may be completed digitally or the
              signed form may be printed and notarized in person.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <p className="text-sm text-gray-700 font-medium">State of Ohio</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="affidavit-notaryCounty">County of</Label>
                <select
                  id="affidavit-notaryCounty"
                  value={data.notaryCounty}
                  onChange={(e) => updateField('notaryCounty', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select county...</option>
                  {OHIO_COUNTIES.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                Subscribed and sworn before me this{' '}
                <input
                  type="text"
                  value={data.notaryDay}
                  onChange={(e) => updateField('notaryDay', e.target.value)}
                  placeholder="___"
                  className="inline-block w-12 px-1 py-0.5 border-b border-gray-400 text-center text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={2}
                />{' '}
                day of{' '}
                <input
                  type="text"
                  value={data.notaryMonth}
                  onChange={(e) => updateField('notaryMonth', e.target.value)}
                  placeholder="___________"
                  className="inline-block w-28 px-1 py-0.5 border-b border-gray-400 text-center text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />{' '}
                , 20
                <input
                  type="text"
                  value={data.notaryYear}
                  onChange={(e) => updateField('notaryYear', e.target.value)}
                  placeholder="__"
                  className="inline-block w-10 px-1 py-0.5 border-b border-gray-400 text-center text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={2}
                />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="affidavit-notaryName">Notary Public Name</Label>
                <input
                  id="affidavit-notaryName"
                  type="text"
                  value={data.notaryName}
                  onChange={(e) => updateField('notaryName', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <Label htmlFor="affidavit-notaryExpiration">Commission Expiration Date</Label>
                <input
                  id="affidavit-notaryExpiration"
                  type="date"
                  value={data.notaryCommissionExpiration}
                  onChange={(e) => updateField('notaryCommissionExpiration', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Notary Seal Upload */}
            <div>
              <Label>Notary Seal (Optional)</Label>
              <div className="mt-1">
                {data.notarySealFile ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <img
                      src={data.notarySealFile}
                      alt="Notary Seal"
                      className="h-16 w-16 object-contain border rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{data.notarySealFileName}</p>
                      <p className="text-xs text-gray-500">Notary seal uploaded</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('notarySealFile', null);
                        updateField('notarySealFileName', '');
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <label
                      htmlFor="affidavit-notarySeal"
                      className="cursor-pointer text-sm text-primary-600 hover:text-primary-800"
                    >
                      Click to upload notary seal image
                      <input
                        id="affidavit-notarySeal"
                        type="file"
                        accept="image/*"
                        onChange={handleNotarySealUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF accepted</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee E-Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Signature</CardTitle>
        </CardHeader>
        <CardContent>
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
              attestationText={`I, ${employeeName}, do hereby attest and affirm under penalty of perjury that I have been a continuous resident of the State of Ohio for a period of not less than five (5) years immediately preceding the date of this affidavit.`}
              required
            />
          )}
        </CardContent>
      </Card>
    </HiringFormShell>
  );
}
