import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  mockCaregiverBonusData,
  mockPaymentHistory,
  mockDashboardSummary,
  formatBonusType,
  CaregiverBonusEligibility,
  BonusPaymentHistory
} from '../../services/bonus.service';

type TabType = 'overview' | 'quality' | 'showup' | 'hours' | 'history';
type StatusFilter = 'all' | 'eligible' | 'pending' | 'ineligible' | 'paid';

export function CaregiverBonusDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverBonusEligibility | null>(null);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'quality', label: '90-Day Quality' },
    { id: 'showup', label: 'Show Up Bonus' },
    { id: 'hours', label: 'Hours Bonus' },
    { id: 'history', label: 'Payment History' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ineligible': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-400 text-yellow-900';
      case 'silver': return 'bg-gray-300 text-gray-800';
      case 'bronze': return 'bg-orange-300 text-orange-900';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filterByStatus = (data: CaregiverBonusEligibility[], bonusType: 'qualityBonus' | 'showUpBonus' | 'hoursBonus') => {
    if (statusFilter === 'all') return data;
    return data.filter(c => c[bonusType].status === statusFilter);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ${mockDashboardSummary.totalBonusesPaidYTD.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Bonuses Paid YTD</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              ${mockDashboardSummary.totalBonusesPending.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Pending Payout</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {mockDashboardSummary.averageEVVCompliance}%
            </div>
            <div className="text-sm text-gray-500">Avg EVV Compliance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {mockDashboardSummary.averageShiftCompletion}%
            </div>
            <div className="text-sm text-gray-500">Avg Shift Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Eligibility Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg">90-Day Quality Bonus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {mockDashboardSummary.eligibleForQualityBonus}
                </div>
                <div className="text-sm text-gray-500">Caregivers Eligible</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-gray-700">$250</div>
                <div className="text-xs text-gray-500">Per caregiver</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              <p>Requirements: 95% EVV + 95% shifts + 0 NCNS + 0 complaints</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Show Up Bonus (Q4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {mockDashboardSummary.eligibleForShowUpBonus}
                </div>
                <div className="text-sm text-gray-500">Caregivers Eligible</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-gray-700">$500</div>
                <div className="text-xs text-gray-500">Per quarter</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              <p>Requirements: Complete all assigned shifts with zero misses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-lg">Hours Bonus (2024)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {mockDashboardSummary.eligibleForHoursBonus}
                </div>
                <div className="text-sm text-gray-500">Caregivers Eligible</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-gray-700">$500-$1K</div>
                <div className="text-xs text-gray-500">Based on tier</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              <p>Bronze: 1,500 hrs | Silver: 1,750 hrs | Gold: 2,000+ hrs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Bonus Earners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Caregiver</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">EVV %</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Hours YTD</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Total Earned</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...mockCaregiverBonusData]
                  .sort((a, b) => b.totalEarned - a.totalEarned)
                  .slice(0, 5)
                  .map(caregiver => (
                    <tr key={caregiver.caregiverId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{caregiver.caregiverName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`${caregiver.qualityBonus.evvCompliance >= 95 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                          {caregiver.qualityBonus.evvCompliance}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {caregiver.hoursBonus.hoursWorked.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-green-600">
                          ${caregiver.totalEarned.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-yellow-600">
                          ${caregiver.totalPending.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQualityBonus = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>90-Day Quality Bonus Eligibility</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              $250 bonus for caregivers meeting all quality criteria after 90 days of employment
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="eligible">Eligible</option>
            <option value="pending">Pending (Under 90 Days)</option>
            <option value="ineligible">Not Eligible</option>
            <option value="paid">Already Paid</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Caregiver</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Days Employed</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">EVV % (95%+)</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Shifts % (95%+)</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">NCNS (0)</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Complaints (0)</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filterByStatus(mockCaregiverBonusData, 'qualityBonus').map(caregiver => (
                  <tr key={caregiver.caregiverId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{caregiver.caregiverName}</div>
                      <div className="text-xs text-gray-500">Hired: {caregiver.hireDate}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={caregiver.daysEmployed >= 90 ? 'text-green-600 font-semibold' : 'text-yellow-600'}>
                        {caregiver.daysEmployed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={caregiver.qualityBonus.evvCompliance >= 95 ? 'text-green-600' : 'text-red-600'}>
                        {caregiver.qualityBonus.evvCompliance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={caregiver.qualityBonus.scheduledShiftsCompleted >= 95 ? 'text-green-600' : 'text-red-600'}>
                        {caregiver.qualityBonus.scheduledShiftsCompleted}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={caregiver.qualityBonus.noCallNoShows === 0 ? 'text-green-600' : 'text-red-600'}>
                        {caregiver.qualityBonus.noCallNoShows}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={caregiver.qualityBonus.substantiatedComplaints === 0 ? 'text-green-600' : 'text-red-600'}>
                        {caregiver.qualityBonus.substantiatedComplaints}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caregiver.qualityBonus.status)}`}>
                        {caregiver.qualityBonus.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {caregiver.qualityBonus.status === 'eligible' && (
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Process Bonus
                        </button>
                      )}
                      {caregiver.qualityBonus.status === 'pending' && (
                        <span className="text-xs text-gray-500">
                          Eligible: {caregiver.qualityBonus.nextEligibleDate}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderShowUpBonus = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Show Up Bonus - Q4 2024</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              $500 quarterly bonus for completing all assigned shifts
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="eligible">Eligible</option>
            <option value="pending">In Progress</option>
            <option value="ineligible">Not Eligible</option>
            <option value="paid">Already Paid</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Caregiver</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Shifts Worked</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Shifts Required</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Missed Shifts</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Completion %</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filterByStatus(mockCaregiverBonusData, 'showUpBonus').map(caregiver => {
                  const completion = Math.round((caregiver.showUpBonus.shiftsWorked / caregiver.showUpBonus.shiftsRequired) * 100);
                  return (
                    <tr key={caregiver.caregiverId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{caregiver.caregiverName}</div>
                        <div className="text-xs text-gray-500">
                          {caregiver.showUpBonus.quarterStartDate} - {caregiver.showUpBonus.quarterEndDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {caregiver.showUpBonus.shiftsWorked}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {caregiver.showUpBonus.shiftsRequired}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={caregiver.showUpBonus.missedShifts === 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {caregiver.showUpBonus.missedShifts}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min(completion, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{completion}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caregiver.showUpBonus.status)}`}>
                          {caregiver.showUpBonus.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {caregiver.showUpBonus.status === 'eligible' && (
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Process Bonus
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHoursBonus = () => (
    <div className="space-y-4">
      {/* Tier Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center">
                <span className="text-orange-900 font-bold">B</span>
              </div>
              <div>
                <div className="font-semibold text-orange-900">Bronze Tier</div>
                <div className="text-sm text-orange-700">1,500+ hours = $500</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-100 border-gray-300">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-800 font-bold">S</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Silver Tier</div>
                <div className="text-sm text-gray-600">1,750+ hours = $750</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                <span className="text-yellow-900 font-bold">G</span>
              </div>
              <div>
                <div className="font-semibold text-yellow-900">Gold Tier</div>
                <div className="text-sm text-yellow-700">2,000+ hours = $1,000</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hours Bonus - 2024</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Annual bonus based on total hours worked
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="eligible">Eligible</option>
            <option value="pending">In Progress</option>
            <option value="paid">Already Paid</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Caregiver</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Hours Worked</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Progress</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Current Tier</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Bonus Amount</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filterByStatus(mockCaregiverBonusData, 'hoursBonus').map(caregiver => {
                  const hoursToNextTier = caregiver.hoursBonus.tier === 'none' ? 1500 - caregiver.hoursBonus.hoursWorked
                    : caregiver.hoursBonus.tier === 'bronze' ? 1750 - caregiver.hoursBonus.hoursWorked
                    : caregiver.hoursBonus.tier === 'silver' ? 2000 - caregiver.hoursBonus.hoursWorked
                    : 0;

                  const progressPercent = Math.min(100, (caregiver.hoursBonus.hoursWorked / 2000) * 100);

                  return (
                    <tr key={caregiver.caregiverId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{caregiver.caregiverName}</div>
                        <div className="text-xs text-gray-500">
                          {caregiver.hoursBonus.yearStartDate} - {caregiver.hoursBonus.yearEndDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-900">
                          {caregiver.hoursBonus.hoursWorked.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                caregiver.hoursBonus.tier === 'gold' ? 'bg-yellow-400' :
                                caregiver.hoursBonus.tier === 'silver' ? 'bg-gray-400' :
                                caregiver.hoursBonus.tier === 'bronze' ? 'bg-orange-400' : 'bg-blue-400'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                        {hoursToNextTier > 0 && caregiver.hoursBonus.tier !== 'gold' && (
                          <div className="text-xs text-gray-500 mt-1">
                            {hoursToNextTier.toLocaleString()} hrs to next tier
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTierColor(caregiver.hoursBonus.tier)}`}>
                          {caregiver.hoursBonus.tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-green-600">
                          ${caregiver.hoursBonus.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caregiver.hoursBonus.status)}`}>
                          {caregiver.hoursBonus.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {caregiver.hoursBonus.status === 'eligible' && (
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Process Bonus
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bonus Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Payment Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Caregiver</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Bonus Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Period</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Payroll Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockPaymentHistory.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{payment.paidDate}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{payment.caregiverName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.bonusType === '90_day_quality' ? 'bg-green-100 text-green-800' :
                        payment.bonusType === 'show_up_quarterly' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {formatBonusType(payment.bonusType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {payment.periodStart} to {payment.periodEnd}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-green-600">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {payment.payrollRunId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caregiver Bonus Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track and process caregiver bonuses based on performance metrics
          </p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
          Process All Eligible Bonuses
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusFilter('all');
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'quality' && renderQualityBonus()}
      {activeTab === 'showup' && renderShowUpBonus()}
      {activeTab === 'hours' && renderHoursBonus()}
      {activeTab === 'history' && renderPaymentHistory()}
    </div>
  );
}
