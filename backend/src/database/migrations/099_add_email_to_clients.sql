-- 099_add_email_to_clients.sql
-- Add email column to clients table if missing

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE clients ADD COLUMN email VARCHAR(255);
    END IF;
END
$$;
