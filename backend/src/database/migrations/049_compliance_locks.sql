
-- 049_compliance_locks.sql

-- Add verification status to shifts
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'auto_verified', 'manual_verified', 'flagged', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_note TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Index for the Audit Queue
CREATE INDEX idx_shifts_verification ON shifts(organization_id, verification_status);
