-- Migration: 051_organization_licenses.sql
-- Purpose: License enforcement system to ensure compliance with Ohio regulatory requirements
-- Prevents scheduling/billing services without proper licenses and prompts for expansion opportunities

-- =====================================================
-- ORGANIZATION LICENSES TABLE
-- Tracks all licenses held by each organization
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- License identification
  license_type VARCHAR(50) NOT NULL,
  -- Valid types: 'non_medical_home_health', 'skilled_home_health', 'oda_passport',
  --              'oda_choices', 'oda_cdpc', 'oda_adult_day', 'oda_assisted_living',
  --              'dodd_hpc', 'dodd_respite', 'nmt_transportation'

  license_number VARCHAR(100),
  issuing_authority VARCHAR(100) NOT NULL, -- 'ODH', 'ODA', 'DODD'

  -- License dates
  issued_date DATE,
  expiration_date DATE,
  renewal_reminder_days INTEGER DEFAULT 90, -- Days before expiration to alert

  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'revoked', 'suspended')),

  -- Documentation
  document_url TEXT, -- S3/storage path to uploaded license document
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Ensure unique license per type per organization
  UNIQUE(organization_id, license_type)
);

-- Index for quick lookups
CREATE INDEX idx_org_licenses_org_id ON organization_licenses(organization_id);
CREATE INDEX idx_org_licenses_status ON organization_licenses(status);
CREATE INDEX idx_org_licenses_expiration ON organization_licenses(expiration_date);

-- =====================================================
-- SERVICE LICENSE REQUIREMENTS TABLE
-- Maps each service type to required license(s)
-- =====================================================
CREATE TABLE IF NOT EXISTS service_license_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service identification
  service_code VARCHAR(20) NOT NULL UNIQUE,
  service_name VARCHAR(100) NOT NULL,
  service_category VARCHAR(50), -- 'personal_care', 'skilled_nursing', 'dd_waiver', 'transportation', etc.

  -- License requirements
  required_license_type VARCHAR(50) NOT NULL,
  alternative_licenses VARCHAR(50)[], -- Some services can be provided under multiple license types

  -- Billing configuration
  billing_requires_certification BOOLEAN DEFAULT TRUE,
  unit_type VARCHAR(20) DEFAULT '15min', -- '15min', 'hourly', 'daily', 'per_trip', 'per_meal'

  -- Rate information (from Ohio handbook)
  medicaid_rate_2024 DECIMAL(10,2), -- Per unit rate
  rate_effective_date DATE,

  -- Documentation
  description TEXT,
  regulatory_reference TEXT, -- OAC rule reference
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LICENSE OPPORTUNITY TRACKING
-- Tracks when users are shown opportunity prompts
-- =====================================================
CREATE TABLE IF NOT EXISTS license_opportunity_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- What triggered the prompt
  trigger_action VARCHAR(100) NOT NULL, -- 'view_dashboard', 'create_client', 'search_medicaid', etc.
  license_type_suggested VARCHAR(50) NOT NULL,

  -- User response
  user_response VARCHAR(20), -- 'interested', 'not_now', 'dismissed', 'started_application'
  responded_at TIMESTAMPTZ,

  -- Revenue opportunity shown
  estimated_annual_revenue DECIMAL(12,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunity_prompts_org ON license_opportunity_prompts(organization_id);
CREATE INDEX idx_opportunity_prompts_response ON license_opportunity_prompts(user_response);

-- =====================================================
-- LICENSE APPLICATION TRACKING
-- Track progress of license applications
-- =====================================================
CREATE TABLE IF NOT EXISTS license_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Application details
  license_type VARCHAR(50) NOT NULL,
  application_portal VARCHAR(100), -- 'ODH CertLicensure', 'ODA PNM/PCW', 'DODD PNM'

  -- Progress tracking
  status VARCHAR(30) DEFAULT 'not_started',
  -- 'not_started', 'documents_gathering', 'background_check', 'submitted',
  -- 'under_review', 'site_visit_scheduled', 'approved', 'denied'

  -- Key dates
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  expected_completion_date DATE,
  completed_at TIMESTAMPTZ,

  -- Checklist items (JSONB for flexibility)
  checklist JSONB DEFAULT '[]',
  -- Example: [{"item": "BCI background check", "completed": true, "date": "2025-01-15"},
  --           {"item": "W-9 submitted", "completed": false}]

  -- Costs
  application_fee DECIMAL(10,2),
  fee_paid BOOLEAN DEFAULT FALSE,

  -- Documents
  documents JSONB DEFAULT '[]',
  -- Example: [{"name": "Articles of Organization", "url": "...", "uploaded_at": "..."}]

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_license_apps_org ON license_applications(organization_id);
CREATE INDEX idx_license_apps_status ON license_applications(status);

-- =====================================================
-- SEED DATA: Service License Requirements
-- Based on Ohio Non-Medical Licensing Handbook
-- =====================================================

INSERT INTO service_license_requirements (service_code, service_name, service_category, required_license_type, alternative_licenses, unit_type, medicaid_rate_2024, description, regulatory_reference) VALUES

-- Non-Medical Home Health Services (ODH License)
('T1019', 'Personal Care', 'personal_care', 'non_medical_home_health', NULL, '15min', 7.24,
 'Hands-on assistance with ADLs: bathing, dressing, toileting, transferring, feeding, medication reminders',
 'ORC Chapter 3740'),

('S5130', 'Homemaker Services', 'personal_care', 'non_medical_home_health', NULL, '15min', 7.24,
 'Housekeeping, laundry, meal preparation, cleaning',
 'ORC Chapter 3740'),

('S5150', 'Respite Care (In-Home)', 'personal_care', 'non_medical_home_health', NULL, '15min', 7.24,
 'Short-term relief for family caregivers',
 'ORC Chapter 3740'),

('ERRANDS', 'Errands and Escort', 'personal_care', 'non_medical_home_health', NULL, 'hourly', NULL,
 'Grocery shopping, prescription pickup, accompaniment to appointments (non-billable to Medicaid)',
 'ORC Chapter 3740'),

-- ODA PASSPORT Waiver Services (requires ODA certification)
('PASSPORT_PC', 'PASSPORT Personal Care', 'medicaid_waiver', 'oda_passport', NULL, '15min', 7.24,
 'Personal care services through PASSPORT Medicaid waiver program',
 'OAC 173-39'),

('PASSPORT_PC_2', 'PASSPORT Personal Care (2nd client)', 'medicaid_waiver', 'oda_passport', NULL, '15min', 5.43,
 'Personal care when serving second client at same address (group rate)',
 'OAC 173-39'),

-- ODA Consumer-Directed Personal Care
('CDPC', 'Consumer-Directed Personal Care', 'medicaid_waiver', 'oda_cdpc', NULL, '15min', 3.44,
 'Consumer hires and supervises their own caregiver under PASSPORT',
 'OAC 5160-44-32'),

('CDPC_2', 'Consumer-Directed PC (2nd client)', 'medicaid_waiver', 'oda_cdpc', NULL, '15min', 2.58,
 'Consumer-directed care for second client at same address',
 'OAC 5160-44-32'),

-- ODA Choices Home Care Attendant
('CHCA_PC', 'Choices Home Care Attendant - Personal Care', 'medicaid_waiver', 'oda_choices', NULL, '15min', 4.70,
 'Personal assistance under Choices program (participant-directed)',
 'OAC 5160-44'),

('CHCA_OT', 'Choices Home Care Attendant - Overtime', 'medicaid_waiver', 'oda_choices', NULL, '15min', 7.05,
 'Overtime rate for Choices HCA services',
 'OAC 5160-44'),

-- Home Delivered Meals
('HDM', 'Home Delivered Meal', 'nutrition', 'oda_passport', NULL, 'per_meal', 8.80,
 'Preparation and delivery of nutritious meals to homebound clients',
 'OAC 173-39'),

('HDM_SPECIAL', 'Home Delivered Meal (Kosher/Therapeutic)', 'nutrition', 'oda_passport', NULL, 'per_meal', 10.61,
 'Specialized meals including kosher or therapeutic diets',
 'OAC 173-39'),

-- Adult Day Services
('ADS_ENHANCED', 'Adult Day Services - Enhanced', 'adult_day', 'oda_adult_day', NULL, 'daily', 80.94,
 'Structured program providing socialization, supervision, personal care, meals (4-8 hours)',
 'OAC 173-39'),

('ADS_INTENSIVE', 'Adult Day Services - Intensive', 'adult_day', 'oda_adult_day', NULL, 'daily', 106.26,
 'Higher acuity adult day services with additional clinical support',
 'OAC 173-39'),

-- Assisted Living
('AL_BASE', 'Assisted Living - Base', 'assisted_living', 'oda_assisted_living', NULL, 'daily', 130.00,
 'Residential facility providing personal care, meals, housekeeping, social activities',
 'OAC 173-39'),

('AL_MEMORY', 'Assisted Living - Memory Care', 'assisted_living', 'oda_assisted_living', NULL, 'daily', 155.00,
 'Memory care assisted living with specialized dementia support',
 'OAC 173-39'),

-- Non-Medical Transportation
('NMT_ONE', 'Non-Medical Transportation (One-Way)', 'transportation', 'nmt_transportation', NULL, 'per_trip', 653.11,
 'Transportation to day services, employment, or medical appointments',
 'OAC 5160-44'),

('NMT_ROUND', 'Non-Medical Transportation (Round Trip)', 'transportation', 'nmt_transportation', NULL, 'per_trip', 1306.24,
 'Round-trip non-medical transportation',
 'OAC 5160-44'),

-- DODD Homemaker/Personal Care (DD Waivers)
('HPC_1_1', 'HPC - 1:1 Support', 'dd_waiver', 'dodd_hpc', NULL, '15min', 9.95,
 'Homemaker/Personal Care for individuals with developmental disabilities (1:1 ratio)',
 'OAC 5123-9'),

('HPC_1_2', 'HPC - 1:2 Support', 'dd_waiver', 'dodd_hpc', NULL, '15min', 7.15,
 'HPC services with 1:2 staff to participant ratio',
 'OAC 5123-9'),

('HPC_OSOC', 'HPC - On-Site/On-Call', 'dd_waiver', 'dodd_hpc', NULL, '15min', 5.56,
 'On-site on-call support for DD waiver participants',
 'OAC 5123-9'),

-- Skilled Services (require Skilled Home Health License)
('T1001', 'Nursing Assessment (RN)', 'skilled_nursing', 'skilled_home_health', NULL, 'visit', 68.44,
 'Professional nursing assessment by registered nurse',
 'ORC Chapter 3740'),

('T1002', 'Nursing Visit (LPN)', 'skilled_nursing', 'skilled_home_health', NULL, 'visit', 56.26,
 'Nursing services provided by licensed practical nurse',
 'ORC Chapter 3740'),

('S5125', 'Skilled Nursing Care', 'skilled_nursing', 'skilled_home_health', NULL, 'visit', NULL,
 'Advanced clinical nursing services including wound care, medication administration',
 'ORC Chapter 3740')

ON CONFLICT (service_code) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE organization_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_opportunity_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_applications ENABLE ROW LEVEL SECURITY;

-- Policies for organization_licenses
CREATE POLICY org_licenses_select ON organization_licenses
  FOR SELECT USING (
    organization_id IN (
      SELECT p.organization_id FROM user_pod_memberships pm
      JOIN pods p ON pm.pod_id = p.id
      WHERE pm.user_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY org_licenses_insert ON organization_licenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM user_pod_memberships pm
      JOIN pods p ON pm.pod_id = p.id
      WHERE pm.user_id = current_setting('app.current_user_id')::uuid
      AND pm.role_in_pod IN ('admin', 'owner', 'executive')
    )
  );

CREATE POLICY org_licenses_update ON organization_licenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT p.organization_id FROM user_pod_memberships pm
      JOIN pods p ON pm.pod_id = p.id
      WHERE pm.user_id = current_setting('app.current_user_id')::uuid
      AND pm.role_in_pod IN ('admin', 'owner', 'executive')
    )
  );

-- Policies for opportunity prompts
CREATE POLICY opportunity_prompts_select ON license_opportunity_prompts
  FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY opportunity_prompts_insert ON license_opportunity_prompts
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Policies for license applications
CREATE POLICY license_apps_select ON license_applications
  FOR SELECT USING (
    organization_id IN (
      SELECT p.organization_id FROM user_pod_memberships pm
      JOIN pods p ON pm.pod_id = p.id
      WHERE pm.user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if organization has required license for a service
CREATE OR REPLACE FUNCTION check_service_license(
  p_organization_id UUID,
  p_service_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_required_license VARCHAR;
  v_alt_licenses VARCHAR[];
  v_has_license BOOLEAN := FALSE;
BEGIN
  -- Get required license for the service
  SELECT required_license_type, alternative_licenses
  INTO v_required_license, v_alt_licenses
  FROM service_license_requirements
  WHERE service_code = p_service_code;

  IF v_required_license IS NULL THEN
    -- Service not found, allow (may be custom service)
    RETURN TRUE;
  END IF;

  -- Check if organization has the required license
  SELECT EXISTS(
    SELECT 1 FROM organization_licenses
    WHERE organization_id = p_organization_id
    AND license_type = v_required_license
    AND status = 'active'
    AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
  ) INTO v_has_license;

  IF v_has_license THEN
    RETURN TRUE;
  END IF;

  -- Check alternative licenses
  IF v_alt_licenses IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM organization_licenses
      WHERE organization_id = p_organization_id
      AND license_type = ANY(v_alt_licenses)
      AND status = 'active'
      AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
    ) INTO v_has_license;
  END IF;

  RETURN v_has_license;
END;
$$ LANGUAGE plpgsql;

-- Function to get missing licenses with revenue opportunities
CREATE OR REPLACE FUNCTION get_license_opportunities(p_organization_id UUID)
RETURNS TABLE (
  license_type VARCHAR,
  issuing_authority VARCHAR,
  services_unlocked TEXT[],
  estimated_annual_revenue DECIMAL,
  application_fee DECIMAL,
  application_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_licenses AS (
    SELECT ol.license_type
    FROM organization_licenses ol
    WHERE ol.organization_id = p_organization_id
    AND ol.status = 'active'
  ),
  missing_licenses AS (
    SELECT DISTINCT slr.required_license_type
    FROM service_license_requirements slr
    WHERE slr.required_license_type NOT IN (SELECT license_type FROM current_licenses)
  )
  SELECT
    ml.required_license_type::VARCHAR as license_type,
    CASE
      WHEN ml.required_license_type LIKE 'oda_%' THEN 'ODA'
      WHEN ml.required_license_type LIKE 'dodd_%' THEN 'DODD'
      WHEN ml.required_license_type LIKE 'skilled_%' THEN 'ODH'
      ELSE 'ODH'
    END::VARCHAR as issuing_authority,
    ARRAY_AGG(slr2.service_name)::TEXT[] as services_unlocked,
    -- Estimate: 50 clients * 20 hrs/week * 50 weeks * rate
    (50 * 20 * 50 * COALESCE(MAX(slr2.medicaid_rate_2024), 7.24) * 4)::DECIMAL as estimated_annual_revenue,
    CASE
      WHEN ml.required_license_type LIKE 'oda_%' THEN 730.00
      WHEN ml.required_license_type = 'non_medical_home_health' THEN 250.00
      WHEN ml.required_license_type = 'skilled_home_health' THEN 250.00
      ELSE 100.00
    END::DECIMAL as application_fee,
    CASE
      WHEN ml.required_license_type LIKE 'oda_%' THEN 'https://ohpnm.omes.maximus.com'
      WHEN ml.required_license_type LIKE 'dodd_%' THEN 'https://dodd.ohio.gov/providers/initial-renewal-certification'
      ELSE 'https://odhgateway.odh.ohio.gov'
    END::TEXT as application_url
  FROM missing_licenses ml
  JOIN service_license_requirements slr2 ON slr2.required_license_type = ml.required_license_type
  GROUP BY ml.required_license_type;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE organization_licenses IS 'Tracks licenses held by each organization for regulatory compliance';
COMMENT ON TABLE service_license_requirements IS 'Maps service codes to required licenses based on Ohio regulations';
COMMENT ON TABLE license_opportunity_prompts IS 'Tracks when users see expansion opportunity prompts';
COMMENT ON TABLE license_applications IS 'Tracks progress of license/certification applications';
COMMENT ON FUNCTION check_service_license IS 'Returns TRUE if organization can provide the specified service';
COMMENT ON FUNCTION get_license_opportunities IS 'Returns unlicensed services with revenue estimates';
