import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Check all potential "staff" sources
  console.log('=== USERS TABLE (source of totalStaff) ===');
  const users = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
  console.log('All active users:', users.rows[0].count);
  
  const serenityUsers = await pool.query(
    "SELECT COUNT(*) as count FROM users WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039' AND status = 'active'"
  );
  console.log('Serenity org active users:', serenityUsers.rows[0].count);
  
  console.log('\n=== CAREGIVERS TABLE ===');
  const caregivers = await pool.query('SELECT COUNT(*) as count FROM caregivers');
  console.log('Total caregivers:', caregivers.rows[0].count);
  
  console.log('\n=== EMPLOYEES TABLE (if exists) ===');
  try {
    const employees = await pool.query('SELECT COUNT(*) as count FROM employees');
    console.log('Total employees:', employees.rows[0].count);
  } catch (e) {
    console.log('employees table does not exist');
  }
  
  console.log('\n=== STAFF TABLE (if exists) ===');
  try {
    const staff = await pool.query('SELECT COUNT(*) as count FROM staff');
    console.log('Total staff:', staff.rows[0].count);
  } catch (e) {
    console.log('staff table does not exist');
  }
  
  await pool.end();
}

main();
