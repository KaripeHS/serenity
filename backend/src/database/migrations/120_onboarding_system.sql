-- ============================================================
-- Migration 120: Onboarding System
-- Serenity Care Partners
--
-- Creates onboarding templates and instances for new hire tracking
-- ============================================================

-- Onboarding checklist templates
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  template_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Applies to
  position_types TEXT[], -- ['caregiver', 'nurse', 'admin', 'supervisor']
  employment_types TEXT[], -- ['full_time', 'part_time', 'contract']

  -- Template items as JSONB array
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timing
  default_duration_days INTEGER DEFAULT 30,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(organization_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_org ON onboarding_templates(organization_id);

-- Onboarding instances for each new hire
CREATE TABLE IF NOT EXISTS onboarding_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Who is being onboarded (one of these should be set)
  employee_id UUID REFERENCES users(id),
  caregiver_id UUID REFERENCES caregivers(id),
  applicant_id UUID REFERENCES applicants(id),

  -- Template used (optional)
  template_id UUID REFERENCES onboarding_templates(id),

  -- New hire info
  new_hire_name VARCHAR(200) NOT NULL,
  position_title VARCHAR(200) NOT NULL,
  department VARCHAR(100),

  -- Dates
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,

  -- Assigned people
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

  -- Progress tracking
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,

  -- Milestones
  first_day_completed BOOLEAN DEFAULT FALSE,
  first_week_completed BOOLEAN DEFAULT FALSE,
  training_completed BOOLEAN DEFAULT FALSE,
  paperwork_completed BOOLEAN DEFAULT FALSE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Ensure only one subject type
  CONSTRAINT onboarding_subject_check CHECK (
    (CASE WHEN employee_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN caregiver_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN applicant_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_onboarding_instances_org ON onboarding_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_status ON onboarding_instances(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_employee ON onboarding_instances(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_caregiver ON onboarding_instances(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_applicant ON onboarding_instances(applicant_id);

-- Individual onboarding checklist items
CREATE TABLE IF NOT EXISTS onboarding_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id UUID NOT NULL REFERENCES onboarding_instances(id) ON DELETE CASCADE,

  -- Item details
  item_order INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL, -- paperwork, compliance, training, equipment, access, orientation, introductions, first_assignment
  task_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Requirements
  is_required BOOLEAN DEFAULT TRUE,
  due_date DATE,
  requires_document BOOLEAN DEFAULT FALSE,

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_role VARCHAR(50), -- new_hire, hr, supervisor, it, mentor

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'skipped',
    'blocked'
  )),

  -- Completion info
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,

  -- Document tracking
  document_url TEXT,
  document_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  -- Dependencies
  depends_on UUID REFERENCES onboarding_items(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_items_instance ON onboarding_items(onboarding_instance_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_items_status ON onboarding_items(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_items_assigned ON onboarding_items(assigned_to);

-- View for onboarding dashboard
CREATE OR REPLACE VIEW onboarding_dashboard AS
SELECT
  oi.id,
  oi.organization_id,
  oi.new_hire_name,
  oi.position_title,
  oi.department,
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
  oi.employee_id,
  oi.caregiver_id,
  oi.applicant_id,
  oi.mentor_id,
  oi.supervisor_id,
  CASE
    WHEN oi.status = 'completed' THEN 'complete'
    WHEN oi.target_completion_date < CURRENT_DATE AND oi.status != 'completed' THEN 'overdue'
    WHEN oi.target_completion_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'ending_soon'
    ELSE 'on_track'
  END AS health_status,
  oi.created_at
FROM onboarding_instances oi;

-- Function to update onboarding progress when items change
CREATE OR REPLACE FUNCTION update_onboarding_progress()
RETURNS TRIGGER AS $$
DECLARE
  instance_id UUID;
  total_count INTEGER;
  completed_count INTEGER;
  pct DECIMAL(5,2);
BEGIN
  -- Get the instance ID
  IF TG_OP = 'DELETE' THEN
    instance_id := OLD.onboarding_instance_id;
  ELSE
    instance_id := NEW.onboarding_instance_id;
  END IF;

  -- Calculate counts
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_count, completed_count
  FROM onboarding_items
  WHERE onboarding_instance_id = instance_id;

  -- Calculate percentage
  IF total_count > 0 THEN
    pct := (completed_count::DECIMAL / total_count) * 100;
  ELSE
    pct := 0;
  END IF;

  -- Update the instance
  UPDATE onboarding_instances
  SET
    total_items = total_count,
    completed_items = completed_count,
    completion_percentage = pct,
    status = CASE
      WHEN pct = 100 THEN 'completed'
      WHEN pct > 0 THEN 'in_progress'
      ELSE status
    END,
    paperwork_completed = (
      SELECT COUNT(*) = COUNT(*) FILTER (WHERE status = 'completed')
      FROM onboarding_items
      WHERE onboarding_instance_id = instance_id AND category = 'paperwork'
    ),
    training_completed = (
      SELECT COUNT(*) = COUNT(*) FILTER (WHERE status = 'completed')
      FROM onboarding_items
      WHERE onboarding_instance_id = instance_id AND category = 'training'
    ),
    updated_at = NOW()
  WHERE id = instance_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for progress updates
DROP TRIGGER IF EXISTS trigger_update_onboarding_progress ON onboarding_items;
CREATE TRIGGER trigger_update_onboarding_progress
  AFTER INSERT OR UPDATE OR DELETE ON onboarding_items
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress();

-- Insert default caregiver onboarding template
INSERT INTO onboarding_templates (
  organization_id,
  template_name,
  description,
  position_types,
  employment_types,
  default_duration_days,
  items
)
SELECT
  id,
  'Caregiver Onboarding Checklist',
  'Standard onboarding checklist for new caregivers including paperwork, compliance, and training requirements',
  ARRAY['caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna'],
  ARRAY['full_time', 'part_time'],
  30,
  '[
    {"order": 1, "category": "paperwork", "task": "Complete W-4 Form", "description": "Federal tax withholding form", "required": true, "assignedRole": "new_hire", "daysToComplete": 1},
    {"order": 2, "category": "paperwork", "task": "Complete I-9 Form", "description": "Employment eligibility verification", "required": true, "assignedRole": "hr", "daysToComplete": 3},
    {"order": 3, "category": "paperwork", "task": "Sign Employee Handbook Acknowledgment", "description": "Confirm receipt and understanding of company policies", "required": true, "assignedRole": "new_hire", "daysToComplete": 1},
    {"order": 4, "category": "paperwork", "task": "Complete Direct Deposit Form", "description": "Set up payroll direct deposit", "required": false, "assignedRole": "new_hire", "daysToComplete": 3},
    {"order": 5, "category": "paperwork", "task": "Sign HIPAA Confidentiality Agreement", "description": "Privacy and confidentiality acknowledgment", "required": true, "assignedRole": "new_hire", "daysToComplete": 1},
    {"order": 6, "category": "compliance", "task": "BCI/FBI Background Check", "description": "Criminal background check clearance", "required": true, "assignedRole": "hr", "daysToComplete": 14},
    {"order": 7, "category": "compliance", "task": "OIG/SAM Exclusion Check", "description": "Federal exclusion list verification", "required": true, "assignedRole": "hr", "daysToComplete": 3},
    {"order": 8, "category": "compliance", "task": "Verify Credentials/Certifications", "description": "Confirm all required certifications are valid", "required": true, "assignedRole": "hr", "daysToComplete": 7},
    {"order": 9, "category": "compliance", "task": "Drug Screening", "description": "Pre-employment drug test", "required": true, "assignedRole": "hr", "daysToComplete": 7},
    {"order": 10, "category": "compliance", "task": "TB Test or Chest X-Ray", "description": "Tuberculosis screening requirement", "required": true, "assignedRole": "hr", "daysToComplete": 14},
    {"order": 11, "category": "training", "task": "Complete CPR/First Aid Training", "description": "Current CPR and First Aid certification", "required": true, "assignedRole": "new_hire", "daysToComplete": 14},
    {"order": 12, "category": "training", "task": "Complete HIPAA Training", "description": "Privacy and security awareness training", "required": true, "assignedRole": "new_hire", "daysToComplete": 7},
    {"order": 13, "category": "training", "task": "Complete EVV Training", "description": "Electronic Visit Verification system training", "required": true, "assignedRole": "supervisor", "daysToComplete": 3},
    {"order": 14, "category": "training", "task": "Abuse/Neglect Recognition Training", "description": "Mandatory reporter training", "required": true, "assignedRole": "new_hire", "daysToComplete": 7},
    {"order": 15, "category": "training", "task": "Infection Control Training", "description": "Proper infection prevention protocols", "required": true, "assignedRole": "new_hire", "daysToComplete": 7},
    {"order": 16, "category": "equipment", "task": "Set Up Mobile App", "description": "Install and configure Serenity mobile app", "required": true, "assignedRole": "supervisor", "daysToComplete": 1},
    {"order": 17, "category": "equipment", "task": "Issue PPE Kit", "description": "Provide personal protective equipment", "required": true, "assignedRole": "supervisor", "daysToComplete": 1},
    {"order": 18, "category": "orientation", "task": "Company Mission & Values Overview", "description": "Introduction to company culture and values", "required": true, "assignedRole": "hr", "daysToComplete": 3},
    {"order": 19, "category": "orientation", "task": "Review Policies & Procedures", "description": "Detailed review of operational procedures", "required": true, "assignedRole": "supervisor", "daysToComplete": 7},
    {"order": 20, "category": "orientation", "task": "Explain Bonus Program", "description": "Overview of caregiver bonus opportunities", "required": false, "assignedRole": "hr", "daysToComplete": 7},
    {"order": 21, "category": "introductions", "task": "Meet Scheduling Team", "description": "Introduction to scheduling coordinators", "required": true, "assignedRole": "supervisor", "daysToComplete": 7},
    {"order": 22, "category": "first_assignment", "task": "Shadow Experienced Caregiver", "description": "Observation shift with mentor", "required": true, "assignedRole": "mentor", "daysToComplete": 14},
    {"order": 23, "category": "first_assignment", "task": "Complete First Supervised Visit", "description": "First client visit with supervisor observation", "required": true, "assignedRole": "supervisor", "daysToComplete": 21},
    {"order": 24, "category": "first_assignment", "task": "30-Day Check-In Meeting", "description": "Performance review and feedback session", "required": true, "assignedRole": "supervisor", "daysToComplete": 30}
  ]'::jsonb
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM onboarding_templates
  WHERE template_name = 'Caregiver Onboarding Checklist'
  AND organization_id = organizations.id
)
LIMIT 1;
