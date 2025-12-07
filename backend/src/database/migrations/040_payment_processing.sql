
-- Payment Processing Schema

-- 1. Payment Methods (Tokenized/Safe Storage references)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id), -- The payer (Client or Family Member)
    type VARCHAR(50) NOT NULL, -- 'card', 'ach'
    provider_id VARCHAR(255) NOT NULL, -- Stripe PaymentMethod ID (pm_...)
    last4 VARCHAR(4),
    brand VARCHAR(50), -- 'Visa', 'Bank of America'
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Payments (Transaction Record)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    bill_id UUID REFERENCES bills(id), -- Optional link to a specific Bill/Invoice
    user_id UUID NOT NULL REFERENCES users(id),
    
    amount DECIMAL(12, 2) NOT NULL, -- Base amount applied to bill
    fee_amount DECIMAL(12, 2) DEFAULT 0.00, -- Processing fee charged
    total_charged DECIMAL(12, 2) NOT NULL, -- Total deduction from payer
    
    method VARCHAR(50) NOT NULL, -- 'card', 'ach', 'check', 'zelle', 'cash'
    status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
    
    provider_transaction_id VARCHAR(255), -- Stripe PaymentIntent ID or Check #
    notes TEXT,
    
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payments_org_date ON payments(organization_id, created_at);
CREATE INDEX idx_payments_user ON payments(user_id);
