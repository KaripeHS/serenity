-- ============================================================
-- Migration 063: Multi-Pod Operations
-- Phase 3, Months 7-8 - Pod-level Dashboards, Cross-Pod Sharing,
-- Regional Compliance Reporting
-- ============================================================

-- ============================================================
-- POD ENHANCEMENTS
-- ============================================================

-- Pod regions for geographic grouping
CREATE TABLE IF NOT EXISTS pod_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Geographic boundaries (for Ohio counties/areas)
  counties JSONB DEFAULT '[]', -- Array of Ohio county names
  zip_codes JSONB DEFAULT '[]', -- Array of zip codes

  -- Regional manager
  regional_manager_id UUID REFERENCES users(id),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pod_regions_org ON pod_regions(organization_id);

-- Add region to pods table (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pods' AND column_name = 'region_id'
  ) THEN
    ALTER TABLE pods ADD COLUMN region_id UUID REFERENCES pod_regions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pods' AND column_name = 'target_client_count'
  ) THEN
    ALTER TABLE pods ADD COLUMN target_client_count INTEGER DEFAULT 50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pods' AND column_name = 'target_caregiver_count'
  ) THEN
    ALTER TABLE pods ADD COLUMN target_caregiver_count INTEGER DEFAULT 20;
  END IF;
END $$;

-- ============================================================
-- CROSS-POD CAREGIVER SHARING
-- ============================================================

-- Track when caregivers work outside their primary pod
CREATE TABLE IF NOT EXISTS cross_pod_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),

  -- Pods involved
  pod_id UUID NOT NULL REFERENCES pods(id),
  assigned_pod_id UUID NOT NULL REFERENCES pods(id),

  -- Assignment details
  assignment_type VARCHAR(20) NOT NULL, -- 'temporary', 'permanent', 'floating'
  reason VARCHAR(50), -- 'coverage_gap', 'vacation_coverage', 'skill_match', 'client_request'

  -- Duration
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for permanent

  -- Shift constraints
  max_hours_per_week INTEGER DEFAULT 20,
  allowed_shift_types JSONB DEFAULT '[]', -- Types of shifts they can take

  -- Approval
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'active', 'completed'

  -- Tracking
  actual_hours_worked DECIMAL(6,2) DEFAULT 0,
  shifts_completed INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cross_pod_caregiver ON cross_pod_assignments(caregiver_id);
CREATE INDEX idx_cross_pod_assigned ON cross_pod_assignments(assigned_pod_id, status);
CREATE INDEX idx_cross_pod_dates ON cross_pod_assignments(start_date, end_date);

-- Floating caregiver pool (caregivers available for any pod)
CREATE TABLE IF NOT EXISTS floating_caregiver_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  caregiver_id UUID NOT NULL REFERENCES caregivers(id) UNIQUE,

  -- Availability for floating
  is_available BOOLEAN DEFAULT TRUE,
  available_pods JSONB DEFAULT '[]', -- Specific pods they can float to (empty = all)
  excluded_pods JSONB DEFAULT '[]', -- Pods they can't float to

  -- Preferences
  max_travel_miles INTEGER DEFAULT 30,
  preferred_shift_types JSONB DEFAULT '[]',
  preferred_days JSONB DEFAULT '[]', -- Days they prefer to float

  -- Performance requirements
  min_performance_score DECIMAL(5,2) DEFAULT 75,
  requires_transportation BOOLEAN DEFAULT TRUE,

  -- Stats
  total_float_hours DECIMAL(8,2) DEFAULT 0,
  total_float_shifts INTEGER DEFAULT 0,
  pods_worked JSONB DEFAULT '[]', -- Track all pods worked

  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_floating_pool_org ON floating_caregiver_pool(organization_id);
CREATE INDEX idx_floating_pool_available ON floating_caregiver_pool(organization_id)
WHERE is_available = TRUE;

-- ============================================================
-- POD PERFORMANCE TRACKING
-- ============================================================

-- Daily pod performance snapshots
CREATE TABLE IF NOT EXISTS pod_performance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  performance_date DATE NOT NULL,

  -- Capacity metrics
  active_clients INTEGER DEFAULT 0,
  active_caregivers INTEGER DEFAULT 0,
  client_to_caregiver_ratio DECIMAL(5,2),

  -- Scheduling metrics
  scheduled_shifts INTEGER DEFAULT 0,
  completed_shifts INTEGER DEFAULT 0,
  missed_shifts INTEGER DEFAULT 0,
  cancelled_shifts INTEGER DEFAULT 0,
  fill_rate DECIMAL(5,2), -- % of shifts filled
  completion_rate DECIMAL(5,2), -- % of filled shifts completed

  -- Hours metrics
  scheduled_hours DECIMAL(8,2) DEFAULT 0,
  worked_hours DECIMAL(8,2) DEFAULT 0,
  overtime_hours DECIMAL(8,2) DEFAULT 0,

  -- EVV metrics
  evv_compliance_rate DECIMAL(5,2),
  evv_exceptions INTEGER DEFAULT 0,

  -- Coverage metrics
  coverage_gaps INTEGER DEFAULT 0,
  gaps_filled INTEGER DEFAULT 0,
  gaps_unfilled INTEGER DEFAULT 0,

  -- Cross-pod activity
  cross_pod_hours_received DECIMAL(6,2) DEFAULT 0,
  cross_pod_hours_sent DECIMAL(6,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(pod_id, performance_date)
);

CREATE INDEX idx_pod_perf_daily_pod ON pod_performance_daily(pod_id, performance_date DESC);
CREATE INDEX idx_pod_perf_daily_org ON pod_performance_daily(organization_id, performance_date DESC);

-- Monthly pod performance aggregates
CREATE TABLE IF NOT EXISTS pod_performance_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  performance_month DATE NOT NULL, -- First day of month

  -- Capacity
  avg_clients DECIMAL(6,2),
  avg_caregivers DECIMAL(6,2),
  avg_ratio DECIMAL(5,2),

  -- Performance
  total_scheduled_shifts INTEGER DEFAULT 0,
  total_completed_shifts INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2),
  fill_rate DECIMAL(5,2),

  -- Hours
  total_scheduled_hours DECIMAL(10,2) DEFAULT 0,
  total_worked_hours DECIMAL(10,2) DEFAULT 0,
  overtime_percentage DECIMAL(5,2),

  -- Compliance
  avg_evv_compliance DECIMAL(5,2),

  -- Revenue (if billing data available)
  billed_amount DECIMAL(12,2) DEFAULT 0,
  collected_amount DECIMAL(12,2) DEFAULT 0,
  collection_rate DECIMAL(5,2),

  -- Overall score
  pod_score DECIMAL(5,2), -- 0-100 composite score
  rank_in_region INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(pod_id, performance_month)
);

CREATE INDEX idx_pod_perf_monthly_org ON pod_performance_monthly(organization_id, performance_month DESC);

-- ============================================================
-- REGIONAL COMPLIANCE REPORTING
-- ============================================================

-- Compliance snapshot by pod
CREATE TABLE IF NOT EXISTS pod_compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  snapshot_date DATE NOT NULL,

  -- Caregiver compliance
  total_caregivers INTEGER DEFAULT 0,
  caregivers_fully_compliant INTEGER DEFAULT 0,
  caregivers_expiring_30_days INTEGER DEFAULT 0,
  caregivers_expired INTEGER DEFAULT 0,

  -- Credential breakdowns
  credentials_expiring JSONB DEFAULT '{}', -- {type: count}
  credentials_expired JSONB DEFAULT '{}',

  -- Training compliance
  training_compliant INTEGER DEFAULT 0,
  training_overdue INTEGER DEFAULT 0,
  training_due_soon INTEGER DEFAULT 0,

  -- Background check compliance
  background_checks_current INTEGER DEFAULT 0,
  background_checks_pending INTEGER DEFAULT 0,
  background_checks_expired INTEGER DEFAULT 0,

  -- EVV compliance (monthly average)
  avg_evv_compliance DECIMAL(5,2),
  evv_below_threshold INTEGER DEFAULT 0, -- Caregivers below 95%

  -- Authorization compliance
  authorizations_active INTEGER DEFAULT 0,
  authorizations_expiring INTEGER DEFAULT 0,
  authorizations_over_utilized INTEGER DEFAULT 0,

  -- Overall compliance score
  compliance_score DECIMAL(5,2), -- 0-100

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(pod_id, snapshot_date)
);

CREATE INDEX idx_compliance_snapshot_pod ON pod_compliance_snapshots(pod_id, snapshot_date DESC);
CREATE INDEX idx_compliance_snapshot_org ON pod_compliance_snapshots(organization_id, snapshot_date DESC);

-- Regional compliance summary view
CREATE OR REPLACE VIEW regional_compliance_summary AS
SELECT
  pr.id AS region_id,
  pr.name AS region_name,
  pr.organization_id,
  COUNT(DISTINCT p.id) AS pod_count,
  SUM(pcs.total_caregivers) AS total_caregivers,
  SUM(pcs.caregivers_fully_compliant) AS compliant_caregivers,
  ROUND(
    (SUM(pcs.caregivers_fully_compliant)::DECIMAL / NULLIF(SUM(pcs.total_caregivers), 0)) * 100,
    1
  ) AS compliance_rate,
  SUM(pcs.caregivers_expired) AS expired_credentials,
  SUM(pcs.training_overdue) AS training_overdue,
  AVG(pcs.compliance_score) AS avg_compliance_score
FROM pod_regions pr
JOIN pods p ON p.region_id = pr.id
JOIN pod_compliance_snapshots pcs ON pcs.pod_id = p.id
  AND pcs.snapshot_date = (
    SELECT MAX(snapshot_date) FROM pod_compliance_snapshots
    WHERE pod_id = p.id
  )
WHERE pr.is_active = TRUE
GROUP BY pr.id, pr.name, pr.organization_id;

-- ============================================================
-- POD DASHBOARD VIEWS
-- ============================================================

-- Pod overview for dashboard
CREATE OR REPLACE VIEW pod_dashboard_overview AS
SELECT
  p.id AS pod_id,
  p.name AS pod_name,
  p.organization_id,
  pr.name AS region_name,

  -- Current state
  (SELECT COUNT(*) FROM clients c WHERE c.pod_id = p.id AND c.status = 'active') AS active_clients,
  (SELECT COUNT(*) FROM caregivers cg WHERE cg.pod_id = p.id AND cg.employment_status = 'active') AS active_caregivers,
  p.target_client_count,
  p.target_caregiver_count,

  -- Today's metrics
  ppd.scheduled_shifts AS today_scheduled,
  ppd.completed_shifts AS today_completed,
  ppd.coverage_gaps AS today_gaps,
  ppd.evv_compliance_rate AS today_evv,

  -- Monthly performance
  ppm.attendance_rate AS monthly_attendance,
  ppm.fill_rate AS monthly_fill_rate,
  ppm.pod_score AS monthly_score,
  ppm.rank_in_region,

  -- Compliance
  pcs.compliance_score,
  pcs.caregivers_expired AS expired_credentials,
  pcs.training_overdue

FROM pods p
LEFT JOIN pod_regions pr ON pr.id = p.region_id
LEFT JOIN pod_performance_daily ppd ON ppd.pod_id = p.id
  AND ppd.performance_date = CURRENT_DATE
LEFT JOIN pod_performance_monthly ppm ON ppm.pod_id = p.id
  AND ppm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN pod_compliance_snapshots pcs ON pcs.pod_id = p.id
  AND pcs.snapshot_date = (SELECT MAX(snapshot_date) FROM pod_compliance_snapshots WHERE pod_id = p.id)
WHERE p.status = 'active';

-- Cross-pod activity summary
CREATE OR REPLACE VIEW cross_pod_activity_summary AS
SELECT
  p.id AS pod_id,
  p.name AS pod_name,
  p.organization_id,

  -- Incoming (receiving help)
  (SELECT COUNT(*) FROM cross_pod_assignments cpa
   WHERE cpa.assigned_pod_id = p.id AND cpa.status = 'active') AS incoming_assignments,
  (SELECT SUM(actual_hours_worked) FROM cross_pod_assignments cpa
   WHERE cpa.assigned_pod_id = p.id AND cpa.status IN ('active', 'completed')
     AND cpa.start_date >= DATE_TRUNC('month', CURRENT_DATE)) AS incoming_hours_mtd,

  -- Outgoing (sending help)
  (SELECT COUNT(*) FROM cross_pod_assignments cpa
   WHERE cpa.pod_id = p.id AND cpa.status = 'active') AS outgoing_assignments,
  (SELECT SUM(actual_hours_worked) FROM cross_pod_assignments cpa
   WHERE cpa.pod_id = p.id AND cpa.status IN ('active', 'completed')
     AND cpa.start_date >= DATE_TRUNC('month', CURRENT_DATE)) AS outgoing_hours_mtd,

  -- Floating pool
  (SELECT COUNT(*) FROM floating_caregiver_pool fcp
   JOIN caregivers cg ON cg.id = fcp.caregiver_id
   WHERE cg.pod_id = p.id AND fcp.is_available = TRUE) AS floaters_available

FROM pods p
WHERE p.status = 'active';

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Calculate pod performance score
CREATE OR REPLACE FUNCTION calculate_pod_score(
  p_attendance_rate DECIMAL,
  p_fill_rate DECIMAL,
  p_evv_compliance DECIMAL,
  p_compliance_score DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL;
BEGIN
  -- Weighted scoring
  -- Attendance: 30%
  -- Fill Rate: 25%
  -- EVV Compliance: 25%
  -- Credential Compliance: 20%

  v_score :=
    (COALESCE(p_attendance_rate, 0) * 0.30) +
    (COALESCE(p_fill_rate, 0) * 0.25) +
    (COALESCE(p_evv_compliance, 0) * 0.25) +
    (COALESCE(p_compliance_score, 0) * 0.20);

  RETURN LEAST(100, GREATEST(0, v_score));
END;
$$ LANGUAGE plpgsql;

-- Generate daily pod performance snapshot
CREATE OR REPLACE FUNCTION generate_pod_daily_snapshot(
  p_pod_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_snapshot_id UUID;
  v_metrics RECORD;
BEGIN
  -- Get organization
  SELECT organization_id INTO v_org_id FROM pods WHERE id = p_pod_id;

  -- Calculate metrics
  SELECT
    (SELECT COUNT(*) FROM clients WHERE pod_id = p_pod_id AND status = 'active'),
    (SELECT COUNT(*) FROM caregivers WHERE pod_id = p_pod_id AND status = 'active'),
    COUNT(*) AS scheduled,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE status = 'missed') AS missed,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
    SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) AS scheduled_hours,
    SUM(CASE WHEN clock_out_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (clock_out_time - clock_in_time)) / 3600
        ELSE 0 END) AS worked_hours
  INTO v_metrics
  FROM shifts
  WHERE start_time::DATE = p_date
    AND (client_id IN (SELECT id FROM clients WHERE pod_id = p_pod_id)
         OR caregiver_id IN (SELECT id FROM caregivers WHERE pod_id = p_pod_id));

  -- Insert snapshot
  INSERT INTO pod_performance_daily (
    pod_id, organization_id, performance_date,
    active_clients, active_caregivers,
    scheduled_shifts, completed_shifts, missed_shifts, cancelled_shifts,
    scheduled_hours, worked_hours,
    fill_rate, completion_rate
  ) VALUES (
    p_pod_id, v_org_id, p_date,
    v_metrics.count, v_metrics.count,
    v_metrics.scheduled, v_metrics.completed, v_metrics.missed, v_metrics.cancelled,
    v_metrics.scheduled_hours, v_metrics.worked_hours,
    CASE WHEN v_metrics.scheduled > 0
      THEN ((v_metrics.scheduled - v_metrics.cancelled)::DECIMAL / v_metrics.scheduled) * 100
      ELSE 100 END,
    CASE WHEN v_metrics.scheduled - v_metrics.cancelled > 0
      THEN (v_metrics.completed::DECIMAL / (v_metrics.scheduled - v_metrics.cancelled)) * 100
      ELSE 100 END
  )
  ON CONFLICT (pod_id, performance_date)
  DO UPDATE SET
    active_clients = EXCLUDED.active_clients,
    active_caregivers = EXCLUDED.active_caregivers,
    scheduled_shifts = EXCLUDED.scheduled_shifts,
    completed_shifts = EXCLUDED.completed_shifts,
    missed_shifts = EXCLUDED.missed_shifts,
    cancelled_shifts = EXCLUDED.cancelled_shifts,
    scheduled_hours = EXCLUDED.scheduled_hours,
    worked_hours = EXCLUDED.worked_hours,
    fill_rate = EXCLUDED.fill_rate,
    completion_rate = EXCLUDED.completion_rate
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE pod_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_pod_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE floating_caregiver_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_performance_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_compliance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY pod_regions_org_policy ON pod_regions
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY cross_pod_org_policy ON cross_pod_assignments
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY floating_pool_org_policy ON floating_caregiver_pool
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY pod_perf_daily_org_policy ON pod_performance_daily
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY pod_perf_monthly_org_policy ON pod_performance_monthly
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY pod_compliance_org_policy ON pod_compliance_snapshots
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE pod_regions IS 'Geographic regions for pod grouping';
COMMENT ON TABLE cross_pod_assignments IS 'Track caregiver work outside primary pod';
COMMENT ON TABLE floating_caregiver_pool IS 'Caregivers available for any pod assignment';
COMMENT ON TABLE pod_performance_daily IS 'Daily performance metrics per pod';
COMMENT ON TABLE pod_performance_monthly IS 'Monthly aggregated pod performance';
COMMENT ON TABLE pod_compliance_snapshots IS 'Point-in-time compliance status per pod';
