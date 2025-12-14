-- Migration: Clinical Supervision Tracking System
-- Purpose: Track RN/LPN supervisory visits and competency assessments per OAC 173-39-02.11(C)(4)
-- Compliance: Ohio Administrative Code 173-39 (Home Care Services)
-- Created: 2025-12-13

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Supervisory Visits Table
-- ============================================================================

CREATE TABLE supervisory_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Visit Details
  visit_type VARCHAR(50) NOT NULL CHECK (visit_type IN ('initial', 'quarterly', 'annual', 'incident_triggered', 'on_demand')),
  visit_date DATE NOT NULL,
  visit_location VARCHAR(100), -- 'office', 'client_home', 'phone', 'virtual'
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- If visit conducted at client home

  -- Assessment Results
  competencies_assessed JSONB DEFAULT '[]'::jsonb, -- Array of competency IDs assessed
  care_plan_reviewed BOOLEAN DEFAULT false,
  policy_compliance_reviewed BOOLEAN DEFAULT false,
  documentation_reviewed BOOLEAN DEFAULT false,

  -- Findings
  caregiver_strengths TEXT,
  areas_for_improvement TEXT,
  action_items JSONB DEFAULT '[]'::jsonb, -- Array of {description, deadline, completed}
  training_recommended JSONB DEFAULT '[]'::jsonb, -- Array of training course IDs

  -- Follow-up
  next_visit_due_date DATE NOT NULL,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,

  -- RN Signoff
  supervisor_signature TEXT, -- Digital signature or approval code
  supervisor_signature_date TIMESTAMPTZ,
  caregiver_signature TEXT,
  caregiver_signature_date TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  completion_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT valid_visit_date CHECK (visit_date <= CURRENT_DATE + INTERVAL '30 days'),
  CONSTRAINT valid_next_visit CHECK (next_visit_due_date > visit_date)
  -- Note: Supervisor RN validation handled in application layer
);

-- Indexes
CREATE INDEX idx_supervisory_visits_caregiver ON supervisory_visits(caregiver_id, visit_date DESC);
CREATE INDEX idx_supervisory_visits_supervisor ON supervisory_visits(supervisor_id, visit_date DESC);
CREATE INDEX idx_supervisory_visits_org ON supervisory_visits(organization_id);
CREATE INDEX idx_supervisory_visits_status ON supervisory_visits(status);
CREATE INDEX idx_supervisory_visits_due_date ON supervisory_visits(next_visit_due_date) WHERE status = 'completed';
CREATE INDEX idx_supervisory_visits_client ON supervisory_visits(client_id) WHERE client_id IS NOT NULL;

-- RLS Policies
ALTER TABLE supervisory_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY supervisory_visits_org_isolation ON supervisory_visits
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY supervisory_visits_supervisor_access ON supervisory_visits
  FOR SELECT
  USING (
    supervisor_id = current_setting('app.current_user_id')::uuid
    OR caregiver_id = current_setting('app.current_user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = current_setting('app.current_user_id')::uuid
      AND role IN ('administrator', 'clinical_director', 'hr_manager')
    )
  );

-- ============================================================================
-- Competency Assessments Table
-- ============================================================================

CREATE TABLE competency_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisory_visit_id UUID NOT NULL REFERENCES supervisory_visits(id) ON DELETE CASCADE,

  -- Competency Details
  competency_type VARCHAR(100) NOT NULL, -- e.g., 'bathing', 'transfers', 'meal_prep', 'medication_admin'
  competency_category VARCHAR(50), -- 'clinical', 'safety', 'documentation', 'communication'

  -- Assessment Results
  competency_level VARCHAR(50) CHECK (competency_level IN ('novice', 'advanced_beginner', 'competent', 'proficient', 'expert')),
  demonstration_observed BOOLEAN DEFAULT false,
  demonstration_location VARCHAR(100), -- Where skill was observed

  -- Evaluation
  meets_standard BOOLEAN,
  requires_additional_training BOOLEAN DEFAULT false,
  requires_remediation BOOLEAN DEFAULT false,

  -- Documentation
  notes TEXT,
  evidence_documents JSONB DEFAULT '[]'::jsonb, -- Array of document URLs/IDs

  -- Audit
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  assessed_by UUID REFERENCES users(id),

  CONSTRAINT valid_competency_level CHECK (
    competency_level IS NOT NULL OR NOT meets_standard
  )
);

-- Indexes
CREATE INDEX idx_competency_assessments_visit ON competency_assessments(supervisory_visit_id);
CREATE INDEX idx_competency_assessments_type ON competency_assessments(competency_type);
CREATE INDEX idx_competency_assessments_level ON competency_assessments(competency_level);
CREATE INDEX idx_competency_assessments_remediation ON competency_assessments(requires_remediation) WHERE requires_remediation = true;

-- RLS Policies
ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY competency_assessments_via_visit ON competency_assessments
  USING (
    supervisory_visit_id IN (
      SELECT id FROM supervisory_visits
      WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Supervision Schedule Table
-- ============================================================================

CREATE TABLE supervision_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Schedule Details
  frequency VARCHAR(50) DEFAULT 'quarterly' CHECK (frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
  last_visit_date DATE,
  next_visit_due_date DATE NOT NULL,

  -- Overdue Tracking (computed in application queries rather than generated columns)
  is_overdue BOOLEAN DEFAULT false,
  days_overdue INTEGER DEFAULT 0,

  -- Alert Configuration
  alert_days_before INTEGER DEFAULT 14, -- Alert 14 days before due date
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_caregiver_schedule UNIQUE (caregiver_id, active)
);

-- Indexes
CREATE INDEX idx_supervision_schedules_caregiver ON supervision_schedules(caregiver_id) WHERE active = true;
CREATE INDEX idx_supervision_schedules_supervisor ON supervision_schedules(supervisor_id) WHERE active = true;
CREATE INDEX idx_supervision_schedules_overdue ON supervision_schedules(is_overdue, next_visit_due_date) WHERE active = true;
CREATE INDEX idx_supervision_schedules_due_date ON supervision_schedules(next_visit_due_date) WHERE active = true;

-- RLS Policies
ALTER TABLE supervision_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY supervision_schedules_org_isolation ON supervision_schedules
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Competency Standards Table (Master List)
-- ============================================================================

CREATE TABLE competency_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system-wide standard

  -- Competency Definition
  competency_code VARCHAR(50) NOT NULL,
  competency_name VARCHAR(200) NOT NULL,
  competency_category VARCHAR(50), -- 'clinical', 'safety', 'documentation', 'communication'
  description TEXT,

  -- Requirements
  required_for_roles JSONB DEFAULT '[]'::jsonb, -- Array of role names
  initial_assessment_required BOOLEAN DEFAULT true,
  annual_reassessment_required BOOLEAN DEFAULT false,

  -- Evaluation Criteria
  evaluation_criteria JSONB DEFAULT '[]'::jsonb, -- Array of {criterion, weight}
  passing_threshold INTEGER DEFAULT 80, -- Percentage

  -- Documentation
  reference_documents JSONB DEFAULT '[]'::jsonb,
  training_resources JSONB DEFAULT '[]'::jsonb,

  -- Status
  active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_competency_code UNIQUE (organization_id, competency_code)
);

-- Indexes
CREATE INDEX idx_competency_standards_code ON competency_standards(competency_code);
CREATE INDEX idx_competency_standards_category ON competency_standards(competency_category);
CREATE INDEX idx_competency_standards_active ON competency_standards(active) WHERE active = true;

-- RLS Policies
ALTER TABLE competency_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY competency_standards_org_isolation ON competency_standards
  USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

-- ============================================================================
-- Seed Data: Default Competency Standards (Ohio Home Care Requirements)
-- ============================================================================

INSERT INTO competency_standards (competency_code, competency_name, competency_category, description, required_for_roles) VALUES
  ('PERSONAL_CARE_001', 'Bathing and Hygiene', 'clinical', 'Safe bathing techniques, skin assessment, infection control', '["caregiver", "aide"]'),
  ('PERSONAL_CARE_002', 'Dressing and Grooming', 'clinical', 'Assistance with dressing, adaptive equipment use', '["caregiver", "aide"]'),
  ('PERSONAL_CARE_003', 'Toileting and Continence Care', 'clinical', 'Safe transfer techniques, dignity preservation, infection control', '["caregiver", "aide"]'),
  ('MOBILITY_001', 'Safe Transfers', 'safety', 'Proper body mechanics, transfer belt use, fall prevention', '["caregiver", "aide"]'),
  ('MOBILITY_002', 'Ambulation Assistance', 'safety', 'Use of assistive devices, gait monitoring, fall risk assessment', '["caregiver", "aide"]'),
  ('NUTRITION_001', 'Meal Preparation', 'clinical', 'Therapeutic diet adherence, food safety, choking prevention', '["caregiver", "aide"]'),
  ('NUTRITION_002', 'Feeding Assistance', 'clinical', 'Aspiration precautions, positioning, swallowing assessment', '["caregiver", "aide"]'),
  ('SAFETY_001', 'Fall Prevention', 'safety', 'Environmental hazard identification, fall risk assessment, prevention strategies', '["caregiver", "aide", "rn"]'),
  ('SAFETY_002', 'Emergency Response', 'safety', 'CPR, choking response, emergency contact procedures', '["caregiver", "aide", "rn"]'),
  ('SAFETY_003', 'Infection Control', 'safety', 'Hand hygiene, PPE use, universal precautions', '["caregiver", "aide", "rn"]'),
  ('COMMUNICATION_001', 'Client Communication', 'communication', 'Therapeutic communication, active listening, cultural sensitivity', '["caregiver", "aide", "rn"]'),
  ('COMMUNICATION_002', 'Care Team Coordination', 'communication', 'Effective handoff communication, reporting changes in condition', '["caregiver", "aide", "rn"]'),
  ('DOCUMENTATION_001', 'EVV Documentation', 'documentation', 'Accurate time entry, service verification, electronic signatures', '["caregiver", "aide"]'),
  ('DOCUMENTATION_002', 'Care Plan Documentation', 'documentation', 'Progress note writing, care plan adherence, incident reporting', '["caregiver", "aide", "rn"]'),
  ('CLINICAL_001', 'Vital Signs Monitoring', 'clinical', 'Blood pressure, pulse, respiration, temperature measurement and interpretation', '["rn", "lpn"]'),
  ('CLINICAL_002', 'Medication Administration', 'clinical', 'Six rights of medication administration, documentation, error reporting', '["rn", "lpn"]'),
  ('CLINICAL_003', 'Wound Care', 'clinical', 'Dressing changes, wound assessment, infection recognition', '["rn", "lpn"]'),
  ('CLINICAL_004', 'Care Plan Development', 'clinical', 'Assessment, goal setting, intervention planning, evaluation', '["rn"]'),
  ('COMPLIANCE_001', 'HIPAA and Privacy', 'documentation', 'Protected health information handling, breach reporting, patient rights', '["caregiver", "aide", "rn", "administrator"]'),
  ('COMPLIANCE_002', 'Mandatory Reporting', 'safety', 'Abuse and neglect recognition, reporting procedures, documentation', '["caregiver", "aide", "rn", "administrator"]');

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update supervision schedule after visit completion
CREATE OR REPLACE FUNCTION update_supervision_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE supervision_schedules
    SET
      last_visit_date = NEW.visit_date,
      next_visit_due_date = NEW.next_visit_due_date,
      alert_sent = false,
      alert_sent_at = NULL,
      updated_at = NOW()
    WHERE caregiver_id = NEW.caregiver_id AND active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supervision_schedule
  AFTER UPDATE ON supervisory_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_supervision_schedule();

-- Auto-create supervision schedule for new caregivers
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
      (SELECT id FROM users WHERE organization_id = NEW.organization_id AND role = 'rn' AND active = true LIMIT 1),
      'quarterly',
      CURRENT_DATE + INTERVAL '30 days' -- Initial visit due within 30 days
    WHERE NOT EXISTS (
      SELECT 1 FROM supervision_schedules WHERE caregiver_id = NEW.id AND active = true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_supervision_schedule
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_supervision_schedule();

-- Update timestamps
CREATE TRIGGER update_supervisory_visits_timestamp
  BEFORE UPDATE ON supervisory_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervision_schedules_timestamp
  BEFORE UPDATE ON supervision_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competency_standards_timestamp
  BEFORE UPDATE ON competency_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Overdue Supervision Visits
CREATE VIEW overdue_supervision_visits AS
SELECT
  ss.caregiver_id,
  u.first_name || ' ' || u.last_name AS caregiver_name,
  ss.supervisor_id,
  sup.first_name || ' ' || sup.last_name AS supervisor_name,
  ss.next_visit_due_date,
  ss.days_overdue,
  ss.last_visit_date,
  u.organization_id
FROM supervision_schedules ss
JOIN users u ON ss.caregiver_id = u.id
LEFT JOIN users sup ON ss.supervisor_id = sup.id
WHERE ss.is_overdue = true AND ss.active = true;

-- Competency Assessment Summary
CREATE VIEW competency_assessment_summary AS
SELECT
  sv.caregiver_id,
  u.first_name || ' ' || u.last_name AS caregiver_name,
  COUNT(DISTINCT ca.competency_type) AS competencies_assessed,
  COUNT(CASE WHEN ca.meets_standard = true THEN 1 END) AS competencies_passed,
  COUNT(CASE WHEN ca.requires_remediation = true THEN 1 END) AS competencies_requiring_remediation,
  MAX(sv.visit_date) AS last_assessment_date,
  u.organization_id
FROM supervisory_visits sv
JOIN users u ON sv.caregiver_id = u.id
LEFT JOIN competency_assessments ca ON sv.id = ca.supervisory_visit_id
WHERE sv.status = 'completed'
GROUP BY sv.caregiver_id, u.first_name, u.last_name, u.organization_id;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE supervisory_visits IS 'RN/LPN supervisory visits per OAC 173-39-02.11(C)(4) - quarterly caregiver oversight';
COMMENT ON TABLE competency_assessments IS 'Competency verification during supervisory visits';
COMMENT ON TABLE supervision_schedules IS 'Automated supervision scheduling and overdue tracking';
COMMENT ON TABLE competency_standards IS 'Master list of required competencies for home care staff';
COMMENT ON VIEW overdue_supervision_visits IS 'Alert view for overdue supervisory visits';
COMMENT ON VIEW competency_assessment_summary IS 'Summary of caregiver competency assessment results';
