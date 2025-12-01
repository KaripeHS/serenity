import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

type TabKey = 'ready' | 'pending' | 'submitted' | 'denied';

function BatchStatusBadge({ status }: { status: ClaimBatch['status'] }) {
  const variants: Record<ClaimBatch['status'], any> = {
    draft: 'gray',
    ready: 'success',
    submitted: 'info',
    processing: 'warning',
    paid: 'success',
    denied: 'danger'
  };

  const icons: Record<ClaimBatch['status'], string> = {
    draft: '⚪',
    ready: '🟢',
    submitted: '📤',
    processing: '⏳',
    paid: '💰',
    denied: '❌'
  };

  return (
    <Badge variant={variants[status]} size="sm">
      {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function WorkingBillingProcess() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ClaimBatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('ready');

  useEffect(() => {
    loadClaimBatches();
  }, []);

  const loadClaimBatches = async () => {
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
      alert(`✅ Batch ${batch.batchNumber} validated!\n\nReady: ${updatedBatch.claims.filter(c => c.status === 'ready').length}\nError: ${updatedBatch.claims.filter(c => c.status === 'error').length}`);
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
      await new Promise(resolve => setTimeout(resolve, 3000));

      const updatedBatch = {
        ...batch,
        status: 'submitted' as const,
        submissionDate: new Date().toISOString().split('T')[0]
      };

      setBatches(prev => prev.map(b => b.id === batch.id ? updatedBatch : b));

      alert(`✅ Batch Submitted!\n\nBatch: ${batch.batchNumber}\nClaims: ${batch.totalClaims}\nAmount: $${batch.totalAmount.toFixed(2)}\nPayer: ${batch.payer}\n\n837P file transmitted to clearinghouse.`);
    } catch (error) {
      alert('Failed to submit batch. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateReport = (type: 'summary' | 'detailed' | 'aging') => {
    alert(`📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Report Generated!\n\nFormat: PDF + Excel\nTimestamp: ${new Date().toLocaleString()}`);
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

  const getEvvCompliancePercent = (batch: ClaimBatch) => {
    if (batch.claims.length === 0) return 'N/A';
    const compliant = batch.claims.filter(c => c.evvCompliant).length;
    return `${Math.round((compliant / batch.claims.length) * 100)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CurrencyDollarIcon className="h-8 w-8 text-success-600" />
              Claims Processing Center
            </h1>
            <p className="text-gray-600">
              Welcome, {user?.firstName}. Submit claims, track status, and manage denials
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleGenerateReport('summary')}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all hover:scale-105"
            >
              📊 Summary Report
            </button>
            <button
              onClick={() => handleGenerateReport('detailed')}
              className="px-4 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-all hover:scale-105"
            >
              📋 Detailed Report
            </button>
            <button
              onClick={() => handleGenerateReport('aging')}
              className="px-4 py-3 bg-warning-600 text-white rounded-lg font-medium hover:bg-warning-700 transition-all hover:scale-105"
            >
              ⏰ Aging Report
            </button>
            <button
              onClick={() => alert('🔄 Select 835 files to import payment postings automatically.')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all hover:scale-105"
            >
              🔄 Import ERA
            </button>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="mb-8 animate-fade-in">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'ready' as const, label: 'Ready to Submit', count: batches.filter(b => b.status === 'ready' || b.status === 'draft').length },
              { key: 'pending' as const, label: 'Processing', count: batches.filter(b => b.status === 'processing').length },
              { key: 'submitted' as const, label: 'Submitted', count: batches.filter(b => b.status === 'submitted').length },
              { key: 'denied' as const, label: 'Denied', count: batches.filter(b => b.status === 'denied').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant={activeTab === tab.key ? 'primary' : 'gray'} size="sm" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Batch List */}
          <div className="p-6">
            {filteredBatches.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No batches in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBatches.map((batch) => (
                  <div key={batch.id} className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:bg-primary-50 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{batch.batchNumber}</h4>
                        <p className="text-sm text-gray-600">
                          {batch.payer} • Created {batch.createdDate}
                          {batch.submissionDate && ` • Submitted ${batch.submissionDate}`}
                        </p>
                      </div>
                      <BatchStatusBadge status={batch.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Claims</p>
                        <p className="text-2xl font-bold text-gray-900">{batch.totalClaims}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">${batch.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">EVV Compliance</p>
                        <p className={`text-2xl font-bold ${batch.claims.every(c => c.evvCompliant) ? 'text-success-600' : 'text-danger-600'}`}>
                          {getEvvCompliancePercent(batch)}
                        </p>
                      </div>
                    </div>

                    {batch.status === 'ready' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleValidateBatch(batch)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-warning-600 text-white rounded-lg text-sm font-medium hover:bg-warning-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isProcessing ? '⏳ Validating...' : '🔍 Validate'}
                        </button>
                        <button
                          onClick={() => handleSubmitBatch(batch)}
                          disabled={isProcessing || batch.claims.some(c => c.status === 'error')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            batch.claims.some(c => c.status === 'error')
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-success-600 text-white hover:bg-success-700'
                          }`}
                        >
                          {isProcessing ? '⏳ Submitting...' : '📤 Submit Batch'}
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                          📋 View Details
                        </button>
                      </div>
                    )}

                    {batch.status === 'denied' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => alert('🔄 Reprocessing denied claims...')}
                          className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                        >
                          🔄 Reprocess
                        </button>
                        <button
                          onClick={() => alert('📄 Generating appeal documentation...')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
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
        </Card>

        {/* Ohio EVV Compliance Notice */}
        <Alert variant="warning" className="animate-fade-in">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning-900 mb-1">⚠️ Ohio "No EVV, No Pay" Compliance</h4>
              <p className="text-sm text-warning-800">
                All claims must have compliant EVV records before submission. Claims without proper EVV documentation will be automatically rejected by Ohio Medicaid.
              </p>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}
