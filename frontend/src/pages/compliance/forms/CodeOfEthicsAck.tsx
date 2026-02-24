import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

const PROHIBITED_BEHAVIORS = [
  'Accepting gifts, money, or loans from clients beyond nominal value',
  'Sexual contact or romantic relationships with clients',
  'Bringing unauthorized persons to client visits',
  'Using client property without written permission',
  'Initiating discussions of religion, politics, or divisive topics',
  'Sleeping on duty',
  'Using alcohol or controlled substances before or during visits',
  'Borrowing money from clients',
  'Photographing clients or homes without consent',
  'Disclosing client information to unauthorized persons',
  'Threatening or abusive language with clients',
  'Any conduct that exploits the client relationship',
];

interface FormData {
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeId: '',
  employeeName: '',
  position: '',
  date: new Date().toISOString().split('T')[0],
  signature: null,
};

export default function CodeOfEthicsAck() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail } =
    useFormPersistence<FormData>('form-08', DEFAULT_DATA);
  const { getEmployeeOptions, getEmployeeById } = useFormData();

  const handleEmployeeChange = (employeeId: string) => {
    updateField('employeeId', employeeId);
    const emp = getEmployeeById(employeeId);
    if (emp) {
      updateField('employeeName', `${emp.firstName} ${emp.lastName}`);
      updateField('position', emp.certifications?.[0] || 'Staff');
    }
  };

  return (
    <FormShell
      formId="08"
      title="Code of Ethics Acknowledgment"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Code of Ethics — Prohibited Behaviors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            As an employee of Serenity Care Partners LLC, I understand that the following behaviors are
            strictly prohibited and may result in immediate termination and/or reporting to the
            appropriate authorities:
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            {PROHIBITED_BEHAVIORS.map((behavior, idx) => (
              <li key={idx} className="text-sm text-gray-800 pl-2">
                {behavior}
              </li>
            ))}
          </ol>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              I agree to report any violations I witness to my supervisor or the Compliance Officer.
            </p>
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
          {data.signature ? (
            <SignatureDisplay
              signatureData={data.signature}
              signerName={data.employeeName}
              onClear={() => updateField('signature', null)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('signature', sig)}
              signerName={data.employeeName}
              attestationText="By signing below, I acknowledge that I have read, understand, and agree to comply with the Serenity Care Partners LLC Code of Ethics. I understand that violation of this code may result in disciplinary action up to and including termination."
              required
            />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
