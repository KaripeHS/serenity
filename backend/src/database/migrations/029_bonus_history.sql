-- Migration: Create bonus_history table
-- Description: Tracks specific bonus payouts to prevent duplicates and audit policy compliance

CREATE TABLE IF NOT EXISTS bonus_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id),
    bonus_type VARCHAR(50) NOT NULL, -- '90_day', 'show_up', 'hours', 'loyalty'
    amount DECIMAL(10, 2) NOT NULL,
    period VARCHAR(50) NOT NULL, -- 'HIRE-90', '2025-Q1', 'ANNIVERSARY-1'
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bonus_history_caregiver_type ON bonus_history(caregiver_id, bonus_type, period);
