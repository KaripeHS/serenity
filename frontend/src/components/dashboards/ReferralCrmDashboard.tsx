/**
 * Referral CRM Dashboard
 * Manage leads, referral partners, marketing campaigns, and conversion analytics
 */

import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  UserPlus,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

// Types
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  serviceInterest: string;
  estimatedValue: number;
  assignedTo: string;
  notes: string;
  createdAt: string;
  lastContact: string;
  nextFollowUp: string | null;
}

interface Partner {
  id: string;
  name: string;
  type: 'hospital' | 'physician' | 'snf' | 'aaa' | 'insurance' | 'community';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  referralCount: number;
  conversionRate: number;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'pending';
  lastReferral: string | null;
  commissionRate: number;
}

interface Campaign {
  id: string;
  name: string;
  type: 'digital' | 'print' | 'event' | 'partner' | 'referral';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  startDate: string;
  endDate: string;
  roi: number;
}

interface DashboardMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  avgDealSize: number;
  activePartners: number;
  monthlyReferrals: number;
  pipelineValue: number;
  wonThisMonth: number;
}

interface Pipeline {
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  negotiation: number;
}

// Mock Data
const mockMetrics: DashboardMetrics = {
  totalLeads: 156,
  newLeadsThisMonth: 42,
  conversionRate: 32.5,
  avgDealSize: 4800,
  activePartners: 28,
  monthlyReferrals: 67,
  pipelineValue: 285000,
  wonThisMonth: 18,
};

const mockPipeline: Pipeline = {
  new: 24,
  contacted: 18,
  qualified: 12,
  proposal: 8,
  negotiation: 5,
};

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Dorothy Williams',
    phone: '614-555-0123',
    email: 'dwilliams@email.com',
    source: 'Hospital Discharge',
    status: 'qualified',
    serviceInterest: 'Personal Care',
    estimatedValue: 5200,
    assignedTo: 'Jennifer Adams',
    notes: 'Needs help with ADLs after hip replacement',
    createdAt: '2024-12-01',
    lastContact: '2024-12-10',
    nextFollowUp: '2024-12-15',
  },
  {
    id: '2',
    name: 'Robert Johnson',
    phone: '614-555-0456',
    email: 'rjohnson@email.com',
    source: 'Website',
    status: 'proposal',
    serviceInterest: 'Homemaker',
    estimatedValue: 3600,
    assignedTo: 'Sarah Miller',
    notes: 'Private pay client, interested in weekly services',
    createdAt: '2024-11-28',
    lastContact: '2024-12-08',
    nextFollowUp: '2024-12-12',
  },
  {
    id: '3',
    name: 'Margaret Davis',
    phone: '614-555-0789',
    email: 'mdavis@email.com',
    source: 'Physician Referral',
    status: 'new',
    serviceInterest: 'Skilled Nursing',
    estimatedValue: 8400,
    assignedTo: 'Jennifer Adams',
    notes: 'Complex care needs, dementia diagnosis',
    createdAt: '2024-12-10',
    lastContact: '2024-12-10',
    nextFollowUp: '2024-12-11',
  },
];

const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Ohio State Medical Center',
    type: 'hospital',
    contactName: 'Lisa Thompson',
    contactPhone: '614-555-1000',
    contactEmail: 'lthompson@osmc.org',
    address: '456 Medical Center Dr, Columbus, OH 43210',
    referralCount: 45,
    conversionRate: 68,
    totalRevenue: 156000,
    status: 'active',
    lastReferral: '2024-12-08',
    commissionRate: 5,
  },
  {
    id: '2',
    name: 'Central Ohio AAA',
    type: 'aaa',
    contactName: 'Michael Brown',
    contactPhone: '614-555-2000',
    contactEmail: 'mbrown@coaaa.org',
    address: '789 Senior Services Blvd, Columbus, OH 43215',
    referralCount: 32,
    conversionRate: 75,
    totalRevenue: 98000,
    status: 'active',
    lastReferral: '2024-12-05',
    commissionRate: 3,
  },
];

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q4 Hospital Outreach',
    type: 'partner',
    status: 'active',
    budget: 15000,
    spent: 8500,
    leads: 28,
    conversions: 12,
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    roi: 245,
  },
  {
    id: '2',
    name: 'Digital Marketing - Google Ads',
    type: 'digital',
    status: 'active',
    budget: 5000,
    spent: 4200,
    leads: 45,
    conversions: 8,
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    roi: 156,
  },
];

export default function ReferralCrmDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'partners' | 'campaigns'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [showNewPartnerDialog, setShowNewPartnerDialog] = useState(false);
  const [metrics] = useState<DashboardMetrics>(mockMetrics);
  const [pipeline] = useState<Pipeline>(mockPipeline);
  const [leads] = useState<Lead[]>(mockLeads);
  const [partners] = useState<Partner[]>(mockPartners);
  const [campaigns] = useState<Campaign[]>(mockCampaigns);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal: 'bg-indigo-100 text-indigo-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPartnerTypeIcon = (type: Partner['type']) => {
    const icons: Record<Partner['type'], React.ReactNode> = {
      hospital: <Building className="w-4 h-4" />,
      physician: <Users className="w-4 h-4" />,
      snf: <Building className="w-4 h-4" />,
      aaa: <Users className="w-4 h-4" />,
      insurance: <DollarSign className="w-4 h-4" />,
      community: <MapPin className="w-4 h-4" />,
    };
    return icons[type];
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral CRM</h1>
          <p className="text-gray-500">Manage leads, partners, and marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewPartnerDialog(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Building className="w-4 h-4" />
            Add Partner
          </button>
          <button
            onClick={() => setShowNewLeadDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold">{metrics.totalLeads}</p>
              <p className="text-xs text-green-600">+{metrics.newLeadsThisMonth} this month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              <p className="text-xs text-green-600">{metrics.wonThisMonth} won this month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pipeline Value</p>
              <p className="text-2xl font-bold">${(metrics.pipelineValue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Avg: ${metrics.avgDealSize.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Partners</p>
              <p className="text-2xl font-bold">{metrics.activePartners}</p>
              <p className="text-xs text-gray-500">{metrics.monthlyReferrals} referrals/month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'leads', label: 'Leads' },
            { id: 'partners', label: 'Partners' },
            { id: 'campaigns', label: 'Campaigns' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Pipeline */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Sales Pipeline</h3>
            <div className="space-y-3">
              {Object.entries(pipeline).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className="w-24 text-sm capitalize">{stage}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(count / 30) * 100}%`, minWidth: count > 0 ? '40px' : '0' }}
                    >
                      <span className="text-xs text-white font-medium">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Leads</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-gray-500">{lead.source}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Partners */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Top Referral Partners</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {partners.slice(0, 5).map(partner => (
                <div key={partner.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      {getPartnerTypeIcon(partner.type)}
                    </div>
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-gray-500">{partner.referralCount} referrals</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">{partner.conversionRate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Campaign Performance</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="p-2 hover:bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">{campaign.name}</p>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{campaign.leads} leads / {campaign.conversions} converted</span>
                    <span className="text-green-600 font-medium">{campaign.roi}% ROI</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigned</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</p>
                        <p className="flex items-center gap-1 text-gray-500"><Mail className="w-3 h-3" /> {lead.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{lead.source}</td>
                    <td className="px-4 py-3 text-sm">{lead.serviceInterest}</td>
                    <td className="px-4 py-3 font-medium">${lead.estimatedValue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{lead.assignedTo}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded">
                          <Phone className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {partners.map(partner => (
              <div key={partner.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getPartnerTypeIcon(partner.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{partner.name}</h3>
                      <span className="text-sm text-gray-500 capitalize">{partner.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(partner.status)}`}>
                    {partner.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {partner.contactName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {partner.contactPhone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {partner.contactEmail}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{partner.referralCount}</p>
                    <p className="text-xs text-gray-500">Referrals</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{partner.conversionRate}%</p>
                    <p className="text-xs text-gray-500">Conversion</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">${(partner.totalRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Campaign</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Budget</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Spent</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Leads</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Conversions</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">ROI</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-gray-500">{campaign.startDate} - {campaign.endDate}</p>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{campaign.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">${campaign.budget.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">${campaign.spent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{campaign.leads}</td>
                  <td className="px-4 py-3 text-center">{campaign.conversions}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={campaign.roi > 100 ? 'text-green-600 font-medium' : 'text-red-600'}>
                      {campaign.roi}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Lead Dialog */}
      {showNewLeadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Lead</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Website</option>
                  <option>Hospital Discharge</option>
                  <option>Physician Referral</option>
                  <option>Partner Referral</option>
                  <option>Phone Inquiry</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Interest</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Personal Care</option>
                  <option>Homemaker</option>
                  <option>Respite Care</option>
                  <option>Skilled Nursing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewLeadDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Partner Dialog */}
      {showNewPartnerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Referral Partner</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option value="hospital">Hospital</option>
                  <option value="physician">Physician</option>
                  <option value="snf">Skilled Nursing Facility</option>
                  <option value="aaa">Area Agency on Aging</option>
                  <option value="insurance">Insurance</option>
                  <option value="community">Community Organization</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg" min="0" max="100" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPartnerDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
