-- Migration: Quality Assurance and Performance Improvement (QAPI) Program
-- Purpose: Track quality metrics, performance improvement projects, and QAPI committee activities
-- Compliance: OAC 173-39-02.8 - Quality Assurance Program
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
-- QAPI Committee Table
-- ============================================================================

CREATE TABLE qapi_committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Member Details
  role_on_committee VARCHAR(100) NOT NULL, -- chair, member, advisor, etc.
  department VARCHAR(100),
  expertise_area VARCHAR(200), -- clinical, operations, compliance, IT, etc.

  -- Appointment
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  term_end_date DATE,
  active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_qapi_committee_org ON qapi_committee_members(organization_id);
CREATE INDEX idx_qapi_committee_user ON qapi_committee_members(user_id);
CREATE INDEX idx_qapi_committee_active ON qapi_committee_members(active) WHERE active = true;

-- RLS Policies
ALTER TABLE qapi_committee_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY qapi_committee_org_isolation ON qapi_committee_members
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- QAPI Meetings Table
-- ============================================================================

CREATE TABLE qapi_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Meeting Details
  meeting_number VARCHAR(50) UNIQUE,
  meeting_date DATE NOT NULL,
  meeting_type VARCHAR(50) DEFAULT 'quarterly' CHECK (meeting_type IN (
    'quarterly', 'monthly', 'emergency', 'annual'
  )),
  location VARCHAR(200),
  virtual_meeting BOOLEAN DEFAULT false,

  -- Attendance
  attendees JSONB DEFAULT '[]'::jsonb, -- Array of {userId, name, role, present}
  quorum_met BOOLEAN DEFAULT false,

  -- Agenda & Minutes
  agenda_items JSONB DEFAULT '[]'::jsonb, -- Array of {item, presenter, duration}
  minutes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb, -- Array of {action, assignedTo, deadline, status}

  -- Topics Discussed
  topics JSONB DEFAULT '[]'::jsonb, -- safety, infection_control, staffing, etc.

  -- Metrics Reviewed
  metrics_reviewed JSONB DEFAULT '[]'::jsonb, -- Array of metric IDs

  -- PIPs Discussed
  pips_discussed JSONB DEFAULT '[]'::jsonb, -- Array of PIP IDs

  -- Next Meeting
  next_meeting_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_qapi_meetings_org ON qapi_meetings(organization_id);
CREATE INDEX idx_qapi_meetings_date ON qapi_meetings(meeting_date DESC);
CREATE INDEX idx_qapi_meetings_status ON qapi_meetings(status);

-- RLS Policies
ALTER TABLE qapi_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY qapi_meetings_org_isolation ON qapi_meetings
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Quality Metrics Table
-- ============================================================================

CREATE TABLE quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Metric Definition
  metric_code VARCHAR(50) NOT NULL,
  metric_name VARCHAR(200) NOT NULL,
  metric_category VARCHAR(100), -- clinical, operational, financial, compliance, satisfaction
  metric_type VARCHAR(50) CHECK (metric_type IN ('percentage', 'count', 'rate', 'score', 'time')),

  -- Measurement
  measurement_frequency VARCHAR(50) CHECK (measurement_frequency IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'annually'
  )),
  data_source VARCHAR(200), -- Where data comes from
  calculation_method TEXT,

  -- Targets & Benchmarks
  target_value DECIMAL(10,2),
  benchmark_value DECIMAL(10,2), -- Industry or national benchmark
  lower_threshold DECIMAL(10,2), -- Alert if below this
  upper_threshold DECIMAL(10,2), -- Alert if above this (for negative metrics)

  -- Reporting
  display_on_dashboard BOOLEAN DEFAULT true,
  report_to_qapi BOOLEAN DEFAULT true,

  -- Status
  active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_metric_code UNIQUE (organization_id, metric_code)
);

-- Indexes
CREATE INDEX idx_quality_metrics_org ON quality_metrics(organization_id);
CREATE INDEX idx_quality_metrics_category ON quality_metrics(metric_category);
CREATE INDEX idx_quality_metrics_active ON quality_metrics(active) WHERE active = true;

-- RLS Policies
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY quality_metrics_org_isolation ON quality_metrics
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Metric Data Points Table
-- ============================================================================

CREATE TABLE metric_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES quality_metrics(id) ON DELETE CASCADE,

  -- Measurement Period
  measurement_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,

  -- Values
  actual_value DECIMAL(10,2) NOT NULL,
  numerator DECIMAL(10,2), -- For rates/percentages
  denominator DECIMAL(10,2),

  -- Performance Analysis
  meets_target BOOLEAN,
  variance_from_target DECIMAL(10,2), -- Actual - Target
  variance_percentage DECIMAL(5,2), -- ((Actual - Target) / Target) * 100

  -- Context
  notes TEXT,
  contributing_factors JSONB DEFAULT '[]'::jsonb,

  -- Audit
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_metric_data_points_metric ON metric_data_points(metric_id, measurement_date DESC);
CREATE INDEX idx_metric_data_points_date ON metric_data_points(measurement_date DESC);
CREATE INDEX idx_metric_data_points_performance ON metric_data_points(meets_target);

-- RLS Policies
ALTER TABLE metric_data_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY metric_data_points_via_metric ON metric_data_points
  USING (
    metric_id IN (
      SELECT id FROM quality_metrics
      WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Performance Improvement Projects (PIPs) Table
-- ============================================================================

CREATE TABLE performance_improvement_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Project Details
  pip_number VARCHAR(50) UNIQUE,
  project_name VARCHAR(200) NOT NULL,
  project_category VARCHAR(100), -- clinical, operational, compliance, safety, etc.

  -- Problem Statement
  problem_statement TEXT NOT NULL,
  current_state_description TEXT,
  root_cause_analysis TEXT,

  -- Goals & Objectives
  goal_statement TEXT NOT NULL,
  measurable_objectives JSONB DEFAULT '[]'::jsonb, -- Array of {objective, target, metric}

  -- Scope
  departments_involved JSONB DEFAULT '[]'::jsonb,
  staff_involved JSONB DEFAULT '[]'::jsonb,
  clients_affected INTEGER,

  -- Timeline
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  actual_completion_date DATE,

  -- Team
  project_leader_id UUID REFERENCES users(id),
  team_members JSONB DEFAULT '[]'::jsonb, -- Array of {userId, name, role}

  -- Interventions
  interventions JSONB DEFAULT '[]'::jsonb, -- Array of {intervention, implementationDate, responsible}

  -- Monitoring
  monitoring_metrics JSONB DEFAULT '[]'::jsonb, -- Array of metric IDs
  monitoring_frequency VARCHAR(50),

  -- Results
  baseline_data JSONB DEFAULT '{}'::jsonb,
  post_intervention_data JSONB DEFAULT '{}'::jsonb,
  outcomes_achieved TEXT,
  lessons_learned TEXT,

  -- Sustainability
  sustainability_plan TEXT,
  sustainability_monitoring_plan TEXT,

  -- PDSA Cycles (Plan-Do-Study-Act)
  pdsa_cycles JSONB DEFAULT '[]'::jsonb, -- Array of {cycle, plan, do, study, act, date}

  -- Status
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN (
    'planning', 'implementing', 'monitoring', 'completed', 'on_hold', 'cancelled'
  )),
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_pips_org ON performance_improvement_projects(organization_id);
CREATE INDEX idx_pips_status ON performance_improvement_projects(status);
CREATE INDEX idx_pips_leader ON performance_improvement_projects(project_leader_id);
CREATE INDEX idx_pips_completion ON performance_improvement_projects(target_completion_date);

-- RLS Policies
ALTER TABLE performance_improvement_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY pips_org_isolation ON performance_improvement_projects
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate QAPI meeting number
CREATE OR REPLACE FUNCTION generate_qapi_meeting_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_meeting_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(NEW.meeting_date, 'YYYY');

  -- Get next meeting number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(meeting_number FROM 'QAPI-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM qapi_meetings
  WHERE meeting_number LIKE 'QAPI-' || year_str || '-%';

  new_meeting_number := 'QAPI-' || year_str || '-' || LPAD(next_number::TEXT, 2, '0');
  NEW.meeting_number := new_meeting_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_qapi_meeting_number
  BEFORE INSERT ON qapi_meetings
  FOR EACH ROW
  WHEN (NEW.meeting_number IS NULL)
  EXECUTE FUNCTION generate_qapi_meeting_number();

-- Auto-generate PIP number
CREATE OR REPLACE FUNCTION generate_pip_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_pip_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next PIP number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(pip_number FROM 'PIP-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM performance_improvement_projects
  WHERE pip_number LIKE 'PIP-' || year_str || '-%';

  new_pip_number := 'PIP-' || year_str || '-' || LPAD(next_number::TEXT, 3, '0');
  NEW.pip_number := new_pip_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_pip_number
  BEFORE INSERT ON performance_improvement_projects
  FOR EACH ROW
  WHEN (NEW.pip_number IS NULL)
  EXECUTE FUNCTION generate_pip_number();

-- Calculate metric variance
CREATE OR REPLACE FUNCTION calculate_metric_variance()
RETURNS TRIGGER AS $$
DECLARE
  target DECIMAL(10,2);
BEGIN
  -- Get target value from metric
  SELECT target_value INTO target
  FROM quality_metrics
  WHERE id = NEW.metric_id;

  IF target IS NOT NULL THEN
    NEW.variance_from_target := NEW.actual_value - target;
    NEW.variance_percentage := ((NEW.actual_value - target) / target) * 100;
    NEW.meets_target := (NEW.actual_value >= target);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_metric_variance
  BEFORE INSERT OR UPDATE ON metric_data_points
  FOR EACH ROW
  EXECUTE FUNCTION calculate_metric_variance();

-- Update timestamps
CREATE TRIGGER update_qapi_committee_timestamp
  BEFORE UPDATE ON qapi_committee_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qapi_meetings_timestamp
  BEFORE UPDATE ON qapi_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_metrics_timestamp
  BEFORE UPDATE ON quality_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pips_timestamp
  BEFORE UPDATE ON performance_improvement_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Active QAPI Committee
CREATE VIEW active_qapi_committee AS
SELECT
  qcm.id,
  qcm.organization_id,
  qcm.user_id,
  u.first_name || ' ' || u.last_name AS member_name,
  u.email,
  qcm.role_on_committee,
  qcm.department,
  qcm.expertise_area,
  qcm.appointment_date,
  qcm.term_end_date
FROM qapi_committee_members qcm
JOIN users u ON qcm.user_id = u.id
WHERE qcm.active = true
ORDER BY qcm.role_on_committee, member_name;

-- Recent Quality Metrics Performance
CREATE VIEW recent_quality_metrics_performance AS
SELECT
  qm.id AS metric_id,
  qm.organization_id,
  qm.metric_code,
  qm.metric_name,
  qm.metric_category,
  qm.target_value,
  mdp.measurement_date,
  mdp.actual_value,
  mdp.meets_target,
  mdp.variance_from_target,
  mdp.variance_percentage
FROM quality_metrics qm
JOIN metric_data_points mdp ON qm.id = mdp.metric_id
WHERE mdp.measurement_date >= CURRENT_DATE - INTERVAL '90 days'
  AND qm.active = true
ORDER BY qm.metric_category, qm.metric_name, mdp.measurement_date DESC;

-- Active PIPs Summary
CREATE VIEW active_pips_summary AS
SELECT
  pip.id,
  pip.organization_id,
  pip.pip_number,
  pip.project_name,
  pip.project_category,
  u.first_name || ' ' || u.last_name AS project_leader,
  pip.start_date,
  pip.target_completion_date,
  pip.status,
  pip.percent_complete,
  CASE
    WHEN pip.target_completion_date < CURRENT_DATE AND pip.status NOT IN ('completed', 'cancelled') THEN true
    ELSE false
  END AS overdue
FROM performance_improvement_projects pip
LEFT JOIN users u ON pip.project_leader_id = u.id
WHERE pip.status IN ('planning', 'implementing', 'monitoring')
ORDER BY pip.target_completion_date;

-- QAPI Dashboard Summary
CREATE VIEW qapi_dashboard_summary AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  (SELECT COUNT(*) FROM qapi_committee_members WHERE organization_id = o.id AND active = true) AS committee_members,
  (SELECT meeting_date FROM qapi_meetings WHERE organization_id = o.id AND status = 'completed' ORDER BY meeting_date DESC LIMIT 1) AS last_meeting_date,
  (SELECT next_meeting_date FROM qapi_meetings WHERE organization_id = o.id AND status = 'completed' ORDER BY meeting_date DESC LIMIT 1) AS next_meeting_date,
  (SELECT COUNT(*) FROM quality_metrics WHERE organization_id = o.id AND active = true) AS active_metrics,
  (SELECT COUNT(*) FROM performance_improvement_projects WHERE organization_id = o.id AND status IN ('planning', 'implementing', 'monitoring')) AS active_pips
FROM organizations o;

-- ============================================================================
-- Seed Data: Common Quality Metrics
-- ============================================================================

INSERT INTO quality_metrics (metric_code, metric_name, metric_category, metric_type, measurement_frequency, target_value, organization_id)
SELECT
  'FALLS_RATE',
  'Client Fall Rate (per 1000 client days)',
  'safety',
  'rate',
  'monthly',
  2.5,
  id
FROM organizations;

INSERT INTO quality_metrics (metric_code, metric_name, metric_category, metric_type, measurement_frequency, target_value, organization_id)
SELECT
  'SUPERVISION_COMPLIANCE',
  'RN Supervisory Visit Compliance (%)',
  'clinical',
  'percentage',
  'monthly',
  100.0,
  id
FROM organizations;

INSERT INTO quality_metrics (metric_code, metric_name, metric_category, metric_type, measurement_frequency, target_value, organization_id)
SELECT
  'INCIDENT_RESPONSE_TIME',
  'Average Time to Report Critical Incidents (hours)',
  'compliance',
  'time',
  'monthly',
  12.0,
  id
FROM organizations;

INSERT INTO quality_metrics (metric_code, metric_name, metric_category, metric_type, measurement_frequency, target_value, organization_id)
SELECT
  'CLIENT_SATISFACTION',
  'Client Satisfaction Score (0-100)',
  'satisfaction',
  'score',
  'quarterly',
  90.0,
  id
FROM organizations;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE qapi_committee_members IS 'QAPI committee membership per OAC 173-39-02.8';
COMMENT ON TABLE qapi_meetings IS 'QAPI committee meeting logs (quarterly minimum)';
COMMENT ON TABLE quality_metrics IS 'Quality metrics definitions and targets';
COMMENT ON TABLE metric_data_points IS 'Quality metric measurements over time';
COMMENT ON TABLE performance_improvement_projects IS 'Performance improvement projects (PIPs)';
COMMENT ON VIEW active_qapi_committee IS 'Current QAPI committee roster';
COMMENT ON VIEW recent_quality_metrics_performance IS 'Quality metrics performance (last 90 days)';
COMMENT ON VIEW active_pips_summary IS 'Active performance improvement projects';
COMMENT ON VIEW qapi_dashboard_summary IS 'QAPI program dashboard summary';
