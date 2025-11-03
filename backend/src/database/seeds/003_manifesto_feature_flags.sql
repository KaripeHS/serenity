-- ============================================================================
-- Manifesto v2.3 Feature Flags Seed
-- Serenity ERP - Feature flags for all new Manifesto functionality
-- ALL FLAGS DEFAULT TO FALSE (OFF) - Enable manually per environment
-- ============================================================================

-- ============================================================================
-- Public Website & Careers Portal (Workstream A)
-- ============================================================================

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('site_careers_enabled', 'false', 'Enable public careers portal with job listings and applications', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('site_referral_form_enabled', 'false', 'Enable public patient/client referral form on website', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Pods, HR & Scheduling (Workstream B)
-- ============================================================================

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('pods_enabled', 'false', 'Enable pod-based organization structure (already in schema, but feature-flagged)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('earned_overtime_enabled', 'false', 'Enable Earned Overtime accrual system for hourly caregivers', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('oncall_enabled', 'false', 'Enable on-call coverage rosters and incident tracking', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Compliance (Workstream C)
-- ============================================================================

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('policy_center_enabled', 'false', 'Enable Policy Center for policy management and staff sign-offs', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('retention_enforcement_enabled', 'false', 'Enable automated data retention archival to S3 Glacier', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('audit_chain_verification_enabled', 'false', 'Enable weekly cryptographic audit chain hash verification', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Alt-EVV / Sandata Integration (Workstream D - CRITICAL)
-- ============================================================================

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('alt_evv_enabled', 'false', 'Enable Alternative EVV (Sandata) integration - MASTER SWITCH', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_submissions_enabled', 'false', 'Enable automatic EVV submission to Sandata (requires alt_evv_enabled)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_sandbox_mode', 'true', 'Use Sandata sandbox environment (true) or production (false)', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Claims Gate (Workstream E)
-- ============================================================================

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('claims_gate_enabled', 'false', 'Enable claims gate to block/warn on claims without EVV match', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('claims_gate_mode', '"warn"', 'Claims gate enforcement mode: "disabled", "warn", "strict"', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- AI Guardrails (Workstream F)
-- ============================================================================

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('ai_evvaffect_dualapproval_required', 'true', 'Require dual approval (Pod Lead + DoO) for AI-suggested EVV changes - DEFAULT ON for safety', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('ai_guardrails_enabled', 'true', 'Enable AI guardrails middleware for PHI/RCM/EVV protection - DEFAULT ON', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Additional Configuration (Non-Flags)
-- ============================================================================

-- Sandata Configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_geofence_radius_miles', '0.25', 'GPS geofence radius for EVV location validation (miles)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_clock_tolerance_minutes', '15', 'Clock in/out tolerance window (minutes)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_rounding_minutes', '6', 'Time rounding increment for billing (6-minute standard)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_rounding_mode', '"nearest"', 'Rounding mode: "nearest", "up", "down"', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_max_retry_attempts', '3', 'Maximum retry attempts for failed Sandata submissions', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_retry_delay_seconds', '300', 'Delay between retry attempts (seconds) - 5 minutes default', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_require_authorization_match', 'true', 'Require service authorization to match before Sandata submission', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('sandata_block_over_authorization', 'true', 'Block Sandata submission if units exceed authorization', false)
ON CONFLICT (key) DO NOTHING;

-- Earned Overtime Configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('eo_weekend_accrual_rate', '0.5', 'EO accrual rate for weekend shifts (0.5 = 50% of hours worked)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('eo_holiday_accrual_rate', '1.0', 'EO accrual rate for holiday shifts (1.0 = 100% of hours worked)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('eo_long_shift_threshold_hours', '10.0', 'Minimum hours for a shift to qualify as "long shift"', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('eo_long_shift_accrual_rate', '0.5', 'EO accrual rate for long shifts (0.5 = 50%)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('eo_payout_frequency', '"quarterly"', 'EO payout frequency: "monthly", "quarterly", "annually", "on_demand"', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('eo_minimum_payout_hours', '8.0', 'Minimum accrued EO hours required before payout', false)
ON CONFLICT (key) DO NOTHING;

-- On-Call Configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('oncall_default_ack_sla_minutes', '15', 'Default SLA for acknowledging on-call incidents (minutes)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('oncall_default_resolution_sla_minutes', '60', 'Default SLA for resolving on-call incidents (minutes)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('oncall_auto_escalation_enabled', 'true', 'Enable automatic escalation if SLA exceeded', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('oncall_escalation_timeout_minutes', '15', 'Minutes before escalating to backup/next level', false)
ON CONFLICT (key) DO NOTHING;

-- Policy Center Configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('policy_signoff_grace_period_days', '7', 'Days staff have to sign off on new policies', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('policy_reminder_frequency_days', '3', 'Send reminder every X days for unsigned policies', false)
ON CONFLICT (key) DO NOTHING;

-- Data Retention Configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('retention_evv_records_days', '2555', 'EVV records retention period (7 years for HIPAA)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('retention_claims_days', '2555', 'Claims retention period (7 years)', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('retention_archive_to_glacier_after_days', '365', 'Move records to S3 Glacier after X days (1 year)', false)
ON CONFLICT (key) DO NOTHING;

-- Audit Chain Configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('audit_chain_hash_algorithm', '"sha256"', 'Hash algorithm for audit chain: "sha256", "sha512"', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('audit_chain_verification_frequency', '"weekly"', 'Verification frequency: "daily", "weekly", "monthly"', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('audit_chain_alert_on_mismatch', 'true', 'Send critical alert if hash chain verification fails', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Feature Flag Summary (for documentation)
-- ============================================================================

COMMENT ON COLUMN system_config.key IS 'Configuration key - use feature flags for toggleable functionality';
COMMENT ON COLUMN system_config.value IS 'JSONB value - use "true"/"false" strings for boolean flags';

-- Create view for easier feature flag querying
CREATE OR REPLACE VIEW feature_flags AS
SELECT
  key,
  (value::TEXT)::BOOLEAN AS enabled,
  description,
  updated_at
FROM system_config
WHERE key IN (
  'site_careers_enabled',
  'site_referral_form_enabled',
  'pods_enabled',
  'earned_overtime_enabled',
  'oncall_enabled',
  'policy_center_enabled',
  'retention_enforcement_enabled',
  'audit_chain_verification_enabled',
  'alt_evv_enabled',
  'sandata_submissions_enabled',
  'sandata_sandbox_mode',
  'claims_gate_enabled',
  'ai_evvaffect_dualapproval_required',
  'ai_guardrails_enabled'
)
ORDER BY key;

COMMENT ON VIEW feature_flags IS 'Consolidated view of all Manifesto v2.3 feature flags';

-- ============================================================================
-- Verification Query
-- Run this to verify all flags are seeded correctly:
-- SELECT * FROM feature_flags;
-- ============================================================================

-- ============================================================================
-- Seed Complete
-- Version: 003
-- Date: 2025-11-03
-- Total Flags: 14
-- Total Config Values: 27
-- All feature flags default to FALSE (OFF) except AI safety flags
-- ============================================================================
