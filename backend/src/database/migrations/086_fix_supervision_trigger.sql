-- Fix create_initial_supervision_schedule trigger function
-- It was incorrectly checking 'active = true' on users table, but users table uses 'status' enum ('active', etc.)

CREATE OR REPLACE FUNCTION create_initial_supervision_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('caregiver', 'aide') THEN
    INSERT INTO supervision_schedules (
      organization_id,
      caregiver_id,
      supervisor_id,
      frequency,
      next_visit_due_date
    )
    SELECT
      NEW.organization_id,
      NEW.id,
      -- FIX: Changed 'active = true' to "status = 'active'"
      (SELECT id FROM users WHERE organization_id = NEW.organization_id AND role = 'rn' AND status = 'active' LIMIT 1),
      'quarterly',
      CURRENT_DATE + INTERVAL '30 days' -- Initial visit due within 30 days
    WHERE NOT EXISTS (
      -- supervision_schedules apparently has 'active' column based on previous logs/files
      SELECT 1 FROM supervision_schedules WHERE caregiver_id = NEW.id AND active = true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
