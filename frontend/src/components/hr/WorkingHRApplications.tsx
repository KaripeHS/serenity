import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3B82F6';
      case 'reviewing': return '#F59E0B';
      case 'interview_scheduled': return '#8B5CF6';
      case 'background_check': return '#06B6D4';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'hired': return '#059669';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              👥 HR Application Management
            </h1>
            <p style={{ color: '#6b7280' }}>
              Manage job applications and recruiting pipeline
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Open Positions Overview */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            🎯 Open Positions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {positions.map((position) => (
              <div
                key={position.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {position.title}
                  </h4>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: `${getUrgencyColor(position.urgency)}20`,
                    color: getUrgencyColor(position.urgency)
                  }}>
                    {position.urgency.toUpperCase()}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {position.department} • {position.openings} openings
                </p>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af'
                }}>
                  {position.requirements.slice(0, 2).join(', ')}
                  {position.requirements.length > 2 && '...'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb'
          }}>
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
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: activeTab === tab.key ? '#f3f4f6' : 'white',
                  color: activeTab === tab.key ? '#1f2937' : '#6b7280',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #3B82F6' : '2px solid transparent',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: activeTab === tab.key ? '#3B82F6' : '#e5e7eb',
                    color: activeTab === tab.key ? 'white' : '#6b7280',
                    borderRadius: '9999px',
                    fontSize: '0.75rem'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Applications List */}
          <div style={{ padding: '1.5rem' }}>
            {filteredApplications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <p>No applications in this category.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {application.applicantName}
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {application.position} • Applied {application.submissionDate}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: `${getPriorityColor(application.priority)}20`,
                          color: getPriorityColor(application.priority)
                        }}>
                          {application.priority.toUpperCase()}
                        </span>
                        <span style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: `${getStatusColor(application.status)}20`,
                          color: getStatusColor(application.status)
                        }}>
                          {application.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Contact</p>
                        <p style={{ fontSize: '0.875rem', color: '#1f2937' }}>{application.email}</p>
                        <p style={{ fontSize: '0.875rem', color: '#1f2937' }}>{application.phone}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Experience</p>
                        <p style={{ fontSize: '0.875rem', color: '#1f2937' }}>{application.experience}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Certifications</p>
                        <p style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                          {application.certifications.join(', ')}
                        </p>
                      </div>
                      {application.interviewDate && (
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Interview</p>
                          <p style={{ fontSize: '0.875rem', color: '#1f2937' }}>{application.interviewDate}</p>
                        </div>
                      )}
                      {application.backgroundCheckStatus && (
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Background Check</p>
                          <p style={{
                            fontSize: '0.875rem',
                            color: application.backgroundCheckStatus === 'cleared' ? '#10B981' :
                                   application.backgroundCheckStatus === 'flagged' ? '#EF4444' : '#F59E0B'
                          }}>
                            {application.backgroundCheckStatus.toUpperCase()}
                          </p>
                        </div>
                      )}
                    </div>

                    {application.notes && (
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#374151' }}>{application.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {application.status === 'new' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(application.id, 'reviewing')}
                            disabled={isProcessing}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#F59E0B',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: isProcessing ? 'not-allowed' : 'pointer'
                            }}
                          >
                            👁️ Start Review
                          </button>
                          <button
                            onClick={() => handleScheduleInterview(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#8B5CF6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            📅 Schedule Interview
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {application.status === 'reviewing' && (
                        <>
                          <button
                            onClick={() => handleScheduleInterview(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#8B5CF6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            📅 Schedule Interview
                          </button>
                          <button
                            onClick={() => handleBackgroundCheck(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#06B6D4',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            🔍 Background Check
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {application.status === 'interview_scheduled' && (
                        <>
                          <button
                            onClick={() => alert('📹 Starting video interview...')}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#8B5CF6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            📹 Join Interview
                          </button>
                          <button
                            onClick={() => handleBackgroundCheck(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#06B6D4',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            🔍 Background Check
                          </button>
                          <button
                            onClick={() => handleSendOffer(application)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            💼 Send Offer
                          </button>
                        </>
                      )}

                      {application.status === 'background_check' && (
                        <>
                          <button
                            onClick={() => alert('🔍 Background check details:\n\nProvider: Sterling Talent Solutions\nStatus: Pending\nExpected completion: 2-3 days')}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#06B6D4',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            🔍 Check Status
                          </button>
                          <button
                            onClick={() => handleSendOffer(application)}
                            disabled={application.backgroundCheckStatus !== 'cleared'}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: application.backgroundCheckStatus === 'cleared' ? '#10B981' : '#9ca3af',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: application.backgroundCheckStatus === 'cleared' ? 'pointer' : 'not-allowed'
                            }}
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
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          🎉 Mark as Hired
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedApplication(application)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'white',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📄 View Full Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Compliance Notice */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginTop: '2rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#0284c7',
            marginBottom: '0.5rem'
          }}>
            🛡️ HIPAA & Employment Compliance
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#0c4a6e'
          }}>
            All background checks include HIPAA training verification. Credentials and certifications are validated through primary sources before hire.
          </p>
        </div>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  Application Details - {selectedApplication.applicantName}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '50%',
                    width: '2rem',
                    height: '2rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Personal Information */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Personal Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div><strong>Full Name:</strong> {selectedApplication.applicantName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                    <div><strong>Location:</strong> {selectedApplication.location}</div>
                    <div><strong>Date of Birth:</strong> March 15, 1985</div>
                    <div><strong>SSN:</strong> ***-**-{Math.floor(Math.random() * 9000) + 1000}</div>
                  </div>
                </div>

                {/* Position & Experience */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #bae6fd'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Position & Experience
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
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
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Certifications & Skills
                  </h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Current Certifications:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedApplication.certifications.map((cert, index) => (
                        <span key={index} style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Core Skills:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedApplication.skills.map((skill, index) => (
                        <span key={index} style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0c4a6e',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Application Status & History */}
                <div style={{
                  backgroundColor: '#fefce8',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #fef08a'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Application Status & Timeline
                  </h3>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div><strong>Current Status:</strong>
                      <span style={{
                        backgroundColor: `${getStatusColor(selectedApplication.status)}20`,
                        color: getStatusColor(selectedApplication.status),
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        marginLeft: '0.5rem'
                      }}>
                        {selectedApplication.status.replace('_', ' ').toUpperCase()}
                      </span>
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
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Professional References
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>Dr. Sarah Mitchell, RN Supervisor</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Columbus Regional Medical Center • (614) 555-0901</p>
                      <p style={{ fontSize: '0.75rem', color: '#059669' }}>✓ Reference verified - Excellent work ethic and patient care</p>
                    </div>
                    <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>James Rodriguez, Department Manager</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Home Care Solutions • (614) 555-0902</p>
                      <p style={{ fontSize: '0.75rem', color: '#059669' }}>✓ Reference verified - Highly recommended for home health role</p>
                    </div>
                  </div>
                </div>

                {/* Notes & Comments */}
                <div style={{
                  backgroundColor: '#fff7ed',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #fed7aa'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Interview Notes & Comments
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#9a3412' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>HR Notes:</strong> Strong candidate with excellent references. Patient care experience in both hospital and home settings. Shows genuine interest in home health mission.
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Interview Feedback:</strong> Articulate communicator, demonstrates empathy and professionalism. Asked thoughtful questions about patient population and care protocols.
                    </p>
                    <p>
                      <strong>Next Steps:</strong> Recommend for background check and reference verification. Strong candidate for immediate hire upon clearance.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                {selectedApplication.status === 'new' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedApplication(null);
                        handleStatusChange(selectedApplication.id, 'reviewing');
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Move to Review
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApplication(null);
                        handleRejectApplication(selectedApplication);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
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
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    📅 Schedule Interview
                  </button>
                )}
                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
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