
import { getDbClient } from '../../database/client';

export class SettingsService {

    /**
     * Get settings for a specific category
     */
    async getSettings(organizationId: string, category: string): Promise<any> {
        const db = getDbClient();
        const res = await db.query(`
            SELECT settings 
            FROM organization_settings 
            WHERE organization_id = $1 AND category = $2
        `, [organizationId, category]);

        return res.rows[0]?.settings || {};
    }

    /**
     * Update (Upsert) settings
     */
    async updateSettings(organizationId: string, category: string, settings: any, userId: string): Promise<any> {
        const db = getDbClient();

        // Upsert logic
        const res = await db.query(`
            INSERT INTO organization_settings (organization_id, category, settings, updated_by, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (organization_id, category)
            DO UPDATE SET 
                settings = $3, 
                updated_by = $4,
                updated_at = NOW()
            RETURNING settings
        `, [organizationId, category, settings, userId]);

        return res.rows[0].settings;
    }
}

export const settingsService = new SettingsService();
