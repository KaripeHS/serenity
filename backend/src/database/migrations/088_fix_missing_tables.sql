-- Migration: 088_fix_missing_tables.sql
-- Description: Creates missing audit_log table and aligns client_leads schema with service expectations.

-- 1. Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID, -- Nullable for system-level actions
    user_id UUID,        -- Nullable for system-level actions
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    
    -- Hash Chain columns (from 020_audit_chain_verification.sql expectation)
    previous_hash VARCHAR(64),
    current_hash VARCHAR(64),
    hash_algorithm VARCHAR(20) DEFAULT 'sha256',
    verified_at TIMESTAMPTZ,
    verification_status VARCHAR(50),
    chain_position BIGINT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- 2. Fix client_leads schema
-- Rename 'leads' to 'client_leads' if it exists (from 025_private_client_leads.sql)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads RENAME TO client_leads;
  END IF;
END
$$;

-- Create client_leads if it still doesn't exist
CREATE TABLE IF NOT EXISTS client_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- references organizations(id), but allow creating without constraint if org table issue
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new',
    referral_source VARCHAR(100), -- Matches forecast service expectation
    service_type_interest VARCHAR(100),
    budget_range VARCHAR(100),
    urgency VARCHAR(50),
    notes TEXT,
    
    -- Dates
    first_contact_date TIMESTAMPTZ,
    last_contact_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix columns if table existed but had old schema
DO $$
BEGIN
    -- Rename source -> referral_source if exists and target doesn't
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'source') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'referral_source') THEN
            ALTER TABLE client_leads RENAME COLUMN source TO referral_source;
        END IF;
    END IF;

    -- NEW: Rename service_interest -> service_type_interest if exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'service_interest') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'service_type_interest') THEN
            ALTER TABLE client_leads RENAME COLUMN service_interest TO service_type_interest;
        END IF;
    END IF;

    -- Add organization_id if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'organization_id') THEN
        ALTER TABLE client_leads ADD COLUMN organization_id UUID;
    END IF;

    -- Add missing date columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'first_contact_date') THEN
        ALTER TABLE client_leads ADD COLUMN first_contact_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'last_contact_date') THEN
        ALTER TABLE client_leads ADD COLUMN last_contact_date TIMESTAMPTZ;
    END IF;
     IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'budget_range') THEN
        ALTER TABLE client_leads ADD COLUMN budget_range VARCHAR(100);
    END IF;
    -- Add urgency if missing
     IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'urgency') THEN
        ALTER TABLE client_leads ADD COLUMN urgency VARCHAR(50);
    END IF;

    -- FIX: Ensure first_name and last_name exist (if old table didn't have them)
     IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'first_name') THEN
        ALTER TABLE client_leads ADD COLUMN first_name VARCHAR(100);
    END IF;
     IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'last_name') THEN
        ALTER TABLE client_leads ADD COLUMN last_name VARCHAR(100);
    END IF;
END
$$;

-- 3. Fix audit_log schema
-- Ensure 'success' column exists if table was created by older migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'success') THEN
        ALTER TABLE audit_log ADD COLUMN success BOOLEAN DEFAULT TRUE;
    END IF;
END
$$;
