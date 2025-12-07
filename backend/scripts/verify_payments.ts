
import { paymentProcessor } from '../src/services/revenue/payment-processor.service';
import { accountingService } from '../src/services/finance/accounting.service'; // Added
import { getDbClient } from '../src/database/client';

// Inputs
const orgId = "550e8400-e29b-41d4-a716-446655440000"; // Test Org
const userId = "550e8400-e29b-41d4-a716-446655440001"; // Test User

async function verifyPayments() {
    console.log('--- Starting Payment Verification ---');
    const db = getDbClient();

    // 0. Seed COA (Needed for GL posting)
    console.log('0. Updating Chart of Accounts...');
    await accountingService.seedChartOfAccounts(orgId);

    // Test Case 1: Credit Card ($100 -> Expect $3 Fee)
    console.log('1. Testing Credit Card Fee ($100)...');
    const cardId = await paymentProcessor.processPayment({
        organizationId: orgId, userId, amount: 100.00, method: 'card'
    });

    // Verify Fee
    const cardRes = await db.query('SELECT amount, fee_amount, total_charged FROM payments WHERE id = $1', [cardId]);
    const cardRow = cardRes.rows[0];
    console.log(`   > Base: $${cardRow.amount}, Fee: $${cardRow.fee_amount}, Total: $${cardRow.total_charged}`);

    // Verify GL (Stripe should hit 1010 Operating instantly for now, or we mapped it there)
    // Surcharge of $3 should hit 4200 Revenue.
    const glRes = await db.query(`
        SELECT coa.code, jl.debit, jl.credit 
        FROM journal_lines jl
        JOIN journal_entries je ON jl.journal_entry_id = je.id
        JOIN chart_of_accounts coa ON jl.account_id = coa.id
        WHERE je.reference_id = $1
    `, [cardId]);

    // Expect: Debit 1010 (Total 103), Credit 1100 (100), Credit 4200 (3)
    const debitOp = glRes.rows.find(r => r.code === '1010');
    const creditAR = glRes.rows.find(r => r.code === '1100');
    const creditRev = glRes.rows.find(r => r.code === '4200');

    if (debitOp && parseFloat(debitOp.debit) === 103.00 && creditRev && parseFloat(creditRev.credit) === 3.00) {
        console.log('✅ GL Verification (Card): Debited Operating, Credited Revenue (Surcharge).');
    } else {
        console.error('❌ GL Verification (Card) Failed.', glRes.rows);
    }

    // Test Case 2: Cash ($50 -> Expect Undeposited Funds)
    console.log('2. Testing Cash Payment ($50)...');
    const cashId = await paymentProcessor.processPayment({
        organizationId: orgId, userId, amount: 50.00, method: 'cash'
    });

    // Verify GL: Debit 1150 (Undeposited Funds), Credit 1100 (AR)
    const cashGlRes = await db.query(`
        SELECT coa.code, jl.debit, jl.credit 
        FROM journal_lines jl
        JOIN journal_entries je ON jl.journal_entry_id = je.id
        JOIN chart_of_accounts coa ON jl.account_id = coa.id
        WHERE je.reference_id = $1
    `, [cashId]);

    const debitUndeposited = cashGlRes.rows.find(r => r.code === '1150');

    if (debitUndeposited && parseFloat(debitUndeposited.debit) === 50.00) {
        console.log('✅ GL Verification (Cash): Debited Undeposited Funds (1150). Accountability Secured.');
    } else {
        console.error('❌ GL Verification (Cash) Failed. Did code 1150 exist?');
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
}

verifyPayments().catch(console.error);
