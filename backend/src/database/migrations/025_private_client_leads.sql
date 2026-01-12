-- Migration: 025_private_client_leads.sql
-- Description: Create table for tracking private client leads

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    service_interest VARCHAR(100) NOT NULL, -- '24/7 Care', 'Post-Op', 'Companionship', 'Dementia Care', 'Other'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'assessment_scheduled', 'contract_sent', 'converted', 'lost'
    source VARCHAR(100) NOT NULL DEFAULT 'web', -- 'web', 'referral', 'event', 'other'
    partner_id UUID NULL, -- Optional referral partner
    estimated_value DECIMAL(10, 2), -- Monthly estimated value
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searching/filtering
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_timestamp
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at();
