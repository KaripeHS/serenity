import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

const COMPETENCY_TOPICS = [
  'Communication',
  'Observation / Reporting',
  'Vital Signs',
  'Infection Control',
  'Body Functioning / Aging',
  'Safe Environment',
  'Emergency Procedures',
  'Client Needs',
  'Personal Hygiene',
  'Transfer / Ambulation',
  'Meal Prep / Nutrition',
  'HIPAA / Confidentiality',
  'Abuse Recognition',
  'Client Rights',
];

interface TopicScore {
  correct: number;
  total: number;
}

interface FormData {
  employeeId: string;
  employeeName: string;
  testDate: string;
  topicScores: TopicScore[];
  signature: SignatureData | null;
  evaluatorName: string;
  evaluatorSignature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeId: '',
  employeeName: '',
  testDate: new Date().toISOString().split('T')[0],
  topicScores: COMPETENCY_TOPICS.map(() => ({ correct: 0, total: 5 })),
  signature: null,
  evaluatorName: '',
  evaluatorSignature: null,
};

export default function PCAWrittenCompetency() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-18', DEFAULT_DATA);
  const { getEmployeeOptions, getEmployeeById, getCurrentUserName, getEmployeeTrainingScores } = useFormData();

  const handleEmployeeChange = async (employeeId: string) => {
    updateField('employeeId', employeeId);
    const emp = getEmployeeById(employeeId);
    if (emp) {
      updateField('employeeName', `${emp.firstName} ${emp.lastName}`);
    }
    // Pre-fill any existing competency scores from training records
    const scores = await getEmployeeTrainingScores(employeeId);
    if (scores.length > 0) {
      const competencyScore = scores.find(s => s.trainingName.toLowerCase().includes('competency') || s.trainingName.toLowerCase().includes('written'));
      if (competencyScore?.score != null && competencyScore.completedDate) {
        updateField('testDate', competencyScore.completedDate.split('T')[0]);
        addAuditEntry('FIELD_UPDATED', `Prior competency score found: ${competencyScore.score}% on ${competencyScore.completedDate.split('T')[0]}`);
      }
    }
  };

  const updateScore = (index: number, field: keyof TopicScore, value: number) => {
    const updated = [...data.topicScores];
    updated[index] = { ...updated[index], [field]: value };
    updateField('topicScores', updated);
  };

  const totals = useMemo(() => {
    const totalCorrect = data.topicScores.reduce((sum, s) => sum + s.correct, 0);
    const totalQuestions = data.topicScores.reduce((sum, s) => sum + s.total, 0);
    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const passing = percentage >= 80;
    return { totalCorrect, totalQuestions, percentage, passing };
  }, [data.topicScores]);

  return (
    <FormShell
      formId="18"
      title="PCA Written Competency Assessment"
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
              <Label htmlFor="testDate">Test Date</Label>
              <input id="testDate" type="date" value={data.testDate} onChange={e => updateField('testDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Results Summary</CardTitle>
            <Badge className={totals.passing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {totals.passing ? 'PASS' : 'FAIL'} — {totals.percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{totals.totalQuestions}</div>
              <div className="text-xs text-gray-500">Total Questions</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{totals.totalCorrect}</div>
              <div className="text-xs text-gray-500">Correct</div>
            </div>
            <div className={`p-3 rounded-lg ${totals.passing ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${totals.passing ? 'text-green-700' : 'text-red-700'}`}>{totals.percentage}%</div>
              <div className="text-xs text-gray-500">Score (80% to pass)</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div
              className={`h-3 rounded-full transition-all ${totals.passing ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${totals.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Topic Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 w-8">#</th>
                  <th className="text-left py-2 px-3">Topic</th>
                  <th className="text-center py-2 px-3 w-24">Correct</th>
                  <th className="text-center py-2 px-3 w-24">Total</th>
                  <th className="text-center py-2 px-3 w-20">%</th>
                </tr>
              </thead>
              <tbody>
                {COMPETENCY_TOPICS.map((topic, idx) => {
                  const score = data.topicScores[idx];
                  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                  return (
                    <tr key={idx} className={`border-b hover:bg-gray-50 ${pct < 80 && score.total > 0 ? 'bg-red-50/50' : ''}`}>
                      <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-gray-800">{topic}</td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={score.total}
                          value={score.correct}
                          onChange={e => updateScore(idx, 'correct', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={score.total}
                          onChange={e => updateScore(idx, 'total', parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-sm font-medium ${pct >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Employee Signature</CardTitle></CardHeader>
          <CardContent>
            {data.signature ? (
              <SignatureDisplay signatureData={data.signature} signerName={data.employeeName} onClear={() => updateField('signature', null)} />
            ) : (
              <ESignature onSign={sig => updateField('signature', sig)} signerName={data.employeeName} attestationText="I acknowledge the results of this written competency assessment." required />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Evaluator Signature</CardTitle>
              {!data.evaluatorName && (
                <button onClick={() => updateField('evaluatorName', getCurrentUserName())} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="evaluatorName">Evaluator Name</Label>
              <input id="evaluatorName" type="text" value={data.evaluatorName} onChange={e => updateField('evaluatorName', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            {data.evaluatorSignature ? (
              <SignatureDisplay signatureData={data.evaluatorSignature} signerName={data.evaluatorName} onClear={() => updateField('evaluatorSignature', null)} />
            ) : (
              <ESignature onSign={sig => updateField('evaluatorSignature', sig)} signerName={data.evaluatorName} attestationText="I certify that I have administered and scored this competency assessment accurately." required />
            )}
          </CardContent>
        </Card>
      </div>
    </FormShell>
  );
}
