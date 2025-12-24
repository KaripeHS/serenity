-- Tax Compliance System Database Schema
-- Creates tables for tax calculations, forms, and compliance tracking

-- Tax calculations for each pay period
CREATE TABLE tax_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES users(id),
  pay_period_id UUID NOT NULL,
  gross_pay DECIMAL(12,2) NOT NULL,
  federal_withholding DECIMAL(12,2) NOT NULL DEFAULT 0,
  ohio_state_withholding DECIMAL(12,2) NOT NULL DEFAULT 0,
  local_withholding DECIMAL(12,2) NOT NULL DEFAULT 0,
  social_security_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  medicare_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  additional_medicare_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  ohio_sui DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_unemployment DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Wage bases for various taxes
  social_security_wages DECIMAL(12,2) NOT NULL DEFAULT 0,
  medicare_wages DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_unemployment_wages DECIMAL(12,2) NOT NULL DEFAULT 0,
  ohio_sui_wages DECIMAL(12,2) NOT NULL DEFAULT 0,

  net_pay DECIMAL(12,2) NOT NULL,
  tax_year INTEGER NOT NULL,
  municipality_code VARCHAR(20),

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  CONSTRAINT valid_tax_year CHECK (tax_year >= 2020 AND tax_year <= 2050),
  CONSTRAINT valid_gross_pay CHECK (gross_pay >= 0),
  CONSTRAINT valid_net_pay CHECK (net_pay >= 0)
);

-- Tax forms (W-2, 1099, 941, etc.)
CREATE TABLE tax_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  form_type VARCHAR(20) NOT NULL,
  tax_year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter IN (1,2,3,4)),
  employee_id UUID REFERENCES users(id), -- NULL for company-wide forms like 941

  form_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'submitted', 'accepted', 'rejected')),

  file_path VARCHAR(500), -- Path to generated PDF/file
  submission_confirmation VARCHAR(100), -- Confirmation number from IRS/state

  created_by UUID NOT NULL REFERENCES users(id),
  submitted_by UUID REFERENCES users(id),

  CONSTRAINT valid_form_type CHECK (form_type IN
    ('W2', '1099_NEC', '941', '940', 'OH_IT501', 'OH_WR', 'LOCAL', 'W3', '1099_MISC')),
  CONSTRAINT valid_tax_year CHECK (tax_year >= 2020 AND tax_year <= 2050),
  CONSTRAINT employee_required_for_individual_forms CHECK (
    (form_type IN ('W2', '1099_NEC', '1099_MISC') AND employee_id IS NOT NULL) OR
    (form_type NOT IN ('W2', '1099_NEC', '1099_MISC'))
  )
);

-- Tax compliance deadlines and reminders
CREATE TABLE tax_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  deadline_date DATE NOT NULL,
  description VARCHAR(200) NOT NULL,
  form_type VARCHAR(20) NOT NULL,
  jurisdiction VARCHAR(20) NOT NULL CHECK (jurisdiction IN ('federal', 'ohio', 'local')),
  tax_year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter IN (1,2,3,4)),

  status VARCHAR(20) NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'due', 'overdue', 'completed', 'exempt')),

  reminder_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),

  -- Automatic reminder settings
  remind_days_before INTEGER DEFAULT 30,
  escalate_days_overdue INTEGER DEFAULT 7,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax deposit requirements and tracking
CREATE TABLE tax_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  deposit_period_start DATE NOT NULL,
  deposit_period_end DATE NOT NULL,
  deposit_due_date DATE NOT NULL,

  federal_withholding DECIMAL(12,2) NOT NULL DEFAULT 0,
  social_security_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  medicare_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deposit_amount DECIMAL(12,2) NOT NULL,

  deposit_method VARCHAR(20) DEFAULT 'EFTPS'
    CHECK (deposit_method IN ('EFTPS', 'WIRE', 'CHECK')),

  deposited_at TIMESTAMPTZ,
  confirmation_number VARCHAR(50),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'deposited', 'failed', 'reversed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Employee tax setup (withholding allowances, etc.)
CREATE TABLE employee_tax_setup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),

  -- Federal withholding
  federal_filing_status VARCHAR(20) NOT NULL DEFAULT 'single'
    CHECK (federal_filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household')),
  federal_allowances INTEGER NOT NULL DEFAULT 0,
  additional_federal_withholding DECIMAL(8,2) NOT NULL DEFAULT 0,
  exempt_from_federal BOOLEAN NOT NULL DEFAULT false,

  -- State withholding (Ohio)
  state_filing_status VARCHAR(20) NOT NULL DEFAULT 'single'
    CHECK (state_filing_status IN ('single', 'married_joint', 'married_separate')),
  state_allowances INTEGER NOT NULL DEFAULT 0,
  additional_state_withholding DECIMAL(8,2) NOT NULL DEFAULT 0,
  exempt_from_state BOOLEAN NOT NULL DEFAULT false,

  -- Local taxes
  municipality_code VARCHAR(20),
  local_allowances INTEGER NOT NULL DEFAULT 0,
  exempt_from_local BOOLEAN NOT NULL DEFAULT false,

  -- Unemployment insurance rates
  sui_rate DECIMAL(6,4) NOT NULL DEFAULT 0.004, -- Ohio SUI rate

  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  CONSTRAINT valid_allowances CHECK (
    federal_allowances >= 0 AND state_allowances >= 0 AND local_allowances >= 0
  ),
  CONSTRAINT valid_additional_withholding CHECK (
    additional_federal_withholding >= 0 AND additional_state_withholding >= 0
  )
);

-- Tax compliance audit trail
CREATE TABLE tax_compliance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT NOT NULL,

  related_employee_id UUID REFERENCES users(id),
  related_form_id UUID REFERENCES tax_forms(id),
  related_deadline_id UUID REFERENCES tax_deadlines(id),

  compliance_status VARCHAR(20) NOT NULL DEFAULT 'compliant'
    CHECK (compliance_status IN ('compliant', 'warning', 'violation', 'corrected')),

  action_required TEXT,
  action_taken TEXT,
  action_due_date DATE,

  risk_level VARCHAR(10) NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by VARCHAR(50), -- 'system', 'user', 'ai_agent'
  created_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_tax_calculations_employee_year ON tax_calculations(employee_id, tax_year);
CREATE INDEX idx_tax_calculations_pay_period ON tax_calculations(pay_period_id);
CREATE INDEX idx_tax_calculations_organization ON tax_calculations(organization_id);

CREATE INDEX idx_tax_forms_type_year ON tax_forms(form_type, tax_year);
CREATE INDEX idx_tax_forms_employee ON tax_forms(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_tax_forms_status ON tax_forms(status);

CREATE INDEX idx_tax_deadlines_date ON tax_deadlines(deadline_date);
CREATE INDEX idx_tax_deadlines_status ON tax_deadlines(status);
CREATE INDEX idx_tax_deadlines_organization ON tax_deadlines(organization_id);

CREATE INDEX idx_tax_deposits_due_date ON tax_deposits(deposit_due_date);
CREATE INDEX idx_tax_deposits_status ON tax_deposits(status);

CREATE INDEX idx_employee_tax_setup_employee ON employee_tax_setup(employee_id);
CREATE INDEX idx_employee_tax_setup_effective ON employee_tax_setup(effective_date);

CREATE INDEX idx_tax_compliance_events_type ON tax_compliance_events(event_type);
CREATE INDEX idx_tax_compliance_events_date ON tax_compliance_events(occurred_at);
CREATE INDEX idx_tax_compliance_events_risk ON tax_compliance_events(risk_level);

-- Row Level Security Policies
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tax_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_compliance_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS: Users can only see data from their organization
CREATE POLICY tax_calculations_organization_policy ON tax_calculations
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY tax_forms_organization_policy ON tax_forms
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY tax_deadlines_organization_policy ON tax_deadlines
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY tax_deposits_organization_policy ON tax_deposits
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY employee_tax_setup_organization_policy ON employee_tax_setup
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = employee_tax_setup.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY tax_compliance_events_organization_policy ON tax_compliance_events
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Insert Ohio municipalities and tax rates
CREATE TABLE ohio_municipalities (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  county VARCHAR(50) NOT NULL,
  tax_rate DECIMAL(6,4) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ohio_municipalities (code, name, county, tax_rate) VALUES
  ('COLUMBUS', 'Columbus', 'Franklin', 0.0250),
  ('CLEVELAND', 'Cleveland', 'Cuyahoga', 0.0250),
  ('CINCINNATI', 'Cincinnati', 'Hamilton', 0.0190),
  ('TOLEDO', 'Toledo', 'Lucas', 0.0225),
  ('AKRON', 'Akron', 'Summit', 0.0250),
  ('DAYTON', 'Dayton', 'Montgomery', 0.0225),
  ('PARMA', 'Parma', 'Cuyahoga', 0.0200),
  ('CANTON', 'Canton', 'Stark', 0.0200),
  ('YOUNGSTOWN', 'Youngstown', 'Mahoning', 0.0250),
  ('LORAIN', 'Lorain', 'Lorain', 0.0175);

-- Trigger to update tax compliance events when deadlines are overdue
CREATE OR REPLACE FUNCTION update_overdue_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
    INSERT INTO tax_compliance_events (
      organization_id,
      event_type,
      event_description,
      related_deadline_id,
      compliance_status,
      action_required,
      risk_level
    ) VALUES (
      NEW.organization_id,
      'deadline_overdue',
      'Tax deadline overdue: ' || NEW.description,
      NEW.id,
      'violation',
      'Complete and submit ' || NEW.form_type || ' immediately to avoid penalties',
      'high'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_overdue_deadlines
  AFTER UPDATE ON tax_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_overdue_deadlines();

-- Views for common tax reporting
CREATE VIEW employee_ytd_tax_summary AS
SELECT
  tc.employee_id,
  e.first_name,
  e.last_name,
  e.ssn,
  tc.tax_year,
  SUM(tc.gross_pay) as ytd_gross,
  SUM(tc.federal_withholding) as ytd_federal,
  SUM(tc.ohio_state_withholding) as ytd_state,
  SUM(tc.local_withholding) as ytd_local,
  SUM(tc.social_security_tax) as ytd_ss_tax,
  SUM(tc.medicare_tax + tc.additional_medicare_tax) as ytd_medicare_tax,
  SUM(tc.net_pay) as ytd_net
FROM tax_calculations tc
JOIN users e ON tc.employee_id = e.id
WHERE tc.tax_year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY tc.employee_id, e.first_name, e.last_name, e.ssn, tc.tax_year;

CREATE VIEW quarterly_tax_summary AS
SELECT
  organization_id,
  tax_year,
  EXTRACT(QUARTER FROM calculated_at) as quarter,
  COUNT(DISTINCT employee_id) as employee_count,
  SUM(gross_pay) as total_wages,
  SUM(federal_withholding) as total_federal,
  SUM(social_security_tax) as total_ss_employee,
  SUM(medicare_tax + additional_medicare_tax) as total_medicare_employee,
  SUM(ohio_sui) as total_sui,
  SUM(federal_unemployment) as total_futa
FROM tax_calculations
GROUP BY organization_id, tax_year, EXTRACT(QUARTER FROM calculated_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON tax_calculations TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON tax_forms TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_deadlines TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON tax_deposits TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_tax_setup TO authenticated_users;
GRANT SELECT, INSERT ON tax_compliance_events TO authenticated_users;
GRANT SELECT ON ohio_municipalities TO authenticated_users;
GRANT SELECT ON employee_ytd_tax_summary TO authenticated_users;
GRANT SELECT ON quarterly_tax_summary TO authenticated_users;