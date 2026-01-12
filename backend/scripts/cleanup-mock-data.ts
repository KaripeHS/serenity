/**
 * Cleanup Mock Data Script
 * Removes mock users, clients, caregivers seeded for development
 * Run with: npx tsx scripts/cleanup-mock-data.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'; // Serenity Care Partners

// Users to keep (real accounts)
const KEEP_EMAILS = [
  'admin@serenity.local',
  'test@test.com',
  'recruiter@test.com'
];

const KEEP_EMAIL_DOMAINS = [
  '@serenitycarepartners.com',
  '@serenitycareoh.com'
];

const KEEP_ROLES = ['super_admin', 'system_admin'];

async function cleanupMockData() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  console.log('🔌 Connecting to database...');

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Connected\n');

    console.log('============================================================');
    console.log('Mock Data Cleanup Script');
    console.log('============================================================\n');

    // Step 1: Count current data
    console.log('📊 Current data counts:');

    const userCount = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE organization_id = $1`,
      [ORG_ID]
    );
    console.log(`   Users: ${userCount.rows[0].count}`);

    const clientCount = await pool.query(
      `SELECT COUNT(*) as count FROM clients WHERE organization_id = $1`,
      [ORG_ID]
    );
    console.log(`   Clients: ${clientCount.rows[0].count}`);

    const caregiverCount = await pool.query(
      `SELECT COUNT(*) as count FROM caregivers WHERE organization_id = $1`,
      [ORG_ID]
    );
    console.log(`   Caregivers: ${caregiverCount.rows[0].count}`);

    console.log('\n🗑️  Starting cleanup...\n');

    // First, identify mock users that we're going to delete
    const mockUsersResult = await pool.query(`
      SELECT id, email FROM users
      WHERE organization_id = $1
        AND email NOT LIKE '%@serenitycarepartners.com%'
        AND email NOT LIKE '%@serenitycareoh.com%'
        AND email NOT IN ('admin@serenity.local', 'test@test.com', 'recruiter@test.com')
        AND role NOT IN ('super_admin', 'system_admin')
    `, [ORG_ID]);

    const mockUserIds = mockUsersResult.rows.map(u => u.id);
    console.log(`📋 Found ${mockUserIds.length} mock users to remove`);

    if (mockUserIds.length > 0) {
      // Step 2: Remove audit events for mock users (FK constraint)
      const auditResult = await pool.query(`
        DELETE FROM audit_events
        WHERE user_id = ANY($1)
        RETURNING id
      `, [mockUserIds]);
      console.log(`✅ Removed ${auditResult.rowCount} audit events for mock users`);

      // Step 3: Remove caregivers linked to mock users (FK constraint)
      const caregiverResult = await pool.query(`
        DELETE FROM caregivers
        WHERE user_id = ANY($1)
        RETURNING id
      `, [mockUserIds]);
      console.log(`✅ Removed ${caregiverResult.rowCount} mock caregivers`);

      // Step 4: Remove notifications for mock users (if exists)
      try {
        const notifResult = await pool.query(`
          DELETE FROM notifications
          WHERE user_id = ANY($1)
          RETURNING id
        `, [mockUserIds]);
        console.log(`✅ Removed ${notifResult.rowCount} notifications for mock users`);
      } catch (e) {
        // Table might not exist
      }

      // Step 5: Remove mock users
      const userResult = await pool.query(`
        DELETE FROM users
        WHERE id = ANY($1)
        RETURNING id, email, role
      `, [mockUserIds]);
      console.log(`✅ Removed ${userResult.rowCount} mock users`);
    }

    // Step 6: Remove all mock clients (no real clients yet)
    const clientResult = await pool.query(`
      DELETE FROM clients
      WHERE organization_id = $1
      RETURNING id
    `, [ORG_ID]);
    console.log(`✅ Removed ${clientResult.rowCount} mock clients`);

    // Show remaining data
    console.log('\n📋 Remaining users:');
    const remainingUsers = await pool.query(`
      SELECT email, role, status FROM users
      WHERE organization_id = $1
      ORDER BY role, email
    `, [ORG_ID]);

    remainingUsers.rows.forEach(u => {
      console.log(`   ${u.email} (${u.role}) - ${u.status}`);
    });

    const remainingCaregivers = await pool.query(
      `SELECT COUNT(*) as count FROM caregivers WHERE organization_id = $1`,
      [ORG_ID]
    );
    console.log(`\n📋 Remaining caregivers: ${remainingCaregivers.rows[0].count}`);

    const remainingClients = await pool.query(
      `SELECT COUNT(*) as count FROM clients WHERE organization_id = $1`,
      [ORG_ID]
    );
    console.log(`📋 Remaining clients: ${remainingClients.rows[0].count}`);

    console.log('\n============================================================');
    console.log('✅ Cleanup complete!');
    console.log('============================================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupMockData();
