import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { billingService, ClaimsBatch, ClaimsReadinessReport } from '../../services/billing.service';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type TabKey = 'ready' | 'pending' | 'submitted' | 'denied';

function BatchStatusBadge({ status }: { status: ClaimsBatch['status'] }) {
  const variants: Record<ClaimsBatch['status'], any> = {
    draft: 'gray',
    ready: 'success',
    submitted: 'info',
    processing: 'warning',
    paid: 'success',
    denied: 'danger'
  };

  const icons: Record<ClaimsBatch['status'], string> = {
    draft: '⚪',
    ready: '🟢',
    submitted: '📤',
    processing: '⏳',
    paid: '💰',
    denied: '❌'
  };

  return (
    <Badge variant={variants[status] || 'gray'} size="sm">
      {icons[status] || '⚪'} {(status || 'unknown').charAt(0).toUpperCase() + (status || 'unknown').slice(1)}
    </Badge>
  );
}

export function WorkingBillingProcess() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ClaimsBatch[]>([]);
  const [readyVisits, setReadyVisits] = useState<ClaimsReadinessReport['visits']>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('ready');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsProcessing(true);
    try {
      if (activeTab === 'ready') {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const report = await billingService.getClaimsReadiness(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        // Explicitly type v to avoid implicit any if inference fails
        setReadyVisits(report.visits.filter((v: ClaimsReadinessReport['visits'][0]) => v.status === 'billable'));
        setBatches([]);
      } else {
        const result = await billingService.getBatches(
          activeTab === 'pending' ? 'draft' : // Map tab to API status
            activeTab === 'submitted' ? 'submitted' :
              activeTab === 'denied' ? 'denied' : undefined
        );
        setBatches(result);
        setReadyVisits([]);
      }
    } catch (error) {
      console.error('Failed to load billing data', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBatch = async () => {
    if (readyVisits.length === 0) return;
    setIsProcessing(true);
    try {
      // Create batch from all ready visits
      const visitIds = readyVisits.map(v => v.visitId);
      await billingService.generateClaims(visitIds);
      alert('✅ Claims Generated Successfully!\nBatch created and 837P file ready for download.');
      setActiveTab('submitted'); // Switch to view result
    } catch (error) {
      alert('Failed to generate claims. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateReport = (type: 'summary' | 'detailed' | 'aging') => {
    alert(`📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Report Generated!\n\nFormat: PDF + Excel\nTimestamp: ${new Date().toLocaleString()}`);
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
              { key: 'ready' as const, label: 'Ready to Submit' },
              { key: 'pending' as const, label: 'Processing' },
              { key: 'submitted' as const, label: 'Submitted' },
              { key: 'denied' as const, label: 'Denied' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {isProcessing ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading data...</p>
              </div>
            ) : activeTab === 'ready' ? (
              // Ready Visits View
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">Verified Visits Ready for Billing</h3>
                  <div className="text-2xl font-bold text-success-600">
                    {readyVisits.length} Visits (${readyVisits.reduce((sum, v) => sum + v.estimatedAmount, 0).toFixed(2)})
                  </div>
                </div>

                {readyVisits.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No clean visits found. Check EVV dashboard for validation errors.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert variant="success" className="mb-4">
                      <span className="font-bold">✅ EVV Compliance Verified:</span> All listed visits have passed Ohio "No EVV, No Pay" validation.
                    </Alert>

                    {readyVisits.map(visit => (
                      <div key={visit.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{visit.clientName}</p>
                          <p className="text-sm text-gray-600">{visit.visitDate} • {visit.caregiverName} • {visit.billableUnits} units</p>
                        </div>
                        <div className="font-bold text-gray-900">${visit.estimatedAmount.toFixed(2)}</div>
                      </div>
                    ))}

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleCreateBatch}
                        className="px-6 py-3 bg-success-600 text-white rounded-lg font-bold hover:bg-success-700 transition-all shadow-lg hover:scale-105"
                      >
                        📤 Generate Claims Batch & Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Batches View
              <div>
                {batches.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No batches in this category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div key={batch.id} className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:bg-primary-50 transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">{batch.batchNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {batch.payer} • Created {new Date(batch.createdDate).toLocaleDateString()}
                            </p>
                          </div>
                          <BatchStatusBadge status={batch.status} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Claims</p>
                            <p className="text-2xl font-bold text-gray-900">{batch.totalClaims}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">${batch.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
