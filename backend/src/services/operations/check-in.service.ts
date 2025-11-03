/**
 * Morning Check-In Service
 * Provides data for daily operations dashboard
 * Shows real-time status of today's visits
 */

import { DatabaseClient } from '../../database/client';

export interface TodaysVisit {
  id: string;
  scheduledStart: Date;
  scheduledEnd: Date;

  // Caregiver info
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  caregiverSPI: number;

  // Client info
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientZip: string;

  // EVV status
  clockInTime: Date | null;
  clockOutTime: Date | null;
  clockInLat: number | null;
  clockInLon: number | null;
  geofenceValid: boolean | null;

  // Sandata status
  sandataStatus: 'not_submitted' | 'pending' | 'accepted' | 'rejected';
  sandataSubmittedAt: Date | null;
  sandataRespondedAt: Date | null;
  sandataRejectionCode: string | null;
  sandataRejectionReason: string | null;

  // Computed status
  status: 'scheduled' | 'on_time' | 'late' | 'no_show' | 'in_progress' | 'completed';
  minutesLate: number | null;
  needsDispatch: boolean;

  // Pod info
  podId: string;
  podCode: string;
  podLeadName: string;
}

export interface CheckInSummary {
  date: Date;
  podId: string | null; // null = all pods

  totalScheduled: number;
  onTime: number;
  late: number;
  noShows: number;
  inProgress: number;
  completed: number;

  needingDispatch: number;

  evvCompliance: number; // percentage
  sandataAcceptance: number; // percentage
}

export interface OnCallCaregiver {
  id: string;
  name: string;
  phone: string;
  role: string;
  spiScore: number;
  availableUntil: Date;
  distanceFromGap: number | null; // miles, if gap location provided
  currentAssignments: number;
  maxAssignments: number;
}

export class CheckInService {
  private static instance: CheckInService;

  private constructor() {}

  public static getInstance(): CheckInService {
    if (!CheckInService.instance) {
      CheckInService.instance = new CheckInService();
    }
    return CheckInService.instance;
  }

  /**
   * Get all today's visits with real-time status
   */
  async getTodaysVisits(organizationId: string, podId?: string): Promise<TodaysVisit[]> {
    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     s.id,
    //     s.scheduled_start,
    //     s.scheduled_end,
    //
    //     -- Caregiver
    //     c.id as caregiver_id,
    //     c.first_name || ' ' || c.last_name as caregiver_name,
    //     c.phone as caregiver_phone,
    //     spi.score as caregiver_spi,
    //
    //     -- Client
    //     cl.id as client_id,
    //     cl.first_name || ' ' || cl.last_name as client_name,
    //     cl.address_line1 as client_address,
    //     cl.city as client_city,
    //     cl.state as client_state,
    //     cl.zip_code as client_zip,
    //
    //     -- EVV
    //     e.clock_in_time,
    //     e.clock_out_time,
    //     e.clock_in_lat,
    //     e.clock_in_lon,
    //     e.geofence_valid,
    //
    //     -- Sandata
    //     st.status as sandata_status,
    //     st.submitted_at as sandata_submitted_at,
    //     st.responded_at as sandata_responded_at,
    //     st.rejection_code as sandata_rejection_code,
    //     st.rejection_reason as sandata_rejection_reason,
    //
    //     -- Pod
    //     p.id as pod_id,
    //     p.code as pod_code,
    //     pl.first_name || ' ' || pl.last_name as pod_lead_name
    //
    //   FROM shifts s
    //   JOIN caregivers c ON c.id = s.caregiver_id
    //   JOIN clients cl ON cl.id = s.client_id
    //   JOIN pods p ON p.id = s.pod_id
    //   LEFT JOIN users pl ON pl.id = p.team_lead_id
    //   LEFT JOIN evv_records e ON e.shift_id = s.id
    //   LEFT JOIN sandata_transactions st ON st.visit_id = e.id
    //   LEFT JOIN (
    //     SELECT caregiver_id, score
    //     FROM spi_snapshots
    //     WHERE month = DATE_TRUNC('month', CURRENT_DATE)
    //   ) spi ON spi.caregiver_id = c.id
    //
    //   WHERE s.organization_id = $1
    //     AND DATE(s.scheduled_start) = CURRENT_DATE
    //     AND ($2::uuid IS NULL OR s.pod_id = $2)
    //     AND s.status != 'cancelled'
    //
    //   ORDER BY s.scheduled_start
    // `, [organizationId, podId]);

    // Mock data for now
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const visits: TodaysVisit[] = [
      // On-time visit
      {
        id: 'visit-001',
        scheduledStart: new Date(today.getTime() + 8 * 60 * 60000), // 8 AM
        scheduledEnd: new Date(today.getTime() + 10 * 60 * 60000), // 10 AM

        caregiverId: 'cg-001',
        caregiverName: 'Sarah Johnson',
        caregiverPhone: '(404) 555-0101',
        caregiverSPI: 92,

        clientId: 'client-001',
        clientName: 'Robert Williams',
        clientAddress: '123 Oak Street',
        clientCity: 'Atlanta',
        clientState: 'GA',
        clientZip: '30303',

        clockInTime: new Date(today.getTime() + 7 * 60 * 60000 + 58 * 60000), // 7:58 AM
        clockOutTime: null,
        clockInLat: 33.7490,
        clockInLon: -84.3880,
        geofenceValid: true,

        sandataStatus: 'accepted',
        sandataSubmittedAt: new Date(today.getTime() + 8 * 60 * 60000 + 5 * 60000),
        sandataRespondedAt: new Date(today.getTime() + 8 * 60 * 60000 + 10 * 60000),
        sandataRejectionCode: null,
        sandataRejectionReason: null,

        status: 'in_progress',
        minutesLate: null,
        needsDispatch: false,

        podId: 'pod-001',
        podCode: 'POD-ATL-01',
        podLeadName: 'Gloria Thompson'
      },

      // Late visit
      {
        id: 'visit-002',
        scheduledStart: new Date(today.getTime() + 9 * 60 * 60000), // 9 AM
        scheduledEnd: new Date(today.getTime() + 11 * 60 * 60000), // 11 AM

        caregiverId: 'cg-002',
        caregiverName: 'Maria Garcia',
        caregiverPhone: '(404) 555-0102',
        caregiverSPI: 85,

        clientId: 'client-002',
        clientName: 'Dorothy Davis',
        clientAddress: '456 Maple Avenue',
        clientCity: 'Atlanta',
        clientState: 'GA',
        clientZip: '30305',

        clockInTime: new Date(today.getTime() + 9 * 60 * 60000 + 12 * 60000), // 9:12 AM
        clockOutTime: null,
        clockInLat: 33.7580,
        clockInLon: -84.3910,
        geofenceValid: true,

        sandataStatus: 'pending',
        sandataSubmittedAt: new Date(today.getTime() + 9 * 60 * 60000 + 15 * 60000),
        sandataRespondedAt: null,
        sandataRejectionCode: null,
        sandataRejectionReason: null,

        status: 'late',
        minutesLate: 12,
        needsDispatch: false,

        podId: 'pod-001',
        podCode: 'POD-ATL-01',
        podLeadName: 'Gloria Thompson'
      },

      // No-show visit (needs dispatch)
      {
        id: 'visit-003',
        scheduledStart: new Date(today.getTime() + 10 * 60 * 60000), // 10 AM
        scheduledEnd: new Date(today.getTime() + 12 * 60 * 60000), // 12 PM

        caregiverId: 'cg-003',
        caregiverName: 'James Martinez',
        caregiverPhone: '(404) 555-0103',
        caregiverSPI: 78,

        clientId: 'client-003',
        clientName: 'Helen Smith',
        clientAddress: '789 Pine Road',
        clientCity: 'Atlanta',
        clientState: 'GA',
        clientZip: '30308',

        clockInTime: null,
        clockOutTime: null,
        clockInLat: null,
        clockInLon: null,
        geofenceValid: null,

        sandataStatus: 'not_submitted',
        sandataSubmittedAt: null,
        sandataRespondedAt: null,
        sandataRejectionCode: null,
        sandataRejectionReason: null,

        status: 'no_show',
        minutesLate: 25,
        needsDispatch: true,

        podId: 'pod-001',
        podCode: 'POD-ATL-01',
        podLeadName: 'Gloria Thompson'
      },

      // Completed visit
      {
        id: 'visit-004',
        scheduledStart: new Date(today.getTime() + 6 * 60 * 60000), // 6 AM
        scheduledEnd: new Date(today.getTime() + 8 * 60 * 60000), // 8 AM

        caregiverId: 'cg-004',
        caregiverName: 'Linda Brown',
        caregiverPhone: '(404) 555-0104',
        caregiverSPI: 95,

        clientId: 'client-004',
        clientName: 'George Taylor',
        clientAddress: '321 Elm Street',
        clientCity: 'Atlanta',
        clientState: 'GA',
        clientZip: '30310',

        clockInTime: new Date(today.getTime() + 5 * 60 * 60000 + 57 * 60000), // 5:57 AM
        clockOutTime: new Date(today.getTime() + 8 * 60 * 60000 + 2 * 60000), // 8:02 AM
        clockInLat: 33.7410,
        clockInLon: -84.3850,
        geofenceValid: true,

        sandataStatus: 'accepted',
        sandataSubmittedAt: new Date(today.getTime() + 8 * 60 * 60000 + 10 * 60000),
        sandataRespondedAt: new Date(today.getTime() + 8 * 60 * 60000 + 15 * 60000),
        sandataRejectionCode: null,
        sandataRejectionReason: null,

        status: 'completed',
        minutesLate: null,
        needsDispatch: false,

        podId: 'pod-001',
        podCode: 'POD-ATL-01',
        podLeadName: 'Gloria Thompson'
      },

      // Future scheduled visit
      {
        id: 'visit-005',
        scheduledStart: new Date(today.getTime() + 14 * 60 * 60000), // 2 PM
        scheduledEnd: new Date(today.getTime() + 16 * 60 * 60000), // 4 PM

        caregiverId: 'cg-005',
        caregiverName: 'Jennifer Wilson',
        caregiverPhone: '(404) 555-0105',
        caregiverSPI: 88,

        clientId: 'client-005',
        clientName: 'Patricia Anderson',
        clientAddress: '654 Birch Lane',
        clientCity: 'Atlanta',
        clientState: 'GA',
        clientZip: '30312',

        clockInTime: null,
        clockOutTime: null,
        clockInLat: null,
        clockInLon: null,
        geofenceValid: null,

        sandataStatus: 'not_submitted',
        sandataSubmittedAt: null,
        sandataRespondedAt: null,
        sandataRejectionCode: null,
        sandataRejectionReason: null,

        status: 'scheduled',
        minutesLate: null,
        needsDispatch: false,

        podId: 'pod-001',
        podCode: 'POD-ATL-01',
        podLeadName: 'Gloria Thompson'
      }
    ];

    // Filter by pod if specified
    if (podId) {
      return visits.filter(v => v.podId === podId);
    }

    return visits;
  }

  /**
   * Get summary stats for today
   */
  async getCheckInSummary(organizationId: string, podId?: string): Promise<CheckInSummary> {
    const visits = await this.getTodaysVisits(organizationId, podId);

    const summary: CheckInSummary = {
      date: new Date(),
      podId: podId || null,

      totalScheduled: visits.length,
      onTime: visits.filter(v => v.status === 'on_time' || (v.status === 'in_progress' && !v.minutesLate)).length,
      late: visits.filter(v => v.status === 'late' || (v.minutesLate && v.minutesLate > 0)).length,
      noShows: visits.filter(v => v.status === 'no_show').length,
      inProgress: visits.filter(v => v.status === 'in_progress').length,
      completed: visits.filter(v => v.status === 'completed').length,

      needingDispatch: visits.filter(v => v.needsDispatch).length,

      evvCompliance: 0,
      sandataAcceptance: 0
    };

    // Calculate EVV compliance (visits with valid clock-ins)
    const visitsWithEVV = visits.filter(v => v.clockInTime !== null);
    summary.evvCompliance = visits.length > 0
      ? Math.round((visitsWithEVV.length / visits.length) * 100)
      : 0;

    // Calculate Sandata acceptance (accepted / submitted)
    const submittedToSandata = visits.filter(v => v.sandataStatus !== 'not_submitted');
    const acceptedBySandata = visits.filter(v => v.sandataStatus === 'accepted');
    summary.sandataAcceptance = submittedToSandata.length > 0
      ? Math.round((acceptedBySandata.length / submittedToSandata.length) * 100)
      : 0;

    return summary;
  }

  /**
   * Get available on-call caregivers for dispatch
   */
  async getOnCallCaregivers(organizationId: string, podId?: string, gapLocation?: { lat: number; lon: number }): Promise<OnCallCaregiver[]> {
    // TODO: Query from database
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     c.id,
    //     c.first_name || ' ' || c.last_name as name,
    //     c.phone,
    //     c.role,
    //     spi.score as spi_score,
    //     oc.available_until,
    //     COUNT(s.id) as current_assignments,
    //     oc.max_assignments
    //   FROM caregivers c
    //   JOIN on_call_pool oc ON oc.caregiver_id = c.id
    //   LEFT JOIN shifts s ON s.caregiver_id = c.id AND DATE(s.scheduled_start) = CURRENT_DATE
    //   LEFT JOIN (
    //     SELECT caregiver_id, score
    //     FROM spi_snapshots
    //     WHERE month = DATE_TRUNC('month', CURRENT_DATE)
    //   ) spi ON spi.caregiver_id = c.id
    //   WHERE c.organization_id = $1
    //     AND oc.date = CURRENT_DATE
    //     AND oc.available_until > NOW()
    //     AND ($2::uuid IS NULL OR c.pod_id = $2)
    //   GROUP BY c.id, c.first_name, c.last_name, c.phone, c.role, spi.score, oc.available_until, oc.max_assignments
    //   HAVING COUNT(s.id) < oc.max_assignments
    //   ORDER BY spi.score DESC
    // `, [organizationId, podId]);

    // Mock data
    const onCall: OnCallCaregiver[] = [
      {
        id: 'cg-006',
        name: 'Michael Chen',
        phone: '(404) 555-0106',
        role: 'HHA',
        spiScore: 90,
        availableUntil: new Date(Date.now() + 6 * 60 * 60000), // 6 hours from now
        distanceFromGap: gapLocation ? 2.3 : null,
        currentAssignments: 0,
        maxAssignments: 2
      },
      {
        id: 'cg-007',
        name: 'Jessica Martinez',
        phone: '(404) 555-0107',
        role: 'LPN',
        spiScore: 87,
        availableUntil: new Date(Date.now() + 8 * 60 * 60000), // 8 hours from now
        distanceFromGap: gapLocation ? 4.1 : null,
        currentAssignments: 1,
        maxAssignments: 3
      },
      {
        id: 'cg-008',
        name: 'David Thompson',
        phone: '(404) 555-0108',
        role: 'HHA',
        spiScore: 83,
        availableUntil: new Date(Date.now() + 4 * 60 * 60000), // 4 hours from now
        distanceFromGap: gapLocation ? 6.7 : null,
        currentAssignments: 0,
        maxAssignments: 2
      }
    ];

    return onCall;
  }
}

export function getCheckInService(): CheckInService {
  return CheckInService.getInstance();
}
