import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

interface FormData {
  clientId: string;
  clientName: string;
  dateOfBirth: string;
  address: string;
  medicaidId: string;
  informationToRelease: string;
  purposeOfRelease: string;
  releaseTo: string;
  releaseToAddress: string;
  expirationDate: string;
  signerIsRepresentative: boolean;
  representativeRelationship: string;
  clientSignature: SignatureData | null;
  clientDate: string;
  witnessName: string;
  witnessDate: string;
  witnessSignature: SignatureData | null;
}

function defaultExpiration(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

const DEFAULT_DATA: FormData = {
  clientId: '',
  clientName: '',
  dateOfBirth: '',
  address: '',
  medicaidId: '',
  informationToRelease: '',
  purposeOfRelease: '',
  releaseTo: '',
  releaseToAddress: '',
  expirationDate: defaultExpiration(),
  signerIsRepresentative: false,
  representativeRelationship: '',
  clientSignature: null,
  clientDate: new Date().toISOString().split('T')[0],
  witnessName: '',
  witnessDate: new Date().toISOString().split('T')[0],
  witnessSignature: null,
};

export default function ReleaseOfInformationForm() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-06', DEFAULT_DATA);
  const { getClientOptions, getClientById, getCurrentUserName, getClientIdentityFromIntake } = useFormData();

  const handleClientChange = async (clientId: string) => {
    updateField('clientId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('clientName', `${client.firstName} ${client.lastName}`);
      updateField('dateOfBirth', client.dateOfBirth || '');
      updateField('address', [client.address, client.city, client.state, client.zip].filter(Boolean).join(', '));
      updateField('medicaidId', client.medicaidNumber || '');
    }
    // Enrich with fuller intake data (DOB, address, Medicaid ID from intake)
    const identity = await getClientIdentityFromIntake(clientId);
    if (identity) {
      if (identity.dob) updateField('dateOfBirth', identity.dob);
      if (identity.address) updateField('address', identity.address);
      if (identity.medicaidId) updateField('medicaidId', identity.medicaidId);
      addAuditEntry('FIELD_UPDATED', 'Client identity enriched from intake records');
    }
  };

  return (
    <FormShell formId="06" title="Release of Information Form" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
      <Card>
        <CardHeader><CardTitle>Client Identification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <select id="client" value={data.clientId} onChange={e => handleClientChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">Select client...</option>
              {getClientOptions().map(opt => (<option key={opt.value} value={opt.value}>{opt.label} {opt.medicaidNumber ? `— ${opt.medicaidNumber}` : ''}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <input id="dob" type="date" value={data.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="medicaidId">Medicaid ID</Label>
              <input id="medicaidId" type="text" value={data.medicaidId} onChange={e => updateField('medicaidId', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <input id="address" type="text" value={data.address} onChange={e => updateField('address', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Release Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="infoToRelease">Information to be Released</Label>
            <textarea id="infoToRelease" rows={3} value={data.informationToRelease} onChange={e => updateField('informationToRelease', e.target.value)} placeholder="Describe the specific information to be released (e.g., medical records, assessments, care plans)..." className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <Label htmlFor="purpose">Purpose of Release</Label>
            <select id="purpose" value={data.purposeOfRelease} onChange={e => updateField('purposeOfRelease', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">Select purpose...</option>
              <option value="Treatment">Treatment</option>
              <option value="Payment">Payment</option>
              <option value="Healthcare Operations">Healthcare Operations</option>
              <option value="Legal">Legal</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="releaseTo">Release To (Name/Organization)</Label>
              <input id="releaseTo" type="text" value={data.releaseTo} onChange={e => updateField('releaseTo', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="releaseToAddress">Address / Fax / Email</Label>
              <input id="releaseToAddress" type="text" value={data.releaseToAddress} onChange={e => updateField('releaseToAddress', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div className="max-w-xs">
            <Label htmlFor="expiration">Expiration Date</Label>
            <input id="expiration" type="date" value={data.expirationDate} onChange={e => updateField('expirationDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            <p className="text-xs text-gray-500 mt-1">Default: 1 year from today</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>HIPAA Notice</CardTitle></CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
            <p className="mb-2"><strong>Notice:</strong> This authorization complies with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule, 45 CFR Parts 160 and 164.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You have the right to revoke this authorization at any time by submitting a written request.</li>
              <li>Revocation will not affect any actions taken before the revocation is received.</li>
              <li>Treatment, payment, enrollment, or eligibility will not be conditioned on signing this authorization.</li>
              <li>Information disclosed may be subject to re-disclosure and no longer protected by HIPAA.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Client / Representative Signature</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isRep" checked={data.signerIsRepresentative} onChange={e => updateField('signerIsRepresentative', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <Label htmlFor="isRep">Signed by Legal Representative</Label>
          </div>
          {data.signerIsRepresentative && (
            <div className="max-w-xs">
              <Label htmlFor="repRelationship">Relationship to Client</Label>
              <input id="repRelationship" type="text" value={data.representativeRelationship} onChange={e => updateField('representativeRelationship', e.target.value)} placeholder="e.g. Power of Attorney, Guardian" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          )}
          <div className="max-w-xs">
            <Label htmlFor="clientDate">Date</Label>
            <input id="clientDate" type="date" value={data.clientDate} onChange={e => updateField('clientDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          {data.clientSignature ? (
            <SignatureDisplay signatureData={data.clientSignature} signerName={data.clientName} onClear={() => updateField('clientSignature', null)} />
          ) : (
            <ESignature onSign={sig => updateField('clientSignature', sig)} signerName={data.clientName} attestationText="I authorize the release of the information described above to the named recipient for the stated purpose." required />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Witness Signature</CardTitle>
            {!data.witnessName && <button onClick={() => updateField('witnessName', getCurrentUserName())} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="witnessName">Witness Name</Label>
              <input id="witnessName" type="text" value={data.witnessName} onChange={e => updateField('witnessName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="witnessDate">Date</Label>
              <input id="witnessDate" type="date" value={data.witnessDate} onChange={e => updateField('witnessDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          {data.witnessSignature ? (
            <SignatureDisplay signatureData={data.witnessSignature} signerName={data.witnessName} onClear={() => updateField('witnessSignature', null)} />
          ) : (
            <ESignature onSign={sig => updateField('witnessSignature', sig)} signerName={data.witnessName} attestationText="I witness the signing of this authorization for release of information." required />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
