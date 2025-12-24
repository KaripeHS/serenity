-- 082_state_compliance_rules.sql

CREATE TABLE IF NOT EXISTS state_compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(2) UNIQUE NOT NULL,
    licensing_requirements JSONB NOT NULL DEFAULT '{}',
    training_requirements JSONB NOT NULL DEFAULT '{}',
    staffing_ratios JSONB NOT NULL DEFAULT '{}',
    wage_rules JSONB NOT NULL DEFAULT '{}',
    background_check_requirements JSONB NOT NULL DEFAULT '{}',
    evv_requirements JSONB NOT NULL DEFAULT '{}',
    medicaid_programs JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_compliance_state ON state_compliance_rules(state);

-- RLS (Admin only usually, or read-only for system)
ALTER TABLE state_compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read state rules" ON state_compliance_rules
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage state rules" ON state_compliance_rules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id', true)::UUID 
            AND role IN ('admin', 'super_admin', 'compliance_officer')
        )
    );
