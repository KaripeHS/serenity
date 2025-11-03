/**
 * Coverage Gap Detection Service
 *
 * Monitors scheduled visits in real-time and detects coverage gaps:
 * - No-shows (>15 min late with no clock-in)
 * - Early departures (clocked out before scheduled end)
 * - Unscheduled absences
 *
 * Automatically alerts Pod Leads and tracks response times.
 *
 * @module services/operations/gap-detection
 */

interface CoverageGap {
  id: string;
  type: 'no_show' | 'early_departure' | 'unscheduled';
  shiftId: string;
  patientId: string;
  patientName: string;
  patientAddress: string;
  patientPhone: string;
  patientLatitude: number;
  patientLongitude: number;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  podId: string;
  podLeadId: string;
  podLeadName: string;
  podLeadPhone: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  detectedAt: Date;
  minutesLate: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'pod_lead_notified' | 'dispatched' | 'covered' | 'canceled';
  notifiedAt?: Date;
  dispatchedAt?: Date;
  coveredAt?: Date;
  replacementCaregiverId?: string;
  responseTimeMinutes?: number;
}

interface GapDetectionResult {
  gaps: CoverageGap[];
  total: number;
  byStatus: {
    detected: number;
    pod_lead_notified: number;
    dispatched: number;
    covered: number;
    canceled: number;
  };
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export class GapDetectionService {
  private static instance: GapDetectionService;

  private constructor() {}

  static getInstance(): GapDetectionService {
    if (!GapDetectionService.instance) {
      GapDetectionService.instance = new GapDetectionService();
    }
    return GapDetectionService.instance;
  }

  /**
   * Check for coverage gaps in real-time
   * Called every 5 minutes by the gap-monitor job
   */
  async detectGaps(organizationId: string): Promise<CoverageGap[]> {
    const now = new Date();
    const gaps: CoverageGap[] = [];

    // TODO: Query database for scheduled shifts that should have started
    // const shifts = await db.query(`
    //   SELECT
    //     s.id as shift_id,
    //     s.scheduled_start,
    //     s.scheduled_end,
    //     s.pod_id,
    //     p.id as patient_id,
    //     p.first_name || ' ' || p.last_name as patient_name,
    //     p.address,
    //     p.phone as patient_phone,
    //     p.latitude,
    //     p.longitude,
    //     c.id as caregiver_id,
    //     c.first_name || ' ' || c.last_name as caregiver_name,
    //     c.phone as caregiver_phone,
    //     pl.id as pod_lead_id,
    //     pl.first_name || ' ' || pl.last_name as pod_lead_name,
    //     pl.phone as pod_lead_phone,
    //     v.id as visit_id,
    //     v.clock_in_time
    //   FROM shifts s
    //   JOIN patients p ON p.id = s.patient_id
    //   JOIN caregivers c ON c.id = s.caregiver_id
    //   JOIN pods pod ON pod.id = s.pod_id
    //   JOIN caregivers pl ON pl.id = pod.pod_lead_id
    //   LEFT JOIN visits v ON v.shift_id = s.id
    //   WHERE s.organization_id = $1
    //     AND s.scheduled_start < NOW()
    //     AND s.scheduled_start > NOW() - INTERVAL '4 hours'
    //     AND s.status = 'scheduled'
    //     AND v.id IS NULL  -- No visit record yet
    //   ORDER BY s.scheduled_start ASC
    // `, [organizationId]);

    // Mock data for development
    const mockShift = {
      shift_id: 'shift-003',
      scheduled_start: new Date(now.getTime() - 25 * 60 * 1000), // 25 minutes ago
      scheduled_end: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      patient_id: 'patient-003',
      patient_name: 'Robert Smith',
      address: '789 Oak Ave, Dayton, OH 45420',
      patient_phone: '(937) 555-0303',
      latitude: 39.7589,
      longitude: -84.1916,
      caregiver_id: 'caregiver-003',
      caregiver_name: 'James Wilson',
      caregiver_phone: '(937) 555-1003',
      pod_id: 'pod-001',
      pod_lead_id: 'pl-001',
      pod_lead_name: 'Sarah Thompson',
      pod_lead_phone: '(937) 555-2001',
      visit_id: null,
      clock_in_time: null,
    };

    // Check if shift is late (>15 minutes)
    const scheduledStart = new Date(mockShift.scheduled_start);
    const minutesLate = Math.floor((now.getTime() - scheduledStart.getTime()) / 1000 / 60);

    if (minutesLate > 15) {
      const gap: CoverageGap = {
        id: `gap-${mockShift.shift_id}-${now.getTime()}`,
        type: 'no_show',
        shiftId: mockShift.shift_id,
        patientId: mockShift.patient_id,
        patientName: mockShift.patient_name,
        patientAddress: mockShift.address,
        patientPhone: mockShift.patient_phone,
        patientLatitude: mockShift.latitude,
        patientLongitude: mockShift.longitude,
        caregiverId: mockShift.caregiver_id,
        caregiverName: mockShift.caregiver_name,
        caregiverPhone: mockShift.caregiver_phone,
        podId: mockShift.pod_id,
        podLeadId: mockShift.pod_lead_id,
        podLeadName: mockShift.pod_lead_name,
        podLeadPhone: mockShift.pod_lead_phone,
        scheduledStart: scheduledStart,
        scheduledEnd: new Date(mockShift.scheduled_end),
        detectedAt: now,
        minutesLate,
        severity: this.calculateSeverity(minutesLate),
        status: 'detected',
      };

      gaps.push(gap);

      // Save gap to database for tracking
      // await this.saveGap(gap);
    }

    return gaps;
  }

  /**
   * Calculate gap severity based on minutes late
   */
  private calculateSeverity(minutesLate: number): 'low' | 'medium' | 'high' | 'critical' {
    if (minutesLate >= 60) return 'critical'; // 1+ hour
    if (minutesLate >= 30) return 'high'; // 30-59 minutes
    if (minutesLate >= 20) return 'medium'; // 20-29 minutes
    return 'low'; // 15-19 minutes
  }

  /**
   * Get all active gaps for organization
   */
  async getActiveGaps(organizationId: string, podId?: string): Promise<GapDetectionResult> {
    // TODO: Query database for active gaps
    // const gaps = await db.query(`
    //   SELECT * FROM coverage_gaps
    //   WHERE organization_id = $1
    //     AND status NOT IN ('covered', 'canceled')
    //     ${podId ? 'AND pod_id = $2' : ''}
    //   ORDER BY detected_at DESC
    // `, podId ? [organizationId, podId] : [organizationId]);

    // Mock data
    const gaps = await this.detectGaps(organizationId);

    // Calculate statistics
    const byStatus = {
      detected: gaps.filter(g => g.status === 'detected').length,
      pod_lead_notified: gaps.filter(g => g.status === 'pod_lead_notified').length,
      dispatched: gaps.filter(g => g.status === 'dispatched').length,
      covered: gaps.filter(g => g.status === 'covered').length,
      canceled: gaps.filter(g => g.status === 'canceled').length,
    };

    const bySeverity = {
      low: gaps.filter(g => g.severity === 'low').length,
      medium: gaps.filter(g => g.severity === 'medium').length,
      high: gaps.filter(g => g.severity === 'high').length,
      critical: gaps.filter(g => g.severity === 'critical').length,
    };

    return {
      gaps,
      total: gaps.length,
      byStatus,
      bySeverity,
    };
  }

  /**
   * Mark gap as notified (Pod Lead has been alerted)
   */
  async markAsNotified(gapId: string): Promise<void> {
    // TODO: Update database
    // await db.query(`
    //   UPDATE coverage_gaps
    //   SET status = 'pod_lead_notified',
    //       notified_at = NOW()
    //   WHERE id = $1
    // `, [gapId]);

    console.log(`[GAP DETECTION] Gap ${gapId} marked as notified`);
  }

  /**
   * Mark gap as dispatched (On-call caregiver sent)
   */
  async markAsDispatched(gapId: string, replacementCaregiverId: string): Promise<void> {
    // TODO: Update database
    // await db.query(`
    //   UPDATE coverage_gaps
    //   SET status = 'dispatched',
    //       dispatched_at = NOW(),
    //       replacement_caregiver_id = $2
    //   WHERE id = $1
    // `, [gapId, replacementCaregiverId]);

    console.log(`[GAP DETECTION] Gap ${gapId} marked as dispatched with caregiver ${replacementCaregiverId}`);
  }

  /**
   * Mark gap as covered (Replacement caregiver clocked in)
   */
  async markAsCovered(gapId: string): Promise<void> {
    const coveredAt = new Date();

    // TODO: Calculate response time
    // const gap = await db.query(`
    //   SELECT detected_at FROM coverage_gaps WHERE id = $1
    // `, [gapId]);
    //
    // const responseTimeMinutes = Math.floor((coveredAt.getTime() - gap.detected_at.getTime()) / 1000 / 60);
    //
    // await db.query(`
    //   UPDATE coverage_gaps
    //   SET status = 'covered',
    //       covered_at = $2,
    //       response_time_minutes = $3
    //   WHERE id = $1
    // `, [gapId, coveredAt, responseTimeMinutes]);

    console.log(`[GAP DETECTION] Gap ${gapId} marked as covered`);
  }

  /**
   * Mark gap as canceled (Visit was canceled, no coverage needed)
   */
  async markAsCanceled(gapId: string, reason: string): Promise<void> {
    // TODO: Update database
    // await db.query(`
    //   UPDATE coverage_gaps
    //   SET status = 'canceled',
    //       cancellation_reason = $2,
    //       updated_at = NOW()
    //   WHERE id = $1
    // `, [gapId, reason]);

    console.log(`[GAP DETECTION] Gap ${gapId} marked as canceled: ${reason}`);
  }

  /**
   * Get gap statistics for reporting
   */
  async getGapStatistics(
    organizationId: string,
    podId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalGaps: number;
    averageResponseTimeMinutes: number;
    coverageRate: number; // % of gaps successfully covered
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    trends: {
      date: string;
      gaps: number;
      covered: number;
      coverageRate: number;
    }[];
  }> {
    // TODO: Query database for gap statistics
    // This will help Pod Leads and executives track operational efficiency

    return {
      totalGaps: 0,
      averageResponseTimeMinutes: 0,
      coverageRate: 0,
      byType: {},
      bySeverity: {},
      trends: [],
    };
  }
}

export function getGapDetectionService(): GapDetectionService {
  return GapDetectionService.getInstance();
}
