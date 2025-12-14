-- Migration: Business Associate Agreement (BAA) Tracking
-- Purpose: Track HIPAA Business Associate Agreements and ensure timely renewals
-- Compliance: HIPAA Privacy Rule 45 CFR § 164.502(e) - Business Associate Contracts
-- Created: 2025-12-13

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Business Associates Table
-- ============================================================================

CREATE TABLE business_associates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Business Associate Details
  ba_name VARCHAR(200) NOT NULL,
  ba_type VARCHAR(100) CHECK (ba_type IN (
    'ehr_vendor', 'billing_service', 'cloud_storage', 'it_support',
    'accounting_firm', 'legal_counsel', 'shredding_service', 'courier',
    'telehealth_platform', 'analytics_vendor', 'payroll_service', 'other'
  )),

  -- Contact Information
  primary_contact_name VARCHAR(200),
  primary_contact_email VARCHAR(200),
  primary_contact_phone VARCHAR(20),
  business_address TEXT,
  website VARCHAR(500),

  -- PHI Access Details
  phi_access_level VARCHAR(50) CHECK (phi_access_level IN ('full', 'limited', 'minimal')),
  phi_types_accessed JSONB DEFAULT '[]'::jsonb, -- Array of PHI types (names, ssn, dob, medical_records, etc.)
  data_storage_location VARCHAR(200), -- Cloud provider, on-premise, hybrid
  encryption_standard VARCHAR(100), -- AES-256, TLS 1.2, etc.

  -- Services Provided
  services_description TEXT NOT NULL,
  critical_service BOOLEAN DEFAULT false, -- Service critical to operations

  -- Financial
  annual_cost DECIMAL(12,2),
  billing_frequency VARCHAR(50) CHECK (billing_frequency IN ('monthly', 'quarterly', 'annually', 'one_time')),

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'pending')),
  relationship_start_date DATE,
  relationship_end_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_business_associates_org ON business_associates(organization_id);
CREATE INDEX idx_business_associates_type ON business_associates(ba_type);
CREATE INDEX idx_business_associates_status ON business_associates(status);

-- RLS Policies
ALTER TABLE business_associates ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_associates_org_isolation ON business_associates
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Business Associate Agreements Table
-- ============================================================================

CREATE TABLE business_associate_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_associate_id UUID NOT NULL REFERENCES business_associates(id) ON DELETE CASCADE,

  -- Agreement Details
  baa_number VARCHAR(50) UNIQUE,
  agreement_type VARCHAR(50) DEFAULT 'standard_baa' CHECK (agreement_type IN (
    'standard_baa', 'subcontractor_baa', 'amendment', 'renewal'
  )),
  agreement_name VARCHAR(200),

  -- Dates
  execution_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 90, -- Days before expiration to send renewal notice

  -- HIPAA Requirements Checklist
  establishes_permitted_uses BOOLEAN DEFAULT false,
  requires_safeguards BOOLEAN DEFAULT false,
  requires_reporting_breaches BOOLEAN DEFAULT false,
  requires_reporting_security_incidents BOOLEAN DEFAULT false,
  restricts_use_disclosure BOOLEAN DEFAULT false,
  requires_subcontractor_agreements BOOLEAN DEFAULT false,
  allows_termination_for_breach BOOLEAN DEFAULT false,
  requires_return_destruction_phi BOOLEAN DEFAULT false,
  all_requirements_met BOOLEAN DEFAULT false, -- Computed: all above = true

  -- Subcontractors
  has_subcontractors BOOLEAN DEFAULT false,
  subcontractors JSONB DEFAULT '[]'::jsonb, -- Array of {name, services, baaExecuted}

  -- Documentation
  document_url VARCHAR(500), -- S3 URL or file path to signed BAA
  signed_by_ba BOOLEAN DEFAULT false,
  ba_signatory_name VARCHAR(200),
  ba_signatory_title VARCHAR(100),
  ba_signature_date DATE,

  signed_by_covered_entity BOOLEAN DEFAULT false,
  ce_signatory_name VARCHAR(200),
  ce_signatory_title VARCHAR(100),
  ce_signature_date DATE,

  -- Review & Compliance
  last_reviewed_date DATE,
  next_review_due_date DATE,
  compliance_verified BOOLEAN DEFAULT false,
  compliance_verification_date DATE,
  compliance_notes TEXT,

  -- Breach History
  breaches_reported INTEGER DEFAULT 0,
  last_breach_report_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_signature', 'active', 'expiring_soon', 'expired', 'terminated'
  )),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_baa_org ON business_associate_agreements(organization_id);
CREATE INDEX idx_baa_business_associate ON business_associate_agreements(business_associate_id);
CREATE INDEX idx_baa_status ON business_associate_agreements(status);
CREATE INDEX idx_baa_expiration ON business_associate_agreements(expiration_date) WHERE status = 'active';
CREATE INDEX idx_baa_next_review ON business_associate_agreements(next_review_due_date) WHERE status = 'active';

-- RLS Policies
ALTER TABLE business_associate_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY baa_org_isolation ON business_associate_agreements
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- BAA Audits Table (Track compliance reviews)
-- ============================================================================

CREATE TABLE baa_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baa_id UUID NOT NULL REFERENCES business_associate_agreements(id) ON DELETE CASCADE,

  -- Audit Details
  audit_date DATE NOT NULL,
  auditor_id UUID REFERENCES users(id),
  audit_type VARCHAR(50) CHECK (audit_type IN ('annual_review', 'incident_triggered', 'renewal', 'spot_check')),

  -- Compliance Findings
  compliant BOOLEAN,
  findings TEXT,
  deficiencies JSONB DEFAULT '[]'::jsonb, -- Array of {deficiency, severity, correctionRequired}

  -- Corrective Actions
  corrective_actions_required BOOLEAN DEFAULT false,
  corrective_actions JSONB DEFAULT '[]'::jsonb,
  corrective_actions_completed BOOLEAN DEFAULT false,

  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_baa_audits_baa ON baa_audits(baa_id, audit_date DESC);
CREATE INDEX idx_baa_audits_auditor ON baa_audits(auditor_id);
CREATE INDEX idx_baa_audits_compliant ON baa_audits(compliant);

-- RLS Policies
ALTER TABLE baa_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY baa_audits_via_baa ON baa_audits
  USING (
    baa_id IN (
      SELECT id FROM business_associate_agreements
      WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate BAA number
CREATE OR REPLACE FUNCTION generate_baa_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_baa_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next BAA number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(baa_number FROM 'BAA-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM business_associate_agreements
  WHERE baa_number LIKE 'BAA-' || year_str || '-%';

  new_baa_number := 'BAA-' || year_str || '-' || LPAD(next_number::TEXT, 3, '0');
  NEW.baa_number := new_baa_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_baa_number
  BEFORE INSERT ON business_associate_agreements
  FOR EACH ROW
  WHEN (NEW.baa_number IS NULL)
  EXECUTE FUNCTION generate_baa_number();

-- Auto-update BAA status based on expiration date
CREATE OR REPLACE FUNCTION update_baa_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL THEN
    IF NEW.expiration_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN
      NEW.status := 'expiring_soon';
    ELSIF NEW.signed_by_ba = true AND NEW.signed_by_covered_entity = true THEN
      NEW.status := 'active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_baa_status
  BEFORE INSERT OR UPDATE ON business_associate_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_baa_status();

-- Verify all HIPAA requirements are met
CREATE OR REPLACE FUNCTION verify_baa_requirements()
RETURNS TRIGGER AS $$
BEGIN
  NEW.all_requirements_met := (
    NEW.establishes_permitted_uses = true AND
    NEW.requires_safeguards = true AND
    NEW.requires_reporting_breaches = true AND
    NEW.requires_reporting_security_incidents = true AND
    NEW.restricts_use_disclosure = true AND
    NEW.requires_subcontractor_agreements = true AND
    NEW.allows_termination_for_breach = true AND
    NEW.requires_return_destruction_phi = true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verify_baa_requirements
  BEFORE INSERT OR UPDATE ON business_associate_agreements
  FOR EACH ROW
  EXECUTE FUNCTION verify_baa_requirements();

-- Update timestamps
CREATE TRIGGER update_business_associates_timestamp
  BEFORE UPDATE ON business_associates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baa_timestamp
  BEFORE UPDATE ON business_associate_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Expiring BAAs (within 90 days)
CREATE VIEW expiring_baas AS
SELECT
  baa.id,
  baa.baa_number,
  baa.organization_id,
  ba.ba_name,
  ba.ba_type,
  ba.critical_service,
  baa.expiration_date,
  baa.expiration_date - CURRENT_DATE AS days_until_expiration,
  baa.auto_renewal,
  baa.status
FROM business_associate_agreements baa
JOIN business_associates ba ON baa.business_associate_id = ba.id
WHERE baa.expiration_date IS NOT NULL
  AND baa.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
  AND baa.status IN ('active', 'expiring_soon')
ORDER BY baa.expiration_date;

-- Expired BAAs
CREATE VIEW expired_baas AS
SELECT
  baa.id,
  baa.baa_number,
  baa.organization_id,
  ba.ba_name,
  ba.ba_type,
  ba.critical_service,
  baa.expiration_date,
  CURRENT_DATE - baa.expiration_date AS days_expired
FROM business_associate_agreements baa
JOIN business_associates ba ON baa.business_associate_id = ba.id
WHERE baa.expiration_date IS NOT NULL
  AND baa.expiration_date < CURRENT_DATE
  AND baa.status = 'expired'
ORDER BY baa.expiration_date;

-- BAA Compliance Summary
CREATE VIEW baa_compliance_summary AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  COUNT(ba.id) AS total_business_associates,
  COUNT(ba.id) FILTER (WHERE ba.status = 'active') AS active_business_associates,
  COUNT(baa.id) AS total_baas,
  COUNT(baa.id) FILTER (WHERE baa.status = 'active') AS active_baas,
  COUNT(baa.id) FILTER (WHERE baa.status = 'expired') AS expired_baas,
  COUNT(baa.id) FILTER (WHERE baa.status = 'expiring_soon') AS expiring_soon_baas,
  COUNT(baa.id) FILTER (WHERE baa.all_requirements_met = false) AS non_compliant_baas,
  COUNT(baa.id) FILTER (WHERE baa.next_review_due_date < CURRENT_DATE) AS overdue_reviews
FROM organizations o
LEFT JOIN business_associates ba ON o.id = ba.organization_id
LEFT JOIN business_associate_agreements baa ON ba.id = baa.business_associate_id
GROUP BY o.id, o.name;

-- Critical Services without Active BAA
CREATE VIEW critical_services_without_baa AS
SELECT
  ba.id,
  ba.organization_id,
  ba.ba_name,
  ba.ba_type,
  ba.services_description,
  ba.phi_access_level,
  ba.status AS ba_status,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM business_associate_agreements baa
      WHERE baa.business_associate_id = ba.id AND baa.status = 'active'
    ) THEN 'no_active_baa'
    ELSE 'baa_exists'
  END AS baa_status
FROM business_associates ba
WHERE ba.critical_service = true
  AND ba.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM business_associate_agreements baa
    WHERE baa.business_associate_id = ba.id AND baa.status = 'active'
  );

-- ============================================================================
-- Seed Data: Common Business Associates
-- ============================================================================

-- Note: Serenity-specific business associates should be added via application/admin panel
-- This seed data provides examples only

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE business_associates IS 'HIPAA Business Associates with PHI access';
COMMENT ON TABLE business_associate_agreements IS 'Business Associate Agreements per HIPAA Privacy Rule';
COMMENT ON TABLE baa_audits IS 'BAA compliance audits and reviews';
COMMENT ON VIEW expiring_baas IS 'BAAs expiring within 90 days';
COMMENT ON VIEW expired_baas IS 'Expired BAAs requiring renewal';
COMMENT ON VIEW baa_compliance_summary IS 'Organization-level BAA compliance status';
COMMENT ON VIEW critical_services_without_baa IS 'Critical services lacking active BAA (HIPAA violation)';
