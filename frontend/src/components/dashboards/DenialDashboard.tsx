/**
 * Denial Management Dashboard
 * Tracks claim denials, appeal deadlines, and denial trends
 * Critical for revenue recovery and reducing future denials
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  ScaleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

interface Denial {
  id: string;
  claimId: string;
  patientName: string;
  patientId: string;
  serviceDate: string;
  serviceType: string;
  payer: string;
  denialCode: string;
  denialReason: string;
  denialCategory: 'authorization' | 'eligibility' | 'coding' | 'timely_filing' | 'duplicate' | 'medical_necessity' | 'other';
  billedAmount: number;
  deniedAmount: number;
  denialDate: string;
  appealDeadline: string;
  status: 'new' | 'under_review' | 'appealed' | 'overturned' | 'upheld' | 'written_off';
  assignedTo?: string;
  notes?: string;
}

// Mock data for demonstration
const mockDenials: Denial[] = [
  {
    id: '1',
    claimId: 'CLM-2025-001234',
    patientName: 'Mary Johnson',
    patientId: 'P001',
    serviceDate: '2024-12-15',
    serviceType: 'Personal Care',
    payer: 'Ohio Medicaid',
    denialCode: 'CO-4',
    denialReason: 'The procedure code is inconsistent with the modifier used',
    denialCategory: 'coding',
    billedAmount: 450.00,
    deniedAmount: 450.00,
    denialDate: '2025-01-02',
    appealDeadline: '2025-04-02',
    status: 'new',
  },
  {
    id: '2',
    claimId: 'CLM-2025-001235',
    patientName: 'Robert Williams',
    patientId: 'P002',
    serviceDate: '2024-12-20',
    serviceType: 'Skilled Nursing',
    payer: 'Medicare',
    denialCode: 'CO-197',
    denialReason: 'Prior authorization/pre-certification required',
    denialCategory: 'authorization',
    billedAmount: 890.00,
    deniedAmount: 890.00,
    denialDate: '2025-01-03',
    appealDeadline: '2025-01-18',
    status: 'under_review',
    assignedTo: 'Sarah Davis',
  },
  {
    id: '3',
    claimId: 'CLM-2025-001236',
    patientName: 'Patricia Davis',
    patientId: 'P003',
    serviceDate: '2024-11-10',
    serviceType: 'Home Health Aide',
    payer: 'Anthem BCBS',
    denialCode: 'CO-29',
    denialReason: 'The time limit for filing has expired',
    denialCategory: 'timely_filing',
    billedAmount: 320.00,
    deniedAmount: 320.00,
    denialDate: '2025-01-01',
    appealDeadline: '2025-01-31',
    status: 'written_off',
    notes: 'Past timely filing limit, cannot appeal',
  },
  {
    id: '4',
    claimId: 'CLM-2025-001237',
    patientName: 'James Brown',
    patientId: 'P004',
    serviceDate: '2024-12-18',
    serviceType: 'Physical Therapy',
    payer: 'Ohio Medicaid',
    denialCode: 'CO-18',
    denialReason: 'Duplicate claim/service',
    denialCategory: 'duplicate',
    billedAmount: 175.00,
    deniedAmount: 175.00,
    denialDate: '2025-01-04',
    appealDeadline: '2025-04-04',
    status: 'appealed',
    assignedTo: 'Mike Johnson',
  },
  {
    id: '5',
    claimId: 'CLM-2025-001238',
    patientName: 'Linda Martinez',
    patientId: 'P005',
    serviceDate: '2024-12-22',
    serviceType: 'Respite Care',
    payer: 'PASSPORT',
    denialCode: 'CO-50',
    denialReason: 'Medical necessity not established',
    denialCategory: 'medical_necessity',
    billedAmount: 560.00,
    deniedAmount: 560.00,
    denialDate: '2025-01-05',
    appealDeadline: '2025-04-05',
    status: 'under_review',
    assignedTo: 'Sarah Davis',
  },
  {
    id: '6',
    claimId: 'CLM-2024-009876',
    patientName: 'Michael Wilson',
    patientId: 'P006',
    serviceDate: '2024-11-15',
    serviceType: 'Personal Care',
    payer: 'Ohio Medicaid',
    denialCode: 'CO-27',
    denialReason: 'Expenses incurred after coverage terminated',
    denialCategory: 'eligibility',
    billedAmount: 380.00,
    deniedAmount: 380.00,
    denialDate: '2024-12-20',
    appealDeadline: '2025-03-20',
    status: 'overturned',
    assignedTo: 'Mike Johnson',
    notes: 'Coverage verified, claim resubmitted successfully',
  },
];

export default function DenialDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [payerFilter, setPayerFilter] = useState<string>('all');
  const [selectedDenial, setSelectedDenial] = useState<Denial | null>(null);

  // Calculate metrics
  const totalDenials = mockDenials.length;
  const newDenials = mockDenials.filter(d => d.status === 'new').length;
  const underReview = mockDenials.filter(d => d.status === 'under_review').length;
  const appealed = mockDenials.filter(d => d.status === 'appealed').length;
  const overturned = mockDenials.filter(d => d.status === 'overturned').length;
  const upheld = mockDenials.filter(d => d.status === 'upheld').length;
  const writtenOff = mockDenials.filter(d => d.status === 'written_off').length;

  const totalDeniedAmount = mockDenials.reduce((sum, d) => sum + d.deniedAmount, 0);
  const recoveredAmount = mockDenials
    .filter(d => d.status === 'overturned')
    .reduce((sum, d) => sum + d.deniedAmount, 0);
  const pendingRecovery = mockDenials
    .filter(d => ['new', 'under_review', 'appealed'].includes(d.status))
    .reduce((sum, d) => sum + d.deniedAmount, 0);

  // Filter denials
  const filteredDenials = mockDenials.filter(denial => {
    const matchesSearch = denial.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      denial.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      denial.denialCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || denial.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || denial.denialCategory === categoryFilter;
    const matchesPayer = payerFilter === 'all' || denial.payer === payerFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesPayer;
  });

  // Get unique payers for filter
  const uniquePayers = [...new Set(mockDenials.map(d => d.payer))];

  // Denial by category for chart
  const denialsByCategory = [
    { category: 'Authorization', count: mockDenials.filter(d => d.denialCategory === 'authorization').length, color: 'bg-red-500' },
    { category: 'Coding', count: mockDenials.filter(d => d.denialCategory === 'coding').length, color: 'bg-orange-500' },
    { category: 'Eligibility', count: mockDenials.filter(d => d.denialCategory === 'eligibility').length, color: 'bg-yellow-500' },
    { category: 'Timely Filing', count: mockDenials.filter(d => d.denialCategory === 'timely_filing').length, color: 'bg-purple-500' },
    { category: 'Medical Necessity', count: mockDenials.filter(d => d.denialCategory === 'medical_necessity').length, color: 'bg-blue-500' },
    { category: 'Duplicate', count: mockDenials.filter(d => d.denialCategory === 'duplicate').length, color: 'bg-green-500' },
    { category: 'Other', count: mockDenials.filter(d => d.denialCategory === 'other').length, color: 'bg-gray-500' },
  ].filter(c => c.count > 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">New</span>;
      case 'under_review':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Under Review</span>;
      case 'appealed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Appealed</span>;
      case 'overturned':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Overturned</span>;
      case 'upheld':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Upheld</span>;
      case 'written_off':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Written Off</span>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      authorization: 'Authorization',
      eligibility: 'Eligibility',
      coding: 'Coding',
      timely_filing: 'Timely Filing',
      duplicate: 'Duplicate',
      medical_necessity: 'Medical Necessity',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const end = new Date(deadline);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6" data-testid="denials-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="denials-title">Denial Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track, appeal, and reduce claim denials
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Import Denials
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Denial Report
          </button>
        </div>
      </div>

      {/* Alert for Urgent Appeals */}
      {mockDenials.filter(d => getDaysUntilDeadline(d.appealDeadline) <= 7 && ['new', 'under_review'].includes(d.status)).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Urgent: Appeal Deadlines Approaching</h3>
              <p className="text-sm text-red-700 mt-1">
                {mockDenials.filter(d => getDaysUntilDeadline(d.appealDeadline) <= 7 && ['new', 'under_review'].includes(d.status)).length} denial(s)
                have appeal deadlines within 7 days. Review and file appeals immediately to avoid losing recovery opportunity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Denied (YTD)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDeniedAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">{totalDenials} denials</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recovered</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(recoveredAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">{overturned} overturned</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Recovery</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingRecovery)}</p>
              <p className="text-xs text-gray-500 mt-1">{newDenials + underReview + appealed} in process</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recovery Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalDenials > 0 ? Math.round((overturned / (overturned + upheld + writtenOff || 1)) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">of closed denials</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('new')}>
          <p className="text-xs font-medium text-gray-500">New</p>
          <p className="text-xl font-bold text-red-600">{newDenials}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('under_review')}>
          <p className="text-xs font-medium text-gray-500">Under Review</p>
          <p className="text-xl font-bold text-yellow-600">{underReview}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('appealed')}>
          <p className="text-xs font-medium text-gray-500">Appealed</p>
          <p className="text-xl font-bold text-blue-600">{appealed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('overturned')}>
          <p className="text-xs font-medium text-gray-500">Overturned</p>
          <p className="text-xl font-bold text-green-600">{overturned}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('upheld')}>
          <p className="text-xs font-medium text-gray-500">Upheld</p>
          <p className="text-xl font-bold text-gray-600">{upheld}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('written_off')}>
          <p className="text-xs font-medium text-gray-500">Written Off</p>
          <p className="text-xl font-bold text-gray-500">{writtenOff}</p>
        </div>
      </div>

      {/* Denial by Category */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Denials by Category</h3>
        <div className="space-y-3">
          {denialsByCategory.map(item => (
            <div key={item.category} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">{item.category}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-6 ${item.color} rounded-full flex items-center justify-end pr-2`}
                  style={{ width: `${(item.count / totalDenials) * 100}%`, minWidth: item.count > 0 ? '30px' : '0' }}
                >
                  <span className="text-xs font-medium text-white">{item.count}</span>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-500">
                {Math.round((item.count / totalDenials) * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, claim ID, or denial code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="appealed">Appealed</option>
              <option value="overturned">Overturned</option>
              <option value="upheld">Upheld</option>
              <option value="written_off">Written Off</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="authorization">Authorization</option>
              <option value="eligibility">Eligibility</option>
              <option value="coding">Coding</option>
              <option value="timely_filing">Timely Filing</option>
              <option value="duplicate">Duplicate</option>
              <option value="medical_necessity">Medical Necessity</option>
              <option value="other">Other</option>
            </select>
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payers</option>
              {uniquePayers.map(payer => (
                <option key={payer} value={payer}>{payer}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Denials Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Denials ({filteredDenials.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim / Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denial Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appeal Deadline</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDenials.map((denial) => {
                const daysLeft = getDaysUntilDeadline(denial.appealDeadline);
                const isUrgent = daysLeft <= 7 && ['new', 'under_review'].includes(denial.status);

                return (
                  <tr
                    key={denial.id}
                    className={`hover:bg-gray-50 cursor-pointer ${isUrgent ? 'bg-red-50' : ''}`}
                    onClick={() => setSelectedDenial(denial)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">{denial.claimId}</div>
                        <Link
                          to={`/patients/${denial.patientId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {denial.patientName}
                        </Link>
                        <div className="text-xs text-gray-500">{denial.payer}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{denial.serviceType}</div>
                        <div className="text-xs text-gray-500">{formatDate(denial.serviceDate)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{denial.denialCode}</div>
                        <div className="text-xs text-gray-600 max-w-xs truncate" title={denial.denialReason}>
                          {denial.denialReason}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {getCategoryLabel(denial.denialCategory)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">{formatCurrency(denial.deniedAmount)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{formatDate(denial.appealDeadline)}</div>
                        <div className={`text-xs ${isUrgent ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Expired'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(denial.status)}
                      {denial.assignedTo && (
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned: {denial.assignedTo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {['new', 'under_review'].includes(denial.status) && (
                          <button className="text-blue-600 hover:text-blue-800 font-medium">
                            Appeal
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-800">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Denial Detail Panel */}
      {selectedDenial && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Denial Details</h3>
            <button
              onClick={() => setSelectedDenial(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Claim Information</h4>
              <p className="text-lg font-semibold text-gray-900 font-mono">{selectedDenial.claimId}</p>
              <Link
                to={`/patients/${selectedDenial.patientId}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                {selectedDenial.patientName} ({selectedDenial.patientId})
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </Link>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Service Details</h4>
              <p className="text-lg font-semibold text-gray-900">{selectedDenial.serviceType}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(selectedDenial.serviceDate)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Payer</h4>
              <p className="text-lg font-semibold text-gray-900">{selectedDenial.payer}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Denial Code & Reason</h4>
              <p className="text-lg font-semibold text-gray-900">{selectedDenial.denialCode}</p>
              <p className="text-sm text-gray-600">{selectedDenial.denialReason}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                {getCategoryLabel(selectedDenial.denialCategory)}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Financial Impact</h4>
              <p className="text-sm text-gray-600">Billed: {formatCurrency(selectedDenial.billedAmount)}</p>
              <p className="text-lg font-semibold text-red-600">Denied: {formatCurrency(selectedDenial.deniedAmount)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Timeline</h4>
              <p className="text-sm text-gray-600">Denied: {formatDate(selectedDenial.denialDate)}</p>
              <p className="text-sm text-gray-600">
                Appeal Deadline: {formatDate(selectedDenial.appealDeadline)}
                <span className={`ml-2 ${getDaysUntilDeadline(selectedDenial.appealDeadline) <= 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  ({getDaysUntilDeadline(selectedDenial.appealDeadline)} days)
                </span>
              </p>
            </div>
          </div>

          {selectedDenial.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
              <p className="text-sm text-gray-700">{selectedDenial.notes}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
            {['new', 'under_review'].includes(selectedDenial.status) && (
              <>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                  File Appeal
                </button>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium">
                  Assign Reviewer
                </button>
              </>
            )}
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
              View Claim
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
              Add Note
            </button>
            {['new', 'under_review'].includes(selectedDenial.status) && (
              <button className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium">
                Write Off
              </button>
            )}
          </div>
        </div>
      )}

      {/* Common Denial Resolution Tips */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Denial Prevention Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">Authorization Issues</h4>
            </div>
            <p className="text-xs text-blue-700">
              Always verify authorization before service. Check auth dates, units remaining, and service codes match.
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DocumentMagnifyingGlassIcon className="h-5 w-5 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Eligibility Verification</h4>
            </div>
            <p className="text-xs text-green-700">
              Run eligibility check within 24 hours of service. Confirm coverage dates and plan details.
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-5 w-5 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-900">Timely Filing</h4>
            </div>
            <p className="text-xs text-purple-700">
              Submit claims within 72 hours of service completion. Monitor filing deadline by payer (typically 90-365 days).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// For backwards compatibility - export as named export too
export { DenialDashboard };
