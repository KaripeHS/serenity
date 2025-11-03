import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface OperationsMetrics {
  dailyVisits: number;
  completedVisits: number;
  avgTravelTime: number;
  efficiency: number;
  lateVisits: number;
  caregiverUtilization: number;
}

export function WorkingOperationsDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        dailyVisits: 127,
        completedVisits: 119,
        avgTravelTime: 18.5,
        efficiency: 87.3,
        lateVisits: 3,
        caregiverUtilization: 82.1
      });
    }, 900);

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
          <p style={{ color: '#6b7280' }}>Loading Operations Dashboard...</p>
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
              Operations Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>
              Scheduling, routing, and operational efficiency tracking
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

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
              Today's Visits
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {metrics.dailyVisits}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              +8% vs yesterday
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
              Completed
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {metrics.completedVisits}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              {Math.round((metrics.completedVisits / metrics.dailyVisits) * 100)}% completion rate
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
              Avg Travel Time
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              {metrics.avgTravelTime}m
            </p>
            <p style={{ fontSize: '0.875rem', color: '#059669' }}>
              -2.3m improved
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
              Efficiency Score
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {metrics.efficiency}%
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
              Late Visits
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: metrics.lateVisits > 5 ? '#dc2626' : '#f59e0b'
            }}>
              {metrics.lateVisits}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Need attention
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
              Caregiver Utilization
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {metrics.caregiverUtilization}%
            </p>
            <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
              Optimal range
            </p>
          </div>
        </div>

        {/* AI Optimization Section */}
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
            🤖 AI Schedule Optimization
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.25rem'
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#0284c7',
                marginBottom: '0.5rem'
              }}>
                Route Optimization Available
              </p>
              <p style={{ fontSize: '0.875rem', color: '#0c4a6e', marginBottom: '0.5rem' }}>
                Reorganize 5 visits to save 32 minutes of travel time
              </p>
              <button style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}>
                Apply Optimization
              </button>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.25rem'
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#059669',
                marginBottom: '0.5rem'
              }}>
                Caregiver Match Suggestion
              </p>
              <p style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem' }}>
                Maria Rodriguez is a better skill match for Patient #847
              </p>
              <button style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}>
                Review Match
              </button>
            </div>
          </div>
        </div>

        {/* Current Operations */}
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
              Active Caregivers
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
                    Maria Rodriguez
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Columbus - 3/4 visits completed
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  On Track
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
                    David Chen
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Dublin - 2/3 visits completed
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  15min Late
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
                    Jennifer Miller
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Westerville - 4/4 visits completed
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  Complete
                </span>
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
              Operational Alerts
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
                  Emergency Coverage Needed
                </p>
                <p style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                  Caregiver called in sick - Patient Eleanor Johnson needs coverage at 2 PM
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
                  Traffic Delays
                </p>
                <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  I-270 construction causing 20-minute delays on north routes
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
                  Equipment Check
                </p>
                <p style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>
                  3 medical devices due for maintenance this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}