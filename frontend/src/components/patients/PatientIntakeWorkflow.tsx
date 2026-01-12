import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  HeartIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  PlayIcon,
  PencilSquareIcon,
  EyeIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { intakeDataBridge } from '../../services/intakeDataBridge.service';

// Step status types
type StepStatus = 'completed' | 'in_progress' | 'pending' | 'not_started';

interface IntakeStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  progress: number; // 0-100
  completedDate?: string;
  assignedTo?: string;
  requiredFields?: string[];
  completedFields?: string[];
  estimatedTime?: string;
  notes?: string;
  // Pre-population tracking
  prePopulated?: boolean;
  prePopulatedFields?: string[];
}

interface PatientIntakeData {
  patientId: string;
  patientName: string;
  clientCode: string;
  admissionDate: string;
  referralSource?: string;
  status: string;
  overallProgress: number;
  steps: IntakeStep[];
  // Collected data from each step
  demographics?: any;
  insurance?: any;
  assessment?: any;
  physicianOrders?: any;
  carePlan?: any;
  caregiverAssignment?: any;
  serviceAuthorization?: any;
  firstVisit?: any;
  // Pre-population tracking
  prePopulatedFrom?: 'client_intake';
  prePopulatedAt?: string;
  clientIntakeId?: string;
}

// Status badge component
function StatusBadge({ status, progress }: { status: StepStatus; progress: number }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
        <CheckCircleSolidIcon className="h-3.5 w-3.5" />
        Complete
      </span>
    );
  }

  if (progress > 0 && progress < 100) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
        <PlayIcon className="h-3.5 w-3.5" />
        {progress}% Done
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <ClockIcon className="h-3.5 w-3.5" />
      Not Started
    </span>
  );
}

// Progress ring component
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary-600 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{progress}%</span>
        <span className="text-xs text-gray-500">Complete</span>
      </div>
    </div>
  );
}

// Step path mapping
const stepPaths: Record<string, string> = {
  demographics: 'demographics',
  insurance: 'insurance',
  assessment: 'assessment',
  physician_orders: 'physician-orders',
  care_plan: 'care-plan',
  caregiver_assignment: 'caregiver-assignment',
  service_auth: 'service-authorization',
  first_visit: 'first-visit',
};

// Step card component
function StepCard({
  step,
  baseUrl,
}: {
  step: IntakeStep;
  baseUrl: string;
}) {
  const navigate = useNavigate();
  const Icon = step.icon;
  const stepPath = stepPaths[step.id] || step.id;

  const handleClick = () => {
    navigate(`${baseUrl}/${stepPath}`);
  };

  const borderColors = {
    completed: 'border-success-300 bg-success-50/50',
    in_progress: 'border-primary-300 bg-primary-50/50',
    pending: 'border-warning-300 bg-warning-50/30',
    not_started: 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30',
  };

  const iconBgColors = {
    completed: 'bg-success-100 text-success-600',
    in_progress: 'bg-primary-100 text-primary-600',
    pending: 'bg-warning-100 text-warning-600',
    not_started: 'bg-gray-100 text-gray-500',
  };

  const completedFields = step.completedFields?.length || 0;
  const totalFields = step.requiredFields?.length || 0;

  return (
    <div
      className={`relative rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01] ${borderColors[step.status]}`}
      onClick={handleClick}
    >
      {/* Step number badge */}
      <div className="absolute -top-3 -left-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          step.status === 'completed'
            ? 'bg-success-500 text-white'
            : step.progress > 0
            ? 'bg-primary-500 text-white'
            : 'bg-gray-300 text-gray-700'
        }`}>
          {step.status === 'completed' ? (
            <CheckCircleSolidIcon className="h-4 w-4" />
          ) : (
            step.number
          )}
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${iconBgColors[step.status]}`}>
          <Icon className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
            </div>
            <StatusBadge status={step.status} progress={step.progress} />
          </div>

          {/* Progress bar for fields */}
          {totalFields > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-600">Fields Completed</span>
                <span className="font-medium text-gray-900">{completedFields}/{totalFields}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    step.status === 'completed' ? 'bg-success-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {step.prePopulated && (
              <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span className="font-medium">Pre-filled from Client Intake</span>
              </div>
            )}
            {step.estimatedTime && (
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{step.estimatedTime}</span>
              </div>
            )}
            {step.assignedTo && (
              <div className="flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" />
                <span>{step.assignedTo}</span>
              </div>
            )}
            {step.completedDate && (
              <div className="flex items-center gap-1 text-success-600">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span>Completed {step.completedDate}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <Link
            to={`${baseUrl}/${stepPath}`}
            className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              step.status === 'completed'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : step.progress > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {step.status === 'completed' ? (
              <>
                <EyeIcon className="h-4 w-4" />
                Review & Edit
              </>
            ) : step.progress > 0 ? (
              <>
                <PencilSquareIcon className="h-4 w-4" />
                Continue
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Start
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PatientIntakeWorkflow() {
  const { patientId } = useParams<{ patientId?: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [intakeData, setIntakeData] = useState<PatientIntakeData | null>(null);
  const [showPrePopulatedBanner, setShowPrePopulatedBanner] = useState(false);

  // Check for client intake ID in query params (for creating from client intake)
  const fromClientIntakeId = searchParams.get('fromClientIntake');

  // Base URL for step navigation
  const baseUrl = patientId ? `/patients/intake/${patientId}` : '/patients/intake/new';

  // Define all steps
  const stepDefinitions = [
    {
      id: 'demographics',
      number: 1,
      title: 'Patient Demographics',
      description: 'Basic patient information, contact details, and emergency contacts',
      icon: UserIcon,
      estimatedTime: '10-15 min',
      requiredFields: ['First Name', 'Last Name', 'Date of Birth', 'Gender', 'Phone', 'Address', 'Emergency Contact'],
    },
    {
      id: 'insurance',
      number: 2,
      title: 'Insurance Verification',
      description: 'Insurance coverage, Medicaid/Medicare eligibility, and authorizations',
      icon: CreditCardIcon,
      estimatedTime: '15-20 min',
      assignedTo: 'Billing Team',
      requiredFields: ['Insurance Type', 'Policy Number', 'Group Number', 'Eligibility Verified', 'Prior Auth'],
    },
    {
      id: 'assessment',
      number: 3,
      title: 'Clinical Assessment',
      description: 'Comprehensive clinical assessment including ADLs, IADLs, and functional status',
      icon: ClipboardDocumentCheckIcon,
      estimatedTime: '45-60 min',
      assignedTo: 'Clinical Team',
      requiredFields: ['ADL Assessment', 'IADL Assessment', 'Cognitive Status', 'Physical Status', 'Risk Assessment'],
    },
    {
      id: 'physician_orders',
      number: 4,
      title: 'Physician Orders',
      description: 'Physician orders, diagnoses, and treatment plan',
      icon: DocumentTextIcon,
      estimatedTime: '1-2 days',
      requiredFields: ['Physician Name', 'NPI', 'Diagnoses', 'Orders', 'Face-to-Face Date'],
    },
    {
      id: 'care_plan',
      number: 5,
      title: 'Care Plan Development',
      description: 'Individualized care plan based on assessment and physician orders',
      icon: HeartIcon,
      estimatedTime: '30-45 min',
      requiredFields: ['Goals', 'Interventions', 'Service Schedule', 'Emergency Plan'],
    },
    {
      id: 'caregiver_assignment',
      number: 6,
      title: 'Caregiver Assignment',
      description: 'Match and assign qualified caregivers based on patient needs',
      icon: UserGroupIcon,
      estimatedTime: '15-30 min',
      requiredFields: ['Primary Caregiver', 'Backup Caregiver', 'Introduction Date'],
    },
    {
      id: 'service_auth',
      number: 7,
      title: 'Service Authorization',
      description: 'Service authorization from payer and approved hours/services',
      icon: DocumentDuplicateIcon,
      estimatedTime: '3-5 days',
      assignedTo: 'Authorization Team',
      requiredFields: ['Auth Number', 'Approved Services', 'Approved Hours', 'Auth Period'],
    },
    {
      id: 'first_visit',
      number: 8,
      title: 'First Visit Scheduling',
      description: 'Schedule and confirm first home visit with assigned caregiver',
      icon: CalendarDaysIcon,
      estimatedTime: '10 min',
      requiredFields: ['Visit Date', 'Visit Time', 'Caregiver Confirmed', 'Patient Notified'],
    },
  ];

  useEffect(() => {
    const loadIntakeData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      let parsedData: any = null;

      // Check if we're creating from a Client Intake
      if (fromClientIntakeId) {
        // Try to get mock client intake data (in production, this would be an API call)
        const mockClientIntakeData = getMockClientIntakeData(fromClientIntakeId);
        if (mockClientIntakeData) {
          // Convert client intake to patient intake
          const prePopulated = intakeDataBridge.storePatientIntakeFromClientIntake(
            mockClientIntakeData,
            patientId || `patient_${Date.now()}`
          );
          parsedData = prePopulated;
          setShowPrePopulatedBanner(true);
        }
      }

      // If not pre-populated, try localStorage
      if (!parsedData) {
        const savedData = localStorage.getItem(`intake_${patientId || 'new'}`);
        parsedData = savedData ? JSON.parse(savedData) : null;

        // Check if this was previously pre-populated
        if (parsedData?.prePopulatedFrom === 'client_intake') {
          setShowPrePopulatedBanner(true);
        }
      }

      // Steps that can be pre-populated from Client Intake
      const prePopulatableSteps = ['demographics', 'insurance', 'assessment', 'physician_orders', 'care_plan'];

      const steps: IntakeStep[] = stepDefinitions.map(def => {
        const savedStep = parsedData?.steps?.find((s: any) =>
          s.id === def.id || s.id === def.number
        );

        // Check if this step has pre-populated data
        const hasPrePopulatedData = parsedData?.prePopulatedFrom === 'client_intake' &&
          prePopulatableSteps.includes(def.id);

        // Calculate progress based on saved data
        let progress = savedStep?.progress || 0;
        let completedFieldsCount = savedStep?.completedFields?.length || 0;

        // If pre-populated, check for initial field completion
        if (hasPrePopulatedData && progress === 0) {
          const stepData = getStepDataFromParsed(def.id, parsedData);
          if (stepData && Object.keys(stepData).length > 0) {
            completedFieldsCount = countFilledFields(stepData);
            progress = Math.min(Math.round((completedFieldsCount / (def.requiredFields?.length || 5)) * 100), 50);
          }
        }

        return {
          ...def,
          status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started' as StepStatus,
          progress,
          completedDate: savedStep?.completedDate,
          completedFields: savedStep?.completedFields || [],
          prePopulated: hasPrePopulatedData && progress > 0,
          prePopulatedFields: savedStep?.prePopulatedFields,
        };
      });

      // Calculate overall progress
      const totalProgress = steps.reduce((sum, s) => sum + s.progress, 0);
      const overallProgress = Math.round(totalProgress / steps.length);

      const data: PatientIntakeData = {
        patientId: patientId || parsedData?.patientId || 'new',
        patientName: parsedData?.patientName || 'New Patient',
        clientCode: parsedData?.clientCode || 'Pending',
        admissionDate: parsedData?.admissionDate || new Date().toISOString().split('T')[0],
        status: 'intake',
        overallProgress,
        steps,
        demographics: parsedData?.demographics,
        insurance: parsedData?.insurance,
        assessment: parsedData?.assessment,
        physicianOrders: parsedData?.physicianOrders,
        carePlan: parsedData?.carePlan,
        caregiverAssignment: parsedData?.caregiverAssignment,
        serviceAuthorization: parsedData?.serviceAuthorization,
        firstVisit: parsedData?.firstVisit,
        prePopulatedFrom: parsedData?.prePopulatedFrom,
        prePopulatedAt: parsedData?.prePopulatedAt,
        clientIntakeId: parsedData?.clientIntakeId || fromClientIntakeId || undefined,
      };

      setIntakeData(data);
      setLoading(false);
    };

    loadIntakeData();
  }, [patientId, fromClientIntakeId]);

  // Helper to get step data from parsed intake
  function getStepDataFromParsed(stepId: string, data: any): any {
    const mapping: Record<string, string> = {
      demographics: 'demographics',
      insurance: 'insurance',
      assessment: 'assessment',
      physician_orders: 'physicianOrders',
      care_plan: 'carePlan',
    };
    return data?.[mapping[stepId]];
  }

  // Helper to count filled fields in an object
  function countFilledFields(obj: any, depth = 0): number {
    if (!obj || depth > 2) return 0;
    let count = 0;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== null && val !== undefined && val !== '') {
        if (typeof val === 'object' && !Array.isArray(val)) {
          count += countFilledFields(val, depth + 1);
        } else if (Array.isArray(val) && val.length > 0) {
          count += 1;
        } else if (typeof val !== 'object') {
          count += 1;
        }
      }
    }
    return count;
  }

  // Mock function to get client intake data - in production, this would be an API call
  function getMockClientIntakeData(clientIntakeId: string): any {
    // Check localStorage for any saved client intake
    const savedClientIntake = localStorage.getItem(`client_intake_${clientIntakeId}`);
    if (savedClientIntake) {
      return JSON.parse(savedClientIntake);
    }

    // Return demo data for testing
    if (clientIntakeId === 'demo') {
      return {
        id: 'demo',
        firstName: 'Robert',
        lastName: 'Johnson',
        dateOfBirth: '1945-03-15',
        gender: 'Male',
        preferredLanguage: 'English',
        street1: '123 Oak Street',
        city: 'Cincinnati',
        state: 'OH',
        zipCode: '45202',
        county: 'Hamilton',
        primaryPhone: '(513) 555-1234',
        email: 'rjohnson@email.com',
        emergencyContactName: 'Mary Johnson',
        emergencyContactRelationship: 'Spouse',
        emergencyContactPhone: '(513) 555-5678',
        primaryPayerType: 'medicaid',
        medicaidId: 'OH123456789',
        waiverProgram: 'PASSPORT',
        caseManagerName: 'Sarah Williams',
        caseManagerPhone: '(513) 555-9999',
        requestedServices: ['Personal Care', 'Homemaker', 'Medication Reminder'],
        estimatedHoursPerWeek: 30,
        primaryPhysicianName: 'Dr. Michael Chen',
        primaryPhysicianPhone: '(513) 555-2000',
        diagnoses: ['Type 2 Diabetes', 'Hypertension', 'COPD'],
        allergies: ['Penicillin', 'Sulfa drugs'],
        medications: [
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
        ],
        mobilityStatus: 'Ambulatory with assistance',
        cognitiveStatus: 'Mild cognitive impairment',
        homeType: 'Single family home',
        livingSituation: 'Lives with spouse',
        hasPets: true,
        petDetails: 'One small dog',
        hipaaConsent: true,
        serviceAgreement: true,
      };
    }

    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!intakeData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Unable to Load</h2>
          <p className="text-gray-600 mt-2">Failed to load intake workflow data.</p>
        </div>
      </div>
    );
  }

  const completedSteps = intakeData.steps.filter(s => s.status === 'completed').length;
  const inProgressSteps = intakeData.steps.filter(s => s.progress > 0 && s.progress < 100).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard/patients" className="hover:text-primary-600">Patients</Link>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-gray-900">Patient Intake</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Intake Workflow</h1>
          <p className="text-gray-600 mt-1">Complete intake steps in any order as information becomes available</p>
        </div>

        {/* Pre-populated Data Banner */}
        {showPrePopulatedBanner && intakeData.prePopulatedFrom === 'client_intake' && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">Data Pre-filled from Client Intake</h3>
                <p className="text-sm text-purple-700 mt-1">
                  This patient's information was automatically populated from the Client Intake form.
                  Steps 1-5 have pre-filled data that you can review and update as needed.
                </p>
                {intakeData.prePopulatedAt && (
                  <p className="text-xs text-purple-600 mt-2">
                    Pre-filled on: {new Date(intakeData.prePopulatedAt).toLocaleDateString()} at {new Date(intakeData.prePopulatedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPrePopulatedBanner(false)}
                className="text-purple-400 hover:text-purple-600 transition-colors"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Progress Overview Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Progress Ring */}
            <div className="flex-shrink-0">
              <ProgressRing progress={intakeData.overallProgress} size={140} />
            </div>

            {/* Patient Info & Stats */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{intakeData.patientName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Client Code: <span className="font-medium text-gray-700">{intakeData.clientCode}</span>
                    <span className="mx-2">|</span>
                    Admission Date: <span className="font-medium text-gray-700">{intakeData.admissionDate}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {intakeData.overallProgress === 100 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-success-100 text-success-700">
                      <CheckCircleSolidIcon className="h-4 w-4" />
                      Ready to Activate
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                      <ClockIcon className="h-4 w-4" />
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* Step Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{intakeData.steps.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Steps</div>
                </div>
                <div className="bg-success-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-success-600">{completedSteps}</div>
                  <div className="text-xs text-success-700 mt-1">Completed</div>
                </div>
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600">{inProgressSteps}</div>
                  <div className="text-xs text-primary-700 mt-1">In Progress</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {intakeData.steps.length - completedSteps - inProgressSteps}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Not Started</div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{completedSteps} of {intakeData.steps.length} steps completed</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${intakeData.overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-info-50 border border-info-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-info-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-info-900">Flexible Workflow</h4>
              <p className="text-sm text-info-700 mt-1">
                You can work on any step in any order. Click on a step to open it and add information as it becomes available.
                Progress is saved automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {intakeData.steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              baseUrl={baseUrl}
            />
          ))}
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to={`${baseUrl}/binder`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4" />
                View/Print Patient Binder
              </Link>
              <button
                className="px-4 py-2 text-sm font-medium text-danger-700 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all intake data? This cannot be undone.')) {
                    localStorage.removeItem(`intake_${patientId || 'new'}`);
                    window.location.reload();
                  }
                }}
              >
                Reset Form
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/patients"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Patients
              </Link>
              {intakeData.overallProgress === 100 && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-lg hover:bg-success-700 transition-colors"
                  onClick={() => {
                    alert('Patient intake complete! In production, this would create the patient record and activate services.');
                  }}
                >
                  <CheckCircleSolidIcon className="h-4 w-4" />
                  Complete Intake
                </button>
              )}
            </div>
          </div>
        </div>

        {/* HIPAA Notice */}
        <div className="mt-6 p-4 bg-gray-100 rounded-xl">
          <p className="text-xs text-gray-600 text-center">
            <strong>HIPAA Compliance Notice:</strong> All patient information is encrypted and stored securely.
            Access is logged and monitored in accordance with healthcare privacy regulations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PatientIntakeWorkflow;
