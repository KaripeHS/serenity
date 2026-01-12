import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SERENITY_ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

async function createTestRecruiter() {
  try {
    // Hash the password
    const password = 'Test1234!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = 'recruiter@test.com'"
    );
    
    if (existing.rowCount && existing.rowCount > 0) {
      // Update existing user
      await pool.query(`
        UPDATE users SET
          password_hash = $1,
          status = 'active',
          is_active = true,
          organization_id = $2
        WHERE email = 'recruiter@test.com'
      `, [passwordHash, SERENITY_ORG_ID]);
      console.log('✅ Test recruiter updated');
    } else {
      // Create new user with UUID
      await pool.query(`
        INSERT INTO users (
          id,
          organization_id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          status,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        uuidv4(),
        SERENITY_ORG_ID,
        'recruiter@test.com',
        passwordHash,
        'Test',
        'Recruiter',
        'recruiter',
        'active',
        true
      ]);
      console.log('✅ Test recruiter created');
    }
    
    console.log('   Email: recruiter@test.com');
    console.log('   Password: Test1234!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createTestRecruiter();
