import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

const ORIENTATION_TOPICS = [
  'Mission and Values',
  'HIPAA and Confidentiality',
  'Abuse/Neglect/Exploitation and Mandatory Reporting',
  'Emergency Procedures',
  'Professional Conduct',
  'Client Rights',
];

interface TopicEntry {
  completed: boolean;
  date: string;
  trainer: string;
}

interface FormData {
  volunteerName: string;
  orientationDate: string;
  topics: TopicEntry[];
  volunteerSignature: SignatureData | null;
  volunteerSignatureDate: string;
}

const DEFAULT_DATA: FormData = {
  volunteerName: '',
  orientationDate: new Date().toISOString().split('T')[0],
  topics: ORIENTATION_TOPICS.map(() => ({ completed: false, date: '', trainer: '' })),
  volunteerSignature: null,
  volunteerSignatureDate: new Date().toISOString().split('T')[0],
};

export default function VolunteerOrientationChecklist() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-13', DEFAULT_DATA);
  const { getCurrentUserName } = useFormData();

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
  };

  const completedCount = data.topics.filter(t => t.completed).length;

  return (
    <FormShell
      formId="13"
      title="Volunteer Orientation Checklist"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volunteerName">Volunteer Name</Label>
              <input
                id="volunteerName"
                type="text"
                value={data.volunteerName}
                onChange={e => updateField('volunteerName', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="orientationDate">Orientation Date</Label>
              <input
                id="orientationDate"
                type="date"
                value={data.orientationDate}
                onChange={e => updateField('orientationDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Orientation Topics ({completedCount}/{ORIENTATION_TOPICS.length})
            </CardTitle>
            <button
              onClick={markAllCompleted}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Mark All Completed
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 w-8">#</th>
                  <th className="text-left py-2 px-2">Topic</th>
                  <th className="text-center py-2 px-2 w-12">Done</th>
                  <th className="text-left py-2 px-2 w-32">Date</th>
                  <th className="text-left py-2 px-2 w-40">Trainer</th>
                </tr>
              </thead>
              <tbody>
                {ORIENTATION_TOPICS.map((topic, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
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
                      <input
                        type="date"
                        value={data.topics[idx]?.date || ''}
                        onChange={e => updateTopic(idx, 'date', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={data.topics[idx]?.trainer || ''}
                        onChange={e => updateTopic(idx, 'trainer', e.target.value)}
                        placeholder="Trainer name"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volunteer Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="sigDate">Date</Label>
            <input
              id="sigDate"
              type="date"
              value={data.volunteerSignatureDate}
              onChange={e => updateField('volunteerSignatureDate', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {data.volunteerSignature ? (
            <SignatureDisplay
              signatureData={data.volunteerSignature}
              signerName={data.volunteerName}
              onClear={() => updateField('volunteerSignature', null)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('volunteerSignature', sig)}
              signerName={data.volunteerName}
              attestationText="I confirm that I have completed all orientation topics listed above and understand the information presented."
              required
            />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
