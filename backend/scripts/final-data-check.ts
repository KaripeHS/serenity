import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('============================================================');
  console.log('FINAL DATABASE STATE');
  console.log('============================================================\n');
  
  // Organizations
  const orgs = await pool.query('SELECT id, name, slug FROM organizations');
  console.log('ORGANIZATIONS:', orgs.rowCount);
  orgs.rows.forEach((o: any) => console.log('  -', o.name, '(' + o.slug + ')'));
  
  // Users
  const users = await pool.query('SELECT email, role, status FROM users ORDER BY role');
  console.log('\nUSERS:', users.rowCount);
  users.rows.forEach((u: any) => console.log('  -', u.email, '(' + u.role + ')', '-', u.status));
  
  // Caregivers  
  const caregivers = await pool.query('SELECT COUNT(*) as count FROM caregivers');
  console.log('\nCAREGIVERS:', caregivers.rows[0].count);
  
  // Clients
  const clients = await pool.query('SELECT COUNT(*) as count FROM clients');
  console.log('CLIENTS:', clients.rows[0].count);
  
  // Applicants
  const applicants = await pool.query("SELECT id, first_name, last_name, email, status FROM applicants WHERE status IN ('new', 'pending') ORDER BY created_at DESC LIMIT 5");
  console.log('\nNEW/PENDING APPLICANTS:', applicants.rowCount);
  applicants.rows.forEach((a: any) => console.log('  -', a.first_name, a.last_name, '(' + a.email + ')', '-', a.status));
  
  console.log('\n============================================================');
  console.log('All mock data has been cleaned up!');
  console.log('============================================================');
  
  await pool.end();
}

main().catch(console.error);
