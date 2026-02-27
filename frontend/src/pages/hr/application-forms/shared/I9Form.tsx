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

const SLUG = 'i9-employment-eligibility';

type CitizenshipStatus = '' | 'citizen' | 'noncitizen_national' | 'lawful_permanent_resident' | 'alien_authorized';
type ActiveSection = 'section1' | 'section2' | 'section3';

interface PreparerInfo {
  used: boolean;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  signature: SignatureData | null;
  date: string;
}

interface DocumentEntry {
  documentTitle: string;
  issuingAuthority: string;
  documentNumber: string;
  expirationDate: string;
}

const EMPTY_DOCUMENT: DocumentEntry = {
  documentTitle: '',
  issuingAuthority: '',
  documentNumber: '',
  expirationDate: '',
};

interface I9FormData {
  // Section 1 - Employee
  lastName: string;
  firstName: string;
  middleInitial: string;
  otherLastNames: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  ssnMasked: string;
  email: string;
  phone: string;
  citizenshipStatus: CitizenshipStatus;
  alienRegistrationNumber: string;
  alienExpirationDate: string;
  alienNumber: string;
  uscisNumber: string;
  i94Number: string;
  foreignPassportNumber: string;
  foreignPassportCountry: string;
  section1Signature: SignatureData | null;
  section1Date: string;
  preparer: PreparerInfo;

  // Section 2 - Employer (HR Only)
  listADocument: DocumentEntry;
  listBDocument: DocumentEntry;
  listCDocument: DocumentEntry;
  documentVerificationMethod: 'listA' | 'listBC' | '';
  additionalInfo: string;
  firstDayOfEmployment: string;
  employerName: string;
  employerAddress: string;
  hrRepName: string;
  hrRepTitle: string;
  section2Signature: SignatureData | null;
  section2Date: string;

  // Section 3 - Reverification (HR Only)
  newLastName: string;
  newFirstName: string;
  newMiddleInitial: string;
  rehireDate: string;
  reverificationDocTitle: string;
  reverificationDocNumber: string;
  reverificationDocExpiration: string;
  section3Signature: SignatureData | null;
  section3Date: string;
}

const DEFAULT_DATA: I9FormData = {
  lastName: '',
  firstName: '',
  middleInitial: '',
  otherLastNames: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  zip: '',
  dateOfBirth: '',
  ssnMasked: '',
  email: '',
  phone: '',
  citizenshipStatus: '',
  alienRegistrationNumber: '',
  alienExpirationDate: '',
  alienNumber: '',
  uscisNumber: '',
  i94Number: '',
  foreignPassportNumber: '',
  foreignPassportCountry: '',
  section1Signature: null,
  section1Date: new Date().toISOString().split('T')[0],
  preparer: {
    used: false,
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    signature: null,
    date: new Date().toISOString().split('T')[0],
  },

  listADocument: { ...EMPTY_DOCUMENT },
  listBDocument: { ...EMPTY_DOCUMENT },
  listCDocument: { ...EMPTY_DOCUMENT },
  documentVerificationMethod: '',
  additionalInfo: '',
  firstDayOfEmployment: '',
  employerName: 'Serenity Care Partners LLC',
  employerAddress: '',
  hrRepName: '',
  hrRepTitle: '',
  section2Signature: null,
  section2Date: new Date().toISOString().split('T')[0],

  newLastName: '',
  newFirstName: '',
  newMiddleInitial: '',
  rehireDate: '',
  reverificationDocTitle: '',
  reverificationDocNumber: '',
  reverificationDocExpiration: '',
  section3Signature: null,
  section3Date: new Date().toISOString().split('T')[0],
};

function maskSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return '***-**-' + digits;
  return '***-**-' + digits.slice(-4);
}

const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

export default function I9Form() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;

  const {
    data,
    updateField,
    updateNestedField,
    resetForm,
    lastSaved,
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    auditTrail,
  } = useFormPersistence<I9FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  const {
    applicantData,
    markFormStatus,
    syncFormToServer,
  } = useHiringFormData(employeeId);

  const [activeSection, setActiveSection] = useState<ActiveSection>('section1');

  // Auto-populate from shared applicant data
  useEffect(() => {
    if (applicantData.lastName && !data.lastName) {
      updateField('lastName', applicantData.lastName);
    }
    if (applicantData.firstName && !data.firstName) {
      updateField('firstName', applicantData.firstName);
    }
    if (applicantData.middleName && !data.middleInitial) {
      updateField('middleInitial', applicantData.middleName.charAt(0));
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
    if (applicantData.ssn && !data.ssnMasked) {
      updateField('ssnMasked', maskSSN(applicantData.ssn));
    }
    if (applicantData.email && !data.email) {
      updateField('email', applicantData.email);
    }
    if (applicantData.phone && !data.phone) {
      updateField('phone', applicantData.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData]);

  const handleSection1Sign = (sig: SignatureData) => {
    updateField('section1Signature', sig);
    updateField('section1Date', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>);
  };

  const handleSection2Sign = (sig: SignatureData) => {
    updateField('section2Signature', sig);
    updateField('section2Date', new Date().toISOString().split('T')[0]);
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>);
  };

  const handleSection3Sign = (sig: SignatureData) => {
    updateField('section3Signature', sig);
    updateField('section3Date', new Date().toISOString().split('T')[0]);
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>);
  };

  const handlePreparerSign = (sig: SignatureData) => {
    updateNestedField('preparer.signature', sig);
    updateNestedField('preparer.date', new Date().toISOString().split('T')[0]);
  };

  const updateDocument = (list: 'listADocument' | 'listBDocument' | 'listCDocument', field: keyof DocumentEntry, value: string) => {
    updateNestedField(`${list}.${field}`, value);
  };

  const fullName = [data.firstName, data.middleInitial, data.lastName].filter(Boolean).join(' ');

  const citizenshipLabel = (() => {
    switch (data.citizenshipStatus) {
      case 'citizen': return 'A citizen of the United States';
      case 'noncitizen_national': return 'A noncitizen national of the United States';
      case 'lawful_permanent_resident': return 'A lawful permanent resident';
      case 'alien_authorized': return 'An alien authorized to work';
      default: return 'Not specified';
    }
  })();

  return (
    <HiringFormShell
      formDef={formDef}
      employeeId={employeeId}
      employeeName={fullName}
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile}
      auditTrail={auditTrail}
    >
      {/* Section Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveSection('section1')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'section1'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Section 1 — Employee
          {data.section1Signature && (
            <Badge variant="default" className="ml-2 bg-green-100 text-green-700 text-[10px]">Signed</Badge>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('section2')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'section2'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Section 2 — Employer
          <Badge variant="default" className="ml-2 bg-purple-100 text-purple-700 text-[10px]">HR Only</Badge>
          {data.section2Signature && (
            <Badge variant="default" className="ml-1 bg-green-100 text-green-700 text-[10px]">Signed</Badge>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('section3')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'section3'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Section 3 — Reverification
          <Badge variant="default" className="ml-2 bg-purple-100 text-purple-700 text-[10px]">HR Only</Badge>
          {data.section3Signature && (
            <Badge variant="default" className="ml-1 bg-green-100 text-green-700 text-[10px]">Signed</Badge>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Employee Information and Attestation
          ═══════════════════════════════════════════════════ */}
      {activeSection === 'section1' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Section 1: Employee Information and Attestation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Employees must complete and sign Section 1 of Form I-9 no later than the first day of employment,
                but not before accepting a job offer.
              </p>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="i9-lastName">Last Name <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-lastName"
                    type="text"
                    value={data.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-firstName">First Name <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-firstName"
                    type="text"
                    value={data.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-middleInitial">Middle Initial</Label>
                  <input
                    id="i9-middleInitial"
                    type="text"
                    maxLength={1}
                    value={data.middleInitial}
                    onChange={(e) => updateField('middleInitial', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-otherNames">Other Last Names Used</Label>
                  <input
                    id="i9-otherNames"
                    type="text"
                    value={data.otherLastNames}
                    onChange={(e) => updateField('otherLastNames', e.target.value)}
                    placeholder="If applicable"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="i9-address">Address (Street Number and Name) <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-address"
                    type="text"
                    value={data.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-apartment">Apt. Number</Label>
                  <input
                    id="i9-apartment"
                    type="text"
                    value={data.apartment}
                    onChange={(e) => updateField('apartment', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-city">City or Town <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-city"
                    type="text"
                    value={data.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="i9-state">State <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-state"
                    type="text"
                    value={data.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-zip">ZIP Code <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-zip"
                    type="text"
                    value={data.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-dob">Date of Birth <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-dob"
                    type="date"
                    value={data.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-ssn">U.S. Social Security Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="i9-ssn"
                      type="text"
                      value={data.ssnMasked}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <Badge variant="secondary" className="text-[10px] whitespace-nowrap">Masked</Badge>
                  </div>
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="i9-email">Employee&apos;s Email Address</Label>
                  <input
                    id="i9-email"
                    type="email"
                    value={data.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-phone">Employee&apos;s Telephone Number</Label>
                  <input
                    id="i9-phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Citizenship/Immigration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Citizenship / Immigration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                I attest, under penalty of perjury, that I am (check one of the following boxes):
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenshipStatus"
                    value="citizen"
                    checked={data.citizenshipStatus === 'citizen'}
                    onChange={() => updateField('citizenshipStatus', 'citizen')}
                    className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">1. A citizen of the United States</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenshipStatus"
                    value="noncitizen_national"
                    checked={data.citizenshipStatus === 'noncitizen_national'}
                    onChange={() => updateField('citizenshipStatus', 'noncitizen_national')}
                    className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">2. A noncitizen national of the United States</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenshipStatus"
                    value="lawful_permanent_resident"
                    checked={data.citizenshipStatus === 'lawful_permanent_resident'}
                    onChange={() => updateField('citizenshipStatus', 'lawful_permanent_resident')}
                    className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">3. A lawful permanent resident</span>
                    <span className="text-sm text-gray-500 ml-1">(Alien Registration Number/USCIS Number)</span>
                  </div>
                </label>
                {data.citizenshipStatus === 'lawful_permanent_resident' && (
                  <div className="ml-7 max-w-sm">
                    <Label htmlFor="i9-alienReg">Alien Registration Number / USCIS Number</Label>
                    <input
                      id="i9-alienReg"
                      type="text"
                      value={data.alienRegistrationNumber}
                      onChange={(e) => updateField('alienRegistrationNumber', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenshipStatus"
                    value="alien_authorized"
                    checked={data.citizenshipStatus === 'alien_authorized'}
                    onChange={() => updateField('citizenshipStatus', 'alien_authorized')}
                    className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">4. An alien authorized to work</span>
                    <span className="text-sm text-gray-500 ml-1">until (expiration date, if applicable)</span>
                  </div>
                </label>
                {data.citizenshipStatus === 'alien_authorized' && (
                  <div className="ml-7 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                      <div>
                        <Label htmlFor="i9-alienExpDate">Expiration Date (if applicable)</Label>
                        <input
                          id="i9-alienExpDate"
                          type="date"
                          value={data.alienExpirationDate}
                          onChange={(e) => updateField('alienExpirationDate', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label htmlFor="i9-alienNumber">Alien Number / USCIS Number</Label>
                        <input
                          id="i9-alienNumber"
                          type="text"
                          value={data.alienNumber}
                          onChange={(e) => updateField('alienNumber', e.target.value)}
                          placeholder="Enter one of the following"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label htmlFor="i9-i94">Form I-94 Admission Number</Label>
                        <input
                          id="i9-i94"
                          type="text"
                          value={data.i94Number}
                          onChange={(e) => updateField('i94Number', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label htmlFor="i9-foreignPassport">Foreign Passport Number</Label>
                        <input
                          id="i9-foreignPassport"
                          type="text"
                          value={data.foreignPassportNumber}
                          onChange={(e) => updateField('foreignPassportNumber', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      {data.foreignPassportNumber && (
                        <div>
                          <Label htmlFor="i9-foreignCountry">Country of Issuance</Label>
                          <input
                            id="i9-foreignCountry"
                            type="text"
                            value={data.foreignPassportCountry}
                            onChange={(e) => updateField('foreignPassportCountry', e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 1 Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Signature — Section 1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="i9-s1date">Date Signed</Label>
                  <input
                    id="i9-s1date"
                    type="date"
                    value={data.section1Date}
                    onChange={(e) => updateField('section1Date', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              {data.section1Signature ? (
                <SignatureDisplay
                  signatureData={data.section1Signature}
                  signerName={fullName}
                  onClear={() => updateField('section1Signature', null)}
                />
              ) : (
                <ESignature
                  onSign={handleSection1Sign}
                  signerName={fullName}
                  attestationText="I am aware that federal law provides for imprisonment and/or fines for false statements, or the use of false documents, in connection with the completion of this form. I attest, under penalty of perjury, that I am (the citizenship status selected above), and that the information provided is true and correct."
                  required
                />
              )}
            </CardContent>
          </Card>

          {/* Preparer/Translator Section (Supplement A) */}
          <Card>
            <CardHeader>
              <CardTitle>Supplement A — Preparer and/or Translator Certification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Label className="text-sm font-medium text-gray-700">Was a preparer and/or translator used?</Label>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preparerUsed"
                    checked={data.preparer.used === true}
                    onChange={() => updateNestedField('preparer.used', true)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preparerUsed"
                    checked={data.preparer.used === false}
                    onChange={() => updateNestedField('preparer.used', false)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>

              {data.preparer.used && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4 mt-3">
                  <p className="text-sm text-gray-600">
                    I attest, under penalty of perjury, that I have assisted in the completion of
                    Section 1 of this form and that to the best of my knowledge the information is true and correct.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="i9-preparerName">Preparer / Translator Name</Label>
                      <input
                        id="i9-preparerName"
                        type="text"
                        value={data.preparer.name}
                        onChange={(e) => updateNestedField('preparer.name', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label htmlFor="i9-preparerDate">Date</Label>
                      <input
                        id="i9-preparerDate"
                        type="date"
                        value={data.preparer.date}
                        onChange={(e) => updateNestedField('preparer.date', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <Label htmlFor="i9-preparerAddress">Address (Street Number and Name)</Label>
                      <input
                        id="i9-preparerAddress"
                        type="text"
                        value={data.preparer.address}
                        onChange={(e) => updateNestedField('preparer.address', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label htmlFor="i9-preparerCity">City or Town</Label>
                      <input
                        id="i9-preparerCity"
                        type="text"
                        value={data.preparer.city}
                        onChange={(e) => updateNestedField('preparer.city', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label htmlFor="i9-preparerState">State</Label>
                      <input
                        id="i9-preparerState"
                        type="text"
                        value={data.preparer.state}
                        onChange={(e) => updateNestedField('preparer.state', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label htmlFor="i9-preparerZip">ZIP Code</Label>
                      <input
                        id="i9-preparerZip"
                        type="text"
                        value={data.preparer.zip}
                        onChange={(e) => updateNestedField('preparer.zip', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {data.preparer.signature ? (
                    <SignatureDisplay
                      signatureData={data.preparer.signature}
                      signerName={data.preparer.name}
                      onClear={() => updateNestedField('preparer.signature', null)}
                    />
                  ) : (
                    <ESignature
                      onSign={handlePreparerSign}
                      signerName={data.preparer.name}
                      attestationText="I attest, under penalty of perjury, that I have assisted in the completion of Section 1 of this form and that to the best of my knowledge the information is true and correct."
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — Employer or Authorized Representative
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'section2' && (
        <>
          {/* HR Only Banner */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-100 text-purple-700">HR Only</Badge>
              <p className="text-sm text-purple-800 font-medium">
                This section must be completed by the employer or authorized representative.
              </p>
            </div>
            <p className="text-sm text-purple-700 mt-1">
              The employer or authorized representative must complete Section 2 by examining evidence of identity
              and employment authorization within three business days of the employee&apos;s first day of employment.
            </p>
          </div>

          {/* Employee Info Summary (read-only from Section 1) */}
          <Card>
            <CardHeader>
              <CardTitle>Section 2: Employer Review and Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600 font-medium">Employee Information (from Section 1)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium text-gray-900">{fullName || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Citizenship Status:</span>{' '}
                    <span className="font-medium text-gray-900">{citizenshipLabel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Section 1 Signed:</span>{' '}
                    {data.section1Signature ? (
                      <Badge variant="default" className="bg-green-100 text-green-700 text-[10px]">Yes</Badge>
                    ) : (
                      <Badge variant="default" className="bg-amber-100 text-amber-700 text-[10px]">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Document Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                Examine one document from <strong>List A</strong> (which establishes both identity and
                employment authorization) <strong>OR</strong> one document from <strong>List B</strong> (identity)
                and one from <strong>List C</strong> (employment authorization).
              </p>

              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="docMethod"
                    value="listA"
                    checked={data.documentVerificationMethod === 'listA'}
                    onChange={() => updateField('documentVerificationMethod', 'listA')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">List A Document</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="docMethod"
                    value="listBC"
                    checked={data.documentVerificationMethod === 'listBC'}
                    onChange={() => updateField('documentVerificationMethod', 'listBC')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">List B + List C Documents</span>
                </label>
              </div>

              {/* List A */}
              {data.documentVerificationMethod === 'listA' && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">
                    List A — Identity and Employment Authorization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Document Title</Label>
                      <input
                        type="text"
                        value={data.listADocument.documentTitle}
                        onChange={(e) => updateDocument('listADocument', 'documentTitle', e.target.value)}
                        placeholder="e.g., U.S. Passport"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>Issuing Authority</Label>
                      <input
                        type="text"
                        value={data.listADocument.issuingAuthority}
                        onChange={(e) => updateDocument('listADocument', 'issuingAuthority', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>Document Number</Label>
                      <input
                        type="text"
                        value={data.listADocument.documentNumber}
                        onChange={(e) => updateDocument('listADocument', 'documentNumber', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>Expiration Date (if any)</Label>
                      <input
                        type="date"
                        value={data.listADocument.expirationDate}
                        onChange={(e) => updateDocument('listADocument', 'expirationDate', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* List B + C */}
              {data.documentVerificationMethod === 'listBC' && (
                <div className="space-y-4">
                  <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <h4 className="text-sm font-semibold text-amber-900 mb-3">
                      List B — Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Document Title</Label>
                        <input
                          type="text"
                          value={data.listBDocument.documentTitle}
                          onChange={(e) => updateDocument('listBDocument', 'documentTitle', e.target.value)}
                          placeholder="e.g., Driver's License"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label>Issuing Authority</Label>
                        <input
                          type="text"
                          value={data.listBDocument.issuingAuthority}
                          onChange={(e) => updateDocument('listBDocument', 'issuingAuthority', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label>Document Number</Label>
                        <input
                          type="text"
                          value={data.listBDocument.documentNumber}
                          onChange={(e) => updateDocument('listBDocument', 'documentNumber', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label>Expiration Date (if any)</Label>
                        <input
                          type="date"
                          value={data.listBDocument.expirationDate}
                          onChange={(e) => updateDocument('listBDocument', 'expirationDate', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="text-sm font-semibold text-green-900 mb-3">
                      List C — Employment Authorization
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Document Title</Label>
                        <input
                          type="text"
                          value={data.listCDocument.documentTitle}
                          onChange={(e) => updateDocument('listCDocument', 'documentTitle', e.target.value)}
                          placeholder="e.g., Social Security Card"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label>Issuing Authority</Label>
                        <input
                          type="text"
                          value={data.listCDocument.issuingAuthority}
                          onChange={(e) => updateDocument('listCDocument', 'issuingAuthority', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label>Document Number</Label>
                        <input
                          type="text"
                          value={data.listCDocument.documentNumber}
                          onChange={(e) => updateDocument('listCDocument', 'documentNumber', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <Label>Expiration Date (if any)</Label>
                        <input
                          type="date"
                          value={data.listCDocument.expirationDate}
                          onChange={(e) => updateDocument('listCDocument', 'expirationDate', e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information and Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="i9-additionalInfo">Additional Information</Label>
                <textarea
                  id="i9-additionalInfo"
                  rows={3}
                  value={data.additionalInfo}
                  onChange={(e) => updateField('additionalInfo', e.target.value)}
                  placeholder="Enter any additional notes or information..."
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="i9-firstDay">Employee&apos;s First Day of Employment <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-firstDay"
                    type="date"
                    value={data.firstDayOfEmployment}
                    onChange={(e) => updateField('firstDayOfEmployment', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="i9-employerName">Employer Name</Label>
                  <input
                    id="i9-employerName"
                    type="text"
                    value={data.employerName}
                    onChange={(e) => updateField('employerName', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-employerAddress">Employer Address</Label>
                  <input
                    id="i9-employerAddress"
                    type="text"
                    value={data.employerAddress}
                    onChange={(e) => updateField('employerAddress', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="i9-hrName">HR Representative Name <span className="text-red-500">*</span></Label>
                  <input
                    id="i9-hrName"
                    type="text"
                    value={data.hrRepName}
                    onChange={(e) => updateField('hrRepName', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <Label htmlFor="i9-hrTitle">Title</Label>
                  <input
                    id="i9-hrTitle"
                    type="text"
                    value={data.hrRepTitle}
                    onChange={(e) => updateField('hrRepTitle', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 Signature */}
          <Card>
            <CardHeader>
              <CardTitle>HR Signature — Section 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="i9-s2date">Date Signed</Label>
                  <input
                    id="i9-s2date"
                    type="date"
                    value={data.section2Date}
                    onChange={(e) => updateField('section2Date', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              {data.section2Signature ? (
                <SignatureDisplay
                  signatureData={data.section2Signature}
                  signerName={data.hrRepName}
                  onClear={() => updateField('section2Signature', null)}
                />
              ) : (
                <ESignature
                  onSign={handleSection2Sign}
                  signerName={data.hrRepName}
                  attestationText="I attest, under penalty of perjury, that (1) I have examined the document(s) presented by the above-named employee, (2) the above-listed document(s) appear to be genuine and to relate to the employee named, and (3) to the best of my knowledge the employee is authorized to work in the United States."
                  required
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — Reverification and Rehires
          ═══════════════════════════════════════════════════ */}
      {activeSection === 'section3' && (
        <>
          {/* HR Only Banner */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-100 text-purple-700">HR Only</Badge>
              <p className="text-sm text-purple-800 font-medium">
                This section is completed by HR/Admin only.
              </p>
            </div>
            <p className="text-sm text-purple-700 mt-1">
              Complete Section 3 when reverifying employment authorization, or when rehiring an employee
              within three years of the date Section 2 was originally completed.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Section 3: Reverification and Rehires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Name */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">New Name (if applicable)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="i9-newLastName">Last Name</Label>
                    <input
                      id="i9-newLastName"
                      type="text"
                      value={data.newLastName}
                      onChange={(e) => updateField('newLastName', e.target.value)}
                      placeholder="If name has changed"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label htmlFor="i9-newFirstName">First Name</Label>
                    <input
                      id="i9-newFirstName"
                      type="text"
                      value={data.newFirstName}
                      onChange={(e) => updateField('newFirstName', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label htmlFor="i9-newMiddleInitial">Middle Initial</Label>
                    <input
                      id="i9-newMiddleInitial"
                      type="text"
                      maxLength={1}
                      value={data.newMiddleInitial}
                      onChange={(e) => updateField('newMiddleInitial', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>

              {/* Rehire Date */}
              <div className="max-w-sm">
                <Label htmlFor="i9-rehireDate">Date of Rehire (if applicable)</Label>
                <input
                  id="i9-rehireDate"
                  type="date"
                  value={data.rehireDate}
                  onChange={(e) => updateField('rehireDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              {/* Reverification Document */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Document for Reverification</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="i9-revDocTitle">Document Title</Label>
                    <input
                      id="i9-revDocTitle"
                      type="text"
                      value={data.reverificationDocTitle}
                      onChange={(e) => updateField('reverificationDocTitle', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label htmlFor="i9-revDocNumber">Document Number</Label>
                    <input
                      id="i9-revDocNumber"
                      type="text"
                      value={data.reverificationDocNumber}
                      onChange={(e) => updateField('reverificationDocNumber', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label htmlFor="i9-revDocExp">Expiration Date</Label>
                    <input
                      id="i9-revDocExp"
                      type="date"
                      value={data.reverificationDocExpiration}
                      onChange={(e) => updateField('reverificationDocExpiration', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 Signature */}
          <Card>
            <CardHeader>
              <CardTitle>HR Signature — Section 3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="i9-s3date">Date Signed</Label>
                  <input
                    id="i9-s3date"
                    type="date"
                    value={data.section3Date}
                    onChange={(e) => updateField('section3Date', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              {data.section3Signature ? (
                <SignatureDisplay
                  signatureData={data.section3Signature}
                  signerName={data.hrRepName || 'HR Representative'}
                  onClear={() => updateField('section3Signature', null)}
                />
              ) : (
                <ESignature
                  onSign={handleSection3Sign}
                  signerName={data.hrRepName || 'HR Representative'}
                  attestationText="I attest, under penalty of perjury, that to the best of my knowledge, this employee is authorized to work in the United States, and I have verified the document(s) indicated above."
                  required
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </HiringFormShell>
  );
}
