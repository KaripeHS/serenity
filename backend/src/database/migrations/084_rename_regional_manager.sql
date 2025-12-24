-- Migration: 084_rename_regional_manager
-- Description: Rename regional_manager role to field_ops_manager for flexibility
-- The new name removes geographic implications and allows multiple managers per market

-- ============================================================================
-- 1. Add new enum value to user_role_type
-- ============================================================================

-- First, add the new value
ALTER TYPE user_role_type ADD VALUE IF NOT EXISTS 'field_ops_manager';

-- ============================================================================
-- 2. Update any existing users with the old role
-- ============================================================================

-- Update users table (role column is VARCHAR, not enum)
UPDATE users
SET role = 'field_ops_manager'
WHERE role = 'regional_manager';

-- ============================================================================
-- 3. Update pod_groups table if it references regional_manager
-- ============================================================================

-- The pod_groups.regional_manager_id column is a UUID foreign key, not a role name
-- So no changes needed there - it just references a user who could have any role

-- ============================================================================
-- 4. Log the migration
-- ============================================================================

COMMENT ON TYPE user_role_type IS 'Updated 084: renamed regional_manager to field_ops_manager for flexible scope (geography, portfolio, service line)';
