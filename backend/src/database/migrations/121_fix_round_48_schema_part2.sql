-- 1. Fix caregiver_training columns to match code
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caregiver_training' AND column_name='training_type_id') THEN
        ALTER TABLE caregiver_training RENAME COLUMN training_type_id TO course_id;
    END IF;
END $$;

ALTER TABLE caregiver_training ADD COLUMN IF NOT EXISTS hours INTEGER;

-- 2. Create courses view referencing training_types
-- Code expects: c.course_name from courses c
CREATE OR REPLACE VIEW courses AS 
SELECT 
    id, 
    name as course_name, 
    description, 
    category,
    organization_id
FROM training_types;

-- 3. Add frequency_months to training_types
ALTER TABLE training_types ADD COLUMN IF NOT EXISTS frequency_months INTEGER DEFAULT 12;

-- 4. Caregivers table exists, so we don't need a view.
-- Ensure valid structure if needed, but existing table structure seems fine for user_id referencing.
