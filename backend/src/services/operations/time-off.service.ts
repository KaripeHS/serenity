
import { getDbClient } from '../../database/client';

export interface TimeOffRequest {
    id: string;
    user_id: string;
    organization_id: string;
    start_date: string;
    end_date: string;
    type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'other';
    reason?: string;
    status: 'pending' | 'approved' | 'denied' | 'cancelled';
    user_name?: string; // Joined
}

export const timeOffService = {

    /**
     * Submit a Time Off Request
     */
    async requestTimeOff(data: Partial<TimeOffRequest>) {
        const db = getDbClient();
        const result = await db.query(`
            INSERT INTO time_off_requests 
            (user_id, organization_id, start_date, end_date, type, reason, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
        `, [
            data.user_id, data.organization_id, data.start_date,
            data.end_date, data.type, data.reason
        ]);
        return result.rows[0];
    },

    /**
     * Get pending requests for Admin
     */
    async getPendingRequests(organizationId: string) {
        const db = getDbClient();
        const result = await db.query(`
            SELECT t.*, u.first_name || ' ' || u.last_name as user_name
            FROM time_off_requests t
            JOIN users u ON t.user_id = u.id
            WHERE t.organization_id = $1 AND t.status = 'pending'
            ORDER BY t.start_date ASC
        `, [organizationId]);
        return result.rows;
    },

    /**
     * Approve or Deny Request
     */
    async reviewRequest(requestId: string, status: 'approved' | 'denied', reviewerId: string, reason?: string) {
        const db = getDbClient();
        const result = await db.query(`
            UPDATE time_off_requests
            SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [status, reviewerId, reason, requestId]);
        return result.rows[0];
    },

    /**
     * Check if user is unavailable during a range
     * Used by Scheduling Engine
     */
    async isUserUnavailable(userId: string, start: Date, end: Date): Promise<boolean> {
        const db = getDbClient();
        const result = await db.query(`
            SELECT 1 FROM time_off_requests
            WHERE user_id = $1
            AND status = 'approved'
            AND (start_date, end_date) OVERLAPS ($2::date, $3::date)
        `, [userId, start, end]);
        return result.rows.length > 0;
    }
};
