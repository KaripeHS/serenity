-- ============================================================================
-- Sandata Configuration Seed
-- Serenity ERP - Default Sandata config for Serenity Care Partners
-- PLACEHOLDER VALUES - Replace with real credentials before Phase 2
-- ============================================================================

-- ============================================================================
-- Insert Default Sandata Config for Serenity Care Partners Org
-- ============================================================================

INSERT INTO sandata_config (
  organization_id,
  sandata_provider_id,
  sandbox_enabled,
  geofence_radius_miles,
  clock_in_tolerance_minutes,
  rounding_minutes,
  rounding_mode,
  max_retry_attempts,
  retry_delay_seconds,
  claims_gate_mode,
  require_authorization_match,
  block_over_authorization,
  auto_submit_enabled,
  corrections_enabled
) VALUES (
  -- Use Serenity Care Partners org ID (from schema.sql seed)
  '00000000-0000-0000-0000-000000000001',

  -- PLACEHOLDER - Replace with real ODME Provider ID by Nov 30, 2025
  'OH_ODME_123456',

  -- Sandbox mode enabled for Phase 0-1 (development/testing)
  TRUE,

  -- Business rules (from Manifesto v2.3)
  0.25,  -- geofence_radius_miles
  15,    -- clock_in_tolerance_minutes
  6,     -- rounding_minutes
  'nearest', -- rounding_mode

  -- Retry configuration
  3,     -- max_retry_attempts
  300,   -- retry_delay_seconds (5 minutes)

  -- Claims gate (start in warn mode, move to strict after 2 weeks)
  'warn',

  -- Authorization checks
  TRUE,  -- require_authorization_match
  TRUE,  -- block_over_authorization

  -- Submission flags (disabled until Phase 2)
  FALSE, -- auto_submit_enabled
  TRUE   -- corrections_enabled

) ON CONFLICT (organization_id) DO UPDATE SET
  updated_at = NOW();

-- ============================================================================
-- Insert Default Audit Chain Config
-- ============================================================================

INSERT INTO audit_chain_config (
  organization_id,
  hash_algorithm,
  verification_enabled,
  verification_frequency,
  verification_day_of_week,
  verification_time,
  alert_on_mismatch,
  alert_severity,
  verification_log_retention_days,
  batch_size,
  max_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'sha256',
  FALSE, -- Disabled until feature flag enabled
  'weekly',
  0, -- Sunday
  '02:00'::TIME,
  TRUE,
  'critical',
  730, -- 2 years
  1000,
  60
) ON CONFLICT (organization_id) DO UPDATE SET
  updated_at = NOW();

-- ============================================================================
-- Insert Default On-Call Config
-- ============================================================================

INSERT INTO oncall_config (
  organization_id,
  default_ack_sla_minutes,
  default_resolution_sla_minutes,
  enable_auto_escalation,
  escalation_timeout_minutes,
  max_escalation_levels,
  notification_channels,
  rotation_enabled,
  rotation_frequency,
  rotation_day_of_week,
  rotation_time
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  15,  -- ACK within 15 minutes
  60,  -- Resolve within 60 minutes
  TRUE,
  15,  -- Escalate after 15 minutes
  3,
  ARRAY['sms', 'voice_call'],
  TRUE,
  'weekly',
  0, -- Sunday
  '00:00'::TIME
) ON CONFLICT (organization_id) DO UPDATE SET
  updated_at = NOW();

-- ============================================================================
-- Insert Default Earned Overtime Config
-- ============================================================================

INSERT INTO earned_overtime_config (
  organization_id,
  enabled,
  eligible_roles,
  eligible_employee_types,
  minimum_tenure_days,
  weekend_accrual_rate,
  holiday_accrual_rate,
  overnight_accrual_rate,
  long_shift_accrual_rate,
  long_shift_threshold_hours,
  payout_frequency,
  payout_minimum_hours,
  auto_payout_enabled,
  require_approval,
  approver_role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE, -- Disabled until feature flag enabled
  ARRAY['caregiver'],
  ARRAY['hourly'],
  90, -- 90 days tenure requirement
  0.5,  -- 50% for weekends
  1.0,  -- 100% for holidays
  0.25, -- 25% for overnight
  0.5,  -- 50% for long shifts
  10.0, -- 10+ hours qualifies as long shift
  'quarterly',
  8.0,  -- Minimum 8 hours before payout
  FALSE,
  TRUE,
  'hr_manager'
) ON CONFLICT (organization_id) DO UPDATE SET
  updated_at = NOW();

-- ============================================================================
-- Insert Ohio Medicaid Payer Contract (Template)
-- ============================================================================

INSERT INTO payer_contracts (
  organization_id,
  payer_id,
  payer_name,
  contract_number,
  start_date,
  status,
  payment_terms_days,
  clean_claim_definition_days,
  claims_submission_method,
  clearinghouse_name,
  notes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'OH_MEDICAID',
  'Ohio Medicaid',
  'OH-MEDICAID-2025',
  '2025-01-01',
  'active',
  30, -- Net 30
  30, -- 30 days for clean claim processing
  'edi_837',
  'Sandata',
  'Ohio Medicaid contract - requires Alt-EVV via Sandata for personal care services'
) ON CONFLICT (contract_number) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE sandata_config IS 'Per-organization Sandata configuration - CONTAINS PLACEHOLDER VALUES until Phase 2';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify Sandata config seeded:
-- SELECT * FROM sandata_config WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- Verify all configs seeded:
-- SELECT 'sandata_config' AS table, COUNT(*) FROM sandata_config
-- UNION ALL
-- SELECT 'audit_chain_config', COUNT(*) FROM audit_chain_config
-- UNION ALL
-- SELECT 'oncall_config', COUNT(*) FROM oncall_config
-- UNION ALL
-- SELECT 'earned_overtime_config', COUNT(*) FROM earned_overtime_config
-- UNION ALL
-- SELECT 'payer_contracts', COUNT(*) FROM payer_contracts;

-- ============================================================================
-- Seed Complete
-- Version: 004
-- Date: 2025-11-03
-- WARNING: PLACEHOLDER SANDATA_PROVIDER_ID - Must be replaced by Nov 30, 2025
-- ============================================================================
