import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== DELETING TEST CLIENTS ===\n');
  
  // Delete clients with non-existent organization references (orphaned test data)
  const result = await pool.query(`
    DELETE FROM clients 
    WHERE organization_id NOT IN (SELECT id FROM organizations)
    RETURNING id, first_name, last_name
  `);
  
  console.log('Deleted', result.rowCount, 'orphaned test clients:');
  result.rows.forEach((c: any) => console.log('  -', c.first_name, c.last_name));
  
  // Verify
  const remaining = await pool.query('SELECT COUNT(*) as count FROM clients');
  console.log('\nRemaining clients:', remaining.rows[0].count);
  
  await pool.end();
}

main().catch(console.error);
