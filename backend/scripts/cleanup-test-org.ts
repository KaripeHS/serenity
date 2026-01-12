import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SERENITY_ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';
const TEST_ORG_ID = '28069633-0d1a-4de9-b809-354d38874132';

async function cleanup() {
  console.log('============================================================');
  console.log('Cleanup Test Organization');
  console.log('============================================================\n');

  try {
    // Delete or migrate all FK references first
    const tablesWithOrgFK = [
      'branding_configs',
      'feature_flags', 
      'api_keys',
      'webhooks',
      'audit_events',
      'notifications',
      'caregivers',
      'clients',
      'pods',
      'job_requisitions',
      'applicants',
      'onboarding_templates',
      'onboarding_instances',
      'users'
    ];

    console.log('🔄 Migrating/cleaning FK references...\n');

    for (const table of tablesWithOrgFK) {
      try {
        // Try to update to Serenity org
        const result = await pool.query(
          `UPDATE ${table} SET organization_id = $1 WHERE organization_id = $2`,
          [SERENITY_ORG_ID, TEST_ORG_ID]
        );
        if (result.rowCount && result.rowCount > 0) {
          console.log(`  ✅ Migrated ${result.rowCount} rows in ${table}`);
        }
      } catch (e: any) {
        // If update fails (e.g., duplicate key), try delete
        try {
          const delResult = await pool.query(
            `DELETE FROM ${table} WHERE organization_id = $1`,
            [TEST_ORG_ID]
          );
          if (delResult.rowCount && delResult.rowCount > 0) {
            console.log(`  🗑️  Deleted ${delResult.rowCount} rows from ${table}`);
          }
        } catch (e2) {
          // Table might not have organization_id column
        }
      }
    }

    // Now delete the test organization
    console.log('\n🗑️  Removing test organization...');
    await pool.query('DELETE FROM organizations WHERE id = $1', [TEST_ORG_ID]);
    console.log('✅ Removed Harmony Home Care (Test)');

    // Final state
    console.log('\n============================================================');
    console.log('FINAL STATE');
    console.log('============================================================\n');

    const orgs = await pool.query('SELECT id, name, slug FROM organizations');
    console.log('Organizations:', orgs.rowCount);
    orgs.rows.forEach((o: any) => console.log('  -', o.name));

    const users = await pool.query('SELECT email, role FROM users');
    console.log('\nUsers:', users.rowCount);
    users.rows.forEach((u: any) => console.log('  -', u.email, '(' + u.role + ')'));

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

cleanup();
