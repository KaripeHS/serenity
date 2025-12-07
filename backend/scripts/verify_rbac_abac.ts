
import dotenv from 'dotenv';
dotenv.config();

import { getDbClient } from '../src/database/client';
import { ABACEngine, UserRole, Permission, DataClassification, UserContext } from '../src/auth/access-control';
import { AuditLogger } from '../src/audit/logger';
import { PHIDetector } from '../src/security/phi-detector';
import { v4 as uuidv4 } from 'uuid';

async function runVerification() {
    console.log('🔒 Starting RBAC/ABAC Verification...');

    const db = getDbClient();
    const auditLogger = new AuditLogger(db);
    const phiDetector = new PHIDetector();
    const abac = new ABACEngine(db, auditLogger, phiDetector);

    // Test Data IDs
    const orgId = '00000000-0000-0000-0000-000000000001'; // Assumes default seeded org
    const rnId = uuidv4();
    const lpnId = uuidv4();
    const clientId = uuidv4();

    try {
        // 1. Setup Test Data
        console.log('📝 Setting up test users and client...');

        // Create RN Case Manager (Using public.users explicitly)
        await db.query(`
      INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, organization_id, status)
      VALUES ($1, $2, 'hash', 'Test', 'RN', $3, $4, 'active')
    `, [rnId, `rn-${rnId}@test.com`, UserRole.RN_CASE_MANAGER, orgId]);

        // Create LPN
        await db.query(`
      INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, organization_id, status)
      VALUES ($1, $2, 'hash', 'Test', 'LPN', $3, $4, 'active')
    `, [lpnId, `lpn-${lpnId}@test.com`, UserRole.LPN_LVN, orgId]);

        // Create Client
        await db.query(`
      INSERT INTO public.clients (id, first_name, last_name, organization_id, status)
      VALUES ($1, 'Test', 'Patient', $2, 'active')
    `, [clientId, orgId]);

        // Helper to create context
        const createUserContext = (userId: string, role: UserRole): UserContext => ({
            userId,
            organizationId: orgId,
            role,
            permissions: [],
            attributes: [],
            sessionId: 'test-session',
            ipAddress: '127.0.0.1',
            userAgent: 'test-script'
        });

        const rnContext = createUserContext(rnId, UserRole.RN_CASE_MANAGER);
        rnContext.permissions = [Permission.CARE_PLAN_WRITE, Permission.CLIENT_READ, Permission.CLIENT_PHI_ACCESS];

        const lpnContext = createUserContext(lpnId, UserRole.LPN_LVN);
        lpnContext.permissions = [Permission.CLIENT_READ, Permission.CLIENT_PHI_ACCESS]; // No CARE_PLAN_WRITE

        // -----------------------------------------------------------------------
        // TEST 1: RBAC - Care Plan Write
        // -----------------------------------------------------------------------
        console.log('\n🧪 Test 1: RBAC - Care Plan Write Permission');

        // RN Should be Allowed
        const rnDecision = await abac.evaluateAccess(rnContext, {
            action: Permission.CARE_PLAN_WRITE,
            resource: { type: 'care_plan' },
            context: {}
        });

        if (rnDecision.allowed) {
            console.log('✅ PASS: RN allowed to write care plan');
        } else {
            console.error('❌ FAIL: RN denied care plan write', rnDecision.reason);
        }

        // LPN Should be Denied
        const lpnDecision = await abac.evaluateAccess(lpnContext, {
            action: Permission.CARE_PLAN_WRITE,
            resource: { type: 'care_plan' },
            context: {}
        });

        if (!lpnDecision.allowed) {
            console.log('✅ PASS: LPN denied to write care plan');
        } else {
            console.error('❌ FAIL: LPN allowed to write care plan (Should be denied)');
        }

        // -----------------------------------------------------------------------
        // TEST 2: ABAC - Caseload Context
        // -----------------------------------------------------------------------
        console.log('\n🧪 Test 2: ABAC - Caseload Access context');

        // Attempt to access client NOT in caseload
        const accessRequest = {
            action: Permission.CLIENT_READ,
            resource: { type: 'client', id: clientId },
            context: { dataClassification: DataClassification.PHI }
        };

        const initialDecision = await abac.evaluateAccess(rnContext, accessRequest);

        if (!initialDecision.allowed) {
            console.log('✅ PASS: RN denied access to patient not in caseload');
        } else {
            console.error('❌ FAIL: RN allowed access to patient not in caseload');
        }

        // Assign to Caseload
        console.log('   Assigning patient to RN caseload...');
        await db.query(`
        INSERT INTO caseloads (clinician_id, client_id, status)
        VALUES ($1, $2, 'active')
    `, [rnId, clientId]);

        // Retry Access
        const finalDecision = await abac.evaluateAccess(rnContext, accessRequest);

        if (finalDecision.allowed) {
            console.log('✅ PASS: RN allowed access after caseload assignment');
        } else {
            console.error('❌ FAIL: RN denied access even after assignment', finalDecision.reason);
        }

    } catch (err) {
        console.error('💥 Verification Failed:', err);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        try {
            await db.query(`DELETE FROM caseloads WHERE clinician_id = $1`, [rnId]);
            await db.query(`DELETE FROM public.users WHERE id IN ($1, $2)`, [rnId, lpnId]);
            await db.query(`DELETE FROM public.clients WHERE id = $1`, [clientId]);
        } catch (e) {
            // Ignore cleanup errors
        }

        process.exit(0);
    }
}

runVerification();
