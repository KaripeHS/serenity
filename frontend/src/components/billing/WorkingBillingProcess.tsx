import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ClaimBatch {
  id: string;
  batchNumber: string;
  totalClaims: number;
  totalAmount: number;
  status: 'draft' | 'ready' | 'submitted' | 'processing' | 'paid' | 'denied';
  createdDate: string;
  submissionDate?: string;
  payer: string;
  claims: ProcessClaim[];
}

interface ProcessClaim {
  id: string;
  patientName: string;
  serviceDate: string;
  serviceCode: string;
  amount: number;
  evvCompliant: boolean;
  status: 'ready' | 'warning' | 'error';
  validationMessages: string[];
}

export function WorkingBillingProcess() {
  const { user: _user } = useAuth();
  const [batches, setBatches] = useState<ClaimBatch[]>([]);
  const [_selectedBatch, setSelectedBatch] = useState<ClaimBatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ready' | 'pending' | 'submitted' | 'denied'>('ready');

  useEffect(() => {
    loadClaimBatches();
  }, []);

  const loadClaimBatches = async () => {
    // Simulate loading claim batches
    const productionBatches: ClaimBatch[] = [
      {
        id: 'batch_001',
        batchNumber: 'B20241201001',
        totalClaims: 47,
        totalAmount: 12450.00,
        status: 'ready',
        createdDate: '2024-12-01',
        payer: 'Ohio Medicaid',
        claims: [
          {
            id: 'claim_001',
            patientName: 'Eleanor Johnson',
            serviceDate: '2024-11-28',
            serviceCode: 'T1019',
            amount: 165.00,
            evvCompliant: true,
            status: 'ready',
            validationMessages: []
          },
          {
            id: 'claim_002',
            patientName: 'Robert Chen',
            serviceDate: '2024-11-28',
            serviceCode: 'G0156',
            amount: 245.50,
            evvCompliant: false,
            status: 'error',
            validationMessages: ['EVV record missing GPS coordinates', 'Service duration exceeds authorization']
          }
        ]
      },
      {
        id: 'batch_002',
        batchNumber: 'B20241130002',
        totalClaims: 32,
        totalAmount: 8920.75,
        status: 'submitted',
        createdDate: '2024-11-30',
        submissionDate: '2024-12-01',
        payer: 'Medicare',
        claims: []
      },
      {
        id: 'batch_003',
        batchNumber: 'B20241129003',
        totalClaims: 28,
        totalAmount: 7340.25,
        status: 'denied',
        createdDate: '2024-11-29',
        submissionDate: '2024-11-30',
        payer: 'Humana',
        claims: []
      }
    ];
    setBatches(productionBatches);
  };

  const handleValidateBatch = async (batch: ClaimBatch) => {
    setIsProcessing(true);
    try {
      // Simulate batch validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedBatch = {
        ...batch,
        status: 'ready' as const,
        claims: batch.claims.map(claim => ({
          ...claim,
          status: claim.evvCompliant && claim.validationMessages.length === 0 ? 'ready' as const : 'error' as const
        }))
      };

      setBatches(prev => prev.map(b => b.id === batch.id ? updatedBatch : b));
      alert(`✅ Batch ${batch.batchNumber} validated!\n\nReady Claims: ${updatedBatch.claims.filter(c => c.status === 'ready').length}\nError Claims: ${updatedBatch.claims.filter(c => c.status === 'error').length}`);
    } catch (error) {
      alert('Failed to validate batch. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitBatch = async (batch: ClaimBatch) => {
    if (batch.claims.some(c => c.status === 'error')) {
      alert('❌ Cannot submit batch with error claims. Please resolve all issues first.');
      return;
    }

    if (!batch.claims.every(c => c.evvCompliant)) {
      alert('❌ Ohio "No EVV, No Pay" Policy: All claims must be EVV compliant before submission.');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate 837 file generation and submission
      await new Promise(resolve => setTimeout(resolve, 3000));

      const updatedBatch = {
        ...batch,
        status: 'submitted' as const,
        submissionDate: new Date().toISOString().split('T')[0]
      };

      setBatches(prev => prev.map(b => b.id === batch.id ? updatedBatch : b));

      alert(`✅ Batch Submitted Successfully!\n\nBatch: ${batch.batchNumber}\nClaims: ${batch.totalClaims}\nAmount: $${batch.totalAmount.toFixed(2)}\nPayer: ${batch.payer}\n\n837P file generated and transmitted to clearinghouse.`);
    } catch (error) {
      alert('Failed to submit batch. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateReport = (type: 'summary' | 'detailed' | 'aging') => {
    alert(`📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Report Generated!\n\nReport will be available in Downloads folder.\nFormat: PDF + Excel\nTimestamp: ${new Date().toLocaleString()}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10B981';
      case 'submitted': return '#3B82F6';
      case 'processing': return '#F59E0B';
      case 'paid': return '#059669';
      case 'denied': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return '🟢';
      case 'submitted': return '📤';
      case 'processing': return '⏳';
      case 'paid': return '💰';
      case 'denied': return '❌';
      case 'warning': return '⚠️';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const filteredBatches = batches.filter(batch => {
    switch (activeTab) {
      case 'ready': return batch.status === 'ready' || batch.status === 'draft';
      case 'pending': return batch.status === 'processing';
      case 'submitted': return batch.status === 'submitted';
      case 'denied': return batch.status === 'denied';
      default: return true;
    }
  });

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
              💰 Claims Processing Center
            </h1>
            <p style={{ color: '#6b7280' }}>
              Submit claims, track status, and manage denials
            </p>
          </div>
          <a href="/" style={{
            color: '#2563eb',
            textDecoration: 'underline'
          }}>
            ← Back to Home
          </a>
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
            📋 Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => handleGenerateReport('summary')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📊 Summary Report
            </button>
            <button
              onClick={() => handleGenerateReport('detailed')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📋 Detailed Report
            </button>
            <button
              onClick={() => handleGenerateReport('aging')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ⏰ Aging Report
            </button>
            <button
              onClick={() => alert('🔄 ERA Import\n\nSelect 835 files to import payment postings automatically.')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🔄 Import ERA
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {[
              { key: 'ready', label: 'Ready to Submit', count: batches.filter(b => b.status === 'ready' || b.status === 'draft').length },
              { key: 'pending', label: 'Processing', count: batches.filter(b => b.status === 'processing').length },
              { key: 'submitted', label: 'Submitted', count: batches.filter(b => b.status === 'submitted').length },
              { key: 'denied', label: 'Denied', count: batches.filter(b => b.status === 'denied').length }
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

          {/* Batch List */}
          <div style={{ padding: '1.5rem' }}>
            {filteredBatches.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <p>No batches in this category.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredBatches.map((batch) => (
                  <div
                    key={batch.id}
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
                          {batch.batchNumber}
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {batch.payer} • Created {batch.createdDate}
                          {batch.submissionDate && ` • Submitted ${batch.submissionDate}`}
                        </p>
                      </div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(batch.status)}20`,
                        color: getStatusColor(batch.status)
                      }}>
                        {getStatusIcon(batch.status)} {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Claims</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{batch.totalClaims}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Total Amount</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>${batch.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>EVV Compliance</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: '600', color: batch.claims.every(c => c.evvCompliant) ? '#10B981' : '#EF4444' }}>
                          {batch.claims.length > 0 ? `${Math.round((batch.claims.filter(c => c.evvCompliant).length / batch.claims.length) * 100)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {batch.status === 'ready' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleValidateBatch(batch)}
                          disabled={isProcessing}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#F59E0B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          {isProcessing ? '⏳ Validating...' : '🔍 Validate'}
                        </button>
                        <button
                          onClick={() => handleSubmitBatch(batch)}
                          disabled={isProcessing || batch.claims.some(c => c.status === 'error')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: batch.claims.some(c => c.status === 'error') ? '#9ca3af' : '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: isProcessing || batch.claims.some(c => c.status === 'error') ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isProcessing ? '⏳ Submitting...' : '📤 Submit Batch'}
                        </button>
                        <button
                          onClick={() => setSelectedBatch(batch)}
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
                          📋 View Details
                        </button>
                      </div>
                    )}

                    {batch.status === 'denied' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => alert('🔄 Reprocessing denied claims...')}
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
                          🔄 Reprocess
                        </button>
                        <button
                          onClick={() => alert('📄 Generating appeal documentation...')}
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
                          📄 Generate Appeal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ohio EVV Compliance Notice */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fde047',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#92400e',
            marginBottom: '0.5rem'
          }}>
            ⚠️ Ohio "No EVV, No Pay" Compliance
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#78350f'
          }}>
            All claims must have compliant EVV records before submission. Claims without proper EVV documentation will be automatically rejected by Ohio Medicaid.
          </p>
        </div>
      </div>
    </div>
  );
}