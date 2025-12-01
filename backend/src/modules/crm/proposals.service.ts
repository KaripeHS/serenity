import { DatabaseClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { z } from 'zod';

const logger = createLogger('proposals-service');

export interface CareConfiguration {
    rnHours: number;
    lpnHours: number;
    cnaHours: number;
    hhaHours: number;
    daysPerWeek: number;
}

export interface Proposal {
    id: string;
    leadId: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected';
    careConfiguration: CareConfiguration;
    totalWeeklyCost: number;
    createdAt: Date;
    updatedAt: Date;
}

export const createProposalSchema = z.object({
    leadId: z.string().uuid(),
    careConfiguration: z.object({
        rnHours: z.number().min(0),
        lpnHours: z.number().min(0),
        cnaHours: z.number().min(0),
        hhaHours: z.number().min(0),
        daysPerWeek: z.number().min(1).max(7)
    }),
    totalWeeklyCost: z.number().min(0),
    status: z.enum(['draft', 'pending_approval']).default('draft')
});

export type CreateProposalDTO = z.infer<typeof createProposalSchema>;

export class ProposalsService {
    private db: DatabaseClient;

    constructor() {
        this.db = new DatabaseClient();
    }

    async createProposal(data: CreateProposalDTO): Promise<Proposal> {
        const query = `
            INSERT INTO proposals (lead_id, care_configuration, total_weekly_cost, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const values = [
            data.leadId,
            JSON.stringify(data.careConfiguration),
            data.totalWeeklyCost,
            data.status
        ];

        try {
            const result = await this.db.query(query, values);
            return this.mapRowToProposal(result.rows[0]);
        } catch (error) {
            logger.error('Failed to create proposal', { error, data });
            throw error;
        }
    }

    async getProposals(status?: string): Promise<Proposal[]> {
        let query = `SELECT * FROM proposals`;
        const values: any[] = [];

        if (status) {
            query += ` WHERE status = $1`;
            values.push(status);
        }

        query += ` ORDER BY created_at DESC`;

        try {
            const result = await this.db.query(query, values);
            return result.rows.map(this.mapRowToProposal);
        } catch (error) {
            logger.error('Failed to fetch proposals', { error });
            throw error;
        }
    }

    async updateStatus(id: string, status: string): Promise<Proposal> {
        const query = `
            UPDATE proposals 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        try {
            const result = await this.db.query(query, [status, id]);
            if (result.rows.length === 0) {
                throw new Error('Proposal not found');
            }
            return this.mapRowToProposal(result.rows[0]);
        } catch (error) {
            logger.error('Failed to update proposal status', { error, id, status });
            throw error;
        }
    }

    private mapRowToProposal(row: any): Proposal {
        return {
            id: row.id,
            leadId: row.lead_id,
            status: row.status,
            careConfiguration: row.care_configuration,
            totalWeeklyCost: parseFloat(row.total_weekly_cost),
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
