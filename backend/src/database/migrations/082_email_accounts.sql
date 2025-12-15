-- Email Accounts Configuration Table
-- Stores organization email accounts and their purposes

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Email configuration
  email_address VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  description TEXT,

  -- Purpose/category
  purpose VARCHAR(50) NOT NULL DEFAULT 'general',
  -- Possible purposes: hr, billing, care, support, general, ceo, cfo, coo, marketing

  -- SMTP settings (encrypted password should be stored in environment/secrets)
  smtp_host VARCHAR(255),
  smtp_port INTEGER DEFAULT 465,
  smtp_secure BOOLEAN DEFAULT true,
  smtp_user VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Tracking
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_accounts_org ON email_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_purpose ON email_accounts(purpose);
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(is_active);

-- Ensure only one default email per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_default
  ON email_accounts(organization_id) WHERE is_default = true;
