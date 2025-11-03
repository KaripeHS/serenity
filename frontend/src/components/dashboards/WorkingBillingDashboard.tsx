import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface BillingMetrics {
  totalClaims: number;
  pendingClaims: number;
  deniedClaims: number;
  revenueMonth: number;
  collectionRate: number;
  avgPaymentTime: number;
}

export function WorkingBillingDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'claims' | 'denials' | 'payments' | 'reports'>('dashboard');
  const [claimDetailsModal, setClaimDetailsModal] = useState<string | null>(null);
  const [claims, setClaims] = useState([
    {
      id: 'CLM001',
      patient: 'Eleanor Johnson',
      service: 'Personal Care',
      amount: 245.50,
      status: 'pending',
      date: '2024-01-15',
      insurance: 'Medicare',
      serviceDate: '2024-01-10',
      providerId: 'PR001',
      providerName: 'Maria Rodriguez',
      patientDOB: '1934-11-23',
      patientID: 'PAT001',
      diagnosisCodes: ['Z51.11', 'E11.9'],
      procedureCodes: ['99505', '99509'],
      authorizationNumber: 'AUTH-2024-001234',
      submissionDate: '2024-01-15',
      evvCompliant: true,
      documentation: ['Care Plan', 'Progress Notes', 'EVV Records']
    },
    {
      id: 'CLM002',
      patient: 'Robert Smith',
      service: 'Physical Therapy',
      amount: 380.00,
      status: 'approved',
      date: '2024-01-14',
      insurance: 'Medicaid',
      serviceDate: '2024-01-09',
      providerId: 'PR002',
      providerName: 'David Chen',
      patientDOB: '1947-03-15',
      patientID: 'PAT002',
      diagnosisCodes: ['I69.351', 'M25.50'],
      procedureCodes: ['97110', '97112'],
      authorizationNumber: 'AUTH-2024-002456',
      submissionDate: '2024-01-14',
      evvCompliant: true,
      paidAmount: 380.00,
      paidDate: '2024-01-16',
      documentation: ['Treatment Plan', 'Progress Report', 'EVV Records']
    },
    {
      id: 'CLM003',
      patient: 'Mary Williams',
      service: 'Medication Management',
      amount: 120.75,
      status: 'denied',
      date: '2024-01-13',
      insurance: 'Private Insurance',
      denialReason: 'Incomplete documentation',
      serviceDate: '2024-01-08',
      providerId: 'PR003',
      providerName: 'Jennifer Miller',
      patientDOB: '1941-07-22',
      patientID: 'PAT003',
      diagnosisCodes: ['I50.9', 'F03.90'],
      procedureCodes: ['99211', '99401'],
      authorizationNumber: 'AUTH-2024-003789',
      submissionDate: '2024-01-13',
      evvCompliant: false,
      denialCode: 'D1234',
      denialDescription: 'Missing required EVV documentation for medication administration',
      documentation: ['Medication List', 'Care Notes'],
      appealDeadline: '2024-02-13'
    },
    {
      id: 'CLM004',
      patient: 'James Davis',
      service: 'Wound Care',
      amount: 195.25,
      status: 'pending',
      date: '2024-01-12',
      insurance: 'Medicare',
      serviceDate: '2024-01-07',
      providerId: 'PR001',
      providerName: 'Maria Rodriguez',
      patientDOB: '1955-09-03',
      patientID: 'PAT004',
      diagnosisCodes: ['L89.152', 'E11.622'],
      procedureCodes: ['97597', '97598'],
      authorizationNumber: 'AUTH-2024-004567',
      submissionDate: '2024-01-12',
      evvCompliant: true,
      documentation: ['Wound Assessment', 'Treatment Notes', 'EVV Records']
    },
    {
      id: 'CLM005',
      patient: 'Patricia Wilson',
      service: 'Companionship',
      amount: 85.00,
      status: 'approved',
      date: '2024-01-11',
      insurance: 'Private Pay',
      serviceDate: '2024-01-06',
      providerId: 'PR004',
      providerName: 'Sarah Johnson',
      patientDOB: '1938-12-10',
      patientID: 'PAT005',
      diagnosisCodes: ['F32.9', 'Z74.3'],
      procedureCodes: ['S5135'],
      authorizationNumber: 'SELF-PAY',
      submissionDate: '2024-01-11',
      evvCompliant: true,
      paidAmount: 85.00,
      paidDate: '2024-01-11',
      documentation: ['Service Notes', 'Activity Log', 'EVV Records']
    }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        totalClaims: 247,
        pendingClaims: 45,
        deniedClaims: 12,
        revenueMonth: 156750,
        collectionRate: 94.2,
        avgPaymentTime: 18
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClaimAction = (claimId: string, action: string) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        switch (action) {
          case 'resubmit':
            return { ...claim, status: 'pending' };
          case 'appeal':
            return { ...claim, status: 'under_review' };
          case 'void':
            return { ...claim, status: 'voided' };
          default:
            return claim;
        }
      }
      return claim;
    }));
    alert(`Claim ${claimId} ${action} completed`);
  };

  const handleViewClaimDetails = (claimId: string) => {
    setClaimDetailsModal(claimId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'denied': return { bg: '#fecaca', text: '#dc2626' };
      case 'under_review': return { bg: '#dbeafe', text: '#1e40af' };
      case 'voided': return { bg: '#f3f4f6', text: '#6b7280' };
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
          <p style={{ color: '#6b7280' }}>Loading Billing Dashboard...</p>
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
              Billing & Revenue Management
            </h1>
            <p style={{ color: '#6b7280' }}>
              Claims processing, revenue tracking, and payment management
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
              { key: 'claims', label: '📋 Claims', count: claims.filter(c => c.status === 'pending').length },
              { key: 'denials', label: '❌ Denials', count: claims.filter(c => c.status === 'denied').length },
              { key: 'payments', label: '💰 Payments', count: null },
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
                  Total Claims
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {metrics.totalClaims}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  +12 this week
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
                  Pending Claims
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#f59e0b'
                }}>
                  {metrics.pendingClaims}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                  Need processing
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
                  Monthly Revenue
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  ${(metrics.revenueMonth / 1000).toFixed(0)}K
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  +8.5% vs last month
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
                  Collection Rate
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  {metrics.collectionRate}%
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
                  Avg Payment Time
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  {metrics.avgPaymentTime} days
                </p>
                <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
                  -3 days improved
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
                  Denied Claims
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  {metrics.deniedClaims}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                  Need attention
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
                  onClick={() => setActiveView('claims')}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  📋 Process Claims ({claims.filter(c => c.status === 'pending').length})
                </button>
                <button
                  onClick={() => setActiveView('denials')}
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
                  ❌ Review Denials ({claims.filter(c => c.status === 'denied').length})
                </button>
                <button
                  onClick={() => setActiveView('payments')}
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
                  💰 Track Payments
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
                  }}
                >
                  📈 Generate Reports
                </button>
              </div>
            </div>
          </>
        )}

        {/* Claims Management View */}
        {activeView === 'claims' && (
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
              Claims Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {claims.map((claim) => {
                const statusColors = getStatusColor(claim.status);
                return (
                  <div key={claim.id} style={{
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
                          {claim.id} - {claim.patient}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          {claim.service} • ${claim.amount} • {claim.insurance}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          📅 Service Date: {claim.date}
                        </p>
                        {claim.denialReason && (
                          <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                            ❌ Denial Reason: {claim.denialReason}
                          </p>
                        )}
                      </div>
                      <span style={{
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {claim.status === 'pending' && (
                        <button
                          onClick={() => handleClaimAction(claim.id, 'approve')}
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
                          ✓ Submit to Insurance
                        </button>
                      )}
                      {claim.status === 'denied' && (
                        <>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'resubmit')}
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
                            🔄 Resubmit
                          </button>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'appeal')}
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
                            ⚖️ Appeal
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewClaimDetails(claim.id)}
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
        )}

        {/* Other views would be implemented similarly */}

        {/* Claim Details Modal */}
        {claimDetailsModal && (
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
              {(() => {
                const claim = claims.find(c => c.id === claimDetailsModal);
                if (!claim) return null;
                return (
                  <>
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
                        Claim Details - {claim.id}
                      </h2>
                      <button
                        onClick={() => setClaimDetailsModal(null)}
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
                      {/* Claim Status Banner */}
                      <div style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: claim.status === 'approved' ? '#dcfce7' : claim.status === 'denied' ? '#fef2f2' : '#fef3c7',
                        border: `2px solid ${claim.status === 'approved' ? '#bbf7d0' : claim.status === 'denied' ? '#fecaca' : '#fed7aa'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: claim.status === 'approved' ? '#166534' : claim.status === 'denied' ? '#dc2626' : '#92400e',
                              marginBottom: '0.25rem'
                            }}>
                              Status: {claim.status.toUpperCase()}
                            </h3>
                            {claim.status === 'approved' && claim.paidAmount && (
                              <p style={{ fontSize: '0.875rem', color: '#065f46' }}>
                                💰 Paid: ${claim.paidAmount.toFixed(2)} on {claim.paidDate}
                              </p>
                            )}
                            {claim.status === 'denied' && (
                              <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
                                ❌ Reason: {claim.denialDescription || claim.denialReason}
                              </p>
                            )}
                          </div>
                          <div style={{
                            fontSize: '2rem',
                            color: claim.status === 'approved' ? '#166534' : claim.status === 'denied' ? '#dc2626' : '#92400e'
                          }}>
                            {claim.status === 'approved' ? '✅' : claim.status === 'denied' ? '❌' : '⏳'}
                          </div>
                        </div>
                      </div>

                      {/* Patient & Service Information */}
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                          Patient & Service Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                          <div><strong>Patient:</strong> {claim.patient}</div>
                          <div><strong>Patient ID:</strong> {claim.patientID}</div>
                          <div><strong>Date of Birth:</strong> {claim.patientDOB}</div>
                          <div><strong>Service Type:</strong> {claim.service}</div>
                          <div><strong>Service Date:</strong> {claim.serviceDate}</div>
                          <div><strong>Provider:</strong> {claim.providerName} ({claim.providerId})</div>
                        </div>
                      </div>

                      {/* Billing Information */}
                      <div style={{
                        backgroundColor: '#f0f9ff',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #bae6fd'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                          Billing & Insurance
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                          <div><strong>Claim Amount:</strong> ${claim.amount.toFixed(2)}</div>
                          <div><strong>Insurance:</strong> {claim.insurance}</div>
                          <div><strong>Authorization #:</strong> {claim.authorizationNumber}</div>
                          <div><strong>Submission Date:</strong> {claim.submissionDate}</div>
                          {claim.paidAmount && (
                            <>
                              <div><strong>Paid Amount:</strong> ${claim.paidAmount.toFixed(2)}</div>
                              <div><strong>Payment Date:</strong> {claim.paidDate}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Medical Codes */}
                      <div style={{
                        backgroundColor: '#fefce8',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #fef08a'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                          Medical Coding
                        </h3>
                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div><strong>Diagnosis Codes:</strong> {claim.diagnosisCodes.join(', ')}</div>
                          <div><strong>Procedure Codes:</strong> {claim.procedureCodes.join(', ')}</div>
                        </div>
                      </div>

                      {/* EVV Compliance */}
                      <div style={{
                        backgroundColor: claim.evvCompliant ? '#f0fdf4' : '#fef2f2',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${claim.evvCompliant ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                          Ohio EVV Compliance
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: claim.evvCompliant ? '#166534' : '#dc2626'
                        }}>
                          <span style={{ fontSize: '1.25rem' }}>
                            {claim.evvCompliant ? '✅' : '❌'}
                          </span>
                          <span>
                            {claim.evvCompliant
                              ? 'EVV Compliant - All required elements captured'
                              : 'EVV Non-Compliant - Missing required documentation'
                            }
                          </span>
                        </div>
                        {!claim.evvCompliant && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#fecaca',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            color: '#7f1d1d'
                          }}>
                            <strong>⚠️ Ohio "No EVV, No Pay" Policy:</strong> This claim will be denied due to missing EVV documentation.
                          </div>
                        )}
                      </div>

                      {/* Documentation */}
                      <div style={{
                        backgroundColor: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                          Supporting Documentation
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {claim.documentation.map((doc, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#374151'
                            }}>
                              <span style={{ color: '#059669' }}>📄</span>
                              {doc}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Denial Information */}
                      {claim.status === 'denied' && (
                        <div style={{
                          backgroundColor: '#fef2f2',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #fecaca'
                        }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.75rem' }}>
                            Denial Information
                          </h3>
                          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <div><strong>Denial Code:</strong> {claim.denialCode}</div>
                            <div><strong>Denial Reason:</strong> {claim.denialDescription}</div>
                            <div><strong>Appeal Deadline:</strong> {claim.appealDeadline}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      {claim.status === 'denied' && (
                        <>
                          <button
                            onClick={() => {
                              setClaimDetailsModal(null);
                              handleClaimAction(claim.id, 'resubmit');
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
                            🔄 Resubmit Claim
                          </button>
                          <button
                            onClick={() => {
                              setClaimDetailsModal(null);
                              handleClaimAction(claim.id, 'appeal');
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            ⚖️ File Appeal
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setClaimDetailsModal(null)}
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
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}