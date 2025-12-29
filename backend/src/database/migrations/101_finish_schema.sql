-- 101_finish_schema.sql
-- Fix missing columns in audit_events and clients

-- 1. Fix audit_events
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_events' AND column_name = 'event_data') THEN
        ALTER TABLE audit_events ADD COLUMN event_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END
$$;

-- 2. Fix clients table (Emergency Contacts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE clients ADD COLUMN emergency_contact_name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE clients ADD COLUMN emergency_contact_phone VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'emergency_contact_relationship') THEN
        ALTER TABLE clients ADD COLUMN emergency_contact_relationship VARCHAR(50);
    END IF;
END
$$;
