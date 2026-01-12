import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== CLEANING UP ORPHANED MOCK DATA ===\n');
  
  // Delete orphaned clients (null organization_id = test data)
  const clientResult = await pool.query(`
    DELETE FROM clients 
    WHERE organization_id IS NULL 
    RETURNING id, first_name, last_name
  `);
  console.log('Deleted orphaned clients:', clientResult.rowCount);
  clientResult.rows.forEach((c: any) => console.log('  -', c.first_name, c.last_name));
  
  // Check remaining data
  console.log('\n=== REMAINING DATA ===');
  const clients = await pool.query('SELECT COUNT(*) as count FROM clients');
  console.log('Clients:', clients.rows[0].count);
  
  const users = await pool.query('SELECT COUNT(*) as count FROM users');
  console.log('Users:', users.rows[0].count);
  
  const caregivers = await pool.query('SELECT COUNT(*) as count FROM caregivers');
  console.log('Caregivers:', caregivers.rows[0].count);
  
  await pool.end();
}

main().catch(console.error);
