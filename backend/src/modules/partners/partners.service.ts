import { DatabaseClient } from '../../database/client';
import { createLogger } from '../../utils/logger';

const logger = createLogger('partners-service');

export interface ReferralPartner {
    id: string;
    organizationName: string;
    contactName: string;
    email: string;
    phone?: string;
    type: 'wealth_manager' | 'estate_attorney' | 'physician' | 'hospital_case_manager' | 'other';
    status: 'active' | 'pending' | 'inactive';
    commissionRate: number;
    agreementSignedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePartnerDTO {
    organizationName: string;
    contactName: string;
    email: string;
    phone?: string;
    type: ReferralPartner['type'];
    notes?: string;
}

export class ReferralPartnersService {
    private db: DatabaseClient;

    constructor() {
        this.db = new DatabaseClient();
    }

    /**
     * Create a new referral partner
     */
    async createPartner(data: CreatePartnerDTO): Promise<ReferralPartner> {
        try {
            const result = await this.db.query(`
        INSERT INTO referral_partners (
          organization_name, contact_name, email, phone, type, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
                data.organizationName,
                data.contactName,
                data.email,
                data.phone,
                data.type,
                data.notes
            ]);

            return this.mapRowToPartner(result.rows[0]);
        } catch (error) {
            logger.error('Error creating referral partner', { error, data });
            throw error;
        }
    }

    /**
     * Get partner by email (for login/verification)
     */
    async getPartnerByEmail(email: string): Promise<ReferralPartner | null> {
        const result = await this.db.query('SELECT * FROM referral_partners WHERE email = $1', [email]);
        if (result.rows.length === 0) return null;
        return this.mapRowToPartner(result.rows[0]);
    }

    /**
     * Get all partners
     */
    async getPartners(): Promise<ReferralPartner[]> {
        const result = await this.db.query('SELECT * FROM referral_partners ORDER BY created_at DESC');
        return result.rows.map(this.mapRowToPartner);
    }

    /**
     * Get referrals submitted by a specific partner
     */
    async getPartnerReferrals(partnerId: string): Promise<any[]> {
        const result = await this.db.query(`
      SELECT * FROM leads 
      WHERE partner_id = $1 
      ORDER BY created_at DESC
    `, [partnerId]);

        // We return raw rows here as we might want to map them to Lead objects in the future
        // For now, just returning the data is sufficient for the portal
        return result.rows;
    }

    private mapRowToPartner(row: any): ReferralPartner {
        return {
            id: row.id,
            organizationName: row.organization_name,
            contactName: row.contact_name,
            email: row.email,
            phone: row.phone,
            type: row.type,
            status: row.status,
            commissionRate: parseFloat(row.commission_rate),
            agreementSignedAt: row.agreement_signed_at,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
