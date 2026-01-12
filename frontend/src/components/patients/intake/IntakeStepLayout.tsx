import { ReactNode, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HeartIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PrinterIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface IntakeStepLayoutProps {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}

// Step definitions with navigation info
const stepConfig = [
  { id: 'demographics', number: 1, title: 'Demographics', icon: UserIcon, path: 'demographics' },
  { id: 'insurance', number: 2, title: 'Insurance', icon: CreditCardIcon, path: 'insurance' },
  { id: 'assessment', number: 3, title: 'Assessment', icon: ClipboardDocumentCheckIcon, path: 'assessment' },
  { id: 'physician_orders', number: 4, title: 'Physician Orders', icon: DocumentTextIcon, path: 'physician-orders' },
  { id: 'care_plan', number: 5, title: 'Care Plan', icon: HeartIcon, path: 'care-plan' },
  { id: 'caregiver_assignment', number: 6, title: 'Caregiver', icon: UserGroupIcon, path: 'caregiver-assignment' },
  { id: 'service_auth', number: 7, title: 'Authorization', icon: DocumentDuplicateIcon, path: 'service-authorization' },
  { id: 'first_visit', number: 8, title: 'First Visit', icon: CalendarDaysIcon, path: 'first-visit' },
];

export function IntakeStepLayout({
  stepId,
  stepNumber,
  title,
  description,
  icon: Icon,
  children,
}: IntakeStepLayoutProps) {
  const { patientId } = useParams<{ patientId?: string }>();
  const navigate = useNavigate();
  const [stepProgress, setStepProgress] = useState<Record<string, { progress: number; completed: boolean }>>({});

  const currentStepIndex = stepConfig.findIndex(s => s.id === stepId);
  const prevStep = currentStepIndex > 0 ? stepConfig[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < stepConfig.length - 1 ? stepConfig[currentStepIndex + 1] : null;

  const baseUrl = patientId ? `/patients/intake/${patientId}` : '/patients/intake/new';

  // Load progress from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`intake_${patientId || 'new'}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const progress: Record<string, { progress: number; completed: boolean }> = {};
      parsed.steps?.forEach((step: any) => {
        progress[step.id] = {
          progress: step.progress || 0,
          completed: step.status === 'completed',
        };
      });
      setStepProgress(progress);
    }
  }, [patientId]);

  const getStepStatus = (id: string) => {
    const step = stepProgress[id];
    if (!step) return 'not_started';
    if (step.completed) return 'completed';
    if (step.progress > 0) return 'in_progress';
    return 'not_started';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back to Overview */}
            <Link
              to={baseUrl}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to Overview</span>
            </Link>

            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-1">
              {stepConfig.map((step, index) => {
                const StepIcon = step.icon;
                const status = getStepStatus(step.id);
                const isCurrent = step.id === stepId;

                return (
                  <Link
                    key={step.id}
                    to={`${baseUrl}/${step.path}`}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-primary-100 text-primary-700'
                        : status === 'completed'
                        ? 'text-success-600 hover:bg-success-50'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    title={step.title}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isCurrent
                        ? 'bg-primary-600 text-white'
                        : status === 'completed'
                        ? 'bg-success-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {status === 'completed' && !isCurrent ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    {index < stepConfig.length - 1 && (
                      <div className={`w-4 h-0.5 ${
                        status === 'completed' ? 'bg-success-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <PrinterIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Step Selector */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-3">
        <select
          value={stepId}
          onChange={(e) => {
            const step = stepConfig.find(s => s.id === e.target.value);
            if (step) navigate(`${baseUrl}/${step.path}`);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {stepConfig.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <option key={step.id} value={step.id}>
                {step.number}. {step.title} {status === 'completed' ? '✓' : status === 'in_progress' ? '...' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Icon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary-600">Step {stepNumber} of 8</span>
                {stepProgress[stepId]?.completed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                    <CheckCircleSolidIcon className="h-3 w-3" />
                    Complete
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {prevStep ? (
              <Link
                to={`${baseUrl}/${prevStep.path}`}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Previous: {prevStep.title}</span>
              </Link>
            ) : (
              <div />
            )}

            {nextStep ? (
              <Link
                to={`${baseUrl}/${nextStep.path}`}
                className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>Next: {nextStep.title}</span>
                <ChevronRightIcon className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                to={baseUrl}
                className="flex items-center gap-2 px-4 py-2 text-white bg-success-600 rounded-lg hover:bg-success-700 transition-colors"
              >
                <CheckCircleSolidIcon className="h-5 w-5" />
                <span>Finish & Review</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .sticky { position: relative !important; }
          button, a { display: none !important; }
          .print-show { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default IntakeStepLayout;
