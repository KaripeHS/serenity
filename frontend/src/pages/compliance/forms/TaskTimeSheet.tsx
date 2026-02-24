import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

const TASK_LIST = [
  'Bathing / Showering',
  'Dressing',
  'Grooming / Oral Care',
  'Toileting',
  'Transfers / Ambulation',
  'Meal Preparation',
  'Feeding Assistance',
  'Light Housekeeping',
  'Laundry',
  'Medication Reminder',
  'Vital Signs',
  'Companion / Supervision',
  'Errands',
  'Other',
];

interface TaskEntry {
  startTime: string;
  endTime: string;
  minutes: number;
  notes: string;
}

interface FormData {
  clientId: string;
  clientName: string;
  clientIdNumber: string;
  caregiverId: string;
  caregiverName: string;
  dateOfService: string;
  serviceType: string;
  authorizationNumber: string;
  clockIn: string;
  clockOut: string;
  tasks: TaskEntry[];
  observations: string;
}

const DEFAULT_DATA: FormData = {
  clientId: '',
  clientName: '',
  clientIdNumber: '',
  caregiverId: '',
  caregiverName: '',
  dateOfService: new Date().toISOString().split('T')[0],
  serviceType: '',
  authorizationNumber: '',
  clockIn: '',
  clockOut: '',
  tasks: TASK_LIST.map(() => ({ startTime: '', endTime: '', minutes: 0, notes: '' })),
  observations: '',
};

function calculateMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
}

export default function TaskTimeSheet() {
  const { data, updateField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-05', DEFAULT_DATA);
  const { getClientOptions, getClientById, getEmployeeOptions, getEmployeeById, getCarePlanForForm } = useFormData();

  const handleClientChange = async (clientId: string) => {
    updateField('clientId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('clientName', `${client.firstName} ${client.lastName}`);
      updateField('clientIdNumber', client.medicaidNumber || '');
    }
    // Pre-fill authorization and service type from care plan
    const carePlan = await getCarePlanForForm(clientId);
    if (carePlan) {
      if (carePlan.authorization?.number) {
        updateField('authorizationNumber', carePlan.authorization.number);
      }
      if (carePlan.services.length > 0) {
        const svc = carePlan.services[0];
        if (svc.serviceCode.includes('PCS') || svc.serviceName.toLowerCase().includes('personal')) updateField('serviceType', 'PCS');
        else if (svc.serviceCode.includes('HMK') || svc.serviceName.toLowerCase().includes('homemaker')) updateField('serviceType', 'HMK');
        else if (svc.serviceCode.includes('SFC')) updateField('serviceType', 'SFC');
      }
      addAuditEntry('FIELD_UPDATED', 'Authorization and service type pre-populated from care plan');
    }
  };

  const handleCaregiverChange = (caregiverId: string) => {
    updateField('caregiverId', caregiverId);
    const emp = getEmployeeById(caregiverId);
    if (emp) {
      updateField('caregiverName', `${emp.firstName} ${emp.lastName}`);
    }
  };

  const updateTask = (index: number, field: keyof TaskEntry, value: string | number) => {
    const updated = [...data.tasks];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-calculate minutes when times change
    if (field === 'startTime' || field === 'endTime') {
      const start = field === 'startTime' ? value as string : updated[index].startTime;
      const end = field === 'endTime' ? value as string : updated[index].endTime;
      updated[index].minutes = calculateMinutes(start, end);
    }
    updateField('tasks', updated);
  };

  const totalMinutes = useMemo(() =>
    data.tasks.reduce((sum, t) => sum + t.minutes, 0),
    [data.tasks]
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <FormShell
      formId="05"
      title="Task / Time Sheet"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <select id="client" value={data.clientId} onChange={e => handleClientChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select client...</option>
                {getClientOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} {opt.medicaidNumber ? `— ${opt.medicaidNumber}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="caregiver">Caregiver</Label>
              <select id="caregiver" value={data.caregiverId} onChange={e => handleCaregiverChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select caregiver...</option>
                {getEmployeeOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.role}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateOfService">Date of Service</Label>
              <input id="dateOfService" type="date" value={data.dateOfService} onChange={e => updateField('dateOfService', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <select id="serviceType" value={data.serviceType} onChange={e => updateField('serviceType', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select...</option>
                <option value="PCS">Personal Care (PCS)</option>
                <option value="HMK">Homemaker (HMK)</option>
                <option value="SFC">Structured Family Caregiving (SFC)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="clockIn">Clock-In</Label>
              <input id="clockIn" type="time" value={data.clockIn} onChange={e => updateField('clockIn', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <Label htmlFor="clockOut">Clock-Out</Label>
              <input id="clockOut" type="time" value={data.clockOut} onChange={e => updateField('clockOut', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <Label htmlFor="authorizationNumber">Authorization #</Label>
            <input id="authorizationNumber" type="text" value={data.authorizationNumber} onChange={e => updateField('authorizationNumber', e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 max-w-xs" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Details</CardTitle>
            <div className="text-sm font-medium">
              Total: <span className="text-primary-600">{totalHours}h {remainingMinutes}m</span> ({totalMinutes} min)
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2">Task</th>
                  <th className="text-center py-2 px-2 w-24">Start</th>
                  <th className="text-center py-2 px-2 w-24">End</th>
                  <th className="text-center py-2 px-2 w-16">Min</th>
                  <th className="text-left py-2 px-2 w-48">Notes</th>
                </tr>
              </thead>
              <tbody>
                {TASK_LIST.map((task, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${data.tasks[idx]?.minutes > 0 ? 'bg-green-50/30' : ''}`}>
                    <td className="py-2 px-2 font-medium text-gray-800">{task}</td>
                    <td className="py-2 px-2">
                      <input type="time" value={data.tasks[idx]?.startTime || ''} onChange={e => updateTask(idx, 'startTime', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="time" value={data.tasks[idx]?.endTime || ''} onChange={e => updateTask(idx, 'endTime', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500" />
                    </td>
                    <td className="py-2 px-2 text-center text-gray-700 font-medium">
                      {data.tasks[idx]?.minutes || 0}
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={data.tasks[idx]?.notes || ''} onChange={e => updateTask(idx, 'notes', e.target.value)} placeholder="Notes..." className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-50 font-bold">
                  <td className="py-2 px-2" colSpan={3}>Total Minutes</td>
                  <td className="py-2 px-2 text-center text-primary-600">{totalMinutes}</td>
                  <td className="py-2 px-2 text-gray-600">{totalHours}h {remainingMinutes}m</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Condition Observations</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            rows={4}
            value={data.observations}
            onChange={e => updateField('observations', e.target.value)}
            placeholder="Document any observations about the client's condition..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </CardContent>
      </Card>
    </FormShell>
  );
}
