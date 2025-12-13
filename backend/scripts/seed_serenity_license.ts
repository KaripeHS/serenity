/**
 * Seed Script: Configure Serenity Care Partners License
 * Run this after migration 051 to set up the organization's current license
 *
 * Usage: npx tsx backend/scripts/seed_serenity_license.ts
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function seedSerenityLicense() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();

    console.log('🏢 Finding Serenity Care Partners organization...');

    // Find the organization
    const orgResult = await client.query(`
      SELECT id, name FROM organizations
      WHERE name ILIKE '%serenity%' OR name ILIKE '%care%partners%'
      LIMIT 1
    `);

    if (orgResult.rows.length === 0) {
      console.log('⚠️  Organization not found. Creating placeholder...');

      // Create the organization if it doesn't exist
      const newOrg = await client.query(`
        INSERT INTO organizations (name, status, created_at)
        VALUES ('Serenity Care Partners', 'active', NOW())
        RETURNING id, name
      `);
      orgResult.rows.push(newOrg.rows[0]);
    }

    const org = orgResult.rows[0];
    console.log(`✅ Found organization: ${org.name} (${org.id})`);

    // Check if license already exists
    const existingLicense = await client.query(`
      SELECT id FROM organization_licenses
      WHERE organization_id = $1 AND license_type = 'non_medical_home_health'
    `, [org.id]);

    if (existingLicense.rows.length > 0) {
      console.log('⚠️  Non-Medical Home Health license already exists for this organization');
      console.log('   Updating to ensure it is active...');

      await client.query(`
        UPDATE organization_licenses
        SET status = 'active', updated_at = NOW()
        WHERE organization_id = $1 AND license_type = 'non_medical_home_health'
      `, [org.id]);
    } else {
      console.log('📝 Adding Non-Medical Home Health License...');

      await client.query(`
        INSERT INTO organization_licenses (
          organization_id,
          license_type,
          license_number,
          issuing_authority,
          status,
          renewal_reminder_days,
          notes
        ) VALUES (
          $1,
          'non_medical_home_health',
          'PENDING_ENTRY',
          'ODH',
          'active',
          90,
          'Non-Medical Home Health Services License from Ohio Department of Health (ODH). Authorizes personal care, homemaker, respite, and errand services.'
        )
      `, [org.id]);
    }

    console.log('✅ Non-Medical Home Health License configured!');
    console.log('');
    console.log('📋 Services now authorized:');
    console.log('   - T1019: Personal Care');
    console.log('   - S5130: Homemaker Services');
    console.log('   - S5150: Respite Care (In-Home)');
    console.log('   - ERRANDS: Errands and Escort');
    console.log('');
    console.log('🚫 Services NOT authorized (require additional licensing):');
    console.log('   - PASSPORT/Medicaid waiver services (need ODA certification)');
    console.log('   - DODD/HPC services (need DODD certification)');
    console.log('   - Skilled nursing (need Skilled Home Health license)');
    console.log('   - Transportation (need NMT certification)');
    console.log('');
    console.log('💡 TIP: View license opportunities at /admin/licenses/opportunities');

    client.release();
    await pool.end();

    console.log('');
    console.log('✅ Serenity license configuration complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedSerenityLicense();
