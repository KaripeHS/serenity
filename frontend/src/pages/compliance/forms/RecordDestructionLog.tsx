import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DestructionEntry {
  date: string;
  recordType: string;
  dateRange: string;
  description: string;
  method: string;
  count: string;
  authorizedBy: string;
  witness: string;
}

interface FormData {
  entries: DestructionEntry[];
}

const EMPTY_ENTRY: DestructionEntry = { date: '', recordType: '', dateRange: '', description: '', method: '', count: '', authorizedBy: '', witness: '' };
const DEFAULT_DATA: FormData = { entries: [{ ...EMPTY_ENTRY }] };

export default function RecordDestructionLog() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-16', DEFAULT_DATA);
  const { getCurrentUserName } = useFormData();

  const addEntry = () => updateField('entries', [...data.entries, { ...EMPTY_ENTRY }]);
  const removeEntry = (i: number) => updateField('entries', data.entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: keyof DestructionEntry, value: string) => {
    const updated = [...data.entries];
    updated[i] = { ...updated[i], [field]: value };
    updateField('entries', updated);
  };

  return (
    <FormShell formId="16" title="Record Destruction Log" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
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
                  <th className="text-left py-2 px-2 w-32">Record Type</th>
                  <th className="text-left py-2 px-2 w-32">Date Range</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-left py-2 px-2 w-28">Method</th>
                  <th className="text-left py-2 px-2 w-16">#</th>
                  <th className="text-left py-2 px-2 w-28">Auth By</th>
                  <th className="text-left py-2 px-2 w-28">Witness</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2"><input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">
                      <select value={entry.recordType} onChange={e => updateEntry(idx, 'recordType', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        <option value="Client File">Client File</option>
                        <option value="Personnel File">Personnel File</option>
                        <option value="Financial Records">Financial Records</option>
                        <option value="Training Records">Training Records</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="text" value={entry.dateRange} onChange={e => updateEntry(idx, 'dateRange', e.target.value)} placeholder="e.g. 2018-2020" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.description} onChange={e => updateEntry(idx, 'description', e.target.value)} placeholder="Description..." className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">
                      <select value={entry.method} onChange={e => updateEntry(idx, 'method', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        <option value="Shredded">Shredded</option>
                        <option value="Incinerated">Incinerated</option>
                        <option value="Digital Wipe">Digital Wipe</option>
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="number" min={0} value={entry.count} onChange={e => updateEntry(idx, 'count', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-center" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.authorizedBy} onChange={e => updateEntry(idx, 'authorizedBy', e.target.value)} placeholder="Name" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.witness} onChange={e => updateEntry(idx, 'witness', e.target.value)} placeholder="Witness" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">{data.entries.length > 1 && <button onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-4 w-4" /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500">Policy 24 — Maintained permanently for compliance.</p>
    </FormShell>
  );
}
