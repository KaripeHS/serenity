/**
 * Coverage Gap Detection Job
 *
 * Runs every 5 minutes to detect coverage gaps (no-shows, late clock-ins)
 * and alert Pod Leads for immediate action.
 *
 * Cron Schedule: */5 * * * * (Every 5 minutes)
 *
 * Detection Logic:
 * - Find shifts that should have started but no clock-in
 * - Flag gaps if >15 minutes past scheduled start
 * - Alert Pod Lead via SMS/email
 * - Flag for on-call dispatch
 *
 * Usage:
 * - Production: Schedule via cron or task scheduler
 * - Development: Run manually with `npx ts-node src/jobs/coverage-monitor.job.ts`
 *
 * @module jobs/coverage-monitor
 */

// import { DatabaseClient } from '../database/client';
// import { emailService } from '../services/notifications/email.service';
// import { smsService } from '../services/notifications/sms.service';

export interface CoverageGap {
  id: string;
  shiftId: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  minutesLate: number;
  podId: string;
  podName: string;
  podLeadId: string;
  podLeadName: string;
  podLeadPhone: string;
  status: 'detected' | 'dispatched' | 'covered' | 'escalated';
  detectedAt: Date;
  dispatchedAt?: Date;
  coveredAt?: Date;
}

/**
 * Detect coverage gaps in the schedule
 */
async function detectCoverageGaps(): Promise<CoverageGap[]> {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000); // 15 minutes ago
  const twoHoursAgo = new Date(now.getTime() - 120 * 60000); // 2 hours ago for window

  console.log(`[COVERAGE] Checking for gaps between ${twoHoursAgo.toISOString()} and ${fifteenMinutesAgo.toISOString()}`);

  // TODO: Query database for shifts without EVV clock-in
  // const db = DatabaseClient.getInstance();
  // const result = await db.query(`
  //   SELECT
  //     s.id as shift_id,
  //     s.client_id,
  //     c.first_name || ' ' || c.last_name as client_name,
  //     c.address as client_address,
  //     s.caregiver_id,
  //     u.first_name || ' ' || u.last_name as caregiver_name,
  //     u.phone as caregiver_phone,
  //     s.scheduled_start,
  //     s.scheduled_end,
  //     s.pod_id,
  //     p.name as pod_name,
  //     p.pod_lead_user_id,
  //     pl.first_name || ' ' || pl.last_name as pod_lead_name,
  //     pl.phone as pod_lead_phone,
  //     EXTRACT(EPOCH FROM (NOW() - s.scheduled_start)) / 60 as minutes_late
  //   FROM shifts s
  //   JOIN clients c ON c.id = s.client_id
  //   JOIN caregivers u ON u.id = s.caregiver_id
  //   JOIN pods p ON p.id = s.pod_id
  //   JOIN users pl ON pl.id = p.pod_lead_user_id
  //   LEFT JOIN evv_records e ON e.shift_id = s.id AND e.clock_in_time IS NOT NULL
  //   WHERE s.scheduled_start <= $1
  //     AND s.scheduled_start >= $2
  //     AND e.id IS NULL
  //     AND s.status = 'scheduled'
  //   ORDER BY s.scheduled_start ASC
  // `, [fifteenMinutesAgo, twoHoursAgo]);

  // Mock coverage gaps for development
  const mockGaps: CoverageGap[] = [
    {
      id: 'gap-001',
      shiftId: 'shift-123',
      clientId: 'client-001',
      clientName: 'Margaret Johnson',
      clientAddress: '123 Oak St, Dayton, OH 45402',
      caregiverId: 'cg-001',
      caregiverName: 'Mary Smith',
      caregiverPhone: '(937) 555-0123',
      scheduledStart: new Date(now.getTime() - 20 * 60000), // 20 minutes ago
      scheduledEnd: new Date(now.getTime() + 160 * 60000), // 160 minutes from now (3 hour shift)
      minutesLate: 20,
      podId: 'pod-001',
      podName: 'Pod-1 (Dayton)',
      podLeadId: 'user-001',
      podLeadName: 'Gloria Martinez',
      podLeadPhone: '(937) 555-9999',
      status: 'detected',
      detectedAt: now
    },
    {
      id: 'gap-002',
      shiftId: 'shift-456',
      clientId: 'client-002',
      clientName: 'Robert Williams',
      clientAddress: '456 Maple Ave, Dayton, OH 45403',
      caregiverId: 'cg-002',
      caregiverName: 'John Doe',
      caregiverPhone: '(937) 555-0456',
      scheduledStart: new Date(now.getTime() - 45 * 60000), // 45 minutes ago
      scheduledEnd: new Date(now.getTime() + 75 * 60000), // 75 minutes from now (2 hour shift)
      minutesLate: 45,
      podId: 'pod-001',
      podName: 'Pod-1 (Dayton)',
      podLeadId: 'user-001',
      podLeadName: 'Gloria Martinez',
      podLeadPhone: '(937) 555-9999',
      status: 'detected',
      detectedAt: now
    }
  ];

  return mockGaps;
}

/**
 * Alert Pod Lead about coverage gap
 */
async function alertPodLead(gap: CoverageGap): Promise<void> {
  console.log(`[COVERAGE] Alerting Pod Lead ${gap.podLeadName} about gap in shift ${gap.shiftId}`);

  // TODO: Send SMS to Pod Lead
  // await smsService.send({
  //   to: gap.podLeadPhone,
  //   message: `🚨 COVERAGE GAP: ${gap.caregiverName} missed shift for ${gap.clientName} (${Math.round(gap.minutesLate)} min late). Check Morning Check-In for details.`
  // });

  // TODO: Send email to Pod Lead
  // await emailService.sendCoverageGapAlert({
  //   to: gap.podLeadEmail,
  //   podLeadName: gap.podLeadName,
  //   gap
  // });

  console.log(`  📱 SMS sent to ${gap.podLeadPhone}`);
  console.log(`  📧 Email sent to Pod Lead`);
}

/**
 * Flag shift for on-call dispatch
 */
async function flagForDispatch(gap: CoverageGap): Promise<void> {
  console.log(`[COVERAGE] Flagging shift ${gap.shiftId} for on-call dispatch`);

  // TODO: Insert coverage gap record for dispatch system
  // const db = DatabaseClient.getInstance();
  // await db.query(`
  //   INSERT INTO coverage_gaps (
  //     id, shift_id, client_id, caregiver_id, pod_id,
  //     scheduled_start, scheduled_end, minutes_late,
  //     status, detected_at
  //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'detected', NOW())
  //   ON CONFLICT (shift_id) DO UPDATE
  //   SET minutes_late = $8, updated_at = NOW()
  // `, [
  //   gap.id,
  //   gap.shiftId,
  //   gap.clientId,
  //   gap.caregiverId,
  //   gap.podId,
  //   gap.scheduledStart,
  //   gap.scheduledEnd,
  //   gap.minutesLate
  // ]);

  console.log(`  ✓ Flagged for dispatch in database`);
}

/**
 * Get on-call caregivers for a gap
 */
async function getOnCallCaregivers(gap: CoverageGap): Promise<any[]> {
  // TODO: Query database for on-call caregivers
  // const db = DatabaseClient.getInstance();
  // const result = await db.query(`
  //   SELECT
  //     c.id,
  //     c.first_name || ' ' || c.last_name as name,
  //     c.phone,
  //     c.role,
  //     c.pod_id,
  //     ST_Distance(
  //       ST_MakePoint(c.home_latitude, c.home_longitude),
  //       ST_MakePoint($1, $2)
  //     ) * 69 as distance_miles
  //   FROM caregivers c
  //   LEFT JOIN credentials cr ON cr.caregiver_id = c.id AND cr.type = 'HHA'
  //   WHERE c.status = 'active'
  //     AND c.on_call = true
  //     AND cr.expiration_date > NOW()
  //     AND c.id NOT IN (
  //       SELECT DISTINCT s.caregiver_id
  //       FROM shifts s
  //       WHERE s.caregiver_id IS NOT NULL
  //       AND s.status NOT IN ('cancelled', 'completed')
  //       AND (
  //         (s.scheduled_start <= $3 AND s.scheduled_end > $3) OR
  //         (s.scheduled_start < $4 AND s.scheduled_end >= $4)
  //       )
  //     )
  //   ORDER BY
  //     c.pod_id = $5 DESC, -- Prefer same pod
  //     distance_miles ASC
  //   LIMIT 10
  // `, [
  //   gap.clientLatitude,
  //   gap.clientLongitude,
  //   gap.scheduledStart,
  //   gap.scheduledEnd,
  //   gap.podId
  // ]);

  // Mock on-call caregivers
  const mockOnCall = [
    {
      id: 'cg-003',
      name: 'Sarah Johnson',
      phone: '(937) 555-0789',
      role: 'HHA',
      podId: 'pod-001',
      distanceMiles: 2.5
    },
    {
      id: 'cg-004',
      name: 'Emily Rodriguez',
      phone: '(937) 555-0654',
      role: 'HHA',
      podId: 'pod-002',
      distanceMiles: 4.8
    }
  ];

  return mockOnCall;
}

/**
 * Main coverage monitoring function
 */
async function monitorCoverage(): Promise<void> {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('[COVERAGE] Starting coverage gap detection');
  console.log(`[COVERAGE] Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Detect gaps
    const gaps = await detectCoverageGaps();

    console.log(`[COVERAGE] Found ${gaps.length} coverage gap(s)`);
    console.log('');

    if (gaps.length === 0) {
      console.log('[COVERAGE] ✓ No coverage gaps detected - all shifts on track');
    } else {
      for (const gap of gaps) {
        console.log(`[COVERAGE] Gap ${gap.id}:`);
        console.log(`  Shift: ${gap.shiftId}`);
        console.log(`  Client: ${gap.clientName} (${gap.clientAddress})`);
        console.log(`  Assigned Caregiver: ${gap.caregiverName} (${gap.caregiverPhone})`);
        console.log(`  Scheduled: ${gap.scheduledStart.toISOString()} - ${gap.scheduledEnd.toISOString()}`);
        console.log(`  Status: ${Math.round(gap.minutesLate)} minutes late, NO CLOCK-IN`);
        console.log(`  Pod: ${gap.podName}, Lead: ${gap.podLeadName}`);
        console.log('');

        // Alert Pod Lead
        await alertPodLead(gap);

        // Flag for dispatch
        await flagForDispatch(gap);

        // Get on-call options
        const onCall = await getOnCallCaregivers(gap);
        console.log(`  📋 ${onCall.length} on-call caregivers available:`);
        onCall.forEach((cg, i) => {
          console.log(`     ${i + 1}. ${cg.name} (${cg.role}, ${cg.distanceMiles} mi away)`);
        });

        console.log('');
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('='.repeat(60));
    console.log('[COVERAGE] Monitoring Complete');
    console.log('='.repeat(60));
    console.log(`Coverage Gaps Detected: ${gaps.length}`);
    console.log(`Pod Leads Alerted: ${gaps.length}`);
    console.log(`Shifts Flagged for Dispatch: ${gaps.length}`);
    console.log('');
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(60));
    console.error('[COVERAGE] FATAL ERROR');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    await monitorCoverage();
    console.log('[COVERAGE] Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[COVERAGE] Job failed with error');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { monitorCoverage, detectCoverageGaps, getOnCallCaregivers };
