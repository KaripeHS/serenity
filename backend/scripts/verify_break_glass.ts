
import dotenv from 'dotenv';
dotenv.config();

import { getDbClient } from '../src/database/client';
import { ABACEngine, UserRole, Permission, DataClassification, UserContext } from '../src/auth/access-control';
import { AuditLogger } from '../src/audit/logger';
import { PHIDetector } from '../src/security/phi-detector';
import { v4 as uuidv4 } from 'uuid';

async function verifyBreakGlass() {
    console.log('🔨 Starting Break-Glass Protocol Verification...');

    const db = getDbClient();
    const auditLogger = new AuditLogger('verification-script');
    const phiDetector = new PHIDetector();
    const abac = new ABACEngine(db, auditLogger, phiDetector);

    // Test Data IDs
    const orgId = '00000000-0000-0000-0000-000000000001';
    const rnId = uuidv4();
    const clientId = uuidv4();

    try {
        // 1. Setup Test Data
        console.log('📝 Setting up test RN and Client (No Caseload)...');

        // Create RN
        await db.query(`
      INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, organization_id, status)
      VALUES ($1, $2, 'hash', 'BreakGlass', 'Tester', $3, $4, 'active')
    `, [rnId, `bg-${rnId}@test.com`, UserRole.RN_CASE_MANAGER, orgId]);

        // Create Client
        await db.query(`
      INSERT INTO public.clients (id, first_name, last_name, organization_id, status)
      VALUES ($1, 'Emergency', 'Patient', $2, 'active')
    `, [clientId, orgId]);

        // Context
        const userContext: UserContext = {
            userId: rnId,
            organizationId: orgId,
            role: UserRole.RN_CASE_MANAGER,
            permissions: [Permission.CLIENT_READ, Permission.CLIENT_PHI_ACCESS],
            attributes: [],
            sessionId: 'test-session',
            ipAddress: '127.0.0.1',
            userAgent: 'test-script'
        };

        const accessRequest = {
            action: Permission.CLIENT_READ,
            resource: { type: 'client', id: clientId },
            context: { dataClassification: DataClassification.PHI }
        };

        // -----------------------------------------------------------------------
        // TEST 1: Standard Access (Should Fail)
        // -----------------------------------------------------------------------
        console.log('\n🧪 Test 1: Standard Access (No Caseload)');
        const decision1 = await abac.evaluateAccess(userContext, accessRequest);

        if (!decision1.allowed) {
            console.log('✅ PASS: Access denied as expected.');
        } else {
            console.error('❌ FAIL: Access granted unexpectedly!');
            process.exit(1);
        }

        // -----------------------------------------------------------------------
        // TEST 2: Break-Glass Access (Should Succeed)
        // -----------------------------------------------------------------------
        console.log('\n🧪 Test 2: Activate Break-Glass');

        // Simulate API call by inserting into DB
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        await db.query(`
        INSERT INTO break_glass_requests (user_id, client_id, reason, expires_at)
        VALUES ($1, $2, 'Emergency Access Test', $3)
    `, [rnId, clientId, expiresAt]);
        console.log('   🚨 Break-Glass Permit Created.');

        const decision2 = await abac.evaluateAccess(userContext, accessRequest);

        if (decision2.allowed) {
            console.log('✅ PASS: Access GRANTED via Break-Glass.');
            console.log(`   Reason: ${decision2.reason}`);
        } else {
            console.error('❌ FAIL: Access still denied after Break-Glass!', decision2.reason);
        }

    } catch (err) {
        console.error('💥 Verification Failed:', err);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        try {
            await db.query(`DELETE FROM break_glass_requests WHERE user_id = $1`, [rnId]);
            await db.query(`DELETE FROM public.users WHERE id = $1`, [rnId]);
            await db.query(`DELETE FROM public.clients WHERE id = $1`, [clientId]);
        } catch (e) { }
        process.exit(0);
    }
}

verifyBreakGlass();
