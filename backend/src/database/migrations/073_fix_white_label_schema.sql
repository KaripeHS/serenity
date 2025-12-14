/**
 * Fix White-Label Schema Mismatches
 * Adds missing columns to branding_configs and restructures feature_flags
 */

-- Drop and recreate branding_configs with correct columns
DROP TABLE IF EXISTS branding_configs CASCADE;

CREATE TABLE branding_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  company_name VARCHAR(255),
  logo_url TEXT,
  favicon_url TEXT,
  colors JSONB,
  fonts JSONB,
  terminology JSONB,
  email_templates JSONB,
  custom_css TEXT,
  custom_domain VARCHAR(255),
  email_from_name VARCHAR(255),
  email_from_address VARCHAR(255),
  support_email VARCHAR(255),
  support_phone VARCHAR(20),
  terms_url TEXT,
  privacy_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branding_org ON branding_configs(organization_id);

-- Drop and recreate feature_flags with JSONB structure
DROP TABLE IF EXISTS feature_flags CASCADE;

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  features JSONB DEFAULT '{
    "mlForecasting": false,
    "scheduleOptimization": false,
    "voiceToText": false,
    "biDashboard": false,
    "payrollIntegrations": false,
    "ehrIntegration": false,
    "mobileApp": true,
    "webSocketRealtime": true,
    "advancedReporting": false,
    "apiAccess": false,
    "multiStateCompliance": false,
    "whiteLabel": false,
    "customIntegrations": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_org ON feature_flags(organization_id);

COMMENT ON TABLE branding_configs IS 'White-label branding configurations per organization';
COMMENT ON TABLE feature_flags IS 'Feature flags for per-organization feature control (JSONB format)';
