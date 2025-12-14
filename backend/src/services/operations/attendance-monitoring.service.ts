
import { getDbClient } from '../../database/client';
import { emailService } from '../infrastructure/email.service';
import { addMinutes, isBefore, isAfter, subMinutes } from 'date-fns';


import { createLogger } from '../../utils/logger';

const logger = createLogger('attendance-monitoring');
export class AttendanceMonitoringService {

    /**
     * Run every 5 minutes
     * Checks for shifts starting in 15-30 minutes that aren't confirmed
     */
    async checkUpcomingShifts() {
        const db = getDbClient();
        logger.info('[AttendanceMonitor] Checking upcoming shifts...');

        // Window: Shifts starting in 15-30 mins from now
        const now = new Date();
        const startWindow = addMinutes(now, 15);
        const endWindow = addMinutes(now, 35);

        const shifts = await db.query(`
            SELECT s.id, s.scheduled_start_time, s.caregiver_id, 
                   u.email, u.phone_number, u.first_name,
                   c.first_name as client_name
            FROM shifts s
            JOIN users u ON s.caregiver_id = u.id
            JOIN clients c ON s.client_id = c.id
            WHERE s.scheduled_start_time BETWEEN $1 AND $2
            AND s.commuter_status = 'pending'
            AND s.status = 'scheduled'
        `, [startWindow, endWindow]);

        for (const shift of shifts.rows) {
            await this.sendWakeUpNotification(shift);
        }

        logger.info(`[AttendanceMonitor] Processed ${shifts.rows.length} upcoming shifts.`);
    }

    private async sendWakeUpNotification(shift: any) {
        // In real SMS world: sendSMS(shift.phone_number, "Link")
        // For now using EmailService as 'Notification' layer

        const checkInUrl = `${process.env.APP_URL || 'http://localhost:3000'}/staff/commute/${shift.id}`;

        await emailService.sendEmail(
            shift.email,
            `ACTION REQUIRED: Confirm text for ${shift.client_name}`,
            `
            <h3>Hi ${shift.first_name},</h3>
            <p>You have a visit with <strong>${shift.client_name}</strong> starting soon.</p>
            <p>Please click below to confirm you are on your way and enable GPS verification:</p>
            <br/>
            <a href="${checkInUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                I Am On My Way
            </a>
            <br/><br/>
            <p>Driving safely required.</p>
            `
        );

        logger.info(`[AttendanceMonitor] Wake-Up sent to ${shift.email} for Shift ${shift.id}`);
    }

    /**
     * API calls this when user clicks the button
     */
    async logCommuteStart(shiftId: string, lat: number, lon: number) {
        const db = getDbClient();

        // 1. Update Shift
        await db.query(`UPDATE shifts SET commuter_status = 'en_route' WHERE id = $1`, [shiftId]);

        // 2. Log GPS
        await db.query(`
            INSERT INTO shift_tracking_logs (shift_id, organization_id, status, latitude, longitude)
            SELECT $1, organization_id, 'en_route', $2, $3
            FROM shifts WHERE id = $1
        `, [shiftId, lat, lon]);

        return { success: true };
    }
}

export const attendanceMonitor = new AttendanceMonitoringService();
