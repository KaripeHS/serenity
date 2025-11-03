import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ClinicalMetrics {
  activePatients: number;
  criticalAlerts: number;
  medicationCompliance: number;
  vitalSignsUpdated: number;
  careplanReviews: number;
  admissionsToday: number;
}

export function WorkingClinicalDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<ClinicalMetrics | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        activePatients: 847,
        criticalAlerts: 5,
        medicationCompliance: 96.8,
        vitalSignsUpdated: 523,
        careplanReviews: 18,
        admissionsToday: 7
      });
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

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
          <p style={{ color: '#6b7280' }}>Loading Clinical Dashboard...</p>
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
              Clinical Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>
              Patient care monitoring, clinical alerts, and care plan management
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Critical Alerts Banner */}
        {metrics.criticalAlerts > 0 && (
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
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#dc2626',
                    margin: 0
                  }}>
                    {metrics.criticalAlerts} Critical Clinical Alerts
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                    Immediate attention required
                  </p>
                </div>
              </div>
              <button style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                View Alerts
              </button>
            </div>
          </div>
        )}

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
              Active Patients
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {metrics.activePatients}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              ❤️ All monitored
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
              Medication Compliance
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {metrics.medicationCompliance}%
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              Above target (95%)
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
            Vital Signs Updated
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              {metrics.vitalSignsUpdated}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
              Today's recordings
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
              Care Plan Reviews
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#7c3aed'
            }}>
              {metrics.careplanReviews}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#7c3aed' }}>
              Pending this week
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
              New Admissions
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {metrics.admissionsToday}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Today
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
              Critical Alerts
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: metrics.criticalAlerts > 3 ? '#dc2626' : '#f59e0b'
            }}>
              {metrics.criticalAlerts}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
              Require attention
            </p>
          </div>
        </div>

        {/* Patient Management Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
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
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              High Priority Patients
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                      Eleanor Johnson (89)
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Post-surgical wound care • Columbus
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem'
                  }}>
                    Critical
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>
                  ⚠️ Infection risk - Daily monitoring required
                </p>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '0.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                      Robert Smith (76)
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Diabetes management • Dublin
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem'
                  }}>
                    Monitor
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem' }}>
                  📊 Blood sugar trending high
                </p>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                      Mary Williams (82)
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Medication management • Westerville
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem'
                  }}>
                    Review
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.5rem' }}>
                  📅 Care plan review due tomorrow
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
              Clinical Tasks Today
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.25rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                    🩺 Wound Assessments
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    23 patients scheduled
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  18/23
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.25rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                    💊 Medication Reviews
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    15 patients scheduled
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  15/15
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.25rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                    📋 Care Plan Updates
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    8 patients scheduled
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  3/8
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
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
            Clinical Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              🚨 View Critical Alerts
            </button>
            <button style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📊 Vital Signs Report
            </button>
            <button style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              💊 Medication Adherence
            </button>
            <button style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📋 Care Plan Builder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}