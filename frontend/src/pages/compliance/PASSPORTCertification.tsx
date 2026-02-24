import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  DocumentCheckIcon,
  HomeIcon,
  HeartIcon,
  PencilSquareIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  BoltIcon,
  LinkIcon,
  PaperClipIcon,
  FolderOpenIcon,
  ArrowPathIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChecklistItemStatus = 'not_started' | 'in_progress' | 'completed' | 'not_applicable';

/**
 * sourceType tells us where the documentation comes from:
 * - 'system'   → Data already exists in the ERP and can be pulled automatically
 * - 'generate' → The ERP can generate a report/document from existing data
 * - 'upload'   → Must be manually created and uploaded (policies, forms, etc.)
 * - 'external' → Must be obtained from an external source (SOS, BWC, ODH, etc.)
 */
type DocumentSourceType = 'system' | 'generate' | 'upload' | 'external';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string; // base64 for small files, for persistence
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  status: ChecklistItemStatus;
  notes: string;
  fileReference: string;
  required: boolean;
  sourceType: DocumentSourceType;
  systemLink?: string;        // link to the ERP module
  systemLinkLabel?: string;   // label for the link button
  generateAction?: string;    // which report to auto-generate
  uploadedFiles: UploadedFile[];
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  items: ChecklistItem[];
  collapsed: boolean;
}

interface CertificationState {
  sections: ChecklistSection[];
  lastUpdated: string;
  submissionDeadline: string;
  agencyName: string;
  contactEmail: string;
}

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'serenity_passport_certification';

// ─── Source Type Display Config ──────────────────────────────────────────────

const SOURCE_CONFIG: Record<DocumentSourceType, { label: string; color: string; bgColor: string; icon: React.ComponentType<any>; tip: string }> = {
  system:   { label: 'ERP Data',   color: 'text-green-700',  bgColor: 'bg-green-50 border-green-200',   icon: BoltIcon,              tip: 'Data exists in your ERP — click to view' },
  generate: { label: 'Auto-Generate', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200',     icon: SparklesIcon,          tip: 'Can be auto-generated from system data' },
  upload:   { label: 'Upload Required', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: CloudArrowUpIcon,  tip: 'Must be created and uploaded manually' },
  external: { label: 'External Doc', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: ArrowTopRightOnSquareIcon, tip: 'Obtain from external agency/source' },
};

// ─── Default Checklist Data ──────────────────────────────────────────────────

function item(id: string, label: string, description: string, sourceType: DocumentSourceType, systemLink?: string, systemLinkLabel?: string, generateAction?: string): ChecklistItem {
  return { id, label, description, status: 'not_started', notes: '', fileReference: '', required: true, sourceType, systemLink, systemLinkLabel, generateAction, uploadedFiles: [] };
}

function createDefaultState(): CertificationState {
  return {
    lastUpdated: new Date().toISOString(),
    submissionDeadline: '2026-02-27',
    agencyName: 'Serenity Home Health Care',
    contactEmail: 'coa_compliance@help4seniors.org',
    sections: [
      // ── SECTION 1: General Required Documentation ──
      {
        id: 'general',
        title: 'General Required Documentation',
        icon: DocumentTextIcon,
        description: 'Core agency documentation required for pre-certification',
        collapsed: false,
        items: [
          item('gen-1',  'Complete list of employees, positions, and dates of hire',  'Full roster of all current employees with roles and start dates', 'generate', '/dashboard/hr', 'HR Dashboard', 'employee-roster'),
          item('gen-2',  'Complete Employee Handbook',                                'Current employee handbook covering all policies', 'upload'),
          item('gen-3',  'BCI-FBI Roster',                                           'Complete roster of background check results', 'generate', '/dashboard/background-checks', 'Background Checks', 'bci-roster'),
          item('gen-4',  'Record Retention Policy',                                  'Policy for document retention and destruction timelines', 'upload'),
          item('gen-5',  'Updated Provider Information Form',                        'Completed Excel form from Council on Aging', 'upload'),
          item('gen-6',  'Certificate of Insurance (COI)',                           'Current insurance certificate', 'external'),
          item('gen-7',  'Written Instructions to Consumers to File a Claim',        'Consumer-facing claim filing instructions', 'upload'),
          item('gen-8',  'Incident Reporting Policy, Procedure and Form',            'Complete incident reporting framework — use Form 01 (Incident Report) and Form 02 (Incident Log)', 'system', '/dashboard/operating-forms/incident-report', 'Open Incident Form'),
          item('gen-9',  'EVV Enrollment Documentation',                             'Electronic Visit Verification enrollment proof per Ohio Medicaid', 'system', '/dashboard/sandata-evv', 'EVV Dashboard'),
          item('gen-10', 'Abuse, Neglect or Exploitation Policy',                    'ANE prevention, detection, and reporting policy', 'upload'),
          item('gen-11', 'Significant Change Policy',                                'Policy for handling significant changes in client condition', 'upload'),
          item('gen-12', '30 Day Notice Policy and Procedure',                       'Policy for 30-day service termination notice', 'upload'),
          item('gen-13', 'Confidentiality Policies and Procedures',                  'HIPAA and general confidentiality framework', 'system', '/dashboard/compliance', 'Compliance Center'),
          item('gen-14', 'Family Relations Policy',                                  'Policy governing family communication and relations', 'upload'),
          item('gen-15', 'Volunteer Policy and Procedure',                           'Framework for volunteer management if applicable', 'upload'),
          item('gen-16', 'Provision of Service Policy',                              'How services are delivered and managed', 'upload'),
          item('gen-17', 'Code of Ethics or Code of Conduct',                        'Use Form 08 (Code of Ethics Acknowledgment)', 'system', '/dashboard/operating-forms/code-of-ethics', 'Open Code of Ethics Form'),
          item('gen-18', 'Ownership Statement / Disclosure of Ownership',            'Use Form 12 (Disclosure of Ownership)', 'system', '/dashboard/operating-forms/disclosure-of-ownership', 'Open Disclosure Form'),
          item('gen-19', 'Table of Organization',                                    'Organizational chart showing reporting structure', 'generate', '/dashboard/hr', 'HR Dashboard', 'org-chart'),
          item('gen-20', 'Secretary of State Active Status',                         'Proof of active status with Ohio Secretary of State', 'external'),
          item('gen-21', 'Mission Statement',                                        'Agency mission statement', 'upload'),
          item('gen-22', 'Equal Employment Opportunity Statement',                   'EEO policy statement', 'upload'),
          item('gen-23', 'Nondiscrimination Statement',                              'Nondiscrimination policy', 'system', '/nondiscrimination', 'View Statement'),
          item('gen-24', "Bureau of Worker's Compensation Certificate",              'Current BWC certificate', 'external'),
          item('gen-25', 'NPI Number',                                               'National Provider Identifier documentation', 'external'),
          item('gen-26', 'HHA License',                                              'Home Health Agency License from Ohio Department of Health', 'external'),
        ],
      },

      // ── SECTIONS 2-7: Employee Files ──
      {
        id: 'emp-hha-1',
        title: 'Employee File: HHA #1',
        icon: UserGroupIcon,
        description: 'Complete personnel file for Home Health Aide #1',
        collapsed: true,
        items: createEmployeeFileItems('hha1'),
      },
      {
        id: 'emp-hha-2',
        title: 'Employee File: HHA #2',
        icon: UserGroupIcon,
        description: 'Complete personnel file for Home Health Aide #2',
        collapsed: true,
        items: createEmployeeFileItems('hha2'),
      },
      {
        id: 'emp-hha-3',
        title: 'Employee File: HHA #3',
        icon: UserGroupIcon,
        description: 'Complete personnel file for Home Health Aide #3',
        collapsed: true,
        items: createEmployeeFileItems('hha3'),
      },
      {
        id: 'emp-lpn',
        title: 'Employee File: LPN',
        icon: UserGroupIcon,
        description: 'Complete personnel file for Licensed Practical Nurse',
        collapsed: true,
        items: createEmployeeFileItems('lpn'),
      },
      {
        id: 'emp-rn',
        title: 'Employee File: RN',
        icon: UserGroupIcon,
        description: 'Complete personnel file for Registered Nurse',
        collapsed: true,
        items: createEmployeeFileItems('rn'),
      },
      {
        id: 'emp-sfc',
        title: 'Employee File: SFC Staff Member (RN or LSW)',
        icon: UserGroupIcon,
        description: 'Complete personnel file for Structured Family Caregiving staff member',
        collapsed: true,
        items: createEmployeeFileItems('sfc'),
      },

      // ── SECTION 8: Policies & Procedures Manual ──
      {
        id: 'policies',
        title: 'Policies & Procedures Manual',
        icon: DocumentCheckIcon,
        description: 'Complete service-specific policies and procedures',
        collapsed: false,
        items: [
          item('pol-1', 'Complete Policies and Procedures Manual', 'Master P&P manual covering all services', 'upload'),
          item('pol-2', 'Service-Specific Policies and Procedures', 'P&P for each service type (Homemaker, Personal Care, SFC)', 'upload'),
        ],
      },

      // ── SECTION 9: Structured Family Caregiving (SFC) ──
      {
        id: 'sfc',
        title: 'Structured Family Caregiving (SFC)',
        icon: HomeIcon,
        description: 'SFC service-specific documentation per OAC 173-39',
        collapsed: true,
        items: [
          item('sfc-1',  'Caregiver Qualifications Documentation',                          'Proof of qualifications for SFC caregivers', 'system', '/dashboard/credentials', 'Credentials'),
          item('sfc-2',  'Caregiver - Individual Residence Verification',                   'Verification caregiver resides with individual', 'upload'),
          item('sfc-3',  'Initial Assessment of Needs',                                     'Use Form 04 (Initial Assessment Form)', 'system', '/dashboard/operating-forms/initial-assessment', 'Open Assessment Form'),
          item('sfc-4',  "Individual's Choice Documentation",                               'Use Form 14 (SFC Individual Choice Form)', 'system', '/dashboard/operating-forms/sfc-individual-choice', 'Open Choice Form'),
          item('sfc-5',  'Caregiver Training Completion',                                   'Documentation of completed caregiver training', 'system', '/dashboard/training', 'Training Mgmt'),
          item('sfc-6',  'Verification of Coaching and Support by Professional Staff',      'RN, LPN, LSW, or LISW coaching documentation', 'system', '/dashboard/supervisory-visits', 'Supervisory Visits'),
          item('sfc-7',  'Client Initial Assessment (In Person)',                           'Use Form 04 (Initial Assessment Form)', 'system', '/dashboard/operating-forms/initial-assessment', 'Open Assessment Form'),
          item('sfc-8',  'Monthly Contact (In Person Every 60 Days)',                       'Schedule and documentation of monthly contacts', 'upload'),
          item('sfc-9',  'Record Retention Policy (SFC-specific)',                          'Record retention policy specific to SFC', 'upload'),
          item('sfc-10', 'Service Authorization / CM Authorization',                        'Care manager authorization documentation', 'system', '/dashboard/authorizations', 'Authorizations'),
        ],
      },

      // ── SECTION 10: Homemaker Services ──
      {
        id: 'homemaker',
        title: 'Homemaker Services',
        icon: BuildingOffice2Icon,
        description: 'Homemaker service-specific documentation per OAC 173-39',
        collapsed: true,
        items: [
          item('hm-1',  'Provision of Service Policy',                                             'How homemaker services are delivered', 'upload'),
          item('hm-2',  'Service Verification - Task/Time Sheet (Blank)',                          'Use Form 05 (Task/Time Sheet)', 'system', '/dashboard/operating-forms/task-time-sheet', 'Open Task/Time Sheet'),
          item('hm-3',  'Availability - Staffing Levels',                                          'Documentation of staffing capacity', 'generate', '/dashboard/dispatch', 'Dispatch', 'staffing-levels'),
          item('hm-4',  'Back Up Plan',                                                            'Contingency plan for service coverage', 'upload'),
          item('hm-5',  'Job Description Policy',                                                  'Homemaker job description', 'upload'),
          item('hm-6',  'Employee Qualification Policy',                                           'Qualification requirements for homemaker staff', 'upload'),
          item('hm-7',  'Performance Appraisal Policy',                                            'Performance evaluation process', 'upload'),
          item('hm-8',  'Orientation Checklist',                                                   'Use Form 07 (Orientation Checklist)', 'system', '/dashboard/operating-forms/orientation-checklist', 'Open Orientation Form'),
          item('hm-9',  'Expectations of Homemaker Staff',                                         'Written expectations for homemaker employees', 'upload'),
          item('hm-10', 'Code of Ethics',                                                          'Use Form 08 (Code of Ethics Acknowledgment)', 'system', '/dashboard/operating-forms/code-of-ethics', 'Open Code of Ethics Form'),
          item('hm-11', 'Employee Handbook and Employee Handbook Acknowledgement',                  'Use Form 09 (Handbook Acknowledgment)', 'system', '/dashboard/operating-forms/handbook-acknowledgment', 'Open Handbook Form'),
          item('hm-12', 'Lines of Communication',                                                  'Communication chain/hierarchy documentation', 'upload'),
          item('hm-13', 'Incident Reporting Policy and Procedure; Incident Form; Incident Log',    'Use Form 01 (Incident Report) and Form 02 (Incident Log)', 'system', '/dashboard/operating-forms/incident-report', 'Open Incident Form'),
          item('hm-14', 'Emergency Procedures',                                                    'Emergency response procedures', 'upload'),
          item('hm-15', 'Person Centered Planning Process',                                        'Person-centered care planning approach', 'upload'),
          item('hm-16', 'Inservice / Continuing Education Policy',                                 'Ongoing training requirements', 'system', '/dashboard/training', 'Training'),
          item('hm-17', 'Supervisory Visit Policy and Procedure; Blank Supervisory Visit Form',    'Use Form 03 (Supervisory Visit Form)', 'system', '/dashboard/operating-forms/supervisory-visit', 'Open Supervisory Visit Form'),
          item('hm-18', 'Initial Assessment Blank Form',                                           'Use Form 04 (Initial Assessment Form)', 'system', '/dashboard/operating-forms/initial-assessment', 'Open Assessment Form'),
        ],
      },

      // ── SECTION 11: Personal Care Services ──
      {
        id: 'personal-care',
        title: 'Personal Care Services',
        icon: HeartIcon,
        description: 'Personal care service-specific documentation per OAC 173-39',
        collapsed: true,
        items: [
          item('pc-1',  'Service Provisions Policy',                                               'How personal care services are delivered', 'upload'),
          item('pc-2',  'Service Verification - Task/Time Sheet (Blank)',                          'Use Form 05 (Task/Time Sheet)', 'system', '/dashboard/operating-forms/task-time-sheet', 'Open Task/Time Sheet'),
          item('pc-3',  'Availability - Staffing Levels',                                          'Documentation of staffing capacity', 'generate', '/dashboard/dispatch', 'Dispatch', 'staffing-levels'),
          item('pc-4',  'Job Description Policy',                                                  'PCA job description', 'upload'),
          item('pc-5',  'Employee Qualification Policy',                                           'PCA qualification requirements', 'upload'),
          item('pc-6',  'PCA Requirement Compliance Verification - Written Competency Testing',    'Use Form 18 (PCA Written Competency)', 'system', '/dashboard/operating-forms/pca-written-competency', 'Open Competency Form'),
          item('pc-7',  'PCA Requirement Compliance Verification - Return Skill Demonstration',    'Use Form 19 (PCA Skills Demo)', 'system', '/dashboard/operating-forms/pca-skills-demonstration', 'Open Skills Form'),
          item('pc-8',  'Performance Appraisal Policy',                                            'Performance evaluation process', 'upload'),
          item('pc-9',  'Orientation Checklist',                                                   'Use Form 07 (Orientation Checklist)', 'system', '/dashboard/operating-forms/orientation-checklist', 'Open Orientation Form'),
          item('pc-10', 'Expectations of Employee',                                                'Written expectations for PCA employees', 'upload'),
          item('pc-11', 'PCA Supervisor Availability / RN Accessibility',                          'Documentation of supervisor/RN availability', 'upload'),
          item('pc-12', 'Code of Ethics',                                                          'Use Form 08 (Code of Ethics Acknowledgment)', 'system', '/dashboard/operating-forms/code-of-ethics', 'Open Code of Ethics Form'),
          item('pc-13', 'Employee Handbook and Employee Handbook Acknowledgement',                  'Use Form 09 (Handbook Acknowledgment)', 'system', '/dashboard/operating-forms/handbook-acknowledgment', 'Open Handbook Form'),
          item('pc-14', 'Lines of Communication',                                                  'Communication chain/hierarchy documentation', 'upload'),
          item('pc-15', 'Incident Reporting Policy and Procedure; Incident Form; Incident Log',    'Use Form 01 (Incident Report) and Form 02 (Incident Log)', 'system', '/dashboard/operating-forms/incident-report', 'Open Incident Form'),
          item('pc-16', 'Emergency Procedures',                                                    'Emergency response procedures', 'upload'),
          item('pc-17', 'Person Centered Planning Process',                                        'Person-centered care planning approach', 'upload'),
          item('pc-18', 'Inservice / Continuing Education Policy',                                 'Ongoing training requirements', 'system', '/dashboard/training', 'Training'),
          item('pc-19', 'Supervisory Visit Policy and Procedure; Blank Supervisory Visit Form',    'Use Form 03 (Supervisory Visit Form)', 'system', '/dashboard/operating-forms/supervisory-visit', 'Open Supervisory Visit Form'),
          item('pc-20', 'Release of Information Form (Blank)',                                     'Use Form 06 (Release of Information)', 'system', '/dashboard/operating-forms/release-of-information', 'Open ROI Form'),
          item('pc-21', 'Initial Assessment Blank Form',                                           'Use Form 04 (Initial Assessment Form)', 'system', '/dashboard/operating-forms/initial-assessment', 'Open Assessment Form'),
          item('pc-22', 'Mechanism to Verify',                                                     'Service verification mechanism', 'system', '/dashboard/sandata-evv', 'EVV Dashboard'),
          item('pc-23', 'Random Checks Log',                                                       'Use Form 10 (Random Checks Log)', 'system', '/dashboard/operating-forms/random-checks-log', 'Open Random Checks Log'),
          item('pc-24', 'Back Up Plan',                                                            'Contingency plan for service coverage', 'upload'),
          item('pc-25', '2025 Monitoring Annual Report',                                           'Previous year monitoring and quality report', 'upload'),
        ],
      },

      // ── SECTION 12: Criminal Records & Background Checks ──
      {
        id: 'criminal-records',
        title: 'Criminal Records & Background Checks',
        icon: ShieldCheckIcon,
        description: 'Per OAC Chapter 173-9 and Provider BCI Instructions',
        collapsed: true,
        items: [
          item('cr-1', 'Criminal Records Policy per Chapter 173-9 OAC',      'Policy compliant with Ohio Administrative Code Chapter 173-9', 'upload'),
          item('cr-2', 'BCI/FBI Background Check Process Documentation',     'Documented process for conducting background checks', 'system', '/dashboard/background-checks', 'Background Checks'),
          item('cr-3', '7 Database Checks Process',                          'Process for all 7 required database checks', 'system', '/dashboard/background-checks', 'Background Checks'),
          item('cr-4', 'Provider BCI Instructions Compliance',               'Following ODA Provider BCI Instructions', 'upload'),
        ],
      },

      // ── SECTION 13: Conditions of Participation ──
      {
        id: 'conditions',
        title: 'Conditions of Participation',
        icon: DocumentCheckIcon,
        description: 'Per OAC Rule 173-39-02 - Conditions of Participation',
        collapsed: true,
        items: [
          item('cop-1', 'Review of Rule 173-39-02 Conditions of Participation',         'Documented review and compliance with participation conditions', 'upload'),
          item('cop-2', 'Homemaker Services Specification Compliance',                   'Meeting service specifications for homemaker services', 'upload'),
          item('cop-3', 'Personal Care Service Specification Compliance',                'Meeting service specifications for personal care', 'upload'),
          item('cop-4', 'Structured Family Caregiving Service Specification Compliance', 'Meeting service specifications for SFC', 'upload'),
          item('cop-5', 'Office Visit Readiness (Locked Storage for Confidential Files)', 'Physical office setup with locked filing for COA site visit', 'upload'),
          item('cop-6', 'Provider Information Form (COA Excel Form)',                    'Completed Council on Aging provider form', 'upload'),
        ],
      },
    ],
  };
}

function createEmployeeFileItems(prefix: string): ChecklistItem[] {
  return [
    item(`${prefix}-1`,  'Application / Resume',                                        'Employment application or resume on file', 'system', '/dashboard/hr', 'HR Dashboard'),
    item(`${prefix}-2`,  'Date of Hire Documentation',                                  'Official date of hire record', 'system', '/dashboard/hr', 'HR Dashboard'),
    item(`${prefix}-3`,  'Reference Check / Employment Verification',                   'Completed reference and employment verification', 'system', '/dashboard/hr', 'HR Dashboard'),
    item(`${prefix}-4`,  '7 Database Checks',                                           'All 7 required database background checks completed', 'system', '/dashboard/background-checks', 'Background Checks'),
    item(`${prefix}-5`,  'BCI Receipt',                                                 'BCI background check receipt', 'system', '/dashboard/background-checks', 'Background Checks'),
    item(`${prefix}-6`,  'BCI Result Letter',                                           'BCI background check results letter', 'system', '/dashboard/background-checks', 'Background Checks'),
    item(`${prefix}-7`,  'Certificates / Licensure',                                    'Professional certificates and licensure documents', 'system', '/dashboard/credentials', 'Credentials'),
    item(`${prefix}-8`,  'Required Testing or Return Demonstration for Qualifications', 'Per rule - service requirements vary', 'upload'),
    item(`${prefix}-9`,  'Orientation Checklist',                                       'Use Form 07 (Orientation Checklist)', 'system', '/dashboard/operating-forms/orientation-checklist', 'Open Orientation Form'),
    item(`${prefix}-10`, 'Code of Ethics (Signed)',                                     'Use Form 08 (Code of Ethics Acknowledgment)', 'system', '/dashboard/operating-forms/code-of-ethics', 'Open Code of Ethics Form'),
    item(`${prefix}-11`, 'Employee Handbook Acknowledgement',                           'Use Form 09 (Employee Handbook Acknowledgment)', 'system', '/dashboard/operating-forms/handbook-acknowledgment', 'Open Handbook Form'),
    item(`${prefix}-12`, 'Additional Training Documentation',                           'Records of any additional training completed', 'system', '/dashboard/training', 'Training'),
    item(`${prefix}-13`, 'Job Description (Signed)',                                    'Signed job description on file', 'upload'),
  ];
}

// ─── Status Helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ChecklistItemStatus, { label: string; color: string; bgColor: string }> = {
  not_started:    { label: 'Not Started',  color: 'text-gray-500',   bgColor: 'bg-gray-100' },
  in_progress:    { label: 'In Progress',  color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  completed:      { label: 'Completed',    color: 'text-green-700',  bgColor: 'bg-green-100' },
  not_applicable: { label: 'N/A',          color: 'text-gray-400',   bgColor: 'bg-gray-50' },
};

// ─── Report Generation (simulated — replace with real API calls when backend ready) ──

function generateReport(reportType: string): string {
  const now = new Date().toLocaleString();
  switch (reportType) {
    case 'employee-roster':
      return `EMPLOYEE ROSTER — Generated ${now}\n\nThis report should be exported from HR Dashboard > Export Employee List.\nGo to /dashboard/hr and click "Export" to download the full roster with positions and hire dates.`;
    case 'bci-roster':
      return `BCI-FBI BACKGROUND CHECK ROSTER — Generated ${now}\n\nThis report should be exported from Background Checks Dashboard.\nGo to /dashboard/background-checks and export the compliance roster showing all employees, check types, dates, and results.`;
    case 'org-chart':
      return `TABLE OF ORGANIZATION — Generated ${now}\n\nThis report should be exported from HR Dashboard > Organizational Chart.\nGo to /dashboard/hr and use the Org Chart view to export your organizational structure.`;
    case 'training-matrix':
      return `TRAINING COMPLIANCE MATRIX — Generated ${now}\n\nThis report should be exported from Training Management Dashboard.\nGo to /dashboard/training and export the training matrix showing all employees and their training completion status.`;
    case 'credential-report':
      return `CREDENTIAL & LICENSURE REPORT — Generated ${now}\n\nThis report should be exported from Credentials Dashboard.\nGo to /dashboard/credentials and export the credential compliance report.`;
    case 'staffing-levels':
      return `STAFFING LEVELS & AVAILABILITY REPORT — Generated ${now}\n\nThis report should be exported from the Dispatch/Coverage Dashboard.\nGo to /dashboard/dispatch and export your current staffing levels and availability data.`;
    case 'incident-log':
      return `INCIDENT REPORTING LOG — Generated ${now}\n\nThis report should be exported from the Operations Command Center > Incidents tab.\nGo to /dashboard/operations and export the incident log.`;
    default:
      return `Report "${reportType}" — Generated ${now}`;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PASSPORTCertification() {
  const [state, setState] = useState<CertificationState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: if old format without sourceType, reset to new defaults
        const hasSourceType = parsed.sections?.[0]?.items?.[0]?.sourceType;
        if (!hasSourceType) {
          return createDefaultState();
        }
        return parsed;
      } catch {
        return createDefaultState();
      }
    }
    return createDefaultState();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ChecklistItemStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState<DocumentSourceType | 'all'>('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<{ title: string; content: string } | null>(null);

  // Save to localStorage on state change
  useEffect(() => {
    const toSave = { ...state, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state]);

  // ─── Computed Stats ──────────────────────────────────────────────────────

  const stats = React.useMemo(() => {
    let total = 0, completed = 0, inProgress = 0, notStarted = 0, notApplicable = 0;
    let systemItems = 0, generateItems = 0, uploadItems = 0, externalItems = 0;
    let systemCompleted = 0, generateCompleted = 0, uploadCompleted = 0, externalCompleted = 0;
    let totalFiles = 0;

    state.sections.forEach(section => {
      section.items.forEach(i => {
        total++;
        totalFiles += i.uploadedFiles.length;
        switch (i.status) {
          case 'completed': completed++; break;
          case 'in_progress': inProgress++; break;
          case 'not_applicable': notApplicable++; break;
          default: notStarted++;
        }
        switch (i.sourceType) {
          case 'system': systemItems++; if (i.status === 'completed') systemCompleted++; break;
          case 'generate': generateItems++; if (i.status === 'completed') generateCompleted++; break;
          case 'upload': uploadItems++; if (i.status === 'completed') uploadCompleted++; break;
          case 'external': externalItems++; if (i.status === 'completed') externalCompleted++; break;
        }
      });
    });

    const applicable = total - notApplicable;
    const percentage = applicable > 0 ? Math.round((completed / applicable) * 100) : 0;

    return {
      total, completed, inProgress, notStarted, notApplicable, applicable, percentage, totalFiles,
      systemItems, generateItems, uploadItems, externalItems,
      systemCompleted, generateCompleted, uploadCompleted, externalCompleted,
    };
  }, [state]);

  const daysUntilDeadline = React.useMemo(() => {
    const deadline = new Date(state.submissionDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [state.submissionDeadline]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const updateItem = useCallback((sectionId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, items: section.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
          : section
      ),
    }));
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s),
    }));
  }, []);

  const expandAll = useCallback(() => {
    setState(prev => ({ ...prev, sections: prev.sections.map(s => ({ ...s, collapsed: false })) }));
  }, []);

  const collapseAll = useCallback(() => {
    setState(prev => ({ ...prev, sections: prev.sections.map(s => ({ ...s, collapsed: true })) }));
  }, []);

  const markAllInSection = useCallback((sectionId: string, status: ChecklistItemStatus) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, items: s.items.map(i => ({ ...i, status })) } : s
      ),
    }));
  }, []);

  const handleFileUpload = useCallback((sectionId: string, itemId: string, files: FileList) => {
    Array.from(files).forEach(file => {
      // For small files (< 2MB), store as base64 for localStorage persistence
      if (file.size < 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          const uploaded: UploadedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            dataUrl: reader.result as string,
          };
          setState(prev => ({
            ...prev,
            sections: prev.sections.map(section =>
              section.id === sectionId
                ? { ...section, items: section.items.map(i => i.id === itemId ? { ...i, uploadedFiles: [...i.uploadedFiles, uploaded] } : i) }
                : section
            ),
          }));
        };
        reader.readAsDataURL(file);
      } else {
        // For large files, just store metadata (real implementation would upload to backend)
        const uploaded: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };
        setState(prev => ({
          ...prev,
          sections: prev.sections.map(section =>
            section.id === sectionId
              ? { ...section, items: section.items.map(i => i.id === itemId ? { ...i, uploadedFiles: [...i.uploadedFiles, uploaded] } : i) }
              : section
          ),
        }));
      }
    });
  }, []);

  const removeUploadedFile = useCallback((sectionId: string, itemId: string, fileIndex: number) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, items: section.items.map(i => i.id === itemId ? { ...i, uploadedFiles: i.uploadedFiles.filter((_, idx) => idx !== fileIndex) } : i) }
          : section
      ),
    }));
  }, []);

  const handleGenerateReport = useCallback((reportType: string, title: string) => {
    const content = generateReport(reportType);
    setGeneratedReport({ title, content });
  }, []);

  const handlePrint = useCallback(() => window.print(), []);

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset ALL checklist progress? This cannot be undone.')) {
      const fresh = createDefaultState();
      setState(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  }, []);

  // ─── Section Stats ────────────────────────────────────────────────────

  const getSectionStats = (section: ChecklistSection) => {
    const total = section.items.length;
    const completed = section.items.filter(i => i.status === 'completed').length;
    const na = section.items.filter(i => i.status === 'not_applicable').length;
    const applicable = total - na;
    const pct = applicable > 0 ? Math.round((completed / applicable) * 100) : 0;
    const files = section.items.reduce((acc, i) => acc + i.uploadedFiles.length, 0);
    return { total, completed, applicable, pct, files };
  };

  // ─── Filtered Sections ────────────────────────────────────────────────

  const filteredSections = React.useMemo(() => {
    return state.sections.map(section => ({
      ...section,
      items: section.items.filter(i => {
        const matchesSearch = searchQuery === '' ||
          i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
        const matchesSource = filterSource === 'all' || i.sourceType === filterSource;
        return matchesSearch && matchesStatus && matchesSource;
      }),
    })).filter(s => s.items.length > 0);
  }, [state.sections, searchQuery, filterStatus, filterSource]);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print-only header */}
      <div className="hidden print:block print:mb-8">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-2xl font-bold">PASSPORT Pre-Certification Compliance Package</h1>
          <p className="text-sm text-gray-600 mt-1">{state.agencyName}</p>
          <p className="text-sm text-gray-600">Submission Deadline: {new Date(state.submissionDeadline).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          <p className="text-sm font-semibold mt-2">
            Overall Progress: {stats.completed} / {stats.applicable} items completed ({stats.percentage}%) | {stats.totalFiles} files attached
          </p>
        </div>
      </div>

      {/* ── Generated Report Modal ──────────────────────────────── */}
      {generatedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{generatedReport.title}</h3>
              <button onClick={() => setGeneratedReport(null)} className="p-1 hover:bg-gray-100 rounded">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Export Instructions</p>
                    <p className="mt-1">Navigate to the linked dashboard to export this data. The ERP has the live data — follow the instructions below to download the report.</p>
                  </div>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border">{generatedReport.content}</pre>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  const blob = new Blob([generatedReport.content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${generatedReport.title.replace(/\s+/g, '_')}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                Download Instructions
              </button>
              <button onClick={() => setGeneratedReport(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="print:hidden">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">PASSPORT Pre-Certification</h1>
                  <p className="text-sm text-gray-600">Council on Aging of Southwestern Ohio — Compliance Package</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <PrinterIcon className="h-4 w-4" />
                  Print / Save PDF
                </button>
                <button onClick={handleReset} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>

            {/* Deadline Alert */}
            <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-lg border ${
              daysUntilDeadline <= 3 ? 'bg-red-50 border-red-200' : daysUntilDeadline <= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <ClockIcon className={`h-5 w-5 flex-shrink-0 ${daysUntilDeadline <= 3 ? 'text-red-600' : daysUntilDeadline <= 7 ? 'text-yellow-600' : 'text-blue-600'}`} />
              <div className="flex-1">
                <span className={`text-sm font-semibold ${daysUntilDeadline <= 3 ? 'text-red-900' : daysUntilDeadline <= 7 ? 'text-yellow-900' : 'text-blue-900'}`}>
                  {daysUntilDeadline > 0 ? `${daysUntilDeadline} days until deadline` : daysUntilDeadline === 0 ? 'DEADLINE IS TODAY' : `${Math.abs(daysUntilDeadline)} days PAST deadline`}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  Submit to: {state.contactEmail} by {new Date(state.submissionDeadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Document Readiness Dashboard ─────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Overall Progress */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Document Readiness</h2>
              <span className="text-sm font-bold text-gray-700">{stats.percentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${stats.percentage === 100 ? 'bg-green-500' : stats.percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            {/* Source-Type Breakdown Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <SourceStatCard
                icon={CheckCircleIcon}
                label="Completed"
                value={stats.completed}
                total={stats.applicable}
                color="text-green-600"
                bgColor="bg-green-50"
              />
              <SourceStatCard icon={BoltIcon} label="From ERP Data" value={stats.systemCompleted} total={stats.systemItems} color="text-green-700" bgColor="bg-green-50" />
              <SourceStatCard icon={SparklesIcon} label="Auto-Generate" value={stats.generateCompleted} total={stats.generateItems} color="text-blue-700" bgColor="bg-blue-50" />
              <SourceStatCard icon={CloudArrowUpIcon} label="Upload Required" value={stats.uploadCompleted} total={stats.uploadItems} color="text-orange-700" bgColor="bg-orange-50" />
              <SourceStatCard icon={ArrowTopRightOnSquareIcon} label="External Docs" value={stats.externalCompleted} total={stats.externalItems} color="text-purple-700" bgColor="bg-purple-50" />
              <SourceStatCard icon={PaperClipIcon} label="Files Attached" value={stats.totalFiles} total={stats.total} color="text-gray-700" bgColor="bg-gray-50" />
            </div>
          </div>
        </div>

        {/* ── Quick Report Generation ─────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Quick Generate — Export Reports from System Data
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'employee-roster', label: 'Employee Roster', link: '/dashboard/hr' },
                { type: 'bci-roster', label: 'BCI-FBI Roster', link: '/dashboard/background-checks' },
                { type: 'org-chart', label: 'Table of Organization', link: '/dashboard/hr' },
                { type: 'training-matrix', label: 'Training Matrix', link: '/dashboard/training' },
                { type: 'credential-report', label: 'Credential Report', link: '/dashboard/credentials' },
                { type: 'staffing-levels', label: 'Staffing Levels', link: '/dashboard/dispatch' },
                { type: 'incident-log', label: 'Incident Log', link: '/dashboard/operations' },
              ].map(r => (
                <div key={r.type} className="flex items-center gap-1">
                  <button
                    onClick={() => handleGenerateReport(r.type, r.label)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-3.5 w-3.5 inline mr-1" />
                    {r.label}
                  </button>
                  <Link
                    to={r.link}
                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    title={`Open ${r.label} dashboard`}
                  >
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Search & Filters ────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search checklist items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="not_applicable">N/A</option>
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Sources</option>
              <option value="system">ERP Data</option>
              <option value="generate">Auto-Generate</option>
              <option value="upload">Upload Required</option>
              <option value="external">External Docs</option>
            </select>
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">Expand All</button>
              <button onClick={collapseAll} className="px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">Collapse All</button>
            </div>
          </div>
        </div>

        {/* ── Checklist Sections ───────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
          {filteredSections.map(section => {
            const ss = getSectionStats(section);
            const Icon = section.icon;
            return (
              <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Section Header */}
                <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {section.collapsed ? <ChevronRightIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
                    <div className={`p-2 rounded-lg ${ss.pct === 100 ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Icon className={`h-5 w-5 ${ss.pct === 100 ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {ss.files > 0 && (
                      <span className="text-xs text-purple-600 flex items-center gap-1">
                        <PaperClipIcon className="h-3.5 w-3.5" /> {ss.files}
                      </span>
                    )}
                    <div className="text-right">
                      <span className={`text-sm font-bold ${ss.pct === 100 ? 'text-green-600' : 'text-gray-700'}`}>{ss.completed}/{ss.applicable}</span>
                      <span className="text-xs text-gray-500 ml-1">({ss.pct}%)</span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${ss.pct === 100 ? 'bg-green-500' : ss.pct > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${ss.pct}%` }} />
                    </div>
                  </div>
                </button>

                {/* Section Items */}
                {!section.collapsed && (
                  <div className="border-t border-gray-200">
                    {/* Bulk actions */}
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 mr-2">Mark all:</span>
                      <button onClick={() => markAllInSection(section.id, 'completed')} className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200">Completed</button>
                      <button onClick={() => markAllInSection(section.id, 'in_progress')} className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200">In Progress</button>
                      <button onClick={() => markAllInSection(section.id, 'not_started')} className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Not Started</button>
                    </div>

                    {section.items.map((itm, idx) => (
                      <ChecklistItemRow
                        key={itm.id}
                        item={itm}
                        sectionId={section.id}
                        isLast={idx === section.items.length - 1}
                        isEditing={editingItem === itm.id}
                        onToggleEdit={() => setEditingItem(editingItem === itm.id ? null : itm.id)}
                        onUpdate={(updates) => updateItem(section.id, itm.id, updates)}
                        onFileUpload={(files) => handleFileUpload(section.id, itm.id, files)}
                        onRemoveFile={(idx) => removeUploadedFile(section.id, itm.id, idx)}
                        onGenerate={itm.generateAction ? () => handleGenerateReport(itm.generateAction!, itm.label) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Reference Links ──────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-blue-900 mb-3">Reference Links & Resources</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <a href="https://codes.ohio.gov/ohio-administrative-code/chapter-173-9" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 underline">Criminal Records Rules — Chapter 173-9 OAC</a>
              <a href="https://aging.ohio.gov/agencies-providers/provider-bci-instructions" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 underline">Provider BCI Instructions — Dept of Aging</a>
              <a href="https://codes.ohio.gov/ohio-administrative-code/rule-173-39-02" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 underline">Conditions of Participation — Rule 173-39-02</a>
              <a href="https://medicaid.ohio.gov/resources-for-providers/special-programs-and-services/electronic-visit-verification" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 underline">EVV Enrollment — Ohio Medicaid</a>
              <a href="https://odh.ohio.gov/know-our-programs/home-health-agency-licensure" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 underline">HHA License — Ohio Dept of Health</a>
              <a href="https://forms.office.com/r/ENc3QpwdPc" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 underline font-medium">COA Pre-Certification Form (Required)</a>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200 text-xs text-blue-800">
              <p><strong>Submit all documentation to:</strong> coa_compliance@help4seniors.org</p>
              <p className="mt-1">Contact: Hannah McCarren, Contract Auditor | (513) 568-0027 | hmccarren@help4seniors.org</p>
              <p className="mt-1">Council on Aging of Southwestern Ohio | 4601 Malsbary Rd, Blue Ash, Ohio 45242</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Layout ──────────────────────────────────────────── */}
      <div className="hidden print:block">
        {state.sections.map(section => {
          const ss = getSectionStats(section);
          return (
            <div key={section.id} className="mb-6 break-inside-avoid-page">
              <div className="flex items-center justify-between border-b-2 border-gray-400 pb-1 mb-2">
                <h2 className="text-base font-bold">{section.title}</h2>
                <span className="text-sm">{ss.completed}/{ss.applicable} ({ss.pct}%)</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left w-8">Status</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
                    <th className="border border-gray-300 px-2 py-1 text-left w-16">Source</th>
                    <th className="border border-gray-300 px-2 py-1 text-left w-36">Notes / Files</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map(i => (
                    <tr key={i.id}>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {i.status === 'completed' ? '\u2713' : i.status === 'in_progress' ? '\u25CB' : i.status === 'not_applicable' ? 'N/A' : '\u2717'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <span className="font-medium">{i.label}</span>
                        {i.description && <span className="text-gray-500 ml-1">— {i.description}</span>}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-gray-600">{SOURCE_CONFIG[i.sourceType].label}</td>
                      <td className="border border-gray-300 px-2 py-1 text-gray-600">
                        {i.notes && <span>{i.notes}</span>}
                        {i.uploadedFiles.length > 0 && <span className="block">{i.uploadedFiles.map(f => f.name).join(', ')}</span>}
                        {!i.notes && i.uploadedFiles.length === 0 && '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <div className="mt-8 pt-4 border-t-2 border-gray-400 text-xs text-gray-500">
          <p>Generated by Serenity ERP — PASSPORT Pre-Certification Module</p>
          <p>Submit to: coa_compliance@help4seniors.org | Deadline: {new Date(state.submissionDeadline).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SourceStatCard({ icon: Icon, label, value, total, color, bgColor }: { icon: React.ComponentType<any>; label: string; value: number; total: number; color: string; bgColor: string }) {
  return (
    <div className={`${bgColor} rounded-lg p-3 border`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>
        {value}<span className="text-sm font-normal text-gray-400">/{total}</span>
      </div>
    </div>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  sectionId: string;
  isLast: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<ChecklistItem>) => void;
  onFileUpload: (files: FileList) => void;
  onRemoveFile: (index: number) => void;
  onGenerate?: () => void;
}

function ChecklistItemRow({ item, sectionId, isLast, isEditing, onToggleEdit, onUpdate, onFileUpload, onRemoveFile, onGenerate }: ChecklistItemRowProps) {
  const statusConfig = STATUS_CONFIG[item.status];
  const sourceConfig = SOURCE_CONFIG[item.sourceType];
  const SourceIcon = sourceConfig.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cycleStatus = () => {
    const order: ChecklistItemStatus[] = ['not_started', 'in_progress', 'completed', 'not_applicable'];
    const nextIdx = (order.indexOf(item.status) + 1) % order.length;
    onUpdate({ status: order[nextIdx] });
  };

  return (
    <div className={`${!isLast ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors group">
        {/* Status checkbox */}
        <button onClick={cycleStatus} className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" title={`Status: ${statusConfig.label} (click to cycle)`}>
          {item.status === 'completed' ? (
            <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
          ) : item.status === 'in_progress' ? (
            <div className="h-6 w-6 rounded-full border-2 border-yellow-400 bg-yellow-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
            </div>
          ) : item.status === 'not_applicable' ? (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-400">N/A</span>
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300 group-hover:border-blue-400 transition-colors" />
          )}
        </button>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-gray-400 line-through' : item.status === 'not_applicable' ? 'text-gray-400' : 'text-gray-900'}`}>
              {item.label}
              {item.required && item.status !== 'completed' && item.status !== 'not_applicable' && <span className="text-red-500 ml-1">*</span>}
            </p>
            {/* Source type badge */}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${sourceConfig.bgColor} ${sourceConfig.color}`} title={sourceConfig.tip}>
              <SourceIcon className="h-3 w-3" />
              {sourceConfig.label}
            </span>
          </div>
          {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
          {/* Inline info: notes, files, file reference */}
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {item.notes && <span className="text-xs text-blue-600 italic">Note: {item.notes}</span>}
              {item.uploadedFiles.length > 0 && (
                <span className="text-xs text-purple-600 flex items-center gap-1">
                  <PaperClipIcon className="h-3 w-3" /> {item.uploadedFiles.length} file{item.uploadedFiles.length > 1 ? 's' : ''} attached
                </span>
              )}
              {item.fileReference && <span className="text-xs text-gray-500">Ref: {item.fileReference}</span>}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* System link */}
          {item.systemLink && (
            <Link to={item.systemLink} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title={`Open ${item.systemLinkLabel || 'module'}`}>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          )}
          {/* Generate button */}
          {onGenerate && (
            <button onClick={onGenerate} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Generate report">
              <SparklesIcon className="h-4 w-4" />
            </button>
          )}
          {/* Upload button */}
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Upload file">
            <CloudArrowUpIcon className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && onFileUpload(e.target.files)} />
          {/* Edit toggle */}
          <button onClick={onToggleEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Edit notes & details">
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          {/* Status quick select */}
          <select
            value={item.status}
            onChange={e => onUpdate({ status: e.target.value as ChecklistItemStatus })}
            className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not_applicable">N/A</option>
          </select>
        </div>
      </div>

      {/* Expanded edit / upload area */}
      {isEditing && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={item.notes}
                onChange={e => onUpdate({ notes: e.target.value })}
                placeholder="Add notes (who is responsible, where the document is stored, etc.)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">File Reference / Location</label>
              <input
                type="text"
                value={item.fileReference}
                onChange={e => onUpdate({ fileReference: e.target.value })}
                placeholder="e.g., Google Drive > HR > Employee Files > BCI_Receipt.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File upload area */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Attached Files</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <CloudArrowUpIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Click to upload files or drag & drop</p>
              <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 2MB per file for local storage)</p>
            </div>
            {item.uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FolderOpenIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-700">{file.name}</span>
                      <span className="text-[10px] text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      <span className="text-[10px] text-gray-400">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => onRemoveFile(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove file">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Source-specific guidance */}
          <div className={`flex items-start gap-2 p-3 rounded-lg border ${sourceConfig.bgColor}`}>
            <SourceIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${sourceConfig.color}`} />
            <div className="text-xs">
              <span className={`font-medium ${sourceConfig.color}`}>{sourceConfig.label}:</span>
              <span className="text-gray-600 ml-1">
                {item.sourceType === 'system' && item.systemLink && (
                  <>This data exists in your ERP. <Link to={item.systemLink} className="text-blue-600 underline hover:text-blue-800">Go to {item.systemLinkLabel}</Link> to review and export.</>
                )}
                {item.sourceType === 'system' && !item.systemLink && 'This data exists in your ERP system.'}
                {item.sourceType === 'generate' && item.systemLink && (
                  <>This can be generated from system data. <Link to={item.systemLink} className="text-blue-600 underline hover:text-blue-800">Go to {item.systemLinkLabel}</Link> to export the report.</>
                )}
                {item.sourceType === 'generate' && !item.systemLink && 'This can be auto-generated from your system data.'}
                {item.sourceType === 'upload' && 'This document must be created manually and uploaded here.'}
                {item.sourceType === 'external' && 'This document must be obtained from the external agency or source listed.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
