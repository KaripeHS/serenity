-- Migration: 055_training_system.sql
-- Training Assignment and Completion Tracking
-- Supports Ohio compliance requirements (CPR/First Aid, EVV training, etc.)

-- ============================================
-- TRAINING TYPES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS training_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('orientation', 'clinical', 'safety', 'compliance', 'evv', 'specialized', 'general')),

  -- Requirements
  is_required BOOLEAN DEFAULT false,
  required_for_roles TEXT[], -- ['caregiver', 'nurse', 'all']
  required_for_services TEXT[], -- Service codes that require this training

  -- Validity period
  validity_months INTEGER, -- NULL = never expires
  renewal_reminder_days INTEGER DEFAULT 30,

  -- Delivery method
  delivery_method VARCHAR(50) DEFAULT 'online'
    CHECK (delivery_method IN ('online', 'in_person', 'both', 'self_study')),
  requires_in_person_assessment BOOLEAN DEFAULT false, -- CPR needs hands-on

  -- Content
  duration_minutes INTEGER,
  passing_score INTEGER, -- Minimum score to pass (if applicable)
  external_provider VARCHAR(200), -- e.g., "American Red Cross", "Ohio DODD"
  external_url TEXT,

  -- Ohio-specific
  ohio_compliance_code VARCHAR(50), -- Links to Ohio regulations

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for org-level training codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_types_org_code
  ON training_types(organization_id, code) WHERE organization_id IS NOT NULL;

-- Global training types (organization_id = NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_types_global_code
  ON training_types(code) WHERE organization_id IS NULL;

-- ============================================
-- TRAINING ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  training_type_id UUID NOT NULL REFERENCES training_types(id),

  -- Assignment details
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed', 'expired', 'waived')),

  -- Completion details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER, -- Test score if applicable
  attempts INTEGER DEFAULT 0,

  -- Expiration (if training expires)
  expires_at DATE,
  renewal_reminder_sent_at TIMESTAMPTZ,

  -- Verification for in-person training
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- Attachments
  certificate_url TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_assign_user ON training_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_assign_status ON training_assignments(status);
CREATE INDEX IF NOT EXISTS idx_training_assign_due ON training_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_training_assign_expires ON training_assignments(expires_at);
CREATE INDEX IF NOT EXISTS idx_training_assign_org ON training_assignments(organization_id);

-- ============================================
-- TRAINING PROGRESS TABLE (for multi-module training)
-- ============================================

CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL, -- External or internal module identifier
  module_name VARCHAR(200),

  -- Progress
  status VARCHAR(20) DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Quiz/assessment results
  score INTEGER,
  passed BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_progress_assignment ON training_progress(assignment_id);

-- ============================================
-- SEED DEFAULT TRAINING TYPES (Ohio Requirements)
-- ============================================

INSERT INTO training_types (code, name, description, category, is_required, required_for_roles, validity_months, delivery_method, requires_in_person_assessment, ohio_compliance_code)
VALUES
  ('ORIENTATION', 'New Hire Orientation', 'Company policies, procedures, and HIPAA compliance', 'orientation', true, ARRAY['all'], NULL, 'both', false, 'ODH-ORIENTATION'),

  ('CPR_FIRST_AID', 'CPR & First Aid Certification', 'American Heart Association or Red Cross certification with hands-on assessment', 'safety', true, ARRAY['caregiver', 'nurse'], 24, 'both', true, 'ODH-CPR'),

  ('HIPAA', 'HIPAA Privacy & Security', 'Protected health information handling and privacy requirements', 'compliance', true, ARRAY['all'], 12, 'online', false, 'HIPAA-ANNUAL'),

  ('EVV_TRAINING', 'Electronic Visit Verification Training', 'How to use EVV mobile app for clock-in/out, visit documentation', 'evv', true, ARRAY['caregiver'], NULL, 'online', false, 'DODD-EVV'),

  ('ABUSE_NEGLECT', 'Abuse, Neglect & Exploitation Prevention', 'Recognizing and reporting signs of abuse, neglect, and exploitation', 'compliance', true, ARRAY['caregiver', 'nurse'], 12, 'online', false, 'ODH-ANE'),

  ('INFECTION_CONTROL', 'Infection Control & Prevention', 'Standard precautions, hand hygiene, PPE usage', 'clinical', true, ARRAY['caregiver', 'nurse'], 12, 'online', false, 'ODH-IC'),

  ('MEDICATION_ASSIST', 'Medication Assistance', 'Assisting with self-administration of medications (non-nursing)', 'clinical', true, ARRAY['caregiver'], 12, 'both', true, 'ODH-MED-ASSIST'),

  ('DEMENTIA_CARE', 'Dementia & Alzheimers Care', 'Specialized care techniques for clients with cognitive impairment', 'specialized', false, ARRAY['caregiver'], 24, 'online', false, 'ODA-DEMENTIA'),

  ('FALL_PREVENTION', 'Fall Prevention & Safety', 'Home safety assessment, transfer techniques, fall risk reduction', 'safety', false, ARRAY['caregiver'], 24, 'online', false, 'ODA-FALLS'),

  ('CULTURAL_COMPETENCY', 'Cultural Competency', 'Providing culturally sensitive care to diverse populations', 'general', false, ARRAY['all'], 24, 'online', false, NULL),

  ('DODD_HPC', 'DODD HPC Provider Training', 'Required training for Homemaker Personal Care (DD waiver) services', 'specialized', false, ARRAY['caregiver'], NULL, 'both', true, 'DODD-HPC-CERT')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRAINING COMPLIANCE VIEW
-- ============================================

CREATE OR REPLACE VIEW training_compliance_status AS
SELECT
  u.id as user_id,
  u.organization_id,
  u.first_name || ' ' || u.last_name as employee_name,
  u.role,
  tt.code as training_code,
  tt.name as training_name,
  tt.is_required,
  ta.status as assignment_status,
  ta.due_date,
  ta.completed_at,
  ta.expires_at,
  CASE
    WHEN ta.id IS NULL AND tt.is_required THEN 'not_assigned'
    WHEN ta.status = 'completed' AND (ta.expires_at IS NULL OR ta.expires_at > CURRENT_DATE) THEN 'compliant'
    WHEN ta.status = 'completed' AND ta.expires_at <= CURRENT_DATE THEN 'expired'
    WHEN ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived') THEN 'overdue'
    WHEN ta.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'pending'
  END as compliance_status,
  CASE
    WHEN ta.expires_at IS NOT NULL THEN ta.expires_at - CURRENT_DATE
    ELSE NULL
  END as days_until_expiration
FROM users u
CROSS JOIN training_types tt
LEFT JOIN training_assignments ta ON ta.user_id = u.id
  AND ta.training_type_id = tt.id
  AND ta.status NOT IN ('expired', 'failed')
WHERE u.is_active = true
  AND tt.is_active = true
  AND (tt.organization_id IS NULL OR tt.organization_id = u.organization_id)
  AND (tt.required_for_roles IS NULL OR tt.required_for_roles @> ARRAY[u.role] OR 'all' = ANY(tt.required_for_roles));

-- ============================================
-- FUNCTION: Auto-assign required training on new hire
-- ============================================

CREATE OR REPLACE FUNCTION auto_assign_required_training()
RETURNS TRIGGER AS $$
DECLARE
  training RECORD;
  due_date DATE;
BEGIN
  -- Only for new caregivers/employees
  IF NEW.role IN ('caregiver', 'nurse') AND (TG_OP = 'INSERT' OR OLD.role != NEW.role) THEN
    FOR training IN
      SELECT id, code, validity_months
      FROM training_types
      WHERE is_required = true
        AND is_active = true
        AND (organization_id IS NULL OR organization_id = NEW.organization_id)
        AND (required_for_roles IS NULL OR required_for_roles @> ARRAY[NEW.role] OR 'all' = ANY(required_for_roles))
    LOOP
      -- Set due date based on training type (orientation = 7 days, others = 30 days)
      due_date := CASE
        WHEN training.code = 'ORIENTATION' THEN CURRENT_DATE + INTERVAL '7 days'
        WHEN training.code = 'EVV_TRAINING' THEN CURRENT_DATE + INTERVAL '3 days'
        ELSE CURRENT_DATE + INTERVAL '30 days'
      END;

      -- Create assignment if not exists
      INSERT INTO training_assignments (
        organization_id, user_id, training_type_id, due_date, priority
      )
      SELECT NEW.organization_id, NEW.id, training.id, due_date,
        CASE WHEN training.code IN ('ORIENTATION', 'EVV_TRAINING') THEN 'high' ELSE 'normal' END
      WHERE NOT EXISTS (
        SELECT 1 FROM training_assignments ta
        WHERE ta.user_id = NEW.id
          AND ta.training_type_id = training.id
          AND ta.status NOT IN ('expired', 'failed')
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-assignment
DROP TRIGGER IF EXISTS trg_auto_assign_training ON users;
CREATE TRIGGER trg_auto_assign_training
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_required_training();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE training_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE training_types IS 'Training courses and certifications available for staff';
COMMENT ON TABLE training_assignments IS 'Training assignments to individual employees';
COMMENT ON TABLE training_progress IS 'Module-level progress for multi-part training courses';
COMMENT ON VIEW training_compliance_status IS 'Real-time compliance status for all employees and required training';
