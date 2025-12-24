-- Fix missing unique constraint/index on users.email for ON CONFLICT support
-- This is necessary because ON CONFLICT (email) requires a unique index or constraint on the email column.

DO $$
BEGIN
  -- Check if a unique constraint or index specifically named 'users_email_key' or similar exists.
  -- To be safe, we will create a NEW unique index that definitely exists.
  -- We use IF NOT EXISTS to avoid errors on re-runs.
  
  -- Dropping any potential non-unique index that might interfere if named identically (unlikely but safe)
  -- DROP INDEX IF EXISTS idx_users_email; 
  -- We keep idx_users_email if it exists, but add a clear unique one.
  
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);
END $$;
