-- 102_more_fixes.sql
-- Fix missing columns in audit_events and clients (Round 3)

-- 1. Fix audit_events
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_events' AND column_name = 'outcome') THEN
        ALTER TABLE audit_events ADD COLUMN outcome VARCHAR(50);
    END IF;
END
$$;

-- 2. Fix clients table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') THEN
        ALTER TABLE clients ADD COLUMN created_by UUID;
    END IF;
END
$$;
