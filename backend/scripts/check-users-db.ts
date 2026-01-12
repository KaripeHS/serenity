import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SERENITY_ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

async function main() {
  console.log('=== ALL USERS IN DATABASE ===');
  const users = await pool.query('SELECT id, email, role, status, organization_id FROM users');
  console.log('Total users in DB:', users.rowCount);
  users.rows.forEach((u: any) => console.log('  -', u.email, '|', u.role, '|', u.status, '| org:', u.organization_id?.substring(0,8)));
  
  console.log('\n=== SERENITY ORG USERS ===');
  const serenityUsers = await pool.query(
    'SELECT id, email, role, status FROM users WHERE organization_id = $1',
    [SERENITY_ORG_ID]
  );
  console.log('Users in Serenity org:', serenityUsers.rowCount);
  serenityUsers.rows.forEach((u: any) => console.log('  -', u.email, '|', u.role, '|', u.status));
  
  console.log('\n=== ACTIVE USERS COUNT ===');
  const activeUsers = await pool.query(
    "SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND status = 'active'",
    [SERENITY_ORG_ID]
  );
  console.log('Active users in Serenity org:', activeUsers.rows[0].count);
  
  await pool.end();
}

main();
