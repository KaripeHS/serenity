import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== ALL ORGANIZATIONS ===');
  const orgs = await pool.query('SELECT id, name, slug, status FROM organizations ORDER BY name');
  orgs.rows.forEach((o: any) => console.log(o.id, '-', o.name, '(' + o.slug + ')', '-', o.status));
  console.log('Total:', orgs.rowCount);
  
  console.log('\n=== CLIENTS BY ORG ===');
  const clients = await pool.query('SELECT c.id, c.first_name, c.last_name, c.organization_id, o.name as org_name FROM clients c LEFT JOIN organizations o ON c.organization_id = o.id');
  clients.rows.forEach((c: any) => console.log(c.first_name, c.last_name, '- org:', c.org_name));
  
  await pool.end();
}

main().catch(console.error);
