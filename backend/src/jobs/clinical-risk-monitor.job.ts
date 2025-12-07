import { CronJob } from 'cron';
import { DatabaseClient } from '../database/client';
import { EmailService } from '../services/notifications/email.service';
import { ClinicalNLPService } from '../modules/clinical/nlp.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('clinical-risk-monitor');

export class ClinicalRiskMonitor {
    private db: DatabaseClient;
    private emailService: EmailService;
    private nlpService: ClinicalNLPService;

    constructor() {
        this.db = new DatabaseClient();
        this.emailService = new EmailService();
        this.nlpService = new ClinicalNLPService();
    }

    /**
     * Start the cron job
     */
    start() {
        // Run daily at 6:00 AM
        new CronJob('0 6 * * *', async () => {
            await this.run();
        }, null, true, 'America/New_York');

        logger.info('Clinical Risk Monitor scheduled for daily execution at 6:00 AM');
    }

    /**
     * Run the clinical risk scan
     * Schedule: Daily at 6:00 AM
     */
    async run(): Promise<void> {
        logger.info('Starting Clinical Risk Monitor scan...');

        try {
            // 1. Fetch recent care notes (Last 24 hours)
            const result = await this.db.query(`
                SELECT * FROM care_notes 
                WHERE created_at > NOW() - INTERVAL '24 hours'
                AND risk_score IS NULL -- Only analyze new notes
            `);

            const recentNotes = result.rows;
            logger.info(`Found ${recentNotes.length} new notes to analyze.`);

            for (const note of recentNotes) {
                // 2. Analyze note with AI
                const analysis = await this.nlpService.analyzeNote(note.content);

                // 3. Save Analysis Results
                await this.db.query(`
                    UPDATE care_notes 
                    SET sentiment_score = $1, risk_score = $2, flags = $3
                    WHERE id = $4
                `, [
                    analysis.sentiment === 'positive' ? 1 : analysis.sentiment === 'negative' ? -1 : 0, // Simple mapping
                    analysis.riskScore,
                    analysis.flags,
                    note.id
                ]);

                // 4. Alert if High Risk
                if (analysis.riskScore > 50) {
                    await this.sendRiskAlert(note.patient_id, analysis, note.content);
                }
            }

            logger.info('Clinical Risk Monitor scan completed.');

        } catch (error) {
            logger.error('Error running Clinical Risk Monitor:', error);
        }
    }

    private async sendRiskAlert(patientId: string, analysis: any, noteContent: string): Promise<void> {
        logger.warn(`HIGH RISK DETECTED for Patient ${patientId}. Score: ${analysis.riskScore}`);

        await this.emailService.sendEmail({
            to: 'care-manager@serenity.com',
            subject: `URGENT: Clinical Risk Alert for Patient ${patientId}`,
            html: `
                <h1>Clinical Risk Detected</h1>
                <p><strong>Patient ID:</strong> ${patientId}</p>
                <p><strong>Risk Score:</strong> ${analysis.riskScore}/100</p>
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>Note Content:</strong><br/>
                    "${noteContent}"
                </div>
                <p><strong>Flags Detected:</strong></p>
                <ul>
                    ${analysis.flags.map((flag: string) => `<li>${flag}</li>`).join('')}
                </ul>
                <p>Please review the latest care notes immediately.</p>
            `,
            text: `URGENT: Risk detected for Patient ${patientId}. Score: ${analysis.riskScore}. Note: "${noteContent}"`
        });
    }
}

// Example usage (would be scheduled in index.ts)
// const job = new ClinicalRiskMonitor();
// job.run();
