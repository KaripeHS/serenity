-- ============================================================
-- Migration 060: HR Enhancements
-- Serenity Care Partners
--
-- Adds offer letter tracking and onboarding checklists to
-- complete Phase 2 HR & Recruiting module
-- ============================================================

-- Offer letters tracking
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  applicant_id UUID NOT NULL REFERENCES applicants(id),
  job_requisition_id UUID REFERENCES job_requisitions(id),

  -- Offer details
  position_title VARCHAR(200) NOT NULL,
  department VARCHAR(100),
  employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temp')),

  -- Compensation
  salary_type VARCHAR(20) NOT NULL CHECK (salary_type IN ('hourly', 'salary', 'per_visit')),
  pay_rate DECIMAL(10,2) NOT NULL,
  pay_frequency VARCHAR(20) DEFAULT 'biweekly' CHECK (pay_frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly')),

  -- Bonus structure (for caregivers)
  includes_bonus_program BOOLEAN DEFAULT TRUE,
  bonus_details JSONB, -- {ninetyDay: 150, showUp: 100, hours: true, loyalty: true}

  -- Benefits
  benefits_tier VARCHAR(20), -- 'basic', 'standard', 'premium'
  pto_days INTEGER DEFAULT 0,
  sick_days INTEGER DEFAULT 0,
  benefits_start_date DATE,
  benefits_details JSONB,

  -- Schedule
  expected_hours_per_week INTEGER,
  schedule_type VARCHAR(20), -- 'fixed', 'flexible', 'rotating'
  schedule_notes TEXT,

  -- Dates
  proposed_start_date DATE NOT NULL,
  response_deadline DATE,

  -- Conditions
  contingencies TEXT[], -- ['background_check', 'drug_screen', 'reference_check', 'credential_verification']
  special_conditions TEXT,

  -- Document
  offer_letter_content TEXT, -- Generated letter content
  offer_letter_file_url TEXT,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_approval',
    'approved',
    'sent',
    'viewed',
    'accepted',
    'declined',
    'expired',
    'rescinded'
  )),

  -- Approval workflow
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  -- Response tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  decline_reason TEXT,
  counter_offer_requested BOOLEAN DEFAULT FALSE,
  counter_offer_notes TEXT,

  -- Final acceptance
  accepted_at TIMESTAMPTZ,
  signed_offer_file_url TEXT,
  actual_start_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_letters_org ON offer_letters(organization_id);
CREATE INDEX idx_offer_letters_applicant ON offer_letters(applicant_id);
CREATE INDEX idx_offer_letters_status ON offer_letters(status);
CREATE INDEX idx_offer_letters_start_date ON offer_letters(proposed_start_date);

-- Onboarding checklist templates
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  template_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Applies to
  position_types TEXT[], -- ['caregiver', 'nurse', 'admin', 'supervisor']
  employment_types TEXT[], -- ['full_time', 'part_time', 'contract']

  -- Template items
  items JSONB NOT NULL, -- Array of {order, category, task, description, required, daysToComplete, assignedRole}

  -- Timing
  default_duration_days INTEGER DEFAULT 30,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(organization_id, template_name)
);

-- Onboarding instances for each new hire
CREATE TABLE IF NOT EXISTS onboarding_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Who is being onboarded
  employee_id UUID REFERENCES users(id),
  caregiver_id UUID REFERENCES caregivers(id),
  applicant_id UUID REFERENCES applicants(id), -- Before they become employee

  -- Template used
  template_id UUID REFERENCES onboarding_templates(id),

  -- New hire info
  new_hire_name VARCHAR(200) NOT NULL,
  position_title VARCHAR(200) NOT NULL,
  department VARCHAR(100),

  -- Dates
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,

  -- Assigned mentor/buddy
  mentor_id UUID REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),
  hr_contact_id UUID REFERENCES users(id),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled'
  )),

  -- Progress
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_items > 0 THEN (completed_items::DECIMAL / total_items) * 100 ELSE 0 END
  ) STORED,

  -- Milestones
  first_day_completed BOOLEAN DEFAULT FALSE,
  first_week_completed BOOLEAN DEFAULT FALSE,
  training_completed BOOLEAN DEFAULT FALSE,
  paperwork_completed BOOLEAN DEFAULT FALSE,

  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Ensure one type of person
  CONSTRAINT onboarding_subject CHECK (
    (employee_id IS NOT NULL)::INT +
    (caregiver_id IS NOT NULL)::INT +
    (applicant_id IS NOT NULL)::INT = 1
  )
);

CREATE INDEX idx_onboarding_instances_org ON onboarding_instances(organization_id);
CREATE INDEX idx_onboarding_instances_employee ON onboarding_instances(employee_id);
CREATE INDEX idx_onboarding_instances_caregiver ON onboarding_instances(caregiver_id);
CREATE INDEX idx_onboarding_instances_status ON onboarding_instances(status);
CREATE INDEX idx_onboarding_instances_start ON onboarding_instances(start_date);

-- Individual onboarding checklist items
CREATE TABLE IF NOT EXISTS onboarding_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id UUID NOT NULL REFERENCES onboarding_instances(id) ON DELETE CASCADE,

  -- Item details
  item_order INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'paperwork',
    'compliance',
    'training',
    'equipment',
    'access',
    'orientation',
    'introductions',
    'first_assignment'
  )),
  task_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Requirements
  is_required BOOLEAN DEFAULT TRUE,
  due_date DATE,
  depends_on UUID REFERENCES onboarding_items(id), -- Previous item that must complete first

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_role VARCHAR(50), -- 'new_hire', 'hr', 'supervisor', 'it', 'mentor'

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'skipped',
    'blocked'
  )),

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,

  -- If document upload required
  requires_document BOOLEAN DEFAULT FALSE,
  document_url TEXT,
  document_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_items_instance ON onboarding_items(onboarding_instance_id);
CREATE INDEX idx_onboarding_items_assigned ON onboarding_items(assigned_to);
CREATE INDEX idx_onboarding_items_status ON onboarding_items(status);
CREATE INDEX idx_onboarding_items_due ON onboarding_items(due_date);

-- Seed default onboarding template for caregivers
INSERT INTO onboarding_templates (
  organization_id,
  template_name,
  description,
  position_types,
  employment_types,
  items,
  default_duration_days,
  created_by
) SELECT
  o.id,
  'Caregiver Onboarding Checklist',
  'Standard onboarding checklist for new caregivers in compliance with Ohio regulations',
  ARRAY['caregiver', 'hha'],
  ARRAY['full_time', 'part_time'],
  '[
    {"order": 1, "category": "paperwork", "task": "Complete W-4 and I-9 forms", "description": "Federal tax and employment eligibility forms", "required": true, "daysToComplete": 1, "assignedRole": "new_hire"},
    {"order": 2, "category": "paperwork", "task": "Sign employee handbook acknowledgment", "description": "Review and sign company policies", "required": true, "daysToComplete": 1, "assignedRole": "new_hire"},
    {"order": 3, "category": "paperwork", "task": "Complete direct deposit enrollment", "description": "Setup payroll direct deposit", "required": false, "daysToComplete": 3, "assignedRole": "new_hire"},
    {"order": 4, "category": "paperwork", "task": "Sign HIPAA acknowledgment", "description": "Privacy and confidentiality agreement", "required": true, "daysToComplete": 1, "assignedRole": "new_hire"},
    {"order": 5, "category": "compliance", "task": "Submit BCI/FBI background check", "description": "Ohio Bureau of Criminal Investigation and FBI fingerprints", "required": true, "daysToComplete": 7, "assignedRole": "hr"},
    {"order": 6, "category": "compliance", "task": "Complete OIG/SAM exclusion check", "description": "Federal exclusion list verification", "required": true, "daysToComplete": 3, "assignedRole": "hr"},
    {"order": 7, "category": "compliance", "task": "Verify credentials and certifications", "description": "STNA/HHA certification verification", "required": true, "daysToComplete": 3, "assignedRole": "hr"},
    {"order": 8, "category": "compliance", "task": "Drug screening", "description": "Pre-employment drug test", "required": true, "daysToComplete": 3, "assignedRole": "hr"},
    {"order": 9, "category": "training", "task": "Complete CPR/First Aid certification", "description": "American Heart Association or equivalent", "required": true, "daysToComplete": 14, "assignedRole": "new_hire"},
    {"order": 10, "category": "training", "task": "Complete HIPAA training", "description": "Privacy and security awareness", "required": true, "daysToComplete": 7, "assignedRole": "new_hire"},
    {"order": 11, "category": "training", "task": "Complete EVV training", "description": "Electronic Visit Verification system training", "required": true, "daysToComplete": 7, "assignedRole": "new_hire"},
    {"order": 12, "category": "training", "task": "Complete abuse/neglect recognition training", "description": "Ohio-required training on recognizing and reporting", "required": true, "daysToComplete": 7, "assignedRole": "new_hire"},
    {"order": 13, "category": "training", "task": "Complete infection control training", "description": "Standard precautions and PPE use", "required": true, "daysToComplete": 7, "assignedRole": "new_hire"},
    {"order": 14, "category": "equipment", "task": "Setup mobile app", "description": "Install and configure Serenity mobile app", "required": true, "daysToComplete": 1, "assignedRole": "new_hire"},
    {"order": 15, "category": "equipment", "task": "Provide PPE kit", "description": "Gloves, masks, gowns for client visits", "required": true, "daysToComplete": 1, "assignedRole": "supervisor"},
    {"order": 16, "category": "orientation", "task": "Review company mission and values", "description": "Introduction to Serenity culture", "required": true, "daysToComplete": 3, "assignedRole": "supervisor"},
    {"order": 17, "category": "orientation", "task": "Review scheduling policies", "description": "How to view schedule, request time off, swap shifts", "required": true, "daysToComplete": 3, "assignedRole": "supervisor"},
    {"order": 18, "category": "orientation", "task": "Review bonus program", "description": "90-day, Show Up, Hours, and Loyalty bonuses", "required": true, "daysToComplete": 3, "assignedRole": "supervisor"},
    {"order": 19, "category": "introductions", "task": "Meet supervisor", "description": "Introduction to direct supervisor", "required": true, "daysToComplete": 3, "assignedRole": "supervisor"},
    {"order": 20, "category": "introductions", "task": "Meet scheduling team", "description": "Introduction to dispatch/scheduling", "required": true, "daysToComplete": 7, "assignedRole": "supervisor"},
    {"order": 21, "category": "first_assignment", "task": "Shadow experienced caregiver", "description": "Observe a visit with a mentor", "required": true, "daysToComplete": 14, "assignedRole": "supervisor"},
    {"order": 22, "category": "first_assignment", "task": "Complete first supervised visit", "description": "First client visit with supervisor observation", "required": true, "daysToComplete": 14, "assignedRole": "supervisor"},
    {"order": 23, "category": "first_assignment", "task": "Complete 30-day check-in", "description": "First month performance review", "required": true, "daysToComplete": 30, "assignedRole": "supervisor"}
  ]'::jsonb,
  30,
  (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1)
FROM organizations o
WHERE name ILIKE '%serenity%'
LIMIT 1
ON CONFLICT (organization_id, template_name) DO NOTHING;

-- View: Onboarding progress dashboard
CREATE OR REPLACE VIEW onboarding_dashboard AS
SELECT
  oi.id,
  oi.organization_id,
  oi.new_hire_name,
  oi.position_title,
  oi.start_date,
  oi.target_completion_date,
  oi.status,
  oi.total_items,
  oi.completed_items,
  oi.completion_percentage,
  oi.first_day_completed,
  oi.first_week_completed,
  oi.training_completed,
  oi.paperwork_completed,
  u_mentor.first_name || ' ' || u_mentor.last_name AS mentor_name,
  u_super.first_name || ' ' || u_super.last_name AS supervisor_name,
  CASE
    WHEN oi.status = 'completed' THEN 'complete'
    WHEN oi.target_completion_date < CURRENT_DATE AND oi.status != 'completed' THEN 'overdue'
    WHEN oi.target_completion_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'ending_soon'
    WHEN oi.status = 'not_started' THEN 'not_started'
    ELSE 'on_track'
  END AS health_status,
  (
    SELECT COUNT(*) FROM onboarding_items item
    WHERE item.onboarding_instance_id = oi.id
      AND item.is_required = TRUE
      AND item.status NOT IN ('completed', 'skipped')
      AND item.due_date < CURRENT_DATE
  ) AS overdue_items
FROM onboarding_instances oi
LEFT JOIN users u_mentor ON u_mentor.id = oi.mentor_id
LEFT JOIN users u_super ON u_super.id = oi.supervisor_id;

-- View: Offer letter pipeline
CREATE OR REPLACE VIEW offer_letter_pipeline AS
SELECT
  ol.id,
  ol.organization_id,
  a.first_name || ' ' || a.last_name AS applicant_name,
  a.email AS applicant_email,
  ol.position_title,
  ol.pay_rate,
  ol.salary_type,
  ol.proposed_start_date,
  ol.response_deadline,
  ol.status,
  ol.sent_at,
  ol.viewed_at,
  ol.responded_at,
  CASE
    WHEN ol.status = 'accepted' THEN 'accepted'
    WHEN ol.status = 'declined' THEN 'declined'
    WHEN ol.status = 'expired' OR (ol.response_deadline < CURRENT_DATE AND ol.status IN ('sent', 'viewed')) THEN 'expired'
    WHEN ol.status = 'sent' AND ol.viewed_at IS NULL THEN 'awaiting_view'
    WHEN ol.status = 'viewed' THEN 'awaiting_response'
    WHEN ol.status IN ('draft', 'pending_approval') THEN 'in_preparation'
    ELSE ol.status
  END AS pipeline_status,
  u_created.first_name || ' ' || u_created.last_name AS created_by_name,
  u_approved.first_name || ' ' || u_approved.last_name AS approved_by_name
FROM offer_letters ol
JOIN applicants a ON a.id = ol.applicant_id
LEFT JOIN users u_created ON u_created.id = ol.created_by
LEFT JOIN users u_approved ON u_approved.id = ol.approved_by;

-- Function to create onboarding from template
CREATE OR REPLACE FUNCTION create_onboarding_from_template(
  p_organization_id UUID,
  p_template_id UUID,
  p_employee_id UUID DEFAULT NULL,
  p_caregiver_id UUID DEFAULT NULL,
  p_applicant_id UUID DEFAULT NULL,
  p_new_hire_name VARCHAR DEFAULT NULL,
  p_position_title VARCHAR DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_mentor_id UUID DEFAULT NULL,
  p_supervisor_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_template_record RECORD;
  v_onboarding_id UUID;
  v_item JSONB;
  v_item_order INTEGER;
  v_hire_name VARCHAR(200);
  v_position VARCHAR(200);
BEGIN
  -- Get template
  SELECT * INTO v_template_record
  FROM onboarding_templates
  WHERE id = p_template_id AND organization_id = p_organization_id;

  IF v_template_record IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Determine name and position
  IF p_new_hire_name IS NOT NULL THEN
    v_hire_name := p_new_hire_name;
  ELSIF p_employee_id IS NOT NULL THEN
    SELECT first_name || ' ' || last_name INTO v_hire_name FROM users WHERE id = p_employee_id;
  ELSIF p_caregiver_id IS NOT NULL THEN
    SELECT first_name || ' ' || last_name INTO v_hire_name FROM caregivers WHERE id = p_caregiver_id;
  ELSIF p_applicant_id IS NOT NULL THEN
    SELECT first_name || ' ' || last_name INTO v_hire_name FROM applicants WHERE id = p_applicant_id;
  END IF;

  v_position := COALESCE(p_position_title, 'Caregiver');

  -- Create onboarding instance
  INSERT INTO onboarding_instances (
    organization_id,
    employee_id,
    caregiver_id,
    applicant_id,
    template_id,
    new_hire_name,
    position_title,
    start_date,
    target_completion_date,
    mentor_id,
    supervisor_id,
    status,
    total_items,
    created_by
  ) VALUES (
    p_organization_id,
    p_employee_id,
    p_caregiver_id,
    p_applicant_id,
    p_template_id,
    v_hire_name,
    v_position,
    p_start_date,
    p_start_date + (v_template_record.default_duration_days || ' days')::INTERVAL,
    p_mentor_id,
    p_supervisor_id,
    'not_started',
    jsonb_array_length(v_template_record.items),
    p_created_by
  ) RETURNING id INTO v_onboarding_id;

  -- Create checklist items from template
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_template_record.items)
  LOOP
    INSERT INTO onboarding_items (
      onboarding_instance_id,
      item_order,
      category,
      task_name,
      description,
      is_required,
      due_date,
      assigned_role,
      status
    ) VALUES (
      v_onboarding_id,
      (v_item->>'order')::INTEGER,
      (v_item->>'category')::VARCHAR,
      v_item->>'task',
      v_item->>'description',
      COALESCE((v_item->>'required')::BOOLEAN, TRUE),
      p_start_date + ((v_item->>'daysToComplete')::INTEGER || ' days')::INTERVAL,
      v_item->>'assignedRole',
      'pending'
    );
  END LOOP;

  RETURN v_onboarding_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE onboarding_instances
  SET
    completed_items = (
      SELECT COUNT(*) FROM onboarding_items
      WHERE onboarding_instance_id = NEW.onboarding_instance_id
        AND status = 'completed'
    ),
    paperwork_completed = (
      SELECT COUNT(*) = 0 FROM onboarding_items
      WHERE onboarding_instance_id = NEW.onboarding_instance_id
        AND category = 'paperwork'
        AND is_required = TRUE
        AND status != 'completed'
    ),
    training_completed = (
      SELECT COUNT(*) = 0 FROM onboarding_items
      WHERE onboarding_instance_id = NEW.onboarding_instance_id
        AND category = 'training'
        AND is_required = TRUE
        AND status != 'completed'
    ),
    status = CASE
      WHEN (
        SELECT COUNT(*) = 0 FROM onboarding_items
        WHERE onboarding_instance_id = NEW.onboarding_instance_id
          AND is_required = TRUE
          AND status NOT IN ('completed', 'skipped')
      ) THEN 'completed'
      WHEN EXISTS (
        SELECT 1 FROM onboarding_items
        WHERE onboarding_instance_id = NEW.onboarding_instance_id
          AND status IN ('in_progress', 'completed')
      ) THEN 'in_progress'
      ELSE 'not_started'
    END,
    updated_at = NOW()
  WHERE id = NEW.onboarding_instance_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress
  AFTER INSERT OR UPDATE ON onboarding_items
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress();

-- RLS Policies
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view offer letters for their org" ON offer_letters
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "HR can manage offer letters" ON offer_letters
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view onboarding templates for their org" ON onboarding_templates
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "HR can manage onboarding templates" ON onboarding_templates
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view onboarding instances for their org" ON onboarding_instances
  FOR SELECT USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "HR can manage onboarding instances" ON onboarding_instances
  FOR ALL USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

CREATE POLICY "Users can view onboarding items for their org" ON onboarding_items
  FOR SELECT USING (
    onboarding_instance_id IN (
      SELECT id FROM onboarding_instances
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

CREATE POLICY "HR can manage onboarding items" ON onboarding_items
  FOR ALL USING (
    onboarding_instance_id IN (
      SELECT id FROM onboarding_instances
      WHERE organization_id = current_setting('app.current_organization_id', true)::UUID
    )
  );

-- Comments
COMMENT ON TABLE offer_letters IS 'Tracks offer letters sent to applicants with compensation details';
COMMENT ON TABLE onboarding_templates IS 'Reusable onboarding checklist templates by position type';
COMMENT ON TABLE onboarding_instances IS 'Active onboarding processes for new hires';
COMMENT ON TABLE onboarding_items IS 'Individual checklist items for each onboarding instance';
COMMENT ON FUNCTION create_onboarding_from_template IS 'Creates a new onboarding instance with items from a template';
