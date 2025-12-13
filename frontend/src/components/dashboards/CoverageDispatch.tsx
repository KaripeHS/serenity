import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  mockCoverageGaps,
  mockAvailableCaregivers,
  mockDispatchStats,
  getPriorityColor,
  getStatusColor,
  getResponseColor,
  getReasonLabel,
  CoverageGap,
  AvailableCaregiver
} from '../../services/dispatch.service';

type ViewType = 'board' | 'list';
type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export function CoverageDispatch() {
  const [view, setView] = useState<ViewType>('board');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedGap, setSelectedGap] = useState<CoverageGap | null>(null);
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);

  const openGaps = mockCoverageGaps.filter(g => g.status === 'open');
  const offeredGaps = mockCoverageGaps.filter(g => g.status === 'offered');
  const filledGaps = mockCoverageGaps.filter(g => g.status === 'filled');

  const filteredGaps = priorityFilter === 'all'
    ? mockCoverageGaps
    : mockCoverageGaps.filter(g => g.priority === priorityFilter);

  const handleDispatch = (gap: CoverageGap) => {
    setSelectedGap(gap);
    setShowDispatchPanel(true);
  };

  const renderKPIs = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-red-600">{mockDispatchStats.criticalGaps}</div>
          <div className="text-xs text-red-700">Critical Gaps</div>
        </CardContent>
      </Card>
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-orange-600">{mockDispatchStats.highPriorityGaps}</div>
          <div className="text-xs text-orange-700">High Priority</div>
        </CardContent>
      </Card>
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-yellow-600">{mockDispatchStats.pendingOffers}</div>
          <div className="text-xs text-yellow-700">Pending Offers</div>
        </CardContent>
      </Card>
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-green-600">{mockDispatchStats.gapsFilledToday}</div>
          <div className="text-xs text-green-700">Filled Today</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-blue-600">{mockDispatchStats.availableCaregivers}</div>
          <div className="text-xs text-gray-600">Available Now</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-purple-600">{mockDispatchStats.averageTimeToFill}</div>
          <div className="text-xs text-gray-600">Avg Fill Time</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-indigo-600">{mockDispatchStats.fillRate}%</div>
          <div className="text-xs text-gray-600">Fill Rate</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-gray-700">{mockDispatchStats.totalGaps}</div>
          <div className="text-xs text-gray-600">Total Gaps</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGapCard = (gap: CoverageGap) => (
    <div
      key={gap.id}
      className={`p-4 border-l-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        gap.priority === 'critical' ? 'border-l-red-500' :
        gap.priority === 'high' ? 'border-l-orange-500' :
        gap.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
      }`}
      onClick={() => handleDispatch(gap)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-gray-900">{gap.clientName}</div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gap.status)}`}>
          {gap.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div className="text-sm text-gray-600 mb-2">{gap.scheduledTime}</div>
      <div className="text-xs text-gray-500 mb-2">{gap.serviceType} • {gap.shiftDuration}</div>
      {gap.originalCaregiver && (
        <div className="text-xs text-gray-500">
          <span className="text-red-600">{getReasonLabel(gap.originalCaregiver.reason)}</span>: {gap.originalCaregiver.name}
        </div>
      )}
      {gap.requiredCredentials.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {gap.requiredCredentials.map(cred => (
            <span key={cred} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {cred}
            </span>
          ))}
        </div>
      )}
      {gap.dispatchAttempts.length > 0 && (
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          {gap.dispatchAttempts.length} dispatch attempt{gap.dispatchAttempts.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  const renderBoardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Open Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Open ({openGaps.length})
          </h3>
        </div>
        <div className="space-y-3">
          {openGaps.map(gap => renderGapCard(gap))}
          {openGaps.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
              No open gaps
            </div>
          )}
        </div>
      </div>

      {/* Offered Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            Offered ({offeredGaps.length})
          </h3>
        </div>
        <div className="space-y-3">
          {offeredGaps.map(gap => renderGapCard(gap))}
          {offeredGaps.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
              No pending offers
            </div>
          )}
        </div>
      </div>

      {/* Filled Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Filled ({filledGaps.length})
          </h3>
        </div>
        <div className="space-y-3">
          {filledGaps.map(gap => renderGapCard(gap))}
          {filledGaps.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
              No filled gaps today
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Date/Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Service</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Attempts</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGaps.map(gap => (
                <tr key={gap.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                      {gap.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{gap.clientName}</div>
                    <div className="text-xs text-gray-500">{gap.clientAddress}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{gap.scheduledDate}</div>
                    <div className="text-xs text-gray-500">{gap.scheduledTime}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{gap.serviceType}</div>
                    <div className="text-xs text-gray-500">{gap.shiftDuration}</div>
                  </td>
                  <td className="px-4 py-3">
                    {gap.originalCaregiver ? (
                      <div>
                        <div className="text-red-600 font-medium text-xs">
                          {getReasonLabel(gap.originalCaregiver.reason)}
                        </div>
                        <div className="text-xs text-gray-500">{gap.originalCaregiver.name}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">New client</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gap.status)}`}>
                      {gap.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {gap.dispatchAttempts.length}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {gap.status !== 'filled' && (
                      <button
                        onClick={() => handleDispatch(gap)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Dispatch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderDispatchPanel = () => {
    if (!selectedGap || !showDispatchPanel) return null;

    const sortedCaregivers = [...mockAvailableCaregivers].sort((a, b) => b.matchScore - a.matchScore);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
        <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dispatch Caregiver</h2>
              <p className="text-sm text-gray-500">{selectedGap.clientName} - {selectedGap.scheduledTime}</p>
            </div>
            <button
              onClick={() => setShowDispatchPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Gap Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shift Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Client</div>
                    <div className="font-medium">{selectedGap.clientName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Address</div>
                    <div className="font-medium">{selectedGap.clientAddress}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date/Time</div>
                    <div className="font-medium">{selectedGap.scheduledDate} • {selectedGap.scheduledTime}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Service</div>
                    <div className="font-medium">{selectedGap.serviceType} ({selectedGap.shiftDuration})</div>
                  </div>
                  {selectedGap.requiredCredentials.length > 0 && (
                    <div className="col-span-2">
                      <div className="text-gray-500 mb-1">Required Credentials</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedGap.requiredCredentials.map(cred => (
                          <span key={cred} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {cred}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedGap.specialInstructions && (
                    <div className="col-span-2">
                      <div className="text-gray-500 mb-1">Special Instructions</div>
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        {selectedGap.specialInstructions}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Previous Attempts */}
            {selectedGap.dispatchAttempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Previous Dispatch Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedGap.dispatchAttempts.map(attempt => (
                      <div key={attempt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{attempt.caregiverName}</div>
                          <div className="text-xs text-gray-500">
                            {attempt.method.toUpperCase()} sent at {new Date(attempt.sentAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getResponseColor(attempt.response)}`}>
                          {attempt.response.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Caregivers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Caregivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedCaregivers.map(caregiver => {
                    const hasRequiredCreds = selectedGap.requiredCredentials.every(
                      req => caregiver.credentials.includes(req)
                    );

                    return (
                      <div
                        key={caregiver.id}
                        className={`p-4 border rounded-lg ${
                          caregiver.availability !== 'available' ? 'bg-gray-50 opacity-60' :
                          !hasRequiredCreds ? 'bg-red-50' : 'bg-white hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">{caregiver.name}</div>
                              {caregiver.previouslyServedClient && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                  Prev. Served
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {caregiver.distanceToClient} mi away • {caregiver.hoursThisWeek}/{caregiver.maxHoursWeek} hrs this week
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {caregiver.credentials.map(cred => (
                                <span
                                  key={cred}
                                  className={`px-1.5 py-0.5 text-xs rounded ${
                                    selectedGap.requiredCredentials.includes(cred)
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {cred}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${
                              caregiver.matchScore >= 80 ? 'text-green-600' :
                              caregiver.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {caregiver.matchScore}%
                            </div>
                            <div className="text-xs text-gray-500">Match Score</div>
                          </div>
                        </div>

                        {caregiver.availability === 'available' && hasRequiredCreds && (
                          <div className="mt-3 pt-3 border-t flex gap-2">
                            <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                              Send SMS
                            </button>
                            <button className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                              Push Notification
                            </button>
                            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                              Call
                            </button>
                          </div>
                        )}

                        {caregiver.availability !== 'available' && (
                          <div className="mt-2 text-xs text-orange-600">
                            Currently {caregiver.availability.replace('_', ' ')}
                          </div>
                        )}

                        {!hasRequiredCreds && caregiver.availability === 'available' && (
                          <div className="mt-2 text-xs text-red-600">
                            Missing required credentials
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Broadcast Option */}
            <Card className="border-2 border-dashed border-blue-300">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-blue-600 text-2xl mb-2">📢</div>
                  <h3 className="font-semibold text-gray-900">Broadcast to All Available</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Send this shift opportunity to all {mockAvailableCaregivers.filter(c => c.availability === 'available').length} available caregivers
                  </p>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Broadcast Shift
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coverage Gap Dispatch</h1>
          <p className="text-gray-600 mt-1">
            Identify and fill uncovered shifts in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setView('board')}
              className={`px-4 py-2 text-sm ${view === 'board' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* Main Content */}
      {view === 'board' ? renderBoardView() : renderListView()}

      {/* Dispatch Panel */}
      {renderDispatchPanel()}
    </div>
  );
}
