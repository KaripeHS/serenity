import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function createMissingOnboarding() {
  // Get the template
  const templateResult = await pool.query(`
    SELECT id, items, default_duration_days
    FROM onboarding_templates
    WHERE is_active = TRUE
    LIMIT 1
  `);
  const template = templateResult.rows[0];
  console.log('Template:', template.id, 'Items:', template.items?.length);

  // Get hired applicants without onboarding instances, joining with users to get valid employee_id
  const hiredApplicants = await pool.query(`
    SELECT a.id, a.first_name, a.last_name, a.email, a.position_applied_for,
           a.organization_id, u.id as valid_employee_id
    FROM applicants a
    JOIN users u ON u.email = a.email AND u.organization_id = a.organization_id
    WHERE a.status = 'hired'
      AND NOT EXISTS (
        SELECT 1 FROM onboarding_instances oi
        WHERE oi.employee_id = u.id
      )
  `);

  console.log('\n=== HIRED APPLICANTS WITHOUT ONBOARDING ===');
  console.log(JSON.stringify(hiredApplicants.rows, null, 2));

  // Create onboarding for each
  for (const applicant of hiredApplicants.rows) {
    console.log(`\nCreating onboarding for: ${applicant.first_name} ${applicant.last_name}`);

    const items = template.items || [];

    // Check if onboarding already exists
    const existingCheck = await pool.query(
      'SELECT id FROM onboarding_instances WHERE employee_id = $1',
      [applicant.valid_employee_id]
    );

    if (existingCheck.rows.length > 0) {
      console.log('  Skipped (already exists)');
      continue;
    }

    // Create onboarding instance
    const result = await pool.query(`
      INSERT INTO onboarding_instances (
        organization_id, employee_id, template_id,
        new_hire_name, position_title, status, total_items
      ) VALUES ($1, $2, $3, $4, $5, 'not_started', $6)
      RETURNING id
    `, [
      applicant.organization_id,
      applicant.valid_employee_id,
      template.id,
      `${applicant.first_name} ${applicant.last_name}`,
      applicant.position_applied_for,
      items.length
    ]);

    const onboardingId = result.rows[0].id;
    console.log(`  Created onboarding instance: ${onboardingId}`);

    // Create individual items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await pool.query(`
        INSERT INTO onboarding_items (
          onboarding_instance_id, item_order, category, task_name,
          description, is_required, assigned_role, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      `, [
        onboardingId,
        i + 1,
        item.category || 'General',
        item.task_name || item.name || `Task ${i + 1}`,
        item.description || '',
        item.is_required ?? true,
        item.assigned_role || 'hr'
      ]);
    }
    console.log(`  Created ${items.length} onboarding items`);
  }

  await pool.end();
  console.log('\nDone!');
}

createMissingOnboarding().catch(console.error);
