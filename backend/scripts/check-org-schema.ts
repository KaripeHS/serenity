import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const result = await pool.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    ORDER BY ordinal_position
  `);
  console.log('Organizations table columns:');
  result.rows.forEach((r: any) => console.log('  -', r.column_name, '(' + r.data_type + ')'));
  await pool.end();
}

main();
