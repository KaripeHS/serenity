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
    /**
     * Start a drip campaign for a new lead
     */
    async startDripCampaign(leadId: string, email: string, firstName: string): Promise<void> {
        logger.info(`Starting drip campaign for lead ${leadId}`);

        const now = new Date();

        // Schedule all emails in the sequence
        for (const step of DRIP_SEQUENCE) {
            const scheduledFor = new Date(now);
            scheduledFor.setDate(scheduledFor.getDate() + step.dayOffset);

            // If offset is 0, set to 5 minutes from now to allow immediate processing by job
            if (step.dayOffset === 0) {
                scheduledFor.setMinutes(scheduledFor.getMinutes() + 5);
            } else {
                // Send at 10:00 AM on the target day
                scheduledFor.setHours(10, 0, 0, 0);
            }

            await this.db.query(`
                INSERT INTO scheduled_emails (
                    recipient_email, recipient_name, subject, template_name, scheduled_for, lead_id, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            `, [email, firstName, step.subject, step.templateName, scheduledFor, leadId]);
        }

        logger.info(`Scheduled ${DRIP_SEQUENCE.length} emails for ${email}`);
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

    /**
     * Process a single scheduled email (called by the job)
     */
    async processScheduledEmail(emailRecord: any): Promise<void> {
        try {
            const htmlContent = this.getTemplateContent(emailRecord.template_name, emailRecord.recipient_name);

            await this.emailService.sendEmail({
                to: emailRecord.recipient_email,
                subject: emailRecord.subject,
                html: htmlContent,
                text: htmlContent.replace(/<[^>]*>/g, '')
            });

            // Update status to sent
            await this.db.query(`
                UPDATE scheduled_emails 
                SET status = 'sent', sent_at = NOW() 
                WHERE id = $1
            `, [emailRecord.id]);

            logger.info(`Sent scheduled email ${emailRecord.id} to ${emailRecord.recipient_email}`);

        } catch (error: any) {
            logger.error(`Failed to send scheduled email ${emailRecord.id}`, { error });

            // Update status to failed
            await this.db.query(`
                UPDATE scheduled_emails 
                SET status = 'failed', error_message = $2 
                WHERE id = $1
            `, [emailRecord.id, error.message || 'Unknown error']);
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
            drip_education_2: `
        <h1>Hi ${name},</h1>
        <p>Understanding the cost of home care vs. assisted living is crucial...</p>
      `,
            drip_social_proof: `
        <h1>Meet Our Elite Care Team</h1>
        <p>At Serenity, we hire only the top 1% of caregivers...</p>
      `,
            drip_call_to_action: `
        <h1>Ready to Schedule Your Consultation?</h1>
        <p>We are ready to help. Click here to book a time with our Care Manager.</p>
      `,
            milestone_30_days: `
        <h1>Happy 1st Month, ${name}!</h1>
        <p>It's been 30 days since we started caring for your family. We hope we've brought you peace of mind.</p>
        <p><strong>Has our care made a difference?</strong></p>
        <p>The greatest compliment you can give us is a referral. If you know a friend who needs support, please let us know via the <a href="http://localhost:3000/family-portal">Family Portal</a>.</p>
        <p>As a thank you, we offer <strong>4 hours of complimentary respite care</strong> for every successful referral.</p>
      `
        };

        return templates[templateName] || `<p>Hi ${name}, checking in from Serenity Care Partners.</p>`;
    }
}
