import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HRMetrics {
  totalStaff: number;
  openPositions: number;
  pendingApplications: number;
  trainingCompliance: number;
  avgTimeToHire: number;
  turnoverRate: number;
}

export function WorkingHRDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'applications' | 'interviews' | 'training' | 'reports' | 'staff'>('dashboard');
  const [applications, setApplications] = useState([
    { id: 1, name: 'Sarah Chen', position: 'Registered Nurse', status: 'new', experience: '5 years', location: 'Columbus, OH', applied: '2 hours ago', email: 'sarah.chen@email.com', phone: '(614) 555-0123', salary: '$65,000' },
    { id: 2, name: 'Michael Johnson', position: 'Physical Therapist', status: 'reviewing', experience: '8 years', location: 'Dublin, OH', applied: '4 hours ago', email: 'mjohnson@email.com', phone: '(614) 555-0456', salary: '$75,000' },
    { id: 3, name: 'Lisa Rodriguez', position: 'Home Health Aide', status: 'interview', experience: '3 years', location: 'Westerville, OH', applied: 'yesterday', email: 'lrodriguez@email.com', phone: '(614) 555-0789', salary: '$35,000' },
    { id: 4, name: 'David Park', position: 'Occupational Therapist', status: 'new', experience: '6 years', location: 'Powell, OH', applied: '2 days ago', email: 'dpark@email.com', phone: '(614) 555-0321', salary: '$70,000' },
    { id: 5, name: 'Jennifer Williams', position: 'Social Worker', status: 'reviewing', experience: '4 years', location: 'Hilliard, OH', applied: '3 days ago', email: 'jwilliams@email.com', phone: '(614) 555-0654', salary: '$55,000' }
  ]);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Maria Rodriguez', position: 'Senior Caregiver', department: 'Clinical', hireDate: '2021-03-15', certifications: ['CNA', 'CPR'], trainingDue: [] },
    { id: 2, name: 'David Chen', position: 'Physical Therapist', department: 'Therapy', hireDate: '2020-08-22', certifications: ['PT', 'CPR'], trainingDue: ['CPR Renewal'] },
    { id: 3, name: 'Jennifer Miller', position: 'Registered Nurse', department: 'Clinical', hireDate: '2019-11-10', certifications: ['RN', 'BLS'], trainingDue: ['HIPAA Update'] },
    { id: 4, name: 'Robert Thompson', position: 'Home Health Aide', department: 'Care', hireDate: '2022-01-05', certifications: ['HHA'], trainingDue: ['CPR Renewal', 'First Aid'] }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        totalStaff: 156,
        openPositions: 12,
        pendingApplications: 28,
        trainingCompliance: 94.5,
        avgTimeToHire: 18,
        turnoverRate: 8.2
      });
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleApplicationAction = (applicationId: number, action: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        switch (action) {
          case 'approve':
            return { ...app, status: 'interview' };
          case 'reject':
            return { ...app, status: 'rejected' };
          case 'schedule':
            return { ...app, status: 'scheduled' };
          default:
            return app;
        }
      }
      return app;
    }));

    // Show confirmation
    alert(`Application ${action}d for ${applications.find(app => app.id === applicationId)?.name}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return { bg: '#dbeafe', text: '#1e40af' };
      case 'reviewing': return { bg: '#fef3c7', text: '#92400e' };
      case 'interview': return { bg: '#dcfce7', text: '#166534' };
      case 'scheduled': return { bg: '#e0e7ff', text: '#3730a3' };
      case 'rejected': return { bg: '#fecaca', text: '#dc2626' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  if (!metrics) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              Human Resources Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>
              Staff management, recruitment, and compliance tracking
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard', count: null },
              { key: 'applications', label: '📝 Applications', count: applications.filter(app => app.status === 'new').length },
              { key: 'interviews', label: '🗣️ Interviews', count: applications.filter(app => app.status === 'interview').length },
              { key: 'staff', label: '👥 Staff', count: staffList.filter(staff => staff.trainingDue.length > 0).length },
              { key: 'training', label: '🎓 Training', count: 8 },
              { key: 'reports', label: '📈 Reports', count: null }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: activeView === tab.key ? '#2563eb' : 'transparent',
                  color: activeView === tab.key ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
                {tab.count !== null && (
                  <span style={{
                    backgroundColor: activeView === tab.key ? 'rgba(255,255,255,0.2)' : '#dc2626',
                    color: activeView === tab.key ? 'white' : 'white',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'dashboard' && (
          <>
            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Total Staff
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {metrics.totalStaff}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              +3 this month
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Open Positions
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#dc2626'
            }}>
              {metrics.openPositions}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
              Need urgent filling
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Pending Applications
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              {metrics.pendingApplications}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
              Awaiting review
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Training Compliance
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {metrics.trainingCompliance}%
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              Above target
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Avg Time to Hire
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {metrics.avgTimeToHire} days
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              -2 days improved
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Turnover Rate
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {metrics.turnoverRate}%
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              Below industry avg
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => setActiveView('applications')}
              style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📝 Review Applications ({applications.filter(app => app.status === 'new').length})
            </button>
            <button
              onClick={() => setActiveView('interviews')}
              style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📋 Schedule Interviews ({applications.filter(app => app.status === 'interview').length})
            </button>
            <button
              onClick={() => setActiveView('training')}
              style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              🎓 Training Reminders (8 due)
            </button>
            <button
              onClick={() => setActiveView('reports')}
              style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📊 Generate Report
            </button>
          </div>
        </div>

        {/* Recent Activity and Urgent Items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Recent Applications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.25rem',
                borderLeft: '4px solid #2563eb'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                  Sarah Chen - Registered Nurse
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Applied 2 hours ago • Columbus, OH
                </p>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.25rem',
                borderLeft: '4px solid #059669'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                  Michael Johnson - Physical Therapist
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Applied 4 hours ago • Dublin, OH
                </p>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.25rem',
                borderLeft: '4px solid #7c3aed'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                  Lisa Rodriguez - Home Health Aide
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Applied yesterday • Westerville, OH
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Urgent HR Items
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.25rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#dc2626',
                  marginBottom: '0.25rem'
                }}>
                  Training Renewals Due
                </p>
                <p style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                  8 staff members need CPR renewal by Friday
                </p>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '0.25rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#d97706',
                  marginBottom: '0.25rem'
                }}>
                  Open Positions Critical
                </p>
                <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  3 RN positions urgently needed in Columbus area
                </p>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.25rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#0284c7',
                  marginBottom: '0.25rem'
                }}>
                  Performance Reviews
                </p>
                <p style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>
                  12 quarterly reviews scheduled this week
                </p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Applications View */}
        {activeView === 'applications' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Job Applications Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((app) => {
                const statusColors = getStatusColor(app.status);
                return (
                  <div key={app.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {app.name}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          {app.position} • {app.experience} experience
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          📍 {app.location} • Applied {app.applied}
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {app.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {app.status === 'new' && (
                        <>
                          <button
                            onClick={() => handleApplicationAction(app.id, 'approve')}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#059669',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Move to Interview
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.id, 'reject')}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {app.status === 'interview' && (
                        <button
                          onClick={() => handleApplicationAction(app.id, 'schedule')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          📅 Schedule Interview
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedApplication(selectedApplication === app.id ? null : app.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ View Details
                      </button>
                    </div>
                    {selectedApplication === app.id && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderRadius: '0.25rem',
                        border: '1px solid #d1d5db'
                      }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Application Details
                        </h5>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          <strong>Experience:</strong> {app.experience} in healthcare
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          <strong>Location Preference:</strong> {app.location}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          <strong>Email:</strong> {app.email}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          <strong>Phone:</strong> {app.phone}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          <strong>Expected Salary:</strong> {app.salary}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          <strong>Availability:</strong> Full-time, immediate start
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Training View */}
        {activeView === 'training' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Training & Compliance Management
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
                  🚨 Urgent Training Renewals (8 staff)
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#7f1d1d', marginBottom: '0.75rem' }}>
                  CPR certification expires this Friday for 8 staff members
                </p>
                <button
                  onClick={() => alert('Training renewal notifications sent to all affected staff')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  📧 Send Renewal Reminders
                </button>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.5rem' }}>
                  📚 Available Training Courses
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { name: 'Advanced Wound Care', duration: '4 hours', available: 'Next Tuesday' },
                    { name: 'HIPAA Compliance Update', duration: '2 hours', available: 'Online' },
                    { name: 'Emergency Response', duration: '6 hours', available: 'This Friday' }
                  ].map((course, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: 'white',
                      borderRadius: '0.25rem'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#1f2937' }}>{course.name}</p>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280' }}>{course.duration} • {course.available}</p>
                      </div>
                      <button
                        onClick={() => alert(`Enrolled staff in ${course.name}`)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          cursor: 'pointer'
                        }}
                      >
                        Enroll Staff
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports View */}
        {activeView === 'reports' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              HR Reports & Analytics
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {[
                { title: 'Monthly Hiring Report', description: 'Recruitment metrics and trends', icon: '📊' },
                { title: 'Training Compliance Report', description: 'Staff certification status', icon: '🎓' },
                { title: 'Turnover Analysis', description: 'Staff retention insights', icon: '📈' },
                { title: 'Performance Review Summary', description: 'Quarterly evaluation results', icon: '⭐' }
              ].map((report, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{report.icon}</span>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                      {report.title}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                    {report.description}
                  </p>
                  <button
                    onClick={() => alert(`Generating ${report.title}...`)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Generate Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interviews View */}
        {activeView === 'interviews' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Interview Scheduling & Management
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.filter(app => app.status === 'interview' || app.status === 'scheduled').map((app) => (
                <div key={app.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                        {app.name} - {app.position}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {app.location} • {app.experience} experience
                      </p>
                    </div>
                    <span style={{
                      backgroundColor: app.status === 'scheduled' ? '#dcfce7' : '#fef3c7',
                      color: app.status === 'scheduled' ? '#166534' : '#92400e',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem'
                    }}>
                      {app.status === 'scheduled' ? 'Scheduled' : 'Needs Scheduling'}
                    </span>
                  </div>
                  {app.status === 'interview' ? (
                    <button
                      onClick={() => handleApplicationAction(app.id, 'schedule')}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      📅 Schedule Interview
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                      ✓ Interview scheduled for next Tuesday at 2:00 PM
                    </div>
                  )}
                </div>
              ))}

              {applications.filter(app => app.status === 'interview' || app.status === 'scheduled').length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <p>No interviews currently scheduled</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff Management View */}
        {activeView === 'staff' && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Staff Management & Directory
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {staffList.map((staff) => (
                <div key={staff.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: staff.trainingDue.length > 0 ? '#fefbf2' : '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {staff.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {staff.position} • {staff.department} Department
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        📅 Hired: {new Date(staff.hireDate).toLocaleDateString()}
                      </p>
                    </div>
                    {staff.trainingDue.length > 0 && (
                      <span style={{
                        backgroundColor: '#fbbf24',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        Training Due
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                      Current Certifications:
                    </p>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {staff.certifications.map((cert, index) => (
                        <span key={index} style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '9999px',
                          fontSize: '0.625rem',
                          fontWeight: '500'
                        }}>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {staff.trainingDue.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#dc2626', marginBottom: '0.25rem' }}>
                        Training Due:
                      </p>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {staff.trainingDue.map((training, index) => (
                          <span key={index} style={{
                            backgroundColor: '#fecaca',
                            color: '#dc2626',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '9999px',
                            fontSize: '0.625rem',
                            fontWeight: '500'
                          }}>
                            {training}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => alert(`Viewing full profile for ${staff.name}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      👁️ View Profile
                    </button>
                    <button
                      onClick={() => alert(`Editing ${staff.name}'s information`)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit Info
                    </button>
                    {staff.trainingDue.length > 0 && (
                      <button
                        onClick={() => {
                          setStaffList(prev => prev.map(s =>
                            s.id === staff.id
                              ? { ...s, trainingDue: [] }
                              : s
                          ));
                          alert(`Training reminders sent to ${staff.name}`);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        📧 Send Training Reminder
                      </button>
                    )}
                    <button
                      onClick={() => alert(`Creating performance review for ${staff.name}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      📋 Performance Review
                    </button>
                  </div>
                </div>
              ))}

              <div style={{
                padding: '1rem',
                border: '2px dashed #d1d5db',
                borderRadius: '0.5rem',
                textAlign: 'center',
                backgroundColor: '#f9fafb'
              }}>
                <button
                  onClick={() => alert('Opening new staff registration form')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add New Staff Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}