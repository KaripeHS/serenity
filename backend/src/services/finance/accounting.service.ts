/**
 * Accounting Service
 * Core logic for Double-Entry Accounting, Journal Entries, and Reporting
 */

import { getDbClient } from '../../database/client';
import { v4 as uuidv4 } from 'uuid';

export interface JournalEntryInput {
    organizationId: string;
    date: Date;
    description: string;
    referenceType?: string;
    referenceId?: string;
    lines: JournalLineInput[];
    createdBy?: string;
}

export interface JournalLineInput {
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
}

export class AccountingService {
    /**
     * Create a new Journal Entry with strict validation
     * Enforces Debits = Credits
     */
    async createJournalEntry(entry: JournalEntryInput): Promise<string> {
        const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Journal Entry imbalance: Debits ($${totalDebit}) != Credits ($${totalCredit})`);
        }

        const db = getDbClient();
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            const journalId = uuidv4();

            // 1. Create Header
            await client.query(
                `INSERT INTO journal_entries (id, organization_id, date, description, reference_type, reference_id, created_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'posted')`,
                [journalId, entry.organizationId, entry.date, entry.description, entry.referenceType, entry.referenceId, entry.createdBy]
            );

            // 2. Create Lines
            for (const line of entry.lines) {
                await client.query(
                    `INSERT INTO journal_lines (journal_entry_id, organization_id, account_id, description, debit, credit)
           VALUES ($1, $2, $3, $4, $5, $6)`,
                    [journalId, entry.organizationId, line.accountId, line.description || entry.description, line.debit, line.credit]
                );
            }

            await client.query('COMMIT');
            return journalId;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Initialize Default Chart of Accounts for an Organization
     */
    async seedChartOfAccounts(organizationId: string): Promise<void> {
        const defaults = [
            // --- Assets (1000-1999) ---
            { code: '1000', name: 'Cash on Hand', type: 'Asset', subtype: 'Current Asset' },
            { code: '1010', name: 'Operating Account (Chase)', type: 'Asset', subtype: 'Current Asset' },
            { code: '1020', name: 'Payroll Account', type: 'Asset', subtype: 'Current Asset' },
            { code: '1100', name: 'Accounts Receivable', type: 'Asset', subtype: 'Current Asset' },
            { code: '1110', name: 'Unbilled Revenue (Accrued)', type: 'Asset', subtype: 'Current Asset' }, // Important for HHA
            { code: '1150', name: 'Undeposited Funds', type: 'Asset', subtype: 'Current Asset' }, // For Cash/Checks/Zelle holding
            { code: '1200', name: 'Inventory - Medical Supplies', type: 'Asset', subtype: 'Current Asset' },
            { code: '1500', name: 'Fixed Assets - Equipment', type: 'Asset', subtype: 'Non-Current Asset' },

            // --- Liabilities (2000-2999) ---
            { code: '2000', name: 'Accounts Payable', type: 'Liability', subtype: 'Current Liability' },
            { code: '2100', name: 'Accrued Payroll', type: 'Liability', subtype: 'Current Liability' },
            { code: '2200', name: 'Deferred Revenue', type: 'Liability', subtype: 'Current Liability' },

            // --- Equity (3000-3999) ---
            { code: '3000', name: 'Owner Equity', type: 'Equity', subtype: 'Equity' },
            { code: '3900', name: 'Retained Earnings', type: 'Equity', subtype: 'Equity' },

            // --- Revenue (4000-4999) - Segmented by Payer & Discipline ---
            { code: '4000', name: 'Revenue - Medicare Part A', type: 'Revenue', subtype: 'Operating Revenue' },
            { code: '4010', name: 'Rev-Medicare - Skilled Nursing', type: 'Revenue', subtype: 'Operating Revenue' },
            { code: '4020', name: 'Rev-Medicare - Physical Therapy', type: 'Revenue', subtype: 'Operating Revenue' },
            { code: '4030', name: 'Rev-Medicare - Occupational Therapy', type: 'Revenue', subtype: 'Operating Revenue' },

            { code: '4100', name: 'Revenue - Medicaid (Waiver)', type: 'Revenue', subtype: 'Operating Revenue' },
            { code: '4110', name: 'Rev-Medicaid - Personal Care (Aide)', type: 'Revenue', subtype: 'Operating Revenue' },
            { code: '4120', name: 'Rev-Medicaid - Skilled Nursing', type: 'Revenue', subtype: 'Operating Revenue' },

            { code: '4200', name: 'Revenue - Private Pay', type: 'Revenue', subtype: 'Operating Revenue' },
            { code: '4300', name: 'Revenue - Commercial Insurance', type: 'Revenue', subtype: 'Operating Revenue' },

            // --- Cost of Revenue (Direct Costs) (5000-5999) ---
            { code: '5000', name: 'Direct Labor - Skilled Nursing', type: 'Expense', subtype: 'Cost of Revenue' },
            { code: '5010', name: 'Direct Labor - Physical Therapy', type: 'Expense', subtype: 'Cost of Revenue' },
            { code: '5020', name: 'Direct Labor - Occupational Therapy', type: 'Expense', subtype: 'Cost of Revenue' },
            { code: '5030', name: 'Direct Labor - Home Health Aides', type: 'Expense', subtype: 'Cost of Revenue' },

            { code: '5100', name: 'Contract Labor - Clinical', type: 'Expense', subtype: 'Cost of Revenue' },

            { code: '5200', name: 'Direct Mileage & Travel', type: 'Expense', subtype: 'Cost of Revenue' },
            { code: '5300', name: 'Direct Medical Supplies', type: 'Expense', subtype: 'Cost of Revenue' },

            // --- Operating Expenses (Overhead) (6000-6999) ---
            { code: '6000', name: 'Admin Salaries', type: 'Expense', subtype: 'Operating Expense' },
            { code: '6100', name: 'Rent & Utilities', type: 'Expense', subtype: 'Operating Expense' },
            { code: '6200', name: 'Software & Technology', type: 'Expense', subtype: 'Operating Expense' },
            { code: '6300', name: 'Marketing & Advertising', type: 'Expense', subtype: 'Operating Expense' },
            { code: '6400', name: 'Professional Services (Legal/Acct)', type: 'Expense', subtype: 'Operating Expense' },
            { code: '6500', name: 'Insurance - Liability/Malpractice', type: 'Expense', subtype: 'Operating Expense' }
        ];

        const db = getDbClient();

        for (const acc of defaults) {
            await db.query(
                `INSERT INTO chart_of_accounts (organization_id, code, name, type, subtype)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (organization_id, code) 
         DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, subtype = EXCLUDED.subtype`, // Upsert to update existing generic codes
                [organizationId, acc.code, acc.name, acc.type, acc.subtype]
            );
        }
    }

    /**
     * Get Account Balance (Sum of Debits - Credits, adjusted for normal balance)
     */
    async getAccountBalance(organizationId: string, accountId: string): Promise<number> {
        const db = getDbClient();
        const res = await db.query(
            `SELECT 
         type,
         SUM(debit) as total_debit, 
         SUM(credit) as total_credit 
       FROM journal_lines jl
       JOIN chart_of_accounts coa ON jl.account_id = coa.id
       WHERE jl.organization_id = $1 AND jl.account_id = $2
       GROUP BY type`,
            [organizationId, accountId]
        );

        if (res.rows.length === 0) return 0;

        const { type, total_debit, total_credit } = res.rows[0];
        const debit = parseFloat(total_debit || '0');
        const credit = parseFloat(total_credit || '0');

        // Assets/Expenses: Normal Debit (Debit - Credit)
        // Liab/Equity/Revenue: Normal Credit (Credit - Debit)
        if (['Asset', 'Expense'].includes(type)) {
            return debit - credit;
        } else {
            return credit - debit;
        }
    }

    /**
     * Get Balance Sheet
     */
    async getBalanceSheet(organizationId: string): Promise<any> {
        // Determine balances for all Asset, Liability, Equity accounts
        // Simplified aggregation for now
        const sql = `
      SELECT 
        coa.type,
        coa.subtype,
        coa.name,
        coa.code,
        SUM(CASE WHEN coa.type IN ('Asset') THEN (jl.debit - jl.credit) ELSE (jl.credit - jl.debit) END) as balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.id = jl.account_id
      WHERE coa.organization_id = $1 AND coa.type IN ('Asset', 'Liability', 'Equity')
      GROUP BY coa.id, coa.type, coa.subtype, coa.name, coa.code
      ORDER BY coa.code
    `;
        const db = getDbClient();
        const res = await db.query(sql, [organizationId]);
        return res.rows; // Frontend can group by Type/Subtype
    }
}

export const accountingService = new AccountingService();
