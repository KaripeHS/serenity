/**
 * White-Label Branding Configurations
 * Allows organizations to customize UI appearance
 */

CREATE TABLE IF NOT EXISTS branding_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  company_name VARCHAR(255),
  logo_url TEXT,
  favicon_url TEXT,
  colors JSONB, -- {primary, secondary, accent, background, text}
  fonts JSONB, -- {heading, body}
  terminology JSONB, -- Custom terminology mappings
  email_templates JSONB, -- Custom email templates
  custom_css TEXT, -- Custom CSS overrides
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

COMMENT ON TABLE branding_configs IS 'White-label branding configurations per organization';
