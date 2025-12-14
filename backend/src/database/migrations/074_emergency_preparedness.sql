-- Migration: Emergency Preparedness & Disaster Recovery
-- Purpose: Document disaster recovery plans and DR testing per OAC 173-39-02.6
-- Compliance: Ohio Administrative Code 173-39-02.6 - Emergency Preparedness
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
-- Disaster Recovery Plans Table
-- ============================================================================

CREATE TABLE disaster_recovery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Plan Details
  plan_version VARCHAR(20) NOT NULL,
  plan_name VARCHAR(200) DEFAULT 'Disaster Recovery & Business Continuity Plan',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE, -- Plans should be reviewed annually
  next_review_date DATE NOT NULL,

  -- Disaster Types Covered
  disaster_types JSONB DEFAULT '[]'::jsonb, -- Array of: natural_disaster, power_outage, cyberattack, pandemic, etc.

  -- Recovery Objectives
  rto_hours INTEGER NOT NULL DEFAULT 24, -- Recovery Time Objective (max downtime)
  rpo_hours INTEGER NOT NULL DEFAULT 4, -- Recovery Point Objective (max data loss)

  -- Emergency Contacts
  emergency_contacts JSONB DEFAULT '[]'::jsonb, -- Array of {name, role, phone, email, priority}
  on_call_schedule JSONB DEFAULT '{}'::jsonb, -- On-call rotation by week

  -- Communication Procedures
  client_notification_procedure TEXT, -- How to notify clients during emergency
  staff_notification_procedure TEXT, -- How to notify staff
  payer_notification_procedure TEXT, -- How to notify Medicaid/payers
  family_notification_procedure TEXT, -- How to notify families

  -- Service Continuity
  service_continuity_plan TEXT, -- How to maintain care delivery during emergency
  critical_functions JSONB DEFAULT '[]'::jsonb, -- Array of {function, priority, dependencies}
  backup_procedures TEXT,
  alternative_care_arrangements TEXT, -- Backup caregivers, partner agencies

  -- IT/System Recovery
  it_recovery_plan TEXT,
  data_backup_frequency VARCHAR(50) DEFAULT 'daily', -- hourly, daily, weekly
  backup_location VARCHAR(200), -- Off-site backup location
  system_restoration_steps TEXT,

  -- Supplies & Resources
  emergency_supplies_list JSONB DEFAULT '[]'::jsonb, -- PPE, medical supplies, etc.
  emergency_fund_amount DECIMAL(12,2), -- Emergency operating funds

  -- Approval & Distribution
  approved_by UUID REFERENCES users(id),
  approved_date DATE,
  distribution_list JSONB DEFAULT '[]'::jsonb, -- Who has copies of the plan

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'expired', 'archived')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_drp_org ON disaster_recovery_plans(organization_id);
CREATE INDEX idx_drp_status ON disaster_recovery_plans(status);
CREATE INDEX idx_drp_review_date ON disaster_recovery_plans(next_review_date) WHERE status = 'active';
CREATE INDEX idx_drp_expiration ON disaster_recovery_plans(expiration_date) WHERE status = 'active';

-- RLS Policies
ALTER TABLE disaster_recovery_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY drp_org_isolation ON disaster_recovery_plans
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- DR Test Logs Table
-- ============================================================================

CREATE TABLE dr_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES disaster_recovery_plans(id) ON DELETE CASCADE,

  -- Test Details
  test_date DATE NOT NULL,
  test_type VARCHAR(50) NOT NULL CHECK (test_type IN (
    'tabletop_exercise', 'simulation', 'partial_failover', 'full_failover',
    'communication_test', 'backup_restoration_test'
  )),
  test_scenario TEXT NOT NULL, -- Description of simulated disaster

  -- Participants
  test_coordinator_id UUID REFERENCES users(id),
  participants JSONB DEFAULT '[]'::jsonb, -- Array of {userId, name, role}

  -- Test Objectives & Criteria
  test_objectives JSONB DEFAULT '[]'::jsonb, -- Array of objectives
  success_criteria JSONB DEFAULT '[]'::jsonb, -- Array of {criterion, metStatus}

  -- Test Results
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  test_results TEXT, -- Detailed findings
  passed BOOLEAN,

  -- Findings
  gaps_identified JSONB DEFAULT '[]'::jsonb, -- Array of {gap, severity, area}
  strengths_identified JSONB DEFAULT '[]'::jsonb, -- What worked well
  lessons_learned TEXT,

  -- Corrective Actions
  corrective_actions JSONB DEFAULT '[]'::jsonb, -- Array of {action, assignedTo, deadline, status}
  plan_updates_required BOOLEAN DEFAULT false,
  plan_updates_completed BOOLEAN DEFAULT false,

  -- Follow-up
  next_test_recommended_date DATE,
  follow_up_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dr_test_plan ON dr_test_logs(plan_id);
CREATE INDEX idx_dr_test_date ON dr_test_logs(test_date DESC);
CREATE INDEX idx_dr_test_coordinator ON dr_test_logs(test_coordinator_id);
CREATE INDEX idx_dr_test_passed ON dr_test_logs(passed);

-- RLS Policies
ALTER TABLE dr_test_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY dr_test_via_plan ON dr_test_logs
  USING (
    plan_id IN (
      SELECT id FROM disaster_recovery_plans
      WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Emergency Contacts Table
-- ============================================================================

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact Details
  contact_name VARCHAR(200) NOT NULL,
  contact_role VARCHAR(100) NOT NULL, -- fire_dept, police, oda, medicaid, it_support, etc.
  contact_type VARCHAR(50) CHECK (contact_type IN (
    'internal', 'external_agency', 'vendor', 'emergency_service'
  )),

  -- Contact Information
  primary_phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(200),
  address TEXT,

  -- Availability
  available_24_7 BOOLEAN DEFAULT false,
  available_hours VARCHAR(100), -- e.g., "Monday-Friday 8am-5pm"

  -- Priority & Usage
  priority_level INTEGER DEFAULT 5, -- 1 = highest, 5 = lowest
  use_cases TEXT, -- When to contact (e.g., "System outage", "Fire/safety emergency")

  -- Status
  active BOOLEAN DEFAULT true,
  last_verified_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_emergency_contacts_org ON emergency_contacts(organization_id);
CREATE INDEX idx_emergency_contacts_role ON emergency_contacts(contact_role);
CREATE INDEX idx_emergency_contacts_active ON emergency_contacts(active) WHERE active = true;

-- RLS Policies
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_contacts_org_isolation ON emergency_contacts
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Emergency Incidents Table (Major Events)
-- ============================================================================

CREATE TABLE emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Incident Details
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  emergency_type VARCHAR(100) NOT NULL, -- power_outage, natural_disaster, cyberattack, pandemic, etc.
  severity VARCHAR(50) CHECK (severity IN ('minor', 'moderate', 'major', 'catastrophic')),

  -- Timeline
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_hours DECIMAL(10,2),

  -- Impact Assessment
  services_affected TEXT,
  clients_affected INTEGER DEFAULT 0,
  staff_affected INTEGER DEFAULT 0,
  systems_affected JSONB DEFAULT '[]'::jsonb,

  -- Response Actions
  drp_activated BOOLEAN DEFAULT false,
  drp_activation_time TIMESTAMPTZ,
  response_actions JSONB DEFAULT '[]'::jsonb, -- Array of {action, time, responsiblePerson}

  -- Communications
  clients_notified BOOLEAN DEFAULT false,
  staff_notified BOOLEAN DEFAULT false,
  payers_notified BOOLEAN DEFAULT false,
  oda_notified BOOLEAN DEFAULT false,

  -- Recovery
  recovery_started_time TIMESTAMPTZ,
  recovery_completed_time TIMESTAMPTZ,
  full_service_restored BOOLEAN DEFAULT false,

  -- Post-Incident Review
  after_action_report TEXT,
  lessons_learned TEXT,
  plan_improvements_needed JSONB DEFAULT '[]'::jsonb,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'recovering', 'resolved', 'closed')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_emergency_incidents_org ON emergency_incidents(organization_id);
CREATE INDEX idx_emergency_incidents_type ON emergency_incidents(emergency_type);
CREATE INDEX idx_emergency_incidents_status ON emergency_incidents(status);
CREATE INDEX idx_emergency_incidents_start ON emergency_incidents(start_time DESC);

-- RLS Policies
ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_incidents_org_isolation ON emergency_incidents
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Seed Data: Default Emergency Contacts (Ohio)
-- ============================================================================

INSERT INTO emergency_contacts (organization_id, contact_name, contact_role, contact_type, primary_phone, email, available_24_7, use_cases, priority_level)
SELECT
  id,
  'Ohio Department of Aging',
  'oda',
  'external_agency',
  '1-866-243-5678',
  'aging@age.ohio.gov',
  false,
  'Critical incident reporting, license issues, compliance questions',
  1
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM emergency_contacts WHERE contact_role = 'oda'
);

INSERT INTO emergency_contacts (organization_id, contact_name, contact_role, contact_type, primary_phone, available_24_7, use_cases, priority_level)
SELECT
  id,
  '911 Emergency Services',
  'emergency_services',
  'emergency_service',
  '911',
  true,
  'Life-threatening emergencies, fires, medical emergencies',
  1
FROM organizations;

INSERT INTO emergency_contacts (organization_id, contact_name, contact_role, contact_type, primary_phone, available_24_7, use_cases, priority_level)
SELECT
  id,
  'Adult Protective Services',
  'aps',
  'external_agency',
  '1-855-640-4630',
  true,
  'Suspected abuse, neglect, or exploitation of adults',
  1
FROM organizations;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate emergency incident number
CREATE OR REPLACE FUNCTION generate_emergency_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_incident_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next incident number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(incident_number FROM 'EMRG-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM emergency_incidents
  WHERE incident_number LIKE 'EMRG-' || year_str || '-%';

  new_incident_number := 'EMRG-' || year_str || '-' || LPAD(next_number::TEXT, 3, '0');
  NEW.incident_number := new_incident_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_emergency_incident_number
  BEFORE INSERT ON emergency_incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_emergency_incident_number();

-- Update timestamps
CREATE TRIGGER update_drp_timestamp
  BEFORE UPDATE ON disaster_recovery_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dr_test_timestamp
  BEFORE UPDATE ON dr_test_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_timestamp
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_incidents_timestamp
  BEFORE UPDATE ON emergency_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Active DRP with Review Status
CREATE VIEW active_drp_status AS
SELECT
  drp.id,
  drp.organization_id,
  drp.plan_version,
  drp.effective_date,
  drp.next_review_date,
  CASE
    WHEN drp.next_review_date < CURRENT_DATE THEN 'overdue'
    WHEN drp.next_review_date < CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'current'
  END AS review_status,
  CURRENT_DATE - drp.next_review_date AS days_overdue,
  (SELECT MAX(test_date) FROM dr_test_logs WHERE plan_id = drp.id) AS last_test_date,
  (SELECT COUNT(*) FROM dr_test_logs WHERE plan_id = drp.id AND passed = true) AS successful_tests,
  (SELECT COUNT(*) FROM dr_test_logs WHERE plan_id = drp.id) AS total_tests
FROM disaster_recovery_plans drp
WHERE drp.status = 'active';

-- Emergency Preparedness Compliance Summary
CREATE VIEW emergency_preparedness_compliance AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM disaster_recovery_plans WHERE organization_id = o.id AND status = 'active') THEN true
    ELSE false
  END AS has_active_drp,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM dr_test_logs dt
      JOIN disaster_recovery_plans drp ON dt.plan_id = drp.id
      WHERE drp.organization_id = o.id AND dt.test_date >= CURRENT_DATE - INTERVAL '12 months'
    ) THEN true
    ELSE false
  END AS annual_test_completed,
  (SELECT COUNT(*) FROM emergency_contacts WHERE organization_id = o.id AND active = true) AS active_emergency_contacts,
  (SELECT next_review_date FROM disaster_recovery_plans WHERE organization_id = o.id AND status = 'active' LIMIT 1) AS next_drp_review
FROM organizations o;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE disaster_recovery_plans IS 'Disaster recovery and business continuity plans per OAC 173-39-02.6';
COMMENT ON TABLE dr_test_logs IS 'Annual DR testing documentation and results';
COMMENT ON TABLE emergency_contacts IS 'Emergency contact directory for quick access during incidents';
COMMENT ON TABLE emergency_incidents IS 'Major emergency events (power outages, disasters, etc.)';
COMMENT ON VIEW active_drp_status IS 'Active DRP review status and testing compliance';
COMMENT ON VIEW emergency_preparedness_compliance IS 'Organization-level emergency preparedness compliance status';
