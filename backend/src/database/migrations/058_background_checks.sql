-- ============================================================
-- Migration 058: Background Check System
-- Serenity Care Partners
--
-- Comprehensive background check tracking for Ohio compliance:
-- - BCI (Bureau of Criminal Investigation) checks
-- - FBI fingerprint checks (required if lived outside Ohio in 5 years)
-- - OIG/SAM exclusion checks
-- - Driving record checks (for transportation services)
-- - Reference checks
-- ============================================================

-- Background check records for caregivers/employees
CREATE TABLE IF NOT EXISTS background_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Subject of check
  caregiver_id UUID REFERENCES caregivers(id),
  employee_id UUID REFERENCES employees(id),
  applicant_id UUID REFERENCES applicants(id),

  -- Check type and provider
  check_type VARCHAR(30) NOT NULL CHECK (check_type IN (
    'bci',           -- Ohio Bureau of Criminal Investigation
    'fbi',           -- FBI fingerprint check
    'bci_fbi',       -- Combined BCI/FBI (most common)
    'oig_sam',       -- OIG/SAM exclusion list
    'driving_record',-- DMV check for transportation
    'reference',     -- Reference check
    'employment',    -- Employment verification
    'education',     -- Education verification
    'drug_screen'    -- Drug screening
  )),
  check_provider VARCHAR(100), -- e.g., 'WebCheck', 'Sterling', etc.

  -- Request details
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_by UUID REFERENCES users(id),
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'new_hire',           -- Initial hire background check
    'annual_renewal',     -- Annual recertification
    'incident_triggered', -- Triggered by incident/complaint
    'license_renewal',    -- Required for license renewal
    'promotion',          -- For promotion to supervisory role
    'random'              -- Random check (if applicable)
  )),

  -- Subject info at time of check
  subject_ssn_last4 VARCHAR(4),
  subject_dob DATE,
  lived_outside_ohio_5yr BOOLEAN DEFAULT FALSE, -- Determines if FBI needed

  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  submission_reference VARCHAR(100), -- External tracking number
  fingerprint_date DATE,
  fingerprint_location VARCHAR(200),

  -- Results
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Awaiting submission
    'submitted',   -- Submitted to provider
    'in_progress', -- Being processed
    'completed',   -- Results received
    'expired',     -- Needs renewal
    'failed'       -- Check failed to process
  )),
  result VARCHAR(20) CHECK (result IN (
    'clear',        -- No issues found
    'flagged',      -- Issues found, needs review
    'disqualifying',-- Contains disqualifying offenses
    'pending_review'-- Manual review needed
  )),

  -- Findings
  findings JSONB, -- Array of {type, description, date, disposition}
  disqualifying_offenses TEXT[], -- List of disqualifying offense codes
  review_notes TEXT,

  -- Review process
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_decision VARCHAR(20) CHECK (review_decision IN (
    'approved',      -- Approved to hire/continue
    'conditional',   -- Approved with conditions
    'denied',        -- Not approved
    'appeal_pending' -- Under appeal
  )),
  conditions TEXT, -- If conditional approval

  -- Expiration (Ohio requires checks every 5 years minimum)
  expires_at DATE,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,

  -- Documents
  report_file_url TEXT,
  consent_form_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure exactly one subject type
  CONSTRAINT check_subject CHECK (
    (caregiver_id IS NOT NULL)::INT +
    (employee_id IS NOT NULL)::INT +
    (applicant_id IS NOT NULL)::INT = 1
  )
);

CREATE INDEX idx_background_checks_org ON background_checks(organization_id);
CREATE INDEX idx_background_checks_caregiver ON background_checks(caregiver_id);
CREATE INDEX idx_background_checks_employee ON background_checks(employee_id);
CREATE INDEX idx_background_checks_applicant ON background_checks(applicant_id);
CREATE INDEX idx_background_checks_status ON background_checks(status);
CREATE INDEX idx_background_checks_expires ON background_checks(expires_at);
CREATE INDEX idx_background_checks_type ON background_checks(check_type);

-- Reference check details
CREATE TABLE IF NOT EXISTS reference_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES background_checks(id) ON DELETE CASCADE,

  -- Reference contact info
  reference_name VARCHAR(200) NOT NULL,
  reference_relationship VARCHAR(50) NOT NULL, -- e.g., 'supervisor', 'colleague', 'personal'
  reference_company VARCHAR(200),
  reference_phone VARCHAR(20),
  reference_email VARCHAR(255),

  -- Contact attempts
  attempt_dates TIMESTAMPTZ[],
  contact_successful BOOLEAN,
  contacted_at TIMESTAMPTZ,

  -- Interview
  questions_asked JSONB, -- Array of question objects
  responses JSONB, -- Array of response objects

  -- Assessment
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  would_rehire VARCHAR(20) CHECK (would_rehire IN ('yes', 'no', 'not_sure', 'not_applicable')),
  concerns_raised BOOLEAN DEFAULT FALSE,
  concern_details TEXT,

  -- Summary
  verified_employment BOOLEAN,
  verified_dates_match BOOLEAN,
  verified_title_match BOOLEAN,
  notes TEXT,

  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reference_checks_bg ON reference_checks(background_check_id);

-- Ohio-specific disqualifying offenses catalog
CREATE TABLE IF NOT EXISTS disqualifying_offense_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offense_code VARCHAR(20) NOT NULL UNIQUE,
  offense_type VARCHAR(50) NOT NULL, -- 'absolute', 'presumptive_5yr', 'presumptive_10yr'
  offense_description TEXT NOT NULL,
  orc_section VARCHAR(50), -- Ohio Revised Code section
  applies_to TEXT[], -- ['all', 'stna', 'hha', 'rn', 'lpn']
  lookback_years INTEGER, -- NULL means lifetime
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Ohio disqualifying offenses (from ODH handbook)
INSERT INTO disqualifying_offense_codes (offense_code, offense_type, offense_description, orc_section, applies_to, lookback_years) VALUES
('MURDER', 'absolute', 'Aggravated murder or murder', '2903.01, 2903.02', ARRAY['all'], NULL),
('ASSAULT_FELONY', 'absolute', 'Felonious assault', '2903.11', ARRAY['all'], NULL),
('KIDNAPPING', 'absolute', 'Kidnapping', '2905.01', ARRAY['all'], NULL),
('RAPE', 'absolute', 'Rape', '2907.02', ARRAY['all'], NULL),
('SEXUAL_BATTERY', 'absolute', 'Sexual battery', '2907.03', ARRAY['all'], NULL),
('CORRUPTION_MINOR', 'absolute', 'Corruption of a minor', '2907.04', ARRAY['all'], NULL),
('GROSS_SEXUAL_IMPOSITION', 'absolute', 'Gross sexual imposition', '2907.05', ARRAY['all'], NULL),
('SEXUAL_IMPOSITION', 'presumptive_10yr', 'Sexual imposition', '2907.06', ARRAY['all'], 10),
('ENDANGERING_CHILDREN', 'presumptive_10yr', 'Endangering children', '2919.22', ARRAY['all'], 10),
('PATIENT_ABUSE', 'absolute', 'Patient abuse or neglect', '2903.34', ARRAY['all'], NULL),
('THEFT_FELONY', 'presumptive_5yr', 'Theft (felony)', '2913.02', ARRAY['all'], 5),
('THEFT_ELDERLY', 'absolute', 'Theft from elderly/disabled', '2913.02 (B)(3)', ARRAY['all'], NULL),
('FORGERY', 'presumptive_5yr', 'Forgery', '2913.31', ARRAY['all'], 5),
('DRUG_TRAFFICKING', 'presumptive_10yr', 'Drug trafficking', '2925.03', ARRAY['all'], 10),
('DRUG_POSSESSION_FELONY', 'presumptive_5yr', 'Drug possession (felony)', '2925.11', ARRAY['all'], 5),
('DUI_3RD', 'presumptive_5yr', 'OVI (3rd or more)', '4511.19', ARRAY['all'], 5)
ON CONFLICT (offense_code) DO NOTHING;

-- View: Background check dashboard
CREATE OR REPLACE VIEW background_check_dashboard AS
SELECT
  bc.id,
  bc.organization_id,
  bc.check_type,
  bc.status,
  bc.result,
  bc.review_decision,
  bc.requested_at,
  bc.completed_at,
  bc.expires_at,
  bc.expires_at - CURRENT_DATE AS days_until_expiry,
  CASE
    WHEN bc.caregiver_id IS NOT NULL THEN 'caregiver'
    WHEN bc.employee_id IS NOT NULL THEN 'employee'
    WHEN bc.applicant_id IS NOT NULL THEN 'applicant'
  END AS subject_type,
  COALESCE(bc.caregiver_id, bc.employee_id, bc.applicant_id) AS subject_id,
  COALESCE(
    c.first_name || ' ' || c.last_name,
    e.first_name || ' ' || e.last_name,
    a.first_name || ' ' || a.last_name
  ) AS subject_name,
  CASE
    WHEN bc.status = 'pending' THEN 'needs_submission'
    WHEN bc.status = 'completed' AND bc.result = 'flagged' AND bc.review_decision IS NULL THEN 'needs_review'
    WHEN bc.expires_at <= CURRENT_DATE THEN 'expired'
    WHEN bc.expires_at <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
    WHEN bc.status = 'completed' AND bc.result = 'clear' THEN 'valid'
    ELSE bc.status
  END AS health_status
FROM background_checks bc
LEFT JOIN caregivers c ON c.id = bc.caregiver_id
LEFT JOIN employees e ON e.id = bc.employee_id
LEFT JOIN applicants a ON a.id = bc.applicant_id;

-- View: Compliance summary
CREATE OR REPLACE VIEW background_check_compliance AS
SELECT
  organization_id,
  COUNT(*) AS total_checks,
  COUNT(*) FILTER (WHERE status = 'completed' AND result = 'clear') AS clear_count,
  COUNT(*) FILTER (WHERE status = 'completed' AND result = 'flagged') AS flagged_count,
  COUNT(*) FILTER (WHERE status = 'completed' AND result = 'disqualifying') AS disqualifying_count,
  COUNT(*) FILTER (WHERE status IN ('pending', 'submitted', 'in_progress')) AS in_progress_count,
  COUNT(*) FILTER (WHERE expires_at <= CURRENT_DATE) AS expired_count,
  COUNT(*) FILTER (WHERE expires_at > CURRENT_DATE AND expires_at <= CURRENT_DATE + INTERVAL '60 days') AS expiring_soon_count,
  COUNT(*) FILTER (WHERE status = 'completed' AND result = 'flagged' AND review_decision IS NULL) AS needs_review_count
FROM background_checks
GROUP BY organization_id;

-- View: Caregivers needing background checks
CREATE OR REPLACE VIEW caregivers_needing_background_check AS
SELECT
  c.id AS caregiver_id,
  c.organization_id,
  c.first_name,
  c.last_name,
  c.email,
  c.hire_date,
  bc.id AS latest_check_id,
  bc.check_type AS latest_check_type,
  bc.completed_at AS latest_check_date,
  bc.expires_at AS latest_expires_at,
  CASE
    WHEN bc.id IS NULL THEN 'never_checked'
    WHEN bc.expires_at <= CURRENT_DATE THEN 'expired'
    WHEN bc.expires_at <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
    WHEN bc.status != 'completed' THEN 'in_progress'
    ELSE 'valid'
  END AS check_status,
  CASE
    WHEN bc.id IS NULL THEN 0
    WHEN bc.expires_at IS NULL THEN 999
    ELSE bc.expires_at - CURRENT_DATE
  END AS days_until_expiry
FROM caregivers c
LEFT JOIN LATERAL (
  SELECT * FROM background_checks
  WHERE caregiver_id = c.id
    AND check_type IN ('bci', 'fbi', 'bci_fbi')
  ORDER BY completed_at DESC NULLS LAST
  LIMIT 1
) bc ON TRUE
WHERE c.status = 'active'
ORDER BY
  CASE
    WHEN bc.id IS NULL THEN 0
    WHEN bc.expires_at <= CURRENT_DATE THEN 1
    WHEN bc.expires_at <= CURRENT_DATE + INTERVAL '60 days' THEN 2
    ELSE 3
  END,
  bc.expires_at NULLS FIRST;

-- Function to check if caregiver has valid background check
CREATE OR REPLACE FUNCTION has_valid_background_check(
  p_caregiver_id UUID,
  p_check_types VARCHAR[] DEFAULT ARRAY['bci', 'bci_fbi']
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM background_checks
    WHERE caregiver_id = p_caregiver_id
      AND check_type = ANY(p_check_types)
      AND status = 'completed'
      AND result IN ('clear', 'flagged')
      AND review_decision IN ('approved', 'conditional')
      AND (expires_at IS NULL OR expires_at > CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view background checks for their org" ON background_checks
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Admins can manage background checks" ON background_checks
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view reference checks for their org" ON reference_checks
  FOR SELECT USING (
    background_check_id IN (
      SELECT id FROM background_checks
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Admins can manage reference checks" ON reference_checks
  FOR ALL USING (
    background_check_id IN (
      SELECT id FROM background_checks
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

-- Comments
COMMENT ON TABLE background_checks IS 'Tracks all background check requests and results for compliance';
COMMENT ON TABLE reference_checks IS 'Detailed reference check records linked to background checks';
COMMENT ON TABLE disqualifying_offense_codes IS 'Catalog of Ohio disqualifying offenses for home care workers';
COMMENT ON VIEW background_check_dashboard IS 'Dashboard view of all background checks with status indicators';
COMMENT ON VIEW caregivers_needing_background_check IS 'List of caregivers who need new or renewed background checks';
