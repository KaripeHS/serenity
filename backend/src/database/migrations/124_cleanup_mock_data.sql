-- Migration 124: Cleanup Mock Data
-- SAFE_MIGRATION: This migration is intentional cleanup, not destructive
-- Remove mock users, clients, caregivers that were seeded for development
-- Keep real admin/recruiter accounts

-- Remove failed migration record to allow re-run
DELETE FROM _migrations WHERE filename = '124_cleanup_mock_data.sql';

-- Step 1: Remove mock caregivers (keep any linked to real onboarding instances)
DELETE FROM caregivers
WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
  AND id NOT IN (
    SELECT DISTINCT caregiver_id FROM onboarding_instances WHERE caregiver_id IS NOT NULL
  );

-- Step 2: Remove mock clients/patients
DELETE FROM clients
WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

-- Step 3: Remove mock users - keep only real accounts
DELETE FROM users
WHERE organization_id = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'
  AND email NOT LIKE '%@serenitycarepartners.com%'
  AND email NOT LIKE '%@serenitycareoh.com%'
  AND email NOT IN (
    'admin@serenity.local',
    'test@test.com',
    'recruiter@test.com'
  )
  AND role NOT IN ('super_admin', 'system_admin');
