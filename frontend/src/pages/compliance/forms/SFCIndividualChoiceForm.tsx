import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

interface FormData {
  individualId: string;
  individualName: string;
  dateOfBirth: string;
  address: string;
  medicaidId: string;
  caseManager: string;
  cmPhone: string;
  caregiverName: string;
  caregiverRelationship: string;
  caregiverAddress: string;
  individualSignature: SignatureData | null;
  individualDate: string;
  legalRepName: string;
  legalRepRelationship: string;
  witnessName: string;
  witnessDate: string;
  witnessSignature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  individualId: '',
  individualName: '',
  dateOfBirth: '',
  address: '',
  medicaidId: '',
  caseManager: '',
  cmPhone: '',
  caregiverName: '',
  caregiverRelationship: '',
  caregiverAddress: '',
  individualSignature: null,
  individualDate: new Date().toISOString().split('T')[0],
  legalRepName: '',
  legalRepRelationship: '',
  witnessName: '',
  witnessDate: new Date().toISOString().split('T')[0],
  witnessSignature: null,
};

export default function SFCIndividualChoiceForm() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-14', DEFAULT_DATA);
  const { getClientOptions, getClientById, getCurrentUserName, getCaseManagerInfo } = useFormData();

  const handleClientChange = async (clientId: string) => {
    updateField('individualId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('individualName', `${client.firstName} ${client.lastName}`);
      updateField('dateOfBirth', client.dateOfBirth || '');
      updateField('address', [client.address, client.city, client.state, client.zip].filter(Boolean).join(', '));
      updateField('medicaidId', client.medicaidNumber || '');
    }
    // Auto-fill case manager from intake
    const cmInfo = await getCaseManagerInfo(clientId);
    if (cmInfo) {
      if (cmInfo.caseManagerName) updateField('caseManager', cmInfo.caseManagerName);
      if (cmInfo.caseManagerPhone) updateField('cmPhone', cmInfo.caseManagerPhone);
      addAuditEntry('FIELD_UPDATED', 'Case manager info auto-filled from intake data');
    }
  };

  return (
    <FormShell
      formId="14"
      title="SFC Individual Choice Form"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Individual Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="individual">Individual</Label>
            <select
              id="individual"
              value={data.individualId}
              onChange={e => handleClientChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select individual...</option>
              {getClientOptions().map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.medicaidNumber ? `— ${opt.medicaidNumber}` : ''}
                </option>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caseManager">Case Manager</Label>
              <input id="caseManager" type="text" value={data.caseManager} onChange={e => updateField('caseManager', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="cmPhone">CM Phone</Label>
              <input id="cmPhone" type="tel" value={data.cmPhone} onChange={e => updateField('cmPhone', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selected Caregiver</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caregiverName">Caregiver Name</Label>
              <input id="caregiverName" type="text" value={data.caregiverName} onChange={e => updateField('caregiverName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="caregiverRelationship">Relationship to Individual</Label>
              <input id="caregiverRelationship" type="text" value={data.caregiverRelationship} onChange={e => updateField('caregiverRelationship', e.target.value)} placeholder="e.g. Daughter, Son, Spouse" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <Label htmlFor="caregiverAddress">Caregiver Address</Label>
            <input id="caregiverAddress" type="text" value={data.caregiverAddress} onChange={e => updateField('caregiverAddress', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              I confirm I have chosen the above caregiver for Structured Family Caregiving (SFC) services.
              This caregiver will reside in the same home and provide care as authorized by the PASSPORT program.
              I understand that I may change my caregiver or discontinue SFC services at any time by notifying
              my Case Manager and Serenity Care Partners LLC.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual / Legal Representative Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="individualDate">Date</Label>
              <input id="individualDate" type="date" value={data.individualDate} onChange={e => updateField('individualDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="legalRepName">Legal Representative (if applicable)</Label>
              <input id="legalRepName" type="text" value={data.legalRepName} onChange={e => updateField('legalRepName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="legalRepRelationship">Relationship</Label>
              <input id="legalRepRelationship" type="text" value={data.legalRepRelationship} onChange={e => updateField('legalRepRelationship', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          {data.individualSignature ? (
            <SignatureDisplay
              signatureData={data.individualSignature}
              signerName={data.legalRepName || data.individualName}
              onClear={() => updateField('individualSignature', null)}
            />
          ) : (
            <ESignature
              onSign={sig => updateField('individualSignature', sig)}
              signerName={data.legalRepName || data.individualName}
              attestationText="I voluntarily choose the above-named caregiver for Structured Family Caregiving services."
              required
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Witness Signature</CardTitle>
            {!data.witnessName && (
              <button onClick={() => { updateField('witnessName', getCurrentUserName()); }} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>
            )}
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
            <ESignature onSign={sig => updateField('witnessSignature', sig)} signerName={data.witnessName} attestationText="I witness that the above-named individual has voluntarily chosen their caregiver for SFC services." required />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
