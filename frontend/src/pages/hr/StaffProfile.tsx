import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import { ImageViewer } from '../../components/ui/ImageViewer';
import { ProfilePictureUpload } from '../../components/hr/ProfilePictureUpload';
import { EditStaffModal } from '../../components/hr/EditStaffModal';
import { DisciplinaryActionModal, DisciplinaryAction } from '../../components/hr/DisciplinaryActionModal';
import { LeaveRequestModal, LeaveRequest } from '../../components/hr/LeaveRequestModal';
import { TerminationModal, TerminationData } from '../../components/hr/TerminationModal';
import { PerformanceReviewModal, PerformanceReview } from '../../components/hr/PerformanceReviewModal';
import { DocumentUploadModal, DocumentUpload } from '../../components/hr/DocumentUploadModal';
import { AddCredentialModal, CredentialData } from '../../components/hr/AddCredentialModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ClockIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  BellAlertIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  hireDate: string;
  updatedAt: string;
  certifications: string[];
  trainingDue: string[];
  credentials?: any[];
  profilePictureUrl?: string | null;
  profilePictureThumbnailUrl?: string | null;
}

interface PerformanceReviewRecord {
  id: string;
  reviewType: string;
  reviewDate: string;
  reviewerName: string;
  overallRating: number;
  status: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
}

interface DocumentRecord {
  id: string;
  category: string;
  documentType: string;
  title: string;
  description?: string;
  expirationDate?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export function StaffProfile() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'schedule' | 'performance' | 'documents'>('overview');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisciplinaryModal, setShowDisciplinaryModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [showPerformanceReviewModal, setShowPerformanceReviewModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showAddCredentialModal, setShowAddCredentialModal] = useState(false);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReviewRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Check if user has permissions to edit profile pictures (executives + HR)
  const canEditProfilePictureRoles = ['founder', 'admin', 'ceo', 'coo', 'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist'];
  const canEditProfilePicture = canEditProfilePictureRoles.includes(user?.role?.toLowerCase() || '');

  // Debug logging for permissions
  console.log('[StaffProfile] Permission check:', { userRole: user?.role, canEditProfilePicture, allowedRoles: canEditProfilePictureRoles });

  useEffect(() => {
    loadStaffMember();
  }, [staffId]);

  useEffect(() => {
    if (activeTab === 'performance' && staffId) {
      loadPerformanceReviews();
    } else if (activeTab === 'documents' && staffId) {
      loadDocuments();
    } else if (activeTab === 'credentials' && staffId) {
      loadCredentials();
    }
  }, [activeTab, staffId]);

  const loadStaffMember = async () => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If no dedicated endpoint, try getting from staff list
        const listResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff?status=active`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (listResponse.ok) {
          const data = await listResponse.json();
          const found = data.staff?.find((s: any) => s.id === staffId);
          if (found) {
            setStaff(found);
          } else {
            setError('Staff member not found');
          }
        } else {
          setError('Failed to load staff member');
        }
      } else {
        const data = await response.json();
        setStaff(data);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Failed to load staff member');
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string): string => {
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
      'support_agent': 'Support Agent'
    };
    return roleMap[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatDepartment = (dept: string): string => {
    if (!dept) return 'General';
    const deptMap: Record<string, string> = {
      'EXEC': 'Executive',
      'FIN': 'Finance',
      'OPS': 'Operations',
      'CLIN': 'Clinical',
      'HR': 'Human Resources',
      'COMP': 'Compliance',
      'IT': 'Information Technology'
    };
    return deptMap[dept] || dept;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTenure = (hireDate: string) => {
    if (!hireDate) return 'N/A';
    const hire = new Date(hireDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((now.getTime() - hire.getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  const handleSendMessage = () => {
    if (staff?.email) {
      window.location.href = `mailto:${staff.email}`;
    } else {
      alert('No email address on file for this employee.');
    }
  };

  const handleSendTrainingReminder = async () => {
    if (!staff?.email) {
      alert('No email address on file. Please update employee contact information.');
      return;
    }

    const token = localStorage.getItem('serenity_access_token');
    try {
      // For now, just show alert - actual API call would go here
      alert(`Training reminder will be sent to ${staff.email} for:\n\n${staff.trainingDue.join('\n')}`);
    } catch (err) {
      alert('Failed to send training reminder');
    }
  };

  const handleEditStaff = async (updatedStaff: Partial<StaffMember>) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedStaff)
      });

      if (!response.ok) {
        throw new Error('Failed to update staff member');
      }

      // Update local state
      setStaff(prev => prev ? { ...prev, ...updatedStaff } : null);
    } catch (err) {
      throw err;
    }
  };

  const handleDisciplinaryAction = async (action: DisciplinaryAction) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/disciplinary-action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action)
      });

      if (!response.ok) {
        throw new Error('Failed to record disciplinary action');
      }

      // Reload staff data
      loadStaffMember();
    } catch (err) {
      throw err;
    }
  };

  const handleLeaveRequest = async (leave: LeaveRequest) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/leave-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leave)
      });

      if (!response.ok) {
        throw new Error('Failed to submit leave request');
      }

      // Reload staff data
      loadStaffMember();
    } catch (err) {
      throw err;
    }
  };

  const handleTermination = async (termination: TerminationData) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/terminate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(termination)
      });

      if (!response.ok) {
        throw new Error('Failed to process termination');
      }

      // Update local state to show terminated
      setStaff(prev => prev ? { ...prev, status: 'terminated' } : null);
    } catch (err) {
      throw err;
    }
  };

  const loadPerformanceReviews = async () => {
    setLoadingReviews(true);
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/performance-reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error loading performance reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadCredentials = async () => {
    setLoadingCredentials(true);
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/credentials/caregiver/${staffId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Error loading credentials:', err);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleAddCredential = async (credential: CredentialData) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caregiverId: staffId,
          credentialType: credential.credentialType,
          credentialNumber: credential.credentialNumber,
          issueDate: credential.issueDate,
          expirationDate: credential.expirationDate,
          issuingAuthority: credential.issuingAuthority,
          notes: credential.notes,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add credential');
      }

      // Reload credentials
      loadCredentials();
      // Also update staff certifications
      loadStaffMember();
    } catch (err) {
      throw err;
    }
  };

  const handlePerformanceReview = async (review: PerformanceReview) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/performance-reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(review)
      });

      if (!response.ok) {
        throw new Error('Failed to save performance review');
      }

      // Reload reviews
      loadPerformanceReviews();
    } catch (err) {
      throw err;
    }
  };

  const handleDocumentUpload = async (document: DocumentUpload) => {
    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: document.category,
          documentType: document.documentType,
          title: document.title,
          description: document.description,
          expirationDate: document.expirationDate,
          fileName: document.file.name,
          fileSize: document.file.size,
          fileData: document.fileData,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      // Reload documents
      loadDocuments();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const token = localStorage.getItem('serenity_access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state
        setDocuments(prev => prev.filter(d => d.id !== documentId));
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getReviewTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: 'Annual Review',
      semi_annual: 'Semi-Annual Review',
      quarterly: 'Quarterly Review',
      probationary: 'Probationary Review',
      '30_day': '30-Day Review',
      '60_day': '60-Day Review',
      '90_day': '90-Day Review',
      improvement_plan: 'Performance Improvement Plan Review',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <Skeleton className="h-64" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Link to="/dashboard/hr" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to HR Dashboard
        </Link>
        <Alert variant="danger" title="Error">
          {error || 'Staff member not found'}
        </Alert>
      </div>
    );
  }

  const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard/hr" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to HR Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendMessage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Send Message
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Summary */}
            <Card>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <ProfilePictureUpload
                    currentImageUrl={staff.profilePictureUrl}
                    staffId={staff.id}
                    staffName={fullName}
                    canEdit={canEditProfilePicture}
                    onUploadSuccess={(url) => setStaff(prev => prev ? { ...prev, profilePictureUrl: url } : null)}
                    onDeleteSuccess={() => setStaff(prev => prev ? { ...prev, profilePictureUrl: null } : null)}
                    onMagnify={() => setShowImageViewer(true)}
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                <p className="text-lg text-gray-600 mt-1">{formatRole(staff.role)}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge variant={staff.status === 'active' ? 'success' : 'warning'} size="sm">
                    {staff.status}
                  </Badge>
                  {staff.trainingDue?.length > 0 && (
                    <Badge variant="danger" size="sm">Training Due</Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{staff.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{formatDepartment(staff.department)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Hire Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(staff.hireDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Tenure</p>
                    <p className="text-sm font-medium text-gray-900">{calculateTenure(staff.hireDate)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <PencilSquareIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">View Schedule</span>
                </button>
                <button
                  onClick={() => setActiveTab('credentials')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <AcademicCapIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Manage Credentials</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard/background-checks')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Background Checks</span>
                </button>
                {['founder', 'cfo', 'finance_director', 'hr_director'].includes(user?.role || '') && (
                  <button
                    onClick={() => navigate('/dashboard/finance/payroll')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Payroll & Compensation</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('performance')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <ChartBarIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Performance Reviews</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Documents & Files</span>
                </button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card>
              <h3 className="text-lg font-semibold text-danger-700 mb-4">Administrative Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowDisciplinaryModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors text-left border border-warning-200"
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
                  <span className="text-sm font-medium text-warning-700">Record Disciplinary Action</span>
                </button>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-info-50 hover:bg-info-100 rounded-lg transition-colors text-left border border-info-200"
                >
                  <DocumentTextIcon className="h-5 w-5 text-info-600" />
                  <span className="text-sm font-medium text-info-700">Request Leave of Absence</span>
                </button>
                <button
                  onClick={() => setShowTerminationModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors text-left border border-danger-200"
                >
                  <XCircleIcon className="h-5 w-5 text-danger-600" />
                  <span className="text-sm font-medium text-danger-700">Initiate Termination</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Alert */}
            {staff.trainingDue?.length > 0 && (
              <Alert variant="danger" title="Training Renewal Required">
                <p className="mb-3">The following certifications are expiring or have expired:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {staff.trainingDue.map((training, i) => (
                    <Badge key={i} variant="danger" size="sm">{training}</Badge>
                  ))}
                </div>
                <button
                  onClick={handleSendTrainingReminder}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                >
                  <BellAlertIcon className="h-4 w-4" />
                  Send Training Reminder
                </button>
              </Alert>
            )}

            {/* Tabs */}
            <Card>
              <div className="flex gap-1 border-b border-gray-200 -mx-6 -mt-6 px-6 mb-6">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'credentials', label: 'Credentials' },
                  { key: 'schedule', label: 'Schedule' },
                  { key: 'performance', label: 'Performance' },
                  { key: 'documents', label: 'Documents' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Employment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Employee ID</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">{staff.id?.slice(0, 8) || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-sm font-medium text-gray-900">{formatRole(staff.role)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-medium text-gray-900">{formatDepartment(staff.department)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Employment Status</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{staff.status}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Start Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(staff.hireDate)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(staff.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                      Active Certifications
                    </h3>
                    {staff.certifications?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {staff.certifications.map((cert, i) => (
                          <Badge
                            key={i}
                            variant={staff.trainingDue?.includes(cert) ? 'danger' : 'success'}
                            size="sm"
                          >
                            {cert}
                            {staff.trainingDue?.includes(cert) && (
                              <ExclamationTriangleIcon className="h-3 w-3 ml-1 inline" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No certifications on file</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 text-success-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Profile Created</p>
                          <p className="text-xs text-gray-500">{formatDate(staff.hireDate)}</p>
                        </div>
                      </div>
                      {staff.updatedAt && staff.updatedAt !== staff.hireDate && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <PencilSquareIcon className="h-5 w-5 text-primary-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                            <p className="text-xs text-gray-500">{formatDate(staff.updatedAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials Tab */}
              {activeTab === 'credentials' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Certifications & Credentials</h3>
                    <button
                      onClick={() => setShowAddCredentialModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Credential
                    </button>
                  </div>

                  {loadingCredentials ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : credentials.length > 0 || staff.certifications?.length > 0 ? (
                    <div className="space-y-3">
                      {/* Show credentials from API */}
                      {credentials.map((cred) => {
                        const isExpired = cred.daysLeft < 0;
                        const isExpiringSoon = cred.daysLeft >= 0 && cred.daysLeft <= 30;
                        return (
                          <div
                            key={cred.id}
                            className={`p-4 rounded-lg border ${
                              isExpired
                                ? 'bg-danger-50 border-danger-200'
                                : isExpiringSoon
                                ? 'bg-warning-50 border-warning-200'
                                : 'bg-success-50 border-success-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isExpired ? (
                                  <XCircleIcon className="h-6 w-6 text-danger-600" />
                                ) : isExpiringSoon ? (
                                  <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
                                ) : (
                                  <CheckCircleIcon className="h-6 w-6 text-success-600" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {cred.credentialName || cred.credentialType?.replace(/_/g, ' ')}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm">
                                    {cred.credentialNumber && (
                                      <span className="text-gray-500">#{cred.credentialNumber}</span>
                                    )}
                                    {cred.expirationDate && (
                                      <span className={
                                        isExpired ? 'text-danger-700' :
                                        isExpiringSoon ? 'text-warning-700' : 'text-success-700'
                                      }>
                                        {isExpired
                                          ? `Expired ${Math.abs(cred.daysLeft)} days ago`
                                          : isExpiringSoon
                                          ? `Expires in ${cred.daysLeft} days`
                                          : `Valid until ${formatDate(cred.expirationDate)}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant={isExpired ? 'danger' : isExpiringSoon ? 'warning' : 'success'}
                                size="sm"
                              >
                                {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {/* Show certifications from staff object if no API credentials loaded */}
                      {credentials.length === 0 && staff.certifications?.map((cert, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-lg border ${
                            staff.trainingDue?.includes(cert)
                              ? 'bg-danger-50 border-danger-200'
                              : 'bg-success-50 border-success-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {staff.trainingDue?.includes(cert) ? (
                                <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                              ) : (
                                <CheckCircleIcon className="h-6 w-6 text-success-600" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{cert}</p>
                                <p className={`text-sm ${staff.trainingDue?.includes(cert) ? 'text-danger-700' : 'text-success-700'}`}>
                                  {staff.trainingDue?.includes(cert) ? 'Renewal Required' : 'Active'}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={staff.trainingDue?.includes(cert) ? 'danger' : 'success'}
                              size="sm"
                            >
                              {staff.trainingDue?.includes(cert) ? 'Renewal Required' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No credentials on file</p>
                      <p className="text-sm mt-1">Add certifications and credentials for this employee</p>
                      <button
                        onClick={() => setShowAddCredentialModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add First Credential
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Work Schedule</h3>
                    <button
                      onClick={() => navigate('/dashboard/scheduling-calendar')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Open Full Calendar
                    </button>
                  </div>

                  <div className="text-center py-12 text-gray-500">
                    <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Schedule View</p>
                    <p className="text-sm mt-1">View this employee's work schedule and shifts</p>
                    <button
                      onClick={() => navigate('/dashboard/scheduling-calendar')}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      View Schedule Calendar
                    </button>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Performance & Reviews</h3>
                    <button
                      onClick={() => setShowPerformanceReviewModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create Review
                    </button>
                  </div>

                  {loadingReviews ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : performanceReviews.length > 0 ? (
                    <div className="space-y-4">
                      {performanceReviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-gray-900">
                                  {getReviewTypeLabel(review.reviewType)}
                                </h4>
                                <Badge
                                  variant={
                                    review.status === 'completed' ? 'success' :
                                    review.status === 'draft' ? 'warning' : 'info'
                                  }
                                  size="sm"
                                >
                                  {review.status === 'pending_employee' ? 'Pending Employee' : review.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatDate(review.reviewPeriodStart)} - {formatDate(review.reviewPeriodEnd)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Reviewed by {review.reviewerName} on {formatDate(review.reviewDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIconSolid
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= review.overallRating ? 'text-warning-500' : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No Performance Reviews</p>
                      <p className="text-sm mt-1">Create the first performance review for this employee</p>
                      <button
                        onClick={() => setShowPerformanceReviewModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Create First Review
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Employee Documents</h3>
                    <button
                      onClick={() => setShowDocumentUploadModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Upload Document
                    </button>
                  </div>

                  {loadingDocuments ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-2">
                      {/* Group documents by category */}
                      {Object.entries(
                        documents.reduce((acc, doc) => {
                          if (!acc[doc.category]) acc[doc.category] = [];
                          acc[doc.category].push(doc);
                          return acc;
                        }, {} as Record<string, DocumentRecord[]>)
                      ).map(([category, docs]) => (
                        <div key={category} className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {docs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gray-100 rounded-lg">
                                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{doc.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>{doc.documentType}</span>
                                      <span>•</span>
                                      <span>{formatFileSize(doc.fileSize)}</span>
                                      <span>•</span>
                                      <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                                      {doc.expirationDate && (
                                        <>
                                          <span>•</span>
                                          <span className={
                                            new Date(doc.expirationDate) < new Date()
                                              ? 'text-danger-600 font-medium'
                                              : ''
                                          }>
                                            {new Date(doc.expirationDate) < new Date() ? 'Expired' : 'Expires'} {formatDate(doc.expirationDate)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {doc.fileUrl && (
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                      title="View"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No Documents</p>
                      <p className="text-sm mt-1">Upload employee documents like W-4, I-9, contracts, and certifications</p>
                      <button
                        onClick={() => setShowDocumentUploadModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Upload First Document
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {staff?.profilePictureUrl && (
        <ImageViewer
          imageUrl={staff.profilePictureUrl}
          alt={`${staff.firstName} ${staff.lastName}`}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {/* Edit Staff Modal */}
      {staff && (
        <EditStaffModal
          staff={staff}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditStaff}
        />
      )}

      {/* Disciplinary Action Modal */}
      {staff && (
        <DisciplinaryActionModal
          staffId={staff.id}
          staffName={fullName}
          isOpen={showDisciplinaryModal}
          onClose={() => setShowDisciplinaryModal(false)}
          onSubmit={handleDisciplinaryAction}
        />
      )}

      {/* Leave Request Modal */}
      {staff && (
        <LeaveRequestModal
          staffId={staff.id}
          staffName={fullName}
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={handleLeaveRequest}
        />
      )}

      {/* Termination Modal */}
      {staff && (
        <TerminationModal
          staffId={staff.id}
          staffName={fullName}
          isOpen={showTerminationModal}
          onClose={() => setShowTerminationModal(false)}
          onSubmit={handleTermination}
        />
      )}

      {/* Performance Review Modal */}
      {staff && (
        <PerformanceReviewModal
          staffId={staff.id}
          staffName={fullName}
          isOpen={showPerformanceReviewModal}
          onClose={() => setShowPerformanceReviewModal(false)}
          onSubmit={handlePerformanceReview}
        />
      )}

      {/* Document Upload Modal */}
      {staff && (
        <DocumentUploadModal
          staffId={staff.id}
          staffName={fullName}
          isOpen={showDocumentUploadModal}
          onClose={() => setShowDocumentUploadModal(false)}
          onSubmit={handleDocumentUpload}
        />
      )}

      {/* Add Credential Modal */}
      {staff && (
        <AddCredentialModal
          staffId={staff.id}
          staffName={fullName}
          isOpen={showAddCredentialModal}
          onClose={() => setShowAddCredentialModal(false)}
          onSubmit={handleAddCredential}
        />
      )}
    </div>
  );
}

export default StaffProfile;
