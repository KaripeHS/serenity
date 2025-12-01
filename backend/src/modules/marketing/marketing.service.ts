import { DatabaseClient } from '../../database/client';
import { EmailService } from '../../services/notifications/email.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('marketing-service');

interface DripStep {
    dayOffset: number;
    subject: string;
    templateName: string;
}

const DRIP_SEQUENCE: DripStep[] = [
    {
        dayOffset: 0, // Immediate
        subject: 'Welcome to Serenity Care Partners - Your Guide to Private Care',
        templateName: 'drip_welcome'
    },
    {
        dayOffset: 2,
        subject: '5 Questions You Should Ask Every Caregiver',
        templateName: 'drip_education_1'
    },
    {
        dayOffset: 5,
        subject: 'Understanding the Cost of Home Care vs. Assisted Living',
        templateName: 'drip_education_2'
    },
    {
        dayOffset: 10,
        subject: 'Meet Our Elite Care Team',
        templateName: 'drip_social_proof'
    },
    {
        dayOffset: 14,
        subject: 'Ready to Schedule Your Consultation?',
        templateName: 'drip_call_to_action'
    }
];

export class MarketingService {
    private db: DatabaseClient;
    private emailService: EmailService;

    constructor() {
        this.db = new DatabaseClient();
        this.emailService = new EmailService();
    }

    /**
     * Start a drip campaign for a new lead
     */
    async startDripCampaign(leadId: string, email: string, firstName: string): Promise<void> {
        logger.info(`Starting drip campaign for lead ${leadId}`);

        // Schedule all emails in the sequence
        // In a real system, we would use a job queue (BullMQ/Redis) or a scheduled cron job
        // checking a 'marketing_emails' table.
        // For this MVP, we will simulate scheduling by creating records in a 'scheduled_emails' table
        // (which we would need to create) OR just send the first one immediately.

        // Let's send the first one immediately
        const firstStep = DRIP_SEQUENCE[0];
        if (firstStep) {
            await this.sendDripEmail(email, firstName, firstStep);
        }

        // For the rest, we would insert into a queue. 
        // Since we don't have a queue system set up for this specific purpose yet,
        // we will just log the intent to schedule.
        logger.info(`Scheduled ${DRIP_SEQUENCE.length - 1} follow-up emails for ${email}`);
    }


    /**
     * Check for clients hitting milestones (e.g., 30 days) and send referral ask
     * This should be called by a daily cron job
     */
    async checkMilestones(): Promise<void> {
        logger.info('Checking for client milestones...');

        // Mock query to find clients active for exactly 30 days
        // In reality: SELECT * FROM clients WHERE start_of_care = NOW() - INTERVAL '30 days'
        const mockClientsHit30Days = [
            { id: 'client-123', firstName: 'Robert', email: 'robert@example.com' }
        ];

        for (const client of mockClientsHit30Days) {
            await this.sendDripEmail(client.email, client.firstName, {
                dayOffset: 30,
                subject: 'Happy 1st Month with Serenity!',
                templateName: 'milestone_30_days'
            });
        }
    }

    private async sendDripEmail(to: string, name: string, step: DripStep): Promise<void> {
        try {
            // In a real app, we would load the HTML template
            const htmlContent = this.getTemplateContent(step.templateName, name);

            await this.emailService.sendEmail({
                to,
                subject: step.subject,
                html: htmlContent,
                text: htmlContent.replace(/<[^>]*>/g, '') // Simple HTML to Text conversion
            });

            logger.info(`Sent drip email '${step.templateName}' to ${to}`);
        } catch (error) {
            logger.error(`Failed to send drip email to ${to}`, { error });
        }
    }

    private getTemplateContent(templateName: string, name: string): string {
        // Mock template engine
        const templates: Record<string, string> = {
            drip_welcome: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for inquiring about Serenity Care Partners. We understand that finding the right care for your loved one is a significant decision.</p>
        <p>Over the next few weeks, we'll share some resources to help you navigate this journey.</p>
      `,
            drip_education_1: `
        <h1>Hi ${name},</h1>
        <p>Here are 5 critical questions you should ask when interviewing a caregiver...</p>
      `,
            milestone_30_days: `
        <h1>Happy 1st Month, ${name}!</h1>
        <p>It's been 30 days since we started caring for your family. We hope we've brought you peace of mind.</p>
        <p><strong>Has our care made a difference?</strong></p>
        <p>The greatest compliment you can give us is a referral. If you know a friend who needs support, please let us know via the <a href="http://localhost:3000/family-portal">Family Portal</a>.</p>
        <p>As a thank you, we offer <strong>4 hours of complimentary respite care</strong> for every successful referral.</p>
      `
            // ... other templates
        };

        return templates[templateName] || `<p>Hi ${name}, checking in from Serenity Care Partners.</p>`;
    }
}
