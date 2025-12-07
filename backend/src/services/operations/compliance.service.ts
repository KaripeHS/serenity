
import { getDbClient } from '../../database/client';

export class ComplianceService {

    /**
     * Get Flagged Shifts for Review
     */
    async getAuditQueue(organizationId: string) {
        const db = getDbClient();
        return db.query(`
            SELECT 
                s.id, s.scheduled_start_time, s.scheduled_end_time, s.status, s.commuter_status,
                u.first_name as cg_first, u.last_name as cg_last,
                c.first_name as cl_first, c.last_name as cl_last
            FROM shifts s
            JOIN users u ON s.caregiver_id = u.id
            JOIN clients c ON s.client_id = c.id
            WHERE s.organization_id = $1
            AND s.status = 'completed'
            AND s.verification_status IN ('flagged', 'pending')
            ORDER BY s.scheduled_start_time DESC
        `, [organizationId]);
    }

    /**
     * Force Verify (Override)
     */
    async manualVerify(shiftId: string, userId: string, note: string) {
        const db = getDbClient();
        return db.query(`
            UPDATE shifts 
            SET verification_status = 'manual_verified', 
                verification_note = $1,
                verified_by = $2,
                verified_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [note, userId, shiftId]);
    }

    /**
     * Reject Shift (Non-Billable)
     */
    async rejectShift(shiftId: string, userId: string, note: string) {
        const db = getDbClient();
        return db.query(`
            UPDATE shifts 
            SET verification_status = 'rejected', 
                verification_note = $1,
                verified_by = $2,
                verified_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [note, userId, shiftId]);
    }

    /**
     * Auto-Run Rule Engine
     * (To be called by cron or event trigger)
     */
    async runAutoVerification(shiftId: string) {
        // Logic: If GPS matched, set to 'auto_verified'
        // This would connect to OperationsDashboardService logic
    }
}

export const complianceService = new ComplianceService();
