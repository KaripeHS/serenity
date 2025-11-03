import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TaxMetrics {
  q1Revenue: number;
  q2Revenue: number;
  q3Revenue: number;
  q4Revenue: number;
  annualRevenue: number;
  taxLiability: number;
  payrollTaxes: number;
  salesTax: number;
  nextFilingDate: string;
  pendingDeductions: number;
}

export function WorkingTaxDashboard() {
  const { user: _user } = useAuth();
  const [metrics, setMetrics] = useState<TaxMetrics | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'quarterly' | 'payroll' | 'deductions' | 'filings' | 'reports'>('dashboard');

  const [filings, setFilings] = useState([
    { id: 1, type: 'Quarterly 941', period: 'Q4 2024', dueDate: '2025-01-31', status: 'pending', amount: 47890.50 },
    { id: 2, type: 'Annual 940', period: '2024', dueDate: '2025-01-31', status: 'pending', amount: 12450.25 },
    { id: 3, type: 'Ohio State', period: 'Q4 2024', dueDate: '2025-01-31', status: 'pending', amount: 8975.00 },
    { id: 4, type: 'Quarterly 941', period: 'Q3 2024', dueDate: '2024-10-31', status: 'filed', amount: 45230.75 },
    { id: 5, type: 'Ohio State', period: 'Q3 2024', dueDate: '2024-10-31', status: 'filed', amount: 8650.25 }
  ]);

  const [deductions, setDeductions] = useState([
    { id: 1, category: 'Medical Equipment', description: 'Wound care supplies and medical devices', amount: 25670.50, quarter: 'Q4 2024', verified: true },
    { id: 2, category: 'Training & Education', description: 'Staff certification and continuing education', amount: 12450.00, quarter: 'Q4 2024', verified: true },
    { id: 3, category: 'Vehicle Expenses', description: 'Caregiver mileage and vehicle maintenance', amount: 18975.25, quarter: 'Q4 2024', verified: false },
    { id: 4, category: 'Technology', description: 'EHR system and telehealth equipment', amount: 8250.00, quarter: 'Q4 2024', verified: true },
    { id: 5, category: 'Insurance', description: 'Professional liability and business insurance', amount: 15680.75, quarter: 'Q4 2024', verified: true }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        q1Revenue: 2450000,
        q2Revenue: 2680000,
        q3Revenue: 2890000,
        q4Revenue: 3120000,
        annualRevenue: 11140000,
        taxLiability: 1892500,
        payrollTaxes: 478900,
        salesTax: 0, // Home health services typically exempt
        nextFilingDate: '2025-01-31',
        pendingDeductions: 81026.50
      });
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const handleFilingAction = (filingId: number, action: string) => {
    setFilings(prev => prev.map(filing => {
      if (filing.id === filingId) {
        switch (action) {
          case 'file':
            return { ...filing, status: 'filed' };
          case 'extend':
            return { ...filing, status: 'extended' };
          default:
            return filing;
        }
      }
      return filing;
    }));
    alert(`Tax filing ${action}d successfully for filing ID ${filingId}`);
  };

  const getFilingStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'extended': return { bg: '#dbeafe', text: '#1e40af' };
      case 'overdue': return { bg: '#fecaca', text: '#dc2626' };
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
          <p style={{ color: '#6b7280' }}>Loading Tax Dashboard...</p>
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
              Tax Management Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>
              Federal and state tax compliance, filings, and deduction tracking
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
        </div>

        {/* Critical Tax Alerts */}
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
                  Tax Filings Due January 31st
                </p>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                  3 critical filings require immediate attention - Total: ${(47890.50 + 12450.25 + 8975.00).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('filings')}
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
              Review Filings
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
              { key: 'quarterly', label: '📅 Quarterly', count: null },
              { key: 'payroll', label: '💰 Payroll Tax', count: null },
              { key: 'deductions', label: '📝 Deductions', count: deductions.filter(d => !d.verified).length },
              { key: 'filings', label: '📋 Filings', count: filings.filter(f => f.status === 'pending').length },
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                  Annual Revenue (2024)
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  ${(metrics.annualRevenue / 1000000).toFixed(1)}M
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  +15.2% vs 2023
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
                  Estimated Tax Liability
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  ${(metrics.taxLiability / 1000).toFixed(0)}K
                </p>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                  17% effective rate
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
                  YTD Payroll Taxes
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  ${(metrics.payrollTaxes / 1000).toFixed(0)}K
                </p>
                <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
                  On schedule
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
                  Pending Deductions
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  ${(metrics.pendingDeductions / 1000).toFixed(0)}K
                </p>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  Q4 2024 total
                </p>
              </div>
            </div>

            {/* Quarterly Revenue Chart */}
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
                2024 Quarterly Revenue Breakdown
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem'
              }}>
                {[
                  { quarter: 'Q1', revenue: metrics.q1Revenue, growth: '+12%' },
                  { quarter: 'Q2', revenue: metrics.q2Revenue, growth: '+9%' },
                  { quarter: 'Q3', revenue: metrics.q3Revenue, growth: '+8%' },
                  { quarter: 'Q4', revenue: metrics.q4Revenue, growth: '+8%' }
                ].map((q) => (
                  <div key={q.quarter} style={{
                    padding: '1rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '0.5rem',
                    border: '1px solid #bae6fd',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.5rem' }}>
                      {q.quarter} 2024
                    </h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                      ${(q.revenue / 1000000).toFixed(1)}M
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#059669' }}>
                      {q.growth}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Filings View */}
        {activeView === 'filings' && (
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
              Tax Filings Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filings.map((filing) => {
                const statusColors = getFilingStatusColor(filing.status);
                const isOverdue = new Date(filing.dueDate) < new Date() && filing.status === 'pending';
                return (
                  <div key={filing.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: isOverdue ? '#fef2f2' : '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {filing.type} - {filing.period}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Due: {new Date(filing.dueDate).toLocaleDateString()} • Amount: ${filing.amount.toLocaleString()}
                        </p>
                        {isOverdue && (
                          <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '500' }}>
                            ⚠️ OVERDUE - File immediately to avoid penalties
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
                        {filing.status.toUpperCase()}
                      </span>
                    </div>
                    {filing.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleFilingAction(filing.id, 'file')}
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
                          📄 File Now
                        </button>
                        <button
                          onClick={() => handleFilingAction(filing.id, 'extend')}
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
                          📅 Request Extension
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deductions View */}
        {activeView === 'deductions' && (
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
              Tax Deductions & Business Expenses
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {deductions.map((deduction) => (
                <div key={deduction.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: deduction.verified ? '#f0fdf4' : '#fefbf2'
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
                        {deduction.category}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {deduction.description}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {deduction.quarter} • ${deduction.amount.toLocaleString()}
                      </p>
                    </div>
                    <span style={{
                      backgroundColor: deduction.verified ? '#dcfce7' : '#fef3c7',
                      color: deduction.verified ? '#166534' : '#92400e',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {deduction.verified ? 'Verified' : 'Pending Review'}
                    </span>
                  </div>
                  {!deduction.verified && (
                    <button
                      onClick={() => {
                        setDeductions(prev => prev.map(d =>
                          d.id === deduction.id ? { ...d, verified: true } : d
                        ));
                        alert(`Deduction verified: ${deduction.category}`);
                      }}
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
                      ✓ Verify Deduction
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}