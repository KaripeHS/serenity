import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// The correct organization ID used throughout the codebase
const SERENITY_ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

async function fixOrganization() {
  console.log('============================================================');
  console.log('Fix Organization Structure');
  console.log('============================================================\n');

  try {
    // Step 1: Check current state
    console.log('📊 Current organizations:');
    const orgs = await pool.query('SELECT id, name, slug, status FROM organizations');
    orgs.rows.forEach((o: any) => console.log('  -', o.id, '-', o.name));

    // Step 2: Get the test org ID
    const testOrg = await pool.query(
      "SELECT id FROM organizations WHERE name LIKE '%Harmony%' OR name LIKE '%Test%'"
    );

    let testOrgId: string | null = null;
    if (testOrg.rowCount && testOrg.rowCount > 0) {
      testOrgId = testOrg.rows[0].id;
    }

    // Step 3: Check if Serenity Care Partners exists
    const serenityExists = await pool.query(
      'SELECT id FROM organizations WHERE id = $1',
      [SERENITY_ORG_ID]
    );

    if (serenityExists.rowCount === 0) {
      console.log('\n✨ Creating Serenity Care Partners organization...');
      await pool.query(`
        INSERT INTO organizations (id, name, slug, type, status, settings, state, created_at, updated_at)
        VALUES ($1, 'Serenity Care Partners', 'serenity-care-partners', 'home_care', 'active', '{}', 'OH', NOW(), NOW())
      `, [SERENITY_ORG_ID]);
      console.log('✅ Created Serenity Care Partners');
    } else {
      console.log('\n✅ Serenity Care Partners already exists');
    }

    // Step 4: Migrate data from test org
    if (testOrgId) {
      console.log('\n🔄 Migrating data from test org to Serenity Care Partners...');

      // Migrate users
      const userResult = await pool.query(`
        UPDATE users SET organization_id = $1 WHERE organization_id = $2 RETURNING email
      `, [SERENITY_ORG_ID, testOrgId]);
      console.log(`  - Migrated ${userResult.rowCount} users`);

      // Migrate any other related data
      const tables = ['caregivers', 'clients', 'pods', 'job_requisitions', 'applicants', 'onboarding_templates', 'onboarding_instances', 'audit_events'];
      for (const table of tables) {
        try {
          const result = await pool.query(`UPDATE ${table} SET organization_id = $1 WHERE organization_id = $2`, [SERENITY_ORG_ID, testOrgId]);
          if (result.rowCount && result.rowCount > 0) {
            console.log(`  - Migrated ${result.rowCount} ${table}`);
          }
        } catch (e) {
          // Table might not exist or have no org column
        }
      }

      // Delete the test organization
      console.log('\n🗑️  Removing test organization...');
      await pool.query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
      console.log('✅ Removed Harmony Home Care (Test)');
    }

    // Step 5: Final state
    console.log('\n============================================================');
    console.log('FINAL STATE');
    console.log('============================================================\n');

    const finalOrgs = await pool.query('SELECT id, name, slug, status FROM organizations');
    console.log('Organizations:');
    finalOrgs.rows.forEach((o: any) => console.log('  -', o.name, '(' + o.slug + ') - ID:', o.id.substring(0, 8) + '...'));

    const finalUsers = await pool.query('SELECT email, role, organization_id FROM users');
    console.log('\nUsers:');
    finalUsers.rows.forEach((u: any) => console.log('  -', u.email, '(' + u.role + ')'));

    console.log('\n✅ Organization structure fixed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixOrganization();
