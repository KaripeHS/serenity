-- Migration: HIPAA Breach Notification System
-- Purpose: Track data breaches and enforce HIPAA notification timelines
-- Compliance: HIPAA Breach Notification Rule (45 CFR §§ 164.400-414)
-- Created: 2025-12-13

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Breach Incidents Table
-- ============================================================================

CREATE TABLE breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Breach Details
  breach_number VARCHAR(50) UNIQUE NOT NULL,
  breach_type VARCHAR(100) NOT NULL CHECK (breach_type IN (
    'unauthorized_access', 'unauthorized_disclosure', 'theft', 'loss',
    'hacking', 'ransomware', 'phishing', 'improper_disposal',
    'misdirected_email', 'misdirected_fax', 'verbal_disclosure', 'other'
  )),
  breach_category VARCHAR(50) CHECK (breach_category IN (
    'electronic', 'paper', 'verbal', 'other'
  )),

  -- Discovery & Timeline
  discovery_date TIMESTAMPTZ NOT NULL,
  estimated_breach_date TIMESTAMPTZ,
  breach_end_date TIMESTAMPTZ,

  -- HIPAA Notification Deadlines (automatically calculated)
  individual_notification_deadline TIMESTAMPTZ, -- 60 days from discovery
  hhs_notification_deadline TIMESTAMPTZ, -- 60 days or annually (for <500 individuals)
  media_notification_deadline TIMESTAMPTZ, -- 60 days (for >=500 individuals in same state/jurisdiction)
  business_associate_notification_deadline TIMESTAMPTZ, -- 60 days

  -- Affected Information
  phi_involved BOOLEAN DEFAULT true,
  phi_types JSONB DEFAULT '[]'::jsonb, -- names, ssn, dob, medical_records, financial, etc.
  phi_elements JSONB DEFAULT '[]'::jsonb, -- Array of specific data elements
  safeguards_in_place BOOLEAN DEFAULT false,
  safeguards_description TEXT,

  -- Risk Assessment
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  risk_assessment_date DATE,
  risk_assessment_conducted_by UUID REFERENCES users(id),
  risk_assessment_notes TEXT,

  -- Four-Factor Risk Analysis (HIPAA requirement)
  factor_1_nature_extent TEXT, -- Nature and extent of PHI involved
  factor_2_unauthorized_person TEXT, -- Who used/disclosed PHI
  factor_3_phi_acquired BOOLEAN, -- Was PHI actually acquired/viewed
  factor_4_mitigation TEXT, -- Extent to which risk has been mitigated

  -- Harm Assessment
  probability_of_harm VARCHAR(50) CHECK (probability_of_harm IN ('low', 'moderate', 'high')),
  potential_harm_type JSONB DEFAULT '[]'::jsonb, -- financial, reputational, emotional, physical

  -- Affected Individuals
  individuals_affected INTEGER DEFAULT 0,
  individuals_notified INTEGER DEFAULT 0,
  residents_of_state VARCHAR(50), -- For media notification requirement

  -- Location & Scope
  location_of_breach TEXT,
  departments_affected JSONB DEFAULT '[]'::jsonb,
  systems_affected JSONB DEFAULT '[]'::jsonb,

  -- Description
  description TEXT NOT NULL,
  cause_of_breach TEXT,
  how_discovered TEXT,

  -- Immediate Actions
  immediate_actions_taken TEXT,
  breach_contained BOOLEAN DEFAULT false,
  containment_date TIMESTAMPTZ,

  -- Notifications
  individuals_notified_status VARCHAR(50) DEFAULT 'not_started' CHECK (individuals_notified_status IN (
    'not_started', 'in_progress', 'completed', 'not_required'
  )),
  individuals_notification_date TIMESTAMPTZ,
  individuals_notification_method VARCHAR(50), -- mail, email, phone, substitute_notice

  hhs_notified BOOLEAN DEFAULT false,
  hhs_notification_date TIMESTAMPTZ,
  hhs_confirmation_number VARCHAR(100),

  media_notified BOOLEAN DEFAULT false,
  media_notification_date TIMESTAMPTZ,
  media_outlets_contacted JSONB DEFAULT '[]'::jsonb,

  business_associates_notified BOOLEAN DEFAULT false,
  business_associates_notification_date TIMESTAMPTZ,

  -- Investigation
  investigation_status VARCHAR(50) DEFAULT 'pending' CHECK (investigation_status IN (
    'pending', 'in_progress', 'completed', 'not_required'
  )),
  investigation_lead_id UUID REFERENCES users(id),
  investigation_started_date DATE,
  investigation_completed_date DATE,
  root_cause TEXT,
  investigation_findings TEXT,

  -- Corrective Actions
  corrective_actions JSONB DEFAULT '[]'::jsonb, -- Array of {action, assignedTo, deadline, status}
  policy_updates_required BOOLEAN DEFAULT false,
  training_required BOOLEAN DEFAULT false,

  -- Reporting
  reportable_to_hhs BOOLEAN DEFAULT false, -- >=500 individuals = immediate report
  reportable_to_state BOOLEAN DEFAULT false,
  state_notification_required BOOLEAN DEFAULT false,
  state_notification_date TIMESTAMPTZ,

  -- Documentation
  documentation_complete BOOLEAN DEFAULT false,
  documentation_urls JSONB DEFAULT '[]'::jsonb,

  -- Status
  status VARCHAR(50) DEFAULT 'discovered' CHECK (status IN (
    'discovered', 'under_investigation', 'notifications_in_progress', 'resolved', 'closed'
  )),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_breach_incidents_org ON breach_incidents(organization_id);
CREATE INDEX idx_breach_incidents_discovery ON breach_incidents(discovery_date DESC);
CREATE INDEX idx_breach_incidents_status ON breach_incidents(status);
CREATE INDEX idx_breach_incidents_risk ON breach_incidents(risk_level);
CREATE INDEX idx_breach_incidents_individual_deadline ON breach_incidents(individual_notification_deadline) WHERE individuals_notified_status != 'completed';
CREATE INDEX idx_breach_incidents_hhs_deadline ON breach_incidents(hhs_notification_deadline) WHERE NOT hhs_notified;

-- RLS Policies
ALTER TABLE breach_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY breach_incidents_org_isolation ON breach_incidents
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- Affected Individuals Table
-- ============================================================================

CREATE TABLE breach_affected_individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breach_id UUID NOT NULL REFERENCES breach_incidents(id) ON DELETE CASCADE,

  -- Individual Information (Limited for privacy)
  individual_type VARCHAR(50) CHECK (individual_type IN ('client', 'employee', 'business_associate', 'other')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name_encrypted TEXT, -- Encrypted name for notification
  contact_info_encrypted TEXT, -- Encrypted contact info

  -- Notification Details
  notification_sent BOOLEAN DEFAULT false,
  notification_method VARCHAR(50) CHECK (notification_method IN (
    'first_class_mail', 'email', 'phone', 'substitute_notice_web', 'substitute_notice_media'
  )),
  notification_date TIMESTAMPTZ,
  notification_delivery_confirmed BOOLEAN DEFAULT false,
  notification_returned BOOLEAN DEFAULT false,

  -- PHI Compromised for This Individual
  phi_compromised JSONB DEFAULT '[]'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_breach_affected_individuals_breach ON breach_affected_individuals(breach_id);
CREATE INDEX idx_breach_affected_individuals_client ON breach_affected_individuals(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_breach_affected_individuals_notification ON breach_affected_individuals(notification_sent);

-- RLS Policies
ALTER TABLE breach_affected_individuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY breach_affected_individuals_via_breach ON breach_affected_individuals
  USING (
    breach_id IN (
      SELECT id FROM breach_incidents
      WHERE organization_id = current_setting('app.current_organization_id')::uuid
    )
  );

-- ============================================================================
-- Breach Notification Templates Table
-- ============================================================================

CREATE TABLE breach_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template Details
  template_name VARCHAR(200) NOT NULL,
  template_type VARCHAR(50) CHECK (template_type IN (
    'individual_notification', 'hhs_report', 'media_notice', 'business_associate_notice'
  )),
  breach_type VARCHAR(100), -- Specific to certain breach types

  -- Content
  subject_line VARCHAR(500),
  template_content TEXT NOT NULL, -- HTML/text with placeholders

  -- Required Elements Checklist (HIPAA requirements)
  includes_breach_description BOOLEAN DEFAULT true,
  includes_phi_types BOOLEAN DEFAULT true,
  includes_steps_taken BOOLEAN DEFAULT true,
  includes_steps_individuals_can_take BOOLEAN DEFAULT true,
  includes_contact_info BOOLEAN DEFAULT true,

  -- Status
  active BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES users(id),
  approved_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_breach_templates_org ON breach_notification_templates(organization_id);
CREATE INDEX idx_breach_templates_type ON breach_notification_templates(template_type);
CREATE INDEX idx_breach_templates_active ON breach_notification_templates(active) WHERE active = true;

-- RLS Policies
ALTER TABLE breach_notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY breach_templates_org_isolation ON breach_notification_templates
  USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-generate breach incident number
CREATE OR REPLACE FUNCTION generate_breach_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  new_breach_number VARCHAR(50);
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next breach number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(breach_number FROM 'BREACH-' || year_str || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM breach_incidents
  WHERE breach_number LIKE 'BREACH-' || year_str || '-%';

  new_breach_number := 'BREACH-' || year_str || '-' || LPAD(next_number::TEXT, 3, '0');
  NEW.breach_number := new_breach_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_breach_number
  BEFORE INSERT ON breach_incidents
  FOR EACH ROW
  WHEN (NEW.breach_number IS NULL)
  EXECUTE FUNCTION generate_breach_number();

-- Auto-calculate HIPAA notification deadlines
CREATE OR REPLACE FUNCTION calculate_breach_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Individual notification deadline: 60 days from discovery
  NEW.individual_notification_deadline := NEW.discovery_date + INTERVAL '60 days';

  -- HHS notification deadline: 60 days for >=500 individuals (immediate), annually for <500
  IF NEW.individuals_affected >= 500 THEN
    NEW.hhs_notification_deadline := NEW.discovery_date + INTERVAL '60 days';
    NEW.reportable_to_hhs := true;
  ELSE
    -- Annual report (60 days after end of calendar year)
    NEW.hhs_notification_deadline := (DATE_TRUNC('year', NEW.discovery_date) + INTERVAL '1 year' + INTERVAL '60 days')::TIMESTAMPTZ;
  END IF;

  -- Media notification deadline: 60 days (for >=500 in same state/jurisdiction)
  IF NEW.individuals_affected >= 500 THEN
    NEW.media_notification_deadline := NEW.discovery_date + INTERVAL '60 days';
  END IF;

  -- Business associate notification: 60 days
  NEW.business_associate_notification_deadline := NEW.discovery_date + INTERVAL '60 days';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_breach_deadlines
  BEFORE INSERT ON breach_incidents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_breach_deadlines();

-- Update timestamps
CREATE TRIGGER update_breach_incidents_timestamp
  BEFORE UPDATE ON breach_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breach_templates_timestamp
  BEFORE UPDATE ON breach_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Breaches with Overdue Notifications
CREATE VIEW overdue_breach_notifications AS
SELECT
  bi.id,
  bi.breach_number,
  bi.organization_id,
  bi.breach_type,
  bi.individuals_affected,
  bi.discovery_date,
  CASE
    WHEN bi.individual_notification_deadline < NOW() AND bi.individuals_notified_status != 'completed' THEN 'individual_notification_overdue'
    WHEN bi.hhs_notification_deadline < NOW() AND NOT bi.hhs_notified THEN 'hhs_notification_overdue'
    WHEN bi.media_notification_deadline < NOW() AND NOT bi.media_notified AND bi.individuals_affected >= 500 THEN 'media_notification_overdue'
  END AS overdue_notification_type,
  CASE
    WHEN bi.individual_notification_deadline < NOW() THEN bi.individual_notification_deadline
    WHEN bi.hhs_notification_deadline < NOW() THEN bi.hhs_notification_deadline
    WHEN bi.media_notification_deadline < NOW() THEN bi.media_notification_deadline
  END AS deadline_missed,
  NOW() - CASE
    WHEN bi.individual_notification_deadline < NOW() THEN bi.individual_notification_deadline
    WHEN bi.hhs_notification_deadline < NOW() THEN bi.hhs_notification_deadline
    WHEN bi.media_notification_deadline < NOW() THEN bi.media_notification_deadline
  END AS time_overdue
FROM breach_incidents bi
WHERE
  (bi.individual_notification_deadline < NOW() AND bi.individuals_notified_status != 'completed')
  OR (bi.hhs_notification_deadline < NOW() AND NOT bi.hhs_notified)
  OR (bi.media_notification_deadline < NOW() AND NOT bi.media_notified AND bi.individuals_affected >= 500);

-- Upcoming Breach Notification Deadlines
CREATE VIEW upcoming_breach_deadlines AS
SELECT
  bi.id,
  bi.breach_number,
  bi.organization_id,
  bi.breach_type,
  bi.individuals_affected,
  bi.discovery_date,
  'individual_notification' AS deadline_type,
  bi.individual_notification_deadline AS deadline,
  bi.individual_notification_deadline - NOW() AS time_remaining,
  bi.individuals_notified_status AS completion_status
FROM breach_incidents bi
WHERE bi.individual_notification_deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
  AND bi.individuals_notified_status != 'completed'

UNION ALL

SELECT
  bi.id,
  bi.breach_number,
  bi.organization_id,
  bi.breach_type,
  bi.individuals_affected,
  bi.discovery_date,
  'hhs_notification' AS deadline_type,
  bi.hhs_notification_deadline AS deadline,
  bi.hhs_notification_deadline - NOW() AS time_remaining,
  CASE WHEN bi.hhs_notified THEN 'completed' ELSE 'not_started' END AS completion_status
FROM breach_incidents bi
WHERE bi.hhs_notification_deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
  AND NOT bi.hhs_notified

UNION ALL

SELECT
  bi.id,
  bi.breach_number,
  bi.organization_id,
  bi.breach_type,
  bi.individuals_affected,
  bi.discovery_date,
  'media_notification' AS deadline_type,
  bi.media_notification_deadline AS deadline,
  bi.media_notification_deadline - NOW() AS time_remaining,
  CASE WHEN bi.media_notified THEN 'completed' ELSE 'not_started' END AS completion_status
FROM breach_incidents bi
WHERE bi.media_notification_deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
  AND NOT bi.media_notified
  AND bi.individuals_affected >= 500

ORDER BY deadline;

-- Breach Compliance Summary
CREATE VIEW breach_compliance_summary AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  COUNT(bi.id) AS total_breaches,
  COUNT(bi.id) FILTER (WHERE bi.individuals_affected >= 500) AS breaches_500_plus,
  COUNT(bi.id) FILTER (WHERE bi.status = 'closed') AS breaches_closed,
  COUNT(bi.id) FILTER (WHERE bi.hhs_notified) AS hhs_notifications_sent,
  COUNT(bi.id) FILTER (WHERE bi.hhs_notification_deadline < NOW() AND NOT bi.hhs_notified) AS hhs_notifications_overdue,
  COUNT(bi.id) FILTER (WHERE bi.individuals_notified_status = 'completed') AS individual_notifications_complete,
  COUNT(bi.id) FILTER (WHERE bi.individual_notification_deadline < NOW() AND bi.individuals_notified_status != 'completed') AS individual_notifications_overdue
FROM organizations o
LEFT JOIN breach_incidents bi ON o.id = bi.organization_id
GROUP BY o.id, o.name;

-- ============================================================================
-- Seed Data: Default Breach Notification Templates
-- ============================================================================

INSERT INTO breach_notification_templates (
  template_name, template_type, subject_line, template_content,
  includes_breach_description, includes_phi_types, includes_steps_taken,
  includes_steps_individuals_can_take, includes_contact_info
) VALUES
(
  'Individual Notification - Unauthorized Access',
  'individual_notification',
  'Important Notice Regarding Your Protected Health Information',
  '<p>Dear {{individual_name}},</p>

<p>We are writing to inform you of a recent incident that may have affected the privacy of your protected health information (PHI).</p>

<h3>What Happened</h3>
<p>{{breach_description}}</p>

<h3>What Information Was Involved</h3>
<p>The types of information that may have been affected include: {{phi_types}}.</p>

<h3>What We Are Doing</h3>
<p>{{steps_taken}}</p>

<h3>What You Can Do</h3>
<p>{{steps_individuals_can_take}}</p>

<h3>For More Information</h3>
<p>If you have questions or concerns, please contact our Privacy Officer:</p>
<p>{{contact_name}}<br>{{contact_phone}}<br>{{contact_email}}</p>

<p>Sincerely,<br>{{organization_name}}</p>',
  true, true, true, true, true
),
(
  'HHS Breach Report',
  'hhs_report',
  'HIPAA Breach Notification - Report to HHS',
  'Breach Report for {{organization_name}}

Breach Number: {{breach_number}}
Discovery Date: {{discovery_date}}
Individuals Affected: {{individuals_affected}}

Breach Description:
{{breach_description}}

PHI Involved:
{{phi_types}}

Actions Taken:
{{steps_taken}}

Risk Assessment:
{{risk_assessment}}',
  true, true, true, false, true
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE breach_incidents IS 'HIPAA breach tracking with automated 60-day notification deadlines';
COMMENT ON TABLE breach_affected_individuals IS 'Individuals affected by breach (encrypted for privacy)';
COMMENT ON TABLE breach_notification_templates IS 'HIPAA-compliant notification templates';
COMMENT ON VIEW overdue_breach_notifications IS 'Alert view for overdue HIPAA breach notifications';
COMMENT ON VIEW upcoming_breach_deadlines IS 'Upcoming breach notification deadlines (14-day window)';
COMMENT ON VIEW breach_compliance_summary IS 'Organization-level breach notification compliance';
