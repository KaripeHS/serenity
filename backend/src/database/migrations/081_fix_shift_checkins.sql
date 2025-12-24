-- 081_fix_shift_checkins.sql

-- Create shift_check_ins table to support application logic
-- This table seems to have been missing or renamed from visit_check_ins
CREATE TABLE IF NOT EXISTS shift_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES users(id), -- Optional denormalization
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_out_latitude DECIMAL(10, 8),
    check_out_longitude DECIMAL(11, 8),
    actual_check_in TIMESTAMP WITH TIME ZONE, -- Alias for check_in_time if needed
    actual_check_out TIMESTAMP WITH TIME ZONE, -- Alias for check_out_time if needed
    notes TEXT,
    tasks_completed TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_check_ins_shift ON shift_check_ins(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_check_ins_caregiver ON shift_check_ins(caregiver_id);

-- Add RLS
ALTER TABLE shift_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_check_ins_user_access ON shift_check_ins
    USING (
        caregiver_id = current_setting('app.current_user_id')::UUID
        OR
        EXISTS (
            SELECT 1 FROM shifts s
            WHERE s.id = shift_check_ins.shift_id
            AND s.organization_id = (SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID)
        )
    );
