/**
 * Combined Migration and Seed Script for Cloud Run Job
 * Runs all migrations and seeds the database with initial data
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  console.log('🔌 Connecting to database...');

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
  } catch (err) {
    console.error('❌ Failed to connect to database:', (err as Error).message);
    process.exit(1);
  }

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Get list of already executed migrations
  const executedResult = await pool.query('SELECT filename FROM _migrations');
  const executedMigrations = new Set(executedResult.rows.map(r => r.filename));

  // Get migration files
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📁 Found ${files.length} migration files\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of files) {
    if (executedMigrations.has(file)) {
      console.log(`⏭️  Skipping (already run): ${file}`);
      skipCount++;
      continue;
    }

    console.log(`🔄 Running: ${file}`);

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query(
        'INSERT INTO _migrations (filename) VALUES ($1)',
        [file]
      );
      await pool.query('COMMIT');

      console.log(`✅ Completed: ${file}`);
      successCount++;
    } catch (err) {
      await pool.query('ROLLBACK');

      const error = err as Error;
      console.error(`❌ Failed: ${file}`);
      console.error(`   Error: ${error.message}`);

      if (error.message.includes('already exists')) {
        console.log('   (Object already exists - marking as complete)');
        await pool.query(
          'INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        );
        skipCount++;
      } else {
        errorCount++;
      }
    }
  }

  console.log('\n========================================');
  console.log(`✅ Migrations Successful: ${successCount}`);
  console.log(`⏭️  Migrations Skipped: ${skipCount}`);
  console.log(`❌ Migrations Errors: ${errorCount}`);
  console.log('========================================\n');

  return errorCount === 0;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  const orgId = uuidv4();
  const founderId = uuidv4();
  const podLeadId = uuidv4();
  const podId = uuidv4();

  try {
    // Ensure required auth tables exist (they may have been skipped)
    console.log('📋 Ensuring auth tables exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          refresh_token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          revoked_at TIMESTAMP WITH TIME ZONE,
          user_agent TEXT,
          ip_address INET,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id),
          organization_id UUID REFERENCES organizations(id),
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50),
          entity_id UUID,
          changes JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id)`);
    console.log('✅ Auth tables verified');

    // Check if founder user already exists (more specific check)
    const existingFounder = await pool.query(
      "SELECT id FROM users WHERE email = 'founder@serenitycarepartners.com'"
    );

    if (existingFounder.rows.length > 0) {
      console.log('⏭️  Test users already exist, skipping user creation');
      return true;
    }

    // Check if organization already exists
    const existingOrg = await pool.query(
      "SELECT id FROM organizations WHERE name = 'Serenity Care Partners'"
    );

    let useOrgId = orgId;
    if (existingOrg.rows.length > 0) {
      console.log('⏭️  Organization already exists, using existing org ID');
      useOrgId = existingOrg.rows[0].id;
    } else {
      // Create organization (with required slug field)
      console.log('📦 Creating organization...');
      await pool.query(`
        INSERT INTO organizations (id, name, slug, type, status, created_at, updated_at)
        VALUES ($1, 'Serenity Care Partners', 'serenity-care-partners', 'home_health', 'active', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [useOrgId]);
    }

    // Hash passwords
    const founderPassword = await bcrypt.hash('ChangeMe123!', 10);
    const podLeadPassword = await bcrypt.hash('PodLead123!', 10);
    const caregiverPassword = await bcrypt.hash('Caregiver123!', 10);

    // Create founder user (using phone instead of phone_number based on schema)
    console.log('👤 Creating founder user...');
    await pool.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, organization_id, created_at, updated_at)
      VALUES ($1, 'founder@serenitycarepartners.com', $2, 'Admin', 'Founder', '+15135551234', 'founder', 'active', $3, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [founderId, founderPassword, useOrgId]);

    // Create pod lead user
    console.log('👤 Creating pod lead user...');
    await pool.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, organization_id, created_at, updated_at)
      VALUES ($1, 'podlead@serenitycarepartners.com', $2, 'Sarah', 'Johnson', '+15135551235', 'field_supervisor', 'active', $3, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [podLeadId, podLeadPassword, useOrgId]);

    // Create a pod (with required city field)
    console.log('🏠 Creating pod...');
    await pool.query(`
      INSERT INTO pods (id, code, name, city, state, organization_id, status, created_at, updated_at)
      VALUES ($1, 'POD-NORTH', 'North Cincinnati Pod', 'Cincinnati', 'OH', $2, 'active', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [podId, useOrgId]);

    // Create sample caregivers
    console.log('👥 Creating sample caregivers...');
    const caregivers = [
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@serenitycarepartners.com', phone: '+15135552001' },
      { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@serenitycarepartners.com', phone: '+15135552002' },
      { firstName: 'Emily', lastName: 'Chen', email: 'emily.chen@serenitycarepartners.com', phone: '+15135552003' },
    ];

    for (const cg of caregivers) {
      const id = uuidv4();
      await pool.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, organization_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'caregiver', 'active', $7, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `, [id, cg.email, caregiverPassword, cg.firstName, cg.lastName, cg.phone, useOrgId]);
    }

    console.log('\n========================================');
    console.log('🎉 Database seeding completed!');
    console.log('========================================\n');
    console.log('Test Accounts Created:');
    console.log('  📧 Founder: founder@serenitycarepartners.com / ChangeMe123!');
    console.log('  📧 Pod Lead: podlead@serenitycarepartners.com / PodLead123!');
    console.log('  📧 Caregiver: maria.garcia@serenitycarepartners.com / Caregiver123!');
    console.log('');

    return true;
  } catch (err) {
    console.error('❌ Seeding error:', (err as Error).message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n');
  console.log('========================================');
  console.log('Serenity ERP Database Migration & Seed');
  console.log('========================================\n');

  try {
    const migrationsOk = await runMigrations();

    if (!migrationsOk) {
      console.log('⚠️  Some migrations failed, but continuing with seed...');
    }

    const seedOk = await seedDatabase();

    await pool.end();

    if (migrationsOk && seedOk) {
      console.log('✅ Database setup completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Database setup completed with some errors');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Fatal error:', (err as Error).message);
    await pool.end();
    process.exit(1);
  }
}

main();
