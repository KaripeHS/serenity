-- Migration: Break-Glass Protocol
-- Description: Adds table to track emergency access requests (Break-Glass)

CREATE TABLE IF NOT EXISTS break_glass_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can't have multiple active requests for the same patient? 
    -- Actually, maybe they can extend it. But let's index for quick lookup.
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_break_glass_user_client ON break_glass_requests(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_expires ON break_glass_requests(expires_at);

-- Add 'break_glass' to audit log event types types if we were using an ENUM, 
-- but our audit log uses string for action, so no change needed there.
