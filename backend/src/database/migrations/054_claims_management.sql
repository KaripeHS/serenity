-- Migration: 054_claims_management.sql
-- Claims Management Tables for Medicaid Billing
-- Supports claim generation, validation, submission, and tracking

-- ============================================
-- CLAIM BATCHES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS claim_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  batch_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'validated', 'submitted', 'accepted', 'rejected', 'paid', 'partial')),
  claim_count INTEGER NOT NULL DEFAULT 0,
  total_charge_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2),
  rejected_amount DECIMAL(12,2),

  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  submission_method VARCHAR(50), -- 'clearinghouse', 'direct', 'manual'
  submission_reference VARCHAR(100),

  -- Response tracking
  response_received_at TIMESTAMPTZ,
  acceptance_rate DECIMAL(5,2),

  -- Payment tracking
  paid_at TIMESTAMPTZ,
  check_number VARCHAR(50),
  eft_reference VARCHAR(100),

  -- EDI file tracking
  edi_file_path TEXT,
  edi_control_number VARCHAR(20),

  -- Metadata
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claim_batches_org_id ON claim_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_claim_batches_status ON claim_batches(status);
CREATE INDEX IF NOT EXISTS idx_claim_batches_created_at ON claim_batches(created_at);

-- ============================================
-- CLAIM LINES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS claim_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES claim_batches(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL,
  claim_number VARCHAR(50) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Service details
  service_code VARCHAR(20) NOT NULL,
  service_date DATE NOT NULL,
  units INTEGER NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  charge_amount DECIMAL(10,2) NOT NULL,

  -- Authorization linkage
  authorization_id UUID,
  authorization_number VARCHAR(50),

  -- EVV linkage
  evv_record_id UUID,
  evv_validation_status VARCHAR(20),

  -- Claim status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'paid', 'adjusted')),

  -- Adjudication details
  paid_amount DECIMAL(10,2),
  adjustment_amount DECIMAL(10,2),
  adjustment_reason_code VARCHAR(10),
  denial_reason_code VARCHAR(10),
  denial_reason_text TEXT,

  -- Response tracking
  payer_claim_id VARCHAR(100),
  adjudication_date DATE,

  -- Metadata
  validation_errors JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claim_lines_batch_id ON claim_lines(batch_id);
CREATE INDEX IF NOT EXISTS idx_claim_lines_visit_id ON claim_lines(visit_id);
CREATE INDEX IF NOT EXISTS idx_claim_lines_client_id ON claim_lines(client_id);
CREATE INDEX IF NOT EXISTS idx_claim_lines_service_date ON claim_lines(service_date);
CREATE INDEX IF NOT EXISTS idx_claim_lines_status ON claim_lines(status);

-- ============================================
-- SERVICE AUTHORIZATIONS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS service_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  authorization_number VARCHAR(50) NOT NULL,
  service_code VARCHAR(20) NOT NULL,
  units_approved INTEGER NOT NULL,
  units_used INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  payer_id VARCHAR(50),
  payer_name VARCHAR(100),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_auth_client ON service_authorizations(client_id);
CREATE INDEX IF NOT EXISTS idx_service_auth_dates ON service_authorizations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_service_auth_service ON service_authorizations(service_code);

-- ============================================
-- CLAIM SUBMISSION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS claim_submission_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES claim_batches(id),
  action VARCHAR(50) NOT NULL, -- 'submitted', 'response_received', 'resubmitted', etc.
  status_before VARCHAR(20),
  status_after VARCHAR(20),
  details JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_sub_log_batch ON claim_submission_log(batch_id);

-- ============================================
-- AR AGING VIEW
-- ============================================

CREATE OR REPLACE VIEW claim_ar_aging AS
SELECT
  cb.organization_id,
  cl.id as claim_line_id,
  cl.claim_number,
  c.first_name || ' ' || c.last_name as client_name,
  c.medicaid_number,
  cl.service_code,
  cl.service_date,
  cl.charge_amount,
  cl.status,
  cb.submitted_at,
  CASE
    WHEN cb.submitted_at IS NULL THEN 'Not Submitted'
    WHEN CURRENT_DATE - cb.submitted_at::date <= 30 THEN '0-30 Days'
    WHEN CURRENT_DATE - cb.submitted_at::date <= 60 THEN '31-60 Days'
    WHEN CURRENT_DATE - cb.submitted_at::date <= 90 THEN '61-90 Days'
    WHEN CURRENT_DATE - cb.submitted_at::date <= 120 THEN '91-120 Days'
    ELSE '120+ Days'
  END as aging_bucket,
  CURRENT_DATE - cb.submitted_at::date as days_outstanding
FROM claim_lines cl
JOIN claim_batches cb ON cb.id = cl.batch_id
JOIN clients c ON c.id = cl.client_id
WHERE cl.status NOT IN ('paid', 'adjusted');

-- ============================================
-- HELPER FUNCTION: Update Authorization Usage
-- ============================================

CREATE OR REPLACE FUNCTION update_authorization_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.authorization_id IS NOT NULL AND NEW.status = 'paid' THEN
    UPDATE service_authorizations
    SET units_used = units_used + NEW.units,
        updated_at = NOW()
    WHERE id = NEW.authorization_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating authorization usage
DROP TRIGGER IF EXISTS trg_update_auth_usage ON claim_lines;
CREATE TRIGGER trg_update_auth_usage
  AFTER UPDATE OF status ON claim_lines
  FOR EACH ROW
  WHEN (OLD.status != 'paid' AND NEW.status = 'paid')
  EXECUTE FUNCTION update_authorization_usage();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE claim_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_authorizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE claim_batches IS 'Batches of claims for submission to Medicaid';
COMMENT ON TABLE claim_lines IS 'Individual claim line items within a batch';
COMMENT ON TABLE service_authorizations IS 'Prior authorizations for Medicaid services';
COMMENT ON VIEW claim_ar_aging IS 'Accounts receivable aging report for claims';
