import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'orientation-checklist-hiring';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const ORIENTATION_TOPICS = [
  'Company overview, mission, and values',
  'Organizational structure and reporting',
  'Personnel policies and procedures',
  'Compensation, benefits, and payroll',
  'Attendance and scheduling expectations',
  'HIPAA and confidentiality training',
  'Infection control procedures',
  'Fire safety and emergency procedures',
  'Abuse/neglect recognition and reporting',
  'EVV system training',
  'Care plan documentation',
  'Client rights and grievance procedures',
  'Incident reporting procedures',
  'Universal precautions / PPE use',
  'Body mechanics and safe lifting',
  'Cultural sensitivity and communication',
] as const;

interface TopicEntry {
  completed: boolean;
  dateCompleted: string;
  trainerInitials: string;
}

interface FormData {
  employeeName: string;
  hireDate: string;
  orientationDate: string;
  trainerName: string;
  topics: TopicEntry[];
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
  trainerSignature: SignatureData | null;
  trainerSignatureDate: string;
}

const DEFAULT_TOPIC: TopicEntry = {
  completed: false,
  dateCompleted: '',
  trainerInitials: '',
};

const DEFAULT_DATA: FormData = {
  employeeName: '',
  hireDate: '',
  orientationDate: '',
  trainerName: '',
  topics: ORIENTATION_TOPICS.map(() => ({ ...DEFAULT_TOPIC })),
  employeeSignature: null,
  employeeSignatureDate: '',
  trainerSignature: null,
  trainerSignatureDate: '',
};

export default function OrientationChecklistForm() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer } = useHiringFormData(employeeId);
  const {
    data, updateField, updateNestedField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from applicantData
  useEffect(() => {
    if (applicantData.firstName || applicantData.lastName) {
      const fullName = `${applicantData.firstName} ${applicantData.lastName}`.trim();
      if (!data.employeeName && fullName) {
        updateField('employeeName', fullName);
      }
    }
    if (applicantData.hireDate && !data.hireDate) {
      updateField('hireDate', applicantData.hireDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName, applicantData.hireDate]);

  const completedCount = data.topics.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / ORIENTATION_TOPICS.length) * 100);

  const handleTopicToggle = (index: number) => {
    const updated = [...data.topics];
    updated[index] = {
      ...updated[index],
      completed: !updated[index].completed,
      dateCompleted: !updated[index].completed ? new Date().toISOString().split('T')[0] : '',
    };
    updateField('topics', updated);
  };

  const handleTopicDate = (index: number, value: string) => {
    updateNestedField(`topics.${index}.dateCompleted`, value);
  };

  const handleTopicInitials = (index: number, value: string) => {
    updateNestedField(`topics.${index}.trainerInitials`, value);
  };

  const handleMarkAllCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const trainerInit = data.trainerName
      ? data.trainerName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('')
      : '';
    const updated = data.topics.map((topic) => ({
      completed: true,
      dateCompleted: topic.dateCompleted || today,
      trainerInitials: topic.trainerInitials || trainerInit,
    }));
    updateField('topics', updated);
  };

  const handleEmployeeSignature = (sigData: SignatureData) => {
    updateField('employeeSignature', sigData);
    updateField('employeeSignatureDate', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleTrainerSignature = (sigData: SignatureData) => {
    updateField('trainerSignature', sigData);
    updateField('trainerSignatureDate', new Date().toISOString().split('T')[0]);
  };

  return (
    <HiringFormShell
      formDef={formDef}
      employeeId={employeeId}
      employeeName={`${applicantData.firstName} ${applicantData.lastName}`.trim()}
      onReset={resetForm}
      lastSaved={lastSaved}
      uploadedFiles={uploadedFiles}
      onAddUploadedFile={addUploadedFile}
      onRemoveUploadedFile={removeUploadedFile}
      auditTrail={auditTrail}
    >
      <div className="space-y-8">
        {/* Employee & Orientation Info */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Orientation Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee Name</Label>
                <input
                  type="text"
                  value={data.employeeName}
                  onChange={(e) => updateField('employeeName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Hire Date</Label>
                <input
                  type="date"
                  value={data.hireDate}
                  onChange={(e) => updateField('hireDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <Label>Orientation Date</Label>
                <input
                  type="date"
                  value={data.orientationDate}
                  onChange={(e) => updateField('orientationDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <Label>Trainer / Supervisor Name</Label>
                <input
                  type="text"
                  value={data.trainerName}
                  onChange={(e) => updateField('trainerName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Trainer full name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Orientation Topics</CardTitle>
              <div className="flex items-center gap-3">
                <Badge
                  variant="default"
                  className={
                    completedCount === ORIENTATION_TOPICS.length
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }
                >
                  {completedCount}/{ORIENTATION_TOPICS.length} Completed
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllCompleted}
                  disabled={completedCount === ORIENTATION_TOPICS.length}
                >
                  Mark All Completed
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progressPercent === 100 ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Topic Checklist */}
            <div className="space-y-3">
              {ORIENTATION_TOPICS.map((topic, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    data.topics[idx]?.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={data.topics[idx]?.completed || false}
                      onChange={() => handleTopicToggle(idx)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-800">
                        <span className="font-medium text-gray-500 mr-2">{idx + 1}.</span>
                        {topic}
                      </span>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label className="text-xs text-gray-500">Date Completed</Label>
                          <input
                            type="date"
                            value={data.topics[idx]?.dateCompleted || ''}
                            onChange={(e) => handleTopicDate(idx, e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Trainer Initials</Label>
                          <input
                            type="text"
                            value={data.topics[idx]?.trainerInitials || ''}
                            onChange={(e) => handleTopicInitials(idx, e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., JD"
                            maxLength={5}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {data.employeeSignature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={data.employeeSignature}
                  signerName={data.employeeName}
                  onClear={() => updateField('employeeSignature', null)}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Label>Date Signed</Label>
                  <span className="font-medium">{data.employeeSignatureDate}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <input
                    type="date"
                    value={data.employeeSignatureDate}
                    onChange={(e) => updateField('employeeSignatureDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <ESignature
                  onSign={handleEmployeeSignature}
                  signerName={data.employeeName}
                  attestationText="By signing below, I confirm that I have attended and completed the orientation topics marked above, and I understand the policies and procedures presented."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainer E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Trainer / Supervisor Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trainerSignature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={data.trainerSignature}
                  signerName={data.trainerName}
                  onClear={() => updateField('trainerSignature', null)}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Label>Date Signed</Label>
                  <span className="font-medium">{data.trainerSignatureDate}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <input
                    type="date"
                    value={data.trainerSignatureDate}
                    onChange={(e) => updateField('trainerSignatureDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <ESignature
                  onSign={handleTrainerSignature}
                  signerName={data.trainerName}
                  attestationText="By signing below, I confirm that I have conducted the orientation covering all topics checked above and that the employee demonstrated understanding of the material presented."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
