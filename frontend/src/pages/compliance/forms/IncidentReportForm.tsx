import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { FormShell } from './FormShell';
import { useFormPersistence } from './useFormPersistence';
import { useFormData } from './useFormData';

interface Notification {
  notified: boolean;
  dateTime: string;
}

interface FormData {
  incidentDate: string;
  incidentTime: string;
  location: string;
  clientId: string;
  clientName: string;
  clientIdNumber: string;
  caregiverId: string;
  caregiverName: string;
  pod: string;
  category: 'Critical' | 'Reportable' | 'Unusual' | '';
  description: string;
  immediateActions: string;
  notifications: {
    caseManager: Notification;
    adultProtectiveServices: Notification;
    ems911: Notification;
    podTeamLead: Notification;
    rnSupervisor: Notification;
  };
  reportedBy: string;
  reportDate: string;
  signature: SignatureData | null;
}

const DEFAULT_NOTIFICATION: Notification = { notified: false, dateTime: '' };

const DEFAULT_DATA: FormData = {
  incidentDate: new Date().toISOString().split('T')[0],
  incidentTime: '',
  location: '',
  clientId: '',
  clientName: '',
  clientIdNumber: '',
  caregiverId: '',
  caregiverName: '',
  pod: '',
  category: '',
  description: '',
  immediateActions: '',
  notifications: {
    caseManager: { ...DEFAULT_NOTIFICATION },
    adultProtectiveServices: { ...DEFAULT_NOTIFICATION },
    ems911: { ...DEFAULT_NOTIFICATION },
    podTeamLead: { ...DEFAULT_NOTIFICATION },
    rnSupervisor: { ...DEFAULT_NOTIFICATION },
  },
  reportedBy: '',
  reportDate: new Date().toISOString().split('T')[0],
  signature: null,
};

const CATEGORY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  Reportable: 'bg-orange-100 text-orange-800',
  Unusual: 'bg-yellow-100 text-yellow-800',
};

export default function IncidentReportForm() {
  const { data, updateField, updateNestedField, resetForm, lastSaved, uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail, addAuditEntry } =
    useFormPersistence<FormData>('form-01', DEFAULT_DATA);
  const { getClientOptions, getClientById, getEmployeeOptions, getEmployeeById, getPodOptions, getCurrentUserName, getClientIdentityFromIntake } = useFormData();

  const handleClientChange = async (clientId: string) => {
    updateField('clientId', clientId);
    const client = getClientById(clientId);
    if (client) {
      updateField('clientName', `${client.firstName} ${client.lastName}`);
      updateField('clientIdNumber', client.medicaidNumber || '');
      updateField('pod', client.podName || '');
    }
    // Enrich with intake data (fuller address for location field)
    const identity = await getClientIdentityFromIntake(clientId);
    if (identity) {
      if (identity.address && !data.location) {
        updateField('location', `Client's home — ${identity.address}`);
      }
      addAuditEntry('FIELD_UPDATED', 'Client data enriched from intake records');
    }
  };

  const handleCaregiverChange = (caregiverId: string) => {
    updateField('caregiverId', caregiverId);
    const emp = getEmployeeById(caregiverId);
    if (emp) {
      updateField('caregiverName', `${emp.firstName} ${emp.lastName}`);
    }
  };

  const autoFillReportedBy = () => {
    const name = getCurrentUserName();
    if (name) updateField('reportedBy', name);
  };

  const notificationLabels: Record<string, string> = {
    caseManager: 'Case Manager',
    adultProtectiveServices: 'Adult Protective Services',
    ems911: '911 / EMS',
    podTeamLead: 'Pod Team Lead',
    rnSupervisor: 'RN Supervisor',
  };

  return (
    <FormShell
      formId="01"
      title="Incident Report Form"
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile} auditTrail={auditTrail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Incident Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="incidentDate">Incident Date</Label>
              <input
                id="incidentDate"
                type="date"
                value={data.incidentDate}
                onChange={e => updateField('incidentDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="incidentTime">Incident Time</Label>
              <input
                id="incidentTime"
                type="time"
                value={data.incidentTime}
                onChange={e => updateField('incidentTime', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <input
                id="location"
                type="text"
                value={data.location}
                onChange={e => updateField('location', e.target.value)}
                placeholder="e.g. Client's home"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <select
                id="client"
                value={data.clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select client...</option>
                {getClientOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.medicaidNumber ? `— ${opt.medicaidNumber}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="caregiver">Caregiver</Label>
              <select
                id="caregiver"
                value={data.caregiverId}
                onChange={e => handleCaregiverChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select caregiver...</option>
                {getEmployeeOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pod">Pod</Label>
              <select
                id="pod"
                value={data.pod}
                onChange={e => updateField('pod', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select pod...</option>
                {getPodOptions().map(opt => (
                  <option key={opt.value} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Category</Label>
              <div className="flex gap-2 mt-2">
                {(['Critical', 'Reportable', 'Unusual'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('category', cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      data.category === cat
                        ? CATEGORY_COLORS[cat] + ' border-current'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description of Incident</Label>
            <textarea
              id="description"
              rows={6}
              value={data.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="Provide a detailed description of the incident..."
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <Label htmlFor="immediateActions">Immediate Actions Taken</Label>
            <textarea
              id="immediateActions"
              rows={4}
              value={data.immediateActions}
              onChange={e => updateField('immediateActions', e.target.value)}
              placeholder="Describe the immediate actions taken in response..."
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(notificationLabels).map(([key, label]) => {
              const notif = data.notifications[key as keyof typeof data.notifications];
              return (
                <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 w-48">
                    <input
                      type="checkbox"
                      checked={notif.notified}
                      onChange={e =>
                        updateNestedField(`notifications.${key}.notified`, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="datetime-local"
                      value={notif.dateTime}
                      onChange={e =>
                        updateNestedField(`notifications.${key}.dateTime`, e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      disabled={!notif.notified}
                    />
                  </div>
                  <Badge className={notif.notified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {notif.notified ? 'Notified' : 'Pending'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
            This form must be submitted to the Compliance Officer within 24 hours of the incident.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportedBy">Reported By</Label>
              <div className="flex gap-2">
                <input
                  id="reportedBy"
                  type="text"
                  value={data.reportedBy}
                  onChange={e => updateField('reportedBy', e.target.value)}
                  className="flex-1 mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={autoFillReportedBy}
                  className="mt-1 text-xs text-primary-600 hover:text-primary-800 whitespace-nowrap"
                >
                  Auto-fill
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="reportDate">Report Date</Label>
              <input
                id="reportDate"
                type="date"
                value={data.reportDate}
                onChange={e => updateField('reportDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {data.signature ? (
            <SignatureDisplay
              signatureData={data.signature}
              signerName={data.reportedBy}
              onClear={() => updateField('signature', null)}
            />
          ) : (
            <ESignature
              onSign={(sig) => updateField('signature', sig)}
              signerName={data.reportedBy}
              attestationText="I certify that the information provided in this incident report is true and accurate to the best of my knowledge."
              required
            />
          )}
        </CardContent>
      </Card>
    </FormShell>
  );
}
