
import { getDbClient } from '../../database/client';

export interface Authorization {
    id: string;
    client_id: string;
    payer_id: string;
    service_code: string;
    description: string;
    units_approved: number;
    units_used: number;
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'pending' | 'exhausted';
    payer_name?: string; // joined
}

export const authorizationService = {
    async getAuthorizations(clientId: string): Promise<Authorization[]> {
        const db = getDbClient();
        const result = await db.query(`
            SELECT a.*, p.name as payer_name
            FROM authorizations a
            JOIN payers p ON a.payer_id = p.id
            WHERE a.client_id = $1
            ORDER BY a.end_date DESC
        `, [clientId]);
        return result.rows;
    },

    async createAuthorization(data: Partial<Authorization>) {
        const db = getDbClient();
        const result = await db.query(`
            INSERT INTO authorizations 
            (client_id, payer_id, service_code, description, units_approved, start_date, end_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            data.client_id, data.payer_id, data.service_code, data.description || '',
            data.units_approved || 0, data.start_date, data.end_date, 'active'
        ]);
        return result.rows[0];
    },

    async getExpiringAuthorizations(orgId: string, daysThreshold = 14) {
        const db = getDbClient();
        const result = await db.query(`
            SELECT 
                a.id, a.service_code, a.end_date,
                c.first_name, c.last_name,
                (a.units_approved - a.units_used) as units_remaining
            FROM authorizations a
            JOIN clients c ON a.client_id = c.id
            WHERE c.organization_id = $1
            AND a.status = 'active'
            AND a.end_date <= CURRENT_DATE + interval '${daysThreshold} days'
            ORDER BY a.end_date ASC
        `, [orgId]);
        return result.rows;
    },

    async updateUsage(authId: string, unitsConsumed: number) {
        const db = getDbClient();
        await db.query(`
            UPDATE authorizations
            SET units_used = units_used + $1,
                updated_at = NOW()
            WHERE id = $2
        `, [unitsConsumed, authId]);
    }
};
