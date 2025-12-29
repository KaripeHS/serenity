-- 106_fix_audit_log_pod.sql
-- Fix audit_log schema (missing pod_id)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'pod_id') THEN
        ALTER TABLE audit_log ADD COLUMN pod_id UUID;
    END IF;
END
$$;
