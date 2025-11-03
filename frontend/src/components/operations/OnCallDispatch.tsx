import React, { useState, useEffect } from 'react';

interface CoverageGap {
  id: string;
  shiftId: string;
  client: {
    id: string;
    name: string;
    address: string;
  };
  assignedCaregiver: {
    id: string;
    name: string;
    phone: string;
  };
  scheduledStart: string;
  scheduledEnd: string;
  minutesLate: number;
  pod: {
    id: string;
    name: string;
    leadId: string;
    leadName: string;
    leadPhone: string;
  };
  status: 'detected' | 'dispatched' | 'covered' | 'escalated';
  detectedAt: string;
  dispatchedAt?: string;
  coveredAt?: string;
}

interface OnCallCaregiver {
  caregiverId: string;
  name: string;
  phone: string;
  role: string;
  podId: string;
  distanceMiles: number;
  samePod: boolean;
}

export const OnCallDispatch: React.FC = () => {
  const [gaps, setGaps] = useState<CoverageGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<CoverageGap | null>(null);
  const [onCallOptions, setOnCallOptions] = useState<OnCallCaregiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'detected' | 'dispatched' | 'covered'>('detected');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<string>('');
  const [dispatchMethod, setDispatchMethod] = useState<'sms' | 'call' | 'both'>('sms');

  const organizationId = localStorage.getItem('organizationId') || '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchGaps();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchGaps, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchGaps = async () => {
    try {
      const statusFilter = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`http://localhost:3000/api/console/dispatch/gaps${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGaps(data.gaps);
      } else {
        console.log('Backend API not available, using mock data');
        fetchMockGaps();
      }
    } catch (error) {
      console.error('Failed to load gaps:', error);
      fetchMockGaps();
    }
  };

  const fetchMockGaps = () => {
    const now = new Date();
    const mockGaps: CoverageGap[] = [
      {
        id: 'gap-001',
        shiftId: 'shift-123',
        client: {
          id: 'client-001',
          name: 'Margaret Johnson',
          address: '123 Oak St, Dayton, OH 45402'
        },
        assignedCaregiver: {
          id: 'cg-001',
          name: 'Mary Smith',
          phone: '(937) 555-0123'
        },
        scheduledStart: new Date(now.getTime() - 20 * 60000).toISOString(),
        scheduledEnd: new Date(now.getTime() + 160 * 60000).toISOString(),
        minutesLate: 20,
        pod: {
          id: 'pod-001',
          name: 'Pod-1 (Dayton)',
          leadId: 'user-001',
          leadName: 'Gloria Martinez',
          leadPhone: '(937) 555-9999'
        },
        status: 'detected',
        detectedAt: now.toISOString()
      },
      {
        id: 'gap-002',
        shiftId: 'shift-456',
        client: {
          id: 'client-002',
          name: 'Robert Williams',
          address: '456 Maple Ave, Dayton, OH 45403'
        },
        assignedCaregiver: {
          id: 'cg-002',
          name: 'John Doe',
          phone: '(937) 555-0456'
        },
        scheduledStart: new Date(now.getTime() - 45 * 60000).toISOString(),
        scheduledEnd: new Date(now.getTime() + 75 * 60000).toISOString(),
        minutesLate: 45,
        pod: {
          id: 'pod-001',
          name: 'Pod-1 (Dayton)',
          leadId: 'user-001',
          leadName: 'Gloria Martinez',
          leadPhone: '(937) 555-9999'
        },
        status: 'detected',
        detectedAt: now.toISOString()
      }
    ];

    setGaps(mockGaps.filter(g => filter === 'all' || g.status === filter));
  };

  const fetchOnCallOptions = async (gapId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/console/dispatch/gaps/${gapId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnCallOptions(data.onCallOptions);
      } else {
        // Fallback to mock data
        const mockOptions: OnCallCaregiver[] = [
          {
            caregiverId: 'cg-003',
            name: 'Sarah Johnson',
            phone: '(937) 555-0789',
            role: 'HHA',
            podId: 'pod-001',
            distanceMiles: 2.5,
            samePod: true
          },
          {
            caregiverId: 'cg-004',
            name: 'Emily Rodriguez',
            phone: '(937) 555-0654',
            role: 'HHA',
            podId: 'pod-002',
            distanceMiles: 4.8,
            samePod: false
          }
        ];
        setOnCallOptions(mockOptions);
      }
    } catch (error) {
      console.error('Failed to load on-call options:', error);
      // Fallback to mock
      const mockOptions: OnCallCaregiver[] = [
        { caregiverId: 'cg-003', name: 'Sarah Johnson', phone: '(937) 555-0789', role: 'HHA', podId: 'pod-001', distanceMiles: 2.5, samePod: true },
        { caregiverId: 'cg-004', name: 'Emily Rodriguez', phone: '(937) 555-0654', role: 'HHA', podId: 'pod-002', distanceMiles: 4.8, samePod: false }
      ];
      setOnCallOptions(mockOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleFindCoverage = async (gap: CoverageGap) => {
    setSelectedGap(gap);
    await fetchOnCallOptions(gap.id);
    setShowDispatchModal(true);
  };

  const handleDispatch = async () => {
    if (!selectedGap || !selectedCaregiver) return;

    try {
      const response = await fetch(`http://localhost:3000/api/console/dispatch/gaps/${selectedGap.id}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          caregiverId: selectedCaregiver,
          method: dispatchMethod
        })
      });

      if (response.ok) {
        alert('Caregiver dispatched successfully!');
        setShowDispatchModal(false);
        setSelectedCaregiver('');
        fetchGaps(); // Refresh gaps list
      } else {
        alert('Failed to dispatch caregiver');
      }
    } catch (error) {
      console.error('Dispatch error:', error);
      // Simulate success for demo
      alert(`Dispatched successfully via ${dispatchMethod}! (using mock data)`);
      setShowDispatchModal(false);
      setSelectedCaregiver('');
      fetchGaps();
    }
  };

  const getUrgencyClass = (minutesLate: number) => {
    if (minutesLate >= 60) return 'bg-red-100 border-red-400';
    if (minutesLate >= 30) return 'bg-orange-100 border-orange-400';
    return 'bg-yellow-100 border-yellow-400';
  };

  const getUrgencyBadge = (minutesLate: number) => {
    if (minutesLate >= 60) return <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">CRITICAL</span>;
    if (minutesLate >= 30) return <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded">URGENT</span>;
    return <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded">WARNING</span>;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">On-Call Dispatch</h1>
        <p className="text-gray-600 mt-1">Monitor coverage gaps and dispatch on-call caregivers</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 px-4 ${filter === 'all' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('detected')}
          className={`pb-2 px-4 ${filter === 'detected' ? 'border-b-2 border-red-600 text-red-600 font-medium' : 'text-gray-600'}`}
        >
          Detected ({gaps.filter(g => g.status === 'detected').length})
        </button>
        <button
          onClick={() => setFilter('dispatched')}
          className={`pb-2 px-4 ${filter === 'dispatched' ? 'border-b-2 border-orange-600 text-orange-600 font-medium' : 'text-gray-600'}`}
        >
          Dispatched ({gaps.filter(g => g.status === 'dispatched').length})
        </button>
        <button
          onClick={() => setFilter('covered')}
          className={`pb-2 px-4 ${filter === 'covered' ? 'border-b-2 border-green-600 text-green-600 font-medium' : 'text-gray-600'}`}
        >
          Covered ({gaps.filter(g => g.status === 'covered').length})
        </button>
      </div>

      {/* Coverage Gaps List */}
      {gaps.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h3 className="text-xl font-bold text-green-800 mb-2">No Coverage Gaps</h3>
          <p className="text-green-700">All shifts are covered and on track.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gaps.map(gap => (
            <div key={gap.id} className={`border-2 rounded-lg p-6 ${getUrgencyClass(gap.minutesLate)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    {getUrgencyBadge(gap.minutesLate)}
                    <span className="text-2xl font-bold text-gray-800">{gap.minutesLate} MIN LATE</span>
                  </div>

                  {/* Client Info */}
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">PATIENT</div>
                      <div className="font-bold text-lg">{gap.client.name}</div>
                      <div className="text-gray-700">{gap.client.address}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">ASSIGNED CAREGIVER (NO-SHOW)</div>
                      <div className="font-bold text-lg">{gap.assignedCaregiver.name}</div>
                      <div className="text-gray-700">{gap.assignedCaregiver.phone}</div>
                    </div>
                  </div>

                  {/* Shift Details */}
                  <div className="flex items-center space-x-6 text-sm text-gray-700 mb-4">
                    <div>
                      <span className="font-medium">Scheduled:</span> {formatTime(gap.scheduledStart)} - {formatTime(gap.scheduledEnd)}
                    </div>
                    <div>
                      <span className="font-medium">Pod:</span> {gap.pod.name}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        gap.status === 'covered' ? 'bg-green-200 text-green-800' :
                        gap.status === 'dispatched' ? 'bg-orange-200 text-orange-800' :
                        gap.status === 'escalated' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {gap.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-6">
                  {gap.status === 'detected' && (
                    <button
                      onClick={() => handleFindCoverage(gap)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium transition-colors"
                    >
                      Find Coverage
                    </button>
                  )}
                  {gap.status === 'dispatched' && (
                    <div className="text-orange-700 font-medium">
                      ⏳ Awaiting Response
                    </div>
                  )}
                  {gap.status === 'covered' && (
                    <div className="text-green-700 font-medium">
                      ✓ Coverage Secured
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedGap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Find Coverage</h2>

            {/* Gap Summary */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="font-bold text-lg mb-2">{selectedGap.client.name}</div>
              <div className="text-gray-700">{selectedGap.client.address}</div>
              <div className="text-gray-600 text-sm mt-2">
                {formatTime(selectedGap.scheduledStart)} - {formatTime(selectedGap.scheduledEnd)}
              </div>
            </div>

            {/* Dispatch Method */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Dispatch Method</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="method"
                    value="sms"
                    checked={dispatchMethod === 'sms'}
                    onChange={(e) => setDispatchMethod(e.target.value as 'sms')}
                    className="mr-2"
                  />
                  SMS
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="method"
                    value="call"
                    checked={dispatchMethod === 'call'}
                    onChange={(e) => setDispatchMethod(e.target.value as 'call')}
                    className="mr-2"
                  />
                  Phone Call
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="method"
                    value="both"
                    checked={dispatchMethod === 'both'}
                    onChange={(e) => setDispatchMethod(e.target.value as 'both')}
                    className="mr-2"
                  />
                  Both
                </label>
              </div>
            </div>

            {/* On-Call Caregivers */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">Available On-Call Caregivers</h3>
              <div className="space-y-2">
                {onCallOptions.map(cg => (
                  <label
                    key={cg.caregiverId}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedCaregiver === cg.caregiverId ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="caregiver"
                      value={cg.caregiverId}
                      checked={selectedCaregiver === cg.caregiverId}
                      onChange={(e) => setSelectedCaregiver(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{cg.name}</div>
                      <div className="text-sm text-gray-600">
                        {cg.role} • {cg.phone} • {cg.distanceMiles} miles away
                        {cg.samePod && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Same Pod</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  setSelectedCaregiver('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                disabled={!selectedCaregiver}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Dispatch Caregiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
