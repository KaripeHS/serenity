
-- 047_time_off_requests.sql

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    type VARCHAR(50) NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'bereavement', 'other')),
    reason TEXT,
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
    
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_time_off_user ON time_off_requests(user_id);
CREATE INDEX idx_time_off_org_dates ON time_off_requests(organization_id, start_date, end_date);
CREATE INDEX idx_time_off_status ON time_off_requests(status);

-- RLS
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON time_off_requests
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID OR organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Admins can manage all requests" ON time_off_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role IN ('admin', 'super_admin') 
            AND organization_id = time_off_requests.organization_id
        )
    );
