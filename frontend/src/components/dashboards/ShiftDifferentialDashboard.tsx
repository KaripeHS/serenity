/**
 * Shift Differential Pay Dashboard
 * Configure and track shift differentials for weekends, holidays, nights, and skills
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Calendar,
  Clock,
  Sun,
  Moon,
  Zap,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Award,
  Star,
} from 'lucide-react';

// Types
interface DifferentialRule {
  id: string;
  name: string;
  type: 'weekend' | 'holiday' | 'night' | 'skill' | 'overtime';
  rateType: 'percentage' | 'flat';
  rateValue: number;
  conditions: {
    dayOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    skillRequired?: string;
    holidayName?: string;
  };
  isActive: boolean;
  effectiveDate: string;
  expirationDate: string | null;
  priority: number;
  description: string;
}

interface HolidayCalendar {
  id: string;
  year: number;
  holidays: {
    date: string;
    name: string;
    rateMultiplier: number;
    isObserved: boolean;
  }[];
}

interface DifferentialApplication {
  id: string;
  caregiverId: string;
  caregiverName: string;
  visitId: string;
  visitDate: string;
  clientName: string;
  ruleApplied: string;
  baseRate: number;
  differentialAmount: number;
  totalPay: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
}

interface DashboardMetrics {
  totalDifferentialPaidMTD: number;
  weekendShiftsPaidMTD: number;
  holidayPayMTD: number;
  nightShiftsPaidMTD: number;
  skillPayMTD: number;
  avgDifferentialPerShift: number;
  activeRules: number;
  pendingApprovals: number;
}

// Mock Data
const mockMetrics: DashboardMetrics = {
  totalDifferentialPaidMTD: 24560,
  weekendShiftsPaidMTD: 8920,
  holidayPayMTD: 4200,
  nightShiftsPaidMTD: 6840,
  skillPayMTD: 4600,
  avgDifferentialPerShift: 18.50,
  activeRules: 12,
  pendingApprovals: 8,
};

const mockRules: DifferentialRule[] = [
  {
    id: '1',
    name: 'Weekend Premium',
    type: 'weekend',
    rateType: 'percentage',
    rateValue: 15,
    conditions: { dayOfWeek: [0, 6] },
    isActive: true,
    effectiveDate: '2024-01-01',
    expirationDate: null,
    priority: 1,
    description: '15% premium for Saturday and Sunday shifts',
  },
  {
    id: '2',
    name: 'Night Shift Differential',
    type: 'night',
    rateType: 'flat',
    rateValue: 2.50,
    conditions: { startTime: '22:00', endTime: '06:00' },
    isActive: true,
    effectiveDate: '2024-01-01',
    expirationDate: null,
    priority: 2,
    description: '$2.50/hour extra for shifts between 10PM and 6AM',
  },
  {
    id: '3',
    name: 'Holiday Pay - Double Time',
    type: 'holiday',
    rateType: 'percentage',
    rateValue: 100,
    conditions: {},
    isActive: true,
    effectiveDate: '2024-01-01',
    expirationDate: null,
    priority: 3,
    description: 'Double time for all major holidays',
  },
  {
    id: '4',
    name: 'Dementia Care Skill Premium',
    type: 'skill',
    rateType: 'flat',
    rateValue: 3.00,
    conditions: { skillRequired: 'Dementia Care Certification' },
    isActive: true,
    effectiveDate: '2024-01-01',
    expirationDate: null,
    priority: 4,
    description: '$3.00/hour extra for dementia care certified staff',
  },
  {
    id: '5',
    name: 'Overtime (>40 hrs)',
    type: 'overtime',
    rateType: 'percentage',
    rateValue: 50,
    conditions: {},
    isActive: true,
    effectiveDate: '2024-01-01',
    expirationDate: null,
    priority: 5,
    description: '1.5x pay for hours over 40 per week',
  },
];

const mockHolidayCalendar: HolidayCalendar = {
  id: '2024',
  year: 2024,
  holidays: [
    { date: '2024-01-01', name: "New Year's Day", rateMultiplier: 2.0, isObserved: true },
    { date: '2024-01-15', name: 'Martin Luther King Jr. Day', rateMultiplier: 1.5, isObserved: true },
    { date: '2024-02-19', name: "Presidents' Day", rateMultiplier: 1.5, isObserved: true },
    { date: '2024-05-27', name: 'Memorial Day', rateMultiplier: 2.0, isObserved: true },
    { date: '2024-07-04', name: 'Independence Day', rateMultiplier: 2.0, isObserved: true },
    { date: '2024-09-02', name: 'Labor Day', rateMultiplier: 2.0, isObserved: true },
    { date: '2024-11-28', name: 'Thanksgiving Day', rateMultiplier: 2.0, isObserved: true },
    { date: '2024-12-25', name: 'Christmas Day', rateMultiplier: 2.0, isObserved: true },
  ],
};

const mockApplications: DifferentialApplication[] = [
  {
    id: '1',
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    visitId: 'v-001',
    visitDate: '2024-12-07',
    clientName: 'Dorothy Williams',
    ruleApplied: 'Weekend Premium',
    baseRate: 15.00,
    differentialAmount: 9.00,
    totalPay: 69.00,
    status: 'approved',
  },
  {
    id: '2',
    caregiverId: 'cg-002',
    caregiverName: 'James Wilson',
    visitId: 'v-002',
    visitDate: '2024-12-08',
    clientName: 'Robert Johnson',
    ruleApplied: 'Night Shift + Weekend',
    baseRate: 14.50,
    differentialAmount: 14.68,
    totalPay: 87.38,
    status: 'pending',
  },
  {
    id: '3',
    caregiverId: 'cg-003',
    caregiverName: 'Sarah Johnson',
    visitId: 'v-003',
    visitDate: '2024-11-28',
    clientName: 'Margaret Davis',
    ruleApplied: 'Holiday Pay - Double Time',
    baseRate: 16.00,
    differentialAmount: 64.00,
    totalPay: 128.00,
    status: 'paid',
  },
];

export default function ShiftDifferentialDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'holidays' | 'applications'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [metrics] = useState<DashboardMetrics>(mockMetrics);
  const [rules, setRules] = useState<DifferentialRule[]>(mockRules);
  const [holidayCalendar] = useState<HolidayCalendar>(mockHolidayCalendar);
  const [applications] = useState<DifferentialApplication[]>(mockApplications);

  const getTypeIcon = (type: DifferentialRule['type']) => {
    const icons: Record<DifferentialRule['type'], React.ReactNode> = {
      weekend: <Calendar className="w-4 h-4" />,
      holiday: <Star className="w-4 h-4" />,
      night: <Moon className="w-4 h-4" />,
      skill: <Award className="w-4 h-4" />,
      overtime: <Clock className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getTypeColor = (type: DifferentialRule['type']) => {
    const colors: Record<DifferentialRule['type'], string> = {
      weekend: 'bg-blue-100 text-blue-800',
      holiday: 'bg-purple-100 text-purple-800',
      night: 'bg-indigo-100 text-indigo-800',
      skill: 'bg-green-100 text-green-800',
      overtime: 'bg-orange-100 text-orange-800',
    };
    return colors[type];
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      disputed: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const toggleRuleActive = (ruleId: string) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.caregiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Differential Pay</h1>
          <p className="text-gray-500">Configure and track shift differentials and premiums</p>
        </div>
        <button
          onClick={() => setShowNewRuleDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Differential MTD</p>
              <p className="text-2xl font-bold">${metrics.totalDifferentialPaidMTD.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Avg ${metrics.avgDifferentialPerShift.toFixed(2)}/shift</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Weekend Pay MTD</p>
              <p className="text-2xl font-bold">${metrics.weekendShiftsPaidMTD.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Holiday Pay MTD</p>
              <p className="text-2xl font-bold">${metrics.holidayPayMTD.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Night Shift Pay MTD</p>
              <p className="text-2xl font-bold">${metrics.nightShiftsPaidMTD.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Skill Pay MTD</span>
            <Award className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">${metrics.skillPayMTD.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active Rules</span>
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold">{metrics.activeRules}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Pending Approvals</span>
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-xl font-bold text-yellow-600">{metrics.pendingApprovals}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg Differential</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl font-bold">${metrics.avgDifferentialPerShift.toFixed(2)}/shift</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'rules', label: 'Rules' },
            { id: 'holidays', label: 'Holiday Calendar' },
            { id: 'applications', label: 'Applications' },
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
          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Cost Breakdown by Type</h3>
            <div className="space-y-4">
              {[
                { label: 'Weekend', amount: metrics.weekendShiftsPaidMTD, color: 'bg-blue-500', pct: 36 },
                { label: 'Night Shift', amount: metrics.nightShiftsPaidMTD, color: 'bg-indigo-500', pct: 28 },
                { label: 'Skill Premium', amount: metrics.skillPayMTD, color: 'bg-green-500', pct: 19 },
                { label: 'Holiday', amount: metrics.holidayPayMTD, color: 'bg-purple-500', pct: 17 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">${item.amount.toLocaleString()} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Rules */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Active Rules</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {rules.filter(r => r.isActive).slice(0, 5).map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${getTypeColor(rule.type)}`}>
                      {getTypeIcon(rule.type)}
                    </div>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-gray-500">
                        {rule.rateType === 'percentage' ? `+${rule.rateValue}%` : `+$${rule.rateValue.toFixed(2)}/hr`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-lg border p-4 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Differential Applications</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Caregiver</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Client</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Rule Applied</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Differential</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.slice(0, 5).map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{app.caregiverName}</td>
                    <td className="px-4 py-2 text-sm">{app.clientName}</td>
                    <td className="px-4 py-2 text-sm">{app.visitDate}</td>
                    <td className="px-4 py-2 text-sm">{app.ruleApplied}</td>
                    <td className="px-4 py-2 text-right font-medium text-green-600">+${app.differentialAmount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {rules.map(rule => (
              <div key={rule.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(rule.type)}`}>
                      {getTypeIcon(rule.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(rule.type)}`}>
                        {rule.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRuleActive(rule.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        rule.isActive ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <span className="font-medium text-lg text-green-600">
                      {rule.rateType === 'percentage' ? `+${rule.rateValue}%` : `+$${rule.rateValue.toFixed(2)}/hr`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Holiday Calendar {holidayCalendar.year}</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm">
                <Plus className="w-4 h-4" />
                Add Holiday
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Holiday</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Rate Multiplier</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Observed</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {holidayCalendar.holidays.map((holiday, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{holiday.date}</td>
                  <td className="px-4 py-3">{holiday.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                      {holiday.rateMultiplier}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {holiday.isObserved ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by caregiver or client..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Caregiver</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Visit Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rule Applied</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Base Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Differential</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{app.caregiverName}</td>
                    <td className="px-4 py-3 text-sm">{app.clientName}</td>
                    <td className="px-4 py-3 text-sm">{app.visitDate}</td>
                    <td className="px-4 py-3 text-sm">{app.ruleApplied}</td>
                    <td className="px-4 py-3 text-right">${app.baseRate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">+${app.differentialAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${app.totalPay.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {app.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <button className="p-1.5 hover:bg-green-100 rounded" title="Approve">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                          <button className="p-1.5 hover:bg-red-100 rounded" title="Dispute">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Rule Dialog */}
      {showNewRuleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Differential Rule</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Weekend Premium" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option value="weekend">Weekend</option>
                  <option value="holiday">Holiday</option>
                  <option value="night">Night Shift</option>
                  <option value="skill">Skill Premium</option>
                  <option value="overtime">Overtime</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rate Type</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Rate ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="15" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Describe when this rule applies..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Effective Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" className="rounded" defaultChecked />
                <label htmlFor="active" className="text-sm">Active immediately</label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRuleDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
