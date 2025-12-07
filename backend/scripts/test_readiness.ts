
import { schedulerService } from '../src/services/infrastructure/scheduler.service';
import { accountingService } from '../src/services/finance/accounting.service'; // For Cash
import { getDbClient } from '../src/database/client';

const orgId = "550e8400-e29b-41d4-a716-446655440000";

async function testReadiness() {
    console.log('--- Testing Executive Readiness System ---');
    const db = getDbClient();

    // 1. Ensure Data Exists
    // We already have payment data from Phase 16. 
    // Cash should be > 0 if 1010/1150 were populated.
    // Let's seed a "Critical" Billing Item (Old Claim) to test the Red Alert.

    // Fetched valid Pod ID to satisfy FK
    const podRes = await db.query('SELECT id FROM pods LIMIT 1');
    const podId = podRes.rows[0]?.id || '550e8400-e29b-41d4-a716-446655440000'; // Fallback

    console.log('1. Seeding Critical Data (Stale Claim)...');
    await db.query(`
        INSERT INTO claims (id, organization_id, client_id, pod_id, status, total_amount, claim_number, service_period_start, service_period_end, payer_type, payer_id, created_at)
        VALUES ($1, $2, $3, $4, 'draft', 500.00, 'TEST-CLM-001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', 'medicare', 'medicare_ohio', NOW() - INTERVAL '3 days')
        ON CONFLICT (id) DO NOTHING
    `, ['550e8400-e29b-41d4-a716-446655449999', orgId, '550e8400-e29b-41d4-a716-446655440001', podId]);

    console.log('2. Seeding Warning Data (Expiring Credential)...');
    // We need a valid user id for credential. 'userId' from verify_payments or just the admin id.
    const userId = "550e8400-e29b-41d4-a716-446655440001"; // Reusing from claims
    await db.query(`
        INSERT INTO credentials (id, user_id, credential_type, status, expiration_date)
        VALUES ($1, $2, 'STNA', 'active', NOW() + INTERVAL '10 days')
        ON CONFLICT (id) DO NOTHING
    `, ['550e8400-e29b-41d4-a716-446655448888', userId]);

    // 3. Trigger Scheduler (Force Run)
    console.log('3. Forcing "Morning" Brief Generation...');
    await schedulerService.sendReadinessBrief('Morning');

    console.log('--- Test Complete ---');
    process.exit(0);
}

testReadiness().catch(console.error);
