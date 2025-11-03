import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Types matching manifesto requirements
interface Shift {
  id: string;
  patient: {
    name: string;
    address: string;
    phone: string;
  };
  caregiver: {
    name: string;
    phone: string;
    email: string;
  };
  scheduledStart: string;
  scheduledEnd: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInStatus: 'on_time' | 'late' | 'missing' | 'not_started';
  sandataStatus: 'accepted' | 'pending' | 'rejected' | 'not_submitted';
  sandataError: string | null;
  gpsAccuracy: number | null;
}

interface MorningCheckInData {
  date: string;
  podId: string;
  podName: string;
  shifts: Shift[];
  summary: {
    total: number;
    clockedIn: number;
    late: number;
    noShow: number;
    notYetStarted: number;
    sandataAccepted: number;
    sandataRejected: number;
  };
}

export function MorningCheckIn() {
  const { user } = useAuth();
  const [data, setData] = useState<MorningCheckInData | null>(null);
  const [filter, setFilter] = useState<'all' | 'no_show' | 'late' | 'issues'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch morning check-in data
  const fetchData = async () => {
    // In production, this would call the backend API
    // For now, use realistic mock data based on manifesto specs
    const mockData: MorningCheckInData = {
      date: new Date().toISOString().split('T')[0],
      podId: 'pod-1',
      podName: 'Pod-1 (Dayton)',
      shifts: [
        {
          id: 'shift-1',
          patient: { name: 'Jane Doe', address: '123 Main St, Dayton, OH', phone: '937-555-0101' },
          caregiver: { name: 'Mary Smith', phone: '937-555-0201', email: 'mary.smith@serenity.com' },
          scheduledStart: '2025-11-03T08:00:00Z',
          scheduledEnd: '2025-11-03T09:30:00Z',
          clockInTime: '2025-11-03T08:05:00Z',
          clockOutTime: null,
          clockInStatus: 'on_time',
          sandataStatus: 'pending',
          sandataError: null,
          gpsAccuracy: 15
        },
        {
          id: 'shift-2',
          patient: { name: 'John Williams', address: '456 Oak Ave, Dayton, OH', phone: '937-555-0102' },
          caregiver: { name: 'Sarah Johnson', phone: '937-555-0202', email: 'sarah.j@serenity.com' },
          scheduledStart: '2025-11-03T08:30:00Z',
          scheduledEnd: '2025-11-03T10:00:00Z',
          clockInTime: '2025-11-03T08:50:00Z',
          clockOutTime: null,
          clockInStatus: 'late',
          sandataStatus: 'not_submitted',
          sandataError: null,
          gpsAccuracy: 22
        },
        {
          id: 'shift-3',
          patient: { name: 'Betty Martinez', address: '789 Elm St, Dayton, OH', phone: '937-555-0103' },
          caregiver: { name: 'Mike Davis', phone: '937-555-0203', email: 'mike.d@serenity.com' },
          scheduledStart: '2025-11-03T09:00:00Z',
          scheduledEnd: '2025-11-03T10:30:00Z',
          clockInTime: null,
          clockOutTime: null,
          clockInStatus: 'missing',
          sandataStatus: 'not_submitted',
          sandataError: null,
          gpsAccuracy: null
        },
        {
          id: 'shift-4',
          patient: { name: 'Robert Lee', address: '321 Pine Rd, Dayton, OH', phone: '937-555-0104' },
          caregiver: { name: 'Linda Brown', phone: '937-555-0204', email: 'linda.b@serenity.com' },
          scheduledStart: '2025-11-03T07:30:00Z',
          scheduledEnd: '2025-11-03T09:00:00Z',
          clockInTime: '2025-11-03T07:32:00Z',
          clockOutTime: '2025-11-03T09:05:00Z',
          clockInStatus: 'on_time',
          sandataStatus: 'accepted',
          sandataError: null,
          gpsAccuracy: 12
        },
        {
          id: 'shift-5',
          patient: { name: 'Nancy Garcia', address: '654 Maple Dr, Dayton, OH', phone: '937-555-0105' },
          caregiver: { name: 'Tom Wilson', phone: '937-555-0205', email: 'tom.w@serenity.com' },
          scheduledStart: '2025-11-03T10:00:00Z',
          scheduledEnd: '2025-11-03T11:30:00Z',
          clockInTime: null,
          clockOutTime: null,
          clockInStatus: 'not_started',
          sandataStatus: 'not_submitted',
          sandataError: null,
          gpsAccuracy: null
        }
      ],
      summary: {
        total: 5,
        clockedIn: 2,
        late: 1,
        noShow: 1,
        notYetStarted: 1,
        sandataAccepted: 1,
        sandataRejected: 0
      }
    };

    setData(mockData);
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#6b7280' }}>Loading Morning Check-In...</p>
        </div>
      </div>
    );
  }

  // Filter shifts
  const filteredShifts = data.shifts.filter(shift => {
    if (filter === 'all') return true;
    if (filter === 'no_show') return shift.clockInStatus === 'missing';
    if (filter === 'late') return shift.clockInStatus === 'late';
    if (filter === 'issues') return shift.clockInStatus === 'missing' || shift.clockInStatus === 'late' || shift.sandataStatus === 'rejected';
    return true;
  });

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const styles = {
      on_time: { bg: '#dcfce7', color: '#166534', text: '✅ On Time' },
      late: { bg: '#fef3c7', color: '#92400e', text: '🟡 Late' },
      missing: { bg: '#fee2e2', color: '#991b1b', text: '🔴 No-Show' },
      not_started: { bg: '#f3f4f6', color: '#4b5563', text: '⚫ Not Started' }
    };
    const style = styles[status as keyof typeof styles] || styles.not_started;
    return (
      <span style={{ backgroundColor: style.bg, color: style.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' }}>
        {style.text}
      </span>
    );
  };

  const getSandataBadge = (status: string) => {
    const styles = {
      accepted: { bg: '#dcfce7', color: '#166534', text: '✅ Sandata OK' },
      pending: { bg: '#fef3c7', color: '#92400e', text: '🟡 Pending' },
      rejected: { bg: '#fee2e2', color: '#991b1b', text: '🔴 Rejected' },
      not_submitted: { bg: '#f3f4f6', color: '#4b5563', text: '⚫ Not Submitted' }
    };
    const style = styles[status as keyof typeof styles] || styles.not_submitted;
    return (
      <span style={{ backgroundColor: style.bg, color: style.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' }}>
        {style.text}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                ☀️ Morning Check-In
              </h1>
              <p style={{ color: '#6b7280' }}>
                {data.podName} • {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ width: '1rem', height: '1rem' }}
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={fetchData}
                style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Shifts</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{data.summary.total}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Clocked In</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{data.summary.clockedIn}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Late</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>{data.summary.late}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: data.summary.noShow > 0 ? '2px solid #dc2626' : 'none' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>No-Shows 🚨</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{data.summary.noShow}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Not Started</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>{data.summary.notYetStarted}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Sandata OK</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{data.summary.sandataAccepted}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter('all')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', backgroundColor: filter === 'all' ? '#2563eb' : '#f3f4f6', color: filter === 'all' ? 'white' : '#6b7280', fontWeight: '600' }}
          >
            All ({data.summary.total})
          </button>
          <button
            onClick={() => setFilter('issues')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', backgroundColor: filter === 'issues' ? '#dc2626' : '#f3f4f6', color: filter === 'issues' ? 'white' : '#6b7280', fontWeight: '600' }}
          >
            🚨 Issues ({data.summary.noShow + data.summary.late + data.summary.sandataRejected})
          </button>
          <button
            onClick={() => setFilter('no_show')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', backgroundColor: filter === 'no_show' ? '#dc2626' : '#f3f4f6', color: filter === 'no_show' ? 'white' : '#6b7280', fontWeight: '600' }}
          >
            No-Shows ({data.summary.noShow})
          </button>
          <button
            onClick={() => setFilter('late')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', backgroundColor: filter === 'late' ? '#eab308' : '#f3f4f6', color: filter === 'late' ? 'white' : '#6b7280', fontWeight: '600' }}
          >
            Late ({data.summary.late})
          </button>
        </div>

        {/* Shifts Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Time</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Patient</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Caregiver</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Sandata</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.map((shift, index) => (
                  <tr key={shift.id} style={{ borderTop: '1px solid #e5e7eb', backgroundColor: shift.clockInStatus === 'missing' ? '#fef2f2' : 'white' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {new Date(shift.scheduledStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {new Date(shift.scheduledEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      {shift.clockInTime && (
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
                          ✓ In: {new Date(shift.clockInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{shift.patient.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{shift.patient.address}</div>
                      <a href={`tel:${shift.patient.phone}`} style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}>
                        📞 {shift.patient.phone}
                      </a>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{shift.caregiver.name}</div>
                      <a href={`tel:${shift.caregiver.phone}`} style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none', display: 'block' }}>
                        📞 {shift.caregiver.phone}
                      </a>
                      <a href={`mailto:${shift.caregiver.email}`} style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}>
                        ✉️ Email
                      </a>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(shift.clockInStatus)}
                      {shift.gpsAccuracy && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          GPS: ±{shift.gpsAccuracy}m
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getSandataBadge(shift.sandataStatus)}
                      {shift.sandataError && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                          {shift.sandataError}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {shift.clockInStatus === 'missing' && (
                        <button
                          onClick={() => alert(`Finding coverage for ${shift.patient.name}`)}
                          style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem', width: '100%' }}
                        >
                          🚨 Find Coverage
                        </button>
                      )}
                      <button
                        onClick={() => alert(`Viewing details for shift ${shift.id}`)}
                        style={{ backgroundColor: '#f3f4f6', color: '#1f2937', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', width: '100%' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert if no-shows exist */}
        {data.summary.noShow > 0 && (
          <div style={{ marginTop: '1.5rem', backgroundColor: '#fee2e2', border: '2px solid #dc2626', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              <div>
                <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '1.125rem' }}>
                  URGENT: {data.summary.noShow} No-Show{data.summary.noShow > 1 ? 's' : ''} Detected
                </div>
                <div style={{ color: '#991b1b', marginTop: '0.25rem' }}>
                  Immediate action required to ensure patient coverage. Use "Find Coverage" to dispatch on-call caregivers.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
