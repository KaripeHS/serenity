-- Migration: Client Assessment System
-- Purpose: Standardized ADL/IADL assessments and physician order tracking per OAC 173-39-02.11
-- Compliance: Ohio Administrative Code 173-39 (Home Care Services)
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
-- Client Assessments Table
-- ============================================================================

CREATE TABLE client_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Assessment Details
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN (
    'initial', 'annual', 'change_in_condition', 'reassessment', 'discharge'
  )),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_period_start DATE,
  assessment_period_end DATE,

  -- Assessor Information
  assessor_id UUID NOT NULL REFERENCES users(id),
  assessor_role VARCHAR(50), -- rn, social_worker, case_manager
  assessment_location VARCHAR(100), -- client_home, office, hospital, facility

  -- ADL Assessment (Activities of Daily Living)
  adl_bathing VARCHAR(50) CHECK (adl_bathing IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  adl_dressing VARCHAR(50) CHECK (adl_dressing IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  adl_toileting VARCHAR(50) CHECK (adl_toileting IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  adl_transferring VARCHAR(50) CHECK (adl_transferring IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  adl_continence VARCHAR(50) CHECK (adl_continence IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  adl_feeding VARCHAR(50) CHECK (adl_feeding IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),

  -- IADL Assessment (Instrumental Activities of Daily Living)
  iadl_meal_preparation VARCHAR(50) CHECK (iadl_meal_preparation IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  iadl_housekeeping VARCHAR(50) CHECK (iadl_housekeeping IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  iadl_laundry VARCHAR(50) CHECK (iadl_laundry IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  iadl_shopping VARCHAR(50) CHECK (iadl_shopping IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  iadl_transportation VARCHAR(50) CHECK (iadl_transportation IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  iadl_medication_management VARCHAR(50) CHECK (iadl_medication_management IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),
  iadl_finances VARCHAR(50) CHECK (iadl_finances IN ('independent', 'supervision', 'limited_assistance', 'extensive_assistance', 'total_dependence')),

  -- Mobility & Safety
  mobility_status VARCHAR(50) CHECK (mobility_status IN ('fully_ambulatory', 'uses_cane', 'uses_walker', 'uses_wheelchair', 'bedbound')),
  fall_risk VARCHAR(50) CHECK (fall_risk IN ('low', 'moderate', 'high')),
  fall_risk_factors JSONB DEFAULT '[]'::jsonb, -- Array of risk factors
  assistive_devices JSONB DEFAULT '[]'::jsonb, -- cane, walker, wheelchair, grab_bars, etc.

  -- Cognitive Status
  cognitive_status VARCHAR(50) CHECK (cognitive_status IN ('alert_oriented', 'mild_impairment', 'moderate_impairment', 'severe_impairment')),
  dementia_diagnosis BOOLEAN DEFAULT false,
  wandering_risk BOOLEAN DEFAULT false,
  memory_deficit BOOLEAN DEFAULT false,
  decision_making_capacity VARCHAR(50) CHECK (decision_making_capacity IN ('full_capacity', 'limited_capacity', 'no_capacity')),

  -- Medical Conditions
  diagnoses JSONB DEFAULT '[]'::jsonb, -- Array of {icd10Code, description, primaryDiagnosis}
  medications JSONB DEFAULT '[]'::jsonb, -- Array of {name, dosage, frequency, route}
  allergies TEXT,

  -- Nutritional Status
  nutritional_status VARCHAR(50) CHECK (nutritional_status IN ('well_nourished', 'at_risk', 'malnourished')),
  special_diet VARCHAR(100), -- diabetic, low_sodium, renal, etc.
  swallowing_difficulty BOOLEAN DEFAULT false,
  aspiration_risk BOOLEAN DEFAULT false,

  -- Skin Integrity
  skin_integrity VARCHAR(50) CHECK (skin_integrity IN ('intact', 'at_risk', 'impaired')),
  pressure_ulcers JSONB DEFAULT '[]'::jsonb, -- Array of {location, stage, size, treatment}
  wounds JSONB DEFAULT '[]'::jsonb,

  -- Pain Assessment
  pain_present BOOLEAN DEFAULT false,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  pain_location TEXT,
  pain_frequency VARCHAR(50), -- constant, intermittent, occasional

  -- Psychosocial
  living_situation VARCHAR(100), -- alone, with_family, assisted_living, etc.
  support_system VARCHAR(50) CHECK (support_system IN ('strong', 'adequate', 'limited', 'none')),
  caregiver_burden VARCHAR(50) CHECK (caregiver_burden IN ('none', 'mild', 'moderate', 'severe')),
  safety_concerns TEXT,
  environmental_hazards JSONB DEFAULT '[]'::jsonb,

  -- Service Needs
  services_required JSONB DEFAULT '[]'::jsonb, -- Array of service types needed
  frequency_recommended VARCHAR(100), -- e.g., "2 hours daily", "3x weekly"
  estimated_hours_per_week DECIMAL(5,2),

  -- Goals & Care Plan
  client_goals JSONB DEFAULT '[]'::jsonb, -- Array of {goal, targetDate, status}
  care_plan_notes TEXT,

  -- Follow-up
  next_assessment_due_date DATE,
  reassessment_trigger VARCHAR(100), -- change_in_condition, quarterly, annual, etc.

  -- Approval & Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'archived')),
  approved_by UUID REFERENCES users(id),
  approved_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_client_assessments_client ON client_assessments(client_id, assessment_date DESC);
CREATE INDEX idx_client_assessments_org ON client_assessments(organization_id);
CREATE INDEX idx_client_assessments_assessor ON client_assessments(assessor_id);
CREATE INDEX idx_client_assessments_type ON client_assessments(assessment_type);
CREATE INDEX idx_client_assessments_next_due ON client_assessments(next_assessment_due_date) WHERE status = 'approved';
CREATE INDEX idx_client_assessments_status ON client_assessments(status);

-- RLS Policies
ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_assessments_org_isolation ON client_assessments
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Physician Orders Table
-- ============================================================================

CREATE TABLE physician_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Order Details
  order_number VARCHAR(50) UNIQUE,
  order_type VARCHAR(50) NOT NULL CHECK (order_type IN (
    'initial_services', 'skilled_nursing', 'therapy', 'medication',
    'dme', 'wound_care', 'other'
  )),
  order_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,

  -- Physician Information
  physician_name VARCHAR(200) NOT NULL,
  physician_npi VARCHAR(20),
  physician_phone VARCHAR(20),
  physician_fax VARCHAR(20),
  physician_address TEXT,
  physician_specialty VARCHAR(100),

  -- Order Details
  services_ordered JSONB DEFAULT '[]'::jsonb, -- Array of {service, frequency, duration}
  diagnosis_codes JSONB DEFAULT '[]'::jsonb, -- Array of ICD-10 codes
  medications_ordered JSONB DEFAULT '[]'::jsonb,
  special_instructions TEXT,
  precautions TEXT,

  -- Documentation
  order_document_url VARCHAR(500), -- S3 URL or file path
  signed_by_physician BOOLEAN DEFAULT false,
  physician_signature_date DATE,

  -- Verbal Orders
  verbal_order BOOLEAN DEFAULT false,
  verbal_order_received_by UUID REFERENCES users(id),
  verbal_order_date TIMESTAMPTZ,
  verbal_order_signed_within_72_hours BOOLEAN DEFAULT false,

  -- Recertification Tracking
  recertification_required BOOLEAN DEFAULT false,
  recertification_frequency VARCHAR(50), -- every_60_days, annually, etc.
  next_recertification_due DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'superseded')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_physician_orders_client ON physician_orders(client_id, order_date DESC);
CREATE INDEX idx_physician_orders_org ON physician_orders(organization_id);
CREATE INDEX idx_physician_orders_status ON physician_orders(status);
CREATE INDEX idx_physician_orders_expiration ON physician_orders(expiration_date) WHERE status = 'active';
CREATE INDEX idx_physician_orders_recert ON physician_orders(next_recertification_due) WHERE recertification_required = true AND status = 'active';

-- RLS Policies
ALTER TABLE physician_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY physician_orders_org_isolation ON physician_orders
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Care Plans Table
-- ============================================================================

DROP TABLE IF EXISTS care_plans CASCADE;

CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES client_assessments(id) ON DELETE SET NULL,
  physician_order_id UUID REFERENCES physician_orders(id) ON DELETE SET NULL,

  -- Plan Details
  plan_name VARCHAR(200) DEFAULT 'Individualized Care Plan',
  plan_type VARCHAR(50) CHECK (plan_type IN ('standard', 'dementia', 'chronic_disease', 'post_hospitalization')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date DATE NOT NULL,
  expiration_date DATE,

  -- Care Goals
  goals JSONB DEFAULT '[]'::jsonb, -- Array of {goal, targetDate, measurableObjective, interventions, status}

  -- Interventions
  interventions JSONB DEFAULT '[]'::jsonb, -- Array of {intervention, frequency, responsibleParty}

  -- Service Schedule
  service_schedule JSONB DEFAULT '[]'::jsonb, -- Array of {service, frequency, duration, caregiverQualifications}

  -- Safety Protocols
  safety_protocols JSONB DEFAULT '[]'::jsonb, -- Fall prevention, aspiration precautions, etc.
  emergency_procedures TEXT,

  -- Client Preferences
  client_preferences TEXT,
  cultural_considerations TEXT,
  language_preference VARCHAR(50),

  -- Caregiver Instructions
  caregiver_instructions TEXT,
  training_required JSONB DEFAULT '[]'::jsonb,

  -- Review & Modification
  last_modified_date DATE,
  modification_reason TEXT,

  -- Approval & Status
  developed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_date DATE,
  client_signature_obtained BOOLEAN DEFAULT false,
  client_signature_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'under_review', 'archived')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_care_plans_client ON care_plans(client_id);
CREATE INDEX idx_care_plans_org ON care_plans(organization_id);
CREATE INDEX idx_care_plans_assessment ON care_plans(assessment_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_review_date ON care_plans(review_date) WHERE status = 'active';

-- RLS Policies
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_plans_org_isolation ON care_plans
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate physician order number
CREATE OR REPLACE FUNCTION generate_physician_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_order_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next order number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 'PO-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM physician_orders
  WHERE order_number LIKE 'PO-' || year_str || '-%';

  new_order_number := 'PO-' || year_str || '-' || LPAD(next_number::TEXT, 4, '0');
  NEW.order_number := new_order_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_physician_order_number
  BEFORE INSERT ON physician_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_physician_order_number();

-- Auto-expire physician orders
CREATE OR REPLACE FUNCTION auto_expire_physician_orders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_physician_orders
  BEFORE UPDATE ON physician_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_physician_orders();

-- Update timestamps
CREATE TRIGGER update_client_assessments_timestamp
  BEFORE UPDATE ON client_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_physician_orders_timestamp
  BEFORE UPDATE ON physician_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plans_timestamp
  BEFORE UPDATE ON care_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Overdue Assessments
CREATE VIEW overdue_client_assessments AS
SELECT
  ca.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  ca.assessment_type,
  ca.next_assessment_due_date,
  CURRENT_DATE - ca.next_assessment_due_date AS days_overdue,
  ca.organization_id
FROM client_assessments ca
JOIN clients c ON ca.client_id = c.id
WHERE ca.status = 'approved'
  AND ca.next_assessment_due_date IS NOT NULL
  AND ca.next_assessment_due_date < CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM client_assessments ca2
    WHERE ca2.client_id = ca.client_id
      AND ca2.assessment_date > ca.assessment_date
      AND ca2.status = 'approved'
  );

-- Expiring Physician Orders
CREATE VIEW expiring_physician_orders AS
SELECT
  po.id,
  po.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  po.order_number,
  po.order_type,
  po.expiration_date,
  po.expiration_date - CURRENT_DATE AS days_until_expiration,
  po.organization_id
FROM physician_orders po
JOIN clients c ON po.client_id = c.id
WHERE po.status = 'active'
  AND po.expiration_date IS NOT NULL
  AND po.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- Care Plan Review Status
CREATE VIEW care_plan_review_status AS
SELECT
  cp.id,
  cp.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  cp.effective_date,
  cp.review_date,
  CASE
    WHEN cp.review_date < CURRENT_DATE THEN 'overdue'
    WHEN cp.review_date < CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'current'
  END AS review_status,
  CURRENT_DATE - cp.review_date AS days_overdue,
  cp.organization_id
FROM care_plans cp
JOIN clients c ON cp.client_id = c.id
WHERE cp.status = 'active';

-- Client Assessment Compliance Summary
CREATE VIEW client_assessment_compliance AS
SELECT
  c.id AS client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM client_assessments ca
      WHERE ca.client_id = c.id AND ca.status = 'approved'
        AND ca.assessment_date >= CURRENT_DATE - INTERVAL '12 months'
    ) THEN true
    ELSE false
  END AS annual_assessment_current,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM physician_orders po
      WHERE po.client_id = c.id AND po.status = 'active'
    ) THEN true
    ELSE false
  END AS has_active_physician_order,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM care_plans cp
      WHERE cp.client_id = c.id AND cp.status = 'active'
    ) THEN true
    ELSE false
  END AS has_active_care_plan,
  c.organization_id
FROM clients c
WHERE c.status = 'active';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE client_assessments IS 'Standardized ADL/IADL assessments per OAC 173-39-02.11';
COMMENT ON TABLE physician_orders IS 'Physician orders for home care services with auto-expiration tracking';
COMMENT ON TABLE care_plans IS 'Individualized care plans linked to assessments and physician orders';
COMMENT ON VIEW overdue_client_assessments IS 'Alert view for overdue client assessments';
COMMENT ON VIEW expiring_physician_orders IS 'Alert view for physician orders expiring within 30 days';
COMMENT ON VIEW care_plan_review_status IS 'Care plan review compliance tracking';
COMMENT ON VIEW client_assessment_compliance IS 'Client-level assessment compliance summary';
