-- Migration: Create financial_transactions table
-- Description: Tracks bonuses and other payouts for financial safeguards

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    caregiver_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'bonus', 'overtime', 'adjustment'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_financial_transactions_org_date ON financial_transactions(organization_id, created_at);
CREATE INDEX idx_financial_transactions_caregiver ON financial_transactions(caregiver_id);
