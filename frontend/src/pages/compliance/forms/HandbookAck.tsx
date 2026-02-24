import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

interface FormData {
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  employeeSignature: SignatureData | null;
  witnessName: string;
  witnessDate: string;
  witnessSignature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeId: '',
  employeeName: '',
  position: '',
  date: new Date().toISOString().split('T')[0],
  employeeSignature: null,
  witnessName: '',
  witnessDate: new Date().toISOString().split('T')[0],
  witnessSignature: null,
};

export default function HandbookAck() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-09', DEFAULT_DATA);
  const { getEmployeeOptions, getEmployeeById, getCurrentUserName } = useFormData();

  const handleEmployeeChange = (employeeId: string) => {
    updateField('employeeId', employeeId);
    const emp = getEmployeeById(employeeId);
    if (emp) {
      updateField('employeeName', `${emp.firstName} ${emp.lastName}`);
      updateField('position', emp.certifications?.[0] || 'Staff');
    }
  };

  // Auto-fill witness with current user if empty
  const handleWitnessAutoFill = () => {
    const name = getCurrentUserName();
    if (name) {
      updateField('witnessName', name);
      updateField('witnessDate', new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <FormShell
      formId="09"
      title="Employee Handbook Acknowledgment"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgment Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
            <p>
              I acknowledge receipt of the <strong>Serenity Care Partners LLC Employee Handbook
              (Policy and Procedure Manual v6.0)</strong>. I understand that:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>This handbook outlines the policies, procedures, and expectations of Serenity Care Partners LLC.</li>
              <li>This handbook does not constitute a contract of employment.</li>
              <li>My employment is at-will, meaning either party may terminate the employment relationship at any time, with or without cause or notice.</li>
              <li>The company reserves the right to modify, revoke, suspend, terminate, or change any or all policies, procedures, or benefits at any time, with or without notice.</li>
              <li>It is my responsibility to read, understand, and comply with all policies contained in the handbook.</li>
              <li>If I have questions about any policy, I should contact the HR Director or Compliance Officer.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

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
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <input
                id="position"
                type="text"
                value={data.position}
                onChange={e => updateField('position', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="max-w-xs">
            <Label htmlFor="date">Date</Label>
            <input
              id="date"
              type="date"
              value={data.date}
              onChange={e => updateField('date', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Signature</CardTitle>
        </CardHeader>
        <CardContent>
          {data.employeeSignature ? (
            <SignatureDisplay
              signatureData={data.employeeSignature}
              signerName={data.employeeName}
              onClear={() => updateField('employeeSignature', null)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('employeeSignature', sig)}
              signerName={data.employeeName}
              attestationText="By signing below, I acknowledge that I have received, read, and understand the Employee Handbook. I agree to comply with all policies and procedures contained therein."
              required
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Witness Signature</CardTitle>
            {!data.witnessName && (
              <button
                onClick={handleWitnessAutoFill}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                Auto-fill with current user
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="witnessName">Witness Name</Label>
              <input
                id="witnessName"
                type="text"
                value={data.witnessName}
                onChange={e => updateField('witnessName', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="witnessDate">Date</Label>
              <input
                id="witnessDate"
                type="date"
                value={data.witnessDate}
                onChange={e => updateField('witnessDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {data.witnessSignature ? (
            <SignatureDisplay
              signatureData={data.witnessSignature}
              signerName={data.witnessName}
              onClear={() => updateField('witnessSignature', null)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('witnessSignature', sig)}
              signerName={data.witnessName}
              attestationText="I witness that the above-named employee has acknowledged receipt of the Employee Handbook."
              required
            />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
