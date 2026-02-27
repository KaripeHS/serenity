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

const SLUG = 'proof-of-insurance';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FormData {
  employeeName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  usesPersonalVehicle: 'yes' | 'no' | '';
  insuranceCompany: string;
  policyNumber: string;
  coverageFrom: string;
  coverageTo: string;
  liabilityCoverage: string;
  propertyDamageCoverage: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate: string;
  driversLicenseNumber: string;
  driversLicenseState: string;
  driversLicenseExpiration: string;
  insuranceCardFront: string;
  insuranceCardBack: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  usesPersonalVehicle: '',
  insuranceCompany: '',
  policyNumber: '',
  coverageFrom: '',
  coverageTo: '',
  liabilityCoverage: '',
  propertyDamageCoverage: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  licensePlate: '',
  driversLicenseNumber: '',
  driversLicenseState: '',
  driversLicenseExpiration: '',
  insuranceCardFront: '',
  insuranceCardBack: '',
  signature: null,
};

export default function InsuranceProofForm() {
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
  }, [applicantData.firstName, applicantData.lastName, applicantData.address, applicantData.city, applicantData.state, applicantData.zip]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
  };

  const handleFileUpload = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (side === 'front') {
        updateField('insuranceCardFront', dataUrl);
      } else {
        updateField('insuranceCardBack', dataUrl);
      }
      addUploadedFile({
        name: `Insurance Card (${side === 'front' ? 'Front' : 'Back'}) - ${file.name}`,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
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
              <div className="md:col-span-2">
                <Label>Employee Name</Label>
                <input
                  type="text"
                  value={data.employeeName}
                  onChange={(e) => updateField('employeeName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Full legal name"
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
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Use Question */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Personal Vehicle Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Will you use your personal vehicle for work duties?</Label>
              <div className="flex flex-col gap-2">
                {(['yes', 'no'] as const).map((option) => (
                  <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="usesPersonalVehicle"
                      value={option}
                      checked={data.usesPersonalVehicle === option}
                      onChange={(e) => updateField('usesPersonalVehicle', e.target.value as 'yes' | 'no')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium text-gray-700">{option === 'yes' ? 'Yes' : 'No'}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Details (conditional on Yes) */}
        {data.usesPersonalVehicle === 'yes' && (
          <>
            <Card padding={false}>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Insurance Company Name</Label>
                    <input
                      type="text"
                      value={data.insuranceCompany}
                      onChange={(e) => updateField('insuranceCompany', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., State Farm, Geico, Progressive"
                    />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <input
                      type="text"
                      value={data.policyNumber}
                      onChange={(e) => updateField('policyNumber', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Policy number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Coverage From</Label>
                      <input
                        type="date"
                        value={data.coverageFrom}
                        onChange={(e) => updateField('coverageFrom', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>Coverage To</Label>
                      <input
                        type="date"
                        value={data.coverageTo}
                        onChange={(e) => updateField('coverageTo', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Liability Coverage Amount</Label>
                    <input
                      type="text"
                      value={data.liabilityCoverage}
                      onChange={(e) => updateField('liabilityCoverage', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., $100,000/$300,000"
                    />
                  </div>
                  <div>
                    <Label>Property Damage Coverage Amount</Label>
                    <input
                      type="text"
                      value={data.propertyDamageCoverage}
                      onChange={(e) => updateField('propertyDamageCoverage', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., $50,000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card padding={false}>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vehicle Year</Label>
                    <input
                      type="text"
                      value={data.vehicleYear}
                      onChange={(e) => updateField('vehicleYear', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., 2022"
                    />
                  </div>
                  <div>
                    <Label>Make</Label>
                    <input
                      type="text"
                      value={data.vehicleMake}
                      onChange={(e) => updateField('vehicleMake', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Toyota"
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <input
                      type="text"
                      value={data.vehicleModel}
                      onChange={(e) => updateField('vehicleModel', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Camry"
                    />
                  </div>
                  <div>
                    <Label>License Plate Number</Label>
                    <input
                      type="text"
                      value={data.licensePlate}
                      onChange={(e) => updateField('licensePlate', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="License plate"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card padding={false}>
              <CardHeader>
                <CardTitle>Driver's License Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Driver's License Number</Label>
                    <input
                      type="text"
                      value={data.driversLicenseNumber}
                      onChange={(e) => updateField('driversLicenseNumber', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="License number"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <input
                      type="text"
                      value={data.driversLicenseState}
                      onChange={(e) => updateField('driversLicenseState', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., OH"
                    />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <input
                      type="date"
                      value={data.driversLicenseExpiration}
                      onChange={(e) => updateField('driversLicenseExpiration', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload for Insurance Card */}
            <Card padding={false}>
              <CardHeader>
                <CardTitle>Insurance Card Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Please upload a clear photo or scan of both sides of your insurance card.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front */}
                    <div>
                      <Label>Insurance Card (Front)</Label>
                      {data.insuranceCardFront ? (
                        <div className="mt-2 space-y-2">
                          <img
                            src={data.insuranceCardFront}
                            alt="Insurance card front"
                            className="w-full rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => updateField('insuranceCardFront', '')}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload('front')}
                            className="hidden"
                            id="insurance-card-front"
                          />
                          <label
                            htmlFor="insurance-card-front"
                            className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Click to upload front of insurance card
                          </label>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF</p>
                        </div>
                      )}
                    </div>
                    {/* Back */}
                    <div>
                      <Label>Insurance Card (Back)</Label>
                      {data.insuranceCardBack ? (
                        <div className="mt-2 space-y-2">
                          <img
                            src={data.insuranceCardBack}
                            alt="Insurance card back"
                            className="w-full rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => updateField('insuranceCardBack', '')}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload('back')}
                            className="hidden"
                            id="insurance-card-back"
                          />
                          <label
                            htmlFor="insurance-card-back"
                            className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Click to upload back of insurance card
                          </label>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Certification Statement & Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Certification & Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 leading-relaxed">
                  I certify that the above insurance information is accurate and I will maintain valid
                  coverage throughout my employment. I understand that failure to maintain valid auto
                  insurance while using my personal vehicle for work duties may result in disciplinary
                  action, up to and including termination of employment.
                </p>
              </div>

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
                  attestationText="I certify that the above insurance information is accurate and I will maintain valid coverage throughout my employment."
                  required
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
