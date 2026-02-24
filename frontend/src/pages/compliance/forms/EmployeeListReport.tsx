import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';
import type { EmployeeCredentialRow } from './useFormData';

interface FormData {
  asOfDate: string;
  notes: string;
}

const DEFAULT_DATA: FormData = {
  asOfDate: new Date().toISOString().split('T')[0],
  notes: '',
};

function CredentialBadge({ status }: { status: string }) {
  const cls = status === 'valid' ? 'bg-green-100 text-green-800'
    : status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800'
    : status === 'expired' ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-600';
  return <Badge className={`text-[10px] ${cls}`}>{status.replace('_', ' ')}</Badge>;
}

export default function EmployeeListReport() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-17', DEFAULT_DATA);
  const { employees, isLoading, getEmployeeCredentialRows } = useFormData();

  const activeEmployees = useMemo(
    () => employees.filter(e => e.status === 'active'),
    [employees]
  );

  const [credentialRows, setCredentialRows] = useState<EmployeeCredentialRow[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  useEffect(() => {
    if (activeEmployees.length > 0 && credentialRows.length === 0 && !credentialsLoading) {
      setCredentialsLoading(true);
      getEmployeeCredentialRows().then(rows => {
        setCredentialRows(rows);
        setCredentialsLoading(false);
      }).catch(() => setCredentialsLoading(false));
    }
  }, [activeEmployees.length, credentialRows.length, credentialsLoading, getEmployeeCredentialRows]);

  // Merge credential data with employees
  const credentialMap = useMemo(() => {
    const map: Record<string, EmployeeCredentialRow['credentials']> = {};
    for (const row of credentialRows) map[row.employeeId] = row.credentials;
    return map;
  }, [credentialRows]);

  return (
    <FormShell
      formId="17"
      title="Employee List"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Employee Roster
              {!isLoading && (
                <Badge className="bg-blue-100 text-blue-800 ml-3">{activeEmployees.length} Active</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">As of:</span>
              <input
                type="date"
                value={data.asOfDate}
                onChange={e => updateField('asOfDate', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
              <p className="text-sm text-gray-600 mt-3">Loading employee data from ERP...</p>
            </div>
          ) : activeEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No employee data available. Connect to the API to auto-populate this report.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 w-8">#</th>
                    <th className="text-left py-2 px-3">Employee Name</th>
                    <th className="text-left py-2 px-3">Position / Role</th>
                    <th className="text-left py-2 px-3">Pod</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Certifications</th>
                    <th className="text-left py-2 px-3">Credential Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((emp, idx) => {
                    const creds = credentialMap[emp.id] || [];
                    return (
                      <tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-gray-900">{emp.lastName}, {emp.firstName}</td>
                        <td className="py-2 px-3 text-gray-700">{emp.certifications?.[0] || 'Staff'}</td>
                        <td className="py-2 px-3 text-gray-700">{emp.podCode || '—'}</td>
                        <td className="py-2 px-3">
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-xs">
                          {emp.certifications?.join(', ') || '—'}
                        </td>
                        <td className="py-2 px-3">
                          {creds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {creds.map((c, ci) => (
                                <span key={ci} className="inline-flex items-center gap-1">
                                  <CredentialBadge status={c.status} />
                                  <span className="text-[10px] text-gray-500">{c.type.replace(/_/g, ' ').slice(0, 12)}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">{credentialsLoading ? 'Loading...' : '—'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            rows={3}
            value={data.notes}
            onChange={e => updateField('notes', e.target.value)}
            placeholder="Additional notes about the employee roster..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </CardContent>
      </Card>
    </FormShell>
  );
}
