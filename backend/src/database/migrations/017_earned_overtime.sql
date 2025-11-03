-- ============================================================================
-- Earned Overtime (EO) Management Migration
-- Serenity ERP - Caregiver Earned Overtime Accrual & Tracking
-- Phase 0-1: Earned Overtime for hourly caregivers (informational only)
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Earned Overtime Accruals Table
-- Tracks EO hours earned by caregivers based on shift classifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS earned_overtime_accruals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Employee relationship
  employee_id UUID NOT NULL, -- References users(id)
  organization_id UUID NOT NULL, -- For RLS

  -- Shift relationship
  shift_id UUID, -- References shifts(id) - nullable for manual adjustments
  evv_record_id UUID, -- References evv_records(id) - link to actual service delivery

  -- Accrual details
  accrual_date DATE NOT NULL,
  shift_classification VARCHAR(50), -- 'weekend', 'holiday', 'overnight', 'long_shift', 'manual'
  hours_worked DECIMAL(5,2) NOT NULL,
  accrual_hours DECIMAL(5,2) NOT NULL, -- EO hours earned

  -- Accrual rate (snapshot at time of accrual)
  accrual_rate DECIMAL(5,4), -- e.g., 0.5 for 50%, 1.0 for 100%
  accrual_reason TEXT, -- Human-readable explanation

  -- Payout tracking
  is_paid_out BOOLEAN DEFAULT FALSE,
  paid_out_at TIMESTAMPTZ,
  payroll_period_id UUID, -- Link to payroll period if exists
  payroll_reference VARCHAR(100), -- External payroll system reference

  -- Adjustment tracking
  is_adjustment BOOLEAN DEFAULT FALSE,
  adjustment_reason TEXT,
  adjusted_by UUID, -- References users(id)

  -- Status
  status VARCHAR(50) DEFAULT 'accrued', -- 'accrued', 'pending_payout', 'paid', 'cancelled'

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- References users(id)

  CONSTRAINT earned_overtime_status_check CHECK (
    status IN ('accrued', 'pending_payout', 'paid', 'cancelled')
  ),
  CONSTRAINT earned_overtime_hours_positive CHECK (
    hours_worked > 0 AND accrual_hours >= 0
  )
);

-- Indexes for earned_overtime_accruals
CREATE INDEX idx_eo_accruals_employee ON earned_overtime_accruals(employee_id);
CREATE INDEX idx_eo_accruals_org ON earned_overtime_accruals(organization_id);
CREATE INDEX idx_eo_accruals_shift ON earned_overtime_accruals(shift_id) WHERE shift_id IS NOT NULL;
CREATE INDEX idx_eo_accruals_date ON earned_overtime_accruals(accrual_date DESC);
CREATE INDEX idx_eo_accruals_unpaid ON earned_overtime_accruals(is_paid_out, employee_id) WHERE is_paid_out = FALSE;
CREATE INDEX idx_eo_accruals_status ON earned_overtime_accruals(status);
CREATE INDEX idx_eo_accruals_payroll_period ON earned_overtime_accruals(payroll_period_id) WHERE payroll_period_id IS NOT NULL;

-- ============================================================================
-- Earned Overtime Configuration Table
-- Defines EO eligibility and accrual rules per organization
-- ============================================================================

CREATE TABLE IF NOT EXISTS earned_overtime_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE, -- One config per org

  -- Eligibility
  enabled BOOLEAN DEFAULT FALSE,
  eligible_roles TEXT[] DEFAULT ARRAY['caregiver'], -- Roles eligible for EO
  eligible_employee_types TEXT[] DEFAULT ARRAY['hourly'], -- 'hourly', 'part_time', 'full_time'
  minimum_tenure_days INTEGER DEFAULT 90, -- Must be employed for X days

  -- Accrual rates by shift classification
  weekend_accrual_rate DECIMAL(5,4) DEFAULT 0.5, -- 50% of hours worked
  holiday_accrual_rate DECIMAL(5,4) DEFAULT 1.0, -- 100% of hours worked
  overnight_accrual_rate DECIMAL(5,4) DEFAULT 0.25, -- 25% for overnight shifts
  long_shift_accrual_rate DECIMAL(5,4) DEFAULT 0.5, -- 50% for shifts >10 hours
  long_shift_threshold_hours DECIMAL(4,2) DEFAULT 10.0,

  -- Payout policy
  payout_frequency VARCHAR(50) DEFAULT 'quarterly', -- 'monthly', 'quarterly', 'annually', 'on_demand'
  payout_minimum_hours DECIMAL(5,2) DEFAULT 8.0, -- Minimum accrued hours before payout
  auto_payout_enabled BOOLEAN DEFAULT FALSE,
  max_accrual_cap_hours DECIMAL(6,2), -- Max EO hours that can be accrued (NULL = no cap)

  -- Business rules
  require_approval BOOLEAN DEFAULT TRUE,
  approver_role VARCHAR(50) DEFAULT 'hr_manager',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID, -- References users(id)

  CONSTRAINT eo_config_payout_frequency_check CHECK (
    payout_frequency IN ('monthly', 'quarterly', 'annually', 'on_demand', 'never')
  ),
  CONSTRAINT eo_config_rates_valid CHECK (
    weekend_accrual_rate >= 0 AND weekend_accrual_rate <= 2 AND
    holiday_accrual_rate >= 0 AND holiday_accrual_rate <= 2 AND
    overnight_accrual_rate >= 0 AND overnight_accrual_rate <= 2 AND
    long_shift_accrual_rate >= 0 AND long_shift_accrual_rate <= 2
  )
);

-- Index for EO config
CREATE INDEX idx_eo_config_org ON earned_overtime_config(organization_id);

-- ============================================================================
-- Earned Overtime Balance View
-- Real-time balance of accrued vs paid EO hours per employee
-- ============================================================================

CREATE OR REPLACE VIEW earned_overtime_balances AS
SELECT
  employee_id,
  organization_id,
  SUM(CASE WHEN is_paid_out = FALSE AND status = 'accrued' THEN accrual_hours ELSE 0 END) AS unpaid_hours,
  SUM(CASE WHEN is_paid_out = TRUE THEN accrual_hours ELSE 0 END) AS paid_hours,
  SUM(accrual_hours) AS total_hours_earned,
  COUNT(*) FILTER (WHERE is_paid_out = FALSE AND status = 'accrued') AS unpaid_entries,
  MAX(accrual_date) AS last_accrual_date,
  MAX(paid_out_at) AS last_payout_date
FROM earned_overtime_accruals
WHERE status != 'cancelled'
GROUP BY employee_id, organization_id;

COMMENT ON VIEW earned_overtime_balances IS 'Real-time EO balance per employee (accrued vs paid hours)';

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Enable RLS on earned_overtime_accruals
ALTER TABLE earned_overtime_accruals ENABLE ROW LEVEL SECURITY;

-- Employees can see their own accruals
CREATE POLICY eo_accruals_own_access ON earned_overtime_accruals
  FOR SELECT
  USING (employee_id = current_setting('app.current_user_id', true)::UUID);

-- HR/Admin can see all accruals in their org
CREATE POLICY eo_accruals_org_access ON earned_overtime_accruals
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- Enable RLS on earned_overtime_config
ALTER TABLE earned_overtime_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY eo_config_tenant_isolation ON earned_overtime_config
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- Audit Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_eo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eo_accruals_update_timestamp
  BEFORE UPDATE ON earned_overtime_accruals
  FOR EACH ROW
  EXECUTE FUNCTION update_eo_timestamp();

CREATE TRIGGER eo_config_update_timestamp
  BEFORE UPDATE ON earned_overtime_config
  FOR EACH ROW
  EXECUTE FUNCTION update_eo_timestamp();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate EO eligibility for an employee
CREATE OR REPLACE FUNCTION is_employee_eo_eligible(p_employee_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_config RECORD;
  v_employee RECORD;
  v_tenure_days INTEGER;
  v_is_eligible BOOLEAN := FALSE;
BEGIN
  -- Get employee details
  SELECT
    role,
    hire_date,
    organization_id,
    CASE
      WHEN salary IS NOT NULL THEN 'salaried'
      WHEN hourly_rate IS NOT NULL THEN 'hourly'
      ELSE 'unknown'
    END AS employee_type
  INTO v_employee
  FROM users
  WHERE id = p_employee_id;

  -- If employee not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get org EO config
  SELECT * INTO v_config
  FROM earned_overtime_config
  WHERE organization_id = v_employee.organization_id;

  -- If config not found or disabled, return false
  IF NOT FOUND OR v_config.enabled = FALSE THEN
    RETURN FALSE;
  END IF;

  -- Calculate tenure
  v_tenure_days := CURRENT_DATE - v_employee.hire_date;

  -- Check eligibility criteria
  v_is_eligible := (
    v_employee.role::TEXT = ANY(v_config.eligible_roles) AND
    v_employee.employee_type = ANY(v_config.eligible_employee_types) AND
    v_tenure_days >= v_config.minimum_tenure_days
  );

  RETURN v_is_eligible;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate EO accrual for a shift
CREATE OR REPLACE FUNCTION calculate_eo_accrual(
  p_shift_id UUID,
  p_hours_worked DECIMAL
) RETURNS TABLE (
  accrual_hours DECIMAL,
  accrual_rate DECIMAL,
  classification VARCHAR,
  reason TEXT
) AS $$
DECLARE
  v_shift RECORD;
  v_config RECORD;
  v_accrual DECIMAL := 0;
  v_rate DECIMAL := 0;
  v_class VARCHAR;
  v_reason TEXT;
BEGIN
  -- Get shift details
  SELECT
    s.*,
    EXTRACT(DOW FROM s.start_time) AS day_of_week,
    EXTRACT(HOUR FROM (s.end_time - s.start_time)) AS duration_hours
  INTO v_shift
  FROM shifts s
  WHERE s.id = p_shift_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get EO config
  SELECT * INTO v_config
  FROM earned_overtime_config
  WHERE organization_id = v_shift.organization_id;

  IF NOT FOUND OR v_config.enabled = FALSE THEN
    RETURN;
  END IF;

  -- Determine classification (priority order: holiday > weekend > long_shift > overnight)
  -- This is a simplified version - real implementation would check holiday calendar

  -- Check weekend (Saturday=6, Sunday=0)
  IF v_shift.day_of_week IN (0, 6) THEN
    v_rate := v_config.weekend_accrual_rate;
    v_class := 'weekend';
    v_reason := 'Weekend shift';
    v_accrual := p_hours_worked * v_rate;

  -- Check long shift
  ELSIF p_hours_worked >= v_config.long_shift_threshold_hours THEN
    v_rate := v_config.long_shift_accrual_rate;
    v_class := 'long_shift';
    v_reason := 'Long shift (' || p_hours_worked || ' hours)';
    v_accrual := p_hours_worked * v_rate;

  -- Check overnight (starting between 8 PM and 5 AM)
  ELSIF EXTRACT(HOUR FROM v_shift.start_time) >= 20 OR EXTRACT(HOUR FROM v_shift.start_time) <= 5 THEN
    v_rate := v_config.overnight_accrual_rate;
    v_class := 'overnight';
    v_reason := 'Overnight shift';
    v_accrual := p_hours_worked * v_rate;

  ELSE
    -- No EO earned
    RETURN;
  END IF;

  -- Return result
  accrual_hours := v_accrual;
  accrual_rate := v_rate;
  classification := v_class;
  reason := v_reason;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get employee EO summary
CREATE OR REPLACE FUNCTION get_employee_eo_summary(p_employee_id UUID)
RETURNS TABLE (
  total_accrued DECIMAL,
  total_paid DECIMAL,
  current_balance DECIMAL,
  is_eligible BOOLEAN,
  next_payout_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(b.total_hours_earned, 0) AS total_accrued,
    COALESCE(b.paid_hours, 0) AS total_paid,
    COALESCE(b.unpaid_hours, 0) AS current_balance,
    is_employee_eo_eligible(p_employee_id) AS is_eligible,
    -- Next payout calculation would depend on payout_frequency
    NULL::DATE AS next_payout_date
  FROM earned_overtime_balances b
  WHERE b.employee_id = p_employee_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE earned_overtime_accruals IS 'Earned Overtime hours accrued by caregivers based on shift classifications';
COMMENT ON TABLE earned_overtime_config IS 'Organization-specific Earned Overtime eligibility and accrual rules';

COMMENT ON COLUMN earned_overtime_accruals.shift_classification IS 'Type of qualifying shift: weekend, holiday, overnight, long_shift';
COMMENT ON COLUMN earned_overtime_accruals.accrual_hours IS 'EO hours earned (calculated from hours_worked * accrual_rate)';
COMMENT ON COLUMN earned_overtime_accruals.is_paid_out IS 'Whether these EO hours have been paid out';

COMMENT ON COLUMN earned_overtime_config.weekend_accrual_rate IS 'EO accrual rate for weekend shifts (e.g., 0.5 = 50% of hours worked)';
COMMENT ON COLUMN earned_overtime_config.payout_frequency IS 'How often EO hours are paid out: monthly, quarterly, annually, on_demand';

-- ============================================================================
-- Migration Complete
-- Version: 017
-- Date: 2025-11-03
-- ============================================================================
