-- Migration: 052_caregiver_bonus_system.sql
-- Purpose: Implement the Serenity Caregiver Bonus Policy
-- Components: 90-Day Bonus, Show Up Bonus (quarterly), Hours Bonus (annual), Loyalty Bonus
-- Based on: Serenity_Caregiver_Bonus_Policy - 12.01.2025.docx

-- =====================================================
-- BONUS CONFIGURATION TABLE
-- Organization-level bonus policy settings
-- =====================================================
CREATE TABLE IF NOT EXISTS bonus_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- 90-Day Bonus Settings
  ninety_day_bonus_amount DECIMAL(10,2) DEFAULT 150.00,
  ninety_day_bonus_enabled BOOLEAN DEFAULT TRUE,

  -- Show Up Bonus Settings (Quarterly)
  show_up_bonus_amount DECIMAL(10,2) DEFAULT 100.00,
  show_up_bonus_enabled BOOLEAN DEFAULT TRUE,
  show_up_shift_threshold DECIMAL(5,2) DEFAULT 95.00, -- Percentage
  show_up_evv_threshold DECIMAL(5,2) DEFAULT 95.00,   -- Percentage

  -- Hours Bonus Settings (Annual, 1% of earnings)
  hours_bonus_percentage DECIMAL(5,4) DEFAULT 0.0100, -- 1%
  hours_bonus_enabled BOOLEAN DEFAULT TRUE,
  hours_bonus_june_payout BOOLEAN DEFAULT TRUE,  -- 50% in June
  hours_bonus_december_payout BOOLEAN DEFAULT TRUE, -- 50% in December

  -- Loyalty Bonus Settings
  loyalty_bonus_enabled BOOLEAN DEFAULT TRUE,
  loyalty_bonus_year_1 DECIMAL(10,2) DEFAULT 200.00,
  loyalty_bonus_year_2 DECIMAL(10,2) DEFAULT 300.00,
  loyalty_bonus_year_3 DECIMAL(10,2) DEFAULT 400.00,
  loyalty_bonus_year_4 DECIMAL(10,2) DEFAULT 400.00,
  loyalty_bonus_year_5_plus DECIMAL(10,2) DEFAULT 500.00,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- =====================================================
-- NO-CALL/NO-SHOW TRACKING
-- Track NCNS incidents for bonus disqualification
-- =====================================================
CREATE TABLE IF NOT EXISTS no_call_no_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),

  -- Incident details
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME NOT NULL,
  incident_type VARCHAR(20) NOT NULL CHECK (incident_type IN ('no_call_no_show', 'late_cancel')),
  -- late_cancel = canceled with <24 hours notice

  -- Resolution
  excused BOOLEAN DEFAULT FALSE,
  excused_reason TEXT,
  excused_by UUID REFERENCES users(id),
  excused_at TIMESTAMPTZ,

  -- Audit
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ncns_caregiver ON no_call_no_shows(caregiver_id);
CREATE INDEX idx_ncns_date ON no_call_no_shows(scheduled_date);
CREATE INDEX idx_ncns_org_date ON no_call_no_shows(organization_id, scheduled_date);

-- =====================================================
-- CLIENT COMPLAINTS TRACKING
-- Track substantiated complaints for bonus disqualification
-- =====================================================
CREATE TABLE IF NOT EXISTS client_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),

  -- Complaint details
  complaint_date DATE NOT NULL,
  complaint_type VARCHAR(50) NOT NULL,
  -- Types: 'tardiness', 'attitude', 'care_quality', 'missed_tasks', 'communication', 'other'
  description TEXT NOT NULL,
  reported_by VARCHAR(100), -- Name of person who reported (client, family member, etc.)
  reported_by_relationship VARCHAR(50), -- 'client', 'family_member', 'case_manager', 'other'

  -- Investigation
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending', 'investigating', 'substantiated', 'unsubstantiated', 'dismissed'
  )),
  investigation_notes TEXT,
  investigated_by UUID REFERENCES users(id),
  investigated_at TIMESTAMPTZ,

  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),

  -- Impact on bonus
  affects_bonus BOOLEAN DEFAULT FALSE, -- Only TRUE if substantiated
  bonus_period_affected VARCHAR(10), -- 'Q1', 'Q2', 'Q3', 'Q4' of affected year

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_caregiver ON client_complaints(caregiver_id);
CREATE INDEX idx_complaints_status ON client_complaints(status);
CREATE INDEX idx_complaints_date ON client_complaints(complaint_date);

-- =====================================================
-- BONUS ELIGIBILITY SNAPSHOTS
-- Calculated eligibility for each bonus period
-- =====================================================
CREATE TABLE IF NOT EXISTS bonus_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Period identification
  bonus_type VARCHAR(20) NOT NULL CHECK (bonus_type IN (
    'ninety_day', 'show_up', 'hours', 'loyalty'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label VARCHAR(20), -- 'Q1 2025', 'Year 2024', 'Day 90', 'Year 3'

  -- Eligibility metrics
  scheduled_shifts INTEGER DEFAULT 0,
  worked_shifts INTEGER DEFAULT 0,
  shift_percentage DECIMAL(5,2), -- worked/scheduled * 100

  total_evv_records INTEGER DEFAULT 0,
  clean_evv_records INTEGER DEFAULT 0,
  evv_percentage DECIMAL(5,2), -- clean/total * 100

  ncns_count INTEGER DEFAULT 0,
  substantiated_complaints INTEGER DEFAULT 0,

  -- For hours bonus
  total_hours_worked DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  calculated_bonus_amount DECIMAL(10,2),

  -- For loyalty bonus
  years_of_service INTEGER,
  anniversary_date DATE,

  -- Eligibility determination
  is_eligible BOOLEAN DEFAULT FALSE,
  disqualification_reasons TEXT[], -- Array of reasons if not eligible
  eligible_amount DECIMAL(10,2),

  -- Calculation metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculated_by VARCHAR(50) DEFAULT 'system', -- 'system' or user_id

  UNIQUE(organization_id, caregiver_id, bonus_type, period_start)
);

CREATE INDEX idx_eligibility_caregiver ON bonus_eligibility(caregiver_id);
CREATE INDEX idx_eligibility_period ON bonus_eligibility(period_start, period_end);
CREATE INDEX idx_eligibility_type ON bonus_eligibility(bonus_type);

-- =====================================================
-- BONUS PAYOUTS
-- Track actual bonus payments
-- =====================================================
CREATE TABLE IF NOT EXISTS bonus_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  eligibility_id UUID REFERENCES bonus_eligibility(id),

  -- Payout details
  bonus_type VARCHAR(20) NOT NULL,
  period_label VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,

  -- Payment tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'scheduled', 'paid', 'cancelled'
  )),
  scheduled_payout_date DATE,
  actual_payout_date DATE,
  payroll_reference VARCHAR(100), -- Reference to payroll system

  -- Approval workflow
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  -- Employment verification (must be employed on payout date)
  employment_verified BOOLEAN DEFAULT FALSE,
  employment_verified_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_caregiver ON bonus_payouts(caregiver_id);
CREATE INDEX idx_payouts_status ON bonus_payouts(status);
CREATE INDEX idx_payouts_date ON bonus_payouts(scheduled_payout_date);

-- =====================================================
-- CLIENT CANCELLATION TRACKING
-- Track client cancellations (don't count against caregiver)
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Cancellation details
  cancelled_by VARCHAR(20) NOT NULL CHECK (cancelled_by IN (
    'client', 'caregiver', 'office', 'emergency'
  )),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Notice tracking (for caregiver cancellations)
  hours_notice DECIMAL(5,2), -- Hours of notice given
  is_late_cancel BOOLEAN DEFAULT FALSE, -- <24 hours notice

  -- Impact
  counts_against_attendance BOOLEAN DEFAULT FALSE,
  -- TRUE only if caregiver cancelled with <24hr notice

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cancellations_shift ON shift_cancellations(shift_id);
CREATE INDEX idx_cancellations_cancelled_by ON shift_cancellations(cancelled_by);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate shift attendance percentage for a period
CREATE OR REPLACE FUNCTION calculate_shift_attendance(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  scheduled_shifts INTEGER,
  worked_shifts INTEGER,
  attendance_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH shift_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE s.status != 'cancelled' OR
        (sc.cancelled_by != 'client' AND sc.cancelled_by != 'office' AND sc.cancelled_by != 'emergency'))
        AS total_scheduled,
      COUNT(*) FILTER (WHERE s.status = 'completed') AS total_worked
    FROM shifts s
    LEFT JOIN shift_cancellations sc ON s.id = sc.shift_id
    WHERE s.caregiver_id = p_caregiver_id
      AND s.scheduled_date BETWEEN p_start_date AND p_end_date
  )
  SELECT
    total_scheduled::INTEGER,
    total_worked::INTEGER,
    CASE
      WHEN total_scheduled > 0 THEN ROUND((total_worked::DECIMAL / total_scheduled) * 100, 2)
      ELSE 0
    END
  FROM shift_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate EVV compliance for a period
CREATE OR REPLACE FUNCTION calculate_evv_compliance(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  total_records INTEGER,
  clean_records INTEGER,
  compliance_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE
      clock_in_time IS NOT NULL AND
      clock_out_time IS NOT NULL AND
      (sandata_status IS NULL OR sandata_status IN ('accepted', 'pending'))
    )::INTEGER AS clean,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE
          clock_in_time IS NOT NULL AND
          clock_out_time IS NOT NULL AND
          (sandata_status IS NULL OR sandata_status IN ('accepted', 'pending'))
        )::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END
  FROM evv_records e
  JOIN shifts s ON e.shift_id = s.id
  WHERE s.caregiver_id = p_caregiver_id
    AND e.visit_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to count NCNS for a period
CREATE OR REPLACE FUNCTION count_ncns(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM no_call_no_shows
    WHERE caregiver_id = p_caregiver_id
      AND scheduled_date BETWEEN p_start_date AND p_end_date
      AND excused = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to count substantiated complaints for a period
CREATE OR REPLACE FUNCTION count_substantiated_complaints(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM client_complaints
    WHERE caregiver_id = p_caregiver_id
      AND complaint_date BETWEEN p_start_date AND p_end_date
      AND status = 'substantiated'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check Show Up Bonus eligibility
CREATE OR REPLACE FUNCTION check_show_up_eligibility(
  p_caregiver_id UUID,
  p_quarter_start DATE,
  p_quarter_end DATE,
  p_shift_threshold DECIMAL DEFAULT 95.00,
  p_evv_threshold DECIMAL DEFAULT 95.00
) RETURNS TABLE (
  is_eligible BOOLEAN,
  shift_percentage DECIMAL,
  evv_percentage DECIMAL,
  ncns_count INTEGER,
  complaints_count INTEGER,
  disqualification_reasons TEXT[]
) AS $$
DECLARE
  v_shift_pct DECIMAL;
  v_evv_pct DECIMAL;
  v_ncns INTEGER;
  v_complaints INTEGER;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_eligible BOOLEAN := TRUE;
BEGIN
  -- Get shift attendance
  SELECT attendance_percentage INTO v_shift_pct
  FROM calculate_shift_attendance(p_caregiver_id, p_quarter_start, p_quarter_end);

  -- Get EVV compliance
  SELECT compliance_percentage INTO v_evv_pct
  FROM calculate_evv_compliance(p_caregiver_id, p_quarter_start, p_quarter_end);

  -- Get NCNS count
  v_ncns := count_ncns(p_caregiver_id, p_quarter_start, p_quarter_end);

  -- Get complaints count
  v_complaints := count_substantiated_complaints(p_caregiver_id, p_quarter_start, p_quarter_end);

  -- Check each criterion
  IF COALESCE(v_shift_pct, 0) < p_shift_threshold THEN
    v_eligible := FALSE;
    v_reasons := array_append(v_reasons, format('Shift attendance %.2f%% below %s%% threshold', v_shift_pct, p_shift_threshold));
  END IF;

  IF COALESCE(v_evv_pct, 0) < p_evv_threshold THEN
    v_eligible := FALSE;
    v_reasons := array_append(v_reasons, format('EVV compliance %.2f%% below %s%% threshold', v_evv_pct, p_evv_threshold));
  END IF;

  IF v_ncns > 0 THEN
    v_eligible := FALSE;
    v_reasons := array_append(v_reasons, format('%s no-call/no-show incident(s)', v_ncns));
  END IF;

  IF v_complaints > 0 THEN
    v_eligible := FALSE;
    v_reasons := array_append(v_reasons, format('%s substantiated complaint(s)', v_complaints));
  END IF;

  RETURN QUERY SELECT v_eligible, v_shift_pct, v_evv_pct, v_ncns, v_complaints, v_reasons;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DEFAULT BONUS CONFIGURATION
-- =====================================================

-- Insert default configuration (will be linked to Serenity org)
INSERT INTO bonus_configurations (
  organization_id,
  ninety_day_bonus_amount,
  show_up_bonus_amount,
  show_up_shift_threshold,
  show_up_evv_threshold,
  hours_bonus_percentage,
  loyalty_bonus_year_1,
  loyalty_bonus_year_2,
  loyalty_bonus_year_3,
  loyalty_bonus_year_4,
  loyalty_bonus_year_5_plus
)
SELECT
  id,
  150.00,  -- 90-day bonus
  100.00,  -- Show up bonus per quarter
  95.00,   -- 95% shift threshold
  95.00,   -- 95% EVV threshold
  0.0100,  -- 1% hours bonus
  200.00,  -- Year 1 loyalty
  300.00,  -- Year 2 loyalty
  400.00,  -- Year 3 loyalty
  400.00,  -- Year 4 loyalty
  500.00   -- Year 5+ loyalty
FROM organizations
WHERE name ILIKE '%serenity%'
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE bonus_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_call_no_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_cancellations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (organization-based)
CREATE POLICY bonus_config_select ON bonus_configurations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM pod_members WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY ncns_select ON no_call_no_shows
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM pod_members WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY complaints_select ON client_complaints
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM pod_members WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY eligibility_select ON bonus_eligibility
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM pod_members WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY payouts_select ON bonus_payouts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM pod_members WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE bonus_configurations IS 'Organization-level bonus policy settings based on Serenity Caregiver Bonus Policy';
COMMENT ON TABLE no_call_no_shows IS 'Track NCNS incidents - disqualifies from Show Up Bonus';
COMMENT ON TABLE client_complaints IS 'Track and investigate client complaints - substantiated complaints disqualify from bonus';
COMMENT ON TABLE bonus_eligibility IS 'Calculated eligibility snapshots for each bonus period';
COMMENT ON TABLE bonus_payouts IS 'Track actual bonus payments and approval workflow';
COMMENT ON TABLE shift_cancellations IS 'Track shift cancellations - client cancellations do NOT count against caregiver';
COMMENT ON FUNCTION check_show_up_eligibility IS 'Check if caregiver meets all Show Up Bonus criteria for a quarter';
