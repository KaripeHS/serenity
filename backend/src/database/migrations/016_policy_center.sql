-- ============================================================================
-- Policy Center & Compliance Management Migration
-- Serenity ERP - Policy Management, Staff Sign-offs, Consent Flows
-- Phase 0-1: Compliance-by-Design Infrastructure
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Policies Table
-- Stores organizational policies, SOPs, and compliance documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL, -- For multi-tenant support

  -- Policy identification
  policy_type VARCHAR(100) NOT NULL, -- 'evv_exception', 'data_retention', 'evv_consent', 'hipaa', 'sop', etc.
  policy_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'EVV-001', 'HIPAA-001', 'RET-001'
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Versioning
  version VARCHAR(20) NOT NULL, -- e.g., '1.0', '2.1'
  previous_version_id UUID, -- References policies(id) for version history
  is_current_version BOOLEAN DEFAULT TRUE,

  -- Content
  content_type VARCHAR(50) DEFAULT 'markdown', -- 'markdown', 'html', 'pdf_link'
  content TEXT, -- Markdown/HTML content
  document_url TEXT, -- S3 URL for PDF documents
  document_checksum VARCHAR(64), -- SHA-256 for integrity verification

  -- Compliance
  requires_signoff BOOLEAN DEFAULT TRUE,
  signoff_required_for_roles TEXT[], -- Array of roles: ['caregiver', 'scheduler', 'hr_manager']
  effective_date DATE NOT NULL,
  expiration_date DATE, -- NULL for policies that don't expire
  review_frequency_days INTEGER, -- e.g., 365 for annual review

  -- Categorization
  category VARCHAR(100), -- 'compliance', 'operations', 'hr', 'clinical'
  tags TEXT[], -- Searchable tags
  regulatory_references JSONB, -- Links to regulations (Ohio Admin Code, HIPAA, etc.)

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'archived', 'superseded'

  -- Audit
  created_by UUID, -- References users(id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  CONSTRAINT policies_status_check CHECK (
    status IN ('draft', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT policies_content_type_check CHECK (
    content_type IN ('markdown', 'html', 'pdf_link', 'external_link')
  )
);

-- Indexes for policies
CREATE INDEX idx_policies_org ON policies(organization_id);
CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_code ON policies(policy_code);
CREATE INDEX idx_policies_status ON policies(status) WHERE status = 'active';
CREATE INDEX idx_policies_current_version ON policies(is_current_version) WHERE is_current_version = TRUE;
CREATE INDEX idx_policies_effective_date ON policies(effective_date DESC);
CREATE INDEX idx_policies_requires_signoff ON policies(requires_signoff) WHERE requires_signoff = TRUE;

-- ============================================================================
-- Policy Sign-offs Table
-- Tracks staff acknowledgment of policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL, -- References policies(id)
  user_id UUID NOT NULL, -- References users(id)

  -- Sign-off details
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  signature_method VARCHAR(50) DEFAULT 'digital', -- 'digital', 'electronic', 'wet_signature'

  -- Attestation
  attestation_text TEXT, -- The exact text the user agreed to
  policy_version VARCHAR(20), -- Snapshot of version at time of signing

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(policy_id, user_id) -- One sign-off per policy per user (latest version)
);

-- Indexes for policy_signoffs
CREATE INDEX idx_policy_signoffs_policy ON policy_signoffs(policy_id);
CREATE INDEX idx_policy_signoffs_user ON policy_signoffs(user_id);
CREATE INDEX idx_policy_signoffs_signed_at ON policy_signoffs(signed_at DESC);

-- ============================================================================
-- Policy Acknowledgment Tracking
-- Tracks which staff need to sign which policies (for notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_acknowledgment_required (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL, -- References policies(id)
  user_id UUID NOT NULL, -- References users(id)

  -- Requirement tracking
  required_date DATE NOT NULL, -- Date by which sign-off is required
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,

  -- Reminders
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(policy_id, user_id)
);

-- Indexes for acknowledgment tracking
CREATE INDEX idx_policy_ack_required_user ON policy_acknowledgment_required(user_id) WHERE is_acknowledged = FALSE;
CREATE INDEX idx_policy_ack_required_policy ON policy_acknowledgment_required(policy_id);
CREATE INDEX idx_policy_ack_required_date ON policy_acknowledgment_required(required_date) WHERE is_acknowledged = FALSE;

-- ============================================================================
-- Data Retention Policies Table
-- Defines retention rules for different data types
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  -- Policy identification
  data_type VARCHAR(100) NOT NULL, -- 'evv_records', 'claims', 'audit_logs', 'phi_documents', etc.
  retention_period_days INTEGER NOT NULL, -- e.g., 2555 (7 years)

  -- Archival rules
  archive_after_days INTEGER, -- Move to cold storage after X days
  archive_destination VARCHAR(100), -- 's3_glacier', 's3_deep_archive', 'tape'

  -- Legal holds
  legal_hold_enabled BOOLEAN DEFAULT FALSE,
  legal_hold_reason TEXT,
  legal_hold_set_by UUID, -- References users(id)
  legal_hold_set_at TIMESTAMPTZ,

  -- Regulatory basis
  regulatory_basis TEXT, -- e.g., "HIPAA 45 CFR 164.530(j)", "Ohio Admin Code 5160-1-17.2"
  notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE NOT NULL,

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT data_retention_period_positive CHECK (retention_period_days > 0)
);

-- Indexes for data retention policies
CREATE INDEX idx_data_retention_org ON data_retention_policies(organization_id);
CREATE INDEX idx_data_retention_type ON data_retention_policies(data_type) WHERE is_active = TRUE;
CREATE INDEX idx_data_retention_legal_hold ON data_retention_policies(legal_hold_enabled) WHERE legal_hold_enabled = TRUE;

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Enable RLS on policies
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY policies_tenant_isolation ON policies
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on policy_signoffs
ALTER TABLE policy_signoffs ENABLE ROW LEVEL SECURITY;

-- Users can see their own sign-offs
CREATE POLICY policy_signoffs_own_access ON policy_signoffs
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admins can see all sign-offs in their org
CREATE POLICY policy_signoffs_admin_access ON policy_signoffs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM policies p
      WHERE p.id = policy_signoffs.policy_id
      AND p.organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

-- Enable RLS on acknowledgment tracking
ALTER TABLE policy_acknowledgment_required ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ack_required_user_access ON policy_acknowledgment_required
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Enable RLS on data retention policies
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_retention_tenant_isolation ON data_retention_policies
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- Audit Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policies_update_timestamp
  BEFORE UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_timestamp();

CREATE TRIGGER policy_ack_update_timestamp
  BEFORE UPDATE ON policy_acknowledgment_required
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_timestamp();

CREATE TRIGGER data_retention_update_timestamp
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_timestamp();

-- Trigger to auto-create acknowledgment requirements when policy is published
CREATE OR REPLACE FUNCTION create_policy_acknowledgments()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create acknowledgments if policy requires sign-off and is being published
  IF NEW.requires_signoff = TRUE AND NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    INSERT INTO policy_acknowledgment_required (policy_id, user_id, required_date)
    SELECT
      NEW.id,
      u.id,
      CURRENT_DATE + INTERVAL '7 days' -- Default: 7 days to acknowledge
    FROM users u
    WHERE u.organization_id = NEW.organization_id
      AND u.is_active = TRUE
      AND (
        NEW.signoff_required_for_roles IS NULL
        OR u.role::TEXT = ANY(NEW.signoff_required_for_roles)
      )
    ON CONFLICT (policy_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policies_create_acknowledgments
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION create_policy_acknowledgments();

-- Trigger to mark acknowledgment as complete when user signs off
CREATE OR REPLACE FUNCTION mark_acknowledgment_complete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE policy_acknowledgment_required
  SET
    is_acknowledged = TRUE,
    acknowledged_at = NEW.signed_at,
    updated_at = NOW()
  WHERE policy_id = NEW.policy_id
    AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policy_signoffs_mark_complete
  AFTER INSERT ON policy_signoffs
  FOR EACH ROW
  EXECUTE FUNCTION mark_acknowledgment_complete();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get policy compliance status for a user
CREATE OR REPLACE FUNCTION get_user_policy_compliance(p_user_id UUID)
RETURNS TABLE (
  total_policies_required INTEGER,
  policies_acknowledged INTEGER,
  compliance_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_policies_required,
    COUNT(*) FILTER (WHERE is_acknowledged = TRUE)::INTEGER AS policies_acknowledged,
    ROUND(
      (COUNT(*) FILTER (WHERE is_acknowledged = TRUE)::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0)) * 100,
      2
    ) AS compliance_percentage
  FROM policy_acknowledgment_required
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a user needs policy training
CREATE OR REPLACE FUNCTION user_has_pending_policies(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_pending BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM policy_acknowledgment_required
    WHERE user_id = p_user_id
      AND is_acknowledged = FALSE
      AND required_date <= CURRENT_DATE
  ) INTO v_has_pending;

  RETURN v_has_pending;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE policies IS 'Organizational policies, SOPs, and compliance documents with versioning';
COMMENT ON TABLE policy_signoffs IS 'Staff acknowledgment and sign-offs for policies';
COMMENT ON TABLE policy_acknowledgment_required IS 'Tracking of required policy acknowledgments for notifications';
COMMENT ON TABLE data_retention_policies IS 'Data retention rules for compliance (HIPAA, Ohio regulations)';

COMMENT ON COLUMN policies.policy_code IS 'Unique policy identifier (e.g., EVV-001, HIPAA-001)';
COMMENT ON COLUMN policies.version IS 'Policy version number for change tracking';
COMMENT ON COLUMN policies.requires_signoff IS 'Whether staff must acknowledge this policy';

COMMENT ON COLUMN policy_signoffs.attestation_text IS 'Snapshot of attestation text at time of signing (immutable)';
COMMENT ON COLUMN data_retention_policies.retention_period_days IS 'Number of days to retain data before deletion';

-- ============================================================================
-- Migration Complete
-- Version: 016
-- Date: 2025-11-03
-- ============================================================================
