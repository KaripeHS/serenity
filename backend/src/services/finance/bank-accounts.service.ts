/**
 * Bank Accounts Service
 * Manages physical bank accounts and their linkage to the General Ledger
 */

import { getDbClient } from '../../database/client';
import { v4 as uuidv4 } from 'uuid';

export interface BankAccount {
    id: string;
    organizationId: string;
    name: string;
    institutionName?: string;
    accountNumberLast4?: string;
    routingNumber?: string;
    glAccountId?: string;
    isPrimary: boolean;
    createdAt: Date;
}

export class BankAccountsService {

    async create(data: Omit<BankAccount, 'id' | 'createdAt'>): Promise<BankAccount> {
        const db = getDbClient();

        // Auto-create GL Account if not provided? 
        // For now, simpler to require it or let frontend handle it.

        const res = await db.insert(
            'bank_accounts',
            {
                organization_id: data.organizationId,
                name: data.name,
                institution_name: data.institutionName,
                account_number_last4: data.accountNumberLast4,
                routing_number: data.routingNumber,
                gl_account_id: data.glAccountId,
                is_primary: data.isPrimary
            }
        );

        return this.mapRow(res.rows[0]);
    }

    async getAll(organizationId: string): Promise<BankAccount[]> {
        const db = getDbClient();
        const res = await db.find('bank_accounts', { organization_id: organizationId, orderBy: 'created_at DESC' });
        return res.map(this.mapRow);
    }

    async update(id: string, organizationId: string, data: Partial<BankAccount>): Promise<BankAccount> {
        const db = getDbClient();
        const res = await db.update(
            'bank_accounts',
            {
                name: data.name,
                institution_name: data.institutionName,
                account_number_last4: data.accountNumberLast4,
                routing_number: data.routingNumber,
                gl_account_id: data.glAccountId,
                is_primary: data.isPrimary
            },
            'id = $1 AND organization_id = $2',
            [id, organizationId]
        );

        if (res.rows.length === 0) throw new Error('Bank account not found');
        return this.mapRow(res.rows[0]);
    }

    async delete(id: string, organizationId: string): Promise<void> {
        const db = getDbClient();
        await db.delete('bank_accounts', 'id = $1 AND organization_id = $2', [id, organizationId]);
    }

    private mapRow(row: any): BankAccount {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            institutionName: row.institution_name,
            accountNumberLast4: row.account_number_last4,
            routingNumber: row.routing_number,
            glAccountId: row.gl_account_id,
            isPrimary: row.is_primary,
            createdAt: row.created_at
        };
    }
}

export const bankAccountsService = new BankAccountsService();
