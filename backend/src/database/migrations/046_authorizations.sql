
-- 046_authorizations.sql

CREATE TABLE IF NOT EXISTS authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES payers(id),
    
    service_code VARCHAR(50) NOT NULL, -- e.g., 'T1019'
    description TEXT,
    
    units_approved INTEGER NOT NULL DEFAULT 0,
    units_used INTEGER NOT NULL DEFAULT 0,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status VARCHAR(20) CHECK (status IN ('active', 'expired', 'pending', 'exhausted')) DEFAULT 'active',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_authorizations_client ON authorizations(client_id);
CREATE INDEX idx_authorizations_expiry ON authorizations(end_date);
CREATE INDEX idx_authorizations_status ON authorizations(status);

-- RLS Policies
ALTER TABLE authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authorizations for their org" ON authorizations
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients 
            WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
        )
    );

CREATE POLICY "Admins can manage authorizations" ON authorizations
    FOR ALL
    USING (
        client_id IN (
            SELECT id FROM clients 
            WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
        )
    );
