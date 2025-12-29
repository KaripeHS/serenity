-- 098_fix_schema_final.sql
-- Force recreation of audit_log and client_leads to ensure schema compliance
-- This replaces 097 which might have been skipped

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS client_leads CASCADE;

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    
    -- Hash Chain columns
    previous_hash VARCHAR(64),
    current_hash VARCHAR(64),
    hash_algorithm VARCHAR(20) DEFAULT 'sha256',
    verified_at TIMESTAMPTZ,
    verification_status VARCHAR(50),
    chain_position BIGINT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE TABLE client_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, 
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new',
    referral_source VARCHAR(100),
    service_type_interest VARCHAR(100),
    budget_range VARCHAR(100),
    urgency VARCHAR(50),
    notes TEXT,
    
    first_contact_date TIMESTAMPTZ,
    last_contact_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
