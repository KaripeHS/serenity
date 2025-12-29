-- Add medicaid_number to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS medicaid_number VARCHAR(50);
