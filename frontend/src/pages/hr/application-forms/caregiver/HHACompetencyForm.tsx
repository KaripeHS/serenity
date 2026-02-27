import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ESignature, SignatureDisplay } from '@/components/onboarding/ESignature';
import type { SignatureData } from '@/components/onboarding/ESignature';
import { useFormPersistence } from '@/pages/compliance/forms/useFormPersistence';
import { HiringFormShell } from '../HiringFormShell';
import { useHiringFormData } from '../useHiringFormData';
import { getHiringFormBySlug } from '../hiring-form-registry';

const SLUG = 'hha-competency';
const INPUT_CLASS = 'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const COMPETENCY_SKILLS = [
  'Hand hygiene and infection control',
  'Vital signs measurement (temperature, pulse, respiration, blood pressure)',
  'Bathing and personal hygiene assistance',
  'Oral and denture care',
  'Hair care and grooming',
  'Dressing and undressing assistance',
  'Toileting and incontinence care',
  'Skin care and pressure ulcer prevention',
  'Bed making (occupied and unoccupied)',
  'Feeding and nutrition assistance',
  'Fluid intake monitoring',
  'Transfer techniques (bed to wheelchair, wheelchair to toilet)',
  'Ambulation assistance (with and without assistive devices)',
  'Range of motion exercises',
  'Positioning and turning',
  'Use of assistive devices (cane, walker, wheelchair)',
  'Oxygen safety awareness',
  'Emergency response procedures',
  'Documentation and reporting',
  'Communication with clients and families',
] as const;

type Rating = 'satisfactory' | 'needs_improvement' | 'na' | '';

interface SkillEntry {
  rating: Rating;
  comments: string;
}

interface FormData {
  employeeName: string;
  evaluationDate: string;
  evaluatorName: string;
  evaluatorCredentials: 'RN' | 'LPN' | '';
  skills: SkillEntry[];
  overallAssessment: 'pass' | 'needs_remediation' | '';
  remediationPlan: string;
  followUpDate: string;
  employeeSignature: SignatureData | null;
  employeeSignatureDate: string;
  evaluatorSignature: SignatureData | null;
  evaluatorSignatureDate: string;
}

const DEFAULT_DATA: FormData = {
  employeeName: '',
  evaluationDate: '',
  evaluatorName: '',
  evaluatorCredentials: '',
  skills: COMPETENCY_SKILLS.map(() => ({ rating: '' as const, comments: '' })),
  overallAssessment: '',
  remediationPlan: '',
  followUpDate: '',
  employeeSignature: null,
  employeeSignatureDate: '',
  evaluatorSignature: null,
  evaluatorSignatureDate: '',
};

export default function HHACompetencyForm() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantData.firstName, applicantData.lastName]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const satisfactory = data.skills.filter((s) => s.rating === 'satisfactory').length;
    const needsImprovement = data.skills.filter((s) => s.rating === 'needs_improvement').length;
    const na = data.skills.filter((s) => s.rating === 'na').length;
    const rated = satisfactory + needsImprovement + na;
    const unrated = COMPETENCY_SKILLS.length - rated;

    // Auto-calculate overall: pass if all rated skills (excluding N/A) are satisfactory
    const requiredSkills = data.skills.filter((s) => s.rating !== '' && s.rating !== 'na');
    const allSatisfactory = requiredSkills.length > 0 && requiredSkills.every((s) => s.rating === 'satisfactory');
    const autoAssessment: FormData['overallAssessment'] =
      rated === 0 ? '' : allSatisfactory ? 'pass' : 'needs_remediation';

    return { satisfactory, needsImprovement, na, rated, unrated, autoAssessment };
  }, [data.skills]);

  // Auto-update overall assessment when skills change
  useEffect(() => {
    if (stats.autoAssessment && stats.rated > 0 && data.overallAssessment !== stats.autoAssessment) {
      updateField('overallAssessment', stats.autoAssessment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.autoAssessment, stats.rated]);

  const handleSkillRating = (index: number, rating: Rating) => {
    updateNestedField(`skills.${index}.rating`, rating);
  };

  const handleSkillComment = (index: number, comments: string) => {
    updateNestedField(`skills.${index}.comments`, comments);
  };

  const handleEmployeeSignature = (sigData: SignatureData) => {
    updateField('employeeSignature', sigData);
    updateField('employeeSignatureDate', new Date().toISOString().split('T')[0]);
    markFormStatus(SLUG, 'signed');
    syncFormToServer(SLUG, data as unknown as Record<string, unknown>, sigData);
  };

  const handleEvaluatorSignature = (sigData: SignatureData) => {
    updateField('evaluatorSignature', sigData);
    updateField('evaluatorSignatureDate', new Date().toISOString().split('T')[0]);
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
        {/* Evaluation Info */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Evaluation Information</CardTitle>
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
                <Label>Evaluation Date</Label>
                <input
                  type="date"
                  value={data.evaluationDate}
                  onChange={(e) => updateField('evaluationDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <Label>Evaluator Name</Label>
                <input
                  type="text"
                  value={data.evaluatorName}
                  onChange={(e) => updateField('evaluatorName', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="RN/LPN evaluator name"
                />
              </div>
              <div>
                <Label>Evaluator Credentials</Label>
                <select
                  value={data.evaluatorCredentials}
                  onChange={(e) => updateField('evaluatorCredentials', e.target.value as FormData['evaluatorCredentials'])}
                  className={INPUT_CLASS}
                >
                  <option value="">-- Select --</option>
                  <option value="RN">RN (Registered Nurse)</option>
                  <option value="LPN">LPN (Licensed Practical Nurse)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.satisfactory}</div>
            <div className="text-xs text-green-600 font-medium">Satisfactory</div>
          </div>
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-center">
            <div className="text-2xl font-bold text-amber-700">{stats.needsImprovement}</div>
            <div className="text-xs text-amber-600 font-medium">Needs Improvement</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.na}</div>
            <div className="text-xs text-gray-500 font-medium">N/A</div>
          </div>
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.rated}</div>
            <div className="text-xs text-blue-600 font-medium">Total Rated</div>
          </div>
        </div>

        {/* Clinical Competency Skills */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clinical Competency Skills Checklist</CardTitle>
              <Badge
                variant="default"
                className={
                  stats.unrated === 0
                    ? stats.needsImprovement === 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                    : 'bg-yellow-100 text-yellow-700'
                }
              >
                {stats.rated}/{COMPETENCY_SKILLS.length} Evaluated
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Rate each skill as Satisfactory, Needs Improvement, or N/A. Add comments as needed for any skill requiring follow-up.
            </p>
            <div className="space-y-4">
              {COMPETENCY_SKILLS.map((skill, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    data.skills[idx]?.rating === 'satisfactory'
                      ? 'border-green-200 bg-green-50'
                      : data.skills[idx]?.rating === 'needs_improvement'
                        ? 'border-amber-200 bg-amber-50'
                        : data.skills[idx]?.rating === 'na'
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-gray-500 mt-1 min-w-[28px]">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-3">{skill}</p>
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`skill-${idx}`}
                            value="satisfactory"
                            checked={data.skills[idx]?.rating === 'satisfactory'}
                            onChange={() => handleSkillRating(idx, 'satisfactory')}
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">Satisfactory</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`skill-${idx}`}
                            value="needs_improvement"
                            checked={data.skills[idx]?.rating === 'needs_improvement'}
                            onChange={() => handleSkillRating(idx, 'needs_improvement')}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-amber-700">Needs Improvement</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`skill-${idx}`}
                            value="na"
                            checked={data.skills[idx]?.rating === 'na'}
                            onChange={() => handleSkillRating(idx, 'na')}
                            className="h-4 w-4 text-gray-500 focus:ring-gray-400"
                          />
                          <span className="text-sm text-gray-500">N/A</span>
                        </label>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={data.skills[idx]?.comments || ''}
                          onChange={(e) => handleSkillComment(idx, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Comments (optional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Assessment */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${
                    data.overallAssessment === 'pass'
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="overallAssessment"
                    value="pass"
                    checked={data.overallAssessment === 'pass'}
                    onChange={() => updateField('overallAssessment', 'pass')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="font-medium text-green-700">Pass</span>
                    <p className="text-xs text-gray-500 mt-0.5">All required competencies are satisfactory</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${
                    data.overallAssessment === 'needs_remediation'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="overallAssessment"
                    value="needs_remediation"
                    checked={data.overallAssessment === 'needs_remediation'}
                    onChange={() => updateField('overallAssessment', 'needs_remediation')}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium text-amber-700">Needs Remediation</span>
                    <p className="text-xs text-gray-500 mt-0.5">One or more competencies require additional training</p>
                  </div>
                </label>
              </div>

              {data.overallAssessment === 'needs_remediation' && (
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 space-y-4">
                  <div>
                    <Label>Remediation Plan</Label>
                    <textarea
                      value={data.remediationPlan}
                      onChange={(e) => updateField('remediationPlan', e.target.value)}
                      className={INPUT_CLASS}
                      rows={4}
                      placeholder="Describe the remediation plan, including specific skills to be addressed, training methods, and expected outcomes..."
                    />
                  </div>
                  <div>
                    <Label>Follow-up Evaluation Date</Label>
                    <input
                      type="date"
                      value={data.followUpDate}
                      onChange={(e) => updateField('followUpDate', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              )}
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
                  attestationText="By signing below, I acknowledge that I have been evaluated on the clinical competencies listed above. I understand the results of this evaluation and any remediation requirements identified."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* RN Evaluator E-Signature */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>
              RN Evaluator Signature
              {data.evaluatorCredentials && (
                <Badge variant="default" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                  {data.evaluatorCredentials}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Evaluator Credentials</Label>
                <input
                  type="text"
                  value={data.evaluatorCredentials ? `${data.evaluatorName}, ${data.evaluatorCredentials}` : data.evaluatorName}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              {data.evaluatorSignature ? (
                <div className="space-y-3">
                  <SignatureDisplay
                    signatureData={data.evaluatorSignature}
                    signerName={`${data.evaluatorName}${data.evaluatorCredentials ? `, ${data.evaluatorCredentials}` : ''}`}
                    onClear={() => updateField('evaluatorSignature', null)}
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Label>Date Signed</Label>
                    <span className="font-medium">{data.evaluatorSignatureDate}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <input
                      type="date"
                      value={data.evaluatorSignatureDate}
                      onChange={(e) => updateField('evaluatorSignatureDate', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <ESignature
                    onSign={handleEvaluatorSignature}
                    signerName={`${data.evaluatorName}${data.evaluatorCredentials ? `, ${data.evaluatorCredentials}` : ''}`}
                    attestationText="By signing below, I certify that I have personally observed and evaluated the employee on all competencies listed above. The ratings provided are an accurate reflection of the employee's demonstrated skills."
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HiringFormShell>
  );
}
