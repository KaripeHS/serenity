/**
 * Public API Keys
 * API key management for external integrations
 */

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  api_secret_hash VARCHAR(255) NOT NULL,
  scopes JSONB NOT NULL, -- Array of permission scopes
  rate_limit_per_minute INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  minute_bucket TIMESTAMPTZ NOT NULL, -- Truncated to minute
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_rate_limits_key_bucket ON api_rate_limits(api_key_id, minute_bucket);

COMMENT ON TABLE api_keys IS 'API keys for external API access';
COMMENT ON TABLE api_rate_limits IS 'Rate limiting tracking per API key';
