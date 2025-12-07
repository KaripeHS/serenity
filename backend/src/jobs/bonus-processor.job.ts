/**
 * Bonus Processor Job
 * Runs daily to identify and process eligible bonuses according to policy.
 * 
 * Schedule: Daily at 02:00 AM
 */

import { CronJob } from 'cron';
import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { BonusService } from '../modules/hr/bonus.service';
import { FinancialSafeguardService } from '../modules/finance/safeguard.service';
import { EmailService } from '../services/notifications/email.service';

const logger = createLogger('bonus-processor-job');

export class BonusProcessorJob {
    private db: DatabaseClient;
    private bonusService: BonusService;

    constructor() {
        this.db = getDbClient();
        const emailService = new EmailService();
        const safeguardService = new FinancialSafeguardService(this.db, emailService);
        this.bonusService = new BonusService(this.db, safeguardService);
    }

    /**
     * Start the cron job
     */
    start() {
        // Run daily at 2:00 AM
        new CronJob('0 2 * * *', async () => {
            await this.run();
        }, null, true, 'America/New_York');

        logger.info('Bonus Processor Job scheduled for daily execution at 02:00 AM EST');
    }

    /**
     * Run the bonus processing logic
     */
    async run() {
        logger.info('Starting daily bonus processing...');

        try {
            // 1. Get all active caregivers
            const result = await this.db.query(`
        SELECT id, organization_id 
        FROM users 
        WHERE role = 'caregiver' AND status = 'active'
      `);

            const caregivers = result.rows;
            logger.info(`Processing bonuses for ${caregivers.length} active caregivers`);

            // 2. Process each caregiver
            let processedCount = 0;
            for (const caregiver of caregivers) {
                try {
                    await this.bonusService.processAllBonuses(caregiver.id, caregiver.organization_id);
                    processedCount++;
                } catch (err) {
                    logger.error(`Failed to process bonuses for caregiver ${caregiver.id}`, { error: err });
                }
            }

            logger.info(`Bonus processing completed. Processed ${processedCount}/${caregivers.length} caregivers.`);

        } catch (error) {
            logger.error('Critical error in Bonus Processor Job', { error });
        }
    }
}

// Export singleton for easy startup
export const bonusProcessorJob = new BonusProcessorJob();
