-- Fix create_initial_supervision_schedule trigger function again
-- It was looking for role = 'rn', but the seed uses 'rn_case_manager', 'director_of_nursing', etc.

CREATE OR REPLACE FUNCTION create_initial_supervision_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('caregiver', 'aide', 'hha', 'cna', 'dsp_basic', 'dsp_med') THEN
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
      -- FIX: Checks for multiple clinical roles and status = 'active'
      (SELECT id FROM users 
       WHERE organization_id = NEW.organization_id 
       AND role IN ('rn', 'rn_case_manager', 'director_of_nursing', 'nursing_supervisor', 'clinical_director') 
       AND status = 'active' 
       LIMIT 1),
      'quarterly',
      CURRENT_DATE + INTERVAL '30 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM supervision_schedules WHERE caregiver_id = NEW.id AND active = true
    )
    -- Only insert if we found a supervisor!
    AND EXISTS (
       SELECT 1 FROM users 
       WHERE organization_id = NEW.organization_id 
       AND role IN ('rn', 'rn_case_manager', 'director_of_nursing', 'nursing_supervisor', 'clinical_director') 
       AND status = 'active'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
