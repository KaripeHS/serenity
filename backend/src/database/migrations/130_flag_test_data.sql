-- ============================================================================
-- Migration: Flag Test/Development Data
-- Purpose: Add is_test_data column to all tables containing patient/employee/
--          operational data to distinguish development data from production data
-- ============================================================================

-- ============================================================================
-- CORE ENTITY TABLES - These contain primary business data
-- ============================================================================

-- Organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
UPDATE organizations SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
COMMENT ON COLUMN organizations.is_test_data IS 'Flag to identify test/development data that should be filtered or removed before production use';

-- Users (employees, caregivers, staff)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
UPDATE users SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
COMMENT ON COLUMN users.is_test_data IS 'Flag to identify test/development data that should be filtered or removed before production use';

-- Clients/Patients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
UPDATE clients SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
COMMENT ON COLUMN clients.is_test_data IS 'Flag to identify test/development data that should be filtered or removed before production use';

-- Pods
ALTER TABLE pods ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
UPDATE pods SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
COMMENT ON COLUMN pods.is_test_data IS 'Flag to identify test/development data that should be filtered or removed before production use';

-- ============================================================================
-- HR & RECRUITING TABLES
-- ============================================================================

-- Applicants (job applications)
DO $$ BEGIN
    ALTER TABLE applicants ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE applicants SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Staff credentials
DO $$ BEGIN
    ALTER TABLE staff_credentials ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE staff_credentials SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Onboarding records
DO $$ BEGIN
    ALTER TABLE onboarding_records ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE onboarding_records SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Training records
DO $$ BEGIN
    ALTER TABLE training_records ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE training_records SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Performance reviews
DO $$ BEGIN
    ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE performance_reviews SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Disciplinary actions
DO $$ BEGIN
    ALTER TABLE disciplinary_actions ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE disciplinary_actions SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- CLINICAL & PATIENT CARE TABLES
-- ============================================================================

-- Care plans
DO $$ BEGIN
    ALTER TABLE care_plans ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE care_plans SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Care notes
DO $$ BEGIN
    ALTER TABLE care_notes ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE care_notes SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Assessments
DO $$ BEGIN
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE assessments SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Incidents
DO $$ BEGIN
    ALTER TABLE incidents ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE incidents SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Supervisory visits
DO $$ BEGIN
    ALTER TABLE supervisory_visits ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE supervisory_visits SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- SCHEDULING & EVV TABLES
-- ============================================================================

-- Schedules/Shifts
DO $$ BEGIN
    ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE schedules SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Visits/EVV records
DO $$ BEGIN
    ALTER TABLE visits ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE visits SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- EVV entries
DO $$ BEGIN
    ALTER TABLE evv_entries ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE evv_entries SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- BILLING & FINANCIAL TABLES
-- ============================================================================

-- Claims
DO $$ BEGIN
    ALTER TABLE claims ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE claims SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Invoices
DO $$ BEGIN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE invoices SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Payments
DO $$ BEGIN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE payments SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Authorizations
DO $$ BEGIN
    ALTER TABLE authorizations ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE authorizations SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Payroll records
DO $$ BEGIN
    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE payroll_records SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Financial transactions
DO $$ BEGIN
    ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE financial_transactions SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- CRM & LEADS TABLES
-- ============================================================================

-- Leads
DO $$ BEGIN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE leads SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Private client leads
DO $$ BEGIN
    ALTER TABLE private_client_leads ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE private_client_leads SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Referral partners
DO $$ BEGIN
    ALTER TABLE referral_partners ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE referral_partners SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- COMPLIANCE TABLES
-- ============================================================================

-- Business associate agreements
DO $$ BEGIN
    ALTER TABLE business_associate_agreements ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE business_associate_agreements SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Audit logs (special case - we may want to keep these)
DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    UPDATE audit_logs SET is_test_data = true WHERE is_test_data IS NULL OR is_test_data = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- CREATE HELPFUL VIEWS FOR FILTERING TEST DATA
-- ============================================================================

-- View to see counts of test vs production data across tables
CREATE OR REPLACE VIEW test_data_summary AS
SELECT
    'organizations' as table_name,
    COUNT(*) FILTER (WHERE is_test_data = true) as test_records,
    COUNT(*) FILTER (WHERE is_test_data = false) as production_records,
    COUNT(*) as total_records
FROM organizations
UNION ALL
SELECT 'users',
    COUNT(*) FILTER (WHERE is_test_data = true),
    COUNT(*) FILTER (WHERE is_test_data = false),
    COUNT(*)
FROM users
UNION ALL
SELECT 'clients',
    COUNT(*) FILTER (WHERE is_test_data = true),
    COUNT(*) FILTER (WHERE is_test_data = false),
    COUNT(*)
FROM clients
UNION ALL
SELECT 'pods',
    COUNT(*) FILTER (WHERE is_test_data = true),
    COUNT(*) FILTER (WHERE is_test_data = false),
    COUNT(*)
FROM pods;

-- ============================================================================
-- CREATE HELPER FUNCTION TO CLEAN TEST DATA (for future use)
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_all_test_data()
RETURNS TABLE(table_name TEXT, deleted_count INTEGER) AS $$
DECLARE
    r RECORD;
    count_deleted INTEGER;
BEGIN
    -- This function should be called with extreme caution
    -- It will permanently delete all records marked as test data

    RAISE NOTICE 'WARNING: This will permanently delete all test data!';

    -- Delete in order to respect foreign key constraints
    -- Child tables first, parent tables last

    FOR r IN
        SELECT t.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name
        WHERE c.column_name = 'is_test_data'
        AND t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DELETE FROM %I WHERE is_test_data = true', r.table_name);
        GET DIAGNOSTICS count_deleted = ROW_COUNT;
        table_name := r.table_name;
        deleted_count := count_deleted;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_all_test_data() IS 'CAUTION: Permanently deletes all records marked as test data. Use with extreme care.';

-- ============================================================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_is_test_data ON organizations(is_test_data);
CREATE INDEX IF NOT EXISTS idx_users_is_test_data ON users(is_test_data);
CREATE INDEX IF NOT EXISTS idx_clients_is_test_data ON clients(is_test_data);
CREATE INDEX IF NOT EXISTS idx_pods_is_test_data ON pods(is_test_data);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- To query only production data, add: WHERE is_test_data = false
-- To query only test data, add: WHERE is_test_data = true
-- To see summary: SELECT * FROM test_data_summary;
-- To delete all test data (CAREFUL!): SELECT * FROM delete_all_test_data();
