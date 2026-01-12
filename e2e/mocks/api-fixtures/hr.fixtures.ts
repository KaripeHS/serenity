import { randomUUID } from 'crypto';
import { authFixtures } from './auth.fixtures';

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  stage: 'new' | 'screening' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'hired';
  status: string;
  appliedDate: string;
  interviewDate?: string;
  interviewerId?: string;
  offerDate?: string;
  offerDetails?: {
    position: string;
    rate: string;
    startDate: string;
  };
  rejectionReason?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingRecord {
  id: string;
  applicantId: string;
  staffId?: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  currentStep: number;
  totalSteps: number;
  status: 'in_progress' | 'completed' | 'incomplete';
  steps: OnboardingStep[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStep {
  stepNumber: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: string;
  data?: Record<string, any>;
}

const positions = ['Caregiver', 'Certified Nursing Assistant', 'Licensed Practical Nurse', 'Registered Nurse', 'Home Health Aide'];
const firstNames = ['Jane', 'Michael', 'Sarah', 'David', 'Jessica', 'Robert', 'Emily', 'James'];
const lastNames = ['Applicant', 'Candidate', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];

const onboardingSteps = [
  { stepNumber: 1, title: 'Personal Information', status: 'pending' as const },
  { stepNumber: 2, title: 'I-9 Form', status: 'pending' as const },
  { stepNumber: 3, title: 'W-4 Tax Form', status: 'pending' as const },
  { stepNumber: 4, title: 'Background Check Consent', status: 'pending' as const },
  { stepNumber: 5, title: 'Direct Deposit Setup', status: 'pending' as const },
  { stepNumber: 6, title: 'Emergency Contacts', status: 'pending' as const },
  { stepNumber: 7, title: 'Upload Credentials', status: 'pending' as const },
  { stepNumber: 8, title: 'HIPAA Training', status: 'pending' as const },
  { stepNumber: 9, title: 'Safety Training', status: 'pending' as const },
  { stepNumber: 10, title: 'Company Policies', status: 'pending' as const },
  { stepNumber: 11, title: 'System Access Setup', status: 'pending' as const },
  { stepNumber: 12, title: 'Final Review', status: 'pending' as const }
];

export const hrFixtures = {
  // Generate single applicant
  generateApplicant: (overrides?: Partial<Applicant>): Applicant => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return {
      id: randomUUID(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `614-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      position: positions[Math.floor(Math.random() * positions.length)],
      stage: 'new',
      status: 'active',
      appliedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      organizationId: authFixtures.defaultOrgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  // Predefined applicants
  janeApplicant: (): Applicant => hrFixtures.generateApplicant({
    id: 'applicant-jane-001',
    firstName: 'Jane',
    lastName: 'Applicant',
    email: 'jane.applicant@test.com',
    phone: '614-555-1234',
    position: 'Caregiver',
    stage: 'new'
  }),

  // Generate applicant at different stages
  newApplicant: (): Applicant => hrFixtures.generateApplicant({ stage: 'new' }),

  screeningApplicant: (): Applicant => hrFixtures.generateApplicant({
    stage: 'screening',
    status: 'under_review'
  }),

  interviewingApplicant: (): Applicant => hrFixtures.generateApplicant({
    stage: 'interviewing',
    interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    interviewerId: 'user-hr-manager-001'
  }),

  offerApplicant: (): Applicant => hrFixtures.generateApplicant({
    stage: 'offer',
    offerDate: new Date().toISOString(),
    offerDetails: {
      position: 'Caregiver',
      rate: '18.50',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }),

  acceptedApplicant: (): Applicant => hrFixtures.generateApplicant({
    stage: 'accepted',
    offerDetails: {
      position: 'Caregiver',
      rate: '18.50',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }),

  rejectedApplicant: (): Applicant => hrFixtures.generateApplicant({
    stage: 'rejected',
    rejectionReason: 'Not qualified for the position'
  }),

  // Generate lists
  newApplicants: (count: number = 10): Applicant[] => {
    return Array.from({ length: count }, () => hrFixtures.newApplicant());
  },

  // Onboarding record generators
  generateOnboardingRecord: (applicantId: string, overrides?: Partial<OnboardingRecord>): OnboardingRecord => {
    const currentStep = Math.floor(Math.random() * 12) + 1;
    const steps = onboardingSteps.map(step => ({
      ...step,
      status: step.stepNumber < currentStep ? 'completed' as const :
              step.stepNumber === currentStep ? 'in_progress' as const : 'pending' as const,
      completedDate: step.stepNumber < currentStep ? new Date().toISOString() : undefined
    }));

    return {
      id: randomUUID(),
      applicantId,
      email: 'applicant@test.com',
      firstName: 'Test',
      lastName: 'Applicant',
      position: 'Caregiver',
      currentStep,
      totalSteps: 12,
      status: currentStep === 12 ? 'completed' : 'in_progress',
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  incompleteOnboarding: (applicantId: string): OnboardingRecord =>
    hrFixtures.generateOnboardingRecord(applicantId, {
      currentStep: 6,
      status: 'in_progress'
    }),

  completeOnboarding: (applicantId: string): OnboardingRecord => {
    const steps = onboardingSteps.map(step => ({
      ...step,
      status: 'completed' as const,
      completedDate: new Date().toISOString()
    }));

    return hrFixtures.generateOnboardingRecord(applicantId, {
      currentStep: 12,
      status: 'completed',
      steps
    });
  },

  // API Response generators
  getApplicantsResponse: (params?: { stage?: string; status?: string }): { success: boolean; applicants: Applicant[] } => {
    let applicants: Applicant[] = [
      ...hrFixtures.newApplicants(5),
      hrFixtures.screeningApplicant(),
      hrFixtures.interviewingApplicant(),
      hrFixtures.offerApplicant(),
      hrFixtures.acceptedApplicant(),
      hrFixtures.rejectedApplicant()
    ];

    if (params?.stage) {
      applicants = applicants.filter(a => a.stage === params.stage);
    }

    if (params?.status) {
      applicants = applicants.filter(a => a.status === params.status);
    }

    return {
      success: true,
      applicants
    };
  },

  getApplicantByIdResponse: (applicantId: string): { success: boolean; applicant: Applicant } => ({
    success: true,
    applicant: hrFixtures.generateApplicant({ id: applicantId })
  }),

  createApplicantResponse: (data: Partial<Applicant>): { success: boolean; applicant: Applicant; message: string } => ({
    success: true,
    applicant: hrFixtures.generateApplicant(data),
    message: 'Application submitted successfully'
  }),

  updateApplicantStageResponse: (applicantId: string, stage: string): { success: boolean; applicant: Applicant } => ({
    success: true,
    applicant: hrFixtures.generateApplicant({ id: applicantId, stage: stage as any })
  }),

  scheduleInterviewResponse: (applicantId: string, interviewData: any): { success: boolean; applicant: Applicant } => ({
    success: true,
    applicant: hrFixtures.interviewingApplicant()
  }),

  generateOfferResponse: (applicantId: string, offerData: any): { success: boolean; applicant: Applicant } => ({
    success: true,
    applicant: hrFixtures.offerApplicant()
  }),

  acceptOfferResponse: (applicantId: string): { success: boolean; applicant: Applicant; onboardingId: string } => ({
    success: true,
    applicant: hrFixtures.acceptedApplicant(),
    onboardingId: randomUUID()
  }),

  rejectApplicantResponse: (applicantId: string, reason: string): { success: boolean; applicant: Applicant } => ({
    success: true,
    applicant: hrFixtures.rejectedApplicant()
  }),

  // Onboarding responses
  getOnboardingRecordsResponse: (): { success: boolean; records: OnboardingRecord[] } => ({
    success: true,
    records: Array.from({ length: 5 }, () =>
      hrFixtures.generateOnboardingRecord(randomUUID())
    )
  }),

  getOnboardingByIdResponse: (onboardingId: string): { success: boolean; record: OnboardingRecord } => ({
    success: true,
    record: hrFixtures.generateOnboardingRecord('applicant-id', { id: onboardingId })
  }),

  updateOnboardingStepResponse: (onboardingId: string, stepNumber: number, data: any): { success: boolean; record: OnboardingRecord } => {
    const record = hrFixtures.generateOnboardingRecord('applicant-id', { id: onboardingId });
    record.steps[stepNumber - 1].status = 'completed';
    record.steps[stepNumber - 1].completedDate = new Date().toISOString();
    record.currentStep = stepNumber + 1;
    return { success: true, record };
  },

  completeOnboardingResponse: (onboardingId: string): { success: boolean; record: OnboardingRecord; staffId: string } => ({
    success: true,
    record: hrFixtures.completeOnboarding('applicant-id'),
    staffId: randomUUID()
  }),

  // Error responses
  validationError: (field: string) => ({
    error: 'Validation failed',
    message: `${field} is required`,
    details: { [field]: `${field} is required` }
  }),

  applicantNotFoundError: {
    error: 'Not found',
    message: 'Applicant not found'
  },

  onboardingIncompleteError: {
    error: 'Onboarding incomplete',
    message: 'Must complete all 12 steps before activating employee'
  }
};
