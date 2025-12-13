-- ============================================================
-- Migration 069: Referral Source CRM Enhancements
-- Serenity Care Partners
--
-- Best-in-Class Feature: Full CRM for tracking lead sources,
-- referral partner performance, conversion rates, and marketing ROI
-- ============================================================

-- Add organization_id to leads if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- Add organization_id to referral_partners if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_partners' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE referral_partners ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- Lead source categories for detailed tracking
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'organic',       -- Website, SEO
    'paid',          -- Google Ads, Facebook Ads
    'referral',      -- Partner referrals
    'event',         -- Trade shows, health fairs
    'direct',        -- Walk-ins, phone calls
    'social',        -- Social media organic
    'email',         -- Email campaigns
    'other'
  )),

  -- Cost tracking for ROI
  monthly_cost DECIMAL(10, 2) DEFAULT 0,
  cost_per_lead_target DECIMAL(10, 2),

  -- Attribution
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, name)
);

CREATE INDEX idx_lead_sources_org ON lead_sources(organization_id);

-- Seed default lead sources
INSERT INTO lead_sources (organization_id, name, category, utm_source)
SELECT
  o.id,
  src.name,
  src.category,
  src.utm_source
FROM organizations o
CROSS JOIN (VALUES
  ('Website - Organic', 'organic', 'google'),
  ('Website - Paid Search', 'paid', 'google_ads'),
  ('Facebook Ads', 'paid', 'facebook'),
  ('Referral Partner', 'referral', 'partner'),
  ('Hospital Discharge', 'referral', 'hospital'),
  ('Physician Referral', 'referral', 'physician'),
  ('Community Event', 'event', 'event'),
  ('Word of Mouth', 'direct', 'word_of_mouth'),
  ('Phone Inquiry', 'direct', 'phone')
) AS src(name, category, utm_source)
ON CONFLICT DO NOTHING;

-- Add lead_source_id to leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'lead_source_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_source_id UUID REFERENCES lead_sources(id);
  END IF;
END $$;

-- Lead activities/touchpoints
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'created',
    'status_change',
    'note_added',
    'email_sent',
    'email_opened',
    'call_made',
    'call_received',
    'meeting_scheduled',
    'assessment_completed',
    'proposal_sent',
    'contract_sent',
    'converted',
    'lost'
  )),

  description TEXT,
  old_status VARCHAR(50),
  new_status VARCHAR(50),

  -- Communication tracking
  email_subject VARCHAR(255),
  call_duration_minutes INTEGER,
  call_outcome VARCHAR(50),

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_created ON lead_activities(created_at);

-- Marketing campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Campaign details
  campaign_type VARCHAR(50) CHECK (campaign_type IN (
    'email',
    'paid_search',
    'social_media',
    'direct_mail',
    'event',
    'referral_program',
    'content_marketing',
    'other'
  )),

  -- Budget
  budget DECIMAL(10, 2),
  actual_spend DECIMAL(10, 2) DEFAULT 0,

  -- Dates
  start_date DATE,
  end_date DATE,

  -- UTM tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'paused', 'completed', 'cancelled'
  )),

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_org ON marketing_campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON marketing_campaigns(status);

-- Link leads to campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN campaign_id UUID REFERENCES marketing_campaigns(id);
  END IF;
END $$;

-- Referral partner enhancements
DO $$
BEGIN
  -- Add address fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_partners' AND column_name = 'address'
  ) THEN
    ALTER TABLE referral_partners ADD COLUMN address TEXT;
    ALTER TABLE referral_partners ADD COLUMN city VARCHAR(100);
    ALTER TABLE referral_partners ADD COLUMN state VARCHAR(50);
    ALTER TABLE referral_partners ADD COLUMN zip VARCHAR(20);
  END IF;

  -- Add relationship tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_partners' AND column_name = 'relationship_owner_id'
  ) THEN
    ALTER TABLE referral_partners ADD COLUMN relationship_owner_id UUID REFERENCES users(id);
    ALTER TABLE referral_partners ADD COLUMN last_contact_date DATE;
    ALTER TABLE referral_partners ADD COLUMN next_follow_up_date DATE;
  END IF;
END $$;

-- Partner referral tracking (for commission/credit)
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES referral_partners(id),
  lead_id UUID NOT NULL REFERENCES leads(id),

  -- Referral details
  referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
  referral_notes TEXT,

  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  client_id UUID REFERENCES clients(id),

  -- Commission
  commission_amount DECIMAL(10, 2),
  commission_paid BOOLEAN DEFAULT FALSE,
  commission_paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_referrals_partner ON partner_referrals(partner_id);
CREATE INDEX idx_partner_referrals_lead ON partner_referrals(lead_id);

-- Lead scoring model
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) CHECK (rule_type IN (
    'service_interest',
    'budget_range',
    'urgency',
    'source_quality',
    'engagement',
    'demographic'
  )),

  -- Condition
  condition_field VARCHAR(100),
  condition_operator VARCHAR(20), -- 'equals', 'contains', 'greater_than', etc.
  condition_value TEXT,

  -- Score adjustment
  score_adjustment INTEGER NOT NULL, -- Can be positive or negative

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scoring_rules_org ON lead_scoring_rules(organization_id);

-- Add score to leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'lead_score'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_score INTEGER DEFAULT 0;
    ALTER TABLE leads ADD COLUMN score_calculated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Conversion tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'converted_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN converted_at TIMESTAMPTZ;
    ALTER TABLE leads ADD COLUMN converted_client_id UUID REFERENCES clients(id);
    ALTER TABLE leads ADD COLUMN lost_reason VARCHAR(255);
    ALTER TABLE leads ADD COLUMN lost_at TIMESTAMPTZ;
  END IF;
END $$;

-- View: Lead source performance
CREATE OR REPLACE VIEW lead_source_performance AS
SELECT
  ls.id AS source_id,
  ls.organization_id,
  ls.name AS source_name,
  ls.category,
  ls.monthly_cost,
  COUNT(l.id) AS total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'converted') AS converted_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'lost') AS lost_leads,
  COUNT(l.id) FILTER (WHERE l.status NOT IN ('converted', 'lost')) AS active_leads,
  CASE
    WHEN COUNT(l.id) > 0
    THEN ROUND((COUNT(l.id) FILTER (WHERE l.status = 'converted')::DECIMAL / COUNT(l.id)) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  COALESCE(SUM(l.estimated_value) FILTER (WHERE l.status = 'converted'), 0) AS total_converted_value,
  CASE
    WHEN COUNT(l.id) > 0 AND ls.monthly_cost > 0
    THEN ROUND(ls.monthly_cost / COUNT(l.id), 2)
    ELSE 0
  END AS cost_per_lead,
  CASE
    WHEN ls.monthly_cost > 0 AND SUM(l.estimated_value) FILTER (WHERE l.status = 'converted') > 0
    THEN ROUND((SUM(l.estimated_value) FILTER (WHERE l.status = 'converted') - ls.monthly_cost) / ls.monthly_cost * 100, 2)
    ELSE 0
  END AS roi_percent
FROM lead_sources ls
LEFT JOIN leads l ON l.lead_source_id = ls.id
GROUP BY ls.id, ls.organization_id, ls.name, ls.category, ls.monthly_cost;

-- View: Partner performance
CREATE OR REPLACE VIEW referral_partner_performance AS
SELECT
  rp.id AS partner_id,
  rp.organization_id,
  rp.organization_name,
  rp.contact_name,
  rp.type AS partner_type,
  rp.commission_rate,
  rp.last_contact_date,
  rp.next_follow_up_date,
  COUNT(pr.id) AS total_referrals,
  COUNT(pr.id) FILTER (WHERE pr.converted_at IS NOT NULL) AS converted_referrals,
  CASE
    WHEN COUNT(pr.id) > 0
    THEN ROUND((COUNT(pr.id) FILTER (WHERE pr.converted_at IS NOT NULL)::DECIMAL / COUNT(pr.id)) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  COALESCE(SUM(pr.commission_amount), 0) AS total_commissions_owed,
  COALESCE(SUM(pr.commission_amount) FILTER (WHERE pr.commission_paid), 0) AS total_commissions_paid,
  MAX(pr.referral_date) AS last_referral_date
FROM referral_partners rp
LEFT JOIN partner_referrals pr ON pr.partner_id = rp.id
GROUP BY rp.id, rp.organization_id, rp.organization_name, rp.contact_name, rp.type,
         rp.commission_rate, rp.last_contact_date, rp.next_follow_up_date;

-- View: Lead pipeline by status
CREATE OR REPLACE VIEW lead_pipeline AS
SELECT
  organization_id,
  status,
  COUNT(*) AS lead_count,
  COALESCE(SUM(estimated_value), 0) AS total_value,
  COALESCE(AVG(estimated_value), 0) AS avg_value,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::INTEGER AS avg_days_in_stage
FROM leads
WHERE status NOT IN ('converted', 'lost')
GROUP BY organization_id, status
ORDER BY
  CASE status
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'assessment_scheduled' THEN 3
    WHEN 'contract_sent' THEN 4
    ELSE 5
  END;

-- View: CRM Dashboard
CREATE OR REPLACE VIEW crm_dashboard AS
SELECT
  organization_id,
  -- Lead metrics
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) AS leads_this_month,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW())) AS leads_this_week,
  COUNT(*) FILTER (WHERE status = 'new') AS new_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') AS contacted_leads,
  COUNT(*) FILTER (WHERE status = 'assessment_scheduled') AS assessments_scheduled,
  COUNT(*) FILTER (WHERE status = 'contract_sent') AS contracts_pending,
  -- Conversion metrics
  COUNT(*) FILTER (WHERE status = 'converted' AND converted_at >= DATE_TRUNC('month', NOW())) AS conversions_this_month,
  COUNT(*) FILTER (WHERE status = 'lost' AND lost_at >= DATE_TRUNC('month', NOW())) AS lost_this_month,
  -- Value metrics
  COALESCE(SUM(estimated_value) FILTER (WHERE status NOT IN ('converted', 'lost')), 0) AS pipeline_value,
  COALESCE(SUM(estimated_value) FILTER (WHERE status = 'converted' AND converted_at >= DATE_TRUNC('month', NOW())), 0) AS converted_value_this_month,
  -- Response time (first activity after creation)
  AVG(EXTRACT(EPOCH FROM (
    SELECT MIN(la.created_at) - l.created_at
    FROM lead_activities la
    WHERE la.lead_id = l.id AND la.activity_type = 'call_made'
  )) / 3600) AS avg_response_hours
FROM leads l
GROUP BY organization_id;

-- Function: Calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 50; -- Base score
  v_rule RECORD;
  v_lead leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Apply scoring rules
  FOR v_rule IN
    SELECT * FROM lead_scoring_rules
    WHERE organization_id = v_lead.organization_id AND is_active = TRUE
  LOOP
    -- Simple rule matching (would be more complex in production)
    CASE v_rule.rule_type
      WHEN 'service_interest' THEN
        IF v_lead.service_interest = v_rule.condition_value THEN
          v_score := v_score + v_rule.score_adjustment;
        END IF;
      WHEN 'urgency' THEN
        -- Higher score for recent leads
        IF v_lead.created_at > NOW() - INTERVAL '7 days' THEN
          v_score := v_score + 10;
        END IF;
      ELSE
        NULL;
    END CASE;
  END LOOP;

  -- Engagement bonus
  v_score := v_score + (
    SELECT COUNT(*) * 5
    FROM lead_activities
    WHERE lead_id = p_lead_id
  );

  -- Cap score at 100
  v_score := LEAST(v_score, 100);

  -- Update lead
  UPDATE leads
  SET lead_score = v_score, score_calculated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead sources for their org" ON lead_sources
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can manage lead sources for their org" ON lead_sources
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view lead activities" ON lead_activities
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Users can manage campaigns for their org" ON marketing_campaigns
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

-- Comments
COMMENT ON TABLE lead_sources IS 'Tracks lead acquisition channels with cost data for ROI analysis';
COMMENT ON TABLE lead_activities IS 'Activity log for lead touchpoints and status changes';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaign tracking with budget and UTM parameters';
COMMENT ON TABLE partner_referrals IS 'Links referral partners to specific leads with commission tracking';
COMMENT ON VIEW lead_source_performance IS 'Performance metrics by lead source including conversion rates and ROI';
COMMENT ON VIEW referral_partner_performance IS 'Partner performance metrics including referral counts and commissions';
COMMENT ON VIEW crm_dashboard IS 'High-level CRM metrics for the dashboard';
