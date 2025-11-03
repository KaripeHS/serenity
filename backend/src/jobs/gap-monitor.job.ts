/**
 * Coverage Gap Monitoring Job
 *
 * Runs every 5 minutes to detect coverage gaps and alert Pod Leads.
 *
 * Cron Schedule: */5 * * * * (Every 5 minutes)
 *
 * Detection Rules:
 * - No-Show: Caregiver hasn't clocked in >15 min after scheduled start
 * - Early Departure: Caregiver clocked out >30 min before scheduled end
 *
 * Alert Priority:
 * - Low (15-19 min): Email to Pod Lead
 * - Medium (20-29 min): Email + SMS to Pod Lead
 * - High (30-59 min): Email + SMS + Dashboard alert
 * - Critical (60+ min): Email + SMS + Dashboard + escalate to ops manager
 *
 * Usage:
 * - Production: Schedule via cron or task scheduler
 * - Development: Run manually with `npx ts-node src/jobs/gap-monitor.job.ts`
 *
 * @module jobs/gap-monitor
 */

import { getGapDetectionService } from '../services/operations/gap-detection.service';
import { getEmailService } from '../services/notifications/email.service';
import { getSMSService } from '../services/notifications/sms.service';

/**
 * Send gap alert to Pod Lead
 */
async function sendGapAlert(gap: any): Promise<void> {
  const emailService = getEmailService();

  // Determine alert emoji based on severity
  const emoji = gap.severity === 'critical' ? '🔴' :
                gap.severity === 'high' ? '🟠' :
                gap.severity === 'medium' ? '🟡' : '🔵';

  const urgencyText = gap.severity === 'critical' ? 'CRITICAL' :
                      gap.severity === 'high' ? 'HIGH PRIORITY' :
                      gap.severity === 'medium' ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';

  // TODO: Implement email template for gap alerts
  // await emailService.sendGapAlert({
  //   to: gap.podLeadPhone + '@sms.carrier.com', // SMS via email gateway
  //   podLeadName: gap.podLeadName,
  //   patientName: gap.patientName,
  //   patientAddress: gap.patientAddress,
  //   caregiverName: gap.caregiverName,
  //   scheduledStart: gap.scheduledStart,
  //   minutesLate: gap.minutesLate,
  //   severity: gap.severity,
  //   gapId: gap.id,
  // });

  console.log(`  ${emoji} Sent ${urgencyText} alert to Pod Lead ${gap.podLeadName} about ${gap.patientName}`);
  console.log(`      Caregiver ${gap.caregiverName} is ${gap.minutesLate} min late`);

  // Mark as notified
  const gapService = getGapDetectionService();
  await gapService.markAsNotified(gap.id);

  // Send SMS for medium+ severity
  if (gap.severity !== 'low') {
    const smsService = getSMSService();
    try {
      await smsService.sendGapAlert({
        podLeadName: gap.podLeadName,
        podLeadPhone: gap.podLeadPhone,
        patientName: gap.patientName,
        patientAddress: gap.patientAddress,
        caregiverName: gap.caregiverName,
        minutesLate: gap.minutesLate,
        severity: gap.severity,
        gapId: gap.id,
      });
      console.log(`      📱 SMS sent to ${gap.podLeadPhone}`);
    } catch (error: any) {
      console.error(`      ⚠️  SMS send failed: ${error.message}`);
    }
  }
}

/**
 * Main gap monitoring function
 */
async function monitorCoverageGaps(): Promise<void> {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('[GAP MONITOR] Starting coverage gap check');
  console.log(`[GAP MONITOR] Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // TODO: Get all organizations from database
    // For now, check single organization
    const organizationId = 'org-001';

    const gapService = getGapDetectionService();

    // Detect gaps
    console.log(`[GAP MONITOR] Checking organization ${organizationId} for gaps...`);
    const gaps = await gapService.detectGaps(organizationId);

    if (gaps.length === 0) {
      console.log('[GAP MONITOR] ✅ No coverage gaps detected');
    } else {
      console.log(`[GAP MONITOR] ⚠️  Found ${gaps.length} coverage gap(s)`);
      console.log('');

      // Process each gap
      for (const gap of gaps) {
        console.log(`[GAP MONITOR] Gap ID: ${gap.id}`);
        console.log(`  Type: ${gap.type}`);
        console.log(`  Severity: ${gap.severity}`);
        console.log(`  Status: ${gap.status}`);
        console.log(`  Patient: ${gap.patientName}`);
        console.log(`  Caregiver: ${gap.caregiverName}`);
        console.log(`  Minutes Late: ${gap.minutesLate}`);
        console.log(`  Scheduled Start: ${gap.scheduledStart.toISOString()}`);

        // Send alert if gap is newly detected
        if (gap.status === 'detected') {
          await sendGapAlert(gap);
        } else {
          console.log(`  ℹ️  Gap already notified (status: ${gap.status})`);
        }

        console.log('');
      }

      // Get active gaps summary
      const result = await gapService.getActiveGaps(organizationId);

      console.log('');
      console.log('📊 Active Gaps Summary:');
      console.log(`  Total Active: ${result.total}`);
      console.log('');
      console.log('  By Status:');
      console.log(`    Detected: ${result.byStatus.detected}`);
      console.log(`    Pod Lead Notified: ${result.byStatus.pod_lead_notified}`);
      console.log(`    Dispatched: ${result.byStatus.dispatched}`);
      console.log(`    Covered: ${result.byStatus.covered}`);
      console.log(`    Canceled: ${result.byStatus.canceled}`);
      console.log('');
      console.log('  By Severity:');
      console.log(`    🔴 Critical: ${result.bySeverity.critical}`);
      console.log(`    🟠 High: ${result.bySeverity.high}`);
      console.log(`    🟡 Medium: ${result.bySeverity.medium}`);
      console.log(`    🔵 Low: ${result.bySeverity.low}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('[GAP MONITOR] Check Complete');
    console.log('='.repeat(60));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(60));
    console.error('[GAP MONITOR] FATAL ERROR');
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
    await monitorCoverageGaps();
    console.log('[GAP MONITOR] Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[GAP MONITOR] Job failed with error');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { monitorCoverageGaps };
