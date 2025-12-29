-- 091_fix_missing_tables_2.sql
-- Create api_usage table for public API tracking

CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional tracking fields
    user_agent VARCHAR(255),
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
