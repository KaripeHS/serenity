-- Migration: 026_referral_partners.sql
-- Description: Create table for tracking referral partners (Wealth Managers, Attorneys, Doctors)

CREATE TABLE IF NOT EXISTS referral_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    type VARCHAR(50) NOT NULL, -- 'wealth_manager', 'estate_attorney', 'physician', 'hospital_case_manager', 'other'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'pending', 'inactive'
    commission_rate DECIMAL(5, 2) DEFAULT 0.00, -- Percentage commission if applicable
    agreement_signed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add partner_id to leads table to link referrals
ALTER TABLE leads 
ADD COLUMN partner_id UUID REFERENCES referral_partners(id);

-- Index for searching
CREATE INDEX idx_partners_email ON referral_partners(email);
CREATE INDEX idx_partners_type ON referral_partners(type);
CREATE INDEX idx_leads_partner_id ON leads(partner_id);

-- Trigger to update updated_at
CREATE TRIGGER update_partners_timestamp
BEFORE UPDATE ON referral_partners
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at(); -- Reusing the function from leads migration
