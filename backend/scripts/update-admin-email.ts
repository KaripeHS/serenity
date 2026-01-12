import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateAdminEmail() {
  console.log('Updating admin email...\n');

  const result = await pool.query(`
    UPDATE users 
    SET email = 'admin@serenitycarepartners.com'
    WHERE email = 'admin@harmonyhomecare-test.com'
    RETURNING id, email, role
  `);

  if (result.rowCount && result.rowCount > 0) {
    console.log('✅ Updated user:', result.rows[0].email, '(' + result.rows[0].role + ')');
  } else {
    console.log('No user found with that email');
  }

  // Show final state
  const users = await pool.query('SELECT email, role, status FROM users');
  console.log('\nAll users:');
  users.rows.forEach((u: any) => console.log('  -', u.email, '(' + u.role + ')', '-', u.status));

  await pool.end();
}

updateAdminEmail();
