import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import { PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface BCIIEntry {
  employeeId: string;
  applicantName: string;
  hireDate: string;
  sevenDbChecks: 'Y' | 'N' | '';
  dateToBcii: string;
  checkType: 'BCII' | 'FBI' | 'Both' | '';
  dateReceived: string;
  disqualifying: 'Y' | 'N' | '';
  terminated: 'Y' | 'N' | '';
  fiveYrRecheck: string;
}

interface FormData {
  entries: BCIIEntry[];
}

const EMPTY_ENTRY: BCIIEntry = {
  employeeId: '', applicantName: '', hireDate: '', sevenDbChecks: '', dateToBcii: '',
  checkType: '', dateReceived: '', disqualifying: '', terminated: '', fiveYrRecheck: '',
};

const DEFAULT_DATA: FormData = { entries: [{ ...EMPTY_ENTRY }] };

function calculateRecheckDate(hireDate: string): string {
  if (!hireDate) return '';
  const d = new Date(hireDate);
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().split('T')[0];
}

export default function BCIILog() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-20', DEFAULT_DATA);
  const { getEmployeeOptions, getEmployeeById, getBCILogEntries } = useFormData();
  const [bgCheckLoading, setBgCheckLoading] = useState(false);

  const addEntry = () => updateField('entries', [...data.entries, { ...EMPTY_ENTRY }]);
  const removeEntry = (i: number) => updateField('entries', data.entries.filter((_, idx) => idx !== i));

  const updateEntry = (i: number, field: keyof BCIIEntry, value: string) => {
    const updated = [...data.entries];
    updated[i] = { ...updated[i], [field]: value };
    // Auto-calculate 5-year recheck when hire date changes
    if (field === 'hireDate') {
      updated[i].fiveYrRecheck = calculateRecheckDate(value);
    }
    updateField('entries', updated);
  };

  const handleEmployeeSelect = (i: number, employeeId: string) => {
    const emp = getEmployeeById(employeeId);
    const updated = [...data.entries];
    updated[i] = {
      ...updated[i],
      employeeId,
      applicantName: emp ? `${emp.lastName}, ${emp.firstName}` : '',
    };
    updateField('entries', updated);
  };

  const populateFromRoster = () => {
    const opts = getEmployeeOptions();
    if (opts.length === 0) return;
    const newEntries = opts.map(opt => ({
      ...EMPTY_ENTRY,
      employeeId: opt.value,
      applicantName: opt.label,
    }));
    updateField('entries', newEntries);
  };

  /** Auto-populate from background check service records */
  const populateFromBGChecks = async () => {
    setBgCheckLoading(true);
    try {
      const entries = await getBCILogEntries();
      if (entries.length > 0) {
        const mapped: BCIIEntry[] = entries.map(e => ({
          employeeId: e.caregiverId,
          applicantName: e.employeeName,
          hireDate: '',
          sevenDbChecks: '',
          dateToBcii: e.requestedAt,
          checkType: e.checkType === 'bci' ? 'BCII' : e.checkType === 'fbi_only' ? 'FBI' : 'Both',
          dateReceived: e.completedAt,
          disqualifying: e.result === 'disqualified' ? 'Y' : e.result === 'clear' ? 'N' : '',
          terminated: '',
          fiveYrRecheck: e.recheckDue,
        }));
        updateField('entries', mapped);
        addAuditEntry('FIELD_UPDATED', `Auto-populated ${mapped.length} entries from background check records`);
      }
    } finally {
      setBgCheckLoading(false);
    }
  };

  return (
    <FormShell formId="20" title="BCI/FBI Background Check Log" onReset={resetForm} lastSaved={lastSaved} uploadedFiles={uploadedFiles} onAddUploadedFile={addUploadedFile} onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}>
      <div className="flex items-center gap-4 mb-4">
        <Badge className="bg-gray-100 text-gray-800">{data.entries.length} Entries</Badge>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={populateFromBGChecks} disabled={bgCheckLoading}>
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${bgCheckLoading ? 'animate-spin' : ''}`} />
          {bgCheckLoading ? 'Loading...' : 'Import from BG Check Records'}
        </Button>
        <Button size="sm" variant="outline" onClick={populateFromRoster}>
          Auto-populate from Roster
        </Button>
        <Button size="sm" onClick={addEntry}><PlusIcon className="h-4 w-4 mr-1" />Add Entry</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2 w-40">Applicant Name</th>
                  <th className="text-left py-2 px-2 w-28">Hire Date</th>
                  <th className="text-center py-2 px-2 w-16">7 DB</th>
                  <th className="text-left py-2 px-2 w-28">Date to BCII</th>
                  <th className="text-left py-2 px-2 w-20">Type</th>
                  <th className="text-left py-2 px-2 w-28">Date Received</th>
                  <th className="text-center py-2 px-2 w-16">Disq.</th>
                  <th className="text-center py-2 px-2 w-16">Term.</th>
                  <th className="text-left py-2 px-2 w-28">5-Yr Recheck</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${entry.disqualifying === 'Y' ? 'bg-red-50' : ''}`}>
                    <td className="py-1 px-2">
                      <select value={entry.employeeId} onChange={e => handleEmployeeSelect(idx, e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">Select...</option>
                        {getEmployeeOptions().map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </td>
                    <td className="py-1 px-2"><input type="date" value={entry.hireDate} onChange={e => updateEntry(idx, 'hireDate', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-1 px-2">
                      <select value={entry.sevenDbChecks} onChange={e => updateEntry(idx, 'sevenDbChecks', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">—</option><option value="Y">Y</option><option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-1 px-2"><input type="date" value={entry.dateToBcii} onChange={e => updateEntry(idx, 'dateToBcii', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-1 px-2">
                      <select value={entry.checkType} onChange={e => updateEntry(idx, 'checkType', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">—</option><option value="BCII">BCII</option><option value="FBI">FBI</option><option value="Both">Both</option>
                      </select>
                    </td>
                    <td className="py-1 px-2"><input type="date" value={entry.dateReceived} onChange={e => updateEntry(idx, 'dateReceived', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-1 px-2">
                      <select value={entry.disqualifying} onChange={e => updateEntry(idx, 'disqualifying', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">—</option><option value="Y">Y</option><option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-1 px-2">
                      <select value={entry.terminated} onChange={e => updateEntry(idx, 'terminated', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded">
                        <option value="">—</option><option value="Y">Y</option><option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-1 px-2"><input type="date" value={entry.fiveYrRecheck} onChange={e => updateEntry(idx, 'fiveYrRecheck', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded" /></td>
                    <td className="py-1 px-2">{data.entries.length > 1 && <button onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-3 w-3" /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500">Criminal background check tracking per Chapter 173-9. Five-year rechecks required.</p>
    </FormShell>
  );
}
