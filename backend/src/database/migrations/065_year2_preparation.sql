-- ============================================================
-- Migration 065: Year 2 Preparation
-- Phase 3, Months 11-12 - DODD Certification, HPC Services,
-- Consumer-Directed Care, Payroll Integration
-- ============================================================

-- ============================================================
-- DODD CERTIFICATION SUPPORT
-- ============================================================

-- DODD provider certification tracking
CREATE TABLE IF NOT EXISTS dodd_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Certification info
  certification_type VARCHAR(50) NOT NULL, -- 'hpc_provider', 'respite_provider', 'adult_day_provider'
  certification_number VARCHAR(50),
  certification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'expired', 'revoked', 'suspended'

  -- Dates
  application_date DATE,
  approval_date DATE,
  effective_date DATE,
  expiration_date DATE,

  -- Contact
  dodd_rep_name VARCHAR(100),
  dodd_rep_email VARCHAR(255),
  dodd_rep_phone VARCHAR(20),

  -- Documents
  application_document_id UUID,
  certification_document_id UUID,

  -- Training requirements met
  evv_training_complete BOOLEAN DEFAULT FALSE,
  evv_training_date DATE,
  staff_training_complete BOOLEAN DEFAULT FALSE,
  staff_training_date DATE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dodd_cert_org ON dodd_certifications(organization_id);
CREATE INDEX idx_dodd_cert_status ON dodd_certifications(organization_id, certification_status);

-- DODD-specific caregiver requirements
CREATE TABLE IF NOT EXISTS dodd_caregiver_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),

  -- Background check (DODD-specific)
  dodd_background_check_date DATE,
  dodd_background_check_status VARCHAR(20), -- 'pending', 'passed', 'failed', 'expired'
  dodd_background_check_document_id UUID,

  -- Training
  dodd_orientation_complete BOOLEAN DEFAULT FALSE,
  dodd_orientation_date DATE,
  evv_certified BOOLEAN DEFAULT FALSE,
  evv_certification_date DATE,

  -- Certification status
  is_dodd_eligible BOOLEAN DEFAULT FALSE,
  eligibility_verified_at TIMESTAMPTZ,
  eligibility_verified_by UUID REFERENCES users(id),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(caregiver_id)
);

CREATE INDEX idx_dodd_req_org ON dodd_caregiver_requirements(organization_id);
CREATE INDEX idx_dodd_req_eligible ON dodd_caregiver_requirements(organization_id)
  WHERE is_dodd_eligible = TRUE;

-- ============================================================
-- HPC SERVICE TYPE INTEGRATION
-- ============================================================

-- HPC (Homemaker/Personal Care) service codes and rates
CREATE TABLE IF NOT EXISTS hpc_service_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(20) NOT NULL UNIQUE,
  service_name VARCHAR(100) NOT NULL,
  service_description TEXT,

  -- Billing
  unit_type VARCHAR(20) NOT NULL DEFAULT '15min', -- '15min', 'hourly', 'daily', 'visit'
  base_rate DECIMAL(10,4), -- Ohio Medicaid rate
  rate_effective_date DATE,

  -- Requirements
  requires_supervision BOOLEAN DEFAULT FALSE,
  requires_care_plan BOOLEAN DEFAULT TRUE,
  max_units_per_day INTEGER,
  max_units_per_week INTEGER,

  -- Waiver info
  waiver_program VARCHAR(50), -- 'level_one', 'self_empowered_life', 'transitions_dd', etc.

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed HPC service codes (Ohio DODD rates as of 2024)
INSERT INTO hpc_service_codes (service_code, service_name, service_description, unit_type, base_rate, waiver_program) VALUES
('T2025', 'Homemaker/Personal Care - Agency', 'HPC services provided by agency staff', '15min', 7.15, 'level_one'),
('T2025_U4', 'Homemaker/Personal Care - Self-Emp', 'HPC services for Self-Empowered Life', '15min', 9.95, 'self_empowered_life'),
('T2025_HQ', 'Homemaker/Personal Care - Group', 'Group HPC services (2-3 individuals)', '15min', 3.58, 'level_one'),
('S5150', 'Respite - In Home', 'Respite care provided in the home', '15min', 7.15, 'level_one'),
('S5150_U4', 'Respite - In Home (SEL)', 'Respite for Self-Empowered Life', '15min', 9.95, 'self_empowered_life'),
('H2014', 'Skills Training - Community', 'Community-based skills training', '15min', 4.79, 'level_one'),
('H2015', 'Intensive Support - Individual', 'Individual intensive support', '15min', 11.17, 'level_one')
ON CONFLICT (service_code) DO NOTHING;

-- Client HPC authorizations (DODD Individual Service Plan)
CREATE TABLE IF NOT EXISTS hpc_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- ISP (Individual Service Plan) info
  isp_number VARCHAR(50),
  isp_effective_date DATE NOT NULL,
  isp_end_date DATE NOT NULL,

  -- Service details
  service_code_id UUID REFERENCES hpc_service_codes(id),
  service_code VARCHAR(20) NOT NULL,

  -- Units authorized
  authorized_units INTEGER NOT NULL,
  unit_type VARCHAR(20) DEFAULT '15min',
  units_per_week INTEGER,
  units_per_month INTEGER,

  -- Usage tracking
  used_units INTEGER DEFAULT 0,
  remaining_units INTEGER GENERATED ALWAYS AS (authorized_units - used_units) STORED,

  -- Case manager
  case_manager_name VARCHAR(100),
  case_manager_phone VARCHAR(20),
  case_manager_email VARCHAR(255),
  county_board VARCHAR(100), -- County Board of DD

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'pending', 'active', 'suspended', 'expired', 'terminated'

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hpc_auth_client ON hpc_authorizations(client_id);
CREATE INDEX idx_hpc_auth_active ON hpc_authorizations(organization_id, status)
  WHERE status = 'active';

-- ============================================================
-- CONSUMER-DIRECTED CARE WORKFLOW
-- ============================================================

-- Consumer-directed employer tracking
CREATE TABLE IF NOT EXISTS consumer_directed_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Employer status
  employer_type VARCHAR(50) DEFAULT 'client', -- 'client', 'family_member', 'guardian'
  employer_name VARCHAR(200) NOT NULL,
  employer_relationship VARCHAR(50),

  -- FMS (Fiscal Management Service) info
  fms_vendor VARCHAR(100), -- PPL, OACBDD, etc.
  fms_account_number VARCHAR(50),
  fms_enrolled_date DATE,

  -- Contact
  employer_phone VARCHAR(20),
  employer_email VARCHAR(255),
  employer_address TEXT,

  -- Tax info (encrypted storage recommended)
  has_ein BOOLEAN DEFAULT FALSE,
  tax_id_last4 VARCHAR(4), -- Last 4 digits only for display

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'terminated'
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cde_client ON consumer_directed_employers(client_id);
CREATE INDEX idx_cde_org ON consumer_directed_employers(organization_id, status);

-- Consumer-directed worker relationships
CREATE TABLE IF NOT EXISTS consumer_directed_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employer_id UUID NOT NULL REFERENCES consumer_directed_employers(id),
  worker_id UUID NOT NULL REFERENCES caregivers(id),

  -- Relationship
  relationship_type VARCHAR(50), -- 'family', 'friend', 'community'
  hire_date DATE NOT NULL,
  termination_date DATE,

  -- Pay rate
  hourly_rate DECIMAL(10,2) NOT NULL,
  rate_effective_date DATE NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'pending', 'active', 'suspended', 'terminated'
  termination_reason VARCHAR(200),

  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cdw_employer ON consumer_directed_workers(employer_id);
CREATE INDEX idx_cdw_worker ON consumer_directed_workers(worker_id);

-- Consumer-directed timesheet submissions
CREATE TABLE IF NOT EXISTS consumer_directed_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employer_id UUID NOT NULL REFERENCES consumer_directed_employers(id),
  worker_id UUID NOT NULL REFERENCES consumer_directed_workers(id),

  -- Pay period
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,

  -- Hours
  total_hours DECIMAL(6,2) NOT NULL,
  regular_hours DECIMAL(6,2) NOT NULL,
  overtime_hours DECIMAL(6,2) DEFAULT 0,

  -- Pay
  hourly_rate DECIMAL(10,2) NOT NULL,
  gross_pay DECIMAL(10,2) GENERATED ALWAYS AS (
    (regular_hours * hourly_rate) + (overtime_hours * hourly_rate * 1.5)
  ) STORED,

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected', 'paid'

  -- Approvals
  employer_signature TEXT,
  employer_signed_at TIMESTAMPTZ,
  worker_signature TEXT,
  worker_signed_at TIMESTAMPTZ,
  agency_approved_by UUID REFERENCES users(id),
  agency_approved_at TIMESTAMPTZ,

  -- FMS submission
  fms_submitted_at TIMESTAMPTZ,
  fms_confirmation_number VARCHAR(50),
  fms_payment_date DATE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cdt_worker ON consumer_directed_timesheets(worker_id, pay_period_start);
CREATE INDEX idx_cdt_status ON consumer_directed_timesheets(organization_id, status);

-- ============================================================
-- PAYROLL INTEGRATION
-- ============================================================

-- Payroll provider configurations
CREATE TABLE IF NOT EXISTS payroll_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Provider info
  provider_type VARCHAR(50) NOT NULL, -- 'adp', 'gusto', 'paychex', 'quickbooks', 'manual'
  provider_name VARCHAR(100) NOT NULL,

  -- API credentials (encrypted)
  api_credentials JSONB, -- Encrypted API keys, tokens, etc.
  api_environment VARCHAR(20) DEFAULT 'sandbox', -- 'sandbox', 'production'

  -- Company identifiers
  company_id VARCHAR(100), -- Provider's company ID
  company_name VARCHAR(200),

  -- Settings
  pay_frequency VARCHAR(20) DEFAULT 'biweekly', -- 'weekly', 'biweekly', 'semimonthly', 'monthly'
  default_pay_period_start VARCHAR(10), -- Day of week/month
  overtime_threshold DECIMAL(4,1) DEFAULT 40.0,
  overtime_multiplier DECIMAL(3,2) DEFAULT 1.5,

  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20),
  sync_error_message TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'disconnected'
  connected_at TIMESTAMPTZ,
  connected_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payroll_org ON payroll_providers(organization_id);

-- Payroll employee mappings
CREATE TABLE IF NOT EXISTS payroll_employee_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payroll_provider_id UUID NOT NULL REFERENCES payroll_providers(id),
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),

  -- External IDs
  external_employee_id VARCHAR(100) NOT NULL,
  external_department_id VARCHAR(100),
  external_location_id VARCHAR(100),

  -- Pay info
  pay_type VARCHAR(20) DEFAULT 'hourly', -- 'hourly', 'salary'
  default_hourly_rate DECIMAL(10,2),
  default_annual_salary DECIMAL(12,2),

  -- Tax info
  tax_filing_status VARCHAR(50),
  exemptions INTEGER,

  -- Bank info status (actual info in payroll provider)
  direct_deposit_setup BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(20) DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(payroll_provider_id, caregiver_id)
);

CREATE INDEX idx_payroll_emp_caregiver ON payroll_employee_mappings(caregiver_id);

-- Payroll runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payroll_provider_id UUID NOT NULL REFERENCES payroll_providers(id),

  -- Pay period
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,

  -- Totals
  total_employees INTEGER DEFAULT 0,
  total_regular_hours DECIMAL(10,2) DEFAULT 0,
  total_overtime_hours DECIMAL(10,2) DEFAULT 0,
  total_gross_pay DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_net_pay DECIMAL(12,2) DEFAULT 0,
  total_employer_taxes DECIMAL(12,2) DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'submitted', 'processing', 'completed', 'failed'

  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  -- Submission
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  external_payroll_id VARCHAR(100),

  -- Completion
  completed_at TIMESTAMPTZ,
  confirmation_number VARCHAR(100),

  -- Errors
  error_message TEXT,
  error_details JSONB,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payroll_run_org ON payroll_runs(organization_id, pay_period_start);
CREATE INDEX idx_payroll_run_status ON payroll_runs(organization_id, status);

-- Payroll line items
CREATE TABLE IF NOT EXISTS payroll_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),
  employee_mapping_id UUID REFERENCES payroll_employee_mappings(id),

  -- Hours
  regular_hours DECIMAL(6,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  pto_hours DECIMAL(6,2) DEFAULT 0,
  holiday_hours DECIMAL(6,2) DEFAULT 0,
  total_hours DECIMAL(6,2) GENERATED ALWAYS AS (
    regular_hours + overtime_hours + pto_hours + holiday_hours
  ) STORED,

  -- Rates
  regular_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),

  -- Earnings
  regular_pay DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  bonus_pay DECIMAL(10,2) DEFAULT 0,
  other_earnings DECIMAL(10,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) GENERATED ALWAYS AS (
    regular_pay + overtime_pay + bonus_pay + other_earnings
  ) STORED,

  -- Deductions
  federal_tax DECIMAL(10,2) DEFAULT 0,
  state_tax DECIMAL(10,2) DEFAULT 0,
  local_tax DECIMAL(10,2) DEFAULT 0,
  social_security DECIMAL(10,2) DEFAULT 0,
  medicare DECIMAL(10,2) DEFAULT 0,
  health_insurance DECIMAL(10,2) DEFAULT 0,
  retirement_401k DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) GENERATED ALWAYS AS (
    federal_tax + state_tax + local_tax + social_security + medicare +
    health_insurance + retirement_401k + other_deductions
  ) STORED,

  -- Net pay (calculated)
  net_pay DECIMAL(10,2),

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'voided'

  -- Bonus details
  bonus_details JSONB, -- Reference to bonus calculations

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payroll_item_run ON payroll_line_items(payroll_run_id);
CREATE INDEX idx_payroll_item_caregiver ON payroll_line_items(caregiver_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- DODD-eligible caregivers view
CREATE OR REPLACE VIEW dodd_eligible_caregivers AS
SELECT
  cg.id,
  cg.first_name || ' ' || cg.last_name AS name,
  cg.organization_id,
  cg.primary_pod_id,
  dcr.dodd_background_check_status,
  dcr.dodd_orientation_complete,
  dcr.evv_certified,
  dcr.is_dodd_eligible,
  dcr.eligibility_verified_at
FROM caregivers cg
JOIN dodd_caregiver_requirements dcr ON dcr.caregiver_id = cg.id
WHERE cg.status = 'active'
  AND dcr.is_dodd_eligible = TRUE;

-- HPC authorization utilization view
CREATE OR REPLACE VIEW hpc_authorization_utilization AS
SELECT
  ha.id,
  ha.organization_id,
  ha.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  ha.service_code,
  hsc.service_name,
  ha.isp_effective_date,
  ha.isp_end_date,
  ha.authorized_units,
  ha.used_units,
  ha.remaining_units,
  ROUND((ha.used_units::DECIMAL / NULLIF(ha.authorized_units, 0)) * 100, 1) AS utilization_percentage,
  ha.status,
  CASE
    WHEN ha.remaining_units <= 0 THEN 'exhausted'
    WHEN ha.remaining_units <= (ha.authorized_units * 0.1) THEN 'critical'
    WHEN ha.remaining_units <= (ha.authorized_units * 0.25) THEN 'low'
    ELSE 'adequate'
  END AS utilization_status
FROM hpc_authorizations ha
JOIN clients c ON c.id = ha.client_id
LEFT JOIN hpc_service_codes hsc ON hsc.service_code = ha.service_code
WHERE ha.status = 'active';

-- Payroll summary by pay period
CREATE OR REPLACE VIEW payroll_period_summary AS
SELECT
  pr.id AS payroll_run_id,
  pr.organization_id,
  pr.pay_period_start,
  pr.pay_period_end,
  pr.pay_date,
  pr.status,
  pr.total_employees,
  pr.total_regular_hours,
  pr.total_overtime_hours,
  pr.total_gross_pay,
  pr.total_net_pay,
  pp.provider_name,
  pp.pay_frequency
FROM payroll_runs pr
JOIN payroll_providers pp ON pp.id = pr.payroll_provider_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE dodd_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dodd_caregiver_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpc_service_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpc_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_directed_employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_directed_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_directed_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_employee_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY dodd_cert_org_policy ON dodd_certifications
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY dodd_req_org_policy ON dodd_caregiver_requirements
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY hpc_codes_policy ON hpc_service_codes FOR SELECT USING (TRUE);

CREATE POLICY hpc_auth_org_policy ON hpc_authorizations
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY cde_org_policy ON consumer_directed_employers
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY cdw_org_policy ON consumer_directed_workers
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY cdt_org_policy ON consumer_directed_timesheets
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY payroll_prov_org_policy ON payroll_providers
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY payroll_emp_org_policy ON payroll_employee_mappings
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY payroll_run_org_policy ON payroll_runs
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY payroll_item_policy ON payroll_line_items
  FOR ALL USING (payroll_run_id IN (
    SELECT id FROM payroll_runs WHERE organization_id = current_setting('app.organization_id')::UUID
  ));

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE dodd_certifications IS 'DODD provider certification tracking for HPC services';
COMMENT ON TABLE dodd_caregiver_requirements IS 'DODD-specific caregiver requirements and eligibility';
COMMENT ON TABLE hpc_service_codes IS 'Ohio DODD HPC service codes and rates';
COMMENT ON TABLE hpc_authorizations IS 'Client HPC authorizations from Individual Service Plans';
COMMENT ON TABLE consumer_directed_employers IS 'Consumer-directed employer (client/family) tracking';
COMMENT ON TABLE consumer_directed_workers IS 'Consumer-directed worker relationships and pay rates';
COMMENT ON TABLE consumer_directed_timesheets IS 'Consumer-directed timesheet submissions for FMS';
COMMENT ON TABLE payroll_providers IS 'Payroll provider integrations (ADP, Gusto, etc.)';
COMMENT ON TABLE payroll_runs IS 'Payroll processing runs by pay period';
COMMENT ON TABLE payroll_line_items IS 'Individual employee payroll line items';
