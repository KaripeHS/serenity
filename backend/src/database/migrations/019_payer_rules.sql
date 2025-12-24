-- ============================================================================
-- Payer Rules Registry Migration
-- Serenity ERP - Payer-Specific Billing Rules, Modifiers, Alt-EVV Requirements
-- Phase 0-1: Claims Gate & RCM Configuration
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Payer Rules Table
-- Stores payer-specific billing rules, modifiers, and compliance requirements
-- ============================================================================

CREATE TABLE IF NOT EXISTS payer_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL, -- For multi-tenant support

  -- Payer identification
  payer_id VARCHAR(100) NOT NULL, -- Payer identifier (e.g., 'OH_MEDICAID', 'MEDICARE', 'UNITED_HEALTHCARE')
  payer_name VARCHAR(255) NOT NULL,
  payer_type VARCHAR(50) NOT NULL, -- 'medicaid', 'medicare', 'commercial', 'managed_care'
  state VARCHAR(2) DEFAULT 'OH', -- State jurisdiction

  -- Rule definition
  rule_type VARCHAR(100) NOT NULL, -- 'modifier_required', 'alt_evv_required', 'authorization_required', 'documentation_required', etc.
  rule_code VARCHAR(50), -- Internal code (e.g., 'MOD-U4', 'EVV-REQ')
  rule_description TEXT NOT NULL,

  -- Rule configuration
  rule_config JSONB NOT NULL, -- Flexible JSON config for different rule types
  /*
    Example configs:
    - Modifier rule: {"modifier_codes": ["U4", "UD"], "apply_to_service_codes": ["T1019", "T1020"]}
    - EVV rule: {"evv_required": true, "aggregator": "sandata", "min_elements": 6}
    - Authorization: {"require_auth_number": true, "max_units_without_auth": 0}
  */

  -- Conditions (when does this rule apply?)
  applies_to_service_codes TEXT[], -- HCPCS codes this rule applies to
  applies_to_procedure_codes TEXT[], -- CPT codes
  applies_to_place_of_service TEXT[], -- Place of service codes
  applies_to_modifiers TEXT[], -- Modifier codes

  -- Enforcement
  enforcement_level VARCHAR(50) DEFAULT 'strict', -- 'strict', 'warn', 'optional'
  block_claim_submission BOOLEAN DEFAULT FALSE, -- If true, claims gate will block submission

  -- Effective dates
  effective_date DATE NOT NULL,
  expiration_date DATE, -- NULL for rules that don't expire

  -- Priority (for conflicting rules)
  priority INTEGER DEFAULT 100, -- Lower number = higher priority

  -- Error messaging
  validation_error_message TEXT, -- Message to show when rule is violated
  resolution_instructions TEXT, -- Instructions for fixing the issue

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_deprecated BOOLEAN DEFAULT FALSE,

  -- Regulatory references
  regulatory_reference TEXT, -- Link to regulation/policy document
  reference_url TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- References users(id)
  updated_by UUID,

  CONSTRAINT payer_rules_type_check CHECK (
    payer_type IN ('medicaid', 'medicare', 'commercial', 'managed_care', 'other')
  ),
  CONSTRAINT payer_rules_enforcement_check CHECK (
    enforcement_level IN ('strict', 'warn', 'optional', 'disabled')
  ),
  CONSTRAINT payer_rules_effective_dates_check CHECK (
    expiration_date IS NULL OR expiration_date > effective_date
  )
);

-- Indexes for payer_rules
CREATE INDEX idx_payer_rules_org ON payer_rules(organization_id);
CREATE INDEX idx_payer_rules_payer ON payer_rules(payer_id);
CREATE INDEX idx_payer_rules_type ON payer_rules(rule_type);
CREATE INDEX idx_payer_rules_active ON payer_rules(is_active, effective_date, expiration_date) WHERE is_active = TRUE;
CREATE INDEX idx_payer_rules_service_codes ON payer_rules USING GIN(applies_to_service_codes) WHERE applies_to_service_codes IS NOT NULL;
CREATE INDEX idx_payer_rules_priority ON payer_rules(priority ASC);

-- Payer definitions
CREATE TABLE IF NOT EXISTS payers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    payer_id VARCHAR(100) UNIQUE, -- External ID
    type VARCHAR(50) DEFAULT 'commercial',
    contact_info JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payers_org ON payers(organization_id);

-- ============================================================================
-- Payer Contracts Table
-- Stores contract details with payers (rates, terms, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payer_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  -- Payer identification
  payer_id VARCHAR(100) NOT NULL, -- Match with payer_rules.payer_id
  payer_name VARCHAR(255) NOT NULL,
  contract_number VARCHAR(100) UNIQUE,

  -- Contract terms
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renewal BOOLEAN DEFAULT FALSE,
  renewal_notice_days INTEGER DEFAULT 90,

  -- Rates
  default_rate_per_unit DECIMAL(10,2),
  rate_schedule JSONB, -- Service code -> rate mapping
  /*
    Example: {
      "T1019": {"rate": 18.50, "unit": "15min"},
      "T1020": {"rate": 22.00, "unit": "15min"}
    }
  */

  -- Payment terms
  payment_terms_days INTEGER DEFAULT 30, -- Net 30, Net 45, etc.
  clean_claim_definition_days INTEGER DEFAULT 30, -- How long payer has to process clean claim

  -- Claims submission
  claims_submission_method VARCHAR(50), -- 'edi_837', 'portal', 'paper', 'clearinghouse'
  clearinghouse_name VARCHAR(100),
  payer_contact_info JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'expired', 'terminated'

  -- Notes
  notes TEXT,
  special_requirements TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  CONSTRAINT payer_contracts_status_check CHECK (
    status IN ('active', 'pending', 'expired', 'terminated', 'suspended')
  ),
  CONSTRAINT payer_contracts_dates_valid CHECK (
    end_date IS NULL OR end_date > start_date
  )
);

-- Indexes for payer_contracts
CREATE INDEX idx_payer_contracts_org ON payer_contracts(organization_id);
CREATE INDEX idx_payer_contracts_payer ON payer_contracts(payer_id);
CREATE INDEX idx_payer_contracts_status ON payer_contracts(status) WHERE status = 'active';
CREATE INDEX idx_payer_contracts_dates ON payer_contracts(start_date, end_date);

-- ============================================================================
-- Claims Validation Results Table
-- Stores results of payer rule validations on claims
-- ============================================================================

CREATE TABLE IF NOT EXISTS claim_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL, -- References claims(id)
  organization_id UUID NOT NULL,

  -- Validation details
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  payer_id VARCHAR(100) NOT NULL,

  -- Overall result
  validation_status VARCHAR(50) NOT NULL, -- 'passed', 'warnings', 'failed'
  can_submit BOOLEAN NOT NULL, -- Whether claim can be submitted despite validation

  -- Detailed results
  rules_evaluated INTEGER DEFAULT 0,
  rules_passed INTEGER DEFAULT 0,
  rules_failed INTEGER DEFAULT 0,
  rules_warnings INTEGER DEFAULT 0,

  -- Violations
  violations JSONB, -- Array of rule violations
  /*
    Example: [
      {
        "rule_id": "uuid",
        "rule_type": "alt_evv_required",
        "severity": "error",
        "message": "EVV record not found for this service",
        "field": "evv_record_id"
      }
    ]
  */

  -- Audit
  validated_by UUID, -- User or system that triggered validation

  CONSTRAINT claim_validations_status_check CHECK (
    validation_status IN ('passed', 'warnings', 'failed', 'skipped')
  )
);

-- Indexes for claim_validations
CREATE INDEX idx_claim_validations_claim ON claim_validations(claim_id);
CREATE INDEX idx_claim_validations_org ON claim_validations(organization_id);
CREATE INDEX idx_claim_validations_status ON claim_validations(validation_status);
CREATE INDEX idx_claim_validations_can_submit ON claim_validations(can_submit);
CREATE INDEX idx_claim_validations_validated_at ON claim_validations(validated_at DESC);

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Enable RLS on payer_rules
ALTER TABLE payer_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY payer_rules_tenant_isolation ON payer_rules
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on payer_contracts
ALTER TABLE payer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY payer_contracts_tenant_isolation ON payer_contracts
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on claim_validations
ALTER TABLE claim_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY claim_validations_tenant_isolation ON claim_validations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- Audit Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_payer_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payer_rules_update_timestamp
  BEFORE UPDATE ON payer_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_payer_rules_timestamp();

CREATE TRIGGER payer_contracts_update_timestamp
  BEFORE UPDATE ON payer_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_payer_rules_timestamp();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get applicable rules for a claim
CREATE OR REPLACE FUNCTION get_applicable_payer_rules(
  p_payer_id VARCHAR,
  p_service_code VARCHAR,
  p_service_date DATE
) RETURNS TABLE (
  rule_id UUID,
  rule_type VARCHAR,
  rule_config JSONB,
  enforcement_level VARCHAR,
  block_claim_submission BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.rule_type,
    pr.rule_config,
    pr.enforcement_level,
    pr.block_claim_submission
  FROM payer_rules pr
  WHERE pr.payer_id = p_payer_id
    AND pr.is_active = TRUE
    AND pr.effective_date <= p_service_date
    AND (pr.expiration_date IS NULL OR pr.expiration_date > p_service_date)
    AND (
      pr.applies_to_service_codes IS NULL
      OR p_service_code = ANY(pr.applies_to_service_codes)
    )
  ORDER BY pr.priority ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if payer requires Alt-EVV
CREATE OR REPLACE FUNCTION payer_requires_alt_evv(
  p_payer_id VARCHAR,
  p_service_code VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_requires_evv BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM payer_rules pr
    WHERE pr.payer_id = p_payer_id
      AND pr.rule_type = 'alt_evv_required'
      AND pr.is_active = TRUE
      AND pr.effective_date <= CURRENT_DATE
      AND (pr.expiration_date IS NULL OR pr.expiration_date > CURRENT_DATE)
      AND (
        pr.applies_to_service_codes IS NULL
        OR p_service_code IS NULL
        OR p_service_code = ANY(pr.applies_to_service_codes)
      )
      AND (pr.rule_config->>'evv_required')::BOOLEAN = TRUE
  ) INTO v_requires_evv;

  RETURN v_requires_evv;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get payer contract rate for a service
CREATE OR REPLACE FUNCTION get_payer_rate(
  p_payer_id VARCHAR,
  p_service_code VARCHAR,
  p_service_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL(10,2);
BEGIN
  SELECT
    COALESCE(
      (pc.rate_schedule->>p_service_code)::JSONB->>'rate',
      pc.default_rate_per_unit::TEXT
    )::DECIMAL
  INTO v_rate
  FROM payer_contracts pc
  WHERE pc.payer_id = p_payer_id
    AND pc.status = 'active'
    AND pc.start_date <= p_service_date
    AND (pc.end_date IS NULL OR pc.end_date > p_service_date)
  LIMIT 1;

  RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Seed Common Payer Rules (Ohio Medicaid Alt-EVV)
-- ============================================================================

-- Insert Ohio Medicaid Alt-EVV requirement
INSERT INTO payer_rules (
  organization_id,
  payer_id,
  payer_name,
  payer_type,
  state,
  rule_type,
  rule_code,
  rule_description,
  rule_config,
  applies_to_service_codes,
  enforcement_level,
  block_claim_submission,
  effective_date,
  validation_error_message,
  resolution_instructions,
  regulatory_reference
) VALUES (
  (SELECT id FROM organizations LIMIT 1), -- Placeholder org
  'OH_MEDICAID',
  'Ohio Medicaid',
  'medicaid',
  'OH',
  'alt_evv_required',
  'OH-EVV-001',
  'Ohio Medicaid requires 6-element EVV for personal care services (effective 1/1/2021)',
  '{"evv_required": true, "aggregator": "sandata", "min_elements": 6, "elements": ["service_type", "client_name", "caregiver_name", "service_date", "clock_in_out", "location"]}',
  ARRAY['T1019', 'T1020', 'S5125', 'S5126'], -- Common personal care HCPCS codes
  'strict',
  TRUE,
  '2021-01-01',
  'EVV record not found or incomplete. Ohio Medicaid requires 6-element EVV for this service.',
  'Ensure caregiver clocked in/out via mobile app with GPS location. Verify all 6 EVV elements are captured and submitted to Sandata.',
  'Ohio Admin Code 5160-1-17.2; CMS Final Rule 42 CFR 441.730'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE payer_rules IS 'Payer-specific billing rules, modifiers, and compliance requirements';
COMMENT ON TABLE payer_contracts IS 'Contracts with payers including rates, terms, and submission methods';
COMMENT ON TABLE claim_validations IS 'Results of payer rule validations performed on claims before submission';

COMMENT ON COLUMN payer_rules.rule_config IS 'Flexible JSONB configuration for rule-specific parameters';
COMMENT ON COLUMN payer_rules.enforcement_level IS 'strict=block submission, warn=show warning, optional=informational';
COMMENT ON COLUMN payer_contracts.rate_schedule IS 'JSONB mapping of service codes to contracted rates';

-- ============================================================================
-- Migration Complete
-- Version: 019
-- Date: 2025-11-03
-- ============================================================================
