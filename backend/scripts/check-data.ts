import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== ALL USERS ===');
  const users = await pool.query('SELECT id, email, role, organization_id FROM users ORDER BY organization_id, role');
  users.rows.forEach((u: any) => console.log(u.email, '-', u.role, '- org:', u.organization_id?.substring(0,8)));
  console.log('Total:', users.rowCount);
  
  console.log('\n=== ALL CAREGIVERS ===');
  const caregivers = await pool.query('SELECT id, employee_code, organization_id FROM caregivers');
  console.log('Count:', caregivers.rowCount);
  
  console.log('\n=== ALL CLIENTS ===');
  const clients = await pool.query('SELECT id, organization_id FROM clients');
  console.log('Count:', clients.rowCount);
  
  await pool.end();
}

main().catch(console.error);
