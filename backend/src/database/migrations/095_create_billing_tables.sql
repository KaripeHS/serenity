-- 095_create_billing_tables.sql
-- Create remaining billing tables: claim_batches, claims, claim_lines
-- Drop tables if they exist to ensure clean state (CASCADE for dependencies)

DROP TABLE IF EXISTS claim_lines CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS claim_batches CASCADE;

CREATE TABLE claim_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) CHECK (status IN ('draft', 'pending', 'submitted', 'processed', 'completed', 'failed')) DEFAULT 'draft',
    total_claims INTEGER DEFAULT 0,
    total_charge_amount DECIMAL(10, 2) DEFAULT 0,
    submission_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    batch_id UUID REFERENCES claim_batches(id),
    client_id UUID REFERENCES clients(id),
    payer_id UUID REFERENCES payers(id),
    claim_number VARCHAR(50) UNIQUE,
    status VARCHAR(20) CHECK (status IN ('draft', 'ready', 'submitted', 'accepted', 'denied', 'paid')) DEFAULT 'draft',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    service_start_date DATE,
    service_end_date DATE,
    diagnosis_codes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE claim_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    service_code VARCHAR(20) NOT NULL,
    description TEXT,
    service_date DATE NOT NULL,
    units DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_batches_org ON claim_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_claims_batch ON claims(batch_id);
CREATE INDEX IF NOT EXISTS idx_claims_client ON claims(client_id);
CREATE INDEX IF NOT EXISTS idx_claim_lines_claim ON claim_lines(claim_id);
