-- Migration: Progressive Discipline System
-- Purpose: Track employee disciplinary actions with escalation levels
-- Compliance: OAC 173-39-02.11 - Personnel Policies (formal discipline procedures)
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
-- Disciplinary Actions Table
-- ============================================================================

CREATE TABLE disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action Details
  action_number VARCHAR(50) UNIQUE,
  action_level VARCHAR(50) NOT NULL CHECK (action_level IN (
    'verbal_warning', 'written_warning', 'final_written_warning',
    'suspension', 'termination'
  )),
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Incident Details
  incident_date DATE NOT NULL,
  incident_type VARCHAR(100) NOT NULL, -- attendance, performance, conduct, safety, policy_violation, etc.
  incident_category VARCHAR(50) CHECK (incident_category IN (
    'attendance', 'performance', 'conduct', 'safety', 'policy_violation',
    'hipaa_violation', 'client_abuse', 'insubordination', 'theft', 'other'
  )),
  incident_description TEXT NOT NULL,
  incident_location VARCHAR(200),
  witnesses JSONB DEFAULT '[]'::jsonb, -- Array of {name, role, statement}

  -- Investigation
  investigation_conducted BOOLEAN DEFAULT false,
  investigation_summary TEXT,
  investigator_id UUID REFERENCES users(id),

  -- Previous Offenses
  prior_actions_count INTEGER DEFAULT 0,
  prior_actions JSONB DEFAULT '[]'::jsonb, -- Array of {actionId, date, level, type}

  -- Action Taken
  action_taken TEXT NOT NULL, -- Specific disciplinary action
  rationale TEXT, -- Why this level of discipline
  policies_violated JSONB DEFAULT '[]'::jsonb, -- Array of policy references

  -- Suspension Details (if applicable)
  suspension_start_date DATE,
  suspension_end_date DATE,
  suspension_paid BOOLEAN DEFAULT false,
  suspension_duration_days INTEGER,

  -- Corrective Action Plan
  corrective_actions_required JSONB DEFAULT '[]'::jsonb, -- Array of {action, deadline, completed}
  performance_improvement_plan BOOLEAN DEFAULT false,
  pip_id UUID, -- Reference to PIP if created
  training_required JSONB DEFAULT '[]'::jsonb, -- Array of training course IDs
  coaching_sessions_required INTEGER DEFAULT 0,

  -- Follow-up
  follow_up_date DATE,
  follow_up_notes TEXT,
  follow_up_completed BOOLEAN DEFAULT false,

  -- Employee Response
  employee_statement TEXT,
  employee_acknowledged BOOLEAN DEFAULT false,
  employee_signature_date DATE,
  employee_refused_to_sign BOOLEAN DEFAULT false,

  -- Management Review
  issued_by_id UUID NOT NULL REFERENCES users(id),
  issued_by_title VARCHAR(100),
  reviewed_by_id UUID REFERENCES users(id), -- HR or upper management
  reviewed_date DATE,

  -- Appeal
  appeal_filed BOOLEAN DEFAULT false,
  appeal_date DATE,
  appeal_reason TEXT,
  appeal_decision VARCHAR(50) CHECK (appeal_decision IN ('upheld', 'overturned', 'modified', 'pending')),
  appeal_notes TEXT,

  -- Expiration (some warnings expire after a period)
  expires BOOLEAN DEFAULT false,
  expiration_date DATE,
  expiration_period_months INTEGER, -- e.g., 12 months for written warning
  active BOOLEAN DEFAULT true,

  -- Documentation
  documentation_urls JSONB DEFAULT '[]'::jsonb, -- Supporting documents

  -- Status
  status VARCHAR(50) DEFAULT 'issued' CHECK (status IN (
    'draft', 'issued', 'acknowledged', 'under_appeal', 'expired', 'rescinded'
  )),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_disciplinary_actions_org ON disciplinary_actions(organization_id);
CREATE INDEX idx_disciplinary_actions_employee ON disciplinary_actions(employee_id, action_date DESC);
CREATE INDEX idx_disciplinary_actions_level ON disciplinary_actions(action_level);
CREATE INDEX idx_disciplinary_actions_type ON disciplinary_actions(incident_type);
CREATE INDEX idx_disciplinary_actions_status ON disciplinary_actions(status);
CREATE INDEX idx_disciplinary_actions_active ON disciplinary_actions(active) WHERE active = true;
CREATE INDEX idx_disciplinary_actions_expiration ON disciplinary_actions(expiration_date) WHERE expires = true AND active = true;

-- RLS Policies
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY disciplinary_actions_org_isolation ON disciplinary_actions
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Discipline Policy Table (Escalation Rules)
-- ============================================================================

CREATE TABLE discipline_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Policy Details
  incident_type VARCHAR(100) NOT NULL,
  incident_category VARCHAR(50),

  -- Progressive Discipline Steps
  first_offense_action VARCHAR(50), -- verbal_warning, written_warning, etc.
  second_offense_action VARCHAR(50),
  third_offense_action VARCHAR(50),
  fourth_offense_action VARCHAR(50),

  -- Special Cases
  immediate_termination BOOLEAN DEFAULT false, -- Gross misconduct
  requires_suspension BOOLEAN DEFAULT false,

  -- Expiration
  expiration_period_months INTEGER DEFAULT 12,

  -- Notes
  policy_notes TEXT,

  -- Status
  active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_discipline_policies_org ON discipline_policies(organization_id);
CREATE INDEX idx_discipline_policies_type ON discipline_policies(incident_type);
CREATE INDEX idx_discipline_policies_active ON discipline_policies(active) WHERE active = true;

-- RLS Policies
ALTER TABLE discipline_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY discipline_policies_org_isolation ON discipline_policies
  USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate disciplinary action number
CREATE OR REPLACE FUNCTION generate_disciplinary_action_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_action_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next action number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(action_number FROM 'DA-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM disciplinary_actions
  WHERE action_number LIKE 'DA-' || year_str || '-%';

  new_action_number := 'DA-' || year_str || '-' || LPAD(next_number::TEXT, 4, '0');
  NEW.action_number := new_action_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_disciplinary_action_number
  BEFORE INSERT ON disciplinary_actions
  FOR EACH ROW
  WHEN (NEW.action_number IS NULL)
  EXECUTE FUNCTION generate_disciplinary_action_number();

-- Calculate expiration date
CREATE OR REPLACE FUNCTION calculate_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires = true AND NEW.expiration_period_months IS NOT NULL THEN
    NEW.expiration_date := NEW.action_date + (NEW.expiration_period_months || ' months')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_expiration_date
  BEFORE INSERT OR UPDATE ON disciplinary_actions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_expiration_date();

-- Calculate suspension duration
CREATE OR REPLACE FUNCTION calculate_suspension_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.suspension_start_date IS NOT NULL AND NEW.suspension_end_date IS NOT NULL THEN
    NEW.suspension_duration_days := NEW.suspension_end_date - NEW.suspension_start_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_suspension_duration
  BEFORE INSERT OR UPDATE ON disciplinary_actions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_suspension_duration();

-- Auto-expire disciplinary actions
CREATE OR REPLACE FUNCTION auto_expire_disciplinary_actions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires = true AND NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE THEN
    NEW.status := 'expired';
    NEW.active := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_disciplinary_actions
  BEFORE UPDATE ON disciplinary_actions
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_disciplinary_actions();

-- Count prior actions
CREATE OR REPLACE FUNCTION count_prior_actions()
RETURNS TRIGGER AS $$
DECLARE
  prior_count INTEGER;
  prior_actions_array JSONB;
BEGIN
  -- Count prior active disciplinary actions for this employee and incident type
  SELECT COUNT(*), JSONB_AGG(JSONB_BUILD_OBJECT(
    'actionId', id,
    'date', action_date,
    'level', action_level,
    'type', incident_type
  ))
  INTO prior_count, prior_actions_array
  FROM disciplinary_actions
  WHERE employee_id = NEW.employee_id
    AND incident_type = NEW.incident_type
    AND action_date < NEW.action_date
    AND active = true
    AND id != NEW.id;

  NEW.prior_actions_count := COALESCE(prior_count, 0);
  NEW.prior_actions := COALESCE(prior_actions_array, '[]'::jsonb);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_count_prior_actions
  BEFORE INSERT OR UPDATE ON disciplinary_actions
  FOR EACH ROW
  EXECUTE FUNCTION count_prior_actions();

-- Update timestamps
CREATE TRIGGER update_disciplinary_actions_timestamp
  BEFORE UPDATE ON disciplinary_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discipline_policies_timestamp
  BEFORE UPDATE ON discipline_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Active Disciplinary Actions by Employee
CREATE VIEW employee_discipline_history AS
SELECT
  da.employee_id,
  u.first_name || ' ' || u.last_name AS employee_name,
  u.email,
  da.organization_id,
  COUNT(da.id) AS total_actions,
  COUNT(da.id) FILTER (WHERE da.action_level = 'verbal_warning') AS verbal_warnings,
  COUNT(da.id) FILTER (WHERE da.action_level = 'written_warning') AS written_warnings,
  COUNT(da.id) FILTER (WHERE da.action_level = 'final_written_warning') AS final_warnings,
  COUNT(da.id) FILTER (WHERE da.action_level = 'suspension') AS suspensions,
  COUNT(da.id) FILTER (WHERE da.action_level = 'termination') AS terminations,
  MAX(da.action_date) AS most_recent_action_date,
  MAX(da.action_level) AS most_recent_action_level
FROM disciplinary_actions da
JOIN users u ON da.employee_id = u.id
WHERE da.active = true
GROUP BY da.employee_id, u.first_name, u.last_name, u.email, da.organization_id;

-- Expiring Disciplinary Actions (within 30 days)
CREATE VIEW expiring_disciplinary_actions AS
SELECT
  da.id,
  da.action_number,
  da.organization_id,
  da.employee_id,
  u.first_name || ' ' || u.last_name AS employee_name,
  da.action_level,
  da.incident_type,
  da.action_date,
  da.expiration_date,
  da.expiration_date - CURRENT_DATE AS days_until_expiration
FROM disciplinary_actions da
JOIN users u ON da.employee_id = u.id
WHERE da.expires = true
  AND da.expiration_date IS NOT NULL
  AND da.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND da.active = true
ORDER BY da.expiration_date;

-- Pending Appeals
CREATE VIEW pending_discipline_appeals AS
SELECT
  da.id,
  da.action_number,
  da.organization_id,
  da.employee_id,
  u.first_name || ' ' || u.last_name AS employee_name,
  da.action_level,
  da.incident_type,
  da.action_date,
  da.appeal_date,
  CURRENT_DATE - da.appeal_date AS days_pending,
  da.appeal_reason
FROM disciplinary_actions da
JOIN users u ON da.employee_id = u.id
WHERE da.appeal_filed = true
  AND da.appeal_decision = 'pending'
ORDER BY da.appeal_date;

-- Discipline Summary by Type
CREATE VIEW discipline_summary_by_type AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  da.incident_type,
  COUNT(da.id) AS total_actions,
  COUNT(da.id) FILTER (WHERE da.action_date >= CURRENT_DATE - INTERVAL '30 days') AS last_30_days,
  COUNT(da.id) FILTER (WHERE da.action_date >= CURRENT_DATE - INTERVAL '90 days') AS last_90_days,
  COUNT(da.id) FILTER (WHERE da.action_date >= CURRENT_DATE - INTERVAL '12 months') AS last_12_months
FROM organizations o
LEFT JOIN disciplinary_actions da ON o.id = da.organization_id
WHERE da.active = true OR da.id IS NULL
GROUP BY o.id, o.name, da.incident_type;

-- ============================================================================
-- Seed Data: Default Discipline Policies
-- ============================================================================

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, fourth_offense_action, expiration_period_months, organization_id)
SELECT
  'Attendance - Tardiness',
  'attendance',
  'verbal_warning',
  'written_warning',
  'final_written_warning',
  'termination',
  12,
  id
FROM organizations;

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, fourth_offense_action, expiration_period_months, organization_id)
SELECT
  'Attendance - Unexcused Absence',
  'attendance',
  'written_warning',
  'final_written_warning',
  'suspension',
  'termination',
  12,
  id
FROM organizations;

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, immediate_termination, organization_id)
SELECT
  'Client Abuse or Neglect',
  'client_abuse',
  'termination',
  NULL,
  NULL,
  true,
  id
FROM organizations;

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, immediate_termination, organization_id)
SELECT
  'HIPAA Violation - Intentional',
  'hipaa_violation',
  'termination',
  NULL,
  NULL,
  true,
  id
FROM organizations;

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, expiration_period_months, organization_id)
SELECT
  'HIPAA Violation - Unintentional',
  'hipaa_violation',
  'written_warning',
  'final_written_warning',
  'termination',
  12,
  id
FROM organizations;

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, expiration_period_months, organization_id)
SELECT
  'Performance - Unsatisfactory',
  'performance',
  'verbal_warning',
  'written_warning',
  'final_written_warning',
  6,
  id
FROM organizations;

INSERT INTO discipline_policies (incident_type, incident_category, first_offense_action, second_offense_action, third_offense_action, expiration_period_months, organization_id)
SELECT
  'Safety Violation',
  'safety',
  'written_warning',
  'final_written_warning',
  'termination',
  12,
  id
FROM organizations;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE disciplinary_actions IS 'Progressive discipline tracking per OAC 173-39-02.11';
COMMENT ON TABLE discipline_policies IS 'Discipline escalation rules by incident type';
COMMENT ON VIEW employee_discipline_history IS 'Employee discipline summary';
COMMENT ON VIEW expiring_disciplinary_actions IS 'Disciplinary actions expiring within 30 days';
COMMENT ON VIEW pending_discipline_appeals IS 'Pending employee appeals';
COMMENT ON VIEW discipline_summary_by_type IS 'Discipline trends by incident type';
