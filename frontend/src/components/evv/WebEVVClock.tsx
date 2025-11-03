import React, { useState, useEffect } from 'react';

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

  // Clock-out specific state
  const [tasksCompleted, setTasksCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showClockOutForm, setShowClockOutForm] = useState(false);

  // Available tasks for clock-out
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

  // Monitor online/offline status
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

  // Load pending offline data on mount
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
      // Mock authentication - in production, this would call the backend
      // POST /api/mobile/auth/login
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
      // Offline mode - allow login with cached credentials
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    if (cached) {
      setShifts(JSON.parse(cached));
    }
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
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'GPS permission denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'GPS position unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS timeout. Please try again.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula for distance in meters
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const validateGeofence = (gps: GPSCoordinates, shift: Shift): { valid: boolean; distance: number } => {
    const distance = calculateDistance(
      gps.latitude,
      gps.longitude,
      shift.patient.latitude,
      shift.patient.longitude
    );

    const geofenceRadius = 150; // 150 meters (configurable)
    return {
      valid: distance <= geofenceRadius,
      distance: Math.round(distance)
    };
  };

  const handleClockIn = async (shift: Shift) => {
    setLoading(true);
    setError(null);
    setGpsError(null);

    try {
      // Capture GPS
      const gps = await getCurrentPosition();

      // Validate geofence
      const geofenceCheck = validateGeofence(gps, shift);

      if (!geofenceCheck.valid) {
        setGpsError(`You are ${geofenceCheck.distance}m from patient location. You must be within 150m to clock in.`);
        setLoading(false);
        return;
      }

      // Prepare clock-in data
      const clockInData: ClockInData = {
        shiftId: shift.id,
        timestamp: new Date().toISOString(),
        gps,
        deviceInfo: navigator.userAgent
      };

      // Try to submit to backend
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/mobile/evv/clock-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(clockInData)
        });

        if (response.ok) {
          const result = await response.json();

          // Update local shift status
          setShifts(shifts.map(s =>
            s.id === shift.id
              ? { ...s, status: 'in_progress', clockInTime: clockInData.timestamp }
              : s
          ));

          alert(`✅ Clocked in successfully at ${shift.patient.name}'s location!\n\nDistance: ${geofenceCheck.distance}m\nAccuracy: ${Math.round(gps.accuracy)}m`);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        // Offline mode - store locally
        savePendingRecord('clock-in', clockInData);
        setShifts(shifts.map(s =>
          s.id === shift.id
            ? { ...s, status: 'in_progress', clockInTime: clockInData.timestamp }
            : s
        ));
        alert('📴 Offline: Clock-in saved locally. Will sync when online.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to capture GPS');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (shift: Shift) => {
    setSelectedShift(shift);
    setShowClockOutForm(true);
  };

  const submitClockOut = async () => {
    if (!selectedShift) return;

    setLoading(true);
    setError(null);
    setGpsError(null);

    try {
      // Capture GPS
      const gps = await getCurrentPosition();

      // Validate geofence
      const geofenceCheck = validateGeofence(gps, selectedShift);

      if (!geofenceCheck.valid) {
        setGpsError(`You are ${geofenceCheck.distance}m from patient location. You must be within 150m to clock out.`);
        setLoading(false);
        return;
      }

      // Prepare clock-out data
      const clockOutData: ClockOutData = {
        shiftId: selectedShift.id,
        timestamp: new Date().toISOString(),
        gps,
        deviceInfo: navigator.userAgent,
        tasksCompleted,
        notes
      };

      // Try to submit to backend
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/mobile/evv/clock-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(clockOutData)
        });

        if (response.ok) {
          // Update local shift status
          setShifts(shifts.map(s =>
            s.id === selectedShift.id
              ? { ...s, status: 'completed', clockOutTime: clockOutData.timestamp }
              : s
          ));

          setShowClockOutForm(false);
          setTasksCompleted([]);
          setNotes('');
          setSelectedShift(null);

          alert(`✅ Clocked out successfully!\n\nDistance: ${geofenceCheck.distance}m\nAccuracy: ${Math.round(gps.accuracy)}m\nTasks: ${tasksCompleted.length}`);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        // Offline mode - store locally
        savePendingRecord('clock-out', clockOutData);
        setShifts(shifts.map(s =>
          s.id === selectedShift.id
            ? { ...s, status: 'completed', clockOutTime: clockOutData.timestamp }
            : s
        ));
        setShowClockOutForm(false);
        alert('📴 Offline: Clock-out saved locally. Will sync when online.');
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

    console.log(`Syncing ${pending.length} pending EVV records...`);

    const token = localStorage.getItem('auth_token');
    let syncedCount = 0;

    for (const record of pending) {
      try {
        const endpoint = record.type === 'clock-in'
          ? 'http://localhost:3000/api/mobile/evv/clock-in'
          : 'http://localhost:3000/api/mobile/evv/clock-out';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(record.data)
        });

        if (response.ok) {
          syncedCount++;
        }
      } catch (err) {
        console.error('Failed to sync record:', err);
      }
    }

    if (syncedCount === pending.length) {
      localStorage.removeItem('pending_evv_records');
      alert(`✅ Synced ${syncedCount} offline records!`);
    }
  };

  const handleTaskToggle = (task: string) => {
    if (tasksCompleted.includes(task)) {
      setTasksCompleted(tasksCompleted.filter(t => t !== task));
    } else {
      setTasksCompleted([...tasksCompleted, task]);
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
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getShiftStatus = (shift: Shift) => {
    if (shift.status === 'completed') return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    if (shift.status === 'in_progress') return { text: 'In Progress', color: 'bg-blue-100 text-blue-800' };

    const now = new Date();
    const scheduledStart = new Date(shift.scheduledStart);

    if (now < scheduledStart) return { text: 'Upcoming', color: 'bg-gray-100 text-gray-800' };
    return { text: 'Ready to Start', color: 'bg-yellow-100 text-yellow-800' };
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Serenity EVV Clock</h1>
            <p className="text-gray-600">Sign in to view your shifts</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={caregiverId}
                onChange={(e) => setCaregiverId(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {!isOnline && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm text-center">
              📴 You are offline. Limited functionality available.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Clock-out form modal
  if (showClockOutForm && selectedShift) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Clock Out - Visit Summary</h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-800">{selectedShift.patient.name}</div>
              <div className="text-sm text-gray-600">{selectedShift.patient.address}</div>
              <div className="text-sm text-gray-600 mt-1">
                {formatTime(selectedShift.scheduledStart)} - {formatTime(selectedShift.scheduledEnd)}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">Tasks Completed:</label>
              <div className="grid grid-cols-2 gap-2">
                {availableTasks.map(task => (
                  <label key={task} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tasksCompleted.includes(task)}
                      onChange={() => handleTaskToggle(task)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{task}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Visit Notes (Optional):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special observations or notes about the visit..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {gpsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {gpsError}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
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
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Clocking Out...' : 'Confirm Clock Out'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              GPS will be captured when you confirm clock out
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main shifts screen
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello, {caregiverName}</h1>
            <p className="text-sm text-blue-100">Today's Shifts - {new Date().toLocaleDateString()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="max-w-4xl mx-auto text-center text-yellow-800 text-sm">
            📴 You are offline. Data will sync when connection is restored.
          </div>
        </div>
      )}

      {/* Shifts List */}
      <div className="max-w-4xl mx-auto p-4">
        {shifts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No shifts scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map(shift => {
              const status = getShiftStatus(shift);

              return (
                <div key={shift.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{shift.patient.name}</h3>
                      <p className="text-sm text-gray-600">{shift.patient.address}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatTime(shift.scheduledStart)} - {formatTime(shift.scheduledEnd)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  {shift.clockInTime && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Clocked in at {formatTime(shift.clockInTime)}
                      </p>
                    </div>
                  )}

                  {shift.clockOutTime && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-800">
                        ✅ Clocked out at {formatTime(shift.clockOutTime)}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {shift.status === 'scheduled' && (
                      <button
                        onClick={() => handleClockIn(shift)}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Processing...' : '🕐 Clock In'}
                      </button>
                    )}

                    {shift.status === 'in_progress' && (
                      <button
                        onClick={() => handleClockOut(shift)}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Processing...' : '🕐 Clock Out'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GPS Error Display */}
        {gpsError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium mb-2">⚠️ Geofence Validation Failed</p>
            <p className="text-sm">{gpsError}</p>
            <p className="text-xs mt-2 text-red-600">
              Note: You must be at the patient's location to clock in/out.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
