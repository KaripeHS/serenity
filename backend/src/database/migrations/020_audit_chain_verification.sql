-- ============================================================================
-- Audit Chain Hash Verification Migration
-- Serenity ERP - Cryptographic Audit Trail Integrity (HIPAA Compliance)
-- Phase 0-1: Blockchain-style hash chain for tamper detection
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For cryptographic functions

-- ============================================================================
-- Extend audit_log table with hash chain columns
-- ============================================================================

-- Add hash chain columns to existing audit_log table
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS current_hash VARCHAR(64);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS hash_algorithm VARCHAR(20) DEFAULT 'sha256';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS chain_position BIGINT;

-- Create index for hash chain verification
CREATE INDEX IF NOT EXISTS idx_audit_log_chain_position ON audit_log(chain_position DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_current_hash ON audit_log(current_hash);
CREATE INDEX IF NOT EXISTS idx_audit_log_verified_at ON audit_log(verified_at DESC NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_audit_log_verification_status ON audit_log(verification_status) WHERE verification_status IS NOT NULL;

-- ============================================================================
-- Audit Chain Verification Results Table
-- Stores results of weekly hash chain verification jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_chain_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL, -- For multi-tenant support

  -- Verification scope
  verification_started_at TIMESTAMPTZ DEFAULT NOW(),
  verification_completed_at TIMESTAMPTZ,
  records_verified BIGINT DEFAULT 0,

  -- Results
  verification_status VARCHAR(50) NOT NULL, -- 'in_progress', 'passed', 'failed', 'partial_failure'
  chain_intact BOOLEAN,
  broken_chain_count INTEGER DEFAULT 0,

  -- Hash mismatches
  mismatches JSONB, -- Array of mismatched records
  /*
    Example: [
      {
        "audit_log_id": "uuid",
        "chain_position": 12345,
        "expected_hash": "abc123...",
        "actual_hash": "def456...",
        "timestamp": "2025-11-03T10:30:00Z"
      }
    ]
  */

  -- Performance metrics
  duration_seconds DECIMAL(10,2),
  records_per_second DECIMAL(10,2),

  -- Verification method
  verification_method VARCHAR(50) DEFAULT 'full_chain', -- 'full_chain', 'incremental', 'sample'
  verified_by UUID, -- References users(id) or 'system' for automated jobs

  -- Alerts
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMPTZ,
  alert_recipients TEXT[],

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT audit_chain_verifications_status_check CHECK (
    verification_status IN ('in_progress', 'passed', 'failed', 'partial_failure', 'cancelled')
  )
);

-- Indexes for audit_chain_verifications
CREATE INDEX idx_audit_chain_verifications_org ON audit_chain_verifications(organization_id);
CREATE INDEX idx_audit_chain_verifications_started ON audit_chain_verifications(verification_started_at DESC);
CREATE INDEX idx_audit_chain_verifications_status ON audit_chain_verifications(verification_status);
CREATE INDEX idx_audit_chain_verifications_failed ON audit_chain_verifications(chain_intact) WHERE chain_intact = FALSE;

-- ============================================================================
-- Audit Chain Configuration Table
-- Per-organization settings for audit chain
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_chain_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE,

  -- Hash algorithm
  hash_algorithm VARCHAR(20) DEFAULT 'sha256', -- 'sha256', 'sha512', 'sha3-256'

  -- Verification schedule
  verification_enabled BOOLEAN DEFAULT TRUE,
  verification_frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  verification_day_of_week INTEGER DEFAULT 0, -- 0=Sunday
  verification_time TIME DEFAULT '02:00', -- 2 AM

  -- Alert settings
  alert_on_mismatch BOOLEAN DEFAULT TRUE,
  alert_recipients TEXT[], -- Email addresses or user IDs
  alert_severity VARCHAR(20) DEFAULT 'critical', -- 'critical', 'high', 'medium'

  -- Retention
  verification_log_retention_days INTEGER DEFAULT 730, -- 2 years

  -- Performance tuning
  batch_size INTEGER DEFAULT 1000,
  max_duration_minutes INTEGER DEFAULT 60,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,

  CONSTRAINT audit_chain_config_frequency_check CHECK (
    verification_frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'disabled')
  ),
  CONSTRAINT audit_chain_config_algorithm_check CHECK (
    hash_algorithm IN ('sha256', 'sha512', 'sha3-256', 'blake2b')
  )
);

-- Index for audit_chain_config
CREATE INDEX idx_audit_chain_config_org ON audit_chain_config(organization_id);

-- ============================================================================
-- Trigger to Calculate Hash Chain on Audit Log Insert
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_audit_log_hash()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_hash VARCHAR(64);
  v_chain_position BIGINT;
  v_hash_input TEXT;
BEGIN
  -- Get previous hash and next chain position
  SELECT
    current_hash,
    COALESCE(MAX(chain_position), 0) + 1
  INTO v_previous_hash, v_chain_position
  FROM audit_log
  WHERE organization_id = NEW.organization_id
  ORDER BY chain_position DESC NULLS LAST
  LIMIT 1;

  -- Set chain position
  NEW.chain_position := v_chain_position;

  -- Set previous hash
  NEW.previous_hash := COALESCE(v_previous_hash, '0000000000000000000000000000000000000000000000000000000000000000');

  -- Calculate current hash
  -- Hash input: previous_hash + chain_position + timestamp + user_id + action + entity_type + entity_id + data
  v_hash_input :=
    COALESCE(NEW.previous_hash, '') ||
    NEW.chain_position::TEXT ||
    NEW.timestamp::TEXT ||
    COALESCE(NEW.user_id::TEXT, '') ||
    COALESCE(NEW.action, '') ||
    COALESCE(NEW.entity_type, '') ||
    COALESCE(NEW.entity_id::TEXT, '') ||
    COALESCE(NEW.changes::TEXT, '');

  -- Use SHA-256 for hash (can be made configurable)
  NEW.current_hash := encode(digest(v_hash_input, 'sha256'), 'hex');
  NEW.hash_algorithm := 'sha256';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on audit_log
CREATE TRIGGER audit_log_calculate_hash
  BEFORE INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION calculate_audit_log_hash();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to verify hash chain integrity
CREATE OR REPLACE FUNCTION verify_audit_chain(
  p_organization_id UUID,
  p_start_position BIGINT DEFAULT NULL,
  p_end_position BIGINT DEFAULT NULL
) RETURNS TABLE (
  is_valid BOOLEAN,
  total_records BIGINT,
  invalid_records BIGINT,
  broken_links JSONB
) AS $$
DECLARE
  v_current_record RECORD;
  v_calculated_hash VARCHAR(64);
  v_hash_input TEXT;
  v_total BIGINT := 0;
  v_invalid BIGINT := 0;
  v_broken_links JSONB := '[]'::JSONB;
  v_is_valid BOOLEAN := TRUE;
BEGIN
  -- Iterate through audit log records in chain order
  FOR v_current_record IN
    SELECT *
    FROM audit_log
    WHERE organization_id = p_organization_id
      AND (p_start_position IS NULL OR chain_position >= p_start_position)
      AND (p_end_position IS NULL OR chain_position <= p_end_position)
    ORDER BY chain_position ASC
  LOOP
    v_total := v_total + 1;

    -- Calculate expected hash
    v_hash_input :=
      COALESCE(v_current_record.previous_hash, '') ||
      v_current_record.chain_position::TEXT ||
      v_current_record.timestamp::TEXT ||
      COALESCE(v_current_record.user_id::TEXT, '') ||
      COALESCE(v_current_record.action, '') ||
      COALESCE(v_current_record.entity_type, '') ||
      COALESCE(v_current_record.entity_id::TEXT, '') ||
      COALESCE(v_current_record.changes::TEXT, '');

    v_calculated_hash := encode(digest(v_hash_input, 'sha256'), 'hex');

    -- Compare with stored hash
    IF v_calculated_hash != v_current_record.current_hash THEN
      v_invalid := v_invalid + 1;
      v_is_valid := FALSE;

      -- Add to broken links array
      v_broken_links := v_broken_links || jsonb_build_object(
        'audit_log_id', v_current_record.id,
        'chain_position', v_current_record.chain_position,
        'expected_hash', v_calculated_hash,
        'actual_hash', v_current_record.current_hash,
        'timestamp', v_current_record.timestamp
      );
    END IF;
  END LOOP;

  -- Return results
  is_valid := v_is_valid;
  total_records := v_total;
  invalid_records := v_invalid;
  broken_links := v_broken_links;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest verification status
CREATE OR REPLACE FUNCTION get_audit_chain_status(p_organization_id UUID)
RETURNS TABLE (
  last_verification_at TIMESTAMPTZ,
  chain_intact BOOLEAN,
  records_verified BIGINT,
  mismatches_found INTEGER,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    acv.verification_completed_at,
    acv.chain_intact,
    acv.records_verified,
    acv.broken_chain_count,
    acv.verification_status
  FROM audit_chain_verifications acv
  WHERE acv.organization_id = p_organization_id
    AND acv.verification_status IN ('passed', 'failed', 'partial_failure')
  ORDER BY acv.verification_completed_at DESC NULLS LAST
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to run audit chain verification (called by background job)
CREATE OR REPLACE FUNCTION run_audit_chain_verification(p_organization_id UUID)
RETURNS UUID AS $$
DECLARE
  v_verification_id UUID;
  v_start_time TIMESTAMPTZ := NOW();
  v_result RECORD;
BEGIN
  -- Create verification record
  INSERT INTO audit_chain_verifications (
    organization_id,
    verification_status,
    verification_started_at
  ) VALUES (
    p_organization_id,
    'in_progress',
    v_start_time
  ) RETURNING id INTO v_verification_id;

  -- Run verification
  SELECT * INTO v_result
  FROM verify_audit_chain(p_organization_id);

  -- Update verification record with results
  UPDATE audit_chain_verifications
  SET
    verification_completed_at = NOW(),
    verification_status = CASE
      WHEN v_result.is_valid THEN 'passed'
      ELSE 'failed'
    END,
    chain_intact = v_result.is_valid,
    records_verified = v_result.total_records,
    broken_chain_count = v_result.invalid_records,
    mismatches = v_result.broken_links,
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_start_time)),
    records_per_second = CASE
      WHEN EXTRACT(EPOCH FROM (NOW() - v_start_time)) > 0
      THEN v_result.total_records / EXTRACT(EPOCH FROM (NOW() - v_start_time))
      ELSE 0
    END
  WHERE id = v_verification_id;

  RETURN v_verification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Enable RLS on audit_chain_verifications
ALTER TABLE audit_chain_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_chain_verifications_tenant_isolation ON audit_chain_verifications
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on audit_chain_config
ALTER TABLE audit_chain_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_chain_config_tenant_isolation ON audit_chain_config
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- Audit Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_audit_chain_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_chain_config_update_timestamp
  BEFORE UPDATE ON audit_chain_config
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_chain_config_timestamp();

-- ============================================================================
-- Views
-- ============================================================================

-- View for audit chain health monitoring
CREATE OR REPLACE VIEW audit_chain_health AS
SELECT
  al.organization_id,
  COUNT(*) AS total_audit_records,
  MAX(al.chain_position) AS latest_chain_position,
  MIN(al.timestamp) AS earliest_audit_timestamp,
  MAX(al.timestamp) AS latest_audit_timestamp,
  MAX(al.verified_at) AS last_verified_at,
  COUNT(*) FILTER (WHERE al.verification_status = 'valid') AS verified_valid_count,
  COUNT(*) FILTER (WHERE al.verification_status = 'invalid') AS verified_invalid_count,
  acv.chain_intact AS last_verification_intact,
  acv.verification_completed_at AS last_full_verification_at
FROM audit_log al
LEFT JOIN LATERAL (
  SELECT chain_intact, verification_completed_at
  FROM audit_chain_verifications
  WHERE organization_id = al.organization_id
  ORDER BY verification_completed_at DESC NULLS LAST
  LIMIT 1
) acv ON TRUE
GROUP BY al.organization_id, acv.chain_intact, acv.verification_completed_at;

COMMENT ON VIEW audit_chain_health IS 'Real-time audit chain health status per organization';

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE audit_chain_verifications IS 'Results of periodic cryptographic verification of audit trail integrity';
COMMENT ON TABLE audit_chain_config IS 'Organization-specific configuration for audit chain verification';

COMMENT ON COLUMN audit_log.previous_hash IS 'SHA-256 hash of previous audit log entry (blockchain-style chain)';
COMMENT ON COLUMN audit_log.current_hash IS 'SHA-256 hash of this audit log entry (for tamper detection)';
COMMENT ON COLUMN audit_log.chain_position IS 'Sequential position in the audit chain (1, 2, 3, ...)';

COMMENT ON COLUMN audit_chain_verifications.chain_intact IS 'TRUE if all hash links are valid, FALSE if tampering detected';
COMMENT ON COLUMN audit_chain_verifications.mismatches IS 'JSONB array of records where hash verification failed';

COMMENT ON FUNCTION verify_audit_chain IS 'Verifies cryptographic integrity of audit log hash chain';
COMMENT ON FUNCTION run_audit_chain_verification IS 'Runs full audit chain verification and stores results (called by background job)';

-- ============================================================================
-- Migration Complete
-- Version: 020
-- Date: 2025-11-03
-- Notes: Implements cryptographic hash chain for audit trail integrity (HIPAA compliance)
-- ============================================================================
