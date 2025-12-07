
-- ============================================================================
-- Organization Settings Migration
-- Stores configuration for system modules (Communications, Billing, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- e.g., 'communications', 'billing_prefs'
    settings JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_org_category UNIQUE(organization_id, category)
);

CREATE INDEX idx_org_settings_category ON organization_settings(organization_id, category);

-- Enable RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view settings for their org
CREATE POLICY view_org_settings ON organization_settings
    FOR SELECT USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);

-- Policy: Only Admins can update (Enforced by API logic, but RLS layer check good too)
-- For simplicity in RLS, we allow update if part of org, but API should restrict to 'admin' role.
CREATE POLICY update_org_settings ON organization_settings
    FOR UPDATE USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);

-- Policy: Insert
CREATE POLICY insert_org_settings ON organization_settings
    FOR INSERT WITH CHECK (organization_id = (current_setting('app.current_organization_id', true))::UUID);
