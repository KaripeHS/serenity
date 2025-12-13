import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { claimsService, Claim, ClaimStatus, ClaimBatch, ClaimStats, ValidationResult } from '../../services/claims.service';

// Status badge component
function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const config: Record<ClaimStatus, { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    ready_to_submit: { variant: 'info', label: 'Ready to Submit' },
    submitted: { variant: 'info', label: 'Submitted' },
    accepted: { variant: 'success', label: 'Accepted' },
    rejected: { variant: 'danger', label: 'Rejected' },
    paid: { variant: 'success', label: 'Paid' },
    denied: { variant: 'danger', label: 'Denied' },
    pending_correction: { variant: 'warning', label: 'Needs Correction' },
    appealed: { variant: 'warning', label: 'Appealed' }
  };

  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// Claim validation panel
function ValidationPanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const [validating, setValidating] = useState(true);
  const [result, setResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    const validate = async () => {
      setValidating(true);
      const res = await claimsService.validateClaim(claim);
      setResult(res);
      setValidating(false);
    };
    validate();
  }, [claim]);

  if (validating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
            <span>Validating claim...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Claim Validation: {claim.claimNumber}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        {result?.isValid ? (
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-success-700">
              <CheckCircleIcon className="h-6 w-6" />
              <span className="font-medium">Claim is ready for submission</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-danger-700">
              <XCircleIcon className="h-6 w-6" />
              <span className="font-medium">Claim has validation errors</span>
            </div>
          </div>
        )}

        {result?.errors && result.errors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-danger-700 mb-2">Errors ({result.errors.length})</h4>
            <ul className="space-y-2">
              {result.errors.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircleIcon className="h-4 w-4 text-danger-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-mono text-xs text-danger-600">{e.code}</span>
                    <p className="text-gray-700">{e.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result?.warnings && result.warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-warning-700 mb-2">Warnings ({result.warnings.length})</h4>
            <ul className="space-y-2">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ExclamationTriangleIcon className="h-4 w-4 text-warning-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-mono text-xs text-warning-600">{w.code}</span>
                    <p className="text-gray-700">{w.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {result?.isValid && (
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
              <PaperAirplaneIcon className="h-4 w-4" />
              Submit Claim
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// Batch submission panel
function BatchSubmitPanel({ claims, onClose, onSubmit }: {
  claims: Claim[];
  onClose: () => void;
  onSubmit: (claimIds: string[], payerId: string) => void;
}) {
  const [selectedPayerId, setSelectedPayerId] = useState('');
  const payers = claimsService.getPayers();

  // Group claims by payer
  const claimsByPayer = claims.reduce((acc, claim) => {
    if (!acc[claim.payerId]) {
      acc[claim.payerId] = { payerName: claim.payerName, claims: [] };
    }
    acc[claim.payerId].claims.push(claim);
    return acc;
  }, {} as Record<string, { payerName: string; claims: Claim[] }>);

  const selectedGroup = selectedPayerId ? claimsByPayer[selectedPayerId] : null;
  const totalAmount = selectedGroup?.claims.reduce((sum, c) => sum + c.totalAmount, 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Submit Claims Batch</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Payer</label>
            <div className="space-y-2">
              {Object.entries(claimsByPayer).map(([payerId, group]) => (
                <label
                  key={payerId}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
                    ${selectedPayerId === payerId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payer"
                      value={payerId}
                      checked={selectedPayerId === payerId}
                      onChange={(e) => setSelectedPayerId(e.target.value)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{group.payerName}</p>
                      <p className="text-sm text-gray-500">
                        {payers.find(p => p.id === payerId)?.submissionMethod || 'EDI 837P'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{group.claims.length} claims</p>
                    <p className="text-sm text-gray-500">
                      ${group.claims.reduce((sum, c) => sum + c.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedGroup && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Claims to Submit ({selectedGroup.claims.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedGroup.claims.map(claim => (
                  <div key={claim.id} className="flex justify-between text-sm py-2 border-b border-gray-200 last:border-0">
                    <div>
                      <span className="font-medium">{claim.claimNumber}</span>
                      <span className="text-gray-500 ml-2">{claim.clientName}</span>
                    </div>
                    <span className="font-medium">${claim.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 pt-2 border-t border-gray-300">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedGroup && onSubmit(selectedGroup.claims.map(c => c.id), selectedPayerId)}
            disabled={!selectedPayerId}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            Submit {selectedGroup?.claims.length || 0} Claims
          </button>
        </div>
      </Card>
    </div>
  );
}

// Denial details panel
function DenialDetailsPanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const denialReasons = claimsService.getDenialReasons();
  const denialInfo = denialReasons.find(d => d.code === claim.denialCode);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Denial Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <XCircleIcon className="h-6 w-6 text-danger-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-danger-800">{claim.denialCode}</p>
              <p className="text-danger-700">{claim.denialReason}</p>
            </div>
          </div>
        </div>

        {denialInfo && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Category</h4>
              <Badge variant="secondary" className="mt-1 capitalize">{denialInfo.category}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Suggested Action</h4>
              <p className="text-gray-900 mt-1">{denialInfo.suggestedAction}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Claim Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Client</p>
              <p className="font-medium">{claim.clientName}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Service</p>
              <p className="font-medium">{claim.dateOfService}</p>
            </div>
            <div>
              <p className="text-gray-500">Service</p>
              <p className="font-medium">{claim.serviceCode} - {claim.serviceType}</p>
            </div>
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-medium">${claim.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 border border-warning-500 text-warning-700 rounded-lg hover:bg-warning-50 flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Correct & Resubmit
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
            <DocumentDuplicateIcon className="h-4 w-4" />
            File Appeal
          </button>
        </div>
      </Card>
    </div>
  );
}

// Main Claims Workflow Component
export function ClaimsWorkflow() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ready');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [batches, setBatches] = useState<ClaimBatch[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [validatingClaim, setValidatingClaim] = useState<Claim | null>(null);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [viewingDenial, setViewingDenial] = useState<Claim | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsData, batchesData] = await Promise.all([
        claimsService.getClaims(),
        claimsService.getBatches()
      ]);
      setClaims(claimsData.claims);
      setStats(claimsData.stats);
      setBatches(batchesData);
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaims(prev =>
      prev.includes(claimId)
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const handleSelectAll = () => {
    const readyClaims = claims.filter(c => c.status === 'ready_to_submit');
    if (selectedClaims.length === readyClaims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(readyClaims.map(c => c.id));
    }
  };

  const handleBatchSubmit = async (claimIds: string[], payerId: string) => {
    try {
      await claimsService.submitBatch(claimIds, payerId);
      setShowBatchPanel(false);
      setSelectedClaims([]);
      loadData();
    } catch (error) {
      console.error('Failed to submit batch:', error);
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesStatus = filterStatus === 'all' || claim.status === filterStatus;
    const matchesSearch = !searchTerm ||
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><Skeleton className="h-24" /></Card>
            ))}
          </div>
          <Card><Skeleton className="h-96" /></Card>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'ready', label: 'Ready to Submit', count: claims.filter(c => c.status === 'ready_to_submit').length },
    { id: 'submitted', label: 'In Process', count: claims.filter(c => ['submitted', 'accepted'].includes(c.status)).length },
    { id: 'action', label: 'Needs Action', count: claims.filter(c => ['denied', 'pending_correction', 'rejected'].includes(c.status)).length },
    { id: 'batches', label: 'Batches', count: batches.length },
    { id: 'all', label: 'All Claims', count: claims.length }
  ];

  const readyClaimsForBatch = claims.filter(c =>
    c.status === 'ready_to_submit' && selectedClaims.includes(c.id)
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Claims Submission
            </h1>
            <p className="text-gray-600">
              Generate, validate, and submit claims to payers
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

        {/* KPI Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Ready to Submit</h3>
                <div className="p-2 bg-info-100 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-info-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-info-600">{stats.byStatus.ready_to_submit.count}</p>
              <p className="text-sm text-gray-500">{formatCurrency(stats.byStatus.ready_to_submit.amount)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">In Process</h3>
                <div className="p-2 bg-warning-100 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-warning-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-warning-600">{stats.byStatus.submitted.count + stats.byStatus.accepted.count}</p>
              <p className="text-sm text-gray-500">{formatCurrency(stats.byStatus.submitted.amount + stats.byStatus.accepted.amount)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Paid This Month</h3>
                <div className="p-2 bg-success-100 rounded-lg">
                  <BanknotesIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-success-600">{stats.byStatus.paid.count}</p>
              <p className="text-sm text-gray-500">{formatCurrency(stats.byStatus.paid.amount)} <span className="text-success-600">+8%</span></p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Clean Claim Rate</h3>
                <div className={`p-2 rounded-lg ${stats.cleanClaimRate >= 90 ? 'bg-success-100' : stats.cleanClaimRate >= 80 ? 'bg-warning-100' : 'bg-danger-100'}`}>
                  <CheckCircleIcon className={`h-5 w-5 ${stats.cleanClaimRate >= 90 ? 'text-success-600' : stats.cleanClaimRate >= 80 ? 'text-warning-600' : 'text-danger-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stats.cleanClaimRate >= 90 ? 'text-success-600' : stats.cleanClaimRate >= 80 ? 'text-warning-600' : 'text-danger-600'}`}>{stats.cleanClaimRate}%</p>
              <p className="text-sm text-gray-500">{stats.denialRate}% denial rate</p>
            </Card>
          </div>
        )}

        {/* Action Bar */}
        {selectedClaims.length > 0 && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between animate-fade-in">
            <span className="font-medium text-primary-800">
              {selectedClaims.length} claim{selectedClaims.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedClaims([])}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setShowBatchPanel(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Submit Selected
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'ready' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedClaims.length === claims.filter(c => c.status === 'ready_to_submit').length && selectedClaims.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <h3 className="text-lg font-semibold text-gray-900">Claims Ready for Submission</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {claims.filter(c => c.status === 'ready_to_submit').length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No claims ready for submission</p>
                <p className="text-sm text-gray-400 mt-1">Complete EVV records will generate claims automatically</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 w-8"></th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Claim #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">DOS</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payer</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.filter(c => c.status === 'ready_to_submit').map(claim => (
                      <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedClaims.includes(claim.id)}
                            onChange={() => handleSelectClaim(claim.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-medium">{claim.claimNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{claim.clientName}</p>
                          <p className="text-xs text-gray-500">{claim.caregiverName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{claim.serviceType}</p>
                          <p className="text-xs text-gray-500">{claim.serviceCode} x {claim.units} units</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{claim.dateOfService}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{claim.payerName}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(claim.totalAmount)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setValidatingClaim(claim)}
                            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded"
                          >
                            Validate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'submitted' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims In Process</h3>
            {claims.filter(c => ['submitted', 'accepted'].includes(c.status)).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No claims currently in process</p>
            ) : (
              <div className="space-y-3">
                {claims.filter(c => ['submitted', 'accepted'].includes(c.status)).map(claim => (
                  <div key={claim.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{claim.claimNumber}</span>
                          <ClaimStatusBadge status={claim.status} />
                        </div>
                        <p className="text-gray-600 mt-1">{claim.clientName} - {claim.serviceType}</p>
                        <p className="text-sm text-gray-500">Submitted: {claim.submittedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(claim.totalAmount)}</p>
                        <p className="text-sm text-gray-500">{claim.payerName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'action' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Needing Attention</h3>
            {claims.filter(c => ['denied', 'pending_correction', 'rejected'].includes(c.status)).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="h-12 w-12 text-success-500 mx-auto mb-4" />
                <p className="text-gray-500">No claims need attention</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.filter(c => ['denied', 'pending_correction', 'rejected'].includes(c.status)).map(claim => (
                  <div
                    key={claim.id}
                    className={`p-4 border rounded-lg ${
                      claim.status === 'denied' ? 'border-danger-200 bg-danger-50' :
                      claim.status === 'rejected' ? 'border-danger-200 bg-danger-50' :
                      'border-warning-200 bg-warning-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{claim.claimNumber}</span>
                          <ClaimStatusBadge status={claim.status} />
                        </div>
                        <p className="text-gray-700 mt-1">{claim.clientName} - {claim.serviceType}</p>
                        {claim.denialCode && (
                          <p className="text-sm text-danger-700 mt-1">
                            <span className="font-medium">{claim.denialCode}:</span> {claim.denialReason}
                          </p>
                        )}
                        {claim.validationErrors && claim.validationErrors.length > 0 && (
                          <ul className="text-sm text-warning-700 mt-1 list-disc list-inside">
                            {claim.validationErrors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(claim.totalAmount)}</p>
                        <div className="mt-2 flex gap-2">
                          {claim.status === 'denied' && (
                            <button
                              onClick={() => setViewingDenial(claim)}
                              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              View Details
                            </button>
                          )}
                          <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
                            {claim.status === 'denied' ? 'Appeal' : 'Correct'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'batches' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Batches</h3>
            {batches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No batches submitted yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Batch #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Claims</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Submitted</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono font-medium">{batch.batchNumber}</td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{batch.payerName}</p>
                          <p className="text-xs text-gray-500">{batch.fileType}</p>
                        </td>
                        <td className="py-3 px-4">{batch.claimCount} claims</td>
                        <td className="py-3 px-4 text-gray-600">{batch.submittedAt}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              batch.status === 'completed' ? 'success' :
                              batch.status === 'rejected' ? 'danger' :
                              batch.status === 'processing' ? 'warning' : 'info'
                            }
                          >
                            {batch.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(batch.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'all' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">All Claims</h3>
              <div className="flex gap-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ClaimStatus | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="ready_to_submit">Ready to Submit</option>
                  <option value="submitted">Submitted</option>
                  <option value="paid">Paid</option>
                  <option value="denied">Denied</option>
                  <option value="pending_correction">Needs Correction</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Claim #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Billed</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map(claim => (
                    <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium">{claim.claimNumber}</span>
                        <p className="text-xs text-gray-500">{claim.dateOfService}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{claim.clientName}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <p>{claim.serviceType}</p>
                        <p className="text-gray-500">{claim.serviceCode}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{claim.payerName}</td>
                      <td className="py-3 px-4">
                        <ClaimStatusBadge status={claim.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(claim.totalAmount)}</td>
                      <td className="py-3 px-4 text-right text-success-600 font-medium">
                        {claim.paidAmount ? formatCurrency(claim.paidAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {validatingClaim && (
        <ValidationPanel claim={validatingClaim} onClose={() => setValidatingClaim(null)} />
      )}

      {showBatchPanel && readyClaimsForBatch.length > 0 && (
        <BatchSubmitPanel
          claims={readyClaimsForBatch}
          onClose={() => setShowBatchPanel(false)}
          onSubmit={handleBatchSubmit}
        />
      )}

      {viewingDenial && (
        <DenialDetailsPanel claim={viewingDenial} onClose={() => setViewingDenial(null)} />
      )}
    </div>
  );
}

export default ClaimsWorkflow;
