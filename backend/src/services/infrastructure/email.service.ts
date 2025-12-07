
import nodemailer from 'nodemailer';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Use environment variables for production
        // Fallback to a mock/dry-run mode if credentials aren't set
        if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            console.warn('[EmailService] SMTP credentials missing. Emails will be logged only.');
            // Mock transporter that just logs
            this.transporter = {
                sendMail: async (opts: any) => {
                    console.log(`[MOCK EMAIL] To: ${opts.to}, Subject: ${opts.subject}`);
                    return { messageId: 'mock-id' };
                }
            } as any;
        }
    }

    async sendEmail(to: string | string[], subject: string, html: string) {
        try {
            const recipient = Array.isArray(to) ? to.join(',') : to;

            const info = await this.transporter.sendMail({
                from: '"Serenity System" <system@serenitycarepartners.com>',
                to: recipient,
                subject: subject,
                html: html,
            });

            console.log(`[EmailService] Sent "${subject}" to ${recipient}. ID: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('[EmailService] Failed to send email:', error);
            // Don't throw, just log. We don't want to crash the scheduler.
            return null;
        }
    }
}

export const emailService = new EmailService();
