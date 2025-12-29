-- 108_fix_audit_log_resources.sql
-- Fix audit_log schema (missing resource_type, resource_id)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'resource_type') THEN
        ALTER TABLE audit_log ADD COLUMN resource_type VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'resource_id') THEN
        ALTER TABLE audit_log ADD COLUMN resource_id UUID;
    END IF;
END
$$;
