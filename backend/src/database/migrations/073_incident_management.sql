-- Migration: Incident Management System
-- Purpose: Track critical incidents with 24-hour ODA reporting deadline per OAC 173-39-02.10
-- Compliance: Ohio Administrative Code 173-39-02.10 - Incident Reporting Requirements
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
-- Incidents Table
-- ============================================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Incident Identification
  incident_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: INC-2025-001
  incident_type VARCHAR(100) NOT NULL CHECK (incident_type IN (
    'death', 'serious_injury', 'abuse_suspicion', 'neglect_suspicion',
    'exploitation_suspicion', 'medication_error', 'fall_with_injury',
    'emergency_room_visit', 'hospitalization', 'missing_person',
    'fire', 'natural_disaster', 'criminal_activity', 'law_enforcement_contact',
    'rights_violation', 'property_damage', 'unusual_occurrence', 'other'
  )),
  severity VARCHAR(50) NOT NULL CHECK (severity IN (
    'critical', -- Report to ODA within 24 hours
    'reportable', -- Report to ODA within 5 business days
    'unusual_occurrence' -- Document internally
  )),

  -- Incident Timing
  incident_date TIMESTAMPTZ NOT NULL,
  discovery_date TIMESTAMPTZ NOT NULL,
  reporting_deadline TIMESTAMPTZ NOT NULL, -- Auto-calculated based on severity

  -- Involved Parties
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  witness_ids JSONB DEFAULT '[]'::jsonb, -- Array of user IDs who witnessed

  -- Incident Details
  location TEXT NOT NULL, -- Where incident occurred
  description TEXT NOT NULL,
  immediate_actions_taken TEXT,
  injuries_sustained TEXT,
  medical_treatment_required BOOLEAN DEFAULT false,
  medical_facility VARCHAR(200),

  -- Status Tracking
  status VARCHAR(50) DEFAULT 'reported' CHECK (status IN (
    'reported', 'investigating', 'resolved', 'closed'
  )),

  -- External Reporting
  reported_to_oda BOOLEAN DEFAULT false,
  oda_notification_date TIMESTAMPTZ,
  oda_case_number VARCHAR(100),
  oda_follow_up_required BOOLEAN DEFAULT false,

  reported_to_aps BOOLEAN DEFAULT false, -- Adult Protective Services
  aps_notification_date TIMESTAMPTZ,
  aps_case_number VARCHAR(100),

  reported_to_law_enforcement BOOLEAN DEFAULT false,
  law_enforcement_agency VARCHAR(200),
  law_enforcement_case_number VARCHAR(100),
  law_enforcement_notification_date TIMESTAMPTZ,

  reported_to_family BOOLEAN DEFAULT false,
  family_notification_date TIMESTAMPTZ,
  family_notified_by UUID REFERENCES users(id),

  -- Documentation
  photos_taken BOOLEAN DEFAULT false,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  witness_statements JSONB DEFAULT '[]'::jsonb, -- Array of {witnessId, statement, date}
  supporting_documents JSONB DEFAULT '[]'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_incidents_org ON incidents(organization_id);
CREATE INDEX idx_incidents_client ON incidents(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_incidents_caregiver ON incidents(caregiver_id) WHERE caregiver_id IS NOT NULL;
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_deadline ON incidents(reporting_deadline) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_incidents_oda_pending ON incidents(reported_to_oda) WHERE reported_to_oda = false AND severity IN ('critical', 'reportable');
CREATE INDEX idx_incidents_date ON incidents(incident_date DESC);

-- RLS Policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_org_isolation ON incidents
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Incident Investigations Table
-- ============================================================================

CREATE TABLE incident_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Investigation Timeline
  investigation_deadline TIMESTAMPTZ NOT NULL, -- 5 days for critical, 10 days for reportable
  investigator_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Investigation Findings
  root_cause_analysis TEXT,
  contributing_factors JSONB DEFAULT '[]'::jsonb, -- Array of factors
  timeline_of_events TEXT,

  -- Interviews Conducted
  interviews JSONB DEFAULT '[]'::jsonb, -- Array of {personId, personName, role, date, summary}

  -- Corrective Actions
  corrective_actions JSONB DEFAULT '[]'::jsonb, -- Array of {action, assignedTo, deadline, completed, completedDate}
  preventive_measures JSONB DEFAULT '[]'::jsonb, -- Array of measures to prevent recurrence

  -- Training Needs Identified
  training_required JSONB DEFAULT '[]'::jsonb, -- Array of {topic, targetAudience, deadline}

  -- Policy/Procedure Updates
  policy_updates_required BOOLEAN DEFAULT false,
  policy_updates JSONB DEFAULT '[]'::jsonb,

  -- Status
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'overdue'
  )),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incident_investigations_incident ON incident_investigations(incident_id);
CREATE INDEX idx_incident_investigations_investigator ON incident_investigations(investigator_id);
CREATE INDEX idx_incident_investigations_status ON incident_investigations(status);
CREATE INDEX idx_incident_investigations_deadline ON incident_investigations(investigation_deadline) WHERE status != 'completed';

-- RLS Policies
ALTER TABLE incident_investigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_investigations_via_incident ON incident_investigations
  USING (
    incident_id IN (
      SELECT id FROM incidents WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Incident Alerts Table
-- ============================================================================

CREATE TABLE incident_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Alert Details
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'deadline_12_hours', 'deadline_20_hours', 'deadline_24_hours',
    'deadline_missed', 'investigation_due_soon', 'investigation_overdue',
    'corrective_action_due', 'oda_follow_up_required'
  )),
  alert_priority VARCHAR(50) DEFAULT 'medium' CHECK (alert_priority IN ('low', 'medium', 'high', 'critical')),

  -- Recipients
  recipient_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of user IDs

  -- Status
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incident_alerts_incident ON incident_alerts(incident_id);
CREATE INDEX idx_incident_alerts_type ON incident_alerts(alert_type);
CREATE INDEX idx_incident_alerts_sent ON incident_alerts(sent_at DESC);

-- RLS Policies
ALTER TABLE incident_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_alerts_via_incident ON incident_alerts
  USING (
    incident_id IN (
      SELECT id FROM incidents WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Incident Types Configuration Table
-- ============================================================================

CREATE TABLE incident_type_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system-wide

  -- Incident Type Details
  incident_type VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  default_severity VARCHAR(50) CHECK (default_severity IN ('critical', 'reportable', 'unusual_occurrence')),

  -- Reporting Requirements
  requires_oda_report BOOLEAN DEFAULT false,
  requires_aps_report BOOLEAN DEFAULT false,
  requires_law_enforcement_report BOOLEAN DEFAULT false,
  requires_family_notification BOOLEAN DEFAULT true,

  -- Investigation Requirements
  requires_investigation BOOLEAN DEFAULT true,
  investigation_deadline_hours INTEGER DEFAULT 120, -- 5 days default

  -- Workflow
  workflow_steps JSONB DEFAULT '[]'::jsonb, -- Array of required steps
  required_fields JSONB DEFAULT '[]'::jsonb, -- Array of field names that must be filled

  -- Active
  active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_incident_type_per_org UNIQUE (organization_id, incident_type)
);

-- Indexes
CREATE INDEX idx_incident_type_configs_org ON incident_type_configurations(organization_id);
CREATE INDEX idx_incident_type_configs_type ON incident_type_configurations(incident_type);
CREATE INDEX idx_incident_type_configs_active ON incident_type_configurations(active) WHERE active = true;

-- RLS Policies
ALTER TABLE incident_type_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_type_configs_org_isolation ON incident_type_configurations
  USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

-- ============================================================================
-- Seed Data: Default Incident Type Configurations
-- ============================================================================

INSERT INTO incident_type_configurations (incident_type, display_name, default_severity, requires_oda_report, requires_aps_report, requires_law_enforcement_report, investigation_deadline_hours) VALUES
  ('death', 'Death of Client', 'critical', true, true, true, 24),
  ('serious_injury', 'Serious Injury', 'critical', true, false, false, 24),
  ('abuse_suspicion', 'Suspected Abuse', 'critical', true, true, true, 24),
  ('neglect_suspicion', 'Suspected Neglect', 'critical', true, true, false, 24),
  ('exploitation_suspicion', 'Suspected Exploitation', 'critical', true, true, true, 24),
  ('medication_error', 'Medication Error', 'reportable', true, false, false, 120),
  ('fall_with_injury', 'Fall with Injury', 'reportable', true, false, false, 120),
  ('emergency_room_visit', 'Emergency Room Visit', 'reportable', true, false, false, 120),
  ('hospitalization', 'Hospitalization', 'reportable', true, false, false, 120),
  ('missing_person', 'Missing Person', 'critical', true, false, true, 24),
  ('fire', 'Fire/Smoke Incident', 'critical', true, false, true, 24),
  ('natural_disaster', 'Natural Disaster Impact', 'reportable', true, false, false, 120),
  ('criminal_activity', 'Criminal Activity', 'critical', true, false, true, 24),
  ('law_enforcement_contact', 'Law Enforcement Contact', 'reportable', true, false, false, 120),
  ('rights_violation', 'Client Rights Violation', 'reportable', true, false, false, 120),
  ('property_damage', 'Property Damage', 'unusual_occurrence', false, false, false, 240),
  ('unusual_occurrence', 'Unusual Occurrence', 'unusual_occurrence', false, false, false, 240);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_incident_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next incident number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(incident_number FROM 'INC-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM incidents
  WHERE incident_number LIKE 'INC-' || year_str || '-%';

  new_incident_number := 'INC-' || year_str || '-' || LPAD(next_number::TEXT, 4, '0');
  NEW.incident_number := new_incident_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_incident_number
  BEFORE INSERT ON incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();

-- Auto-calculate reporting deadline
CREATE OR REPLACE FUNCTION calculate_reporting_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'critical' THEN
    -- Critical incidents: 24 hours from discovery
    NEW.reporting_deadline := NEW.discovery_date + INTERVAL '24 hours';
  ELSIF NEW.severity = 'reportable' THEN
    -- Reportable incidents: 5 business days from discovery
    NEW.reporting_deadline := NEW.discovery_date + INTERVAL '5 days';
  ELSE
    -- Unusual occurrences: 10 business days
    NEW.reporting_deadline := NEW.discovery_date + INTERVAL '10 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_reporting_deadline
  BEFORE INSERT OR UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reporting_deadline();

-- Auto-create investigation record
CREATE OR REPLACE FUNCTION create_incident_investigation()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  deadline_hours INTEGER;
BEGIN
  -- Get incident type configuration
  SELECT * INTO config
  FROM incident_type_configurations
  WHERE incident_type = NEW.incident_type
    AND (organization_id IS NULL OR organization_id = NEW.organization_id)
    AND active = true
  ORDER BY organization_id DESC NULLS LAST
  LIMIT 1;

  IF config.requires_investigation THEN
    deadline_hours := COALESCE(config.investigation_deadline_hours, 120);

    INSERT INTO incident_investigations (
      incident_id,
      investigation_deadline,
      investigator_id,
      status
    ) VALUES (
      NEW.id,
      NEW.discovery_date + (deadline_hours || ' hours')::INTERVAL,
      NEW.created_by, -- Assign to incident reporter initially
      'not_started'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_incident_investigation
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION create_incident_investigation();

-- Update timestamps
CREATE TRIGGER update_incidents_timestamp
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_investigations_timestamp
  BEFORE UPDATE ON incident_investigations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_type_configurations_timestamp
  BEFORE UPDATE ON incident_type_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Overdue Incident Reports
CREATE VIEW overdue_incident_reports AS
SELECT
  i.id,
  i.incident_number,
  i.organization_id,
  i.incident_type,
  i.severity,
  i.incident_date,
  i.discovery_date,
  i.reporting_deadline,
  EXTRACT(EPOCH FROM (NOW() - i.reporting_deadline)) / 3600 AS hours_overdue,
  i.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  i.caregiver_id,
  u.first_name || ' ' || u.last_name AS caregiver_name,
  i.reported_to_oda,
  i.status
FROM incidents i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN users u ON i.caregiver_id = u.id
WHERE i.reporting_deadline < NOW()
  AND i.status NOT IN ('resolved', 'closed')
  AND (
    (i.severity = 'critical' AND i.reported_to_oda = false)
    OR (i.severity = 'reportable' AND i.reported_to_oda = false)
  );

-- Pending Incident Investigations
CREATE VIEW pending_incident_investigations AS
SELECT
  ii.id,
  ii.incident_id,
  i.incident_number,
  i.organization_id,
  i.incident_type,
  i.severity,
  ii.investigation_deadline,
  ii.investigator_id,
  u.first_name || ' ' || u.last_name AS investigator_name,
  ii.status,
  CASE
    WHEN ii.investigation_deadline < NOW() THEN 'overdue'
    WHEN ii.investigation_deadline < NOW() + INTERVAL '24 hours' THEN 'due_soon'
    ELSE 'on_track'
  END AS deadline_status,
  EXTRACT(EPOCH FROM (NOW() - ii.investigation_deadline)) / 3600 AS hours_overdue
FROM incident_investigations ii
JOIN incidents i ON ii.incident_id = i.id
LEFT JOIN users u ON ii.investigator_id = u.id
WHERE ii.status != 'completed';

-- Incident Summary by Type
CREATE VIEW incident_summary_by_type AS
SELECT
  i.organization_id,
  i.incident_type,
  COUNT(*) AS total_incidents,
  COUNT(CASE WHEN i.severity = 'critical' THEN 1 END) AS critical_count,
  COUNT(CASE WHEN i.severity = 'reportable' THEN 1 END) AS reportable_count,
  COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) AS resolved_count,
  COUNT(CASE WHEN i.reporting_deadline < NOW() AND i.reported_to_oda = false THEN 1 END) AS overdue_count,
  MAX(i.incident_date) AS last_incident_date
FROM incidents i
GROUP BY i.organization_id, i.incident_type;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE incidents IS 'Critical incident tracking per OAC 173-39-02.10 - 24-hour ODA reporting requirement';
COMMENT ON TABLE incident_investigations IS 'Root cause analysis and corrective action planning for incidents';
COMMENT ON TABLE incident_alerts IS 'Automated alerts for incident reporting deadlines';
COMMENT ON TABLE incident_type_configurations IS 'Configuration for different incident types and reporting requirements';
COMMENT ON VIEW overdue_incident_reports IS 'Alert view for overdue incident reports (past 24-hour deadline)';
COMMENT ON VIEW pending_incident_investigations IS 'View of investigations in progress or overdue';
COMMENT ON VIEW incident_summary_by_type IS 'Summary statistics of incidents by type for compliance reporting';
