-- 092_add_state_to_orgs.sql
-- Add state column to organizations table for multi-state compliance

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS state VARCHAR(2) DEFAULT 'OH'; -- Default to OH for now

-- Update existing records
UPDATE organizations SET state = 'OH' WHERE state IS NULL;
