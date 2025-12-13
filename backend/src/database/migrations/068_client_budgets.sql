-- ============================================================
-- Migration 068: Client Budget & Funds Management
-- Serenity Care Partners
--
-- Best-in-Class Feature: Families track client plan spending,
-- forecast funds, and receive low-balance alerts
-- ============================================================

-- Client budget definitions (from authorizations or private pay)
CREATE TABLE IF NOT EXISTS client_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Budget source
  budget_type VARCHAR(30) NOT NULL CHECK (budget_type IN (
    'authorization',   -- Linked to payer authorization
    'private_pay',     -- Self-pay budget
    'grant',           -- Grant-funded
    'family_fund',     -- Family-managed fund
    'other'
  )),
  authorization_id UUID REFERENCES authorizations(id),

  -- Budget period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,

  -- Amounts
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Service restrictions (if applicable)
  service_types TEXT[], -- Allowed service types
  service_codes TEXT[], -- Allowed billing codes

  -- Alerts
  low_balance_threshold DECIMAL(5, 2) DEFAULT 20.00, -- Alert when % remaining
  critical_threshold DECIMAL(5, 2) DEFAULT 10.00,    -- Critical alert

  -- Calculated fields (updated by trigger)
  amount_used DECIMAL(12, 2) DEFAULT 0,
  amount_remaining DECIMAL(12, 2),
  percent_used DECIMAL(5, 2) DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active',
    'exhausted',
    'expired',
    'suspended'
  )),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_budgets_org ON client_budgets(organization_id);
CREATE INDEX idx_client_budgets_client ON client_budgets(client_id);
CREATE INDEX idx_client_budgets_status ON client_budgets(status);
CREATE INDEX idx_client_budgets_current ON client_budgets(is_current) WHERE is_current = TRUE;

-- Budget transactions (spending and adjustments)
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES client_budgets(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
    'charge',      -- Service rendered (debit)
    'reversal',    -- Reversed charge (credit)
    'adjustment',  -- Manual adjustment
    'deposit',     -- Additional funds added
    'transfer_in', -- Transfer from another budget
    'transfer_out' -- Transfer to another budget
  )),

  -- Amount (positive for debits, negative for credits)
  amount DECIMAL(10, 2) NOT NULL,
  running_balance DECIMAL(12, 2),

  -- Related records
  visit_id UUID REFERENCES visits(id),
  claim_id UUID,
  service_date DATE,
  service_type VARCHAR(50),
  service_code VARCHAR(20),

  -- Provider info
  caregiver_id UUID REFERENCES caregivers(id),
  caregiver_name VARCHAR(200),

  -- Description
  description TEXT,

  -- Recorded by
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_transactions_budget ON budget_transactions(budget_id);
CREATE INDEX idx_budget_transactions_date ON budget_transactions(service_date);
CREATE INDEX idx_budget_transactions_visit ON budget_transactions(visit_id);

-- Budget alerts sent to family/client
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES client_budgets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Alert type
  alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
    'low_balance',       -- Below threshold
    'critical_balance',  -- Below critical threshold
    'exhausted',         -- Budget fully used
    'expiring_soon',     -- Period ending soon
    'weekly_summary',    -- Weekly spending summary
    'monthly_summary'    -- Monthly summary
  )),

  -- Threshold that triggered alert
  threshold_value DECIMAL(5, 2),
  current_value DECIMAL(5, 2),

  -- Notification
  notification_method VARCHAR(20), -- 'email', 'sms', 'push', 'portal'
  recipient_type VARCHAR(20),      -- 'family', 'client', 'coordinator'
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),

  -- Status
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),

  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_client ON budget_alerts(client_id);
CREATE INDEX idx_budget_alerts_type ON budget_alerts(alert_type);

-- Budget spending forecasts
CREATE TABLE IF NOT EXISTS budget_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES client_budgets(id) ON DELETE CASCADE,

  -- Forecast date
  forecast_date DATE DEFAULT CURRENT_DATE,

  -- Current status
  days_remaining INTEGER,
  amount_remaining DECIMAL(12, 2),
  daily_average_spend DECIMAL(10, 2),

  -- Projections
  projected_exhaustion_date DATE,
  projected_end_balance DECIMAL(12, 2),
  projected_overspend DECIMAL(10, 2),

  -- Recommendations
  recommended_daily_limit DECIMAL(10, 2),
  risk_level VARCHAR(20) CHECK (risk_level IN (
    'on_track',
    'at_risk',
    'critical',
    'exhausted'
  )),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_forecasts_budget ON budget_forecasts(budget_id);
CREATE INDEX idx_budget_forecasts_date ON budget_forecasts(forecast_date);

-- Family portal budget preferences
CREATE TABLE IF NOT EXISTS family_budget_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Alert preferences
  receive_low_balance_alerts BOOLEAN DEFAULT TRUE,
  receive_weekly_summary BOOLEAN DEFAULT TRUE,
  receive_monthly_summary BOOLEAN DEFAULT TRUE,
  alert_threshold_override DECIMAL(5, 2), -- Custom threshold

  -- Notification methods
  preferred_notification_methods TEXT[] DEFAULT ARRAY['email', 'portal'],

  -- Spending approval (if family manages spending)
  can_approve_spending BOOLEAN DEFAULT FALSE,
  daily_spending_limit DECIMAL(10, 2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(family_member_id, client_id)
);

CREATE INDEX idx_family_budget_prefs_family ON family_budget_preferences(family_member_id);
CREATE INDEX idx_family_budget_prefs_client ON family_budget_preferences(client_id);

-- View: Client budget overview
CREATE OR REPLACE VIEW client_budget_overview AS
SELECT
  cb.id AS budget_id,
  cb.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  cb.budget_type,
  cb.period_start,
  cb.period_end,
  cb.total_amount,
  cb.amount_used,
  cb.amount_remaining,
  cb.percent_used,
  cb.status,
  cb.low_balance_threshold,
  cb.critical_threshold,
  CASE
    WHEN cb.percent_used >= 100 THEN 'exhausted'
    WHEN cb.percent_used >= (100 - cb.critical_threshold) THEN 'critical'
    WHEN cb.percent_used >= (100 - cb.low_balance_threshold) THEN 'low'
    ELSE 'healthy'
  END AS health_status,
  (cb.period_end - CURRENT_DATE) AS days_remaining,
  a.payer_name,
  a.authorization_number
FROM client_budgets cb
JOIN clients c ON c.id = cb.client_id
LEFT JOIN authorizations a ON a.id = cb.authorization_id
WHERE cb.is_current = TRUE;

-- View: Recent budget transactions for family portal
CREATE OR REPLACE VIEW family_budget_transactions AS
SELECT
  bt.id,
  bt.budget_id,
  cb.client_id,
  bt.transaction_type,
  bt.amount,
  bt.running_balance,
  bt.service_date,
  bt.service_type,
  bt.caregiver_name,
  bt.description,
  bt.recorded_at
FROM budget_transactions bt
JOIN client_budgets cb ON cb.id = bt.budget_id
WHERE cb.is_current = TRUE
ORDER BY bt.recorded_at DESC;

-- View: Budget dashboard for organization
CREATE OR REPLACE VIEW budget_dashboard AS
SELECT
  organization_id,
  COUNT(*) AS total_active_budgets,
  COUNT(*) FILTER (WHERE status = 'active' AND percent_used < (100 - low_balance_threshold)) AS healthy_budgets,
  COUNT(*) FILTER (WHERE status = 'active' AND percent_used >= (100 - low_balance_threshold) AND percent_used < (100 - critical_threshold)) AS low_balance_budgets,
  COUNT(*) FILTER (WHERE status = 'active' AND percent_used >= (100 - critical_threshold)) AS critical_budgets,
  COUNT(*) FILTER (WHERE status = 'exhausted') AS exhausted_budgets,
  SUM(total_amount) AS total_budget_amount,
  SUM(amount_used) AS total_used,
  SUM(amount_remaining) AS total_remaining,
  AVG(percent_used) AS avg_utilization
FROM client_budgets
WHERE is_current = TRUE
GROUP BY organization_id;

-- Function: Record budget transaction from visit
CREATE OR REPLACE FUNCTION record_budget_transaction_from_visit()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_id UUID;
  v_amount DECIMAL(10, 2);
  v_running_balance DECIMAL(12, 2);
  v_caregiver_name VARCHAR(200);
BEGIN
  -- Only process completed visits with billing
  IF NEW.status != 'completed' OR NEW.total_amount IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the active budget for this client
  SELECT id INTO v_budget_id
  FROM client_budgets
  WHERE client_id = NEW.client_id
    AND is_current = TRUE
    AND status = 'active'
    AND NEW.visit_date BETWEEN period_start AND period_end
  LIMIT 1;

  IF v_budget_id IS NULL THEN
    RETURN NEW; -- No budget to track
  END IF;

  v_amount := NEW.total_amount;

  -- Get caregiver name
  SELECT first_name || ' ' || last_name INTO v_caregiver_name
  FROM caregivers WHERE id = NEW.caregiver_id;

  -- Calculate running balance
  SELECT amount_remaining - v_amount INTO v_running_balance
  FROM client_budgets WHERE id = v_budget_id;

  -- Insert transaction
  INSERT INTO budget_transactions (
    budget_id, transaction_type, amount, running_balance,
    visit_id, service_date, service_type, service_code,
    caregiver_id, caregiver_name, description
  ) VALUES (
    v_budget_id, 'charge', v_amount, v_running_balance,
    NEW.id, NEW.visit_date, NEW.service_type, NEW.service_code,
    NEW.caregiver_id, v_caregiver_name,
    'Visit completed on ' || NEW.visit_date
  );

  -- Update budget totals
  UPDATE client_budgets
  SET amount_used = amount_used + v_amount,
      amount_remaining = total_amount - amount_used - v_amount,
      percent_used = ((amount_used + v_amount) / total_amount * 100),
      status = CASE
        WHEN total_amount - amount_used - v_amount <= 0 THEN 'exhausted'
        ELSE status
      END,
      updated_at = NOW()
  WHERE id = v_budget_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for visit completion
CREATE TRIGGER trigger_record_budget_transaction
  AFTER UPDATE ON visits
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION record_budget_transaction_from_visit();

-- Function: Check budget alerts
CREATE OR REPLACE FUNCTION check_budget_alerts(p_budget_id UUID)
RETURNS VOID AS $$
DECLARE
  v_budget client_budgets%ROWTYPE;
  v_alert_type VARCHAR(30);
  v_existing_alert UUID;
BEGIN
  SELECT * INTO v_budget FROM client_budgets WHERE id = p_budget_id;

  -- Determine alert type based on thresholds
  IF v_budget.percent_used >= 100 THEN
    v_alert_type := 'exhausted';
  ELSIF v_budget.percent_used >= (100 - v_budget.critical_threshold) THEN
    v_alert_type := 'critical_balance';
  ELSIF v_budget.percent_used >= (100 - v_budget.low_balance_threshold) THEN
    v_alert_type := 'low_balance';
  ELSE
    RETURN; -- No alert needed
  END IF;

  -- Check if alert already sent today
  SELECT id INTO v_existing_alert
  FROM budget_alerts
  WHERE budget_id = p_budget_id
    AND alert_type = v_alert_type
    AND DATE(created_at) = CURRENT_DATE;

  IF v_existing_alert IS NOT NULL THEN
    RETURN; -- Already alerted
  END IF;

  -- Create alert
  INSERT INTO budget_alerts (
    budget_id, client_id, alert_type,
    threshold_value, current_value, message
  ) VALUES (
    p_budget_id, v_budget.client_id, v_alert_type,
    CASE
      WHEN v_alert_type = 'low_balance' THEN v_budget.low_balance_threshold
      WHEN v_alert_type = 'critical_balance' THEN v_budget.critical_threshold
      ELSE 0
    END,
    v_budget.percent_used,
    CASE
      WHEN v_alert_type = 'exhausted' THEN 'Budget has been fully utilized'
      WHEN v_alert_type = 'critical_balance' THEN 'Budget is critically low (' || ROUND(100 - v_budget.percent_used) || '% remaining)'
      ELSE 'Budget is running low (' || ROUND(100 - v_budget.percent_used) || '% remaining)'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Generate budget forecast
CREATE OR REPLACE FUNCTION generate_budget_forecast(p_budget_id UUID)
RETURNS UUID AS $$
DECLARE
  v_budget client_budgets%ROWTYPE;
  v_forecast_id UUID;
  v_days_elapsed INTEGER;
  v_days_remaining INTEGER;
  v_daily_avg DECIMAL(10, 2);
  v_projected_end DECIMAL(12, 2);
  v_exhaustion_date DATE;
  v_risk_level VARCHAR(20);
BEGIN
  SELECT * INTO v_budget FROM client_budgets WHERE id = p_budget_id;

  v_days_elapsed := CURRENT_DATE - v_budget.period_start;
  v_days_remaining := v_budget.period_end - CURRENT_DATE;

  -- Calculate daily average spend
  IF v_days_elapsed > 0 THEN
    v_daily_avg := v_budget.amount_used / v_days_elapsed;
  ELSE
    v_daily_avg := 0;
  END IF;

  -- Project end balance
  v_projected_end := v_budget.amount_remaining - (v_daily_avg * v_days_remaining);

  -- Calculate exhaustion date
  IF v_daily_avg > 0 THEN
    v_exhaustion_date := CURRENT_DATE + (v_budget.amount_remaining / v_daily_avg)::INTEGER;
  END IF;

  -- Determine risk level
  IF v_budget.amount_remaining <= 0 THEN
    v_risk_level := 'exhausted';
  ELSIF v_exhaustion_date IS NOT NULL AND v_exhaustion_date < v_budget.period_end THEN
    IF v_exhaustion_date <= CURRENT_DATE + 7 THEN
      v_risk_level := 'critical';
    ELSE
      v_risk_level := 'at_risk';
    END IF;
  ELSE
    v_risk_level := 'on_track';
  END IF;

  -- Insert forecast
  INSERT INTO budget_forecasts (
    budget_id, days_remaining, amount_remaining,
    daily_average_spend, projected_exhaustion_date,
    projected_end_balance, projected_overspend,
    recommended_daily_limit, risk_level
  ) VALUES (
    p_budget_id, v_days_remaining, v_budget.amount_remaining,
    v_daily_avg, v_exhaustion_date,
    v_projected_end, GREATEST(0, -v_projected_end),
    CASE WHEN v_days_remaining > 0 THEN v_budget.amount_remaining / v_days_remaining ELSE 0 END,
    v_risk_level
  )
  RETURNING id INTO v_forecast_id;

  RETURN v_forecast_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE client_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_budget_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets for their org" ON client_budgets
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Admins can manage budgets" ON client_budgets
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view budget transactions" ON budget_transactions
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM client_budgets
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "Family can view their client budgets" ON client_budgets
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM family_members
      WHERE id = current_setting('app.current_family_member_id', true)::UUID
    )
  );

CREATE POLICY "Family can view their budget transactions" ON budget_transactions
  FOR SELECT USING (
    budget_id IN (
      SELECT cb.id FROM client_budgets cb
      JOIN family_members fm ON fm.client_id = cb.client_id
      WHERE fm.id = current_setting('app.current_family_member_id', true)::UUID
    )
  );

-- Comments
COMMENT ON TABLE client_budgets IS 'Client budget definitions for tracking service spending';
COMMENT ON TABLE budget_transactions IS 'Individual transactions against client budgets';
COMMENT ON TABLE budget_alerts IS 'Alerts sent when budgets reach thresholds';
COMMENT ON TABLE budget_forecasts IS 'Budget spending forecasts and projections';
COMMENT ON FUNCTION record_budget_transaction_from_visit IS 'Auto-records budget transactions when visits complete';
COMMENT ON FUNCTION check_budget_alerts IS 'Checks and creates budget alerts based on thresholds';
COMMENT ON FUNCTION generate_budget_forecast IS 'Generates spending forecast for a budget';
