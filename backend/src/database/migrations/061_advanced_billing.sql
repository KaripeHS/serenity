-- ============================================================
-- Migration 061: Advanced Billing System
-- Serenity Care Partners
--
-- Phase 2 Month 5: Advanced Billing
-- - Remittance (835) processing and auto-posting
-- - Denial management workflow
-- - AR aging reports and analytics
-- - MITS integration support
-- ============================================================

-- ============================================================
-- REMITTANCE (835) TABLES
-- ============================================================

-- Remittance advice records from payers
CREATE TABLE IF NOT EXISTS remittance_advice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Identification
  remittance_number VARCHAR(50) NOT NULL, -- TRN reference
  payer_id VARCHAR(50) NOT NULL,
  payer_name VARCHAR(200),

  -- Dates
  check_date DATE,
  payment_date DATE,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processing_date TIMESTAMPTZ,

  -- Payment info
  payment_method VARCHAR(20) CHECK (payment_method IN ('check', 'eft', 'vcp')),
  check_number VARCHAR(50),
  eft_trace_number VARCHAR(50),
  total_payment DECIMAL(12,2) NOT NULL,
  total_claims INTEGER NOT NULL DEFAULT 0,
  claims_paid INTEGER NOT NULL DEFAULT 0,
  claims_denied INTEGER NOT NULL DEFAULT 0,
  claims_adjusted INTEGER NOT NULL DEFAULT 0,

  -- File info
  file_name VARCHAR(255),
  file_path TEXT,
  raw_content TEXT, -- Original 835 content for reference

  -- Processing status
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN (
    'received',
    'parsing',
    'parsed',
    'posting',
    'posted',
    'partial',
    'error'
  )),
  auto_posted BOOLEAN DEFAULT FALSE,
  manual_review_required BOOLEAN DEFAULT FALSE,
  error_message TEXT,

  -- Audit
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, remittance_number)
);

CREATE INDEX idx_remittance_org ON remittance_advice(organization_id);
CREATE INDEX idx_remittance_payer ON remittance_advice(payer_id);
CREATE INDEX idx_remittance_status ON remittance_advice(status);
CREATE INDEX idx_remittance_date ON remittance_advice(received_date);

-- Individual claim adjustments from 835
CREATE TABLE IF NOT EXISTS remittance_claim_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_id UUID NOT NULL REFERENCES remittance_advice(id) ON DELETE CASCADE,

  -- Claim identification
  payer_claim_id VARCHAR(100), -- CLP01
  claim_line_id UUID REFERENCES claim_lines(id),
  patient_account_number VARCHAR(50), -- CLP06 - our claim number

  -- Status
  claim_status_code VARCHAR(10), -- CLP02 (1=Processed Primary, 2=Processed Secondary, etc.)
  claim_status_text VARCHAR(100),

  -- Amounts
  charge_amount DECIMAL(10,2), -- CLP03
  paid_amount DECIMAL(10,2), -- CLP04
  patient_responsibility DECIMAL(10,2), -- CLP05
  adjustment_amount DECIMAL(10,2),

  -- Service line details (from SVC segments)
  service_lines JSONB, -- Array of service line adjustments

  -- Adjustment codes (from CAS segments)
  adjustment_reason_codes JSONB, -- Array of {group, code, amount, quantity}

  -- Posting status
  posting_status VARCHAR(20) DEFAULT 'pending' CHECK (posting_status IN (
    'pending',
    'posted',
    'skipped',
    'error',
    'manual'
  )),
  posting_error TEXT,
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rem_claim_remittance ON remittance_claim_details(remittance_id);
CREATE INDEX idx_rem_claim_line ON remittance_claim_details(claim_line_id);
CREATE INDEX idx_rem_claim_posting ON remittance_claim_details(posting_status);

-- ============================================================
-- DENIAL MANAGEMENT TABLES
-- ============================================================

-- Denial tracking and workflow
CREATE TABLE IF NOT EXISTS claim_denials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  claim_line_id UUID NOT NULL REFERENCES claim_lines(id),

  -- Denial info from 835
  denial_date DATE NOT NULL,
  denial_code VARCHAR(20) NOT NULL,
  denial_reason TEXT NOT NULL,
  denial_category VARCHAR(50) CHECK (denial_category IN (
    'eligibility',
    'authorization',
    'timely_filing',
    'duplicate',
    'coding',
    'documentation',
    'evv',
    'coordination_of_benefits',
    'other'
  )),

  -- Financial impact
  billed_amount DECIMAL(10,2) NOT NULL,
  denied_amount DECIMAL(10,2) NOT NULL,

  -- Workflow status
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN (
    'new',
    'under_review',
    'correcting',
    'resubmitting',
    'appealing',
    'written_off',
    'resolved'
  )),

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Resolution tracking
  resolution_type VARCHAR(30) CHECK (resolution_type IN (
    'resubmitted',
    'appeal_won',
    'appeal_lost',
    'corrected_and_paid',
    'written_off',
    'no_action_needed'
  )),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  recovery_amount DECIMAL(10,2), -- Amount recovered after correction/appeal

  -- Appeal tracking
  appeal_deadline DATE,
  appeal_submitted_at TIMESTAMPTZ,
  appeal_reference VARCHAR(100),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_denials_org ON claim_denials(organization_id);
CREATE INDEX idx_denials_claim ON claim_denials(claim_line_id);
CREATE INDEX idx_denials_status ON claim_denials(status);
CREATE INDEX idx_denials_code ON claim_denials(denial_code);
CREATE INDEX idx_denials_category ON claim_denials(denial_category);
CREATE INDEX idx_denials_assigned ON claim_denials(assigned_to) WHERE status NOT IN ('written_off', 'resolved');

-- Denial action log
CREATE TABLE IF NOT EXISTS denial_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  denial_id UUID NOT NULL REFERENCES claim_denials(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'assigned', 'status_changed', 'note_added', 'appeal_filed', etc.
  action_details JSONB,
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_denial_actions_denial ON denial_action_log(denial_id);

-- ============================================================
-- AR AGING ENHANCEMENTS
-- ============================================================

-- AR snapshots for trending
CREATE TABLE IF NOT EXISTS ar_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  snapshot_date DATE NOT NULL,

  -- Totals by aging bucket
  current_0_30 DECIMAL(12,2) NOT NULL DEFAULT 0,
  aging_31_60 DECIMAL(12,2) NOT NULL DEFAULT 0,
  aging_61_90 DECIMAL(12,2) NOT NULL DEFAULT 0,
  aging_91_120 DECIMAL(12,2) NOT NULL DEFAULT 0,
  aging_over_120 DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_ar DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Counts
  claim_count_0_30 INTEGER NOT NULL DEFAULT 0,
  claim_count_31_60 INTEGER NOT NULL DEFAULT 0,
  claim_count_61_90 INTEGER NOT NULL DEFAULT 0,
  claim_count_91_120 INTEGER NOT NULL DEFAULT 0,
  claim_count_over_120 INTEGER NOT NULL DEFAULT 0,
  total_claim_count INTEGER NOT NULL DEFAULT 0,

  -- By payer (JSONB for flexibility)
  by_payer JSONB, -- Array of {payerId, payerName, buckets: {...}}

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, snapshot_date)
);

CREATE INDEX idx_ar_snapshots_org_date ON ar_snapshots(organization_id, snapshot_date);

-- ============================================================
-- PAYER INTEGRATION TABLES
-- ============================================================

-- Payer configuration for MITS and other integrations
CREATE TABLE IF NOT EXISTS payer_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payer_id VARCHAR(50) NOT NULL,
  payer_name VARCHAR(200) NOT NULL,

  -- Integration type
  integration_type VARCHAR(30) NOT NULL CHECK (integration_type IN (
    'mits',           -- Ohio Medicaid (ODA)
    'embs',           -- Ohio DODD
    'clearinghouse',  -- Via clearinghouse
    'direct',         -- Direct EDI submission
    'manual'          -- Manual paper claims
  )),

  -- Connection settings (encrypted in practice)
  connection_settings JSONB, -- {endpoint, credentials, etc.}

  -- Submission settings
  submission_format VARCHAR(20) DEFAULT '837P', -- '837P', '837I', 'CMS1500'
  batch_size_limit INTEGER DEFAULT 100,
  submission_schedule VARCHAR(50), -- cron expression

  -- 835 retrieval settings
  era_retrieval_enabled BOOLEAN DEFAULT TRUE,
  era_retrieval_schedule VARCHAR(50),
  era_auto_post BOOLEAN DEFAULT FALSE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_submission_at TIMESTAMPTZ,
  last_era_retrieval_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, payer_id)
);

CREATE INDEX idx_payer_integrations_org ON payer_integrations(organization_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- Enhanced AR aging view with payer breakdown
CREATE OR REPLACE VIEW ar_aging_summary AS
SELECT
  cb.organization_id,
  sa.payer_id,
  sa.payer_name,
  SUM(CASE WHEN CURRENT_DATE - cb.submitted_at::date <= 30 THEN cl.charge_amount - COALESCE(cl.paid_amount, 0) ELSE 0 END) AS amount_0_30,
  SUM(CASE WHEN CURRENT_DATE - cb.submitted_at::date BETWEEN 31 AND 60 THEN cl.charge_amount - COALESCE(cl.paid_amount, 0) ELSE 0 END) AS amount_31_60,
  SUM(CASE WHEN CURRENT_DATE - cb.submitted_at::date BETWEEN 61 AND 90 THEN cl.charge_amount - COALESCE(cl.paid_amount, 0) ELSE 0 END) AS amount_61_90,
  SUM(CASE WHEN CURRENT_DATE - cb.submitted_at::date BETWEEN 91 AND 120 THEN cl.charge_amount - COALESCE(cl.paid_amount, 0) ELSE 0 END) AS amount_91_120,
  SUM(CASE WHEN CURRENT_DATE - cb.submitted_at::date > 120 THEN cl.charge_amount - COALESCE(cl.paid_amount, 0) ELSE 0 END) AS amount_over_120,
  SUM(cl.charge_amount - COALESCE(cl.paid_amount, 0)) AS total_outstanding,
  COUNT(*) AS claim_count
FROM claim_lines cl
JOIN claim_batches cb ON cb.id = cl.batch_id
LEFT JOIN service_authorizations sa ON sa.id = cl.authorization_id
WHERE cl.status IN ('submitted', 'accepted')
  AND cb.submitted_at IS NOT NULL
GROUP BY cb.organization_id, sa.payer_id, sa.payer_name;

-- Denial summary view
CREATE OR REPLACE VIEW denial_summary AS
SELECT
  cd.organization_id,
  cd.denial_category,
  cd.denial_code,
  cd.status,
  COUNT(*) AS denial_count,
  SUM(cd.denied_amount) AS total_denied,
  SUM(COALESCE(cd.recovery_amount, 0)) AS total_recovered,
  AVG(EXTRACT(EPOCH FROM (COALESCE(cd.resolved_at, NOW()) - cd.created_at)) / 86400)::INTEGER AS avg_days_to_resolve
FROM claim_denials cd
GROUP BY cd.organization_id, cd.denial_category, cd.denial_code, cd.status;

-- Remittance processing view
CREATE OR REPLACE VIEW remittance_processing_status AS
SELECT
  ra.organization_id,
  ra.id AS remittance_id,
  ra.remittance_number,
  ra.payer_name,
  ra.received_date,
  ra.total_payment,
  ra.total_claims,
  ra.status,
  COUNT(rcd.id) AS detail_count,
  COUNT(rcd.id) FILTER (WHERE rcd.posting_status = 'posted') AS posted_count,
  COUNT(rcd.id) FILTER (WHERE rcd.posting_status = 'error') AS error_count,
  COUNT(rcd.id) FILTER (WHERE rcd.posting_status = 'pending') AS pending_count,
  ROUND(
    (COUNT(rcd.id) FILTER (WHERE rcd.posting_status = 'posted')::DECIMAL /
     NULLIF(COUNT(rcd.id), 0)) * 100,
    1
  ) AS posting_percentage
FROM remittance_advice ra
LEFT JOIN remittance_claim_details rcd ON rcd.remittance_id = ra.id
GROUP BY ra.id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to generate AR snapshot
CREATE OR REPLACE FUNCTION generate_ar_snapshot(p_organization_id UUID)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_by_payer JSONB;
BEGIN
  -- Calculate by-payer data
  SELECT jsonb_agg(payer_data)
  INTO v_by_payer
  FROM (
    SELECT jsonb_build_object(
      'payerId', payer_id,
      'payerName', payer_name,
      'amount_0_30', amount_0_30,
      'amount_31_60', amount_31_60,
      'amount_61_90', amount_61_90,
      'amount_91_120', amount_91_120,
      'amount_over_120', amount_over_120,
      'total', total_outstanding
    ) AS payer_data
    FROM ar_aging_summary
    WHERE organization_id = p_organization_id
  ) sub;

  -- Insert snapshot
  INSERT INTO ar_snapshots (
    organization_id,
    snapshot_date,
    current_0_30,
    aging_31_60,
    aging_61_90,
    aging_91_120,
    aging_over_120,
    total_ar,
    by_payer
  )
  SELECT
    p_organization_id,
    CURRENT_DATE,
    COALESCE(SUM(amount_0_30), 0),
    COALESCE(SUM(amount_31_60), 0),
    COALESCE(SUM(amount_61_90), 0),
    COALESCE(SUM(amount_91_120), 0),
    COALESCE(SUM(amount_over_120), 0),
    COALESCE(SUM(total_outstanding), 0),
    v_by_payer
  FROM ar_aging_summary
  WHERE organization_id = p_organization_id
  ON CONFLICT (organization_id, snapshot_date)
  DO UPDATE SET
    current_0_30 = EXCLUDED.current_0_30,
    aging_31_60 = EXCLUDED.aging_31_60,
    aging_61_90 = EXCLUDED.aging_61_90,
    aging_91_120 = EXCLUDED.aging_91_120,
    aging_over_120 = EXCLUDED.aging_over_120,
    total_ar = EXCLUDED.total_ar,
    by_payer = EXCLUDED.by_payer
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-post remittance
CREATE OR REPLACE FUNCTION auto_post_remittance(p_remittance_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_posted INTEGER := 0;
  v_errors INTEGER := 0;
  v_skipped INTEGER := 0;
  v_detail RECORD;
BEGIN
  -- Update remittance status to posting
  UPDATE remittance_advice
  SET status = 'posting', processed_by = p_user_id
  WHERE id = p_remittance_id;

  -- Process each claim detail
  FOR v_detail IN
    SELECT * FROM remittance_claim_details
    WHERE remittance_id = p_remittance_id AND posting_status = 'pending'
  LOOP
    BEGIN
      -- Try to match and update claim line
      IF v_detail.claim_line_id IS NOT NULL THEN
        UPDATE claim_lines
        SET
          status = CASE
            WHEN v_detail.paid_amount > 0 THEN 'paid'
            WHEN v_detail.adjustment_amount > 0 THEN 'adjusted'
            ELSE 'rejected'
          END,
          paid_amount = v_detail.paid_amount,
          adjustment_amount = v_detail.adjustment_amount,
          adjudication_date = CURRENT_DATE,
          payer_claim_id = v_detail.payer_claim_id,
          updated_at = NOW()
        WHERE id = v_detail.claim_line_id;

        UPDATE remittance_claim_details
        SET posting_status = 'posted', posted_at = NOW(), posted_by = p_user_id
        WHERE id = v_detail.id;

        v_posted := v_posted + 1;
      ELSE
        -- No matching claim line found
        UPDATE remittance_claim_details
        SET posting_status = 'skipped', posting_error = 'No matching claim line found'
        WHERE id = v_detail.id;

        v_skipped := v_skipped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE remittance_claim_details
      SET posting_status = 'error', posting_error = SQLERRM
      WHERE id = v_detail.id;

      v_errors := v_errors + 1;
    END;
  END LOOP;

  -- Update remittance status
  UPDATE remittance_advice
  SET
    status = CASE
      WHEN v_errors > 0 THEN 'partial'
      ELSE 'posted'
    END,
    auto_posted = TRUE,
    processed_at = NOW()
  WHERE id = p_remittance_id;

  RETURN jsonb_build_object(
    'posted', v_posted,
    'errors', v_errors,
    'skipped', v_skipped
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE remittance_advice ENABLE ROW LEVEL SECURITY;
ALTER TABLE remittance_claim_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE denial_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view remittances for their org" ON remittance_advice
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can manage remittances for their org" ON remittance_advice
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view denials for their org" ON claim_denials
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can manage denials for their org" ON claim_denials
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view AR snapshots for their org" ON ar_snapshots
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view payer integrations for their org" ON payer_integrations
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE remittance_advice IS '835 Electronic Remittance Advice records from payers';
COMMENT ON TABLE remittance_claim_details IS 'Individual claim details from 835 remittance';
COMMENT ON TABLE claim_denials IS 'Denied claims with workflow tracking for resolution';
COMMENT ON TABLE denial_action_log IS 'Audit log of actions taken on denials';
COMMENT ON TABLE ar_snapshots IS 'Daily AR aging snapshots for trend analysis';
COMMENT ON TABLE payer_integrations IS 'Configuration for payer integrations (MITS, eMBS, clearinghouse)';
COMMENT ON FUNCTION generate_ar_snapshot IS 'Creates a daily snapshot of AR aging data';
COMMENT ON FUNCTION auto_post_remittance IS 'Automatically posts 835 payments to claim lines';
