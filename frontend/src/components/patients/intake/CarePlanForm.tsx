import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, QuestionMarkCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CarePlanFormProps {
  data: any;
  intakeData: {
    demographics: any;
    insurance: any;
    physicianOrders: any;
    assessment: any;
  };
  onSave: (data: any, completedFields: string[]) => void;
  onClose: () => void;
}

interface Goal {
  id: string;
  category: string;
  problem: string;
  goalStatement: string;
  baseline: string;
  targetOutcome: string;
  targetDate: string;
  interventions: string[];
  status: string;
}

interface ActivityTask {
  id: string;
  serviceType: string;
  taskName: string;
  frequency: string;
  specificInstructions: string;
  precautions: string;
}

// Sample questions for care planning guidance
const carePlanQuestions: Record<string, string[]> = {
  // Goals
  goalProblem: [
    "What specific problem or need does this goal address?",
    "How does this problem affect the patient's daily life?",
    "What would the patient like to achieve?",
  ],
  goalBaseline: [
    "What is the patient's current status for this area?",
    "How often does this problem occur now?",
    "What level of assistance is currently needed?",
  ],
  goalTarget: [
    "What specific improvement are we aiming for?",
    "How will we know the goal has been achieved?",
    "What is a realistic target within this timeframe?",
  ],
  // Activity Plan
  taskInstructions: [
    "What specific steps should the caregiver follow?",
    "Are there patient preferences for how this is done?",
    "What equipment or supplies are needed?",
  ],
  taskPrecautions: [
    "Are there any safety concerns to be aware of?",
    "What should the caregiver avoid doing?",
    "When should the caregiver call the supervisor?",
  ],
  // Service Schedule
  serviceHours: [
    "How many hours per week does the authorization allow?",
    "What hours are needed to meet the patient's care needs?",
    "Are there specific times when care is most needed?",
  ],
  // Emergency Plan
  emergencyPlan: [
    "Who should be called first in an emergency?",
    "What are the signs that require immediate attention?",
    "Does the patient have any special emergency needs?",
  ],
  // Consent
  patientConsent: [
    "Has the patient reviewed the care plan?",
    "Does the patient agree with the goals and interventions?",
    "Does the patient have any concerns or preferences not addressed?",
  ],
};

// HelpTooltip component
function HelpTooltip({ fieldName }: { fieldName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const questions = carePlanQuestions[fieldName];

  if (!questions || questions.length === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="text-gray-400 hover:text-primary-600 transition-colors ml-1"
        title="Guidance questions"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute z-50 left-0 top-6 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-left">
          <div className="text-xs font-semibold text-gray-700 mb-2">Questions to Consider:</div>
          <ul className="space-y-1.5">
            {questions.map((q, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2">
                <span className="text-primary-500 font-medium shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 italic">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Goal categories aligned with assessment areas
const goalCategories = [
  { value: 'safety', label: 'Safety & Fall Prevention', icon: '🛡️' },
  { value: 'adl', label: 'Activities of Daily Living (ADLs)', icon: '🚿' },
  { value: 'iadl', label: 'Instrumental ADLs', icon: '🏠' },
  { value: 'mobility', label: 'Mobility & Physical Function', icon: '🚶' },
  { value: 'nutrition', label: 'Nutrition & Hydration', icon: '🍎' },
  { value: 'medication', label: 'Medication Management', icon: '💊' },
  { value: 'cognitive', label: 'Cognitive Function', icon: '🧠' },
  { value: 'psychosocial', label: 'Psychosocial & Emotional', icon: '❤️' },
  { value: 'skin', label: 'Skin Integrity', icon: '🩹' },
  { value: 'pain', label: 'Pain Management', icon: '📊' },
  { value: 'caregiver', label: 'Caregiver Support', icon: '🤝' },
];

// Service types per OAC 173-39
const serviceTypes = [
  { value: 'personal_care', label: 'Personal Care (T1019)', description: 'Bathing, dressing, grooming, toileting' },
  { value: 'homemaker', label: 'Homemaker (S5130)', description: 'Light housekeeping, laundry, meal prep' },
  { value: 'respite', label: 'Respite Care (S5150)', description: 'Supervision, companionship, relief for caregiver' },
  { value: 'escort', label: 'Escort/Transportation', description: 'Medical appointments, errands' },
  { value: 'medication_reminder', label: 'Medication Reminders', description: 'Self-administration support' },
];

// Common tasks by service type
const tasksByService: Record<string, string[]> = {
  personal_care: [
    'Bathing/Showering Assistance',
    'Dressing Assistance',
    'Grooming (hair, nails, oral care)',
    'Toileting Assistance',
    'Incontinence Care',
    'Transferring/Positioning',
    'Ambulation Assistance',
    'Range of Motion Exercises',
    'Skin Care/Lotion Application',
  ],
  homemaker: [
    'Light Housekeeping',
    'Laundry',
    'Meal Preparation',
    'Dishwashing',
    'Bed Making/Linen Change',
    'Trash Removal',
    'Grocery Shopping',
    'Organizing/Decluttering',
  ],
  respite: [
    'Supervision/Safety Monitoring',
    'Companionship',
    'Engagement Activities',
    'Reading/Conversation',
    'Walking/Outdoor Activity',
    'Medication Reminders',
    'Meal Monitoring',
  ],
  escort: [
    'Medical Appointment Escort',
    'Pharmacy Pickup',
    'Grocery/Errand Assistance',
    'Social Outing Support',
  ],
  medication_reminder: [
    'Morning Medication Reminder',
    'Afternoon Medication Reminder',
    'Evening Medication Reminder',
    'Medication Organization',
  ],
};

export function CarePlanForm({ data, intakeData, onSave, onClose }: CarePlanFormProps) {
  // Extract data from prior steps for auto-population
  const { demographics, physicianOrders, assessment } = intakeData;

  const [formData, setFormData] = useState({
    // Plan Header (auto-populated where possible)
    carePlanStartDate: data?.carePlanStartDate || physicianOrders?.certificationPeriodStart || new Date().toISOString().split('T')[0],
    carePlanReviewDate: data?.carePlanReviewDate || '',
    nextSupervisoryVisit: data?.nextSupervisoryVisit || '',
    developedBy: data?.developedBy || '',
    developedByCredentials: data?.developedByCredentials || '',
    developedDate: data?.developedDate || new Date().toISOString().split('T')[0],

    // Patient Summary (auto-populated from demographics/assessment)
    patientName: data?.patientName || `${demographics?.firstName || ''} ${demographics?.lastName || ''}`.trim(),
    dateOfBirth: data?.dateOfBirth || demographics?.dateOfBirth || '',
    primaryDiagnosis: data?.primaryDiagnosis || assessment?.primaryDiagnosis ||
      (physicianOrders?.diagnoses?.find((d: any) => d.isPrimary)?.description) || '',
    primaryDiagnosisCode: data?.primaryDiagnosisCode ||
      (physicianOrders?.diagnoses?.find((d: any) => d.isPrimary)?.code) || '',
    secondaryDiagnoses: data?.secondaryDiagnoses ||
      (physicianOrders?.diagnoses?.filter((d: any) => !d.isPrimary)?.map((d: any) => `${d.code} - ${d.description}`).join('\n')) || '',

    // Functional Status Summary (auto-populated from assessment)
    functionalLimitations: data?.functionalLimitations || generateFunctionalSummary(assessment),
    cognitiveStatus: data?.cognitiveStatus || assessment?.cognitiveStatus || '',
    mobilityStatus: data?.mobilityStatus || assessment?.mobility || '',

    // Goals (SMART format)
    goals: data?.goals || [] as Goal[],

    // Activity Plan (OAC 173-39-02.11 requirement)
    activityTasks: data?.activityTasks || [] as ActivityTask[],

    // Service Schedule
    authorizedHoursWeekly: data?.authorizedHoursWeekly || '',
    serviceHoursWeekly: data?.serviceHoursWeekly || '',
    preferredDays: data?.preferredDays || [] as string[],
    preferredTimeStart: data?.preferredTimeStart || '',
    preferredTimeEnd: data?.preferredTimeEnd || '',
    scheduleFlexibility: data?.scheduleFlexibility || '',
    scheduleNotes: data?.scheduleNotes || '',

    // Safety & Emergency (auto-populated from assessment)
    safetyPrecautions: data?.safetyPrecautions || generateSafetyPrecautions(assessment),
    fallPrevention: data?.fallPrevention || (assessment?.fallRisk === 'high' ? 'High fall risk - implement fall prevention protocol' : ''),
    emergencyPlan: data?.emergencyPlan || '',
    emergencyContactName: data?.emergencyContactName || demographics?.emergencyContactName || '',
    emergencyContactPhone: data?.emergencyContactPhone || demographics?.emergencyContactPhone || '',
    emergencyContactRelation: data?.emergencyContactRelation || demographics?.emergencyContactRelation || '',
    hospitalPreference: data?.hospitalPreference || '',
    dnaStatus: data?.dnaStatus || '',

    // Communication & Preferences (auto-populated)
    preferredLanguage: data?.preferredLanguage || demographics?.preferredLanguage || 'English',
    communicationNeeds: data?.communicationNeeds || generateCommunicationNeeds(assessment),
    culturalConsiderations: data?.culturalConsiderations || '',
    specialInstructions: data?.specialInstructions || '',

    // Consent & Signatures (OAC 173-39 requirement)
    patientParticipation: data?.patientParticipation || false,
    patientUnableToParticipate: data?.patientUnableToParticipate || false,
    patientUnableReason: data?.patientUnableReason || '',
    patientUnableReasonOther: data?.patientUnableReasonOther || '',
    patientUnderstandsPlan: data?.patientUnderstandsPlan || false,
    patientSignatureDate: data?.patientSignatureDate || '',
    familyParticipation: data?.familyParticipation || false,
    familyMemberName: data?.familyMemberName || '',
    familyMemberRelationship: data?.familyMemberRelationship || '',
    supervisorApproval: data?.supervisorApproval || false,
    supervisorName: data?.supervisorName || '',
    supervisorCredentials: data?.supervisorCredentials || '',
    supervisorApprovalDate: data?.supervisorApprovalDate || '',
    samePersonDeveloperSupervisor: data?.samePersonDeveloperSupervisor || false,
  });

  // Auto-calculate review date (60 days per OAC 173-39)
  useEffect(() => {
    if (formData.carePlanStartDate && !formData.carePlanReviewDate) {
      const startDate = new Date(formData.carePlanStartDate);
      const reviewDate = new Date(startDate);
      reviewDate.setDate(reviewDate.getDate() + 60);
      setFormData(prev => ({
        ...prev,
        carePlanReviewDate: reviewDate.toISOString().split('T')[0],
        nextSupervisoryVisit: reviewDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.carePlanStartDate]);

  const requiredFieldMapping: Record<string, string[]> = {
    'Plan Header': ['carePlanStartDate', 'developedBy'],
    'Goals': ['goals'],
    'Activity Plan': ['activityTasks'],
    'Service Schedule': ['serviceHoursWeekly', 'preferredDays'],
    'Safety & Emergency': ['emergencyPlan', 'hospitalPreference'],
    'Consent': ['patientParticipation', 'patientUnderstandsPlan'],
  };

  const getCompletedFields = () => {
    const completed: string[] = [];
    for (const [fieldName, keys] of Object.entries(requiredFieldMapping)) {
      if (fieldName === 'Goals') {
        if (formData.goals.length > 0) {
          completed.push(fieldName);
        }
      } else if (fieldName === 'Activity Plan') {
        if (formData.activityTasks.length > 0) {
          completed.push(fieldName);
        }
      } else if (fieldName === 'Service Schedule') {
        if (formData.serviceHoursWeekly && formData.preferredDays.length > 0) {
          completed.push(fieldName);
        }
      } else if (fieldName === 'Consent') {
        // If patient participated, both checkboxes required
        // If patient unable to participate, need reason + family participation
        const patientParticipated = formData.patientParticipation && formData.patientUnderstandsPlan;
        const patientUnableValid = formData.patientUnableToParticipate &&
          formData.patientUnableReason &&
          formData.familyParticipation &&
          formData.familyMemberName;
        if (patientParticipated || patientUnableValid) {
          completed.push(fieldName);
        }
      } else {
        const allFilled = keys.every(key => {
          const value = formData[key as keyof typeof formData];
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'boolean') return value;
          return value?.toString().trim();
        });
        if (allFilled) {
          completed.push(fieldName);
        }
      }
    }
    return completed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d: string) => d !== day)
        : [...prev.preferredDays, day],
    }));
  };

  // Goal management
  const addGoal = () => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      category: '',
      problem: '',
      goalStatement: '',
      baseline: '',
      targetOutcome: '',
      targetDate: '',
      interventions: [],
      status: 'active',
    };
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  };

  const updateGoal = (id: string, field: keyof Goal, value: any) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.map((g: Goal) =>
        g.id === id ? { ...g, [field]: value } : g
      ),
    }));
  };

  const removeGoal = (id: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((g: Goal) => g.id !== id),
    }));
  };

  // Activity Task management
  const addTask = () => {
    const newTask: ActivityTask = {
      id: Date.now().toString(),
      serviceType: '',
      taskName: '',
      frequency: '',
      specificInstructions: '',
      precautions: '',
    };
    setFormData(prev => ({
      ...prev,
      activityTasks: [...prev.activityTasks, newTask],
    }));
  };

  const updateTask = (id: string, field: keyof ActivityTask, value: string) => {
    setFormData(prev => ({
      ...prev,
      activityTasks: prev.activityTasks.map((t: ActivityTask) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  const removeTask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      activityTasks: prev.activityTasks.filter((t: ActivityTask) => t.id !== id),
    }));
  };

  const handleSave = () => {
    const completedFields = getCompletedFields();
    onSave(formData, completedFields);
    onClose();
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get available tasks based on selected service type
  const getTasksForService = (serviceType: string) => {
    return tasksByService[serviceType] || [];
  };

  return (
    <div className="space-y-6">
      {/* Auto-populated Patient Summary Banner */}
      {(formData.patientName || formData.primaryDiagnosis) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900">Patient Information (Auto-populated)</h4>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {formData.patientName && (
                  <div>
                    <span className="text-blue-700 font-medium">Patient:</span>
                    <span className="text-blue-900 ml-1">{formData.patientName}</span>
                  </div>
                )}
                {formData.dateOfBirth && (
                  <div>
                    <span className="text-blue-700 font-medium">DOB:</span>
                    <span className="text-blue-900 ml-1">{formData.dateOfBirth}</span>
                  </div>
                )}
                {formData.primaryDiagnosis && (
                  <div className="md:col-span-2">
                    <span className="text-blue-700 font-medium">Primary Dx:</span>
                    <span className="text-blue-900 ml-1">{formData.primaryDiagnosis}</span>
                    {formData.primaryDiagnosisCode && (
                      <span className="text-blue-600 ml-1">({formData.primaryDiagnosisCode})</span>
                    )}
                  </div>
                )}
              </div>
              {formData.functionalLimitations && (
                <div className="mt-2 text-xs text-blue-800">
                  <span className="font-medium">Functional Status:</span> {formData.functionalLimitations}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Care Plan Header */}
      <div className="bg-primary-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary-900 mb-3">Care Plan Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              name="carePlanStartDate"
              value={formData.carePlanStartDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              60-Day Review Date
              <span className="text-xs text-gray-500 ml-1">(OAC 173-39)</span>
            </label>
            <input
              type="date"
              name="carePlanReviewDate"
              value={formData.carePlanReviewDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developed By <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="developedBy"
              value={formData.developedBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="PCA Supervisor name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
            <select
              name="developedByCredentials"
              value={formData.developedByCredentials}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select</option>
              <option value="RN">RN</option>
              <option value="LPN">LPN</option>
              <option value="LSW">LSW</option>
              <option value="PCA_Supervisor">PCA Supervisor</option>
            </select>
          </div>
        </div>
      </div>

      {/* SMART Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Care Goals <span className="text-danger-500 ml-1">*</span>
              <HelpTooltip fieldName="goalProblem" />
            </h3>
            <p className="text-sm text-gray-500">Define SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound</p>
          </div>
          <button
            type="button"
            onClick={addGoal}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Goal
          </button>
        </div>

        {formData.goals.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No goals added yet. Click "Add Goal" to create care goals based on the assessment.</p>
            <p className="text-xs text-gray-400 mt-2">Goals should address needs identified in the clinical assessment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.goals.map((goal: Goal, index: number) => (
              <div key={goal.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Goal #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeGoal(goal.id)}
                    className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                    <select
                      value={goal.category}
                      onChange={(e) => updateGoal(goal.id, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select category</option>
                      {goalCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                      Problem/Need Identified
                      <HelpTooltip fieldName="goalProblem" />
                    </label>
                    <input
                      type="text"
                      value={goal.problem}
                      onChange={(e) => updateGoal(goal.id, 'problem', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="e.g., Patient is at high risk for falls"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Goal Statement (Patient will...)</label>
                    <input
                      type="text"
                      value={goal.goalStatement}
                      onChange={(e) => updateGoal(goal.id, 'goalStatement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="e.g., Patient will remain free from falls during the certification period"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                      Baseline Status
                      <HelpTooltip fieldName="goalBaseline" />
                    </label>
                    <input
                      type="text"
                      value={goal.baseline}
                      onChange={(e) => updateGoal(goal.id, 'baseline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="e.g., 2 falls in past 6 months"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                      Target Outcome
                      <HelpTooltip fieldName="goalTarget" />
                    </label>
                    <input
                      type="text"
                      value={goal.targetOutcome}
                      onChange={(e) => updateGoal(goal.id, 'targetOutcome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="e.g., 0 falls during care period"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={goal.targetDate}
                      onChange={(e) => updateGoal(goal.id, 'targetDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      value={goal.status}
                      onChange={(e) => updateGoal(goal.id, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="achieved">Achieved</option>
                      <option value="modified">Modified</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Plan (OAC 173-39-02.11 requirement) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Activity Plan <span className="text-danger-500 ml-1">*</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-2">OAC 173-39 Required</span>
            </h3>
            <p className="text-sm text-gray-500">Define specific tasks and activities for caregiver to perform per visit.</p>
          </div>
          <button
            type="button"
            onClick={addTask}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {formData.activityTasks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No tasks added yet. Click "Add Task" to define the activity plan.</p>
            <p className="text-xs text-gray-400 mt-2">Per OAC 173-39-02.11, the activity plan must define expected activities of the PCA.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.activityTasks.map((task: ActivityTask) => (
              <div key={task.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service Type</label>
                    <select
                      value={task.serviceType}
                      onChange={(e) => updateTask(task.id, 'serviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select type</option>
                      {serviceTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Task</label>
                    <select
                      value={task.taskName}
                      onChange={(e) => updateTask(task.id, 'taskName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select task</option>
                      {getTasksForService(task.serviceType).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="other">Other (specify in instructions)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                    <select
                      value={task.frequency}
                      onChange={(e) => updateTask(task.id, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="every_visit">Every Visit</option>
                      <option value="daily">Daily</option>
                      <option value="2x_week">2x/Week</option>
                      <option value="3x_week">3x/Week</option>
                      <option value="weekly">Weekly</option>
                      <option value="as_needed">As Needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                      Instructions
                      <HelpTooltip fieldName="taskInstructions" />
                    </label>
                    <input
                      type="text"
                      value={task.specificInstructions}
                      onChange={(e) => updateTask(task.id, 'specificInstructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Specific instructions..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                      Precautions
                      <HelpTooltip fieldName="taskPrecautions" />
                    </label>
                    <input
                      type="text"
                      value={task.precautions}
                      onChange={(e) => updateTask(task.id, 'precautions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Safety precautions..."
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-danger-600 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Schedule */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1 flex items-center">
          Service Schedule <span className="text-danger-500 ml-1">*</span>
          <HelpTooltip fieldName="serviceHours" />
        </h3>
        <p className="text-sm text-gray-500 mb-4">Define when and how often services will be provided.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Hours/Week</label>
              <input
                type="number"
                name="authorizedHoursWeekly"
                value={formData.authorizedHoursWeekly}
                onChange={handleChange}
                min="0"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                placeholder="From authorization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Hours/Week <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                name="serviceHoursWeekly"
                value={formData.serviceHoursWeekly}
                onChange={handleChange}
                min="0"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Hours per week"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Start Time</label>
              <input
                type="time"
                name="preferredTimeStart"
                value={formData.preferredTimeStart}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred End Time</label>
              <input
                type="time"
                name="preferredTimeEnd"
                value={formData.preferredTimeEnd}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Days <span className="text-danger-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.preferredDays.includes(day)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Flexibility</label>
              <select
                name="scheduleFlexibility"
                value={formData.scheduleFlexibility}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select</option>
                <option value="flexible">Flexible - Can adjust times/days</option>
                <option value="somewhat">Somewhat Flexible - Minor adjustments OK</option>
                <option value="strict">Strict - Must follow schedule exactly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Notes</label>
              <input
                type="text"
                name="scheduleNotes"
                value={formData.scheduleNotes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any scheduling preferences or restrictions..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Emergency Plan */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1 flex items-center">
          Safety & Emergency Plan <span className="text-danger-500 ml-1">*</span>
          <HelpTooltip fieldName="emergencyPlan" />
        </h3>
        <p className="text-sm text-gray-500 mb-4">Document safety precautions and emergency procedures.</p>

        {/* Auto-populated safety info */}
        {formData.safetyPrecautions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-amber-900">Safety Precautions (from Assessment):</span>
                <p className="text-sm text-amber-800 mt-1">{formData.safetyPrecautions}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fall Prevention Plan</label>
            <textarea
              name="fallPrevention"
              value={formData.fallPrevention}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Specific fall prevention measures..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Response Plan <span className="text-danger-500">*</span>
            </label>
            <textarea
              name="emergencyPlan"
              value={formData.emergencyPlan}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the emergency response plan..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                placeholder="Auto-populated from demographics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <input
                type="text"
                name="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Hospital <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                name="hospitalPreference"
                value={formData.hospitalPreference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Hospital name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code Status</label>
              <select
                name="dnaStatus"
                value={formData.dnaStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select status</option>
                <option value="full_code">Full Code</option>
                <option value="dnr">DNR (Do Not Resuscitate)</option>
                <option value="dni">DNI (Do Not Intubate)</option>
                <option value="comfort_only">Comfort Care Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Communication & Special Instructions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Communication & Special Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
            <input
              type="text"
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Communication Needs</label>
            <input
              type="text"
              name="communicationNeeds"
              value={formData.communicationNeeds}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Hearing aids, large print, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cultural/Religious Considerations</label>
            <textarea
              name="culturalConsiderations"
              value={formData.culturalConsiderations}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Dietary restrictions, religious practices, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions for Caregiver</label>
            <textarea
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional instructions..."
            />
          </div>
        </div>
      </div>

      {/* Consent & Signatures (OAC 173-39 requirement) */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1 flex items-center">
          Consent & Participation <span className="text-danger-500 ml-1">*</span>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-2">OAC 173-39 Required</span>
          <HelpTooltip fieldName="patientConsent" />
        </h3>
        <p className="text-sm text-gray-500 mb-4">Document patient participation in care plan development.</p>

        <div className="space-y-4">
          {/* Patient Participation Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="patientParticipation"
                checked={formData.patientParticipation}
                onChange={(e) => {
                  handleChange(e);
                  // Clear "unable to participate" if patient participated
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, patientUnableToParticipate: false, patientUnableReason: '' }));
                  }
                }}
                disabled={formData.patientUnableToParticipate}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
              />
              <span className={`text-sm ${formData.patientUnableToParticipate ? 'text-gray-400' : 'text-gray-700'}`}>
                Patient participated in care plan development
                {!formData.patientUnableToParticipate && <span className="text-danger-500 ml-1">*</span>}
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="patientUnderstandsPlan"
                checked={formData.patientUnderstandsPlan}
                onChange={handleChange}
                disabled={formData.patientUnableToParticipate}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
              />
              <span className={`text-sm ${formData.patientUnableToParticipate ? 'text-gray-400' : 'text-gray-700'}`}>
                Patient understands and agrees with the care plan
                {!formData.patientUnableToParticipate && <span className="text-danger-500 ml-1">*</span>}
              </span>
            </label>

            {/* Patient Unable to Participate */}
            <div className="pt-2 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="patientUnableToParticipate"
                  checked={formData.patientUnableToParticipate}
                  onChange={(e) => {
                    handleChange(e);
                    // Clear participation checkboxes if unable
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        patientParticipation: false,
                        patientUnderstandsPlan: false,
                        familyParticipation: true, // Auto-enable family participation
                      }));
                    }
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">
                  Patient unable to participate in care planning
                </span>
              </label>

              {formData.patientUnableToParticipate && (
                <div className="mt-3 ml-8 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-1">
                        Reason patient cannot participate <span className="text-danger-500">*</span>
                      </label>
                      <select
                        name="patientUnableReason"
                        value={formData.patientUnableReason}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      >
                        <option value="">Select reason</option>
                        <option value="cognitive_impairment">Cognitive Impairment (dementia, Alzheimer's)</option>
                        <option value="communication_barrier">Communication Barrier (aphasia, non-verbal)</option>
                        <option value="hospitalized">Patient Currently Hospitalized</option>
                        <option value="medical_condition">Acute Medical Condition</option>
                        <option value="mental_health">Mental Health Crisis</option>
                        <option value="legal_guardian">Legal Guardian Makes Decisions</option>
                        <option value="other">Other (specify below)</option>
                      </select>
                    </div>
                    {formData.patientUnableReason === 'other' && (
                      <div>
                        <label className="block text-sm font-medium text-amber-800 mb-1">
                          Specify reason <span className="text-danger-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="patientUnableReasonOther"
                          value={formData.patientUnableReasonOther}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Explain why patient cannot participate"
                        />
                      </div>
                    )}
                    <p className="text-xs text-amber-700">
                      When patient cannot participate, family/caregiver participation is required per OAC 173-39.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Family/Caregiver Participation */}
          <div className="pt-3 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="familyParticipation"
                checked={formData.familyParticipation}
                onChange={handleChange}
                disabled={formData.patientUnableToParticipate} // Required when patient can't participate
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-75"
              />
              <span className="text-sm text-gray-700">
                Family/caregiver participated in care planning
                {formData.patientUnableToParticipate && <span className="text-danger-500 ml-1">* (Required)</span>}
              </span>
            </label>

            {formData.familyParticipation && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Member Name
                    {formData.patientUnableToParticipate && <span className="text-danger-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="familyMemberName"
                    value={formData.familyMemberName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Name of family member/caregiver"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Patient</label>
                  <select
                    name="familyMemberRelationship"
                    value={formData.familyMemberRelationship}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="adult_child">Adult Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="legal_guardian">Legal Guardian</option>
                    <option value="poa">Power of Attorney</option>
                    <option value="other_family">Other Family Member</option>
                    <option value="friend">Friend/Non-family Caregiver</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Signature Date */}
          <div className="pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.patientUnableToParticipate ? 'Representative Signature Date' : 'Patient Signature Date'}
                </label>
                <input
                  type="date"
                  name="patientSignatureDate"
                  value={formData.patientSignatureDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Supervisor Review Section */}
          <div className="pt-3 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="supervisorApproval"
                checked={formData.supervisorApproval}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Supervisor reviewed and approved</span>
            </label>

            {formData.supervisorApproval && (
              <div className="mt-3 ml-8 space-y-3">
                {/* Small agency checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="samePersonDeveloperSupervisor"
                    checked={formData.samePersonDeveloperSupervisor}
                    onChange={(e) => {
                      handleChange(e);
                      // Auto-fill supervisor from developer if checked
                      if (e.target.checked && formData.developedBy) {
                        setFormData(prev => ({
                          ...prev,
                          supervisorName: prev.developedBy,
                          supervisorCredentials: prev.developedByCredentials,
                        }));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-600">
                    Same person developed and supervises this care plan (small agency)
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                    <input
                      type="text"
                      name="supervisorName"
                      value={formData.supervisorName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        formData.samePersonDeveloperSupervisor ? 'bg-gray-50' : ''
                      }`}
                      placeholder="Supervisor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Credentials</label>
                    <select
                      name="supervisorCredentials"
                      value={formData.supervisorCredentials}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        formData.samePersonDeveloperSupervisor ? 'bg-gray-50' : ''
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="RN">RN (Registered Nurse)</option>
                      <option value="LPN">LPN (Licensed Practical Nurse)</option>
                      <option value="LSW">LSW (Licensed Social Worker)</option>
                      <option value="LISW">LISW (Licensed Independent Social Worker)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                    <input
                      type="date"
                      name="supervisorApprovalDate"
                      value={formData.supervisorApprovalDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {formData.samePersonDeveloperSupervisor && (
                  <p className="text-xs text-gray-500 italic">
                    Per OAC 173-39, the same qualified individual (RN, LSW) may both develop and supervise the care plan.
                    This is common for small agencies with limited staff.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">
            {getCompletedFields().length} of {Object.keys(requiredFieldMapping).length} required sections
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedFields().length / Object.keys(requiredFieldMapping).length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(requiredFieldMapping).map((field) => (
            <span
              key={field}
              className={`text-xs px-2 py-1 rounded-full ${
                getCompletedFields().includes(field)
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}

// Helper functions to generate auto-populated content from assessment
function generateFunctionalSummary(assessment: any): string {
  if (!assessment) return '';

  const items: string[] = [];

  if (assessment.mobility) {
    const mobilityMap: Record<string, string> = {
      'ambulatory': 'Ambulatory',
      'ambulatory_with_device': 'Ambulatory with device',
      'wheelchair': 'Wheelchair-bound',
      'bedbound': 'Bedbound',
    };
    items.push(mobilityMap[assessment.mobility] || assessment.mobility);
  }

  if (assessment.cognitiveStatus) {
    const cogMap: Record<string, string> = {
      'intact': 'Cognition intact',
      'mild_impairment': 'Mild cognitive impairment',
      'moderate_impairment': 'Moderate cognitive impairment',
      'severe_impairment': 'Severe cognitive impairment',
    };
    items.push(cogMap[assessment.cognitiveStatus] || '');
  }

  if (assessment.fallRisk === 'high') {
    items.push('High fall risk');
  }

  return items.filter(Boolean).join(', ');
}

function generateSafetyPrecautions(assessment: any): string {
  if (!assessment) return '';

  const precautions: string[] = [];

  if (assessment.fallRisk === 'high' || assessment.fallRisk === 'moderate') {
    precautions.push('Fall precautions');
  }

  if (assessment.elopementRisk === 'high' || assessment.elopementRisk === 'moderate') {
    precautions.push('Elopement precautions - monitor doors');
  }

  if (assessment.skinCondition === 'pressure_ulcers' || assessment.skinCondition === 'wounds') {
    precautions.push('Skin integrity monitoring');
  }

  if (assessment.allergies && !assessment.allergiesNKDA) {
    precautions.push(`Allergies: ${assessment.allergies}`);
  }

  return precautions.join('; ');
}

function generateCommunicationNeeds(assessment: any): string {
  if (!assessment) return '';

  const needs: string[] = [];

  if (assessment.hearingStatus === 'impaired' || assessment.hearingStatus === 'severely_impaired') {
    needs.push('Hearing impairment - speak clearly, face patient');
  }

  if (assessment.visionStatus === 'impaired' || assessment.visionStatus === 'severely_impaired') {
    needs.push('Vision impairment - use large print');
  }

  if (assessment.speechLanguage === 'impaired' || assessment.speechLanguage === 'severely_impaired') {
    needs.push('Speech difficulty - allow extra time for responses');
  }

  return needs.join('; ');
}
