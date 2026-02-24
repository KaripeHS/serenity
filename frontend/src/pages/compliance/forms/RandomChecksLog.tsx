import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CheckEntry {
  date: string;
  time: string;
  client: string;
  caregiver: string;
  type: 'In-Person' | 'Phone' | '';
  findings: string;
  correctiveAction: string;
  initials: string;
}

interface FormData {
  entries: CheckEntry[];
}

const EMPTY_ENTRY: CheckEntry = { date: '', time: '', client: '', caregiver: '', type: '', findings: '', correctiveAction: '', initials: '' };

const DEFAULT_DATA: FormData = { entries: [{ ...EMPTY_ENTRY }] };

export default function RandomChecksLog() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-10', DEFAULT_DATA);
  const { getClientOptions, getEmployeeOptions, getCurrentUserName } = useFormData();

  const addEntry = () => updateField('entries', [...data.entries, { ...EMPTY_ENTRY }]);
  const removeEntry = (i: number) => updateField('entries', data.entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: keyof CheckEntry, value: string) => {
    const updated = [...data.entries];
    updated[i] = { ...updated[i], [field]: value };
    updateField('entries', updated);
  };

  return (
    <FormShell formId="10" title="Random Checks Log" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
      <div className="flex items-center gap-4 mb-4">
        <Badge className="bg-gray-100 text-gray-800">{data.entries.length} Entries</Badge>
        <div className="flex-1" />
        <Button size="sm" onClick={addEntry}><PlusIcon className="h-4 w-4 mr-1" />Add Entry</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2 w-28">Date</th>
                  <th className="text-left py-2 px-2 w-20">Time</th>
                  <th className="text-left py-2 px-2 w-32">Client</th>
                  <th className="text-left py-2 px-2 w-32">Caregiver</th>
                  <th className="text-left py-2 px-2 w-24">Type</th>
                  <th className="text-left py-2 px-2">Findings</th>
                  <th className="text-left py-2 px-2">Corrective Action</th>
                  <th className="text-left py-2 px-2 w-16">Initials</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2"><input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="time" value={entry.time} onChange={e => updateEntry(idx, 'time', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">
                      <select value={entry.client} onChange={e => updateEntry(idx, 'client', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        {getClientOptions().map(opt => (<option key={opt.value} value={opt.label}>{opt.label}</option>))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select value={entry.caregiver} onChange={e => updateEntry(idx, 'caregiver', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        {getEmployeeOptions().map(opt => (<option key={opt.value} value={opt.label}>{opt.label}</option>))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select value={entry.type} onChange={e => updateEntry(idx, 'type', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        <option value="In-Person">In-Person</option>
                        <option value="Phone">Phone</option>
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="text" value={entry.findings} onChange={e => updateEntry(idx, 'findings', e.target.value)} placeholder="Findings..." className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.correctiveAction} onChange={e => updateEntry(idx, 'correctiveAction', e.target.value)} placeholder="Action..." className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.initials} onChange={e => updateEntry(idx, 'initials', e.target.value)} placeholder="XX" maxLength={4} className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-center" /></td>
                    <td className="py-2 px-2">{data.entries.length > 1 && <button onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-4 w-4" /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500">Policy 22 — Reviewed quarterly by QAPI Committee. Permanent record.</p>
    </FormShell>
  );
}
