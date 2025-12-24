-- ============================================================
-- Migration 057: Enhanced Authorization Tracking
-- Serenity Care Partners
--
-- Adds comprehensive authorization management features:
-- - Authorization numbers and payer tracking
-- - Unit utilization tracking with alerts
-- - Frequency/visit limits per authorization
-- - Authorization renewal workflow
-- - Prior authorization requirements
-- ============================================================

-- Add more columns to the authorizations table
ALTER TABLE authorizations
ADD COLUMN IF NOT EXISTS authorization_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS prior_auth_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frequency_limit VARCHAR(50), -- e.g., '3x/week', '20 hours/month'
ADD COLUMN IF NOT EXISTS frequency_type VARCHAR(20) CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'per_auth')),
ADD COLUMN IF NOT EXISTS max_units_per_frequency INTEGER, -- units allowed per frequency period
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT '15min' CHECK (unit_type IN ('15min', 'hourly', 'visit', 'day')),
ADD COLUMN IF NOT EXISTS diagnosis_codes TEXT[], -- ICD-10 codes associated
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS renewal_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS renewal_status VARCHAR(20) CHECK (renewal_status IN ('not_needed', 'pending', 'submitted', 'approved', 'denied')),
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Populate organization_id from client relationship
UPDATE authorizations a
SET organization_id = c.organization_id
FROM clients c
WHERE a.client_id = c.id
AND a.organization_id IS NULL;

-- Create authorization utilization tracking
CREATE TABLE IF NOT EXISTS authorization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id UUID NOT NULL REFERENCES authorizations(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),
  usage_date DATE NOT NULL,
  units_used INTEGER NOT NULL,
  billing_code VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_usage_auth ON authorization_usage(authorization_id);
CREATE INDEX IF NOT EXISTS idx_auth_usage_date ON authorization_usage(usage_date);

-- Authorization alerts configuration
CREATE TABLE IF NOT EXISTS authorization_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id UUID NOT NULL REFERENCES authorizations(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
    'expiring_soon', -- End date approaching
    'units_low', -- Less than threshold units remaining
    'units_exhausted', -- All units used
    'renewal_needed', -- Time to submit renewal
    'frequency_exceeded' -- Exceeded frequency limit
  )),
  threshold_value INTEGER, -- e.g., 30 days, 10 units
  triggered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_alerts_auth ON authorization_alerts(authorization_id);
CREATE INDEX IF NOT EXISTS idx_auth_alerts_triggered ON authorization_alerts(triggered_at) WHERE acknowledged_at IS NULL;

-- Authorization renewal requests
CREATE TABLE IF NOT EXISTS authorization_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_authorization_id UUID NOT NULL REFERENCES authorizations(id),
  new_authorization_id UUID REFERENCES authorizations(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Requested details
  requested_units INTEGER NOT NULL,
  requested_start_date DATE NOT NULL,
  requested_end_date DATE NOT NULL,
  clinical_justification TEXT,
  supporting_documents TEXT[], -- URLs to uploaded docs

  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  payer_reference_number VARCHAR(100),

  -- Response
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'denied', 'partial', 'pending_info')),
  approved_units INTEGER,
  approved_start_date DATE,
  approved_end_date DATE,
  denial_reason TEXT,
  responded_at TIMESTAMPTZ,

  -- Follow-up
  appeal_deadline DATE,
  appeal_submitted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_renewals_org ON authorization_renewals(organization_id);
CREATE INDEX IF NOT EXISTS idx_auth_renewals_status ON authorization_renewals(status);

-- Function to calculate remaining units for an authorization
CREATE OR REPLACE FUNCTION get_authorization_remaining_units(auth_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_approved INTEGER;
  total_used INTEGER;
BEGIN
  SELECT units_approved INTO total_approved
  FROM authorizations WHERE id = auth_id;

  SELECT COALESCE(SUM(units_used), 0) INTO total_used
  FROM authorization_usage WHERE authorization_id = auth_id;

  RETURN total_approved - total_used;
END;
$$ LANGUAGE plpgsql;

-- Function to check if authorization is valid for a service
CREATE OR REPLACE FUNCTION check_authorization_validity(
  auth_id UUID,
  service_date DATE,
  required_units INTEGER
)
RETURNS TABLE (
  is_valid BOOLEAN,
  reason TEXT,
  remaining_units INTEGER
) AS $$
DECLARE
  auth_record RECORD;
  remaining INTEGER;
BEGIN
  -- Get authorization details
  SELECT * INTO auth_record FROM authorizations WHERE id = auth_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Authorization not found'::TEXT, 0;
    RETURN;
  END IF;

  -- Check status
  IF auth_record.status != 'active' THEN
    RETURN QUERY SELECT FALSE, ('Authorization status: ' || auth_record.status)::TEXT, 0;
    RETURN;
  END IF;

  -- Check dates
  IF service_date < auth_record.start_date THEN
    RETURN QUERY SELECT FALSE, 'Service date before authorization start'::TEXT, 0;
    RETURN;
  END IF;

  IF service_date > auth_record.end_date THEN
    RETURN QUERY SELECT FALSE, 'Authorization expired'::TEXT, 0;
    RETURN;
  END IF;

  -- Check units
  remaining := get_authorization_remaining_units(auth_id);
  IF remaining < required_units THEN
    RETURN QUERY SELECT FALSE, ('Insufficient units: ' || remaining || ' remaining, ' || required_units || ' needed')::TEXT, remaining;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'Authorization valid'::TEXT, remaining;
END;
$$ LANGUAGE plpgsql;

-- View: Authorization status with utilization
CREATE OR REPLACE VIEW authorization_status AS
SELECT
  a.id,
  a.client_id,
  a.payer_id,
  a.organization_id,
  a.authorization_number,
  a.service_code,
  a.description,
  a.units_approved,
  COALESCE((SELECT SUM(units_used) FROM authorization_usage WHERE authorization_id = a.id), 0)::INTEGER AS units_used,
  get_authorization_remaining_units(a.id) AS units_remaining,
  ROUND(
    COALESCE((SELECT SUM(units_used) FROM authorization_usage WHERE authorization_id = a.id), 0)::NUMERIC /
    NULLIF(a.units_approved, 0)::NUMERIC * 100,
    1
  ) AS utilization_percent,
  a.start_date,
  a.end_date,
  a.end_date - CURRENT_DATE AS days_until_expiry,
  a.status,
  a.frequency_limit,
  a.frequency_type,
  a.max_units_per_frequency,
  a.unit_type,
  a.prior_auth_required,
  a.renewal_status,
  c.first_name || ' ' || c.last_name AS client_name,
  p.name AS payer_name,
  CASE
    WHEN a.status = 'exhausted' THEN 'exhausted'
    WHEN a.end_date < CURRENT_DATE THEN 'expired'
    WHEN a.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.1, 4) THEN 'units_low'
    ELSE 'healthy'
  END AS health_status
FROM authorizations a
JOIN clients c ON c.id = a.client_id
JOIN payers p ON p.id = a.payer_id;

-- View: Authorizations needing attention
CREATE OR REPLACE VIEW authorization_alerts_dashboard AS
SELECT
  a.id,
  a.authorization_number,
  a.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  a.payer_id,
  p.name AS payer_name,
  a.organization_id,
  a.service_code,
  a.end_date,
  a.end_date - CURRENT_DATE AS days_remaining,
  a.units_approved,
  get_authorization_remaining_units(a.id) AS units_remaining,
  CASE
    WHEN a.status = 'exhausted' THEN 'Units Exhausted'
    WHEN get_authorization_remaining_units(a.id) = 0 THEN 'No Units Remaining'
    WHEN a.end_date < CURRENT_DATE THEN 'Expired'
    WHEN a.end_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'Expiring Within 2 Weeks'
    WHEN a.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Within 30 Days'
    WHEN get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.1, 4) THEN 'Low Units (<10%)'
    WHEN get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.25, 8) THEN 'Units Below 25%'
  END AS alert_type,
  CASE
    WHEN a.status = 'exhausted' OR get_authorization_remaining_units(a.id) = 0 OR a.end_date < CURRENT_DATE THEN 'critical'
    WHEN a.end_date <= CURRENT_DATE + INTERVAL '14 days' OR get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.1, 4) THEN 'high'
    WHEN a.end_date <= CURRENT_DATE + INTERVAL '30 days' OR get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.25, 8) THEN 'medium'
    ELSE 'low'
  END AS severity,
  a.renewal_status
FROM authorizations a
JOIN clients c ON c.id = a.client_id
JOIN payers p ON p.id = a.payer_id
WHERE a.status IN ('active', 'exhausted')
  AND (
    a.end_date <= CURRENT_DATE + INTERVAL '30 days'
    OR get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.25, 8)
    OR a.status = 'exhausted'
  )
ORDER BY
  CASE
    WHEN a.status = 'exhausted' OR a.end_date < CURRENT_DATE THEN 0
    WHEN a.end_date <= CURRENT_DATE + INTERVAL '14 days' THEN 1
    WHEN get_authorization_remaining_units(a.id) <= GREATEST(a.units_approved * 0.1, 4) THEN 2
    ELSE 3
  END,
  a.end_date;

-- Trigger to update authorization status when exhausted
CREATE OR REPLACE FUNCTION update_authorization_on_usage()
RETURNS TRIGGER AS $$
DECLARE
  remaining INTEGER;
BEGIN
  remaining := get_authorization_remaining_units(NEW.authorization_id);

  IF remaining <= 0 THEN
    UPDATE authorizations
    SET status = 'exhausted', updated_at = NOW()
    WHERE id = NEW.authorization_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_auth_on_usage ON authorization_usage;
CREATE TRIGGER trg_update_auth_on_usage
  AFTER INSERT ON authorization_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_authorization_on_usage();

-- Trigger to auto-expire authorizations
CREATE OR REPLACE FUNCTION expire_authorizations()
RETURNS void AS $$
BEGIN
  UPDATE authorizations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for new tables
ALTER TABLE authorization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view auth usage for their org" ON authorization_usage
  FOR SELECT USING (
    authorization_id IN (
      SELECT id FROM authorizations
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Users can view auth alerts for their org" ON authorization_alerts
  FOR SELECT USING (
    authorization_id IN (
      SELECT id FROM authorizations
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Users can view renewals for their org" ON authorization_renewals
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Admins can manage auth usage" ON authorization_usage
  FOR ALL USING (
    authorization_id IN (
      SELECT id FROM authorizations
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Admins can manage auth alerts" ON authorization_alerts
  FOR ALL USING (
    authorization_id IN (
      SELECT id FROM authorizations
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Admins can manage renewals" ON authorization_renewals
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

-- Comments
COMMENT ON TABLE authorization_usage IS 'Tracks unit consumption per authorization per visit';
COMMENT ON TABLE authorization_alerts IS 'Configurable alerts for authorization expiry and unit depletion';
COMMENT ON TABLE authorization_renewals IS 'Tracks authorization renewal requests and responses';
COMMENT ON VIEW authorization_status IS 'Real-time view of authorization utilization and health';
COMMENT ON VIEW authorization_alerts_dashboard IS 'Dashboard view of authorizations needing attention';
