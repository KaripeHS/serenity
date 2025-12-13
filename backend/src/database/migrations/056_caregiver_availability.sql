-- Migration: 056_caregiver_availability.sql
-- Caregiver Availability and Time-Off Management
-- Supports scheduling optimization and coverage planning

-- ============================================
-- AVAILABILITY PATTERNS TABLE (Weekly recurring)
-- ============================================

CREATE TABLE IF NOT EXISTS caregiver_availability_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Effective dates
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE, -- NULL = indefinitely

  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Time windows (can have multiple per day)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Availability type
  availability_type VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (availability_type IN ('available', 'preferred', 'limited', 'unavailable')),

  -- Constraints
  max_hours_per_day DECIMAL(4,2), -- Max hours willing to work this day
  max_clients_per_day INTEGER, -- Max different clients

  -- Preferences
  preferred_areas TEXT[], -- Zip codes or areas
  avoid_clients UUID[], -- Client IDs to avoid (personality conflicts, etc.)

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_window CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_avail_pattern_user ON caregiver_availability_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_avail_pattern_day ON caregiver_availability_patterns(day_of_week);
CREATE INDEX IF NOT EXISTS idx_avail_pattern_effective ON caregiver_availability_patterns(effective_from, effective_until);

-- ============================================
-- TIME OFF REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Request details
  request_type VARCHAR(30) NOT NULL
    CHECK (request_type IN ('vacation', 'sick', 'personal', 'bereavement', 'jury_duty', 'medical', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- For partial day requests
  end_time TIME,
  is_full_day BOOLEAN DEFAULT true,

  -- Approval workflow
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'withdrawn')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Impact analysis (populated by system)
  affected_shifts INTEGER DEFAULT 0,
  coverage_status VARCHAR(20) DEFAULT 'not_analyzed'
    CHECK (coverage_status IN ('not_analyzed', 'covered', 'partial', 'uncovered')),

  -- Hours tracking
  hours_requested DECIMAL(5,2),
  hours_type VARCHAR(20) DEFAULT 'pto'
    CHECK (hours_type IN ('pto', 'sick', 'unpaid', 'comp_time', 'holiday')),

  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_time_off_user ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_dates ON time_off_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_org ON time_off_requests(organization_id);

-- ============================================
-- AVAILABILITY OVERRIDES TABLE (One-time changes)
-- ============================================

CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Specific date override
  override_date DATE NOT NULL,

  -- Override type
  override_type VARCHAR(20) NOT NULL
    CHECK (override_type IN ('available', 'unavailable', 'limited', 'extended')),

  -- Time window (if not full day)
  start_time TIME,
  end_time TIME,
  is_full_day BOOLEAN DEFAULT true,

  -- Reason
  reason VARCHAR(200),
  notes TEXT,

  -- Linked to time-off request if applicable
  time_off_request_id UUID REFERENCES time_off_requests(id),

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avail_override_user_date ON availability_overrides(user_id, override_date);

-- ============================================
-- WORK PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS caregiver_work_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- Hours preferences
  min_hours_per_week DECIMAL(4,2) DEFAULT 0,
  max_hours_per_week DECIMAL(4,2) DEFAULT 40,
  preferred_hours_per_week DECIMAL(4,2),

  -- Shift preferences
  preferred_shift_length_hours DECIMAL(4,2) DEFAULT 4,
  min_shift_length_hours DECIMAL(4,2) DEFAULT 2,
  max_shift_length_hours DECIMAL(4,2) DEFAULT 8,
  max_shifts_per_day INTEGER DEFAULT 3,

  -- Travel preferences
  max_travel_distance_miles DECIMAL(5,2) DEFAULT 25,
  has_reliable_transportation BOOLEAN DEFAULT true,
  transportation_type VARCHAR(50), -- 'own_car', 'public_transit', 'rideshare'

  -- Client preferences
  preferred_client_types TEXT[], -- 'elderly', 'pediatric', 'dementia', etc.
  languages_spoken TEXT[] DEFAULT ARRAY['en'],

  -- Scheduling preferences
  prefers_consistent_clients BOOLEAN DEFAULT true,
  ok_with_last_minute BOOLEAN DEFAULT false,
  ok_with_overtime BOOLEAN DEFAULT true,
  ok_with_weekends BOOLEAN DEFAULT true,
  ok_with_holidays BOOLEAN DEFAULT false,

  -- Communication preferences
  preferred_contact_method VARCHAR(20) DEFAULT 'app'
    CHECK (preferred_contact_method IN ('app', 'sms', 'call', 'email')),
  contact_for_extra_shifts BOOLEAN DEFAULT true,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AVAILABILITY CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_caregiver_availability(
  p_user_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  is_available BOOLEAN,
  availability_type VARCHAR(20),
  conflict_reason TEXT
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_override RECORD;
  v_time_off RECORD;
  v_pattern RECORD;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Check for approved time-off first
  SELECT * INTO v_time_off
  FROM time_off_requests
  WHERE user_id = p_user_id
    AND status = 'approved'
    AND p_date BETWEEN start_date AND end_date;

  IF FOUND THEN
    RETURN QUERY SELECT false, 'unavailable'::VARCHAR(20), 'Approved time off: ' || v_time_off.request_type;
    RETURN;
  END IF;

  -- Check for overrides
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE user_id = p_user_id
    AND override_date = p_date
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_override.override_type = 'unavailable' THEN
      RETURN QUERY SELECT false, 'unavailable'::VARCHAR(20), 'Override: ' || COALESCE(v_override.reason, 'Unavailable');
      RETURN;
    ELSIF v_override.override_type = 'available' OR v_override.override_type = 'extended' THEN
      -- Check time overlap
      IF v_override.is_full_day OR (p_start_time >= v_override.start_time AND p_end_time <= v_override.end_time) THEN
        RETURN QUERY SELECT true, v_override.override_type, NULL::TEXT;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Check regular patterns
  SELECT * INTO v_pattern
  FROM caregiver_availability_patterns
  WHERE user_id = p_user_id
    AND day_of_week = v_day_of_week
    AND effective_from <= p_date
    AND (effective_until IS NULL OR effective_until >= p_date)
    AND availability_type IN ('available', 'preferred')
    AND p_start_time >= start_time
    AND p_end_time <= end_time
  ORDER BY
    CASE availability_type WHEN 'preferred' THEN 1 ELSE 2 END
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_pattern.availability_type, NULL::TEXT;
    RETURN;
  END IF;

  -- Check if there's any pattern for this day (but time doesn't match)
  SELECT * INTO v_pattern
  FROM caregiver_availability_patterns
  WHERE user_id = p_user_id
    AND day_of_week = v_day_of_week
    AND effective_from <= p_date
    AND (effective_until IS NULL OR effective_until >= p_date)
  LIMIT 1;

  IF FOUND THEN
    IF v_pattern.availability_type = 'unavailable' THEN
      RETURN QUERY SELECT false, 'unavailable'::VARCHAR(20), 'Not available on ' || TO_CHAR(p_date, 'Day');
    ELSE
      RETURN QUERY SELECT false, 'limited'::VARCHAR(20), 'Time outside availability window';
    END IF;
    RETURN;
  END IF;

  -- No pattern found - assume unavailable
  RETURN QUERY SELECT false, 'unknown'::VARCHAR(20), 'No availability pattern defined';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- WEEKLY AVAILABILITY VIEW
-- ============================================

CREATE OR REPLACE VIEW caregiver_weekly_availability AS
SELECT
  u.id as user_id,
  u.organization_id,
  u.first_name || ' ' || u.last_name as name,
  COALESCE(
    json_agg(
      json_build_object(
        'day', cap.day_of_week,
        'start', cap.start_time,
        'end', cap.end_time,
        'type', cap.availability_type
      )
    ) FILTER (WHERE cap.id IS NOT NULL),
    '[]'::json
  ) as availability_slots,
  cwp.min_hours_per_week,
  cwp.max_hours_per_week,
  cwp.preferred_hours_per_week,
  cwp.max_travel_distance_miles
FROM users u
LEFT JOIN caregiver_availability_patterns cap ON cap.user_id = u.id
  AND cap.effective_from <= CURRENT_DATE
  AND (cap.effective_until IS NULL OR cap.effective_until >= CURRENT_DATE)
LEFT JOIN caregiver_work_preferences cwp ON cwp.user_id = u.id
WHERE u.role = 'caregiver'
  AND u.is_active = true
GROUP BY u.id, u.organization_id, u.first_name, u.last_name,
         cwp.min_hours_per_week, cwp.max_hours_per_week,
         cwp.preferred_hours_per_week, cwp.max_travel_distance_miles;

-- ============================================
-- UPCOMING TIME-OFF VIEW
-- ============================================

CREATE OR REPLACE VIEW upcoming_time_off AS
SELECT
  tor.id,
  tor.organization_id,
  tor.user_id,
  u.first_name || ' ' || u.last_name as employee_name,
  tor.request_type,
  tor.start_date,
  tor.end_date,
  tor.is_full_day,
  tor.status,
  tor.affected_shifts,
  tor.coverage_status,
  tor.end_date - tor.start_date + 1 as days_requested,
  tor.start_date - CURRENT_DATE as days_until_start
FROM time_off_requests tor
JOIN users u ON u.id = tor.user_id
WHERE tor.status IN ('pending', 'approved')
  AND tor.end_date >= CURRENT_DATE
ORDER BY tor.start_date;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE caregiver_availability_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_work_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE caregiver_availability_patterns IS 'Recurring weekly availability patterns for caregivers';
COMMENT ON TABLE time_off_requests IS 'Time-off requests with approval workflow';
COMMENT ON TABLE availability_overrides IS 'One-time overrides to regular availability patterns';
COMMENT ON TABLE caregiver_work_preferences IS 'Work and scheduling preferences for caregivers';
COMMENT ON FUNCTION check_caregiver_availability IS 'Check if a caregiver is available for a specific date/time';
