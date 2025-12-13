-- ============================================================
-- Migration 059: Push Notification Infrastructure
-- Serenity Care Partners
--
-- Adds device token storage and notification tracking for:
-- - Shift reminders
-- - Dispatch alerts
-- - Authorization expiration alerts
-- - Training due reminders
-- ============================================================

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Token info
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id VARCHAR(255), -- Unique device identifier
  device_name VARCHAR(100), -- User-friendly device name

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  failed_count INTEGER DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_device_tokens_org ON device_tokens(organization_id);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id), -- NULL for system-wide templates

  -- Template info
  template_key VARCHAR(50) NOT NULL, -- e.g., 'shift_reminder_1hr', 'dispatch_alert', 'training_due'
  title_template TEXT NOT NULL, -- Supports {{variable}} placeholders
  body_template TEXT NOT NULL,
  data_template JSONB, -- Additional data to send with notification

  -- Delivery settings
  channels TEXT[] DEFAULT ARRAY['push'], -- 'push', 'sms', 'email'
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Scheduling (for reminders)
  lead_time_minutes INTEGER, -- e.g., 60 for 1 hour before

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, template_key)
);

-- Seed default notification templates
INSERT INTO notification_templates (template_key, title_template, body_template, data_template, priority, lead_time_minutes) VALUES
('shift_reminder_1hr', 'Shift Reminder', 'Your shift with {{client_name}} starts in 1 hour at {{start_time}}', '{"type": "shift_reminder", "shift_id": "{{shift_id}}"}', 'high', 60),
('shift_reminder_15min', 'Shift Starting Soon', 'Your shift with {{client_name}} starts in 15 minutes', '{"type": "shift_reminder", "shift_id": "{{shift_id}}"}', 'urgent', 15),
('dispatch_alert', 'Coverage Needed', '{{service_type}} coverage needed for {{client_name}} at {{location}}. Available?', '{"type": "dispatch", "gap_id": "{{gap_id}}"}', 'urgent', NULL),
('training_due_7d', 'Training Due Soon', 'Your {{training_name}} training is due in 7 days', '{"type": "training", "assignment_id": "{{assignment_id}}"}', 'normal', NULL),
('training_overdue', 'Training Overdue', 'Your {{training_name}} training is overdue. Please complete ASAP.', '{"type": "training", "assignment_id": "{{assignment_id}}"}', 'high', NULL),
('credential_expiring', 'Credential Expiring', 'Your {{credential_type}} expires in {{days}} days', '{"type": "credential", "credential_id": "{{credential_id}}"}', 'normal', NULL),
('background_check_needed', 'Background Check Required', 'Your background check is due for renewal', '{"type": "background_check"}', 'high', NULL),
('bonus_eligible', 'Bonus Eligible!', 'Congratulations! You qualify for the {{bonus_type}} bonus of ${{amount}}', '{"type": "bonus", "bonus_id": "{{bonus_id}}"}', 'normal', NULL),
('time_off_approved', 'Time-Off Approved', 'Your time-off request for {{dates}} has been approved', '{"type": "time_off", "request_id": "{{request_id}}"}', 'normal', NULL),
('time_off_denied', 'Time-Off Status', 'Your time-off request for {{dates}} was not approved', '{"type": "time_off", "request_id": "{{request_id}}"}', 'normal', NULL)
ON CONFLICT (organization_id, template_key) DO NOTHING;

-- Notification log (for tracking and debugging)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),

  -- Notification details
  template_key VARCHAR(50),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'sms', 'email')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,

  -- Delivery status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,

  -- Reference to what triggered this
  reference_type VARCHAR(50), -- 'shift', 'dispatch_gap', 'training', 'credential', 'bonus'
  reference_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_ref ON notification_log(reference_type, reference_id);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Channel preferences
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT TRUE,

  -- Notification type preferences
  shift_reminders BOOLEAN DEFAULT TRUE,
  dispatch_alerts BOOLEAN DEFAULT TRUE,
  training_reminders BOOLEAN DEFAULT TRUE,
  credential_alerts BOOLEAN DEFAULT TRUE,
  bonus_notifications BOOLEAN DEFAULT TRUE,
  time_off_updates BOOLEAN DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Scheduled notifications (for shift reminders, etc.)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- What triggered this
  reference_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,

  -- When to send
  scheduled_for TIMESTAMPTZ NOT NULL,
  template_key VARCHAR(50) NOT NULL,
  template_data JSONB,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMPTZ,
  notification_log_id UUID REFERENCES notification_log(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(reference_type, reference_id, template_key, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for)
  WHERE status = 'pending';

-- Function to get active device tokens for a user
CREATE OR REPLACE FUNCTION get_user_device_tokens(p_user_id UUID)
RETURNS TABLE (
  token TEXT,
  platform VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT dt.token, dt.platform
  FROM device_tokens dt
  WHERE dt.user_id = p_user_id
    AND dt.is_active = TRUE
    AND dt.failed_count < 3;
END;
$$ LANGUAGE plpgsql;

-- Function to mark token as failed
CREATE OR REPLACE FUNCTION mark_token_failed(p_token TEXT, p_error TEXT)
RETURNS void AS $$
BEGIN
  UPDATE device_tokens
  SET failed_count = failed_count + 1,
      last_error = p_error,
      is_active = CASE WHEN failed_count >= 2 THEN FALSE ELSE is_active END,
      updated_at = NOW()
  WHERE token = p_token;
END;
$$ LANGUAGE plpgsql;

-- View: Users needing shift reminders
CREATE OR REPLACE VIEW users_needing_shift_reminders AS
SELECT
  s.id AS shift_id,
  s.scheduled_start,
  s.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  cg.user_id,
  u.first_name || ' ' || u.last_name AS caregiver_name,
  u.organization_id,
  s.scheduled_start - INTERVAL '1 hour' AS reminder_1hr_at,
  s.scheduled_start - INTERVAL '15 minutes' AS reminder_15min_at
FROM shifts s
JOIN clients c ON c.id = s.client_id
JOIN caregivers cg ON cg.id = s.caregiver_id
JOIN users u ON u.id = cg.user_id
LEFT JOIN notification_preferences np ON np.user_id = u.id
WHERE s.status IN ('scheduled', 'confirmed')
  AND s.scheduled_start > NOW()
  AND s.scheduled_start < NOW() + INTERVAL '24 hours'
  AND (np.shift_reminders IS NULL OR np.shift_reminders = TRUE)
  AND NOT EXISTS (
    SELECT 1 FROM scheduled_notifications sn
    WHERE sn.reference_type = 'shift'
      AND sn.reference_id = s.id
      AND sn.template_key = 'shift_reminder_1hr'
      AND sn.status = 'sent'
  );

-- RLS Policies
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their device tokens" ON device_tokens
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY "Users can manage their device tokens" ON device_tokens
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY "Users can view their notification log" ON notification_log
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY "Users can view their notification preferences" ON notification_preferences
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY "Users can manage their notification preferences" ON notification_preferences
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Comments
COMMENT ON TABLE device_tokens IS 'Stores FCM/APNS device tokens for push notifications';
COMMENT ON TABLE notification_templates IS 'Templates for notification messages with variable substitution';
COMMENT ON TABLE notification_log IS 'Log of all sent notifications for tracking and debugging';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery';
COMMENT ON TABLE scheduled_notifications IS 'Queue of scheduled notifications (shift reminders, etc.)';
