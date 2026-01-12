-- Migration: 127_profile_pictures
-- Description: Add profile picture columns to users table
-- Created: 2026-01-02

-- Add profile picture URL columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_thumbnail_url TEXT;

-- Add index for faster lookups when filtering by users with profile pictures
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture_url) WHERE profile_picture_url IS NOT NULL;

COMMENT ON COLUMN users.profile_picture_url IS 'URL to the full-size profile picture stored in cloud storage';
COMMENT ON COLUMN users.profile_picture_thumbnail_url IS 'URL to the thumbnail (200x200) profile picture for faster loading';
