-- ============================================================================
-- Sandata Alternative EVV Integration Migration
-- Serenity ERP - Ohio Medicaid Alt-EVV v4.3 Compliance
-- Phase 0-1: Additive schema changes (backwards-compatible)
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Sandata Transactions Table
-- Stores all API interactions with Sandata for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandata_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Transaction metadata
  transaction_type VARCHAR(50) NOT NULL, -- 'individual', 'employee', 'visit', 'correction'
  transaction_id VARCHAR(100), -- Sandata's transaction ID (from response)

  -- Request/Response
  request_payload JSONB NOT NULL, -- Encrypted in production
  response_payload JSONB, -- Sandata's response (encrypted)
  http_status_code INTEGER,

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'error', 'retrying'
  sandata_status_code VARCHAR(50), -- Sandata's specific status code
  error_code VARCHAR(100), -- Sandata error taxonomy code
  error_message TEXT,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Timing
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Response time in milliseconds

  -- Relations
  evv_record_id UUID, -- References evv_records(id) - nullable for non-visit transactions
  organization_id UUID NOT NULL, -- For RLS

  -- Audit trail
  created_by UUID, -- References users(id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sandata_transactions_status_check CHECK (
    status IN ('pending', 'accepted', 'rejected', 'error', 'retrying', 'failed', 'cancelled')
  ),
  CONSTRAINT sandata_transactions_type_check CHECK (
    transaction_type IN ('individual', 'employee', 'visit', 'visit_correction', 'void')
  )
);

-- Indexes for Sandata transactions
CREATE INDEX idx_sandata_transactions_status ON sandata_transactions(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_sandata_transactions_evv_record ON sandata_transactions(evv_record_id) WHERE evv_record_id IS NOT NULL;
CREATE INDEX idx_sandata_transactions_org ON sandata_transactions(organization_id);
CREATE INDEX idx_sandata_transactions_submitted ON sandata_transactions(submitted_at DESC);
CREATE INDEX idx_sandata_transactions_type ON sandata_transactions(transaction_type);
CREATE INDEX idx_sandata_transactions_next_retry ON sandata_transactions(next_retry_at) WHERE status = 'retrying';

-- ============================================================================
-- Extend evv_records table with Sandata-specific columns
-- Additive only - no breaking changes
-- ============================================================================

-- Add visit_key (deterministic unique identifier for Sandata)
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS visit_key VARCHAR(255) UNIQUE;

-- Add detailed Sandata status tracking
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_status VARCHAR(50) DEFAULT 'not_submitted';
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_submitted_at TIMESTAMPTZ;
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_accepted_at TIMESTAMPTZ;
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_error_code VARCHAR(100);
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_error_message TEXT;
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_retry_count INTEGER DEFAULT 0;
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_last_transaction_id UUID; -- References sandata_transactions(id)

-- Add constraint check for sandata_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evv_records_sandata_status_check'
  ) THEN
    ALTER TABLE evv_records ADD CONSTRAINT evv_records_sandata_status_check CHECK (
      sandata_status IN ('not_submitted', 'pending', 'accepted', 'rejected', 'error', 'retrying')
    );
  END IF;
END $$;

-- Indexes for EVV Sandata columns
CREATE INDEX IF NOT EXISTS idx_evv_records_visit_key ON evv_records(visit_key) WHERE visit_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evv_records_sandata_status ON evv_records(sandata_status);
CREATE INDEX IF NOT EXISTS idx_evv_records_sandata_submitted ON evv_records(sandata_submitted_at DESC) WHERE sandata_submitted_at IS NOT NULL;

-- ============================================================================
-- Extend clients table with Sandata identifiers
-- ============================================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS sandata_client_id VARCHAR(100) UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sandata_last_synced TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sandata_sync_required BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sandata_sync_error TEXT;

-- EVV Consent tracking (HIPAA/Ohio compliance)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS evv_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS evv_consent_date TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS evv_consent_pdf_url TEXT; -- S3 link to signed consent
ALTER TABLE clients ADD COLUMN IF NOT EXISTS evv_consent_ip_address INET;

-- Index for Sandata client sync
CREATE INDEX IF NOT EXISTS idx_clients_sandata_sync_required ON clients(sandata_sync_required) WHERE sandata_sync_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_clients_sandata_id ON clients(sandata_client_id) WHERE sandata_client_id IS NOT NULL;

-- ============================================================================
-- Extend users table with Sandata employee identifiers
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_employee_id VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_last_synced TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_sync_required BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_sync_error TEXT;

-- Index for Sandata employee sync
CREATE INDEX IF NOT EXISTS idx_users_sandata_sync_required ON users(sandata_sync_required) WHERE sandata_sync_required = TRUE AND role = 'caregiver';
CREATE INDEX IF NOT EXISTS idx_users_sandata_id ON users(sandata_employee_id) WHERE sandata_employee_id IS NOT NULL;

-- ============================================================================
-- Sandata Configuration Table
-- Stores Sandata-specific configuration per organization
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandata_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE, -- One config per org

  -- API Configuration
  sandata_provider_id VARCHAR(50) NOT NULL, -- ODME Provider ID
  sandbox_enabled BOOLEAN DEFAULT TRUE,
  api_endpoint_override TEXT, -- Optional custom endpoint

  -- Business Rules
  geofence_radius_miles DECIMAL(5,2) DEFAULT 0.25,
  clock_in_tolerance_minutes INTEGER DEFAULT 15,
  rounding_minutes INTEGER DEFAULT 6,
  rounding_mode VARCHAR(20) DEFAULT 'nearest', -- 'nearest', 'up', 'down'

  -- Retry Configuration
  max_retry_attempts INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 300, -- 5 minutes

  -- Claims Gate Configuration
  claims_gate_mode VARCHAR(20) DEFAULT 'warn', -- 'disabled', 'warn', 'strict'
  require_authorization_match BOOLEAN DEFAULT TRUE,
  block_over_authorization BOOLEAN DEFAULT TRUE,

  -- Feature Flags (org-level overrides)
  auto_submit_enabled BOOLEAN DEFAULT FALSE,
  corrections_enabled BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID, -- References users(id)

  CONSTRAINT sandata_config_rounding_mode_check CHECK (
    rounding_mode IN ('nearest', 'up', 'down')
  ),
  CONSTRAINT sandata_config_claims_gate_check CHECK (
    claims_gate_mode IN ('disabled', 'warn', 'strict')
  )
);

-- Index for Sandata config
CREATE INDEX IF NOT EXISTS idx_sandata_config_org ON sandata_config(organization_id);

-- ============================================================================
-- Row-Level Security Policies for Sandata Tables
-- ============================================================================

-- Enable RLS on sandata_transactions
ALTER TABLE sandata_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see transactions for their organization
CREATE POLICY sandata_transactions_tenant_isolation ON sandata_transactions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Policy: AI service role can see all (for monitoring)
CREATE POLICY sandata_transactions_ai_service_access ON sandata_transactions
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'ai_service');

-- Enable RLS on sandata_config
ALTER TABLE sandata_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see config for their organization
CREATE POLICY sandata_config_tenant_isolation ON sandata_config
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- Audit Triggers for Sandata Tables
-- ============================================================================

-- Trigger to update updated_at timestamp on sandata_transactions
CREATE OR REPLACE FUNCTION update_sandata_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sandata_transactions_update_timestamp
  BEFORE UPDATE ON sandata_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_sandata_transaction_timestamp();

-- Trigger to update updated_at timestamp on sandata_config
CREATE TRIGGER sandata_config_update_timestamp
  BEFORE UPDATE ON sandata_config
  FOR EACH ROW
  EXECUTE FUNCTION update_sandata_transaction_timestamp();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to generate deterministic visit_key
CREATE OR REPLACE FUNCTION generate_visit_key(
  p_client_id UUID,
  p_caregiver_id UUID,
  p_service_date DATE,
  p_service_code VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  v_client_sandata_id VARCHAR;
  v_caregiver_sandata_id VARCHAR;
  v_visit_key VARCHAR;
BEGIN
  -- Get Sandata IDs (fall back to UUID if not synced yet)
  SELECT COALESCE(sandata_client_id, id::TEXT) INTO v_client_sandata_id
  FROM clients WHERE id = p_client_id;

  SELECT COALESCE(sandata_employee_id, id::TEXT) INTO v_caregiver_sandata_id
  FROM users WHERE id = p_caregiver_id;

  -- Generate key: {clientId}_{caregiverId}_{YYYYMMDD}_{serviceCode}
  v_visit_key := v_client_sandata_id || '_' ||
                 v_caregiver_sandata_id || '_' ||
                 TO_CHAR(p_service_date, 'YYYYMMDD') || '_' ||
                 p_service_code;

  RETURN v_visit_key;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if visit is ready for Sandata submission
CREATE OR REPLACE FUNCTION is_visit_sandata_ready(p_evv_record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_ready BOOLEAN := FALSE;
BEGIN
  SELECT
    clock_out_time IS NOT NULL AND
    is_valid = TRUE AND
    sandata_status IN ('not_submitted', 'error', 'rejected') AND
    sandata_retry_count < 3
  INTO v_is_ready
  FROM evv_records
  WHERE id = p_evv_record_id;

  RETURN COALESCE(v_is_ready, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE sandata_transactions IS 'Audit trail of all Sandata API interactions for Ohio Alt-EVV compliance';
COMMENT ON TABLE sandata_config IS 'Organization-specific Sandata configuration and business rules';

COMMENT ON COLUMN evv_records.visit_key IS 'Deterministic unique identifier for Sandata visit submissions (immutable)';
COMMENT ON COLUMN evv_records.sandata_status IS 'Current Sandata submission status: not_submitted, pending, accepted, rejected, error';

COMMENT ON COLUMN clients.evv_consent_given IS 'HIPAA-compliant consent for EVV location tracking (required by Ohio)';
COMMENT ON COLUMN clients.sandata_client_id IS 'Sandata Individual ID (synced from Sandata system)';

COMMENT ON COLUMN users.sandata_employee_id IS 'Sandata Employee ID (synced from Sandata system)';

-- ============================================================================
-- Migration Complete
-- Version: 015
-- Date: 2025-11-03
-- ============================================================================
