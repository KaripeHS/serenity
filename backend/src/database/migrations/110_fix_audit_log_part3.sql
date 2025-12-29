-- 110_fix_audit_log_part3.sql
-- Fix audit_log schema (missing event_data)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'event_data') THEN
        ALTER TABLE audit_log ADD COLUMN event_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END
$$;
