-- Migration 125: Fix Organization Structure and Cleanup Mock Data
-- SAFE_MIGRATION: This migration is intentional production cleanup
-- This migration:
-- 1. Ensures Serenity Care Partners organization exists with correct ID
-- 2. Migrates any data from wrong organizations to Serenity
-- 3. Removes all mock/test data
-- 4. Fixes admin user email

-- Remove failed migration record to allow re-run
DELETE FROM _migrations WHERE filename = '125_fix_organization_and_cleanup.sql';

-- The correct organization ID (used throughout codebase)
-- Serenity Care Partners: acdf0560-4c26-47ad-a38d-2b2153fcb039

-- Step 1: Create Serenity Care Partners if it doesn't exist
INSERT INTO organizations (id, name, slug, type, status, settings, state, created_at, updated_at)
VALUES (
  'acdf0560-4c26-47ad-a38d-2b2153fcb039',
  'Serenity Care Partners',
  'serenity-care-partners',
  'home_care',
  'active',
  '{}',
  'OH',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = 'Serenity Care Partners',
  slug = 'serenity-care-partners',
  status = 'active';

-- Step 2: Migrate data from any other orgs to Serenity (preserves data)
-- This handles the Harmony Home Care test org and any other test orgs
UPDATE users SET organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
WHERE organization_id != 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

UPDATE branding_configs SET organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
WHERE organization_id != 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

UPDATE feature_flags SET organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
WHERE organization_id != 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

UPDATE api_keys SET organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
WHERE organization_id != 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

-- Step 3: Delete orphaned test organizations (after migrating their data)
DELETE FROM organizations
WHERE id != 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

-- Step 4: Clean up mock data - handle FK constraints first

-- 4a: Find mock user IDs (users that are NOT real accounts)
-- Real accounts: @serenitycarepartners.com, @serenitycareoh.com, admin roles
CREATE TEMP TABLE mock_user_ids AS
SELECT id FROM users
WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
  AND email NOT LIKE '%@serenitycarepartners.com%'
  AND email NOT LIKE '%@serenitycareoh.com%'
  AND email NOT IN ('admin@serenity.local', 'test@test.com', 'recruiter@test.com')
  AND role NOT IN ('super_admin', 'system_admin', 'founder', 'admin');

-- 4b: Delete audit events for mock users (FK constraint)
DELETE FROM audit_events WHERE user_id IN (SELECT id FROM mock_user_ids);

-- 4c: Delete caregivers linked to mock users (FK constraint)
DELETE FROM caregivers WHERE user_id IN (SELECT id FROM mock_user_ids);

-- 4d: Delete notifications for mock users (table may not exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DELETE FROM notifications WHERE user_id IN (SELECT id FROM mock_user_ids);
  END IF;
END $$;

-- 4e: Nullify ALL user references in onboarding_instances for mock users (FK constraints)
-- Only update columns that exist
DO $$
BEGIN
  -- created_by column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_instances' AND column_name = 'created_by') THEN
    UPDATE onboarding_instances SET created_by = NULL WHERE created_by IN (SELECT id FROM mock_user_ids);
  END IF;
  -- employee_id column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_instances' AND column_name = 'employee_id') THEN
    UPDATE onboarding_instances SET employee_id = NULL WHERE employee_id IN (SELECT id FROM mock_user_ids);
  END IF;
  -- caregiver_id column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_instances' AND column_name = 'caregiver_id') THEN
    UPDATE onboarding_instances SET caregiver_id = NULL WHERE caregiver_id IN (SELECT id FROM mock_user_ids);
  END IF;
  -- assigned_to column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_instances' AND column_name = 'assigned_to') THEN
    UPDATE onboarding_instances SET assigned_to = NULL WHERE assigned_to IN (SELECT id FROM mock_user_ids);
  END IF;
END $$;

-- 4f: Nullify user references in onboarding_items
DO $$
BEGIN
  -- completed_by column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_items' AND column_name = 'completed_by') THEN
    UPDATE onboarding_items SET completed_by = NULL WHERE completed_by IN (SELECT id FROM mock_user_ids);
  END IF;
  -- assigned_to column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_items' AND column_name = 'assigned_to') THEN
    UPDATE onboarding_items SET assigned_to = NULL WHERE assigned_to IN (SELECT id FROM mock_user_ids);
  END IF;
END $$;

-- 4g: Delete schedules referencing mock users (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules') THEN
    DELETE FROM schedules WHERE caregiver_id IN (SELECT id FROM mock_user_ids);
  END IF;
END $$;

-- 4h: Delete visits referencing mock users (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
    DELETE FROM visits WHERE caregiver_id IN (SELECT id FROM mock_user_ids);
  END IF;
END $$;

-- 4i: Nullify references in interviews table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
    UPDATE interviews SET interviewer_id = NULL WHERE interviewer_id IN (SELECT id FROM mock_user_ids);
  END IF;
END $$;

-- 4j: Delete the mock users
DELETE FROM users WHERE id IN (SELECT id FROM mock_user_ids);

-- 4f: Clean up the temp table
DROP TABLE mock_user_ids;

-- Step 5: Remove all mock clients (no real clients yet)
DELETE FROM clients WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

-- Step 6: Remove orphaned caregivers (not linked to any user)
DELETE FROM caregivers
WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
  AND user_id NOT IN (SELECT id FROM users);

-- Step 7: Remove orphaned clients (linked to non-existent orgs)
DELETE FROM clients
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- Step 8: Fix admin user email if it has old harmony email
UPDATE users
SET email = 'admin@serenitycarepartners.com'
WHERE email = 'admin@harmonyhomecare-test.com'
  AND organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';
