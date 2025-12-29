-- Add total_amount to shifts to support client budget triggers
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0.00;
