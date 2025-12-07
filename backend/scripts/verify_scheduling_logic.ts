
import { DatabaseClient } from '../src/database/client';
import { SchedulingService } from '../src/modules/scheduling/scheduling.service';
import { AuditLogger } from '../src/audit/logger';
import { UserContext, UserRole } from '../src/auth/access-control';

// Mock dependencies
const db = new DatabaseClient();
const auditLogger = new AuditLogger('verification-script');
const schedulingService = new SchedulingService(db, auditLogger);

async function verifySchedulingLogic() {
    console.log('Starting Intelligent Scheduling Logic Verification...');

    try {
        // 0. ENSURE FULL SCHEMA EXISTS (Clean Slate)
        console.log('Resetting schema for test...');

        // Enable Extensions both just in case
        await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

        await db.query(`DROP TABLE IF EXISTS mileage_logs CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS shifts CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS clients CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS credentials CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS services CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS users CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS pods CASCADE;`);

        // Core
        await db.query(`CREATE TABLE IF NOT EXISTS organizations (id UUID PRIMARY KEY, name VARCHAR(255), slug VARCHAR(100), type VARCHAR(50), status VARCHAR(20));`);
        await db.query(`CREATE TABLE IF NOT EXISTS pods (id UUID PRIMARY KEY, organization_id UUID, code VARCHAR(20), name VARCHAR(255), city VARCHAR(100), state VARCHAR(2), capacity INTEGER);`);

        // USERS Table (Full Schema)
        await db.query(`
        CREATE TABLE users (
            id UUID PRIMARY KEY, 
            organization_id UUID, 
            email VARCHAR(255), 
            first_name VARCHAR(100), 
            last_name VARCHAR(100), 
            role VARCHAR(50), 
            status VARCHAR(20),
            phone VARCHAR(20),
            preferences JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            specializations TEXT[]
        );
    `);


        await db.query(`
        CREATE TABLE clients (
            id UUID PRIMARY KEY, 
            organization_id UUID, 
            pod_id UUID, 
            client_code VARCHAR(20), 
            first_name VARCHAR(100), 
            last_name VARCHAR(100), 
            address JSONB,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            primary_diagnosis JSONB DEFAULT '{}',
            service_authorization JSONB DEFAULT '{}'
        );
    `);

        await db.query(`CREATE TABLE services (id UUID PRIMARY KEY, organization_id UUID, name VARCHAR(255), code VARCHAR(50));`);
        await db.query(`CREATE TABLE credentials (id UUID PRIMARY KEY, user_id UUID, credential_type VARCHAR(100), status VARCHAR(20), expiration_date DATE);`);

        await db.query(`
        CREATE TABLE shifts (
            id UUID PRIMARY KEY, 
            organization_id UUID, 
            pod_id UUID, 
            client_id UUID, 
            caregiver_id UUID, 
            service_id UUID, 
            scheduled_start TIMESTAMP, 
            scheduled_end TIMESTAMP, 
            actual_start TIMESTAMP, 
            actual_end TIMESTAMP, 
            status VARCHAR(20),
            notes TEXT,
            tasks JSONB
        );
    `);

        // Use gen_random_uuid() for safety
        await db.query(`
        CREATE TABLE mileage_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID,
            shift_id UUID,
            user_id UUID,
            date DATE,
            start_location_lat DECIMAL(10, 8),
            start_location_lng DECIMAL(11, 8),
            end_location_lat DECIMAL(10, 8),
            end_location_lng DECIMAL(11, 8),
            distance_miles DECIMAL(8, 2),
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `);



        // 1. Setup Test Data (Cincinnati area coordinates)

        // FETCH OR CREATE ORG
        const orgResult = await db.query('SELECT id FROM organizations LIMIT 1');
        let orgId: string;

        if (orgResult.rows.length > 0) {
            orgId = orgResult.rows[0].id;
        } else {
            console.log('Seeding test organization...');
            orgId = '00000000-0000-0000-0000-000000000001';
            await db.query(`
            INSERT INTO organizations (id, name, slug, type, status)
            VALUES ($1, 'Test Org', 'test-org', 'home_health', 'active')
        `, [orgId]);
        }

        // CREATE POD
        const podId = '00000000-0000-0000-0000-000000000009';
        await db.query(`
        INSERT INTO pods (id, organization_id, code, name, city, state, capacity)
        VALUES ($1, $2, 'TEST-POD', 'Test Pod', 'Test City', 'OH', 30)
    `, [podId, orgId]);

        // CREATE SERVICE
        const serviceId = '00000000-0000-0000-0000-000000000099';
        await db.query(`INSERT INTO services (id, organization_id, name, code) VALUES ($1, $2, 'Test Service', 'T1001')`, [serviceId, orgId]);


        // MOCK USER
        const adminUser = {
            userId: '00000000-0000-0000-0000-000000000001',
            organizationId: orgId,
            role: UserRole.IT_ADMIN,
            permissions: [],
            attributes: [],
            sessionId: 'test-session',
            ipAddress: '127.0.0.1',
            userAgent: 'test-script'
        } as any;

        // Cincinnati Downtown (Client)
        const clientLat = 39.1031;
        const clientLng = -84.5120;

        // Northern Kentucky (Caregiver) - approx 2 miles away
        const caregiverLat = 39.0836;
        const caregiverLng = -84.5085;

        // Create Test Client
        const clientId = '00000000-0000-0000-0000-000000000002';

        await db.query(`
      INSERT INTO clients (id, organization_id, pod_id, client_code, first_name, last_name, address, latitude, longitude, primary_diagnosis, service_authorization)
      VALUES ($1, $2, $5, 'TEST_CLI', 'Test', 'Client', '{}', $3, $4, '{}', '{}')
    `, [clientId, orgId, clientLat, clientLng, podId]);

        // Create Test Caregiver
        const caregiverId = '00000000-0000-0000-0000-000000000003';

        await db.query(`
      INSERT INTO users (id, organization_id, email, first_name, last_name, role, status, latitude, longitude, is_active, phone, preferences, specializations)
      VALUES ($1, $2, 'test.cg@example.com', 'Test', 'Caregiver', 'caregiver', 'active', $3, $4, true, '555-555-5555', '{}', '{}')
    `, [caregiverId, orgId, caregiverLat, caregiverLng]);

        console.log('Test data created.');


        // 2. Test Distance Calculation via Matcher

        console.log('Testing Caregiver Matching & Distance...');
        const matches = await schedulingService.findCaregiverMatches(
            clientId,
            serviceId,
            { start: new Date(), end: new Date(Date.now() + 3600000) },
            { maximumDistance: 50 }
        );

        const match = matches.find(m => m.caregiverId === caregiverId);

        if (!match) {
            console.warn('Matches found:', matches);
            throw new Error('Test caregiver not found in matches!');
        }

        console.log(`Calculated Distance: ${match.travelDistance.toFixed(2)} miles`);

        // Expected distance approx 1.3 - 1.5 miles.
        if (match.travelDistance > 1.0 && match.travelDistance < 2.0) {
            console.log('SUCCESS: Distance calculation is accurate.');
        } else {
            console.error('FAILURE: Distance calculation is off. Expected ~1.4 miles.');
        }

        // 3. Test Mileage Tracking
        console.log('Testing Mileage Tracking...');
        const shiftId = '00000000-0000-0000-0000-000000000004';

        await db.query(`
      INSERT INTO shifts (id, organization_id, pod_id, client_id, caregiver_id, service_id, scheduled_start, scheduled_end, status)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + interval '1 hour', 'completed')
    `, [shiftId, orgId, podId, clientId, caregiverId, serviceId]);

        // Call trackMileage
        await schedulingService.trackMileage(shiftId, adminUser);

        // Verify Log
        const logResult = await db.query('SELECT * FROM mileage_logs WHERE shift_id = $1', [shiftId]);
        if (logResult.rows.length > 0) {
            const log = logResult.rows[0];
            console.log(`Mileage Logged: ${log.distance_miles} miles`);
            console.log('SUCCESS: Mileage log entry created.');
        } else {
            console.error('FAILURE: No mileage log found.');
        }

        console.log('Verification Complete.');

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verifySchedulingLogic();
