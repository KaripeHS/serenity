import { lazy, ComponentType } from 'react';

export type HiringFormRole = 'shared' | 'caregiver' | 'nurse';
export type HiringFormStatus = 'not_started' | 'in_progress' | 'completed' | 'signed';

export interface HiringFormDefinition {
  id: string;           // H01, H02, etc.
  slug: string;
  title: string;
  description: string;
  roleFilter: HiringFormRole;
  gate: number;         // Which gate this form belongs to (1-7)
  hasSignature: boolean;
  hasFileUpload: boolean;
  isHROnly: boolean;    // Only HR/admin can fill (e.g., Reference Check, I-9 Section 2)
  component: React.LazyExoticComponent<ComponentType>;
}

export const HIRING_FORM_REGISTRY: HiringFormDefinition[] = [
  // ── Gate 1: Application ──
  {
    id: 'H01',
    slug: 'employment-application',
    title: 'Employment Application',
    description: 'Personal information, education history, employment history, and references',
    roleFilter: 'shared',
    gate: 1,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/EmploymentApplicationForm')),
  },

  // ── Gate 2: Interview & References ──
  {
    id: 'H02',
    slug: 'reference-check',
    title: 'Reference Check & Job Verification',
    description: 'Contact former employers to verify employment dates, title, performance, and rehire eligibility',
    roleFilter: 'shared',
    gate: 2,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: true,
    component: lazy(() => import('./shared/ReferenceCheckForm')),
  },

  // ── Gate 3: Background & Compliance Clearance ──
  {
    id: 'H15',
    slug: 'webcheck-fingerprint',
    title: 'Webcheck Fingerprint Information',
    description: 'Fingerprint scheduling and site location for BCI/FBI background check',
    roleFilter: 'shared',
    gate: 3,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/WebcheckFingerprintForm')),
  },
  {
    id: 'H16',
    slug: 'bci-request',
    title: 'BCI Background Check Request',
    description: 'Authorization for Ohio BCI criminal background check with recertification tracking',
    roleFilter: 'shared',
    gate: 3,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/BCIRequestForm')),
  },
  {
    id: 'H05',
    slug: 'oac-ethical-standards',
    title: 'OAC Ethical Standards Acknowledgment',
    description: 'Ohio Administrative Code 173-39-02(B)(8) ethical standards acknowledgment',
    roleFilter: 'shared',
    gate: 3,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/EthicalStandardsForm')),
  },
  {
    id: 'H08',
    slug: 'confidentiality-agreement',
    title: 'Confidentiality Agreement',
    description: 'HIPAA and company confidentiality requirements acknowledgment',
    roleFilter: 'shared',
    gate: 3,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/ConfidentialityForm')),
  },
  {
    id: 'H12',
    slug: 'abuse-reporting-ack',
    title: 'Neglect/Abuse Reporting Acknowledgment',
    description: 'Mandatory reporter responsibilities acknowledgment per Ohio law',
    roleFilter: 'shared',
    gate: 3,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/AbuseReportingAckForm')),
  },

  // ── Gate 4: Employment Authorization ──
  {
    id: 'H04',
    slug: 'i9-employment-eligibility',
    title: 'Form I-9 Employment Eligibility Verification',
    description: 'Federal employment eligibility verification — Section 1 (employee), Section 2 (employer/HR)',
    roleFilter: 'shared',
    gate: 4,
    hasSignature: true,
    hasFileUpload: true,
    isHROnly: false,
    component: lazy(() => import('./shared/I9Form')),
  },
  {
    id: 'H03',
    slug: 'affidavit',
    title: 'Statement of Affidavit',
    description: 'Ohio 5-year residency declaration with notary section',
    roleFilter: 'shared',
    gate: 4,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/AffidavitForm')),
  },

  // ── Gate 5: Job Offer Accepted ──
  {
    id: 'H13',
    slug: 'job-acceptance',
    title: 'Job Acceptance Statement',
    description: 'Formal job offer acceptance with position, wage, and start date',
    roleFilter: 'shared',
    gate: 5,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/JobAcceptanceForm')),
  },

  // ── Gate 6: All Onboarding Docs Signed ──
  {
    id: 'H06',
    slug: 'proof-of-insurance',
    title: 'Statement of Proof of Insurance',
    description: 'Auto insurance verification for employees who drive for work duties',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: true,
    hasFileUpload: true,
    isHROnly: false,
    component: lazy(() => import('./shared/InsuranceProofForm')),
  },
  {
    id: 'H07',
    slug: 'hepatitis-b',
    title: 'Hepatitis B Declination/Acceptance',
    description: 'Hepatitis B vaccine series decision — accept or decline with signature',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/HepatitisBForm')),
  },
  {
    id: 'H09',
    slug: 'release-authorization',
    title: 'Authorization of Release Information',
    description: 'Consent to release employment information to authorized parties',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/ReleaseAuthorizationForm')),
  },
  {
    id: 'H10',
    slug: 'client-relationship',
    title: 'Client/Employee Relationship Declaration',
    description: 'Declare any existing relationships with agency clients (conflict of interest)',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/ClientRelationshipForm')),
  },
  {
    id: 'H11',
    slug: 'new-hire-report',
    title: 'New Hire Report',
    description: 'State-required new hire reporting form with employment details',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: false,
    hasFileUpload: false,
    isHROnly: true,
    component: lazy(() => import('./shared/NewHireReportForm')),
  },
  {
    id: 'H14',
    slug: 'handbook-ack-hiring',
    title: 'Employee Handbook Acknowledgment',
    description: 'IO Waiver and Employee Handbook receipt acknowledgment',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./shared/HandbookAckForm')),
  },
  {
    id: 'H17',
    slug: 'required-docs-checklist',
    title: 'Required Documents Checklist',
    description: 'Master checklist — auto-tracks all form completion with date and completed-by per item',
    roleFilter: 'shared',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: true,
    component: lazy(() => import('./shared/RequiredDocsChecklist')),
  },

  // ── Caregiver-Only (Gate 6) ──
  {
    id: 'H18',
    slug: 'hha-job-description',
    title: 'HHA/CNA/STNA Job Description',
    description: 'Home Health Aide job duties and responsibilities acknowledgment',
    roleFilter: 'caregiver',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./caregiver/HHAJobDescriptionForm')),
  },
  {
    id: 'H19',
    slug: 'orientation-checklist-hiring',
    title: 'New Employee Orientation Checklist',
    description: 'Orientation topics completion tracking for new caregivers',
    roleFilter: 'caregiver',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./caregiver/OrientationChecklistForm')),
  },
  {
    id: 'H20',
    slug: 'homemaker-qualifications',
    title: 'Requirements/Qualification for Homemaker Services',
    description: 'Homemaker services qualification verification form',
    roleFilter: 'caregiver',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./caregiver/HomemakerQualForm')),
  },
  {
    id: 'H21',
    slug: 'hha-competency',
    title: 'HHA Clinical Competency Criteria',
    description: 'Home Health Aide clinical skills competency checklist with evaluator sign-off',
    roleFilter: 'caregiver',
    gate: 6,
    hasSignature: true,
    hasFileUpload: false,
    isHROnly: false,
    component: lazy(() => import('./caregiver/HHACompetencyForm')),
  },

  // ── Nurse-Only (Gate 6) ──
  {
    id: 'H22',
    slug: 'supervisor-qualification',
    title: 'Supervisor Qualification for Homemaker/Personal Care',
    description: 'Supervisor qualification verification for nursing supervisors',
    roleFilter: 'nurse',
    gate: 6,
    hasSignature: true,
    hasFileUpload: true,
    isHROnly: false,
    component: lazy(() => import('./nurse/SupervisorQualForm')),
  },
];

export function getHiringFormBySlug(slug: string): HiringFormDefinition | undefined {
  return HIRING_FORM_REGISTRY.find(f => f.slug === slug);
}

export function getHiringFormsByGate(gate: number): HiringFormDefinition[] {
  return HIRING_FORM_REGISTRY.filter(f => f.gate === gate);
}

export function getHiringFormsForRole(role: 'nurse' | 'caregiver'): HiringFormDefinition[] {
  return HIRING_FORM_REGISTRY.filter(f => f.roleFilter === 'shared' || f.roleFilter === role);
}

export const GATE_DEFINITIONS = [
  { gate: 1, name: 'Application Submitted', description: 'Employment application completed and signed' },
  { gate: 2, name: 'Interview & References', description: 'All 3 reference checks completed and verified' },
  { gate: 3, name: 'Background & Compliance', description: 'BCI/FBI initiated, compliance documents signed' },
  { gate: 4, name: 'Employment Authorization', description: 'I-9 verified, Ohio residency affidavit signed' },
  { gate: 5, name: 'Job Offer Accepted', description: 'Formal job acceptance with terms signed' },
  { gate: 6, name: 'All Docs Complete', description: 'All required forms completed and signed' },
  { gate: 7, name: 'Active', description: 'Orientation complete, probation passed' },
];
