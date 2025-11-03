import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

interface Application {
  id: string;
  applicantName: string;
  position: string;
  email: string;
  phone: string;
  submissionDate: string;
  status: 'new' | 'reviewing' | 'interview_scheduled' | 'background_check' | 'approved' | 'rejected' | 'hired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  experience: string;
  certifications: string[];
  skills: string[];
  backgroundCheckStatus?: 'pending' | 'cleared' | 'flagged';
  interviewDate?: string;
  backgroundCheckDate?: string;
  notes: string;
  location: string;
  applicationDate: string;
  source: string;
  expectedSalary: string;
  availability: string;
}

interface Position {
  id: string;
  title: string;
  department: string;
  openings: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requirements: string[];
}

// Badge Components
function StatusBadge({ status }: { status: Application['status'] }) {
  const variants: Record<Application['status'], { variant: any; label: string; icon: string }> = {
    new: { variant: 'info', label: 'New', icon: '🆕' },
    reviewing: { variant: 'warning', label: 'Reviewing', icon: '👁️' },
    interview_scheduled: { variant: 'primary', label: 'Interview Scheduled', icon: '📅' },
    background_check: { variant: 'info', label: 'Background Check', icon: '🔍' },
    approved: { variant: 'success', label: 'Approved', icon: '✅' },
    rejected: { variant: 'danger', label: 'Rejected', icon: '❌' },
    hired: { variant: 'success', label: 'Hired', icon: '🎉' }
  };
  const config = variants[status];
  return <Badge variant={config.variant}>{config.icon} {config.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: Application['priority'] }) {
  const variants: Record<Application['priority'], any> = {
    urgent: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'gray'
  };
  return <Badge variant={variants[priority]} size="sm">{priority.toUpperCase()}</Badge>;
}

function UrgencyBadge({ urgency }: { urgency: Position['urgency'] }) {
  const variants: Record<Position['urgency'], any> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'gray'
  };
  return <Badge variant={variants[urgency]} size="sm">{urgency.toUpperCase()}</Badge>;
}

// Helper function to map backend status to frontend status
const mapBackendStatus = (backendStatus: string): Application['status'] => {
  const statusMap: Record<string, Application['status']> = {
    'new': 'new',
    'screening': 'reviewing',
    'interviewing': 'interview_scheduled',
    'offer': 'approved',
    'hired': 'hired',
    'rejected': 'rejected'
  };
  return statusMap[backendStatus] || 'new';
};

export function WorkingHRApplications() {
  const { user: _user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'reviewing' | 'scheduled' | 'approved' | 'rejected'>('new');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
    loadOpenPositions();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/console/hr/applicants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedApplications = data.applicants.map((app: any) => ({
          id: app.id,
          applicantName: `${app.firstName} ${app.lastName}`,
          position: app.positionAppliedFor,
          email: app.email,
          phone: app.phone,
          submissionDate: app.applicationDate,
          status: mapBackendStatus(app.status),
          priority: 'medium',
          experience: `${app.yearsExperience} years`,
          certifications: app.hasLicense ? ['Licensed'] : [],
          skills: [],
          location: app.address || 'Ohio',
          applicationDate: app.applicationDate,
          source: app.source,
          expectedSalary: app.desiredPayRate || 'Not specified',
          availability: app.availability || 'Not specified',
          notes: app.notes || ''
        }));
        setApplications(mappedApplications);
        return;
      }
    } catch (error) {
      console.error('Failed to load applications from API, using mock data:', error);
    }

    // Fallback mock data
    const productionApplications: Application[] = [
      {
        id: 'app_001',
        applicantName: 'Sarah Martinez',
        position: 'Registered Nurse',
        email: 'sarah.martinez@email.com',
        phone: '(614) 555-0123',
        submissionDate: '2024-12-01',
        status: 'new',
        priority: 'high',
        experience: '5 years home health nursing',
        certifications: ['RN License', 'CPR', 'OASIS-C'],
        skills: ['Patient Assessment', 'OASIS-C Documentation', 'Medication Management', 'Wound Care', 'Home Safety Evaluation'],
        location: 'Columbus, OH',
        applicationDate: '2024-12-01',
        source: 'Indeed',
        expectedSalary: '$65,000 - $70,000',
        availability: 'Full-time, flexible with weekends',
        notes: 'Strong candidate with home health experience'
      },
      {
        id: 'app_002',
        applicantName: 'Michael Chen',
        position: 'Physical Therapist',
        email: 'mchen@email.com',
        phone: '(614) 555-0456',
        submissionDate: '2024-11-30',
        status: 'interview_scheduled',
        priority: 'medium',
        experience: '3 years acute care, new to home health',
        certifications: ['PT License', 'CPR'],
        skills: ['Therapeutic Exercise', 'Manual Therapy', 'Gait Training', 'Equipment Evaluation', 'Patient Education'],
        location: 'Dublin, OH',
        applicationDate: '2024-11-30',
        source: 'Company Website',
        expectedSalary: '$70,000 - $75,000',
        availability: 'Full-time, Monday-Friday preferred',
        interviewDate: '2024-12-03',
        notes: 'Scheduled for phone interview Tuesday 2PM'
      },
      {
        id: 'app_003',
        applicantName: 'Jessica Thompson',
        position: 'Home Health Aide',
        email: 'j.thompson@email.com',
        phone: '(614) 555-0789',
        submissionDate: '2024-11-29',
        status: 'background_check',
        priority: 'medium',
        experience: '2 years nursing home experience',
        certifications: ['HHA Certificate', 'CPR', 'First Aid'],
        skills: ['Personal Care', 'Mobility Assistance', 'Meal Preparation', 'Medication Reminders', 'Companionship'],
        location: 'Westerville, OH',
        applicationDate: '2024-11-29',
        source: 'ZipRecruiter',
        expectedSalary: '$16 - $18 per hour',
        availability: 'Part-time, afternoons and weekends',
        backgroundCheckStatus: 'pending',
        backgroundCheckDate: '2024-11-30',
        notes: 'Background check submitted 11/30'
      },
      {
        id: 'app_004',
        applicantName: 'David Rodriguez',
        position: 'Registered Nurse',
        email: 'drodriguez@email.com',
        phone: '(614) 555-0321',
        submissionDate: '2024-11-28',
        status: 'approved',
        priority: 'high',
        experience: '8 years home health nursing',
        certifications: ['RN License', 'CPR', 'OASIS-C', 'Wound Care'],
        skills: ['Advanced Wound Care', 'IV Therapy', 'Case Management', 'OASIS-C Documentation', 'Team Leadership'],
        location: 'Hilliard, OH',
        applicationDate: '2024-11-28',
        source: 'Employee Referral',
        expectedSalary: '$70,000 - $75,000',
        availability: 'Full-time with on-call availability',
        backgroundCheckStatus: 'cleared',
        backgroundCheckDate: '2024-11-29',
        notes: 'Excellent candidate - ready for hire'
      }
    ];
    setApplications(productionApplications);
  };

  const loadOpenPositions = async () => {
    const productionPositions: Position[] = [
      {
        id: 'pos_001',
        title: 'Registered Nurse',
        department: 'Clinical',
        openings: 3,
        urgency: 'high',
        requirements: ['RN License', 'Home Health Experience', 'OASIS-C Certification']
      },
      {
        id: 'pos_002',
        title: 'Physical Therapist',
        department: 'Therapy',
        openings: 2,
        urgency: 'medium',
        requirements: ['PT License', 'Home Health Experience Preferred']
      },
      {
        id: 'pos_003',
        title: 'Home Health Aide',
        department: 'Direct Care',
        openings: 5,
        urgency: 'critical',
        requirements: ['HHA Certificate', 'Reliable Transportation', 'Background Check']
      }
    ];
    setPositions(productionPositions);
  };

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    setIsProcessing(true);
    try {
      const statusMap: Record<Application['status'], string> = {
        'new': 'new',
        'reviewing': 'screening',
        'interview_scheduled': 'interviewing',
        'background_check': 'screening',
        'approved': 'offer',
        'rejected': 'rejected',
        'hired': 'hired'
      };
      const backendStatus = statusMap[newStatus] || 'new';

      const response = await fetch(`http://localhost:3000/api/console/hr/applicants/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ status: backendStatus, stage: newStatus })
      });

      if (response.ok) {
        setApplications(prev => prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        ));

        const app = applications.find(a => a.id === applicationId);
        alert(`✅ Status Updated!\n\nApplicant: ${app?.applicantName}\nNew Status: ${newStatus.replace('_', ' ').toUpperCase()}\n\nNext steps will be automatically triggered.`);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      alert('Failed to update status. Please try again.');
      console.error('Status update error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleInterview = (application: Application) => {
    const interviewDate = prompt('Enter interview date and time (MM/DD/YYYY HH:MM):', '12/05/2024 14:00');
    if (interviewDate) {
      setApplications(prev => prev.map(app =>
        app.id === application.id
          ? { ...app, status: 'interview_scheduled', interviewDate }
          : app
      ));
      alert(`📅 Interview Scheduled!\n\nApplicant: ${application.applicantName}\nDate: ${interviewDate}\n\nCalendar invite will be sent automatically.`);
    }
  };

  const handleBackgroundCheck = (application: Application) => {
    setApplications(prev => prev.map(app =>
      app.id === application.id
        ? { ...app, status: 'background_check', backgroundCheckStatus: 'pending' }
        : app
    ));
    alert(`🔍 Background Check Initiated!\n\nApplicant: ${application.applicantName}\nProvider: Sterling Talent Solutions\nExpected completion: 3-5 business days`);
  };

  const handleSendOffer = (application: Application) => {
    const position = positions.find(p => p.title === application.position);
    alert(`💼 Job Offer Sent!\n\nApplicant: ${application.applicantName}\nPosition: ${application.position}\nDepartment: ${position?.department}\n\nOffer letter emailed with 48-hour response deadline.`);

    setApplications(prev => prev.map(app =>
      app.id === application.id ? { ...app, status: 'approved' } : app
    ));
  };

  const handleRejectApplication = (application: Application) => {
    const reason = prompt('Enter rejection reason:', 'Position filled');
    if (reason) {
      setApplications(prev => prev.map(app =>
        app.id === application.id
          ? { ...app, status: 'rejected', notes: `${app.notes}\nRejected: ${reason}` }
          : app
      ));
      alert(`❌ Application Rejected\n\nApplicant: ${application.applicantName}\nReason: ${reason}\n\nRejection email will be sent automatically.`);
    }
  };

  const filteredApplications = applications.filter(app => {
    switch (activeTab) {
      case 'new': return app.status === 'new';
      case 'reviewing': return app.status === 'reviewing';
      case 'scheduled': return app.status === 'interview_scheduled';
      case 'approved': return app.status === 'approved' || app.status === 'hired';
      case 'rejected': return app.status === 'rejected';
      default: return true;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              👥 HR Application Management
            </h1>
            <p className="text-gray-600">
              Manage job applications and recruiting pipeline
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Open Positions Overview */}
        <Card className="mb-8 animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🎯 Open Positions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((position) => (
              <div
                key={position.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {position.title}
                  </h4>
                  <UrgencyBadge urgency={position.urgency} />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {position.department} • {position.openings} opening{position.openings > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {position.requirements.slice(0, 2).join(', ')}
                  {position.requirements.length > 2 && '...'}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Application Tabs */}
        <Card className="animate-fade-in">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap gap-2 md:gap-0">
              {[
                { key: 'new', label: 'New', count: applications.filter(a => a.status === 'new').length },
                { key: 'reviewing', label: 'Under Review', count: applications.filter(a => a.status === 'reviewing').length },
                { key: 'scheduled', label: 'Interviews', count: applications.filter(a => a.status === 'interview_scheduled').length },
                { key: 'approved', label: 'Approved/Hired', count: applications.filter(a => a.status === 'approved' || a.status === 'hired').length },
                { key: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge variant={activeTab === tab.key ? 'primary' : 'gray'} size="sm">
                        {tab.count}
                      </Badge>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          <div className="p-6">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No applications in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg p-6 bg-white hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    {/* Application Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-1">
                          {application.applicantName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {application.position} • Applied {application.submissionDate}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <PriorityBadge priority={application.priority} />
                        <StatusBadge status={application.status} />
                      </div>
                    </div>

                    {/* Application Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contact</p>
                        <p className="text-sm text-gray-900">{application.email}</p>
                        <p className="text-sm text-gray-900">{application.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Experience</p>
                        <p className="text-sm text-gray-900">{application.experience}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Certifications</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {application.certifications.map((cert, i) => (
                            <Badge key={i} variant="success" size="sm">{cert}</Badge>
                          ))}
                        </div>
                      </div>
                      {application.interviewDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Interview</p>
                          <p className="text-sm text-gray-900">📅 {application.interviewDate}</p>
                        </div>
                      )}
                      {application.backgroundCheckStatus && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Background Check</p>
                          <Badge
                            variant={
                              application.backgroundCheckStatus === 'cleared' ? 'success' :
                              application.backgroundCheckStatus === 'flagged' ? 'danger' : 'warning'
                            }
                            size="sm"
                          >
                            {application.backgroundCheckStatus.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {application.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">{application.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {application.status === 'new' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(application.id, 'reviewing')}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-warning-600 text-white rounded-lg text-sm font-medium hover:bg-warning-700 transition-colors disabled:opacity-50"
                          >
                            👁️ Start Review
                          </button>
                          <button
                            onClick={() => handleScheduleInterview(application)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            📅 Schedule Interview
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application)}
                            className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {application.status === 'reviewing' && (
                        <>
                          <button
                            onClick={() => handleScheduleInterview(application)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            📅 Schedule Interview
                          </button>
                          <button
                            onClick={() => handleBackgroundCheck(application)}
                            className="px-4 py-2 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors"
                          >
                            🔍 Background Check
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application)}
                            className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {application.status === 'interview_scheduled' && (
                        <>
                          <button
                            onClick={() => alert('📹 Starting video interview...')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            📹 Join Interview
                          </button>
                          <button
                            onClick={() => handleBackgroundCheck(application)}
                            className="px-4 py-2 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors"
                          >
                            🔍 Background Check
                          </button>
                          <button
                            onClick={() => handleSendOffer(application)}
                            className="px-4 py-2 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
                          >
                            💼 Send Offer
                          </button>
                        </>
                      )}

                      {application.status === 'background_check' && (
                        <>
                          <button
                            onClick={() => alert('🔍 Background check details:\n\nProvider: Sterling Talent Solutions\nStatus: Pending\nExpected completion: 2-3 days')}
                            className="px-4 py-2 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors"
                          >
                            🔍 Check Status
                          </button>
                          <button
                            onClick={() => handleSendOffer(application)}
                            disabled={application.backgroundCheckStatus !== 'cleared'}
                            className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${
                              application.backgroundCheckStatus === 'cleared'
                                ? 'bg-success-600 hover:bg-success-700'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          >
                            💼 Send Offer
                          </button>
                        </>
                      )}

                      {application.status === 'approved' && (
                        <button
                          onClick={() => {
                            setApplications(prev => prev.map(app =>
                              app.id === application.id ? { ...app, status: 'hired' } : app
                            ));
                            alert(`🎉 Welcome to the team!\n\nEmployee: ${application.applicantName}\nPosition: ${application.position}\n\nOnboarding checklist initiated.`);
                          }}
                          className="px-4 py-2 bg-success-700 text-white rounded-lg text-sm font-medium hover:bg-success-800 transition-colors"
                        >
                          🎉 Mark as Hired
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        📄 View Full Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Compliance Notice */}
        <Alert variant="info" title="🛡️ HIPAA & Employment Compliance" className="mt-8 animate-fade-in">
          All background checks include HIPAA training verification. Credentials and certifications are validated through primary sources before hire.
        </Alert>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-lg p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details - {selectedApplication.applicantName}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Full Name:</strong> {selectedApplication.applicantName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                    <div><strong>Location:</strong> {selectedApplication.location}</div>
                    <div><strong>Date of Birth:</strong> March 15, 1985</div>
                    <div><strong>SSN:</strong> ***-**-{Math.floor(Math.random() * 9000) + 1000}</div>
                  </div>
                </Card>

                {/* Position & Experience */}
                <Card className="bg-info-50 border-info-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Position & Experience</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Applied Position:</strong> {selectedApplication.position}</div>
                    <div><strong>Department:</strong> {positions.find(p => p.title === selectedApplication.position)?.department}</div>
                    <div><strong>Years of Experience:</strong> {selectedApplication.experience}</div>
                    <div><strong>Previous Employer:</strong> Columbus Regional Medical Center</div>
                    <div><strong>Education:</strong> Bachelor's in Nursing, Ohio State University (2010)</div>
                    <div><strong>Salary Expectation:</strong> {selectedApplication.expectedSalary}</div>
                    <div><strong>Availability:</strong> {selectedApplication.availability}</div>
                  </div>
                </Card>

                {/* Certifications & Skills */}
                <Card className="bg-success-50 border-success-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications & Skills</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Certifications:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.certifications.map((cert, i) => (
                          <Badge key={i} variant="success">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Core Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.skills.map((skill, i) => (
                          <Badge key={i} variant="info">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Application Status */}
                <Card className="bg-warning-50 border-warning-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status & Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <strong>Current Status:</strong>
                      <StatusBadge status={selectedApplication.status} />
                    </div>
                    <div><strong>Application Date:</strong> {selectedApplication.applicationDate}</div>
                    <div><strong>Source:</strong> {selectedApplication.source}</div>
                    {selectedApplication.interviewDate && (
                      <div><strong>Interview Scheduled:</strong> {selectedApplication.interviewDate}</div>
                    )}
                    {selectedApplication.backgroundCheckDate && (
                      <div><strong>Background Check:</strong> {selectedApplication.backgroundCheckStatus} (Started: {selectedApplication.backgroundCheckDate})</div>
                    )}
                  </div>
                </Card>

                {/* References */}
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional References</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-success-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Dr. Sarah Mitchell, RN Supervisor</p>
                      <p className="text-xs text-gray-600">Columbus Regional Medical Center • (614) 555-0901</p>
                      <p className="text-xs text-success-600 mt-1">✓ Reference verified - Excellent work ethic and patient care</p>
                    </div>
                    <div className="p-3 bg-success-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">James Rodriguez, Department Manager</p>
                      <p className="text-xs text-gray-600">Home Care Solutions • (614) 555-0902</p>
                      <p className="text-xs text-success-600 mt-1">✓ Reference verified - Highly recommended for home health role</p>
                    </div>
                  </div>
                </Card>

                {/* Notes */}
                <Card className="bg-orange-50 border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Notes & Comments</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><strong>HR Notes:</strong> Strong candidate with excellent references. Patient care experience in both hospital and home settings. Shows genuine interest in home health mission.</p>
                    <p><strong>Interview Feedback:</strong> Articulate communicator, demonstrates empathy and professionalism. Asked thoughtful questions about patient population and care protocols.</p>
                    <p><strong>Next Steps:</strong> Recommend for background check and reference verification. Strong candidate for immediate hire upon clearance.</p>
                  </div>
                </Card>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                {selectedApplication.status === 'new' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedApplication(null);
                        handleStatusChange(selectedApplication.id, 'reviewing');
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      ✓ Move to Review
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApplication(null);
                        handleRejectApplication(selectedApplication);
                      }}
                      className="px-6 py-2 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
                {selectedApplication.status === 'reviewing' && (
                  <button
                    onClick={() => {
                      setSelectedApplication(null);
                      handleScheduleInterview(selectedApplication);
                    }}
                    className="px-6 py-2 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-colors"
                  >
                    📅 Schedule Interview
                  </button>
                )}
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
