-- Serenity ERP Database Schema with Row-Level Security
-- PostgreSQL 15+ with RLS for HIPAA compliance and multi-tenant architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings if using pgvector

-- Create custom types
CREATE TYPE user_role AS ENUM (
  'founder', 'security_officer', 'compliance_officer', 'finance_director',
  'billing_manager', 'rcm_analyst', 'scheduler', 'field_supervisor',
  'hr_manager', 'credentialing_specialist', 'it_admin', 'support_agent',
  'caregiver', 'client', 'family', 'payer_auditor', 'ai_service'
);

CREATE TYPE organization_type AS ENUM ('agency', 'pod', 'client_family');
CREATE TYPE shift_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE claim_status AS ENUM ('draft', 'staged', 'submitted', 'paid', 'denied', 'appealed');
CREATE TYPE credential_status AS ENUM ('active', 'expired', 'suspended', 'revoked', 'pending');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE data_classification AS ENUM ('public', 'internal', 'confidential', 'phi');

-- Organizations table (multi-tenant with hierarchical structure)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  type organization_type NOT NULL,
  npi VARCHAR(10), -- National Provider Identifier
  taxonomy_code VARCHAR(10),
  address JSONB,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  hipaa_covered_entity BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Users table with RBAC
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  mfa_enabled BOOLEAN DEFAULT false,
  password_hash VARCHAR(255), -- For local auth if needed
  auth0_user_id VARCHAR(255), -- External auth provider ID
  hire_date DATE,
  termination_date DATE,
  hourly_rate DECIMAL(10,2),
  salary DECIMAL(12,2),
  emergency_contact JSONB,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Role-based access control attributes
CREATE TABLE user_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attribute_name VARCHAR(100) NOT NULL, -- e.g., 'pod_access', 'client_access', 'data_class_access'
  attribute_value VARCHAR(255) NOT NULL, -- e.g., pod_id, client_id, 'phi'
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, attribute_name, attribute_value)
);

-- Clients table (PHI - protected)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  pod_id UUID REFERENCES organizations(id), -- Pod assignment for RLS
  client_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  ssn_encrypted TEXT, -- Encrypted SSN
  medicaid_number VARCHAR(50),
  medicare_number VARCHAR(50),
  address JSONB NOT NULL,
  phone VARCHAR(20),
  emergency_contact JSONB,
  care_plan_id UUID,
  primary_diagnosis JSONB,
  mobility_level INTEGER CHECK (mobility_level BETWEEN 1 AND 5),
  cognitive_level INTEGER CHECK (cognitive_level BETWEEN 1 AND 5),
  service_authorization JSONB,
  is_active BOOLEAN DEFAULT true,
  admitted_date DATE,
  discharge_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Family members linked to clients
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- If they have portal access
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address JSONB,
  is_emergency_contact BOOLEAN DEFAULT false,
  is_financial_responsible BOOLEAN DEFAULT false,
  portal_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service definitions
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  service_code VARCHAR(20) NOT NULL, -- HCPCS/CPT codes
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_type VARCHAR(20) NOT NULL, -- 'hour', 'visit', 'day'
  default_rate DECIMAL(10,2),
  requires_evv BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules/Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  pod_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  caregiver_id UUID REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status shift_status DEFAULT 'scheduled',
  notes TEXT,
  tasks JSONB, -- Care tasks to be completed
  weather_conditions VARCHAR(100),
  travel_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- EVV (Electronic Visit Verification) records
CREATE TABLE evv_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  caregiver_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  service_performed VARCHAR(255) NOT NULL,
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  location_in JSONB NOT NULL, -- GPS coordinates
  location_out JSONB,
  verification_method VARCHAR(50) NOT NULL, -- 'gps', 'telephony', 'fixed_device'
  device_info JSONB,
  submitted_to_sandata BOOLEAN DEFAULT false,
  sandata_transaction_id VARCHAR(100),
  sandata_response JSONB,
  is_valid BOOLEAN DEFAULT true,
  validation_errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims and billing
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  caregiver_id UUID NOT NULL REFERENCES users(id),
  shift_id UUID REFERENCES shifts(id),
  evv_record_id UUID REFERENCES evv_records(id),
  claim_number VARCHAR(50) UNIQUE,
  payer_name VARCHAR(255) NOT NULL,
  service_code VARCHAR(20) NOT NULL,
  service_date DATE NOT NULL,
  units_provided DECIMAL(5,2) NOT NULL,
  unit_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status claim_status DEFAULT 'draft',
  submission_date DATE,
  payment_date DATE,
  paid_amount DECIMAL(10,2),
  denial_reason TEXT,
  appeal_deadline DATE,
  evv_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Credentials and certifications
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  credential_type VARCHAR(100) NOT NULL, -- e.g., 'CNA', 'HHA', 'CPR', 'First_Aid'
  credential_number VARCHAR(100),
  issued_by VARCHAR(255),
  issue_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status credential_status DEFAULT 'active',
  document_url TEXT, -- S3 URL to credential document
  verification_status VARCHAR(50) DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  auto_renewal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training records
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  training_name VARCHAR(255) NOT NULL,
  training_type VARCHAR(100) NOT NULL, -- 'HIPAA', 'Safety', 'Skills', 'Compliance'
  completed_date DATE NOT NULL,
  expiration_date DATE,
  score DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  certificate_url TEXT,
  trainer_name VARCHAR(255),
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail (immutable)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  client_ip INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  phi_accessed BOOLEAN DEFAULT false,
  data_classification data_classification DEFAULT 'internal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security incidents
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  incident_type VARCHAR(100) NOT NULL,
  severity incident_severity NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affected_users UUID[],
  affected_clients UUID[],
  phi_involved BOOLEAN DEFAULT false,
  breach_notification_required BOOLEAN DEFAULT false,
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  external_notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI agent interactions and decisions
CREATE TABLE ai_agent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name VARCHAR(100) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  model_used VARCHAR(100),
  tokens_consumed INTEGER,
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  human_review_required BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  review_status VARCHAR(50),
  phi_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document storage metadata
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  s3_key TEXT NOT NULL,
  s3_bucket VARCHAR(100) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  classification data_classification DEFAULT 'internal',
  encryption_key_id VARCHAR(255),
  checksum VARCHAR(64),
  expiration_date DATE,
  retention_years INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_pod_id ON clients(pod_id);
CREATE INDEX idx_shifts_caregiver_date ON shifts(caregiver_id, scheduled_start);
CREATE INDEX idx_shifts_client_date ON shifts(client_id, scheduled_start);
CREATE INDEX idx_evv_records_shift_id ON evv_records(shift_id);
CREATE INDEX idx_claims_status_date ON claims(status, service_date);
CREATE INDEX idx_credentials_expiration ON credentials(expiration_date) WHERE status = 'active';
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(created_at);

-- Row-Level Security Policies

-- Enable RLS on all tables with sensitive data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evv_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION current_user_organization()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to get current user's pod access
CREATE OR REPLACE FUNCTION current_user_pods()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT attribute_value::UUID 
    FROM user_attributes 
    WHERE user_id = current_setting('app.current_user_id')::UUID 
    AND attribute_name = 'pod_access' 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION current_user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = current_setting('app.current_user_id')::UUID 
    AND role = required_role
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Users RLS Policy
CREATE POLICY users_policy ON users
  USING (
    organization_id = current_user_organization() OR
    current_user_has_role('founder') OR
    current_user_has_role('it_admin')
  );

-- Clients RLS Policy (PHI protection)
CREATE POLICY clients_policy ON clients
  USING (
    organization_id = current_user_organization() AND
    (pod_id = ANY(current_user_pods()) OR 
     current_user_has_role('founder') OR
     current_user_has_role('compliance_officer') OR
     id IN (
       SELECT client_id FROM shifts 
       WHERE caregiver_id = current_setting('app.current_user_id')::UUID
     ))
  );

-- Shifts RLS Policy
CREATE POLICY shifts_policy ON shifts
  USING (
    organization_id = current_user_organization() AND
    (pod_id = ANY(current_user_pods()) OR
     caregiver_id = current_setting('app.current_user_id')::UUID OR
     current_user_has_role('founder') OR
     current_user_has_role('scheduler') OR
     current_user_has_role('field_supervisor'))
  );

-- EVV Records RLS Policy
CREATE POLICY evv_records_policy ON evv_records
  USING (
    organization_id = current_user_organization() AND
    (caregiver_id = current_setting('app.current_user_id')::UUID OR
     current_user_has_role('founder') OR
     current_user_has_role('scheduler') OR
     current_user_has_role('billing_manager'))
  );

-- Claims RLS Policy
CREATE POLICY claims_policy ON claims
  USING (
    organization_id = current_user_organization() AND
    (current_user_has_role('founder') OR
     current_user_has_role('billing_manager') OR
     current_user_has_role('rcm_analyst') OR
     current_user_has_role('finance_director'))
  );

-- Credentials RLS Policy
CREATE POLICY credentials_policy ON credentials
  USING (
    organization_id = current_user_organization() AND
    (user_id = current_setting('app.current_user_id')::UUID OR
     current_user_has_role('founder') OR
     current_user_has_role('hr_manager') OR
     current_user_has_role('credentialing_specialist'))
  );

-- Audit Log RLS Policy
CREATE POLICY audit_log_policy ON audit_log
  USING (
    current_user_has_role('founder') OR
    current_user_has_role('security_officer') OR
    current_user_has_role('compliance_officer') OR
    changed_by = current_setting('app.current_user_id')::UUID
  );

-- Documents RLS Policy
CREATE POLICY documents_policy ON documents
  USING (
    organization_id = current_user_organization() AND
    (uploaded_by = current_setting('app.current_user_id')::UUID OR
     user_id = current_setting('app.current_user_id')::UUID OR
     client_id IN (SELECT id FROM clients) OR -- Inherits client access
     current_user_has_role('founder') OR
     current_user_has_role('compliance_officer'))
  );

-- Create application roles
CREATE ROLE serenity_app;
CREATE ROLE serenity_ai_agent;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO serenity_app, serenity_ai_agent;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO serenity_app;
GRANT SELECT, INSERT, UPDATE ON ai_agent_log TO serenity_ai_agent;
GRANT SELECT ON users, clients, shifts, evv_records, credentials TO serenity_ai_agent;

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine if PHI is involved
  DECLARE
    phi_accessed BOOLEAN := false;
    data_class data_classification := 'internal';
  BEGIN
    -- Check if table contains PHI
    IF TG_TABLE_NAME IN ('clients', 'family_members', 'evv_records') THEN
      phi_accessed := true;
      data_class := 'phi';
    END IF;

    -- Insert audit record
    INSERT INTO audit_log (
      table_name, record_id, operation, old_values, new_values,
      changed_by, client_ip, phi_accessed, data_classification
    ) VALUES (
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
      current_setting('app.current_user_id', true)::UUID,
      inet_client_addr(),
      phi_accessed,
      data_class
    );

    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers on all sensitive tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_shifts AFTER INSERT OR UPDATE OR DELETE ON shifts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_claims AFTER INSERT OR UPDATE OR DELETE ON claims
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_credentials AFTER INSERT OR UPDATE OR DELETE ON credentials
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert initial system configuration
INSERT INTO system_config (key, value, description) VALUES
('hipaa_compliance_enabled', 'true', 'Enable HIPAA compliance features'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('password_policy', '{"min_length": 12, "require_upper": true, "require_lower": true, "require_digits": true, "require_special": true}', 'Password policy requirements'),
('mfa_required_roles', '["founder", "security_officer", "compliance_officer", "billing_manager", "hr_manager"]', 'Roles requiring MFA'),
('phi_redaction_enabled', 'true', 'Enable automatic PHI redaction'),
('audit_retention_years', '7', 'Audit log retention period'),
('backup_retention_days', '2555', 'Database backup retention (7 years)'),
('evv_validation_required', 'true', 'Require EVV validation before claim submission');

-- Create initial founder organization
INSERT INTO organizations (id, name, type, hipaa_covered_entity) VALUES
('00000000-0000-0000-0000-000000000001', 'Serenity Care Partners', 'agency', true);