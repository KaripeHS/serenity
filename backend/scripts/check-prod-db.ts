import { Pool } from 'pg';

async function check() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:e1hk=R%5C4JIQ32tk.@34.30.6.35:5432/serenity'
  });

  try {
    // Check organizations
    const orgs = await pool.query('SELECT id, name FROM organizations');
    console.log('Organizations:', orgs.rows);

    // Check test patients
    const patients = await pool.query("SELECT client_code, organization_id FROM clients WHERE client_code LIKE 'TEST-%'");
    console.log('Test patients count:', patients.rows.length);
    if (patients.rows.length > 0) {
      console.log('Sample:', patients.rows.slice(0, 3));
    }

    // Check Clinical Director
    const users = await pool.query("SELECT email, organization_id, role FROM users WHERE role = 'clinical_director' OR email LIKE '%clinical%'");
    console.log('Clinical directors:', users.rows);

    await pool.end();
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

check();
