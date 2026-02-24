import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface NotificationEntry {
  date: string;
  client: string;
  caseMgr: string;
  reason: string;
  method: 'Phone' | 'Email' | 'In-Person' | 'Written' | '';
  summary: string;
  notifiedBy: string;
  followUp: string;
}

interface FormData {
  entries: NotificationEntry[];
}

const EMPTY_ENTRY: NotificationEntry = { date: '', client: '', caseMgr: '', reason: '', method: '', summary: '', notifiedBy: '', followUp: '' };
const DEFAULT_DATA: FormData = { entries: [{ ...EMPTY_ENTRY }] };

export default function CaseManagerNotificationLog() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-11', DEFAULT_DATA);
  const { getClientOptions, getClientById, getCurrentUserName, getCaseManagerInfo } = useFormData();

  const addEntry = () => updateField('entries', [...data.entries, { ...EMPTY_ENTRY }]);
  const removeEntry = (i: number) => updateField('entries', data.entries.filter((_, idx) => idx !== i));
  const updateEntry = async (i: number, field: keyof NotificationEntry, value: string) => {
    const updated = [...data.entries];
    updated[i] = { ...updated[i], [field]: value };
    updateField('entries', updated);

    // When client is selected, auto-fill case manager from intake data
    if (field === 'client' && value) {
      const client = getClientOptions().find(c => c.label === value);
      if (client) {
        const cmInfo = await getCaseManagerInfo(client.value);
        if (cmInfo?.caseManagerName && !updated[i].caseMgr) {
          updated[i] = { ...updated[i], caseMgr: cmInfo.caseManagerName };
          updateField('entries', updated);
          addAuditEntry('FIELD_UPDATED', `Case manager auto-filled from intake: ${cmInfo.caseManagerName}`);
        }
      }
    }
  };

  return (
    <FormShell formId="11" title="Case Manager Notification Log" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
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
                  <th className="text-left py-2 px-2 w-32">Client</th>
                  <th className="text-left py-2 px-2 w-32">Case Mgr</th>
                  <th className="text-left py-2 px-2">Reason</th>
                  <th className="text-left py-2 px-2 w-24">Method</th>
                  <th className="text-left py-2 px-2">Summary</th>
                  <th className="text-left py-2 px-2 w-28">Notified By</th>
                  <th className="text-left py-2 px-2">Follow-Up</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2"><input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">
                      <select value={entry.client} onChange={e => updateEntry(idx, 'client', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        {getClientOptions().map(opt => (<option key={opt.value} value={opt.label}>{opt.label}</option>))}
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="text" value={entry.caseMgr} onChange={e => updateEntry(idx, 'caseMgr', e.target.value)} placeholder="CM Name" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.reason} onChange={e => updateEntry(idx, 'reason', e.target.value)} placeholder="Reason..." className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">
                      <select value={entry.method} onChange={e => updateEntry(idx, 'method', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="In-Person">In-Person</option>
                        <option value="Written">Written</option>
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="text" value={entry.summary} onChange={e => updateEntry(idx, 'summary', e.target.value)} placeholder="Summary..." className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.notifiedBy} onChange={e => updateEntry(idx, 'notifiedBy', e.target.value)} placeholder="Staff" className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2"><input type="text" value={entry.followUp} onChange={e => updateEntry(idx, 'followUp', e.target.value)} placeholder="Follow-up..." className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-2 px-2">{data.entries.length > 1 && <button onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-4 w-4" /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500">Policy 19 — Track all notifications to Case Managers.</p>
    </FormShell>
  );
}
