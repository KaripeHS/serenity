/**
 * Initial Data Seed Script
 * Creates founder user and sample data for testing
 *
 * Run with: npx tsx src/database/seeds/seed-initial-data.ts
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedInitialData() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  console.log('🌱 Seeding initial data...\n');

  try {
    // Check if organization exists
    const orgCheck = await pool.query(
      "SELECT id FROM organizations WHERE slug = 'serenity-care-partners'"
    );

    let orgId: string;
    if (orgCheck.rows.length === 0) {
      // Create organization if it doesn't exist
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, slug, type, status, settings)
        VALUES (
          'Serenity Care Partners',
          'serenity-care-partners',
          'home_health',
          'active',
          '{"timezone": "America/New_York", "evv_provider": "ohio_medicaid"}'::jsonb
        )
        RETURNING id
      `);
      orgId = orgResult.rows[0].id;
      console.log('✅ Organization created:', orgId);
    } else {
      orgId = orgCheck.rows[0].id;
      console.log('✅ Organization exists:', orgId);
    }

    // Create pods if they don't exist
    const podCheck = await pool.query("SELECT id FROM pods WHERE code = 'CIN-A'");

    let cinAPodId: string, cinBPodId: string, colAPodId: string;

    if (podCheck.rows.length === 0) {
      const podResult = await pool.query(`
        INSERT INTO pods (organization_id, code, name, city, state, capacity, status)
        VALUES
          ($1, 'CIN-A', 'Cincinnati Pod A', 'Cincinnati', 'OH', 35, 'active'),
          ($1, 'CIN-B', 'Cincinnati Pod B', 'Cincinnati', 'OH', 35, 'active'),
          ($1, 'COL-A', 'Columbus Pod A', 'Columbus', 'OH', 35, 'active')
        RETURNING id, code
      `, [orgId]);

      cinAPodId = podResult.rows.find(r => r.code === 'CIN-A').id;
      cinBPodId = podResult.rows.find(r => r.code === 'CIN-B').id;
      colAPodId = podResult.rows.find(r => r.code === 'COL-A').id;
      console.log('✅ Pods created');
    } else {
      const pods = await pool.query("SELECT id, code FROM pods WHERE code IN ('CIN-A', 'CIN-B', 'COL-A')");
      cinAPodId = pods.rows.find(r => r.code === 'CIN-A')?.id;
      cinBPodId = pods.rows.find(r => r.code === 'CIN-B')?.id;
      colAPodId = pods.rows.find(r => r.code === 'COL-A')?.id;
      console.log('✅ Pods exist');
    }

    // Create founder user
    const founderPassword = await bcrypt.hash('ChangeMe123!', 10);
    const founderResult = await pool.query(`
      INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status)
      VALUES ($1, 'founder@serenitycarepartners.com', $2, 'Admin', 'Founder', '+15135551234', 'founder', 'active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
      RETURNING id
    `, [orgId, founderPassword]);
    const founderId = founderResult.rows[0].id;
    console.log('✅ Founder user created/updated');

    // Create Pod Lead
    const podLeadPassword = await bcrypt.hash('PodLead123!', 10);
    const podLeadResult = await pool.query(`
      INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status)
      VALUES ($1, 'podlead@serenitycarepartners.com', $2, 'Sarah', 'Johnson', '+15135551235', 'field_supervisor', 'active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
      RETURNING id
    `, [orgId, podLeadPassword]);
    const podLeadId = podLeadResult.rows[0].id;
    console.log('✅ Pod Lead user created/updated');

    // Create sample caregivers
    const caregiverPassword = await bcrypt.hash('Caregiver123!', 10);

    const caregivers = [
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@serenitycarepartners.com', phone: '+15135552001' },
      { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@serenitycarepartners.com', phone: '+15135552002' },
      { firstName: 'Emily', lastName: 'Chen', email: 'emily.chen@serenitycarepartners.com', phone: '+15135552003' },
      { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@serenitycarepartners.com', phone: '+15135552004' },
      { firstName: 'Ashley', lastName: 'Davis', email: 'ashley.davis@serenitycarepartners.com', phone: '+15135552005' },
    ];

    const caregiverIds: string[] = [];

    for (const cg of caregivers) {
      const result = await pool.query(`
        INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'caregiver', 'active')
        ON CONFLICT (email) DO UPDATE SET password_hash = $3
        RETURNING id
      `, [orgId, cg.email, caregiverPassword, cg.firstName, cg.lastName, cg.phone]);
      caregiverIds.push(result.rows[0].id);
    }
    console.log('✅ Sample caregivers created/updated');

    // Assign users to pods
    if (cinAPodId) {
      // Pod lead to CIN-A
      await pool.query(`
        INSERT INTO user_pod_memberships (user_id, pod_id, role_in_pod, is_primary, status)
        VALUES ($1, $2, 'team_lead', true, 'active')
        ON CONFLICT (user_id, pod_id) DO UPDATE SET role_in_pod = 'team_lead', status = 'active'
      `, [podLeadId, cinAPodId]);

      // First 3 caregivers to CIN-A
      for (let i = 0; i < 3 && i < caregiverIds.length; i++) {
        await pool.query(`
          INSERT INTO user_pod_memberships (user_id, pod_id, role_in_pod, is_primary, status)
          VALUES ($1, $2, 'caregiver', true, 'active')
          ON CONFLICT (user_id, pod_id) DO UPDATE SET status = 'active'
        `, [caregiverIds[i], cinAPodId]);
      }
    }

    if (cinBPodId && caregiverIds.length > 3) {
      // Remaining caregivers to CIN-B
      for (let i = 3; i < caregiverIds.length; i++) {
        await pool.query(`
          INSERT INTO user_pod_memberships (user_id, pod_id, role_in_pod, is_primary, status)
          VALUES ($1, $2, 'caregiver', true, 'active')
          ON CONFLICT (user_id, pod_id) DO UPDATE SET status = 'active'
        `, [caregiverIds[i], cinBPodId]);
      }
    }
    console.log('✅ Pod memberships assigned');

    // Create sample clients
    const clients = [
      { code: 'SCP-001', firstName: 'Robert', lastName: 'Smith', medicaid: '123456789A', dob: '1945-03-15' },
      { code: 'SCP-002', firstName: 'Dorothy', lastName: 'Johnson', medicaid: '234567890B', dob: '1938-07-22' },
      { code: 'SCP-003', firstName: 'William', lastName: 'Brown', medicaid: '345678901C', dob: '1950-11-08' },
      { code: 'SCP-004', firstName: 'Margaret', lastName: 'Davis', medicaid: '456789012D', dob: '1942-05-30' },
      { code: 'SCP-005', firstName: 'Thomas', lastName: 'Wilson', medicaid: '567890123E', dob: '1948-09-12' },
    ];

    const clientIds: string[] = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const podId = i < 3 ? cinAPodId : cinBPodId;
      const address = {
        street: `${100 + i} Main Street`,
        city: 'Cincinnati',
        state: 'OH',
        zip: '45202'
      };

      const result = await pool.query(`
        INSERT INTO clients (organization_id, pod_id, client_code, first_name, last_name, date_of_birth, medicaid_number, address, status, evv_consent_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 'signed')
        ON CONFLICT (client_code) DO UPDATE SET
          pod_id = $2, first_name = $4, last_name = $5
        RETURNING id
      `, [orgId, podId, client.code, client.firstName, client.lastName, client.dob, client.medicaid, JSON.stringify(address)]);
      clientIds.push(result.rows[0].id);
    }
    console.log('✅ Sample clients created/updated');

    // Create sample shifts for today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Clear old sample shifts
    await pool.query(`
      DELETE FROM shifts WHERE notes LIKE '%[SAMPLE]%'
    `);

    // Create shifts
    const shiftTemplates = [
      { cgIdx: 0, clientIdx: 0, startHour: 8, endHour: 12 },
      { cgIdx: 0, clientIdx: 1, startHour: 13, endHour: 17 },
      { cgIdx: 1, clientIdx: 1, startHour: 9, endHour: 13 },
      { cgIdx: 1, clientIdx: 2, startHour: 14, endHour: 18 },
      { cgIdx: 2, clientIdx: 0, startHour: 8, endHour: 11 },
      { cgIdx: 3, clientIdx: 3, startHour: 10, endHour: 14 },
      { cgIdx: 4, clientIdx: 4, startHour: 9, endHour: 13 },
    ];

    for (const template of shiftTemplates) {
      if (caregiverIds[template.cgIdx] && clientIds[template.clientIdx]) {
        const startTime = new Date(today);
        startTime.setHours(template.startHour, 0, 0, 0);

        const endTime = new Date(today);
        endTime.setHours(template.endHour, 0, 0, 0);

        const podId = template.clientIdx < 3 ? cinAPodId : cinBPodId;

        await pool.query(`
          INSERT INTO shifts (organization_id, pod_id, caregiver_id, client_id, scheduled_start, scheduled_end, status, service_code, notes)
          VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'T1019', '[SAMPLE] Auto-generated shift')
        `, [orgId, podId, caregiverIds[template.cgIdx], clientIds[template.clientIdx], startTime, endTime]);
      }
    }
    console.log('✅ Sample shifts created for today');

    // Create some certifications
    const certTypes = [
      { type: 'CPR', authority: 'American Red Cross', daysValid: 365 },
      { type: 'First Aid', authority: 'American Red Cross', daysValid: 365 },
      { type: 'STNA', authority: 'Ohio Board of Nursing', daysValid: 730 },
    ];

    for (let i = 0; i < caregiverIds.length; i++) {
      for (const cert of certTypes) {
        const issueDate = new Date();
        issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 180));

        const expirationDate = new Date(issueDate);
        expirationDate.setDate(expirationDate.getDate() + cert.daysValid);

        await pool.query(`
          INSERT INTO certifications (user_id, organization_id, certification_type, issuing_authority, issue_date, expiration_date, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'active')
          ON CONFLICT DO NOTHING
        `, [caregiverIds[i], orgId, cert.type, cert.authority, issueDate, expirationDate]);
      }
    }
    console.log('✅ Sample certifications created');

    console.log('\n========================================');
    console.log('🎉 Initial data seeding complete!');
    console.log('========================================\n');

    console.log('📝 Login credentials:');
    console.log('----------------------------------------');
    console.log('FOUNDER (full access):');
    console.log('   Email: founder@serenitycarepartners.com');
    console.log('   Password: ChangeMe123!');
    console.log('');
    console.log('POD LEAD (field supervisor):');
    console.log('   Email: podlead@serenitycarepartners.com');
    console.log('   Password: PodLead123!');
    console.log('');
    console.log('CAREGIVERS:');
    for (const cg of caregivers) {
      console.log(`   ${cg.firstName} ${cg.lastName}: ${cg.email}`);
    }
    console.log('   Password (all): Caregiver123!');
    console.log('----------------------------------------\n');

    console.log('📊 Created:');
    console.log(`   - 1 Organization`);
    console.log(`   - 3 Pods (CIN-A, CIN-B, COL-A)`);
    console.log(`   - ${2 + caregivers.length} Users (founder, pod lead, ${caregivers.length} caregivers)`);
    console.log(`   - ${clients.length} Clients`);
    console.log(`   - ${shiftTemplates.length} Shifts for today`);
    console.log(`   - ${caregivers.length * certTypes.length} Certifications\n`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedInitialData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
