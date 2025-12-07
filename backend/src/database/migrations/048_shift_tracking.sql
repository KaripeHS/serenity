
-- 048_shift_tracking.sql

-- Add commuter status to shifts
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS commuter_status VARCHAR(20) DEFAULT 'pending' CHECK (commuter_status IN ('pending', 'en_route', 'arrived', 'delayed', 'no_show'));

-- Tracking logs for GPS pings
CREATE TABLE IF NOT EXISTS shift_tracking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    status VARCHAR(20) NOT NULL, -- 'en_route', 'at_location'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy_meters DECIMAL,
    
    source VARCHAR(20) DEFAULT 'web_check_in', -- 'web_check_in', 'sms_link', 'native_app'
    
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tracking_shift ON shift_tracking_logs(shift_id);
CREATE INDEX idx_tracking_time ON shift_tracking_logs(logged_at);

-- RLS
ALTER TABLE shift_tracking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create logs for their shifts" ON shift_tracking_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shifts 
            WHERE id = shift_tracking_logs.shift_id 
            AND caregiver_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view logs" ON shift_tracking_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'coordinator') 
            AND organization_id = shift_tracking_logs.organization_id
        )
    );
