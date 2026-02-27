import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug, getHiringFormsForRole } from '../hiring-form-registry';

const SLUG = 'required-docs-checklist';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface ManualOverride {
  overridden: boolean;
  note: string;
}

interface FormData {
  employeeName: string;
  role: 'nurse' | 'caregiver';
  manualOverrides: Record<string, ManualOverride>;
  reviewerName: string;
  reviewDate: string;
  reviewerNotes: string;
  signature: SignatureData | null;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  role: 'caregiver',
  manualOverrides: {},
  reviewerName: '',
  reviewDate: '',
  reviewerNotes: '',
  signature: null,
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'signed':
      return <Badge variant="default" className="bg-green-100 text-green-700 text-[10px]">Signed</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-blue-100 text-blue-700 text-[10px]">Completed</Badge>;
    case 'in_progress':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-700 text-[10px]">In Progress</Badge>;
    default:
      return <Badge variant="default" className="bg-gray-100 text-gray-500 text-[10px]">Not Started</Badge>;
  }
}

export default function RequiredDocsChecklist() {
  const employeeId = localStorage.getItem('serenity_hiring_current_employee') || 'default';
  const formDef = getHiringFormBySlug(SLUG)!;
  const { applicantData, markFormStatus, syncFormToServer, getFormStatus, formStatuses } = useHiringFormData(employeeId);
  const {
    data, updateField, updateNestedField, resetForm, lastSaved,
    uploadedFiles, addUploadedFile, removeUploadedFile, auditTrail,
  } = useFormPersistence<FormData>(`hiring_${employeeId}_${SLUG}`, DEFAULT_DATA);

  // Auto-populate from applicantData
  useEffect(() => {
    if (applicantData.firstName && !data.employeeName) {
      updateField('employeeName', `${applicantData.firstName} ${applicantData.lastName}`.trim());
    }
    if (!data.reviewDate) {
      updateField('reviewDate', new Date().toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName]);

  const handleSignature = (sigData: SignatureData) => {
    updateField('signature', sigData);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleClearSignature = () => {
    updateField('signature', null);
  };

  const toggleManualOverride = (slug: string) => {
    const current = data.manualOverrides[slug] || { overridden: false, note: '' };
    updateNestedField(`manualOverrides.${slug}.overridden`, !current.overridden);
  };

  const updateOverrideNote = (slug: string, note: string) => {
    updateNestedField(`manualOverrides.${slug}.note`, note);
  };

  // Get forms for selected role
  const formsForRole = useMemo(() => {
    return getHiringFormsForRole(data.role).filter(f => f.slug !== SLUG);
  }, [data.role]);

  // Calculate completion stats
  const completionStats = useMemo(() => {
    let completed = 0;
    formsForRole.forEach(form => {
      const statusRecord = getFormStatus(form.slug);
      const override = data.manualOverrides[form.slug];
      if (
        statusRecord.status === 'completed' ||
        statusRecord.status === 'signed' ||
        override?.overridden
      ) {
        completed++;
      }
    });
    const total = formsForRole.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage, remaining: total - completed };
  }, [formsForRole, formStatuses, data.manualOverrides, getFormStatus]);

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
        {/* HR Only Banner */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
          <Badge variant="default" className="bg-purple-100 text-purple-700">HR Only</Badge>
          <span className="text-sm text-purple-700">
            This is an administrative checklist to be reviewed by HR personnel only.
          </span>
        </div>

        {/* Employee & Role Selection */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
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
                  placeholder="Full legal name"
                />
              </div>
              <div>
                <Label>Role</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => updateField('role', 'caregiver')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      data.role === 'caregiver'
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Caregiver
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('role', 'nurse')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      data.role === 'nurse'
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Nurse
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                Completion Summary
                {completionStats.percentage === 100 ? (
                  <Badge variant="default" className="bg-green-100 text-green-700">Package Complete</Badge>
                ) : (
                  <Badge variant="default" className="bg-amber-100 text-amber-700">
                    {completionStats.remaining} form{completionStats.remaining !== 1 ? 's' : ''} remaining
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{completionStats.total}</div>
                  <div className="text-xs text-gray-500">Total Required</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completionStats.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{completionStats.percentage}%</div>
                  <div className="text-xs text-gray-500">Completion</div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    completionStats.percentage === 100
                      ? 'bg-green-500'
                      : completionStats.percentage >= 75
                        ? 'bg-blue-500'
                        : completionStats.percentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${completionStats.percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Checklist */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <div className="col-span-1">ID</div>
                <div className="col-span-4">Form Title</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Completed</div>
                <div className="col-span-1">By</div>
                <div className="col-span-2 text-center">Override</div>
              </div>

              {/* Form Rows */}
              {formsForRole.map((form) => {
                const statusRecord = getFormStatus(form.slug);
                const override = data.manualOverrides[form.slug];
                const isComplete = statusRecord.status === 'completed' || statusRecord.status === 'signed' || override?.overridden;

                return (
                  <div
                    key={form.slug}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg border text-sm items-center ${
                      isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="col-span-1 text-xs font-mono text-gray-500">{form.id}</div>
                    <div className="col-span-4">
                      <span className="font-medium text-gray-900 text-xs">{form.title}</span>
                      {form.isHROnly && (
                        <Badge variant="default" className="ml-1 bg-purple-100 text-purple-600 text-[8px]">HR</Badge>
                      )}
                    </div>
                    <div className="col-span-2">
                      {override?.overridden ? (
                        <Badge variant="default" className="bg-purple-100 text-purple-700 text-[10px]">Paper</Badge>
                      ) : (
                        getStatusBadge(statusRecord.status)
                      )}
                    </div>
                    <div className="col-span-2 text-xs text-gray-500">
                      {statusRecord.completedAt
                        ? new Date(statusRecord.completedAt).toLocaleDateString()
                        : override?.overridden
                          ? 'Manual'
                          : '--'
                      }
                    </div>
                    <div className="col-span-1 text-xs text-gray-500 truncate" title={statusRecord.completedBy || ''}>
                      {statusRecord.completedBy
                        ? statusRecord.completedBy.split(' ')[0]
                        : override?.overridden
                          ? 'HR'
                          : '--'
                      }
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <input
                        type="checkbox"
                        checked={override?.overridden || false}
                        onChange={() => toggleManualOverride(form.slug)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        title="Manual override (paper form completed)"
                      />
                      {override?.overridden && (
                        <input
                          type="text"
                          value={override.note || ''}
                          onChange={(e) => updateOverrideNote(form.slug, e.target.value)}
                          className="w-16 text-[10px] px-1 py-0.5 border border-gray-300 rounded"
                          placeholder="Note"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* HR Reviewer Section */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>HR Reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Reviewer Name</Label>
                  <input
                    type="text"
                    value={data.reviewerName}
                    onChange={(e) => updateField('reviewerName', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="HR reviewer full name"
                  />
                </div>
                <div>
                  <Label>Review Date</Label>
                  <input
                    type="date"
                    value={data.reviewDate}
                    onChange={(e) => updateField('reviewDate', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <Label>Notes / Comments</Label>
                <textarea
                  value={data.reviewerNotes}
                  onChange={(e) => updateField('reviewerNotes', e.target.value)}
                  className={INPUT_CLASS}
                  rows={4}
                  placeholder="Any additional notes about the hiring package review..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>HR Reviewer Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.signature ? (
                <SignatureDisplay
                  signatureData={data.signature}
                  signerName={data.reviewerName}
                  onClear={handleClearSignature}
                />
              ) : (
                <ESignature
                  onSign={handleSignature}
                  signerName={data.reviewerName}
                  attestationText={`By signing below, I confirm that I have reviewed the hiring document package for ${data.employeeName || 'this employee'} and verify that ${completionStats.percentage === 100 ? 'all required documents are complete' : `${completionStats.completed} of ${completionStats.total} documents are complete (${completionStats.percentage}%)`}.`}
                  required
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
