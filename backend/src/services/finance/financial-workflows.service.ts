
import { getDbClient } from '../../database/client';
import { v4 as uuidv4 } from 'uuid';

export interface VendorInput {
    organizationId: string;
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    paymentTerms?: string;
}

export interface BillInput {
    organizationId: string;
    vendorId: string;
    billNumber: string;
    amount: number;
    dueDate: Date;
    description?: string;
    createdBy: string;
}

export interface ExpenseInput {
    organizationId: string;
    userId: string;
    amount: number;
    merchant: string;
    dateIncurred: Date;
    category: string;
    description?: string;
    receiptUrl?: string;
}

export class FinancialWorkflowsService {

    // --- Vendors ---
    async createVendor(input: VendorInput) {
        const db = getDbClient();
        return db.query(
            `INSERT INTO vendors (organization_id, name, tax_id, email, phone, payment_terms)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [input.organizationId, input.name, input.taxId, input.email, input.phone, input.paymentTerms]
        );
    }

    async getVendors(organizationId: string) {
        const db = getDbClient();
        return db.query(`SELECT * FROM vendors WHERE organization_id = $1 ORDER BY name`, [organizationId]);
    }

    // --- Bills ---
    async createBill(input: BillInput) {
        const db = getDbClient();
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Create Bill
            const res = await client.query(
                `INSERT INTO bills (organization_id, vendor_id, bill_number, amount, due_date, description, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
                 RETURNING *`,
                [input.organizationId, input.vendorId, input.billNumber, input.amount, input.dueDate, input.description, input.createdBy]
            );
            const bill = res.rows[0];

            // 2. Determine Approval Logic (Simple for now: > $500 needs approval)
            let stage = 'approved';
            if (input.amount > 5000) stage = 'cfo_review';
            else if (input.amount > 500) stage = 'supervisor_review';

            await client.query(
                `UPDATE bills SET approval_stage = $1, status = 'pending_approval' WHERE id = $2`,
                [stage, bill.id]
            );

            // 3. Create Approval Request Log
            await client.query(
                `INSERT INTO approval_logs (organization_id, entity_type, entity_id, user_id, action, new_status, comments)
                 VALUES ($1, 'bill', $2, $3, 'submit', $4, 'Submitted for approval')`,
                [input.organizationId, bill.id, input.createdBy, stage]
            );

            await client.query('COMMIT');
            return bill;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // --- Expenses ---
    async submitExpense(input: ExpenseInput) {
        const db = getDbClient();
        // Auto-approve small expenses < $50
        const status = input.amount < 50 ? 'approved' : 'submitted';

        return db.query(
            `INSERT INTO expenses (organization_id, user_id, amount, merchant, date_incurred, category, description, receipt_url, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [input.organizationId, input.userId, input.amount, input.merchant, input.dateIncurred, input.category, input.description, input.receiptUrl, status]
        );
    }

    // --- Approvals ---
    async approveItem(
        organizationId: string,
        entityType: 'bill' | 'expense',
        entityId: string,
        userId: string,
        action: 'approve' | 'reject' | 'override',
        reason?: string
    ) {
        const db = getDbClient();
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // 1. Get User Role (Mock check for now)
            const userRes = await client.query(`SELECT role FROM users WHERE id = $1`, [userId]);
            const role = userRes.rows[0]?.role;

            let newStatus = action === 'reject' ? 'rejected' : 'approved';
            let stage = 'approved';

            // Override Logic: Only CFO/CEO/Founder can override
            const isExec = ['cfo', 'ceo', 'founder'].includes(role);

            if (action === 'override' && !isExec) {
                throw new Error('Unauthorized Override');
            }

            if (action === 'approve') {
                // If standard approval, check if we need another step (simplified: just one step for now unless override)
                // In real implementation, this checks `approval_definitions` tables
            }

            // 2. Update Entity
            const table = entityType === 'bill' ? 'bills' : 'expenses';
            await client.query(
                `UPDATE ${table} SET status = $1, approval_stage = $2 WHERE id = $3 AND organization_id = $4`,
                [newStatus, stage, entityId, organizationId]
            );

            // 3. Log
            await client.query(
                `INSERT INTO approval_logs (organization_id, entity_type, entity_id, user_id, action, new_status, comments)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [organizationId, entityType, entityId, userId, action, newStatus, reason]
            );

            await client.query('COMMIT');
            return { success: true, status: newStatus };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

export const financialWorkflowsService = new FinancialWorkflowsService();
