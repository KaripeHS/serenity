import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { IntakeStepLayout } from '../../../components/patients/intake/IntakeStepLayout';
import { CaregiverAssignmentForm } from '../../../components/patients/intake/CaregiverAssignmentForm';

export function CaregiverAssignmentPage() {
  const { patientId } = useParams<{ patientId?: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(`intake_${patientId || 'new'}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(parsed.caregiverAssignment || {});
    } else {
      setFormData({});
    }
  }, [patientId]);

  const handleSave = (data: any, completedFields: string[]) => {
    const storageKey = `intake_${patientId || 'new'}`;
    const savedData = localStorage.getItem(storageKey);
    const parsed = savedData ? JSON.parse(savedData) : { steps: [] };

    parsed.caregiverAssignment = data;

    const totalFields = 3;
    const progress = Math.round((completedFields.length / totalFields) * 100);
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

    const stepIndex = parsed.steps?.findIndex((s: any) => s.id === 'caregiver_assignment') ?? -1;
    const stepData = {
      id: 'caregiver_assignment',
      status,
      progress,
      completedFields,
      completedDate: status === 'completed' ? new Date().toLocaleDateString() : undefined,
    };

    if (stepIndex >= 0) {
      parsed.steps[stepIndex] = stepData;
    } else {
      parsed.steps = parsed.steps || [];
      parsed.steps.push(stepData);
    }

    const totalProgress = parsed.steps.reduce((sum: number, s: any) => sum + (s.progress || 0), 0);
    parsed.overallProgress = Math.round(totalProgress / 8);

    localStorage.setItem(storageKey, JSON.stringify(parsed));
  };

  const handleClose = () => {
    const baseUrl = patientId ? `/patients/intake/${patientId}` : '/patients/intake/new';
    navigate(baseUrl);
  };

  if (formData === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <IntakeStepLayout
      stepId="caregiver_assignment"
      stepNumber={6}
      title="Caregiver Assignment"
      description="Match and assign qualified caregivers based on patient needs"
      icon={UserGroupIcon}
    >
      <CaregiverAssignmentForm
        data={formData}
        onSave={handleSave}
        onClose={handleClose}
      />
    </IntakeStepLayout>
  );
}

export default CaregiverAssignmentPage;
