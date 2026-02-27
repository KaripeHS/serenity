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

const SLUG = 'reference-check';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface ReferenceVerification {
  // Reference info (auto-filled)
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  // HR verification fields
  dateContacted: string;
  contactMethod: 'phone' | 'email' | 'mail' | '';
  verifiedEmploymentDates: 'yes' | 'no' | '';
  verifiedTitle: 'yes' | 'no' | '';
  performanceRating: 'excellent' | 'good' | 'fair' | 'poor' | '';
  eligibleForRehire: 'yes' | 'no' | 'unknown' | '';
  additionalNotes: string;
}

interface FormData {
  references: [ReferenceVerification, ReferenceVerification, ReferenceVerification];
  hrReviewerName: string;
  hrReviewerDate: string;
  overallRecommendation: 'hire' | 'do_not_hire' | 'need_more_info' | '';
  signature: SignatureData | null;
}

const DEFAULT_REF: ReferenceVerification = {
  name: '',
  company: '',
  title: '',
  phone: '',
  email: '',
  dateContacted: '',
  contactMethod: '',
  verifiedEmploymentDates: '',
  verifiedTitle: '',
  performanceRating: '',
  eligibleForRehire: '',
  additionalNotes: '',
};

const DEFAULT_DATA: FormData = {
  references: [{ ...DEFAULT_REF }, { ...DEFAULT_REF }, { ...DEFAULT_REF }],
  hrReviewerName: '',
  hrReviewerDate: '',
  overallRecommendation: '',
  signature: null,
};

export default function ReferenceCheckForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, updateNestedField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate reference info from applicantData
  useEffect(() => {
    if (applicantData.references && applicantData.references.length > 0) {
      const updatedRefs = [...data.references] as [ReferenceVerification, ReferenceVerification, ReferenceVerification];
      applicantData.references.forEach((ref, idx) => {
        if (idx < 3) {
          // Only populate reference info fields, preserve HR verification fields
          if (!updatedRefs[idx].name && ref.name) updatedRefs[idx] = { ...updatedRefs[idx], name: ref.name };
          if (!updatedRefs[idx].company && ref.company) updatedRefs[idx] = { ...updatedRefs[idx], company: ref.company };
          if (!updatedRefs[idx].title && ref.title) updatedRefs[idx] = { ...updatedRefs[idx], title: ref.title };
          if (!updatedRefs[idx].phone && ref.phone) updatedRefs[idx] = { ...updatedRefs[idx], phone: ref.phone };
          if (!updatedRefs[idx].email && ref.email) updatedRefs[idx] = { ...updatedRefs[idx], email: ref.email };
        }
      });
      updateField('references', updatedRefs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.references]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
  };

  const updateRef = (refIndex: number, field: keyof ReferenceVerification, value: string) => {
    updateNestedField(`references.${refIndex}.${field}`, value);
  };

  const completedRefs = data.references.filter(r => r.dateContacted && r.contactMethod).length;

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
        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <Badge variant="default" className={completedRefs === 3 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
            {completedRefs}/3 References Verified
          </Badge>
          <span className="text-sm text-gray-500">Complete all 3 reference checks before signing</span>
        </div>

        {/* Reference sections */}
        {data.references.map((ref, idx) => (
          <Card key={idx} padding={false}>
            <CardHeader>
              <CardTitle>Reference {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Reference Info (auto-filled from application) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Reference Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateRef(idx, 'name', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Reference full name"
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <input
                        type="text"
                        value={ref.company}
                        onChange={(e) => updateRef(idx, 'company', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Company / Organization"
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <input
                        type="text"
                        value={ref.title}
                        onChange={(e) => updateRef(idx, 'title', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Job title"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <input
                        type="tel"
                        value={ref.phone}
                        onChange={(e) => updateRef(idx, 'phone', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Email</Label>
                      <input
                        type="email"
                        value={ref.email}
                        onChange={(e) => updateRef(idx, 'email', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="email@company.com"
                      />
                    </div>
                  </div>
                </div>

                {/* HR Verification Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-purple-700 mb-3 uppercase tracking-wide">
                    HR Verification (Internal Use Only)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date Contacted</Label>
                      <input
                        type="date"
                        value={ref.dateContacted}
                        onChange={(e) => updateRef(idx, 'dateContacted', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <Label>Contact Method</Label>
                      <select
                        value={ref.contactMethod}
                        onChange={(e) => updateRef(idx, 'contactMethod', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Select --</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="mail">Mail</option>
                      </select>
                    </div>
                    <div>
                      <Label>Verified Employment Dates</Label>
                      <select
                        value={ref.verifiedEmploymentDates}
                        onChange={(e) => updateRef(idx, 'verifiedEmploymentDates', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Select --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <Label>Verified Title</Label>
                      <select
                        value={ref.verifiedTitle}
                        onChange={(e) => updateRef(idx, 'verifiedTitle', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Select --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <Label>Performance Rating</Label>
                      <select
                        value={ref.performanceRating}
                        onChange={(e) => updateRef(idx, 'performanceRating', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Select --</option>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                    <div>
                      <Label>Eligible for Rehire</Label>
                      <select
                        value={ref.eligibleForRehire}
                        onChange={(e) => updateRef(idx, 'eligibleForRehire', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Select --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Additional Notes</Label>
                      <textarea
                        value={ref.additionalNotes}
                        onChange={(e) => updateRef(idx, 'additionalNotes', e.target.value)}
                        className={INPUT_CLASS}
                        rows={3}
                        placeholder="Any additional information gathered during reference check..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* HR Reviewer Section */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>HR Reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>HR Reviewer Name</Label>
                <input
                  type="text"
                  value={data.hrReviewerName}
                  onChange={(e) => updateField('hrReviewerName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label>Review Date</Label>
                <input
                  type="date"
                  value={data.hrReviewerDate}
                  onChange={(e) => updateField('hrReviewerDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Recommendation */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Overall Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Based on reference check results, the recommendation is:</Label>
              <div className="flex flex-col gap-2">
                {([
                  { value: 'hire', label: 'Hire', color: 'text-green-700' },
                  { value: 'do_not_hire', label: 'Do Not Hire', color: 'text-red-700' },
                  { value: 'need_more_info', label: 'Need More Information', color: 'text-yellow-700' },
                ] as const).map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="overallRecommendation"
                      value={option.value}
                      checked={data.overallRecommendation === option.value}
                      onChange={(e) => updateField('overallRecommendation', e.target.value as FormData['overallRecommendation'])}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`font-medium ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>HR Reviewer Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {data.signature ? (
              <SignatureDisplay
                signatureData={data.signature}
                signerName={data.hrReviewerName}
                onClear={handleClearSignature}
              />
            ) : (
              <ESignature
                onSign={handleSignature}
                signerName={data.hrReviewerName}
                attestationText="By signing below, I certify that I have personally contacted each reference listed above and that the information recorded is an accurate reflection of the responses received."
                required
              />
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
