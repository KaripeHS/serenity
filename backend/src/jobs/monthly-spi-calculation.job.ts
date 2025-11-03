/**
 * Monthly SPI Calculation Batch Job
 *
 * Runs on the 1st of each month at 2:00 AM to calculate SPI scores
 * for all active caregivers.
 *
 * Cron Schedule: 0 2 1 * * (At 02:00 on day-of-month 1)
 *
 * Usage:
 * - Production: Schedule via cron or task scheduler
 * - Development: Run manually with `npx ts-node src/jobs/monthly-spi-calculation.job.ts`
 *
 * @module jobs/monthly-spi-calculation
 */

import { spiService } from '../modules/hr/spi.service';
// import { DatabaseClient } from '../database/client';
// import { emailService } from '../services/notifications/email.service';

/**
 * Get previous month in YYYY-MM format
 */
function getPreviousMonth(): string {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prevMonth.toISOString().substring(0, 7);
}

/**
 * Calculate SPI for all active caregivers
 */
async function calculateAllSPI(): Promise<void> {
  const startTime = Date.now();
  const targetMonth = getPreviousMonth(); // Calculate for previous month

  console.log('='.repeat(60));
  console.log(`[SPI JOB] Starting monthly SPI calculation`);
  console.log(`[SPI JOB] Target month: ${targetMonth}`);
  console.log(`[SPI JOB] Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // TODO: Query database for active caregivers
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT id, first_name, last_name, email
    //   FROM caregivers
    //   WHERE status = 'active'
    //   ORDER BY id
    // `);
    //
    // const caregivers = result.rows;

    // Mock caregivers for development
    const mockCaregivers = [
      { id: 'cg-001', first_name: 'Mary', last_name: 'Smith', email: 'mary@example.com' },
      { id: 'cg-002', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      { id: 'cg-003', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com' },
      { id: 'cg-004', first_name: 'Emily', last_name: 'Rodriguez', email: 'emily@example.com' },
      { id: 'cg-005', first_name: 'James', last_name: 'Thompson', email: 'james@example.com' }
    ];

    console.log(`[SPI JOB] Found ${mockCaregivers.length} active caregivers`);
    console.log('');

    let successCount = 0;
    let failureCount = 0;
    const results: any[] = [];

    // Process each caregiver
    for (const caregiver of mockCaregivers) {
      try {
        console.log(`[SPI JOB] Calculating SPI for ${caregiver.first_name} ${caregiver.last_name} (${caregiver.id})...`);

        // Calculate SPI
        const spiResult = await spiService.calculateMonthlySPI(caregiver.id, targetMonth);

        // Save snapshot to database
        await spiService.saveSPISnapshot(spiResult);

        console.log(`  ✓ Score: ${spiResult.overallScore} | Tier: ${spiResult.tier} | Earned OT: ${spiResult.earnedOTEligible ? 'Yes' : 'No'}`);
        console.log(`    Components: Att=${spiResult.components.attendance}, Qual=${spiResult.components.quality}, Doc=${spiResult.components.documentation}, Collab=${spiResult.components.collaboration}, Learn=${spiResult.components.learning}`);

        results.push({
          caregiverId: caregiver.id,
          name: `${caregiver.first_name} ${caregiver.last_name}`,
          score: spiResult.overallScore,
          tier: spiResult.tier,
          earnedOT: spiResult.earnedOTEligible,
          success: true
        });

        successCount++;

        // TODO: Send SPI report email to caregiver
        // await emailService.sendSPIReport({
        //   to: caregiver.email,
        //   name: `${caregiver.first_name} ${caregiver.last_name}`,
        //   month: targetMonth,
        //   spi: spiResult
        // });

      } catch (error: any) {
        console.error(`  ✗ Failed: ${error.message}`);
        results.push({
          caregiverId: caregiver.id,
          name: `${caregiver.first_name} ${caregiver.last_name}`,
          success: false,
          error: error.message
        });
        failureCount++;
      }

      console.log('');
    }

    // Calculate summary stats
    const tierCounts = results.reduce((acc, r) => {
      if (r.success) {
        acc[r.tier] = (acc[r.tier] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const earnedOTCount = results.filter(r => r.success && r.earnedOT).length;
    const avgScore = results.filter(r => r.success).reduce((sum, r) => sum + r.score, 0) / successCount;

    // Print summary
    console.log('='.repeat(60));
    console.log(`[SPI JOB] Calculation Complete`);
    console.log('='.repeat(60));
    console.log(`Total Caregivers: ${mockCaregivers.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Average Score: ${Math.round(avgScore)}`);
    console.log(`Earned OT Eligible: ${earnedOTCount} (${Math.round((earnedOTCount / successCount) * 100)}%)`);
    console.log('');
    console.log('Tier Distribution:');
    console.log(`  Exceptional (95-100): ${tierCounts['exceptional'] || 0}`);
    console.log(`  Good (80-94): ${tierCounts['good'] || 0}`);
    console.log(`  Needs Improvement (60-79): ${tierCounts['needs_improvement'] || 0}`);
    console.log(`  Probation (<60): ${tierCounts['probation'] || 0}`);
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // TODO: Send summary email to HR/Management
    // await emailService.sendSPISummary({
    //   to: 'hr@serenitycarepartners.com',
    //   month: targetMonth,
    //   totalCaregivers: mockCaregivers.length,
    //   successCount,
    //   failureCount,
    //   avgScore: Math.round(avgScore),
    //   earnedOTCount,
    //   tierCounts
    // });

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(60));
    console.error(`[SPI JOB] FATAL ERROR`);
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
    await calculateAllSPI();
    console.log('[SPI JOB] Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[SPI JOB] Job failed with error');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { calculateAllSPI };
