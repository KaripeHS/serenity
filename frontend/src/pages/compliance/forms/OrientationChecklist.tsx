import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

const ORIENTATION_TOPICS = [
  'Organizational Mission, Values, and Philosophy',
  'Provider Expectations and Job-Specific Duties',
  'Ethical Standards and Professional Conduct',
  'Personnel Policies (Attendance, Compensation, Benefits)',
  'Communication Channels and Reporting Structure',
  'Incident Identification, Classification, and Reporting',
  'Emergency Response Procedures (Fire, Weather, Medical)',
  'Infection Control and Standard Safety Protocols',
  'HIPAA and Confidentiality Requirements',
  'Abuse/Neglect/Exploitation Recognition and Mandatory Reporting',
  'EVV System Training and Documentation Requirements',
  'Introduction to Serenity ERP System',
  'Client Rights and Grievance Procedures',
  'Code of Ethics Review and Acknowledgment',
  'Employee Handbook Review and Acknowledgment',
  'Job Description Review and Acknowledgment',
];

interface TopicEntry {
  completed: boolean;
  date: string;
  trainer: string;
}

interface FormData {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  position: string;
  pod: string;
  topics: TopicEntry[];
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
  trainerName: string;
  trainerSignature: SignatureData | null;
  trainerSignatureDate: string;
}

const DEFAULT_DATA: FormData = {
  employeeId: '',
  employeeName: '',
  hireDate: '',
  position: '',
  pod: '',
  topics: ORIENTATION_TOPICS.map(() => ({ completed: false, date: '', trainer: '' })),
  employeeSignature: null,
  employeeSignatureDate: new Date().toISOString().split('T')[0],
  trainerName: '',
  trainerSignature: null,
  trainerSignatureDate: new Date().toISOString().split('T')[0],
};

// Map training names to orientation topic indices for auto-check
const TRAINING_TO_TOPIC_MAP: Record<string, number[]> = {
  'hipaa': [8],        // HIPAA topic (#9)
  'infection': [7],    // Infection Control (#8)
  'abuse': [9],        // Abuse/Neglect (#10)
  'evv': [10],         // EVV Training (#11)
  'cpr': [6],          // Emergency Procedures (#7)
  'first_aid': [6],
};

export default function OrientationChecklist() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-07', DEFAULT_DATA);
  const { getEmployeeOptions, getEmployeeById, getPodOptions, getCurrentUserName, getEmployeeTrainingScores } = useFormData();

  const handleEmployeeChange = async (employeeId: string) => {
    updateField('employeeId', employeeId);
    const emp = getEmployeeById(employeeId);
    if (emp) {
      updateField('employeeName', `${emp.firstName} ${emp.lastName}`);
      updateField('position', emp.certifications?.[0] || 'Staff');
      updateField('pod', emp.podCode || '');
    }
    // Pre-check topics that the employee has already completed in training
    const trainings = await getEmployeeTrainingScores(employeeId);
    if (trainings.length > 0) {
      const updated = [...data.topics];
      let checkedCount = 0;
      for (const t of trainings) {
        if (t.status !== 'completed') continue;
        const name = t.trainingName.toLowerCase();
        for (const [keyword, indices] of Object.entries(TRAINING_TO_TOPIC_MAP)) {
          if (name.includes(keyword)) {
            for (const idx of indices) {
              if (!updated[idx].completed) {
                updated[idx] = { completed: true, date: t.completedDate?.split('T')[0] || '', trainer: 'Completed via training system' };
                checkedCount++;
              }
            }
          }
        }
      }
      if (checkedCount > 0) {
        updateField('topics', updated);
        addAuditEntry('FIELD_UPDATED', `${checkedCount} orientation topics auto-checked from completed training records`);
      }
    }
  };

  const updateTopic = (index: number, field: keyof TopicEntry, value: string | boolean) => {
    const updated = [...data.topics];
    updated[index] = { ...updated[index], [field]: value };
    updateField('topics', updated);
  };

  const markAllCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const trainerName = getCurrentUserName();
    updateField(
      'topics',
      data.topics.map(t => ({
        ...t,
        completed: true,
        date: t.date || today,
        trainer: t.trainer || trainerName,
      }))
    );
    if (!data.trainerName) updateField('trainerName', trainerName);
  };

  const completedCount = data.topics.filter(t => t.completed).length;
  const progress = Math.round((completedCount / ORIENTATION_TOPICS.length) * 100);

  return (
    <FormShell
      formId="07"
      title="Orientation Checklist"
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
              <select
                id="employee"
                value={data.employeeId}
                onChange={e => handleEmployeeChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select employee...</option>
                {getEmployeeOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.role}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="hireDate">Hire Date</Label>
              <input id="hireDate" type="date" value={data.hireDate} onChange={e => updateField('hireDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <input id="position" type="text" value={data.position} onChange={e => updateField('position', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="pod">Pod</Label>
              <select id="pod" value={data.pod} onChange={e => updateField('pod', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select pod...</option>
                {getPodOptions().map(opt => (
                  <option key={opt.value} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Required Orientation Topics</CardTitle>
              <Badge className={progress === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {completedCount}/{ORIENTATION_TOPICS.length} ({progress}%)
              </Badge>
            </div>
            <button onClick={markAllCompleted} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
              Mark All Completed
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2 w-8">#</th>
                  <th className="text-left py-2 px-2">Required Topic</th>
                  <th className="text-center py-2 px-2 w-12">Done</th>
                  <th className="text-left py-2 px-2 w-32">Date</th>
                  <th className="text-left py-2 px-2 w-40">Trainer</th>
                </tr>
              </thead>
              <tbody>
                {ORIENTATION_TOPICS.map((topic, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${data.topics[idx]?.completed ? 'bg-green-50/50' : ''}`}>
                    <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-gray-800">{topic}</td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={data.topics[idx]?.completed || false}
                        onChange={e => updateTopic(idx, 'completed', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input type="date" value={data.topics[idx]?.date || ''} onChange={e => updateTopic(idx, 'date', e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={data.topics[idx]?.trainer || ''} onChange={e => updateTopic(idx, 'trainer', e.target.value)} placeholder="Trainer name" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Employee Signature</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="empSigDate">Date</Label>
              <input id="empSigDate" type="date" value={data.employeeSignatureDate} onChange={e => updateField('employeeSignatureDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            {data.employeeSignature ? (
              <SignatureDisplay signatureData={data.employeeSignature} signerName={data.employeeName} onClear={() => updateField('employeeSignature', null)} />
            ) : (
              <ESignature onSign={sig => updateField('employeeSignature', sig)} signerName={data.employeeName} attestationText="I confirm that I have completed all required orientation topics." required />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trainer Signature</CardTitle>
              {!data.trainerName && (
                <button onClick={() => updateField('trainerName', getCurrentUserName())} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="trainerName">Trainer Name</Label>
              <input id="trainerName" type="text" value={data.trainerName} onChange={e => updateField('trainerName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="trainerSigDate">Date</Label>
              <input id="trainerSigDate" type="date" value={data.trainerSignatureDate} onChange={e => updateField('trainerSignatureDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            {data.trainerSignature ? (
              <SignatureDisplay signatureData={data.trainerSignature} signerName={data.trainerName} onClear={() => updateField('trainerSignature', null)} />
            ) : (
              <ESignature onSign={sig => updateField('trainerSignature', sig)} signerName={data.trainerName} attestationText="I confirm that I have conducted orientation on all listed topics for this employee." required />
            )}
          </CardContent>
        </Card>
      </div>
    </FormShell>
  );
}
