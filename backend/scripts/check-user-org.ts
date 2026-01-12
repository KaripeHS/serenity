import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Check what organization_id the admin user has
  const user = await pool.query(
    "SELECT id, email, organization_id FROM users WHERE email = 'admin@serenitycarepartners.com'"
  );
  
  if (user.rowCount && user.rowCount > 0) {
    console.log('Admin user organization_id:', user.rows[0].organization_id);
    
    // Check how many users are in THAT org (should be 1)
    const usersInOrg = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND status = 'active'",
      [user.rows[0].organization_id]
    );
    console.log('Active users in admin org:', usersInOrg.rows[0].count);
  } else {
    console.log('Admin user not found');
  }
  
  await pool.end();
}

main();
