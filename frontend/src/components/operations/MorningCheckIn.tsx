/**
 * Morning Check-In Dashboard
 * Real-time operational dashboard showing today's visit status
 *
 * Critical features:
 * - Today's scheduled visits with clock-in status
 * - Sandata acceptance/rejection tracking
 * - Coverage gap detection
 * - One-click dispatch to on-call
 * - Auto-refresh every 30 seconds
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TodaysVisit {
  id: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  caregiverSPI: number;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  clockInLat: number | null;
  clockInLon: number | null;
  geofenceValid: boolean | null;
  sandataStatus: 'not_submitted' | 'pending' | 'accepted' | 'rejected';
  sandataSubmittedAt: Date | null;
  sandataRespondedAt: Date | null;
  sandataRejectionCode: string | null;
  sandataRejectionReason: string | null;
  status: 'scheduled' | 'on_time' | 'late' | 'no_show' | 'in_progress' | 'completed';
  minutesLate: number | null;
  needsDispatch: boolean;
  podId: string;
  podCode: string;
  podLeadName: string;
}

interface CheckInSummary {
  date: Date;
  podId: string | null;
  totalScheduled: number;
  onTime: number;
  late: number;
  noShows: number;
  inProgress: number;
  completed: number;
  needingDispatch: number;
  evvCompliance: number;
  sandataAcceptance: number;
}

interface OnCallCaregiver {
  id: string;
  name: string;
  phone: string;
  role: string;
  spiScore: number;
  availableUntil: Date;
  distanceFromGap: number | null;
  currentAssignments: number;
  maxAssignments: number;
}

export function MorningCheckIn() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<TodaysVisit[]>([]);
  const [summary, setSummary] = useState<CheckInSummary | null>(null);
  const [onCall, setOnCall] = useState<OnCallCaregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'issues' | 'no_show' | 'late' | 'in_progress'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<TodaysVisit | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [visitsRes, summaryRes] = await Promise.all([
        fetch('/api/console/check-in/today'),
        fetch('/api/console/check-in/summary')
      ]);

      const visitsData = await visitsRes.json();
      const summaryData = await summaryRes.json();

      setVisits(visitsData.visits || []);
      setSummary(summaryData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnCall = async (visitId?: string) => {
    try {
      const visit = visits.find(v => v.id === visitId);
      const params = new URLSearchParams();
      if (visit && visit.clockInLat && visit.clockInLon) {
        params.append('lat', visit.clockInLat.toString());
        params.append('lon', visit.clockInLon.toString());
      }

      const res = await fetch(`/api/console/check-in/on-call?${params}`);
      const data = await res.json();
      setOnCall(data.caregivers || []);
    } catch (error) {
      console.error('Failed to fetch on-call caregivers:', error);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleFindCoverage = async (visit: TodaysVisit) => {
    setSelectedVisit(visit);
    await fetchOnCall(visit.id);
    setShowDispatchModal(true);
  };

  const handleDispatch = async (caregiverId: string) => {
    if (!selectedVisit) return;

    try {
      await fetch(`/api/console/dispatch/gaps/${selectedVisit.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId,
          method: 'sms'
        })
      });

      alert('Dispatch sent successfully!');
      setShowDispatchModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to dispatch:', error);
      alert('Failed to send dispatch');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Morning Check-In...</p>
        </div>
      </div>
    );
  }

  // Filter visits
  const filteredVisits = visits.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'issues') return v.needsDispatch || v.status === 'late' || v.sandataStatus === 'rejected';
    if (filter === 'no_show') return v.status === 'no_show';
    if (filter === 'late') return v.status === 'late';
    if (filter === 'in_progress') return v.status === 'in_progress';
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_time: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      no_show: 'bg-red-100 text-red-800',
      scheduled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getSandataColor = (status: string) => {
    const colors = {
      accepted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.not_submitted;
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                ☀️ Morning Check-In
              </h1>
              <p className="text-gray-600 text-lg">
                {summary?.podId ? `Pod ${summary.podId}` : 'All Pods'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </p>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={fetchData}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Total</div>
              <div className="text-3xl font-bold text-gray-900">{summary.totalScheduled}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">On Time</div>
              <div className="text-3xl font-bold text-green-600">{summary.onTime}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Late</div>
              <div className="text-3xl font-bold text-yellow-600">{summary.late}</div>
            </div>
            <div className={`bg-white p-6 rounded-lg border-2 ${summary.noShows > 0 ? 'border-red-600 animate-pulse' : 'border-gray-200'}`}>
              <div className="text-sm text-gray-600 mb-2">No-Shows</div>
              <div className="text-3xl font-bold text-red-600">{summary.noShows}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">In Progress</div>
              <div className="text-3xl font-bold text-blue-600">{summary.inProgress}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">EVV %</div>
              <div className="text-3xl font-bold text-green-600">{summary.evvCompliance}%</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Sandata %</div>
              <div className="text-3xl font-bold text-green-600">{summary.sandataAcceptance}%</div>
            </div>
          </div>
        )}

        {/* Critical Alert */}
        {summary && summary.noShows > 0 && (
          <div className="bg-red-50 border-2 border-red-600 rounded-lg p-6 mb-8 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚨</span>
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-1">
                  URGENT: {summary.noShows} No-Show{summary.noShows > 1 ? 's' : ''} Detected
                </h3>
                <p className="text-red-800">
                  Immediate action required to ensure patient coverage. Click "Find Coverage" to dispatch on-call caregivers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({visits.length})
            </button>
            <button
              onClick={() => setFilter('issues')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'issues' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚨 Issues ({visits.filter(v => v.needsDispatch || v.status === 'late' || v.sandataStatus === 'rejected').length})
            </button>
            <button
              onClick={() => setFilter('no_show')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'no_show' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No-Shows ({visits.filter(v => v.status === 'no_show').length})
            </button>
            <button
              onClick={() => setFilter('late')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'late' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Late ({visits.filter(v => v.status === 'late').length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({visits.filter(v => v.status === 'in_progress').length})
            </button>
          </div>
        </div>

        {/* Visits Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caregiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sandata
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className={`${visit.needsDispatch ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(visit.scheduledStart)}
                      </div>
                      <div className="text-xs text-gray-500">
                        to {formatTime(visit.scheduledEnd)}
                      </div>
                      {visit.clockInTime && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ {formatTime(visit.clockInTime)}
                        </div>
                      )}
                      {visit.minutesLate && visit.minutesLate > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {visit.minutesLate} min late
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{visit.clientName}</div>
                      <div className="text-sm text-gray-500">{visit.clientAddress}</div>
                      <div className="text-sm text-gray-500">{visit.clientCity}, {visit.clientState} {visit.clientZip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{visit.caregiverName}</div>
                      <a href={`tel:${visit.caregiverPhone}`} className="text-sm text-blue-600 hover:underline">
                        📞 {visit.caregiverPhone}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">SPI: {visit.caregiverSPI}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                        {visit.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {visit.geofenceValid === false && (
                        <div className="text-xs text-red-600 mt-1">⚠️ Geofence</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSandataColor(visit.sandataStatus)}`}>
                        {visit.sandataStatus.replace('_', ' ').toUpperCase()}
                      </span>
                      {visit.sandataRejectionReason && (
                        <div className="text-xs text-red-600 mt-1">{visit.sandataRejectionCode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {visit.needsDispatch && (
                        <button
                          onClick={() => handleFindCoverage(visit)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium mb-2 w-full"
                        >
                          🚨 Find Coverage
                        </button>
                      )}
                      <button
                        onClick={() => alert(`View details for visit ${visit.id}`)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium w-full"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVisits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No visits match the selected filter</p>
            </div>
          )}
        </div>

        {/* Dispatch Modal */}
        {showDispatchModal && selectedVisit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Find Coverage for {selectedVisit.clientName}
              </h2>
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Scheduled:</strong> {formatTime(selectedVisit.scheduledStart)} - {formatTime(selectedVisit.scheduledEnd)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong> {selectedVisit.clientAddress}, {selectedVisit.clientCity}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Original Caregiver:</strong> {selectedVisit.caregiverName}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available On-Call Caregivers</h3>

              {onCall.length === 0 ? (
                <p className="text-gray-500 mb-6">No on-call caregivers available</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {onCall.map((caregiver) => (
                    <div key={caregiver.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{caregiver.name}</h4>
                          <p className="text-sm text-gray-600">{caregiver.role} • SPI: {caregiver.spiScore}</p>
                          <p className="text-sm text-gray-600">📞 {caregiver.phone}</p>
                          {caregiver.distanceFromGap && (
                            <p className="text-sm text-gray-600">📍 {caregiver.distanceFromGap.toFixed(1)} miles away</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Current: {caregiver.currentAssignments}/{caregiver.maxAssignments} assignments
                          </p>
                        </div>
                        <button
                          onClick={() => handleDispatch(caregiver.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Dispatch via SMS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => alert('Manual call feature coming soon')}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  📞 Call Manually
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
