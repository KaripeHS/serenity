import { accountingService } from '../finance/accounting.service'; // Ensure imports
import { getDbClient } from '../../database/client';
import { randomUUID } from 'crypto';

interface PaymentInput {
    organizationId: string;
    userId: string; // The Payer
    billId?: string; // Optional Invoice Link
    amount: number; // Base Amount intended to pay
    method: 'card' | 'ach' | 'check' | 'zelle' | 'cash';
    reference?: string; // Check # or external ref
}

interface FeeResult {
    amount: number;
    fee: number;
    total: number;
}

export class PaymentProcessorService {

    /**
     * Calculate Fees based on Method
     * Card: 3% Surrcharge
     * ACH: 0.8% Capped at $5.00
     * Manual: $0
     */
    calculateFees(amount: number, method: string): FeeResult {
        let fee = 0;

        if (method === 'card') {
            fee = Number((amount * 0.03).toFixed(2));
        } else if (method === 'ach') {
            const rawAch = amount * 0.008;
            fee = Number((Math.min(rawAch, 5.00)).toFixed(2));
        }

        return {
            amount: amount,
            fee: fee,
            total: Number((amount + fee).toFixed(2))
        };
    }

    /**
     * Process a Payment (Mock Stripe Integration)
     * AND Post to General Ledger
     */
    async processPayment(input: PaymentInput): Promise<string> {
        const db = getDbClient();
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // 1. Calculate Fees
            const { amount, fee, total } = this.calculateFees(input.amount, input.method);

            // 2. Mock Gateway Interface
            let providerId = input.reference || `mock_txn_${randomUUID().substring(0, 8)}`;
            let status = 'succeeded';

            // 3. Record Transaction
            const paymentId = randomUUID();

            await client.query(`
                INSERT INTO payments (
                    id, organization_id, user_id, bill_id,
                    amount, fee_amount, total_charged,
                    method, status, provider_transaction_id,
                    processed_at, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [
                paymentId, input.organizationId, input.userId, input.billId,
                amount, fee, total,
                input.method, status, providerId
            ]);

            // 4. Accounting Entry (The "Seamless" Part)
            // Debit: Asset (Cash/Undeposited Funds)
            // Credit: A/R (Patient Balance)

            let debitAccountCode = '1000'; // Fallback
            if (['cash', 'check', 'zelle'].includes(input.method)) {
                debitAccountCode = '1150'; // Undeposited Funds (New Code needed in COA)
            } else {
                debitAccountCode = '1010'; // Operating Account (Immediate for Card/ACH usually, or Clearing)
                // For simplified phase 16, assume Card hits bank immediately (minus fee handling later)
            }

            // Find Account IDs (Simplified lookup - in prod cache this)
            const debitAccRes = await client.query("SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND code = $2", [input.organizationId, debitAccountCode]);
            const arAccRes = await client.query("SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND code = '1100'", [input.organizationId]); // A/R
            const feeAccRes = await client.query("SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND code = '6200'", [input.organizationId]); // Bank Fees

            if (debitAccRes.rows.length > 0 && arAccRes.rows.length > 0) {
                const journalLines = [
                    {
                        accountId: debitAccRes.rows[0].id,
                        debit: total, // We received Total (including fee surcharge) 
                        credit: 0,
                        description: `Payment Receipt (${input.method})`
                    },
                    {
                        accountId: arAccRes.rows[0].id,
                        debit: 0,
                        credit: amount, // Only credit the Bill Amount
                        description: `Payment Applied to Bill`
                    }
                ];

                // If there's a fee/surcharge, we collected it (Debit Cash) but it's not AR credit.
                // It is typically "Other Income" or offsets the Expense.
                // Let's treat the Surcharge as Revenue for now (Covering the cost) -> Credit '4900 Other Revenue'
                // OR, if we want to show it netting out expense:
                // Simplest for HHA: Credit "Logistics/Admin Revenue" (4900).
                // Let's check accounting.service for 4900. If not, use generic Revenue 4200.

                if (fee > 0) {
                    const revAccRes = await client.query("SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND code = '4200'", [input.organizationId]);
                    if (revAccRes.rows.length > 0) {
                        journalLines.push({
                            accountId: revAccRes.rows[0].id,
                            debit: 0,
                            credit: fee,
                            description: 'Processing Fee Surcharge Collected'
                        });
                    }
                }

                await accountingService.createJournalEntry({
                    organizationId: input.organizationId,
                    date: new Date(),
                    description: `Payment via ${input.method}`,
                    referenceType: 'payment',
                    referenceId: paymentId,
                    lines: journalLines,
                    createdBy: input.userId
                });
            }

            await client.query('COMMIT');
            return paymentId;

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Get Payments for a specific User (Family View)
     */
    async getUserPayments(userId: string): Promise<any[]> {
        const db = getDbClient();
        const res = await db.query(`
            SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC
        `, [userId]);
        return res.rows;
    }
}

export const paymentProcessor = new PaymentProcessorService();
