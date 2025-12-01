import { DatabaseClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { EmailService } from '../../services/notifications/email.service';
import { MarketingService } from '../marketing/marketing.service';

const logger = createLogger('leads-service');

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    serviceInterest: string;
    status: 'new' | 'contacted' | 'assessment_scheduled' | 'contract_sent' | 'converted' | 'lost';
    source: string;
    estimatedValue?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateLeadDTO {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    serviceInterest: string;
    source?: string;
    partnerId?: string;
    notes?: string;
}

export interface UpdateLeadDTO {
    status?: Lead['status'];
    estimatedValue?: number;
    notes?: string;
}

export class LeadsService {
    private db: DatabaseClient;
    private emailService: EmailService;
    private marketingService: MarketingService;

    constructor() {
        this.db = new DatabaseClient();
        this.emailService = new EmailService();
        this.marketingService = new MarketingService();
    }

    /**
     * Create a new lead from public form or admin
     */
    async createLead(data: CreateLeadDTO): Promise<Lead> {
        try {
            const result = await this.db.query(`
        INSERT INTO leads (
          first_name, last_name, email, phone, service_interest, source, partner_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
                data.firstName,
                data.lastName,
                data.email,
                data.phone,
                data.serviceInterest,
                data.source || 'web',
                data.partnerId || null,
                data.notes
            ]);

            const lead = this.mapRowToLead(result.rows[0]);

            // Notify Admin of new high-value lead
            await this.notifyAdminOfNewLead(lead);

            // Start Marketing Drip Campaign (only for web sources usually, but let's do all for now)
            if (lead.email) {
                await this.marketingService.startDripCampaign(lead.id, lead.email, lead.firstName);
            }

            return lead;
        } catch (error) {
            logger.error('Error creating lead', { error, data });
            throw error;
        }
    }

    /**
     * Get all leads with optional filtering
     */
    async getLeads(filters?: { status?: string }): Promise<Lead[]> {
        let query = 'SELECT * FROM leads';
        const params: any[] = [];

        if (filters?.status) {
            query += ' WHERE status = $1';
            params.push(filters.status);
        }

        query += ' ORDER BY created_at DESC';

        const result = await this.db.query(query, params);
        return result.rows.map(this.mapRowToLead);
    }

    /**
     * Get a single lead by ID
     */
    async getLeadById(id: string): Promise<Lead | null> {
        const result = await this.db.query('SELECT * FROM leads WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        return this.mapRowToLead(result.rows[0]);
    }

    /**
     * Update a lead
     */
    async updateLead(id: string, data: UpdateLeadDTO): Promise<Lead> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIndex = 2;

        if (data.status) {
            updates.push(`status = $${paramIndex}`);
            params.push(data.status);
            paramIndex++;
        }
        if (data.estimatedValue !== undefined) {
            updates.push(`estimated_value = $${paramIndex}`);
            params.push(data.estimatedValue);
            paramIndex++;
        }
        if (data.notes) {
            updates.push(`notes = $${paramIndex}`);
            params.push(data.notes);
            paramIndex++;
        }

        if (updates.length === 0) {
            const lead = await this.getLeadById(id);
            if (!lead) throw new Error('Lead not found');
            return lead;
        }

        const query = `
      UPDATE leads
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

        const result = await this.db.query(query, params);
        return this.mapRowToLead(result.rows[0]);
    }

    /**
     * Get pipeline statistics
     */
    async getPipelineStats(): Promise<any> {
        const statusCounts = await this.db.query(`
      SELECT status, COUNT(*) as count, SUM(estimated_value) as value
      FROM leads
      GROUP BY status
    `);

        const totalLeads = await this.db.query('SELECT COUNT(*) as count FROM leads');

        // Calculate conversion rate (Converted / Total)
        const convertedCount = statusCounts.rows.find(r => r.status === 'converted')?.count || 0;
        const total = parseInt(totalLeads.rows[0].count);
        const conversionRate = total > 0 ? (convertedCount / total) * 100 : 0;

        return {
            totalLeads: total,
            conversionRate: conversionRate.toFixed(1) + '%',
            pipeline: statusCounts.rows.map(row => ({
                status: row.status,
                count: parseInt(row.count),
                value: parseFloat(row.value || '0')
            }))
        };
    }

    private async notifyAdminOfNewLead(lead: Lead): Promise<void> {
        // In a real app, we would fetch the admin email from config
        const adminEmail = 'admin@serenitycarepartners.com';

        // Use the generic sendEmail method if specific alert type doesn't exist yet
        // Or extend EmailService (which we might do later)
        // For now, we'll log it as a placeholder for the actual email call
        logger.info(`[Notification] New Lead Alert: ${lead.firstName} ${lead.lastName} interested in ${lead.serviceInterest}`);
    }

    private mapRowToLead(row: any): Lead {
        const lead: Lead = {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            serviceInterest: row.service_interest,
            status: row.status,
            source: row.source,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        if (row.estimated_value) {
            lead.estimatedValue = parseFloat(row.estimated_value);
        }
        if (row.notes) {
            lead.notes = row.notes;
        }

        return lead;
    }
}
