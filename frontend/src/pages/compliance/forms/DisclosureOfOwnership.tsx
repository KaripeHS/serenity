import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface OwnerEntry {
  name: string;
  title: string;
  address: string;
  dob: string;
  ssnLast4: string;
  percentage: string;
  relationship: string;
}

interface FormData {
  agencyName: string;
  date: string;
  owners: OwnerEntry[];
  certifierName: string;
  certifierTitle: string;
  signature: SignatureData | null;
}

const EMPTY_OWNER: OwnerEntry = {
  name: '',
  title: '',
  address: '',
  dob: '',
  ssnLast4: '',
  percentage: '',
  relationship: '',
};

const DEFAULT_DATA: FormData = {
  agencyName: 'Serenity Care Partners LLC',
  date: new Date().toISOString().split('T')[0],
  owners: [{ ...EMPTY_OWNER }],
  certifierName: '',
  certifierTitle: '',
  signature: null,
};

export default function DisclosureOfOwnership() {
  const { data, updateField, updateNestedField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-12', DEFAULT_DATA);

  const addOwner = () => {
    updateField('owners', [...data.owners, { ...EMPTY_OWNER }]);
  };

  const removeOwner = (index: number) => {
    updateField('owners', data.owners.filter((_, i) => i !== index));
  };

  const updateOwner = (index: number, field: keyof OwnerEntry, value: string) => {
    const updated = [...data.owners];
    updated[index] = { ...updated[index], [field]: value };
    updateField('owners', updated);
  };

  return (
    <FormShell
      formId="12"
      title="Disclosure of Ownership"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agencyName">Agency Name</Label>
              <input
                id="agencyName"
                type="text"
                value={data.agencyName}
                onChange={e => updateField('agencyName', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="date">Date of Disclosure</Label>
              <input
                id="date"
                type="date"
                value={data.date}
                onChange={e => updateField('date', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Owners / Controlling Interest</CardTitle>
            <Button size="sm" variant="outline" onClick={addOwner}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Owner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.owners.map((owner, idx) => (
            <div key={idx} className="border rounded-lg p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Owner #{idx + 1}</span>
                {data.owners.length > 1 && (
                  <button
                    onClick={() => removeOwner(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Full Name</Label>
                  <input
                    type="text"
                    value={owner.name}
                    onChange={e => updateOwner(idx, 'name', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <Label>Title / Position</Label>
                  <input
                    type="text"
                    value={owner.title}
                    onChange={e => updateOwner(idx, 'title', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <input
                    type="text"
                    value={owner.address}
                    onChange={e => updateOwner(idx, 'address', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <input
                    type="date"
                    value={owner.dob}
                    onChange={e => updateOwner(idx, 'dob', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <Label>SSN (Last 4)</Label>
                  <input
                    type="text"
                    maxLength={4}
                    value={owner.ssnLast4}
                    onChange={e => updateOwner(idx, 'ssnLast4', e.target.value.replace(/\D/g, ''))}
                    placeholder="####"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <Label>Ownership %</Label>
                  <input
                    type="text"
                    value={owner.percentage}
                    onChange={e => updateOwner(idx, 'percentage', e.target.value)}
                    placeholder="e.g. 50%"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <input
                    type="text"
                    value={owner.relationship}
                    onChange={e => updateOwner(idx, 'relationship', e.target.value)}
                    placeholder="e.g. Managing Member"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 mb-4">
            I certify that the information provided above is true, complete, and accurate to the best
            of my knowledge.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="certifierName">Print Name</Label>
              <input
                id="certifierName"
                type="text"
                value={data.certifierName}
                onChange={e => updateField('certifierName', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="certifierTitle">Title</Label>
              <input
                id="certifierTitle"
                type="text"
                value={data.certifierTitle}
                onChange={e => updateField('certifierTitle', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {data.signature ? (
            <SignatureDisplay
              signatureData={data.signature}
              signerName={data.certifierName}
              onClear={() => updateField('signature', null)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('signature', sig)}
              signerName={data.certifierName}
              attestationText="I certify that the above ownership disclosure is true, complete, and accurate."
              required
            />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
