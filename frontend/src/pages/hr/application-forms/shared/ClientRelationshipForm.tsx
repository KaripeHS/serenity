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

const SLUG = 'client-relationship';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const RELATIONSHIP_TYPES = [
  'Family member',
  'Friend',
  'Neighbor',
  'Former caregiver',
  'Church/community member',
  'Other',
] as const;

interface FormData {
  employeeName: string;
  hasExistingRelationship: 'yes' | 'no' | '';
  clientName: string;
  relationshipNature: string;
  relationshipDescription: string;
  signatureDate: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  hasExistingRelationship: '',
  clientName: '',
  relationshipNature: '',
  relationshipDescription: '',
  signatureDate: '',
  signature: null,
};

export default function ClientRelationshipForm() {
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
    if (!data.signatureDate) {
      updateField('signatureDate', new Date().toISOString().split('T')[0]);
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
          </CardContent>
        </Card>

        {/* Relationship Declaration */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Client Relationship Declaration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>
                Do you have any existing personal relationship with any current client of Serenity Care Partners LLC?
              </Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hasRelationship"
                    value="yes"
                    checked={data.hasExistingRelationship === 'yes'}
                    onChange={() => updateField('hasExistingRelationship', 'yes')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-amber-700">Yes</span>
                    <p className="text-xs text-gray-500 mt-0.5">I have an existing relationship with a current client</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hasRelationship"
                    value="no"
                    checked={data.hasExistingRelationship === 'no'}
                    onChange={() => updateField('hasExistingRelationship', 'no')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-green-700">No</span>
                    <p className="text-xs text-gray-500 mt-0.5">I have no existing relationships with any current clients</p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relationship Details (if Yes) */}
        {data.hasExistingRelationship === 'yes' && (
          <Card padding={false}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  Relationship Details
                  <Badge variant="default" className="bg-amber-100 text-amber-700 text-[10px]">Disclosure Required</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Client Name</Label>
                  <input
                    type="text"
                    value={data.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Name of the client"
                  />
                </div>
                <div>
                  <Label>Nature of Relationship</Label>
                  <select
                    value={data.relationshipNature}
                    onChange={(e) => updateField('relationshipNature', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">-- Select relationship type --</option>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Description of Relationship</Label>
                  <textarea
                    value={data.relationshipDescription}
                    onChange={(e) => updateField('relationshipDescription', e.target.value)}
                    className={INPUT_CLASS}
                    rows={4}
                    placeholder="Please describe the nature and history of your relationship with this client..."
                  />
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    I understand that I may not be assigned to provide care for this individual. This disclosure
                    is required to prevent conflicts of interest and ensure quality of care.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Relationship Certification */}
        {data.hasExistingRelationship === 'no' && (
          <Card padding={false}>
            <CardContent>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  I certify that I have no existing personal relationships with any current clients of
                  Serenity Care Partners LLC.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ongoing Obligation */}
        {data.hasExistingRelationship && (
          <Card padding={false}>
            <CardHeader>
              <CardTitle>Ongoing Obligation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    I agree to immediately disclose any new relationships that develop with agency clients
                    during my employment. I understand that failure to disclose such relationships may result
                    in disciplinary action, up to and including termination.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* E-Signature */}
        {data.hasExistingRelationship && (
          <Card padding={false}>
            <CardHeader>
              <CardTitle>Employee Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Signature Date</Label>
                    <input
                      type="date"
                      value={data.signatureDate}
                      onChange={(e) => updateField('signatureDate', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
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
                    attestationText={
                      data.hasExistingRelationship === 'yes'
                        ? 'By signing below, I certify that I have disclosed all existing relationships with current clients and agree to report any future relationships that develop during my employment.'
                        : 'By signing below, I certify that I have no existing personal relationships with any current clients and agree to immediately disclose any relationships that develop during my employment.'
                    }
                    required
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </HiringFormShell>
  );
}
