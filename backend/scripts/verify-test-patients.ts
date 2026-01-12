import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://serenity_user:serenity_pass@localhost:5432/serenity_dev'
});

async function check() {
  // Check test patients
  const patients = await pool.query(`
    SELECT client_code, first_name, last_name, status, primary_diagnosis->>'primary' as diagnosis
    FROM clients
    WHERE client_code LIKE 'TEST-%'
    ORDER BY client_code
  `);
  console.log('\n=== TEST PATIENTS ===');
  patients.rows.forEach((p: any) => {
    console.log(`${p.client_code}: ${p.first_name} ${p.last_name} - Status: ${p.status}, Diagnosis: ${p.diagnosis || 'N/A'}`);
  });

  // Count related data
  const assessments = await pool.query(`
    SELECT COUNT(*) FROM client_assessments ca
    JOIN clients c ON ca.client_id = c.id
    WHERE c.client_code LIKE 'TEST-%'
  `);
  console.log(`\nAssessments: ${assessments.rows[0].count}`);

  const carePlans = await pool.query(`
    SELECT COUNT(*) FROM care_plans cp
    JOIN clients c ON cp.client_id = c.id
    WHERE c.client_code LIKE 'TEST-%'
  `);
  console.log(`Care Plans: ${carePlans.rows[0].count}`);

  const orders = await pool.query(`
    SELECT COUNT(*) FROM physician_orders po
    JOIN clients c ON po.client_id = c.id
    WHERE c.client_code LIKE 'TEST-%'
  `);
  console.log(`Physician Orders: ${orders.rows[0].count}`);

  const visits = await pool.query(`
    SELECT COUNT(*) FROM shifts s
    JOIN clients c ON s.client_id = c.id
    WHERE c.client_code LIKE 'TEST-%'
  `);
  console.log(`Visits/Shifts: ${visits.rows[0].count}`);

  await pool.end();
}
check().catch(console.error);
