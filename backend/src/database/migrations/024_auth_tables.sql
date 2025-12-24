-- ============================================================================
-- Authentication Tables Migration
-- Sessions and Password Reset Tokens for JWT Auth
-- ============================================================================

-- Sessions table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Morning check-ins table
CREATE TABLE IF NOT EXISTS morning_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID REFERENCES pods(id),
    check_in_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    check_in_time TIMESTAMP WITH TIME ZONE,
    method VARCHAR(20),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_checkin_date UNIQUE(user_id, check_in_date),
    CONSTRAINT valid_checkin_status CHECK (status IN ('pending', 'available', 'unavailable', 'late', 'absent', 'excused'))
);

CREATE INDEX IF NOT EXISTS idx_morning_checkins_date ON morning_check_ins(check_in_date);
CREATE INDEX IF NOT EXISTS idx_morning_checkins_user ON morning_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_morning_checkins_pod ON morning_check_ins(pod_id);

-- Shifts table (enhanced from visits/shifts in 001)
-- Add columns not present in 001
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'service_code') THEN
        ALTER TABLE shifts ADD COLUMN service_code VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'authorization_number') THEN
        ALTER TABLE shifts ADD COLUMN authorization_number VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'evv_record_id') THEN
        ALTER TABLE shifts ADD COLUMN evv_record_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'created_by') THEN
        ALTER TABLE shifts ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Update status constraint to include new statuses
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS valid_shift_status;
ALTER TABLE shifts ADD CONSTRAINT valid_shift_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'missed', 'cancelled', 'no_show'));

CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_date ON shifts(caregiver_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_shifts_client_date ON shifts(client_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_org_date ON shifts(organization_id, scheduled_start);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    certification_type VARCHAR(50) NOT NULL,
    certification_number VARCHAR(100),
    issuing_authority VARCHAR(200),
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    document_url TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_cert_status CHECK (status IN ('active', 'expired', 'revoked', 'pending_verification'))
);

CREATE INDEX IF NOT EXISTS idx_certifications_user ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiration ON certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON certifications(certification_type);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO feature_flags (key, value, description) VALUES
    ('claims_gate_enabled', false, 'Block claims without Sandata acknowledgment'),
    ('sandata_sandbox_enabled', true, 'Use Sandata sandbox environment'),
    ('morning_checkin_notifications', true, 'Send morning check-in SMS notifications'),
    ('auto_sandata_sync', false, 'Automatically sync to Sandata'),
    ('evv_geofence_enabled', true, 'Require GPS within geofence for clock-in'),
    ('overtime_warnings_enabled', true, 'Show overtime warnings in scheduling')
ON CONFLICT (key) DO NOTHING;

-- Add sandata_employee_id to users if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'sandata_employee_id') THEN
        ALTER TABLE users ADD COLUMN sandata_employee_id VARCHAR(50);
    END IF;
END $$;

-- Add sandata_client_id to clients if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'sandata_client_id') THEN
        ALTER TABLE clients ADD COLUMN sandata_client_id VARCHAR(50);
    END IF;
END $$;

-- Add evv_consent fields to clients if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'evv_consent_status') THEN
        ALTER TABLE clients ADD COLUMN evv_consent_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'evv_consent_date') THEN
        ALTER TABLE clients ADD COLUMN evv_consent_date DATE;
    END IF;
END $$;

COMMIT;
