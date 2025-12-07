
import * as cron from 'node-cron';
import { readinessService } from '../executive/readiness.service';
import { settingsService } from '../admin/settings.service';
import { emailService } from './email.service';

class SchedulerService {
    private tasks: cron.ScheduledTask[] = [];
    private defaultOrgId = "550e8400-e29b-41d4-a716-446655440000";

    init() {
        console.log('--- Initializing Executive Scheduler ---');
        this.schedule('0 7 * * *', () => this.sendReadinessBrief('Morning'));
        this.schedule('0 15 * * *', () => this.sendReadinessBrief('Afternoon'));
        console.log(`Scheduled ${this.tasks.length} jobs.`);
    }

    private schedule(cronExpression: string, callback: () => void) {
        const task = cron.schedule(cronExpression, callback, {
            timezone: "America/New_York"
        });
        this.tasks.push(task);
    }

    async sendReadinessBrief(period: 'Morning' | 'Afternoon') {
        console.log(`[Scheduler] Generating ${period} Brief...`);
        try {
            const brief = await readinessService.generateBrief(this.defaultOrgId);

            // Dynamic Recipients from DB
            const settings = await settingsService.getSettings(this.defaultOrgId, 'communications');
            const recipients = [
                settings.ceo_email || 'ceo@serenitycarepartners.com',
                settings.cfo_email || 'cfo@serenitycarepartners.com',
                settings.coo_email || 'coo@serenitycarepartners.com'
            ];

            // Group items by severity
            const redItems = brief.items.filter(i => i.severity === 'critical');
            const yellowItems = brief.items.filter(i => i.severity === 'warning');
            const greenItems = brief.items.filter(i => i.severity === 'good');

            const body = `
                <div style="font-family: sans-serif; color: #333;">
                    <h1>Daily Readiness Brief (${brief.period})</h1>
                    <p><strong>${brief.summary}</strong></p>
                    <hr/>
                    
                    ${redItems.length > 0 ? `
                    <div style="background-color: #fee; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="color: #c00; margin-top: 0;">🚨 IMMEDIATE (Action Required)</h3>
                        ${redItems.map(item => `<div><strong>[${item.category}]</strong> ${item.message} ${item.value ? `(${item.value})` : ''}</div>`).join('')}
                    </div>` : ''}

                    ${yellowItems.length > 0 ? `
                    <div style="background-color: #fff8e1; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="color: #f57f17; margin-top: 0;">⚠️ IMPORTANT (Monitor)</h3>
                        ${yellowItems.map(item => `<div><strong>[${item.category}]</strong> ${item.message} ${item.value ? `(${item.value})` : ''}</div>`).join('')}
                    </div>` : ''}

                    <div style="background-color: #e8f5e9; padding: 10px; border-radius: 5px;">
                        <h3 style="color: #2e7d32; margin-top: 0;">✅ HEALTH (Pulse)</h3>
                        ${greenItems.length > 0 ? greenItems.map(item => `<div><strong>[${item.category}]</strong> ${item.message} ${item.value ? `(${item.value})` : ''}</div>`).join('') : '<div>System Nominal</div>'}
                    </div>
                </div>
            `;

            // Send via Email Service (Nodemailer)
            await emailService.sendEmail(recipients, `Daily Readiness Brief (${brief.period}) - ${brief.summary}`, body);

            // Redundancy Log
            console.log(`\n📨 Brief Sent to: ${recipients.join(', ')}`);

        } catch (err) {
            console.error('[Scheduler] Failed to send brief:', err);
        }
    }
}

export const schedulerService = new SchedulerService();
