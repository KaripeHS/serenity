import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Chart } from '../ui/Chart';
import { ProgressRing } from '../ui/ProgressRing';
import { ApplicantDetailsModal } from '../hr/ApplicantDetailsModal';
import { RejectionModal } from '../hr/RejectionModal';
import { ScheduleInterviewModal, InterviewScheduleData } from '../hr/ScheduleInterviewModal';
import { AcceptOfferModal, AcceptOfferData } from '../hr/AcceptOfferModal';
import { SuccessModal } from '../hr/SuccessModal';
import { StaffProfileModal } from '../hr/StaffProfileModal';
import { assignMemberToPod } from '../../utils/podAssignment';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface HRMetrics {
  totalStaff: number;
  openPositions: number;
  pendingApplications: number;
  trainingCompliance: number;
  avgTimeToHire: number;
  turnoverRate: number;
}

interface Application {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  status: 'new' | 'reviewing' | 'interview' | 'scheduled' | 'offered' | 'hired' | 'rejected';
  experience: string;
  location: string;
  applied: string;
  appliedDate: Date;
  source?: string;
  certifications?: string[];
  availability?: {
    fullTime?: boolean;
    partTime?: boolean;
    weekends?: boolean;
    nights?: boolean;
    flexible?: boolean;
  };
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  availableStartDate?: string;
  aiScreeningScore?: number;
}

interface FilterState {
  search: string;
  statuses: Application['status'][];
  positions: string[];
  sources: string[];
  experienceLevels: string[];
  dateRange: { from: string; to: string };
  sortBy: 'name' | 'date' | 'status' | 'position';
  sortOrder: 'asc' | 'desc';
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  hireDate: string;
  certifications: string[];
  trainingDue: string[];
}

interface StaffFilterState {
  search: string;
  departments: string[];
  roles: string[];
  statuses: string[];
  trainingStatus: 'all' | 'due' | 'current';
  sortBy: 'name' | 'department' | 'role' | 'hireDate';
  sortOrder: 'asc' | 'desc';
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  valueColor?: string;
  onClick?: () => void;
  clickLabel?: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, iconColor, valueColor = 'text-gray-900', onClick, clickLabel }: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
        {onClick && (
          <span className="text-xs text-primary-600 font-medium">
            {clickLabel || 'View Details'} →
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconColor} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <Card hoverable className="transition-all hover:scale-105 cursor-pointer" onClick={onClick}>
        {content}
      </Card>
    );
  }

  return (
    <Card hoverable className="transition-all hover:scale-105">
      {content}
    </Card>
  );
}

function ApplicationStatusBadge({ status }: { status: Application['status'] }) {
  const variants: Record<Application['status'], { variant: any; label: string }> = {
    new: { variant: 'info', label: 'New' },
    reviewing: { variant: 'warning', label: 'Reviewing' },
    interview: { variant: 'success', label: 'Interview' },
    scheduled: { variant: 'primary', label: 'Scheduled' },
    offered: { variant: 'warning', label: 'Offer Pending' },
    hired: { variant: 'success', label: 'Hired - Onboarding' },
    rejected: { variant: 'danger', label: 'Rejected' }
  };

  const config = variants[status];
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

export function WorkingHRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'applications' | 'staff' | 'training'>('dashboard');

  const [applications, setApplications] = useState<Application[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [hiringTrendData, setHiringTrendData] = useState<{ label: string; value: number }[]>([]);
  const [departmentStaffData, setDepartmentStaffData] = useState<{ label: string; value: number }[]>([]);

  // Modal states
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [applicantToReject, setApplicantToReject] = useState<Application | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [applicantToSchedule, setApplicantToSchedule] = useState<Application | null>(null);
  const [showAcceptOfferModal, setShowAcceptOfferModal] = useState(false);
  const [applicantToAccept, setApplicantToAccept] = useState<Application | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    details: string[];
    footer?: string;
  } | null>(null);

  // Staff modal states
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showStaffProfileModal, setShowStaffProfileModal] = useState(false);

  // Filter states for applications
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    statuses: [],
    positions: [],
    sources: [],
    experienceLevels: [],
    dateRange: { from: '', to: '' },
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Filter states for staff
  const [showStaffFilters, setShowStaffFilters] = useState(false);
  const [staffFilters, setStaffFilters] = useState<StaffFilterState>({
    search: '',
    departments: [],
    roles: [],
    statuses: [],
    trainingStatus: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('serenity_access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        // Load metrics, applications, and staff in parallel
        const [metricsRes, applicantsRes, staffRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/metrics`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff`, { headers }).catch(() => null)
        ]);

        // Process metrics
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics({
            totalStaff: data.totalStaff || 0,
            openPositions: data.openPositions || 0,
            pendingApplications: data.pendingApplications || 0,
            trainingCompliance: data.trainingCompliance || 0,
            avgTimeToHire: data.avgTimeToHire || 0,
            turnoverRate: data.turnoverRate || 0
          });
        } else {
          setMetrics({
            totalStaff: 0,
            openPositions: 0,
            pendingApplications: 0,
            trainingCompliance: 0,
            avgTimeToHire: 0,
            turnoverRate: 0
          });
        }

        // Process applicants - map to component's Application interface
        if (applicantsRes.ok) {
          const data = await applicantsRes.json();
          const applicants = (data.applicants || []).map((a: any) => ({
            id: a.id,
            name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Unknown',
            email: a.email,
            phone: a.phone,
            position: a.positionAppliedFor || 'Not specified',
            status: mapApplicantStatus(a.status || a.currentStage),
            experience: a.experienceLevel || 'Not specified',
            location: a.address ? extractCity(a.address) : 'Ohio',
            applied: formatTimeAgo(a.applicationDate || a.createdAt),
            appliedDate: new Date(a.applicationDate || a.createdAt),
            source: a.source || 'website',
            certifications: a.certifications || [],
            availability: a.availability || {},
            desiredSalaryMin: a.desiredSalaryMin,
            desiredSalaryMax: a.desiredSalaryMax,
            availableStartDate: a.availableStartDate,
            aiScreeningScore: a.aiScreeningScore
          }));
          setApplications(applicants);
        }

        // Process staff list
        if (staffRes && staffRes.ok) {
          const data = await staffRes.json();
          console.log('[HR Dashboard] Staff API response:', data);
          const staff = (data.staff || []).map((s: any) => ({
            id: s.id,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
            email: s.email || '',
            phone: s.phone || '',
            position: formatRole(s.role) || 'Staff',
            department: formatDepartment(s.department) || 'General',
            status: s.status || 'active',
            hireDate: s.hireDate || '',
            certifications: s.certifications || [],
            trainingDue: s.trainingDue || []
          }));
          console.log('[HR Dashboard] Processed staff list:', staff.length, 'members');
          setStaffList(staff);
        } else if (staffRes) {
          console.error('[HR Dashboard] Staff API error:', staffRes.status, await staffRes.text().catch(() => 'No body'));
        } else {
          console.error('[HR Dashboard] Staff API call returned null');
        }

      } catch (error) {
        console.error('Failed to load HR data:', error);
        setMetrics({
          totalStaff: 0,
          openPositions: 0,
          pendingApplications: 0,
          trainingCompliance: 0,
          avgTimeToHire: 0,
          turnoverRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper to map backend status to component status
  function mapApplicantStatus(status: string): Application['status'] {
    const statusMap: Record<string, Application['status']> = {
      'pending': 'new',
      'new': 'new',
      'screening': 'reviewing',
      'reviewing': 'reviewing',
      'review': 'reviewing',
      'interview': 'interview',
      'interviews': 'interview',
      'interviewing': 'interview',  // Moved to interview stage but not yet scheduled
      'interview_scheduled': 'scheduled',
      'scheduled': 'scheduled',
      'offer_pending': 'offered',
      'offer': 'offered',
      'offered': 'offered',
      'hired': 'hired',
      'onboarding': 'hired',
      'rejected': 'rejected',
      'declined': 'rejected',
      'withdrawn': 'rejected',
      'reference_check': 'reviewing',
      'background_check': 'reviewing'
    };
    return statusMap[status?.toLowerCase()] || 'new';
  }

  // Helper to format time ago
  function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Helper to extract city from address
  function extractCity(address: string): string {
    if (!address) return 'Ohio';
    // Try to extract city from address (assumes format like "123 Main St, City, OH 12345")
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim() + ', OH';
    }
    return 'Ohio';
  }

  // Helper to format role names
  function formatRole(role: string): string {
    if (!role) return 'Staff';
    const roleMap: Record<string, string> = {
      'founder': 'Founder',
      'ceo': 'CEO',
      'cfo': 'CFO',
      'coo': 'COO',
      'finance_director': 'Finance Director',
      'finance_manager': 'Finance Manager',
      'billing_manager': 'Billing Manager',
      'rcm_analyst': 'RCM Analyst',
      'insurance_manager': 'Insurance Manager',
      'billing_coder': 'Billing Coder',
      'operations_manager': 'Operations Manager',
      'field_ops_manager': 'Field Ops Manager',
      'pod_lead': 'Pod Lead',
      'field_supervisor': 'Field Supervisor',
      'scheduling_manager': 'Scheduling Manager',
      'scheduler': 'Scheduler',
      'dispatcher': 'Dispatcher',
      'qa_manager': 'QA Manager',
      'dsp_med': 'DSP (Med Certified)',
      'dsp_basic': 'DSP (Basic)',
      'caregiver': 'Caregiver',
      'director_of_nursing': 'Director of Nursing',
      'clinical_director': 'Clinical Director',
      'nursing_supervisor': 'Nursing Supervisor',
      'rn_case_manager': 'RN Case Manager',
      'lpn_lvn': 'LPN/LVN',
      'qidp': 'QIDP',
      'therapist': 'Therapist',
      'hha': 'Home Health Aide',
      'cna': 'CNA',
      'hr_director': 'HR Director',
      'hr_manager': 'HR Manager',
      'recruiter': 'Recruiter',
      'credentialing_specialist': 'Credentialing Specialist',
      'compliance_officer': 'Compliance Officer',
      'security_officer': 'Security Officer',
      'it_admin': 'IT Admin',
      'support_agent': 'Support Agent',
      'client': 'Client',
      'family': 'Family Member',
      'payer_auditor': 'Payer Auditor'
    };
    return roleMap[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Helper to format department names
  function formatDepartment(dept: string): string {
    if (!dept) return 'General';
    const deptMap: Record<string, string> = {
      'EXEC': 'Executive',
      'FIN': 'Finance',
      'OPS': 'Operations',
      'CLIN': 'Clinical',
      'HR': 'Human Resources',
      'COMP': 'Compliance',
      'IT': 'IT'
    };
    return deptMap[dept] || dept;
  }

  // Get unique values for filter dropdowns
  const uniquePositions = [...new Set(applications.map(a => a.position))].filter(Boolean).sort();
  const uniqueSources = [...new Set(applications.map(a => a.source))].filter((s): s is string => Boolean(s)).sort();
  const uniqueExperienceLevels = [...new Set(applications.map(a => a.experience))].filter(Boolean).sort();

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          app.name.toLowerCase().includes(searchLower) ||
          app.email?.toLowerCase().includes(searchLower) ||
          app.phone?.includes(filters.search) ||
          app.position.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) {
        return false;
      }

      // Position filter
      if (filters.positions.length > 0 && !filters.positions.includes(app.position)) {
        return false;
      }

      // Source filter
      if (filters.sources.length > 0 && !filters.sources.includes(app.source || '')) {
        return false;
      }

      // Experience level filter
      if (filters.experienceLevels.length > 0 && !filters.experienceLevels.includes(app.experience)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.from) {
        const fromDate = new Date(filters.dateRange.from);
        if (app.appliedDate < fromDate) return false;
      }
      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (app.appliedDate > toDate) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          // For dates: a - b gives oldest first (ascending), so we use that as base
          comparison = a.appliedDate.getTime() - b.appliedDate.getTime();
          break;
        case 'status':
          const statusOrder: Record<Application['status'], number> = { new: 0, reviewing: 1, interview: 2, scheduled: 3, offered: 4, hired: 5, rejected: 6 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
      }
      // For 'desc' order, negate the comparison (so newest first for dates, Z-A for names)
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

  // Count active filters
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.statuses.length +
    filters.positions.length +
    filters.sources.length +
    filters.experienceLevels.length +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      statuses: [],
      positions: [],
      sources: [],
      experienceLevels: [],
      dateRange: { from: '', to: '' },
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  // Get unique values for staff filter dropdowns
  const uniqueDepartments = [...new Set(staffList.map(s => s.department))].filter(Boolean).sort();
  const uniqueRoles = [...new Set(staffList.map(s => s.position))].filter(Boolean).sort();
  const uniqueStaffStatuses = [...new Set(staffList.map(s => s.status))].filter(Boolean).sort();

  // Filter and sort staff
  const filteredStaff = staffList
    .filter(staff => {
      // Search filter
      if (staffFilters.search) {
        const searchLower = staffFilters.search.toLowerCase();
        const matchesSearch =
          staff.name.toLowerCase().includes(searchLower) ||
          staff.email?.toLowerCase().includes(searchLower) ||
          staff.phone?.includes(staffFilters.search) ||
          staff.position.toLowerCase().includes(searchLower) ||
          staff.department.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Department filter
      if (staffFilters.departments.length > 0 && !staffFilters.departments.includes(staff.department)) {
        return false;
      }

      // Role filter
      if (staffFilters.roles.length > 0 && !staffFilters.roles.includes(staff.position)) {
        return false;
      }

      // Status filter
      if (staffFilters.statuses.length > 0 && !staffFilters.statuses.includes(staff.status)) {
        return false;
      }

      // Training status filter
      if (staffFilters.trainingStatus === 'due' && staff.trainingDue.length === 0) {
        return false;
      }
      if (staffFilters.trainingStatus === 'current' && staff.trainingDue.length > 0) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (staffFilters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'department':
          comparison = a.department.localeCompare(b.department);
          break;
        case 'role':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'hireDate':
          comparison = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
          break;
      }
      return staffFilters.sortOrder === 'asc' ? comparison : -comparison;
    });

  // Count active staff filters
  const activeStaffFilterCount =
    (staffFilters.search ? 1 : 0) +
    staffFilters.departments.length +
    staffFilters.roles.length +
    staffFilters.statuses.length +
    (staffFilters.trainingStatus !== 'all' ? 1 : 0);

  // Reset all staff filters
  const resetStaffFilters = () => {
    setStaffFilters({
      search: '',
      departments: [],
      roles: [],
      statuses: [],
      trainingStatus: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  // Handle moving applicant to interview stage
  const handleMoveToInterview = async (app: Application) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${app.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'interviewing', currentStage: 'interviews' })
      });

      if (response.ok) {
        setApplications(prev => prev.map(a =>
          a.id === app.id ? { ...a, status: 'interview' as const } : a
        ));
        // Status updated successfully - no alert needed
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to update applicant status. Please try again.');
    }
  };

  // Handle opening rejection modal
  const handleReject = (app: Application) => {
    setApplicantToReject(app);
    setShowRejectionModal(true);
  };

  // Handle confirming rejection
  const handleConfirmRejection = async (reason: string, sendEmail: boolean) => {
    if (!applicantToReject) return;

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${applicantToReject.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, sendEmail })
      });

      if (response.ok) {
        setApplications(prev => prev.map(a =>
          a.id === applicantToReject.id ? { ...a, status: 'rejected' as const } : a
        ));
      } else {
        const error = await response.json();
        alert(`Failed to reject: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to reject applicant. Please try again.');
    }
    setApplicantToReject(null);
  };

  // Handle viewing applicant details
  const handleViewDetails = (app: Application) => {
    setSelectedApplicant(app);
    setShowDetailsModal(true);
  };

  // Handle opening schedule interview modal
  const handleScheduleInterview = (app: Application) => {
    setApplicantToSchedule(app);
    setShowScheduleModal(true);
  };

  // Handle confirming interview schedule
  const handleConfirmSchedule = async (data: InterviewScheduleData) => {
    if (!applicantToSchedule) return;

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${applicantToSchedule.id}/interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interviewType: data.interviewType,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
          location: data.location,
          interviewerName: data.interviewerName,
          notes: data.notes,
          sendCalendarInvite: data.sendCalendarInvite
        })
      });

      if (response.ok) {
        // Update local state to reflect scheduled status
        setApplications(prev => prev.map(a =>
          a.id === applicantToSchedule.id ? { ...a, status: 'scheduled' as const } : a
        ));
      } else {
        const error = await response.json();
        alert(`Failed to schedule interview: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to schedule interview. Please try again.');
    }
    setApplicantToSchedule(null);
  };

  // Handle canceling interview
  const handleCancelInterview = async (app: Application) => {
    if (!confirm(`Are you sure you want to cancel the interview for ${app.name}?`)) {
      return;
    }

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${app.id}/cancel-interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled by HR', sendEmail: true })
      });

      if (response.ok) {
        setApplications(prev => prev.map(a =>
          a.id === app.id ? { ...a, status: 'interview' as const } : a
        ));
        // Interview cancelled - candidate and HR have been notified
      } else {
        const error = await response.json();
        alert(`Failed to cancel interview: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to cancel interview. Please try again.');
    }
  };

  // Handle offering job to applicant
  const handleOfferJob = async (app: Application) => {
    if (!confirm(`Are you sure you want to extend a job offer to ${app.name} for the ${app.position} position?`)) {
      return;
    }

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${app.id}/offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sendEmail: true })
      });

      if (response.ok) {
        setApplications(prev => prev.map(a =>
          a.id === app.id ? { ...a, status: 'offered' as const } : a
        ));
        // Job offer extended - candidate and HR have been notified via email
      } else {
        const error = await response.json();
        alert(`Failed to extend offer: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to extend job offer. Please try again.');
    }
  };

  // Handle resending offer email to applicant
  const handleResendOffer = async (app: Application) => {
    if (!confirm(`Resend job offer email to ${app.name} (${app.email || 'no email'})?\n\nThis will send the offer details and next steps to the candidate.`)) {
      return;
    }

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${app.id}/offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sendEmail: true, resend: true })
      });

      if (response.ok) {
        alert(`Offer email resent to ${app.email || app.name}.\n\nThe candidate will receive:\n• Job offer details\n• Next steps to accept\n• Contact information`);
      } else {
        const error = await response.json();
        alert(`Failed to resend offer: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to resend offer email. Please try again.');
    }
  };

  // Handle accepting offer - opens modal
  const handleAcceptOffer = (app: Application) => {
    setApplicantToAccept(app);
    setShowAcceptOfferModal(true);
  };

  // Process the actual acceptance after modal confirmation
  const processAcceptOffer = async (data: AcceptOfferData) => {
    if (!applicantToAccept) return;

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/applicants/${applicantToAccept.id}/accept-offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: data.startDate,
          role: data.role,
          sendEmail: data.sendWelcomeEmail,
          notes: data.notes,
          podId: data.podId
        })
      });

      if (response.ok) {
        const result = await response.json();

        // If pod assignment was requested, assign the new staff member to the pod
        if (data.podId && result.staffId) {
          const currentUser = JSON.parse(localStorage.getItem('serenity_user') || '{}');
          const performedBy = currentUser.id || 'system';
          const performedByName = currentUser.firstName && currentUser.lastName
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : 'HR System';

          const podResult = assignMemberToPod({
            memberId: result.staffId,
            memberName: applicantToAccept.name,
            memberEmail: applicantToAccept.email || '',
            memberRole: data.role,
            memberType: 'staff',
            podId: data.podId,
            performedBy,
            performedByName,
            notes: 'Assigned during hiring process'
          });

          if (!podResult.success) {
            console.error('Failed to assign to pod:', podResult.error);
          }
        }
        setApplications(prev => prev.map(a =>
          a.id === applicantToAccept.id ? { ...a, status: 'hired' as Application['status'] } : a
        ));

        // Show success modal instead of alert
        const details = [
          'Employee record created',
          `${result.onboardingItemCount} onboarding items generated`
        ];
        if (data.sendWelcomeEmail) {
          details.push('Welcome email sent');
        }

        setSuccessModalData({
          title: 'Hire Successful!',
          message: `${applicantToAccept.name} has been hired!`,
          details,
          footer: `Start date: ${data.startDate || 'To be determined'}`
        });
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        alert(`Failed to accept offer: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to accept offer. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Human Resources Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Staff management, recruitment, and compliance tracking
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-8 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'dashboard', label: 'Dashboard', count: null },
              { key: 'applications', label: 'Applications', count: applications.filter(app => app.status === 'new').length },
              { key: 'staff', label: 'Staff', count: staffList.filter(staff => staff.trainingDue.length > 0).length },
              { key: 'training', label: 'Training', count: staffList.filter(staff => staff.trainingDue.length > 0).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeView === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <Badge variant="danger" size="sm">{tab.count}</Badge>
                  )}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {/* Key Metrics - All tiles are clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
              <MetricCard
                title="Total Staff"
                value={metrics.totalStaff}
                subtitle="Active employees"
                icon={UserGroupIcon}
                iconColor="bg-caregiver-600"
                onClick={() => setActiveView('staff')}
                clickLabel="View Staff"
              />
              <MetricCard
                title="Open Positions"
                value={metrics.openPositions}
                subtitle={metrics.openPositions > 0 ? "Need to be filled" : "All positions filled"}
                icon={BriefcaseIcon}
                iconColor="bg-danger-600"
                valueColor={metrics.openPositions > 0 ? "text-danger-600" : "text-success-600"}
                onClick={() => setActiveView('applications')}
                clickLabel="View Positions"
              />
              <MetricCard
                title="Pending Applications"
                value={metrics.pendingApplications}
                subtitle="Awaiting review"
                icon={DocumentTextIcon}
                iconColor="bg-primary-600"
                valueColor="text-primary-600"
                onClick={() => {
                  setFilters(prev => ({ ...prev, statuses: ['new'] }));
                  setActiveView('applications');
                }}
                clickLabel="Review Now"
              />
              <MetricCard
                title="Training Compliance"
                value={`${metrics.trainingCompliance}%`}
                subtitle={metrics.trainingCompliance >= 90 ? "Above target" : "Below target"}
                icon={AcademicCapIcon}
                iconColor="bg-success-600"
                valueColor={metrics.trainingCompliance >= 90 ? "text-success-600" : "text-warning-600"}
                onClick={() => setActiveView('training')}
                clickLabel="View Training"
              />
              <MetricCard
                title="Avg Time to Hire"
                value={`${metrics.avgTimeToHire} days`}
                subtitle={metrics.avgTimeToHire > 0 ? "Average hiring time" : "No hires yet"}
                icon={ClockIcon}
                iconColor="bg-info-600"
                onClick={() => {
                  setFilters(prev => ({ ...prev, statuses: ['hired'] }));
                  setActiveView('applications');
                }}
                clickLabel="View Hires"
              />
              <MetricCard
                title="Turnover Rate"
                value={`${metrics.turnoverRate}%`}
                subtitle={metrics.turnoverRate < 15 ? "Below industry average" : "Monitor closely"}
                icon={ArrowTrendingDownIcon}
                iconColor="bg-success-600"
                valueColor={metrics.turnoverRate < 15 ? "text-success-600" : "text-warning-600"}
                onClick={() => setActiveView('staff')}
                clickLabel="View Staff"
              />
            </div>

            {/* Alerts - Dynamic based on actual data */}
            <div className="space-y-4 mb-8 animate-fade-in">
              {staffList.filter(s => s.trainingDue.length > 0).length > 0 && (
                <Alert variant="danger" title="Training Renewals Due">
                  {staffList.filter(s => s.trainingDue.length > 0).length} staff member{staffList.filter(s => s.trainingDue.length > 0).length > 1 ? 's' : ''} need training renewal
                </Alert>
              )}
              {metrics.openPositions > 0 && (
                <Alert variant="warning" title="Open Positions">
                  {metrics.openPositions} position{metrics.openPositions > 1 ? 's' : ''} need to be filled
                </Alert>
              )}
              {metrics.pendingApplications > 0 && (
                <Alert variant="info" title="Pending Applications">
                  {metrics.pendingApplications} application{metrics.pendingApplications > 1 ? 's' : ''} awaiting review
                </Alert>
              )}
              {staffList.filter(s => s.trainingDue.length > 0).length === 0 && metrics.openPositions === 0 && metrics.pendingApplications === 0 && (
                <Alert variant="success" title="All Clear">
                  No urgent items requiring attention
                </Alert>
              )}
            </div>

            {/* HR Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
              {/* Training Compliance Ring */}
              <Card className="text-center">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
                  Training Compliance
                </h3>
                <ProgressRing
                  percentage={metrics.trainingCompliance}
                  size={150}
                  strokeWidth={10}
                  color="#10b981"
                  label="Target: 90%"
                />
                <p className="text-sm text-success-600 font-medium mt-3">
                  Above target ✓
                </p>
              </Card>

              {/* Hiring Trend Chart */}
              <Card className="lg:col-span-2">
                <Chart
                  type="area"
                  data={hiringTrendData}
                  title="Monthly Hiring Trend (6 Months)"
                  height={220}
                  width={600}
                  showGrid={true}
                  showAxes={true}
                  color="#3b82f6"
                  gradientFrom="#3b82f6"
                  gradientTo="#60a5fa"
                />
              </Card>
            </div>

            {/* Department Staffing Chart */}
            <div className="mb-8 animate-fade-in">
              <Chart
                type="bar"
                data={departmentStaffData}
                title="Staff Distribution by Department"
                height={240}
                width={1200}
                showGrid={true}
                showAxes={true}
                showValues={true}
                color="#f97316"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-600 hover:bg-primary-50 transition-all">
                      <p className="font-medium text-gray-900">{app.name} - {app.position}</p>
                      <p className="text-sm text-gray-600">Applied {app.applied} • {app.location}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveView('applications')}
                    className="w-full py-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                  >
                    View All Applications →
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Training Alerts</h3>
                <div className="space-y-3">
                  {staffList.filter(staff => staff.trainingDue.length > 0).map((staff) => (
                    <div key={staff.id} className="p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {staff.trainingDue.map((training, i) => (
                          <Badge key={i} variant="warning" size="sm">{training}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveView('training')}
                    className="w-full py-2 text-warning-600 hover:text-warning-700 text-sm font-medium transition-colors"
                  >
                    Manage Training →
                  </button>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Applications View */}
        {activeView === 'applications' && (
          <Card className="animate-fade-in">
            {/* Header with title and filter toggle */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Job Applications</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredApplications.length} of {applications.length} applications
                  {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Search box */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter toggle button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                      setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                    }}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="status-asc">Status (Pipeline)</option>
                    <option value="position-asc">Position A-Z</option>
                  </select>
                  <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expandable filter panel */}
            {showFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="space-y-2">
                      {(['new', 'reviewing', 'interview', 'scheduled', 'offered', 'rejected'] as const).map((status) => (
                        <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.statuses.includes(status)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                statuses: e.target.checked
                                  ? [...prev.statuses, status]
                                  : prev.statuses.filter(s => s !== status)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Position filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uniquePositions.map((position) => (
                        <label key={position} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.positions.includes(position)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                positions: e.target.checked
                                  ? [...prev.positions, position]
                                  : prev.positions.filter(p => p !== position)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="truncate">{position}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Source filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <div className="space-y-2">
                      {uniqueSources.map((source) => (
                        <label key={source} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.sources.includes(source)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                sources: e.target.checked
                                  ? [...prev.sources, source]
                                  : prev.sources.filter(s => s !== source)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="capitalize">{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Date</label>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">From</label>
                        <input
                          type="date"
                          value={filters.dateRange.from}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, from: e.target.value }
                          }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">To</label>
                        <input
                          type="date"
                          value={filters.dateRange.to}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, to: e.target.value }
                          }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear filters button */}
                {activeFilterCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={resetFilters}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Applications list */}
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FunnelIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No applications found</p>
                  <p className="text-sm mt-1">
                    {activeFilterCount > 0 ? 'Try adjusting your filters' : 'No applications have been submitted yet'}
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                filteredApplications.map((app) => (
                <div key={app.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{app.name}</h4>
                          <p className="text-sm text-gray-600">{app.position} • {app.experience} experience</p>
                          <p className="text-xs text-gray-500 mt-1">📍 {app.location} • Applied {app.applied}</p>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* New applications: Move to Interview */}
                        {app.status === 'new' && (
                          <button
                            onClick={() => handleMoveToInterview(app)}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                          >
                            ✓ Move to Interview
                          </button>
                        )}

                        {/* Interview stage (not yet scheduled): Schedule Interview */}
                        {app.status === 'interview' && (
                          <button
                            onClick={() => handleScheduleInterview(app)}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                          >
                            📅 Schedule Interview
                          </button>
                        )}

                        {/* Scheduled: Reschedule/Cancel */}
                        {app.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleScheduleInterview(app)}
                              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                            >
                              📅 Reschedule Interview
                            </button>
                            <button
                              onClick={() => handleCancelInterview(app)}
                              className="px-3 py-1.5 bg-warning-600 text-white rounded-lg text-sm font-medium hover:bg-warning-700 transition-colors"
                            >
                              ✗ Cancel Interview
                            </button>
                          </>
                        )}

                        {/* Offer Job - available for non-rejected, non-offered, non-hired applicants */}
                        {app.status !== 'rejected' && app.status !== 'offered' && app.status !== 'hired' && (
                          <button
                            onClick={() => handleOfferJob(app)}
                            className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
                          >
                            🎉 Offer Job
                          </button>
                        )}

                        {/* Offer Pending Actions - Resend offer email or mark as accepted */}
                        {app.status === 'offered' && (
                          <>
                            <button
                              onClick={() => handleResendOffer(app)}
                              className="px-3 py-1.5 bg-warning-600 text-white rounded-lg text-sm font-medium hover:bg-warning-700 transition-colors"
                            >
                              📧 Resend Offer
                            </button>
                            <button
                              onClick={() => handleAcceptOffer(app)}
                              className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
                            >
                              ✅ Mark Accepted
                            </button>
                          </>
                        )}

                        {/* Reject - available except for already rejected, offered, or hired */}
                        {app.status !== 'rejected' && app.status !== 'offered' && app.status !== 'hired' && (
                          <button
                            onClick={() => handleReject(app)}
                            className="px-3 py-1.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                          >
                            ✗ Reject
                          </button>
                        )}

                        {/* View Onboarding - available for hired applicants */}
                        {app.status === 'hired' && (
                          <Link
                            to={`/hr/onboarding/${app.id}`}
                            className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors inline-flex items-center"
                          >
                            📋 View Onboarding
                          </Link>
                        )}

                        {/* View Details - always available */}
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                          👁️ View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </Card>
        )}

        {/* Staff View */}
        {activeView === 'staff' && (
          <Card className="animate-fade-in">
            {/* Header with title and filter toggle */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Staff Directory</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredStaff.length} of {staffList.length} staff members
                  {activeStaffFilterCount > 0 && ` (${activeStaffFilterCount} filter${activeStaffFilterCount > 1 ? 's' : ''} active)`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Search box */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, role..."
                    value={staffFilters.search}
                    onChange={(e) => setStaffFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {staffFilters.search && (
                    <button
                      onClick={() => setStaffFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter toggle button */}
                <button
                  onClick={() => setShowStaffFilters(!showStaffFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showStaffFilters || activeStaffFilterCount > 0
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4" />
                  Filters
                  {activeStaffFilterCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeStaffFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={`${staffFilters.sortBy}-${staffFilters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [StaffFilterState['sortBy'], StaffFilterState['sortOrder']];
                      setStaffFilters(prev => ({ ...prev, sortBy, sortOrder }));
                    }}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="department-asc">Department A-Z</option>
                    <option value="department-desc">Department Z-A</option>
                    <option value="role-asc">Role A-Z</option>
                    <option value="role-desc">Role Z-A</option>
                    <option value="hireDate-desc">Newest Hire</option>
                    <option value="hireDate-asc">Oldest Hire</option>
                  </select>
                  <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expandable filter panel */}
            {showStaffFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Department filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uniqueDepartments.map((dept) => (
                        <label key={dept} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staffFilters.departments.includes(dept)}
                            onChange={(e) => {
                              setStaffFilters(prev => ({
                                ...prev,
                                departments: e.target.checked
                                  ? [...prev.departments, dept]
                                  : prev.departments.filter(d => d !== dept)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Role filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role/Position</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uniqueRoles.map((role) => (
                        <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staffFilters.roles.includes(role)}
                            onChange={(e) => {
                              setStaffFilters(prev => ({
                                ...prev,
                                roles: e.target.checked
                                  ? [...prev.roles, role]
                                  : prev.roles.filter(r => r !== role)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="truncate">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
                    <div className="space-y-2">
                      {uniqueStaffStatuses.map((status) => (
                        <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staffFilters.statuses.includes(status)}
                            onChange={(e) => {
                              setStaffFilters(prev => ({
                                ...prev,
                                statuses: e.target.checked
                                  ? [...prev.statuses, status]
                                  : prev.statuses.filter(s => s !== status)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Training status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Training Status</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="trainingStatus"
                          checked={staffFilters.trainingStatus === 'all'}
                          onChange={() => setStaffFilters(prev => ({ ...prev, trainingStatus: 'all' }))}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span>All Staff</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="trainingStatus"
                          checked={staffFilters.trainingStatus === 'due'}
                          onChange={() => setStaffFilters(prev => ({ ...prev, trainingStatus: 'due' }))}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span>Training Due</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="trainingStatus"
                          checked={staffFilters.trainingStatus === 'current'}
                          onChange={() => setStaffFilters(prev => ({ ...prev, trainingStatus: 'current' }))}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span>Training Current</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Clear filters button */}
                {activeStaffFilterCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={resetStaffFilters}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Staff list */}
            <div className="space-y-4">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No staff members found</p>
                  <p className="text-sm mt-1">
                    {activeStaffFilterCount > 0 ? 'Try adjusting your filters' : 'Staff data is loading or no active staff in the system'}
                  </p>
                  {activeStaffFilterCount > 0 && (
                    <button
                      onClick={resetStaffFilters}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-4 border rounded-lg transition-all ${
                    staff.trainingDue.length > 0
                      ? 'border-warning-300 bg-warning-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{staff.name}</h4>
                          <p className="text-sm text-gray-600">{staff.position} • {staff.department} Department</p>
                          <p className="text-xs text-gray-500 mt-1">
                            📧 {staff.email || 'No email'} • 📞 {staff.phone || 'No phone'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">📅 Hired: {new Date(staff.hireDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge variant={staff.status === 'active' ? 'success' : 'warning'} size="sm">
                            {staff.status}
                          </Badge>
                          {staff.trainingDue.length > 0 && (
                            <Badge variant="danger" size="sm">Training Due</Badge>
                          )}
                        </div>
                      </div>

                      {staff.certifications.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Certifications:</p>
                          <div className="flex flex-wrap gap-1">
                            {staff.certifications.map((cert, i) => (
                              <Badge key={i} variant="success" size="sm">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {staff.trainingDue.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-danger-700 mb-1">Training Due:</p>
                          <div className="flex flex-wrap gap-1">
                            {staff.trainingDue.map((training, i) => (
                              <Badge key={i} variant="danger" size="sm">{training}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => navigate(`/hr/staff/${staff.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          <UserGroupIcon className="h-4 w-4" />
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            if (staff.email) {
                              window.location.href = `mailto:${staff.email}`;
                            } else {
                              alert('No email address on file for this employee.');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          Message
                        </button>
                        <button
                          onClick={() => window.open('/dashboard/scheduling-calendar', '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors"
                        >
                          <CalendarDaysIcon className="h-4 w-4" />
                          Schedule
                        </button>
                        {staff.trainingDue.length > 0 && (
                          <button
                            onClick={() => {
                              if (staff.email) {
                                alert(`Training reminder will be sent to ${staff.email} for: ${staff.trainingDue.join(', ')}`);
                              } else {
                                alert('No email address on file. Please update employee contact information.');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                          >
                            <AcademicCapIcon className="h-4 w-4" />
                            Training Reminder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Training View */}
        {activeView === 'training' && (
          <div className="space-y-6 animate-fade-in">
            {/* Staff with training due */}
            {staffList.filter(s => s.trainingDue.length > 0).length > 0 ? (
              <Card>
                <Alert variant="danger" title={`Training Renewals Due (${staffList.filter(s => s.trainingDue.length > 0).length} staff)`}>
                  The following staff members have training that needs to be renewed
                </Alert>
                <div className="mt-4 space-y-3">
                  {staffList.filter(s => s.trainingDue.length > 0).map((staff) => (
                    <div key={staff.id} className="p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {staff.trainingDue.map((training, i) => (
                          <Badge key={i} variant="warning" size="sm">{training}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <Alert variant="success" title="All Training Up to Date">
                  No staff members have pending training renewals
                </Alert>
              </Card>
            )}

            {/* Training Compliance Summary */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Compliance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-success-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-success-600">{metrics.trainingCompliance}%</p>
                  <p className="text-sm text-gray-600">Overall Compliance Rate</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary-600">{metrics.totalStaff}</p>
                  <p className="text-sm text-gray-600">Total Staff</p>
                </div>
                <div className="p-4 bg-warning-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-warning-600">{staffList.filter(s => s.trainingDue.length > 0).length}</p>
                  <p className="text-sm text-gray-600">Needing Renewal</p>
                </div>
              </div>
            </Card>

            {/* Note about training courses */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Management</h3>
              <p className="text-gray-600">
                Training courses and enrollment will be available once the training module is fully configured.
                Contact your administrator to set up training courses for your organization.
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Applicant Details Modal */}
      {selectedApplicant && (
        <ApplicantDetailsModal
          applicant={selectedApplicant}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedApplicant(null);
          }}
          onMoveToInterview={() => handleMoveToInterview(selectedApplicant)}
          onReject={() => handleReject(selectedApplicant)}
        />
      )}

      {/* Rejection Modal */}
      {applicantToReject && (
        <RejectionModal
          applicantName={applicantToReject.name}
          position={applicantToReject.position}
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setApplicantToReject(null);
          }}
          onConfirm={handleConfirmRejection}
        />
      )}

      {/* Schedule Interview Modal */}
      {applicantToSchedule && (
        <ScheduleInterviewModal
          applicantName={applicantToSchedule.name}
          position={applicantToSchedule.position}
          applicantEmail={applicantToSchedule.email}
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setApplicantToSchedule(null);
          }}
          onSchedule={handleConfirmSchedule}
        />
      )}

      {/* Accept Offer Modal */}
      {applicantToAccept && (
        <AcceptOfferModal
          applicantName={applicantToAccept.name}
          position={applicantToAccept.position}
          applicantEmail={applicantToAccept.email}
          isOpen={showAcceptOfferModal}
          onClose={() => {
            setShowAcceptOfferModal(false);
            setApplicantToAccept(null);
          }}
          onAccept={processAcceptOffer}
        />
      )}

      {/* Success Modal */}
      {successModalData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessModalData(null);
          }}
          title={successModalData.title}
          message={successModalData.message}
          details={successModalData.details}
          footer={successModalData.footer}
        />
      )}

      {/* Staff Profile Modal */}
      {selectedStaff && (
        <StaffProfileModal
          staff={selectedStaff}
          isOpen={showStaffProfileModal}
          onClose={() => {
            setShowStaffProfileModal(false);
            setSelectedStaff(null);
          }}
          onEdit={() => {
            navigate(`/hr/staff/${selectedStaff.id}`);
          }}
          onSendMessage={() => {
            if (selectedStaff.email) {
              window.location.href = `mailto:${selectedStaff.email}`;
            } else {
              alert('No email address on file for this employee.');
            }
          }}
          onViewSchedule={() => {
            navigate('/dashboard/scheduling-calendar');
          }}
          onManageCredentials={() => {
            navigate('/dashboard/credentials');
          }}
        />
      )}
    </div>
  );
}
