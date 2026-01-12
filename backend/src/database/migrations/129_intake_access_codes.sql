-- Migration: Intake Access Codes
-- Purpose: Secure access codes for client self-service intake forms
-- Two types:
--   1. Email-based: Unique codes sent via email, one-time use, expire after set time
--   2. Phone-based: Universal codes for clients without email, can be given verbally

-- Table to store intake access codes
CREATE TABLE IF NOT EXISTS intake_access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Code details
    code VARCHAR(20) NOT NULL,
    code_type VARCHAR(20) NOT NULL CHECK (code_type IN ('email', 'phone')),

    -- For email codes: recipient info
    client_email VARCHAR(255),
    client_name VARCHAR(255),
    client_phone VARCHAR(20),

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'used', 'expired', 'revoked')),

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,

    -- Usage tracking
    used_at TIMESTAMPTZ,
    submission_id UUID, -- Links to the intake submission when form is completed

    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Indexes for fast lookups
    CONSTRAINT unique_code_per_org UNIQUE (organization_id, code)
);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_intake_codes_code ON intake_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_intake_codes_org_status ON intake_access_codes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_intake_codes_expires ON intake_access_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_intake_codes_email ON intake_access_codes(client_email);

-- Table to store the universal phone code per organization
CREATE TABLE IF NOT EXISTS intake_phone_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- The universal code staff can give over the phone
    code VARCHAR(20) NOT NULL,

    -- Optional expiration (can rotate periodically)
    expires_at TIMESTAMPTZ,

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT one_phone_code_per_org UNIQUE (organization_id)
);

-- Table to store intake form submissions (links to access codes)
CREATE TABLE IF NOT EXISTS intake_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Link to access code used
    access_code_id UUID REFERENCES intake_access_codes(id),

    -- Reference token shown to client
    reference_token VARCHAR(20) NOT NULL,

    -- Form data (JSON blob)
    form_data JSONB NOT NULL,

    -- Data quality flags from validation
    data_flags JSONB DEFAULT '[]'::jsonb,

    -- Processing status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'imported', 'rejected')),

    -- If imported, link to the created client/patient
    imported_client_id UUID,
    imported_patient_id UUID,

    -- Review/processing info
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_reference_token UNIQUE (organization_id, reference_token)
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_org_status ON intake_submissions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_reference ON intake_submissions(reference_token);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_intake_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS intake_access_codes_updated_at ON intake_access_codes;
CREATE TRIGGER intake_access_codes_updated_at
    BEFORE UPDATE ON intake_access_codes
    FOR EACH ROW EXECUTE FUNCTION update_intake_updated_at();

DROP TRIGGER IF EXISTS intake_phone_codes_updated_at ON intake_phone_codes;
CREATE TRIGGER intake_phone_codes_updated_at
    BEFORE UPDATE ON intake_phone_codes
    FOR EACH ROW EXECUTE FUNCTION update_intake_updated_at();

DROP TRIGGER IF EXISTS intake_submissions_updated_at ON intake_submissions;
CREATE TRIGGER intake_submissions_updated_at
    BEFORE UPDATE ON intake_submissions
    FOR EACH ROW EXECUTE FUNCTION update_intake_updated_at();

-- Insert a default phone code for the main organization
INSERT INTO intake_phone_codes (organization_id, code, expires_at, created_at)
SELECT
    id,
    'SERENITY2025',
    NOW() + INTERVAL '1 year',
    NOW()
FROM organizations
WHERE name ILIKE '%serenity%'
LIMIT 1
ON CONFLICT (organization_id) DO NOTHING;
