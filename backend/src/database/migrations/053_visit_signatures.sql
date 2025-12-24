-- Migration: 053_visit_signatures.sql
-- Visit Signatures Table for EVV Compliance
-- Stores client/representative signatures for visit verification

-- ============================================
-- VISIT SIGNATURES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS visit_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL UNIQUE REFERENCES shifts(id), -- One signature per visit/shift
  caregiver_id UUID NOT NULL,
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  signed_by VARCHAR(20) NOT NULL CHECK (signed_by IN ('client', 'representative', 'caregiver')),
  signer_name VARCHAR(200) NOT NULL,
  signer_relationship VARCHAR(100), -- If representative, what relationship
  signed_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by visit
CREATE INDEX IF NOT EXISTS idx_visit_signatures_shift_id ON visit_signatures(shift_id);

-- Index for caregiver audit trail
CREATE INDEX IF NOT EXISTS idx_visit_signatures_caregiver_id ON visit_signatures(caregiver_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_visit_signatures_signed_at ON visit_signatures(signed_at);

-- ============================================
-- ADD SIGNATURE TRACKING TO SHIFTS
-- ============================================

-- Add signature_captured column to shifts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'signature_captured'
  ) THEN
    ALTER TABLE shifts ADD COLUMN signature_captured BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- ADD SIGNATURE TRACKING TO EVV RECORDS
-- ============================================

-- Add signature_captured column to evv_records if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evv_records' AND column_name = 'signature_captured'
  ) THEN
    ALTER TABLE evv_records ADD COLUMN signature_captured BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- ADD CARE_TASKS COLUMN TO SHIFTS
-- ============================================

-- Add care_tasks column to shifts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'care_tasks'
  ) THEN
    ALTER TABLE shifts ADD COLUMN care_tasks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================
-- CARE PLANS TABLE ENHANCEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add enhanced care plan columns if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_plans' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE care_plans ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_plans' AND column_name = 'emergency_procedures'
  ) THEN
    ALTER TABLE care_plans ADD COLUMN emergency_procedures TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_plans' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE care_plans ADD COLUMN created_by UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_plans' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE care_plans ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- ============================================
-- CREDENTIALS TABLE ENHANCEMENT
-- ============================================

-- Add credential renewal tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credentials' AND column_name = 'renewed_at'
  ) THEN
    ALTER TABLE credentials ADD COLUMN renewed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credentials' AND column_name = 'renewed_by'
  ) THEN
    ALTER TABLE credentials ADD COLUMN renewed_by UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credentials' AND column_name = 'previous_expiration_date'
  ) THEN
    ALTER TABLE credentials ADD COLUMN previous_expiration_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credentials' AND column_name = 'notes'
  ) THEN
    ALTER TABLE credentials ADD COLUMN notes TEXT;
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE visit_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see signatures for their organization's visits
DO $$
BEGIN
  DROP POLICY IF EXISTS visit_signatures_org_access ON visit_signatures;
  CREATE POLICY visit_signatures_org_access ON visit_signatures
    FOR ALL
    USING (
      caregiver_id IN (
        SELECT id FROM users WHERE organization_id = current_setting('app.current_org_id', true)::uuid
      )
    );
EXCEPTION
  WHEN undefined_object THEN
    -- current_setting not available, skip RLS
    NULL;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE visit_signatures IS 'Stores client/representative signatures for visit verification. Required for EVV compliance.';
COMMENT ON COLUMN visit_signatures.signature_data IS 'Base64 encoded PNG image of the signature';
COMMENT ON COLUMN visit_signatures.signed_by IS 'Who provided the signature: client, representative, or caregiver';
COMMENT ON COLUMN visit_signatures.signer_name IS 'Full name of the person who signed';
