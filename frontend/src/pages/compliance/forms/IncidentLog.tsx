import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface IncidentEntry {
  date: string;
  reported: string;
  client: string;
  category: 'Critical' | 'Reportable' | 'Unusual' | '';
  description: string;
  notifications: string;
  status: 'Open' | 'Closed' | '';
  resolved: string;
  correctiveActions: string;
}

interface FormData {
  entries: IncidentEntry[];
  reviewDate: string;
  reviewedBy: string;
}

const EMPTY_ENTRY: IncidentEntry = {
  date: '',
  reported: '',
  client: '',
  category: '',
  description: '',
  notifications: '',
  status: '',
  resolved: '',
  correctiveActions: '',
};

const DEFAULT_DATA: FormData = {
  entries: [{ ...EMPTY_ENTRY }],
  reviewDate: '',
  reviewedBy: '',
};

export default function IncidentLog() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-02', DEFAULT_DATA);
  const { getClientOptions, getCurrentUserName } = useFormData();

  const addEntry = () => {
    updateField('entries', [...data.entries, { ...EMPTY_ENTRY }]);
  };

  const removeEntry = (index: number) => {
    updateField('entries', data.entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof IncidentEntry, value: string) => {
    const updated = [...data.entries];
    updated[index] = { ...updated[index], [field]: value };
    updateField('entries', updated);
  };

  const openCount = data.entries.filter(e => e.status === 'Open').length;
  const closedCount = data.entries.filter(e => e.status === 'Closed').length;

  return (
    <FormShell
      formId="02"
      title="Incident Log"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <div className="flex items-center gap-4 mb-4">
        <Badge className="bg-gray-100 text-gray-800">{data.entries.length} Entries</Badge>
        <Badge className="bg-red-100 text-red-800">{openCount} Open</Badge>
        <Badge className="bg-green-100 text-green-800">{closedCount} Closed</Badge>
        <div className="flex-1" />
        <Button size="sm" onClick={addEntry}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2 w-8">#</th>
                  <th className="text-left py-2 px-2 w-28">Date</th>
                  <th className="text-left py-2 px-2 w-28">Reported</th>
                  <th className="text-left py-2 px-2 w-32">Client</th>
                  <th className="text-left py-2 px-2 w-24">Category</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-left py-2 px-2 w-24">Status</th>
                  <th className="text-left py-2 px-2 w-28">Resolved</th>
                  <th className="text-left py-2 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.reported} onChange={e => updateEntry(idx, 'reported', e.target.value)} placeholder="By/Date" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" />
                    </td>
                    <td className="py-2 px-2">
                      <select value={entry.client} onChange={e => updateEntry(idx, 'client', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        {getClientOptions().map(opt => (
                          <option key={opt.value} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select value={entry.category} onChange={e => updateEntry(idx, 'category', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        <option value="Critical">Critical</option>
                        <option value="Reportable">Reportable</option>
                        <option value="Unusual">Unusual</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.description} onChange={e => updateEntry(idx, 'description', e.target.value)} placeholder="Brief description" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" />
                    </td>
                    <td className="py-2 px-2">
                      <select value={entry.status} onChange={e => updateEntry(idx, 'status', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input type="date" value={entry.resolved} onChange={e => updateEntry(idx, 'resolved', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" />
                    </td>
                    <td className="py-2 px-2">
                      {data.entries.length > 1 && (
                        <button onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
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
          <CardTitle>QAPI Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Reviewed quarterly by QAPI Committee. This is a permanent record.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reviewDate">Review Date</Label>
              <input id="reviewDate" type="date" value={data.reviewDate} onChange={e => updateField('reviewDate', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reviewedBy">Reviewed By</Label>
                {!data.reviewedBy && <button onClick={() => updateField('reviewedBy', getCurrentUserName())} className="text-xs text-primary-600 hover:text-primary-800">Auto-fill</button>}
              </div>
              <input id="reviewedBy" type="text" value={data.reviewedBy} onChange={e => updateField('reviewedBy', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </FormShell>
  );
}
