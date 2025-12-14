/**
 * Feature Flags
 * Toggle features per organization
 */

CREATE TABLE IF NOT EXISTS feature_flags (
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

COMMENT ON TABLE feature_flags IS 'Feature flags for per-organization feature control';
