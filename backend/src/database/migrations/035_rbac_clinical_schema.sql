-- Migration: Advanced RBAC & Clinical Access Architecture
-- Description: Adds tables for licenses, caseloads, and updates users/clients for clinical roles.

-- 1. Create Clinical Role Enum (if not exists, though we might just store as text for flexibility first)
-- We will use the existing 'role' column in users but might need a specific 'clinical_role' for determining licensure level distinct from system access role.
-- Or we enforce that system role = clinical role. Let's add a distinct clinical_role to allow a 'Manager' to also be an 'RN'.

ALTER TABLE users ADD COLUMN IF NOT EXISTS clinical_role VARCHAR(50); -- e.g. 'RN', 'LPN', 'DSP_MED'

-- 2. Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g. 'RN', 'LPN', 'STNA'
    state VARCHAR(2) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, suspended
    verification_source VARCHAR(100), -- e.g. 'Ohio eLicense Center'
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_license UNIQUE (user_id, type, state)
);

-- Index for expiration queries (compliance)
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses(user_id);

-- 3. Patient Acuity Level
ALTER TABLE clients ADD COLUMN IF NOT EXISTS acuity_level VARCHAR(20) DEFAULT 'low'; -- low, medium, high, complex

-- 4. Caseloads Table (Many-to-Many Clinician to Client)
CREATE TABLE IF NOT EXISTS caseloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, covering, discharged
    primary_clinician BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    notes TEXT,
    CONSTRAINT unique_clinician_client UNIQUE (clinician_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_caseloads_clinician ON caseloads(clinician_id);
CREATE INDEX IF NOT EXISTS idx_caseloads_client ON caseloads(client_id);

-- 5. Audit Log for Break-Glass (if not using central audit table)
-- We'll likely use the existing audit_logs but add a specific type 'break_glass'
