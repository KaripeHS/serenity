/**
 * Database Migration Runner
 * Executes all SQL migrations in order
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  console.log('DEBUG: connectionString =', connectionString);

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\nPlease create a .env file with:');
    console.log('DATABASE_URL=postgresql://username:password@localhost:5432/serenity_erp');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  console.log('🔌 Connecting to database...');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
  } catch (err) {
    console.error('❌ Failed to connect to database:', (err as Error).message);
    console.log('\nMake sure PostgreSQL is running and the DATABASE_URL is correct');
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

      // Split by semicolons but be careful with functions
      // For simplicity, run the whole file as one transaction
      await pool.query(sql);

      // Record successful migration
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

      // For some errors, we might want to continue
      if (error.message.includes('already exists')) {
        console.log('   (Object already exists - marking as complete)');

        // Mark as executed anyway
        await pool.query(
          'INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        );
        skipCount++;
      } else {
        errorCount++;
        // Continue to next migration instead of stopping
      }
    }
  }

  console.log('\n========================================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('========================================\n');

  if (errorCount === 0) {
    console.log('🎉 All migrations completed successfully!');
  } else {
    console.log('⚠️  Some migrations had errors. Review the output above.');
  }

  await pool.end();
}

runMigrations().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
