
import { getDbClient } from '../backend/src/database/client';
import { accountingService } from '../backend/src/services/finance/accounting.service';
import { randomUUID } from 'crypto';

/**
 * Verify HHA Chart of Accounts Seeding
 */
async function verifyHHAFinance() {
    const db = getDbClient();
    try {
        console.log('🚀 Starting HHA Finance Verification...');

        // 1. Setup: Get or Create Org
        let orgId: string;
        const orgRes = await db.query("SELECT id FROM organizations LIMIT 1");
        if (orgRes.rows.length > 0) {
            orgId = orgRes.rows[0].id;
        } else {
            console.log('⚠️ No Organization found. Creating one...');
            const newId = randomUUID();
            await db.query(`
                INSERT INTO organizations (id, name, slug, type, status, settings) 
                VALUES ($1, 'Test HHA Org', 'test-hha', 'agency', 'active', '{}') 
            `, [newId]);
            orgId = newId;
        }
        console.log(`✅ Using Org: ${orgId}`);

        // 2. Seed COA with new HHA Structure
        console.log('🌱 Seeding HHA Chart of Accounts...');
        await accountingService.seedChartOfAccounts(orgId);

        // 3. Verify Specific Keys exist
        const checkCodes = ['4010', '4110', '5000', '5200', '6200'];
        for (const code of checkCodes) {
            const res = await db.query("SELECT name, subtype FROM chart_of_accounts WHERE organization_id = $1 AND code = $2", [orgId, code]);
            if (res.rows.length === 0) {
                throw new Error(`❌ Missing Account Code: ${code}`);
            }
            console.log(`   - Found ${code}: ${res.rows[0].name} (${res.rows[0].subtype})`);
        }
        console.log('✅ All Critical HHA Accounts Verified');

        // 4. Test Journal Entry: Medicare SN Visit Revenue + Cost
        console.log('💰 Testing Margin Transaction...');
        // Revenue: $150 (Medicare SN)
        // Cost: $60 (Nurse Pay) + $10 (Mileage)

        // Lookup IDs
        const revenueAcc = (await db.query("SELECT id FROM chart_of_accounts WHERE organization_id =$1 AND code='4010'", [orgId])).rows[0].id; // Rev-Medicare SN
        const arAcc = (await db.query("SELECT id FROM chart_of_accounts WHERE organization_id =$1 AND code='1100'", [orgId])).rows[0].id; // AR

        const laborCostAcc = (await db.query("SELECT id FROM chart_of_accounts WHERE organization_id =$1 AND code='5000'", [orgId])).rows[0].id; // Direct Labor SN
        const mileageCostAcc = (await db.query("SELECT id FROM chart_of_accounts WHERE organization_id =$1 AND code='5200'", [orgId])).rows[0].id; // Direct Mileage
        const liabilityAcc = (await db.query("SELECT id FROM chart_of_accounts WHERE organization_id =$1 AND code='2100'", [orgId])).rows[0].id; // Payroll Liab

        // Post Revenue
        await accountingService.createJournalEntry({
            organizationId: orgId,
            date: new Date(),
            description: 'Visit: Medicare SN - Pt Smith',
            lines: [
                { accountId: arAcc, debit: 150, credit: 0 },
                { accountId: revenueAcc, debit: 0, credit: 150 }
            ]
        });

        // Post Direct Cost
        await accountingService.createJournalEntry({
            organizationId: orgId,
            date: new Date(),
            description: 'Cost: Nurse Pay + Travel',
            lines: [
                { accountId: laborCostAcc, debit: 60, credit: 0 },
                { accountId: mileageCostAcc, debit: 10, credit: 0 },
                { accountId: liabilityAcc, debit: 0, credit: 70 }
            ]
        });

        console.log('✅ Successfully Posted Revenue and Direct Cost Journal Entries');
        console.log('🎉 HHA Finance Structure Verification Complete!');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verifyHHAFinance();
