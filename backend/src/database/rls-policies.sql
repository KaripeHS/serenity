-- Row-Level Security (RLS) Policies for Serenity ERP
-- Implements database-level access control that complements application-level RBAC/ABAC

-- ============================================================================
-- Helper Functions for RLS
-- ============================================================================

-- Function to get current user's context from session
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE (
  user_id UUID,
  organization_id UUID,
  role user_role,
  pod_access UUID[],
  attributes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.organization_id,
    u.role,
    ARRAY(
      SELECT ua.attribute_value::UUID
      FROM user_attributes ua
      WHERE ua.user_id = u.id
      AND ua.attribute_name = 'pod_access'
      AND ua.is_active = true
      AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
    ),
    COALESCE(
      jsonb_object_agg(ua.attribute_name, ua.attribute_value) FILTER (WHERE ua.attribute_name IS NOT NULL),
      '{}'::jsonb
    )
  FROM users u
  LEFT JOIN user_attributes ua ON ua.user_id = u.id AND ua.is_active = true
  WHERE u.id = current_setting('app.current_user_id', true)::UUID
  GROUP BY u.id, u.organization_id, u.role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_context RECORD;
BEGIN
  SELECT * INTO user_context FROM get_current_user_context();
  RETURN user_context.role = required_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION user_has_any_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
DECLARE
  user_context RECORD;
BEGIN
  SELECT * INTO user_context FROM get_current_user_context();
  RETURN user_context.role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has specific attribute
CREATE OR REPLACE FUNCTION user_has_attribute(attr_name TEXT, attr_value TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_context RECORD;
BEGIN
  SELECT * INTO user_context FROM get_current_user_context();
  
  IF attr_value IS NULL THEN
    RETURN user_context.attributes ? attr_name;
  ELSE
    RETURN (user_context.attributes ->> attr_name) = attr_value;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check PHI access permission
CREATE OR REPLACE FUNCTION user_can_access_phi()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_any_role(ARRAY[
    'founder',
    'security_officer', 
    'compliance_officer',
    'finance_director',
    'billing_manager',
    'rcm_analyst',
    'scheduler',
    'field_supervisor',
    'hr_manager',
    'caregiver',
    'payer_auditor'
  ]::user_role[]) OR user_has_attribute('phi_access_granted');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get user's accessible pods
CREATE OR REPLACE FUNCTION get_user_pod_access()
RETURNS UUID[] AS $$
DECLARE
  user_context RECORD;
BEGIN
  SELECT * INTO user_context FROM get_current_user_context();
  
  -- High-level roles have access to all pods
  IF user_has_any_role(ARRAY['founder', 'security_officer', 'compliance_officer']::user_role[]) THEN
    RETURN ARRAY(SELECT id FROM organizations WHERE type = 'pod');
  END IF;
  
  RETURN user_context.pod_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user can access specific client
CREATE OR REPLACE FUNCTION user_can_access_client(client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_context RECORD;
  client_pod UUID;
  assigned_to_client BOOLEAN := false;
BEGIN
  SELECT * INTO user_context FROM get_current_user_context();
  
  -- High-level roles can access all clients
  IF user_has_any_role(ARRAY['founder', 'security_officer', 'compliance_officer']::user_role[]) THEN
    RETURN true;
  END IF;
  
  -- Check pod access
  SELECT pod_id INTO client_pod FROM clients WHERE id = client_id;
  IF client_pod = ANY(get_user_pod_access()) THEN
    RETURN true;
  END IF;
  
  -- Check direct assignment (caregiver to client)
  IF user_context.role = 'caregiver' THEN
    SELECT EXISTS(
      SELECT 1 FROM shifts 
      WHERE client_id = user_can_access_client.client_id 
      AND caregiver_id = user_context.user_id
    ) INTO assigned_to_client;
    
    IF assigned_to_client THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check family member access
  IF user_context.role = 'family' THEN
    RETURN EXISTS(
      SELECT 1 FROM family_members 
      WHERE client_id = user_can_access_client.client_id 
      AND user_id = user_context.user_id 
      AND portal_access = true
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- RLS Policies for Core Tables
-- ============================================================================

-- Organizations RLS Policy
DROP POLICY IF EXISTS organizations_rls_policy ON organizations;
CREATE POLICY organizations_rls_policy ON organizations
  FOR ALL
  USING (
    -- Users can see their own organization and child organizations
    id IN (
      SELECT organization_id FROM get_current_user_context()
      UNION
      SELECT id FROM organizations WHERE parent_id IN (
        SELECT organization_id FROM get_current_user_context()
      )
    )
    OR user_has_any_role(ARRAY['founder', 'security_officer', 'it_admin']::user_role[])
  );

-- Users RLS Policy
DROP POLICY IF EXISTS users_rls_policy ON users;
CREATE POLICY users_rls_policy ON users
  FOR ALL
  USING (
    -- Users can see themselves
    id = (SELECT user_id FROM get_current_user_context())
    OR
    -- Users can see others in same organization (with role restrictions)
    (
      organization_id = (SELECT organization_id FROM get_current_user_context())
      AND (
        user_has_any_role(ARRAY['founder', 'security_officer', 'hr_manager', 'scheduler', 'field_supervisor']::user_role[])
        OR
        -- Caregivers can see other caregivers in their shifts
        (
          user_has_role('caregiver')
          AND EXISTS(
            SELECT 1 FROM shifts s1
            JOIN shifts s2 ON s1.client_id = s2.client_id
            WHERE s1.caregiver_id = (SELECT user_id FROM get_current_user_context())
            AND s2.caregiver_id = users.id
          )
        )
      )
    )
  );

-- User Attributes RLS Policy  
DROP POLICY IF EXISTS user_attributes_rls_policy ON user_attributes;
CREATE POLICY user_attributes_rls_policy ON user_attributes
  FOR ALL
  USING (
    -- Users can see their own attributes
    user_id = (SELECT user_id FROM get_current_user_context())
    OR
    -- Admins can see all attributes
    user_has_any_role(ARRAY['founder', 'security_officer', 'hr_manager']::user_role[])
    OR
    -- Managers can see attributes of their subordinates
    (
      user_has_any_role(ARRAY['scheduler', 'field_supervisor']::user_role[])
      AND user_id IN (
        SELECT id FROM users 
        WHERE organization_id = (SELECT organization_id FROM get_current_user_context())
        AND role IN ('caregiver', 'support_agent')
      )
    )
  );

-- Clients RLS Policy (PHI Protection)
DROP POLICY IF EXISTS clients_rls_policy ON clients;
CREATE POLICY clients_rls_policy ON clients
  FOR ALL
  USING (
    user_can_access_phi()
    AND user_can_access_client(id)
    AND organization_id = (SELECT organization_id FROM get_current_user_context())
  );

-- Family Members RLS Policy
DROP POLICY IF EXISTS family_members_rls_policy ON family_members;
CREATE POLICY family_members_rls_policy ON family_members
  FOR ALL
  USING (
    -- Can access if can access the client
    user_can_access_client(client_id)
    OR
    -- Family member can access their own record
    user_id = (SELECT user_id FROM get_current_user_context())
  );

-- Services RLS Policy
DROP POLICY IF EXISTS services_rls_policy ON services;
CREATE POLICY services_rls_policy ON services
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    OR user_has_any_role(ARRAY['founder', 'payer_auditor']::user_role[])
  );

-- Shifts RLS Policy
DROP POLICY IF EXISTS shifts_rls_policy ON shifts;
CREATE POLICY shifts_rls_policy ON shifts
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Pod-based access
      pod_id = ANY(get_user_pod_access())
      OR
      -- Caregiver can see their own shifts
      caregiver_id = (SELECT user_id FROM get_current_user_context())
      OR
      -- Client can see their own shifts
      (
        user_has_role('client')
        AND client_id = (SELECT user_id FROM get_current_user_context())
      )
      OR
      -- Family member can see shifts for their client
      (
        user_has_role('family')
        AND user_can_access_client(client_id)
      )
      OR
      -- High-level roles can see all shifts
      user_has_any_role(ARRAY['founder', 'security_officer', 'compliance_officer', 'scheduler', 'field_supervisor']::user_role[])
    )
  );

-- EVV Records RLS Policy
DROP POLICY IF EXISTS evv_records_rls_policy ON evv_records;
CREATE POLICY evv_records_rls_policy ON evv_records
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Caregiver can see their own EVV records
      caregiver_id = (SELECT user_id FROM get_current_user_context())
      OR
      -- Can access if can access the client
      user_can_access_client(client_id)
      OR
      -- Billing and admin roles
      user_has_any_role(ARRAY[
        'founder', 'security_officer', 'compliance_officer', 'finance_director',
        'billing_manager', 'rcm_analyst', 'scheduler', 'field_supervisor', 'payer_auditor'
      ]::user_role[])
    )
  );

-- Claims RLS Policy
DROP POLICY IF EXISTS claims_rls_policy ON claims;
CREATE POLICY claims_rls_policy ON claims
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Billing and finance roles
      user_has_any_role(ARRAY[
        'founder', 'security_officer', 'compliance_officer', 'finance_director',
        'billing_manager', 'rcm_analyst', 'payer_auditor'
      ]::user_role[])
      OR
      -- Caregiver can see claims for their shifts
      (
        user_has_role('caregiver')
        AND caregiver_id = (SELECT user_id FROM get_current_user_context())
      )
    )
  );

-- Credentials RLS Policy
DROP POLICY IF EXISTS credentials_rls_policy ON credentials;
CREATE POLICY credentials_rls_policy ON credentials
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Users can see their own credentials
      user_id = (SELECT user_id FROM get_current_user_context())
      OR
      -- HR and admin roles can see all credentials
      user_has_any_role(ARRAY[
        'founder', 'security_officer', 'hr_manager', 'credentialing_specialist'
      ]::user_role[])
      OR
      -- Managers can see credentials of their subordinates
      (
        user_has_any_role(ARRAY['scheduler', 'field_supervisor']::user_role[])
        AND user_id IN (
          SELECT id FROM users 
          WHERE organization_id = (SELECT organization_id FROM get_current_user_context())
          AND role IN ('caregiver', 'support_agent')
        )
      )
    )
  );

-- Training Records RLS Policy
DROP POLICY IF EXISTS training_records_rls_policy ON training_records;
CREATE POLICY training_records_rls_policy ON training_records
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Users can see their own training records
      user_id = (SELECT user_id FROM get_current_user_context())
      OR
      -- HR and admin roles can see all training records
      user_has_any_role(ARRAY[
        'founder', 'security_officer', 'compliance_officer', 'hr_manager'
      ]::user_role[])
      OR
      -- Managers can see training records of their subordinates
      (
        user_has_any_role(ARRAY['scheduler', 'field_supervisor']::user_role[])
        AND user_id IN (
          SELECT id FROM users 
          WHERE organization_id = (SELECT organization_id FROM get_current_user_context())
          AND role IN ('caregiver', 'support_agent')
        )
      )
    )
  );

-- Audit Log RLS Policy
DROP POLICY IF EXISTS audit_log_rls_policy ON audit_log;
CREATE POLICY audit_log_rls_policy ON audit_log
  FOR SELECT
  USING (
    -- Security and compliance officers can see all audit logs
    user_has_any_role(ARRAY['founder', 'security_officer', 'compliance_officer']::user_role[])
    OR
    -- Users can see their own audit entries
    changed_by = (SELECT user_id FROM get_current_user_context())
    OR
    -- Managers can see audit logs for their areas of responsibility
    (
      user_has_any_role(ARRAY['finance_director', 'billing_manager', 'hr_manager']::user_role[])
      AND table_name IN (
        SELECT CASE 
          WHEN user_has_any_role(ARRAY['finance_director', 'billing_manager']::user_role[]) 
            THEN unnest(ARRAY['claims', 'evv_records', 'shifts'])
          WHEN user_has_role('hr_manager') 
            THEN unnest(ARRAY['users', 'credentials', 'training_records'])
          ELSE NULL
        END
      )
    )
  );

-- Security Incidents RLS Policy
DROP POLICY IF EXISTS security_incidents_rls_policy ON security_incidents;
CREATE POLICY security_incidents_rls_policy ON security_incidents
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Security and compliance officers can see all incidents
      user_has_any_role(ARRAY['founder', 'security_officer', 'compliance_officer']::user_role[])
      OR
      -- Users can see incidents they reported or are assigned to
      reported_by = (SELECT user_id FROM get_current_user_context())
      OR
      assigned_to = (SELECT user_id FROM get_current_user_context())
    )
  );

-- AI Agent Log RLS Policy
DROP POLICY IF EXISTS ai_agent_log_rls_policy ON ai_agent_log;
CREATE POLICY ai_agent_log_rls_policy ON ai_agent_log
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Admins and AI administrators can see all AI logs
      user_has_any_role(ARRAY['founder', 'security_officer', 'it_admin']::user_role[])
      OR
      -- Users can see their own AI interactions
      user_id = (SELECT user_id FROM get_current_user_context())
      OR
      -- Compliance officers can see PHI-related AI interactions
      (
        user_has_role('compliance_officer')
        AND phi_processed = true
      )
    )
  );

-- Documents RLS Policy
DROP POLICY IF EXISTS documents_rls_policy ON documents;
CREATE POLICY documents_rls_policy ON documents
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM get_current_user_context())
    AND (
      -- Document owner can access
      uploaded_by = (SELECT user_id FROM get_current_user_context())
      OR
      -- User-specific documents
      user_id = (SELECT user_id FROM get_current_user_context())
      OR
      -- Client-related documents (if can access client)
      (client_id IS NOT NULL AND user_can_access_client(client_id))
      OR
      -- Admins can access all documents
      user_has_any_role(ARRAY['founder', 'security_officer', 'compliance_officer']::user_role[])
      OR
      -- Role-based document access
      (
        user_has_any_role(ARRAY['hr_manager', 'credentialing_specialist']::user_role[])
        AND document_type IN ('credential', 'training_certificate', 'policy')
      )
    )
  );

-- System Config RLS Policy
DROP POLICY IF EXISTS system_config_rls_policy ON system_config;
CREATE POLICY system_config_rls_policy ON system_config
  FOR ALL
  USING (
    user_has_any_role(ARRAY['founder', 'security_officer', 'it_admin']::user_role[])
    OR
    -- Non-sensitive config can be read by certain roles
    (
      is_sensitive = false
      AND user_has_any_role(ARRAY['compliance_officer', 'hr_manager', 'billing_manager']::user_role[])
    )
  );

-- ============================================================================
-- RLS Policies for UPDATE/DELETE Operations
-- ============================================================================

-- Prevent deletion of audit logs (immutable)
DROP POLICY IF EXISTS audit_log_no_delete ON audit_log;
CREATE POLICY audit_log_no_delete ON audit_log
  FOR DELETE
  USING (false);

-- Prevent updates to audit logs (immutable)
DROP POLICY IF EXISTS audit_log_no_update ON audit_log;
CREATE POLICY audit_log_no_update ON audit_log
  FOR UPDATE
  USING (false);

-- Restrict user updates to appropriate roles
DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (
    -- Users can update their own profile (limited fields)
    id = (SELECT user_id FROM get_current_user_context())
    OR
    -- HR and admin roles can update user records
    user_has_any_role(ARRAY['founder', 'security_officer', 'hr_manager']::user_role[])
  );

-- Restrict sensitive credential updates
DROP POLICY IF EXISTS credentials_update_policy ON credentials;
CREATE POLICY credentials_update_policy ON credentials
  FOR UPDATE
  USING (
    user_has_any_role(ARRAY['founder', 'hr_manager', 'credentialing_specialist']::user_role[])
    OR
    -- Users can update their own credentials (limited fields)
    (
      user_id = (SELECT user_id FROM get_current_user_context())
      AND status = 'pending' -- Only pending credentials can be self-updated
    )
  );

-- ============================================================================
-- Emergency Access Bypass
-- ============================================================================

-- Function to enable emergency bypass (break-glass)
CREATE OR REPLACE FUNCTION enable_emergency_bypass(
  bypass_user_id UUID,
  justification TEXT,
  duration_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only founders and security officers can enable bypass
  IF NOT user_has_any_role(ARRAY['founder', 'security_officer']::user_role[]) THEN
    RAISE EXCEPTION 'Insufficient privileges to enable emergency bypass';
  END IF;
  
  -- Insert emergency bypass attribute
  INSERT INTO user_attributes (
    user_id, attribute_name, attribute_value, 
    granted_by, expires_at, is_active
  ) VALUES (
    bypass_user_id,
    'emergency_bypass',
    'full_access',
    (SELECT user_id FROM get_current_user_context()),
    NOW() + (duration_minutes || ' minutes')::INTERVAL,
    true
  );
  
  -- Log the emergency access
  INSERT INTO audit_log (
    table_name, record_id, operation, new_values,
    changed_by, phi_accessed, data_classification
  ) VALUES (
    'emergency_access',
    bypass_user_id,
    'EMERGENCY_BYPASS',
    jsonb_build_object(
      'justification', justification,
      'duration_minutes', duration_minutes,
      'granted_by', (SELECT user_id FROM get_current_user_context())
    ),
    (SELECT user_id FROM get_current_user_context()),
    true,
    'phi'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Performance Optimization
-- ============================================================================

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_user_attributes_user_active 
ON user_attributes(user_id, is_active) 
WHERE attribute_name = 'pod_access';

CREATE INDEX IF NOT EXISTS idx_users_org_role 
ON users(organization_id, role) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_clients_pod_org 
ON clients(pod_id, organization_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_client 
ON shifts(caregiver_id, client_id);

CREATE INDEX IF NOT EXISTS idx_family_members_client_user 
ON family_members(client_id, user_id) 
WHERE portal_access = true;

-- ============================================================================
-- RLS Policy Testing Functions
-- ============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(test_name TEXT, result BOOLEAN, details TEXT) AS $$
BEGIN
  -- This would contain comprehensive tests for each RLS policy
  -- Implementation would test various user roles and access scenarios
  RETURN QUERY SELECT 'RLS Test Framework'::TEXT, true::BOOLEAN, 'Ready for implementation'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evv_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;