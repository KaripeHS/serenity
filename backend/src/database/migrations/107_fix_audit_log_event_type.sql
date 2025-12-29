-- 107_fix_audit_log_event_type.sql
-- Fix audit_log schema (missing event_type)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'event_type') THEN
        ALTER TABLE audit_log ADD COLUMN event_type VARCHAR(100);
    END IF;
END
$$;
