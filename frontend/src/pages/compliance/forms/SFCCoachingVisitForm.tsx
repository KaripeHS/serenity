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
  caregiverName: string;
  dateOfVisit: string;
  visitType: 'In-Person' | 'Phone' | '';
  professionalName: string;
  credentials: string;
  topicsDiscussed: string;
  observationOfCare: string;
  individualSatisfaction: string;
  caregiverWellbeing: string;
  livingArrangement: string;
  actionItems: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  individualId: '',
  individualName: '',
  caregiverName: '',
  dateOfVisit: new Date().toISOString().split('T')[0],
  visitType: '',
  professionalName: '',
  credentials: '',
  topicsDiscussed: '',
  observationOfCare: '',
  individualSatisfaction: '',
  caregiverWellbeing: '',
  livingArrangement: '',
  actionItems: '',
  signature: null,
};

export default function SFCCoachingVisitForm() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-15', DEFAULT_DATA);
  const { getClientOptions, getClientById, getCurrentUserName, getCarePlanForForm } = useFormData();

  const handleClientChange = async (clientId: string) => {
    updateField('individualId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('individualName', `${client.firstName} ${client.lastName}`);
    }
    // Pre-fill caregiver from care team + goals into topics
    const carePlan = await getCarePlanForForm(clientId);
    if (carePlan) {
      const primaryCg = carePlan.careTeam.find(m => m.role === 'primary_caregiver');
      if (primaryCg && !data.caregiverName) {
        updateField('caregiverName', primaryCg.name);
      }
      const activeGoals = carePlan.goals.filter(g => g.status === 'in_progress');
      if (activeGoals.length > 0) {
        const goalsText = activeGoals.map(g => `- ${g.description} (${g.progress}% progress)`).join('\n');
        updateField('topicsDiscussed', `Active Care Plan Goals to Review:\n${goalsText}`);
        addAuditEntry('FIELD_UPDATED', 'Topics pre-populated from active care plan goals');
      }
    }
  };

  const autoFillProfessional = () => {
    const name = getCurrentUserName();
    if (name) updateField('professionalName', name);
  };

  const assessmentSections = [
    { key: 'topicsDiscussed' as const, label: 'Topics Discussed', placeholder: 'Describe the topics covered during this coaching visit...' },
    { key: 'observationOfCare' as const, label: 'Observation of Care', placeholder: 'Document observations of care being provided...' },
    { key: 'individualSatisfaction' as const, label: 'Individual Satisfaction', placeholder: 'Assess the individual\'s satisfaction with care...' },
    { key: 'caregiverWellbeing' as const, label: 'Caregiver Wellbeing', placeholder: 'Assess the caregiver\'s wellbeing and support needs...' },
    { key: 'livingArrangement' as const, label: 'Living Arrangement', placeholder: 'Assess the living arrangement and home environment...' },
    { key: 'actionItems' as const, label: 'Action Items / Follow-Up', placeholder: 'List any follow-up actions required...' },
  ];

  return (
    <FormShell
      formId="15"
      title="SFC Coaching Visit Form"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="individual">Individual</Label>
              <select id="individual" value={data.individualId} onChange={e => handleClientChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select individual...</option>
                {getClientOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="caregiverName">Caregiver Name</Label>
              <input id="caregiverName" type="text" value={data.caregiverName} onChange={e => updateField('caregiverName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateOfVisit">Date of Visit</Label>
              <input id="dateOfVisit" type="date" value={data.dateOfVisit} onChange={e => updateField('dateOfVisit', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label>Visit Type</Label>
              <div className="flex gap-4 mt-2">
                {(['In-Person', 'Phone'] as const).map(type => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="visitType"
                      checked={data.visitType === type}
                      onChange={() => updateField('visitType', type)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="professionalName">Professional</Label>
                {!data.professionalName && (
                  <button onClick={autoFillProfessional} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>
                )}
              </div>
              <input id="professionalName" type="text" value={data.professionalName} onChange={e => updateField('professionalName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="credentials">Credentials</Label>
              <select id="credentials" value={data.credentials} onChange={e => updateField('credentials', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select...</option>
                <option value="RN">RN</option>
                <option value="LPN">LPN</option>
                <option value="LSW">LSW</option>
                <option value="LISW">LISW</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {assessmentSections.map(section => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle>{section.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              rows={4}
              value={data[section.key]}
              onChange={e => updateField(section.key, e.target.value)}
              placeholder={section.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Professional Signature</CardTitle>
        </CardHeader>
        <CardContent>
          {data.signature ? (
            <SignatureDisplay signatureData={data.signature} signerName={data.professionalName} onClear={() => updateField('signature', null)} />
          ) : (
            <ESignature
              onSign={sig => updateField('signature', sig)}
              signerName={data.professionalName}
              attestationText="I certify that I conducted this coaching visit and the information documented above is accurate."
              required
            />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
