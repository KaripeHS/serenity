-- 112_fix_audit_log_data_class.sql
-- Fix audit_log schema (missing data_classification)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'data_classification') THEN
        ALTER TABLE audit_log ADD COLUMN data_classification VARCHAR(50) DEFAULT 'confidential';
    END IF;
END
$$;
