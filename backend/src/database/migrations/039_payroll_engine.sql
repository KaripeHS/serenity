-- Migration: Payroll Engine
-- Description: Tables for Pay Rates and Payroll Processing

-- 1. Pay Rates (Configurable per employee)
CREATE TABLE IF NOT EXISTS pay_rates (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rate_type VARCHAR(50) NOT NULL, -- 'visit_sn', 'visit_pt', 'visit_aide', 'hourly', 'mileage'
    amount DECIMAL(10, 2) NOT NULL,
    effective_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, rate_type) -- Simple current-rate model for now
);

-- 2. Payroll Runs (Header for a pay period)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'posted', 'paid'
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    posted_at TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- 3. Payroll Items (Line items)
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    
    type VARCHAR(50) NOT NULL, -- 'visit', 'hourly', 'mileage', 'bonus'
    description TEXT,
    
    quantity DECIMAL(10, 2) DEFAULT 0, -- hours, miles, or 1 (for visit/bonus)
    rate DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    reference_id UUID, -- Links to visits.id or bonus_history.id
    gl_account_id UUID, -- Link to chart_of_accounts (Cost)
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pay_rates_user ON pay_rates(user_id);
CREATE INDEX idx_payroll_runs_org ON payroll_runs(organization_id, status);
CREATE INDEX idx_payroll_items_run ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_user ON payroll_items(user_id); -- Removed invalid reference to period_start
