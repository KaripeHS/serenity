-- 103_final_final_fixes.sql
-- Fix timestamp in audit_events and pod_id constraint in clients

-- 1. Fix audit_events
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_events' AND column_name = 'timestamp') THEN
        ALTER TABLE audit_events ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- 2. Fix clients table (pod_id should be nullable)
DO $$
BEGIN
    -- Check if pod_id exists first
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'pod_id') THEN
        ALTER TABLE clients ALTER COLUMN pod_id DROP NOT NULL;
    END IF;
END
$$;
