/**
 * Sandata Auto-Submission Job
 *
 * Runs every 15 minutes to automatically submit validated EVV records to Sandata.
 * This ensures real-time compliance and prevents submission backlogs.
 *
 * Cron Schedule: *\/15 * * * * (Every 15 minutes)
 *
 * Workflow:
 * 1. Query for pending EVV records (clock_out complete, not yet submitted)
 * 2. Validate each record (6 federal elements, geofence, authorization)
 * 3. Submit valid records to Sandata
 * 4. Update status (accepted/rejected)
 * 5. Send alerts for rejected visits
 *
 * Usage:
 * - Production: Schedule via cron or task scheduler
 * - Development: Run manually with `npx ts-node src/jobs/sandata-auto-submit.job.ts`
 *
 * @module jobs/sandata-auto-submit
 */

import { getSandataVisitsService } from '../services/sandata/visits.service';
import { getSandataRepository } from '../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../database/client';
// import { emailService } from '../services/notifications/email.service';
// import { smsService } from '../services/notifications/sms.service';

interface PendingVisit {
  id: string;
  shiftId: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  serviceDate: Date;
  clockInTime: Date;
  clockOutTime: Date;
  serviceCode: string;
  billableUnits: number;
}

/**
 * Auto-submit pending EVV records to Sandata
 */
async function autoSubmitPendingVisits(): Promise<void> {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('[SANDATA AUTO-SUBMIT] Starting auto-submission job');
  console.log(`[SANDATA AUTO-SUBMIT] Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    const visitsService = getSandataVisitsService();
    const repository = getSandataRepository(getDbClient());

    // TODO: Get organization ID from environment or database
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '00000000-0000-0000-0000-000000000001';

    // Query pending EVV records
    // TODO: Replace with actual database query
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     e.id,
    //     e.shift_id,
    //     e.caregiver_id,
    //     e.client_id,
    //     e.service_code,
    //     e.service_date,
    //     e.clock_in_time,
    //     e.clock_out_time,
    //     e.billable_units,
    //     cg.first_name || ' ' || cg.last_name as caregiver_name,
    //     c.first_name || ' ' || c.last_name as client_name
    //   FROM evv_records e
    //   JOIN caregivers cg ON cg.id = e.caregiver_id
    //   JOIN clients c ON c.id = e.client_id
    //   WHERE e.clock_out_time IS NOT NULL
    //     AND e.sandata_status IN ('not_submitted', 'pending')
    //     AND e.validation_status = 'valid'
    //     AND e.organization_id = $1
    //   ORDER BY e.service_date ASC, e.clock_in_time ASC
    //   LIMIT 100
    // `, [organizationId]);

    // Mock pending visits for development
    const mockPendingVisits: PendingVisit[] = [
      {
        id: 'evv-001',
        shiftId: 'shift-101',
        caregiverId: 'cg-001',
        caregiverName: 'Mary Smith',
        clientId: 'client-001',
        clientName: 'Margaret Johnson',
        serviceDate: new Date(),
        clockInTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        clockOutTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        serviceCode: 'T1019',
        billableUnits: 8
      },
      {
        id: 'evv-002',
        shiftId: 'shift-102',
        caregiverId: 'cg-002',
        caregiverName: 'John Doe',
        clientId: 'client-002',
        clientName: 'Robert Williams',
        serviceDate: new Date(),
        clockInTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        clockOutTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        serviceCode: 'S5125',
        billableUnits: 8
      }
    ];

    const pendingVisits = mockPendingVisits; // Replace with: result.rows

    if (pendingVisits.length === 0) {
      console.log('[SANDATA AUTO-SUBMIT] No pending visits to submit');
      console.log('='.repeat(60));
      return;
    }

    console.log(`[SANDATA AUTO-SUBMIT] Found ${pendingVisits.length} pending visits`);
    console.log('');

    let submitted = 0;
    let rejected = 0;
    let errors = 0;

    // Process each pending visit
    for (const visit of pendingVisits) {
      try {
        console.log(`[SANDATA AUTO-SUBMIT] Processing visit ${visit.id}`);
        console.log(`  Caregiver: ${visit.caregiverName}`);
        console.log(`  Client: ${visit.clientName}`);
        console.log(`  Service: ${visit.serviceCode} (${visit.billableUnits} units)`);
        console.log(`  Date: ${visit.serviceDate.toISOString().split('T')[0]}`);

        // TODO: Get full EVV record from database
        // const evvRecord = await repository.getEVVRecord(visit.id);
        // const client = await repository.getClient(visit.clientId);
        // const caregiver = await repository.getUser(visit.caregiverId);

        // Mock EVV record for development
        const evvRecord = {
          id: visit.id,
          shiftId: visit.shiftId,
          clientId: visit.clientId,
          caregiverId: visit.caregiverId,
          serviceCode: visit.serviceCode,
          serviceDate: visit.serviceDate,
          clockInTime: visit.clockInTime,
          clockOutTime: visit.clockOutTime,
          clockInLatitude: 39.7589,
          clockInLongitude: -84.1916,
          clockOutLatitude: 39.7590,
          clockOutLongitude: -84.1915,
          billableUnits: visit.billableUnits,
          authorizationNumber: 'AUTH-12345',
          visitKey: null,
          sandataVisitId: null,
          sandataStatus: 'not_submitted',
          sandataSubmittedAt: null,
          sandataRejectedReason: null,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const client: any = {
          id: visit.clientId,
          sandata_client_id: 'SND-CLIENT-001',
          address_line_1: '123 Main St',
          city: 'Dayton',
          state: 'OH',
          zip_code: '45402',
          evv_consent_status: 'active',
          first_name: 'Margaret',
          last_name: 'Johnson',
          status: 'active',
          date_of_birth: '1950-01-01'
        };

        const caregiver = {
          id: visit.caregiverId,
          sandataEmployeeId: 'SND-EMP-001'
        };

        // Submit to Sandata
        const result = await visitsService.submitVisit(
          evvRecord,
          client,
          caregiver,
          { skipValidation: false, dryRun: false }
        );

        if (result.success && result.action === 'submitted') {
          console.log(`  ✓ Submitted successfully (Visit ID: ${result.sandataVisitId})`);
          submitted++;
        } else if (result.action === 'rejected') {
          console.log(`  ✗ Rejected by Sandata:`);
          result.validationErrors?.forEach(err => console.log(`    - ${err}`));
          result.sandataErrors?.forEach(err => console.log(`    - ${err}`));
          rejected++;

          // TODO: Send alert to Pod Lead
          // const podLead = await getPodLeadForClient(visit.clientId);
          // await smsService.send({
          //   to: podLead.phone,
          //   message: `EVV visit for ${visit.clientName} rejected by Sandata. Please review in Console.`
          // });
        } else {
          console.log(`  ⏭️  Skipped (already submitted or invalid)`);
        }

      } catch (error: any) {
        console.error(`  ✗ Error: ${error.message}`);
        errors++;
      }

      console.log('');
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('[SANDATA AUTO-SUBMIT] Submission Complete');
    console.log('='.repeat(60));
    console.log(`Total Pending: ${pendingVisits.length}`);
    console.log(`Submitted: ${submitted}`);
    console.log(`Rejected: ${rejected}`);
    console.log(`Errors: ${errors}`);
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // Send daily summary email if any rejections
    if (rejected > 0) {
      // TODO: Send summary email to operations team
      // await emailService.sendSandataRejectionSummary({
      //   to: 'operations@serenitycarepartners.com',
      //   date: new Date().toISOString().split('T')[0],
      //   totalSubmitted: submitted,
      //   totalRejected: rejected,
      //   rejectedVisits: pendingVisits.filter((v, i) => i < rejected) // Get actual rejected visits
      // });
    }

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(60));
    console.error('[SANDATA AUTO-SUBMIT] FATAL ERROR');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Get submission backlog age (oldest unsubmitted visit)
 */
async function getBacklogAge(): Promise<number> {
  // TODO: Query database for oldest pending visit
  // const db = DatabaseClient.getInstance();
  // const result = await db.query(`
  //   SELECT MIN(service_date) as oldest_date
  //   FROM evv_records
  //   WHERE sandata_status = 'not_submitted'
  //     AND clock_out_time IS NOT NULL
  // `);
  //
  // if (result.rows[0]?.oldest_date) {
  //   const age = Date.now() - new Date(result.rows[0].oldest_date).getTime();
  //   return Math.floor(age / (1000 * 60 * 60)); // hours
  // }

  return 0; // No backlog
}

/**
 * Check if backlog exceeds acceptable threshold
 */
async function checkBacklogAlert(): Promise<void> {
  const backlogHours = await getBacklogAge();
  const threshold = 24; // Alert if backlog > 24 hours

  if (backlogHours > threshold) {
    console.warn(`⚠️  BACKLOG ALERT: Oldest unsubmitted visit is ${backlogHours} hours old (threshold: ${threshold}h)`);

    // TODO: Send escalation alert
    // await emailService.sendBacklogAlert({
    //   to: 'operations@serenitycarepartners.com',
    //   cc: 'gloria@serenitycarepartners.com',
    //   backlogHours,
    //   threshold
    // });
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    await autoSubmitPendingVisits();
    await checkBacklogAlert();
    console.log('[SANDATA AUTO-SUBMIT] Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[SANDATA AUTO-SUBMIT] Job failed with error');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { autoSubmitPendingVisits, getBacklogAge, checkBacklogAlert };
