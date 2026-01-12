import { randomUUID } from 'crypto';

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  caregiverName: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  clockInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  hours?: number;
  serviceType: string;
  tasks: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  patientId: string;
  patientName: string;
  caregiverId?: string;
  caregiverName?: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  status: 'open' | 'assigned' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

const serviceTypes = ['Personal Care', 'Companionship', 'Homemaking', 'Respite Care', 'Skilled Nursing'];
const adlTasks = ['Bathing', 'Dressing', 'Medication Reminders', 'Meal Preparation', 'Light Housekeeping', 'Toileting', 'Transfer Assistance'];

// Columbus, OH coordinates for reference
const baseLocation = { latitude: 39.9612, longitude: -82.9988 };

const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const evvFixtures = {
  // Generate single visit
  generateVisit: (overrides?: Partial<Visit>): Visit => {
    const scheduledDate = addDays(new Date(), Math.floor(Math.random() * 7));
    const scheduledStart = new Date(scheduledDate);
    scheduledStart.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);
    const scheduledEnd = addHours(scheduledStart, 4);

    return {
      id: randomUUID(),
      patientId: randomUUID(),
      patientName: 'Mary Client',
      caregiverId: randomUUID(),
      caregiverName: 'Maria Garcia',
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledStartTime: scheduledStart.toISOString(),
      scheduledEndTime: scheduledEnd.toISOString(),
      status: 'scheduled',
      serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      tasks: adlTasks.slice(0, Math.floor(Math.random() * 4) + 2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  // Predefined visits
  scheduledVisit: (patientId: string, caregiverId: string): Visit =>
    evvFixtures.generateVisit({
      patientId,
      caregiverId,
      status: 'scheduled'
    }),

  inProgressVisit: (patientId: string, caregiverId: string): Visit => {
    const visit = evvFixtures.generateVisit({
      patientId,
      caregiverId,
      status: 'in_progress'
    });
    visit.actualStartTime = addHours(new Date(), -2).toISOString();
    visit.clockInLocation = {
      latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.01,
      longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.01,
      accuracy: 10
    };
    return visit;
  },

  completedVisit: (patientId: string, caregiverId: string, hours: number = 4): Visit => {
    const visit = evvFixtures.generateVisit({
      patientId,
      caregiverId,
      status: 'completed'
    });
    const endTime = new Date();
    const startTime = addHours(endTime, -hours);
    visit.actualStartTime = startTime.toISOString();
    visit.actualEndTime = endTime.toISOString();
    visit.hours = hours;
    visit.clockInLocation = {
      latitude: baseLocation.latitude,
      longitude: baseLocation.longitude,
      accuracy: 10
    };
    visit.clockOutLocation = {
      latitude: baseLocation.latitude + 0.0001,
      longitude: baseLocation.longitude + 0.0001,
      accuracy: 12
    };
    visit.notes = 'Visit completed successfully. All tasks performed.';
    return visit;
  },

  // Generate shift
  generateShift: (overrides?: Partial<Shift>): Shift => {
    const date = addDays(new Date(), Math.floor(Math.random() * 14));
    const hour = 8 + Math.floor(Math.random() * 8);

    return {
      id: randomUUID(),
      patientId: randomUUID(),
      patientName: 'Mary Client',
      date: date.toISOString().split('T')[0],
      startTime: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String(hour + 4).padStart(2, '0')}:00`,
      serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      status: 'open',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  openShift: (): Shift => evvFixtures.generateShift({ status: 'open' }),

  assignedShift: (caregiverId: string, caregiverName: string): Shift =>
    evvFixtures.generateShift({
      caregiverId,
      caregiverName,
      status: 'assigned'
    }),

  // API Response generators
  getVisitsResponse: (params?: { patientId?: string; caregiverId?: string; status?: string; startDate?: string; endDate?: string }) => {
    let visits: Visit[] = Array.from({ length: 20 }, () => evvFixtures.generateVisit());

    if (params?.patientId) {
      visits = visits.filter(v => v.patientId === params.patientId);
    }

    if (params?.caregiverId) {
      visits = visits.filter(v => v.caregiverId === params.caregiverId);
    }

    if (params?.status) {
      visits = visits.filter(v => v.status === params.status);
    }

    return {
      success: true,
      visits,
      total: visits.length
    };
  },

  getActiveVisitResponse: (caregiverId: string): { success: boolean; visit: Visit | null } => ({
    success: true,
    visit: evvFixtures.inProgressVisit('patient-123', caregiverId)
  }),

  clockInResponse: (visitId: string, location: { latitude: number; longitude: number }): { success: boolean; visit: Visit; message: string } => {
    const visit = evvFixtures.inProgressVisit('patient-123', 'caregiver-123');
    visit.id = visitId;
    visit.clockInLocation = { ...location, accuracy: 10 };

    const isInGeofence = Math.abs(location.latitude - baseLocation.latitude) < 0.01 &&
                         Math.abs(location.longitude - baseLocation.longitude) < 0.01;

    return {
      success: true,
      visit,
      message: isInGeofence ? 'Clocked in successfully' : 'Outside geofence - requires approval'
    };
  },

  clockOutResponse: (visitId: string, location: { latitude: number; longitude: number }): { success: boolean; visit: Visit; hours: number } => {
    const visit = evvFixtures.completedVisit('patient-123', 'caregiver-123', 4);
    visit.id = visitId;
    visit.clockOutLocation = { ...location, accuracy: 12 };

    return {
      success: true,
      visit,
      hours: 4.0
    };
  },

  // Scheduling responses
  getShiftsResponse: (params?: { date?: string; patientId?: string; caregiverId?: string; status?: string }) => {
    let shifts: Shift[] = Array.from({ length: 15 }, () => evvFixtures.generateShift());

    if (params?.date) {
      shifts = shifts.filter(s => s.date === params.date);
    }

    if (params?.patientId) {
      shifts = shifts.filter(s => s.patientId === params.patientId);
    }

    if (params?.caregiverId) {
      shifts = shifts.filter(s => s.caregiverId === params.caregiverId);
    }

    if (params?.status) {
      shifts = shifts.filter(s => s.status === params.status);
    }

    return {
      success: true,
      shifts,
      total: shifts.length
    };
  },

  createShiftResponse: (shiftData: Partial<Shift>): { success: boolean; shift: Shift } => ({
    success: true,
    shift: evvFixtures.generateShift(shiftData)
  }),

  assignShiftResponse: (shiftId: string, caregiverId: string, caregiverName: string): { success: boolean; shift: Shift } => ({
    success: true,
    shift: evvFixtures.assignedShift(caregiverId, caregiverName)
  }),

  // Error responses
  geofenceError: {
    error: 'Outside geofence',
    message: 'You are outside the authorized geofence for this visit. Clock-in requires supervisor approval.'
  },

  noActiveVisitError: {
    error: 'No active visit',
    message: 'You do not have an active visit to clock out from'
  },

  alreadyClockedInError: {
    error: 'Already clocked in',
    message: 'You are already clocked in to a visit'
  },

  outsideAuthorizationError: {
    error: 'Outside authorization',
    message: 'Cannot schedule visit outside the patient authorization period'
  },

  expiredCredentialError: {
    error: 'Expired credentials',
    message: 'Caregiver has expired credentials and cannot be scheduled'
  }
};
