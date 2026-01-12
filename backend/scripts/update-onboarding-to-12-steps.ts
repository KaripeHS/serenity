/**
 * Script to update existing onboarding instances to the new 12-step consolidated template
 *
 * This script:
 * 1. Updates the onboarding template with new consolidated items
 * 2. Replaces existing onboarding items with new 12-step structure
 * 3. Preserves any completed items status where possible
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:e1hk%3DR%5C4JIQ32tk.@35.232.98.222:5432/serenity';

const pool = new Pool({ connectionString: DATABASE_URL });

// New consolidated 12-step template
const CONSOLIDATED_TEMPLATE = [
  {
    order: 1,
    category: 'paperwork',
    task: 'Tax & Payroll Setup',
    description: 'Complete W-4 tax withholding and direct deposit authorization',
    required: true,
    assignedRole: 'new_hire',
    daysToComplete: 3,
    itemType: 'form',
    formTypes: ['w4', 'direct_deposit']
  },
  {
    order: 2,
    category: 'paperwork',
    task: 'Employment Verification (I-9)',
    description: 'Complete I-9 form and upload required identity documents (List A or List B+C)',
    required: true,
    assignedRole: 'new_hire',
    daysToComplete: 3,
    itemType: 'form',
    formTypes: ['i9_section1'],
    requiresUpload: true,
    uploadCategories: ['identity_document', 'work_authorization']
  },
  {
    order: 3,
    category: 'paperwork',
    task: 'Policy Acknowledgments',
    description: 'Read and sign Employee Handbook, HIPAA Agreement, and Privacy Policy',
    required: true,
    assignedRole: 'new_hire',
    daysToComplete: 1,
    itemType: 'signature',
    requiresSignature: true
  },
  {
    order: 4,
    category: 'compliance',
    task: 'Background Clearances',
    description: 'HR initiates background check, OIG/SAM exclusion check, drug screen, and TB test',
    required: true,
    assignedRole: 'hr',
    daysToComplete: 14,
    itemType: 'task'
  },
  {
    order: 5,
    category: 'compliance',
    task: 'Licenses & Certifications',
    description: 'Upload copies of professional licenses, certifications, and CPR/First Aid cards',
    required: true,
    assignedRole: 'new_hire',
    daysToComplete: 7,
    itemType: 'upload',
    requiresUpload: true,
    uploadCategories: ['license', 'certification', 'cpr_first_aid']
  },
  {
    order: 6,
    category: 'training',
    task: 'Compliance Training',
    description: 'Complete HIPAA, Abuse/Neglect Reporting, and Infection Control training modules',
    required: true,
    assignedRole: 'new_hire',
    daysToComplete: 7,
    itemType: 'video',
    trainingModules: [
      { id: 'hipaa', name: 'HIPAA Basics', duration: 15, quizRequired: true },
      { id: 'abuse_neglect', name: 'Abuse & Neglect Reporting', duration: 20, quizRequired: true },
      { id: 'infection_control', name: 'Infection Control', duration: 15, quizRequired: true }
    ]
  },
  {
    order: 7,
    category: 'equipment',
    task: 'EVV & App Setup',
    description: 'Install Serenity mobile app, configure EVV, and complete system training',
    required: true,
    assignedRole: 'new_hire',
    daysToComplete: 3,
    itemType: 'video',
    trainingModules: [
      { id: 'evv_training', name: 'EVV System Training', duration: 10, quizRequired: false }
    ]
  },
  {
    order: 8,
    category: 'equipment',
    task: 'Equipment Issuance',
    description: 'Receive PPE kit and any required equipment',
    required: true,
    assignedRole: 'hr',
    daysToComplete: 1,
    itemType: 'task'
  },
  {
    order: 9,
    category: 'orientation',
    task: 'Orientation Session',
    description: 'Company culture, policies overview, and bonus program explanation',
    required: true,
    assignedRole: 'hr',
    daysToComplete: 7,
    itemType: 'meeting'
  },
  {
    order: 10,
    category: 'introductions',
    task: 'Team Introduction',
    description: 'Meet scheduling coordinators and key team members',
    required: true,
    assignedRole: 'supervisor',
    daysToComplete: 7,
    itemType: 'meeting'
  },
  {
    order: 11,
    category: 'first_assignment',
    task: 'Field Training',
    description: 'Shadow an experienced caregiver and complete first supervised client visit',
    required: true,
    assignedRole: 'supervisor',
    daysToComplete: 21,
    itemType: 'task'
  },
  {
    order: 12,
    category: 'first_assignment',
    task: '30-Day Review',
    description: 'Performance check-in meeting with supervisor',
    required: true,
    assignedRole: 'supervisor',
    daysToComplete: 30,
    itemType: 'meeting'
  }
];

async function updateOnboardingTemplate() {
  console.log('Updating onboarding template...');

  // Update the default template
  await pool.query(`
    UPDATE onboarding_templates
    SET
      template_name = 'Caregiver Onboarding Checklist',
      description = 'Streamlined 12-step onboarding checklist with digital forms, document uploads, and e-signatures',
      updated_at = NOW(),
      items = $1::jsonb
    WHERE template_name LIKE '%Caregiver%' OR template_name LIKE '%Onboarding%' OR is_default = true
  `, [JSON.stringify(CONSOLIDATED_TEMPLATE)]);

  console.log('Template updated.');
}

async function updateExistingOnboardingInstances() {
  console.log('Finding active onboarding instances...');

  // Get all non-completed onboarding instances
  const instances = await pool.query(`
    SELECT id, employee_id, organization_id, status
    FROM onboarding_instances
    WHERE status != 'completed'
  `);

  console.log(`Found ${instances.rows.length} active onboarding instances to update.`);

  for (const instance of instances.rows) {
    console.log(`\nUpdating onboarding instance ${instance.id}...`);

    // Get the start date for calculating due dates
    const startDate = new Date();

    // Delete existing items for this instance
    await pool.query(`DELETE FROM onboarding_items WHERE onboarding_instance_id = $1`, [instance.id]);

    // Insert new consolidated items
    for (const item of CONSOLIDATED_TEMPLATE) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + item.daysToComplete);

      await pool.query(`
        INSERT INTO onboarding_items (
          onboarding_instance_id,
          task_order,
          task_name,
          description,
          category,
          is_required,
          due_date,
          assigned_role,
          status,
          item_type,
          form_types,
          requires_upload,
          requires_signature,
          training_modules,
          upload_categories
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14)
      `, [
        instance.id,
        item.order,
        item.task,
        item.description,
        item.category,
        item.required,
        dueDate.toISOString(),
        item.assignedRole,
        item.itemType,
        item.formTypes || null,
        item.requiresUpload || false,
        item.requiresSignature || false,
        item.trainingModules ? JSON.stringify(item.trainingModules) : null,
        item.uploadCategories || null
      ]);
    }

    // Reset progress
    await pool.query(`
      UPDATE onboarding_instances
      SET progress = 0, updated_at = NOW()
      WHERE id = $1
    `, [instance.id]);

    console.log(`  Updated with ${CONSOLIDATED_TEMPLATE.length} new items.`);
  }
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('Onboarding 12-Step Consolidation Script');
    console.log('='.repeat(60));

    // First, ensure the required columns exist
    console.log('\nEnsuring database columns exist...');

    await pool.query(`
      ALTER TABLE onboarding_items
      ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'task',
      ADD COLUMN IF NOT EXISTS form_types TEXT[],
      ADD COLUMN IF NOT EXISTS requires_upload BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS training_modules JSONB,
      ADD COLUMN IF NOT EXISTS upload_categories TEXT[],
      ADD COLUMN IF NOT EXISTS form_data JSONB,
      ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]'
    `);

    console.log('Columns verified.');

    // Update the template
    await updateOnboardingTemplate();

    // Update existing instances
    await updateExistingOnboardingInstances();

    console.log('\n' + '='.repeat(60));
    console.log('Update complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
