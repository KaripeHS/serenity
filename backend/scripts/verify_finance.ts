/**
 * Verify Finance Engine
 * Tests the end-to-end accounting flow: COA -> Bank Account -> Journal Entry -> Balance Sheet
 */

import { getDbClient } from '../src/database/client';
import { accountingService } from '../src/services/finance/accounting.service';
import { bankAccountsService } from '../src/services/finance/bank-accounts.service';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    const db = getDbClient();
    const client = await db.getClient();

    try {
        console.log('🔍 Starting Finance Verification...');

        // 1. Get Organization
        const orgRes = await client.query('SELECT id, name FROM organizations LIMIT 1');
        if (orgRes.rows.length === 0) {
            console.error('❌ No organizations found. Run seeders first.');
            return;
        }
        const org = orgRes.rows[0];
        console.log(`✅ Using Organization: ${org.name} (${org.id})`);

        // 2. Seed COA
        console.log('🌱 Seeding Chart of Accounts...');
        await accountingService.seedChartOfAccounts(org.id);
        console.log('✅ COA Seeded');

        // 3. Create Bank Account
        console.log('🏦 Creating Bank Account...');
        // Find Cash GL Account first
        const glRes = await client.query("SELECT id FROM chart_of_accounts WHERE code = '1010' AND organization_id = $1", [org.id]);
        const glAccountId = glRes.rows[0]?.id;

        if (!glAccountId) throw new Error('GL Account 1010 not found');

        const bankAccount = await bankAccountsService.create({
            organizationId: org.id,
            name: `Test Bank ${Date.now()}`,
            institutionName: 'Test Bank',
            accountNumberLast4: '1234',
            routingNumber: '111000000',
            glAccountId: glAccountId,
            isPrimary: true
        });
        console.log(`✅ Bank Account Created: ${bankAccount.name}`);

        // 4. Create Journal Entry (Deposit $10,000)
        console.log('📒 Creating Journal Entry (Deposit)...');

        // Find Equity Account for credit (Owner Equity 3000)
        const equityRes = await client.query("SELECT id FROM chart_of_accounts WHERE code = '3000' AND organization_id = $1", [org.id]);
        const equityAccountId = equityRes.rows[0]?.id;

        const journalId = await accountingService.createJournalEntry({
            organizationId: org.id,
            date: new Date(),
            description: 'Initial Capital Deposit',
            referenceType: 'manual',
            lines: [
                {
                    accountId: glAccountId, // Cash (Asset) Debit
                    debit: 10000.00,
                    credit: 0
                },
                {
                    accountId: equityAccountId, // Equity Credit
                    debit: 0,
                    credit: 10000.00
                }
            ],
            createdBy: undefined // System
        });
        console.log(`✅ Journal Entry Created: ${journalId}`);

        // 5. Verify Balance Sheet
        console.log('📊 Verifying Balance Sheet...');
        const report = await accountingService.getBalanceSheet(org.id);

        // Check Assets
        const cashAsset = report.find((r: any) => r.code === '1010');
        console.log('Cash Balance:', cashAsset?.balance);

        if (Number(cashAsset?.balance) === 10000) {
            console.log('✅ Balance Sheet Valid: Cash = $10,000');
        } else {
            console.error('❌ Balance Sheet Invalid!', cashAsset);
        }

        console.log('🎉 Verification Complete!');
    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        client.release();
        await db.close();
    }
}

main();
