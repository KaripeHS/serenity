-- 111_fix_audit_log_phi.sql
-- Fix audit_log schema (missing phi_accessed)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'phi_accessed') THEN
        ALTER TABLE audit_log ADD COLUMN phi_accessed BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;
