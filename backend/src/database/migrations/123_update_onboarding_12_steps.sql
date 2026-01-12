-- Migration: Update onboarding to consolidated 12-step template (v2)
-- This migration:
-- 1. Adds missing columns to onboarding_items for digital forms
-- 2. Updates the onboarding template to consolidated 12 steps
-- 3. Updates existing onboarding instances to new structure

-- Remove failed migration record to allow re-run
DELETE FROM _migrations WHERE filename = '123_update_onboarding_12_steps.sql';

-- Step 1: Add missing columns to onboarding_items
ALTER TABLE onboarding_items
ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'task',
ADD COLUMN IF NOT EXISTS form_types TEXT[],
ADD COLUMN IF NOT EXISTS requires_upload BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_modules JSONB,
ADD COLUMN IF NOT EXISTS upload_categories TEXT[],
ADD COLUMN IF NOT EXISTS form_data JSONB,
ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]';

-- Step 2: Update the default onboarding template
UPDATE onboarding_templates
SET
  template_name = 'Caregiver Onboarding Checklist',
  description = 'Streamlined 12-step onboarding checklist with digital forms, document uploads, and e-signatures',
  updated_at = NOW(),
  items = '[
    {
      "order": 1,
      "category": "paperwork",
      "task": "Tax & Payroll Setup",
      "description": "Complete W-4 tax withholding and direct deposit authorization",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "form",
      "formTypes": ["w4", "direct_deposit"]
    },
    {
      "order": 2,
      "category": "paperwork",
      "task": "Employment Verification (I-9)",
      "description": "Complete I-9 form and upload required identity documents (List A or List B+C)",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "form",
      "formTypes": ["i9_section1"],
      "requiresUpload": true,
      "uploadCategories": ["identity_document", "work_authorization"]
    },
    {
      "order": 3,
      "category": "paperwork",
      "task": "Policy Acknowledgments",
      "description": "Read and sign Employee Handbook, HIPAA Agreement, and Privacy Policy",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 1,
      "itemType": "signature",
      "requiresSignature": true
    },
    {
      "order": 4,
      "category": "compliance",
      "task": "Background Clearances",
      "description": "HR initiates background check, OIG/SAM exclusion check, drug screen, and TB test",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 14,
      "itemType": "task"
    },
    {
      "order": 5,
      "category": "compliance",
      "task": "Licenses & Certifications",
      "description": "Upload copies of professional licenses, certifications, and CPR/First Aid cards",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 7,
      "itemType": "upload",
      "requiresUpload": true,
      "uploadCategories": ["license", "certification", "cpr_first_aid"]
    },
    {
      "order": 6,
      "category": "training",
      "task": "Compliance Training",
      "description": "Complete HIPAA, Abuse/Neglect Reporting, and Infection Control training modules",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 7,
      "itemType": "video",
      "trainingModules": [
        { "id": "hipaa", "name": "HIPAA Basics", "duration": 15, "quizRequired": true },
        { "id": "abuse_neglect", "name": "Abuse & Neglect Reporting", "duration": 20, "quizRequired": true },
        { "id": "infection_control", "name": "Infection Control", "duration": 15, "quizRequired": true }
      ]
    },
    {
      "order": 7,
      "category": "equipment",
      "task": "EVV & App Setup",
      "description": "Install Serenity mobile app, configure EVV, and complete system training",
      "required": true,
      "assignedRole": "new_hire",
      "daysToComplete": 3,
      "itemType": "video",
      "trainingModules": [
        { "id": "evv_training", "name": "EVV System Training", "duration": 10, "quizRequired": false }
      ]
    },
    {
      "order": 8,
      "category": "equipment",
      "task": "Equipment Issuance",
      "description": "Receive PPE kit and any required equipment",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 1,
      "itemType": "task"
    },
    {
      "order": 9,
      "category": "orientation",
      "task": "Orientation Session",
      "description": "Company culture, policies overview, and bonus program explanation",
      "required": true,
      "assignedRole": "hr",
      "daysToComplete": 7,
      "itemType": "meeting"
    },
    {
      "order": 10,
      "category": "introductions",
      "task": "Team Introduction",
      "description": "Meet scheduling coordinators and key team members",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 7,
      "itemType": "meeting"
    },
    {
      "order": 11,
      "category": "first_assignment",
      "task": "Field Training",
      "description": "Shadow an experienced caregiver and complete first supervised client visit",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 21,
      "itemType": "task"
    },
    {
      "order": 12,
      "category": "first_assignment",
      "task": "30-Day Review",
      "description": "Performance check-in meeting with supervisor",
      "required": true,
      "assignedRole": "supervisor",
      "daysToComplete": 30,
      "itemType": "meeting"
    }
  ]'::jsonb
WHERE template_name LIKE '%Caregiver%' OR template_name LIKE '%Onboarding%';

-- Step 3: Create a function to update existing onboarding instances
CREATE OR REPLACE FUNCTION update_active_onboarding_to_12_steps()
RETURNS void AS $$
DECLARE
  instance_record RECORD;
  template_items JSONB;
  item JSONB;
  item_due_date DATE;
BEGIN
  -- Get the consolidated template
  SELECT items INTO template_items
  FROM onboarding_templates
  WHERE template_name LIKE '%Caregiver%' OR template_name LIKE '%Onboarding%'
  LIMIT 1;

  -- Loop through all non-completed onboarding instances
  FOR instance_record IN
    SELECT id, organization_id
    FROM onboarding_instances
    WHERE status != 'completed'
  LOOP
    -- Delete existing items for this instance
    DELETE FROM onboarding_items WHERE onboarding_instance_id = instance_record.id;

    -- Insert new consolidated items
    FOR item IN SELECT * FROM jsonb_array_elements(template_items)
    LOOP
      item_due_date := CURRENT_DATE + ((item->>'daysToComplete')::int);

      INSERT INTO onboarding_items (
        onboarding_instance_id,
        item_order,
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
      ) VALUES (
        instance_record.id,
        (item->>'order')::int,
        item->>'task',
        item->>'description',
        item->>'category',
        (item->>'required')::boolean,
        item_due_date,
        item->>'assignedRole',
        'pending',
        COALESCE(item->>'itemType', 'task'),
        CASE WHEN item->'formTypes' IS NOT NULL
          THEN ARRAY(SELECT jsonb_array_elements_text(item->'formTypes'))
          ELSE NULL
        END,
        COALESCE((item->>'requiresUpload')::boolean, false),
        COALESCE((item->>'requiresSignature')::boolean, false),
        item->'trainingModules',
        CASE WHEN item->'uploadCategories' IS NOT NULL
          THEN ARRAY(SELECT jsonb_array_elements_text(item->'uploadCategories'))
          ELSE NULL
        END
      );
    END LOOP;

    -- Reset progress
    UPDATE onboarding_instances
    SET completed_items = 0, completion_percentage = 0, total_items = 12, updated_at = NOW()
    WHERE id = instance_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT update_active_onboarding_to_12_steps();

-- Drop the function after use (cleanup)
DROP FUNCTION IF EXISTS update_active_onboarding_to_12_steps();
