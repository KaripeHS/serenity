import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ComplianceMetrics {
  hipaaComplianceScore: number;
  activeAudits: number;
  expiredCertifications: number;
  pendingTrainings: number;
  securityIncidents: number;
  dataBreaches: number;
}

export function WorkingComplianceDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'hipaa' | 'audits' | 'training' | 'incidents' | 'reports'>('dashboard');
  const [complianceItems, setComplianceItems] = useState([
    { id: 'HIPAA001', type: 'HIPAA', description: 'Annual HIPAA Risk Assessment', status: 'completed', dueDate: '2024-12-31', priority: 'high' },
    { id: 'CERT002', type: 'Certification', description: 'CPR Certification - Maria Rodriguez', status: 'expired', dueDate: '2024-01-15', priority: 'critical' },
    { id: 'TRAIN003', type: 'Training', description: 'HIPAA Privacy Training - New Hires', status: 'pending', dueDate: '2024-01-20', priority: 'medium' },
    { id: 'AUDIT004', type: 'Audit', description: 'Q1 Internal Compliance Audit', status: 'in_progress', dueDate: '2024-03-31', priority: 'high' },
    { id: 'SEC005', type: 'Security', description: 'Password Policy Compliance Check', status: 'overdue', dueDate: '2024-01-10', priority: 'critical' }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        hipaaComplianceScore: 87.5,
        activeAudits: 3,
        expiredCertifications: 8,
        pendingTrainings: 12,
        securityIncidents: 0,
        dataBreaches: 0
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleComplianceAction = (itemId: string, action: string) => {
    setComplianceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        switch (action) {
          case 'complete':
            return { ...item, status: 'completed' };
          case 'schedule':
            return { ...item, status: 'scheduled' };
          case 'extend':
            return { ...item, dueDate: '2024-02-15' };
          default:
            return item;
        }
      }
      return item;
    }));
    alert(`Compliance item ${itemId} ${action} completed`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', text: '#166534' };
      case 'in_progress': return { bg: '#dbeafe', text: '#1e40af' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'overdue': return { bg: '#fecaca', text: '#dc2626' };
      case 'expired': return { bg: '#fecaca', text: '#dc2626' };
      case 'scheduled': return { bg: '#e0e7ff', text: '#3730a3' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: '#dc2626', text: 'white' };
      case 'high': return { bg: '#f59e0b', text: 'white' };
      case 'medium': return { bg: '#3b82f6', text: 'white' };
      case 'low': return { bg: '#6b7280', text: 'white' };
      default: return { bg: '#6b7280', text: 'white' };
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
          <p style={{ color: '#6b7280' }}>Loading Compliance Dashboard...</p>
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
              Compliance & Security Management
            </h1>
            <p style={{ color: '#6b7280' }}>
              HIPAA compliance, audit management, and regulatory oversight
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Critical Alerts */}
        {(metrics.expiredCertifications > 0 || metrics.securityIncidents > 0) && (
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
                    Critical Compliance Issues Detected
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                    {metrics.expiredCertifications} expired certifications, {metrics.securityIncidents} security incidents
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
                Review Immediately
              </button>
            </div>
          </div>
        )}

        {/* HIPAA Compliance Score */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              🛡️ HIPAA Compliance Score
            </h3>
            <span style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: metrics.hipaaComplianceScore >= 85 ? '#059669' : metrics.hipaaComplianceScore >= 70 ? '#f59e0b' : '#dc2626'
            }}>
              {metrics.hipaaComplianceScore}%
            </span>
          </div>
          <div style={{
            width: '100%',
            backgroundColor: '#e5e7eb',
            borderRadius: '9999px',
            height: '8px',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: `${metrics.hipaaComplianceScore}%`,
              backgroundColor: metrics.hipaaComplianceScore >= 85 ? '#059669' : metrics.hipaaComplianceScore >= 70 ? '#f59e0b' : '#dc2626',
              height: '100%',
              borderRadius: '9999px'
            }}></div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Target: 85% minimum for full compliance
          </p>
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
              { key: 'hipaa', label: '🛡️ HIPAA', count: null },
              { key: 'audits', label: '📋 Audits', count: metrics.activeAudits },
              { key: 'training', label: '🎓 Training', count: metrics.pendingTrainings },
              { key: 'incidents', label: '⚠️ Incidents', count: metrics.securityIncidents },
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
                  Active Audits
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  {metrics.activeAudits}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
                  In progress
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
                  Expired Certifications
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  {metrics.expiredCertifications}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                  Need renewal
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
                  Pending Trainings
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#f59e0b'
                }}>
                  {metrics.pendingTrainings}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                  Staff members
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
                  Security Incidents
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: metrics.securityIncidents === 0 ? '#059669' : '#dc2626'
                }}>
                  {metrics.securityIncidents}
                </p>
                <p style={{ fontSize: '0.875rem', color: metrics.securityIncidents === 0 ? '#059669' : '#dc2626' }}>
                  This month
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
                  Data Breaches
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: metrics.dataBreaches === 0 ? '#059669' : '#dc2626'
                }}>
                  {metrics.dataBreaches}
                </p>
                <p style={{ fontSize: '0.875rem', color: metrics.dataBreaches === 0 ? '#059669' : '#dc2626' }}>
                  {metrics.dataBreaches === 0 ? 'Secure' : 'Critical'}
                </p>
              </div>
            </div>

            {/* Compliance Items */}
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
                Compliance Items Requiring Attention
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {complianceItems.filter(item => item.status !== 'completed').map((item) => {
                  const statusColors = getStatusColor(item.status);
                  const priorityColors = getPriorityColor(item.priority);
                  return (
                    <div key={item.id} style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      backgroundColor: item.status === 'overdue' || item.status === 'expired' ? '#fef2f2' : '#f9fafb'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4 style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#1f2937'
                            }}>
                              {item.description}
                            </h4>
                            <span style={{
                              backgroundColor: priorityColors.bg,
                              color: priorityColors.text,
                              padding: '0.125rem 0.375rem',
                              borderRadius: '9999px',
                              fontSize: '0.625rem',
                              fontWeight: '500'
                            }}>
                              {item.priority}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            {item.type} • Due: {item.dueDate}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            ID: {item.id}
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
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {(item.status === 'pending' || item.status === 'overdue') && (
                          <button
                            onClick={() => handleComplianceAction(item.id, 'complete')}
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
                            ✓ Mark Complete
                          </button>
                        )}
                        {item.status === 'expired' && (
                          <>
                            <button
                              onClick={() => handleComplianceAction(item.id, 'schedule')}
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
                              📅 Schedule Renewal
                            </button>
                            <button
                              onClick={() => handleComplianceAction(item.id, 'extend')}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              ⏰ Request Extension
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => alert(`Viewing details for ${item.id}`)}
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
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}