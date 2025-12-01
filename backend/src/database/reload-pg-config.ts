/**
 * Reload PostgreSQL configuration using SQL
 */

import { Pool } from 'pg';

async function reloadConfig() {
  // Try to connect with trust auth (no password)
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'postgres'
  });

  try {
    console.log('🔄 Reloading PostgreSQL configuration...');
    await pool.query('SELECT pg_reload_conf()');
    console.log('✅ Configuration reloaded successfully');

    // Test that we can now connect without password
    console.log('🔍 Testing connection...');
    const result = await pool.query('SELECT current_user, current_database()');
    console.log(`✅ Connected as ${result.rows[0].current_user} to ${result.rows[0].current_database}`);

    await pool.end();
    console.log('\n🎉 PostgreSQL is now configured for trust authentication (development mode)');
    console.log('⚠️  IMPORTANT: Before deploying to production, change pg_hba.conf back to scram-sha-256');

  } catch (error) {
    console.log('Configuration change will take effect after PostgreSQL service restart.');
    console.log('\nTo restart PostgreSQL manually (as Administrator):');
    console.log('  net stop postgresql-x64-17');
    console.log('  net start postgresql-x64-17');
    console.log('\nOr restart the "postgresql-x64-17" service from Windows Services.');
  }
}

reloadConfig();
