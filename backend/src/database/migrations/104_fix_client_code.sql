-- 104_fix_client_code.sql
-- Fix client_code constraint in clients

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'client_code') THEN
        ALTER TABLE clients ALTER COLUMN client_code DROP NOT NULL;
    END IF;
END
$$;
