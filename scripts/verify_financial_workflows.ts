
import { getDbClient } from '../backend/src/database/client';
import { financialWorkflowsService } from '../backend/src/services/finance/financial-workflows.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Verify Financial Workflows (Approvals, AP)
 * Run with: npx tsx scripts/verify_financial_workflows.ts
 */
async function verifyWorkflows() {
    const db = getDbClient();
    try {
        console.log('🚀 Starting Financial Workflows Verification...');

        // 1. Setup: Get or Create Org and User
        let orgId: string;
        const orgRes = await db.query("SELECT id FROM organizations LIMIT 1");
        if (orgRes.rows.length > 0) {
            orgId = orgRes.rows[0].id;
        } else {
            console.log('⚠️ No Organization found. Creating one...');
            const newId = uuidv4();
            await db.query(`
                INSERT INTO organizations (id, name, slug, type, status, settings) 
                VALUES ($1, 'Test Org', 'test-org', 'agency', 'active', '{}') 
            `, [newId]);
            orgId = newId;
        }

        let founderId: string;
        const founderRes = await db.query("SELECT id FROM users WHERE role = 'founder' LIMIT 1");
        if (founderRes.rows.length > 0) {
            founderId = founderRes.rows[0].id;
        } else {
            console.log('⚠️ No Founder found. Creating one...');
            const newId = uuidv4();
            await db.query(`
                INSERT INTO users (id, organization_id, email, first_name, last_name, phone, role, status, password_hash)
                VALUES ($1, $2, 'founder@test.com', 'Test', 'Founder', '555-555-5555', 'founder', 'active', 'hash')
             `, [newId, orgId]);
            founderId = newId;
        }

        console.log(`✅ Using Org: ${orgId}, User: ${founderId}`);

        // 2. Create Vendor
        const vendorName = `Test Vendor ${Date.now()}`;
        const vendorRes = await financialWorkflowsService.createVendor({
            organizationId: orgId,
            name: vendorName,
            taxId: '99-9999999',
            paymentTerms: 'Net 30'
        });
        const vendorId = vendorRes.rows[0].id;
        console.log(`✅ Created Vendor: ${vendorId}`);

        // 3. Create High-Value Bill ($10,000) -> Should trigger CFO Review
        const bill = await financialWorkflowsService.createBill({
            organizationId: orgId,
            vendorId: vendorId,
            billNumber: `INV-${Date.now()}`,
            amount: 10000,
            dueDate: new Date(),
            description: 'Server Equipment',
            createdBy: founderId
        });
        console.log(`✅ Created Bill: ${bill.id}, Status: ${bill.approval_stage}`);

        if (bill.approval_stage !== 'cfo_review') {
            throw new Error(`❌ Bill should be in cfo_review stage due to high amount, got: ${bill.approval_stage}`);
        }

        // 4. Test Override (Founder has CFO privileges in this simulation logic)
        const approvalRes = await financialWorkflowsService.approveItem(
            orgId,
            'bill',
            bill.id,
            founderId,
            'override',
            'Urgent payment needed for launch'
        );
        console.log(`✅ Override Result:`, approvalRes);

        const updatedBill = await db.query("SELECT status FROM bills WHERE id = $1", [bill.id]);
        if (updatedBill.rows[0].status !== 'approved') {
            throw new Error('❌ Bill status failed to update to approved after override');
        }
        console.log('✅ Bill Successfully Approved via Override');

        console.log('🎉 Verification Complete!');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verifyWorkflows();
