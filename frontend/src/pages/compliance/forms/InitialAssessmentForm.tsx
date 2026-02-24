import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

/* Functional-status ADL / IADL keys */
const FUNCTIONAL_ITEMS: { key: string; label: string; category: 'ADL' | 'IADL' }[] = [
  { key: 'bathing', label: 'Bathing', category: 'ADL' },
  { key: 'dressing', label: 'Dressing', category: 'ADL' },
  { key: 'grooming', label: 'Grooming', category: 'ADL' },
  { key: 'toileting', label: 'Toileting', category: 'ADL' },
  { key: 'transferring', label: 'Transferring', category: 'ADL' },
  { key: 'ambulation', label: 'Ambulation', category: 'ADL' },
  { key: 'eating', label: 'Eating', category: 'ADL' },
  { key: 'mealPrep', label: 'Meal Preparation', category: 'IADL' },
  { key: 'housekeeping', label: 'Housekeeping', category: 'IADL' },
  { key: 'laundry', label: 'Laundry', category: 'IADL' },
  { key: 'medicationMgmt', label: 'Medication Management', category: 'IADL' },
];

type FunctionalRating = 'I' | 'A' | 'D' | '';

/* Form data interface */
interface FormData {
  clientId: string;
  clientName: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  medicaidId: string;
  emergencyContact: string;
  emergencyPhone: string;
  caseManager: string;
  cmPhone: string;
  referralDate: string;
  assessmentDate: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string;
  functionalStatus: Record<string, FunctionalRating>;
  orientation: string;
  memory: string;
  decisionMaking: string;
  communication: string;
  behavioralConcerns: string;
  accessEntry: string;
  fallHazards: string;
  fireSafety: string;
  bathroomSafety: string;
  kitchenSafety: string;
  utilities: string;
  overallSafety: string;
  livesWith: string;
  familyCaregiver: string;
  familyInvolvement: string;
  otherServices: string;
  goals: string;
  schedulePreferences: string;
  caregiverPreferences: string;
  specialInstructions: string;
  canMeetNeeds: 'yes' | 'no' | '';
  assignedPod: string;
  signature: SignatureData | null;
}

const DEFAULT_FUNCTIONAL_STATUS: Record<string, FunctionalRating> = Object.fromEntries(
  FUNCTIONAL_ITEMS.map(i => [i.key, '' as FunctionalRating]),
);

const DEFAULT_DATA: FormData = {
  clientId: '',
  clientName: '',
  dateOfBirth: '',
  address: '',
  phone: '',
  medicaidId: '',
  emergencyContact: '',
  emergencyPhone: '',
  caseManager: '',
  cmPhone: '',
  referralDate: '',
  assessmentDate: new Date().toISOString().split('T')[0],
  primaryDiagnosis: '',
  secondaryDiagnoses: '',
  functionalStatus: { ...DEFAULT_FUNCTIONAL_STATUS },
  orientation: '',
  memory: '',
  decisionMaking: '',
  communication: '',
  behavioralConcerns: '',
  accessEntry: '',
  fallHazards: '',
  fireSafety: '',
  bathroomSafety: '',
  kitchenSafety: '',
  utilities: '',
  overallSafety: '',
  livesWith: '',
  familyCaregiver: '',
  familyInvolvement: '',
  otherServices: '',
  goals: '',
  schedulePreferences: '',
  caregiverPreferences: '',
  specialInstructions: '',
  canMeetNeeds: '',
  assignedPod: '',
  signature: null,
};

const INPUT_CLS =
  'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const RATING_LABELS: Record<FunctionalRating, string> = { I: 'Independent', A: 'Needs Assistance', D: 'Dependent', '': '' };

export default function InitialAssessmentForm() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-04', DEFAULT_DATA);
  const { getClientOptions, getClientById, getPodOptions, getCurrentUserName, getIntakeForAssessment } = useFormData();
  const [intakeSource, setIntakeSource] = useState<string | null>(null);

  const handleClientChange = async (clientId: string) => {
    updateField('clientId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('clientName', `${client.firstName} ${client.lastName}`);
      updateField('dateOfBirth', client.dateOfBirth || '');
      updateField('address', [client.address, client.city, client.state, client.zip].filter(Boolean).join(', '));
      updateField('phone', client.phone || '');
      updateField('medicaidId', client.medicaidNumber || '');
    }

    // Auto-populate from intake data (collect once, reuse everywhere)
    const intake = await getIntakeForAssessment(clientId);
    if (intake) {
      setIntakeSource(intake.intakeDate);
      addAuditEntry('FIELD_UPDATED', 'Auto-populated from client intake data');
      // Demographics (override with richer intake data)
      if (intake.address) updateField('address', intake.address);
      if (intake.phone) updateField('phone', intake.phone);
      if (intake.emergencyContact) updateField('emergencyContact', intake.emergencyContact);
      if (intake.emergencyPhone) updateField('emergencyPhone', intake.emergencyPhone);
      if (intake.caseManager) updateField('caseManager', intake.caseManager);
      if (intake.cmPhone) updateField('cmPhone', intake.cmPhone);
      if (intake.referralDate) updateField('referralDate', intake.referralDate);
      // Medical (only if HIPAA consent signed)
      if (intake.hipaaConsentSigned) {
        if (intake.primaryDiagnosis) updateField('primaryDiagnosis', intake.primaryDiagnosis);
        if (intake.secondaryDiagnoses) updateField('secondaryDiagnoses', intake.secondaryDiagnoses);
        // Map cognitive status to dropdown values
        if (intake.cognitiveStatus === 'oriented') updateField('orientation', 'Oriented x4');
        else if (intake.cognitiveStatus === 'mild_impairment') { updateField('orientation', 'Oriented x3'); updateField('memory', 'Mild Impairment'); }
        else if (intake.cognitiveStatus === 'moderate_impairment') { updateField('orientation', 'Oriented x2'); updateField('memory', 'Moderate Impairment'); }
        else if (intake.cognitiveStatus === 'severe_impairment') { updateField('orientation', 'Oriented x1'); updateField('memory', 'Severe Impairment'); }
        if (intake.allergies || intake.medications) {
          updateField('specialInstructions', [intake.allergies ? `Allergies: ${intake.allergies}` : '', intake.medications ? `Medications: ${intake.medications}` : ''].filter(Boolean).join('\n'));
        }
      }
      // Home environment
      if (intake.livesAlone) updateField('livesWith', 'Lives alone');
      else if (intake.otherResidents) updateField('livesWith', intake.otherResidents);
      if (intake.safetyHazards) updateField('overallSafety', 'Safe with Modifications');
      if (intake.hasStairs) updateField('accessEntry', intake.hasRamp ? 'Stairs present — ramp available' : 'Stairs present — no ramp');
      if (intake.hasWalkInShower) updateField('bathroomSafety', 'Walk-in shower available');
      if (intake.smokingInHome) updateField('fireSafety', 'Smoking in home — enhanced fire safety review needed');
      // Preferences
      if (intake.schedulePreferences) updateField('schedulePreferences', intake.schedulePreferences);
      const prefParts = [intake.caregiverGenderPref ? `Gender: ${intake.caregiverGenderPref}` : '', intake.caregiverLanguagePref ? `Language: ${intake.caregiverLanguagePref}` : ''].filter(Boolean);
      if (prefParts.length) updateField('caregiverPreferences', prefParts.join(', '));
      if (intake.specialRequirements) {
        const existing = [intake.allergies ? `Allergies: ${intake.allergies}` : '', intake.medications ? `Medications: ${intake.medications}` : ''].filter(Boolean).join('\n');
        updateField('specialInstructions', existing ? `${existing}\n${intake.specialRequirements}` : intake.specialRequirements);
      }
    }
  };

  const updateFunctional = (key: string, rating: FunctionalRating) => {
    updateField('functionalStatus', { ...data.functionalStatus, [key]: rating });
  };

  return (
    <FormShell formId="04" title="Initial Assessment Form" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
      {intakeSource && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>Pre-populated from intake data collected on <strong>{new Date(intakeSource).toLocaleDateString()}</strong>. Review and update fields as needed for this assessment.</span>
        </div>
      )}
      {/* Client Demographics */}
      <Card>
        <CardHeader><CardTitle>Client Demographics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <select id="client" value={data.clientId} onChange={e => handleClientChange(e.target.value)} className={INPUT_CLS}>
              <option value="">Select client...</option>
              {getClientOptions().map(opt => (<option key={opt.value} value={opt.value}>{opt.label} {opt.medicaidNumber ? `— ${opt.medicaidNumber}` : ''}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <input id="dob" type="date" value={data.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <input id="phone" type="tel" value={data.phone} onChange={e => updateField('phone', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="medicaidId">Medicaid ID</Label>
              <input id="medicaidId" type="text" value={data.medicaidId} onChange={e => updateField('medicaidId', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <input id="address" type="text" value={data.address} onChange={e => updateField('address', e.target.value)} className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <input id="emergencyContact" type="text" value={data.emergencyContact} onChange={e => updateField('emergencyContact', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <input id="emergencyPhone" type="tel" value={data.emergencyPhone} onChange={e => updateField('emergencyPhone', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caseManager">Case Manager</Label>
              <input id="caseManager" type="text" value={data.caseManager} onChange={e => updateField('caseManager', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="cmPhone">Case Manager Phone</Label>
              <input id="cmPhone" type="tel" value={data.cmPhone} onChange={e => updateField('cmPhone', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referralDate">Referral Date</Label>
              <input id="referralDate" type="date" value={data.referralDate} onChange={e => updateField('referralDate', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="assessmentDate">Assessment Date</Label>
              <input id="assessmentDate" type="date" value={data.assessmentDate} onChange={e => updateField('assessmentDate', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader><CardTitle>Medical Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
            <input id="primaryDiagnosis" type="text" value={data.primaryDiagnosis} onChange={e => updateField('primaryDiagnosis', e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <Label htmlFor="secondaryDiagnoses">Secondary Diagnoses</Label>
            <textarea id="secondaryDiagnoses" rows={2} value={data.secondaryDiagnoses} onChange={e => updateField('secondaryDiagnoses', e.target.value)} placeholder="List additional diagnoses..." className={INPUT_CLS} />
          </div>
        </CardContent>
      </Card>

      {/* Functional Status — ADL / IADL */}
      <Card>
        <CardHeader>
          <CardTitle>Functional Status Assessment</CardTitle>
          <p className="text-xs text-gray-500 mt-1">I = Independent, A = Needs Assistance, D = Dependent</p>
        </CardHeader>
        <CardContent>
          {(['ADL', 'IADL'] as const).map(cat => (
            <div key={cat} className="mb-4">
              <Badge className={cat === 'ADL' ? 'bg-blue-100 text-blue-800 mb-2' : 'bg-purple-100 text-purple-800 mb-2'}>
                {cat === 'ADL' ? 'Activities of Daily Living (ADL)' : 'Instrumental Activities of Daily Living (IADL)'}
              </Badge>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Activity</th>
                    <th className="text-center py-2 px-2 w-20">I</th>
                    <th className="text-center py-2 px-2 w-20">A</th>
                    <th className="text-center py-2 px-2 w-20">D</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNCTIONAL_ITEMS.filter(i => i.category === cat).map(item => (
                    <tr key={item.key} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-800">{item.label}</td>
                      {(['I', 'A', 'D'] as FunctionalRating[]).map(r => (
                        <td key={r} className="py-2 px-2 text-center">
                          <input
                            type="radio"
                            name={`func-${item.key}`}
                            checked={data.functionalStatus[item.key] === r}
                            onChange={() => updateFunctional(item.key, r)}
                            className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                            title={RATING_LABELS[r]}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cognitive / Behavioral */}
      <Card>
        <CardHeader><CardTitle>Cognitive / Behavioral Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orientation">Orientation</Label>
              <select id="orientation" value={data.orientation} onChange={e => updateField('orientation', e.target.value)} className={INPUT_CLS}>
                <option value="">Select...</option>
                <option value="Oriented x4">Oriented x4 (Person, Place, Time, Situation)</option>
                <option value="Oriented x3">Oriented x3</option>
                <option value="Oriented x2">Oriented x2</option>
                <option value="Oriented x1">Oriented x1</option>
                <option value="Disoriented">Disoriented</option>
              </select>
            </div>
            <div>
              <Label htmlFor="memory">Memory</Label>
              <select id="memory" value={data.memory} onChange={e => updateField('memory', e.target.value)} className={INPUT_CLS}>
                <option value="">Select...</option>
                <option value="Intact">Intact</option>
                <option value="Mild Impairment">Mild Impairment</option>
                <option value="Moderate Impairment">Moderate Impairment</option>
                <option value="Severe Impairment">Severe Impairment</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="decisionMaking">Decision-Making Ability</Label>
              <select id="decisionMaking" value={data.decisionMaking} onChange={e => updateField('decisionMaking', e.target.value)} className={INPUT_CLS}>
                <option value="">Select...</option>
                <option value="Independent">Independent — makes own decisions</option>
                <option value="Modified Independence">Modified Independence — needs occasional cues</option>
                <option value="Moderately Impaired">Moderately Impaired — needs frequent assistance</option>
                <option value="Severely Impaired">Severely Impaired — rarely makes decisions</option>
              </select>
            </div>
            <div>
              <Label htmlFor="communication">Communication</Label>
              <select id="communication" value={data.communication} onChange={e => updateField('communication', e.target.value)} className={INPUT_CLS}>
                <option value="">Select...</option>
                <option value="Clear">Clear — expresses needs effectively</option>
                <option value="Mild Difficulty">Mild Difficulty — occasionally unclear</option>
                <option value="Moderate Difficulty">Moderate Difficulty — frequently unclear</option>
                <option value="Unable">Unable — requires alternative communication</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="behavioralConcerns">Behavioral Concerns</Label>
            <textarea id="behavioralConcerns" rows={3} value={data.behavioralConcerns} onChange={e => updateField('behavioralConcerns', e.target.value)} placeholder="Describe any behavioral concerns (wandering, aggression, resistance to care, etc.)..." className={INPUT_CLS} />
          </div>
        </CardContent>
      </Card>

      {/* Home Environment / Safety */}
      <Card>
        <CardHeader><CardTitle>Home Environment / Safety Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'accessEntry', label: 'Access & Entry', field: 'accessEntry' as const, placeholder: 'Steps, ramps, door locks, entry accessibility...' },
            { id: 'fallHazards', label: 'Fall Hazards', field: 'fallHazards' as const, placeholder: 'Loose rugs, clutter, poor lighting, uneven floors...' },
            { id: 'fireSafety', label: 'Fire Safety', field: 'fireSafety' as const, placeholder: 'Smoke detectors, fire extinguisher, exit routes...' },
            { id: 'bathroomSafety', label: 'Bathroom Safety', field: 'bathroomSafety' as const, placeholder: 'Grab bars, non-slip mats, raised toilet seat...' },
            { id: 'kitchenSafety', label: 'Kitchen Safety', field: 'kitchenSafety' as const, placeholder: 'Stove safety, sharp objects, food storage...' },
            { id: 'utilities', label: 'Utilities', field: 'utilities' as const, placeholder: 'Heating, cooling, water, electricity status...' },
          ].map(item => (
            <div key={item.id}>
              <Label htmlFor={item.id}>{item.label}</Label>
              <textarea id={item.id} rows={2} value={data[item.field]} onChange={e => updateField(item.field, e.target.value)} placeholder={item.placeholder} className={INPUT_CLS} />
            </div>
          ))}
          <div>
            <Label htmlFor="overallSafety">Overall Safety Assessment</Label>
            <select id="overallSafety" value={data.overallSafety} onChange={e => updateField('overallSafety', e.target.value)} className={INPUT_CLS}>
              <option value="">Select...</option>
              <option value="Safe">Safe — no significant hazards identified</option>
              <option value="Safe with Modifications">Safe with Modifications — minor hazards noted and addressed</option>
              <option value="Unsafe">Unsafe — significant hazards present requiring remediation</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Support System */}
      <Card>
        <CardHeader><CardTitle>Support System</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="livesWith">Lives With</Label>
              <input id="livesWith" type="text" value={data.livesWith} onChange={e => updateField('livesWith', e.target.value)} placeholder="e.g. Spouse, Alone, Family member..." className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="familyCaregiver">Primary Family Caregiver</Label>
              <input id="familyCaregiver" type="text" value={data.familyCaregiver} onChange={e => updateField('familyCaregiver', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <Label htmlFor="familyInvolvement">Family Involvement</Label>
            <textarea id="familyInvolvement" rows={2} value={data.familyInvolvement} onChange={e => updateField('familyInvolvement', e.target.value)} placeholder="Describe level and type of family/informal caregiver involvement..." className={INPUT_CLS} />
          </div>
          <div>
            <Label htmlFor="otherServices">Other Services Currently Received</Label>
            <textarea id="otherServices" rows={2} value={data.otherServices} onChange={e => updateField('otherServices', e.target.value)} placeholder="e.g. Meals on Wheels, Adult Day Program, Home Delivered Meals..." className={INPUT_CLS} />
          </div>
        </CardContent>
      </Card>

      {/* Client Goals & Preferences */}
      <Card>
        <CardHeader><CardTitle>Client Goals & Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="goals">Client Goals</Label>
            <textarea id="goals" rows={3} value={data.goals} onChange={e => updateField('goals', e.target.value)} placeholder="What does the client hope to achieve with services? What are their personal goals?..." className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedulePreferences">Schedule Preferences</Label>
              <textarea id="schedulePreferences" rows={2} value={data.schedulePreferences} onChange={e => updateField('schedulePreferences', e.target.value)} placeholder="Preferred days/times for service..." className={INPUT_CLS} />
            </div>
            <div>
              <Label htmlFor="caregiverPreferences">Caregiver Preferences</Label>
              <textarea id="caregiverPreferences" rows={2} value={data.caregiverPreferences} onChange={e => updateField('caregiverPreferences', e.target.value)} placeholder="Gender preference, language, other preferences..." className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <textarea id="specialInstructions" rows={2} value={data.specialInstructions} onChange={e => updateField('specialInstructions', e.target.value)} placeholder="Allergies, pet information, key access, alarm codes (do not store passwords)..." className={INPUT_CLS} />
          </div>
        </CardContent>
      </Card>

      {/* Agency Determination */}
      <Card>
        <CardHeader><CardTitle>Agency Determination</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Can the agency meet the client's identified needs?</Label>
            <div className="flex gap-4 mt-2">
              {(['yes', 'no'] as const).map(val => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="canMeetNeeds"
                    checked={data.canMeetNeeds === val}
                    onChange={() => updateField('canMeetNeeds', val)}
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{val === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="max-w-xs">
            <Label htmlFor="assignedPod">Assigned Pod</Label>
            <select id="assignedPod" value={data.assignedPod} onChange={e => updateField('assignedPod', e.target.value)} className={INPUT_CLS}>
              <option value="">Select pod...</option>
              {getPodOptions().map(opt => (<option key={opt.value} value={opt.label}>{opt.label}</option>))}
            </select>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
            <p><strong>Assessing RN Signature:</strong> By signing below, I certify that this initial assessment was conducted in person at the client's residence and accurately reflects the client's current status and needs.</p>
          </div>
          {data.signature ? (
            <SignatureDisplay signatureData={data.signature} signerName={getCurrentUserName()} onClear={() => updateField('signature', null)} />
          ) : (
            <ESignature onSign={sig => updateField('signature', sig)} signerName={getCurrentUserName()} attestationText="I certify that this initial assessment was conducted in person and accurately reflects the client's current status and needs." required />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
