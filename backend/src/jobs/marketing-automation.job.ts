/**
 * Marketing Automation Job
 * Processes the scheduled_emails queue and sends due emails.
 * 
 * Schedule: Hourly
 */

import { CronJob } from 'cron';
import { getDbClient, DatabaseClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { EmailService } from '../services/notifications/email.service';
import { MarketingService } from '../modules/marketing/marketing.service';

const logger = createLogger('marketing-automation-job');

export class MarketingAutomationJob {
    private db: DatabaseClient;
    private emailService: EmailService;
    private marketingService: MarketingService;

    constructor() {
        this.db = getDbClient();
        this.emailService = new EmailService();
        this.marketingService = new MarketingService();
    }

    /**
     * Start the cron job
     */
    start() {
        // Run hourly at minute 0
        new CronJob('0 * * * *', async () => {
            await this.run();
        }, null, true, 'America/New_York');

        logger.info('Marketing Automation Job scheduled for hourly execution');
    }

    /**
     * Process due emails
     */
    async run() {
        logger.info('Starting marketing automation check...');

        try {
            // 1. Find due emails
            const result = await this.db.query(`
        SELECT * FROM scheduled_emails 
        WHERE status = 'pending' 
        AND scheduled_for <= NOW()
        LIMIT 50
      `);

            const emails = result.rows;
            if (emails.length === 0) {
                logger.info('No due emails found.');
                return;
            }

            logger.info(`Found ${emails.length} emails to send`);

            // 2. Send each email
            for (const email of emails) {
                try {
                    // Send via MarketingService (reusing the template logic)
                    // We need to expose sendDripEmail or duplicate the logic. 
                    // For now, let's use a public method on MarketingService if available, or just use EmailService directly here.
                    // Ideally, MarketingService should handle the "send" logic to keep templates encapsulated.

                    // Let's assume we expose a method 'processScheduledEmail' on MarketingService
                    await this.marketingService.processScheduledEmail(email);

                } catch (err) {
                    logger.error(`Failed to process email ${email.id}`, { error: err });
                }
            }

        } catch (error) {
            logger.error('Critical error in Marketing Automation Job', { error });
        }
    }
}

export const marketingAutomationJob = new MarketingAutomationJob();
