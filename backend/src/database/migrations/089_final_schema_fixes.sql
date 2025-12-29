-- Migration: 089_final_schema_fixes.sql
-- Description: Final schema adjustments for E2E tests

-- 1. Ensure client_leads has service_type_interest column
DO $$
BEGIN
    -- Check if we need to rename service_interest -> service_type_interest
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'service_interest') THEN
        ALTER TABLE client_leads RENAME COLUMN service_interest TO service_type_interest;
    END IF;

    -- Ensure the column exists (if it was named service_type_interest initially or renamed above)
    -- If neither exists, add it (fallback)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'service_type_interest') THEN
        ALTER TABLE client_leads ADD COLUMN service_type_interest VARCHAR(100);
    END IF;
END
$$;

-- 2. Ensure total_clients counts work (Organizations must exist)
-- Verify organizations table has id index (it typically does via PRIMARY KEY)
-- No action needed if standard schema is followed.

-- 3. Ensure api_keys is_active column is correct
-- (Already handled by 070_api_keys.sql, just validating no 'active' column exists to confuse us)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'active') THEN
        -- If 'active' exists AND 'is_active' exists, drop 'active' to avoid confusion
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'is_active') THEN
           ALTER TABLE api_keys DROP COLUMN active;
        ELSE
           -- If only 'active' exists, rename it to 'is_active'
           ALTER TABLE api_keys RENAME COLUMN active TO is_active;
        END IF;
    END IF;
END
$$;
