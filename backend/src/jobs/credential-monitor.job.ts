/**
 * Credential Expiration Monitoring Job
 *
 * Runs daily at 8:00 AM to check for expiring or expired credentials
 * and send alerts to caregivers and HR.
 *
 * Cron Schedule: 0 8 * * * (At 08:00 every day)
 *
 * Alert Schedule:
 * - 30 days before: Initial warning email
 * - 15 days before: Urgent reminder email
 * - 7 days before: Final warning email
 * - 0 days (expired): Critical alert + block scheduling
 *
 * Usage:
 * - Production: Schedule via cron or task scheduler
 * - Development: Run manually with `npx ts-node src/jobs/credential-monitor.job.ts`
 *
 * @module jobs/credential-monitor
 */

// import { DatabaseClient } from '../database/client';
// import { emailService } from '../services/notifications/email.service';

interface ExpiringCredential {
  id: string;
  caregiverId: string;
  caregiverName: string;
  caregiverEmail: string;
  type: string; // 'HHA', 'LPN', 'RN', 'CPR', 'TB', 'Background Check'
  expirationDate: Date;
  daysLeft: number;
  status: 'active' | 'expiring_soon' | 'expired';
}

/**
 * Calculate days until expiration
 */
function calculateDaysLeft(expirationDate: Date): number {
  const now = new Date();
  const diff = expirationDate.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if alert should be sent today
 * Alerts sent at 30, 15, 7, and 0 days before expiration
 */
function shouldSendAlert(daysLeft: number): boolean {
  return daysLeft === 30 || daysLeft === 15 || daysLeft === 7 || daysLeft === 0;
}

/**
 * Get alert severity level
 */
function getAlertLevel(daysLeft: number): 'info' | 'warning' | 'urgent' | 'critical' {
  if (daysLeft <= 0) return 'critical';
  if (daysLeft <= 7) return 'urgent';
  if (daysLeft <= 15) return 'warning';
  return 'info';
}

/**
 * Block scheduling for caregivers with expired credentials
 */
async function blockScheduling(caregiverId: string, credentialType: string): Promise<void> {
  // TODO: Update database to block scheduling
  // const db = DatabaseClient.getInstance();
  // await db.query(`
  //   UPDATE caregivers
  //   SET scheduling_blocked = true,
  //       blocking_reason = $1,
  //       updated_at = NOW()
  //   WHERE id = $2
  // `, [`Expired ${credentialType} credential`, caregiverId]);

  console.log(`  🚫 Blocked scheduling for caregiver ${caregiverId} due to expired ${credentialType}`);
}

/**
 * Send credential expiration alert to caregiver
 */
async function sendCaregiverAlert(credential: ExpiringCredential): Promise<void> {
  const alertLevel = getAlertLevel(credential.daysLeft);

  // TODO: Send email using email service
  // await emailService.sendCredentialExpirationAlert({
  //   to: credential.caregiverEmail,
  //   name: credential.caregiverName,
  //   credentialType: credential.type,
  //   expirationDate: credential.expirationDate,
  //   daysLeft: credential.daysLeft,
  //   alertLevel
  // });

  console.log(`  📧 Sent ${alertLevel} alert to ${credential.caregiverName} about ${credential.type} expiring in ${credential.daysLeft} days`);
}

/**
 * Send daily digest to HR with all expiring credentials
 */
async function sendHRDigest(
  expiringSoon: ExpiringCredential[],
  expired: ExpiringCredential[]
): Promise<void> {
  if (expiringSoon.length === 0 && expired.length === 0) {
    console.log('[CRED MONITOR] No expiring/expired credentials to report to HR');
    return;
  }

  // Group by days left
  const groupedByDays = expiringSoon.reduce((acc, cred) => {
    const key = cred.daysLeft;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cred);
    return acc;
  }, {} as Record<number, ExpiringCredential[]>);

  // TODO: Send email digest to HR
  // await emailService.sendCredentialDigest({
  //   to: 'hr@serenitycarepartners.com',
  //   expiringSoon: groupedByDays,
  //   expired,
  //   date: new Date().toISOString().split('T')[0]
  // });

  console.log('');
  console.log('📊 HR Digest Summary:');
  console.log(`  Expired: ${expired.length}`);
  console.log(`  Expiring within 30 days: ${expiringSoon.length}`);
  if (Object.keys(groupedByDays).length > 0) {
    console.log('  Breakdown by days:');
    Object.keys(groupedByDays)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(days => {
        console.log(`    ${days} days: ${groupedByDays[parseInt(days)].length} credentials`);
      });
  }
}

/**
 * Main credential monitoring function
 */
async function checkExpiringCredentials(): Promise<void> {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('[CRED MONITOR] Starting daily credential check');
  console.log(`[CRED MONITOR] Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // TODO: Query database for credentials expiring within 30 days
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     cr.id,
    //     cr.caregiver_id,
    //     c.first_name || ' ' || c.last_name as caregiver_name,
    //     c.email as caregiver_email,
    //     cr.type,
    //     cr.expiration_date,
    //     cr.status
    //   FROM credentials cr
    //   JOIN caregivers c ON c.id = cr.caregiver_id
    //   WHERE cr.expiration_date <= NOW() + INTERVAL '30 days'
    //     AND cr.status = 'active'
    //     AND c.status IN ('active', 'onboarding')
    //   ORDER BY cr.expiration_date ASC
    // `);

    // Mock data for development
    const mockCredentials: ExpiringCredential[] = [
      {
        id: 'cred-001',
        caregiverId: 'cg-001',
        caregiverName: 'Mary Smith',
        caregiverEmail: 'mary@example.com',
        type: 'CPR Certification',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        daysLeft: 7,
        status: 'expiring_soon'
      },
      {
        id: 'cred-002',
        caregiverId: 'cg-002',
        caregiverName: 'John Doe',
        caregiverEmail: 'john@example.com',
        type: 'HHA License',
        expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        daysLeft: 15,
        status: 'expiring_soon'
      },
      {
        id: 'cred-003',
        caregiverId: 'cg-003',
        caregiverName: 'Sarah Johnson',
        caregiverEmail: 'sarah@example.com',
        type: 'TB Test',
        expirationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
        daysLeft: -1,
        status: 'expired'
      },
      {
        id: 'cred-004',
        caregiverId: 'cg-004',
        caregiverName: 'Emily Rodriguez',
        caregiverEmail: 'emily@example.com',
        type: 'Background Check',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        daysLeft: 30,
        status: 'expiring_soon'
      }
    ];

    console.log(`[CRED MONITOR] Found ${mockCredentials.length} credentials expiring within 30 days`);
    console.log('');

    let alertsSent = 0;
    let blocked = 0;
    const expiringSoon: ExpiringCredential[] = [];
    const expired: ExpiringCredential[] = [];

    // Process each credential
    for (const credential of mockCredentials) {
      const daysLeft = calculateDaysLeft(credential.expirationDate);
      credential.daysLeft = daysLeft;

      // Classify
      if (daysLeft < 0) {
        credential.status = 'expired';
        expired.push(credential);
      } else if (daysLeft <= 30) {
        credential.status = 'expiring_soon';
        expiringSoon.push(credential);
      }

      // Determine action
      const alertLevel = getAlertLevel(daysLeft);
      const shouldAlert = shouldSendAlert(daysLeft);

      console.log(`[CRED MONITOR] ${credential.caregiverName} - ${credential.type}`);
      console.log(`  Expires: ${credential.expirationDate.toISOString().split('T')[0]}`);
      console.log(`  Days left: ${daysLeft}`);
      console.log(`  Alert level: ${alertLevel}`);

      // Send alert if needed
      if (shouldAlert) {
        await sendCaregiverAlert(credential);
        alertsSent++;
      } else {
        console.log(`  ⏭️  No alert needed today (next alert at ${getNextAlertDays(daysLeft)} days)`);
      }

      // Block scheduling if expired
      if (daysLeft <= 0) {
        await blockScheduling(credential.caregiverId, credential.type);
        blocked++;
      }

      console.log('');
    }

    // Send HR digest
    await sendHRDigest(expiringSoon, expired);

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('[CRED MONITOR] Check Complete');
    console.log('='.repeat(60));
    console.log(`Total Credentials Checked: ${mockCredentials.length}`);
    console.log(`Expiring Soon (0-30 days): ${expiringSoon.length}`);
    console.log(`Expired: ${expired.length}`);
    console.log(`Alerts Sent: ${alertsSent}`);
    console.log(`Caregivers Blocked: ${blocked}`);
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(60));
    console.error('[CRED MONITOR] FATAL ERROR');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Get next alert milestone in days
 */
function getNextAlertDays(daysLeft: number): number {
  if (daysLeft > 30) return 30;
  if (daysLeft > 15) return 15;
  if (daysLeft > 7) return 7;
  return 0;
}

/**
 * Main entry point
 */
async function main() {
  try {
    await checkExpiringCredentials();
    console.log('[CRED MONITOR] Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[CRED MONITOR] Job failed with error');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { checkExpiringCredentials };
