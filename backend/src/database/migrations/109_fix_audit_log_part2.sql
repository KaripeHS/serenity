-- 109_fix_audit_log_part2.sql
-- Fix audit_log schema (missing outcome)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'outcome') THEN
        ALTER TABLE audit_log ADD COLUMN outcome VARCHAR(50);
    END IF;
END
$$;
