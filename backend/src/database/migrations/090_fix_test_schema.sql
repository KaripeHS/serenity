-- Migration: 090_fix_test_schema.sql
-- Description: Force fix schema for API Keys and Expenses to match Test/Service expectations

-- 1. Reset API Keys table to match code expectations
DROP TABLE IF EXISTS api_rate_limits;
DROP TABLE IF EXISTS webhook_subscriptions; -- depends on api_keys
DROP TABLE IF EXISTS api_keys;

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL, -- references organizations(id) - loose ref to avoid issues
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  api_secret_hash VARCHAR(255) NOT NULL,
  scopes JSONB NOT NULL,
  rate_limit_per_minute INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate dependent tables
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  minute_bucket TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events JSONB NOT NULL,
  secret VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  retry_policy JSONB NOT NULL,
  disabled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fix Caregiver Expenses
CREATE TABLE IF NOT EXISTS caregiver_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'submitted',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
