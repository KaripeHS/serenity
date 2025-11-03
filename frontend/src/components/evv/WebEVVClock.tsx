import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Shift {
  id: string;
  patient: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  scheduledStart: string;
  scheduledEnd: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  clockInTime: string | null;
  clockOutTime: string | null;
}

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface ClockInData {
  shiftId: string;
  timestamp: string;
  gps: GPSCoordinates;
  deviceInfo: string;
}

interface ClockOutData extends ClockInData {
  tasksCompleted: string[];
  notes: string;
  photoProof?: string;
}

const availableTasks = [
  'Bathing/Grooming',
  'Dressing',
  'Meal Preparation',
  'Feeding Assistance',
  'Medication Reminder',
  'Light Housekeeping',
  'Companionship',
  'Mobility Assistance',
  'Toileting',
  'Laundry'
];

function ShiftStatusBadge({ status }: { status: Shift['status'] }) {
  const variants: Record<Shift['status'], { variant: any; label: string }> = {
    scheduled: { variant: 'gray', label: 'Scheduled' },
    in_progress: { variant: 'info', label: 'In Progress' },
    completed: { variant: 'success', label: 'Completed' }
  };

  const config = variants[status];
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

export const WebEVVClock: React.FC = () => {
  const [caregiverId, setCaregiverId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tasksCompleted, setTasksCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showClockOutForm, setShowClockOutForm] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const pendingData = localStorage.getItem('pending_evv_records');
    if (pendingData && isOnline) {
      syncPendingRecords();
    }
  }, [isOnline]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/mobile/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: caregiverId, pin })
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setCaregiverName(data.caregiverName || 'Caregiver');
        localStorage.setItem('caregiver_id', caregiverId);
        localStorage.setItem('auth_token', data.token);
        await fetchTodaysShifts();
      } else {
        setError('Invalid phone number or PIN');
      }
    } catch (err) {
      const cachedId = localStorage.getItem('caregiver_id');
      if (cachedId === caregiverId) {
        setIsAuthenticated(true);
        setCaregiverName('Caregiver (Offline)');
        loadCachedShifts();
      } else {
        setError('Cannot authenticate offline. Please connect to internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysShifts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/mobile/shifts/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data.shifts || []);
        localStorage.setItem('cached_shifts', JSON.stringify(data.shifts));
      }
    } catch (err) {
      loadCachedShifts();
    }
  };

  const loadCachedShifts = () => {
    const cached = localStorage.getItem('cached_shifts');
    if (cached) setShifts(JSON.parse(cached));
  };

  const getCurrentPosition = (): Promise<GPSCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not supported by this device'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'GPS error';
          if (error.code === error.PERMISSION_DENIED) errorMessage = 'GPS permission denied';
          else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = 'GPS position unavailable';
          else if (error.code === error.TIMEOUT) errorMessage = 'GPS timeout';
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const validateGeofence = (gps: GPSCoordinates, shift: Shift): { valid: boolean; distance: number } => {
    const distance = calculateDistance(gps.latitude, gps.longitude, shift.patient.latitude, shift.patient.longitude);
    return { valid: distance <= 150, distance: Math.round(distance) };
  };

  const handleClockIn = async (shift: Shift) => {
    setLoading(true);
    setError(null);
    setGpsError(null);

    try {
      const gps = await getCurrentPosition();
      const geofenceCheck = validateGeofence(gps, shift);

      if (!geofenceCheck.valid) {
        setGpsError(`You are ${geofenceCheck.distance}m from patient location. Must be within 150m.`);
        setLoading(false);
        return;
      }

      const clockInData: ClockInData = {
        shiftId: shift.id,
        timestamp: new Date().toISOString(),
        gps,
        deviceInfo: navigator.userAgent
      };

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/mobile/evv/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(clockInData)
        });

        if (response.ok) {
          setShifts(shifts.map(s =>
            s.id === shift.id ? { ...s, status: 'in_progress', clockInTime: clockInData.timestamp } : s
          ));
          alert(`✅ Clocked in at ${shift.patient.name}'s location!\n\nDistance: ${geofenceCheck.distance}m`);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        savePendingRecord('clock-in', clockInData);
        setShifts(shifts.map(s =>
          s.id === shift.id ? { ...s, status: 'in_progress', clockInTime: clockInData.timestamp } : s
        ));
        alert('📴 Offline: Clock-in saved locally. Will sync when online.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to capture GPS');
    } finally {
      setLoading(false);
    }
  };

  const submitClockOut = async () => {
    if (!selectedShift) return;

    setLoading(true);
    setError(null);
    setGpsError(null);

    try {
      const gps = await getCurrentPosition();
      const geofenceCheck = validateGeofence(gps, selectedShift);

      if (!geofenceCheck.valid) {
        setGpsError(`You are ${geofenceCheck.distance}m from patient location. Must be within 150m.`);
        setLoading(false);
        return;
      }

      const clockOutData: ClockOutData = {
        shiftId: selectedShift.id,
        timestamp: new Date().toISOString(),
        gps,
        deviceInfo: navigator.userAgent,
        tasksCompleted,
        notes
      };

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/mobile/evv/clock-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(clockOutData)
        });

        if (response.ok) {
          setShifts(shifts.map(s =>
            s.id === selectedShift.id ? { ...s, status: 'completed', clockOutTime: clockOutData.timestamp } : s
          ));
          setShowClockOutForm(false);
          setTasksCompleted([]);
          setNotes('');
          setSelectedShift(null);
          alert(`✅ Clocked out!\n\nDistance: ${geofenceCheck.distance}m\nTasks: ${tasksCompleted.length}`);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        savePendingRecord('clock-out', clockOutData);
        setShifts(shifts.map(s =>
          s.id === selectedShift.id ? { ...s, status: 'completed', clockOutTime: clockOutData.timestamp } : s
        ));
        setShowClockOutForm(false);
        alert('📴 Offline: Clock-out saved locally.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to capture GPS');
    } finally {
      setLoading(false);
    }
  };

  const savePendingRecord = (type: 'clock-in' | 'clock-out', data: ClockInData | ClockOutData) => {
    const pending = JSON.parse(localStorage.getItem('pending_evv_records') || '[]');
    pending.push({ type, data, timestamp: new Date().toISOString() });
    localStorage.setItem('pending_evv_records', JSON.stringify(pending));
  };

  const syncPendingRecords = async () => {
    const pending = JSON.parse(localStorage.getItem('pending_evv_records') || '[]');
    if (pending.length === 0) return;

    const token = localStorage.getItem('auth_token');
    let syncedCount = 0;

    for (const record of pending) {
      try {
        const endpoint = record.type === 'clock-in'
          ? 'http://localhost:3000/api/mobile/evv/clock-in'
          : 'http://localhost:3000/api/mobile/evv/clock-out';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(record.data)
        });

        if (response.ok) syncedCount++;
      } catch (err) {
        console.error('Failed to sync record:', err);
      }
    }

    if (syncedCount === pending.length) {
      localStorage.removeItem('pending_evv_records');
      alert(`✅ Synced ${syncedCount} offline records!`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCaregiverId('');
    setPin('');
    setShifts([]);
    localStorage.removeItem('auth_token');
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Serenity EVV Clock</h1>
            <p className="text-gray-600">Sign in to view your shifts</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={caregiverId}
                onChange={(e) => setCaregiverId(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {!isOnline && <Alert variant="warning" className="mt-4">📴 Offline. Limited functionality.</Alert>}
        </Card>
      </div>
    );
  }

  // Clock-out form
  if (showClockOutForm && selectedShift) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Clock Out - Visit Summary</h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedShift.patient.name}</p>
              <p className="text-sm text-gray-600">{selectedShift.patient.address}</p>
              <p className="text-sm text-gray-600">{formatTime(selectedShift.scheduledStart)} - {formatTime(selectedShift.scheduledEnd)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">Tasks Completed:</label>
              <div className="grid grid-cols-2 gap-2">
                {availableTasks.map(task => (
                  <label key={task} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tasksCompleted.includes(task)}
                      onChange={() => {
                        if (tasksCompleted.includes(task)) {
                          setTasksCompleted(tasksCompleted.filter(t => t !== task));
                        } else {
                          setTasksCompleted([...tasksCompleted, task]);
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{task}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Visit Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special observations..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {gpsError && <Alert variant="danger" className="mb-4">{gpsError}</Alert>}
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClockOutForm(false);
                  setTasksCompleted([]);
                  setNotes('');
                  setGpsError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitClockOut}
                disabled={loading || tasksCompleted.length === 0}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Clocking Out...' : 'Confirm Clock Out'}
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main shifts screen
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello, {caregiverName}</h1>
            <p className="text-sm text-primary-100">Today's Shifts - {new Date().toLocaleDateString()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-primary-800 hover:bg-primary-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {!isOnline && (
        <Alert variant="warning" className="m-4">
          📴 Offline. Data will sync when connection is restored.
        </Alert>
      )}

      <div className="max-w-4xl mx-auto p-4">
        {shifts.length === 0 ? (
          <Card className="text-center py-12">
            <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No shifts scheduled for today.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {shifts.map(shift => (
              <Card key={shift.id}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{shift.patient.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {shift.patient.address}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <ClockIcon className="h-4 w-4" />
                      {formatTime(shift.scheduledStart)} - {formatTime(shift.scheduledEnd)}
                    </p>
                  </div>
                  <ShiftStatusBadge status={shift.status} />
                </div>

                {shift.clockInTime && (
                  <Alert variant="success" className="mb-4">
                    <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                    Clocked in at {formatTime(shift.clockInTime)}
                  </Alert>
                )}

                {shift.clockOutTime && (
                  <Alert variant="info" className="mb-4">
                    <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                    Clocked out at {formatTime(shift.clockOutTime)}
                  </Alert>
                )}

                <div className="flex gap-3">
                  {shift.status === 'scheduled' && (
                    <button
                      onClick={() => handleClockIn(shift)}
                      disabled={loading}
                      className="flex-1 bg-success-600 text-white py-3 rounded-lg font-medium hover:bg-success-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Processing...' : '🕐 Clock In'}
                    </button>
                  )}

                  {shift.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        setSelectedShift(shift);
                        setShowClockOutForm(true);
                      }}
                      disabled={loading}
                      className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Processing...' : '🕐 Clock Out'}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {gpsError && <Alert variant="danger" className="mt-4">{gpsError}</Alert>}
        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
      </div>
    </div>
  );
};
