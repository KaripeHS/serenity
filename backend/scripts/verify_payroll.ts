
import { accountingService } from '../src/services/finance/accounting.service'; // Adjust path for backend/scripts execution
import { payrollService } from '../src/services/payroll/payroll.service';
import { getDbClient } from '../src/database/client';
import { randomUUID } from 'crypto';

// Adjust for execution context
const orgId = "550e8400-e29b-41d4-a716-446655440000"; // Test Org
const userId = "550e8400-e29b-41d4-a716-446655440001"; // Test User

async function verifyPayroll() {
    console.log('--- Starting Payroll Verification ---');
    console.log('Context: Backend/scripts');

    const db = getDbClient();

    // 0. Seed Org/User for FK validity
    console.log('0. Seeding Test Data (Org/User)...');
    await db.query(`
        INSERT INTO organizations (id, name, type, slug) VALUES ($1, 'Test Payroll Org', 'hha', 'test-payroll-org')
        ON CONFLICT (id) DO NOTHING
    `, [orgId]);
    await db.query(`
        INSERT INTO users (id, organization_id, email, first_name, last_name, role)
        VALUES ($1, $2, 'payroll.tester@test.com', 'Pay', 'Roll', 'caregiver')
        ON CONFLICT (id) DO NOTHING
    `, [userId, orgId]);

    // 0.5 Seed COA
    console.log('0.5 Seeding Chart of Accounts...');
    await accountingService.seedChartOfAccounts(orgId);

    // 1. Setup Data: Rate
    console.log('1. Setting Pay Rate...');
    await payrollService.setPayRate(orgId, {
        userId: userId,
        rateType: 'visit_sn',
        amount: 65.00
    });

    // 2. Setup Data: Bonus History (Simulating existing bonus system)
    console.log('2. Creating Mock Bonus Record...');
    const bonusId = randomUUID();
    const today = new Date();
    await db.query(`
        INSERT INTO bonus_history (id, caregiver_id, bonus_type, amount, period, paid_at, created_at)
        VALUES ($1, $2, 'performance_bonus', 100.00, 'DEC-2025', $3, NOW())
    `, [bonusId, userId, today]);

    // 3. Run Payroll Calculation
    console.log('3. Running Payroll Calculation...');
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of month

    const runId = await payrollService.calculatePayroll({
        organizationId: orgId,
        periodStart: start,
        periodEnd: end,
        createdBy: userId
    });
    console.log(`   > Run ID generated: ${runId}`);

    // Verify Run Total
    const runRes = await db.query('SELECT total_amount FROM payroll_runs WHERE id = $1', [runId]);
    const total = parseFloat(runRes.rows[0].total_amount);
    console.log(`   > Run Total: $${total}`);

    if (total !== 100.00) {
        console.error('❌ Error: Expected $100.00 (Bonus only)');
    } else {
        console.log('✅ Payroll correctly swept usage of Bonus History!');
    }

    // 4. Commit Payroll
    console.log('4. Committing Payroll to GL...');
    await payrollService.commitPayroll(orgId, runId);

    // 5. Verify Ledger
    console.log('5. Verifying Balance Sheet Impact...');
    const balanceSheet = await accountingService.getBalanceSheet(orgId);

    // Find Accrued Payroll (Liability) - Should be Credit $100 (which shows as +100 in our logic for Liability)
    const liability = balanceSheet.find((a: any) => a.code === '2100');
    console.log('   > Accrued Payroll Balance:', liability ? liability.balance : 'Not Found');

    if (liability && Math.abs(parseFloat(liability.balance) - 100.00) < 0.01) {
        console.log('✅ GL Verification Passed: Accrued Liability is Correct.');
    } else {
        console.warn('⚠️ GL Check warrant attention. Expected 100.');
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
}

verifyPayroll().catch(e => {
    console.error(e);
    process.exit(1);
});
