import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TrainingMetrics {
  totalStaff: number;
  complianceRate: number;
  expiringSoon: number;
  overdue: number;
  coursesAvailable: number;
  hoursCompleted: number;
}

export function WorkingTrainingDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'compliance' | 'courses' | 'schedule' | 'certificates' | 'reports'>('dashboard');

  const [staffTraining, _setStaffTraining] = useState([
    {
      id: 1,
      name: 'Maria Rodriguez',
      position: 'Senior Caregiver',
      certifications: [
        { name: 'CPR', status: 'expires_soon', expiryDate: '2025-02-15', daysLeft: 26 },
        { name: 'First Aid', status: 'current', expiryDate: '2025-08-20', daysLeft: 186 },
        { name: 'CNA', status: 'current', expiryDate: '2026-03-10', daysLeft: 384 }
      ],
      completedHours: 24,
      requiredHours: 32
    },
    {
      id: 2,
      name: 'David Chen',
      position: 'Physical Therapist',
      certifications: [
        { name: 'PT License', status: 'current', expiryDate: '2025-12-31', daysLeft: 345 },
        { name: 'CPR', status: 'overdue', expiryDate: '2024-12-15', daysLeft: -36 },
        { name: 'Wound Care', status: 'current', expiryDate: '2025-06-30', daysLeft: 131 }
      ],
      completedHours: 18,
      requiredHours: 40
    },
    {
      id: 3,
      name: 'Jennifer Miller',
      position: 'Registered Nurse',
      certifications: [
        { name: 'RN License', status: 'current', expiryDate: '2025-09-15', daysLeft: 238 },
        { name: 'BLS', status: 'expires_soon', expiryDate: '2025-02-28', daysLeft: 39 },
        { name: 'HIPAA', status: 'current', expiryDate: '2025-07-01', daysLeft: 162 }
      ],
      completedHours: 28,
      requiredHours: 30
    },
    {
      id: 4,
      name: 'Robert Thompson',
      position: 'Home Health Aide',
      certifications: [
        { name: 'HHA Certification', status: 'current', expiryDate: '2025-11-20', daysLeft: 295 },
        { name: 'CPR', status: 'overdue', expiryDate: '2024-11-30', daysLeft: -51 },
        { name: 'Medication Admin', status: 'expires_soon', expiryDate: '2025-03-15', daysLeft: 54 }
      ],
      completedHours: 12,
      requiredHours: 24
    }
  ]);

  const [availableCourses, setAvailableCourses] = useState([
    {
      id: 1,
      title: 'CPR/AED Certification Renewal',
      provider: 'American Red Cross',
      duration: 4,
      format: 'In-Person',
      nextDate: '2025-01-25',
      spots: 12,
      enrolled: 8,
      cost: 65,
      description: 'Adult, child, and infant CPR with AED training'
    },
    {
      id: 2,
      title: 'Advanced Wound Care Management',
      provider: 'WoundSource',
      duration: 8,
      format: 'Online',
      nextDate: '2025-02-01',
      spots: 25,
      enrolled: 15,
      cost: 125,
      description: 'Advanced techniques for complex wound assessment and treatment'
    },
    {
      id: 3,
      title: 'HIPAA Privacy & Security Update 2025',
      provider: 'HIPAA One',
      duration: 2,
      format: 'Online',
      nextDate: '2025-01-30',
      spots: 50,
      enrolled: 32,
      cost: 35,
      description: 'Latest updates to HIPAA requirements and best practices'
    },
    {
      id: 4,
      title: 'Dementia Care Specialized Training',
      provider: 'Alzheimer\'s Association',
      duration: 12,
      format: 'Hybrid',
      nextDate: '2025-02-10',
      spots: 20,
      enrolled: 6,
      cost: 180,
      description: 'Comprehensive dementia care strategies and communication techniques'
    },
    {
      id: 5,
      title: 'Emergency Response Procedures',
      provider: 'Serenity ERP Internal',
      duration: 3,
      format: 'In-Person',
      nextDate: '2025-01-28',
      spots: 30,
      enrolled: 22,
      cost: 0,
      description: 'Internal emergency procedures and crisis management protocols'
    }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        totalStaff: 156,
        complianceRate: 87.2,
        expiringSoon: 12,
        overdue: 8,
        coursesAvailable: 25,
        hoursCompleted: 1840
      });
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  const getCertificationStatusColor = (status: string) => {
    switch (status) {
      case 'current': return { bg: '#dcfce7', text: '#166534' };
      case 'expires_soon': return { bg: '#fef3c7', text: '#92400e' };
      case 'overdue': return { bg: '#fecaca', text: '#dc2626' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const handleEnrollStaff = (courseId: number) => {
    setAvailableCourses(prev => prev.map(course =>
      course.id === courseId
        ? { ...course, enrolled: Math.min(course.enrolled + 1, course.spots) }
        : course
    ));
    alert(`Staff enrolled in course ID ${courseId}`);
  };

  const handleSendReminder = (staffId: number) => {
    alert(`Training reminder sent to staff member ID ${staffId}`);
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
          <p style={{ color: '#6b7280' }}>Loading Training Dashboard...</p>
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
              Training & Compliance Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>
              Staff certification tracking, course management, and compliance monitoring
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Critical Training Alerts */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  margin: 0
                }}>
                  {metrics.overdue} Staff with Overdue Certifications
                </p>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                  {metrics.expiringSoon} additional certifications expire within 30 days
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('compliance')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Review Compliance
            </button>
          </div>
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
              { key: 'compliance', label: '⚠️ Compliance', count: metrics.overdue + metrics.expiringSoon },
              { key: 'courses', label: '📚 Courses', count: availableCourses.length },
              { key: 'schedule', label: '📅 Schedule', count: null },
              { key: 'certificates', label: '🏆 Certificates', count: null },
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
                {tab.count !== null && tab.count > 0 && (
                  <span style={{
                    backgroundColor: activeView === tab.key ? 'rgba(255,255,255,0.2)' : '#dc2626',
                    color: 'white',
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

        {/* Dashboard View */}
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
                  Overall Compliance Rate
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: metrics.complianceRate >= 90 ? '#059669' : metrics.complianceRate >= 80 ? '#f59e0b' : '#dc2626'
                }}>
                  {metrics.complianceRate}%
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Target: 95%
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
                  Certifications Expiring
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#f59e0b'
                }}>
                  {metrics.expiringSoon}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                  Next 30 days
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
                  Overdue Certifications
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  {metrics.overdue}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                  Immediate action required
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
                  Training Hours YTD
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  {metrics.hoursCompleted}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
                  11.8 avg per staff
                </p>
              </div>
            </div>

            {/* Upcoming Training */}
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
                Upcoming Training Sessions
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {availableCourses.slice(0, 3).map((course) => (
                  <div key={course.id} style={{
                    padding: '1rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '0.5rem',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {course.title}
                      </h4>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#0284c7',
                        backgroundColor: '#e0f2fe',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px'
                      }}>
                        {course.format}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {course.duration} hours • {new Date(course.nextDate).toLocaleDateString()}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                      {course.enrolled}/{course.spots} enrolled
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Compliance View */}
        {activeView === 'compliance' && (
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
              Staff Certification Compliance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {staffTraining.map((staff) => (
                <div key={staff.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '1rem'
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
                        {staff.position}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Training Progress: {staff.completedHours}/{staff.requiredHours} hours
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendReminder(staff.id)}
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
                      📧 Send Reminder
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem'
                  }}>
                    {staff.certifications.map((cert, index) => {
                      const statusColors = getCertificationStatusColor(cert.status);
                      return (
                        <div key={index} style={{
                          padding: '0.5rem',
                          backgroundColor: statusColors.bg,
                          borderRadius: '0.25rem',
                          border: `1px solid ${statusColors.bg}`
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              color: statusColors.text
                            }}>
                              {cert.name}
                            </span>
                            <span style={{
                              fontSize: '0.625rem',
                              color: statusColors.text
                            }}>
                              {cert.status === 'overdue'
                                ? `${Math.abs(cert.daysLeft)} days overdue`
                                : `${cert.daysLeft} days left`
                              }
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.625rem',
                            color: statusColors.text,
                            marginTop: '0.25rem'
                          }}>
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses View */}
        {activeView === 'courses' && (
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
              Available Training Courses
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {availableCourses.map((course) => (
                <div key={course.id} style={{
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
                        {course.title}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {course.provider} • {course.duration} hours • {course.format}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {course.description}
                      </p>
                    </div>
                    <span style={{
                      backgroundColor: course.format === 'Online' ? '#dbeafe' : course.format === 'In-Person' ? '#fef3c7' : '#e0e7ff',
                      color: course.format === 'Online' ? '#1e40af' : course.format === 'In-Person' ? '#92400e' : '#3730a3',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {course.format}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span>📅 {new Date(course.nextDate).toLocaleDateString()}</span>
                      <span>👥 {course.enrolled}/{course.spots} enrolled</span>
                      <span>💰 ${course.cost === 0 ? 'Free' : course.cost}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEnrollStaff(course.id)}
                      disabled={course.enrolled >= course.spots}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: course.enrolled >= course.spots ? '#9ca3af' : '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: course.enrolled >= course.spots ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {course.enrolled >= course.spots ? '✓ Full' : '➕ Enroll Staff'}
                    </button>
                    <button
                      onClick={() => alert(`Viewing details for ${course.title}`)}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}