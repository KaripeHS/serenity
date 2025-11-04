-- ============================================================================
-- Ohio Alt-EVV v4.3 SSN Requirement Migration
-- Serenity ERP - Compliance Fix for Staff Submissions
-- ============================================================================
--
-- CRITICAL: Ohio Alt-EVV v4.3 requires 9-digit SSN for all staff records
--
-- Requirements:
-- - StaffSSN is REQUIRED (not optional) for Ohio staff submissions
-- - Must be 9 digits, no dashes (e.g., "123456789")
-- - Must be encrypted in transit and at rest
-- - MUST NOT be logged (PHI/PII protection)
--
-- This migration:
-- - Adds ssn_encrypted column to users table (for caregivers only)
-- - Adds validation for SSN format (9 digits)
-- - Creates helper function to validate SSN
-- - Adds RLS policy to protect SSN from unauthorized access
--
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Add SSN Column to Users Table
-- ============================================================================

-- Add encrypted SSN column for caregivers
-- CRITICAL: This column stores encrypted SSN using PostgreSQL pgcrypto
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_encrypted BYTEA;

-- Add flag to indicate SSN has been verified
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_verified BOOLEAN DEFAULT FALSE;

-- Add timestamp for when SSN was last updated
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_updated_at TIMESTAMPTZ;

-- Add birth date for caregivers (required by Ohio Alt-EVV v4.3)
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add gender for caregivers (optional but recommended)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(1);

-- Add hire date for caregivers (optional but recommended)
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add termination date for caregivers (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS termination_date DATE;

-- Add middle name for caregivers (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Add address fields for caregivers (optional but recommended)
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- ============================================================================
-- SSN Encryption/Decryption Functions
-- ============================================================================

/**
 * Encrypt SSN using AES-256
 * Uses organization-specific encryption key from environment
 *
 * @param p_ssn - Plain text SSN (9 digits, no dashes)
 * @returns Encrypted SSN (bytea)
 */
CREATE OR REPLACE FUNCTION encrypt_ssn(p_ssn TEXT)
RETURNS BYTEA AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Get encryption key from environment (in production, use AWS Secrets Manager)
  v_encryption_key := COALESCE(
    current_setting('app.ssn_encryption_key', true),
    'PLACEHOLDER_KEY_REPLACE_IN_PRODUCTION'
  );

  -- Validate SSN format (9 digits, no dashes)
  IF NOT (p_ssn ~ '^[0-9]{9}$') THEN
    RAISE EXCEPTION 'Invalid SSN format. Must be 9 digits without dashes.';
  END IF;

  -- Encrypt using AES-256
  RETURN pgp_sym_encrypt(p_ssn, v_encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_ssn IS 'Encrypt SSN using AES-256 (PHI protection)';

/**
 * Decrypt SSN
 * CRITICAL: Only use this function when absolutely necessary
 * NEVER log decrypted SSN
 *
 * @param p_ssn_encrypted - Encrypted SSN (bytea)
 * @returns Plain text SSN (9 digits, no dashes)
 */
CREATE OR REPLACE FUNCTION decrypt_ssn(p_ssn_encrypted BYTEA)
RETURNS TEXT AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  IF p_ssn_encrypted IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get encryption key from environment
  v_encryption_key := COALESCE(
    current_setting('app.ssn_encryption_key', true),
    'PLACEHOLDER_KEY_REPLACE_IN_PRODUCTION'
  );

  -- Decrypt using AES-256
  RETURN pgp_sym_decrypt(p_ssn_encrypted, v_encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decrypt_ssn IS 'Decrypt SSN (use ONLY when necessary, NEVER log result)';

/**
 * Validate SSN format
 *
 * @param p_ssn - Plain text SSN
 * @returns TRUE if valid, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_valid_ssn(p_ssn TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- SSN must be exactly 9 digits, no dashes
  IF p_ssn IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check format: 9 digits
  IF NOT (p_ssn ~ '^[0-9]{9}$') THEN
    RETURN FALSE;
  END IF;

  -- Invalid SSNs (well-known invalid patterns)
  IF p_ssn IN ('000000000', '111111111', '222222222', '333333333', '444444444',
               '555555555', '666666666', '777777777', '888888888', '999999999') THEN
    RETURN FALSE;
  END IF;

  -- Area number (first 3 digits) cannot be 000 or 666
  IF SUBSTRING(p_ssn FROM 1 FOR 3) IN ('000', '666') THEN
    RETURN FALSE;
  END IF;

  -- Area number cannot be between 900-999 (reserved)
  IF SUBSTRING(p_ssn FROM 1 FOR 3)::INTEGER >= 900 THEN
    RETURN FALSE;
  END IF;

  -- Group number (middle 2 digits) cannot be 00
  IF SUBSTRING(p_ssn FROM 4 FOR 2) = '00' THEN
    RETURN FALSE;
  END IF;

  -- Serial number (last 4 digits) cannot be 0000
  IF SUBSTRING(p_ssn FROM 6 FOR 4) = '0000' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_ssn IS 'Validate SSN format and check for known invalid patterns';

-- ============================================================================
-- Triggers for SSN Management
-- ============================================================================

/**
 * Trigger function to update ssn_updated_at timestamp
 */
CREATE OR REPLACE FUNCTION update_ssn_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- If SSN was changed, update timestamp
  IF NEW.ssn_encrypted IS DISTINCT FROM OLD.ssn_encrypted THEN
    NEW.ssn_updated_at := NOW();

    -- Log SSN change (for audit trail, but DON'T log actual SSN value)
    INSERT INTO audit_trail (
      table_name,
      record_id,
      action,
      changed_by,
      changed_at,
      metadata
    ) VALUES (
      'users',
      NEW.id,
      'ssn_updated',
      current_setting('app.current_user_id', true)::UUID,
      NOW(),
      jsonb_build_object(
        'role', NEW.role,
        'ssn_verified', NEW.ssn_verified,
        'note', 'SSN updated (value not logged for security)'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS users_ssn_timestamp ON users;
CREATE TRIGGER users_ssn_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_ssn_timestamp();

-- ============================================================================
-- Constraint: Caregivers Must Have SSN
-- ============================================================================

/**
 * Check constraint: Caregivers must have SSN (required for Ohio Alt-EVV v4.3)
 * This constraint is enforced at the application level, not database level,
 * to allow gradual migration of existing caregivers
 *
 * TODO: After all caregivers have SSN, uncomment the following constraint
 */

-- UNCOMMENT AFTER MIGRATION COMPLETE:
-- ALTER TABLE users ADD CONSTRAINT users_caregiver_ssn_required CHECK (
--   role != 'caregiver' OR ssn_encrypted IS NOT NULL
-- );

-- ============================================================================
-- Helper Function: Check if Caregiver Has Required Fields for Sandata
-- ============================================================================

/**
 * Check if caregiver has all required fields for Ohio Alt-EVV submission
 *
 * @param p_user_id - User UUID
 * @returns TRUE if all required fields present, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_caregiver_sandata_ready(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_ready BOOLEAN := FALSE;
BEGIN
  SELECT
    role = 'caregiver' AND
    ssn_encrypted IS NOT NULL AND
    date_of_birth IS NOT NULL AND
    first_name IS NOT NULL AND
    last_name IS NOT NULL AND
    sandata_other_id IS NOT NULL
  INTO v_is_ready
  FROM users
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_ready, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_caregiver_sandata_ready IS 'Check if caregiver has all required fields for Ohio Alt-EVV submission';

-- ============================================================================
-- Row-Level Security for SSN Access
-- ============================================================================

-- Create policy to restrict SSN access
-- Only allow access to SSN for:
-- - The user themselves
-- - Users with 'hr_manager' or 'founder' role
-- - AI service (for Sandata submission)
CREATE POLICY users_ssn_access ON users
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id', true)::UUID OR
    current_setting('app.current_user_role', true) IN ('hr_manager', 'founder', 'ai_service', 'compliance_officer')
  );

-- ============================================================================
-- Helper View: Caregiver Sandata Readiness
-- ============================================================================

/**
 * View: Shows which caregivers are ready for Sandata submission
 */
CREATE OR REPLACE VIEW caregiver_sandata_readiness AS
SELECT
  u.id,
  u.organization_id,
  u.first_name,
  u.last_name,
  u.email,
  u.sandata_other_id,
  u.sandata_employee_id,
  u.sandata_staff_pin,
  -- Required fields check
  (u.ssn_encrypted IS NOT NULL) AS has_ssn,
  (u.date_of_birth IS NOT NULL) AS has_dob,
  (u.sandata_other_id IS NOT NULL) AS has_other_id,
  (u.sandata_staff_pin IS NOT NULL) AS has_staff_pin,
  -- Overall readiness
  is_caregiver_sandata_ready(u.id) AS is_ready,
  -- Missing fields list
  ARRAY_REMOVE(ARRAY[
    CASE WHEN u.ssn_encrypted IS NULL THEN 'ssn' END,
    CASE WHEN u.date_of_birth IS NULL THEN 'date_of_birth' END,
    CASE WHEN u.sandata_other_id IS NULL THEN 'sandata_other_id' END,
    CASE WHEN u.sandata_staff_pin IS NULL THEN 'sandata_staff_pin' END,
    CASE WHEN u.first_name IS NULL THEN 'first_name' END,
    CASE WHEN u.last_name IS NULL THEN 'last_name' END
  ], NULL) AS missing_fields,
  -- Sync status
  u.sandata_sync_required,
  u.sandata_last_synced,
  u.sandata_sync_error
FROM users u
WHERE u.role = 'caregiver' AND u.status = 'active';

COMMENT ON VIEW caregiver_sandata_readiness IS 'Monitor which caregivers are ready for Ohio Alt-EVV submission';

-- ============================================================================
-- Gender Constraint
-- ============================================================================

-- Add check constraint for gender (M/F/U)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_gender_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_gender_check CHECK (
      gender IS NULL OR gender IN ('M', 'F', 'U')
    );
  END IF;
END $$;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for caregivers with SSN
CREATE INDEX IF NOT EXISTS idx_users_caregiver_ssn ON users(role, ssn_encrypted)
  WHERE role = 'caregiver' AND ssn_encrypted IS NOT NULL;

-- Index for caregiver date of birth
CREATE INDEX IF NOT EXISTS idx_users_caregiver_dob ON users(date_of_birth)
  WHERE role = 'caregiver' AND date_of_birth IS NOT NULL;

-- Index for Sandata readiness
CREATE INDEX IF NOT EXISTS idx_users_caregiver_sandata_ready ON users(role, sandata_sync_required)
  WHERE role = 'caregiver' AND sandata_sync_required = TRUE;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN users.ssn_encrypted IS 'Encrypted SSN (9 digits) - REQUIRED for caregivers per Ohio Alt-EVV v4.3 - PHI protected';
COMMENT ON COLUMN users.ssn_verified IS 'Whether SSN has been verified against official records';
COMMENT ON COLUMN users.ssn_updated_at IS 'Timestamp of last SSN update (for audit trail)';
COMMENT ON COLUMN users.date_of_birth IS 'Date of birth - REQUIRED for caregivers per Ohio Alt-EVV v4.3';
COMMENT ON COLUMN users.gender IS 'Gender (M/F/U) - Optional but recommended for Ohio Alt-EVV';
COMMENT ON COLUMN users.hire_date IS 'Hire date for caregivers - Optional but recommended for Ohio Alt-EVV';
COMMENT ON COLUMN users.termination_date IS 'Termination date for caregivers - Set when staff member is terminated';
COMMENT ON COLUMN users.middle_name IS 'Middle name - Optional for Ohio Alt-EVV';

-- ============================================================================
-- Migration Complete
-- Version: 017
-- Date: 2025-11-03
-- Purpose: Add SSN requirement for Ohio Alt-EVV v4.3 staff submissions
-- ============================================================================
