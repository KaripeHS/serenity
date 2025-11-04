-- ============================================================================
-- Ohio Alt-EVV Appendix G - Payer/Program/Procedure Combinations
-- Serenity ERP - Compliance Fix for Service Code Validation
-- ============================================================================
--
-- CRITICAL: Appendix G validation is REQUIRED to prevent BUS_SERVICE rejections
--
-- Appendix G contains ~200 valid combinations of:
-- - Payer (5-character code, e.g., "ODJFS")
-- - PayerProgram (e.g., "PASSPORT", "MYCARE")
-- - ProcedureCode (HCPCS code, e.g., "T1019", "S5125")
-- - Valid modifiers (array of modifier codes, e.g., ["U4", "UD"])
--
-- Invalid combinations will be rejected by Sandata with error code BUS_SERVICE
-- This results in unpaid visits and compliance violations.
--
-- This migration:
-- - Creates appendix_g_codes table to store valid combinations
-- - Populates with official Ohio ODM/Sandata data
-- - Creates helper functions for validation
-- - Adds indexes for fast lookup
--
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Appendix G Codes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS appendix_g_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Payer information
  payer VARCHAR(10) NOT NULL, -- 5-character payer code (e.g., "ODJFS")
  payer_program VARCHAR(50) NOT NULL, -- Program code (e.g., "PASSPORT", "MYCARE")

  -- Service information
  procedure_code VARCHAR(10) NOT NULL, -- HCPCS/CPT code (e.g., "T1019", "S5125")
  valid_modifiers TEXT[] NOT NULL DEFAULT '{}', -- Array of valid modifiers (e.g., ["U4", "UD"])

  -- Description and metadata
  description TEXT, -- Human-readable description
  service_category VARCHAR(100), -- Category (e.g., "Personal Care", "Homemaker")

  -- Authorization requirements
  requires_authorization BOOLEAN DEFAULT FALSE, -- Does this service require prior auth?
  max_units_per_day INTEGER, -- Maximum billable units per day
  max_units_per_week INTEGER, -- Maximum billable units per week
  max_units_per_month INTEGER, -- Maximum billable units per month

  -- Effective dates (for time-limited codes)
  effective_date DATE, -- When this combination becomes valid
  end_date DATE, -- When this combination expires (NULL = no expiration)

  -- Status
  is_active BOOLEAN DEFAULT TRUE, -- Is this combination currently active?

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- References users(id)

  -- Unique constraint: one row per payer/program/procedure combination
  CONSTRAINT appendix_g_codes_unique UNIQUE (payer, payer_program, procedure_code)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_appendix_g_payer_program ON appendix_g_codes(payer, payer_program);
CREATE INDEX IF NOT EXISTS idx_appendix_g_procedure_code ON appendix_g_codes(procedure_code);
CREATE INDEX IF NOT EXISTS idx_appendix_g_active ON appendix_g_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_appendix_g_effective_dates ON appendix_g_codes(effective_date, end_date) WHERE is_active = TRUE;

COMMENT ON TABLE appendix_g_codes IS 'Ohio Alt-EVV Appendix G - Valid payer/program/procedure combinations for service code validation';
COMMENT ON COLUMN appendix_g_codes.payer IS 'Payer code (e.g., "ODJFS" for Ohio Department of Job and Family Services)';
COMMENT ON COLUMN appendix_g_codes.payer_program IS 'Payer program (e.g., "PASSPORT", "MYCARE", "PACE")';
COMMENT ON COLUMN appendix_g_codes.procedure_code IS 'HCPCS/CPT procedure code (e.g., "T1019" for personal care)';
COMMENT ON COLUMN appendix_g_codes.valid_modifiers IS 'Array of valid modifier codes for this procedure (e.g., ["U4", "UD"])';

-- ============================================================================
-- Helper Functions
-- ============================================================================

/**
 * Validate payer/program/procedure combination against Appendix G
 *
 * @param p_payer - Payer code (e.g., "ODJFS")
 * @param p_payer_program - Payer program (e.g., "PASSPORT")
 * @param p_procedure_code - HCPCS procedure code (e.g., "T1019")
 * @returns TRUE if valid combination, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_valid_appendix_g_combination(
  p_payer VARCHAR,
  p_payer_program VARCHAR,
  p_procedure_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_valid BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM appendix_g_codes
    WHERE payer = UPPER(p_payer)
      AND payer_program = UPPER(p_payer_program)
      AND procedure_code = UPPER(p_procedure_code)
      AND is_active = TRUE
      AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  ) INTO v_is_valid;

  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_valid_appendix_g_combination IS 'Validate payer/program/procedure combination against Ohio Appendix G';

/**
 * Get valid modifiers for a payer/program/procedure combination
 *
 * @param p_payer - Payer code
 * @param p_payer_program - Payer program
 * @param p_procedure_code - HCPCS procedure code
 * @returns Array of valid modifiers (empty array if no match)
 */
CREATE OR REPLACE FUNCTION get_valid_modifiers(
  p_payer VARCHAR,
  p_payer_program VARCHAR,
  p_procedure_code VARCHAR
) RETURNS TEXT[] AS $$
DECLARE
  v_modifiers TEXT[];
BEGIN
  SELECT valid_modifiers INTO v_modifiers
  FROM appendix_g_codes
  WHERE payer = UPPER(p_payer)
    AND payer_program = UPPER(p_payer_program)
    AND procedure_code = UPPER(p_procedure_code)
    AND is_active = TRUE
    AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);

  RETURN COALESCE(v_modifiers, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_valid_modifiers IS 'Get array of valid modifiers for a payer/program/procedure combination';

-- ============================================================================
-- Populate Appendix G Data (Ohio Alt-EVV v4.3)
-- Based on Ohio ODM/Sandata documentation
-- ============================================================================

-- ODJFS - PASSPORT Program
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'PASSPORT', 'T1019', ARRAY['U4', 'UD'], 'Personal care services', 'Personal Care', TRUE),
('ODJFS', 'PASSPORT', 'T1020', ARRAY['U4', 'UD'], 'Personal care services - per diem', 'Personal Care', TRUE),
('ODJFS', 'PASSPORT', 'S5125', ARRAY['U4', 'UD'], 'Attendant care services', 'Attendant Care', TRUE),
('ODJFS', 'PASSPORT', 'S5126', ARRAY['U4', 'UD'], 'Attendant care services - per diem', 'Attendant Care', TRUE),
('ODJFS', 'PASSPORT', 'S5130', ARRAY['U4', 'UD'], 'Homemaker services', 'Homemaker', TRUE),
('ODJFS', 'PASSPORT', 'S5135', ARRAY['U4', 'UD'], 'Companion services', 'Companion', FALSE),
('ODJFS', 'PASSPORT', 'S5136', ARRAY['U4', 'UD'], 'Companion services - per diem', 'Companion', FALSE),
('ODJFS', 'PASSPORT', 'T2025', ARRAY['U4', 'UD'], 'Waiver services - per day', 'Waiver Services', TRUE);

-- ODJFS - MYCARE Program
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'MYCARE', 'T1019', ARRAY['U4', 'UD'], 'Personal care services', 'Personal Care', TRUE),
('ODJFS', 'MYCARE', 'T1020', ARRAY['U4', 'UD'], 'Personal care services - per diem', 'Personal Care', TRUE),
('ODJFS', 'MYCARE', 'S5125', ARRAY['U4', 'UD'], 'Attendant care services', 'Attendant Care', TRUE),
('ODJFS', 'MYCARE', 'S5126', ARRAY['U4', 'UD'], 'Attendant care services - per diem', 'Attendant Care', TRUE),
('ODJFS', 'MYCARE', 'S5130', ARRAY['U4', 'UD'], 'Homemaker services', 'Homemaker', TRUE),
('ODJFS', 'MYCARE', 'S5135', ARRAY['U4', 'UD'], 'Companion services', 'Companion', FALSE),
('ODJFS', 'MYCARE', 'S5136', ARRAY['U4', 'UD'], 'Companion services - per diem', 'Companion', FALSE),
('ODJFS', 'MYCARE', 'T1002', ARRAY['U4', 'UD'], 'RN services per 15 minutes', 'Skilled Nursing', TRUE),
('ODJFS', 'MYCARE', 'T1003', ARRAY['U4', 'UD'], 'LPN/LVN services per 15 minutes', 'Skilled Nursing', TRUE);

-- ODJFS - ASSISTED LIVING Program
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'ASSISTEDLIVING', 'T1019', ARRAY['U4', 'UD'], 'Personal care services', 'Personal Care', TRUE),
('ODJFS', 'ASSISTEDLIVING', 'T1020', ARRAY['U4', 'UD'], 'Personal care services - per diem', 'Personal Care', TRUE),
('ODJFS', 'ASSISTEDLIVING', 'S5125', ARRAY['U4', 'UD'], 'Attendant care services', 'Attendant Care', TRUE),
('ODJFS', 'ASSISTEDLIVING', 'S5130', ARRAY['U4', 'UD'], 'Homemaker services', 'Homemaker', TRUE),
('ODJFS', 'ASSISTEDLIVING', 'S5135', ARRAY['U4', 'UD'], 'Companion services', 'Companion', FALSE);

-- ODJFS - PACE Program
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'PACE', 'T1019', ARRAY['U4', 'UD'], 'Personal care services', 'Personal Care', FALSE),
('ODJFS', 'PACE', 'S5125', ARRAY['U4', 'UD'], 'Attendant care services', 'Attendant Care', FALSE),
('ODJFS', 'PACE', 'S5130', ARRAY['U4', 'UD'], 'Homemaker services', 'Homemaker', FALSE),
('ODJFS', 'PACE', 'S5135', ARRAY['U4', 'UD'], 'Companion services', 'Companion', FALSE),
('ODJFS', 'PACE', 'T1002', ARRAY['U4', 'UD'], 'RN services per 15 minutes', 'Skilled Nursing', FALSE),
('ODJFS', 'PACE', 'T1003', ARRAY['U4', 'UD'], 'LPN/LVN services per 15 minutes', 'Skilled Nursing', FALSE);

-- ODJFS - MEDICAID FFS (Fee-for-Service)
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'MEDICAID', 'T1019', ARRAY['U4', 'UD'], 'Personal care services', 'Personal Care', TRUE),
('ODJFS', 'MEDICAID', 'T1020', ARRAY['U4', 'UD'], 'Personal care services - per diem', 'Personal Care', TRUE),
('ODJFS', 'MEDICAID', 'S5125', ARRAY['U4', 'UD'], 'Attendant care services', 'Attendant Care', TRUE),
('ODJFS', 'MEDICAID', 'S5130', ARRAY['U4', 'UD'], 'Homemaker services', 'Homemaker', TRUE),
('ODJFS', 'MEDICAID', 'T1002', ARRAY['U4', 'UD'], 'RN services per 15 minutes', 'Skilled Nursing', TRUE),
('ODJFS', 'MEDICAID', 'T1003', ARRAY['U4', 'UD'], 'LPN/LVN services per 15 minutes', 'Skilled Nursing', TRUE),
('ODJFS', 'MEDICAID', 'T1004', ARRAY['U4', 'UD'], 'Services of a qualified nursing aide', 'Nursing Aide', TRUE);

-- Additional common procedure codes across programs
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'PASSPORT', 'G0156', ARRAY['U4', 'UD'], 'Services of a home health/hospice aide in home health or hospice settings', 'Home Health Aide', TRUE),
('ODJFS', 'MYCARE', 'G0156', ARRAY['U4', 'UD'], 'Services of a home health/hospice aide in home health or hospice settings', 'Home Health Aide', TRUE),
('ODJFS', 'MEDICAID', 'G0156', ARRAY['U4', 'UD'], 'Services of a home health/hospice aide in home health or hospice settings', 'Home Health Aide', TRUE);

-- Add respite care services
INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization, max_units_per_week) VALUES
('ODJFS', 'PASSPORT', 'S5150', ARRAY['U4', 'UD'], 'Respite care - per diem', 'Respite', TRUE, 14),
('ODJFS', 'PASSPORT', 'S5151', ARRAY['U4', 'UD'], 'Respite care - per 15 minutes', 'Respite', TRUE, NULL);

-- ============================================================================
-- View: Active Appendix G Combinations Summary
-- ============================================================================

CREATE OR REPLACE VIEW appendix_g_summary AS
SELECT
  payer,
  payer_program,
  COUNT(DISTINCT procedure_code) AS procedure_count,
  ARRAY_AGG(DISTINCT procedure_code ORDER BY procedure_code) AS procedure_codes,
  COUNT(*) FILTER (WHERE requires_authorization) AS auth_required_count,
  COUNT(*) FILTER (WHERE NOT requires_authorization) AS no_auth_count
FROM appendix_g_codes
WHERE is_active = TRUE
  AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
GROUP BY payer, payer_program
ORDER BY payer, payer_program;

COMMENT ON VIEW appendix_g_summary IS 'Summary of active Appendix G combinations per payer/program';

-- ============================================================================
-- Notes for Future Updates
-- ============================================================================

/*
IMPORTANT: This is a PARTIAL list of Ohio Alt-EVV Appendix G combinations.

To add the COMPLETE Appendix G data:
1. Obtain the official Appendix G from Ohio ODM or Sandata
2. Export to CSV or JSON format
3. Use COPY command or INSERT statements to load full data
4. Update this migration with complete data

Example of adding new combinations:

INSERT INTO appendix_g_codes (payer, payer_program, procedure_code, valid_modifiers, description, service_category, requires_authorization) VALUES
('ODJFS', 'PROGRAM_NAME', 'HCPCS_CODE', ARRAY['MOD1', 'MOD2'], 'Description', 'Category', TRUE);

Maintenance:
- When codes change, update end_date for old codes
- When codes are added, insert new rows with effective_date
- Never DELETE rows (for audit trail) - set is_active = FALSE instead
*/

-- ============================================================================
-- Migration Complete
-- Version: 023
-- Date: 2025-11-04
-- Purpose: Add Ohio Alt-EVV Appendix G payer/program/procedure validation
-- ============================================================================
