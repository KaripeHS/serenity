-- Migration: API Support Tables for Dashboard Integration
-- Created: 2025-12-13
-- Purpose: Create tables required for Phase 1 backend API integration

-- ============================================================================
-- Strategic Risks Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategic_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'financial', 'operational', 'compliance', 'strategic', 'reputational'
  )),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN (
    'critical', 'high', 'medium', 'low'
  )),
  likelihood VARCHAR(20) NOT NULL CHECK (likelihood IN (
    'very_likely', 'likely', 'possible', 'unlikely'
  )),
  impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 10),
  mitigation_status VARCHAR(50) NOT NULL DEFAULT 'unaddressed' CHECK (mitigation_status IN (
    'unaddressed', 'in_progress', 'mitigated'
  )),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategic_risks_org ON strategic_risks(organization_id);
CREATE INDEX idx_strategic_risks_severity ON strategic_risks(severity);
CREATE INDEX idx_strategic_risks_status ON strategic_risks(mitigation_status);

-- Strategic risk actions (mitigation steps)
CREATE TABLE IF NOT EXISTS strategic_risk_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES strategic_risks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed'
  )),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_actions_risk ON strategic_risk_actions(risk_id);

-- ============================================================================
-- Client Leads (for Lead Scoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(20),
  source VARCHAR(100) NOT NULL, -- 'referral', 'marketing', 'website', 'partnership'
  source_details TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'converted', 'lost'
  )),
  conversion_score INTEGER CHECK (conversion_score BETWEEN 0 AND 100),
  conversion_probability DECIMAL(5,4) CHECK (conversion_probability BETWEEN 0 AND 1),
  priority VARCHAR(20) CHECK (priority IN ('hot', 'warm', 'cold')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_client_leads_org ON client_leads(organization_id);
CREATE INDEX idx_client_leads_status ON client_leads(status);
CREATE INDEX idx_client_leads_score ON client_leads(conversion_score DESC);
CREATE INDEX idx_client_leads_created ON client_leads(created_at DESC);

-- Lead scoring factors (for ML feature tracking)
CREATE TABLE IF NOT EXISTS lead_scoring_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES client_leads(id) ON DELETE CASCADE,
  factor VARCHAR(100) NOT NULL, -- 'source_referral', 'response_time_fast', etc.
  impact INTEGER NOT NULL, -- Points added to score
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_factors_lead ON lead_scoring_factors(lead_id);

-- ============================================================================
-- Mileage Reimbursements
-- ============================================================================

CREATE TABLE IF NOT EXISTS mileage_reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submit_date DATE NOT NULL,
  pay_period VARCHAR(50) NOT NULL, -- '2025-12-01 to 2025-12-15'
  total_miles DECIMAL(10,2) NOT NULL CHECK (total_miles >= 0),
  reimbursement_rate DECIMAL(10,2) NOT NULL CHECK (reimbursement_rate >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'paid', 'rejected'
  )),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mileage_org ON mileage_reimbursements(organization_id);
CREATE INDEX idx_mileage_caregiver ON mileage_reimbursements(caregiver_id);
CREATE INDEX idx_mileage_status ON mileage_reimbursements(status);
CREATE INDEX idx_mileage_submit_date ON mileage_reimbursements(submit_date DESC);

-- Individual mileage entries
CREATE TABLE IF NOT EXISTS mileage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reimbursement_id UUID NOT NULL REFERENCES mileage_reimbursements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  miles DECIMAL(10,2) NOT NULL CHECK (miles >= 0),
  purpose TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mileage_entries_reimbursement ON mileage_entries(reimbursement_id);

-- ============================================================================
-- Caregiver Expenses
-- ============================================================================

CREATE TABLE IF NOT EXISTS caregiver_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN (
    'mileage', 'supplies', 'training', 'uniforms', 'other'
  )),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  receipt_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'paid', 'rejected'
  )),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_org ON caregiver_expenses(organization_id);
CREATE INDEX idx_expenses_caregiver ON caregiver_expenses(caregiver_id);
CREATE INDEX idx_expenses_status ON caregiver_expenses(status);
CREATE INDEX idx_expenses_date ON caregiver_expenses(date DESC);

-- ============================================================================
-- Custom Reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'clinical', 'financial', 'hr', 'operations', 'compliance', 'custom'
  )),
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_url TEXT,
  file_size INTEGER, -- Bytes
  format VARCHAR(20) NOT NULL CHECK (format IN (
    'pdf', 'excel', 'csv', 'json'
  )),
  parameters JSONB, -- Report parameters used
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_org ON custom_reports(organization_id);
CREATE INDEX idx_reports_template ON custom_reports(template_id);
CREATE INDEX idx_reports_generated ON custom_reports(generated_at DESC);

-- ============================================================================
-- Report Schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN (
    'daily', 'weekly', 'monthly', 'quarterly'
  )),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday for weekly
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- For monthly
  time_of_day TIME NOT NULL DEFAULT '08:00:00',
  next_run TIMESTAMPTZ NOT NULL,
  last_run TIMESTAMPTZ,
  recipients JSONB NOT NULL, -- Array of email addresses
  format VARCHAR(20) NOT NULL CHECK (format IN ('pdf', 'excel', 'csv')),
  parameters JSONB, -- Report parameters
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedules_org ON report_schedules(organization_id);
CREATE INDEX idx_schedules_next_run ON report_schedules(next_run) WHERE active = true;

-- ============================================================================
-- Report Templates (Pre-configured reports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'clinical_quality', 'revenue_summary'
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  required_permissions TEXT[], -- Array of permission strings
  default_format VARCHAR(20) NOT NULL,
  parameters_schema JSONB, -- JSON schema for parameters
  sql_query TEXT, -- Optional: SQL query template
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert pre-configured report templates
INSERT INTO report_templates (id, name, description, category, required_permissions, default_format) VALUES
  ('clinical_quality', 'Clinical Quality Metrics', 'Monthly quality metrics including falls rate, supervision compliance, and QAPI scores', 'clinical', ARRAY['dashboard:clinical_command_center'], 'pdf'),
  ('revenue_summary', 'Revenue Summary Report', 'Monthly revenue breakdown by service type, payer, and profitability', 'financial', ARRAY['dashboard:revenue_command_center'], 'excel'),
  ('hr_recruiting', 'HR Recruiting Pipeline', 'Current status of recruitment pipeline with time-to-hire metrics', 'hr', ARRAY['dashboard:talent_command_center'], 'pdf'),
  ('compliance_status', 'Compliance Status Report', 'Traffic light compliance score with all pending items', 'compliance', ARRAY['dashboard:compliance_command_center'], 'pdf'),
  ('operations_performance', 'Operations Performance', 'Weekly on-time rate, completion rate, and GPS tracking summary', 'operations', ARRAY['dashboard:operations_command_center'], 'excel'),
  ('caregiver_performance', 'Caregiver Performance Review', 'Individual caregiver SPI scores, visit completion, and client feedback', 'hr', ARRAY['dashboard:talent_command_center'], 'pdf'),
  ('ar_aging', 'AR Aging Report', 'Accounts receivable aging with payer breakdown', 'financial', ARRAY['dashboard:revenue_command_center'], 'excel'),
  ('visit_summary', 'Visit Summary Report', 'Daily/weekly/monthly visit summary with service type breakdown', 'operations', ARRAY['dashboard:operations_command_center'], 'excel')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GPS Logs (if not already exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2), -- Meters
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50), -- 'check_in', 'check_out', 'location_update'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gps_logs_caregiver ON gps_logs(caregiver_id);
CREATE INDEX idx_gps_logs_visit ON gps_logs(visit_id);
CREATE INDEX idx_gps_logs_timestamp ON gps_logs(timestamp DESC);

-- ============================================================================
-- Geofence Violations (if not already exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofence_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  check_in_latitude DECIMAL(10,8) NOT NULL,
  check_in_longitude DECIMAL(11,8) NOT NULL,
  client_latitude DECIMAL(10,8) NOT NULL,
  client_longitude DECIMAL(11,8) NOT NULL,
  distance_meters DECIMAL(10,2) NOT NULL, -- Distance from client location
  geofence_radius_meters DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'pending_review', 'approved', 'rejected'
  )),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_violations_visit ON geofence_violations(visit_id);
CREATE INDEX idx_geofence_violations_caregiver ON geofence_violations(caregiver_id);
CREATE INDEX idx_geofence_violations_status ON geofence_violations(status);
CREATE INDEX idx_geofence_violations_timestamp ON geofence_violations(timestamp DESC);

-- ============================================================================
-- Care Plans (if not already exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  review_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'expired', 'superseded'
  )),
  goals JSONB, -- Array of care goals
  services JSONB, -- Array of services
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_care_plans_client ON care_plans(client_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_review_date ON care_plans(review_date);

-- ============================================================================
-- Visit Notes (if not already exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS visit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  tasks_completed TEXT[], -- Array of task descriptions
  signature_url TEXT, -- URL to digital signature image
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visit_notes_visit ON visit_notes(visit_id);
CREATE INDEX idx_visit_notes_caregiver ON visit_notes(caregiver_id);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_strategic_risks_updated_at
  BEFORE UPDATE ON strategic_risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mileage_reimbursements_updated_at
  BEFORE UPDATE ON mileage_reimbursements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caregiver_expenses_updated_at
  BEFORE UPDATE ON caregiver_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plans_updated_at
  BEFORE UPDATE ON care_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data for Development/Testing
-- ============================================================================

-- Sample strategic risks
INSERT INTO strategic_risks (organization_id, category, title, description, severity, likelihood, impact, mitigation_status, due_date)
SELECT
  id,
  'compliance',
  'ODH Inspection Upcoming',
  'Annual Ohio Department of Health inspection scheduled within 90 days. Need to ensure all compliance items are green.',
  'high',
  'very_likely',
  8,
  'in_progress',
  CURRENT_DATE + INTERVAL '60 days'
FROM organizations
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample client leads
INSERT INTO client_leads (organization_id, name, email, phone, source, status, conversion_score, conversion_probability, priority)
SELECT
  id,
  'Jane Smith',
  'jsmith@example.com',
  '614-555-1234',
  'referral',
  'qualified',
  85,
  0.85,
  'hot'
FROM organizations
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Strategic Risks
ALTER TABLE strategic_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY strategic_risks_org_isolation ON strategic_risks
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Client Leads
ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_leads_org_isolation ON client_leads
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Mileage Reimbursements
ALTER TABLE mileage_reimbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY mileage_org_isolation ON mileage_reimbursements
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Caregiver Expenses
ALTER TABLE caregiver_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY expenses_org_isolation ON caregiver_expenses
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Custom Reports
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_org_isolation ON custom_reports
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Report Schedules
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedules_org_isolation ON report_schedules
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE strategic_risks IS 'Strategic risk tracking for Executive Command Center - Risk Dashboard';
COMMENT ON TABLE client_leads IS 'Client lead tracking and scoring for Strategic Growth Dashboard';
COMMENT ON TABLE mileage_reimbursements IS 'Mileage reimbursement tracking for Operations Command Center';
COMMENT ON TABLE caregiver_expenses IS 'Caregiver expense submissions for Caregiver Portal';
COMMENT ON TABLE custom_reports IS 'Custom report generation tracking for Business Intelligence Dashboard';
COMMENT ON TABLE report_schedules IS 'Scheduled report automation for Business Intelligence Dashboard';
COMMENT ON TABLE report_templates IS 'Pre-configured report templates';
COMMENT ON TABLE gps_logs IS 'GPS location tracking for Operations Command Center - GPS Tracking tab';
COMMENT ON TABLE geofence_violations IS 'Geofence violation tracking for Operations Command Center';
COMMENT ON TABLE care_plans IS 'Client care plans for Client & Family Portal';
COMMENT ON TABLE visit_notes IS 'Visit documentation and task completion for Client & Family Portal';
