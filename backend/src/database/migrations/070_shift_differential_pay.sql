-- ============================================================================
-- Migration 070: Shift Differential Pay Rules
-- Best-in-Class Feature: Configurable shift differentials for weekends,
-- holidays, nights, and skill-based premiums
-- ============================================================================

-- ============================================================================
-- SHIFT DIFFERENTIAL RULES TABLE
-- Configurable rules for automatic pay adjustments based on shift conditions
-- ============================================================================

CREATE TABLE IF NOT EXISTS shift_differential_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Rule identification
  rule_name VARCHAR(255) NOT NULL,
  rule_code VARCHAR(50) UNIQUE, -- e.g., 'WEEKEND', 'HOLIDAY', 'NIGHT', 'DEMENTIA_CARE'
  description TEXT,

  -- Rule type determines how differential is applied
  rule_type VARCHAR(50) NOT NULL,
  -- Types: 'day_of_week', 'time_of_day', 'holiday', 'service_type', 'skill_based', 'client_specific', 'location', 'custom'

  -- Differential amount
  differential_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  -- 'percentage' = add X% to base rate, 'flat' = add $X per hour, 'multiplier' = multiply base * X
  differential_value DECIMAL(10, 4) NOT NULL,
  -- e.g., 0.15 for 15% percentage, 2.50 for $2.50 flat, 1.5 for 1.5x multiplier

  -- Rule conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  /*
    Condition examples by rule_type:

    day_of_week: {
      "days": [0, 6]  // 0=Sunday, 6=Saturday
    }

    time_of_day: {
      "start_time": "18:00",
      "end_time": "06:00",
      "min_hours_in_window": 4  // Optional: must work at least X hours in window
    }

    holiday: {
      "holidays": ["NEW_YEARS_DAY", "MEMORIAL_DAY", "JULY_4TH", "LABOR_DAY", "THANKSGIVING", "CHRISTMAS"],
      "holiday_calendar_id": "uuid"  // Optional: link to org holiday calendar
    }

    service_type: {
      "service_codes": ["T1019_HD", "S5125"],  // Specific service codes
      "service_types": ["dementia_care", "skilled_nursing"]
    }

    skill_based: {
      "required_certifications": ["CNA", "STNA"],
      "required_skills": ["hoyer_lift", "trach_care", "vent_care"]
    }

    client_specific: {
      "client_ids": ["uuid1", "uuid2"],
      "client_tags": ["high_acuity", "behavioral"]
    }

    location: {
      "zip_codes": ["44101", "44102"],
      "regions": ["downtown", "rural"],
      "travel_distance_min_miles": 30
    }

    custom: {
      "expression": "shift.duration > 8 AND client.acuity_score > 7"
    }
  */

  -- Priority for stacking rules
  priority INTEGER DEFAULT 100, -- Lower = higher priority when rules conflict

  -- Stacking behavior
  is_stackable BOOLEAN DEFAULT TRUE, -- Can this combine with other differentials?
  stack_group VARCHAR(50), -- Rules in same group don't stack (take highest)
  max_stack_percent DECIMAL(5, 2), -- Maximum total differential from stacking (NULL = no limit)

  -- Eligibility
  applies_to_roles TEXT[] DEFAULT ARRAY['caregiver'],
  applies_to_employee_types TEXT[] DEFAULT ARRAY['hourly', 'part_time', 'full_time'],
  min_tenure_days INTEGER DEFAULT 0, -- Employee must be employed X days to be eligible

  -- Scheduling
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE, -- NULL = no expiration

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  CONSTRAINT shift_diff_type_check CHECK (
    rule_type IN ('day_of_week', 'time_of_day', 'holiday', 'service_type', 'skill_based', 'client_specific', 'location', 'custom')
  ),
  CONSTRAINT shift_diff_diff_type_check CHECK (
    differential_type IN ('percentage', 'flat', 'multiplier')
  ),
  CONSTRAINT shift_diff_value_positive CHECK (
    differential_value >= 0
  )
);

-- Indexes
CREATE INDEX idx_shift_diff_rules_org ON shift_differential_rules(organization_id);
CREATE INDEX idx_shift_diff_rules_type ON shift_differential_rules(rule_type);
CREATE INDEX idx_shift_diff_rules_active ON shift_differential_rules(is_active, effective_date, expiration_date)
  WHERE is_active = TRUE;
CREATE INDEX idx_shift_diff_rules_priority ON shift_differential_rules(organization_id, priority);
CREATE INDEX idx_shift_diff_rules_code ON shift_differential_rules(rule_code) WHERE rule_code IS NOT NULL;

-- ============================================================================
-- HOLIDAY CALENDARS TABLE
-- Define organization-specific holiday schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS holiday_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  calendar_name VARCHAR(255) NOT NULL,
  calendar_year INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, calendar_name, calendar_year)
);

CREATE TABLE IF NOT EXISTS holiday_calendar_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES holiday_calendars(id) ON DELETE CASCADE,

  holiday_name VARCHAR(100) NOT NULL,
  holiday_code VARCHAR(50), -- e.g., 'NEW_YEARS_DAY', 'CHRISTMAS'
  holiday_date DATE NOT NULL,

  -- Differential multiplier for this specific holiday (overrides rule default)
  differential_multiplier DECIMAL(5, 2), -- NULL = use rule default

  -- Extended holiday handling
  is_observed_date BOOLEAN DEFAULT FALSE, -- Is this the observed date (vs actual)?
  actual_date DATE, -- If observed, what's the actual date?

  UNIQUE(calendar_id, holiday_date)
);

CREATE INDEX idx_holiday_calendars_org ON holiday_calendars(organization_id);
CREATE INDEX idx_holiday_dates_calendar ON holiday_calendar_dates(calendar_id);
CREATE INDEX idx_holiday_dates_date ON holiday_calendar_dates(holiday_date);

-- ============================================================================
-- SHIFT DIFFERENTIAL APPLICATIONS TABLE
-- Tracks when differentials are applied to shifts/payroll
-- ============================================================================

CREATE TABLE IF NOT EXISTS shift_differential_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Shift/Visit reference
  shift_id UUID, -- References shifts or visits
  visit_id UUID,
  evv_record_id UUID,

  -- Payroll reference
  payroll_run_id UUID,
  payroll_item_id UUID,

  -- Employee
  employee_id UUID NOT NULL,

  -- Shift details (snapshot at time of calculation)
  shift_date DATE NOT NULL,
  shift_start_time TIME,
  shift_end_time TIME,
  hours_worked DECIMAL(5, 2) NOT NULL,
  base_hourly_rate DECIMAL(10, 2) NOT NULL,

  -- Applied rules
  differential_rule_id UUID REFERENCES shift_differential_rules(id),
  rule_name VARCHAR(255),
  rule_type VARCHAR(50),

  -- Differential calculation
  differential_type VARCHAR(20), -- 'percentage', 'flat', 'multiplier'
  differential_value DECIMAL(10, 4),
  differential_amount DECIMAL(10, 2) NOT NULL, -- Actual $ amount added

  -- Effective rate after differential
  effective_rate DECIMAL(10, 2) NOT NULL,
  total_differential_pay DECIMAL(10, 2) NOT NULL, -- differential_amount * hours

  -- Stacking info
  stacking_order INTEGER DEFAULT 1, -- Order in which differential was applied
  was_capped BOOLEAN DEFAULT FALSE, -- Was this limited by max_stack_percent?

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'reversed'

  -- Audit
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  paid_at TIMESTAMPTZ,

  CONSTRAINT diff_app_status_check CHECK (
    status IN ('pending', 'approved', 'paid', 'reversed')
  )
);

CREATE INDEX idx_shift_diff_app_org ON shift_differential_applications(organization_id);
CREATE INDEX idx_shift_diff_app_employee ON shift_differential_applications(employee_id);
CREATE INDEX idx_shift_diff_app_shift_date ON shift_differential_applications(shift_date);
CREATE INDEX idx_shift_diff_app_payroll ON shift_differential_applications(payroll_run_id) WHERE payroll_run_id IS NOT NULL;
CREATE INDEX idx_shift_diff_app_rule ON shift_differential_applications(differential_rule_id);
CREATE INDEX idx_shift_diff_app_status ON shift_differential_applications(status);

-- ============================================================================
-- SHIFT DIFFERENTIAL SUMMARY VIEW
-- Dashboard view of differential pay by employee and period
-- ============================================================================

CREATE OR REPLACE VIEW shift_differential_summary AS
SELECT
  sda.organization_id,
  sda.employee_id,
  u.first_name || ' ' || u.last_name AS employee_name,
  DATE_TRUNC('month', sda.shift_date) AS period_month,
  sda.rule_type,
  sda.rule_name,
  COUNT(*) AS application_count,
  SUM(sda.hours_worked) AS total_hours,
  SUM(sda.total_differential_pay) AS total_differential_pay,
  AVG(sda.differential_amount) AS avg_differential_per_hour,
  SUM(sda.hours_worked * sda.base_hourly_rate) AS base_pay,
  SUM(sda.hours_worked * sda.effective_rate) AS total_pay_with_differential
FROM shift_differential_applications sda
JOIN users u ON sda.employee_id = u.id
WHERE sda.status != 'reversed'
GROUP BY
  sda.organization_id,
  sda.employee_id,
  u.first_name,
  u.last_name,
  DATE_TRUNC('month', sda.shift_date),
  sda.rule_type,
  sda.rule_name;

-- ============================================================================
-- SHIFT DIFFERENTIAL DASHBOARD VIEW
-- Organization-wide differential pay metrics
-- ============================================================================

CREATE OR REPLACE VIEW shift_differential_dashboard AS
SELECT
  sda.organization_id,
  DATE_TRUNC('month', sda.shift_date) AS period_month,

  -- Overall metrics
  COUNT(DISTINCT sda.employee_id) AS employees_with_differentials,
  COUNT(*) AS total_differential_applications,
  SUM(sda.hours_worked) AS total_differential_hours,
  SUM(sda.total_differential_pay) AS total_differential_cost,

  -- By rule type
  SUM(CASE WHEN sda.rule_type = 'day_of_week' THEN sda.total_differential_pay ELSE 0 END) AS weekend_differential_cost,
  SUM(CASE WHEN sda.rule_type = 'holiday' THEN sda.total_differential_pay ELSE 0 END) AS holiday_differential_cost,
  SUM(CASE WHEN sda.rule_type = 'time_of_day' THEN sda.total_differential_pay ELSE 0 END) AS night_differential_cost,
  SUM(CASE WHEN sda.rule_type = 'skill_based' THEN sda.total_differential_pay ELSE 0 END) AS skill_differential_cost,
  SUM(CASE WHEN sda.rule_type NOT IN ('day_of_week', 'holiday', 'time_of_day', 'skill_based') THEN sda.total_differential_pay ELSE 0 END) AS other_differential_cost,

  -- Hours by type
  SUM(CASE WHEN sda.rule_type = 'day_of_week' THEN sda.hours_worked ELSE 0 END) AS weekend_hours,
  SUM(CASE WHEN sda.rule_type = 'holiday' THEN sda.hours_worked ELSE 0 END) AS holiday_hours,
  SUM(CASE WHEN sda.rule_type = 'time_of_day' THEN sda.hours_worked ELSE 0 END) AS night_hours,

  -- Base vs differential comparison
  SUM(sda.hours_worked * sda.base_hourly_rate) AS total_base_pay,
  ROUND(
    SUM(sda.total_differential_pay) / NULLIF(SUM(sda.hours_worked * sda.base_hourly_rate), 0) * 100,
    2
  ) AS differential_percent_of_base

FROM shift_differential_applications sda
WHERE sda.status != 'reversed'
GROUP BY
  sda.organization_id,
  DATE_TRUNC('month', sda.shift_date);

-- ============================================================================
-- FUNCTION: Calculate Applicable Differentials for a Shift
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_shift_differentials(
  p_organization_id UUID,
  p_employee_id UUID,
  p_shift_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_service_code VARCHAR DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_base_rate DECIMAL DEFAULT NULL
) RETURNS TABLE (
  rule_id UUID,
  rule_name VARCHAR,
  rule_type VARCHAR,
  differential_type VARCHAR,
  differential_value DECIMAL,
  differential_amount DECIMAL,
  effective_rate DECIMAL,
  priority INTEGER,
  stack_group VARCHAR
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_base_rate DECIMAL;
  v_rule RECORD;
  v_is_holiday BOOLEAN;
  v_hours_in_night_window DECIMAL;
BEGIN
  -- Get day of week (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_shift_date);

  -- Get base rate if not provided
  IF p_base_rate IS NULL THEN
    SELECT amount INTO v_base_rate
    FROM pay_rates
    WHERE user_id = p_employee_id
      AND rate_type = 'hourly'
    ORDER BY effective_date DESC
    LIMIT 1;

    IF v_base_rate IS NULL THEN
      v_base_rate := 15.00; -- Default fallback
    END IF;
  ELSE
    v_base_rate := p_base_rate;
  END IF;

  -- Check if this is a holiday
  SELECT EXISTS (
    SELECT 1 FROM holiday_calendar_dates hcd
    JOIN holiday_calendars hc ON hcd.calendar_id = hc.id
    WHERE hc.organization_id = p_organization_id
      AND hc.is_default = TRUE
      AND hcd.holiday_date = p_shift_date
  ) INTO v_is_holiday;

  -- Loop through applicable rules
  FOR v_rule IN
    SELECT *
    FROM shift_differential_rules sdr
    WHERE sdr.organization_id = p_organization_id
      AND sdr.is_active = TRUE
      AND sdr.effective_date <= p_shift_date
      AND (sdr.expiration_date IS NULL OR sdr.expiration_date > p_shift_date)
    ORDER BY sdr.priority ASC
  LOOP
    -- Check if rule applies based on type
    CASE v_rule.rule_type
      WHEN 'day_of_week' THEN
        IF v_day_of_week = ANY((v_rule.conditions->>'days')::int[]) THEN
          rule_id := v_rule.id;
          rule_name := v_rule.rule_name;
          rule_type := v_rule.rule_type;
          differential_type := v_rule.differential_type;
          differential_value := v_rule.differential_value;

          -- Calculate differential amount
          IF v_rule.differential_type = 'percentage' THEN
            differential_amount := v_base_rate * v_rule.differential_value;
            effective_rate := v_base_rate * (1 + v_rule.differential_value);
          ELSIF v_rule.differential_type = 'flat' THEN
            differential_amount := v_rule.differential_value;
            effective_rate := v_base_rate + v_rule.differential_value;
          ELSIF v_rule.differential_type = 'multiplier' THEN
            differential_amount := v_base_rate * (v_rule.differential_value - 1);
            effective_rate := v_base_rate * v_rule.differential_value;
          END IF;

          priority := v_rule.priority;
          stack_group := v_rule.stack_group;
          RETURN NEXT;
        END IF;

      WHEN 'holiday' THEN
        IF v_is_holiday THEN
          rule_id := v_rule.id;
          rule_name := v_rule.rule_name;
          rule_type := v_rule.rule_type;
          differential_type := v_rule.differential_type;
          differential_value := v_rule.differential_value;

          IF v_rule.differential_type = 'percentage' THEN
            differential_amount := v_base_rate * v_rule.differential_value;
            effective_rate := v_base_rate * (1 + v_rule.differential_value);
          ELSIF v_rule.differential_type = 'flat' THEN
            differential_amount := v_rule.differential_value;
            effective_rate := v_base_rate + v_rule.differential_value;
          ELSIF v_rule.differential_type = 'multiplier' THEN
            differential_amount := v_base_rate * (v_rule.differential_value - 1);
            effective_rate := v_base_rate * v_rule.differential_value;
          END IF;

          priority := v_rule.priority;
          stack_group := v_rule.stack_group;
          RETURN NEXT;
        END IF;

      WHEN 'time_of_day' THEN
        -- Check if shift overlaps with time window
        -- Simplified: just check if start time is in window
        IF p_start_time >= (v_rule.conditions->>'start_time')::TIME
           OR p_start_time <= (v_rule.conditions->>'end_time')::TIME THEN
          rule_id := v_rule.id;
          rule_name := v_rule.rule_name;
          rule_type := v_rule.rule_type;
          differential_type := v_rule.differential_type;
          differential_value := v_rule.differential_value;

          IF v_rule.differential_type = 'percentage' THEN
            differential_amount := v_base_rate * v_rule.differential_value;
            effective_rate := v_base_rate * (1 + v_rule.differential_value);
          ELSIF v_rule.differential_type = 'flat' THEN
            differential_amount := v_rule.differential_value;
            effective_rate := v_base_rate + v_rule.differential_value;
          ELSIF v_rule.differential_type = 'multiplier' THEN
            differential_amount := v_base_rate * (v_rule.differential_value - 1);
            effective_rate := v_base_rate * v_rule.differential_value;
          END IF;

          priority := v_rule.priority;
          stack_group := v_rule.stack_group;
          RETURN NEXT;
        END IF;

      WHEN 'service_type' THEN
        IF p_service_code IS NOT NULL AND
           p_service_code = ANY((v_rule.conditions->>'service_codes')::text[]) THEN
          rule_id := v_rule.id;
          rule_name := v_rule.rule_name;
          rule_type := v_rule.rule_type;
          differential_type := v_rule.differential_type;
          differential_value := v_rule.differential_value;

          IF v_rule.differential_type = 'percentage' THEN
            differential_amount := v_base_rate * v_rule.differential_value;
            effective_rate := v_base_rate * (1 + v_rule.differential_value);
          ELSIF v_rule.differential_type = 'flat' THEN
            differential_amount := v_rule.differential_value;
            effective_rate := v_base_rate + v_rule.differential_value;
          ELSIF v_rule.differential_type = 'multiplier' THEN
            differential_amount := v_base_rate * (v_rule.differential_value - 1);
            effective_rate := v_base_rate * v_rule.differential_value;
          END IF;

          priority := v_rule.priority;
          stack_group := v_rule.stack_group;
          RETURN NEXT;
        END IF;

      ELSE
        -- Skip unsupported rule types for now
        NULL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE shift_differential_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendar_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_differential_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_diff_rules_tenant ON shift_differential_rules
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY holiday_calendars_tenant ON holiday_calendars
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY holiday_dates_tenant ON holiday_calendar_dates
  FOR ALL USING (calendar_id IN (
    SELECT id FROM holiday_calendars
    WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
  ));

CREATE POLICY shift_diff_app_tenant ON shift_differential_applications
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ============================================================================
-- SEED DEFAULT DIFFERENTIAL RULES
-- ============================================================================

-- Note: These will be inserted when an organization is created via the service

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_shift_diff_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shift_diff_rules_update_ts
  BEFORE UPDATE ON shift_differential_rules
  FOR EACH ROW EXECUTE FUNCTION update_shift_diff_timestamp();

CREATE TRIGGER holiday_calendars_update_ts
  BEFORE UPDATE ON holiday_calendars
  FOR EACH ROW EXECUTE FUNCTION update_shift_diff_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE shift_differential_rules IS 'Configurable rules for automatic shift differential pay adjustments';
COMMENT ON TABLE holiday_calendars IS 'Organization-specific holiday calendars for holiday pay calculations';
COMMENT ON TABLE holiday_calendar_dates IS 'Individual holiday dates within a calendar';
COMMENT ON TABLE shift_differential_applications IS 'Records of differential pay applied to specific shifts';

COMMENT ON COLUMN shift_differential_rules.differential_type IS 'How differential is calculated: percentage (add X%), flat (add $X), multiplier (base * X)';
COMMENT ON COLUMN shift_differential_rules.is_stackable IS 'Whether this differential can combine with others';
COMMENT ON COLUMN shift_differential_rules.stack_group IS 'Rules in same group take highest value instead of stacking';

-- ============================================================================
-- Migration Complete: 070_shift_differential_pay.sql
-- ============================================================================
