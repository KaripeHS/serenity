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
  clientIdNumber: string;
  caregiverId: string;
  caregiverName: string;
  pod: string;
  dateOfVisit: string;
  visitType: 'In-Person' | 'Virtual' | '';
  supervisingNurse: string;
  licenseNumber: string;
  observationOfCare: string;
  clientStatusSatisfaction: string;
  carePlanReview: string;
  recommendationsActions: string;
  carePlanUpdateRequired: 'Yes' | 'No' | '';
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  clientId: '',
  clientName: '',
  clientIdNumber: '',
  caregiverId: '',
  caregiverName: '',
  pod: '',
  dateOfVisit: new Date().toISOString().split('T')[0],
  visitType: '',
  supervisingNurse: '',
  licenseNumber: '',
  observationOfCare: '',
  clientStatusSatisfaction: '',
  carePlanReview: '',
  recommendationsActions: '',
  carePlanUpdateRequired: '',
  signature: null,
};

export default function SupervisoryVisitForm() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-03', DEFAULT_DATA);
  const { getClientOptions, getClientById, getEmployeeOptions, getEmployeeById, getPodOptions, getCurrentUserName, getCarePlanForForm } = useFormData();

  const handleClientChange = async (clientId: string) => {
    updateField('clientId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('clientName', `${client.firstName} ${client.lastName}`);
      updateField('clientIdNumber', client.medicaidNumber || '');
      updateField('pod', client.podName || '');
    }
    // Pre-fill care plan review section from active care plan
    const carePlan = await getCarePlanForForm(clientId);
    if (carePlan && carePlan.goals.length > 0) {
      const goalsText = carePlan.goals
        .filter(g => g.status === 'in_progress')
        .map(g => `[${g.category.toUpperCase()}] ${g.description} — ${g.progress}% progress`)
        .join('\n');
      if (goalsText) {
        updateField('carePlanReview', `Active Care Plan Goals:\n${goalsText}`);
        addAuditEntry('FIELD_UPDATED', 'Care plan review pre-populated from active care plan');
      }
    }
  };

  const handleCaregiverChange = (caregiverId: string) => {
    updateField('caregiverId', caregiverId);
    const emp = getEmployeeById(caregiverId);
    if (emp) updateField('caregiverName', `${emp.firstName} ${emp.lastName}`);
  };

  const autoFillNurse = () => {
    const name = getCurrentUserName();
    if (name) updateField('supervisingNurse', name);
  };

  const assessmentSections = [
    { key: 'observationOfCare' as const, label: 'Observation of Care Delivery and Caregiver Competence', placeholder: 'Document observations of care delivery and caregiver competence...' },
    { key: 'clientStatusSatisfaction' as const, label: 'Assessment of Client Status and Satisfaction', placeholder: 'Assess client status, changes since last visit, satisfaction with care...' },
    { key: 'carePlanReview' as const, label: 'Review of Care Plan Appropriateness', placeholder: 'Review whether the current care plan is appropriate and meeting client needs...' },
    { key: 'recommendationsActions' as const, label: 'Recommendations / Action Items', placeholder: 'List any recommendations or action items resulting from this visit...' },
  ];

  return (
    <FormShell formId="03" title="Supervisory Visit Form" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
      <Card>
        <CardHeader><CardTitle>Visit Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <select id="client" value={data.clientId} onChange={e => handleClientChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select client...</option>
                {getClientOptions().map(opt => (<option key={opt.value} value={opt.value}>{opt.label} {opt.medicaidNumber ? `— ${opt.medicaidNumber}` : ''}</option>))}
              </select>
            </div>
            <div>
              <Label htmlFor="caregiver">Caregiver</Label>
              <select id="caregiver" value={data.caregiverId} onChange={e => handleCaregiverChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select caregiver...</option>
                {getEmployeeOptions().map(opt => (<option key={opt.value} value={opt.value}>{opt.label} — {opt.role}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pod">Pod</Label>
              <select id="pod" value={data.pod} onChange={e => updateField('pod', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select pod...</option>
                {getPodOptions().map(opt => (<option key={opt.value} value={opt.label}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <Label htmlFor="dateOfVisit">Date of Visit</Label>
              <input id="dateOfVisit" type="date" value={data.dateOfVisit} onChange={e => updateField('dateOfVisit', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label>Visit Type</Label>
              <div className="flex gap-4 mt-2">
                {(['In-Person', 'Virtual'] as const).map(type => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="visitType" checked={data.visitType === type} onChange={() => updateField('visitType', type)} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="supervisingNurse">Supervising Nurse</Label>
                {!data.supervisingNurse && <button onClick={autoFillNurse} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>}
              </div>
              <input id="supervisingNurse" type="text" value={data.supervisingNurse} onChange={e => updateField('supervisingNurse', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="licenseNumber">License #</Label>
              <input id="licenseNumber" type="text" value={data.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {assessmentSections.map(section => (
        <Card key={section.key}>
          <CardHeader><CardTitle>{section.label}</CardTitle></CardHeader>
          <CardContent>
            <textarea rows={5} value={data[section.key]} onChange={e => updateField(section.key, e.target.value)} placeholder={section.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle>Care Plan Update</CardTitle></CardHeader>
        <CardContent>
          <Label>Care Plan Update Required?</Label>
          <div className="flex gap-6 mt-2">
            {(['Yes', 'No'] as const).map(val => (
              <label key={val} className="flex items-center gap-2 text-sm">
                <input type="radio" name="carePlanUpdate" checked={data.carePlanUpdateRequired === val} onChange={() => updateField('carePlanUpdateRequired', val)} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                {val}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Supervising Nurse Signature</CardTitle></CardHeader>
        <CardContent>
          {data.signature ? (
            <SignatureDisplay signatureData={data.signature} signerName={data.supervisingNurse} onClear={() => updateField('signature', null)} />
          ) : (
            <ESignature onSign={sig => updateField('signature', sig)} signerName={data.supervisingNurse} attestationText="I certify that I conducted this supervisory visit and the information documented above is accurate." required />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
