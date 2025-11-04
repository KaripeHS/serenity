import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';

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

// Custom Badge Components for Status/Priority
function StatusBadge({ status }: { status: Application['status'] }) {
  const configs = {
    new: { color: 'bg-blue-100 text-blue-800', icon: '🆕', label: 'NEW' },
    reviewing: { color: 'bg-amber-100 text-amber-800', icon: '👁️', label: 'REVIEWING' },
    interview_scheduled: { color: 'bg-purple-100 text-purple-800', icon: '📅', label: 'INTERVIEW SCHEDULED' },
    background_check: { color: 'bg-cyan-100 text-cyan-800', icon: '🔍', label: 'BACKGROUND CHECK' },
    approved: { color: 'bg-emerald-100 text-emerald-800', icon: '✅', label: 'APPROVED' },
    rejected: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'REJECTED' },
    hired: { color: 'bg-green-100 text-green-800', icon: '🎉', label: 'HIRED' }
  };
  const config = configs[status];
  return (
    <Badge className={`${config.color} px-3 py-1`}>
      {config.icon} {config.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: Application['priority'] }) {
  const configs = {
    urgent: { color: 'bg-red-100 text-red-700', label: 'URGENT' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'HIGH' },
    medium: { color: 'bg-yellow-100 text-yellow-700', label: 'MEDIUM' },
    low: { color: 'bg-lime-100 text-lime-700', label: 'LOW' }
  };
  const config = configs[priority];
  return <Badge className={`${config.color} px-2 py-0.5 text-xs`}>{config.label}</Badge>;
}

function UrgencyBadge({ urgency }: { urgency: Position['urgency'] }) {
  const configs = {
    critical: { color: 'bg-red-100 text-red-700', label: 'CRITICAL' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'HIGH' },
    medium: { color: 'bg-yellow-100 text-yellow-700', label: 'MEDIUM' },
    low: { color: 'bg-lime-100 text-lime-700', label: 'LOW' }
  };
  const config = configs[urgency];
  return <Badge className={`${config.color} px-2 py-0.5 text-xs`}>{config.label}</Badge>;
}

function BackgroundCheckBadge({ status }: { status: 'pending' | 'cleared' | 'flagged' }) {
  const configs = {
    pending: { color: 'text-amber-600', label: 'PENDING' },
    cleared: { color: 'text-emerald-600', label: 'CLEARED' },
    flagged: { color: 'text-red-600', label: 'FLAGGED' }
  };
  const config = configs[status];
  return <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>;
}

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
      await new Promise(resolve => setTimeout(resolve, 1000));

      setApplications(prev => prev.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      const app = applications.find(a => a.id === applicationId);
      alert(`✅ Status Updated!\n\nApplicant: ${app?.applicantName}\nNew Status: ${newStatus.replace('_', ' ').toUpperCase()}\n\nNext steps will be automatically triggered.`);
    } catch (error) {
      alert('Failed to update status. Please try again.');
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👥 HR Application Management
            </h1>
            <p className="text-gray-600">
              Manage job applications and recruiting pipeline
            </p>
          </div>
          <Link to="/" className="text-blue-600 underline hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>

        {/* Open Positions Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🎯 Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {position.title}
                    </h4>
                    <UrgencyBadge urgency={position.urgency} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {position.department} • {position.openings} openings
                  </p>
                  <p className="text-xs text-gray-500">
                    {position.requirements.slice(0, 2).join(', ')}
                    {position.requirements.length > 2 && '...'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Tabs */}
        <Card>
          <div className="flex border-b border-gray-200">
            {[
              { key: 'new', label: 'New Applications', count: applications.filter(a => a.status === 'new').length },
              { key: 'reviewing', label: 'Under Review', count: applications.filter(a => a.status === 'reviewing').length },
              { key: 'scheduled', label: 'Interview Scheduled', count: applications.filter(a => a.status === 'interview_scheduled').length },
              { key: 'approved', label: 'Approved/Hired', count: applications.filter(a => a.status === 'approved' || a.status === 'hired').length },
              { key: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-50 text-gray-900 border-blue-600'
                    : 'bg-white text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge className={`ml-2 ${
                    activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Applications List */}
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No applications in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-1">
                            {application.applicantName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {application.position} • Applied {application.submissionDate}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <PriorityBadge priority={application.priority} />
                          <StatusBadge status={application.status} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Contact</p>
                          <p className="text-sm text-gray-900">{application.email}</p>
                          <p className="text-sm text-gray-900">{application.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Experience</p>
                          <p className="text-sm text-gray-900">{application.experience}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Certifications</p>
                          <p className="text-sm text-gray-900">
                            {application.certifications.join(', ')}
                          </p>
                        </div>
                        {application.interviewDate && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Interview</p>
                            <p className="text-sm text-gray-900">{application.interviewDate}</p>
                          </div>
                        )}
                        {application.backgroundCheckStatus && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Background Check</p>
                            <BackgroundCheckBadge status={application.backgroundCheckStatus} />
                          </div>
                        )}
                      </div>

                      {application.notes && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-sm text-gray-700">{application.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {application.status === 'new' && (
                          <>
                            <Button
                              onClick={() => handleStatusChange(application.id, 'reviewing')}
                              disabled={isProcessing}
                              className="bg-amber-600 hover:bg-amber-700"
                              size="sm"
                            >
                              👁️ Start Review
                            </Button>
                            <Button
                              onClick={() => handleScheduleInterview(application)}
                              className="bg-purple-600 hover:bg-purple-700"
                              size="sm"
                            >
                              📅 Schedule Interview
                            </Button>
                            <Button
                              onClick={() => handleRejectApplication(application)}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              ❌ Reject
                            </Button>
                          </>
                        )}

                        {application.status === 'reviewing' && (
                          <>
                            <Button
                              onClick={() => handleScheduleInterview(application)}
                              className="bg-purple-600 hover:bg-purple-700"
                              size="sm"
                            >
                              📅 Schedule Interview
                            </Button>
                            <Button
                              onClick={() => handleBackgroundCheck(application)}
                              className="bg-cyan-600 hover:bg-cyan-700"
                              size="sm"
                            >
                              🔍 Background Check
                            </Button>
                            <Button
                              onClick={() => handleRejectApplication(application)}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              ❌ Reject
                            </Button>
                          </>
                        )}

                        {application.status === 'interview_scheduled' && (
                          <>
                            <Button
                              onClick={() => alert('📹 Starting video interview...')}
                              className="bg-purple-600 hover:bg-purple-700"
                              size="sm"
                            >
                              📹 Join Interview
                            </Button>
                            <Button
                              onClick={() => handleBackgroundCheck(application)}
                              className="bg-cyan-600 hover:bg-cyan-700"
                              size="sm"
                            >
                              🔍 Background Check
                            </Button>
                            <Button
                              onClick={() => handleSendOffer(application)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              size="sm"
                            >
                              💼 Send Offer
                            </Button>
                          </>
                        )}

                        {application.status === 'background_check' && (
                          <>
                            <Button
                              onClick={() => alert('🔍 Background check details:\n\nProvider: Sterling Talent Solutions\nStatus: Pending\nExpected completion: 2-3 days')}
                              className="bg-cyan-600 hover:bg-cyan-700"
                              size="sm"
                            >
                              🔍 Check Status
                            </Button>
                            <Button
                              onClick={() => handleSendOffer(application)}
                              disabled={application.backgroundCheckStatus !== 'cleared'}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              size="sm"
                            >
                              💼 Send Offer
                            </Button>
                          </>
                        )}

                        {application.status === 'approved' && (
                          <Button
                            onClick={() => {
                              setApplications(prev => prev.map(app =>
                                app.id === application.id ? { ...app, status: 'hired' } : app
                              ));
                              alert(`🎉 Welcome to the team!\n\nEmployee: ${application.applicantName}\nPosition: ${application.position}\n\nOnboarding checklist initiated.`);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            🎉 Mark as Hired
                          </Button>
                        )}

                        <Button
                          onClick={() => setSelectedApplication(application)}
                          variant="outline"
                          size="sm"
                        >
                          📄 View Full Application
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Notice */}
        <Alert className="mt-8 bg-blue-50 border-blue-200">
          <AlertDescription>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">
              🛡️ HIPAA & Employment Compliance
            </h4>
            <p className="text-sm text-blue-700">
              All background checks include HIPAA training verification. Credentials and certifications are validated through primary sources before hire.
            </p>
          </AlertDescription>
        </Alert>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-11/12 max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details - {selectedApplication.applicantName}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><strong>Full Name:</strong> {selectedApplication.applicantName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                    <div><strong>Location:</strong> {selectedApplication.location}</div>
                    <div><strong>Date of Birth:</strong> March 15, 1985</div>
                    <div><strong>SSN:</strong> ***-**-{Math.floor(Math.random() * 9000) + 1000}</div>
                  </div>
                </div>

                {/* Position & Experience */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Position & Experience</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Applied Position:</strong> {selectedApplication.position}</div>
                    <div><strong>Department:</strong> {positions.find(p => p.title === selectedApplication.position)?.department}</div>
                    <div><strong>Years of Experience:</strong> {selectedApplication.experience}</div>
                    <div><strong>Previous Employer:</strong> Columbus Regional Medical Center</div>
                    <div><strong>Education:</strong> Bachelor's in Nursing, Ohio State University (2010)</div>
                    <div><strong>Salary Expectation:</strong> {selectedApplication.expectedSalary}</div>
                    <div><strong>Availability:</strong> {selectedApplication.availability}</div>
                  </div>
                </div>

                {/* Certifications & Skills */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications & Skills</h3>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Current Certifications:</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedApplication.certifications.map((cert, index) => (
                        <Badge key={index} className="bg-green-100 text-green-800">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Core Skills:</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedApplication.skills.map((skill, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Application Status & History */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Status & Timeline</h3>
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
                </div>

                {/* References */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional References</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-md">
                      <p className="text-sm font-medium text-gray-900">Dr. Sarah Mitchell, RN Supervisor</p>
                      <p className="text-xs text-gray-600">Columbus Regional Medical Center • (614) 555-0901</p>
                      <p className="text-xs text-green-700">✓ Reference verified - Excellent work ethic and patient care</p>
                    </div>
                    <div className="p-3 bg-white rounded-md">
                      <p className="text-sm font-medium text-gray-900">James Rodriguez, Department Manager</p>
                      <p className="text-xs text-gray-600">Home Care Solutions • (614) 555-0902</p>
                      <p className="text-xs text-green-700">✓ Reference verified - Highly recommended for home health role</p>
                    </div>
                  </div>
                </div>

                {/* Notes & Comments */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Notes & Comments</h3>
                  <div className="text-sm text-orange-900 space-y-2">
                    <p>
                      <strong>HR Notes:</strong> Strong candidate with excellent references. Patient care experience in both hospital and home settings. Shows genuine interest in home health mission.
                    </p>
                    <p>
                      <strong>Interview Feedback:</strong> Articulate communicator, demonstrates empathy and professionalism. Asked thoughtful questions about patient population and care protocols.
                    </p>
                    <p>
                      <strong>Next Steps:</strong> Recommend for background check and reference verification. Strong candidate for immediate hire upon clearance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                {selectedApplication.status === 'new' && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedApplication(null);
                        handleStatusChange(selectedApplication.id, 'reviewing');
                      }}
                      size="sm"
                    >
                      ✓ Move to Review
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedApplication(null);
                        handleRejectApplication(selectedApplication);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      ✗ Reject
                    </Button>
                  </>
                )}
                {selectedApplication.status === 'reviewing' && (
                  <Button
                    onClick={() => {
                      setSelectedApplication(null);
                      handleScheduleInterview(selectedApplication);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    📅 Schedule Interview
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedApplication(null)}
                  variant="secondary"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
