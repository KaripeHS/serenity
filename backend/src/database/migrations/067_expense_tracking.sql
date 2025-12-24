-- ============================================================
-- Migration 067: Caregiver Expense & Mileage Tracking
-- Serenity Care Partners
--
-- Best-in-Class Feature: Caregivers log mileage and expenses
-- via mobile app with receipt uploads and auto-reimbursement
-- ============================================================

-- Expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,

  -- Reimbursement settings
  is_mileage BOOLEAN DEFAULT FALSE,
  mileage_rate_per_mile DECIMAL(6, 4), -- e.g., 0.67 for IRS rate
  max_amount DECIMAL(10, 2), -- Maximum reimbursable per claim
  requires_receipt BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,

  -- Payroll integration
  payroll_code VARCHAR(50), -- Code for payroll export

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, code)
);

CREATE INDEX idx_expense_categories_org ON expense_categories(organization_id);

-- Seed default expense categories
INSERT INTO expense_categories (organization_id, name, code, description, is_mileage, mileage_rate_per_mile, requires_receipt, requires_approval)
SELECT
  o.id,
  cat.name,
  cat.code,
  cat.description,
  cat.is_mileage,
  cat.mileage_rate,
  cat.requires_receipt,
  cat.requires_approval
FROM organizations o
CROSS JOIN (VALUES
  ('Mileage Reimbursement', 'MILEAGE', 'Travel mileage between client visits', TRUE, 0.67, FALSE, TRUE),
  ('Client Supplies', 'SUPPLIES', 'Supplies purchased for client care', FALSE, NULL, TRUE, TRUE),
  ('Training Materials', 'TRAINING', 'Training-related expenses', FALSE, NULL, TRUE, TRUE),
  ('Parking', 'PARKING', 'Parking fees during visits', FALSE, NULL, TRUE, FALSE),
  ('Tolls', 'TOLLS', 'Toll road charges', FALSE, NULL, TRUE, FALSE),
  ('Uniforms', 'UNIFORM', 'Required uniform purchases', FALSE, NULL, TRUE, TRUE),
  ('Other', 'OTHER', 'Other approved expenses', FALSE, NULL, TRUE, TRUE)
) AS cat(name, code, description, is_mileage, mileage_rate, requires_receipt, requires_approval)
ON CONFLICT DO NOTHING;

-- Expense claims submitted by caregivers
DROP TABLE IF EXISTS mileage_logs CASCADE;
DROP TABLE IF EXISTS expense_approvals CASCADE;
DROP TABLE IF EXISTS expense_claims CASCADE;

CREATE TABLE IF NOT EXISTS expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),

  -- Claim details
  claim_number VARCHAR(20) NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  description TEXT NOT NULL,

  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Date info
  expense_date DATE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Visit association (optional)
  shift_id UUID REFERENCES shifts(id),
  client_id UUID REFERENCES clients(id),

  -- Mileage-specific fields
  is_mileage BOOLEAN DEFAULT FALSE,
  start_location TEXT,
  end_location TEXT,
  miles DECIMAL(8, 2),
  mileage_rate DECIMAL(6, 4),

  -- Receipt
  receipt_url TEXT,
  receipt_filename VARCHAR(255),
  receipt_uploaded_at TIMESTAMPTZ,

  -- Status workflow
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN (
    'draft',      -- Not yet submitted
    'submitted',  -- Awaiting review
    'approved',   -- Approved for payment
    'rejected',   -- Rejected
    'paid',       -- Included in payroll
    'void'        -- Voided
  )),

  -- Approval
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- Payment
  paid_at TIMESTAMPTZ,
  payroll_run_id UUID, -- Links to payroll_runs table
  payment_reference VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_claims_org ON expense_claims(organization_id);
CREATE INDEX idx_expense_claims_caregiver ON expense_claims(caregiver_id);
CREATE INDEX idx_expense_claims_status ON expense_claims(status);
CREATE INDEX idx_expense_claims_date ON expense_claims(expense_date);
CREATE INDEX idx_expense_claims_visit ON expense_claims(shift_id);

-- Generate claim numbers
CREATE OR REPLACE FUNCTION generate_expense_claim_number()
RETURNS TRIGGER AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_seq INTEGER;
BEGIN
  v_prefix := 'EXP-' || TO_CHAR(NOW(), 'YYMM') || '-';

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(claim_number FROM LENGTH(v_prefix) + 1) AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM expense_claims
  WHERE claim_number LIKE v_prefix || '%';

  NEW.claim_number := v_prefix || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_expense_claim_number
  BEFORE INSERT ON expense_claims
  FOR EACH ROW
  WHEN (NEW.claim_number IS NULL)
  EXECUTE FUNCTION generate_expense_claim_number();

-- Mileage log entries (detailed tracking)
CREATE TABLE IF NOT EXISTS mileage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES caregivers(id),
  expense_claim_id UUID REFERENCES expense_claims(id) ON DELETE SET NULL,

  -- Trip details
  log_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,

  -- Locations
  start_address TEXT NOT NULL,
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  end_address TEXT NOT NULL,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),

  -- Purpose
  purpose VARCHAR(50) CHECK (purpose IN (
    'client_visit',      -- Travel to client
    'between_clients',   -- Between client visits
    'office',            -- Travel to/from office
    'training',          -- Training attendance
    'other'              -- Other approved travel
  )),
  shift_id UUID REFERENCES shifts(id),
  client_id UUID REFERENCES clients(id),

  -- Distance
  odometer_start INTEGER,
  odometer_end INTEGER,
  calculated_miles DECIMAL(8, 2),
  reported_miles DECIMAL(8, 2),
  final_miles DECIMAL(8, 2), -- Approved miles (may differ from reported)

  -- Verification
  gps_tracked BOOLEAN DEFAULT FALSE,
  gps_route JSONB, -- GPS points if tracked

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mileage_logs_caregiver ON mileage_logs(caregiver_id);
CREATE INDEX idx_mileage_logs_date ON mileage_logs(log_date);
CREATE INDEX idx_mileage_logs_claim ON mileage_logs(expense_claim_id);

-- Expense approval workflow
CREATE TABLE IF NOT EXISTS expense_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_claim_id UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,

  -- Approval step
  step_number INTEGER DEFAULT 1,
  approver_id UUID REFERENCES users(id),
  approver_role VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'skipped'
  )),

  -- Action details
  action_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_approvals_claim ON expense_approvals(expense_claim_id);

-- View: Expense summary by caregiver
CREATE OR REPLACE VIEW caregiver_expense_summary AS
SELECT
  caregiver_id,
  DATE_TRUNC('month', expense_date) AS month,
  COUNT(*) AS total_claims,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_claims,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_claims,
  SUM(amount) FILTER (WHERE status IN ('approved', 'paid')) AS total_approved,
  SUM(amount) FILTER (WHERE status = 'paid') AS total_paid,
  SUM(miles) FILTER (WHERE is_mileage AND status IN ('approved', 'paid')) AS total_miles,
  SUM(amount) FILTER (WHERE is_mileage AND status IN ('approved', 'paid')) AS mileage_amount,
  SUM(amount) FILTER (WHERE NOT is_mileage AND status IN ('approved', 'paid')) AS other_amount
FROM expense_claims
GROUP BY caregiver_id, DATE_TRUNC('month', expense_date);

-- View: Pending expense approvals
CREATE OR REPLACE VIEW pending_expense_approvals AS
SELECT
  ec.*,
  u.first_name || ' ' || u.last_name AS caregiver_name,
  cat.name AS category_name,
  cat.code AS category_code,
  cl.first_name || ' ' || cl.last_name AS client_name
FROM expense_claims ec
JOIN caregivers c ON c.id = ec.caregiver_id
JOIN users u ON c.user_id = u.id
JOIN expense_categories cat ON cat.id = ec.category_id
LEFT JOIN clients cl ON cl.id = ec.client_id
WHERE ec.status = 'submitted'
ORDER BY ec.submitted_at;

-- View: Expense dashboard stats
CREATE OR REPLACE VIEW expense_dashboard AS
SELECT
  organization_id,
  COUNT(*) FILTER (WHERE status = 'submitted') AS pending_approval,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_unpaid,
  SUM(amount) FILTER (WHERE status = 'submitted') AS pending_amount,
  SUM(amount) FILTER (WHERE status = 'approved') AS approved_amount,
  SUM(amount) FILTER (WHERE status = 'paid' AND paid_at >= DATE_TRUNC('month', NOW())) AS paid_this_month,
  COUNT(DISTINCT caregiver_id) FILTER (WHERE submitted_at >= DATE_TRUNC('week', NOW())) AS caregivers_submitted_this_week,
  AVG(
    EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 3600
  ) FILTER (WHERE status IN ('approved', 'rejected')) AS avg_hours_to_review
FROM expense_claims
GROUP BY organization_id;

-- Function: Auto-calculate mileage reimbursement
CREATE OR REPLACE FUNCTION calculate_mileage_reimbursement(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  total_miles DECIMAL,
  reimbursement_amount DECIMAL,
  trip_count INTEGER,
  by_purpose JSONB
) AS $$
DECLARE
  v_rate DECIMAL(6, 4);
BEGIN
  -- Get the mileage rate for the organization
  SELECT ec.mileage_rate_per_mile INTO v_rate
  FROM expense_categories ec
  JOIN caregivers c ON c.organization_id = ec.organization_id
  WHERE c.id = p_caregiver_id
    AND ec.is_mileage = TRUE
    AND ec.is_active = TRUE
  LIMIT 1;

  v_rate := COALESCE(v_rate, 0.67); -- Default to IRS rate

  RETURN QUERY
  SELECT
    SUM(ml.final_miles)::DECIMAL AS total_miles,
    (SUM(ml.final_miles) * v_rate)::DECIMAL AS reimbursement_amount,
    COUNT(*)::INTEGER AS trip_count,
    jsonb_object_agg(
      COALESCE(ml.purpose, 'other'),
      jsonb_build_object(
        'miles', SUM(ml.final_miles) FILTER (WHERE ml.purpose = ml.purpose),
        'trips', COUNT(*) FILTER (WHERE ml.purpose = ml.purpose)
      )
    ) AS by_purpose
  FROM mileage_logs ml
  WHERE ml.caregiver_id = p_caregiver_id
    AND ml.log_date BETWEEN p_start_date AND p_end_date
    AND ml.expense_claim_id IS NULL; -- Not yet submitted as claim
END;
$$ LANGUAGE plpgsql;

-- Function: Create expense claim from mileage logs
CREATE OR REPLACE FUNCTION create_mileage_claim(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS UUID AS $$
DECLARE
  v_claim_id UUID;
  v_org_id UUID;
  v_category_id UUID;
  v_total_miles DECIMAL;
  v_rate DECIMAL;
  v_amount DECIMAL;
BEGIN
  -- Get organization and category
  SELECT organization_id INTO v_org_id FROM caregivers WHERE id = p_caregiver_id;

  SELECT id, mileage_rate_per_mile INTO v_category_id, v_rate
  FROM expense_categories
  WHERE organization_id = v_org_id AND is_mileage = TRUE AND is_active = TRUE
  LIMIT 1;

  v_rate := COALESCE(v_rate, 0.67);

  -- Calculate total
  SELECT SUM(final_miles) INTO v_total_miles
  FROM mileage_logs
  WHERE caregiver_id = p_caregiver_id
    AND log_date BETWEEN p_start_date AND p_end_date
    AND expense_claim_id IS NULL;

  IF v_total_miles IS NULL OR v_total_miles = 0 THEN
    RETURN NULL;
  END IF;

  v_amount := v_total_miles * v_rate;

  -- Create claim
  INSERT INTO expense_claims (
    organization_id, caregiver_id, category_id, description,
    amount, expense_date, is_mileage, miles, mileage_rate, status
  ) VALUES (
    v_org_id, p_caregiver_id, v_category_id,
    'Mileage reimbursement for ' || p_start_date || ' to ' || p_end_date,
    v_amount, p_end_date, TRUE, v_total_miles, v_rate, 'submitted'
  )
  RETURNING id INTO v_claim_id;

  -- Link mileage logs to claim
  UPDATE mileage_logs
  SET expense_claim_id = v_claim_id
  WHERE caregiver_id = p_caregiver_id
    AND log_date BETWEEN p_start_date AND p_end_date
    AND expense_claim_id IS NULL;

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expense categories for their org" ON expense_categories
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Admins can manage expense categories" ON expense_categories
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Caregivers can view their own expense claims" ON expense_claims
  FOR SELECT USING (
    caregiver_id = current_setting('app.current_caregiver_id', true)::UUID
    OR organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Caregivers can create expense claims" ON expense_claims
  FOR INSERT WITH CHECK (
    caregiver_id = current_setting('app.current_caregiver_id', true)::UUID
  );

CREATE POLICY "Coordinators can manage expense claims" ON expense_claims
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Caregivers can manage their mileage logs" ON mileage_logs
  FOR ALL USING (
    caregiver_id = current_setting('app.current_caregiver_id', true)::UUID
  );

-- Comments
COMMENT ON TABLE expense_categories IS 'Categories for expense reimbursement with rates and rules';
COMMENT ON TABLE expense_claims IS 'Expense claims submitted by caregivers for reimbursement';
COMMENT ON TABLE mileage_logs IS 'Detailed mileage tracking entries';
COMMENT ON FUNCTION calculate_mileage_reimbursement IS 'Calculates mileage reimbursement for a caregiver in a date range';
COMMENT ON FUNCTION create_mileage_claim IS 'Creates an expense claim from accumulated mileage logs';
