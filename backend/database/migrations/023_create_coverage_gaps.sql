/**
 * Migration: Create Coverage Gaps Table
 *
 * Tracks real-time coverage gaps (no-shows, early departures)
 * for operational monitoring and dispatch management.
 *
 * Run: psql -d serenity -f 023_create_coverage_gaps.sql
 */

-- Create coverage gaps table
CREATE TABLE IF NOT EXISTS coverage_gaps (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  pod_id UUID NOT NULL REFERENCES pods(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),

  -- Gap type
  gap_type VARCHAR(50) NOT NULL CHECK (gap_type IN ('no_show', 'early_departure', 'unscheduled')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Patient information
  patient_id UUID NOT NULL REFERENCES patients(id),
  patient_name VARCHAR(255) NOT NULL,
  patient_address TEXT NOT NULL,
  patient_phone VARCHAR(20),
  patient_latitude DECIMAL(10, 8) NOT NULL,
  patient_longitude DECIMAL(11, 8) NOT NULL,

  -- Original caregiver (who didn't show up)
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),
  caregiver_name VARCHAR(255) NOT NULL,
  caregiver_phone VARCHAR(20),

  -- Pod Lead (who gets notified)
  pod_lead_id UUID NOT NULL REFERENCES caregivers(id),
  pod_lead_name VARCHAR(255) NOT NULL,
  pod_lead_phone VARCHAR(20),

  -- Timing information
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  minutes_late INTEGER NOT NULL DEFAULT 0,

  -- Workflow status
  status VARCHAR(50) NOT NULL DEFAULT 'detected'
    CHECK (status IN ('detected', 'pod_lead_notified', 'dispatched', 'covered', 'canceled')),

  -- Notification tracking
  notified_at TIMESTAMPTZ,
  notification_method VARCHAR(20), -- 'email', 'sms', 'push', 'dashboard'

  -- Dispatch tracking
  dispatched_at TIMESTAMPTZ,
  replacement_caregiver_id UUID REFERENCES caregivers(id),

  -- Resolution tracking
  covered_at TIMESTAMPTZ,
  response_time_minutes INTEGER, -- Time from detection to coverage

  -- Cancellation tracking
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_coverage_gaps_organization ON coverage_gaps(organization_id);
CREATE INDEX idx_coverage_gaps_pod ON coverage_gaps(pod_id);
CREATE INDEX idx_coverage_gaps_shift ON coverage_gaps(shift_id);
CREATE INDEX idx_coverage_gaps_patient ON coverage_gaps(patient_id);
CREATE INDEX idx_coverage_gaps_caregiver ON coverage_gaps(caregiver_id);
CREATE INDEX idx_coverage_gaps_pod_lead ON coverage_gaps(pod_lead_id);
CREATE INDEX idx_coverage_gaps_status ON coverage_gaps(status);
CREATE INDEX idx_coverage_gaps_severity ON coverage_gaps(severity);
CREATE INDEX idx_coverage_gaps_detected_at ON coverage_gaps(detected_at DESC);
CREATE INDEX idx_coverage_gaps_active ON coverage_gaps(organization_id, status)
  WHERE status NOT IN ('covered', 'canceled');

-- Composite index for common queries (active gaps for a pod)
CREATE INDEX idx_coverage_gaps_pod_active ON coverage_gaps(pod_id, status, detected_at DESC)
  WHERE status NOT IN ('covered', 'canceled');

-- Row-level security
ALTER TABLE coverage_gaps ENABLE ROW LEVEL SECURITY;

-- Policy: Pod Leads can see gaps in their pod
CREATE POLICY coverage_gaps_pod_lead_read ON coverage_gaps
  FOR SELECT
  USING (
    pod_id IN (
      SELECT id FROM pods
      WHERE pod_lead_id = current_setting('app.current_user_id')::UUID
    )
  );

-- Policy: Ops managers can see all gaps in organization
CREATE POLICY coverage_gaps_ops_manager_read ON coverage_gaps
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = current_setting('app.current_user_id')::UUID
        AND role IN ('ops_manager', 'admin')
    )
  );

-- Policy: System can insert gaps
CREATE POLICY coverage_gaps_system_insert ON coverage_gaps
  FOR INSERT
  WITH CHECK (true);

-- Policy: Pod Leads can update gaps in their pod
CREATE POLICY coverage_gaps_pod_lead_update ON coverage_gaps
  FOR UPDATE
  USING (
    pod_id IN (
      SELECT id FROM pods
      WHERE pod_lead_id = current_setting('app.current_user_id')::UUID
    )
  );

-- Trigger: Update updated_at timestamp
CREATE TRIGGER update_coverage_gaps_updated_at
  BEFORE UPDATE ON coverage_gaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE coverage_gaps IS 'Real-time tracking of coverage gaps (no-shows, early departures) for dispatch management';
COMMENT ON COLUMN coverage_gaps.gap_type IS 'Type of gap: no_show (>15min late), early_departure (<30min early), unscheduled';
COMMENT ON COLUMN coverage_gaps.severity IS 'Alert priority: low (15-19min), medium (20-29min), high (30-59min), critical (60+min)';
COMMENT ON COLUMN coverage_gaps.status IS 'Workflow state: detected → notified → dispatched → covered (or canceled)';
COMMENT ON COLUMN coverage_gaps.response_time_minutes IS 'Time from detection to coverage (KPI for operations efficiency)';
COMMENT ON COLUMN coverage_gaps.minutes_late IS 'How many minutes late the caregiver was when gap was detected';
