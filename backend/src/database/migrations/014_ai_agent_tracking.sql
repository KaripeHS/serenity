-- AI Agent Execution Tracking and Analytics
-- Tables for monitoring AI agent performance, costs, and optimization

-- Agent execution logs
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Agent details
  agent_type VARCHAR(50) NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL, -- Hash of prompt for caching/deduplication
  context_data JSONB,

  -- Execution details
  result JSONB NOT NULL,
  confidence DECIMAL(4,3) CHECK (confidence BETWEEN 0 AND 1),
  processing_time INTEGER NOT NULL, -- milliseconds
  cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  model_used VARCHAR(50) NOT NULL,

  -- Metadata
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),

  -- Quality metrics
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_notes TEXT,
  human_reviewed BOOLEAN NOT NULL DEFAULT false,

  -- Performance tracking
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_occurred BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT
);

-- AI model performance metrics
CREATE TABLE ai_model_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(50) NOT NULL,

  -- Daily aggregates
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Usage statistics
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,

  -- Performance metrics
  avg_processing_time DECIMAL(8,2),
  total_tokens_used BIGINT NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,6) NOT NULL DEFAULT 0,
  avg_confidence DECIMAL(4,3),

  -- Quality metrics
  human_approval_rate DECIMAL(4,3),
  feedback_score DECIMAL(3,2),

  -- Cache performance
  cache_hit_rate DECIMAL(4,3),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(model_name, metric_date)
);

-- Agent performance summaries
CREATE TABLE agent_performance_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  agent_type VARCHAR(50) NOT NULL,

  -- Time period
  summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary_period VARCHAR(20) NOT NULL DEFAULT 'daily'
    CHECK (summary_period IN ('hourly', 'daily', 'weekly', 'monthly')),

  -- Execution metrics
  total_executions INTEGER NOT NULL DEFAULT 0,
  successful_executions INTEGER NOT NULL DEFAULT 0,
  failed_executions INTEGER NOT NULL DEFAULT 0,
  avg_processing_time DECIMAL(8,2),

  -- Cost metrics
  total_cost DECIMAL(12,6) NOT NULL DEFAULT 0,
  avg_cost_per_execution DECIMAL(10,6),

  -- Quality metrics
  avg_confidence DECIMAL(4,3),
  user_satisfaction_score DECIMAL(3,2),
  human_intervention_rate DECIMAL(4,3),

  -- Business impact
  decisions_automated INTEGER NOT NULL DEFAULT 0,
  errors_prevented INTEGER NOT NULL DEFAULT 0,
  time_saved_minutes INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, agent_type, summary_date, summary_period)
);

-- AI cost budgets and alerts
CREATE TABLE ai_cost_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Budget parameters
  budget_period VARCHAR(20) NOT NULL
    CHECK (budget_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  budget_amount DECIMAL(12,6) NOT NULL,
  alert_threshold DECIMAL(4,3) NOT NULL DEFAULT 0.8, -- Alert at 80% of budget

  -- Current spending
  current_spending DECIMAL(12,6) NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Alert settings
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  alert_recipients TEXT[], -- Array of email addresses

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, budget_period)
);

-- AI prompt templates and versions
CREATE TABLE ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  agent_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(200) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,

  -- Template content
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,

  -- Configuration
  model_preferences JSONB, -- Preferred models for this template
  parameters JSONB, -- Temperature, max_tokens, etc.

  -- Performance tracking
  usage_count INTEGER NOT NULL DEFAULT 0,
  avg_performance_score DECIMAL(4,3),

  -- Lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'testing', 'active', 'deprecated')),
  effective_date TIMESTAMPTZ,
  deprecated_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  UNIQUE(organization_id, agent_type, template_name, version)
);

-- AI agent configuration
CREATE TABLE ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  agent_type VARCHAR(50) NOT NULL,

  -- Configuration
  enabled BOOLEAN NOT NULL DEFAULT true,
  max_concurrent_executions INTEGER NOT NULL DEFAULT 1,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Model preferences
  preferred_model VARCHAR(50),
  fallback_model VARCHAR(50),
  max_cost_per_execution DECIMAL(10,6),

  -- Quality controls
  confidence_threshold DECIMAL(4,3) DEFAULT 0.7,
  human_review_required BOOLEAN NOT NULL DEFAULT false,
  human_review_sample_rate DECIMAL(4,3) DEFAULT 0.05,

  -- Rate limiting
  max_executions_per_hour INTEGER,
  max_executions_per_day INTEGER,

  -- Monitoring
  alert_on_errors BOOLEAN NOT NULL DEFAULT true,
  alert_on_low_confidence BOOLEAN NOT NULL DEFAULT true,
  alert_on_high_cost BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, agent_type)
);

-- AI feedback and human review
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES agent_executions(id),

  -- Feedback details
  reviewer_id UUID NOT NULL REFERENCES users(id),
  feedback_type VARCHAR(30) NOT NULL
    CHECK (feedback_type IN ('quality_review', 'error_correction', 'user_satisfaction', 'performance_review')),

  -- Ratings
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  relevance_rating INTEGER CHECK (relevance_rating BETWEEN 1 AND 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),

  -- Comments
  feedback_comments TEXT,
  improvement_suggestions TEXT,

  -- Actions taken
  action_required BOOLEAN NOT NULL DEFAULT false,
  action_taken VARCHAR(100),
  follow_up_needed BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agent_executions_agent_type ON agent_executions(agent_type);
CREATE INDEX idx_agent_executions_executed_at ON agent_executions(executed_at);
CREATE INDEX idx_agent_executions_organization ON agent_executions(organization_id);
CREATE INDEX idx_agent_executions_user ON agent_executions(user_id);
CREATE INDEX idx_agent_executions_cost ON agent_executions(cost);
CREATE INDEX idx_agent_executions_confidence ON agent_executions(confidence);

CREATE INDEX idx_ai_model_metrics_model_date ON ai_model_metrics(model_name, metric_date);
CREATE INDEX idx_ai_model_metrics_cost ON ai_model_metrics(total_cost);

CREATE INDEX idx_agent_performance_summary_agent_date ON agent_performance_summary(agent_type, summary_date);
CREATE INDEX idx_agent_performance_summary_organization ON agent_performance_summary(organization_id);

CREATE INDEX idx_ai_prompt_templates_agent_status ON ai_prompt_templates(agent_type, status);
CREATE INDEX idx_ai_prompt_templates_organization ON ai_prompt_templates(organization_id);

CREATE INDEX idx_ai_agent_configs_organization ON ai_agent_configs(organization_id);
CREATE INDEX idx_ai_agent_configs_enabled ON ai_agent_configs(enabled);

CREATE INDEX idx_ai_feedback_execution ON ai_feedback(execution_id);
CREATE INDEX idx_ai_feedback_reviewer ON ai_feedback(reviewer_id);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at);

-- Row Level Security
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY agent_executions_organization_policy ON agent_executions
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY ai_model_metrics_global_policy ON ai_model_metrics
  FOR SELECT TO authenticated_users
  USING (true); -- Model metrics are global

CREATE POLICY agent_performance_summary_organization_policy ON agent_performance_summary
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY ai_cost_budgets_organization_policy ON ai_cost_budgets
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY ai_prompt_templates_organization_policy ON ai_prompt_templates
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY ai_agent_configs_organization_policy ON ai_agent_configs
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY ai_feedback_organization_policy ON ai_feedback
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM agent_executions ae
    WHERE ae.id = ai_feedback.execution_id
    AND ae.organization_id = current_setting('app.current_organization_id')::UUID
  ));

-- Views for common analytics
CREATE VIEW ai_daily_summary AS
SELECT
  ae.organization_id,
  ae.agent_type,
  DATE(ae.executed_at) as execution_date,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE ae.error_occurred = false) as successful_executions,
  AVG(ae.processing_time) as avg_processing_time,
  SUM(ae.cost) as total_cost,
  AVG(ae.confidence) as avg_confidence,
  COUNT(DISTINCT ae.user_id) as unique_users
FROM agent_executions ae
WHERE ae.executed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ae.organization_id, ae.agent_type, DATE(ae.executed_at);

CREATE VIEW ai_cost_analysis AS
SELECT
  ae.organization_id,
  ae.model_used,
  DATE_TRUNC('month', ae.executed_at) as month,
  COUNT(*) as execution_count,
  SUM(ae.cost) as total_cost,
  AVG(ae.cost) as avg_cost_per_execution,
  SUM(ae.processing_time) as total_processing_time
FROM agent_executions ae
WHERE ae.executed_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY ae.organization_id, ae.model_used, DATE_TRUNC('month', ae.executed_at);

CREATE VIEW agent_efficiency_metrics AS
SELECT
  ae.organization_id,
  ae.agent_type,
  COUNT(*) as total_executions,
  AVG(ae.confidence) as avg_confidence,
  AVG(ae.processing_time) as avg_response_time,
  SUM(ae.cost) / COUNT(*) as cost_per_execution,
  COUNT(*) FILTER (WHERE af.overall_rating >= 4) * 100.0 / COUNT(*) as satisfaction_rate
FROM agent_executions ae
LEFT JOIN ai_feedback af ON ae.id = af.execution_id
WHERE ae.executed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ae.organization_id, ae.agent_type;

-- Functions for cost management
CREATE OR REPLACE FUNCTION update_ai_cost_budget(
  org_id UUID,
  period VARCHAR(20),
  additional_cost DECIMAL(12,6)
)
RETURNS BOOLEAN AS $$
DECLARE
  budget_record RECORD;
  new_spending DECIMAL(12,6);
BEGIN
  -- Get current budget
  SELECT * INTO budget_record
  FROM ai_cost_budgets
  WHERE organization_id = org_id AND budget_period = period;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if budget period needs reset
  IF (period = 'daily' AND budget_record.last_reset_date < CURRENT_DATE) OR
     (period = 'weekly' AND budget_record.last_reset_date < DATE_TRUNC('week', CURRENT_DATE)) OR
     (period = 'monthly' AND budget_record.last_reset_date < DATE_TRUNC('month', CURRENT_DATE)) THEN

    UPDATE ai_cost_budgets
    SET current_spending = additional_cost,
        last_reset_date = CURRENT_DATE
    WHERE id = budget_record.id;

    RETURN true;
  END IF;

  -- Update spending
  new_spending := budget_record.current_spending + additional_cost;

  UPDATE ai_cost_budgets
  SET current_spending = new_spending,
      updated_at = NOW()
  WHERE id = budget_record.id;

  -- Check for budget alerts
  IF new_spending >= (budget_record.budget_amount * budget_record.alert_threshold) THEN
    -- Trigger alert (would integrate with notification system)
    INSERT INTO notifications (
      organization_id,
      notification_type,
      title,
      message,
      priority,
      created_at
    ) VALUES (
      org_id,
      'budget_alert',
      'AI Cost Budget Alert',
      'AI spending has reached ' || ROUND((new_spending / budget_record.budget_amount) * 100, 1) || '% of ' || period || ' budget',
      'high',
      NOW()
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cost budgets on agent execution
CREATE OR REPLACE FUNCTION update_cost_budgets_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily budget
  PERFORM update_ai_cost_budget(NEW.organization_id, 'daily', NEW.cost);

  -- Update monthly budget
  PERFORM update_ai_cost_budget(NEW.organization_id, 'monthly', NEW.cost);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_execution_cost_trigger
  AFTER INSERT ON agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_budgets_trigger();

-- Function to generate agent performance report
CREATE OR REPLACE FUNCTION generate_agent_performance_report(
  org_id UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  agent_type VARCHAR(50),
  total_executions BIGINT,
  success_rate DECIMAL(4,3),
  avg_confidence DECIMAL(4,3),
  avg_response_time DECIMAL(8,2),
  total_cost DECIMAL(12,6),
  cost_per_execution DECIMAL(10,6),
  user_satisfaction DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.agent_type,
    COUNT(*)::BIGINT as total_executions,
    (COUNT(*) FILTER (WHERE ae.error_occurred = false))::DECIMAL / COUNT(*) as success_rate,
    AVG(ae.confidence) as avg_confidence,
    AVG(ae.processing_time) as avg_response_time,
    SUM(ae.cost) as total_cost,
    AVG(ae.cost) as cost_per_execution,
    AVG(af.overall_rating) as user_satisfaction
  FROM agent_executions ae
  LEFT JOIN ai_feedback af ON ae.id = af.execution_id
  WHERE ae.organization_id = org_id
    AND DATE(ae.executed_at) BETWEEN start_date AND end_date
  GROUP BY ae.agent_type
  ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON agent_executions TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON ai_model_metrics TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON agent_performance_summary TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_cost_budgets TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_prompt_templates TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_agent_configs TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_feedback TO authenticated_users;

GRANT SELECT ON ai_daily_summary TO authenticated_users;
GRANT SELECT ON ai_cost_analysis TO authenticated_users;
GRANT SELECT ON agent_efficiency_metrics TO authenticated_users;