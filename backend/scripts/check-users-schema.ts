import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsersSchema() {
  try {
    console.log('Connecting to database:', process.env.DATABASE_URL);

    // Get column information for users table
    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n=== USERS TABLE SCHEMA ===\n');
    console.log('Total columns:', result.rows.length);
    console.log('\nColumn Details:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Check specifically for is_active and pod_id
    const hasIsActive = result.rows.some(row => row.column_name === 'is_active');
    const hasPodId = result.rows.some(row => row.column_name === 'pod_id');

    console.log('\n=== SPECIFIC COLUMN CHECK ===');
    console.log('has is_active column:', hasIsActive);
    console.log('has pod_id column:', hasPodId);

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkUsersSchema();
