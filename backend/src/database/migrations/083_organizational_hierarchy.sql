-- Migration: 083_organizational_hierarchy
-- Description: Add organizational hierarchy support for scaling to 500+ caregivers
-- This supports the full org chart structure with departments, managers, and regional management

-- ============================================================================
-- 1. Add manager and department columns to users table
-- ============================================================================

-- Add manager_id for reporting relationships
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);

-- Add department for organizational grouping
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add job title for display purposes
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);

-- Create index for efficient manager queries
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- ============================================================================
-- 2. Create departments table for department management
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),
  head_user_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_head ON departments(head_user_id);

-- ============================================================================
-- 3. Create pod_groups table for regional pod management
-- ============================================================================

CREATE TABLE IF NOT EXISTS pod_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  regional_manager_id UUID REFERENCES users(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pod_groups_org ON pod_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_pod_groups_region ON pod_groups(region);
CREATE INDEX IF NOT EXISTS idx_pod_groups_manager ON pod_groups(regional_manager_id);

-- Add pod_group_id to pods table if not exists
ALTER TABLE pods ADD COLUMN IF NOT EXISTS pod_group_id UUID REFERENCES pod_groups(id);

-- ============================================================================
-- 4. Create org_chart_positions table for formal position tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_chart_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id),
  reports_to_position_id UUID REFERENCES org_chart_positions(id),
  role VARCHAR(100) NOT NULL, -- Maps to UserRole enum
  is_filled BOOLEAN DEFAULT false,
  filled_by_user_id UUID REFERENCES users(id),
  headcount INTEGER DEFAULT 1, -- Number of positions with this title
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_positions_org ON org_chart_positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_dept ON org_chart_positions(department_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_reports_to ON org_chart_positions(reports_to_position_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_user ON org_chart_positions(filled_by_user_id);

-- ============================================================================
-- 5. Insert default departments for Serenity Care Partners
-- ============================================================================

-- Get the organization ID (assuming single org for now)
DO $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id INTO org_id FROM organizations LIMIT 1;

  IF org_id IS NOT NULL THEN
    -- Insert departments if they don't exist
    INSERT INTO departments (organization_id, name, code, description) VALUES
      (org_id, 'Executive', 'EXEC', 'Executive Leadership (CEO, CFO, COO)'),
      (org_id, 'Operations', 'OPS', 'Field operations, scheduling, and care delivery'),
      (org_id, 'Clinical', 'CLIN', 'Clinical oversight, nursing, and quality of care'),
      (org_id, 'Finance', 'FIN', 'Financial operations, billing, and revenue cycle'),
      (org_id, 'Human Resources', 'HR', 'Recruiting, employee relations, and credentialing'),
      (org_id, 'Compliance', 'COMP', 'Regulatory compliance and quality assurance'),
      (org_id, 'IT', 'IT', 'Information technology and systems support')
    ON CONFLICT (organization_id, code) DO NOTHING;

    -- Insert default regions/pod groups
    INSERT INTO pod_groups (organization_id, name, region, description) VALUES
      (org_id, 'Dayton Region', 'Dayton', 'Pods serving the greater Dayton area'),
      (org_id, 'Columbus Region', 'Columbus', 'Pods serving the greater Columbus area'),
      (org_id, 'Cincinnati Region', 'Cincinnati', 'Pods serving the greater Cincinnati area'),
      (org_id, 'Northern Kentucky Region', 'Northern KY', 'Pods serving Northern Kentucky')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 6. Add role-related enum type for valid roles (for data validation)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
    CREATE TYPE user_role_type AS ENUM (
      -- Executive Leadership
      'founder', 'ceo', 'cfo', 'coo',
      -- Security & Compliance
      'security_officer', 'compliance_officer',
      -- Finance Department
      'finance_director', 'finance_manager', 'billing_manager', 'rcm_analyst', 'insurance_manager', 'billing_coder',
      -- Operations Department
      'operations_manager', 'regional_manager', 'pod_lead', 'field_supervisor', 'scheduling_manager', 'scheduler', 'dispatcher', 'qa_manager',
      -- HR Department
      'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist',
      -- IT & Support
      'it_admin', 'support_agent',
      -- Clinical Leadership
      'director_of_nursing', 'clinical_director', 'nursing_supervisor',
      -- Clinical Staff
      'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp',
      -- Direct Care Staff
      'dsp_med', 'dsp_basic', 'hha', 'cna', 'caregiver',
      -- External Access
      'client', 'family', 'payer_auditor', 'ai_service'
    );
  END IF;
END $$;

-- ============================================================================
-- 7. Add triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pod_groups_updated_at ON pod_groups;
CREATE TRIGGER update_pod_groups_updated_at
  BEFORE UPDATE ON pod_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_positions_updated_at ON org_chart_positions;
CREATE TRIGGER update_org_positions_updated_at
  BEFORE UPDATE ON org_chart_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Create view for organizational hierarchy reporting
-- ============================================================================

CREATE OR REPLACE VIEW vw_org_hierarchy AS
WITH RECURSIVE org_tree AS (
  -- Base case: top-level managers (no manager_id)
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    u.job_title,
    u.department,
    u.manager_id,
    u.organization_id,
    1 as level,
    ARRAY[u.id] as path,
    u.first_name || ' ' || u.last_name as full_name
  FROM users u
  WHERE u.manager_id IS NULL AND u.status = 'active'

  UNION ALL

  -- Recursive case: employees with managers
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    u.job_title,
    u.department,
    u.manager_id,
    u.organization_id,
    ot.level + 1,
    ot.path || u.id,
    u.first_name || ' ' || u.last_name
  FROM users u
  INNER JOIN org_tree ot ON u.manager_id = ot.id
  WHERE u.status = 'active'
)
SELECT
  ot.*,
  m.first_name || ' ' || m.last_name as manager_name
FROM org_tree ot
LEFT JOIN users m ON ot.manager_id = m.id;

-- ============================================================================
-- 9. Create function to get direct reports
-- ============================================================================

CREATE OR REPLACE FUNCTION get_direct_reports(manager_user_id UUID)
RETURNS TABLE (
  id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  role VARCHAR,
  job_title VARCHAR,
  department VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    u.job_title,
    u.department
  FROM users u
  WHERE u.manager_id = manager_user_id
    AND u.status = 'active'
  ORDER BY u.last_name, u.first_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Create function to get full reporting chain
-- ============================================================================

CREATE OR REPLACE FUNCTION get_reporting_chain(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role VARCHAR,
  job_title VARCHAR,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE chain AS (
    SELECT
      u.id,
      u.first_name || ' ' || u.last_name as full_name,
      u.role,
      u.job_title,
      0 as level,
      u.manager_id
    FROM users u
    WHERE u.id = user_id_param

    UNION ALL

    SELECT
      m.id,
      m.first_name || ' ' || m.last_name,
      m.role,
      m.job_title,
      c.level + 1,
      m.manager_id
    FROM users m
    INNER JOIN chain c ON m.id = c.manager_id
  )
  SELECT c.id, c.full_name, c.role, c.job_title, c.level
  FROM chain c
  ORDER BY c.level;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE departments IS 'Organizational departments for grouping employees';
COMMENT ON TABLE pod_groups IS 'Regional groupings of pods for management purposes';
COMMENT ON TABLE org_chart_positions IS 'Formal organizational chart positions';
COMMENT ON VIEW vw_org_hierarchy IS 'Recursive view of organizational hierarchy';
