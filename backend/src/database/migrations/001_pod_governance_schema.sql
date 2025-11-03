-- ============================================================================
-- Pod-Based Governance Database Schema Migration
-- Serenity ERP - Pod Structure & Access Control Implementation
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Pod Management Tables
-- ============================================================================

-- Organizations table (multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'home_health',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pods table - Core pod structure
CREATE TABLE pods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "CIN-A", "CIN-B", "COL-A"
    name VARCHAR(255) NOT NULL, -- e.g., "Cincinnati Pod A", "Columbus Pod A"
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'OH',
    region VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, suspended
    capacity INTEGER NOT NULL DEFAULT 35, -- max caregivers per pod
    team_lead_id UUID, -- Foreign key to users table (added later)
    coverage_area JSONB, -- Geographic boundaries, zip codes
    service_types TEXT[] DEFAULT ARRAY['personal_care', 'companionship', 'homemaker'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT valid_capacity CHECK (capacity > 0 AND capacity <= 100)
);

-- Pod performance metrics (for monitoring)
CREATE TABLE pod_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    active_caregivers INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    visits_completed INTEGER DEFAULT 0,
    evv_compliance_rate DECIMAL(5,2) DEFAULT 0,
    client_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    revenue_generated DECIMAL(12,2) DEFAULT 0,
    metrics_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(pod_id, metric_date)
);

-- ============================================================================
-- Enhanced User Management with Pod Awareness
-- ============================================================================

-- Enhanced users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    emergency_contact JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CONSTRAINT valid_role CHECK (role IN (
        'founder', 'security_officer', 'compliance_officer', 'finance_director',
        'billing_manager', 'rcm_analyst', 'scheduler', 'field_supervisor',
        'hr_manager', 'credentialing_specialist', 'it_admin', 'support_agent',
        'caregiver', 'client', 'family', 'payer_auditor', 'ai_service'
    ))
);

-- Add team_lead_id foreign key constraint to pods table
ALTER TABLE pods ADD CONSTRAINT fk_pods_team_lead
    FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL;

-- User pod memberships (many-to-many relationship)
CREATE TABLE user_pod_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
    role_in_pod VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'standard', -- standard, elevated, emergency
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',

    UNIQUE(user_id, pod_id),
    CONSTRAINT valid_access_level CHECK (access_level IN ('standard', 'elevated', 'emergency')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- ============================================================================
-- Governance and Access Control Tables
-- ============================================================================

-- Role definitions with permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, name)
);

-- User attributes for ABAC (dynamic attributes)
CREATE TABLE user_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',

    INDEX(user_id, attribute_name),
    INDEX(attribute_name, is_active)
);

-- JIT Access grants (Just-in-Time temporary access)
CREATE TABLE jit_access_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    permissions TEXT[] NOT NULL,
    justification TEXT NOT NULL,
    emergency_type VARCHAR(50),
    duration_minutes INTEGER NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    usage_count INTEGER DEFAULT 0,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 1440)
);

-- Break-glass access log
CREATE TABLE break_glass_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emergency_type VARCHAR(100) NOT NULL,
    emergency_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    permissions_granted TEXT[] NOT NULL,
    clients_affected UUID[],
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by UUID REFERENCES users(id),
    incident_id UUID, -- Reference to security incidents
    compliance_review_required BOOLEAN DEFAULT true,
    compliance_reviewed_at TIMESTAMP WITH TIME ZONE,
    compliance_reviewed_by UUID REFERENCES users(id),

    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Separation of duties violations and checks
CREATE TABLE sod_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    violation_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    permissions_involved TEXT[] NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,

    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive'))
);

-- ============================================================================
-- Pod-Aware Core Data Tables
-- ============================================================================

-- Clients table with pod assignment
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id),
    client_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    ssn_encrypted TEXT, -- Encrypted SSN
    medicaid_number VARCHAR(50),
    address JSONB NOT NULL,
    emergency_contacts JSONB DEFAULT '[]',
    medical_info JSONB DEFAULT '{}',
    care_plan JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    admission_date DATE,
    discharge_date DATE,
    data_classification VARCHAR(20) DEFAULT 'phi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'discharged', 'suspended')),
    CONSTRAINT valid_data_classification CHECK (data_classification IN ('public', 'internal', 'confidential', 'phi'))
);

-- Caregivers table with pod assignment
CREATE TABLE caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    employment_status VARCHAR(20) DEFAULT 'active',
    pay_rate DECIMAL(8,2),
    certifications JSONB DEFAULT '[]',
    specializations TEXT[],
    maximum_clients INTEGER DEFAULT 10,
    availability JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    background_check_status VARCHAR(20) DEFAULT 'pending',
    background_check_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_employment_status CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave')),
    CONSTRAINT valid_bg_status CHECK (background_check_status IN ('pending', 'in_progress', 'cleared', 'flagged', 'failed'))
);

-- Visits/Shifts table with pod isolation
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    visit_code VARCHAR(30) UNIQUE NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    care_tasks JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT valid_times CHECK (scheduled_end > scheduled_start)
);

-- EVV records with Ohio compliance
CREATE TABLE evv_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id),
    visit_id UUID NOT NULL REFERENCES visits(id),
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_location JSONB, -- GPS coordinates
    clock_out_location JSONB,
    clock_in_method VARCHAR(20), -- gps, proximity, phone, manual
    clock_out_method VARCHAR(20),
    total_hours DECIMAL(5,2),
    service_verification JSONB DEFAULT '{}',
    ohio_evv_submitted BOOLEAN DEFAULT false,
    ohio_evv_response JSONB,
    compliance_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_compliance_status CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant', 'override')),
    CONSTRAINT valid_methods CHECK (clock_in_method IN ('gps', 'proximity', 'phone', 'manual', 'biometric')),
    CONSTRAINT evv_times_valid CHECK (clock_out_time IS NULL OR clock_out_time > clock_in_time)
);

-- Claims/Billing with pod context
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    service_period_start DATE NOT NULL,
    service_period_end DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payer_type VARCHAR(30) NOT NULL, -- medicaid, medicare, private, etc.
    payer_id VARCHAR(50),
    status VARCHAR(30) DEFAULT 'draft',
    submission_date DATE,
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    denial_reason TEXT,
    evv_compliant BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('draft', 'pending', 'submitted', 'paid', 'denied', 'appealed')),
    CONSTRAINT valid_amounts CHECK (total_amount >= 0 AND (paid_amount IS NULL OR paid_amount >= 0))
);

-- ============================================================================
-- Audit and Compliance Tables
-- ============================================================================

-- Comprehensive audit log
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID REFERENCES pods(id), -- Null for org-level events
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    resource_type VARCHAR(50),
    resource_id UUID,
    action VARCHAR(50) NOT NULL,
    outcome VARCHAR(20) NOT NULL, -- success, failure, partial
    ip_address INET,
    user_agent TEXT,
    event_data JSONB DEFAULT '{}',
    phi_accessed BOOLEAN DEFAULT false,
    data_classification VARCHAR(20) DEFAULT 'internal',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_outcome CHECK (outcome IN ('success', 'failure', 'partial')),
    CONSTRAINT valid_data_classification CHECK (data_classification IN ('public', 'internal', 'confidential', 'phi'))
);

-- Security incidents
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID REFERENCES pods(id),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'open',
    phi_involved BOOLEAN DEFAULT false,
    affected_users UUID[],
    affected_clients UUID[],
    containment_actions TEXT[],
    resolution_notes TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed'))
);

-- Compliance exports/binders
CREATE TABLE compliance_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL,
    pod_ids UUID[], -- Null means all pods
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path VARCHAR(500),
    file_size BIGINT,
    encryption_key_id VARCHAR(100),
    access_log JSONB DEFAULT '[]',
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',

    CONSTRAINT valid_status CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'expired'))
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Pod-related indexes
CREATE INDEX idx_pods_organization_id ON pods(organization_id);
CREATE INDEX idx_pods_status ON pods(status);
CREATE INDEX idx_pods_team_lead_id ON pods(team_lead_id);

-- User indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);

-- Pod membership indexes
CREATE INDEX idx_user_pod_memberships_user_id ON user_pod_memberships(user_id);
CREATE INDEX idx_user_pod_memberships_pod_id ON user_pod_memberships(pod_id);
CREATE INDEX idx_user_pod_memberships_status ON user_pod_memberships(status);

-- Core data indexes with pod awareness
CREATE INDEX idx_clients_pod_id ON clients(pod_id);
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_status ON clients(status);

CREATE INDEX idx_caregivers_pod_id ON caregivers(pod_id);
CREATE INDEX idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX idx_caregivers_status ON caregivers(employment_status);

CREATE INDEX idx_visits_pod_id ON visits(pod_id);
CREATE INDEX idx_visits_client_id ON visits(client_id);
CREATE INDEX idx_visits_caregiver_id ON visits(caregiver_id);
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start);
CREATE INDEX idx_visits_status ON visits(status);

CREATE INDEX idx_evv_records_pod_id ON evv_records(pod_id);
CREATE INDEX idx_evv_records_visit_id ON evv_records(visit_id);
CREATE INDEX idx_evv_records_compliance_status ON evv_records(compliance_status);

CREATE INDEX idx_claims_pod_id ON claims(pod_id);
CREATE INDEX idx_claims_client_id ON claims(client_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_submission_date ON claims(submission_date);

-- Audit indexes
CREATE INDEX idx_audit_events_organization_id ON audit_events(organization_id);
CREATE INDEX idx_audit_events_pod_id ON audit_events(pod_id);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_phi_accessed ON audit_events(phi_accessed);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE evv_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Client RLS policy
CREATE POLICY client_pod_isolation ON clients
    USING (
        pod_id IN (
            SELECT pod_id FROM user_pod_memberships
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role IN ('founder', 'compliance_officer', 'security_officer')
        )
    );

-- Caregiver RLS policy
CREATE POLICY caregiver_pod_isolation ON caregivers
    USING (
        pod_id IN (
            SELECT pod_id FROM user_pod_memberships
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role IN ('founder', 'compliance_officer', 'hr_manager')
        )
    );

-- Visit RLS policy
CREATE POLICY visit_pod_isolation ON visits
    USING (
        pod_id IN (
            SELECT pod_id FROM user_pod_memberships
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND status = 'active'
        )
        OR
        caregiver_id IN (
            SELECT c.id FROM caregivers c
            WHERE c.user_id = current_setting('app.current_user_id')::UUID
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role IN ('founder', 'compliance_officer', 'scheduler')
        )
    );

-- EVV RLS policy
CREATE POLICY evv_pod_isolation ON evv_records
    USING (
        pod_id IN (
            SELECT pod_id FROM user_pod_memberships
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND status = 'active'
        )
        OR
        caregiver_id IN (
            SELECT c.id FROM caregivers c
            WHERE c.user_id = current_setting('app.current_user_id')::UUID
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role IN ('founder', 'compliance_officer', 'billing_manager')
        )
    );

-- Claims RLS policy
CREATE POLICY claim_pod_isolation ON claims
    USING (
        pod_id IN (
            SELECT pod_id FROM user_pod_memberships
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role IN ('founder', 'finance_director', 'billing_manager', 'compliance_officer')
        )
    );

-- Audit events RLS policy
CREATE POLICY audit_pod_isolation ON audit_events
    USING (
        pod_id IS NULL  -- Org-level events visible to admins
        OR
        pod_id IN (
            SELECT pod_id FROM user_pod_memberships
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role IN ('founder', 'security_officer', 'compliance_officer', 'it_admin')
        )
    );

-- ============================================================================
-- Trigger Functions for Audit and Compliance
-- ============================================================================

-- Function to automatically log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_events (
        organization_id,
        pod_id,
        event_type,
        user_id,
        resource_type,
        resource_id,
        action,
        outcome,
        event_data,
        phi_accessed,
        data_classification
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        COALESCE(NEW.pod_id, OLD.pod_id),
        TG_TABLE_NAME || '_change',
        NULLIF(current_setting('app.current_user_id', true), '')::UUID,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        'success',
        CASE
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END,
        TG_TABLE_NAME IN ('clients', 'visits', 'evv_records'),
        CASE
            WHEN TG_TABLE_NAME IN ('clients', 'visits', 'evv_records') THEN 'phi'
            ELSE 'internal'
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_caregivers AFTER INSERT OR UPDATE OR DELETE ON caregivers
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_visits AFTER INSERT OR UPDATE OR DELETE ON visits
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_evv_records AFTER INSERT OR UPDATE OR DELETE ON evv_records
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to check separation of duties
CREATE OR REPLACE FUNCTION check_sod_violations()
RETURNS TRIGGER AS $$
DECLARE
    violation_found BOOLEAN := FALSE;
    violation_description TEXT;
BEGIN
    -- Check EVV override + claim submission separation
    IF NEW.attribute_name = 'jit_permission' AND NEW.attribute_value = 'billing:submit' THEN
        IF EXISTS (
            SELECT 1 FROM user_attributes ua
            WHERE ua.user_id = NEW.user_id
            AND ua.attribute_name = 'jit_permission'
            AND ua.attribute_value = 'evv:override'
            AND ua.is_active = TRUE
            AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
        ) THEN
            violation_found := TRUE;
            violation_description := 'User granted billing:submit while having active evv:override permission';
        END IF;
    END IF;

    -- Log violation if found
    IF violation_found THEN
        INSERT INTO sod_violations (
            organization_id,
            user_id,
            violation_type,
            description,
            permissions_involved,
            severity,
            status
        ) VALUES (
            (SELECT organization_id FROM users WHERE id = NEW.user_id),
            NEW.user_id,
            'conflicting_permissions',
            violation_description,
            ARRAY['billing:submit', 'evv:override'],
            'high',
            'open'
        );

        -- Prevent the permission grant
        RAISE EXCEPTION 'Separation of duties violation: %', violation_description;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create SOD trigger
CREATE TRIGGER check_sod_user_attributes BEFORE INSERT OR UPDATE ON user_attributes
    FOR EACH ROW EXECUTE FUNCTION check_sod_violations();

-- ============================================================================
-- Initial Data Setup
-- ============================================================================

-- Insert default organization
INSERT INTO organizations (id, name, slug, type, status, settings) VALUES (
    'org-serenity-001',
    'Serenity Care Partners',
    'serenity-care-partners',
    'home_health',
    'active',
    '{
        "timezone": "America/New_York",
        "evv_provider": "ohio_medicaid",
        "compliance_level": "hipaa_high",
        "pod_capacity_default": 35,
        "auto_audit_enabled": true
    }'::jsonb
);

-- Insert system roles
INSERT INTO roles (organization_id, name, description, permissions, is_system_role) VALUES
    ('org-serenity-001', 'Founder', 'System founder with full access', ARRAY['*'], true),
    ('org-serenity-001', 'Pod Team Lead', 'Manages pod operations and caregivers', ARRAY[
        'client:read', 'schedule:read', 'schedule:update', 'evv:read', 'evv:update', 'hr:read'
    ], true),
    ('org-serenity-001', 'Caregiver', 'Provides direct client care', ARRAY[
        'schedule:read', 'evv:create', 'evv:read', 'client:read'
    ], true),
    ('org-serenity-001', 'Scheduler', 'Manages visit scheduling', ARRAY[
        'client:read', 'schedule:create', 'schedule:read', 'schedule:update', 'schedule:assign'
    ], true);

-- Insert initial pods
INSERT INTO pods (id, organization_id, code, name, city, state, capacity, status) VALUES
    ('pod-cin-a-001', 'org-serenity-001', 'CIN-A', 'Cincinnati Pod A', 'Cincinnati', 'OH', 35, 'active'),
    ('pod-cin-b-001', 'org-serenity-001', 'CIN-B', 'Cincinnati Pod B', 'Cincinnati', 'OH', 35, 'active'),
    ('pod-col-a-001', 'org-serenity-001', 'COL-A', 'Columbus Pod A', 'Columbus', 'OH', 35, 'active');

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Pod summary view
CREATE VIEW pod_summary AS
SELECT
    p.id,
    p.code,
    p.name,
    p.city,
    p.status,
    p.capacity,
    COUNT(DISTINCT c.id) as active_caregivers,
    COUNT(DISTINCT cl.id) as active_clients,
    CONCAT(u.first_name, ' ', u.last_name) as team_lead_name,
    pm.active_caregivers as actual_caregiver_count,
    pm.evv_compliance_rate
FROM pods p
LEFT JOIN caregivers c ON p.id = c.pod_id AND c.employment_status = 'active'
LEFT JOIN clients cl ON p.id = cl.pod_id AND cl.status = 'active'
LEFT JOIN users u ON p.team_lead_id = u.id
LEFT JOIN pod_metrics pm ON p.id = pm.pod_id AND pm.metric_date = CURRENT_DATE
GROUP BY p.id, p.code, p.name, p.city, p.status, p.capacity, u.first_name, u.last_name, pm.active_caregivers, pm.evv_compliance_rate;

-- User permissions view
CREATE VIEW user_permissions_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.role,
    u.status,
    array_agg(DISTINCT upm.pod_id) as pod_access,
    array_agg(DISTINCT ua.attribute_value) FILTER (WHERE ua.attribute_name = 'jit_permission') as jit_permissions,
    array_agg(DISTINCT r.permissions) as role_permissions
FROM users u
LEFT JOIN user_pod_memberships upm ON u.id = upm.user_id AND upm.status = 'active'
LEFT JOIN user_attributes ua ON u.id = ua.user_id AND ua.is_active = true AND ua.expires_at > NOW()
LEFT JOIN roles r ON u.role = r.name AND r.organization_id = u.organization_id
GROUP BY u.id, u.email, u.role, u.status;

COMMIT;