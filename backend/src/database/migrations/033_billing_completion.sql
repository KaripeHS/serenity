-- ============================================================================
-- Billing Automation Completion Migration
-- Adds missing tables required by BillingService
-- ============================================================================

-- 1. Claims Batches Table
DROP TABLE IF EXISTS credential_service_mappings CASCADE;
DROP TABLE IF EXISTS credentials CASCADE;
DROP TABLE IF EXISTS payment_postings CASCADE;
DROP TABLE IF EXISTS claims_batches CASCADE;

CREATE TABLE IF NOT EXISTS claims_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    payer_name VARCHAR(100) NOT NULL,
    claim_ids JSONB NOT NULL, -- Storing as JSON array of claim IDs
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    claim_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    submission_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    CONSTRAINT valid_batch_status CHECK (status IN ('draft', 'submitted', 'processed', 'paid', 'denied'))
);

CREATE INDEX idx_claims_batches_org ON claims_batches(organization_id);
CREATE INDEX idx_claims_batches_status ON claims_batches(status);

-- 2. Payment Postings Table
CREATE TABLE IF NOT EXISTS payment_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    payment_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    remittance_advice_number VARCHAR(100),
    adjustments JSONB DEFAULT '[]', -- Array of adjustment objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_postings_claim ON payment_postings(claim_id);

-- 3. Caregiver Credentials Table (for validation)
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    credential_type VARCHAR(100) NOT NULL, -- e.g., 'STNA', 'HHA', 'RN'
    status VARCHAR(20) DEFAULT 'active',
    issue_date DATE,
    expiration_date DATE,
    file_path VARCHAR(255),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_credential_status CHECK (status IN ('active', 'expired', 'revoked', 'pending'))
);

CREATE INDEX idx_credentials_user ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(credential_type);
CREATE INDEX idx_credentials_expiration ON credentials(expiration_date);

-- 4. Credential Service Mappings (which credentials authorize which services)
CREATE TABLE IF NOT EXISTS credential_service_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_type VARCHAR(100) NOT NULL,
    service_code VARCHAR(50) NOT NULL, -- e.g., 'T1019'
    payer_id VARCHAR(50), -- Optional: specific to payer rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(credential_type, service_code, payer_id)
);
-- Seed some default mappings
INSERT INTO credential_service_mappings (credential_type, service_code) VALUES
('STNA', 'T1019'), -- Personal Care
('HHA', 'T1019'),
('RN', 'T1019'),
('RN', 'T1001'), -- Nursing Assessment
('LPN', 'T1002'), -- RN Services
('HHA', 'S5125'); -- Attendant Care

-- 5. Add RLS Policies

ALTER TABLE claims_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- Claims Batches RLS
CREATE POLICY claims_batch_org_isolation ON claims_batches
    USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);

-- Credentials RLS
CREATE POLICY credentials_org_isolation ON credentials
    USING (
        organization_id = (current_setting('app.current_organization_id', true))::UUID
        OR user_id = (current_setting('app.current_user_id', true))::UUID
    );
