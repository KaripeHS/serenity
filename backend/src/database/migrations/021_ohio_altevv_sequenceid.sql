-- ============================================================================
-- Ohio Alt-EVV v4.3 SequenceID Support Migration
-- Serenity ERP - Compliance Fix for Sandata Integration
-- ============================================================================
--
-- CRITICAL: Ohio Alt-EVV v4.3 requires SequenceID for all record types
--
-- SequenceID is used for:
-- - Idempotency (re-POSTing same SequenceID = update, not duplicate)
-- - Versioning (higher SequenceID = newer version of record)
-- - Deduplication (Sandata uses SequenceID to prevent duplicate submissions)
--
-- Requirements:
-- - SequenceID must increment by 1 for each new/updated record
-- - Patient, Staff, and Visit have INDEPENDENT sequences
-- - SequenceID must be unique per organization per record type
-- - Thread-safe increment (use PostgreSQL sequences)
--
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SequenceID Sequences Table
-- Stores current SequenceID for each record type per organization
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandata_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  record_type VARCHAR(50) NOT NULL, -- 'patient', 'staff', 'visit'

  -- Current sequence value
  current_sequence_id BIGINT NOT NULL DEFAULT 0,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one sequence per organization per record type
  CONSTRAINT sandata_sequences_org_type_unique UNIQUE (organization_id, record_type),

  -- Check constraint: valid record types
  CONSTRAINT sandata_sequences_record_type_check CHECK (
    record_type IN ('patient', 'staff', 'visit')
  )
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sandata_sequences_org_type ON sandata_sequences(organization_id, record_type);

COMMENT ON TABLE sandata_sequences IS 'Ohio Alt-EVV v4.3 SequenceID tracking per organization and record type';
COMMENT ON COLUMN sandata_sequences.current_sequence_id IS 'Current SequenceID value (increments by 1 for each new/updated record)';

-- ============================================================================
-- Add SequenceID columns to existing tables
-- ============================================================================

-- Add SequenceID to clients table (Patient records)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sandata_sequence_id BIGINT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sandata_other_id VARCHAR(100) UNIQUE; -- PatientOtherID

-- Add SequenceID to users table (Staff records)
ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_sequence_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_other_id VARCHAR(100) UNIQUE; -- StaffOtherID
ALTER TABLE users ADD COLUMN IF NOT EXISTS sandata_staff_pin VARCHAR(20); -- StaffID (telephony PIN)

-- Add SequenceID to evv_records table (Visit records)
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_sequence_id BIGINT;
ALTER TABLE evv_records ADD COLUMN IF NOT EXISTS sandata_other_id VARCHAR(100) UNIQUE; -- VisitOtherID

-- Indexes for SequenceID lookups
CREATE INDEX IF NOT EXISTS idx_clients_sandata_sequence ON clients(sandata_sequence_id) WHERE sandata_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_sandata_other_id ON clients(sandata_other_id) WHERE sandata_other_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_sandata_sequence ON users(sandata_sequence_id) WHERE sandata_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_sandata_other_id ON users(sandata_other_id) WHERE sandata_other_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evv_records_sandata_sequence ON evv_records(sandata_sequence_id) WHERE sandata_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evv_records_sandata_other_id ON evv_records(sandata_other_id) WHERE sandata_other_id IS NOT NULL;

-- ============================================================================
-- Thread-Safe SequenceID Increment Functions
-- ============================================================================

/**
 * Get next SequenceID for a given organization and record type
 * Thread-safe using PostgreSQL row locking (FOR UPDATE)
 *
 * @param p_organization_id - Organization UUID
 * @param p_record_type - 'patient', 'staff', or 'visit'
 * @returns Next SequenceID value (guaranteed unique)
 */
CREATE OR REPLACE FUNCTION get_next_sequence_id(
  p_organization_id UUID,
  p_record_type VARCHAR
) RETURNS BIGINT AS $$
DECLARE
  v_next_sequence_id BIGINT;
BEGIN
  -- Validate record type
  IF p_record_type NOT IN ('patient', 'staff', 'visit') THEN
    RAISE EXCEPTION 'Invalid record_type: %. Must be patient, staff, or visit.', p_record_type;
  END IF;

  -- Insert or update sequence record (thread-safe upsert)
  INSERT INTO sandata_sequences (organization_id, record_type, current_sequence_id)
  VALUES (p_organization_id, p_record_type, 1)
  ON CONFLICT (organization_id, record_type)
  DO UPDATE SET
    current_sequence_id = sandata_sequences.current_sequence_id + 1,
    updated_at = NOW()
  RETURNING current_sequence_id INTO v_next_sequence_id;

  RETURN v_next_sequence_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_sequence_id IS 'Thread-safe SequenceID generation for Ohio Alt-EVV v4.3';

/**
 * Get current SequenceID without incrementing
 *
 * @param p_organization_id - Organization UUID
 * @param p_record_type - 'patient', 'staff', or 'visit'
 * @returns Current SequenceID value (0 if none exists)
 */
CREATE OR REPLACE FUNCTION get_current_sequence_id(
  p_organization_id UUID,
  p_record_type VARCHAR
) RETURNS BIGINT AS $$
DECLARE
  v_current_sequence_id BIGINT;
BEGIN
  SELECT current_sequence_id INTO v_current_sequence_id
  FROM sandata_sequences
  WHERE organization_id = p_organization_id
    AND record_type = p_record_type;

  RETURN COALESCE(v_current_sequence_id, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_sequence_id IS 'Get current SequenceID value without incrementing';

/**
 * Reset SequenceID for a given organization and record type
 * CRITICAL: Only use this for testing or data migration
 *
 * @param p_organization_id - Organization UUID
 * @param p_record_type - 'patient', 'staff', or 'visit'
 * @param p_new_value - New SequenceID value (default 0)
 */
CREATE OR REPLACE FUNCTION reset_sequence_id(
  p_organization_id UUID,
  p_record_type VARCHAR,
  p_new_value BIGINT DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  -- Validate record type
  IF p_record_type NOT IN ('patient', 'staff', 'visit') THEN
    RAISE EXCEPTION 'Invalid record_type: %. Must be patient, staff, or visit.', p_record_type;
  END IF;

  -- Log warning (this should rarely be used)
  RAISE WARNING 'Resetting SequenceID for org=% type=% to %', p_organization_id, p_record_type, p_new_value;

  -- Update or insert
  INSERT INTO sandata_sequences (organization_id, record_type, current_sequence_id)
  VALUES (p_organization_id, p_record_type, p_new_value)
  ON CONFLICT (organization_id, record_type)
  DO UPDATE SET
    current_sequence_id = p_new_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_sequence_id IS 'ADMIN ONLY: Reset SequenceID (use for testing/migration only)';

-- ============================================================================
-- Triggers to Auto-Generate OtherID (UUIDs for PatientOtherID, etc.)
-- ============================================================================

/**
 * Trigger function to auto-generate sandata_other_id if not set
 * Uses existing record UUID as OtherID (ensures global uniqueness)
 */
CREATE OR REPLACE FUNCTION auto_generate_sandata_other_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If sandata_other_id is NULL, use the record's UUID
  IF NEW.sandata_other_id IS NULL THEN
    NEW.sandata_other_id := NEW.id::TEXT;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to clients (Patient)
DROP TRIGGER IF EXISTS clients_auto_generate_sandata_other_id ON clients;
CREATE TRIGGER clients_auto_generate_sandata_other_id
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_sandata_other_id();

-- Apply trigger to users (Staff)
DROP TRIGGER IF EXISTS users_auto_generate_sandata_other_id ON users;
CREATE TRIGGER users_auto_generate_sandata_other_id
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_sandata_other_id();

-- Apply trigger to evv_records (Visit)
DROP TRIGGER IF EXISTS evv_records_auto_generate_sandata_other_id ON evv_records;
CREATE TRIGGER evv_records_auto_generate_sandata_other_id
  BEFORE INSERT OR UPDATE ON evv_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_sandata_other_id();

-- ============================================================================
-- Row-Level Security for SequenceID Tables
-- ============================================================================

-- Enable RLS on sandata_sequences
ALTER TABLE sandata_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access sequences for their organization
CREATE POLICY sandata_sequences_tenant_isolation ON sandata_sequences
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Policy: AI service role can see all (for monitoring)
CREATE POLICY sandata_sequences_ai_service_access ON sandata_sequences
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'ai_service');

-- ============================================================================
-- Data Migration: Backfill OtherID for existing records
-- ============================================================================

-- Backfill clients.sandata_other_id with existing UUIDs
UPDATE clients
SET sandata_other_id = id::TEXT
WHERE sandata_other_id IS NULL;

-- Backfill users.sandata_other_id with existing UUIDs (caregivers only)
UPDATE users
SET sandata_other_id = id::TEXT
WHERE sandata_other_id IS NULL
  AND role = 'caregiver';

-- Backfill evv_records.sandata_other_id with existing UUIDs
UPDATE evv_records
SET sandata_other_id = id::TEXT
WHERE sandata_other_id IS NULL;

-- ============================================================================
-- Helper Views for Monitoring SequenceID Status
-- ============================================================================

/**
 * View: Sandata SequenceID Status per Organization
 * Shows current SequenceID values and usage
 */
CREATE OR REPLACE VIEW sandata_sequence_status AS
SELECT
  ss.organization_id,
  ss.record_type,
  ss.current_sequence_id,
  ss.updated_at AS last_updated,
  CASE
    WHEN ss.record_type = 'patient' THEN (
      SELECT COUNT(*) FROM clients c
      WHERE c.organization_id = ss.organization_id
        AND c.sandata_sequence_id IS NOT NULL
    )
    WHEN ss.record_type = 'staff' THEN (
      SELECT COUNT(*) FROM users u
      WHERE u.organization_id = ss.organization_id
        AND u.sandata_sequence_id IS NOT NULL
        AND u.role = 'caregiver'
    )
    WHEN ss.record_type = 'visit' THEN (
      SELECT COUNT(*) FROM evv_records e
      WHERE e.organization_id = ss.organization_id
        AND e.sandata_sequence_id IS NOT NULL
    )
  END AS records_with_sequence_id
FROM sandata_sequences ss;

COMMENT ON VIEW sandata_sequence_status IS 'Monitor SequenceID usage and current values per organization';

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN clients.sandata_sequence_id IS 'Ohio Alt-EVV v4.3 SequenceID for Patient record (must increment for updates)';
COMMENT ON COLUMN clients.sandata_other_id IS 'Ohio Alt-EVV v4.3 PatientOtherID (our internal UUID for correlation)';

COMMENT ON COLUMN users.sandata_sequence_id IS 'Ohio Alt-EVV v4.3 SequenceID for Staff record (must increment for updates)';
COMMENT ON COLUMN users.sandata_other_id IS 'Ohio Alt-EVV v4.3 StaffOtherID (our internal UUID for correlation)';
COMMENT ON COLUMN users.sandata_staff_pin IS 'Ohio Alt-EVV v4.3 StaffID (telephony PIN for phone-based clock in/out)';

COMMENT ON COLUMN evv_records.sandata_sequence_id IS 'Ohio Alt-EVV v4.3 SequenceID for Visit record (must increment for updates)';
COMMENT ON COLUMN evv_records.sandata_other_id IS 'Ohio Alt-EVV v4.3 VisitOtherID (our internal UUID for correlation)';

-- ============================================================================
-- Migration Complete
-- Version: 016
-- Date: 2025-11-03
-- Purpose: Add Ohio Alt-EVV v4.3 SequenceID support (CRITICAL for compliance)
-- ============================================================================
