/**
 * Database Creation Script
 * Creates the serenity_erp database if it doesn't exist
 * Supports multiple authentication methods
 */

import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function tryConnection(config: PoolConfig, label: string): Promise<Pool | null> {
  try {
    const pool = new Pool(config);
    await pool.query('SELECT 1');
    console.log(`✅ Connected using ${label}`);
    return pool;
  } catch (e) {
    return null;
  }
}

async function createDatabase() {
  console.log('🔌 Connecting to PostgreSQL...');

  // Try different authentication methods
  const configs: { config: PoolConfig; label: string }[] = [
    // Trust authentication (no password)
    {
      config: { host: 'localhost', port: 5432, user: 'postgres', database: 'postgres' },
      label: 'trust auth (no password)'
    },
    // Common passwords
    {
      config: { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
      label: 'password: postgres'
    },
    {
      config: { host: 'localhost', port: 5432, user: 'postgres', password: 'password', database: 'postgres' },
      label: 'password: password'
    },
    {
      config: { host: 'localhost', port: 5432, user: 'postgres', password: 'admin', database: 'postgres' },
      label: 'password: admin'
    },
    {
      config: { host: 'localhost', port: 5432, user: 'postgres', password: '123456', database: 'postgres' },
      label: 'password: 123456'
    },
    {
      config: { host: 'localhost', port: 5432, user: 'postgres', password: 'Postgres123', database: 'postgres' },
      label: 'password: Postgres123'
    },
    // Windows SSPI authentication
    {
      config: { host: 'localhost', port: 5432, database: 'postgres' },
      label: 'SSPI/Windows auth'
    },
  ];

  let adminPool: Pool | null = null;
  let workingConfig: PoolConfig | null = null;

  for (const { config, label } of configs) {
    console.log(`   Trying ${label}...`);
    adminPool = await tryConnection(config, label);
    if (adminPool) {
      workingConfig = config;
      break;
    }
  }

  if (!adminPool || !workingConfig) {
    console.error('\n❌ Could not connect to PostgreSQL with any method.');
    console.log('\n💡 Please try one of the following:');
    console.log('   1. Set the postgres password: ALTER USER postgres PASSWORD \'yourpassword\';');
    console.log('   2. Update pg_hba.conf to use "trust" for local connections');
    console.log('   3. Set PGPASSWORD environment variable before running this script');
    console.log('\n   PostgreSQL data directory is typically at:');
    console.log('   C:\\Program Files\\PostgreSQL\\17\\data\\pg_hba.conf');
    process.exit(1);
  }

  try {
    // Check if serenity_erp database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'serenity_erp'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating serenity_erp database...');
      await adminPool.query('CREATE DATABASE serenity_erp');
      console.log('✅ Database serenity_erp created successfully');
    } else {
      console.log('✅ Database serenity_erp already exists');
    }

    await adminPool.end();

    // Connect to the new database
    const appConfig = { ...workingConfig, database: 'serenity_erp' };
    const appPool = new Pool(appConfig);

    console.log('🔧 Enabling uuid-ossp extension...');
    await appPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ uuid-ossp extension enabled');

    await appPool.end();

    // Build the working DATABASE_URL
    const password = workingConfig.password || '';
    const user = workingConfig.user || 'postgres';
    const host = workingConfig.host || 'localhost';
    const port = workingConfig.port || 5432;

    const dbUrl = password
      ? `postgresql://${user}:${password}@${host}:${port}/serenity_erp`
      : `postgresql://${user}@${host}:${port}/serenity_erp`;

    console.log('\n🎉 Database setup complete!');
    console.log('\n📝 Update your .env file with:');
    console.log(`   DATABASE_URL=${dbUrl}`);
    console.log('\n📝 Next step: Run migrations with "npx tsx src/database/run-migrations.ts"');

  } catch (error) {
    const err = error as Error;
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  }
}

createDatabase();
