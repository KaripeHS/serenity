-- ============================================================================
-- On-Call Coverage Management Migration
-- Serenity ERP - On-Call Rosters, Escalation, SLA Tracking
-- Phase 0-1: Per-pod on-call with org-wide escalation
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- On-Call Rosters Table
-- Defines on-call schedules with primary and backup coverage
-- ============================================================================

CREATE TABLE IF NOT EXISTS oncall_rosters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL, -- For RLS

  -- Scope
  roster_type VARCHAR(50) NOT NULL DEFAULT 'pod', -- 'pod', 'org_wide', 'regional'
  pod_id UUID, -- References pods(id) - NULL for org-wide rosters
  region VARCHAR(100), -- For regional rosters

  -- Schedule
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  rotation_sequence INTEGER, -- For rotating schedules (1, 2, 3, etc.)

  -- Coverage assignments
  primary_user_id UUID NOT NULL, -- References users(id)
  backup_user_id UUID, -- References users(id)
  escalation_1_user_id UUID, -- References users(id)
  escalation_2_user_id UUID, -- References users(id)

  -- Contact info (snapshot at time of assignment)
  primary_contact_phone VARCHAR(20),
  backup_contact_phone VARCHAR(20),

  -- Escalation rules
  escalation_rules JSONB, -- JSON config: { "level1_timeout_minutes": 15, "level2_timeout_minutes": 30, ... }

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  /* is_active calculation moved to view/logic due to NOW() volatility */

  -- Notes
  notes TEXT,
  special_instructions TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- References users(id)

  CONSTRAINT oncall_rosters_type_check CHECK (
    roster_type IN ('pod', 'org_wide', 'regional', 'team')
  ),
  CONSTRAINT oncall_rosters_status_check CHECK (
    status IN ('active', 'completed', 'cancelled', 'draft')
  ),
  CONSTRAINT oncall_rosters_schedule_valid CHECK (
    end_datetime > start_datetime
  ),
  -- If pod-level, pod_id must be set
  CONSTRAINT oncall_rosters_pod_check CHECK (
    (roster_type = 'pod' AND pod_id IS NOT NULL) OR
    (roster_type != 'pod')
  )
);

-- Indexes for oncall_rosters
CREATE INDEX idx_oncall_rosters_org ON oncall_rosters(organization_id);
CREATE INDEX idx_oncall_rosters_pod ON oncall_rosters(pod_id) WHERE pod_id IS NOT NULL;
CREATE INDEX idx_oncall_rosters_primary_user ON oncall_rosters(primary_user_id);
CREATE INDEX idx_oncall_rosters_active ON oncall_rosters(status, start_datetime, end_datetime) WHERE status = 'active';
CREATE INDEX idx_oncall_rosters_current ON oncall_rosters(organization_id) WHERE status = 'active';
CREATE INDEX idx_oncall_rosters_schedule ON oncall_rosters(start_datetime, end_datetime);

-- ============================================================================
-- On-Call Incidents Table
-- Tracks incidents that trigger on-call alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS oncall_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  -- Roster relationship
  roster_id UUID, -- References oncall_rosters(id) - NULL if no active roster

  -- Incident details
  incident_type VARCHAR(100) NOT NULL, -- 'coverage_gap', 'no_show', 'caregiver_emergency', 'client_emergency', 'system_alert', 'manual'
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Source
  source_type VARCHAR(50), -- 'automated', 'manual', 'ai_agent', 'client_call', 'caregiver_call'
  source_reference_id UUID, -- ID of related entity (shift_id, client_id, etc.)
  source_metadata JSONB,

  -- Timeline
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Response tracking
  acknowledged_by UUID, -- References users(id)
  resolved_by UUID, -- References users(id)
  closed_by UUID, -- References users(id)

  -- Escalation tracking
  escalation_level INTEGER DEFAULT 0, -- 0=primary, 1=backup, 2=escalation_1, etc.
  escalation_history JSONB, -- Array of escalation events
  last_escalated_at TIMESTAMPTZ,

  -- SLA tracking
  target_ack_time_minutes INTEGER DEFAULT 15, -- SLA for acknowledgment
  target_resolution_time_minutes INTEGER, -- SLA for resolution
  ack_sla_met BOOLEAN,
  resolution_sla_met BOOLEAN,

  -- Status
  status VARCHAR(50) DEFAULT 'triggered', -- 'triggered', 'acknowledged', 'in_progress', 'resolved', 'closed', 'escalated'

  -- Resolution
  resolution_notes TEXT,
  resolution_action_taken TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT oncall_incidents_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT oncall_incidents_status_check CHECK (
    status IN ('triggered', 'acknowledged', 'in_progress', 'resolved', 'closed', 'escalated', 'cancelled')
  ),
  CONSTRAINT oncall_incidents_escalation_level_valid CHECK (
    escalation_level >= 0 AND escalation_level <= 10
  )
);

-- Indexes for oncall_incidents
CREATE INDEX idx_oncall_incidents_org ON oncall_incidents(organization_id);
CREATE INDEX idx_oncall_incidents_roster ON oncall_incidents(roster_id) WHERE roster_id IS NOT NULL;
CREATE INDEX idx_oncall_incidents_status ON oncall_incidents(status) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_oncall_incidents_triggered ON oncall_incidents(triggered_at DESC);
CREATE INDEX idx_oncall_incidents_severity ON oncall_incidents(severity, status);
CREATE INDEX idx_oncall_incidents_type ON oncall_incidents(incident_type);
CREATE INDEX idx_oncall_incidents_acknowledged_by ON oncall_incidents(acknowledged_by) WHERE acknowledged_by IS NOT NULL;
CREATE INDEX idx_oncall_incidents_sla_violations ON oncall_incidents(ack_sla_met, resolution_sla_met) WHERE ack_sla_met = FALSE OR resolution_sla_met = FALSE;

-- ============================================================================
-- On-Call Notifications Table
-- Tracks all notifications sent during incidents
-- ============================================================================

CREATE TABLE IF NOT EXISTS oncall_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL, -- References oncall_incidents(id)
  roster_id UUID, -- References oncall_rosters(id)

  -- Recipient
  recipient_user_id UUID NOT NULL, -- References users(id)
  escalation_level INTEGER NOT NULL DEFAULT 0,

  -- Notification details
  notification_type VARCHAR(50) NOT NULL, -- 'sms', 'voice_call', 'email', 'push', 'slack', 'pagerduty'
  recipient_contact VARCHAR(255), -- Phone number, email, etc.
  message_content TEXT,

  -- Delivery tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- Status
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  failure_reason TEXT,

  -- External references
  external_message_id VARCHAR(255), -- Twilio SID, PagerDuty incident ID, etc.

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT oncall_notifications_type_check CHECK (
    notification_type IN ('sms', 'voice_call', 'email', 'push_notification', 'slack', 'pagerduty', 'teams')
  ),
  CONSTRAINT oncall_notifications_status_check CHECK (
    delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'undeliverable')
  )
);

-- Indexes for oncall_notifications
CREATE INDEX idx_oncall_notifications_incident ON oncall_notifications(incident_id);
CREATE INDEX idx_oncall_notifications_recipient ON oncall_notifications(recipient_user_id);
CREATE INDEX idx_oncall_notifications_sent ON oncall_notifications(sent_at DESC);
CREATE INDEX idx_oncall_notifications_status ON oncall_notifications(delivery_status) WHERE delivery_status IN ('pending', 'failed');

-- ============================================================================
-- On-Call Configuration Table
-- Organization-wide on-call settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS oncall_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE,

  -- SLA defaults
  default_ack_sla_minutes INTEGER DEFAULT 15,
  default_resolution_sla_minutes INTEGER DEFAULT 60,

  -- Escalation settings
  enable_auto_escalation BOOLEAN DEFAULT TRUE,
  escalation_timeout_minutes INTEGER DEFAULT 15,
  max_escalation_levels INTEGER DEFAULT 3,

  -- Notification preferences
  notification_channels TEXT[] DEFAULT ARRAY['sms', 'voice_call'], -- Preferred channels
  quiet_hours_start TIME, -- e.g., '22:00' for 10 PM
  quiet_hours_end TIME, -- e.g., '06:00' for 6 AM
  quiet_hours_override_severity VARCHAR(20) DEFAULT 'critical', -- Only notify for critical during quiet hours

  -- Rotation settings
  rotation_enabled BOOLEAN DEFAULT TRUE,
  rotation_frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  rotation_day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc.
  rotation_time TIME DEFAULT '00:00', -- Time of day for rotation

  -- Integration settings
  pagerduty_integration_enabled BOOLEAN DEFAULT FALSE,
  pagerduty_service_key VARCHAR(255),
  slack_webhook_url VARCHAR(500),
  twilio_integration_enabled BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,

  CONSTRAINT oncall_config_rotation_frequency_check CHECK (
    rotation_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')
  )
);

-- Index for oncall_config
CREATE INDEX idx_oncall_config_org ON oncall_config(organization_id);

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Enable RLS on oncall_rosters
ALTER TABLE oncall_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY oncall_rosters_tenant_isolation ON oncall_rosters
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on oncall_incidents
ALTER TABLE oncall_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY oncall_incidents_tenant_isolation ON oncall_incidents
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on oncall_notifications
ALTER TABLE oncall_notifications ENABLE ROW LEVEL SECURITY;

-- Users can see notifications sent to them
CREATE POLICY oncall_notifications_recipient_access ON oncall_notifications
  FOR SELECT
  USING (recipient_user_id = current_setting('app.current_user_id', true)::UUID);

-- Admins can see all notifications
CREATE POLICY oncall_notifications_admin_access ON oncall_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM oncall_incidents i
      WHERE i.id = oncall_notifications.incident_id
      AND i.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

-- Enable RLS on oncall_config
ALTER TABLE oncall_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY oncall_config_tenant_isolation ON oncall_config
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- Audit Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_oncall_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oncall_rosters_update_timestamp
  BEFORE UPDATE ON oncall_rosters
  FOR EACH ROW
  EXECUTE FUNCTION update_oncall_timestamp();

CREATE TRIGGER oncall_incidents_update_timestamp
  BEFORE UPDATE ON oncall_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_oncall_timestamp();

CREATE TRIGGER oncall_config_update_timestamp
  BEFORE UPDATE ON oncall_config
  FOR EACH ROW
  EXECUTE FUNCTION update_oncall_timestamp();

-- Trigger to calculate SLA compliance when incident is acknowledged/resolved
CREATE OR REPLACE FUNCTION calculate_oncall_sla()
RETURNS TRIGGER AS $$
DECLARE
  v_ack_duration_minutes INTEGER;
  v_resolution_duration_minutes INTEGER;
BEGIN
  -- Calculate acknowledgment SLA
  IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
    v_ack_duration_minutes := EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.triggered_at)) / 60;
    NEW.ack_sla_met := (v_ack_duration_minutes <= NEW.target_ack_time_minutes);
  END IF;

  -- Calculate resolution SLA
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    v_resolution_duration_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.triggered_at)) / 60;
    IF NEW.target_resolution_time_minutes IS NOT NULL THEN
      NEW.resolution_sla_met := (v_resolution_duration_minutes <= NEW.target_resolution_time_minutes);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oncall_incidents_calculate_sla
  BEFORE UPDATE ON oncall_incidents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_oncall_sla();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get current on-call person for a pod or org
CREATE OR REPLACE FUNCTION get_current_oncall(
  p_organization_id UUID,
  p_pod_id UUID DEFAULT NULL
) RETURNS TABLE (
  roster_id UUID,
  primary_user_id UUID,
  backup_user_id UUID,
  primary_contact_phone VARCHAR,
  end_datetime TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.primary_user_id,
    r.backup_user_id,
    r.primary_contact_phone,
    r.end_datetime
  FROM oncall_rosters r
  WHERE r.organization_id = p_organization_id
    AND r.status = 'active'
    AND NOW() >= r.start_datetime AND NOW() <= r.end_datetime
    AND (p_pod_id IS NULL OR r.pod_id = p_pod_id)
  ORDER BY
    CASE WHEN r.pod_id = p_pod_id THEN 0 ELSE 1 END, -- Prioritize pod-specific rosters
    r.start_datetime DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if incident is within SLA
CREATE OR REPLACE FUNCTION is_incident_within_sla(p_incident_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_incident RECORD;
  v_within_sla BOOLEAN;
BEGIN
  SELECT * INTO v_incident
  FROM oncall_incidents
  WHERE id = p_incident_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- If not acknowledged yet, check if we're past SLA
  IF v_incident.acknowledged_at IS NULL THEN
    RETURN (EXTRACT(EPOCH FROM (NOW() - v_incident.triggered_at)) / 60) <= v_incident.target_ack_time_minutes;
  END IF;

  -- If acknowledged but not resolved, check resolution SLA
  IF v_incident.resolved_at IS NULL AND v_incident.target_resolution_time_minutes IS NOT NULL THEN
    RETURN (EXTRACT(EPOCH FROM (NOW() - v_incident.triggered_at)) / 60) <= v_incident.target_resolution_time_minutes;
  END IF;

  -- If resolved, use stored SLA metrics
  RETURN COALESCE(v_incident.ack_sla_met, TRUE) AND COALESCE(v_incident.resolution_sla_met, TRUE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Views
-- ============================================================================

-- View for active on-call roster summary
CREATE OR REPLACE VIEW oncall_current_coverage AS
SELECT
  r.organization_id,
  r.pod_id,
  r.id AS roster_id,
  r.roster_type,
  r.primary_user_id,
  up.first_name || ' ' || up.last_name AS primary_user_name,
  r.backup_user_id,
  ub.first_name || ' ' || ub.last_name AS backup_user_name,
  r.primary_contact_phone,
  r.backup_contact_phone,
  r.start_datetime,
  r.end_datetime,
  COUNT(i.id) FILTER (WHERE i.status NOT IN ('resolved', 'closed')) AS active_incidents
FROM oncall_rosters r
LEFT JOIN users up ON r.primary_user_id = up.id
LEFT JOIN users ub ON r.backup_user_id = ub.id
LEFT JOIN oncall_incidents i ON r.id = i.roster_id AND i.status NOT IN ('resolved', 'closed')
WHERE r.status = 'active' AND NOW() >= r.start_datetime AND NOW() <= r.end_datetime
GROUP BY r.id, up.first_name, up.last_name, ub.first_name, ub.last_name;

COMMENT ON VIEW oncall_current_coverage IS 'Real-time view of active on-call coverage with incident counts';

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE oncall_rosters IS 'On-call schedules with primary/backup assignments per pod or org-wide';
COMMENT ON TABLE oncall_incidents IS 'Incidents that trigger on-call alerts (coverage gaps, emergencies, system alerts)';
COMMENT ON TABLE oncall_notifications IS 'Audit trail of all on-call notifications sent (SMS, calls, emails, etc.)';
COMMENT ON TABLE oncall_config IS 'Organization-wide on-call configuration (SLAs, escalation, rotation settings)';

COMMENT ON COLUMN oncall_incidents.ack_sla_met IS 'Whether incident was acknowledged within target SLA time';
COMMENT ON COLUMN oncall_incidents.escalation_level IS '0=primary, 1=backup, 2=escalation_1, etc.';

-- ============================================================================
-- Migration Complete
-- Version: 018
-- Date: 2025-11-03
-- ============================================================================
