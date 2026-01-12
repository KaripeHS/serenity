import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== CLIENT DETAILS ===');
  const clients = await pool.query('SELECT * FROM clients');
  clients.rows.forEach((c: any) => {
    console.log('ID:', c.id);
    console.log('Name:', c.first_name, c.last_name);
    console.log('Org ID:', c.organization_id);
    console.log('---');
  });
  
  await pool.end();
}

main().catch(console.error);
