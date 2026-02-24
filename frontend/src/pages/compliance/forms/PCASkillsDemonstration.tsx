import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

const SKILLS = [
  'Hand Hygiene / Infection Control',
  'Vital Signs (Temperature, Pulse, Respiration, Blood Pressure)',
  'Bathing / Shower Assistance',
  'Oral / Denture Care',
  'Hair Care / Grooming',
  'Dressing Assistance',
  'Toileting / Incontinence Care',
  'Bed Making',
  'Feeding Assistance',
  'Transfer (Bed to Chair)',
  'Ambulation (with/without assistive device)',
  'Range of Motion Exercises',
  'Positioning / Turning',
  'Medication Reminder',
  'Emergency Response',
  'Documentation / Reporting',
];

type Rating = 'satisfactory' | 'needs_improvement' | 'na' | '';

interface SkillEntry {
  rating: Rating;
  comments: string;
}

interface FormData {
  employeeId: string;
  employeeName: string;
  assessmentDate: string;
  skills: SkillEntry[];
  evaluatorName: string;
  evaluatorCredentials: string;
  employeeSignature: SignatureData | null;
  evaluatorSignature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeId: '',
  employeeName: '',
  assessmentDate: new Date().toISOString().split('T')[0],
  skills: SKILLS.map(() => ({ rating: '' as Rating, comments: '' })),
  evaluatorName: '',
  evaluatorCredentials: '',
  employeeSignature: null,
  evaluatorSignature: null,
};

export default function PCASkillsDemonstration() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-19', DEFAULT_DATA);
  const { getEmployeeOptions, getEmployeeById, getCurrentUserName, getEmployeeTrainingScores } = useFormData();

  const handleEmployeeChange = async (employeeId: string) => {
    updateField('employeeId', employeeId);
    const emp = getEmployeeById(employeeId);
    if (emp) {
      updateField('employeeName', `${emp.firstName} ${emp.lastName}`);
    }
    // Check for existing skills demonstration records
    const scores = await getEmployeeTrainingScores(employeeId);
    if (scores.length > 0) {
      const skillsRecord = scores.find(s => s.trainingName.toLowerCase().includes('skills') || s.trainingName.toLowerCase().includes('demonstration'));
      if (skillsRecord?.completedDate) {
        addAuditEntry('FIELD_UPDATED', `Prior skills assessment found from ${skillsRecord.completedDate.split('T')[0]} — status: ${skillsRecord.status}`);
      }
    }
  };

  const updateSkill = (index: number, field: keyof SkillEntry, value: string) => {
    const updated = [...data.skills];
    updated[index] = { ...updated[index], [field]: value };
    updateField('skills', updated);
  };

  const satisfactoryCount = data.skills.filter(s => s.rating === 'satisfactory').length;
  const needsImprovementCount = data.skills.filter(s => s.rating === 'needs_improvement').length;
  const ratedCount = data.skills.filter(s => s.rating !== '').length;

  return (
    <FormShell
      formId="19"
      title="PCA Skills Return Demonstration"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <select id="employee" value={data.employeeId} onChange={e => handleEmployeeChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select employee...</option>
                {getEmployeeOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.role}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="assessmentDate">Assessment Date</Label>
              <input id="assessmentDate" type="date" value={data.assessmentDate} onChange={e => updateField('assessmentDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{satisfactoryCount}</div>
            <div className="text-xs text-gray-500">Satisfactory</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{needsImprovementCount}</div>
            <div className="text-xs text-gray-500">Needs Improvement</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{ratedCount}/{SKILLS.length}</div>
            <div className="text-xs text-gray-500">Evaluated</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2 w-8">#</th>
                  <th className="text-left py-2 px-2">Skill</th>
                  <th className="text-center py-2 px-2 w-20">S</th>
                  <th className="text-center py-2 px-2 w-20">NI</th>
                  <th className="text-center py-2 px-2 w-20">N/A</th>
                  <th className="text-left py-2 px-2 w-48">Comments</th>
                </tr>
              </thead>
              <tbody>
                {SKILLS.map((skill, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${data.skills[idx]?.rating === 'needs_improvement' ? 'bg-amber-50/50' : ''}`}>
                    <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-gray-800">{skill}</td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="radio"
                        name={`skill-${idx}`}
                        checked={data.skills[idx]?.rating === 'satisfactory'}
                        onChange={() => updateSkill(idx, 'rating', 'satisfactory')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="radio"
                        name={`skill-${idx}`}
                        checked={data.skills[idx]?.rating === 'needs_improvement'}
                        onChange={() => updateSkill(idx, 'rating', 'needs_improvement')}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="radio"
                        name={`skill-${idx}`}
                        checked={data.skills[idx]?.rating === 'na'}
                        onChange={() => updateSkill(idx, 'rating', 'na')}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={data.skills[idx]?.comments || ''}
                        onChange={e => updateSkill(idx, 'comments', e.target.value)}
                        placeholder="Comments..."
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <strong>S</strong> = Satisfactory | <strong>NI</strong> = Needs Improvement | <strong>N/A</strong> = Not Applicable
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Employee Signature</CardTitle></CardHeader>
          <CardContent>
            {data.employeeSignature ? (
              <SignatureDisplay signatureData={data.employeeSignature} signerName={data.employeeName} onClear={() => updateField('employeeSignature', null)} />
            ) : (
              <ESignature onSign={sig => updateField('employeeSignature', sig)} signerName={data.employeeName} attestationText="I acknowledge the results of this skills return demonstration assessment." required />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>RN Evaluator Signature</CardTitle>
              {!data.evaluatorName && (
                <button onClick={() => updateField('evaluatorName', getCurrentUserName())} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="evaluatorName">Name</Label>
                <input id="evaluatorName" type="text" value={data.evaluatorName} onChange={e => updateField('evaluatorName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <Label htmlFor="evaluatorCredentials">Credentials</Label>
                <select id="evaluatorCredentials" value={data.evaluatorCredentials} onChange={e => updateField('evaluatorCredentials', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Select...</option>
                  <option value="RN">RN</option>
                  <option value="LPN">LPN</option>
                  <option value="LSW">LSW</option>
                </select>
              </div>
            </div>
            {data.evaluatorSignature ? (
              <SignatureDisplay signatureData={data.evaluatorSignature} signerName={data.evaluatorName} onClear={() => updateField('evaluatorSignature', null)} />
            ) : (
              <ESignature onSign={sig => updateField('evaluatorSignature', sig)} signerName={data.evaluatorName} attestationText="I certify that I have observed and evaluated this employee's skills demonstration." required />
            )}
          </CardContent>
        </Card>
      </div>
    </FormShell>
  );
}
