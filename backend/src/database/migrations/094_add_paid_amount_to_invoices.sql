-- 094_add_paid_amount_to_invoices.sql
-- Add paid_amount to invoices

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;
