-- ============================================================
-- Migration 064: Family Portal
-- Phase 3, Months 9-10 - Family Login, Visit Updates,
-- Care Team Communication, HIPAA-Compliant Document Sharing
-- ============================================================

-- ============================================================
-- FAMILY MEMBERS (Linked to Clients)
-- ============================================================

-- Family member accounts linked to clients
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Identity
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL, -- 'spouse', 'child', 'parent', 'sibling', 'guardian', 'poa', 'other'

  -- Contact
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  phone_type VARCHAR(20) DEFAULT 'mobile', -- 'mobile', 'home', 'work'

  -- Authentication
  password_hash VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_expires TIMESTAMPTZ,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Authorization level
  access_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'full', 'admin'
  is_primary_contact BOOLEAN DEFAULT FALSE,
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  has_poa BOOLEAN DEFAULT FALSE, -- Power of Attorney
  poa_document_id UUID,

  -- Notification preferences
  notify_visit_start BOOLEAN DEFAULT TRUE,
  notify_visit_end BOOLEAN DEFAULT TRUE,
  notify_schedule_changes BOOLEAN DEFAULT TRUE,
  notify_care_updates BOOLEAN DEFAULT TRUE,
  notify_billing BOOLEAN DEFAULT FALSE,
  notification_method VARCHAR(20) DEFAULT 'both', -- 'email', 'sms', 'push', 'both'

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'inactive'
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_client ON family_members(client_id);
CREATE INDEX idx_family_email ON family_members(email);
CREATE INDEX idx_family_org ON family_members(organization_id, status);
CREATE UNIQUE INDEX idx_family_email_org ON family_members(organization_id, email);

-- ============================================================
-- FAMILY SESSIONS (JWT-like session management)
-- ============================================================

CREATE TABLE IF NOT EXISTS family_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- Session tokens
  access_token VARCHAR(500) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,

  -- Session info
  device_info JSONB DEFAULT '{}', -- User agent, device type, etc.
  ip_address INET,

  -- Expiration
  access_expires TIMESTAMPTZ NOT NULL,
  refresh_expires TIMESTAMPTZ NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  revoked_reason VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_session_member ON family_sessions(family_member_id);
CREATE INDEX idx_family_session_token ON family_sessions(access_token);

-- ============================================================
-- VISIT UPDATES (Real-time visit notifications for family)
-- ============================================================

-- Visit update types for family notifications
CREATE TABLE IF NOT EXISTS visit_update_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name for UI
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'alert'
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed visit update types
INSERT INTO visit_update_types (code, name, description, icon, severity) VALUES
('visit_started', 'Visit Started', 'Caregiver has arrived and checked in', 'check-circle', 'success'),
('visit_ended', 'Visit Ended', 'Caregiver has completed the visit and checked out', 'check-double', 'success'),
('visit_running_late', 'Running Late', 'Caregiver is running late for scheduled visit', 'clock', 'warning'),
('visit_cancelled', 'Visit Cancelled', 'Scheduled visit has been cancelled', 'x-circle', 'alert'),
('visit_rescheduled', 'Visit Rescheduled', 'Visit has been rescheduled to a new time', 'calendar', 'info'),
('caregiver_changed', 'Caregiver Changed', 'A different caregiver will be providing care', 'user-switch', 'info'),
('care_note_added', 'Care Note Added', 'Caregiver has added notes about today''s visit', 'file-text', 'info'),
('incident_reported', 'Incident Reported', 'An incident has been reported during care', 'alert-triangle', 'alert'),
('medication_reminder', 'Medication Reminder', 'Medication assistance was provided', 'pill', 'info'),
('vital_recorded', 'Vital Signs Recorded', 'Vital signs have been recorded', 'heart-pulse', 'info')
ON CONFLICT (code) DO NOTHING;

-- Visit updates sent to family
CREATE TABLE IF NOT EXISTS family_visit_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  shift_id UUID REFERENCES shifts(id),

  -- Update type
  update_type_id UUID REFERENCES visit_update_types(id),
  update_code VARCHAR(50) NOT NULL,

  -- Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}', -- Additional structured data

  -- Caregiver info (denormalized for quick access)
  caregiver_id UUID REFERENCES caregivers(id),
  caregiver_name VARCHAR(200),

  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visit_updates_client ON family_visit_updates(client_id, occurred_at DESC);
CREATE INDEX idx_visit_updates_shift ON family_visit_updates(shift_id);

-- Track which family members have seen/read updates
CREATE TABLE IF NOT EXISTS family_update_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES family_visit_updates(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(update_id, family_member_id)
);

-- ============================================================
-- CARE TEAM COMMUNICATION
-- ============================================================

-- Conversations between family and care team
CREATE TABLE IF NOT EXISTS family_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Conversation metadata
  subject VARCHAR(200),
  conversation_type VARCHAR(50) DEFAULT 'general', -- 'general', 'scheduling', 'care_concern', 'billing', 'emergency'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Participants (stored for easy access)
  family_member_ids UUID[] DEFAULT '{}',
  staff_user_ids UUID[] DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'pending_response', 'resolved', 'closed'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),

  -- Tracking
  last_message_at TIMESTAMPTZ,
  last_message_by_family BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_conv_client ON family_conversations(client_id, status);
CREATE INDEX idx_family_conv_org ON family_conversations(organization_id, status);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES family_conversations(id) ON DELETE CASCADE,

  -- Sender (one of these will be set)
  family_member_id UUID REFERENCES family_members(id),
  staff_user_id UUID REFERENCES users(id),

  -- Message content
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'document', 'system'
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- Array of attachment references

  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_msg_conv ON family_messages(conversation_id, created_at);

-- Message read receipts
CREATE TABLE IF NOT EXISTS family_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES family_messages(id) ON DELETE CASCADE,

  -- Reader (one of these will be set)
  family_member_id UUID REFERENCES family_members(id),
  staff_user_id UUID REFERENCES users(id),

  read_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_msg_read_message ON family_message_reads(message_id);

-- ============================================================
-- HIPAA-COMPLIANT DOCUMENT SHARING
-- ============================================================

-- Document categories
CREATE TABLE IF NOT EXISTS family_document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id), -- NULL for global categories
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  requires_hipaa_consent BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed default document categories
INSERT INTO family_document_categories (organization_id, name, description, icon, sort_order, requires_hipaa_consent) VALUES
(NULL, 'Care Plans', 'Care plans and service agreements', 'clipboard-list', 1, TRUE),
(NULL, 'Medical Records', 'Medical documentation and health records', 'file-medical', 2, TRUE),
(NULL, 'Schedules', 'Weekly and monthly care schedules', 'calendar', 3, FALSE),
(NULL, 'Invoices', 'Billing statements and invoices', 'file-invoice', 4, FALSE),
(NULL, 'Legal Documents', 'POA, advance directives, consent forms', 'file-shield', 5, TRUE),
(NULL, 'Visit Reports', 'Detailed visit notes and summaries', 'file-text', 6, TRUE),
(NULL, 'Incident Reports', 'Incident and accident reports', 'alert-triangle', 7, TRUE),
(NULL, 'Photos', 'Activity and progress photos', 'image', 8, TRUE)
ON CONFLICT DO NOTHING;

-- Documents shared with family
CREATE TABLE IF NOT EXISTS family_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  category_id UUID REFERENCES family_document_categories(id),

  -- Document info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100), -- MIME type
  file_size INTEGER, -- Bytes

  -- Storage
  storage_path VARCHAR(500) NOT NULL, -- Path in cloud storage
  storage_bucket VARCHAR(100),
  encryption_key_id VARCHAR(100), -- Reference to encryption key

  -- Access control
  shared_with_family BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMPTZ,
  shared_by UUID REFERENCES users(id),
  access_expires TIMESTAMPTZ, -- Optional expiration

  -- HIPAA compliance
  contains_phi BOOLEAN DEFAULT TRUE,
  hipaa_consent_required BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags VARCHAR(50)[] DEFAULT '{}',

  -- Source (who uploaded)
  uploaded_by_user_id UUID REFERENCES users(id),
  uploaded_by_family_id UUID REFERENCES family_members(id),

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_docs_client ON family_documents(client_id, status);
CREATE INDEX idx_family_docs_shared ON family_documents(client_id)
  WHERE shared_with_family = TRUE AND status = 'active';

-- Document access log (HIPAA audit trail)
CREATE TABLE IF NOT EXISTS family_document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES family_documents(id),

  -- Who accessed
  family_member_id UUID REFERENCES family_members(id),
  staff_user_id UUID REFERENCES users(id),

  -- Access details
  action VARCHAR(50) NOT NULL, -- 'view', 'download', 'print', 'share'
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',

  -- Result
  was_successful BOOLEAN DEFAULT TRUE,
  failure_reason VARCHAR(200),

  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_access_document ON family_document_access_log(document_id);
CREATE INDEX idx_doc_access_family ON family_document_access_log(family_member_id);
CREATE INDEX idx_doc_access_time ON family_document_access_log(accessed_at DESC);

-- HIPAA consent tracking
CREATE TABLE IF NOT EXISTS family_hipaa_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),

  -- Consent details
  consent_type VARCHAR(50) NOT NULL, -- 'phi_access', 'document_sharing', 'communication'
  consent_version VARCHAR(20) NOT NULL,
  consent_text TEXT NOT NULL,

  -- Signature
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_data TEXT, -- Base64 encoded signature image
  ip_address INET,
  user_agent TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hipaa_consent_client ON family_hipaa_consents(client_id, family_member_id);
CREATE INDEX idx_hipaa_consent_active ON family_hipaa_consents(client_id, consent_type)
  WHERE is_active = TRUE;

-- ============================================================
-- FAMILY NOTIFICATIONS
-- ============================================================

-- Notification queue for family members
CREATE TABLE IF NOT EXISTS family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- Notification content
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  -- Delivery channels
  send_push BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT FALSE,
  send_sms BOOLEAN DEFAULT FALSE,

  -- Delivery status
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,

  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_notif_member ON family_notifications(family_member_id, is_read, created_at DESC);

-- Push notification device tokens for family
CREATE TABLE IF NOT EXISTS family_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- Token info
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  device_name VARCHAR(100),
  device_model VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(token)
);

CREATE INDEX idx_family_device_member ON family_device_tokens(family_member_id, is_active);

-- ============================================================
-- VIEWS
-- ============================================================

-- Family portal summary for a client
CREATE OR REPLACE VIEW family_portal_summary AS
SELECT
  c.id AS client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  c.organization_id,

  -- Family members
  (SELECT COUNT(*) FROM family_members fm WHERE fm.client_id = c.id AND fm.status = 'active') AS active_family_members,

  -- Unread updates
  (SELECT COUNT(*) FROM family_visit_updates fvu
   WHERE fvu.client_id = c.id
     AND fvu.occurred_at >= NOW() - INTERVAL '7 days'
     AND NOT EXISTS (
       SELECT 1 FROM family_update_reads fur WHERE fur.update_id = fvu.id
     )
  ) AS unread_updates,

  -- Open conversations
  (SELECT COUNT(*) FROM family_conversations fc
   WHERE fc.client_id = c.id AND fc.status = 'open') AS open_conversations,

  -- Shared documents
  (SELECT COUNT(*) FROM family_documents fd
   WHERE fd.client_id = c.id
     AND fd.shared_with_family = TRUE
     AND fd.status = 'active') AS shared_documents,

  -- Last visit update
  (SELECT MAX(occurred_at) FROM family_visit_updates fvu
   WHERE fvu.client_id = c.id) AS last_update_at

FROM clients c
WHERE c.status = 'active';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_visit_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_hipaa_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY family_members_org_policy ON family_members
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY family_sessions_policy ON family_sessions
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE organization_id = current_setting('app.organization_id')::UUID
  ));

CREATE POLICY visit_updates_org_policy ON family_visit_updates
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY conversations_org_policy ON family_conversations
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY messages_policy ON family_messages
  FOR ALL USING (conversation_id IN (
    SELECT id FROM family_conversations WHERE organization_id = current_setting('app.organization_id')::UUID
  ));

CREATE POLICY documents_org_policy ON family_documents
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY doc_access_policy ON family_document_access_log
  FOR ALL USING (document_id IN (
    SELECT id FROM family_documents WHERE organization_id = current_setting('app.organization_id')::UUID
  ));

CREATE POLICY hipaa_consent_org_policy ON family_hipaa_consents
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

CREATE POLICY notifications_policy ON family_notifications
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE organization_id = current_setting('app.organization_id')::UUID
  ));

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE family_members IS 'Family member accounts linked to clients for portal access';
COMMENT ON TABLE family_sessions IS 'Active login sessions for family members';
COMMENT ON TABLE family_visit_updates IS 'Real-time visit updates sent to family members';
COMMENT ON TABLE family_conversations IS 'Secure messaging conversations between family and care team';
COMMENT ON TABLE family_messages IS 'Individual messages within family conversations';
COMMENT ON TABLE family_documents IS 'HIPAA-compliant documents shared with family members';
COMMENT ON TABLE family_document_access_log IS 'Audit trail for document access (HIPAA requirement)';
COMMENT ON TABLE family_hipaa_consents IS 'Tracking of HIPAA consent forms signed by family members';
COMMENT ON TABLE family_notifications IS 'Push/email/SMS notification queue for family members';
